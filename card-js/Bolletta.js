/* global FratechCardRegistry */
(function () {
  'use strict';

  var _bVer = '1.0';
  var _bId  = 'bolletta';
  var _bCol = '#06b6d4';
  var _bRgb = '6,182,212';

  var _bDefs = {
    pk_consumo_ist:   'sensor.consumo_istantaneo',
    pk_bolletta_m:    'sensor.br_bolletta_mensile',
    pk_bolletta_g:    'sensor.br_bolletta_giornaliera',
    pk_kwh_m:         'sensor.br_energia_mensile_safe',
    pk_kwh_g:         'sensor.br_energia_giornaliera_safe',
    pk_proiezione:    'sensor.br_proiezione_fine_mese',
    pk_proiezione_kwh:'sensor.br_previsione_kwh_fine_mese',
    pk_saldo:         'sensor.br_saldo_octopus',
    pk_scadenza:      'sensor.br_giorni_scadenza_offerta',
    pk_costo_kwh:     'sensor.br_costo_per_kwh',
    pk_arera_trim:    'sensor.br_arera_trimestre',
    pk_materia:       'sensor.br_materia_energia_mensile',
    pk_trasporto:     'sensor.br_trasporto_mensile',
    pk_oneri:         'sensor.br_oneri_sistema_mensili',
    pk_accise:        'sensor.br_costo_mensile_accise',
    pk_iva:           'sensor.br_iva_mensile',
    pk_canone:        'sensor.br_canone_rai_mensile',
    pk_simulazione:   'sensor.br_simulazione_bolletta',
    pk_media_kwh:     'sensor.br_media_settimanale_kwh',
    pk_m_01: 'input_number.br_storico_mese_curr_01', pk_m_02: 'input_number.br_storico_mese_curr_02',
    pk_m_03: 'input_number.br_storico_mese_curr_03', pk_m_04: 'input_number.br_storico_mese_curr_04',
    pk_m_05: 'input_number.br_storico_mese_curr_05', pk_m_06: 'input_number.br_storico_mese_curr_06',
    pk_m_07: 'input_number.br_storico_mese_curr_07', pk_m_08: 'input_number.br_storico_mese_curr_08',
    pk_m_09: 'input_number.br_storico_mese_curr_09', pk_m_10: 'input_number.br_storico_mese_curr_10',
    pk_m_11: 'input_number.br_storico_mese_curr_11', pk_m_12: 'input_number.br_storico_mese_curr_12',
    pk_p_01: 'input_number.br_storico_mese_prev_01', pk_p_02: 'input_number.br_storico_mese_prev_02',
    pk_p_03: 'input_number.br_storico_mese_prev_03', pk_p_04: 'input_number.br_storico_mese_prev_04',
    pk_p_05: 'input_number.br_storico_mese_prev_05', pk_p_06: 'input_number.br_storico_mese_prev_06',
    pk_p_07: 'input_number.br_storico_mese_prev_07', pk_p_08: 'input_number.br_storico_mese_prev_08',
    pk_p_09: 'input_number.br_storico_mese_prev_09', pk_p_10: 'input_number.br_storico_mese_prev_10',
    pk_p_11: 'input_number.br_storico_mese_prev_11', pk_p_12: 'input_number.br_storico_mese_prev_12',
    pk_k_01: 'input_number.br_storico_kwh_curr_01',  pk_k_02: 'input_number.br_storico_kwh_curr_02',
    pk_k_03: 'input_number.br_storico_kwh_curr_03',  pk_k_04: 'input_number.br_storico_kwh_curr_04',
    pk_k_05: 'input_number.br_storico_kwh_curr_05',  pk_k_06: 'input_number.br_storico_kwh_curr_06',
    pk_k_07: 'input_number.br_storico_kwh_curr_07',  pk_k_08: 'input_number.br_storico_kwh_curr_08',
    pk_k_09: 'input_number.br_storico_kwh_curr_09',  pk_k_10: 'input_number.br_storico_kwh_curr_10',
    pk_k_11: 'input_number.br_storico_kwh_curr_11',  pk_k_12: 'input_number.br_storico_kwh_curr_12',
    pk_bonus: 'input_number.br_bonus_mese_corrente',
    pk_test_kwh:   'input_number.br_test_consumo_kwh',
    pk_test_bonus: 'input_number.br_test_bonus_euro',
    pk_soglia_w:   'input_number.br_soglia_lavoro_w',
    pk_tariffa:    'input_number.br_tariffa_energia'
  };

  var _mesi = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
  var _mesiL = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

  // ── helpers ────────────────────────────────────────────────────────────────
  function _bH()  { return window.frarikHass || window.hs || {}; }
  function _bS(h, id) {
    var s = (h.states || {})[id];
    return s ? String(s.state) : '';
  }
  function _bN(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
  function _bFmt(v, d) { return _bN(v).toFixed(d === undefined ? 2 : d); }

  function _bCfg(card) {
    var raw = {};
    try { raw = JSON.parse(localStorage.getItem('fcfg_' + _bId + '_' + (card.dataset.cid || '0')) || '{}'); } catch(e) {}
    var c = {};
    Object.keys(_bDefs).forEach(function(k) { c[k] = raw[k] || _bDefs[k]; });
    return c;
  }

  function _bCallSvc(domain, svc, data) {
    var callSvc = window.callSvc || (window.frarikHass && window.frarikHass.callService);
    if (callSvc) callSvc(domain, svc, data);
  }

  function _bSig(h, c) {
    var keys = [
      c.pk_bolletta_m, c.pk_bolletta_g, c.pk_kwh_m, c.pk_kwh_g,
      c.pk_consumo_ist, c.pk_proiezione, c.pk_saldo, c.pk_scadenza,
      c.pk_costo_kwh, c.pk_arera_trim, c.pk_materia, c.pk_trasporto,
      c.pk_oneri, c.pk_accise, c.pk_iva, c.pk_simulazione
    ];
    return keys.map(function(k) { return _bS(h, k); }).join('|') + '|' + _bVer;
  }

  // ── overlay helpers ────────────────────────────────────────────────────────
  function _bGetOverlay() {
    var d = document.getElementById('frarik-overlay-root');
    if (!d) { d = document.createElement('div'); d.id = 'frarik-overlay-root'; d.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none'; document.body.appendChild(d); }
    return d;
  }

  function _bPopShell(icon, title, sub, closeId, content) {
    var root = _bGetOverlay();
    var html =
      '<div id="' + closeId + '_bd" style="position:fixed;inset:0;background:rgba(0,0,0,.6);pointer-events:auto;display:flex;align-items:flex-end;justify-content:center;z-index:10000">'
      + '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:24px 24px 0 0;padding:0 0 env(safe-area-inset-bottom,8px);width:100%;max-width:520px;max-height:88vh;overflow:hidden;display:flex;flex-direction:column">'
      + '<div style="display:flex;align-items:center;gap:10px;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.08)">'
      + '<span style="font-size:20px">' + icon + '</span>'
      + '<div style="flex:1"><div style="font-size:15px;font-weight:700;color:#fff">' + title + '</div>'
      + (sub ? '<div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:1px">' + sub + '</div>' : '')
      + '</div>'
      + '<div data-bclose="' + closeId + '" style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;flex-shrink:0">✕</div>'
      + '</div>'
      + '<div style="overflow-y:auto;padding:16px 20px;flex:1">' + content + '</div>'
      + '</div>'
      + '</div>';
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    root.style.pointerEvents = 'auto';
    root.appendChild(wrap.firstChild);
    root.querySelectorAll('[data-bclose]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var el = document.getElementById(btn.dataset.bclose + '_bd');
        if (el) el.remove();
        if (!root.querySelector('[data-bclose]')) root.style.pointerEvents = 'none';
      });
    });
  }

  // ── popup: Dettaglio voci ──────────────────────────────────────────────────
  function _bOpenDettaglio(card) {
    var h = _bH(), c = _bCfg(card);
    var rows = [
      ['⚡ Materia Energia',   _bFmt(_bS(h, c.pk_materia))  + ' €'],
      ['🚛 Trasporto',         _bFmt(_bS(h, c.pk_trasporto)) + ' €'],
      ['🔧 Oneri di Sistema',  _bFmt(_bS(h, c.pk_oneri))     + ' €'],
      ['📋 Accise',            _bFmt(_bS(h, c.pk_accise))    + ' €'],
      ['💸 IVA',               _bFmt(_bS(h, c.pk_iva))       + ' €'],
      ['📺 Canone RAI',        _bFmt(_bS(h, c.pk_canone))    + ' €'],
    ];
    var bonus = _bN(_bS(h, c.pk_bonus));
    if (bonus > 0) rows.push(['🎁 Bonus (sconto)', '− ' + _bFmt(bonus) + ' €']);

    var tarRow = function(label, val) {
      return '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07)">'
        + '<span style="color:rgba(255,255,255,.7);font-size:13px">' + label + '</span>'
        + '<span style="color:#fff;font-weight:700;font-size:13px">' + val + '</span>'
        + '</div>';
    };

    var html = rows.map(function(r) { return tarRow(r[0], r[1]); }).join('');
    html += '<div style="display:flex;justify-content:space-between;padding:12px 0;margin-top:4px;background:rgba(' + _bRgb + ',.1);border-radius:10px;padding:12px 14px;margin-top:8px">'
      + '<span style="color:' + _bCol + ';font-weight:700;font-size:14px">TOTALE MESE</span>'
      + '<span style="color:' + _bCol + ';font-weight:800;font-size:16px">' + _bFmt(_bS(h, c.pk_bolletta_m)) + ' €</span>'
      + '</div>';
    html += '<div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08)">'
      + '<div style="font-size:11px;color:rgba(255,255,255,.4);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Tariffe ARERA ' + _bS(h, c.pk_arera_trim) + '</div>'
      + tarRow('💰 Prezzo Octopus', _bFmt(_bN(_bS(h, c.pk_tariffa)) * 100, 4) + ' c€/kWh')
      + tarRow('📊 Costo finale/kWh', _bFmt(_bN(_bS(h, c.pk_costo_kwh)) * 100, 3) + ' c€/kWh tutto incluso')
      + '</div>';

    _bPopShell('🧾', 'Dettaglio Bolletta', _mesiL[new Date().getMonth()] + ' ' + new Date().getFullYear(), 'bdet', html);
  }

  // ── popup: Storico ─────────────────────────────────────────────────────────
  function _bOpenStorico(card) {
    var h = _bH(), c = _bCfg(card);
    var now = new Date(), curM = now.getMonth() + 1;
    var curr = [], prev = [], kwhc = [];
    for (var i = 1; i <= 12; i++) {
      var mm = (i < 10 ? '0' : '') + i;
      curr.push(_bN(_bS(h, c['pk_m_' + mm])));
      prev.push(_bN(_bS(h, c['pk_p_' + mm])));
      kwhc.push(_bN(_bS(h, c['pk_k_' + mm])));
    }
    // Mese corrente: usa sensor live
    curr[curM - 1] = _bN(_bS(h, c.pk_bolletta_m));
    kwhc[curM - 1] = _bN(_bS(h, c.pk_kwh_m));

    var maxV = Math.max.apply(null, curr.concat(prev).concat([1]));
    var barH = function(v, col) {
      var pct = Math.max(4, (v / maxV) * 100);
      return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0">'
        + '<div style="font-size:9px;color:rgba(255,255,255,.5);height:14px;display:flex;align-items:flex-end">' + (v > 0 ? v.toFixed(0) : '') + '</div>'
        + '<div style="width:100%;border-radius:4px 4px 0 0;background:' + col + ';height:' + pct.toFixed(0) + 'px;min-height:4px;transition:height .3s"></div>'
        + '</div>';
    };

    var barsHtml = '<div style="display:flex;align-items:flex-end;gap:4px;height:120px;padding:8px 0 4px">';
    for (var j = 0; j < 12; j++) {
      var isCur = (j + 1) === curM;
      barsHtml += '<div style="flex:1;display:flex;flex-direction:column;gap:1px;align-items:center;min-width:0">'
        + '<div style="display:flex;align-items:flex-end;gap:1px;width:100%;height:100px">'
        + barH(prev[j], 'rgba(255,255,255,.2)')
        + barH(curr[j], isCur ? _bCol : 'rgba(' + _bRgb + ',.55)')
        + '</div>'
        + '<div style="font-size:8px;color:rgba(255,255,255,' + (isCur ? '1' : '.4') + ');margin-top:3px;font-weight:' + (isCur ? '800' : '400') + '">' + _mesi[j] + '</div>'
        + '</div>';
    }
    barsHtml += '</div>';
    barsHtml += '<div style="display:flex;gap:12px;margin-top:4px;padding:8px 0;border-top:1px solid rgba(255,255,255,.07)">'
      + '<div style="display:flex;align-items:center;gap:5px"><div style="width:10px;height:10px;background:rgba(255,255,255,.2);border-radius:2px"></div><span style="font-size:11px;color:rgba(255,255,255,.5)">' + (now.getFullYear() - 1) + '</span></div>'
      + '<div style="display:flex;align-items:center;gap:5px"><div style="width:10px;height:10px;background:' + _bCol + ';border-radius:2px"></div><span style="font-size:11px;color:rgba(255,255,255,.7)">' + now.getFullYear() + '</span></div>'
      + '</div>';

    var listHtml = '<div style="margin-top:12px">';
    for (var k = curM - 1; k >= 0; k--) {
      var label = _mesiL[k] + ' ' + now.getFullYear();
      var cE = curr[k], pE = prev[k];
      var diff = cE - pE;
      var diffC = diff >= 0 ? '#f87171' : '#4ade80';
      var diffS = (diff >= 0 ? '+' : '') + _bFmt(diff);
      listHtml += '<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.06)">'
        + '<div><div style="font-size:13px;color:#fff;font-weight:600">' + label + '</div>'
        + '<div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:2px">' + kwhc[k].toFixed(0) + ' kWh</div></div>'
        + '<div style="text-align:right"><div style="font-size:14px;color:#fff;font-weight:700">' + _bFmt(cE) + ' €</div>'
        + (pE > 0 ? '<div style="font-size:11px;color:' + diffC + ';margin-top:1px">' + diffS + ' € vs ' + (now.getFullYear() - 1) + '</div>' : '')
        + '</div>'
        + '</div>';
    }
    listHtml += '</div>';

    _bPopShell('📊', 'Storico Bollette', 'Confronto anno corrente vs precedente', 'bstor', barsHtml + listHtml);
  }

  // ── popup: Impostazioni ────────────────────────────────────────────────────
  function _bOpenSettings(card) {
    var h = _bH(), c = _bCfg(card);

    var sliderRow = function(label, eid, suffix, step, min, max) {
      var val = _bN(_bS(h, eid));
      return '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07)">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
        + '<span style="font-size:13px;color:rgba(255,255,255,.8)">' + label + '</span>'
        + '<span id="bsval_' + eid.replace(/\./g,'_') + '" style="font-size:13px;font-weight:700;color:' + _bCol + '">' + val.toFixed(step < 0.01 ? 6 : (step < 1 ? 2 : 0)) + ' ' + suffix + '</span>'
        + '</div>'
        + '<input type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" '
        + 'data-bslider="' + eid + '" '
        + 'style="width:100%;accent-color:' + _bCol + '">'
        + '</div>';
    };

    var html =
      '<div style="font-size:11px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Tariffe</div>'
      + sliderRow('Prezzo Octopus (€/kWh)', c.pk_tariffa, '€/kWh', 0.000001, 0, 0.5)
      + sliderRow('Bonus mese corrente', c.pk_bonus, '€', 0.5, 0, 200)
      + sliderRow('Soglia alert potenza', c.pk_soglia_w, 'W', 50, 100, 9000)
      + '<div style="font-size:11px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.5px;margin:16px 0 8px">Simulatore Bolletta</div>'
      + sliderRow('kWh test', c.pk_test_kwh, 'kWh', 1, 0, 1000)
      + sliderRow('Bonus test', c.pk_test_bonus, '€', 1, 0, 200)
      + '<div style="margin-top:12px;padding:12px 14px;background:rgba(' + _bRgb + ',.1);border-radius:10px">'
      + '<div style="font-size:12px;color:rgba(255,255,255,.5);margin-bottom:4px">Bolletta simulata</div>'
      + '<div style="font-size:20px;font-weight:800;color:' + _bCol + '">' + _bFmt(_bS(h, c.pk_simulazione)) + ' €</div>'
      + '</div>';

    _bPopShell('⚙️', 'Impostazioni', 'Tariffe e configurazione', 'bset', html);

    document.querySelectorAll('[data-bslider]').forEach(function(inp) {
      inp.addEventListener('input', function() {
        var eid = inp.dataset.bslider;
        var v = parseFloat(inp.value);
        var span = document.getElementById('bsval_' + eid.replace(/\./g, '_'));
        if (span) span.textContent = v;
      });
      inp.addEventListener('change', function() {
        var eid = inp.dataset.bslider;
        var v = parseFloat(inp.value);
        _bCallSvc('input_number', 'set_value', { entity_id: eid, value: v });
      });
    });
  }

  // ── render ─────────────────────────────────────────────────────────────────
  function _bRender(card) {
    var h = _bH(), c = _bCfg(card);

    var bollM     = _bN(_bS(h, c.pk_bolletta_m));
    var bollG     = _bN(_bS(h, c.pk_bolletta_g));
    var kwhM      = _bN(_bS(h, c.pk_kwh_m));
    var kwhG      = _bN(_bS(h, c.pk_kwh_g));
    var wLive     = _bN(_bS(h, c.pk_consumo_ist));
    var proiE     = _bN(_bS(h, c.pk_proiezione));
    var proiKwh   = _bN(_bS(h, c.pk_proiezione_kwh));
    var saldo     = _bN(_bS(h, c.pk_saldo));
    var giorni    = _bN(_bS(h, c.pk_scadenza));
    var costoKwh  = _bN(_bS(h, c.pk_costo_kwh));
    var areraTrim = _bS(h, c.pk_arera_trim) || '—';

    var now = new Date();
    var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var dayNow = now.getDate();
    var percMese = Math.min(100, (dayNow / daysInMonth) * 100);
    var percProi = bollM > 0 ? Math.min(100, (bollM / Math.max(proiE, bollM)) * 100) : 0;

    // last 6 months storico
    var curM = now.getMonth() + 1;
    var chartMonths = [], chartVals = [], chartLabels = [];
    for (var i = 5; i >= 0; i--) {
      var mIdx = ((curM - 1 - i + 12) % 12) + 1;
      var mm = (mIdx < 10 ? '0' : '') + mIdx;
      var v;
      if (i === 0) {
        v = bollM;
      } else {
        v = _bN(_bS(h, c['pk_m_' + mm]));
      }
      chartVals.push(v);
      chartLabels.push(_mesi[mIdx - 1]);
    }
    var maxChart = Math.max.apply(null, chartVals.concat([1]));
    var barsHtml = chartVals.map(function(v, i) {
      var isLast = i === 5;
      var pct = Math.max(8, (v / maxChart) * 64);
      return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">'
        + '<div style="font-size:9px;color:rgba(255,255,255,.5)">' + (v > 0 ? v.toFixed(0) : '') + '</div>'
        + '<div style="width:100%;border-radius:4px 4px 0 0;height:' + pct.toFixed(0) + 'px;background:' + (isLast ? _bCol : 'rgba(' + _bRgb + ',.35)') + ';transition:height .3s"></div>'
        + '<div style="font-size:9px;color:rgba(255,255,255,' + (isLast ? '1' : '.4') + ');font-weight:' + (isLast ? '700' : '400') + '">' + chartLabels[i] + '</div>'
        + '</div>';
    }).join('');

    // Octopus badge color
    var octoCol = giorni < 30 ? '#f87171' : (giorni < 60 ? '#fb923c' : '#4ade80');

    var html =
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px">'
      + '<div style="display:flex;align-items:center;gap:8px">'
      + '<div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,rgba(' + _bRgb + ',.3),rgba(' + _bRgb + ',.1));display:flex;align-items:center;justify-content:center;font-size:16px">⚡</div>'
      + '<div>'
      + '<div style="font-size:14px;font-weight:700;color:#fff">Bolletta</div>'
      + '<div style="font-size:10px;color:rgba(255,255,255,.4)">Energia Casa</div>'
      + '</div>'
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:6px">'
      + '<div style="font-size:10px;background:rgba(' + _bRgb + ',.15);color:' + _bCol + ';padding:3px 8px;border-radius:20px;font-weight:700;border:1px solid rgba(' + _bRgb + ',.3)">ARERA ' + areraTrim + '</div>'
      + '<div data-bact="cfg" style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.07);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px">⚙</div>'
      + '</div>'
      + '</div>'

      // Hero
      + '<div style="padding:4px 16px 16px;text-align:center">'
      + '<div style="font-size:48px;font-weight:900;color:#fff;line-height:1;letter-spacing:-2px">' + _bFmt(bollM) + '<span style="font-size:22px;font-weight:600;color:rgba(255,255,255,.6);margin-left:2px">€</span></div>'
      + '<div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:4px">' + _mesiL[now.getMonth()] + ' ' + now.getFullYear() + '</div>'
      + '<div style="display:flex;gap:8px;justify-content:center;margin-top:10px;flex-wrap:wrap">'
      + '<div style="background:rgba(' + _bRgb + ',.15);border:1px solid rgba(' + _bRgb + ',.3);border-radius:20px;padding:4px 12px;font-size:12px;color:' + _bCol + ';font-weight:700">' + kwhM.toFixed(1) + ' kWh</div>'
      + '<div style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:4px 12px;font-size:12px;color:rgba(255,255,255,.7);font-weight:600">' + (costoKwh * 100).toFixed(2) + ' c€/kWh</div>'
      + '<div style="background:rgba(' + (giorni < 30 ? '248,113,113' : '74,222,128') + ',.12);border:1px solid rgba(' + (giorni < 30 ? '248,113,113' : '74,222,128') + ',.3);border-radius:20px;padding:4px 12px;font-size:12px;color:' + octoCol + ';font-weight:600">🐙 ' + giorni + 'gg</div>'
      + '</div>'
      + '</div>'

      // Stats row
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:0 12px 12px">'
      + _bStat('📅 Oggi', _bFmt(bollG) + ' €', kwhG.toFixed(2) + ' kWh')
      + _bStat('⚡ Live', wLive >= 1000 ? (wLive / 1000).toFixed(2) + ' kW' : wLive.toFixed(0) + ' W', _bWLiveColor(wLive))
      + _bStat('💳 Octopus', _bFmt(saldo) + ' €', 'Saldo')
      + '</div>'

      // Progress bar mese
      + '<div style="padding:0 12px 12px">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
      + '<span style="font-size:11px;color:rgba(255,255,255,.5)">Avanzamento mese</span>'
      + '<span style="font-size:11px;color:rgba(255,255,255,.6)">' + dayNow + '/' + daysInMonth + ' gg</span>'
      + '</div>'
      + '<div style="height:4px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden">'
      + '<div style="height:100%;width:' + percMese.toFixed(0) + '%;background:rgba(' + _bRgb + ',.5);border-radius:2px"></div>'
      + '</div>'
      + '</div>'

      // Mini bar chart
      + '<div style="padding:0 12px 12px">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
      + '<span style="font-size:11px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.4px">Ultimi 6 mesi</span>'
      + '<span style="font-size:11px;color:rgba(255,255,255,.4)">Proiezione: ' + _bFmt(proiE) + ' €</span>'
      + '</div>'
      + '<div style="display:flex;gap:4px;align-items:flex-end;height:88px">' + barsHtml + '</div>'
      + '</div>'

      // Footer buttons
      + '<div style="display:flex;gap:6px;padding:0 12px 14px">'
      + _bBtn('bact_det', '🧾 Dettaglio')
      + _bBtn('bact_stor', '📊 Storico')
      + _bBtn('bact_set', '⚙️ Imposta')
      + '</div>';

    return html;
  }

  function _bStat(label, val, sub) {
    var subIsColor = sub && sub.startsWith('#');
    return '<div style="background:rgba(255,255,255,.05);border-radius:12px;padding:10px 8px;text-align:center">'
      + '<div style="font-size:10px;color:rgba(255,255,255,.4);margin-bottom:4px">' + label + '</div>'
      + '<div style="font-size:14px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + val + '</div>'
      + (sub && !subIsColor ? '<div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:2px">' + sub + '</div>' : '')
      + '</div>';
  }

  function _bWLiveColor(w) {
    if (w < 500) return '<span style="color:#4ade80">Basso</span>';
    if (w < 2000) return '<span style="color:#facc15">Medio</span>';
    return '<span style="color:#f87171">Alto</span>';
  }

  function _bBtn(id, label) {
    return '<div data-bact="' + id + '" style="flex:1;padding:9px 4px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;text-align:center;cursor:pointer;font-size:12px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden">' + label + '</div>';
  }

  // ── mount ──────────────────────────────────────────────────────────────────
  function _bMount(card) {
    if (card._bBound === _bVer) return;
    card._bBound = _bVer;

    var lastSig = '';
    var iv = setInterval(function() {
      if (!document.contains(card)) { clearInterval(iv); return; }
      var h = _bH(), c = _bCfg(card);
      var sig = _bSig(h, c);
      if (sig === lastSig) return;
      lastSig = sig;
      card.innerHTML = _bRender(card);
    }, 2000);

    card.addEventListener('click', function(e) {
      var tgt = e.target.closest('[data-bact]');
      if (!tgt) return;
      var a = tgt.dataset.bact;
      if (a === 'bact_det')  _bOpenDettaglio(card);
      if (a === 'bact_stor') _bOpenStorico(card);
      if (a === 'bact_set')  _bOpenSettings(card);
      if (a === 'cfg' || a === 'bact_cfg') {
        if (window.FratechCardRegistry && window.FratechCardRegistry[_bId] && window.FratechCardRegistry[_bId].openWizard)
          window.FratechCardRegistry[_bId].openWizard(card);
      }
    });
  }

  // ── configure wizard ───────────────────────────────────────────────────────
  function _bOpenWizard(card) {
    var c = _bCfg(card);
    var mainKeys = ['pk_consumo_ist','pk_bolletta_m','pk_bolletta_g','pk_kwh_m','pk_kwh_g',
                    'pk_proiezione','pk_saldo','pk_scadenza','pk_costo_kwh','pk_arera_trim'];
    var labels = {
      pk_consumo_ist:'Sensore potenza istantanea (W)',pk_bolletta_m:'Bolletta mensile (€)',
      pk_bolletta_g:'Bolletta giornaliera (€)',pk_kwh_m:'Energia mensile (kWh)',
      pk_kwh_g:'Energia giornaliera (kWh)',pk_proiezione:'Proiezione fine mese (€)',
      pk_saldo:'Saldo Octopus (€)',pk_scadenza:'Giorni scadenza offerta',
      pk_costo_kwh:'Costo al kWh (tutto incluso)',pk_arera_trim:'Trimestre ARERA'
    };
    var fields = mainKeys.map(function(k) {
      return '<div style="margin-bottom:12px">'
        + '<label style="font-size:11px;color:rgba(255,255,255,.5);display:block;margin-bottom:4px">' + (labels[k] || k) + '</label>'
        + '<input data-wcfg="' + k + '" value="' + (c[k] || '') + '" '
        + 'style="width:100%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:8px 10px;color:#fff;font-size:12px;outline:none;box-sizing:border-box">'
        + '</div>';
    }).join('');

    var saveBtn = '<div id="bwiz_save" style="margin-top:8px;padding:12px;background:' + _bCol + ';border-radius:10px;text-align:center;cursor:pointer;font-size:14px;font-weight:700;color:#000">Salva configurazione</div>';
    _bPopShell('⚙️', 'Configura Card Bolletta', 'Entity ID sensori', 'bwiz', fields + saveBtn);

    document.getElementById('bwiz_save') && document.getElementById('bwiz_save').addEventListener('click', function() {
      var newCfg = {};
      document.querySelectorAll('[data-wcfg]').forEach(function(inp) {
        newCfg[inp.dataset.wcfg] = inp.value.trim();
      });
      localStorage.setItem('fcfg_' + _bId + '_' + (card.dataset.cid || '0'), JSON.stringify(newCfg));
      var bd = document.getElementById('bwiz_bd');
      if (bd) bd.remove();
      var root = document.getElementById('frarik-overlay-root');
      if (root && !root.querySelector('[data-bclose]')) root.style.pointerEvents = 'none';
    });
  }

  // ── registration ───────────────────────────────────────────────────────────
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[_bId] = {
    id:      _bId,
    name:    'Bolletta',
    icon:    '⚡',
    version: _bVer,
    desc:    'Calcolo bolletta elettrica con tariffe ARERA auto-aggiornate, storico 12 mesi, proiezione e integrazione Octopus.',
    frarik_pkg_check: false,
    frarik_pkg_id:    'bolletta_riccardo',
    frarik_pkg_version: '1.0',

    render: function(card) {
      card.innerHTML = _bRender(card);
    },

    mount: function(card) {
      _bMount(card);
    },

    update: function(card) {
      var h = _bH(), c = _bCfg(card);
      var sig = _bSig(h, c);
      if (card._bLastSig !== sig) {
        card._bLastSig = sig;
        card.innerHTML = _bRender(card);
      }
    },

    configure: function(card) {
      _bOpenWizard(card);
    },

    openWizard: function(card) {
      _bOpenWizard(card);
    }
  };
})();
