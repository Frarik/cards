/* frarik-version: 5.4 */
(function () {
  'use strict';

  var COL  = '#fbbf24';
  var RGB  = '251,191,36';
  var MESI  = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
  var MESIL = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  var GIORNI  = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'];
  var GIORNIL = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
  var MESI_K  = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];

  function H() { try { if (typeof window.frarikHass === 'function') { var h = window.frarikHass(); if (h && h.states) return h; } } catch(e) {} return null; }
  function S(h, id) { var s = h && id && h.states && h.states[id]; return s ? String(s.state) : ''; }
  function N(v) { var x = parseFloat(String(v != null ? v : '').replace(',','.')); return isNaN(x) ? 0 : x; }
  function callSvc(domain, service, data) { try { var h = H(); if (h && h.callService) h.callService(domain, service, data || {}); } catch(e) {} }
  function setNum(eid, val) { var v = parseFloat(val); if (!isNaN(v)) callSvc('input_number', 'set_value', {entity_id: eid, value: v}); }
  function isOn(h, eid) { return S(h, eid) === 'on'; }

  /* ── POPUP HELPERS ── */
  function mkOv(html, closeId) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)';
    ov.innerHTML = html;
    document.body.appendChild(ov);
    var close = function() { try { document.body.removeChild(ov); } catch(e) {} };
    var btn = ov.querySelector('#' + closeId); if (btn) btn.addEventListener('click', close);
    ov.addEventListener('click', function(e) { if (e.target === ov) close(); });
    ov._close = close;
    return ov;
  }

  var POP_CSS = '<style>@keyframes fcUP{from{transform:translateY(100%)}to{transform:translateY(0)}}.fcpc{overflow-y:auto;scrollbar-width:none}.fcpc::-webkit-scrollbar{display:none}</style>';

  function popShell(icon, title, sub, closeId, content) {
    return POP_CSS
      + '<div style="width:100%;max-height:86vh;display:flex;flex-direction:column;background:#060d14;border:1px solid rgba(' + RGB + ',.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:fcUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      + '<div style="display:flex;align-items:center;gap:10px;padding:13px 15px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
      + '<div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(' + RGB + ',.15);border:1px solid rgba(' + RGB + ',.3)">' + icon + '</div>'
      + '<div><div style="font-size:14px;font-weight:800;color:#fff">' + title + '</div><div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:1px">' + sub + '</div></div>'
      + '<button id="' + closeId + '" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none;flex-shrink:0">✕</button>'
      + '</div>'
      + '<div class="fcpc" style="flex:1;overflow-y:auto;padding:13px 15px;display:flex;flex-direction:column;gap:0">' + content + '</div>'
      + '</div>';
  }

  function row(lbl, val, col) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
      + '<span style="font-size:12px;color:#fff">' + lbl + '</span>'
      + '<span style="font-size:13px;font-weight:800;color:' + (col || '#fff') + '">' + val + '</span>'
      + '</div>';
  }

  function sec(lbl) {
    return '<div style="font-size:10px;font-weight:700;color:' + COL + ';text-transform:uppercase;letter-spacing:.06em;margin:12px 0 4px;padding-bottom:3px;border-bottom:1px solid rgba(' + RGB + ',.2)">' + lbl + '</div>';
  }

  /* ── POPUP: DETTAGLIO ── */
  function openDettaglio() {
    var h = H();
    var now = new Date();
    var kwhM     = N(S(h, 'sensor.frarik_bolletta_consumo_mensile'));
    var kwhTot   = N(S(h, 'sensor.frarik_bolletta_consumo_totale_casa'));
    var costoM   = N(S(h, 'sensor.frarik_bolletta_mese_corrente'));
    var prevM    = N(S(h, 'sensor.frarik_bolletta_previsione_costo_mese'));
    var pKwh     = N(S(h, 'sensor.frarik_bolletta_prezzo_unico_variabile'));
    var fissi    = N(S(h, 'sensor.frarik_bolletta_totale_fissi_mese'));
    var kwhAnno  = N(S(h, 'sensor.frarik_bolletta_consumo_annuale'));
    var totAnno  = N(S(h, 'sensor.frarik_bolletta_totale_anno_eur'));
    var ivaPerc  = N(S(h, 'input_number.frarik_bolletta_iva_perc')) || 10;
    var bonus    = N(S(h, 'input_number.frarik_bolletta_bonus_bolletta'));
    var canone   = N(S(h, 'input_number.frarik_bolletta_canone_rai')) || 9;
    var haFV     = isOn(h, 'input_boolean.frarik_bolletta_ha_fotovoltaico');
    var haBatt   = isOn(h, 'input_boolean.frarik_bolletta_ha_batteria');
    var fvKwh    = N(S(h, 'input_number.frarik_bolletta_autoconsumo_fv'));
    var battKwh  = N(S(h, 'input_number.frarik_bolletta_autoconsumo_batt'));
    var potenza  = N(S(h, 'input_number.frarik_bolletta_potenza_impegnata')) || 4.5;
    var soglia   = N(S(h, 'input_number.frarik_bolletta_soglia_power')) || 3000;

    var imponibile  = (kwhM * pKwh) + fissi;
    var impIva      = imponibile * (ivaPerc / 100);
    var mNum        = now.getMonth() + 1;
    var canoneEff   = (mNum >= 1 && mNum <= 10) ? canone : 0;

    var content = sec('Consumi del Mese')
      + row('⚡ kWh dalla rete', kwhM.toFixed(1) + ' kWh')
      + (haFV && fvKwh > 0 ? row('☀️ kWh da pannelli (FV)', fvKwh.toFixed(1) + ' kWh', COL) : '')
      + (haBatt && battKwh > 0 ? row('🔋 kWh da batteria', battKwh.toFixed(1) + ' kWh', '#4ade80') : '')
      + row('🏠 Consumo totale casa', kwhTot.toFixed(1) + ' kWh', COL)

      + sec('Calcolo Bolletta')
      + row('⚡ Costo energia variabile', (kwhM * pKwh).toFixed(2) + ' €', COL)
      + row('📋 Costi fissi mensili', fissi.toFixed(2) + ' €')
      + row('📊 Imponibile totale', imponibile.toFixed(2) + ' €')
      + row('💸 IVA ' + ivaPerc.toFixed(0) + '%', impIva.toFixed(2) + ' €')
      + (canoneEff > 0 ? row('📺 Canone RAI', canoneEff.toFixed(2) + ' €') : '')
      + (bonus > 0 ? row('🎁 Bonus / Sconto', '− ' + bonus.toFixed(2) + ' €', '#4ade80') : '')
      + '<div style="display:flex;justify-content:space-between;align-items:center;background:rgba(' + RGB + ',.12);border-radius:10px;padding:12px 14px;margin:10px 0">'
      + '<span style="font-size:14px;font-weight:800;color:' + COL + '">TOTALE MESE</span>'
      + '<span style="font-size:20px;font-weight:900;color:' + COL + '">' + costoM.toFixed(2) + ' €</span>'
      + '</div>'
      + row('🔮 Previsione fine mese', prevM.toFixed(2) + ' €', '#fb923c')
      + row('💰 Prezzo medio per kWh', pKwh.toFixed(5) + ' €/kWh')

      + sec('Contratto')
      + row('⚡ Potenza impegnata', potenza.toFixed(1) + ' kW')
      + row('🚦 Soglia allarme potenza', (soglia / 1000).toFixed(1) + ' kW')

      + sec('Anno ' + now.getFullYear())
      + row('⚡ kWh totali anno', kwhAnno.toFixed(1) + ' kWh')
      + row('💰 Spesa totale anno', totAnno.toFixed(2) + ' €', COL);

    mkOv(popShell('🧾', 'Dettaglio Bolletta', MESIL[now.getMonth()] + ' ' + now.getFullYear(), 'bp-det-close', content), 'bp-det-close');
  }

  /* ── POPUP: SIMULATORE ── */
  function openSimulatore() {
    var h = H();
    var now = new Date();
    var pKwh    = N(S(h, 'sensor.frarik_bolletta_prezzo_unico_variabile'));
    var fissi   = N(S(h, 'sensor.frarik_bolletta_totale_fissi_mese'));
    var ivaPerc = N(S(h, 'input_number.frarik_bolletta_iva_perc')) || 10;
    var canone  = N(S(h, 'input_number.frarik_bolletta_canone_rai')) || 9;
    var haFV    = isOn(h, 'input_boolean.frarik_bolletta_ha_fotovoltaico');
    var haBatt  = isOn(h, 'input_boolean.frarik_bolletta_ha_batteria');
    var mNum    = now.getMonth() + 1;
    var canoneAutoOn = (mNum >= 1 && mNum <= 10);

    /* valori di partenza dal mese corrente */
    var kwhInit   = Math.round(N(S(h, 'sensor.frarik_bolletta_consumo_mensile'))) || 0;
    var bonusInit = N(S(h, 'input_number.frarik_bolletta_bonus_bolletta'));
    var fvInit    = haFV   ? N(S(h, 'input_number.frarik_bolletta_autoconsumo_fv'))   : 0;
    var battInit  = haBatt ? N(S(h, 'input_number.frarik_bolletta_autoconsumo_batt')) : 0;

    var iSt = 'width:100%;padding:10px 13px;border-radius:10px;background:#0b1422;color:#fff;border:1px solid rgba(255,255,255,.18);font-size:15px;font-family:monospace;box-sizing:border-box;outline:none;text-align:right';
    var lSt = 'font-size:11px;font-weight:700;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:5px';

    function simRow(lbl, val, col, small) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:' + (small ? '5px' : '7px') + ' 0;border-bottom:1px solid rgba(255,255,255,.05)">'
        + '<span style="font-size:' + (small ? '11' : '12') + 'px;color:' + (small ? 'rgba(255,255,255,.55)' : '#fff') + '">' + lbl + '</span>'
        + '<span style="font-size:' + (small ? '12' : '13') + 'px;font-weight:800;color:' + (col || '#fff') + '">' + val + '</span>'
        + '</div>';
    }

    function calcAndRender(kwh, bonus, fvKwh, battKwh, canOn) {
      var kwhRete = Math.max(0, kwh - (haFV ? fvKwh : 0) - (haBatt ? battKwh : 0));
      var compVar  = kwhRete * pKwh;
      var impon    = compVar + fissi;
      var iva      = impon * (ivaPerc / 100);
      var canEff   = canOn ? canone : 0;
      var totale   = impon + iva + canEff - bonus;
      var cEff     = kwh > 0 ? totale / kwh : 0;
      return {kwhRete: kwhRete, compVar: compVar, impon: impon, iva: iva, canEff: canEff, bonus: bonus, totale: totale, cEff: cEff};
    }

    var canOn = canoneAutoOn;
    var togSt = function(on) {
      return 'padding:5px 16px;border-radius:20px;border:none;cursor:pointer;font-size:11px;font-weight:800;background:' +
        (on ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.07)') + ';color:' + (on ? '#4ade80' : 'rgba(255,255,255,.4)') + ';flex-shrink:0';
    };

    var inputsHtml = sec('Parametri Simulazione')
      /* kWh */
      + '<div style="margin-bottom:14px">'
      + '<label style="' + lSt + '">⚡ kWh consumati nel mese</label>'
      + '<div style="display:flex;align-items:center;gap:10px">'
      + '<input id="sim-kwh-range" type="range" min="0" max="800" step="1" value="' + kwhInit + '" style="flex:1;accent-color:' + COL + ';cursor:pointer">'
      + '<input id="sim-kwh" type="number" min="0" max="9999" step="1" value="' + kwhInit + '" style="' + iSt + ';width:90px;flex-shrink:0">'
      + '</div></div>'
      /* Bonus */
      + '<div style="margin-bottom:14px">'
      + '<label style="' + lSt + '">🎁 Bonus / Sconto (€)</label>'
      + '<input id="sim-bonus" type="number" min="0" max="999" step="0.01" value="' + bonusInit.toFixed(2) + '" style="' + iSt + '">'
      + '</div>'
      /* Canone RAI */
      + '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-top:1px solid rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06);margin-bottom:14px">'
      + '<div><div style="font-size:13px;font-weight:700;color:#fff">📺 Canone RAI</div>'
      + '<div style="font-size:10px;color:rgba(255,255,255,.35);margin-top:2px">Auto: ' + (canoneAutoOn ? 'incluso (mesi gen–ott)' : 'escluso (mesi nov–dic)') + ' · ' + canone.toFixed(2) + ' €</div></div>'
      + '<button id="sim-canone-tog" style="' + togSt(canOn) + '">' + (canOn ? '✅ Incluso' : 'Escluso') + '</button>'
      + '</div>'
      /* FV */
      + (haFV ? '<div style="margin-bottom:14px"><label style="' + lSt + '">☀️ kWh da Pannelli FV (sottratti dalla rete)</label><input id="sim-fv" type="number" min="0" max="9999" step="1" value="' + fvInit.toFixed(0) + '" style="' + iSt + '"></div>' : '')
      /* Batteria */
      + (haBatt ? '<div style="margin-bottom:14px"><label style="' + lSt + '">🔋 kWh da Batteria (sottratti dalla rete)</label><input id="sim-batt" type="number" min="0" max="9999" step="1" value="' + battInit.toFixed(0) + '" style="' + iSt + '"></div>' : '');

    var resultPlaceholder = '<div id="sim-result"></div>';

    var ov = mkOv(popShell('🧮', 'Simulatore Bolletta', 'Stima costo mensile in tempo reale', 'bp-sim-close', inputsHtml + resultPlaceholder), 'bp-sim-close');

    function g(id) { var e = ov.querySelector('#' + id); return e ? parseFloat(e.value) || 0 : 0; }

    function renderResult() {
      var kwh   = g('sim-kwh');
      var bonus = g('sim-bonus');
      var fvKwh = haFV   ? g('sim-fv')   : 0;
      var bKwh  = haBatt ? g('sim-batt') : 0;
      var r = calcAndRender(kwh, bonus, fvKwh, bKwh, canOn);
      var res = ov.querySelector('#sim-result');
      if (!res) return;

      var totColor = r.totale > 0 ? COL : '#4ade80';
      res.innerHTML = '<div style="background:rgba(' + RGB + ',.08);border:1px solid rgba(' + RGB + ',.2);border-radius:16px;padding:18px 16px;margin-top:4px">'
        /* Big total */
        + '<div style="text-align:center;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.08)">'
        + '<div style="font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px">Bolletta Simulata</div>'
        + '<div style="font-size:52px;font-weight:900;color:' + totColor + ';line-height:1;letter-spacing:-2px">'
        + r.totale.toFixed(2).replace('.', ',')
        + '<span style="font-size:20px;font-weight:600;color:rgba(251,191,36,.6);margin-left:4px">€</span></div>'
        + (kwh > 0 ? '<div style="font-size:11px;color:rgba(255,255,255,.35);margin-top:6px">Costo effettivo: <strong style="color:' + COL + '">' + (r.cEff * 100).toFixed(3) + ' c€/kWh</strong></div>' : '')
        + '</div>'
        /* Breakdown */
        + simRow('⚡ Energia variabile (' + r.kwhRete.toFixed(0) + ' kWh × ' + pKwh.toFixed(4) + ' €)', r.compVar.toFixed(2) + ' €', COL)
        + simRow('📋 Costi fissi mensili', r.impon > 0 ? fissi.toFixed(2) + ' €' : '—')
        + simRow('📊 Imponibile totale', r.impon.toFixed(2) + ' €', 'rgba(255,255,255,.7)')
        + simRow('💸 IVA ' + ivaPerc.toFixed(0) + '%', r.iva.toFixed(2) + ' €')
        + (canOn ? simRow('📺 Canone RAI', r.canEff.toFixed(2) + ' €') : simRow('📺 Canone RAI', 'escluso', 'rgba(255,255,255,.3)', true))
        + (bonus > 0 ? simRow('🎁 Bonus / Sconto', '− ' + bonus.toFixed(2) + ' €', '#4ade80') : '')
        + ((haFV && fvKwh > 0) ? simRow('☀️ kWh FV (rete risparmiata)', '− ' + fvKwh.toFixed(0) + ' kWh', '#fbbf24', true) : '')
        + ((haBatt && bKwh > 0) ? simRow('🔋 kWh Batteria', '− ' + bKwh.toFixed(0) + ' kWh', '#4ade80', true) : '')
        + '</div>';
    }

    /* bind all inputs → live update */
    var kwhNum   = ov.querySelector('#sim-kwh');
    var kwhRange = ov.querySelector('#sim-kwh-range');
    var togBtn   = ov.querySelector('#sim-canone-tog');

    if (kwhNum && kwhRange) {
      kwhNum.addEventListener('input', function() { kwhRange.value = kwhNum.value; renderResult(); });
      kwhRange.addEventListener('input', function() { kwhNum.value = kwhRange.value; renderResult(); });
    }
    ['#sim-bonus', '#sim-fv', '#sim-batt'].forEach(function(sel) {
      var el = ov.querySelector(sel); if (el) el.addEventListener('input', renderResult);
    });
    if (togBtn) {
      togBtn.addEventListener('click', function() {
        canOn = !canOn;
        togBtn.textContent = canOn ? '✅ Incluso' : 'Escluso';
        togBtn.style.cssText = togSt(canOn);
        renderResult();
      });
    }

    renderResult();
  }

  /* ── POPUP: STORICO ── */
  function openStorico() {
    var h = H(), now = new Date(), curM = now.getMonth() + 1, yr = now.getFullYear();
    var archKwh = [], archEur = [], prevKwh = [], prevEur = [];
    for (var i = 0; i < 12; i++) {
      var mk = MESI_K[i];
      var isCurMonth = (i + 1) === curM;
      archKwh.push(isCurMonth ? N(S(h, 'sensor.frarik_bolletta_consumo_totale_casa')) : N(S(h, 'sensor.frarik_bolletta_archivio_' + mk + '_kwh')));
      archEur.push(isCurMonth ? N(S(h, 'sensor.frarik_bolletta_mese_corrente')) : N(S(h, 'sensor.frarik_bolletta_archivio_' + mk + '_euro')));
      prevKwh.push(N(S(h, 'input_number.frarik_bolletta_storico_prec_' + mk + '_kwh')));
      prevEur.push(N(S(h, 'input_number.frarik_bolletta_storico_prec_' + mk + '_eur')));
    }
    var annoKwh = N(S(h, 'sensor.frarik_bolletta_totale_anno_kwh'));
    var annoEur = N(S(h, 'sensor.frarik_bolletta_totale_anno_eur'));

    /* 12-month bar chart */
    var maxV = Math.max.apply(null, archEur.concat(prevEur).concat([1]));
    function barH(v, col) {
      var pct = Math.max(4, Math.round((v / maxV) * 90));
      return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0">'
        + '<div style="font-size:8px;color:rgba(255,255,255,.45);height:12px;display:flex;align-items:flex-end">' + (v > 0 ? v.toFixed(0) : '') + '</div>'
        + '<div style="width:100%;border-radius:3px 3px 0 0;background:' + col + ';height:' + pct + 'px;min-height:3px"></div>'
        + '</div>';
    }

    var barsHtml = '<div style="display:flex;align-items:flex-end;gap:3px;height:118px;padding:6px 0 0">';
    for (var j = 0; j < 12; j++) {
      var isCur = (j + 1) === curM;
      barsHtml += '<div style="flex:1;display:flex;flex-direction:column;gap:1px;align-items:center;min-width:0">'
        + '<div style="display:flex;align-items:flex-end;gap:1px;width:100%;height:100px">'
        + barH(prevEur[j], 'rgba(255,255,255,.18)')
        + barH(archEur[j], isCur ? COL : 'rgba(' + RGB + ',.45)')
        + '</div>'
        + '<div style="font-size:7.5px;color:rgba(255,255,255,' + (isCur ? '1' : '.35') + ');margin-top:2px;font-weight:' + (isCur ? '800' : '400') + '">' + MESI[j] + '</div>'
        + '</div>';
    }
    barsHtml += '</div>';
    barsHtml += '<div style="display:flex;gap:14px;margin-top:5px;padding:6px 0;border-top:1px solid rgba(255,255,255,.06)">'
      + '<div style="display:flex;align-items:center;gap:5px"><div style="width:9px;height:9px;background:rgba(255,255,255,.18);border-radius:2px"></div><span style="font-size:10px;color:rgba(255,255,255,.45)">' + (yr - 1) + '</span></div>'
      + '<div style="display:flex;align-items:center;gap:5px"><div style="width:9px;height:9px;background:' + COL + ';border-radius:2px"></div><span style="font-size:10px;color:rgba(255,255,255,.7)">' + yr + '</span></div>'
      + '</div>';

    /* Monthly detail list */
    var listHtml = sec('Dettaglio Mensile ' + yr);
    for (var k = curM - 1; k >= 0; k--) {
      var cE = archEur[k], pE = prevEur[k], cK = archKwh[k], pK = prevKwh[k];
      var diff = cE - pE, diffC = diff >= 0 ? '#f87171' : '#4ade80';
      listHtml += '<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
        + '<div><div style="font-size:13px;color:#fff;font-weight:600">' + MESIL[k] + '</div>'
        + '<div style="font-size:10px;color:rgba(255,255,255,.35);margin-top:1px">' + cK.toFixed(1) + ' kWh' + (pK > 0 ? ' · prec. ' + pK.toFixed(1) + ' kWh' : '') + '</div></div>'
        + '<div style="text-align:right"><div style="font-size:14px;color:#fff;font-weight:700">' + cE.toFixed(2) + ' €</div>'
        + (pE > 0 ? '<div style="font-size:10px;color:' + diffC + ';margin-top:1px">' + (diff >= 0 ? '+' : '') + diff.toFixed(2) + ' € vs ' + (yr - 1) + '</div>' : '')
        + '</div></div>';
    }
    listHtml += '<div style="display:flex;justify-content:space-between;align-items:center;background:rgba(' + RGB + ',.1);border-radius:10px;padding:11px 13px;margin-top:8px">'
      + '<div><div style="font-size:13px;font-weight:800;color:' + COL + '">Totale Anno ' + yr + '</div><div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:2px">' + annoKwh.toFixed(1) + ' kWh</div></div>'
      + '<span style="font-size:16px;font-weight:900;color:' + COL + '">' + annoEur.toFixed(2) + ' €</span>'
      + '</div>';

    /* Weekly bar chart */
    var weekKwh = GIORNI.map(function(g) { return N(S(h, 'input_number.frarik_bolletta_' + g + '_kwh')); });
    var weekEur = GIORNI.map(function(g) { return N(S(h, 'input_number.frarik_bolletta_' + g + '_eur')); });
    var todayIdx = (new Date().getDay() + 6) % 7;
    weekKwh[todayIdx] = Math.max(weekKwh[todayIdx], N(S(h, 'sensor.frarik_bolletta_consumo_giornaliero')));
    weekEur[todayIdx] = Math.max(weekEur[todayIdx], N(S(h, 'sensor.frarik_bolletta_costo_giornaliero')));
    var maxWk = Math.max.apply(null, weekKwh.concat([0.01]));

    var weekHtml = sec('Settimana Corrente (kWh/giorno)');
    weekHtml += '<div style="display:flex;align-items:flex-end;gap:4px;height:80px;margin:8px 0 4px">';
    for (var d = 0; d < 7; d++) {
      var isToday = d === todayIdx;
      var pct2 = Math.max(4, Math.round((weekKwh[d] / maxWk) * 60));
      weekHtml += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">'
        + '<div style="font-size:8px;color:rgba(255,255,255,.45)">' + (weekKwh[d] > 0 ? weekKwh[d].toFixed(1) : '') + '</div>'
        + '<div style="width:100%;border-radius:3px 3px 0 0;height:' + pct2 + 'px;background:' + (isToday ? COL : 'rgba(' + RGB + ',.35)') + '"></div>'
        + '<div style="font-size:8px;color:rgba(255,255,255,' + (isToday ? '1' : '.4') + ');font-weight:' + (isToday ? '700' : '400') + '">' + GIORNIL[d] + '</div>'
        + '</div>';
    }
    weekHtml += '</div>';
    weekHtml += '<div style="display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,.35);padding:4px 0">'
      + '<span>Media settimana: ' + N(S(h, 'sensor.frarik_bolletta_media_settimanale_kwh')).toFixed(2) + ' kWh/g</span>'
      + '<span>' + N(S(h, 'sensor.frarik_bolletta_media_settimanale_eur')).toFixed(2) + ' €/g</span>'
      + '</div>';

    mkOv(popShell('📊', 'Storico Bollette', 'Anno corrente vs precedente', 'bp-stor-close', barsHtml + listHtml + weekHtml), 'bp-stor-close');
  }

  /* ── POPUP: IMPOSTAZIONI ── */
  function openImpostazioni(card, el) {
    var h = H();
    var iSt = 'width:100%;padding:8px 10px;border-radius:8px;background:#0b1422;color:#fff;border:1px solid rgba(255,255,255,.15);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none;margin-top:3px';
    var lSt = 'font-size:11px;color:#fff;display:block;margin-top:8px';

    function lbl(t) { return '<label style="' + lSt + '">' + t + '</label>'; }
    function inp(id, val, ph) {
      return '<input id="' + id + '" type="text" inputmode="decimal" value="' + (val || '') + '" placeholder="' + (ph || '') + '" style="' + iSt + '" autocomplete="off">';
    }
    function togRow(eid, on, label) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)">'
        + '<span style="font-size:12px;color:#fff">' + label + '</span>'
        + '<button class="bp-tog" data-eid="' + eid + '" style="padding:4px 14px;border-radius:20px;border:none;cursor:pointer;font-size:11px;font-weight:800;background:' + (on ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.07)') + ';color:' + (on ? '#4ade80' : 'rgba(255,255,255,.4)') + '">' + (on ? '✅ ON' : 'OFF') + '</button>'
        + '</div>';
    }

    var tabCSS = '<style>.bp-tab{flex:1;padding:8px 4px;text-align:center;font-size:11px;font-weight:700;cursor:pointer;border-radius:8px;transition:all .15s;color:rgba(255,255,255,.5);border:none;background:transparent}.bp-tab.active{background:rgba(' + RGB + ',.18);color:' + COL + ';border:1px solid rgba(' + RGB + ',.3)}.bp-panel{display:none}.bp-panel.active{display:block}</style>';
    var tabs = '<div style="display:flex;gap:4px;background:rgba(255,255,255,.04);border-radius:10px;padding:3px;margin-bottom:12px">'
      + '<button class="bp-tab active" data-tab="notifiche">🔔 Notifiche</button>'
      + '<button class="bp-tab" data-tab="prezzi">💰 Prezzi</button>'
      + '<button class="bp-tab" data-tab="fv">☀️ FV/Batt</button>'
      + '</div>';

    /* TAB NOTIFICHE */
    var pNotifiche = '<div class="bp-panel active" id="bp-p-notifiche">'
      + sec('Attivazione')
      + togRow('input_boolean.frarik_bolletta_notify_report',    isOn(h, 'input_boolean.frarik_bolletta_notify_report'),    '📋 Report Master (abilita tutto)')
      + togRow('input_boolean.frarik_bolletta_notify_daily',     isOn(h, 'input_boolean.frarik_bolletta_notify_daily'),     '📅 Notifica Giornaliera')
      + togRow('input_boolean.frarik_bolletta_notify_monthly',   isOn(h, 'input_boolean.frarik_bolletta_notify_monthly'),   '📆 Notifica Mensile')
      + togRow('input_boolean.frarik_bolletta_notify_yearly',    isOn(h, 'input_boolean.frarik_bolletta_notify_yearly'),    '🗓 Notifica Annuale')
      + togRow('input_boolean.frarik_bolletta_notify_overload',  isOn(h, 'input_boolean.frarik_bolletta_notify_overload'),  '⚠️ Allarme Sovraccarico W')
      + sec('Canali')
      + togRow('input_boolean.frarik_bolletta_notify_push_active',  isOn(h, 'input_boolean.frarik_bolletta_notify_push_active'),  '📱 Notifiche Push Cellulare')
      + togRow('input_boolean.frarik_bolletta_notify_alexa_active', isOn(h, 'input_boolean.frarik_bolletta_notify_alexa_active'), '🔊 Voce Alexa')
      + '</div>';

    /* TAB PREZZI */
    var pPrezzi = '<div class="bp-panel" id="bp-p-prezzi">'
      + sec('Prezzi Variabili (€/kWh)')
      + lbl('Energia Base') + inp('bp-p-energia', N(S(h, 'input_number.frarik_bolletta_prezzo_energia_base')).toFixed(6),      '0.090000')
      + lbl('Dispacciamento') + inp('bp-p-disp',  N(S(h, 'input_number.frarik_bolletta_prezzo_dispacciamento')).toFixed(6),    '0.009800')
      + lbl('Mercato Capacità') + inp('bp-p-mc',  N(S(h, 'input_number.frarik_bolletta_prezzo_mercato_capacita')).toFixed(6),  '0.004275')
      + lbl('Fattore Perdite (moltiplicatore)') + inp('bp-p-fatt', N(S(h, 'input_number.frarik_bolletta_fattore_perdite')).toFixed(6), '1.103261')
      + lbl('Trasporto Quota Energia') + inp('bp-p-tr-en', N(S(h, 'input_number.frarik_bolletta_prezzo_trasporto_energia')).toFixed(6), '0.011890')
      + lbl('Oneri Sistema ASOS+ARIM') + inp('bp-p-oneri',  N(S(h, 'input_number.frarik_bolletta_prezzo_oneri_sistema')).toFixed(6),   '0.031322')
      + lbl('UC3+UC6 Variabile') + inp('bp-p-uc',    N(S(h, 'input_number.frarik_bolletta_prezzo_uc3_uc6')).toFixed(6),       '0.001630')
      + lbl('Accise') + inp('bp-p-accise',              N(S(h, 'input_number.frarik_bolletta_prezzo_accise')).toFixed(6),     '0.022700')
      + sec('Costi Fissi Mensili')
      + lbl('Commercializzazione + DISPbt (€/mese)') + inp('bp-p-comm',   N(S(h, 'input_number.frarik_bolletta_quota_comm_vendita')).toFixed(6),    '6.102592')
      + lbl('Trasporto Fisso (€/mese)') + inp('bp-p-tr-fis',              N(S(h, 'input_number.frarik_bolletta_quota_trasporto_fisso')).toFixed(2), '1.90')
      + lbl('Potenza Impegnata (kW)') + inp('bp-p-potenza',               N(S(h, 'input_number.frarik_bolletta_potenza_impegnata')).toFixed(1),     '4.5')
      + lbl('Quota Potenza (€/kW·mese)') + inp('bp-p-qpot',              N(S(h, 'input_number.frarik_bolletta_prezzo_quota_potenza')).toFixed(6),  '2.106567')
      + sec('Tasse e Detrazioni')
      + lbl('IVA (%)') + inp('bp-p-iva',       N(S(h, 'input_number.frarik_bolletta_iva_perc')).toFixed(0),         '10')
      + lbl('Canone RAI (€/mese, gen–ott)') + inp('bp-p-canone', N(S(h, 'input_number.frarik_bolletta_canone_rai')).toFixed(2), '9.00')
      + lbl('Bonus / Sconto in Bolletta (€)') + inp('bp-p-bonus', N(S(h, 'input_number.frarik_bolletta_bonus_bolletta')).toFixed(2), '0.00')
      + sec('Soglia Allarme')
      + lbl('Soglia Watt') + inp('bp-p-soglia',  N(S(h, 'input_number.frarik_bolletta_soglia_power')).toFixed(0),      '3000')
      + lbl('Ritardo Allarme (secondi)') + inp('bp-p-ritardo', N(S(h, 'input_number.frarik_bolletta_ritardo_soglia')).toFixed(0), '5')
      + '</div>';

    /* TAB FV/BATTERIA */
    var haFV    = isOn(h, 'input_boolean.frarik_bolletta_ha_fotovoltaico');
    var haBatt  = isOn(h, 'input_boolean.frarik_bolletta_ha_batteria');
    var fvKwhV  = N(S(h, 'input_number.frarik_bolletta_autoconsumo_fv'));
    var batKwhV = N(S(h, 'input_number.frarik_bolletta_autoconsumo_batt'));
    var pKwhV   = N(S(h, 'sensor.frarik_bolletta_prezzo_unico_variabile'));
    var kwhMV   = N(S(h, 'sensor.frarik_bolletta_consumo_mensile'));
    var totEstV = kwhMV + fvKwhV + batKwhV;
    var fvRispV  = fvKwhV * pKwhV;
    var batRispV = batKwhV * pKwhV;
    var fvPctV   = totEstV > 0 ? Math.round(fvKwhV  / totEstV * 100) : 0;
    var batPctV  = totEstV > 0 ? Math.round(batKwhV / totEstV * 100) : 0;

    function togBtn(eid, on) {
      return '<button class="bp-tog" data-eid="' + eid + '" style="padding:4px 14px;border-radius:20px;border:none;cursor:pointer;font-size:11px;font-weight:800;background:' + (on ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.07)') + ';color:' + (on ? '#4ade80' : 'rgba(255,255,255,.4)') + '">' + (on ? '✅ ON' : 'OFF') + '</button>';
    }
    function statRow(label, val, unit, col) {
      return '<div style="text-align:center"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">' + label + '</div>'
        + '<div style="font-size:15px;font-weight:800;color:' + col + '">' + val + '<span style="font-size:9px;color:' + col + ';opacity:.55;margin-left:2px">' + unit + '</span></div></div>';
    }

    var fvStatHtml = '<div id="bp-fv-stats" style="margin:10px 0;display:' + (haFV ? 'block' : 'none') + '">'
      + '<div style="background:rgba(251,191,36,.08);border-radius:10px;padding:9px 6px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">'
      + statRow('Autoconsumo', fvKwhV.toFixed(1), 'kWh', '#fff')
      + statRow('Risparmio',   fvRispV.toFixed(2), '€',  '#fbbf24')
      + statRow('Copertura',   fvPctV + '',        '%',  '#fbbf24')
      + '</div>'
      + '<div style="margin-top:6px;height:3px;background:rgba(255,255,255,.06);border-radius:2px"><div style="height:100%;width:' + fvPctV + '%;background:#fbbf24;border-radius:2px;opacity:.55;min-width:' + (fvPctV > 0 ? '6' : '0') + 'px"></div></div>'
      + '</div>';
    var fvPhHtml = '<div id="bp-fv-placeholder" style="margin:10px 0;padding:8px;border:1px dashed rgba(251,191,36,.2);border-radius:10px;text-align:center;font-size:11px;color:rgba(255,255,255,.3);display:' + (haFV ? 'none' : 'block') + '">Pannelli non attivi</div>';

    var batStatHtml = '<div id="bp-batt-stats" style="margin:10px 0;display:' + (haBatt ? 'block' : 'none') + '">'
      + '<div style="background:rgba(74,222,128,.07);border-radius:10px;padding:9px 6px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">'
      + statRow('Energia',   batKwhV.toFixed(1),  'kWh', '#fff')
      + statRow('Risparmio', batRispV.toFixed(2), '€',   '#4ade80')
      + statRow('Copertura', batPctV + '',        '%',   '#4ade80')
      + '</div>'
      + '<div style="margin-top:6px;height:3px;background:rgba(255,255,255,.06);border-radius:2px"><div style="height:100%;width:' + batPctV + '%;background:#4ade80;border-radius:2px;opacity:.55;min-width:' + (batPctV > 0 ? '6' : '0') + 'px"></div></div>'
      + '</div>';
    var batPhHtml = '<div id="bp-batt-placeholder" style="margin:10px 0;padding:8px;border:1px dashed rgba(74,222,128,.15);border-radius:10px;text-align:center;font-size:11px;color:rgba(255,255,255,.3);display:' + (haBatt ? 'none' : 'block') + '">Batteria non attiva</div>';

    var pFV = '<div class="bp-panel" id="bp-p-fv">'
      + '<div style="background:rgba(251,191,36,.04);border:1px solid rgba(251,191,36,.15);border-radius:14px;padding:12px;margin-bottom:10px">'
      + '<div style="display:flex;align-items:center;justify-content:space-between">'
      + '<div style="font-size:13px;font-weight:800;color:#fbbf24">☀️ Pannelli Fotovoltaici</div>'
      + togBtn('input_boolean.frarik_bolletta_ha_fotovoltaico', haFV)
      + '</div>'
      + fvStatHtml + fvPhHtml
      + '<div id="bp-fv-fields">'
      + lbl('kWh autoconsumo pannelli (mese)') + inp('bp-fv-kwh', fvKwhV.toFixed(1), '0.0')
      + '</div>'
      + '</div>'
      + '<div style="background:rgba(74,222,128,.03);border:1px solid rgba(74,222,128,.12);border-radius:14px;padding:12px">'
      + '<div style="display:flex;align-items:center;justify-content:space-between">'
      + '<div style="font-size:13px;font-weight:800;color:#4ade80">🔋 Batteria</div>'
      + togBtn('input_boolean.frarik_bolletta_ha_batteria', haBatt)
      + '</div>'
      + batStatHtml + batPhHtml
      + '<div id="bp-batt-fields">'
      + lbl('kWh da batteria (mese)') + inp('bp-batt-kwh', batKwhV.toFixed(1), '0.0')
      + '</div>'
      + '</div>'
      + '</div>';

    var saveBtn = '<div style="display:flex;gap:8px;margin-top:14px">'
      + '<button id="bp-imp-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.08);color:#fff">Annulla</button>'
      + '<button id="bp-imp-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:' + COL + ';color:#000">Salva su Home Assistant</button>'
      + '</div>';

    var ov = mkOv(popShell('⚙', 'Impostazioni Bolletta', 'Notifiche · Prezzi · FV/Batteria', 'bp-imp-close',
      tabCSS + tabs + pNotifiche + pPrezzi + pFV + saveBtn), 'bp-imp-close');

    /* tab switching */
    ov.querySelectorAll('.bp-tab').forEach(function(t) {
      t.addEventListener('click', function() {
        ov.querySelectorAll('.bp-tab').forEach(function(x) { x.classList.remove('active'); });
        ov.querySelectorAll('.bp-panel').forEach(function(x) { x.classList.remove('active'); });
        t.classList.add('active');
        var p = ov.querySelector('#bp-p-' + t.dataset.tab);
        if (p) p.classList.add('active');
      });
    });

    /* toggle buttons */
    ov.querySelectorAll('.bp-tog').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var eid = btn.dataset.eid;
        callSvc('input_boolean', 'toggle', {entity_id: eid});
        var on2 = btn.textContent.trim() === 'OFF';
        btn.textContent = on2 ? '✅ ON' : 'OFF';
        btn.style.background = on2 ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.07)';
        btn.style.color = on2 ? '#4ade80' : 'rgba(255,255,255,.4)';
        if (eid === 'input_boolean.frarik_bolletta_ha_fotovoltaico') {
          var fvS = ov.querySelector('#bp-fv-stats'); if (fvS) fvS.style.display = on2 ? 'block' : 'none';
          var fvP = ov.querySelector('#bp-fv-placeholder'); if (fvP) fvP.style.display = on2 ? 'none' : 'block';
        }
        if (eid === 'input_boolean.frarik_bolletta_ha_batteria') {
          var bS = ov.querySelector('#bp-batt-stats'); if (bS) bS.style.display = on2 ? 'block' : 'none';
          var bP = ov.querySelector('#bp-batt-placeholder'); if (bP) bP.style.display = on2 ? 'none' : 'block';
        }
      });
    });


    function g(id) { var e = ov.querySelector('#' + id); return e ? e.value.trim() : ''; }

    ov.querySelector('#bp-imp-save').addEventListener('click', function() {
      setNum('input_number.frarik_bolletta_prezzo_energia_base',      g('bp-p-energia'));
      setNum('input_number.frarik_bolletta_prezzo_dispacciamento',    g('bp-p-disp'));
      setNum('input_number.frarik_bolletta_prezzo_mercato_capacita',  g('bp-p-mc'));
      setNum('input_number.frarik_bolletta_fattore_perdite',          g('bp-p-fatt'));
      setNum('input_number.frarik_bolletta_prezzo_trasporto_energia', g('bp-p-tr-en'));
      setNum('input_number.frarik_bolletta_prezzo_oneri_sistema',     g('bp-p-oneri'));
      setNum('input_number.frarik_bolletta_prezzo_uc3_uc6',           g('bp-p-uc'));
      setNum('input_number.frarik_bolletta_prezzo_accise',            g('bp-p-accise'));
      setNum('input_number.frarik_bolletta_quota_comm_vendita',       g('bp-p-comm'));
      setNum('input_number.frarik_bolletta_quota_trasporto_fisso',    g('bp-p-tr-fis'));
      setNum('input_number.frarik_bolletta_potenza_impegnata',        g('bp-p-potenza'));
      setNum('input_number.frarik_bolletta_prezzo_quota_potenza',     g('bp-p-qpot'));
      setNum('input_number.frarik_bolletta_iva_perc',                 g('bp-p-iva'));
      setNum('input_number.frarik_bolletta_canone_rai',               g('bp-p-canone'));
      setNum('input_number.frarik_bolletta_bonus_bolletta',           g('bp-p-bonus'));
      setNum('input_number.frarik_bolletta_soglia_power',             g('bp-p-soglia'));
      setNum('input_number.frarik_bolletta_ritardo_soglia',           g('bp-p-ritardo'));
      setNum('input_number.frarik_bolletta_autoconsumo_fv',           g('bp-fv-kwh'));
      setNum('input_number.frarik_bolletta_autoconsumo_batt',         g('bp-batt-kwh'));
      ov._close();
    });
    ov.querySelector('#bp-imp-cancel').addEventListener('click', function() { ov._close(); });
  }

  /* ── RENDER ── */
  function render(card) {
    var h = H();
    var rid = 'fboll' + Math.random().toString(36).slice(2, 8);
    var now = new Date(), curM = now.getMonth() + 1;
    var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var dayNow = now.getDate();
    var percMese = Math.min(100, Math.round((dayNow / daysInMonth) * 100));

    var wLive  = N(S(h, 'sensor.frarik_bolletta_potenza_casa'));
    var soglia = N(S(h, 'input_number.frarik_bolletta_soglia_power')) || 3000;
    var kwhM   = N(S(h, 'sensor.frarik_bolletta_consumo_mensile'));
    var costoM = N(S(h, 'sensor.frarik_bolletta_mese_corrente'));
    var costoG = N(S(h, 'sensor.frarik_bolletta_costo_giornaliero'));
    var kwhG   = N(S(h, 'sensor.frarik_bolletta_consumo_giornaliero'));
    var prevM  = N(S(h, 'sensor.frarik_bolletta_previsione_costo_mese'));
    var pKwh    = N(S(h, 'sensor.frarik_bolletta_prezzo_unico_variabile'));
    var haFV    = isOn(h, 'input_boolean.frarik_bolletta_ha_fotovoltaico');
    var haBatt  = isOn(h, 'input_boolean.frarik_bolletta_ha_batteria');
    var fvKwh   = N(S(h, 'input_number.frarik_bolletta_autoconsumo_fv'));
    var battKwh = N(S(h, 'input_number.frarik_bolletta_autoconsumo_batt'));

    var wPct = Math.min(100, Math.round((wLive / soglia) * 100));
    var wCol = wLive >= soglia ? '#f87171' : wLive > soglia * 0.75 ? '#fb923c' : wLive > soglia * 0.4 ? COL : '#4ade80';
    var wFmt = wLive >= 1000 ? (wLive / 1000).toFixed(2) + ' kW' : wLive.toFixed(0) + ' W';

    var css = '<style>'
      + '#' + rid + '{position:relative;width:100%;height:100%;min-height:290px;font-family:system-ui,sans-serif;display:block}'
      + '#' + rid + ' .fb-card{display:flex;flex-direction:column;height:100%;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#' + rid + ' .fb-card::before{content:"";position:absolute;top:0;left:0;right:0;height:260px;background:radial-gradient(ellipse at 50% 0%,rgba(' + RGB + ',.07) 0%,transparent 65%);pointer-events:none}'
      + '#' + rid + ' .fb-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .fb-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;background:rgba(' + RGB + ',.12);border:1px solid rgba(' + RGB + ',.25)}'
      + '#' + rid + ' .fb-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fb-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#' + rid + ' .fb-scroll::-webkit-scrollbar{display:none}'
      + '#' + rid + ' .fb-hero{padding:10px 14px 4px}'
      + '#' + rid + ' .fb-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:6px 14px}'
      + '#' + rid + ' .fb-stat{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:11px;padding:8px 6px;text-align:center}'
      + '#' + rid + ' .fb-stat-lbl{font-size:9px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.04em}'
      + '#' + rid + ' .fb-stat-val{font-size:14px;font-weight:800;color:#fff;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fb-stat-sub{font-size:9px;color:rgba(255,255,255,.4);margin-top:2px}'
      + '#' + rid + ' .fb-btns{display:flex;gap:5px;padding:0 14px 12px}'
      + '#' + rid + ' .fb-btn{flex:1;padding:9px 2px;border-radius:9px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);font-size:9.5px;font-weight:700;color:#fff;text-align:center;cursor:pointer}'
      + '#' + rid + ' .fb-btn:hover{background:rgba(' + RGB + ',.12);border-color:rgba(' + RGB + ',.3);color:' + COL + '}'
      + '#' + rid + ' [data-sya]{cursor:pointer}'
      + '</style>';

    var heroHtml = '<div class="fb-hero">'
      /* Two-column hero */
      + '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:8px">'
      + '<div style="text-align:left;flex:1;min-width:0">'
      + '<div style="font-size:9px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px;font-weight:700">Consumo Mese</div>'
      + '<div style="font-size:42px;font-weight:900;color:#fff;line-height:1;letter-spacing:-2px;white-space:nowrap">' + kwhM.toFixed(0) + '<span style="font-size:16px;font-weight:600;color:rgba(255,255,255,.5);margin-left:3px">kWh</span></div>'
      + '</div>'
      + '<div style="text-align:right;flex:1;min-width:0">'
      + '<div style="font-size:9px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px;font-weight:700">Costo Mese</div>'
      + '<div style="font-size:42px;font-weight:900;color:' + COL + ';line-height:1;letter-spacing:-2px;white-space:nowrap">' + costoM.toFixed(2).replace('.', ',') + '<span style="font-size:16px;font-weight:600;color:rgba(251,191,36,.5);margin-left:3px">€</span></div>'
      + '</div>'
      + '</div>'
      /* Power bar */
      + '<div style="margin-top:10px">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
      + '<span style="font-size:10px;font-weight:700;color:' + wCol + '">⚡ ' + wFmt + '</span>'
      + '<span style="font-size:9px;color:rgba(255,255,255,.35)">soglia ' + (soglia / 1000).toFixed(1) + ' kW</span>'
      + '</div>'
      + '<div style="height:6px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden">'
      + '<div style="height:100%;width:' + wPct + '%;background:' + wCol + ';border-radius:3px;transition:width .4s;box-shadow:0 0 8px ' + wCol + '"></div>'
      + '</div>'
      + '</div>'
      /* FV/Batt badges */
      + ((haFV || haBatt) ? '<div style="display:flex;gap:5px;margin-top:7px">'
        + (haFV   ? '<div style="padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700;background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.25);color:#fbbf24">☀️ FV</div>' : '')
        + (haBatt ? '<div style="padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.25);color:#4ade80">🔋 Batt</div>' : '')
        + '</div>' : '')
      + '</div>';

    var statsHtml = '<div class="fb-stats">'
      + '<div class="fb-stat"><div class="fb-stat-lbl">📅 Oggi</div>'
      + '<div style="font-size:14px;font-weight:800;color:#fff;margin-top:3px;white-space:nowrap">' + kwhG.toFixed(2) + '<span style="font-size:9px;font-weight:600;color:rgba(255,255,255,.45);margin-left:2px">kWh</span></div>'
      + '<div style="font-size:14px;font-weight:800;color:' + COL + ';margin-top:2px;white-space:nowrap">' + costoG.toFixed(2) + '<span style="font-size:9px;font-weight:600;color:rgba(251,191,36,.45);margin-left:2px">€</span></div>'
      + '</div>'
      + '<div class="fb-stat"><div class="fb-stat-lbl">🔮 Fine Mese</div><div class="fb-stat-val" style="color:#fb923c">' + prevM.toFixed(0) + ' €</div><div class="fb-stat-sub">previsione</div></div>'
      + '<div class="fb-stat"><div class="fb-stat-lbl">💰 €/kWh</div><div class="fb-stat-val" style="color:' + COL + '">' + pKwh.toFixed(4) + '</div><div class="fb-stat-sub">prezzo kwh</div></div>'
      + '</div>';

    var energyPanelHtml = '';
    if (haFV || haBatt) {
      var kwhTotEst = kwhM + fvKwh + battKwh;
      var fvRisp    = fvKwh * pKwh;
      var battRisp  = battKwh * pKwh;
      var fvPct     = kwhTotEst > 0 ? Math.round(fvKwh / kwhTotEst * 100) : 0;
      var battPct   = kwhTotEst > 0 ? Math.round(battKwh / kwhTotEst * 100) : 0;

      var fvCardH = haFV
        ? '<div style="background:linear-gradient(135deg,rgba(251,191,36,.09),rgba(251,191,36,.04));border:1px solid rgba(251,191,36,.22);border-radius:13px;padding:10px 12px">'
        + '<div style="font-size:10px;font-weight:800;color:#fbbf24;margin-bottom:7px;letter-spacing:.03em">☀️ Fotovoltaico</div>'
        + '<div style="font-size:26px;font-weight:900;color:#fff;line-height:1;letter-spacing:-1px">' + fvKwh.toFixed(1).replace('.', ',') + '<span style="font-size:11px;font-weight:600;color:rgba(255,255,255,.5);margin-left:3px">kWh</span></div>'
        + '<div style="font-size:11px;font-weight:700;color:#fbbf24;margin-top:5px">' + fvRisp.toFixed(2).replace('.', ',') + ' € <span style="font-weight:500;color:rgba(251,191,36,.65);font-size:9px">stima risp.</span></div>'
        + '<div style="margin-top:6px;height:4px;background:rgba(255,255,255,.06);border-radius:2px"><div style="height:100%;width:' + fvPct + '%;background:#fbbf24;border-radius:2px;opacity:.65;min-width:' + (fvPct > 0 ? '6' : '0') + 'px"></div></div>'
        + '<div style="font-size:9px;color:rgba(255,255,255,.4);margin-top:3px">' + fvPct + '% del consumo totale</div>'
        + '</div>' : '';

      var battCardH = haBatt
        ? '<div style="background:linear-gradient(135deg,rgba(74,222,128,.08),rgba(74,222,128,.03));border:1px solid rgba(74,222,128,.2);border-radius:13px;padding:10px 12px">'
        + '<div style="font-size:10px;font-weight:800;color:#4ade80;margin-bottom:7px;letter-spacing:.03em">🔋 Batteria</div>'
        + '<div style="font-size:26px;font-weight:900;color:#fff;line-height:1;letter-spacing:-1px">' + battKwh.toFixed(1).replace('.', ',') + '<span style="font-size:11px;font-weight:600;color:rgba(255,255,255,.5);margin-left:3px">kWh</span></div>'
        + '<div style="font-size:11px;font-weight:700;color:#4ade80;margin-top:5px">' + battRisp.toFixed(2).replace('.', ',') + ' € <span style="font-weight:500;color:rgba(74,222,128,.6);font-size:9px">stima risp.</span></div>'
        + '<div style="margin-top:6px;height:4px;background:rgba(255,255,255,.06);border-radius:2px"><div style="height:100%;width:' + battPct + '%;background:#4ade80;border-radius:2px;opacity:.65;min-width:' + (battPct > 0 ? '6' : '0') + 'px"></div></div>'
        + '<div style="font-size:9px;color:rgba(255,255,255,.4);margin-top:3px">' + battPct + '% del consumo totale</div>'
        + '</div>' : '';

      var eCols = (haFV && haBatt) ? '1fr 1fr' : '1fr';
      energyPanelHtml = '<div style="display:grid;grid-template-columns:' + eCols + ';gap:7px;margin:2px 14px 8px">'
        + fvCardH + battCardH + '</div>';
    }

    var progHtml = '<div style="margin:2px 14px 10px">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
      + '<span style="font-size:10px;color:rgba(255,255,255,.5);font-weight:600">Giorno ' + dayNow + ' di ' + daysInMonth + '</span>'
      + '<span style="font-size:11px;color:' + COL + ';font-weight:800">' + percMese + '%</span>'
      + '</div>'
      + '<div style="height:7px;background:rgba(255,255,255,.07);border-radius:4px;position:relative">'
      + '<div style="height:100%;width:' + percMese + '%;background:linear-gradient(90deg,rgba(' + RGB + ',.45),rgba(' + RGB + ',.9));border-radius:4px;box-shadow:0 0 10px rgba(' + RGB + ',.4);position:relative;min-width:' + (percMese > 0 ? '8' : '0') + 'px">'
      + (percMese > 0 && percMese < 100 ? '<div style="position:absolute;right:-5px;top:50%;transform:translateY(-50%);width:14px;height:14px;border-radius:50%;background:' + COL + ';box-shadow:0 0 8px ' + COL + '"></div>' : '')
      + '</div></div>'
      + '</div>';

    var btnsHtml = '<div class="fb-btns">'
      + '<div class="fb-btn" data-sya="popup-dettaglio">🧾 Dettaglio</div>'
      + '<div class="fb-btn" data-sya="popup-simulatore">🧮 Simula</div>'
      + '<div class="fb-btn" data-sya="popup-storico">📊 Storico</div>'
      + '<div class="fb-btn" data-sya="popup-impostazioni">⚙ Imposta</div>'
      + '</div>';

    return css
      + '<div id="' + rid + '"><div class="fb-card">'
      + '<div class="fb-hdr">'
      + '<div class="fb-hdr-iw">⚡</div>'
      + '<div class="fb-hdr-tit">Bolletta Elettrica</div>'
      + '<div style="font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px;background:rgba(' + RGB + ',.12);border:1px solid rgba(' + RGB + ',.25);color:' + COL + ';flex-shrink:0">' + MESIL[now.getMonth()] + ' ' + now.getFullYear() + '</div>'
      + '</div>'
      + '<div class="fb-scroll">'
      + heroHtml
      + statsHtml
      + energyPanelHtml
      + progHtml
      + btnsHtml
      + '</div></div></div>';
  }

  /* ── UPDATE / MOUNT ── */
  function update(card, hass, el) {
    var h = hass || H();
    var sig = [
      '5.3',
      S(h, 'sensor.frarik_bolletta_mese_corrente'),
      S(h, 'sensor.frarik_bolletta_consumo_mensile'),
      S(h, 'sensor.frarik_bolletta_potenza_casa'),
      S(h, 'sensor.frarik_bolletta_previsione_costo_mese'),
      S(h, 'sensor.frarik_bolletta_costo_giornaliero'),
      S(h, 'sensor.frarik_bolletta_consumo_giornaliero'),
      S(h, 'sensor.frarik_bolletta_prezzo_unico_variabile'),
      S(h, 'input_boolean.frarik_bolletta_ha_fotovoltaico'),
      S(h, 'input_boolean.frarik_bolletta_ha_batteria'),
      S(h, 'input_number.frarik_bolletta_soglia_power'),
      S(h, 'input_number.frarik_bolletta_autoconsumo_fv'),
      S(h, 'input_number.frarik_bolletta_autoconsumo_batt'),
    ].join('|');
    if (!el.querySelector('.fb-card') || el._fcSig !== sig) {
      el._fcSig = sig;
      el._fcBound = null;
      el.innerHTML = render(card);
    }
    mount(card, hass, el);
  }

  function mount(card, hass, el) {
    if (el._fcBound === '5.3') return;
    el._fcBound = '5.3';
    if (el._fcHandler) el.removeEventListener('click', el._fcHandler);
    el._fcHandler = function(e) {
      var sya = e.target.closest('[data-sya]'); if (!sya) return;
      var a = sya.dataset.sya;
      if (a === 'popup-dettaglio')    { openDettaglio(); return; }
      if (a === 'popup-simulatore')   { openSimulatore(); return; }
      if (a === 'popup-storico')      { openStorico(); return; }
      if (a === 'popup-impostazioni') { openImpostazioni(card, el); return; }
    };
    el.addEventListener('click', el._fcHandler);
  }

  /* ── PKG BUILD ── */
  var _BLL_WIZ_KEY = 'frarik_pkg_wizard_bolletta';

  function _buildPkgBolletta(potenza, push, alexa, _tpl) {
    var yaml = (_tpl || '');
    yaml = yaml.split('IL_TUO_SENSORE_POTENZA_CASA').join(potenza || 'sensor.non_configurato');
    yaml = yaml.split('IL_TUO_MOBILE_APP').join(push || 'notify.notify');
    yaml = yaml.split('IL_TUO_ALEXA').join(alexa || 'media_player.non_configurato');
    return yaml;
  }

  /* ── WIZARD ── */
  function _openWizardBolletta(hass, onDone, _tpl, opts) {
    var isUpdate = !!(opts && opts.isUpdate);
    var states = (hass && hass.states) || {};
    var sensorIds = Object.keys(states).filter(function(id) { return /^sensor\./.test(id); }).sort();
    var notifyIds = Object.keys(states).filter(function(id) { return /^notify\./.test(id) || id.indexOf('mobile_app') !== -1; }).sort();
    var mediaIds  = Object.keys(states).filter(function(id) { return /^media_player\./.test(id); }).sort();
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(_BLL_WIZ_KEY) || 'null'); } catch(e) {}
    var savedPotenza = saved && typeof saved.potenza === 'string' ? saved.potenza : '';
    var savedPush    = saved && typeof saved.push    === 'string' ? saved.push    : (saved && Array.isArray(saved.push) ? saved.push[0] || '' : '');
    var savedAlexa   = saved && typeof saved.alexa   === 'string' ? saved.alexa   : '';

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
          row.addEventListener('mouseout', function() { row.style.background = ''; });
        });
      }
      inp.addEventListener('focus', show);
      inp.addEventListener('input', show);
      inp.addEventListener('blur', function() { setTimeout(function() { drop.style.display = 'none'; }, 200); });
    }

    function renderWiz() {
      sr.innerHTML = '<style>'
        + ':host{all:initial;font-family:system-ui,sans-serif}'
        + '.wd-bd{position:fixed;inset:0;z-index:200000;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);display:flex;align-items:flex-end}'
        + '.wd-panel{width:100%;max-height:88vh;display:flex;flex-direction:column;background:#080f18;border:1px solid rgba(56,189,248,.3);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.8);color:#fff;overflow:hidden;animation:wUp .22s cubic-bezier(.32,1.12,.56,1)}'
        + '@keyframes wUp{from{transform:translateY(100%)}to{transform:translateY(0)}}'
        + '.wd-hdr{display:flex;align-items:center;gap:10px;padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}'
        + '.wd-ico{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;background:rgba(56,189,248,.15);border:1px solid rgba(56,189,248,.3);flex-shrink:0}'
        + '.wd-tit{font-size:14px;font-weight:800}'
        + '.wd-sub{font-size:11px;color:rgba(255,255,255,.45);margin-top:1px}'
        + '.wd-x{margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none}'
        + '.wd-body{flex:1;overflow-y:auto;padding:16px;scrollbar-width:none;display:flex;flex-direction:column;gap:14px}'
        + '.wd-body::-webkit-scrollbar{display:none}'
        + '.wd-sec{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;padding-bottom:5px;border-bottom:1px solid rgba(56,189,248,.18);margin-bottom:10px}'
        + '.wd-lbl{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px}'
        + '.wd-frow{position:relative;margin-bottom:10px}'
        + '.wd-inp{width:100%;padding:9px 11px;border-radius:10px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none}'
        + '.wd-inp:focus{border-color:rgba(56,189,248,.5)}'
        + '.wd-drop{position:absolute;left:0;right:0;top:100%;z-index:10;max-height:150px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 9px 9px;display:none}'
        + '.wd-item{padding:5px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#e2e8f0}'
        + '.wd-note{font-size:11px;color:rgba(255,255,255,.4);line-height:1.5;margin:0 0 10px}'
        + '.wd-foot{padding:12px 16px;border-top:1px solid rgba(255,255,255,.07);display:flex;gap:8px;flex-shrink:0}'
        + '.wd-cancel{flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:700;font-size:13px;background:rgba(255,255,255,.1);color:#fff}'
        + '.wd-install{flex:2;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;font-size:13px;background:#38bdf8;color:#060d14}'
        + '.wd-loading{opacity:.6;pointer-events:none}'
        + '</style>'
        + '<div class="wd-bd" id="wd-bd">'
        + '<div class="wd-panel">'
        + '<div class="wd-hdr"><div class="wd-ico">⚡</div>'
        + '<div><div class="wd-tit">' + (isUpdate ? 'Aggiorna PKG Bolletta' : 'Installa PKG Bolletta') + '</div><div class="wd-sub">frarik_bolletta.yaml → config/packages/</div></div>'
        + '<button class="wd-x" id="wd-x">✕</button></div>'
        + '<div class="wd-body">'
        + '<div><div class="wd-sec">Sensori</div>'
        + '<div class="wd-lbl">Sensore Potenza Casa (W)</div>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-potenza" type="text" autocomplete="off" placeholder="sensor.shelly_potenza_casa" value="' + savedPotenza.replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-potenza"></div></div>'
        + '</div>'
        + '<div><div class="wd-sec">Notifiche Push</div>'
        + '<p class="wd-note">Servizio mobile_app per le notifiche push (es. <code>mobile_app_iphone</code>).</p>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-push" type="text" autocomplete="off" placeholder="mobile_app_iphone" value="' + savedPush.replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-push"></div></div>'
        + '</div>'
        + '<div><div class="wd-sec">Notifiche Alexa</div>'
        + '<p class="wd-note">media_player del dispositivo Alexa (es. <code>media_player.echo_cucina</code>). Lascia vuoto per non usare.</p>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-alexa" type="text" autocomplete="off" placeholder="media_player.echo_cucina" value="' + savedAlexa.replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-alexa"></div></div>'
        + '</div>'
        + '</div>'
        + '<div class="wd-foot">'
        + '<button class="wd-cancel" id="wd-cancel">Annulla</button>'
        + '<button class="wd-install" id="wd-install">' + (isUpdate ? '🔄 Aggiorna PKG' : '📦 Installa PKG') + '</button>'
        + '</div>'
        + '</div>'
        + '</div>';

      sr.getElementById('wd-x').addEventListener('click', destroy);
      sr.getElementById('wd-cancel').addEventListener('click', destroy);
      sr.getElementById('wd-bd').addEventListener('click', function(e) { if (e.target === sr.getElementById('wd-bd')) destroy(); });

      setupAC(sr.getElementById('f-potenza'), sr.getElementById('d-potenza'), sensorIds);
      setupAC(sr.getElementById('f-push'),    sr.getElementById('d-push'),    notifyIds);
      setupAC(sr.getElementById('f-alexa'),   sr.getElementById('d-alexa'),   mediaIds);

      sr.getElementById('wd-install').addEventListener('click', function() {
        var potenza = sr.getElementById('f-potenza').value.trim();
        var push    = sr.getElementById('f-push').value.trim();
        var alexa   = sr.getElementById('f-alexa').value.trim();
        try { localStorage.setItem(_BLL_WIZ_KEY, JSON.stringify({potenza: potenza, push: push, alexa: alexa})); } catch(e) {}
        var yaml = _buildPkgBolletta(potenza, push, alexa, _tpl);
        var m = location.pathname.match(/^(.*\/api\/hassio_ingress\/[^/]+)/);
        var base = location.origin + (m ? m[1] : '');
        var btn = sr.getElementById('wd-install');
        btn.classList.add('wd-loading');
        btn.textContent = isUpdate ? 'Aggiornamento…' : 'Installazione…';
        fetch(base + '/api/frarik/pkg/install', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({name: 'frarik/frarik_bolletta.yaml', content: yaml})
        }).then(function(r) { return r.json().then(function(j) { return {r: r, j: j}; }); })
          .then(function(res) {
            destroy();
            if (res.r.ok && res.j.ok) {
              try { if (typeof window.showToast === 'function') window.showToast(isUpdate ? '🔄 PKG Bolletta aggiornato! Riavvia HA.' : '📦 PKG Bolletta installato! Riavvia HA.'); } catch(e) {}
              if (typeof onDone === 'function') onDone();
            } else {
              try { if (typeof window.showToast === 'function') window.showToast('⚠️ Errore installazione PKG: ' + ((res.j && res.j.error) || '')); } catch(e) {}
            }
          }).catch(function() {
            destroy();
            try { if (typeof window.showToast === 'function') window.showToast('⚠️ Errore connessione al PKG install'); } catch(e) {}
          });
      });
    }

    renderWiz();
  }

  var CARD = {
    id: 'bolletta', name: 'Bolletta Elettrica', icon: '⚡', version: '5.3',
    desc: 'Monitoraggio consumi, costi e previsioni bolletta elettrica. Richiede PKG Frarik Bolletta.',
    render: render, mount: mount, update: update, configure: null, frarik_no_edit: true,
    frarik_pkg_check: 'sensor.frarik_bolletta_versione',
    frarik_pkg_id: 'frarik_bolletta',
    frarik_pkg_version: '11',
    openWizard: _openWizardBolletta,
    _buildPkgFromConfig: function(cfg, _tpl) { return _buildPkgBolletta(cfg.potenza || '', cfg.push || '', cfg.alexa || '', _tpl); },
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: bolletta v' + CARD.version); } catch(e) {}
})();
