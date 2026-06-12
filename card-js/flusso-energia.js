/* frarik-version: 1.0 */
/*
 * flusso-energia.js — Card "Flusso Energia" per Frarik Dashboard
 * Flusso energetico fluido (animazioni SVG continue) con sparkline per sensore.
 * Impostazioni: ✏️ → ⚙️ → popup con selettori sensore + anteprima live.
 */
(function () {
  'use strict';

  /* ── Helpers base ── */
  function H() {
    try { if (typeof window.frarikHass === 'function') { var h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {}
    return null;
  }
  function eh(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function keyOf(c) { return 'frarik_flusso_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch (e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch (e) {} }

  /* ── Stato modulo ── */
  var _hist = {};      /* entityId → [{t,v}] */
  var _histTs = {};    /* entityId → timestamp ultimo fetch */
  var _timers = {};    /* card.id → interval di refresh storico */
  var HIST_TTL = 60 * 1000;

  /* ── Campi configurabili ── */
  var FIELDS = [
    { k: 'solar',   label: 'Produzione solare',  unit: 'W',  ph: 'sensor.produzione_solare' },
    { k: 'grid',    label: 'Potenza rete',       unit: 'W',  ph: 'sensor.potenza_rete' },
    { k: 'soc',     label: 'Stato di carica',    unit: '%',  ph: 'sensor.batteria_soc' },
    { k: 'load',    label: 'Carico casa',        unit: 'W',  ph: 'sensor.carico_casa' },
    { k: 'battery', label: 'Potenza batteria',   unit: 'kW', ph: 'sensor.batteria_potenza' },
    { k: 'wallbox', label: 'Potenza wallbox/auto', unit: 'W', ph: 'sensor.wallbox_potenza' }
  ];

  /* ── Icone (lucide-style, stroke=currentColor) ── */
  function ic(name, sz) {
    sz = sz || 20;
    var p = {
      sun:  '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
      batt: '<rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2"/><path d="M6 11v2M10 11v2"/>',
      grid: '<path d="M12 3v12"/><path d="m7 12 5 5 5-5"/><rect x="4" y="19" width="16" height="2" rx="1"/>',
      home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>',
      car:  '<path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13"/><rect x="3" y="13" width="18" height="6" rx="2"/><circle cx="7.5" cy="19" r="1.3"/><circle cx="16.5" cy="19" r="1.3"/>'
    }[name] || '';
    return '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  }

  /* ── Nodi mostrati (in ordine verticale, come nello screenshot) ── */
  function nodesFor(cfg) {
    var n = [
      { key: 'solar',   name: 'SOLARE',   color: '#f59e0b', icon: 'sun' },
      { key: 'battery', name: 'BATTERIA', color: '#4ade80', icon: 'batt' },
      { key: 'grid',    name: 'RETE',     color: '#818cf8', icon: 'grid' },
      { key: 'load',    name: 'CASA',     color: '#6366f1', icon: 'home' }
    ];
    if (cfg.wallbox) n.push({ key: 'wallbox', name: 'AUTO', color: '#22d3ee', icon: 'car' });
    return n;
  }

  /* ── Lettura valore live + unità ── */
  function liveVal(id) {
    if (!id) return null;
    var s = window.hs ? window.hs[id] : null;
    var n = parseFloat(s);
    return isNaN(n) ? null : n;
  }
  function unitOf(id, fb) {
    try { var a = window.ha && window.ha[id]; if (a && a.unit_of_measurement) return a.unit_of_measurement; } catch (e) {}
    return fb || '';
  }
  /* valore normalizzato in W (per intensità del flusso) */
  function watts(id, fbUnit) {
    var v = liveVal(id); if (v == null) return 0;
    var u = (unitOf(id, fbUnit) || '').toLowerCase();
    if (u === 'kw') return v * 1000;
    return v;
  }
  function fmt(id, fbUnit) {
    var v = liveVal(id); if (v == null) return ['—', ''];
    var u = unitOf(id, fbUnit);
    var lu = (u || '').toLowerCase();
    if (lu === 'w' && Math.abs(v) >= 1000) return [(v / 1000).toFixed(2).replace(/\.?0+$/, ''), 'kW'];
    if (lu === '%') return [Math.round(v).toString(), '%'];
    var dec = (lu === 'kw') ? (Math.abs(v) < 10 ? 2 : 1) : 0;
    return [v.toFixed(dec).replace(/\.?0+$/, ''), u];
  }

  /* ── Badge di stato per nodo ── */
  function badge(node, cfg) {
    var w = watts(cfg[node.key], FIELDS.filter(function (f) { return f.k === node.key; })[0].unit);
    var soc = node.key === 'battery' ? liveVal(cfg.soc) : null;
    if (node.key === 'solar')   return Math.abs(w) > 5 ? ['LIVE', node.color] : ['OFF', 'rgba(255,255,255,.3)'];
    if (node.key === 'battery') {
      var s = soc == null ? '' : ' · ' + Math.round(soc) + '%';
      if (Math.abs(w) < 30) return ['STANDBY' + s, 'rgba(255,255,255,.4)'];
      return w > 0 ? ['CARICA' + s, '#4ade80'] : ['SCARICA' + s, '#fb923c'];
    }
    if (node.key === 'grid')    {
      if (w > 5)  return ['PRELIEVO', '#818cf8'];
      if (w < -5) return ['IMMISSIONE', '#4ade80'];
      return ['STABILE', 'rgba(255,255,255,.4)'];
    }
    if (node.key === 'load')    return Math.abs(w) > 5 ? ['ATTIVA', node.color] : ['IDLE', 'rgba(255,255,255,.3)'];
    if (node.key === 'wallbox') return Math.abs(w) > 5 ? ['IN CARICA', node.color] : ['FERMO', 'rgba(255,255,255,.3)'];
    return ['', 'rgba(255,255,255,.3)'];
  }

  /* ── Sparkline SVG da storico [{t,v}] ── */
  function spark(hist, color) {
    var W = 100, Hh = 30;
    if (!hist || hist.length < 2) {
      return '<svg viewBox="0 0 ' + W + ' ' + Hh + '" preserveAspectRatio="none" style="width:100%;height:34px;display:block">' +
        '<line x1="0" y1="' + (Hh - 3) + '" x2="' + W + '" y2="' + (Hh - 3) + '" stroke="' + color + '" stroke-opacity=".35" stroke-width="1"/></svg>';
    }
    var vals = hist.map(function (p) { return p.v; });
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), rg = (mx - mn) || 1;
    var t0 = +hist[0].t, t1 = +hist[hist.length - 1].t, tr = (t1 - t0) || 1;
    var pts = hist.map(function (p) {
      var x = ((+p.t - t0) / tr) * W;
      var y = Hh - 3 - ((p.v - mn) / rg) * (Hh - 6);
      return x.toFixed(2) + ',' + y.toFixed(2);
    });
    var line = pts.join(' ');
    var area = '0,' + Hh + ' ' + line + ' ' + W + ',' + Hh;
    var gid = 'sg' + Math.random().toString(36).slice(2, 8);
    return '<svg viewBox="0 0 ' + W + ' ' + Hh + '" preserveAspectRatio="none" style="width:100%;height:34px;display:block">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + color + '" stop-opacity=".35"/>' +
      '<stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
      '<polygon points="' + area + '" fill="url(#' + gid + ')"/>' +
      '<polyline points="' + line + '" fill="none" stroke="' + color + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
      '</svg>';
  }

  /* ── Connettori "flusso energetico" animati (SMIL, fluidi) ── */
  function flowSvg(nodes, cfg) {
    var N = nodes.length, VBh = N * 250, defs = '', paths = '';
    function cy(i) { return i * 250 + 125; }
    for (var i = 0; i < N - 1; i++) {
      var y0 = cy(i), y1 = cy(i + 1);
      var c0 = nodes[i].color, c1 = nodes[i + 1].color;
      var gid = 'fg' + i;
      defs += '<linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + c0 + '"/><stop offset="1" stop-color="' + c1 + '"/></linearGradient>';
      var d = 'M44 ' + y0 + ' C 8 ' + (y0 + 55) + ', 8 ' + (y1 - 55) + ', 44 ' + y1;
      // intensità → velocità del flusso (più energia = più veloce)
      var w = Math.max(Math.abs(watts(cfg[nodes[i].key], '')), Math.abs(watts(cfg[nodes[i + 1].key], '')));
      var dur = (w > 2000 ? 0.7 : w > 600 ? 1.0 : w > 50 ? 1.5 : 2.6).toFixed(2);
      // base statica tenue + linea animata che "scorre"
      paths += '<path d="' + d + '" fill="none" stroke="' + c0 + '" stroke-opacity=".12" stroke-width="3"/>' +
        '<path d="' + d + '" fill="none" stroke="url(#' + gid + ')" stroke-width="2.6" stroke-linecap="round" ' +
        'stroke-dasharray="5 16" stroke-opacity=".95" filter="url(#fglow)">' +
        '<animate attributeName="stroke-dashoffset" from="42" to="0" dur="' + dur + 's" repeatCount="indefinite"/></path>';
    }
    return '<svg viewBox="0 0 48 ' + VBh + '" preserveAspectRatio="none" style="position:absolute;left:0;top:0;width:48px;height:100%;pointer-events:none;overflow:visible">' +
      '<defs>' + defs + '<filter id="fglow" x="-50%" y="-50%" width="200%" height="200%">' +
      '<feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      paths + '</svg>';
  }

  function badgeHtml(node, cfg) {
    var b = badge(node, cfg);
    return '<span data-fe-badge="' + node.key + '" style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:99px;font-size:8.5px;font-weight:800;letter-spacing:.08em;' +
      'color:' + b[1] + ';background:' + b[1] + '1c;border:1px solid ' + b[1] + '44;white-space:nowrap;">' +
      '<span style="width:5px;height:5px;border-radius:50%;background:' + b[1] + ';box-shadow:0 0 6px ' + b[1] + ';"></span>' + eh(b[0]) + '</span>';
  }

  /* ── Riga nodo ── */
  function rowHtml(node, cfg) {
    var field = FIELDS.filter(function (f) { return f.k === node.key; })[0];
    var pair = fmt(cfg[node.key], field.unit);
    var hist = _hist[cfg[node.key]] || null;
    return '<div style="position:relative;flex:1;min-height:0;display:flex;align-items:stretch;gap:12px;padding:11px 14px 11px 0;">' +
      '<div style="width:46px;height:46px;align-self:center;border-radius:13px;flex-shrink:0;display:flex;align-items:center;justify-content:center;' +
        'color:' + node.color + ';background:' + node.color + '1f;border:1px solid ' + node.color + '44;box-shadow:0 0 16px ' + node.color + '22;">' + ic(node.icon, 22) + '</div>' +
      '<div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:3px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
          '<span style="font-size:10px;font-weight:800;letter-spacing:.14em;color:rgba(255,255,255,.55);">' + node.name + '</span>' +
          badgeHtml(node, cfg) +
        '</div>' +
        '<div data-fe-val="' + node.key + '" style="display:flex;align-items:baseline;gap:5px;">' +
          '<span style="font-size:26px;font-weight:800;color:#fff;line-height:1;letter-spacing:-1px;">' + pair[0] + '</span>' +
          '<span style="font-size:11px;font-weight:700;color:rgba(255,255,255,.4);">' + pair[1] + '</span>' +
        '</div>' +
        '<div data-fe-spark="' + node.key + '" style="margin-top:1px;opacity:.95;">' + spark(hist, node.color) + '</div>' +
      '</div>' +
    '</div>';
  }

  /* ── Render principale (cfg opzionale per anteprima) ── */
  function render(card, previewCfg) {
    var cfg = previewCfg || Object.assign({}, load(card));
    var nodes = nodesFor(cfg);
    var anyCfg = FIELDS.some(function (f) { return cfg[f.k]; });
    var rows = nodes.map(function (n) { return rowHtml(n, cfg); }).join('<div style="height:1px;background:rgba(255,255,255,.05);margin-left:58px;"></div>');

    var body = anyCfg
      ? '<div style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column;padding-left:48px;">' +
          flowSvg(nodes, cfg) + rows +
        '</div>'
      : '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:rgba(255,255,255,.4);text-align:center;padding:20px;">' +
          '<div style="font-size:34px;opacity:.5;">⚡</div>' +
          '<div style="font-size:13px;font-weight:700;color:rgba(255,255,255,.6);">Nessun sensore configurato</div>' +
          '<div style="font-size:11px;line-height:1.5;">Apri ✏️ → ⚙️ per scegliere i tuoi sensori</div>' +
        '</div>';

    return '<div style="height:100%;width:100%;box-sizing:border-box;display:flex;flex-direction:column;' +
        'background:rgba(10,14,26,1);border-radius:inherit;overflow:hidden;color:#fff;' +
        'font-family:var(--primary-font-family,\'Inter\',system-ui,sans-serif);">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px 12px;' +
          'border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0;">' +
        '<div style="display:flex;align-items:center;gap:9px;">' +
          '<span style="font-size:15px;filter:drop-shadow(0 0 6px rgba(245,158,11,.6));">⚡</span>' +
          '<span style="font-size:11px;font-weight:800;letter-spacing:.16em;color:rgba(255,255,255,.7);">FLUSSO ENERGETICO</span>' +
        '</div>' +
        '<span style="font-size:9px;font-weight:700;letter-spacing:.08em;color:rgba(255,255,255,.3);">ULTIMA ORA</span>' +
      '</div>' + body +
    '</div>';
  }

  /* ── Storico (cache per entità) ── */
  function ensureHist(id, cb) {
    if (!id || typeof fetchHistory !== 'function') { cb && cb(); return; }
    if (_hist[id] && (Date.now() - (_histTs[id] || 0) < HIST_TTL)) { cb && cb(); return; }
    _histTs[id] = Date.now();
    try {
      fetchHistory(id, 1).then(function (h) {
        _hist[id] = Array.isArray(h) ? h.filter(function (p) { return p && p.v != null && !isNaN(p.v); }) : [];
        cb && cb();
      }).catch(function () { cb && cb(); });
    } catch (e) { cb && cb(); }
  }
  function refreshHist(cfg, el, card, previewCfg) {
    var ids = FIELDS.map(function (f) { return cfg[f.k]; }).filter(Boolean);
    var pending = ids.length; if (!pending) return;
    ids.forEach(function (id) {
      ensureHist(id, function () {
        if (--pending === 0 && el && el.isConnected) {
          // ridisegna solo le sparkline (no flicker sul resto)
          var nodes = nodesFor(cfg);
          nodes.forEach(function (n) {
            var box = el.querySelector('[data-fe-spark="' + n.key + '"]');
            if (box) box.innerHTML = spark(_hist[cfg[n.key]] || null, n.color);
          });
        }
      });
    });
  }

  /* ── Aggiorna i soli valori/badge live (chiamato da update) ── */
  function patchLive(cfg, el) {
    var nodes = nodesFor(cfg);
    nodes.forEach(function (n) {
      var f = FIELDS.filter(function (x) { return x.k === n.key; })[0];
      var box = el.querySelector('[data-fe-val="' + n.key + '"]');
      if (box) {
        var p = fmt(cfg[n.key], f.unit);
        box.innerHTML = '<span style="font-size:26px;font-weight:800;color:#fff;line-height:1;letter-spacing:-1px;">' + p[0] + '</span>' +
          '<span style="font-size:11px;font-weight:700;color:rgba(255,255,255,.4);">' + p[1] + '</span>';
      }
      var bdg = el.querySelector('[data-fe-badge="' + n.key + '"]');
      if (bdg) bdg.outerHTML = badgeHtml(n, cfg);
    });
  }

  function mount(card, hass, el) {
    var cfg = Object.assign({}, load(card));
    if (_timers[card.id]) { clearInterval(_timers[card.id]); }
    refreshHist(cfg, el, card);
    _timers[card.id] = setInterval(function () {
      if (!el.isConnected) { clearInterval(_timers[card.id]); delete _timers[card.id]; return; }
      refreshHist(cfg, el, card);
    }, HIST_TTL);
  }

  function update(card, hass, el) {
    var cfg = Object.assign({}, load(card));
    var anyCfg = FIELDS.some(function (f) { return cfg[f.k]; });
    var have = el.querySelectorAll('[data-fe-val]').length;
    if (!anyCfg) { if (have) { el.innerHTML = render(card); } return; }     // non configurata → stato statico
    var want = nodesFor(cfg).length;
    if (want !== have) { el.innerHTML = render(card); mount(card, hass, el); return; }  // cambia struttura → rebuild
    patchLive(cfg, el);                                                     // altrimenti solo valori/badge
  }

  /* ════════════════════════ POPUP IMPOSTAZIONI (✏️ → ⚙️) ════════════════════════ */
  function openCfg(card, el) {
    var h = H();
    var states = (h && h.states) || (window.ha ? {} : {});
    var allIds = Object.keys(window.hs || {}).sort();
    var sensIds = allIds.filter(function (id) { return id.indexOf('sensor.') === 0 || id.indexOf('input_number.') === 0; });

    var cfg = Object.assign({}, load(card));

    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;' +
      'background:rgba(2,6,16,.84);backdrop-filter:blur(7px);font-family:var(--primary-font-family,\'Inter\',system-ui,sans-serif);';

    function fieldRow(f) {
      var val = cfg[f.k] || '';
      var fn = val && window.ha && window.ha[val] && window.ha[val].friendly_name ? window.ha[val].friendly_name : '';
      var has = !!val;
      return '<div style="margin-bottom:14px;">' +
        '<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.75);margin-bottom:6px;">' + f.label +
          ' <span style="color:rgba(255,255,255,.3);font-weight:600;">· ' + f.unit + '</span></div>' +
        '<div style="position:relative;display:flex;gap:8px;align-items:center;">' +
          '<div style="flex:1;position:relative;">' +
            '<input data-fe-inp="' + f.k + '" type="text" value="' + eh(val) + '" autocomplete="off" placeholder="' + f.ph + '" ' +
              'style="width:100%;box-sizing:border-box;padding:10px 12px;border-radius:11px;border:1px solid rgba(255,255,255,.12);' +
              'background:rgba(255,255,255,.04);color:#fff;font-size:12px;font-family:monospace;outline:none;">' +
            '<div data-fe-meta="' + f.k + '" style="font-size:10px;color:rgba(255,255,255,.4);margin-top:4px;min-height:12px;padding-left:2px;">' +
              (has && fn ? eh(fn) : '') + '</div>' +
            '<div data-fe-drop="' + f.k + '" style="position:absolute;left:0;right:0;top:42px;z-index:5;display:none;max-height:200px;overflow-y:auto;' +
              'background:#0b1220;border:1px solid rgba(255,255,255,.14);border-radius:10px;box-shadow:0 16px 40px rgba(0,0,0,.6);"></div>' +
          '</div>' +
          '<button data-fe-pick="' + f.k + '" style="flex-shrink:0;padding:9px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.14);' +
            'background:rgba(255,255,255,.06);color:rgba(255,255,255,.8);font-size:11px;font-weight:700;cursor:pointer;">' +
            (has ? 'Cambia' : 'Scegli') + '</button>' +
        '</div>' +
      '</div>';
    }

    ov.innerHTML =
      '<div style="width:min(1040px,96vw);max-height:92vh;display:flex;flex-direction:column;background:#0a0e1a;' +
          'border:1px solid rgba(255,255,255,.12);border-radius:20px;box-shadow:0 40px 100px rgba(0,0,0,.7);overflow:hidden;color:#fff;">' +
        // header
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0;">' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
            '<div style="width:38px;height:38px;border-radius:11px;background:rgba(245,158,11,.16);border:1px solid rgba(245,158,11,.35);' +
              'display:flex;align-items:center;justify-content:center;color:#f59e0b;">' + ic('sun', 20) + '</div>' +
            '<div><div style="font-size:16px;font-weight:800;">Flusso Energia</div>' +
              '<div style="font-size:11px;color:rgba(255,255,255,.4);">Impostazioni card</div></div>' +
          '</div>' +
          '<button id="fe-close" style="width:34px;height:34px;border-radius:10px;border:1px solid rgba(255,255,255,.12);' +
            'background:rgba(255,255,255,.05);color:rgba(255,255,255,.7);font-size:16px;cursor:pointer;">✕</button>' +
        '</div>' +
        // corpo: due colonne
        '<div style="flex:1;min-height:0;display:flex;gap:0;">' +
          // sinistra: campi
          '<div style="flex:1;min-width:0;overflow-y:auto;padding:20px 22px;border-right:1px solid rgba(255,255,255,.07);">' +
            FIELDS.map(fieldRow).join('') +
          '</div>' +
          // destra: anteprima live
          '<div style="width:46%;min-width:0;display:flex;flex-direction:column;padding:20px 22px;background:rgba(255,255,255,.015);">' +
            '<div style="font-size:10px;font-weight:800;letter-spacing:.14em;color:rgba(255,255,255,.4);margin-bottom:12px;">ANTEPRIMA LIVE</div>' +
            '<div id="fe-preview" style="flex:1;min-height:340px;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.08);"></div>' +
            '<div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:10px;">L\'anteprima si aggiorna man mano che modifichi le impostazioni.</div>' +
          '</div>' +
        '</div>' +
        // footer
        '<div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:14px 22px;border-top:1px solid rgba(255,255,255,.08);flex-shrink:0;">' +
          '<button id="fe-cancel" style="padding:11px 18px;border-radius:11px;border:1px solid rgba(255,255,255,.12);' +
            'background:rgba(255,255,255,.05);color:rgba(255,255,255,.7);font-size:13px;font-weight:700;cursor:pointer;">Annulla</button>' +
          '<button id="fe-save" style="padding:11px 22px;border-radius:11px;border:none;background:linear-gradient(135deg,#f59e0b,#f97316);' +
            'color:#1a1205;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 6px 20px rgba(245,158,11,.35);">✓ Salva</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(ov);
    var close = function () { try { document.body.removeChild(ov); } catch (e) {} };
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('#fe-close').addEventListener('click', close);
    ov.querySelector('#fe-cancel').addEventListener('click', close);

    var preview = ov.querySelector('#fe-preview');
    function renderPreview() {
      preview.innerHTML = render(card, cfg);
      refreshHist(cfg, preview, card, cfg);
    }
    renderPreview();

    // combobox per ogni campo
    FIELDS.forEach(function (f) {
      var inp = ov.querySelector('[data-fe-inp="' + f.k + '"]');
      var drop = ov.querySelector('[data-fe-drop="' + f.k + '"]');
      var meta = ov.querySelector('[data-fe-meta="' + f.k + '"]');
      var btn = ov.querySelector('[data-fe-pick="' + f.k + '"]');
      if (!inp || !drop) return;

      function setMeta() {
        var id = inp.value.trim();
        var fn = id && window.ha && window.ha[id] && window.ha[id].friendly_name ? window.ha[id].friendly_name : '';
        var v = liveVal(id);
        meta.textContent = (fn ? fn : '') + (v != null ? (fn ? ' · ' : '') + v + ' ' + unitOf(id, f.unit) : '');
      }
      function apply() {
        cfg[f.k] = inp.value.trim();
        setMeta();
        btn.textContent = cfg[f.k] ? 'Cambia' : 'Scegli';
        renderPreview();
      }
      function showDrop() {
        var q = inp.value.toLowerCase().trim();
        var hits = sensIds.filter(function (id) {
          if (!q) return true;
          var fn = (window.ha && window.ha[id] && window.ha[id].friendly_name || '').toLowerCase();
          return id.toLowerCase().indexOf(q) !== -1 || fn.indexOf(q) !== -1;
        }).slice(0, 80);
        if (!hits.length) { drop.style.display = 'none'; return; }
        drop.style.display = 'block';
        drop.innerHTML = hits.map(function (id) {
          var fn = (window.ha && window.ha[id] && window.ha[id].friendly_name) || '';
          var v = liveVal(id);
          return '<div data-pick="' + id + '" style="padding:7px 11px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.04);">' +
            '<div style="font-size:11px;font-family:monospace;color:#e2e8f0;">' + id + '</div>' +
            (fn || v != null ? '<div style="font-size:10px;color:rgba(255,255,255,.4);">' + eh(fn) + (v != null ? (fn ? ' · ' : '') + v + ' ' + unitOf(id, f.unit) : '') + '</div>' : '') +
          '</div>';
        }).join('');
        drop.querySelectorAll('[data-pick]').forEach(function (r) {
          r.addEventListener('mousedown', function (ev) { ev.preventDefault(); inp.value = r.getAttribute('data-pick'); drop.style.display = 'none'; apply(); });
          r.addEventListener('mouseover', function () { r.style.background = 'rgba(255,255,255,.06)'; });
          r.addEventListener('mouseout', function () { r.style.background = ''; });
        });
      }
      inp.addEventListener('focus', showDrop);
      inp.addEventListener('input', function () { showDrop(); apply(); });
      inp.addEventListener('blur', function () { setTimeout(function () { drop.style.display = 'none'; }, 180); });
      btn.addEventListener('click', function () { inp.focus(); showDrop(); });
    });

    ov.querySelector('#fe-save').addEventListener('click', function () {
      var clean = {};
      FIELDS.forEach(function (f) { var inp = ov.querySelector('[data-fe-inp="' + f.k + '"]'); if (inp && inp.value.trim()) clean[f.k] = inp.value.trim(); });
      save(card, clean);
      close();
      if (el) { el.innerHTML = render(card); mount(card, H(), el); }
      try { if (typeof window.showToast === 'function') window.showToast('⚡ Flusso Energia aggiornato'); } catch (e) {}
    });
  }

  function duplicateCard(src, copy) {
    var data = localStorage.getItem(keyOf(src));
    if (data) localStorage.setItem(keyOf(copy), data);
  }

  var CARD = {
    id: 'flusso-energia',
    name: 'Flusso Energia',
    icon: '⚡',
    version: '1.0',
    desc: 'Flusso energetico fluido (solare/batteria/rete/casa) con sparkline e selettori sensore.',
    colSpan: 2,
    rowSpan: 5,
    render: render,
    mount: mount,
    update: update,
    configure: openCfg,
    duplicate: duplicateCard
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
})();
