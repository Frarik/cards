/* frarik-version: 5.0 */
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
    var haFV   = isOn(h, 'input_boolean.frarik_bolletta_ha_fotovoltaico');
    var haBatt = isOn(h, 'input_boolean.frarik_bolletta_ha_batteria');
    var simRes = N(S(h, 'sensor.frarik_bolletta_test_bolletta'));
    var pFV = '<div class="bp-panel" id="bp-p-fv">'
      + sec('Fotovoltaico')
      + togRow('input_boolean.frarik_bolletta_ha_fotovoltaico', haFV, '☀️ Pannelli Solari Attivi')
      + '<div id="bp-fv-fields" style="opacity:' + (haFV ? '1' : '.4') + ';pointer-events:' + (haFV ? 'auto' : 'none') + ';transition:opacity .2s">'
      + lbl('kWh Autoconsumo FV (mese corrente)') + inp('bp-fv-kwh', N(S(h, 'input_number.frarik_bolletta_autoconsumo_fv')).toFixed(1), '0.0')
      + '</div>'
      + sec('Batteria')
      + togRow('input_boolean.frarik_bolletta_ha_batteria', haBatt, '🔋 Batteria Attiva')
      + '<div id="bp-batt-fields" style="opacity:' + (haBatt ? '1' : '.4') + ';pointer-events:' + (haBatt ? 'auto' : 'none') + ';transition:opacity .2s">'
      + lbl('kWh da Batteria (mese corrente)') + inp('bp-batt-kwh', N(S(h, 'input_number.frarik_bolletta_autoconsumo_batt')).toFixed(1), '0.0')
      + '</div>'
      + sec('Simulatore Bolletta')
      + lbl('kWh da simulare')
      + inp('bp-sim-kwh', N(S(h, 'input_number.frarik_bolletta_test_kwh')).toFixed(0), '250')
      + '<div style="margin-top:8px;padding:10px 12px;background:rgba(' + RGB + ',.07);border:1px solid rgba(' + RGB + ',.15);border-radius:10px">'
      + '<div style="font-size:10px;color:rgba(255,255,255,.4);margin-bottom:4px">Bolletta simulata (calcolata da HA)</div>'
      + '<div style="font-size:22px;font-weight:900;color:' + COL + '">' + simRes.toFixed(2) + ' €</div>'
      + '<div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:2px">Salva per aggiornare</div>'
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
          var ff = ov.querySelector('#bp-fv-fields'); if (ff) { ff.style.opacity = on2 ? '1' : '.4'; ff.style.pointerEvents = on2 ? 'auto' : 'none'; }
        }
        if (eid === 'input_boolean.frarik_bolletta_ha_batteria') {
          var bf = ov.querySelector('#bp-batt-fields'); if (bf) { bf.style.opacity = on2 ? '1' : '.4'; bf.style.pointerEvents = on2 ? 'auto' : 'none'; }
        }
      });
    });

    /* sim kWh input → send to HA (sensor updates async) */
    var simInp = ov.querySelector('#bp-sim-kwh');
    if (simInp) {
      simInp.addEventListener('change', function() {
        setNum('input_number.frarik_bolletta_test_kwh', simInp.value);
      });
    }

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
    var pKwh   = N(S(h, 'sensor.frarik_bolletta_prezzo_unico_variabile'));
    var haFV   = isOn(h, 'input_boolean.frarik_bolletta_ha_fotovoltaico');
    var haBatt = isOn(h, 'input_boolean.frarik_bolletta_ha_batteria');

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
      + '<div class="fb-stat"><div class="fb-stat-lbl">📅 Oggi</div><div class="fb-stat-val">' + costoG.toFixed(2) + ' €</div><div class="fb-stat-sub">' + kwhG.toFixed(2) + ' kWh</div></div>'
      + '<div class="fb-stat"><div class="fb-stat-lbl">🔮 Fine Mese</div><div class="fb-stat-val" style="color:#fb923c">' + prevM.toFixed(0) + ' €</div><div class="fb-stat-sub">previsione</div></div>'
      + '<div class="fb-stat"><div class="fb-stat-lbl">💰 €/kWh</div><div class="fb-stat-val" style="color:' + COL + '">' + pKwh.toFixed(4) + '</div><div class="fb-stat-sub">prezzo kwh</div></div>'
      + '</div>';

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
      + progHtml
      + btnsHtml
      + '</div></div></div>';
  }

  /* ── UPDATE / MOUNT ── */
  function update(card, hass, el) {
    var h = hass || H();
    var sig = [
      '5.0',
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
    ].join('|');
    if (!el.querySelector('.fb-card') || el._fcSig !== sig) {
      el._fcSig = sig;
      el._fcBound = null;
      el.innerHTML = render(card);
    }
    mount(card, hass, el);
  }

  function mount(card, hass, el) {
    if (el._fcBound === '5.0') return;
    el._fcBound = '5.0';
    if (el._fcHandler) el.removeEventListener('click', el._fcHandler);
    el._fcHandler = function(e) {
      var sya = e.target.closest('[data-sya]'); if (!sya) return;
      var a = sya.dataset.sya;
      if (a === 'popup-dettaglio')    { openDettaglio(); return; }
      if (a === 'popup-storico')      { openStorico(); return; }
      if (a === 'popup-impostazioni') { openImpostazioni(card, el); return; }
    };
    el.addEventListener('click', el._fcHandler);
  }

  var CARD = {
    id: 'bolletta', name: 'Bolletta Elettrica', icon: '⚡', version: '5.0',
    desc: 'Monitoraggio consumi, costi e previsioni bolletta elettrica. Richiede PKG Frarik Bolletta.',
    render: render, mount: mount, update: update, configure: null, frarik_no_edit: true,
    frarik_pkg_check: 'sensor.frarik_bolletta_versione',
    frarik_pkg_id: 'frarik_bolletta',
    frarik_pkg_version: '10',
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: bolletta v' + CARD.version); } catch(e) {}
})();
