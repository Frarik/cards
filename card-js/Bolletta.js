/* frarik-version: 3.0 */
(function () {
  'use strict';

  var COL = '#fbbf24';
  var RGB = '251,191,36';
  var MESI  = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
  var MESIL = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

  /* ── HASS HELPERS ── */
  function H() { try { if (typeof window.frarikHass === 'function') { var h = window.frarikHass(); if (h && h.states) return h; } } catch(e) {} return null; }
  function S(h, id) { var s = h && id && h.states && h.states[id]; return s ? String(s.state) : ''; }
  function N(v) { var x = parseFloat(String(v != null ? v : '').replace(',','.')); return isNaN(x) ? 0 : x; }
  function callSvc(domain, service, data) { try { var h = H(); if (h && h.callService) h.callService(domain, service, data || {}); } catch(e) {} }
  function setNum(eid, val) { var v = parseFloat(val); if (!isNaN(v)) callSvc('input_number','set_value',{entity_id:eid,value:v}); }

  /* ── STORAGE ── */
  function keyOf(c) { return 'frarik_bollettacard_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch(e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch(e) {} }

  /* ── DEFAULTS ── */
  function pkDefaults() {
    return {
      pk_consumo_ist:   'sensor.consumo_istantaneo',
      pk_kwh_oggi:      'sensor.bolletta_energia_giornaliera_safe',
      pk_kwh_mese:      'sensor.bolletta_energia_mensile_safe',
      pk_costo_oggi:    'sensor.bolletta_giornaliera',
      pk_costo_mese:    'sensor.bolletta_mensile',
      pk_proiezione_e:  'sensor.bolletta_proiezione_fine_mese',
      pk_proiezione_k:  'sensor.bolletta_previsione_kwh_fine_mese',
      pk_anno:          'sensor.bolletta_totale_anno_corrente',
      pk_arera_trim:    'sensor.bolletta_arera_trimestre',
      pk_materia:       'sensor.bolletta_materia_energia_mensile',
      pk_trasporto:     'sensor.bolletta_trasporto_mensile',
      pk_oneri:         'sensor.bolletta_oneri_sistema_mensili',
      pk_accise:        'sensor.bolletta_costo_mensile_accise',
      pk_iva:           'sensor.bolletta_iva_mensile',
      pk_canone_rai:    'sensor.bolletta_canone_rai_mensile',
      pk_costo_kwh:     'sensor.bolletta_costo_per_kwh',
      pk_media_g:       'sensor.bolletta_consumo_medio_giornaliero',
      pk_diff_anno:     'sensor.bolletta_differenza_vs_anno_scorso',
      pk_tariffa:       'input_number.bolletta_tariffa_energia',
      pk_spread:        'input_number.bolletta_spread_energia',
      pk_potenza:       'input_number.bolletta_potenza_impegnata',
      pk_bonus:         'input_number.bolletta_bonus_mese_corrente',
      pk_bonus_soc:     'input_number.bolletta_bonus_sociale',
      pk_credito_gse:   'input_number.bolletta_credito_gse',
      pk_ha_fv:         'input_boolean.bolletta_ha_fotovoltaico',
      pk_test_kwh:      'input_number.bolletta_test_consumo_kwh',
      pk_test_bonus:    'input_number.bolletta_test_bonus_euro',
      pk_fb_perdite:    'input_number.bolletta_fb_perdite_perc',
      pk_fb_dispbt:     'input_number.bolletta_fb_dispbt',
      pk_fb_disp:       'input_number.bolletta_fb_dispacciamento',
      pk_fb_mc:         'input_number.bolletta_fb_mercato_capacita',
      pk_fb_pno:        'input_number.bolletta_fb_pno',
      pk_fb_comm:       'input_number.bolletta_fb_commercializzazione',
      pk_fb_tr_en:      'input_number.bolletta_fb_trasporto_energia',
      pk_fb_tr_fis:     'input_number.bolletta_fb_trasporto_fisso',
      pk_fb_tr_pot:     'input_number.bolletta_fb_trasporto_potenza',
      pk_fb_uc3:        'input_number.bolletta_fb_uc3',
      pk_fb_uc6f:       'input_number.bolletta_fb_uc6_fisso',
      pk_fb_uc6v:       'input_number.bolletta_fb_uc6_variabile',
      pk_fb_arim:       'input_number.bolletta_fb_arim',
      pk_fb_asos:       'input_number.bolletta_fb_asos',
      pk_fb_accise:     'input_number.bolletta_fb_accise',
      pk_fb_iva:        'input_number.bolletta_fb_iva_perc',
      pk_m_01:'input_number.bolletta_storico_mese_curr_01', pk_m_02:'input_number.bolletta_storico_mese_curr_02',
      pk_m_03:'input_number.bolletta_storico_mese_curr_03', pk_m_04:'input_number.bolletta_storico_mese_curr_04',
      pk_m_05:'input_number.bolletta_storico_mese_curr_05', pk_m_06:'input_number.bolletta_storico_mese_curr_06',
      pk_m_07:'input_number.bolletta_storico_mese_curr_07', pk_m_08:'input_number.bolletta_storico_mese_curr_08',
      pk_m_09:'input_number.bolletta_storico_mese_curr_09', pk_m_10:'input_number.bolletta_storico_mese_curr_10',
      pk_m_11:'input_number.bolletta_storico_mese_curr_11', pk_m_12:'input_number.bolletta_storico_mese_curr_12',
      pk_p_01:'input_number.bolletta_storico_mese_prev_01', pk_p_02:'input_number.bolletta_storico_mese_prev_02',
      pk_p_03:'input_number.bolletta_storico_mese_prev_03', pk_p_04:'input_number.bolletta_storico_mese_prev_04',
      pk_p_05:'input_number.bolletta_storico_mese_prev_05', pk_p_06:'input_number.bolletta_storico_mese_prev_06',
      pk_p_07:'input_number.bolletta_storico_mese_prev_07', pk_p_08:'input_number.bolletta_storico_mese_prev_08',
      pk_p_09:'input_number.bolletta_storico_mese_prev_09', pk_p_10:'input_number.bolletta_storico_mese_prev_10',
      pk_p_11:'input_number.bolletta_storico_mese_prev_11', pk_p_12:'input_number.bolletta_storico_mese_prev_12',
      pk_k_01:'input_number.bolletta_storico_kwh_curr_01',  pk_k_02:'input_number.bolletta_storico_kwh_curr_02',
      pk_k_03:'input_number.bolletta_storico_kwh_curr_03',  pk_k_04:'input_number.bolletta_storico_kwh_curr_04',
      pk_k_05:'input_number.bolletta_storico_kwh_curr_05',  pk_k_06:'input_number.bolletta_storico_kwh_curr_06',
      pk_k_07:'input_number.bolletta_storico_kwh_curr_07',  pk_k_08:'input_number.bolletta_storico_kwh_curr_08',
      pk_k_09:'input_number.bolletta_storico_kwh_curr_09',  pk_k_10:'input_number.bolletta_storico_kwh_curr_10',
      pk_k_11:'input_number.bolletta_storico_kwh_curr_11',  pk_k_12:'input_number.bolletta_storico_kwh_curr_12',
      pk_kp_01:'input_number.bolletta_storico_kwh_prev_01', pk_kp_02:'input_number.bolletta_storico_kwh_prev_02',
      pk_kp_03:'input_number.bolletta_storico_kwh_prev_03', pk_kp_04:'input_number.bolletta_storico_kwh_prev_04',
      pk_kp_05:'input_number.bolletta_storico_kwh_prev_05', pk_kp_06:'input_number.bolletta_storico_kwh_prev_06',
      pk_kp_07:'input_number.bolletta_storico_kwh_prev_07', pk_kp_08:'input_number.bolletta_storico_kwh_prev_08',
      pk_kp_09:'input_number.bolletta_storico_kwh_prev_09', pk_kp_10:'input_number.bolletta_storico_kwh_prev_10',
      pk_kp_11:'input_number.bolletta_storico_kwh_prev_11', pk_kp_12:'input_number.bolletta_storico_kwh_prev_12',
    };
  }

  function cfgFor(card) {
    var c = load(card), pk = pkDefaults(), r = {};
    Object.keys(pk).forEach(function(k) { r[k] = (c[k] !== undefined && c[k] !== '') ? c[k] : pk[k]; });
    r.name = c.name || 'Bolletta';
    return r;
  }

  /* ── BILL CALCULATION (mirrors PKG formula) ── */
  function calcBill(kwh, h, cf) {
    var perdPerc  = N(S(h,'sensor.bolletta_arera_perdite_rete_perc'))  || N(S(h,cf.pk_fb_perdite))  || 8.73;
    var dispbt    = N(S(h,'sensor.bolletta_arera_dispbt'))             || N(S(h,cf.pk_fb_dispbt))    || 0.102592;
    var disp      = N(S(h,'sensor.bolletta_arera_dispacciamento'))     || N(S(h,cf.pk_fb_disp))      || 0.010660;
    var mc        = N(S(h,'sensor.bolletta_arera_mercato_capacita'))   || N(S(h,cf.pk_fb_mc))        || 0.010583;
    var pno       = N(S(h,'sensor.bolletta_arera_pno'))                || N(S(h,cf.pk_fb_pno))       || 0;
    var comm      = N(S(h,cf.pk_fb_comm))  || 6;
    var tr_en     = N(S(h,'sensor.bolletta_arera_trasporto_quota_energia'))  || N(S(h,cf.pk_fb_tr_en))  || 0.0119;
    var tr_fis    = N(S(h,'sensor.bolletta_arera_trasporto_quota_fissa'))    || N(S(h,cf.pk_fb_tr_fis)) || 1.92;
    var tr_pot    = N(S(h,'sensor.bolletta_arera_trasporto_quota_potenza'))  || N(S(h,cf.pk_fb_tr_pot)) || 2.22;
    var uc3       = N(S(h,'sensor.bolletta_arera_uc3'))         || N(S(h,cf.pk_fb_uc3))   || 0.00276;
    var uc6f      = N(S(h,'sensor.bolletta_arera_uc6_fisso'))   || N(S(h,cf.pk_fb_uc6f))  || 0.07;
    var uc6v      = N(S(h,'sensor.bolletta_arera_uc6_variabile'))|| N(S(h,cf.pk_fb_uc6v)) || 0.00007;
    var arim      = N(S(h,'sensor.bolletta_arera_arim'))         || N(S(h,cf.pk_fb_arim))  || 0.001638;
    var asos      = N(S(h,'sensor.bolletta_arera_asos'))         || N(S(h,cf.pk_fb_asos))  || 0.028657;
    var erariale  = N(S(h,'sensor.bolletta_arera_erariale'))     || N(S(h,cf.pk_fb_accise))|| 0.022700;
    var iva_perc  = N(S(h,'sensor.bolletta_arera_iva_perc'))     || N(S(h,cf.pk_fb_iva))   || 10;
    var pE        = N(S(h,cf.pk_tariffa)) + N(S(h,cf.pk_spread));
    var kw        = N(S(h,cf.pk_potenza)) || 4.5;

    var kp      = kwh * perdPerc / 100;
    var kwh_tot = kwh + kp;

    var mat = kwh * pE + kp * pE
            + kwh_tot * disp
            + kwh_tot * mc
            + dispbt + pno + comm;
    var tras = kwh * tr_en + tr_fis + kw * tr_pot
             + kwh * uc3 + kw * uc6f + kwh * uc6v;
    var oneri = kwh * arim + kwh * asos;
    var acc   = kwh * erariale;
    var imp   = mat + tras + oneri;
    var iva   = (imp + acc) * iva_perc / 100;
    var now   = new Date();
    var rai   = (now.getMonth() + 1 === 7 || now.getMonth() + 1 === 8) ? 0 : 9;

    return { mat:mat, tras:tras, oneri:oneri, acc:acc, imp:imp, iva:iva, rai:rai,
             kp:kp, kwh_tot:kwh_tot, pE:pE, kw:kw, iva_perc:iva_perc };
  }

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
    return POP_CSS + '<div style="width:100%;max-height:82vh;display:flex;flex-direction:column;background:#060d14;border:1px solid rgba(' + RGB + ',.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:fcUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      + '<div style="display:flex;align-items:center;gap:10px;padding:13px 15px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
      + '<div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(' + RGB + ',.15);border:1px solid rgba(' + RGB + ',.3)">' + icon + '</div>'
      + '<div><div style="font-size:14px;font-weight:800;color:#fff">' + title + '</div><div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:1px">' + sub + '</div></div>'
      + '<button id="' + closeId + '" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none;flex-shrink:0">✕</button>'
      + '</div>'
      + '<div class="fcpc" style="flex:1;overflow-y:auto;padding:13px 15px;display:flex;flex-direction:column;gap:0">' + content + '</div>'
      + '</div>';
  }
  function row(lbl, val, col) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05)"><span style="font-size:12px;color:rgba(255,255,255,.8)">' + lbl + '</span><span style="font-size:13px;font-weight:800;color:' + (col || '#fff') + '">' + val + '</span></div>';
  }
  function sec(lbl) {
    return '<div style="font-size:10px;font-weight:700;color:' + COL + ';text-transform:uppercase;letter-spacing:.06em;margin:12px 0 4px;padding-bottom:3px;border-bottom:1px solid rgba(' + RGB + ',.2)">' + lbl + '</div>';
  }

  /* ── POPUP: DETTAGLIO VOCI ── */
  function openDettaglio(c) {
    var h = H();
    var mat   = N(S(h, c.pk_materia));
    var tras  = N(S(h, c.pk_trasporto));
    var oneri = N(S(h, c.pk_oneri));
    var acc   = N(S(h, c.pk_accise));
    var iva   = N(S(h, c.pk_iva));
    var rai   = N(S(h, c.pk_canone_rai));
    var bon   = N(S(h, c.pk_bonus)) + N(S(h, c.pk_bonus_soc));
    var gse   = N(S(h, c.pk_credito_gse));
    var tot   = N(S(h, c.pk_costo_mese));
    var kwh   = N(S(h, c.pk_kwh_mese));
    var costoKwh = N(S(h, c.pk_costo_kwh));
    var trim  = S(h, c.pk_arera_trim) || '—';
    var now   = new Date();

    var content = sec('Componenti Bolletta')
      + row('⚡ Materia Energia',  mat.toFixed(2)  + ' €', COL)
      + row('🚛 Trasporto e Rete', tras.toFixed(2) + ' €', '#fff')
      + row('🔧 Oneri di Sistema', oneri.toFixed(2)+ ' €', '#fff')
      + row('📋 Accise',           acc.toFixed(2)  + ' €', '#fff')
      + row('💸 IVA',              iva.toFixed(2)  + ' €', 'rgba(255,255,255,.6)')
      + row('📺 Canone RAI',       rai.toFixed(2)  + ' €', 'rgba(255,255,255,.6)')
      + (bon > 0 ? row('🎁 Bonus detratto', '− ' + bon.toFixed(2) + ' €', '#4ade80') : '')
      + (gse > 0 ? row('☀️ Credito GSE', '− ' + gse.toFixed(2) + ' €', '#4ade80') : '')
      + '<div style="display:flex;justify-content:space-between;align-items:center;background:rgba(' + RGB + ',.12);border-radius:10px;padding:12px 14px;margin-top:10px">'
      + '<span style="font-size:14px;font-weight:800;color:' + COL + '">TOTALE DA PAGARE</span>'
      + '<span style="font-size:18px;font-weight:900;color:' + COL + '">' + tot.toFixed(2) + ' €</span>'
      + '</div>'
      + sec('Dettaglio Tariffe ARERA ' + trim)
      + row('kWh Consumati', kwh.toFixed(1) + ' kWh', '#fff')
      + row('Prezzo Energia', (N(S(h,c.pk_tariffa)) * 100).toFixed(4) + ' c€/kWh', '#fff')
      + row('Costo All-in/kWh', (costoKwh * 100).toFixed(3) + ' c€/kWh', COL)
      + row('Mese', MESIL[now.getMonth()] + ' ' + now.getFullYear(), 'rgba(255,255,255,.5)');

    mkOv(popShell('🧾', 'Dettaglio Bolletta', MESIL[now.getMonth()] + ' ' + now.getFullYear(), 'bp-det-close', content), 'bp-det-close');
  }

  /* ── POPUP: SIMULATORE ── */
  function openSimulatore(card, c) {
    var h = H();
    var iSt = 'width:100%;padding:9px 12px;border-radius:9px;background:#0b1422;color:#fff;border:1px solid rgba(255,255,255,.18);font-size:14px;font-family:monospace;box-sizing:border-box;outline:none;margin-top:3px';

    var kwhInit  = N(S(h, c.pk_test_kwh))   || N(S(h, c.pk_kwh_mese)) || 0;
    var bonInit  = N(S(h, c.pk_test_bonus))  || 0;
    var gseInit  = N(S(h, c.pk_credito_gse)) || 0;

    var r = calcBill(kwhInit, h, c);
    var totInit = r.imp + r.acc + r.iva + r.rai - bonInit - gseInit;

    function buildResult(kwh, bon, gse) {
      var b = calcBill(kwh, h, c);
      var tot = b.imp + b.acc + b.iva + b.rai - bon - gse;
      return '<div style="background:rgba(' + RGB + ',.1);border-radius:12px;padding:14px;margin-top:14px">'
        + '<div style="font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Bolletta Simulata</div>'
        + '<div style="font-size:36px;font-weight:900;color:' + COL + ';line-height:1">' + tot.toFixed(2) + '<span style="font-size:16px;font-weight:600;color:rgba(255,255,255,.5);margin-left:3px">€</span></div>'
        + '<div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:4px">'
        + '<div style="font-size:11px;color:rgba(255,255,255,.5)">Materia: <b style="color:#fff">' + b.mat.toFixed(2) + ' €</b></div>'
        + '<div style="font-size:11px;color:rgba(255,255,255,.5)">Trasporto: <b style="color:#fff">' + b.tras.toFixed(2) + ' €</b></div>'
        + '<div style="font-size:11px;color:rgba(255,255,255,.5)">Oneri: <b style="color:#fff">' + b.oneri.toFixed(2) + ' €</b></div>'
        + '<div style="font-size:11px;color:rgba(255,255,255,.5)">Accise: <b style="color:#fff">' + b.acc.toFixed(2) + ' €</b></div>'
        + '<div style="font-size:11px;color:rgba(255,255,255,.5)">IVA ' + b.iva_perc.toFixed(0) + '%: <b style="color:#fff">' + b.iva.toFixed(2) + ' €</b></div>'
        + '<div style="font-size:11px;color:rgba(255,255,255,.5)">RAI: <b style="color:#fff">' + b.rai.toFixed(2) + ' €</b></div>'
        + (bon > 0 ? '<div style="font-size:11px;color:#4ade80">Bonus: <b>− ' + bon.toFixed(2) + ' €</b></div>' : '')
        + (gse > 0 ? '<div style="font-size:11px;color:#4ade80">GSE: <b>− ' + gse.toFixed(2) + ' €</b></div>' : '')
        + '<div style="font-size:11px;color:rgba(255,255,255,.5)">€/kWh: <b style="color:' + COL + '">' + (kwh > 0 ? (tot/kwh).toFixed(4) : '—') + '</b></div>'
        + '</div>'
        + '</div>';
    }

    var content = sec('Simula la tua bolletta')
      + '<div style="margin-bottom:10px">'
      + '<label style="font-size:12px;color:rgba(255,255,255,.7)">kWh consumati nel mese</label>'
      + '<input id="sim-kwh" type="text" inputmode="decimal" value="' + kwhInit.toFixed(0) + '" style="' + iSt + '" placeholder="es. 250">'
      + '</div>'
      + '<div style="margin-bottom:10px">'
      + '<label style="font-size:12px;color:rgba(255,255,255,.7)">Bonus / sconti (€)</label>'
      + '<input id="sim-bon" type="text" inputmode="decimal" value="' + bonInit.toFixed(2) + '" style="' + iSt + '" placeholder="es. 0.00">'
      + '</div>'
      + '<div style="margin-bottom:10px">'
      + '<label style="font-size:12px;color:rgba(255,255,255,.7)">Credito GSE (€, solo FV)</label>'
      + '<input id="sim-gse" type="text" inputmode="decimal" value="' + gseInit.toFixed(2) + '" style="' + iSt + '" placeholder="es. 0.00">'
      + '</div>'
      + '<button id="sim-calc" style="width:100%;padding:11px;border-radius:10px;background:' + COL + ';color:#000;font-size:14px;font-weight:800;border:none;cursor:pointer">Calcola Bolletta</button>'
      + '<div id="sim-result">' + buildResult(kwhInit, bonInit, gseInit) + '</div>';

    var ov = mkOv(popShell('🧮', 'Simulatore Bolletta', 'Stima costi mensili', 'bp-sim-close', content), 'bp-sim-close');
    ov.querySelector('#sim-calc').addEventListener('click', function() {
      var kwh = N(ov.querySelector('#sim-kwh').value);
      var bon = N(ov.querySelector('#sim-bon').value);
      var gse = N(ov.querySelector('#sim-gse').value);
      ov.querySelector('#sim-result').innerHTML = buildResult(kwh, bon, gse);
      setNum(c.pk_test_kwh, kwh);
      setNum(c.pk_test_bonus, bon);
    });
  }

  /* ── POPUP: STORICO ── */
  function openStorico(c) {
    var h = H(), now = new Date(), curM = now.getMonth() + 1, yr = now.getFullYear();
    var curr = [], prev = [], kwhC = [], kwhP = [];
    for (var i = 1; i <= 12; i++) {
      var mm = (i < 10 ? '0' : '') + i;
      curr.push(N(S(h, c['pk_m_'  + mm])));
      prev.push(N(S(h, c['pk_p_'  + mm])));
      kwhC.push(N(S(h, c['pk_k_'  + mm])));
      kwhP.push(N(S(h, c['pk_kp_' + mm])));
    }
    curr[curM - 1] = N(S(h, c.pk_costo_mese));
    kwhC[curM - 1] = N(S(h, c.pk_kwh_mese));

    var maxV = Math.max.apply(null, curr.concat(prev).concat([1]));
    var barH = function(v, col) {
      var pct = Math.max(4, Math.round((v / maxV) * 90));
      return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0">'
        + '<div style="font-size:8px;color:rgba(255,255,255,.45);height:12px;display:flex;align-items:flex-end">' + (v > 0 ? v.toFixed(0) : '') + '</div>'
        + '<div style="width:100%;border-radius:3px 3px 0 0;background:' + col + ';height:' + pct + 'px;min-height:3px"></div>'
        + '</div>';
    };

    var barsHtml = '<div style="display:flex;align-items:flex-end;gap:3px;height:118px;padding:6px 0 0">';
    for (var j = 0; j < 12; j++) {
      var isCur = (j + 1) === curM;
      barsHtml += '<div style="flex:1;display:flex;flex-direction:column;gap:1px;align-items:center;min-width:0">'
        + '<div style="display:flex;align-items:flex-end;gap:1px;width:100%;height:100px">'
        + barH(prev[j], 'rgba(255,255,255,.18)')
        + barH(curr[j], isCur ? COL : 'rgba(' + RGB + ',.45)')
        + '</div>'
        + '<div style="font-size:7.5px;color:rgba(255,255,255,' + (isCur ? '1' : '.35') + ');margin-top:2px;font-weight:' + (isCur ? '800' : '400') + '">' + MESI[j] + '</div>'
        + '</div>';
    }
    barsHtml += '</div>';
    barsHtml += '<div style="display:flex;gap:14px;margin-top:5px;padding:6px 0;border-top:1px solid rgba(255,255,255,.06)">'
      + '<div style="display:flex;align-items:center;gap:5px"><div style="width:9px;height:9px;background:rgba(255,255,255,.18);border-radius:2px"></div><span style="font-size:10px;color:rgba(255,255,255,.45)">' + (yr-1) + '</span></div>'
      + '<div style="display:flex;align-items:center;gap:5px"><div style="width:9px;height:9px;background:' + COL + ';border-radius:2px"></div><span style="font-size:10px;color:rgba(255,255,255,.7)">' + yr + '</span></div>'
      + '</div>';

    var listHtml = sec('Dettaglio Mensile ' + yr);
    for (var k = curM - 1; k >= 0; k--) {
      var cE = curr[k], pE = prev[k], cK = kwhC[k], pK = kwhP[k];
      var diff = cE - pE; var diffC = diff >= 0 ? '#f87171' : '#4ade80';
      listHtml += '<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
        + '<div><div style="font-size:13px;color:#fff;font-weight:600">' + MESIL[k] + '</div>'
        + '<div style="font-size:10px;color:rgba(255,255,255,.35);margin-top:1px">' + cK.toFixed(0) + ' kWh' + (pK > 0 ? ' · prec. ' + pK.toFixed(0) + ' kWh' : '') + '</div></div>'
        + '<div style="text-align:right"><div style="font-size:14px;color:#fff;font-weight:700">' + cE.toFixed(2) + ' €</div>'
        + (pE > 0 ? '<div style="font-size:10px;color:' + diffC + ';margin-top:1px">' + (diff >= 0 ? '+' : '') + diff.toFixed(2) + ' € vs ' + (yr-1) + '</div>' : '')
        + '</div>'
        + '</div>';
    }
    var annoTot = N(S(h, c.pk_anno));
    listHtml += '<div style="display:flex;justify-content:space-between;align-items:center;background:rgba(' + RGB + ',.1);border-radius:10px;padding:11px 13px;margin-top:8px">'
      + '<span style="font-size:13px;font-weight:800;color:' + COL + '">Totale Anno ' + yr + '</span>'
      + '<span style="font-size:16px;font-weight:900;color:' + COL + '">' + annoTot.toFixed(2) + ' €</span>'
      + '</div>';

    mkOv(popShell('📊', 'Storico Bollette', 'Confronto anno corrente vs precedente', 'bp-stor-close', barsHtml + listHtml), 'bp-stor-close');
  }

  /* ── POPUP: IMPOSTAZIONI ── */
  function openImpostazioni(card, c) {
    var h = H();
    var iSt = 'width:100%;padding:8px 10px;border-radius:8px;background:#0b1422;color:#fff;border:1px solid rgba(255,255,255,.15);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none;margin-top:3px';
    var lSt = 'font-size:11px;color:rgba(255,255,255,.6);display:block;margin-top:8px';

    function inp(id, val, ph) {
      return '<input id="' + id + '" type="text" inputmode="decimal" value="' + (val || '') + '" placeholder="' + (ph || '') + '" style="' + iSt + '">';
    }
    function lbl(t) { return '<label style="' + lSt + '">' + t + '</label>'; }

    var tabCSS = '<style>'
      + '.bp-tab{flex:1;padding:8px 4px;text-align:center;font-size:11px;font-weight:700;cursor:pointer;border-radius:8px;transition:all .15s;color:rgba(255,255,255,.5);border:none;background:transparent}'
      + '.bp-tab.active{background:rgba(' + RGB + ',.18);color:' + COL + ';border:1px solid rgba(' + RGB + ',.3)}'
      + '.bp-panel{display:none}.bp-panel.active{display:block}'
      + '</style>';

    var tabs = '<div style="display:flex;gap:4px;background:rgba(255,255,255,.04);border-radius:10px;padding:3px;margin-bottom:12px">'
      + '<button class="bp-tab active" data-tab="contratto">Contratto</button>'
      + '<button class="bp-tab" data-tab="arera">ARERA</button>'
      + '<button class="bp-tab" data-tab="mensili">Mensili</button>'
      + '<button class="bp-tab" data-tab="sensori">Sensori</button>'
      + '</div>';

    var pContratto = '<div class="bp-panel active" id="bp-p-contratto">'
      + lbl('Prezzo fisso energia (€/kWh)') + inp('bp-tariffa', N(S(h,c.pk_tariffa)).toFixed(6), '0.090000')
      + lbl('Spread energia (€/kWh)') + inp('bp-spread', N(S(h,c.pk_spread)).toFixed(6), '0.000000')
      + lbl('Potenza impegnata (kW)') + inp('bp-potenza', N(S(h,c.pk_potenza)).toFixed(1), '4.5')
      + lbl('Commercializzazione (€/mese)') + inp('bp-comm', N(S(h,c.pk_fb_comm)).toFixed(2), '6.00')
      + '</div>';

    var pArera = '<div class="bp-panel" id="bp-p-arera">'
      + '<div style="font-size:10px;color:rgba(255,255,255,.35);margin-bottom:8px">Valori fallback — usati se ARERA REST non disponibile</div>'
      + lbl('Perdite rete (%)') + inp('bp-perdite', N(S(h,c.pk_fb_perdite)).toFixed(2), '8.73')
      + lbl('DISPbt (€/mese)') + inp('bp-dispbt', N(S(h,c.pk_fb_dispbt)).toFixed(6), '0.102592')
      + lbl('Dispacciamento (€/kWh)') + inp('bp-disp', N(S(h,c.pk_fb_disp)).toFixed(6), '0.010660')
      + lbl('Mercato Capacità (€/kWh)') + inp('bp-mc', N(S(h,c.pk_fb_mc)).toFixed(6), '0.010583')
      + lbl('Trasporto Energia (€/kWh)') + inp('bp-tr-en', N(S(h,c.pk_fb_tr_en)).toFixed(6), '0.011900')
      + lbl('Trasporto Fisso (€/mese)') + inp('bp-tr-fis', N(S(h,c.pk_fb_tr_fis)).toFixed(2), '1.92')
      + lbl('Trasporto Potenza (€/kW)') + inp('bp-tr-pot', N(S(h,c.pk_fb_tr_pot)).toFixed(2), '2.22')
      + lbl('UC3 (€/kWh)') + inp('bp-uc3', N(S(h,c.pk_fb_uc3)).toFixed(6), '0.002760')
      + lbl('UC6 Fisso (€/kW)') + inp('bp-uc6f', N(S(h,c.pk_fb_uc6f)).toFixed(6), '0.070000')
      + lbl('UC6 Variabile (€/kWh)') + inp('bp-uc6v', N(S(h,c.pk_fb_uc6v)).toFixed(6), '0.000070')
      + lbl('ARIM (€/kWh)') + inp('bp-arim', N(S(h,c.pk_fb_arim)).toFixed(6), '0.001638')
      + lbl('ASOS (€/kWh)') + inp('bp-asos', N(S(h,c.pk_fb_asos)).toFixed(6), '0.028657')
      + lbl('Accise (€/kWh)') + inp('bp-accise', N(S(h,c.pk_fb_accise)).toFixed(6), '0.022700')
      + lbl('IVA (%)') + inp('bp-iva', N(S(h,c.pk_fb_iva)).toFixed(1), '10.0')
      + '</div>';

    var pMensili = '<div class="bp-panel" id="bp-p-mensili">'
      + lbl('Bonus mese corrente (€)') + inp('bp-bonus', N(S(h,c.pk_bonus)).toFixed(2), '0.00')
      + lbl('Bonus sociale (€)') + inp('bp-bonus-soc', N(S(h,c.pk_bonus_soc)).toFixed(2), '0.00')
      + lbl('Credito GSE - Scambio sul Posto (€)') + inp('bp-gse', N(S(h,c.pk_credito_gse)).toFixed(2), '0.00')
      + '<div style="font-size:10px;color:rgba(255,255,255,.35);margin-top:6px">Il credito GSE viene aggiornato manualmente quando si riceve il rendiconto trimestrale</div>'
      + '</div>';

    var pSensori = '<div class="bp-panel" id="bp-p-sensori">'
      + '<div style="font-size:10px;color:rgba(255,255,255,.35);margin-bottom:8px">ID entità HA — lascia vuoto per usare il default PKG</div>'
      + lbl('Potenza istantanea (W)') + '<input id="bp-s-ist" type="text" value="' + c.pk_consumo_ist + '" style="' + iSt + '">'
      + lbl('Costo Mensile (€)') + '<input id="bp-s-cm" type="text" value="' + c.pk_costo_mese + '" style="' + iSt + '">'
      + lbl('Costo Oggi (€)') + '<input id="bp-s-cg" type="text" value="' + c.pk_costo_oggi + '" style="' + iSt + '">'
      + lbl('kWh Mese') + '<input id="bp-s-km" type="text" value="' + c.pk_kwh_mese + '" style="' + iSt + '">'
      + lbl('kWh Oggi') + '<input id="bp-s-kg" type="text" value="' + c.pk_kwh_oggi + '" style="' + iSt + '">'
      + lbl('Proiezione Fine Mese (€)') + '<input id="bp-s-prj" type="text" value="' + c.pk_proiezione_e + '" style="' + iSt + '">'
      + '</div>';

    var saveBtn = '<div style="display:flex;gap:8px;margin-top:14px">'
      + '<button id="bp-imp-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.08);color:#fff">Annulla</button>'
      + '<button id="bp-imp-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:' + COL + ';color:#000">Salva</button>'
      + '</div>';

    var ov = mkOv(popShell('⚙', 'Impostazioni Bolletta', 'Contratto · ARERA · Mensili · Sensori', 'bp-imp-close', tabCSS + tabs + pContratto + pArera + pMensili + pSensori + saveBtn), 'bp-imp-close');

    ov.querySelectorAll('.bp-tab').forEach(function(t) {
      t.addEventListener('click', function() {
        ov.querySelectorAll('.bp-tab').forEach(function(x) { x.classList.remove('active'); });
        ov.querySelectorAll('.bp-panel').forEach(function(x) { x.classList.remove('active'); });
        t.classList.add('active');
        var p = ov.querySelector('#bp-p-' + t.dataset.tab);
        if (p) p.classList.add('active');
      });
    });

    function g(id) { var e = ov.querySelector('#' + id); return e ? e.value.trim() : ''; }

    ov.querySelector('#bp-imp-cancel').addEventListener('click', function() { ov._close(); });
    ov.querySelector('#bp-imp-save').addEventListener('click', function() {
      setNum(c.pk_tariffa,     g('bp-tariffa'));
      setNum(c.pk_spread,      g('bp-spread'));
      setNum(c.pk_potenza,     g('bp-potenza'));
      setNum(c.pk_fb_comm,     g('bp-comm'));
      setNum(c.pk_fb_perdite,  g('bp-perdite'));
      setNum(c.pk_fb_dispbt,   g('bp-dispbt'));
      setNum(c.pk_fb_disp,     g('bp-disp'));
      setNum(c.pk_fb_mc,       g('bp-mc'));
      setNum(c.pk_fb_tr_en,    g('bp-tr-en'));
      setNum(c.pk_fb_tr_fis,   g('bp-tr-fis'));
      setNum(c.pk_fb_tr_pot,   g('bp-tr-pot'));
      setNum(c.pk_fb_uc3,      g('bp-uc3'));
      setNum(c.pk_fb_uc6f,     g('bp-uc6f'));
      setNum(c.pk_fb_uc6v,     g('bp-uc6v'));
      setNum(c.pk_fb_arim,     g('bp-arim'));
      setNum(c.pk_fb_asos,     g('bp-asos'));
      setNum(c.pk_fb_accise,   g('bp-accise'));
      setNum(c.pk_fb_iva,      g('bp-iva'));
      setNum(c.pk_bonus,       g('bp-bonus'));
      setNum(c.pk_bonus_soc,   g('bp-bonus-soc'));
      setNum(c.pk_credito_gse, g('bp-gse'));
      var stored = load(card);
      stored.pk_consumo_ist  = g('bp-s-ist')  || stored.pk_consumo_ist;
      stored.pk_costo_mese   = g('bp-s-cm')   || stored.pk_costo_mese;
      stored.pk_costo_oggi   = g('bp-s-cg')   || stored.pk_costo_oggi;
      stored.pk_kwh_mese     = g('bp-s-km')   || stored.pk_kwh_mese;
      stored.pk_kwh_oggi     = g('bp-s-kg')   || stored.pk_kwh_oggi;
      stored.pk_proiezione_e = g('bp-s-prj')  || stored.pk_proiezione_e;
      save(card, stored);
      ov._close();
    });
  }

  /* ── POPUP: CONFIGURA ENTITÀ (wizard) ── */
  function openCfg(card, el) {
    var h = H(), cf = cfgFor(card);
    var states = (h && h.states) || {};
    var allIds = Object.keys(states).sort();
    var iSt = 'width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    var stDrop = 'position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:200;max-height:150px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-radius:9px;display:none;scrollbar-width:none';

    function field(fid, lbl2, val) {
      return '<div style="margin-bottom:9px;position:relative"><label style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:rgba(255,255,255,.5);display:block;margin-bottom:2px">' + lbl2 + '</label>'
        + '<input id="' + fid + '" type="text" value="' + (val || '') + '" autocomplete="off" placeholder="Cerca entità…" style="' + iSt + '">'
        + '<div id="' + fid + '-d" style="' + stDrop + '"></div></div>';
    }

    var formHtml = field('bc-ist',  'Potenza istantanea (W)',  cf.pk_consumo_ist)
      + field('bc-cm',   'Costo mensile (€)',        cf.pk_costo_mese)
      + field('bc-cg',   'Costo oggi (€)',           cf.pk_costo_oggi)
      + field('bc-km',   'kWh mese',                 cf.pk_kwh_mese)
      + field('bc-kg',   'kWh oggi',                 cf.pk_kwh_oggi)
      + field('bc-prj',  'Proiezione fine mese (€)', cf.pk_proiezione_e)
      + field('bc-mat',  'Materia energia (€)',       cf.pk_materia)
      + field('bc-tras', 'Trasporto (€)',             cf.pk_trasporto)
      + field('bc-trim', 'Trimestre ARERA',           cf.pk_arera_trim)
      + '<div style="display:flex;gap:8px;margin-top:14px">'
      + '<button id="bc-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>'
      + '<button id="bc-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:' + COL + ';color:#000">Salva</button>'
      + '</div>';

    var allFieldIds = ['bc-ist','bc-cm','bc-cg','bc-km','bc-kg','bc-prj','bc-mat','bc-tras','bc-trim'];
    var ov = mkOv(popShell('🔧', 'Configura Sensori', 'Entity ID sensori HA', 'bc-close', formHtml), 'bc-close');

    allFieldIds.forEach(function(fid) {
      var inp2 = ov.querySelector('#' + fid), drop2 = ov.querySelector('#' + fid + '-d');
      if (!inp2 || !drop2) return;
      function showDrop() {
        var q = inp2.value.toLowerCase().trim();
        var hits = (q ? allIds.filter(function(id) { return id.toLowerCase().includes(q); }) : allIds).slice(0,40);
        if (!hits.length) { drop2.style.display = 'none'; return; }
        drop2.style.display = 'block';
        drop2.innerHTML = hits.map(function(id) { return '<div data-pick="' + id + '" style="padding:6px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#e2e8f0">' + id + '</div>'; }).join('');
        drop2.querySelectorAll('[data-pick]').forEach(function(r) {
          r.addEventListener('mousedown', function(ev) { ev.preventDefault(); inp2.value = r.getAttribute('data-pick'); drop2.style.display = 'none'; });
          r.addEventListener('mouseover', function() { r.style.background='rgba(255,255,255,.08)'; });
          r.addEventListener('mouseout', function() { r.style.background=''; });
        });
      }
      inp2.addEventListener('focus', showDrop);
      inp2.addEventListener('input', showDrop);
      inp2.addEventListener('blur', function() { setTimeout(function() { drop2.style.display='none'; }, 200); });
    });

    function g(id) { var e = ov.querySelector('#'+id); return e ? e.value.trim() : ''; }
    ov.querySelector('#bc-cancel').addEventListener('click', function() { ov._close(); });
    ov.querySelector('#bc-save').addEventListener('click', function() {
      var stored = load(card);
      stored.pk_consumo_ist  = g('bc-ist')  || pkDefaults().pk_consumo_ist;
      stored.pk_costo_mese   = g('bc-cm')   || pkDefaults().pk_costo_mese;
      stored.pk_costo_oggi   = g('bc-cg')   || pkDefaults().pk_costo_oggi;
      stored.pk_kwh_mese     = g('bc-km')   || pkDefaults().pk_kwh_mese;
      stored.pk_kwh_oggi     = g('bc-kg')   || pkDefaults().pk_kwh_oggi;
      stored.pk_proiezione_e = g('bc-prj')  || pkDefaults().pk_proiezione_e;
      stored.pk_materia      = g('bc-mat')  || pkDefaults().pk_materia;
      stored.pk_trasporto    = g('bc-tras') || pkDefaults().pk_trasporto;
      stored.pk_arera_trim   = g('bc-trim') || pkDefaults().pk_arera_trim;
      save(card, stored);
      ov._close();
      try { el._fcSig = ''; el.innerHTML = render(card); } catch(e) {}
    });
  }

  /* ── RENDER ── */
  function render(card) {
    var h = H(), c = cfgFor(card);
    var rid = 'fboll' + (card.id || Math.random().toString(36).slice(2,8));
    var now = new Date(), curM = now.getMonth() + 1;

    var wLive    = N(S(h, c.pk_consumo_ist));
    var kwhM     = N(S(h, c.pk_kwh_mese));
    var kwhG     = N(S(h, c.pk_kwh_oggi));
    var costoM   = N(S(h, c.pk_costo_mese));
    var costoG   = N(S(h, c.pk_costo_oggi));
    var proiE    = N(S(h, c.pk_proiezione_e));
    var proiK    = N(S(h, c.pk_proiezione_k));
    var costoKwh = N(S(h, c.pk_costo_kwh));
    var mediaG   = N(S(h, c.pk_media_g));
    var annoTot  = N(S(h, c.pk_anno));
    var trim     = S(h, c.pk_arera_trim) || '—';
    var haFv     = S(h, c.pk_ha_fv) === 'on';
    var gseCredit= N(S(h, c.pk_credito_gse));

    var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var dayNow = now.getDate();
    var percMese = Math.min(100, Math.round((dayNow / daysInMonth) * 100));

    var curr6 = [], labs6 = [];
    for (var i = 5; i >= 0; i--) {
      var mIdx = ((curM - 1 - i + 12) % 12) + 1;
      var mm = (mIdx < 10 ? '0' : '') + mIdx;
      curr6.push(i === 0 ? costoM : N(S(h, c['pk_m_' + mm])));
      labs6.push(MESI[mIdx - 1]);
    }
    var maxC = Math.max.apply(null, curr6.concat([1]));
    var miniBar = curr6.map(function(v, i) {
      var isLast = i === 5;
      var pct = Math.max(8, Math.round((v / maxC) * 60));
      return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">'
        + '<div style="font-size:8px;color:rgba(255,255,255,.4)">' + (v > 0 ? v.toFixed(0) : '') + '</div>'
        + '<div style="width:100%;border-radius:3px 3px 0 0;height:' + pct + 'px;background:' + (isLast ? COL : 'rgba(' + RGB + ',.3)') + '"></div>'
        + '<div style="font-size:7.5px;color:rgba(255,255,255,' + (isLast ? '1' : '.35') + ');font-weight:' + (isLast ? '700':'400') + '">' + labs6[i] + '</div>'
        + '</div>';
    }).join('');

    var wCol = wLive > 3000 ? '#f87171' : wLive > 1500 ? '#fb923c' : wLive > 500 ? '#fbbf24' : '#4ade80';
    var wFmt = wLive >= 1000 ? (wLive/1000).toFixed(2)+' kW' : wLive.toFixed(0)+' W';

    var css = '<style>'
      + '#' + rid + '{position:relative;width:100%;height:100%;min-height:290px;font-family:system-ui,sans-serif;display:block}'
      + '#' + rid + ' .fb-card{display:flex;flex-direction:column;height:100%;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#' + rid + ' .fb-card::before{content:"";position:absolute;top:0;left:0;right:0;height:220px;background:radial-gradient(ellipse at 50% 0%,rgba(' + RGB + ',.07) 0%,transparent 65%);pointer-events:none}'
      + '#' + rid + ' .fb-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .fb-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;background:rgba(' + RGB + ',.12);border:1px solid rgba(' + RGB + ',.25)}'
      + '#' + rid + ' .fb-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fb-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#' + rid + ' .fb-scroll::-webkit-scrollbar{display:none}'
      + '#' + rid + ' .fb-hero{padding:10px 14px 6px;text-align:center}'
      + '#' + rid + ' .fb-hero-val{font-size:52px;font-weight:900;color:#fff;line-height:1;letter-spacing:-2px}'
      + '#' + rid + ' .fb-hero-eur{font-size:22px;font-weight:600;color:rgba(255,255,255,.5);margin-left:2px}'
      + '#' + rid + ' .fb-hero-sub{font-size:11px;color:rgba(255,255,255,.4);margin-top:3px}'
      + '#' + rid + ' .fb-pills{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:8px}'
      + '#' + rid + ' .fb-pill{border-radius:20px;padding:4px 11px;font-size:11px;font-weight:700}'
      + '#' + rid + ' .fb-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:8px 14px}'
      + '#' + rid + ' .fb-stat{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:11px;padding:9px 6px;text-align:center}'
      + '#' + rid + ' .fb-stat-lbl{font-size:9px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.04em}'
      + '#' + rid + ' .fb-stat-val{font-size:14px;font-weight:800;color:#fff;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fb-stat-sub{font-size:9px;color:rgba(255,255,255,.35);margin-top:2px}'
      + '#' + rid + ' .fb-prog{margin:2px 14px 8px}'
      + '#' + rid + ' .fb-prog-hd{display:flex;justify-content:space-between;margin-bottom:3px}'
      + '#' + rid + ' .fb-prog-bar{height:4px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden}'
      + '#' + rid + ' .fb-chart{margin:0 14px 8px}'
      + '#' + rid + ' .fb-chart-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}'
      + '#' + rid + ' .fb-btns{display:flex;gap:5px;padding:0 14px 12px}'
      + '#' + rid + ' .fb-btn{flex:1;padding:8px 2px;border-radius:9px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);font-size:9.5px;font-weight:700;color:#fff;text-align:center;cursor:pointer}'
      + '#' + rid + ' .fb-btn:hover{background:rgba(' + RGB + ',.12);border-color:rgba(' + RGB + ',.3);color:' + COL + '}'
      + '#' + rid + ' [data-sya]{cursor:pointer}'
      + '@keyframes fbPulse{0%,100%{opacity:.6}50%{opacity:1}}'
      + '</style>';

    var heroHtml = '<div class="fb-hero" data-sya="popup-dettaglio">'
      + '<div class="fb-hero-val">' + costoM.toFixed(2).replace('.',',') + '<span class="fb-hero-eur">€</span></div>'
      + '<div class="fb-hero-sub">' + MESIL[now.getMonth()] + ' ' + now.getFullYear() + ' · ' + kwhM.toFixed(1) + ' kWh</div>'
      + '<div class="fb-pills">'
      + '<div class="fb-pill" style="background:rgba(' + RGB + ',.14);border:1px solid rgba(' + RGB + ',.3);color:' + COL + '">' + kwhM.toFixed(1) + ' kWh</div>'
      + '<div class="fb-pill" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.7)">' + (costoKwh * 100).toFixed(2) + ' c€/kWh</div>'
      + (haFv ? '<div class="fb-pill" style="background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.3);color:#fbbf24">☀️ FV</div>' : '')
      + (gseCredit > 0 ? '<div class="fb-pill" style="background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.25);color:#4ade80">GSE −' + gseCredit.toFixed(0) + '€</div>' : '')
      + '</div>'
      + '</div>';

    var statsHtml = '<div class="fb-stats">'
      + '<div class="fb-stat"><div class="fb-stat-lbl">📅 Oggi</div><div class="fb-stat-val">' + costoG.toFixed(2) + ' €</div><div class="fb-stat-sub">' + kwhG.toFixed(2) + ' kWh</div></div>'
      + '<div class="fb-stat" data-sya="popup-simulatore"><div class="fb-stat-lbl">🔮 Proiezione</div><div class="fb-stat-val">' + proiE.toFixed(0) + ' €</div><div class="fb-stat-sub">' + proiK.toFixed(0) + ' kWh</div></div>'
      + '<div class="fb-stat"><div class="fb-stat-lbl">⚡ Live</div><div class="fb-stat-val" style="color:' + wCol + '">' + wFmt + '</div><div class="fb-stat-sub">' + (wLive > 3000 ? 'Alto' : wLive > 1000 ? 'Medio' : 'Basso') + '</div></div>'
      + '</div>';

    var progHtml = '<div class="fb-prog">'
      + '<div class="fb-prog-hd"><span style="font-size:10px;color:rgba(255,255,255,.4)">Avanzamento mese</span><span style="font-size:10px;color:rgba(255,255,255,.5)">' + dayNow + '/' + daysInMonth + ' gg</span></div>'
      + '<div class="fb-prog-bar"><div style="height:100%;width:' + percMese + '%;background:rgba(' + RGB + ',.5);border-radius:2px"></div></div>'
      + '</div>';

    var chartHtml = '<div class="fb-chart" data-sya="popup-storico">'
      + '<div class="fb-chart-hd"><span style="font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.03em">Ultimi 6 mesi</span>'
      + '<span style="font-size:10px;color:rgba(255,255,255,.4)">Anno: ' + annoTot.toFixed(0) + ' €</span></div>'
      + '<div style="display:flex;gap:3px;align-items:flex-end;height:82px">' + miniBar + '</div>'
      + '</div>';

    var btnsHtml = '<div class="fb-btns">'
      + '<div class="fb-btn" data-sya="popup-dettaglio">🧾 Dettaglio</div>'
      + '<div class="fb-btn" data-sya="popup-simulatore">🧮 Simula</div>'
      + '<div class="fb-btn" data-sya="popup-storico">📊 Storico</div>'
      + '<div class="fb-btn" data-sya="popup-impostazioni">⚙ Imposta</div>'
      + '</div>';

    return css
      + '<div id="' + rid + '">'
      + '<div class="fb-card">'
      + '<div class="fb-hdr">'
      + '<div class="fb-hdr-iw">⚡</div>'
      + '<div class="fb-hdr-tit">' + (c.name || 'Bolletta') + '</div>'
      + '<div style="font-size:9px;font-weight:700;padding:3px 8px;border-radius:20px;background:rgba(' + RGB + ',.12);border:1px solid rgba(' + RGB + ',.25);color:' + COL + '">ARERA ' + trim + '</div>'
      + '</div>'
      + '<div class="fb-scroll">'
      + heroHtml
      + statsHtml
      + progHtml
      + chartHtml
      + btnsHtml
      + '</div>'
      + '</div>'
      + '</div>';
  }

  /* ── UPDATE / MOUNT ── */
  var CARD = { id: 'bolletta', version: '3.0', name: 'Bolletta Elettrica', icon: '⚡', color: COL };

  function update(card, hass, el) {
    var h = H(), c = cfgFor(card);
    var sig = [CARD.version, S(h,c.pk_costo_mese), S(h,c.pk_costo_oggi), S(h,c.pk_kwh_mese), S(h,c.pk_consumo_ist), S(h,c.pk_proiezione_e), S(h,c.pk_arera_trim)].join('|');
    if (!el.querySelector('.fb-card') || el._fcSig !== sig) {
      el._fcSig = sig;
      el.innerHTML = render(card);
    }
    mount(card, hass, el);
  }

  function mount(card, hass, el) {
    if (el._fcBound === CARD.version) return;
    el._fcBound = CARD.version;
    if (el._fcHandler) el.removeEventListener('click', el._fcHandler);
    el._fcHandler = function(e) {
      var sya = e.target.closest('[data-sya]'); if (!sya) return;
      var a = sya.dataset.sya;
      var c = cfgFor(card);
      if (a === 'popup-dettaglio')    { openDettaglio(c); return; }
      if (a === 'popup-simulatore')   { openSimulatore(card, c); return; }
      if (a === 'popup-storico')      { openStorico(c); return; }
      if (a === 'popup-impostazioni') { openImpostazioni(card, c); return; }
      if (a === 'popup-cfg')          { openCfg(card, el); return; }
    };
    el.addEventListener('click', el._fcHandler);
  }

  /* ── PKG YAML EMBEDDED ── */
  var _BOLL_PKG_YAML = '###############################################################\n#\n#   Package: Centro Controllo Bolletta Elettrica\n#   Versione: 1.0  |  Frarik / Fratech\n#\n###############################################################\n#\n# Installazione tramite wizard Frarik o manuale:\n# Modifica le IMPOSTAZIONI PACKAGE e copia in config/packages/\n#\n###############################################################\n\nhomeassistant:\n  customize:\n    package.node_anchors:\n      customize: &customize\n        package: \'Centro Controllo Bolletta Elettrica 1.0 — Frarik\'\n\n      setting:\n        Sensore Potenza Casa: &sensore_potenza_bolletta\n          \'IL_TUO_SENSORE_POTENZA_BOLLETTA\'\n        Tariffa Contratto: &tariffa_contratto IL_TUA_TARIFFA_KWHE\n        Potenza Contrattuale: &potenza_kw IL_TUA_POTENZA_KW\n        Device per notifica push: &push\n          - service: IL_TUO_MOBILE_APP_1\n\nnotify:\n  - name: frarik_bolletta\n    platform: group\n    services: *push\n\nutility_meter:\n  bolletta_energia_giornaliera:\n    source: sensor.bolletta_energia_totale_casa\n    name: "Bolletta Energia Giornaliera"\n    cycle: daily\n  bolletta_energia_mensile:\n    source: sensor.bolletta_energia_totale_casa\n    name: "Bolletta Energia Mensile"\n    cycle: monthly\n  bolletta_energia_annuale:\n    source: sensor.bolletta_energia_totale_casa\n    name: "Bolletta Energia Annuale"\n    cycle: yearly\n\nsensor:\n  - platform: integration\n    source: *sensore_potenza_bolletta\n    name: "Bolletta Energia Totale Casa"\n    unique_id: bolletta_energia_totale_casa\n    unit_prefix: k\n    unit_time: h\n    round: 3\n    method: left\n\ninput_boolean:\n  bolletta_ha_fotovoltaico:\n    name: "Bolletta Ha Fotovoltaico"\n    icon: mdi:solar-panel\n\ninput_number:\n  bolletta_tariffa_energia:\n    name: "Bolletta Tariffa Energia Fissa"\n    min: 0\n    max: 1\n    step: 0.000001\n    initial: *tariffa_contratto\n    mode: box\n    unit_of_measurement: "€/kWh"\n  bolletta_potenza_impegnata:\n    name: "Bolletta Potenza Impegnata"\n    min: 1.5\n    max: 15\n    step: 0.5\n    initial: *potenza_kw\n    mode: box\n    unit_of_measurement: "kW"\n  bolletta_bonus_mese_corrente:\n    name: "Bolletta Bonus Mese Corrente"\n    min: 0\n    max: 500\n    step: 0.01\n    initial: 0\n    mode: box\n    unit_of_measurement: "€"\n  bolletta_credito_gse:\n    name: "Bolletta Credito GSE (FV)"\n    min: 0\n    max: 2000\n    step: 0.01\n    initial: 0\n    mode: box\n    unit_of_measurement: "€"\n\n# (file completo: installare frarik_bolletta.yaml da config/packages/)\n';

  function _bBuildPkg(potenza, tariffa, kw, push) {
    var pushLines = (push && push.length)
      ? push.map(function(p) { return '          - service: ' + p; }).join('\n')
      : '          - service: mobile_app_smartphone';
    return _BOLL_PKG_YAML
      .split('IL_TUO_SENSORE_POTENZA_BOLLETTA').join(potenza || 'sensor.consumo_istantaneo')
      .split('IL_TUA_TARIFFA_KWHE').join((parseFloat(tariffa) || 0.09).toFixed(6))
      .split('IL_TUA_POTENZA_KW').join(String(parseFloat(kw) || 4.5))
      .replace('          - service: IL_TUO_MOBILE_APP_1', pushLines);
  }

  function openWizard(card, el) {
    var h = H(), states = (h && h.states) || {};
    var allIds = Object.keys(states).sort();
    var iSt = 'width:100%;padding:8px 10px;border-radius:8px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none;margin-top:3px';
    var stDrop = 'position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:200;max-height:130px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.15);border-radius:8px;display:none;scrollbar-width:none';

    function wfield(id, lbl2, ph) {
      return '<div style="margin-bottom:10px;position:relative"><label style="font-size:11px;color:rgba(255,255,255,.6);display:block;margin-bottom:2px">' + lbl2 + '</label>'
        + '<input id="' + id + '" type="text" autocomplete="off" placeholder="' + ph + '" style="' + iSt + '">'
        + '<div id="' + id + '-d" style="' + stDrop + '"></div></div>';
    }

    var formHtml = '<div style="font-size:11px;color:rgba(255,255,255,.4);background:rgba(' + RGB + ',.08);border-radius:8px;padding:10px;margin-bottom:12px">Configura i sensori e scarica il file <b style="color:' + COL + '">frarik_bolletta.yaml</b> da aggiungere in <code>config/packages/</code> di Home Assistant.</div>'
      + wfield('wz-pot', '⚡ Sensore Potenza Casa (W)', 'sensor.potenza_istantanea')
      + wfield('wz-tar', '💰 Tariffa Energia (€/kWh)', '0.090000')
      + wfield('wz-kw',  '🔌 Potenza Impegnata (kW)',   '4.5')
      + '<div style="margin-bottom:10px"><label style="font-size:11px;color:rgba(255,255,255,.6);display:block;margin-bottom:2px">📱 App notifica push</label>'
      + '<input id="wz-push" type="text" placeholder="notify.mobile_app_smartphone" style="' + iSt + '"></div>'
      + '<button id="wz-gen" style="width:100%;padding:11px;border-radius:10px;background:' + COL + ';color:#000;font-size:14px;font-weight:800;border:none;cursor:pointer">Genera YAML</button>'
      + '<div id="wz-out" style="display:none;margin-top:12px">'
      + '<div style="font-size:11px;color:rgba(255,255,255,.5);margin-bottom:4px">Copia e salva come <b>frarik_bolletta.yaml</b> in config/packages/</div>'
      + '<textarea id="wz-yaml" readonly style="width:100%;height:240px;background:#020810;color:#7dd3fc;border:1px solid rgba(255,255,255,.1);border-radius:8px;font-size:10px;font-family:monospace;padding:8px;box-sizing:border-box;resize:vertical"></textarea>'
      + '<button id="wz-copy" style="width:100%;margin-top:6px;padding:9px;border-radius:8px;background:rgba(255,255,255,.08);color:#fff;font-size:12px;font-weight:700;border:none;cursor:pointer">📋 Copia negli appunti</button>'
      + '</div>';

    var ov = mkOv(popShell('📦', 'Installa Package Bolletta', 'Wizard configurazione', 'wz-close', formHtml), 'wz-close');

    ['wz-pot'].forEach(function(fid) {
      var inp3 = ov.querySelector('#' + fid), drop3 = ov.querySelector('#' + fid + '-d');
      if (!inp3 || !drop3) return;
      function showDrop3() {
        var q = inp3.value.toLowerCase().trim();
        var hits = (q ? allIds.filter(function(id) { return id.toLowerCase().includes(q); }) : allIds.filter(function(id) { return id.startsWith('sensor.'); })).slice(0,30);
        if (!hits.length) { drop3.style.display = 'none'; return; }
        drop3.style.display = 'block';
        drop3.innerHTML = hits.map(function(id) { return '<div data-pick="' + id + '" style="padding:6px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#e2e8f0">' + id + '</div>'; }).join('');
        drop3.querySelectorAll('[data-pick]').forEach(function(r3) {
          r3.addEventListener('mousedown', function(ev) { ev.preventDefault(); inp3.value = r3.getAttribute('data-pick'); drop3.style.display = 'none'; });
          r3.addEventListener('mouseover', function() { r3.style.background='rgba(255,255,255,.08)'; });
          r3.addEventListener('mouseout', function() { r3.style.background=''; });
        });
      }
      inp3.addEventListener('focus', showDrop3);
      inp3.addEventListener('input', showDrop3);
      inp3.addEventListener('blur', function() { setTimeout(function() { drop3.style.display='none'; }, 200); });
    });

    function g3(id) { var e = ov.querySelector('#'+id); return e ? e.value.trim() : ''; }

    ov.querySelector('#wz-gen').addEventListener('click', function() {
      var yaml = _bBuildPkg(g3('wz-pot'), g3('wz-tar'), g3('wz-kw'), g3('wz-push') ? [g3('wz-push')] : null);
      var out = ov.querySelector('#wz-out'), ta = ov.querySelector('#wz-yaml');
      ta.value = yaml;
      out.style.display = 'block';
    });
    ov.querySelector('#wz-copy') && ov.querySelector('#wz-copy').addEventListener('click', function() {
      var ta = ov.querySelector('#wz-yaml');
      try { navigator.clipboard.writeText(ta.value).then(function() { ov.querySelector('#wz-copy').textContent = '✅ Copiato!'; }); } catch(e) { ta.select(); document.execCommand('copy'); ov.querySelector('#wz-copy').textContent = '✅ Copiato!'; }
    });
  }

  /* ── REGISTER ── */
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = {
    id: CARD.id,
    version: CARD.version,
    name: CARD.name,
    icon: CARD.icon,
    color: CARD.color,
    render: render,
    mount: mount,
    update: update,
  };

})();
