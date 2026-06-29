/* global FratechCardRegistry */
(function () {
  'use strict';

  var _bVer = '1.0';
  var _bId  = 'bolletta';
  var _bCol = '#06b6d4';
  var _bRgb = '6,182,212';

  var _bDefs = {
    pk_consumo_ist:   'sensor.consumo_istantaneo',
    pk_bolletta_m:    'sensor.bolletta_mensile',
    pk_bolletta_g:    'sensor.bolletta_giornaliera',
    pk_kwh_m:         'sensor.bolletta_energia_mensile_safe',
    pk_kwh_g:         'sensor.bolletta_energia_giornaliera_safe',
    pk_proiezione:    'sensor.bolletta_proiezione_fine_mese',
    pk_proiezione_kwh:'sensor.bolletta_previsione_kwh_fine_mese',
    pk_saldo:         'sensor.bolletta_saldo_octopus',
    pk_scadenza:      'sensor.bolletta_giorni_scadenza_offerta',
    pk_costo_kwh:     'sensor.bolletta_costo_per_kwh',
    pk_arera_trim:    'sensor.bolletta_arera_trimestre',
    pk_materia:       'sensor.bolletta_materia_energia_mensile',
    pk_trasporto:     'sensor.bolletta_trasporto_mensile',
    pk_oneri:         'sensor.bolletta_oneri_sistema_mensili',
    pk_accise:        'sensor.bolletta_costo_mensile_accise',
    pk_iva:           'sensor.bolletta_iva_mensile',
    pk_canone:        'sensor.bolletta_canone_rai_mensile',
    pk_simulazione:   'sensor.bolletta_simulazione_bolletta',
    pk_media_kwh:     'sensor.bolletta_media_settimanale_kwh',
    pk_m_01: 'input_number.bolletta_storico_mese_curr_01', pk_m_02: 'input_number.bolletta_storico_mese_curr_02',
    pk_m_03: 'input_number.bolletta_storico_mese_curr_03', pk_m_04: 'input_number.bolletta_storico_mese_curr_04',
    pk_m_05: 'input_number.bolletta_storico_mese_curr_05', pk_m_06: 'input_number.bolletta_storico_mese_curr_06',
    pk_m_07: 'input_number.bolletta_storico_mese_curr_07', pk_m_08: 'input_number.bolletta_storico_mese_curr_08',
    pk_m_09: 'input_number.bolletta_storico_mese_curr_09', pk_m_10: 'input_number.bolletta_storico_mese_curr_10',
    pk_m_11: 'input_number.bolletta_storico_mese_curr_11', pk_m_12: 'input_number.bolletta_storico_mese_curr_12',
    pk_p_01: 'input_number.bolletta_storico_mese_prev_01', pk_p_02: 'input_number.bolletta_storico_mese_prev_02',
    pk_p_03: 'input_number.bolletta_storico_mese_prev_03', pk_p_04: 'input_number.bolletta_storico_mese_prev_04',
    pk_p_05: 'input_number.bolletta_storico_mese_prev_05', pk_p_06: 'input_number.bolletta_storico_mese_prev_06',
    pk_p_07: 'input_number.bolletta_storico_mese_prev_07', pk_p_08: 'input_number.bolletta_storico_mese_prev_08',
    pk_p_09: 'input_number.bolletta_storico_mese_prev_09', pk_p_10: 'input_number.bolletta_storico_mese_prev_10',
    pk_p_11: 'input_number.bolletta_storico_mese_prev_11', pk_p_12: 'input_number.bolletta_storico_mese_prev_12',
    pk_k_01: 'input_number.bolletta_storico_kwh_curr_01',  pk_k_02: 'input_number.bolletta_storico_kwh_curr_02',
    pk_k_03: 'input_number.bolletta_storico_kwh_curr_03',  pk_k_04: 'input_number.bolletta_storico_kwh_curr_04',
    pk_k_05: 'input_number.bolletta_storico_kwh_curr_05',  pk_k_06: 'input_number.bolletta_storico_kwh_curr_06',
    pk_k_07: 'input_number.bolletta_storico_kwh_curr_07',  pk_k_08: 'input_number.bolletta_storico_kwh_curr_08',
    pk_k_09: 'input_number.bolletta_storico_kwh_curr_09',  pk_k_10: 'input_number.bolletta_storico_kwh_curr_10',
    pk_k_11: 'input_number.bolletta_storico_kwh_curr_11',  pk_k_12: 'input_number.bolletta_storico_kwh_curr_12',
    pk_bonus: 'input_number.bolletta_bonus_mese_corrente',
    pk_test_kwh:   'input_number.bolletta_test_consumo_kwh',
    pk_test_bonus: 'input_number.bolletta_test_bonus_euro',
    pk_soglia_w:   'input_number.bolletta_soglia_lavoro_w',
    pk_tariffa:    'input_number.bolletta_tariffa_energia'
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
  function _bMount(card, el) {
    if (el._bBound === _bVer) return;
    el._bBound = _bVer;

    var lastSig = '';
    var iv = setInterval(function() {
      if (!document.contains(el)) { clearInterval(iv); return; }
      var h = _bH(), c = _bCfg(card);
      var sig = _bSig(h, c);
      if (sig === lastSig) return;
      lastSig = sig;
      el.innerHTML = _bRender(card);
    }, 2000);

    el.addEventListener('click', function(e) {
      var tgt = e.target.closest('[data-bact]');
      if (!tgt) return;
      var a = tgt.dataset.bact;
      if (a === 'bact_det')  _bOpenDettaglio(card);
      if (a === 'bact_stor') _bOpenStorico(card);
      if (a === 'bact_set')  _bOpenSettings(card);
      if (a === 'cfg' || a === 'bact_cfg') _bOpenCfg(card);
    });
  }

  // ── entity configurator (⚙ dentro la card) ───────────────────────────────
  function _bOpenCfg(card) {
    var c = _bCfg(card);
    var mainKeys = ['pk_consumo_ist','pk_bolletta_m','pk_bolletta_g','pk_kwh_m','pk_kwh_g',
                    'pk_proiezione','pk_saldo','pk_scadenza','pk_costo_kwh','pk_arera_trim'];
    var labels = {
      pk_consumo_ist:'Sensore potenza istantanea (W)', pk_bolletta_m:'Bolletta mensile (€)',
      pk_bolletta_g:'Bolletta giornaliera (€)',         pk_kwh_m:'Energia mensile (kWh)',
      pk_kwh_g:'Energia giornaliera (kWh)',             pk_proiezione:'Proiezione fine mese (€)',
      pk_saldo:'Saldo Octopus (€)',                     pk_scadenza:'Giorni scadenza offerta',
      pk_costo_kwh:'Costo al kWh (tutto incluso)',      pk_arera_trim:'Trimestre ARERA'
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
      document.querySelectorAll('[data-wcfg]').forEach(function(inp) { newCfg[inp.dataset.wcfg] = inp.value.trim(); });
      localStorage.setItem('fcfg_' + _bId + '_' + (card.dataset.cid || '0'), JSON.stringify(newCfg));
      var bd = document.getElementById('bwiz_bd');
      if (bd) bd.remove();
      var root = document.getElementById('frarik-overlay-root');
      if (root && !root.querySelector('[data-bclose]')) root.style.pointerEvents = 'none';
    });
  }

  // ── PKG install wizard ─────────────────────────────────────────────────────
  var _BOLL_WIZ_KEY = 'frarik_pkg_wizard_bolletta';

  var _BOLL_PKG_YAML = `###############################################################
#                                                             #
#   ███████╗██████╗  █████╗ ██████╗ ██╗██╗  ██╗             #
#   ██╔════╝██╔══██╗██╔══██╗██╔══██╗██║██║ ██╔╝             #
#   █████╗  ██████╔╝███████║██████╔╝██║█████╔╝              #
#   ██╔══╝  ██╔══██╗██╔══██║██╔══██╗██║██╔═██╗              #
#   ██║     ██║  ██║██║  ██║██║  ██║██║██║  ██╗             #
#   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝            #
#                                                             #
#   Package: Centro Controllo Bolletta Elettrica              #
#   Versione: 1.0  |  Frarik / Fratech                       #
#                                                             #
###############################################################
#
# INSTALLAZIONE TRAMITE WIZARD FRARIK
# ──────────────────────────────────────────────────────────
#  Il wizard della card Bolletta installa questo file
#  automaticamente in config/packages/ con i tuoi sensori.
#
#  Installazione manuale: modifica le righe sotto
#  "IMPOSTAZIONI PACKAGE" e copia in config/packages/
#
###############################################################

homeassistant:
  customize:
    package.node_anchors:
      customize: &customize
        package: 'Centro Controllo Bolletta Elettrica 1.0 — Frarik'

      setting:

####################################################
#              IMPOSTAZIONI PACKAGE                #
####################################################

        Sensore Potenza Casa: &sensore_potenza_bolletta
          'IL_TUO_SENSORE_POTENZA_BOLLETTA'

        Sensore Saldo Octopus: &sensore_saldo_octopus
          'IL_TUO_SENSORE_SALDO_OCTOPUS'

        Sensore Scadenza Offerta: &sensore_scadenza_octopus
          'IL_TUO_SENSORE_SCADENZA_OCTOPUS'

        Tariffa Contratto: &tariffa_contratto IL_TUA_TARIFFA_KWHE

        Potenza Contrattuale: &potenza_kw IL_TUA_POTENZA_KW

        Device per notifica push: &push
          - service: IL_TUO_MOBILE_APP_1

####################################################
#                  NOTIFICHE                       #
####################################################

notify:
  - name: frarik_bolletta
    platform: group
    services: *push

group:
  notifiche_bolletta:
    name: "Bolletta — Notifiche"
    entities:
      - input_boolean.bolletta_notify_push_soglia
      - input_boolean.bolletta_notify_push_giornaliero
      - input_boolean.bolletta_notify_push_mensile
      - input_boolean.bolletta_notify_push_annuale

####################################################
#                    SENSORI                       #
####################################################

sensor:
  - platform: integration
    source: *sensore_potenza_bolletta
    name: "Bolletta Energia Totale Casa"
    unique_id: bolletta_energia_totale_casa
    unit_prefix: k
    unit_time: h
    round: 3
    method: left

####################################################
#                 UTILITY METER                    #
####################################################

utility_meter:
  bolletta_energia_giornaliera:
    source: sensor.bolletta_energia_totale_casa
    name: "Bolletta Energia Giornaliera"
    cycle: daily
  bolletta_energia_settimanale:
    source: sensor.bolletta_energia_totale_casa
    name: "Bolletta Energia Settimanale"
    cycle: weekly
  bolletta_energia_mensile:
    source: sensor.bolletta_energia_totale_casa
    name: "Bolletta Energia Mensile"
    cycle: monthly
  bolletta_energia_trimestrale:
    source: sensor.bolletta_energia_totale_casa
    name: "Bolletta Energia Trimestrale"
    cycle: quarterly
  bolletta_energia_annuale:
    source: sensor.bolletta_energia_totale_casa
    name: "Bolletta Energia Annuale"
    cycle: yearly

####################################################
#                INPUT BOOLEAN                     #
####################################################

input_boolean:
  bolletta_reset_consumo_mensile:
    name: "Bolletta Reset Consumo Mensile"
    icon: mdi:restart
  bolletta_notify_push_soglia:
    name: "Bolletta Notifica Soglia Potenza"
    icon: mdi:bell
  bolletta_notify_push_giornaliero:
    name: "Bolletta Notifica Costi Giornalieri"
    icon: mdi:bell-ring
  bolletta_notify_push_mensile:
    name: "Bolletta Notifica Costi Mensili"
    icon: mdi:bell-ring
  bolletta_notify_push_annuale:
    name: "Bolletta Notifica Costi Annuali"
    icon: mdi:bell-ring

####################################################
#                 INPUT DATETIME                   #
####################################################

input_datetime:
  bolletta_orario_inizio_notifiche_soglia:
    name: "Bolletta Inizio Notifiche Soglia"
    has_date: false
    has_time: true
  bolletta_orario_fine_notifiche_soglia:
    name: "Bolletta Fine Notifiche Soglia"
    has_date: false
    has_time: true

####################################################
#                  INPUT NUMBER                    #
####################################################

input_number:
  bolletta_backup_energia_giornaliera:
    name: "Bolletta Backup kWh Giornaliero"
    min: 0
    max: 200
    step: 0.001
    mode: box
    unit_of_measurement: "kWh"
    icon: mdi:content-save
  bolletta_backup_energia_settimanale:
    name: "Bolletta Backup kWh Settimanale"
    min: 0
    max: 1000
    step: 0.001
    mode: box
    unit_of_measurement: "kWh"
    icon: mdi:content-save
  bolletta_backup_energia_mensile:
    name: "Bolletta Backup kWh Mensile"
    min: 0
    max: 2000
    step: 0.001
    mode: box
    unit_of_measurement: "kWh"
    icon: mdi:content-save
  bolletta_tariffa_energia:
    name: "Bolletta Tariffa Energia Fissa"
    min: 0
    max: 1
    step: 0.000001
    initial: *tariffa_contratto
    mode: box
    unit_of_measurement: "€/kWh"
    icon: mdi:lightning-bolt
  bolletta_spread_energia:
    name: "Bolletta Spread Energia"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.000000
    mode: box
    unit_of_measurement: "€/kWh"
    icon: mdi:chart-line
  bolletta_potenza_impegnata:
    name: "Bolletta Potenza Impegnata"
    min: 1.5
    max: 15
    step: 0.5
    initial: *potenza_kw
    mode: box
    unit_of_measurement: "kW"
    icon: mdi:flash
  bolletta_fb_perdite_perc:
    name: "Bolletta Fallback Perdite Rete %"
    min: 0
    max: 20
    step: 0.01
    initial: 8.73
    mode: box
    unit_of_measurement: "%"
    icon: mdi:transmission-tower
  bolletta_fb_dispbt:
    name: "Bolletta Fallback DISPbt"
    min: 0
    max: 5
    step: 0.000001
    initial: 0.102592
    mode: box
    unit_of_measurement: "€/mese"
  bolletta_fb_dispacciamento:
    name: "Bolletta Fallback Dispacciamento"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.010660
    mode: box
    unit_of_measurement: "€/kWh"
  bolletta_fb_mercato_capacita:
    name: "Bolletta Fallback Mercato Capacità"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.010583
    mode: box
    unit_of_measurement: "€/kWh"
  bolletta_fb_pno:
    name: "Bolletta Fallback PNO"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.000000
    mode: box
    unit_of_measurement: "€/mese"
  bolletta_fb_commercializzazione:
    name: "Bolletta Fallback Commercializzazione"
    min: 0
    max: 20
    step: 0.01
    initial: 6.00
    mode: box
    unit_of_measurement: "€/mese"
  bolletta_fb_trasporto_energia:
    name: "Bolletta Fallback Trasporto Energia"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.011900
    mode: box
    unit_of_measurement: "€/kWh"
  bolletta_fb_trasporto_fisso:
    name: "Bolletta Fallback Trasporto Fisso"
    min: 0
    max: 10
    step: 0.01
    initial: 1.92
    mode: box
    unit_of_measurement: "€/mese"
  bolletta_fb_trasporto_potenza:
    name: "Bolletta Fallback Trasporto Potenza"
    min: 0
    max: 10
    step: 0.01
    initial: 2.22
    mode: box
    unit_of_measurement: "€/kW"
  bolletta_fb_uc3:
    name: "Bolletta Fallback UC3"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.002760
    mode: box
    unit_of_measurement: "€/kWh"
  bolletta_fb_uc6_fisso:
    name: "Bolletta Fallback UC6 Fisso"
    min: 0
    max: 1
    step: 0.000001
    initial: 0.070000
    mode: box
    unit_of_measurement: "€/kW"
  bolletta_fb_uc6_variabile:
    name: "Bolletta Fallback UC6 Variabile"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.000070
    mode: box
    unit_of_measurement: "€/kWh"
  bolletta_fb_arim:
    name: "Bolletta Fallback ARIM"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.001638
    mode: box
    unit_of_measurement: "€/kWh"
  bolletta_fb_asos:
    name: "Bolletta Fallback ASOS"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.028657
    mode: box
    unit_of_measurement: "€/kWh"
  bolletta_fb_accise:
    name: "Bolletta Fallback Accise"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.022700
    mode: box
    unit_of_measurement: "€/kWh"
  bolletta_fb_iva_perc:
    name: "Bolletta Fallback IVA %"
    min: 0
    max: 30
    step: 0.1
    initial: 10.0
    mode: box
    unit_of_measurement: "%"
  bolletta_bonus_mese_corrente:
    name: "Bolletta Bonus Mese Corrente"
    min: 0
    max: 500
    step: 0.01
    initial: 0
    mode: box
    unit_of_measurement: "€"
    icon: mdi:gift
  bolletta_bonus_sociale:
    name: "Bolletta Bonus Sociale"
    min: 0
    max: 1000
    step: 0.01
    initial: 0
    mode: box
    unit_of_measurement: "€"
    icon: mdi:account-heart
  bolletta_soglia_costo_giornaliero:
    name: "Bolletta Soglia Alert Costo Giornaliero"
    min: 0
    max: 20
    step: 0.5
    initial: 5
    mode: box
    unit_of_measurement: "€"
    icon: mdi:alarm-light
  bolletta_soglia_consumo_giornaliero:
    name: "Bolletta Soglia Alert Consumo Giornaliero"
    min: 0
    max: 50
    step: 1
    initial: 15
    mode: box
    unit_of_measurement: "kWh"
    icon: mdi:alarm-light
  bolletta_soglia_lavoro_w:
    name: "Bolletta Soglia Consumo W"
    min: 100
    max: 9000
    step: 50
    initial: 3500
    mode: box
    unit_of_measurement: "W"
    icon: mdi:flash-alert
  bolletta_ritardo_soglia_sec:
    name: "Bolletta Ritardo Alert Soglia"
    min: 10
    max: 360
    step: 10
    initial: 60
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timelapse
  bolletta_test_consumo_kwh:
    name: "Bolletta Sandbox kWh"
    min: 0
    max: 5000
    step: 1
    initial: 0
    mode: box
    unit_of_measurement: "kWh"
    icon: mdi:calculator
  bolletta_test_bonus_euro:
    name: "Bolletta Sandbox Bonus"
    min: 0
    max: 500
    step: 1
    initial: 0
    mode: box
    unit_of_measurement: "€"
    icon: mdi:piggy-bank
  bolletta_storico_costo_ieri:
    name: "Bolletta Costo Ieri"
    min: 0
    max: 50
    step: 0.01
    initial: 0
    mode: box
    unit_of_measurement: "€"
    icon: mdi:calendar-today
  bolletta_storico_kwh_ieri:
    name: "Bolletta kWh Ieri"
    min: 0
    max: 100
    step: 0.01
    initial: 0
    mode: box
    unit_of_measurement: "kWh"
    icon: mdi:flash
  bolletta_storico_costo_lun: {name: "Bolletta Costo Lunedì",    min: 0, max: 50, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€",   icon: mdi:calendar-week}
  bolletta_storico_costo_mar: {name: "Bolletta Costo Martedì",   min: 0, max: 50, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€",   icon: mdi:calendar-week}
  bolletta_storico_costo_mer: {name: "Bolletta Costo Mercoledì", min: 0, max: 50, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€",   icon: mdi:calendar-week}
  bolletta_storico_costo_gio: {name: "Bolletta Costo Giovedì",   min: 0, max: 50, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€",   icon: mdi:calendar-week}
  bolletta_storico_costo_ven: {name: "Bolletta Costo Venerdì",   min: 0, max: 50, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€",   icon: mdi:calendar-week}
  bolletta_storico_costo_sab: {name: "Bolletta Costo Sabato",    min: 0, max: 50, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€",   icon: mdi:calendar-week}
  bolletta_storico_costo_dom: {name: "Bolletta Costo Domenica",  min: 0, max: 50, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€",   icon: mdi:calendar-week}
  bolletta_storico_kwh_lun:   {name: "Bolletta kWh Lunedì",      min: 0, max: 100, step: 0.1, initial: 0, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_mar:   {name: "Bolletta kWh Martedì",     min: 0, max: 100, step: 0.1, initial: 0, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_mer:   {name: "Bolletta kWh Mercoledì",   min: 0, max: 100, step: 0.1, initial: 0, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_gio:   {name: "Bolletta kWh Giovedì",     min: 0, max: 100, step: 0.1, initial: 0, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_ven:   {name: "Bolletta kWh Venerdì",     min: 0, max: 100, step: 0.1, initial: 0, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_sab:   {name: "Bolletta kWh Sabato",      min: 0, max: 100, step: 0.1, initial: 0, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_dom:   {name: "Bolletta kWh Domenica",    min: 0, max: 100, step: 0.1, initial: 0, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_mese_curr_01: {name: "Bolletta Gen",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_curr_02: {name: "Bolletta Feb",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_curr_03: {name: "Bolletta Mar",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_curr_04: {name: "Bolletta Apr",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_curr_05: {name: "Bolletta Mag",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_curr_06: {name: "Bolletta Giu",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_curr_07: {name: "Bolletta Lug",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_curr_08: {name: "Bolletta Ago",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_curr_09: {name: "Bolletta Set",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_curr_10: {name: "Bolletta Ott",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_curr_11: {name: "Bolletta Nov",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_curr_12: {name: "Bolletta Dic",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_prev_01: {name: "Bolletta Gen Prec", min: 0, max: 500, step: 0.01, initial: 0,     mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_prev_02: {name: "Bolletta Feb Prec", min: 0, max: 500, step: 0.01, initial: 0,     mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_prev_03: {name: "Bolletta Mar Prec", min: 0, max: 500, step: 0.01, initial: 0,     mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_prev_04: {name: "Bolletta Apr Prec", min: 0, max: 500, step: 0.01, initial: 0,     mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_prev_05: {name: "Bolletta Mag Prec", min: 0, max: 500, step: 0.01, initial: 0,     mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_prev_06: {name: "Bolletta Giu Prec", min: 0, max: 500, step: 0.01, initial: 0,     mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_prev_07: {name: "Bolletta Lug Prec", min: 0, max: 500, step: 0.01, initial: 0,     mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_prev_08: {name: "Bolletta Ago Prec", min: 0, max: 500, step: 0.01, initial: 0,     mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_prev_09: {name: "Bolletta Set Prec", min: 0, max: 500, step: 0.01, initial: 0,     mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_prev_10: {name: "Bolletta Ott Prec", min: 0, max: 500, step: 0.01, initial: 64.98, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_prev_11: {name: "Bolletta Nov Prec", min: 0, max: 500, step: 0.01, initial: 26.13, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_mese_prev_12: {name: "Bolletta Dic Prec", min: 0, max: 500, step: 0.01, initial: 61.36, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  bolletta_storico_kwh_curr_01: {name: "Bolletta kWh Gen", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_curr_02: {name: "Bolletta kWh Feb", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_curr_03: {name: "Bolletta kWh Mar", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_curr_04: {name: "Bolletta kWh Apr", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_curr_05: {name: "Bolletta kWh Mag", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_curr_06: {name: "Bolletta kWh Giu", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_curr_07: {name: "Bolletta kWh Lug", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_curr_08: {name: "Bolletta kWh Ago", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_curr_09: {name: "Bolletta kWh Set", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_curr_10: {name: "Bolletta kWh Ott", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_curr_11: {name: "Bolletta kWh Nov", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_curr_12: {name: "Bolletta kWh Dic", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_prev_01: {name: "Bolletta kWh Gen Prec", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_prev_02: {name: "Bolletta kWh Feb Prec", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_prev_03: {name: "Bolletta kWh Mar Prec", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_prev_04: {name: "Bolletta kWh Apr Prec", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_prev_05: {name: "Bolletta kWh Mag Prec", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_prev_06: {name: "Bolletta kWh Giu Prec", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_prev_07: {name: "Bolletta kWh Lug Prec", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_prev_08: {name: "Bolletta kWh Ago Prec", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_prev_09: {name: "Bolletta kWh Set Prec", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_prev_10: {name: "Bolletta kWh Ott Prec", min: 0, max: 2000, step: 1, initial: 178, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_prev_11: {name: "Bolletta kWh Nov Prec", min: 0, max: 2000, step: 1, initial: 184, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  bolletta_storico_kwh_prev_12: {name: "Bolletta kWh Dic Prec", min: 0, max: 2000, step: 1, initial: 206, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}

####################################################
#                     REST                         #
####################################################

rest:
  - resource: https://raw.githubusercontent.com/bobsilvio/arera-tariffe/main/data/tariffe_arera.json
    scan_interval: 86400
    sensor:
      - name: bolletta_arera_trimestre
        unique_id: bolletta_arera_trimestre
        value_template: "{{ value_json._info.trimestre }}"
        icon: mdi:calendar-clock
      - name: bolletta_arera_aggiornato_il
        unique_id: bolletta_arera_aggiornato_il
        value_template: "{{ value_json._info.aggiornato_il }}"
        icon: mdi:calendar-check
      - name: bolletta_arera_perdite_rete_perc
        unique_id: bolletta_arera_perdite_rete_perc
        value_template: "{{ value_json.materia_energia.perdite_rete_perc }}"
        unit_of_measurement: "%"
        icon: mdi:transmission-tower
      - name: bolletta_arera_dispbt
        unique_id: bolletta_arera_dispbt
        value_template: "{{ value_json.materia_energia.dispbt }}"
        unit_of_measurement: "€/mese"
      - name: bolletta_arera_dispacciamento
        unique_id: bolletta_arera_dispacciamento
        value_template: "{{ value_json.materia_energia.dispacciamento }}"
        unit_of_measurement: "€/kWh"
      - name: bolletta_arera_mercato_capacita
        unique_id: bolletta_arera_mercato_capacita
        value_template: "{{ value_json.materia_energia.mercato_capacita }}"
        unit_of_measurement: "€/kWh"
      - name: bolletta_arera_pno
        unique_id: bolletta_arera_pno
        value_template: "{{ value_json.materia_energia.pno }}"
        unit_of_measurement: "€/mese"
      - name: bolletta_arera_trasporto_quota_energia
        unique_id: bolletta_arera_trasporto_quota_energia
        value_template: "{{ value_json.trasporto.quota_energia }}"
        unit_of_measurement: "€/kWh"
      - name: bolletta_arera_trasporto_quota_fissa
        unique_id: bolletta_arera_trasporto_quota_fissa
        value_template: "{{ value_json.trasporto.quota_fissa }}"
        unit_of_measurement: "€/mese"
      - name: bolletta_arera_trasporto_quota_potenza
        unique_id: bolletta_arera_trasporto_quota_potenza
        value_template: "{{ value_json.trasporto.quota_potenza }}"
        unit_of_measurement: "€/kW"
      - name: bolletta_arera_uc3
        unique_id: bolletta_arera_uc3
        value_template: "{{ value_json.trasporto.uc3 }}"
        unit_of_measurement: "€/kWh"
      - name: bolletta_arera_uc6_fisso
        unique_id: bolletta_arera_uc6_fisso
        value_template: "{{ value_json.trasporto.uc6_fisso }}"
        unit_of_measurement: "€/kW"
      - name: bolletta_arera_uc6_variabile
        unique_id: bolletta_arera_uc6_variabile
        value_template: "{{ value_json.trasporto.uc6_variabile }}"
        unit_of_measurement: "€/kWh"
      - name: bolletta_arera_asos
        unique_id: bolletta_arera_asos
        value_template: "{{ value_json.oneri_sistema.asos }}"
        unit_of_measurement: "€/kWh"
      - name: bolletta_arera_arim
        unique_id: bolletta_arera_arim
        value_template: "{{ value_json.oneri_sistema.arim }}"
        unit_of_measurement: "€/kWh"
      - name: bolletta_arera_erariale
        unique_id: bolletta_arera_erariale
        value_template: "{{ value_json.imposte.erariale_domestico_residente_over3kw }}"
        unit_of_measurement: "€/kWh"
      - name: bolletta_arera_iva_perc
        unique_id: bolletta_arera_iva_perc
        value_template: "{{ value_json.imposte.iva_perc }}"
        unit_of_measurement: "%"

####################################################
#                   TEMPLATE                       #
####################################################

template:
  - sensor:
      - name: "Frarik Bolletta Versione"
        unique_id: frarik_bolletta_versione
        state: "1.0"
        icon: mdi:package-variant-closed
      - name: "Bolletta Energia Giornaliera Safe"
        unique_id: bolletta_energia_giornaliera_safe
        unit_of_measurement: "kWh"
        state_class: total_increasing
        device_class: energy
        icon: mdi:lightning-bolt
        state: >
          {% set v = states('sensor.bolletta_energia_giornaliera') %}
          {% if v not in ['unknown','unavailable',''] %}
            {{ v | float(0) }}
          {% else %}
            {{ states('input_number.bolletta_backup_energia_giornaliera') | float(0) }}
          {% endif %}
      - name: "Bolletta Energia Settimanale Safe"
        unique_id: bolletta_energia_settimanale_safe
        unit_of_measurement: "kWh"
        state_class: total_increasing
        device_class: energy
        icon: mdi:calendar-week
        state: >
          {% set v = states('sensor.bolletta_energia_settimanale') %}
          {% if v not in ['unknown','unavailable',''] %}
            {{ v | float(0) }}
          {% else %}
            {{ states('input_number.bolletta_backup_energia_settimanale') | float(0) }}
          {% endif %}
      - name: "Bolletta Energia Mensile Safe"
        unique_id: bolletta_energia_mensile_safe
        unit_of_measurement: "kWh"
        state_class: total_increasing
        device_class: energy
        icon: mdi:calendar-month
        state: >
          {% set v = states('sensor.bolletta_energia_mensile') %}
          {% if v not in ['unknown','unavailable',''] %}
            {{ v | float(0) }}
          {% else %}
            {{ states('input_number.bolletta_backup_energia_mensile') | float(0) }}
          {% endif %}
      - name: "Bolletta Perdite Rete Perc"
        unique_id: bolletta_perdite_rete_perc
        unit_of_measurement: "%"
        icon: mdi:transmission-tower
        state: >
          {{ states('sensor.bolletta_arera_perdite_rete_perc') | float(
             states('input_number.bolletta_fb_perdite_perc') | float(8.73)) }}
      - name: "Bolletta IVA Perc"
        unique_id: bolletta_iva_perc_eff
        unit_of_measurement: "%"
        icon: mdi:percent
        state: >
          {{ states('sensor.bolletta_arera_iva_perc') | float(
             states('input_number.bolletta_fb_iva_perc') | float(10)) }}
      - name: "Bolletta Costo Mensile Energia"
        unique_id: bolletta_costo_mensile_energia
        unit_of_measurement: "€"
        icon: mdi:flash
        state: >
          {% set kwh = states('sensor.bolletta_energia_mensile_safe') | float(0) %}
          {% set p = states('input_number.bolletta_tariffa_energia') | float(0) + states('input_number.bolletta_spread_energia') | float(0) %}
          {{ (kwh * p) | round(4) }}
      - name: "Bolletta Costo Mensile Perdite"
        unique_id: bolletta_costo_mensile_perdite
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {% set kwh = states('sensor.bolletta_energia_mensile_safe') | float(0) %}
          {% set perc = states('sensor.bolletta_perdite_rete_perc') | float(8.73) %}
          {% set kp = kwh * perc / 100 %}
          {% set p = states('input_number.bolletta_tariffa_energia') | float(0) + states('input_number.bolletta_spread_energia') | float(0) %}
          {{ (kp * p) | round(4) }}
      - name: "Bolletta Costo Mensile Dispacciamento"
        unique_id: bolletta_costo_mensile_dispacciamento
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {% set kwh = states('sensor.bolletta_energia_mensile_safe') | float(0) %}
          {% set perc = states('sensor.bolletta_perdite_rete_perc') | float(8.73) %}
          {% set kwh_tot = kwh * (1 + perc / 100) %}
          {% set t = states('sensor.bolletta_arera_dispacciamento') | float(states('input_number.bolletta_fb_dispacciamento') | float(0.01066)) %}
          {{ (kwh_tot * t) | round(4) }}
      - name: "Bolletta Costo Mensile Mercato Capacità"
        unique_id: bolletta_costo_mensile_mercato_capacita
        unit_of_measurement: "€"
        icon: mdi:power-plug
        state: >
          {% set kwh = states('sensor.bolletta_energia_mensile_safe') | float(0) %}
          {% set perc = states('sensor.bolletta_perdite_rete_perc') | float(8.73) %}
          {% set kwh_tot = kwh * (1 + perc / 100) %}
          {% set t = states('sensor.bolletta_arera_mercato_capacita') | float(states('input_number.bolletta_fb_mercato_capacita') | float(0.010583)) %}
          {{ (kwh_tot * t) | round(4) }}
      - name: "Bolletta Costo Mensile DISPbt"
        unique_id: bolletta_costo_mensile_dispbt
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {{ states('sensor.bolletta_arera_dispbt') | float(states('input_number.bolletta_fb_dispbt') | float(0.102592)) | round(4) }}
      - name: "Bolletta Costo Mensile PNO"
        unique_id: bolletta_costo_mensile_pno
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {{ states('sensor.bolletta_arera_pno') | float(states('input_number.bolletta_fb_pno') | float(0)) | round(4) }}
      - name: "Bolletta Costo Mensile Commercializzazione"
        unique_id: bolletta_costo_mensile_commercializzazione
        unit_of_measurement: "€"
        icon: mdi:store
        state: >
          {{ states('input_number.bolletta_fb_commercializzazione') | float(6) | round(2) }}
      - name: "Bolletta Costo Mensile Trasporto Energia"
        unique_id: bolletta_costo_mensile_trasporto_energia
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {% set kwh = states('sensor.bolletta_energia_mensile_safe') | float(0) %}
          {% set t = states('sensor.bolletta_arera_trasporto_quota_energia') | float(states('input_number.bolletta_fb_trasporto_energia') | float(0.0119)) %}
          {{ (kwh * t) | round(4) }}
      - name: "Bolletta Costo Mensile Trasporto Fisso"
        unique_id: bolletta_costo_mensile_trasporto_fisso
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {{ states('sensor.bolletta_arera_trasporto_quota_fissa') | float(states('input_number.bolletta_fb_trasporto_fisso') | float(1.92)) | round(4) }}
      - name: "Bolletta Costo Mensile Trasporto Potenza"
        unique_id: bolletta_costo_mensile_trasporto_potenza
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {% set kw = states('input_number.bolletta_potenza_impegnata') | float(4.5) %}
          {% set t = states('sensor.bolletta_arera_trasporto_quota_potenza') | float(states('input_number.bolletta_fb_trasporto_potenza') | float(2.22)) %}
          {{ (kw * t) | round(4) }}
      - name: "Bolletta Costo Mensile UC3"
        unique_id: bolletta_costo_mensile_uc3
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {% set kwh = states('sensor.bolletta_energia_mensile_safe') | float(0) %}
          {% set t = states('sensor.bolletta_arera_uc3') | float(states('input_number.bolletta_fb_uc3') | float(0.00276)) %}
          {{ (kwh * t) | round(4) }}
      - name: "Bolletta Costo Mensile UC6 Fisso"
        unique_id: bolletta_costo_mensile_uc6_fisso
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {% set kw = states('input_number.bolletta_potenza_impegnata') | float(4.5) %}
          {% set t = states('sensor.bolletta_arera_uc6_fisso') | float(states('input_number.bolletta_fb_uc6_fisso') | float(0.07)) %}
          {{ (kw * t) | round(4) }}
      - name: "Bolletta Costo Mensile UC6 Variabile"
        unique_id: bolletta_costo_mensile_uc6_variabile
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {% set kwh = states('sensor.bolletta_energia_mensile_safe') | float(0) %}
          {% set t = states('sensor.bolletta_arera_uc6_variabile') | float(states('input_number.bolletta_fb_uc6_variabile') | float(0.00007)) %}
          {{ (kwh * t) | round(4) }}
      - name: "Bolletta Costo Mensile ARIM"
        unique_id: bolletta_costo_mensile_arim
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {% set kwh = states('sensor.bolletta_energia_mensile_safe') | float(0) %}
          {% set t = states('sensor.bolletta_arera_arim') | float(states('input_number.bolletta_fb_arim') | float(0.001638)) %}
          {{ (kwh * t) | round(4) }}
      - name: "Bolletta Costo Mensile ASOS"
        unique_id: bolletta_costo_mensile_asos
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {% set kwh = states('sensor.bolletta_energia_mensile_safe') | float(0) %}
          {% set t = states('sensor.bolletta_arera_asos') | float(states('input_number.bolletta_fb_asos') | float(0.028657)) %}
          {{ (kwh * t) | round(4) }}
      - name: "Bolletta Costo Mensile Accise"
        unique_id: bolletta_costo_mensile_accise
        unit_of_measurement: "€"
        icon: mdi:cash
        state: >
          {% set kwh = states('sensor.bolletta_energia_mensile_safe') | float(0) %}
          {% set t = states('sensor.bolletta_arera_erariale') | float(states('input_number.bolletta_fb_accise') | float(0.0227)) %}
          {{ (kwh * t) | round(4) }}
      - name: "Bolletta Canone RAI Mensile"
        unique_id: bolletta_canone_rai_mensile
        unit_of_measurement: "€"
        icon: mdi:television-classic
        state: >
          {{ 9.00 if now().month in [1,2,4,7,10] else 0.00 }}
      - name: "Bolletta Materia Energia Mensile"
        unique_id: bolletta_materia_energia_mensile
        unit_of_measurement: "€"
        icon: mdi:lightning-bolt
        state: >
          {{ (states('sensor.bolletta_costo_mensile_energia') | float(0)
            + states('sensor.bolletta_costo_mensile_perdite') | float(0)
            + states('sensor.bolletta_costo_mensile_dispacciamento') | float(0)
            + states('sensor.bolletta_costo_mensile_mercato_capacita') | float(0)
            + states('sensor.bolletta_costo_mensile_dispbt') | float(0)
            + states('sensor.bolletta_costo_mensile_pno') | float(0)
            + states('sensor.bolletta_costo_mensile_commercializzazione') | float(0)) | round(2) }}
      - name: "Bolletta Trasporto Mensile"
        unique_id: bolletta_trasporto_mensile
        unit_of_measurement: "€"
        icon: mdi:truck
        state: >
          {{ (states('sensor.bolletta_costo_mensile_trasporto_energia') | float(0)
            + states('sensor.bolletta_costo_mensile_trasporto_fisso') | float(0)
            + states('sensor.bolletta_costo_mensile_trasporto_potenza') | float(0)
            + states('sensor.bolletta_costo_mensile_uc3') | float(0)
            + states('sensor.bolletta_costo_mensile_uc6_fisso') | float(0)
            + states('sensor.bolletta_costo_mensile_uc6_variabile') | float(0)) | round(2) }}
      - name: "Bolletta Oneri Sistema Mensili"
        unique_id: bolletta_oneri_sistema_mensili
        unit_of_measurement: "€"
        icon: mdi:lightning-bolt-outline
        state: >
          {{ (states('sensor.bolletta_costo_mensile_arim') | float(0)
            + states('sensor.bolletta_costo_mensile_asos') | float(0)) | round(2) }}
      - name: "Bolletta Imponibile Mensile"
        unique_id: bolletta_imponibile_mensile
        unit_of_measurement: "€"
        icon: mdi:calculator
        state: >
          {{ (states('sensor.bolletta_materia_energia_mensile') | float(0)
            + states('sensor.bolletta_trasporto_mensile') | float(0)
            + states('sensor.bolletta_oneri_sistema_mensili') | float(0)) | round(2) }}
      - name: "Bolletta IVA Mensile"
        unique_id: bolletta_iva_mensile
        unit_of_measurement: "€"
        icon: mdi:percent
        state: >
          {% set base = states('sensor.bolletta_imponibile_mensile') | float(0)
                      + states('sensor.bolletta_costo_mensile_accise') | float(0) %}
          {% set iva = states('sensor.bolletta_iva_perc') | float(10) %}
          {{ (base * iva / 100) | round(2) }}
      - name: "Bolletta Mensile"
        unique_id: bolletta_mensile
        unit_of_measurement: "€"
        icon: mdi:cash-multiple
        state: >
          {% set imp = states('sensor.bolletta_imponibile_mensile') | float(0) %}
          {% set acc = states('sensor.bolletta_costo_mensile_accise') | float(0) %}
          {% set iva = states('sensor.bolletta_iva_mensile') | float(0) %}
          {% set rai = states('sensor.bolletta_canone_rai_mensile') | float(0) %}
          {% set bon = states('input_number.bolletta_bonus_mese_corrente') | float(0)
                     + states('input_number.bolletta_bonus_sociale') | float(0) %}
          {{ (imp + acc + iva + rai - bon) | round(2) }}
      - name: "Bolletta Giornaliera"
        unique_id: bolletta_giornaliera
        unit_of_measurement: "€"
        icon: mdi:calendar-today
        state: >
          {% set kwh = states('sensor.bolletta_energia_giornaliera_safe') | float(0) %}
          {% set perc = states('sensor.bolletta_perdite_rete_perc') | float(8.73) %}
          {% set kp = kwh * perc / 100 %}
          {% set kwh_tot = kwh + kp %}
          {% set pE = states('input_number.bolletta_tariffa_energia') | float(0) + states('input_number.bolletta_spread_energia') | float(0) %}
          {% set gm = ((now().replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)).day %}
          {% set kw = states('input_number.bolletta_potenza_impegnata') | float(4.5) %}
          {% set imp = kwh * pE + kp * pE
            + kwh_tot * states('sensor.bolletta_arera_dispacciamento') | float(states('input_number.bolletta_fb_dispacciamento') | float(0.01066))
            + kwh_tot * states('sensor.bolletta_arera_mercato_capacita') | float(states('input_number.bolletta_fb_mercato_capacita') | float(0.010583))
            + states('sensor.bolletta_arera_dispbt') | float(states('input_number.bolletta_fb_dispbt') | float(0.102592)) / gm
            + states('sensor.bolletta_arera_pno') | float(states('input_number.bolletta_fb_pno') | float(0)) / gm
            + states('input_number.bolletta_fb_commercializzazione') | float(6) / gm
            + kwh * states('sensor.bolletta_arera_trasporto_quota_energia') | float(states('input_number.bolletta_fb_trasporto_energia') | float(0.0119))
            + states('sensor.bolletta_arera_trasporto_quota_fissa') | float(states('input_number.bolletta_fb_trasporto_fisso') | float(1.92)) / gm
            + kw * states('sensor.bolletta_arera_trasporto_quota_potenza') | float(states('input_number.bolletta_fb_trasporto_potenza') | float(2.22)) / gm
            + kwh * states('sensor.bolletta_arera_uc3') | float(states('input_number.bolletta_fb_uc3') | float(0.00276))
            + kw * states('sensor.bolletta_arera_uc6_fisso') | float(states('input_number.bolletta_fb_uc6_fisso') | float(0.07)) / gm
            + kwh * states('sensor.bolletta_arera_uc6_variabile') | float(states('input_number.bolletta_fb_uc6_variabile') | float(0.00007))
            + kwh * states('sensor.bolletta_arera_arim') | float(states('input_number.bolletta_fb_arim') | float(0.001638))
            + kwh * states('sensor.bolletta_arera_asos') | float(states('input_number.bolletta_fb_asos') | float(0.028657)) %}
          {% set acc = kwh * states('sensor.bolletta_arera_erariale') | float(states('input_number.bolletta_fb_accise') | float(0.0227)) %}
          {% set iva = (imp + acc) * states('sensor.bolletta_iva_perc') | float(10) / 100 %}
          {{ (imp + acc + iva) | round(2) }}
      - name: "Bolletta Costo Per kWh"
        unique_id: bolletta_costo_per_kwh
        unit_of_measurement: "€/kWh"
        icon: mdi:currency-eur
        state: >
          {% set kwh = states('sensor.bolletta_energia_mensile_safe') | float(0) %}
          {% set spesa = states('sensor.bolletta_mensile') | float(0) %}
          {% if kwh >= 30 %}{{ (spesa / kwh) | round(4) }}
          {% else %}{{ (states('input_number.bolletta_tariffa_energia') | float(0) + states('input_number.bolletta_spread_energia') | float(0)) | round(4) }}{% endif %}
      - name: "Bolletta Proiezione Fine Mese"
        unique_id: bolletta_proiezione_fine_mese
        unit_of_measurement: "€"
        icon: mdi:crystal-ball
        state: >
          {% set oggi = now().day %}
          {% set gm = ((now().replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)).day %}
          {% set speso = states('sensor.bolletta_mensile') | float(0) %}
          {% if oggi > 0 %}{{ ((speso / oggi) * gm) | round(2) }}{% else %}0{% endif %}
      - name: "Bolletta Previsione kWh Fine Mese"
        unique_id: bolletta_previsione_kwh_fine_mese
        unit_of_measurement: "kWh"
        icon: mdi:crystal-ball
        state: >
          {% set oggi = now().day %}
          {% set gm = ((now().replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)).day %}
          {% set kwh = states('sensor.bolletta_energia_mensile_safe') | float(0) %}
          {% if oggi > 0 %}{{ ((kwh / oggi) * gm) | round(0) | int }}{% else %}0{% endif %}
      - name: "Bolletta Consumo Medio Giornaliero"
        unique_id: bolletta_consumo_medio_giornaliero
        unit_of_measurement: "kWh"
        icon: mdi:chart-line
        state: >
          {% set oggi = now().day %}
          {% set kwh = states('sensor.bolletta_energia_mensile_safe') | float(0) %}
          {% if oggi > 0 %}{{ (kwh / oggi) | round(1) }}{% else %}0{% endif %}
      - name: "Bolletta Media Settimanale kWh"
        unique_id: bolletta_media_settimanale_kwh
        unit_of_measurement: "kWh"
        icon: mdi:chart-bar
        state: >
          {{ ((states('input_number.bolletta_storico_kwh_lun') | float(0)
             + states('input_number.bolletta_storico_kwh_mar') | float(0)
             + states('input_number.bolletta_storico_kwh_mer') | float(0)
             + states('input_number.bolletta_storico_kwh_gio') | float(0)
             + states('input_number.bolletta_storico_kwh_ven') | float(0)
             + states('input_number.bolletta_storico_kwh_sab') | float(0)
             + states('input_number.bolletta_storico_kwh_dom') | float(0)) / 7) | round(1) }}
      - name: "Bolletta Totale Anno Corrente"
        unique_id: bolletta_totale_anno_corrente
        unit_of_measurement: "€"
        icon: mdi:calendar
        state: >
          {% set m = now().month %}{% set tot = namespace(v=0) %}
          {% for i in range(1, m) %}{% set tot.v = tot.v + states('input_number.bolletta_storico_mese_curr_%02d' | format(i)) | float(0) %}{% endfor %}
          {{ (tot.v + states('sensor.bolletta_mensile') | float(0)) | round(2) }}
      - name: "Bolletta Totale Anno Precedente"
        unique_id: bolletta_totale_anno_precedente
        unit_of_measurement: "€"
        icon: mdi:calendar
        state: >
          {% set tot = namespace(v=0) %}
          {% for i in range(1, 13) %}{% set tot.v = tot.v + states('input_number.bolletta_storico_mese_prev_%02d' | format(i)) | float(0) %}{% endfor %}
          {{ tot.v | round(2) }}
      - name: "Bolletta Consumo Anno Corrente"
        unique_id: bolletta_consumo_anno_corrente
        unit_of_measurement: "kWh"
        icon: mdi:flash
        state: >
          {% set m = now().month %}{% set tot = namespace(v=0) %}
          {% for i in range(1, m) %}{% set tot.v = tot.v + states('input_number.bolletta_storico_kwh_curr_%02d' | format(i)) | float(0) %}{% endfor %}
          {{ (tot.v + states('sensor.bolletta_energia_mensile_safe') | float(0)) | round(1) }}
      - name: "Bolletta Consumo Anno Precedente"
        unique_id: bolletta_consumo_anno_precedente
        unit_of_measurement: "kWh"
        icon: mdi:flash
        state: >
          {% set tot = namespace(v=0) %}
          {% for i in range(1, 13) %}{% set tot.v = tot.v + states('input_number.bolletta_storico_kwh_prev_%02d' | format(i)) | float(0) %}{% endfor %}
          {{ tot.v | round(0) }}
      - name: "Bolletta Differenza vs Anno Scorso"
        unique_id: bolletta_differenza_vs_anno_scorso
        unit_of_measurement: "€"
        icon: mdi:compare
        state: >
          {% set m = now().month %}
          {% set c = states('sensor.bolletta_mensile') | float(0) %}
          {% set p = states('input_number.bolletta_storico_mese_prev_%02d' | format(m)) | float(0) %}
          {{ (c - p) | round(2) }}
        attributes:
          percentuale: >
            {% set m = now().month %}
            {% set c = states('sensor.bolletta_mensile') | float(0) %}
            {% set p = states('input_number.bolletta_storico_mese_prev_%02d' | format(m)) | float(0) %}
            {% if p > 0 %}{{ (((c - p) / p) * 100) | round(1) }}%{% else %}N/A{% endif %}
      - name: "Bolletta Saldo Octopus"
        unique_id: bolletta_saldo_octopus
        unit_of_measurement: "€"
        icon: mdi:cash
        state: >
          {{ states('IL_TUO_SENSORE_SALDO_OCTOPUS') | float(0) | round(2) }}
      - name: "Bolletta Giorni Scadenza Offerta"
        unique_id: bolletta_giorni_scadenza_offerta
        unit_of_measurement: "giorni"
        icon: mdi:calendar-clock
        state: >
          {{ states('IL_TUO_SENSORE_SCADENZA_OCTOPUS') | int(999) }}
      - name: "Bolletta Simulazione"
        unique_id: bolletta_simulazione_bolletta
        unit_of_measurement: "€"
        icon: mdi:calculator
        state: >
          {% set kwh = states('input_number.bolletta_test_consumo_kwh') | float(0) %}
          {% set perc = states('sensor.bolletta_perdite_rete_perc') | float(8.73) %}
          {% set kp = kwh * perc / 100 %}{% set kwh_tot = kwh + kp %}
          {% set pE = states('input_number.bolletta_tariffa_energia') | float(0) + states('input_number.bolletta_spread_energia') | float(0) %}
          {% set kw = states('input_number.bolletta_potenza_impegnata') | float(4.5) %}
          {% set imp = kwh * pE + kp * pE
            + kwh_tot * states('sensor.bolletta_arera_dispacciamento') | float(states('input_number.bolletta_fb_dispacciamento') | float(0.01066))
            + kwh_tot * states('sensor.bolletta_arera_mercato_capacita') | float(states('input_number.bolletta_fb_mercato_capacita') | float(0.010583))
            + states('sensor.bolletta_arera_dispbt') | float(states('input_number.bolletta_fb_dispbt') | float(0.102592))
            + states('sensor.bolletta_arera_pno') | float(states('input_number.bolletta_fb_pno') | float(0))
            + states('input_number.bolletta_fb_commercializzazione') | float(6)
            + kwh * states('sensor.bolletta_arera_trasporto_quota_energia') | float(states('input_number.bolletta_fb_trasporto_energia') | float(0.0119))
            + states('sensor.bolletta_arera_trasporto_quota_fissa') | float(states('input_number.bolletta_fb_trasporto_fisso') | float(1.92))
            + kw * states('sensor.bolletta_arera_trasporto_quota_potenza') | float(states('input_number.bolletta_fb_trasporto_potenza') | float(2.22))
            + kwh * states('sensor.bolletta_arera_uc3') | float(states('input_number.bolletta_fb_uc3') | float(0.00276))
            + kw * states('sensor.bolletta_arera_uc6_fisso') | float(states('input_number.bolletta_fb_uc6_fisso') | float(0.07))
            + kwh * states('sensor.bolletta_arera_uc6_variabile') | float(states('input_number.bolletta_fb_uc6_variabile') | float(0.00007))
            + kwh * states('sensor.bolletta_arera_arim') | float(states('input_number.bolletta_fb_arim') | float(0.001638))
            + kwh * states('sensor.bolletta_arera_asos') | float(states('input_number.bolletta_fb_asos') | float(0.028657)) %}
          {% set acc = kwh * states('sensor.bolletta_arera_erariale') | float(states('input_number.bolletta_fb_accise') | float(0.0227)) %}
          {% set iva = (imp + acc) * states('sensor.bolletta_iva_perc') | float(10) / 100 %}
          {% set bon = states('input_number.bolletta_test_bonus_euro') | float(0) %}
          {{ (imp + acc + iva - bon) | round(2) }}

####################################################
#                    SCRIPT                        #
####################################################

script:
  bolletta_reset_sensori_energia:
    alias: "Frarik — Bolletta: Reset Contatori"
    icon: mdi:restart
    sequence:
      - service: utility_meter.calibrate
        data: { value: "0" }
        target:
          entity_id:
            - sensor.bolletta_energia_giornaliera
            - sensor.bolletta_energia_settimanale
            - sensor.bolletta_energia_mensile
            - sensor.bolletta_energia_trimestrale
            - sensor.bolletta_energia_annuale
      - service: input_boolean.turn_off
        target: { entity_id: input_boolean.bolletta_reset_consumo_mensile }

####################################################
#                  AUTOMAZIONI                     #
####################################################

automation:
  - alias: "Frarik — Bolletta: Backup Energia Automatico"
    trigger:
      - platform: time_pattern
        minutes: "/15"
      - platform: homeassistant
        event: start
    action:
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_backup_energia_giornaliera }
        data: { value: "{{ states('sensor.bolletta_energia_giornaliera') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_backup_energia_settimanale }
        data: { value: "{{ states('sensor.bolletta_energia_settimanale') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_backup_energia_mensile }
        data: { value: "{{ states('sensor.bolletta_energia_mensile') | float(0) }}" }

  - alias: "Frarik — Bolletta: Salva Storico Ieri e Settimanale"
    trigger:
      - platform: time
        at: "23:59:00"
    action:
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_costo_ieri }
        data: { value: "{{ states('sensor.bolletta_giornaliera') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_kwh_ieri }
        data: { value: "{{ states('sensor.bolletta_energia_giornaliera_safe') | float(0) }}" }
      - choose:
          - conditions: "{{ now().weekday() == 0 }}"
            sequence:
              - service: input_number.set_value
                target: { entity_id: input_number.bolletta_storico_costo_lun }
                data: { value: "{{ states('sensor.bolletta_giornaliera') | float(0) }}" }
              - service: input_number.set_value
                target: { entity_id: input_number.bolletta_storico_kwh_lun }
                data: { value: "{{ states('sensor.bolletta_energia_giornaliera_safe') | float(0) }}" }
          - conditions: "{{ now().weekday() == 1 }}"
            sequence:
              - service: input_number.set_value
                target: { entity_id: input_number.bolletta_storico_costo_mar }
                data: { value: "{{ states('sensor.bolletta_giornaliera') | float(0) }}" }
              - service: input_number.set_value
                target: { entity_id: input_number.bolletta_storico_kwh_mar }
                data: { value: "{{ states('sensor.bolletta_energia_giornaliera_safe') | float(0) }}" }
          - conditions: "{{ now().weekday() == 2 }}"
            sequence:
              - service: input_number.set_value
                target: { entity_id: input_number.bolletta_storico_costo_mer }
                data: { value: "{{ states('sensor.bolletta_giornaliera') | float(0) }}" }
              - service: input_number.set_value
                target: { entity_id: input_number.bolletta_storico_kwh_mer }
                data: { value: "{{ states('sensor.bolletta_energia_giornaliera_safe') | float(0) }}" }
          - conditions: "{{ now().weekday() == 3 }}"
            sequence:
              - service: input_number.set_value
                target: { entity_id: input_number.bolletta_storico_costo_gio }
                data: { value: "{{ states('sensor.bolletta_giornaliera') | float(0) }}" }
              - service: input_number.set_value
                target: { entity_id: input_number.bolletta_storico_kwh_gio }
                data: { value: "{{ states('sensor.bolletta_energia_giornaliera_safe') | float(0) }}" }
          - conditions: "{{ now().weekday() == 4 }}"
            sequence:
              - service: input_number.set_value
                target: { entity_id: input_number.bolletta_storico_costo_ven }
                data: { value: "{{ states('sensor.bolletta_giornaliera') | float(0) }}" }
              - service: input_number.set_value
                target: { entity_id: input_number.bolletta_storico_kwh_ven }
                data: { value: "{{ states('sensor.bolletta_energia_giornaliera_safe') | float(0) }}" }
          - conditions: "{{ now().weekday() == 5 }}"
            sequence:
              - service: input_number.set_value
                target: { entity_id: input_number.bolletta_storico_costo_sab }
                data: { value: "{{ states('sensor.bolletta_giornaliera') | float(0) }}" }
              - service: input_number.set_value
                target: { entity_id: input_number.bolletta_storico_kwh_sab }
                data: { value: "{{ states('sensor.bolletta_energia_giornaliera_safe') | float(0) }}" }
          - conditions: "{{ now().weekday() == 6 }}"
            sequence:
              - service: input_number.set_value
                target: { entity_id: input_number.bolletta_storico_costo_dom }
                data: { value: "{{ states('sensor.bolletta_giornaliera') | float(0) }}" }
              - service: input_number.set_value
                target: { entity_id: input_number.bolletta_storico_kwh_dom }
                data: { value: "{{ states('sensor.bolletta_energia_giornaliera_safe') | float(0) }}" }

  - alias: "Frarik — Bolletta: Salva Storico Mensile"
    trigger:
      - platform: time
        at: "23:55:00"
    condition:
      - condition: template
        value_template: "{{ (now() + timedelta(days=1)).day == 1 }}"
    action:
      - service: input_number.set_value
        target:
          entity_id: "input_number.bolletta_storico_mese_curr_{{ now().strftime('%m') }}"
        data:
          value: "{{ states('sensor.bolletta_mensile') | float(0) }}"
      - service: input_number.set_value
        target:
          entity_id: "input_number.bolletta_storico_kwh_curr_{{ now().strftime('%m') }}"
        data:
          value: "{{ states('sensor.bolletta_energia_mensile_safe') | float(0) }}"
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_bonus_mese_corrente }
        data: { value: 0 }
      - service: notify.frarik_bolletta
        data:
          title: "Frarik Bolletta — Fine mese"
          message: >
            Storico salvato: {{ now().strftime('%B %Y') }}
            Bolletta: {{ states('sensor.bolletta_mensile') }} €
            Consumo: {{ states('sensor.bolletta_energia_mensile_safe') }} kWh

  - alias: "Frarik — Bolletta: Reset Mensile Manuale"
    trigger:
      - platform: state
        entity_id: input_boolean.bolletta_reset_consumo_mensile
        to: "on"
    action:
      - service: utility_meter.reset
        target: { entity_id: sensor.bolletta_energia_mensile }
      - service: input_boolean.turn_off
        target: { entity_id: input_boolean.bolletta_reset_consumo_mensile }

  - alias: "Frarik — Bolletta: Report Mattutino"
    trigger:
      - platform: time
        at: "08:00:00"
    condition:
      - condition: state
        entity_id: input_boolean.bolletta_notify_push_giornaliero
        state: "on"
    action:
      - service: notify.frarik_bolletta
        data:
          title: "Buongiorno — Report Energia"
          message: >
            Ieri: {{ states('input_number.bolletta_storico_kwh_ieri') }} kWh = {{ states('input_number.bolletta_storico_costo_ieri') }} €
            Mese: {{ states('sensor.bolletta_energia_mensile_safe') }} kWh = {{ states('sensor.bolletta_mensile') }} €
            Proiezione: {{ states('sensor.bolletta_proiezione_fine_mese') }} €
            Saldo Octopus: {{ states('sensor.bolletta_saldo_octopus') }} €

  - alias: "Frarik — Bolletta: Alert Costo Giornaliero"
    trigger:
      - platform: time
        at: "22:00:00"
    condition:
      - condition: template
        value_template: >
          {{ states('sensor.bolletta_giornaliera') | float(0) > states('input_number.bolletta_soglia_costo_giornaliero') | float(5) }}
      - condition: state
        entity_id: input_boolean.bolletta_notify_push_giornaliero
        state: "on"
    action:
      - service: notify.frarik_bolletta
        data:
          title: "Costo giornaliero elevato"
          message: >
            Oggi: {{ states('sensor.bolletta_giornaliera') }} €
            Consumo: {{ states('sensor.bolletta_energia_giornaliera_safe') }} kWh

  - alias: "Frarik — Bolletta: Alert Soglia Potenza"
    trigger:
      - platform: numeric_state
        entity_id: *sensore_potenza_bolletta
        above: input_number.bolletta_soglia_lavoro_w
        for:
          seconds: "{{ states('input_number.bolletta_ritardo_soglia_sec') | int(60) }}"
    condition:
      - condition: time
        after: input_datetime.bolletta_orario_inizio_notifiche_soglia
        before: input_datetime.bolletta_orario_fine_notifiche_soglia
      - condition: state
        entity_id: input_boolean.bolletta_notify_push_soglia
        state: "on"
    action:
      - service: notify.frarik_bolletta
        data:
          title: "Consumo elevato"
          message: >
            Soglia {{ states('input_number.bolletta_soglia_lavoro_w') | int }} W superata!
            Costo stimato oggi: {{ states('sensor.bolletta_giornaliera') }} €

  - alias: "Frarik — Bolletta: Report Mensile"
    trigger:
      - platform: time
        at: "09:00:00"
    condition:
      - condition: template
        value_template: "{{ now().day == 1 }}"
      - condition: state
        entity_id: input_boolean.bolletta_notify_push_mensile
        state: "on"
    action:
      - service: notify.frarik_bolletta
        data:
          title: "Report Bolletta Mese Scorso"
          message: >
            {% set m = now().month - 1 %}{% if m == 0 %}{% set m = 12 %}{% endif %}
            {% set mm = '%02d' | format(m) %}
            Bolletta: {{ states('input_number.bolletta_storico_mese_curr_' ~ mm) }} €
            Consumo: {{ states('input_number.bolletta_storico_kwh_curr_' ~ mm) }} kWh
            Saldo Octopus: {{ states('sensor.bolletta_saldo_octopus') }} €

  - alias: "Frarik — Bolletta: Archiviazione Anno Nuovo"
    trigger:
      - platform: time
        at: "23:59:30"
    condition:
      - condition: template
        value_template: "{{ now().month == 12 and now().day == 31 }}"
    action:
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_mese_prev_01 }
        data: { value: "{{ states('input_number.bolletta_storico_mese_curr_01') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_mese_prev_02 }
        data: { value: "{{ states('input_number.bolletta_storico_mese_curr_02') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_mese_prev_03 }
        data: { value: "{{ states('input_number.bolletta_storico_mese_curr_03') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_mese_prev_04 }
        data: { value: "{{ states('input_number.bolletta_storico_mese_curr_04') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_mese_prev_05 }
        data: { value: "{{ states('input_number.bolletta_storico_mese_curr_05') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_mese_prev_06 }
        data: { value: "{{ states('input_number.bolletta_storico_mese_curr_06') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_mese_prev_07 }
        data: { value: "{{ states('input_number.bolletta_storico_mese_curr_07') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_mese_prev_08 }
        data: { value: "{{ states('input_number.bolletta_storico_mese_curr_08') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_mese_prev_09 }
        data: { value: "{{ states('input_number.bolletta_storico_mese_curr_09') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_mese_prev_10 }
        data: { value: "{{ states('input_number.bolletta_storico_mese_curr_10') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_mese_prev_11 }
        data: { value: "{{ states('input_number.bolletta_storico_mese_curr_11') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_mese_prev_12 }
        data: { value: "{{ states('sensor.bolletta_mensile') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_kwh_prev_01 }
        data: { value: "{{ states('input_number.bolletta_storico_kwh_curr_01') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_kwh_prev_02 }
        data: { value: "{{ states('input_number.bolletta_storico_kwh_curr_02') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_kwh_prev_03 }
        data: { value: "{{ states('input_number.bolletta_storico_kwh_curr_03') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_kwh_prev_04 }
        data: { value: "{{ states('input_number.bolletta_storico_kwh_curr_04') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_kwh_prev_05 }
        data: { value: "{{ states('input_number.bolletta_storico_kwh_curr_05') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_kwh_prev_06 }
        data: { value: "{{ states('input_number.bolletta_storico_kwh_curr_06') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_kwh_prev_07 }
        data: { value: "{{ states('input_number.bolletta_storico_kwh_curr_07') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_kwh_prev_08 }
        data: { value: "{{ states('input_number.bolletta_storico_kwh_curr_08') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_kwh_prev_09 }
        data: { value: "{{ states('input_number.bolletta_storico_kwh_curr_09') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_kwh_prev_10 }
        data: { value: "{{ states('input_number.bolletta_storico_kwh_curr_10') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_kwh_prev_11 }
        data: { value: "{{ states('input_number.bolletta_storico_kwh_curr_11') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.bolletta_storico_kwh_prev_12 }
        data: { value: "{{ states('sensor.bolletta_energia_mensile_safe') | float(0) }}" }
      - service: notify.frarik_bolletta
        data:
          title: "Frarik Bolletta — Anno Archiviato"
          message: "Anno {{ now().year }} archiviato."

  - alias: "Frarik — Bolletta: Alert Scadenza Octopus"
    trigger:
      - platform: numeric_state
        entity_id: sensor.bolletta_giorni_scadenza_offerta
        below: 61
    condition:
      - condition: template
        value_template: "{{ states('sensor.bolletta_giorni_scadenza_offerta') | int(999) in [60,30,15,7] }}"
    action:
      - service: notify.frarik_bolletta
        data:
          title: "Scadenza Offerta Octopus"
          message: >
            Mancano {{ states('sensor.bolletta_giorni_scadenza_offerta') }} giorni.
            Ricordati di rinnovare l'offerta!
`;

  function _bBuildPkg(potenza, saldo, scadenza, tariffa, kw, push) {
    var ind = '          ';
    var pushLines = (push && push.length)
      ? push.map(function(p) { return ind + '- service: ' + p; }).join('\n')
      : ind + '- service: mobile_app_smartphone';
    var yaml = _BOLL_PKG_YAML
      .split('IL_TUO_SENSORE_POTENZA_BOLLETTA').join(potenza || 'sensor.consumo_istantaneo')
      .split('IL_TUO_SENSORE_SALDO_OCTOPUS').join(saldo || 'sensor.vuoto')
      .split('IL_TUO_SENSORE_SCADENZA_OCTOPUS').join(scadenza || 'sensor.vuoto')
      .split('IL_TUA_TARIFFA_KWHE').join((parseFloat(tariffa) || 0.09).toFixed(6))
      .split('IL_TUA_POTENZA_KW').join(String(parseFloat(kw) || 4.5));
    yaml = yaml.replace(ind + '- service: IL_TUO_MOBILE_APP_1', pushLines);
    return yaml;
  }

  function _bOpenWizard(hass, onDone) {
    var states = (hass && hass.states) || (window.frarikHass && window.frarikHass.states) || {};
    var allIds = Object.keys(states).sort();
    var sensorIds = allIds.filter(function(id) { return /^sensor\./.test(id); });
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(_BOLL_WIZ_KEY) || 'null'); } catch(e) {}
    var pushRows = (saved && saved.push && saved.push.length) ? saved.push.slice() : [''];

    var host = document.createElement('div');
    var sr = host.attachShadow({mode: 'open'});
    document.body.appendChild(host);
    function destroy() { try { document.body.removeChild(host); } catch(e) {} }

    function setupAC(inp, drop, ids) {
      if (!inp || !drop) return;
      function show() {
        var q = inp.value.toLowerCase().trim();
        var hits = (q ? ids.filter(function(id) { return id.toLowerCase().includes(q); }) : ids).slice(0, 50);
        if (!hits.length) { drop.style.display = 'none'; return; }
        drop.innerHTML = hits.map(function(id) { return '<div class="wd-item" data-pick="' + id + '">' + id + '</div>'; }).join('');
        drop.style.display = 'block';
        drop.querySelectorAll('[data-pick]').forEach(function(row) {
          row.addEventListener('mousedown', function(ev) { ev.preventDefault(); inp.value = row.getAttribute('data-pick'); drop.style.display = 'none'; });
          row.addEventListener('mouseover', function() { row.style.background = 'rgba(255,255,255,.08)'; });
          row.addEventListener('mouseout',  function() { row.style.background = ''; });
        });
      }
      inp.addEventListener('focus', show);
      inp.addEventListener('input', show);
      inp.addEventListener('blur', function() { setTimeout(function() { drop.style.display = 'none'; }, 200); });
    }

    function multiRows(rows, cls, placeholder) {
      return rows.map(function(v, i) {
        return '<div class="wd-push-row"><div style="position:relative;flex:1"><input class="wd-inp ' + cls + '" type="text" autocomplete="off" placeholder="' + placeholder + '" value="' + (v || '').replace(/"/g, '&quot;') + '"><div class="wd-drop"></div></div><button class="wd-rm" data-rm="' + i + '">✕</button></div>';
      }).join('');
    }

    function renderWiz() {
      sr.innerHTML = '<style>'
        + ':host{all:initial;font-family:system-ui,sans-serif}'
        + '.wd-bd{position:fixed;inset:0;z-index:200000;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);display:flex;align-items:flex-end}'
        + '.wd-panel{width:100%;max-height:88vh;display:flex;flex-direction:column;background:#080f18;border:1px solid rgba(6,182,212,.3);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.8);color:#fff;overflow:hidden;animation:wUp .22s cubic-bezier(.32,1.12,.56,1)}'
        + '@keyframes wUp{from{transform:translateY(100%)}to{transform:translateY(0)}}'
        + '.wd-hdr{display:flex;align-items:center;gap:10px;padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}'
        + '.wd-ico{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;background:rgba(6,182,212,.15);border:1px solid rgba(6,182,212,.3);flex-shrink:0}'
        + '.wd-tit{font-size:14px;font-weight:800}'
        + '.wd-sub{font-size:11px;color:rgba(255,255,255,.45);margin-top:1px}'
        + '.wd-x{margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none}'
        + '.wd-body{flex:1;overflow-y:auto;padding:16px;scrollbar-width:none;display:flex;flex-direction:column;gap:14px}'
        + '.wd-body::-webkit-scrollbar{display:none}'
        + '.wd-sec{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#06b6d4;padding-bottom:5px;border-bottom:1px solid rgba(6,182,212,.18);margin-bottom:10px}'
        + '.wd-lbl{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px}'
        + '.wd-frow{position:relative;margin-bottom:10px}'
        + '.wd-inp{width:100%;padding:9px 11px;border-radius:10px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none}'
        + '.wd-inp:focus{border-color:rgba(6,182,212,.5)}'
        + '.wd-drop{position:absolute;left:0;right:0;top:100%;z-index:10;max-height:150px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 9px 9px;display:none}'
        + '.wd-item{padding:5px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#e2e8f0}'
        + '.wd-push-row{display:flex;gap:6px;margin-bottom:6px}'
        + '.wd-push-row .wd-inp{flex:1}'
        + '.wd-rm{width:30px;height:38px;border-radius:8px;background:rgba(255,255,255,.07);border:none;color:#fff;cursor:pointer;font-size:14px;flex-shrink:0}'
        + '.wd-add{padding:6px 12px;border-radius:8px;background:rgba(6,182,212,.1);border:1px solid rgba(6,182,212,.25);color:#06b6d4;font-size:11px;font-weight:700;cursor:pointer}'
        + '.wd-note{font-size:11px;color:rgba(255,255,255,.4);line-height:1.5;margin:0 0 10px}'
        + '.wd-foot{padding:12px 16px;border-top:1px solid rgba(255,255,255,.07);display:flex;gap:8px;flex-shrink:0}'
        + '.wd-cancel{flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:700;font-size:13px;background:rgba(255,255,255,.1);color:#fff}'
        + '.wd-install{flex:2;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;font-size:13px;background:#06b6d4;color:#000}'
        + '.wd-loading{opacity:.6;pointer-events:none}'
        + '</style>'
        + '<div class="wd-bd" id="wd-bd">'
        + '<div class="wd-panel">'
        + '<div class="wd-hdr"><div class="wd-ico">⚡</div>'
        + '<div><div class="wd-tit">Installa PKG Bolletta</div><div class="wd-sub">frarik_bolletta.yaml → config/packages/frarik/</div></div>'
        + '<button class="wd-x" id="wd-x">✕</button></div>'
        + '<div class="wd-body">'

        + '<div><div class="wd-sec">Sensori</div>'
        + '<div class="wd-lbl">Sensore Potenza Istantanea Casa (W)</div>'
        + '<p class="wd-note">Sensore che misura i Watt istantanei dell\'intera casa (es. Shelly EM, contatore BUS)</p>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-potenza" type="text" autocomplete="off" placeholder="sensor.consumo_istantaneo" value="' + ((saved && saved.potenza) || '').replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-potenza"></div></div>'
        + '<div class="wd-lbl">Sensore Saldo Octopus Energy (€)</div>'
        + '<p class="wd-note">Lascia il default se usi Octopus Energy. Metti il sensore corretto o "sensor.vuoto" se non usi Octopus.</p>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-saldo" type="text" autocomplete="off" placeholder="sensor.a_563293ae_saldo_elettricita" value="' + ((saved && saved.saldo) || '').replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-saldo"></div></div>'
        + '<div class="wd-lbl">Sensore Giorni Scadenza Offerta</div>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-scad" type="text" autocomplete="off" placeholder="sensor.a_563293ae_giorni_alla_scadenza_contratto_elettrico" value="' + ((saved && saved.scadenza) || '').replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-scad"></div></div>'
        + '</div>'

        + '<div><div class="wd-sec">Contratto</div>'
        + '<div class="wd-lbl">Tariffa Energia (€/kWh)</div>'
        + '<p class="wd-note">Prezzo fisso del tuo contratto, es. 0.09 per Octopus Fissa 12M</p>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-tariffa" type="number" step="0.000001" min="0" max="1" placeholder="0.090000" value="' + ((saved && saved.tariffa) || '') + '"></div>'
        + '<div class="wd-lbl">Potenza Impegnata (kW)</div>'
        + '<p class="wd-note">La potenza contrattuale. Valori comuni: 3.0 / 4.5 / 6.0</p>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-kw" type="number" step="0.5" min="1.5" max="15" placeholder="4.5" value="' + ((saved && saved.kw) || '') + '"></div>'
        + '</div>'

        + '<div><div class="wd-sec">Notifiche Push</div>'
        + '<p class="wd-note">mobile_app dei dispositivi che ricevono le notifiche push (es. <code>mobile_app_iphone</code>)</p>'
        + '<div id="push-rows">' + multiRows(pushRows, 'push-inp', 'mobile_app_...') + '</div>'
        + '<button class="wd-add" id="push-add">+ Aggiungi dispositivo</button>'
        + '</div>'

        + '</div>'
        + '<div class="wd-foot">'
        + '<button class="wd-cancel" id="wd-cancel">Annulla</button>'
        + '<button class="wd-install" id="wd-install">📦 Installa PKG</button>'
        + '</div>'
        + '</div>'
        + '</div>';

      sr.getElementById('wd-x').addEventListener('click', destroy);
      sr.getElementById('wd-cancel').addEventListener('click', destroy);
      sr.getElementById('wd-bd').addEventListener('click', function(e) { if (e.target === sr.getElementById('wd-bd')) destroy(); });

      sr.getElementById('push-rows').addEventListener('click', function(e) {
        var btn = e.target.closest('[data-rm]'); if (!btn) return;
        Array.from(sr.querySelectorAll('.push-inp')).forEach(function(i, idx) { pushRows[idx] = i.value; });
        pushRows.splice(+btn.dataset.rm, 1);
        if (!pushRows.length) pushRows.push('');
        renderWiz();
      });
      sr.getElementById('push-add').addEventListener('click', function() {
        Array.from(sr.querySelectorAll('.push-inp')).forEach(function(i, idx) { pushRows[idx] = i.value; });
        pushRows.push('');
        renderWiz();
      });

      setupAC(sr.getElementById('f-potenza'), sr.getElementById('d-potenza'), sensorIds);
      setupAC(sr.getElementById('f-saldo'),   sr.getElementById('d-saldo'),   sensorIds);
      setupAC(sr.getElementById('f-scad'),    sr.getElementById('d-scad'),    sensorIds);
      sr.querySelectorAll('.push-inp').forEach(function(inp) { setupAC(inp, inp.parentElement.querySelector('.wd-drop'), []); });

      sr.getElementById('wd-install').addEventListener('click', function() {
        var potenza  = sr.getElementById('f-potenza').value.trim();
        var saldo    = sr.getElementById('f-saldo').value.trim();
        var scadenza = sr.getElementById('f-scad').value.trim();
        var tariffa  = sr.getElementById('f-tariffa').value.trim();
        var kw       = sr.getElementById('f-kw').value.trim();
        var push     = Array.from(sr.querySelectorAll('.push-inp')).map(function(i) { return i.value.trim(); }).filter(Boolean);
        try { localStorage.setItem(_BOLL_WIZ_KEY, JSON.stringify({potenza:potenza, saldo:saldo, scadenza:scadenza, tariffa:tariffa, kw:kw, push:push})); } catch(e) {}
        var yaml = _bBuildPkg(potenza, saldo, scadenza, tariffa, kw, push);
        var m = location.pathname.match(/^(.*\/api\/hassio_ingress\/[^/]+)/);
        var base = location.origin + (m ? m[1] : '');
        var btn = sr.getElementById('wd-install');
        btn.classList.add('wd-loading');
        btn.textContent = 'Installazione…';
        fetch(base + '/api/frarik/pkg/install', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({name: 'frarik/frarik_bolletta.yaml', content: yaml})
        }).then(function(r) { return r.json().then(function(j) { return {r:r,j:j}; }); })
          .then(function(res) {
            destroy();
            if (res.r.ok && res.j.ok) {
              try { if (typeof window.showToast === 'function') window.showToast('📦 PKG Bolletta installato! Riavvia HA.'); } catch(e) {}
              if (typeof onDone === 'function') onDone();
            } else {
              try { if (typeof window.showToast === 'function') window.showToast('⚠️ Errore: ' + ((res.j && res.j.error) || '')); } catch(e) {}
            }
          }).catch(function() {
            destroy();
            try { if (typeof window.showToast === 'function') window.showToast('⚠️ Errore connessione al PKG install'); } catch(e) {}
          });
      });
    }

    renderWiz();
  }

  // ── registration ───────────────────────────────────────────────────────────
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[_bId] = {
    id:      _bId,
    name:    'Bolletta',
    icon:    '⚡',
    version: _bVer,
    desc:    'Calcolo bolletta elettrica con tariffe ARERA auto-aggiornate, storico 12 mesi, proiezione e integrazione Octopus.',
    frarik_pkg_check: 'sensor.frarik_bolletta_versione',
    frarik_pkg_id:    'frarik_bolletta',
    frarik_pkg_version: '1.0',

    render: function(card) {
      return _bRender(card);
    },

    mount: function(card, hass, el) {
      _bMount(card, el);
    },

    update: function(card, hass, el) {
      var h = _bH(), c = _bCfg(card);
      var sig = _bSig(h, c);
      if ((el._bLastSig || '') !== sig) {
        el._bLastSig = sig;
        el.innerHTML = _bRender(card);
        _bMount(card, el);
      }
    },

    configure: function(card) {
      _bOpenCfg(card);
    },

    openWizard: function(hass, onDone) {
      _bOpenWizard(hass, onDone);
    }
  };
})();
