/* frarik-version: 4.3 */
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
  var _STORE_KEY = 'frarik_bolletta_cfg_v1';
  function load() { try { return JSON.parse(localStorage.getItem(_STORE_KEY) || '{}') || {}; } catch(e) { return {}; } }
  function save(o) { try { localStorage.setItem(_STORE_KEY, JSON.stringify(o)); } catch(e) {} }

  /* ── DEFAULTS ── */
  function pkDefaults() {
    return {
      pk_consumo_ist:   'sensor.consumo_istantaneo',
      pk_kwh_oggi:      'sensor.frarik_bolletta_energia_giornaliera_safe',
      pk_kwh_mese:      'sensor.frarik_bolletta_energia_mensile_safe',
      pk_costo_oggi:    'sensor.frarik_bolletta_giornaliera',
      pk_costo_mese:    'sensor.frarik_bolletta_mensile',
      pk_proiezione_e:  'sensor.frarik_bolletta_proiezione_fine_mese',
      pk_proiezione_k:  'sensor.frarik_bolletta_previsione_kwh_fine_mese',
      pk_anno:          'sensor.frarik_bolletta_totale_anno_corrente',
      pk_arera_trim:    'sensor.frarik_bolletta_arera_trimestre',
      pk_materia:       'sensor.frarik_bolletta_materia_energia_mensile',
      pk_trasporto:     'sensor.frarik_bolletta_trasporto_mensile',
      pk_oneri:         'sensor.frarik_bolletta_oneri_sistema_mensili',
      pk_accise:        'sensor.frarik_bolletta_costo_mensile_accise',
      pk_iva:           'sensor.frarik_bolletta_iva_mensile',
      pk_canone_rai:    'sensor.frarik_bolletta_canone_rai_mensile',
      pk_costo_kwh:     'sensor.frarik_bolletta_costo_per_kwh',
      pk_media_g:       'sensor.frarik_bolletta_consumo_medio_giornaliero',
      pk_diff_anno:     'sensor.frarik_bolletta_differenza_vs_anno_scorso',
      pk_tariffa:       'input_number.frarik_bolletta_tariffa_energia',
      pk_spread:        'input_number.frarik_bolletta_spread_energia',
      pk_potenza:       'input_number.frarik_bolletta_potenza_impegnata',
      pk_bonus:         'input_number.frarik_bolletta_bonus_mese_corrente',
      pk_bonus_soc:     'input_number.frarik_bolletta_bonus_sociale',
      pk_credito_gse:   'input_number.frarik_bolletta_credito_gse',
      pk_ha_fv:         'input_boolean.frarik_bolletta_ha_fotovoltaico',
      pk_fv_prod_ist:   '',
      pk_fv_kwh_oggi:   '',
      pk_fv_kwh_mese:   '',
      pk_test_kwh:      'input_number.frarik_bolletta_test_consumo_kwh',
      pk_test_bonus:    'input_number.frarik_bolletta_test_bonus_euro',
      pk_fb_perdite:    'input_number.frarik_bolletta_fb_perdite_perc',
      pk_fb_dispbt:     'input_number.frarik_bolletta_fb_dispbt',
      pk_fb_disp:       'input_number.frarik_bolletta_fb_dispacciamento',
      pk_fb_mc:         'input_number.frarik_bolletta_fb_mercato_capacita',
      pk_fb_pno:        'input_number.frarik_bolletta_fb_pno',
      pk_fb_comm:       'input_number.frarik_bolletta_fb_commercializzazione',
      pk_fb_tr_en:      'input_number.frarik_bolletta_fb_trasporto_energia',
      pk_fb_tr_fis:     'input_number.frarik_bolletta_fb_trasporto_fisso',
      pk_fb_tr_pot:     'input_number.frarik_bolletta_fb_trasporto_potenza',
      pk_fb_uc3:        'input_number.frarik_bolletta_fb_uc3',
      pk_fb_uc6f:       'input_number.frarik_bolletta_fb_uc6_fisso',
      pk_fb_uc6v:       'input_number.frarik_bolletta_fb_uc6_variabile',
      pk_fb_arim:       'input_number.frarik_bolletta_fb_arim',
      pk_fb_asos:       'input_number.frarik_bolletta_fb_asos',
      pk_fb_accise:     'input_number.frarik_bolletta_fb_accise',
      pk_fb_iva:        'input_number.frarik_bolletta_fb_iva_perc',
      pk_m_01:'input_number.frarik_bolletta_storico_mese_curr_01', pk_m_02:'input_number.frarik_bolletta_storico_mese_curr_02',
      pk_m_03:'input_number.frarik_bolletta_storico_mese_curr_03', pk_m_04:'input_number.frarik_bolletta_storico_mese_curr_04',
      pk_m_05:'input_number.frarik_bolletta_storico_mese_curr_05', pk_m_06:'input_number.frarik_bolletta_storico_mese_curr_06',
      pk_m_07:'input_number.frarik_bolletta_storico_mese_curr_07', pk_m_08:'input_number.frarik_bolletta_storico_mese_curr_08',
      pk_m_09:'input_number.frarik_bolletta_storico_mese_curr_09', pk_m_10:'input_number.frarik_bolletta_storico_mese_curr_10',
      pk_m_11:'input_number.frarik_bolletta_storico_mese_curr_11', pk_m_12:'input_number.frarik_bolletta_storico_mese_curr_12',
      pk_p_01:'input_number.frarik_bolletta_storico_mese_prev_01', pk_p_02:'input_number.frarik_bolletta_storico_mese_prev_02',
      pk_p_03:'input_number.frarik_bolletta_storico_mese_prev_03', pk_p_04:'input_number.frarik_bolletta_storico_mese_prev_04',
      pk_p_05:'input_number.frarik_bolletta_storico_mese_prev_05', pk_p_06:'input_number.frarik_bolletta_storico_mese_prev_06',
      pk_p_07:'input_number.frarik_bolletta_storico_mese_prev_07', pk_p_08:'input_number.frarik_bolletta_storico_mese_prev_08',
      pk_p_09:'input_number.frarik_bolletta_storico_mese_prev_09', pk_p_10:'input_number.frarik_bolletta_storico_mese_prev_10',
      pk_p_11:'input_number.frarik_bolletta_storico_mese_prev_11', pk_p_12:'input_number.frarik_bolletta_storico_mese_prev_12',
      pk_k_01:'input_number.frarik_bolletta_storico_kwh_curr_01',  pk_k_02:'input_number.frarik_bolletta_storico_kwh_curr_02',
      pk_k_03:'input_number.frarik_bolletta_storico_kwh_curr_03',  pk_k_04:'input_number.frarik_bolletta_storico_kwh_curr_04',
      pk_k_05:'input_number.frarik_bolletta_storico_kwh_curr_05',  pk_k_06:'input_number.frarik_bolletta_storico_kwh_curr_06',
      pk_k_07:'input_number.frarik_bolletta_storico_kwh_curr_07',  pk_k_08:'input_number.frarik_bolletta_storico_kwh_curr_08',
      pk_k_09:'input_number.frarik_bolletta_storico_kwh_curr_09',  pk_k_10:'input_number.frarik_bolletta_storico_kwh_curr_10',
      pk_k_11:'input_number.frarik_bolletta_storico_kwh_curr_11',  pk_k_12:'input_number.frarik_bolletta_storico_kwh_curr_12',
      pk_kp_01:'input_number.frarik_bolletta_storico_kwh_prev_01', pk_kp_02:'input_number.frarik_bolletta_storico_kwh_prev_02',
      pk_kp_03:'input_number.frarik_bolletta_storico_kwh_prev_03', pk_kp_04:'input_number.frarik_bolletta_storico_kwh_prev_04',
      pk_kp_05:'input_number.frarik_bolletta_storico_kwh_prev_05', pk_kp_06:'input_number.frarik_bolletta_storico_kwh_prev_06',
      pk_kp_07:'input_number.frarik_bolletta_storico_kwh_prev_07', pk_kp_08:'input_number.frarik_bolletta_storico_kwh_prev_08',
      pk_kp_09:'input_number.frarik_bolletta_storico_kwh_prev_09', pk_kp_10:'input_number.frarik_bolletta_storico_kwh_prev_10',
      pk_kp_11:'input_number.frarik_bolletta_storico_kwh_prev_11', pk_kp_12:'input_number.frarik_bolletta_storico_kwh_prev_12',
    };
  }

  function cfgFor(card) {
    var c = load(), pk = pkDefaults(), r = {};
    Object.keys(pk).forEach(function(k) { r[k] = (c[k] !== undefined && c[k] !== '') ? c[k] : pk[k]; });
    r.name = c.name || 'Bolletta';
    return r;
  }

  /* ── BILL CALCULATION (mirrors PKG formula) ── */
  function calcBill(kwh, h, cf) {
    var _n = (load()._nums) || {};
    /* priority: ARERA REST sensor → _nums localStorage → HA input_number → hardcoded default */
    function nf(arera, nk, fbEid, def) {
      var a = N(S(h, arera)); if (a) return a;
      var lv = _n[nk]; if (lv !== undefined && lv !== '') { var p = parseFloat(lv); if (p) return p; }
      return N(S(h, fbEid)) || def;
    }
    function nc(nk, eid, def) {
      var lv = _n[nk]; if (lv !== undefined && lv !== '') { var p = parseFloat(lv); if (!isNaN(p) && p !== 0) return p; }
      return N(S(h, eid)) || def;
    }
    var perdPerc = nf('sensor.frarik_bolletta_arera_perdite_rete_perc','perdite',cf.pk_fb_perdite,9.85);
    var dispbt   = nf('sensor.frarik_bolletta_arera_dispbt','dispbt',cf.pk_fb_dispbt,0);
    var disp     = nf('sensor.frarik_bolletta_arera_dispacciamento','disp',cf.pk_fb_disp,0.019902);
    var mc       = nf('sensor.frarik_bolletta_arera_mercato_capacita','mc',cf.pk_fb_mc,0);
    var pno      = nf('sensor.frarik_bolletta_arera_pno','pno',cf.pk_fb_pno,0);
    var comm     = nc('comm',cf.pk_fb_comm,6);
    var tr_en    = nf('sensor.frarik_bolletta_arera_trasporto_quota_energia','tr_en',cf.pk_fb_tr_en,0.0119);
    var tr_fis   = nf('sensor.frarik_bolletta_arera_trasporto_quota_fissa','tr_fis',cf.pk_fb_tr_fis,1.92);
    var tr_pot   = nf('sensor.frarik_bolletta_arera_trasporto_quota_potenza','tr_pot',cf.pk_fb_tr_pot,1.96);
    var uc3      = nf('sensor.frarik_bolletta_arera_uc3','uc3',cf.pk_fb_uc3,0.00276);
    var uc6f     = nf('sensor.frarik_bolletta_arera_uc6_fisso','uc6f',cf.pk_fb_uc6f,0.016567);
    var uc6v     = nf('sensor.frarik_bolletta_arera_uc6_variabile','uc6v',cf.pk_fb_uc6v,0.00007);
    var arim     = nf('sensor.frarik_bolletta_arera_arim','arim',cf.pk_fb_arim,0.001638);
    var asos     = nf('sensor.frarik_bolletta_arera_asos','asos',cf.pk_fb_asos,0.028657);
    var erariale = nf('sensor.frarik_bolletta_arera_erariale','accise',cf.pk_fb_accise,0.022700);
    var iva_perc = nf('sensor.frarik_bolletta_arera_iva_perc','iva',cf.pk_fb_iva,10);
    var pE       = nc('tariffa',cf.pk_tariffa,0) + nc('spread',cf.pk_spread,0);
    var kw       = nc('potenza',cf.pk_potenza,4.5);

    var kp      = kwh * perdPerc / 100;
    var kwh_en  = kwh + kp;  /* perdite solo su materia energia, non su disp/mc */
    var rai_men = nc('rai_mensile','',9);

    var mat = kwh_en * pE               /* energia: prezzo × (kwh + perdite) */
            + kwh * disp                /* dispacciamento: kWh misurati */
            + kwh * mc                  /* mercato capacità: kWh misurati */
            + dispbt + pno + comm;
    var tras = kwh * tr_en + tr_fis + kw * tr_pot
             + kwh * uc3 + kw * uc6f + kwh * uc6v;
    var oneri = kwh * arim + kwh * asos;
    var acc   = kwh * erariale;
    var imp   = mat + tras + oneri;
    var iva   = (imp + acc) * iva_perc / 100;
    var now   = new Date();
    var rai   = (now.getMonth() + 1 === 7 || now.getMonth() + 1 === 8) ? 0 : rai_men;

    return { mat:mat, tras:tras, oneri:oneri, acc:acc, imp:imp, iva:iva, rai:rai,
             kp:kp, kwh_en:kwh_en, pE:pE, kw:kw, iva_perc:iva_perc };
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
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05)"><span style="font-size:12px;color:#fff">' + lbl + '</span><span style="font-size:13px;font-weight:800;color:' + (col || '#fff') + '">' + val + '</span></div>';
  }
  function sec(lbl) {
    return '<div style="font-size:10px;font-weight:700;color:' + COL + ';text-transform:uppercase;letter-spacing:.06em;margin:12px 0 4px;padding-bottom:3px;border-bottom:1px solid rgba(' + RGB + ',.2)">' + lbl + '</div>';
  }

  /* ── POPUP: DETTAGLIO VOCI ── */
  function openDettaglio(c) {
    var h = H();
    var _n   = (load()._nums) || {};
    var kwh  = N(S(h, c.pk_kwh_mese));
    var gse  = N(S(h, c.pk_credito_gse));
    var trim = S(h, c.pk_arera_trim) || '—';
    var now  = new Date();

    /* leggi voci dalla PKG; se tutte 0 → calcola con calcBill */
    var mat   = N(S(h, c.pk_materia));
    var tras  = N(S(h, c.pk_trasporto));
    var oneri = N(S(h, c.pk_oneri));
    var acc   = N(S(h, c.pk_accise));
    var iva   = N(S(h, c.pk_iva));
    var rai   = N(S(h, c.pk_canone_rai));
    var bon   = N(S(h, c.pk_bonus)) + N(S(h, c.pk_bonus_soc));
    var tot   = N(S(h, c.pk_costo_mese));
    var costoKwh = N(S(h, c.pk_costo_kwh));
    var fromCalc = false;

    if ((mat + tras + oneri + iva) < 0.01 && kwh > 0) {
      var r = calcBill(kwh, h, c);
      mat = r.mat; tras = r.tras; oneri = r.oneri; acc = r.acc; iva = r.iva; rai = r.rai;
      tot = r.imp + r.acc + r.iva - bon - gse;
      costoKwh = kwh > 0 ? tot / kwh : 0;
      fromCalc = true;
    }

    /* tariffa: leggi da localStorage, poi HA entity */
    var tariffaEur = (_n.tariffa !== undefined && _n.tariffa !== '') ? parseFloat(_n.tariffa) : N(S(h, c.pk_tariffa));

    var _raiInit = load()._rai_amt || 0;
    var baseTot = tot;
    var costoKwhStr = kwh >= 30 ? (costoKwh * 100).toFixed(2) + ' c€/kWh' : '—';
    var costoKwhCol = kwh >= 30 ? COL : 'rgba(255,255,255,.35)';

    var inpSt = 'width:80px;padding:5px 8px;border-radius:7px;background:#0b1422;color:#fff;border:1px solid rgba(255,255,255,.18);font-size:13px;font-family:monospace;text-align:right;outline:none;box-sizing:border-box';
    var raiRow = '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
      + '<span style="font-size:13px;color:#fff;font-weight:600">📺 Canone RAI</span>'
      + '<input id="bp-rai-inp" type="text" inputmode="decimal" value="' + (_raiInit > 0 ? _raiInit.toFixed(2) : '') + '" placeholder="0.00 €" style="' + inpSt + '">'
      + '</div>';

    var content = sec('Componenti Bolletta' + (fromCalc ? ' (stimate)' : ''))
      + row('⚡ Materia Energia',  mat.toFixed(2)  + ' €', COL)
      + row('🚛 Trasporto e Rete', tras.toFixed(2) + ' €', '#fff')
      + row('🔧 Oneri di Sistema', oneri.toFixed(2)+ ' €', '#fff')
      + row('📋 Accise',           acc.toFixed(2)  + ' €', '#fff')
      + row('💸 IVA',              iva.toFixed(2)  + ' €')
      + raiRow
      + (bon > 0 ? row('🎁 Bonus', '− ' + bon.toFixed(2) + ' €', '#4ade80') : '')
      + (gse > 0 ? row('☀️ Credito GSE', '− ' + gse.toFixed(2) + ' €', '#4ade80') : '')
      + '<div style="display:flex;justify-content:space-between;align-items:center;background:rgba(' + RGB + ',.12);border-radius:10px;padding:12px 14px;margin-top:10px">'
      + '<span style="font-size:14px;font-weight:800;color:' + COL + '">TOTALE DA PAGARE</span>'
      + '<span id="bp-det-tot" style="font-size:18px;font-weight:900;color:' + COL + '">' + (baseTot + _raiInit).toFixed(2) + ' €</span>'
      + '</div>'
      + row('📆 kWh consumati', kwh.toFixed(1) + ' kWh', '#fff')
      + row('📅 Mese', MESIL[now.getMonth()] + ' ' + now.getFullYear());

    var ov = mkOv(popShell('🧾', 'Dettaglio Bolletta', MESIL[now.getMonth()] + ' ' + now.getFullYear(), 'bp-det-close', content), 'bp-det-close');
    ov.querySelector('#bp-rai-inp').addEventListener('input', function() {
      var raiVal = N(this.value) || 0;
      save(Object.assign({}, load(), {_rai_amt: raiVal}));
      ov.querySelector('#bp-det-tot').textContent = (baseTot + raiVal).toFixed(2) + ' €';
    });
  }

  /* ── POPUP: SIMULATORE ── */
  function openSimulatore(card, c) {
    var h = H();
    var iSt = 'width:100%;padding:9px 12px;border-radius:9px;background:#0b1422;color:#fff;border:1px solid rgba(255,255,255,.18);font-size:14px;font-family:monospace;box-sizing:border-box;outline:none;margin-top:3px';

    var kwhInit  = N(S(h, c.pk_test_kwh))   || N(S(h, c.pk_kwh_mese)) || 0;
    var bonInit  = N(S(h, c.pk_test_bonus))  || 0;
    var gseInit  = N(S(h, c.pk_credito_gse)) || 0;

    function buildResult(kwh, bon, gse, rai) {
      var b = calcBill(kwh, h, c);
      var tot = b.imp + b.acc + b.iva + rai - bon - gse;
      function simRow(lbl, val, col) {
        return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
          + '<span style="font-size:12px;color:' + (col || '#fff') + '">' + lbl + '</span>'
          + '<span style="font-size:12px;font-weight:700;color:' + (col || '#fff') + '">' + val + '</span>'
          + '</div>';
      }
      return '<div style="background:rgba(' + RGB + ',.08);border:1px solid rgba(' + RGB + ',.18);border-radius:14px;padding:16px;margin-top:14px">'
        + '<div style="font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Bolletta Simulata</div>'
        + '<div style="font-size:36px;font-weight:900;color:' + COL + ';line-height:1;margin-bottom:14px">' + tot.toFixed(2) + '<span style="font-size:16px;font-weight:600;color:rgba(255,255,255,.45);margin-left:4px">€</span></div>'
        + simRow('⚡ Materia Energia', b.mat.toFixed(2) + ' €', COL)
        + simRow('🚛 Trasporto e Rete', b.tras.toFixed(2) + ' €')
        + simRow('🔧 Oneri di Sistema', b.oneri.toFixed(2) + ' €')
        + simRow('📋 Accise', b.acc.toFixed(2) + ' €')
        + simRow('💸 IVA ' + b.iva_perc.toFixed(0) + '%', b.iva.toFixed(2) + ' €')
        + (rai > 0 ? simRow('📺 Canone RAI', rai.toFixed(2) + ' €') : simRow('📺 Canone RAI', '— (non incluso)', 'rgba(255,255,255,.35)'))
        + (bon > 0 ? simRow('🎁 Bonus', '− ' + bon.toFixed(2) + ' €', '#4ade80') : '')
        + (gse > 0 ? simRow('☀️ Credito GSE', '− ' + gse.toFixed(2) + ' €', '#4ade80') : '')
        + (kwh >= 30
            ? '<div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.07);display:flex;justify-content:space-between">'
              + '<span style="font-size:11px;color:rgba(255,255,255,.5)">Costo effettivo/kWh</span>'
              + '<span style="font-size:12px;font-weight:700;color:' + COL + '">' + (tot / kwh).toFixed(4) + ' €/kWh</span>'
              + '</div>'
            : '')
        + '</div>';
    }

    var raiInit = load()._rai_amt || 0;
    var content = sec('Simula la tua bolletta')
      + '<div style="margin-bottom:10px">'
      + '<label style="font-size:12px;color:#fff">kWh consumati nel mese</label>'
      + '<input id="sim-kwh" type="text" inputmode="decimal" value="' + kwhInit.toFixed(0) + '" style="' + iSt + '" placeholder="es. 250">'
      + '</div>'
      + '<div style="margin-bottom:10px">'
      + '<label style="font-size:12px;color:#fff">Bonus / sconti (€)</label>'
      + '<input id="sim-bon" type="text" inputmode="decimal" value="' + bonInit.toFixed(2) + '" style="' + iSt + '" placeholder="es. 0.00">'
      + '</div>'
      + '<div style="margin-bottom:10px">'
      + '<label style="font-size:12px;color:#fff">Credito GSE (€, solo FV)</label>'
      + '<input id="sim-gse" type="text" inputmode="decimal" value="' + gseInit.toFixed(2) + '" style="' + iSt + '" placeholder="es. 0.00">'
      + '</div>'
      + '<div style="margin-bottom:10px">'
      + '<label style="font-size:12px;color:#fff">📺 Canone RAI (€)</label>'
      + '<input id="sim-rai" type="text" inputmode="decimal" value="' + (raiInit > 0 ? raiInit.toFixed(2) : '') + '" style="' + iSt + '" placeholder="es. 9.00">'
      + '</div>'
      + '<button id="sim-calc" style="width:100%;padding:11px;border-radius:10px;background:' + COL + ';color:#000;font-size:14px;font-weight:800;border:none;cursor:pointer">Calcola Bolletta</button>'
      + '<div id="sim-result">' + buildResult(kwhInit, bonInit, gseInit, raiInit) + '</div>';

    var ov = mkOv(popShell('🧮', 'Simulatore Bolletta', 'Stima costi mensili', 'bp-sim-close', content), 'bp-sim-close');
    ov.querySelector('#sim-calc').addEventListener('click', function() {
      var kwh = N(ov.querySelector('#sim-kwh').value);
      var bon = N(ov.querySelector('#sim-bon').value);
      var gse = N(ov.querySelector('#sim-gse').value);
      var rai = N(ov.querySelector('#sim-rai').value) || 0;
      ov.querySelector('#sim-result').innerHTML = buildResult(kwh, bon, gse, rai);
      setNum(c.pk_test_kwh, kwh);
      setNum(c.pk_test_bonus, bon);
      save(Object.assign({}, load(), {_rai_amt: rai}));
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
  function openImpostazioni(card, c, el) {
    var h = H();
    var _st0 = load();
    var _nums = _st0._nums || {};
    var iSt = 'width:100%;padding:8px 10px;border-radius:8px;background:#0b1422;color:#fff;border:1px solid rgba(255,255,255,.15);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none;margin-top:3px';
    var lSt = 'font-size:11px;color:#fff;display:block;margin-top:8px';
    var stDrop = 'position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:300;max-height:160px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-radius:9px;display:none;scrollbar-width:none';
    var allIds = Object.keys((h && h.states) || {}).sort();

    /* read saved numeric → fallback HA entity → 0 */
    function nval(key, haId, dec) {
      var loc = _nums[key];
      if (loc !== undefined && loc !== '') return parseFloat(loc).toFixed(dec);
      return N(S(h, haId)).toFixed(dec);
    }

    function lbl(t) { return '<label style="' + lSt + '">' + t + '</label>'; }
    function inp(id, val, ph) {
      return '<input id="' + id + '" type="text" inputmode="decimal" value="' + (val || '') + '" placeholder="' + (ph || '') + '" style="' + iSt + '" autocomplete="off">';
    }
    /* entity search input with dropdown */
    function entField(id, val, ph) {
      return '<div style="position:relative;margin-top:3px">'
        + '<input id="' + id + '" type="text" value="' + (val || '') + '" placeholder="' + (ph || 'Cerca entità…') + '" autocomplete="off" style="' + iSt + ';margin-top:0">'
        + '<div id="' + id + '-d" style="' + stDrop + '"></div>'
        + '</div>';
    }

    var tabCSS = '<style>'
      + '.bp-tab{flex:1;padding:8px 4px;text-align:center;font-size:11px;font-weight:700;cursor:pointer;border-radius:8px;transition:all .15s;color:rgba(255,255,255,.5);border:none;background:transparent}'
      + '.bp-tab.active{background:rgba(' + RGB + ',.18);color:' + COL + ';border:1px solid rgba(' + RGB + ',.3)}'
      + '.bp-panel{display:none}.bp-panel.active{display:block}'
      + '</style>';

    var tabs = '<div style="display:flex;gap:4px;background:rgba(255,255,255,.04);border-radius:10px;padding:3px;margin-bottom:12px">'
      + '<button class="bp-tab active" data-tab="tariffa">Tariffa</button>'
      + '<button class="bp-tab" data-tab="fv">☀️ FV</button>'
      + '<button class="bp-tab" data-tab="sensori">Sensori</button>'
      + '</div>';

    var pTariffa = '<div class="bp-panel active" id="bp-p-tariffa">'
      + lbl('Prezzo fisso energia (€/kWh)') + inp('bp-tariffa', nval('tariffa',c.pk_tariffa,6), '0.090000')
      + lbl('Spread energia (€/kWh)') + inp('bp-spread', nval('spread',c.pk_spread,6), '0.000000')
      + lbl('Potenza impegnata (kW)') + inp('bp-potenza', nval('potenza',c.pk_potenza,1), '4.5')
      + lbl('Commercializzazione (€/mese)') + inp('bp-comm', nval('comm',c.pk_fb_comm,2), '6.00')
      + lbl('Canone RAI (€/mese, 0 se esente)') + inp('bp-rai', nval('rai_mensile','',1), '9.0')
      + lbl('Bonus mese corrente (€)') + inp('bp-bonus', nval('bonus',c.pk_bonus,2), '0.00')
      + lbl('Bonus sociale (€)') + inp('bp-bonus-soc', nval('bonus_soc',c.pk_bonus_soc,2), '0.00')
      + '<div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.06em;margin:14px 0 4px;padding-bottom:3px;border-bottom:1px solid rgba(255,255,255,.07)">Fallback ARERA — usati se REST non disponibile</div>'
      + lbl('Perdite rete (%)') + inp('bp-perdite', nval('perdite',c.pk_fb_perdite,4), '9.85')
      + lbl('DISPbt (€/mese)') + inp('bp-dispbt', nval('dispbt',c.pk_fb_dispbt,6), '0.000000')
      + lbl('Dispacciamento CdispD (€/kWh)') + inp('bp-disp', nval('disp',c.pk_fb_disp,6), '0.019902')
      + lbl('Mercato Capacità (€/kWh)') + inp('bp-mc', nval('mc',c.pk_fb_mc,6), '0.000000')
      + lbl('Trasporto Energia (€/kWh)') + inp('bp-tr-en', nval('tr_en',c.pk_fb_tr_en,6), '0.011900')
      + lbl('Trasporto Fisso (€/mese)') + inp('bp-tr-fis', nval('tr_fis',c.pk_fb_tr_fis,2), '1.92')
      + lbl('Trasporto Potenza (€/kW)') + inp('bp-tr-pot', nval('tr_pot',c.pk_fb_tr_pot,2), '1.96')
      + lbl('UC3 (€/kWh)') + inp('bp-uc3', nval('uc3',c.pk_fb_uc3,6), '0.002760')
      + lbl('UC6 Fisso (€/kW)') + inp('bp-uc6f', nval('uc6f',c.pk_fb_uc6f,6), '0.016567')
      + lbl('UC6 Variabile (€/kWh)') + inp('bp-uc6v', nval('uc6v',c.pk_fb_uc6v,6), '0.000070')
      + lbl('ARIM (€/kWh)') + inp('bp-arim', nval('arim',c.pk_fb_arim,6), '0.001638')
      + lbl('ASOS (€/kWh)') + inp('bp-asos', nval('asos',c.pk_fb_asos,6), '0.028657')
      + lbl('Accise (€/kWh)') + inp('bp-accise', nval('accise',c.pk_fb_accise,6), '0.022700')
      + lbl('IVA (%)') + inp('bp-iva', nval('iva',c.pk_fb_iva,1), '10.0')
      + '</div>';

    var haFvNow = (_st0._fv_active !== undefined) ? _st0._fv_active : (S(h, c.pk_ha_fv) === 'on');
    var pFv = '<div class="bp-panel" id="bp-p-fv">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.07);margin-bottom:10px">'
      + '<span style="font-size:13px;font-weight:700;color:#fff">☀️ Fotovoltaico</span>'
      + '<button id="bp-fv-toggle" style="padding:5px 16px;border-radius:20px;border:none;cursor:pointer;font-size:12px;font-weight:800;background:' + (haFvNow ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.06)') + ';color:' + (haFvNow ? '#4ade80' : 'rgba(255,255,255,.4)') + '">' + (haFvNow ? '✅ ON' : 'OFF') + '</button>'
      + '</div>'
      + '<div id="bp-fv-fields" style="opacity:' + (haFvNow ? '1' : '.35') + ';pointer-events:' + (haFvNow ? 'auto' : 'none') + ';transition:opacity .2s">'
      + lbl('Sensore Potenza Produzione FV (W)') + entField('bp-s-fv-pow', c.pk_fv_prod_ist, 'sensor.potenza_fotovoltaico')
      + lbl('Sensore kWh Produzione Oggi') + entField('bp-s-fv-og', c.pk_fv_kwh_oggi, 'sensor.energia_fv_oggi')
      + lbl('Sensore kWh Produzione Mese') + entField('bp-s-fv-me', c.pk_fv_kwh_mese, 'sensor.energia_fv_mese')
      + '<div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.07)">'
      + lbl('Credito GSE - Scambio sul Posto (€)') + inp('bp-gse', nval('gse',c.pk_credito_gse,2), '0.00')
      + '<div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:4px">Aggiornato manualmente ogni trimestre</div>'
      + '</div>'
      + '</div>'
      + '</div>';

    var pSensori = '<div class="bp-panel" id="bp-p-sensori">'
      + '<div style="font-size:10px;color:rgba(255,255,255,.35);margin-bottom:8px">ID entità HA — lascia vuoto per usare il default PKG</div>'
      + lbl('Potenza istantanea (W)') + entField('bp-s-ist', c.pk_consumo_ist, '')
      + lbl('Costo Mensile (€)') + entField('bp-s-cm', c.pk_costo_mese, '')
      + lbl('Costo Oggi (€)') + entField('bp-s-cg', c.pk_costo_oggi, '')
      + lbl('kWh Mese') + entField('bp-s-km', c.pk_kwh_mese, '')
      + lbl('kWh Oggi') + entField('bp-s-kg', c.pk_kwh_oggi, '')
      + lbl('Proiezione Fine Mese (€)') + entField('bp-s-prj', c.pk_proiezione_e, '')
      + '</div>';

    var saveBtn = '<div style="display:flex;gap:8px;margin-top:14px">'
      + '<button id="bp-imp-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.08);color:#fff">Annulla</button>'
      + '<button id="bp-imp-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:' + COL + ';color:#000">Salva</button>'
      + '</div>';

    var _notifOn0 = (_st0._push !== false);
    var notifSection = '<div style="display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-top:1px solid rgba(255,255,255,.08);margin-top:4px">'
      + '<div><div style="font-size:13px;font-weight:700;color:#fff">🔔 Notifiche Push</div><div style="font-size:10px;color:#fff;margin-top:2px">Avvisi consumi e bolletta</div></div>'
      + '<button id="bp-notif-btn" style="padding:5px 16px;border-radius:20px;border:none;cursor:pointer;font-size:12px;font-weight:800;background:' + (_notifOn0 ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.06)') + ';color:' + (_notifOn0 ? '#4ade80' : 'rgba(255,255,255,.4)') + '">' + (_notifOn0 ? '✅ ON' : 'OFF') + '</button>'
      + '</div>';

    var ov = mkOv(popShell('⚙', 'Impostazioni Bolletta', 'Tariffa · FV · Sensori', 'bp-imp-close', tabCSS + tabs + pTariffa + pFv + pSensori + notifSection + saveBtn), 'bp-imp-close');

    ov.querySelectorAll('.bp-tab').forEach(function(t) {
      t.addEventListener('click', function() {
        ov.querySelectorAll('.bp-tab').forEach(function(x) { x.classList.remove('active'); });
        ov.querySelectorAll('.bp-panel').forEach(function(x) { x.classList.remove('active'); });
        t.classList.add('active');
        var p = ov.querySelector('#bp-p-' + t.dataset.tab);
        if (p) p.classList.add('active');
      });
    });

    /* autocomplete for entity search fields */
    var entFieldIds = ['bp-s-fv-pow','bp-s-fv-og','bp-s-fv-me','bp-s-ist','bp-s-cm','bp-s-cg','bp-s-km','bp-s-kg','bp-s-prj'];
    entFieldIds.forEach(function(fid) {
      var inp2 = ov.querySelector('#' + fid), drop2 = ov.querySelector('#' + fid + '-d');
      if (!inp2 || !drop2) return;
      function showDrop2() {
        if (inp2.disabled) return;
        var q = inp2.value.toLowerCase().trim();
        var hits = (q ? allIds.filter(function(id) { return id.toLowerCase().includes(q); }) : allIds).slice(0,40);
        if (!hits.length) { drop2.style.display = 'none'; return; }
        drop2.style.display = 'block';
        drop2.innerHTML = hits.map(function(id) {
          return '<div data-pick="' + id + '" style="padding:6px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#e2e8f0">' + id + '</div>';
        }).join('');
        drop2.querySelectorAll('[data-pick]').forEach(function(r) {
          r.addEventListener('mousedown', function(ev) { ev.preventDefault(); inp2.value = r.getAttribute('data-pick'); drop2.style.display = 'none'; });
          r.addEventListener('mouseover', function() { r.style.background = 'rgba(255,255,255,.08)'; });
          r.addEventListener('mouseout', function() { r.style.background = ''; });
        });
      }
      inp2.addEventListener('focus', showDrop2);
      inp2.addEventListener('input', showDrop2);
      inp2.addEventListener('blur', function() { setTimeout(function() { drop2.style.display = 'none'; }, 200); });
    });

    function g(id) { var e = ov.querySelector('#' + id); return e ? e.value.trim() : ''; }

    var bpFvBtn = ov.querySelector('#bp-fv-toggle');
    var bpFvFields = ov.querySelector('#bp-fv-fields');
    var _fvOn = haFvNow;
    if (bpFvBtn) {
      bpFvBtn.addEventListener('click', function() {
        callSvc('input_boolean', 'toggle', {entity_id: c.pk_ha_fv});
        _fvOn = !_fvOn;
        bpFvBtn.textContent = _fvOn ? '✅ ON' : 'OFF';
        bpFvBtn.style.background = _fvOn ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.06)';
        bpFvBtn.style.color = _fvOn ? '#4ade80' : 'rgba(255,255,255,.4)';
        if (bpFvFields) {
          bpFvFields.style.opacity = _fvOn ? '1' : '.35';
          bpFvFields.style.pointerEvents = _fvOn ? 'auto' : 'none';
        }
      });
    }

    ov.querySelector('#bp-imp-cancel').addEventListener('click', function() { ov._close(); });
    ov.querySelector('#bp-imp-save').addEventListener('click', function() {
      /* also send to HA if PKG is installed */
      setNum(c.pk_tariffa,     g('bp-tariffa'));
      setNum(c.pk_spread,      g('bp-spread'));
      setNum(c.pk_potenza,     g('bp-potenza'));
      setNum(c.pk_fb_comm,     g('bp-comm'));
      setNum(c.pk_bonus,       g('bp-bonus'));
      setNum(c.pk_bonus_soc,   g('bp-bonus-soc'));
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
      setNum(c.pk_credito_gse, g('bp-gse'));
      setNum(c.pk_bonus,       g('bp-bonus'));
      setNum(c.pk_bonus_soc,   g('bp-bonus-soc'));
      /* always save to localStorage — source of truth */
      var stored = load();
      stored._nums = {
        tariffa:   g('bp-tariffa'),   spread:    g('bp-spread'),
        potenza:   g('bp-potenza'),   comm:      g('bp-comm'),
        rai_mensile: g('bp-rai'),
        bonus:     g('bp-bonus'),     bonus_soc: g('bp-bonus-soc'),
        perdite:   g('bp-perdite'),   dispbt:    g('bp-dispbt'),
        disp:      g('bp-disp'),      mc:        g('bp-mc'),
        tr_en:     g('bp-tr-en'),     tr_fis:    g('bp-tr-fis'),
        tr_pot:    g('bp-tr-pot'),    uc3:       g('bp-uc3'),
        uc6f:      g('bp-uc6f'),      uc6v:      g('bp-uc6v'),
        arim:      g('bp-arim'),      asos:      g('bp-asos'),
        accise:    g('bp-accise'),    iva:       g('bp-iva'),
        gse:       g('bp-gse'),
      };
      stored.pk_consumo_ist  = g('bp-s-ist')  || stored.pk_consumo_ist;
      stored.pk_costo_mese   = g('bp-s-cm')   || stored.pk_costo_mese;
      stored.pk_costo_oggi   = g('bp-s-cg')   || stored.pk_costo_oggi;
      stored.pk_kwh_mese     = g('bp-s-km')   || stored.pk_kwh_mese;
      stored.pk_kwh_oggi     = g('bp-s-kg')   || stored.pk_kwh_oggi;
      stored.pk_proiezione_e = g('bp-s-prj')  || stored.pk_proiezione_e;
      stored.pk_fv_prod_ist  = g('bp-s-fv-pow');
      stored.pk_fv_kwh_oggi  = g('bp-s-fv-og');
      stored.pk_fv_kwh_mese  = g('bp-s-fv-me');
      stored._fv_active      = _fvOn;
      save(stored);
      ov._close();
      if (el) { el._fcSig = ''; el._fcBound = null; el.innerHTML = render(card); mount(card, H(), el); }
    });

    var _notifBtn = ov.querySelector('#bp-notif-btn');
    var _notifOn = _notifOn0;
    if (_notifBtn) {
      _notifBtn.addEventListener('click', function() {
        _notifOn = !_notifOn;
        var _st2 = load(); _st2._push = _notifOn; save(_st2);
        _notifBtn.textContent = _notifOn ? '✅ ON' : 'OFF';
        _notifBtn.style.background = _notifOn ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.06)';
        _notifBtn.style.color = _notifOn ? '#4ade80' : 'rgba(255,255,255,.4)';
      });
    }
  }

  /* ── POPUP: CONFIGURA ENTITÀ (wizard) ── */
  function openCfg(card, el) {
    var h = H(), cf = cfgFor(card);
    var states = (h && h.states) || {};
    var allIds = Object.keys(states).sort();
    var iSt = 'width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    var stDrop = 'position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:200;max-height:150px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-radius:9px;display:none;scrollbar-width:none';

    function field(fid, lbl2, val) {
      return '<div style="margin-bottom:9px;position:relative"><label style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#fff;display:block;margin-bottom:2px">' + lbl2 + '</label>'
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
      var stored = load();
      stored.pk_consumo_ist  = g('bc-ist')  || pkDefaults().pk_consumo_ist;
      stored.pk_costo_mese   = g('bc-cm')   || pkDefaults().pk_costo_mese;
      stored.pk_costo_oggi   = g('bc-cg')   || pkDefaults().pk_costo_oggi;
      stored.pk_kwh_mese     = g('bc-km')   || pkDefaults().pk_kwh_mese;
      stored.pk_kwh_oggi     = g('bc-kg')   || pkDefaults().pk_kwh_oggi;
      stored.pk_proiezione_e = g('bc-prj')  || pkDefaults().pk_proiezione_e;
      stored.pk_materia      = g('bc-mat')  || pkDefaults().pk_materia;
      stored.pk_trasporto    = g('bc-tras') || pkDefaults().pk_trasporto;
      stored.pk_arera_trim   = g('bc-trim') || pkDefaults().pk_arera_trim;
      save(stored);
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
    var costoKwh = N(S(h, c.pk_costo_kwh));
    var mediaG   = N(S(h, c.pk_media_g));
    var annoTot  = N(S(h, c.pk_anno));
    var trim     = S(h, c.pk_arera_trim) || '—';
    var _st = load();
    var haFv     = (_st._fv_active !== undefined) ? _st._fv_active : (S(h, c.pk_ha_fv) === 'on');
    var gseCredit= N(S(h, c.pk_credito_gse));
    var fvPowW   = c.pk_fv_prod_ist  ? N(S(h, c.pk_fv_prod_ist))  : 0;
    var fvKwhG   = c.pk_fv_kwh_oggi  ? N(S(h, c.pk_fv_kwh_oggi))  : 0;
    var fvKwhM   = c.pk_fv_kwh_mese  ? N(S(h, c.pk_fv_kwh_mese))  : 0;

    var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var dayNow = now.getDate();
    var proiK = (dayNow > 0 && kwhM > 0) ? Math.round((kwhM / dayNow) * daysInMonth) : 0;
    var _prb = proiK > 0 ? calcBill(proiK, h, c) : null;
    var proiE = _prb ? (_prb.imp + _prb.acc + _prb.iva) : 0;
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
        + '<div style="font-size:8px;color:#fff">' + (v > 0 ? v.toFixed(0) : '') + '</div>'
        + '<div style="width:100%;border-radius:3px 3px 0 0;height:' + pct + 'px;background:' + (isLast ? COL : 'rgba(' + RGB + ',.3)') + '"></div>'
        + '<div style="font-size:7.5px;color:#fff;font-weight:' + (isLast ? '700':'400') + '">' + labs6[i] + '</div>'
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
      + '#' + rid + ' .fb-hero-sub{font-size:11px;color:#fff;margin-top:3px}'
      + '#' + rid + ' .fb-pills{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:8px}'
      + '#' + rid + ' .fb-pill{border-radius:20px;padding:4px 11px;font-size:11px;font-weight:700}'
      + '#' + rid + ' .fb-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:8px 14px}'
      + '#' + rid + ' .fb-stat{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:11px;padding:9px 6px;text-align:center}'
      + '#' + rid + ' .fb-stat-lbl{font-size:9px;color:#fff;text-transform:uppercase;letter-spacing:.04em}'
      + '#' + rid + ' .fb-stat-val{font-size:14px;font-weight:800;color:#fff;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fb-stat-sub{font-size:9px;color:#fff;margin-top:2px}'
      + '#' + rid + ' .fb-chart{margin:0 14px 8px}'
      + '#' + rid + ' .fb-chart-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}'
      + '#' + rid + ' .fb-btns{display:flex;gap:5px;padding:0 14px 12px}'
      + '#' + rid + ' .fb-btn{flex:1;padding:8px 2px;border-radius:9px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);font-size:9.5px;font-weight:700;color:#fff;text-align:center;cursor:pointer}'
      + '#' + rid + ' .fb-btn:hover{background:rgba(' + RGB + ',.12);border-color:rgba(' + RGB + ',.3);color:' + COL + '}'
      + '#' + rid + ' [data-sya]{cursor:pointer}'
      + '@keyframes fbPulse{0%,100%{opacity:.6}50%{opacity:1}}'
      + '</style>';

    var heroHtml = '<div class="fb-hero">'
      + '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:8px">'
      + '<div style="text-align:left;flex:1;min-width:0">'
      + '<div style="font-size:9px;color:#fff;text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px;font-weight:700">Consumo Mese</div>'
      + '<div style="font-size:44px;font-weight:900;color:#fff;line-height:1;letter-spacing:-2px;white-space:nowrap">' + kwhM.toFixed(0) + '<span style="font-size:17px;font-weight:600;color:#fff;margin-left:3px">kWh</span></div>'
      + '</div>'
      + '<div style="text-align:right;flex:1;min-width:0">'
      + '<div style="font-size:9px;color:#fff;text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px;font-weight:700">Costo Mese</div>'
      + '<div style="font-size:44px;font-weight:900;color:' + COL + ';line-height:1;letter-spacing:-2px;white-space:nowrap">' + costoM.toFixed(2).replace('.',',') + '<span style="font-size:17px;font-weight:600;color:' + COL + ';margin-left:3px">€</span></div>'
      + '</div>'
      + '</div>'
      + ((haFv || gseCredit > 0) ? '<div class="fb-pills" style="justify-content:flex-start;margin-top:8px">'
        + (haFv ? '<div class="fb-pill" style="background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.3);color:#fbbf24">☀️ FV</div>' : '')
        + (gseCredit > 0 ? '<div class="fb-pill" style="background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.25);color:#4ade80">GSE −' + gseCredit.toFixed(0) + '€</div>' : '')
        + '</div>' : '')
      + '</div>';

    var statsHtml = '<div class="fb-stats">'
      + '<div class="fb-stat"><div class="fb-stat-lbl">📅 Oggi</div><div class="fb-stat-val">' + costoG.toFixed(2) + ' €</div><div class="fb-stat-sub">' + kwhG.toFixed(2) + ' kWh</div></div>'
      + '<div class="fb-stat"><div class="fb-stat-lbl">🔮 Proiezione</div><div class="fb-stat-val">' + proiE.toFixed(0) + ' €</div><div class="fb-stat-sub">' + proiK.toFixed(0) + ' kWh</div></div>'
      + '<div class="fb-stat"><div class="fb-stat-lbl">⚡ Live</div><div class="fb-stat-val" style="color:' + wCol + '">' + wFmt + '</div><div class="fb-stat-sub">' + (wLive > 3000 ? 'Alto' : wLive > 1000 ? 'Medio' : 'Basso') + '</div></div>'
      + '</div>';

    var fvHtml = haFv ? '<div style="margin:0 10px 8px;padding:9px 12px;background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.15);border-radius:12px">'
      + '<div style="font-size:10px;font-weight:700;color:' + COL + ';text-transform:uppercase;letter-spacing:.05em;margin-bottom:7px">☀️ Fotovoltaico</div>'
      + '<div style="display:flex;gap:8px">'
      + '<div style="flex:1;text-align:center"><div style="font-size:16px;font-weight:800;color:#fff">' + (fvPowW >= 1000 ? (fvPowW/1000).toFixed(2)+' kW' : fvPowW.toFixed(0)+' W') + '</div><div style="font-size:9px;color:rgba(255,255,255,.4);margin-top:1px">Live</div></div>'
      + '<div style="width:1px;background:rgba(255,255,255,.08)"></div>'
      + '<div style="flex:1;text-align:center"><div style="font-size:16px;font-weight:800;color:#fff">' + fvKwhG.toFixed(2) + ' <span style="font-size:10px;font-weight:500;color:rgba(255,255,255,.5)">kWh</span></div><div style="font-size:9px;color:rgba(255,255,255,.4);margin-top:1px">Oggi</div></div>'
      + '<div style="width:1px;background:rgba(255,255,255,.08)"></div>'
      + '<div style="flex:1;text-align:center"><div style="font-size:16px;font-weight:800;color:#fff">' + fvKwhM.toFixed(1) + ' <span style="font-size:10px;font-weight:500;color:rgba(255,255,255,.5)">kWh</span></div><div style="font-size:9px;color:rgba(255,255,255,.4);margin-top:1px">Mese</div></div>'
      + '</div>'
      + (gseCredit > 0 ? '<div style="margin-top:7px;font-size:10px;color:rgba(74,222,128,.8);font-weight:600">Credito GSE: ' + gseCredit.toFixed(2) + ' €</div>' : '')
      + '</div>' : '';

    var progHtml = '<div style="margin:2px 14px 10px">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px">'
      + '<span style="font-size:10px;color:#fff;font-weight:600">Giorno ' + dayNow + ' di ' + daysInMonth + '</span>'
      + '<span style="font-size:11px;color:' + COL + ';font-weight:800">' + percMese + '%</span>'
      + '</div>'
      + '<div style="height:8px;background:rgba(255,255,255,.07);border-radius:4px;position:relative">'
      + '<div style="height:100%;width:' + percMese + '%;background:linear-gradient(90deg,rgba(' + RGB + ',.45),rgba(' + RGB + ',.9));border-radius:4px;box-shadow:0 0 10px rgba(' + RGB + ',.4),0 0 22px rgba(' + RGB + ',.15);position:relative;min-width:' + (percMese > 0 ? '10' : '0') + 'px">'
      + (percMese > 0 && percMese < 100 ? '<div style="position:absolute;right:-5px;top:50%;transform:translateY(-50%);width:14px;height:14px;border-radius:50%;background:' + COL + ';box-shadow:0 0 8px ' + COL + ',0 0 18px rgba(' + RGB + ',.7)"></div>' : '')
      + '</div>'
      + '</div>'
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
      + '<div style="font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px;background:rgba(' + RGB + ',.12);border:1px solid rgba(' + RGB + ',.25);color:' + COL + ';flex-shrink:0">' + MESIL[now.getMonth()] + '</div>'
      + '</div>'
      + '<div class="fb-scroll">'
      + heroHtml
      + statsHtml
      + fvHtml
      + progHtml
      + btnsHtml
      + '</div>'
      + '</div>'
      + '</div>';
  }

  /* ── UPDATE / MOUNT ── */
  var CARD = { id: 'bolletta', version: '4.3', name: 'Bolletta Elettrica', icon: '⚡', color: COL };

  function update(card, hass, el) {
    var h = hass || H(), c = cfgFor(card);
    var sig = [CARD.version, S(h,c.pk_costo_mese), S(h,c.pk_costo_oggi), S(h,c.pk_kwh_mese), S(h,c.pk_consumo_ist), S(h,c.pk_proiezione_e), S(h,c.pk_arera_trim), S(h,c.pk_ha_fv), S(h,c.pk_credito_gse), S(h,c.pk_anno), c.pk_fv_prod_ist ? S(h,c.pk_fv_prod_ist) : '', c.pk_fv_kwh_oggi ? S(h,c.pk_fv_kwh_oggi) : '', c.pk_fv_kwh_mese ? S(h,c.pk_fv_kwh_mese) : ''].join('|');
    if (!el.querySelector('.fb-card') || el._fcSig !== sig) {
      el._fcSig = sig;
      el._fcBound = null;
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
      if (a === 'popup-impostazioni') { openImpostazioni(card, c, el); return; }
      if (a === 'popup-cfg')          { openCfg(card, el); return; }
    };
    el.addEventListener('click', el._fcHandler);
  }

  /* ── PKG YAML EMBEDDED ── */
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

        Sensore Potenza Casa: &sensore_potenza_bolletta 'IL_TUO_SENSORE_POTENZA_BOLLETTA'



        Tariffa Contratto: &tariffa_contratto IL_TUA_TARIFFA_KWHE

        Potenza Contrattuale: &potenza_kw IL_TUA_POTENZA_KW

        Device per notifica push: &push
          - service: IL_TUO_MOBILE_APP_1

####################################################
#                  NOTIFICHE                       #
####################################################


group:
  frarik_notifiche_bolletta:
    name: "Bolletta — Notifiche"
    entities:
      - input_boolean.frarik_bolletta_notify_push_soglia
      - input_boolean.frarik_bolletta_notify_push_giornaliero
      - input_boolean.frarik_bolletta_notify_push_mensile
      - input_boolean.frarik_bolletta_notify_push_annuale

####################################################
#                    SENSORI                       #
####################################################

sensor:
  - platform: integration
    source: *sensore_potenza_bolletta
    name: "Bolletta Energia Totale Casa"
    unique_id: frarik_bolletta_energia_totale_casa
    unit_prefix: k
    unit_time: h
    round: 3
    method: left

####################################################
#                 UTILITY METER                    #
####################################################

utility_meter:
  frarik_bolletta_energia_giornaliera:
    source: sensor.frarik_bolletta_energia_totale_casa
    name: "Bolletta Energia Giornaliera"
    cycle: daily
  frarik_bolletta_energia_settimanale:
    source: sensor.frarik_bolletta_energia_totale_casa
    name: "Bolletta Energia Settimanale"
    cycle: weekly
  frarik_bolletta_energia_mensile:
    source: sensor.frarik_bolletta_energia_totale_casa
    name: "Bolletta Energia Mensile"
    cycle: monthly
  frarik_bolletta_energia_trimestrale:
    source: sensor.frarik_bolletta_energia_totale_casa
    name: "Bolletta Energia Trimestrale"
    cycle: quarterly
  frarik_bolletta_energia_annuale:
    source: sensor.frarik_bolletta_energia_totale_casa
    name: "Bolletta Energia Annuale"
    cycle: yearly

####################################################
#                INPUT BOOLEAN                     #
####################################################

input_boolean:
  frarik_bolletta_reset_consumo_mensile:
    name: "Bolletta Reset Consumo Mensile"
    icon: mdi:restart
  frarik_bolletta_ha_fotovoltaico:
    name: "Bolletta Ha Fotovoltaico"
    icon: mdi:solar-panel
  frarik_bolletta_notify_push_soglia:
    name: "Bolletta Notifica Soglia Potenza"
    icon: mdi:bell
  frarik_bolletta_notify_push_giornaliero:
    name: "Bolletta Notifica Costi Giornalieri"
    icon: mdi:bell-ring
  frarik_bolletta_notify_push_mensile:
    name: "Bolletta Notifica Costi Mensili"
    icon: mdi:bell-ring
  frarik_bolletta_notify_push_annuale:
    name: "Bolletta Notifica Costi Annuali"
    icon: mdi:bell-ring

####################################################
#                 INPUT DATETIME                   #
####################################################

input_datetime:
  frarik_bolletta_orario_inizio_notifiche_soglia:
    name: "Bolletta Inizio Notifiche Soglia"
    has_date: false
    has_time: true
  frarik_bolletta_orario_fine_notifiche_soglia:
    name: "Bolletta Fine Notifiche Soglia"
    has_date: false
    has_time: true

####################################################
#                  INPUT NUMBER                    #
####################################################

input_number:
  frarik_bolletta_backup_energia_giornaliera:
    name: "Bolletta Backup kWh Giornaliero"
    min: 0
    max: 200
    step: 0.001
    mode: box
    unit_of_measurement: "kWh"
    icon: mdi:content-save
  frarik_bolletta_backup_energia_settimanale:
    name: "Bolletta Backup kWh Settimanale"
    min: 0
    max: 1000
    step: 0.001
    mode: box
    unit_of_measurement: "kWh"
    icon: mdi:content-save
  frarik_bolletta_backup_energia_mensile:
    name: "Bolletta Backup kWh Mensile"
    min: 0
    max: 2000
    step: 0.001
    mode: box
    unit_of_measurement: "kWh"
    icon: mdi:content-save
  frarik_bolletta_tariffa_energia:
    name: "Bolletta Tariffa Energia Fissa"
    min: 0
    max: 1
    step: 0.000001
    initial: *tariffa_contratto
    mode: box
    unit_of_measurement: "€/kWh"
    icon: mdi:lightning-bolt
  frarik_bolletta_spread_energia:
    name: "Bolletta Spread Energia"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.000000
    mode: box
    unit_of_measurement: "€/kWh"
    icon: mdi:chart-line
  frarik_bolletta_potenza_impegnata:
    name: "Bolletta Potenza Impegnata"
    min: 1.5
    max: 15
    step: 0.5
    initial: *potenza_kw
    mode: box
    unit_of_measurement: "kW"
    icon: mdi:flash
  frarik_bolletta_fb_perdite_perc:
    name: "Bolletta Fallback Perdite Rete %"
    min: 0
    max: 20
    step: 0.01
    initial: 9.85
    mode: box
    unit_of_measurement: "%"
    icon: mdi:transmission-tower
  frarik_bolletta_fb_dispbt:
    name: "Bolletta Fallback DISPbt"
    min: 0
    max: 5
    step: 0.000001
    initial: 0.102592
    mode: box
    unit_of_measurement: "€/mese"
  frarik_bolletta_fb_dispacciamento:
    name: "Bolletta Fallback Dispacciamento"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.019902
    mode: box
    unit_of_measurement: "€/kWh"
  frarik_bolletta_fb_mercato_capacita:
    name: "Bolletta Fallback Mercato Capacità"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.010583
    mode: box
    unit_of_measurement: "€/kWh"
  frarik_bolletta_fb_pno:
    name: "Bolletta Fallback PNO"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.000000
    mode: box
    unit_of_measurement: "€/mese"
  frarik_bolletta_fb_commercializzazione:
    name: "Bolletta Fallback Commercializzazione"
    min: 0
    max: 20
    step: 0.01
    initial: 6.00
    mode: box
    unit_of_measurement: "€/mese"
  frarik_bolletta_fb_trasporto_energia:
    name: "Bolletta Fallback Trasporto Energia"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.011900
    mode: box
    unit_of_measurement: "€/kWh"
  frarik_bolletta_fb_trasporto_fisso:
    name: "Bolletta Fallback Trasporto Fisso"
    min: 0
    max: 10
    step: 0.01
    initial: 1.92
    mode: box
    unit_of_measurement: "€/mese"
  frarik_bolletta_fb_trasporto_potenza:
    name: "Bolletta Fallback Trasporto Potenza"
    min: 0
    max: 10
    step: 0.01
    initial: 1.96
    mode: box
    unit_of_measurement: "€/kW"
  frarik_bolletta_fb_uc3:
    name: "Bolletta Fallback UC3"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.002760
    mode: box
    unit_of_measurement: "€/kWh"
  frarik_bolletta_fb_uc6_fisso:
    name: "Bolletta Fallback UC6 Fisso"
    min: 0
    max: 1
    step: 0.000001
    initial: 0.070000
    mode: box
    unit_of_measurement: "€/kW"
  frarik_bolletta_fb_uc6_variabile:
    name: "Bolletta Fallback UC6 Variabile"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.000070
    mode: box
    unit_of_measurement: "€/kWh"
  frarik_bolletta_fb_arim:
    name: "Bolletta Fallback ARIM"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.001638
    mode: box
    unit_of_measurement: "€/kWh"
  frarik_bolletta_fb_asos:
    name: "Bolletta Fallback ASOS"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.028657
    mode: box
    unit_of_measurement: "€/kWh"
  frarik_bolletta_fb_accise:
    name: "Bolletta Fallback Accise"
    min: 0
    max: 0.5
    step: 0.000001
    initial: 0.022700
    mode: box
    unit_of_measurement: "€/kWh"
  frarik_bolletta_fb_iva_perc:
    name: "Bolletta Fallback IVA %"
    min: 0
    max: 30
    step: 0.1
    initial: 10.0
    mode: box
    unit_of_measurement: "%"
  frarik_bolletta_bonus_mese_corrente:
    name: "Bolletta Bonus Mese Corrente"
    min: 0
    max: 500
    step: 0.01
    initial: 0
    mode: box
    unit_of_measurement: "€"
    icon: mdi:gift
  frarik_bolletta_bonus_sociale:
    name: "Bolletta Bonus Sociale"
    min: 0
    max: 1000
    step: 0.01
    initial: 0
    mode: box
    unit_of_measurement: "€"
    icon: mdi:account-heart
  frarik_bolletta_credito_gse:
    name: "Bolletta Credito GSE (FV)"
    min: 0
    max: 2000
    step: 0.01
    initial: 0
    mode: box
    unit_of_measurement: "€"
    icon: mdi:solar-power
  frarik_bolletta_soglia_costo_giornaliero:
    name: "Bolletta Soglia Alert Costo Giornaliero"
    min: 0
    max: 20
    step: 0.5
    initial: 5
    mode: box
    unit_of_measurement: "€"
    icon: mdi:alarm-light
  frarik_bolletta_soglia_consumo_giornaliero:
    name: "Bolletta Soglia Alert Consumo Giornaliero"
    min: 0
    max: 50
    step: 1
    initial: 15
    mode: box
    unit_of_measurement: "kWh"
    icon: mdi:alarm-light
  frarik_bolletta_soglia_lavoro_w:
    name: "Bolletta Soglia Consumo W"
    min: 100
    max: 9000
    step: 50
    initial: 3500
    mode: box
    unit_of_measurement: "W"
    icon: mdi:flash-alert
  frarik_bolletta_ritardo_soglia_sec:
    name: "Bolletta Ritardo Alert Soglia"
    min: 10
    max: 360
    step: 10
    initial: 60
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timelapse
  frarik_bolletta_test_consumo_kwh:
    name: "Bolletta Sandbox kWh"
    min: 0
    max: 5000
    step: 1
    initial: 0
    mode: box
    unit_of_measurement: "kWh"
    icon: mdi:calculator
  frarik_bolletta_test_bonus_euro:
    name: "Bolletta Sandbox Bonus"
    min: 0
    max: 500
    step: 1
    initial: 0
    mode: box
    unit_of_measurement: "€"
    icon: mdi:piggy-bank
  frarik_bolletta_storico_costo_ieri:
    name: "Bolletta Costo Ieri"
    min: 0
    max: 50
    step: 0.01
    initial: 0
    mode: box
    unit_of_measurement: "€"
    icon: mdi:calendar-today
  frarik_bolletta_storico_kwh_ieri:
    name: "Bolletta kWh Ieri"
    min: 0
    max: 100
    step: 0.01
    initial: 0
    mode: box
    unit_of_measurement: "kWh"
    icon: mdi:flash
  frarik_bolletta_storico_costo_lun: {name: "Bolletta Costo Lunedì",    min: 0, max: 50, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€",   icon: mdi:calendar-week}
  frarik_bolletta_storico_costo_mar: {name: "Bolletta Costo Martedì",   min: 0, max: 50, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€",   icon: mdi:calendar-week}
  frarik_bolletta_storico_costo_mer: {name: "Bolletta Costo Mercoledì", min: 0, max: 50, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€",   icon: mdi:calendar-week}
  frarik_bolletta_storico_costo_gio: {name: "Bolletta Costo Giovedì",   min: 0, max: 50, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€",   icon: mdi:calendar-week}
  frarik_bolletta_storico_costo_ven: {name: "Bolletta Costo Venerdì",   min: 0, max: 50, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€",   icon: mdi:calendar-week}
  frarik_bolletta_storico_costo_sab: {name: "Bolletta Costo Sabato",    min: 0, max: 50, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€",   icon: mdi:calendar-week}
  frarik_bolletta_storico_costo_dom: {name: "Bolletta Costo Domenica",  min: 0, max: 50, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€",   icon: mdi:calendar-week}
  frarik_bolletta_storico_kwh_lun:   {name: "Bolletta kWh Lunedì",      min: 0, max: 100, step: 0.1, initial: 0, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_mar:   {name: "Bolletta kWh Martedì",     min: 0, max: 100, step: 0.1, initial: 0, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_mer:   {name: "Bolletta kWh Mercoledì",   min: 0, max: 100, step: 0.1, initial: 0, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_gio:   {name: "Bolletta kWh Giovedì",     min: 0, max: 100, step: 0.1, initial: 0, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_ven:   {name: "Bolletta kWh Venerdì",     min: 0, max: 100, step: 0.1, initial: 0, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_sab:   {name: "Bolletta kWh Sabato",      min: 0, max: 100, step: 0.1, initial: 0, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_dom:   {name: "Bolletta kWh Domenica",    min: 0, max: 100, step: 0.1, initial: 0, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_mese_curr_01: {name: "Bolletta Gen",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_curr_02: {name: "Bolletta Feb",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_curr_03: {name: "Bolletta Mar",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_curr_04: {name: "Bolletta Apr",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_curr_05: {name: "Bolletta Mag",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_curr_06: {name: "Bolletta Giu",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_curr_07: {name: "Bolletta Lug",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_curr_08: {name: "Bolletta Ago",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_curr_09: {name: "Bolletta Set",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_curr_10: {name: "Bolletta Ott",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_curr_11: {name: "Bolletta Nov",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_curr_12: {name: "Bolletta Dic",      min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_prev_01: {name: "Bolletta Gen Prec", min: 0, max: 500, step: 0.01, initial: 0,     mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_prev_02: {name: "Bolletta Feb Prec", min: 0, max: 500, step: 0.01, initial: 0,     mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_prev_03: {name: "Bolletta Mar Prec", min: 0, max: 500, step: 0.01, initial: 0,     mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_prev_04: {name: "Bolletta Apr Prec", min: 0, max: 500, step: 0.01, initial: 0,     mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_prev_05: {name: "Bolletta Mag Prec", min: 0, max: 500, step: 0.01, initial: 0,     mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_prev_06: {name: "Bolletta Giu Prec", min: 0, max: 500, step: 0.01, initial: 0,     mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_prev_07: {name: "Bolletta Lug Prec", min: 0, max: 500, step: 0.01, initial: 0,     mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_prev_08: {name: "Bolletta Ago Prec", min: 0, max: 500, step: 0.01, initial: 0,     mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_prev_09: {name: "Bolletta Set Prec", min: 0, max: 500, step: 0.01, initial: 0,     mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_prev_10: {name: "Bolletta Ott Prec", min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_prev_11: {name: "Bolletta Nov Prec", min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_mese_prev_12: {name: "Bolletta Dic Prec", min: 0, max: 500, step: 0.01, initial: 0, mode: box, unit_of_measurement: "€", icon: mdi:calendar}
  frarik_bolletta_storico_kwh_curr_01: {name: "Bolletta kWh Gen", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_curr_02: {name: "Bolletta kWh Feb", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_curr_03: {name: "Bolletta kWh Mar", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_curr_04: {name: "Bolletta kWh Apr", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_curr_05: {name: "Bolletta kWh Mag", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_curr_06: {name: "Bolletta kWh Giu", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_curr_07: {name: "Bolletta kWh Lug", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_curr_08: {name: "Bolletta kWh Ago", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_curr_09: {name: "Bolletta kWh Set", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_curr_10: {name: "Bolletta kWh Ott", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_curr_11: {name: "Bolletta kWh Nov", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_curr_12: {name: "Bolletta kWh Dic", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_prev_01: {name: "Bolletta kWh Gen Prec", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_prev_02: {name: "Bolletta kWh Feb Prec", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_prev_03: {name: "Bolletta kWh Mar Prec", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_prev_04: {name: "Bolletta kWh Apr Prec", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_prev_05: {name: "Bolletta kWh Mag Prec", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_prev_06: {name: "Bolletta kWh Giu Prec", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_prev_07: {name: "Bolletta kWh Lug Prec", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_prev_08: {name: "Bolletta kWh Ago Prec", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_prev_09: {name: "Bolletta kWh Set Prec", min: 0, max: 2000, step: 1, initial: 0,   mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_prev_10: {name: "Bolletta kWh Ott Prec", min: 0, max: 2000, step: 1, initial: 0, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_prev_11: {name: "Bolletta kWh Nov Prec", min: 0, max: 2000, step: 1, initial: 0, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}
  frarik_bolletta_storico_kwh_prev_12: {name: "Bolletta kWh Dic Prec", min: 0, max: 2000, step: 1, initial: 0, mode: box, unit_of_measurement: "kWh", icon: mdi:flash}

####################################################
#                     REST                         #
####################################################

rest:
  - resource: https://raw.githubusercontent.com/bobsilvio/arera-tariffe/main/data/tariffe_arera.json
    scan_interval: 86400
    sensor:
      - name: frarik_bolletta_arera_trimestre
        unique_id: frarik_bolletta_arera_trimestre
        value_template: "{{ value_json._info.trimestre }}"
        icon: mdi:calendar-clock
      - name: frarik_bolletta_arera_aggiornato_il
        unique_id: frarik_bolletta_arera_aggiornato_il
        value_template: "{{ value_json._info.aggiornato_il }}"
        icon: mdi:calendar-check
      - name: frarik_bolletta_arera_perdite_rete_perc
        unique_id: frarik_bolletta_arera_perdite_rete_perc
        value_template: "{{ value_json.materia_energia.perdite_rete_perc }}"
        unit_of_measurement: "%"
        icon: mdi:transmission-tower
      - name: frarik_bolletta_arera_dispbt
        unique_id: frarik_bolletta_arera_dispbt
        value_template: "{{ value_json.materia_energia.dispbt }}"
        unit_of_measurement: "€/mese"
      - name: frarik_bolletta_arera_dispacciamento
        unique_id: frarik_bolletta_arera_dispacciamento
        value_template: "{{ value_json.materia_energia.dispacciamento }}"
        unit_of_measurement: "€/kWh"
      - name: frarik_bolletta_arera_mercato_capacita
        unique_id: frarik_bolletta_arera_mercato_capacita
        value_template: "{{ value_json.materia_energia.mercato_capacita }}"
        unit_of_measurement: "€/kWh"
      - name: frarik_bolletta_arera_pno
        unique_id: frarik_bolletta_arera_pno
        value_template: "{{ value_json.materia_energia.pno }}"
        unit_of_measurement: "€/mese"
      - name: frarik_bolletta_arera_trasporto_quota_energia
        unique_id: frarik_bolletta_arera_trasporto_quota_energia
        value_template: "{{ value_json.trasporto.quota_energia }}"
        unit_of_measurement: "€/kWh"
      - name: frarik_bolletta_arera_trasporto_quota_fissa
        unique_id: frarik_bolletta_arera_trasporto_quota_fissa
        value_template: "{{ value_json.trasporto.quota_fissa }}"
        unit_of_measurement: "€/mese"
      - name: frarik_bolletta_arera_trasporto_quota_potenza
        unique_id: frarik_bolletta_arera_trasporto_quota_potenza
        value_template: "{{ value_json.trasporto.quota_potenza }}"
        unit_of_measurement: "€/kW"
      - name: frarik_bolletta_arera_uc3
        unique_id: frarik_bolletta_arera_uc3
        value_template: "{{ value_json.trasporto.uc3 }}"
        unit_of_measurement: "€/kWh"
      - name: frarik_bolletta_arera_uc6_fisso
        unique_id: frarik_bolletta_arera_uc6_fisso
        value_template: "{{ value_json.trasporto.uc6_fisso }}"
        unit_of_measurement: "€/kW"
      - name: frarik_bolletta_arera_uc6_variabile
        unique_id: frarik_bolletta_arera_uc6_variabile
        value_template: "{{ value_json.trasporto.uc6_variabile }}"
        unit_of_measurement: "€/kWh"
      - name: frarik_bolletta_arera_asos
        unique_id: frarik_bolletta_arera_asos
        value_template: "{{ value_json.oneri_sistema.asos }}"
        unit_of_measurement: "€/kWh"
      - name: frarik_bolletta_arera_arim
        unique_id: frarik_bolletta_arera_arim
        value_template: "{{ value_json.oneri_sistema.arim }}"
        unit_of_measurement: "€/kWh"
      - name: frarik_bolletta_arera_erariale
        unique_id: frarik_bolletta_arera_erariale
        value_template: "{{ value_json.imposte.erariale_domestico_residente_over3kw }}"
        unit_of_measurement: "€/kWh"
      - name: frarik_bolletta_arera_iva_perc
        unique_id: frarik_bolletta_arera_iva_perc
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
        unique_id: frarik_bolletta_energia_giornaliera_safe
        unit_of_measurement: "kWh"
        state_class: total_increasing
        device_class: energy
        icon: mdi:lightning-bolt
        state: >
          {% set v = states('sensor.frarik_bolletta_energia_giornaliera') %}
          {% if v not in ['unknown','unavailable',''] %}
            {{ v | float(0) }}
          {% else %}
            {{ states('input_number.frarik_bolletta_backup_energia_giornaliera') | float(0) }}
          {% endif %}
      - name: "Bolletta Energia Settimanale Safe"
        unique_id: frarik_bolletta_energia_settimanale_safe
        unit_of_measurement: "kWh"
        state_class: total_increasing
        device_class: energy
        icon: mdi:calendar-week
        state: >
          {% set v = states('sensor.frarik_bolletta_energia_settimanale') %}
          {% if v not in ['unknown','unavailable',''] %}
            {{ v | float(0) }}
          {% else %}
            {{ states('input_number.frarik_bolletta_backup_energia_settimanale') | float(0) }}
          {% endif %}
      - name: "Bolletta Energia Mensile Safe"
        unique_id: frarik_bolletta_energia_mensile_safe
        unit_of_measurement: "kWh"
        state_class: total_increasing
        device_class: energy
        icon: mdi:calendar-month
        state: >
          {% set v = states('sensor.frarik_bolletta_energia_mensile') %}
          {% if v not in ['unknown','unavailable',''] %}
            {{ v | float(0) }}
          {% else %}
            {{ states('input_number.frarik_bolletta_backup_energia_mensile') | float(0) }}
          {% endif %}
      - name: "Bolletta Perdite Rete Perc"
        unique_id: frarik_bolletta_perdite_rete_perc
        unit_of_measurement: "%"
        icon: mdi:transmission-tower
        state: >
          {{ states('sensor.frarik_bolletta_arera_perdite_rete_perc') | float(
             states('input_number.frarik_bolletta_fb_perdite_perc') | float(9.85)) }}
      - name: "Bolletta IVA Perc"
        unique_id: frarik_bolletta_iva_perc_eff
        unit_of_measurement: "%"
        icon: mdi:percent
        state: >
          {{ states('sensor.frarik_bolletta_arera_iva_perc') | float(
             states('input_number.frarik_bolletta_fb_iva_perc') | float(10)) }}
      - name: "Bolletta Costo Mensile Energia"
        unique_id: frarik_bolletta_costo_mensile_energia
        unit_of_measurement: "€"
        icon: mdi:flash
        state: >
          {% set kwh = states('sensor.frarik_bolletta_energia_mensile_safe') | float(0) %}
          {% set p = states('input_number.frarik_bolletta_tariffa_energia') | float(0) + states('input_number.frarik_bolletta_spread_energia') | float(0) %}
          {{ (kwh * p) | round(4) }}
      - name: "Bolletta Costo Mensile Perdite"
        unique_id: frarik_bolletta_costo_mensile_perdite
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {% set kwh = states('sensor.frarik_bolletta_energia_mensile_safe') | float(0) %}
          {% set perc = states('sensor.frarik_bolletta_perdite_rete_perc') | float(9.85) %}
          {% set kp = kwh * perc / 100 %}
          {% set p = states('input_number.frarik_bolletta_tariffa_energia') | float(0) + states('input_number.frarik_bolletta_spread_energia') | float(0) %}
          {{ (kp * p) | round(4) }}
      - name: "Bolletta Costo Mensile Dispacciamento"
        unique_id: frarik_bolletta_costo_mensile_dispacciamento
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {% set kwh = states('sensor.frarik_bolletta_energia_mensile_safe') | float(0) %}
          {% set perc = states('sensor.frarik_bolletta_perdite_rete_perc') | float(9.85) %}
          {% set kwh_tot = kwh * (1 + perc / 100) %}
          {% set t = states('sensor.frarik_bolletta_arera_dispacciamento') | float(states('input_number.frarik_bolletta_fb_dispacciamento') | float(0.019902)) %}
          {{ (kwh * t) | round(4) }}
      - name: "Bolletta Costo Mensile Mercato Capacità"
        unique_id: frarik_bolletta_costo_mensile_mercato_capacita
        unit_of_measurement: "€"
        icon: mdi:power-plug
        state: >
          {% set kwh = states('sensor.frarik_bolletta_energia_mensile_safe') | float(0) %}
          {% set perc = states('sensor.frarik_bolletta_perdite_rete_perc') | float(9.85) %}
          {% set kwh_tot = kwh * (1 + perc / 100) %}
          {% set t = states('sensor.frarik_bolletta_arera_mercato_capacita') | float(states('input_number.frarik_bolletta_fb_mercato_capacita') | float(0.010583)) %}
          {{ (kwh * t) | round(4) }}
      - name: "Bolletta Costo Mensile DISPbt"
        unique_id: frarik_bolletta_costo_mensile_dispbt
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {{ states('sensor.frarik_bolletta_arera_dispbt') | float(states('input_number.frarik_bolletta_fb_dispbt') | float(0.102592)) | round(4) }}
      - name: "Bolletta Costo Mensile PNO"
        unique_id: frarik_bolletta_costo_mensile_pno
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {{ states('sensor.frarik_bolletta_arera_pno') | float(states('input_number.frarik_bolletta_fb_pno') | float(0)) | round(4) }}
      - name: "Bolletta Costo Mensile Commercializzazione"
        unique_id: frarik_bolletta_costo_mensile_commercializzazione
        unit_of_measurement: "€"
        icon: mdi:store
        state: >
          {{ states('input_number.frarik_bolletta_fb_commercializzazione') | float(6) | round(2) }}
      - name: "Bolletta Costo Mensile Trasporto Energia"
        unique_id: frarik_bolletta_costo_mensile_trasporto_energia
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {% set kwh = states('sensor.frarik_bolletta_energia_mensile_safe') | float(0) %}
          {% set t = states('sensor.frarik_bolletta_arera_trasporto_quota_energia') | float(states('input_number.frarik_bolletta_fb_trasporto_energia') | float(0.0119)) %}
          {{ (kwh * t) | round(4) }}
      - name: "Bolletta Costo Mensile Trasporto Fisso"
        unique_id: frarik_bolletta_costo_mensile_trasporto_fisso
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {{ states('sensor.frarik_bolletta_arera_trasporto_quota_fissa') | float(states('input_number.frarik_bolletta_fb_trasporto_fisso') | float(1.92)) | round(4) }}
      - name: "Bolletta Costo Mensile Trasporto Potenza"
        unique_id: frarik_bolletta_costo_mensile_trasporto_potenza
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {% set kw = states('input_number.frarik_bolletta_potenza_impegnata') | float(4.5) %}
          {% set t = states('sensor.frarik_bolletta_arera_trasporto_quota_potenza') | float(states('input_number.frarik_bolletta_fb_trasporto_potenza') | float(1.96)) %}
          {{ (kw * t) | round(4) }}
      - name: "Bolletta Costo Mensile UC3"
        unique_id: frarik_bolletta_costo_mensile_uc3
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {% set kwh = states('sensor.frarik_bolletta_energia_mensile_safe') | float(0) %}
          {% set t = states('sensor.frarik_bolletta_arera_uc3') | float(states('input_number.frarik_bolletta_fb_uc3') | float(0.00276)) %}
          {{ (kwh * t) | round(4) }}
      - name: "Bolletta Costo Mensile UC6 Fisso"
        unique_id: frarik_bolletta_costo_mensile_uc6_fisso
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {% set kw = states('input_number.frarik_bolletta_potenza_impegnata') | float(4.5) %}
          {% set t = states('sensor.frarik_bolletta_arera_uc6_fisso') | float(states('input_number.frarik_bolletta_fb_uc6_fisso') | float(0.07)) %}
          {{ (kw * t) | round(4) }}
      - name: "Bolletta Costo Mensile UC6 Variabile"
        unique_id: frarik_bolletta_costo_mensile_uc6_variabile
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {% set kwh = states('sensor.frarik_bolletta_energia_mensile_safe') | float(0) %}
          {% set t = states('sensor.frarik_bolletta_arera_uc6_variabile') | float(states('input_number.frarik_bolletta_fb_uc6_variabile') | float(0.00007)) %}
          {{ (kwh * t) | round(4) }}
      - name: "Bolletta Costo Mensile ARIM"
        unique_id: frarik_bolletta_costo_mensile_arim
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {% set kwh = states('sensor.frarik_bolletta_energia_mensile_safe') | float(0) %}
          {% set t = states('sensor.frarik_bolletta_arera_arim') | float(states('input_number.frarik_bolletta_fb_arim') | float(0.001638)) %}
          {{ (kwh * t) | round(4) }}
      - name: "Bolletta Costo Mensile ASOS"
        unique_id: frarik_bolletta_costo_mensile_asos
        unit_of_measurement: "€"
        icon: mdi:transmission-tower
        state: >
          {% set kwh = states('sensor.frarik_bolletta_energia_mensile_safe') | float(0) %}
          {% set t = states('sensor.frarik_bolletta_arera_asos') | float(states('input_number.frarik_bolletta_fb_asos') | float(0.028657)) %}
          {{ (kwh * t) | round(4) }}
      - name: "Bolletta Costo Mensile Accise"
        unique_id: frarik_bolletta_costo_mensile_accise
        unit_of_measurement: "€"
        icon: mdi:cash
        state: >
          {% set kwh = states('sensor.frarik_bolletta_energia_mensile_safe') | float(0) %}
          {% set t = states('sensor.frarik_bolletta_arera_erariale') | float(states('input_number.frarik_bolletta_fb_accise') | float(0.0227)) %}
          {{ (kwh * t) | round(4) }}
      - name: "Bolletta Canone RAI Mensile"
        unique_id: frarik_bolletta_canone_rai_mensile
        unit_of_measurement: "€"
        icon: mdi:television-classic
        state: >
          {{ 9.00 if now().month not in [7,8] else 0.00 }}
      - name: "Bolletta Materia Energia Mensile"
        unique_id: frarik_bolletta_materia_energia_mensile
        unit_of_measurement: "€"
        icon: mdi:lightning-bolt
        state: >
          {{ (states('sensor.frarik_bolletta_costo_mensile_energia') | float(0)
            + states('sensor.frarik_bolletta_costo_mensile_perdite') | float(0)
            + states('sensor.frarik_bolletta_costo_mensile_dispacciamento') | float(0)
            + states('sensor.frarik_bolletta_costo_mensile_mercato_capacita') | float(0)
            + states('sensor.frarik_bolletta_costo_mensile_dispbt') | float(0)
            + states('sensor.frarik_bolletta_costo_mensile_pno') | float(0)
            + states('sensor.frarik_bolletta_costo_mensile_commercializzazione') | float(0)) | round(2) }}
      - name: "Bolletta Trasporto Mensile"
        unique_id: frarik_bolletta_trasporto_mensile
        unit_of_measurement: "€"
        icon: mdi:truck
        state: >
          {{ (states('sensor.frarik_bolletta_costo_mensile_trasporto_energia') | float(0)
            + states('sensor.frarik_bolletta_costo_mensile_trasporto_fisso') | float(0)
            + states('sensor.frarik_bolletta_costo_mensile_trasporto_potenza') | float(0)
            + states('sensor.frarik_bolletta_costo_mensile_uc3') | float(0)
            + states('sensor.frarik_bolletta_costo_mensile_uc6_fisso') | float(0)
            + states('sensor.frarik_bolletta_costo_mensile_uc6_variabile') | float(0)) | round(2) }}
      - name: "Bolletta Oneri Sistema Mensili"
        unique_id: frarik_bolletta_oneri_sistema_mensili
        unit_of_measurement: "€"
        icon: mdi:lightning-bolt-outline
        state: >
          {{ (states('sensor.frarik_bolletta_costo_mensile_arim') | float(0)
            + states('sensor.frarik_bolletta_costo_mensile_asos') | float(0)) | round(2) }}
      - name: "Bolletta Imponibile Mensile"
        unique_id: frarik_bolletta_imponibile_mensile
        unit_of_measurement: "€"
        icon: mdi:calculator
        state: >
          {{ (states('sensor.frarik_bolletta_materia_energia_mensile') | float(0)
            + states('sensor.frarik_bolletta_trasporto_mensile') | float(0)
            + states('sensor.frarik_bolletta_oneri_sistema_mensili') | float(0)) | round(2) }}
      - name: "Bolletta IVA Mensile"
        unique_id: frarik_bolletta_iva_mensile
        unit_of_measurement: "€"
        icon: mdi:percent
        state: >
          {% set base = states('sensor.frarik_bolletta_imponibile_mensile') | float(0)
                      + states('sensor.frarik_bolletta_costo_mensile_accise') | float(0) %}
          {% set iva = states('sensor.frarik_bolletta_iva_perc') | float(10) %}
          {{ (base * iva / 100) | round(2) }}
      - name: "Bolletta Mensile"
        unique_id: frarik_bolletta_mensile
        unit_of_measurement: "€"
        icon: mdi:cash-multiple
        state: >
          {% set imp = states('sensor.frarik_bolletta_imponibile_mensile') | float(0) %}
          {% set acc = states('sensor.frarik_bolletta_costo_mensile_accise') | float(0) %}
          {% set iva = states('sensor.frarik_bolletta_iva_mensile') | float(0) %}
          {% set bon = states('input_number.frarik_bolletta_bonus_mese_corrente') | float(0)
                     + states('input_number.frarik_bolletta_bonus_sociale') | float(0) %}
          {{ (imp + acc + iva - bon) | round(2) }}
      - name: "Bolletta Giornaliera"
        unique_id: frarik_bolletta_giornaliera
        unit_of_measurement: "€"
        icon: mdi:calendar-today
        state: >
          {% set kwh = states('sensor.frarik_bolletta_energia_giornaliera_safe') | float(0) %}
          {% set perc = states('sensor.frarik_bolletta_perdite_rete_perc') | float(9.85) %}
          {% set kp = kwh * perc / 100 %}
          {% set kwh_tot = kwh + kp %}
          {% set pE = states('input_number.frarik_bolletta_tariffa_energia') | float(0) + states('input_number.frarik_bolletta_spread_energia') | float(0) %}
          {% set gm = ((now().replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)).day %}
          {% set kw = states('input_number.frarik_bolletta_potenza_impegnata') | float(4.5) %}
          {% set imp = kwh * pE + kp * pE
            + kwh * states('sensor.frarik_bolletta_arera_dispacciamento') | float(states('input_number.frarik_bolletta_fb_dispacciamento') | float(0.019902))
            + kwh * states('sensor.frarik_bolletta_arera_mercato_capacita') | float(states('input_number.frarik_bolletta_fb_mercato_capacita') | float(0.010583))
            + states('sensor.frarik_bolletta_arera_dispbt') | float(states('input_number.frarik_bolletta_fb_dispbt') | float(0.102592)) / gm
            + states('sensor.frarik_bolletta_arera_pno') | float(states('input_number.frarik_bolletta_fb_pno') | float(0)) / gm
            + states('input_number.frarik_bolletta_fb_commercializzazione') | float(6) / gm
            + kwh * states('sensor.frarik_bolletta_arera_trasporto_quota_energia') | float(states('input_number.frarik_bolletta_fb_trasporto_energia') | float(0.0119))
            + states('sensor.frarik_bolletta_arera_trasporto_quota_fissa') | float(states('input_number.frarik_bolletta_fb_trasporto_fisso') | float(1.92)) / gm
            + kw * states('sensor.frarik_bolletta_arera_trasporto_quota_potenza') | float(states('input_number.frarik_bolletta_fb_trasporto_potenza') | float(1.96)) / gm
            + kwh * states('sensor.frarik_bolletta_arera_uc3') | float(states('input_number.frarik_bolletta_fb_uc3') | float(0.00276))
            + kw * states('sensor.frarik_bolletta_arera_uc6_fisso') | float(states('input_number.frarik_bolletta_fb_uc6_fisso') | float(0.07)) / gm
            + kwh * states('sensor.frarik_bolletta_arera_uc6_variabile') | float(states('input_number.frarik_bolletta_fb_uc6_variabile') | float(0.00007))
            + kwh * states('sensor.frarik_bolletta_arera_arim') | float(states('input_number.frarik_bolletta_fb_arim') | float(0.001638))
            + kwh * states('sensor.frarik_bolletta_arera_asos') | float(states('input_number.frarik_bolletta_fb_asos') | float(0.028657)) %}
          {% set acc = kwh * states('sensor.frarik_bolletta_arera_erariale') | float(states('input_number.frarik_bolletta_fb_accise') | float(0.0227)) %}
          {% set iva = (imp + acc) * states('sensor.frarik_bolletta_iva_perc') | float(10) / 100 %}
          {{ (imp + acc + iva) | round(2) }}
      - name: "Bolletta Costo Per kWh"
        unique_id: frarik_bolletta_costo_per_kwh
        unit_of_measurement: "€/kWh"
        icon: mdi:currency-eur
        state: >
          {% set kwh = states('sensor.frarik_bolletta_energia_mensile_safe') | float(0) %}
          {% set spesa = states('sensor.frarik_bolletta_mensile') | float(0) %}
          {% if kwh >= 30 %}{{ (spesa / kwh) | round(4) }}
          {% else %}{{ (states('input_number.frarik_bolletta_tariffa_energia') | float(0) + states('input_number.frarik_bolletta_spread_energia') | float(0)) | round(4) }}{% endif %}
      - name: "Bolletta Proiezione Fine Mese"
        unique_id: frarik_bolletta_proiezione_fine_mese
        unit_of_measurement: "€"
        icon: mdi:crystal-ball
        state: >
          {% set oggi = now().day %}
          {% set gm = ((now().replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)).day %}
          {% set kwh_raw = states('sensor.frarik_bolletta_energia_mensile_safe') | float(0) %}
          {% if oggi > 0 and kwh_raw > 0 %}
            {% set kwh = (kwh_raw / oggi * gm) | round(0) | int %}
            {% set perc = states('sensor.frarik_bolletta_perdite_rete_perc') | float(9.85) %}
            {% set kp = kwh * perc / 100 %}
            {% set pE = states('input_number.frarik_bolletta_tariffa_energia') | float(0) + states('input_number.frarik_bolletta_spread_energia') | float(0) %}
            {% set kw = states('input_number.frarik_bolletta_potenza_impegnata') | float(4.5) %}
            {% set imp = kwh * pE + kp * pE
              + kwh * states('sensor.frarik_bolletta_arera_dispacciamento') | float(states('input_number.frarik_bolletta_fb_dispacciamento') | float(0.019902))
              + kwh * states('sensor.frarik_bolletta_arera_mercato_capacita') | float(states('input_number.frarik_bolletta_fb_mercato_capacita') | float(0.010583))
              + states('sensor.frarik_bolletta_arera_dispbt') | float(states('input_number.frarik_bolletta_fb_dispbt') | float(0.102592))
              + states('sensor.frarik_bolletta_arera_pno') | float(states('input_number.frarik_bolletta_fb_pno') | float(0))
              + states('input_number.frarik_bolletta_fb_commercializzazione') | float(6)
              + kwh * states('sensor.frarik_bolletta_arera_trasporto_quota_energia') | float(states('input_number.frarik_bolletta_fb_trasporto_energia') | float(0.0119))
              + states('sensor.frarik_bolletta_arera_trasporto_quota_fissa') | float(states('input_number.frarik_bolletta_fb_trasporto_fisso') | float(1.92))
              + kw * states('sensor.frarik_bolletta_arera_trasporto_quota_potenza') | float(states('input_number.frarik_bolletta_fb_trasporto_potenza') | float(1.96))
              + kwh * states('sensor.frarik_bolletta_arera_uc3') | float(states('input_number.frarik_bolletta_fb_uc3') | float(0.00276))
              + kw * states('sensor.frarik_bolletta_arera_uc6_fisso') | float(states('input_number.frarik_bolletta_fb_uc6_fisso') | float(0.07))
              + kwh * states('sensor.frarik_bolletta_arera_uc6_variabile') | float(states('input_number.frarik_bolletta_fb_uc6_variabile') | float(0.00007))
              + kwh * states('sensor.frarik_bolletta_arera_arim') | float(states('input_number.frarik_bolletta_fb_arim') | float(0.001638))
              + kwh * states('sensor.frarik_bolletta_arera_asos') | float(states('input_number.frarik_bolletta_fb_asos') | float(0.028657)) %}
            {% set acc = kwh * states('sensor.frarik_bolletta_arera_erariale') | float(states('input_number.frarik_bolletta_fb_accise') | float(0.0227)) %}
            {% set iva = (imp + acc) * states('sensor.frarik_bolletta_iva_perc') | float(10) / 100 %}
            {% set bon = states('input_number.frarik_bolletta_bonus_mese_corrente') | float(0) + states('input_number.frarik_bolletta_bonus_sociale') | float(0) %}
            {{ (imp + acc + iva - bon) | round(2) }}
          {% else %}0{% endif %}
      - name: "Bolletta Previsione kWh Fine Mese"
        unique_id: frarik_bolletta_previsione_kwh_fine_mese
        unit_of_measurement: "kWh"
        icon: mdi:crystal-ball
        state: >
          {% set oggi = now().day %}
          {% set gm = ((now().replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)).day %}
          {% set kwh = states('sensor.frarik_bolletta_energia_mensile_safe') | float(0) %}
          {% if oggi > 0 and kwh > 0 %}{{ ((kwh / oggi) * gm) | round(0) | int }}{% else %}0{% endif %}
      - name: "Bolletta Consumo Medio Giornaliero"
        unique_id: frarik_bolletta_consumo_medio_giornaliero
        unit_of_measurement: "kWh"
        icon: mdi:chart-line
        state: >
          {% set oggi = now().day %}
          {% set kwh = states('sensor.frarik_bolletta_energia_mensile_safe') | float(0) %}
          {% if oggi > 0 %}{{ (kwh / oggi) | round(1) }}{% else %}0{% endif %}
      - name: "Bolletta Media Settimanale kWh"
        unique_id: frarik_bolletta_media_settimanale_kwh
        unit_of_measurement: "kWh"
        icon: mdi:chart-bar
        state: >
          {{ ((states('input_number.frarik_bolletta_storico_kwh_lun') | float(0)
             + states('input_number.frarik_bolletta_storico_kwh_mar') | float(0)
             + states('input_number.frarik_bolletta_storico_kwh_mer') | float(0)
             + states('input_number.frarik_bolletta_storico_kwh_gio') | float(0)
             + states('input_number.frarik_bolletta_storico_kwh_ven') | float(0)
             + states('input_number.frarik_bolletta_storico_kwh_sab') | float(0)
             + states('input_number.frarik_bolletta_storico_kwh_dom') | float(0)) / 7) | round(1) }}
      - name: "Bolletta Totale Anno Corrente"
        unique_id: frarik_bolletta_totale_anno_corrente
        unit_of_measurement: "€"
        icon: mdi:calendar
        state: >
          {% set m = now().month %}{% set tot = namespace(v=0) %}
          {% for i in range(1, m) %}{% set tot.v = tot.v + states('input_number.frarik_bolletta_storico_mese_curr_%02d' | format(i)) | float(0) %}{% endfor %}
          {{ (tot.v + states('sensor.frarik_bolletta_mensile') | float(0)) | round(2) }}
      - name: "Bolletta Totale Anno Precedente"
        unique_id: frarik_bolletta_totale_anno_precedente
        unit_of_measurement: "€"
        icon: mdi:calendar
        state: >
          {% set tot = namespace(v=0) %}
          {% for i in range(1, 13) %}{% set tot.v = tot.v + states('input_number.frarik_bolletta_storico_mese_prev_%02d' | format(i)) | float(0) %}{% endfor %}
          {{ tot.v | round(2) }}
      - name: "Bolletta Consumo Anno Corrente"
        unique_id: frarik_bolletta_consumo_anno_corrente
        unit_of_measurement: "kWh"
        icon: mdi:flash
        state: >
          {% set m = now().month %}{% set tot = namespace(v=0) %}
          {% for i in range(1, m) %}{% set tot.v = tot.v + states('input_number.frarik_bolletta_storico_kwh_curr_%02d' | format(i)) | float(0) %}{% endfor %}
          {{ (tot.v + states('sensor.frarik_bolletta_energia_mensile_safe') | float(0)) | round(1) }}
      - name: "Bolletta Consumo Anno Precedente"
        unique_id: frarik_bolletta_consumo_anno_precedente
        unit_of_measurement: "kWh"
        icon: mdi:flash
        state: >
          {% set tot = namespace(v=0) %}
          {% for i in range(1, 13) %}{% set tot.v = tot.v + states('input_number.frarik_bolletta_storico_kwh_prev_%02d' | format(i)) | float(0) %}{% endfor %}
          {{ tot.v | round(0) }}
      - name: "Bolletta Differenza vs Anno Scorso"
        unique_id: frarik_bolletta_differenza_vs_anno_scorso
        unit_of_measurement: "€"
        icon: mdi:compare
        state: >
          {% set m = now().month %}
          {% set c = states('sensor.frarik_bolletta_mensile') | float(0) %}
          {% set p = states('input_number.frarik_bolletta_storico_mese_prev_%02d' | format(m)) | float(0) %}
          {{ (c - p) | round(2) }}
        attributes:
          percentuale: >
            {% set m = now().month %}
            {% set c = states('sensor.frarik_bolletta_mensile') | float(0) %}
            {% set p = states('input_number.frarik_bolletta_storico_mese_prev_%02d' | format(m)) | float(0) %}
            {% if p > 0 %}{{ (((c - p) / p) * 100) | round(1) }}%{% else %}N/A{% endif %}
      - name: "Bolletta Saldo Octopus"
        unique_id: frarik_bolletta_saldo_octopus
        unit_of_measurement: "€"
        icon: mdi:cash
        state: >
          {{ states('IL_TUO_SENSORE_SALDO_OCTOPUS') | float(0) | round(2) }}
      - name: "Bolletta Giorni Scadenza Offerta"
        unique_id: frarik_bolletta_giorni_scadenza_offerta
        unit_of_measurement: "giorni"
        icon: mdi:calendar-clock
        state: >
          {{ states('IL_TUO_SENSORE_SCADENZA_OCTOPUS') | int(999) }}
      - name: "Bolletta Simulazione"
        unique_id: frarik_bolletta_simulazione_bolletta
        unit_of_measurement: "€"
        icon: mdi:calculator
        state: >
          {% set kwh = states('input_number.frarik_bolletta_test_consumo_kwh') | float(0) %}
          {% set perc = states('sensor.frarik_bolletta_perdite_rete_perc') | float(9.85) %}
          {% set kp = kwh * perc / 100 %}{% set kwh_tot = kwh + kp %}
          {% set pE = states('input_number.frarik_bolletta_tariffa_energia') | float(0) + states('input_number.frarik_bolletta_spread_energia') | float(0) %}
          {% set kw = states('input_number.frarik_bolletta_potenza_impegnata') | float(4.5) %}
          {% set imp = kwh * pE + kp * pE
            + kwh * states('sensor.frarik_bolletta_arera_dispacciamento') | float(states('input_number.frarik_bolletta_fb_dispacciamento') | float(0.019902))
            + kwh * states('sensor.frarik_bolletta_arera_mercato_capacita') | float(states('input_number.frarik_bolletta_fb_mercato_capacita') | float(0.010583))
            + states('sensor.frarik_bolletta_arera_dispbt') | float(states('input_number.frarik_bolletta_fb_dispbt') | float(0.102592))
            + states('sensor.frarik_bolletta_arera_pno') | float(states('input_number.frarik_bolletta_fb_pno') | float(0))
            + states('input_number.frarik_bolletta_fb_commercializzazione') | float(6)
            + kwh * states('sensor.frarik_bolletta_arera_trasporto_quota_energia') | float(states('input_number.frarik_bolletta_fb_trasporto_energia') | float(0.0119))
            + states('sensor.frarik_bolletta_arera_trasporto_quota_fissa') | float(states('input_number.frarik_bolletta_fb_trasporto_fisso') | float(1.92))
            + kw * states('sensor.frarik_bolletta_arera_trasporto_quota_potenza') | float(states('input_number.frarik_bolletta_fb_trasporto_potenza') | float(1.96))
            + kwh * states('sensor.frarik_bolletta_arera_uc3') | float(states('input_number.frarik_bolletta_fb_uc3') | float(0.00276))
            + kw * states('sensor.frarik_bolletta_arera_uc6_fisso') | float(states('input_number.frarik_bolletta_fb_uc6_fisso') | float(0.07))
            + kwh * states('sensor.frarik_bolletta_arera_uc6_variabile') | float(states('input_number.frarik_bolletta_fb_uc6_variabile') | float(0.00007))
            + kwh * states('sensor.frarik_bolletta_arera_arim') | float(states('input_number.frarik_bolletta_fb_arim') | float(0.001638))
            + kwh * states('sensor.frarik_bolletta_arera_asos') | float(states('input_number.frarik_bolletta_fb_asos') | float(0.028657)) %}
          {% set acc = kwh * states('sensor.frarik_bolletta_arera_erariale') | float(states('input_number.frarik_bolletta_fb_accise') | float(0.0227)) %}
          {% set iva = (imp + acc) * states('sensor.frarik_bolletta_iva_perc') | float(10) / 100 %}
          {% set bon = states('input_number.frarik_bolletta_test_bonus_euro') | float(0) %}
          {{ (imp + acc + iva - bon) | round(2) }}

####################################################
#                    SCRIPT                        #
####################################################

script:
  frarik_bolletta_reset_sensori_energia:
    alias: "Frarik — Bolletta: Reset Contatori"
    icon: mdi:restart
    sequence:
      - service: utility_meter.calibrate
        data: { value: "0" }
        target:
          entity_id:
            - sensor.frarik_bolletta_energia_giornaliera
            - sensor.frarik_bolletta_energia_settimanale
            - sensor.frarik_bolletta_energia_mensile
            - sensor.frarik_bolletta_energia_trimestrale
            - sensor.frarik_bolletta_energia_annuale
      - service: input_boolean.turn_off
        target: { entity_id: input_boolean.frarik_bolletta_reset_consumo_mensile }

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
        target: { entity_id: input_number.frarik_bolletta_backup_energia_giornaliera }
        data: { value: "{{ states('sensor.frarik_bolletta_energia_giornaliera') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_backup_energia_settimanale }
        data: { value: "{{ states('sensor.frarik_bolletta_energia_settimanale') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_backup_energia_mensile }
        data: { value: "{{ states('sensor.frarik_bolletta_energia_mensile') | float(0) }}" }

  - alias: "Frarik — Bolletta: Salva Storico Ieri e Settimanale"
    trigger:
      - platform: time
        at: "23:59:00"
    action:
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_costo_ieri }
        data: { value: "{{ states('sensor.frarik_bolletta_giornaliera') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_kwh_ieri }
        data: { value: "{{ states('sensor.frarik_bolletta_energia_giornaliera_safe') | float(0) }}" }
      - choose:
          - conditions: "{{ now().weekday() == 0 }}"
            sequence:
              - service: input_number.set_value
                target: { entity_id: input_number.frarik_bolletta_storico_costo_lun }
                data: { value: "{{ states('sensor.frarik_bolletta_giornaliera') | float(0) }}" }
              - service: input_number.set_value
                target: { entity_id: input_number.frarik_bolletta_storico_kwh_lun }
                data: { value: "{{ states('sensor.frarik_bolletta_energia_giornaliera_safe') | float(0) }}" }
          - conditions: "{{ now().weekday() == 1 }}"
            sequence:
              - service: input_number.set_value
                target: { entity_id: input_number.frarik_bolletta_storico_costo_mar }
                data: { value: "{{ states('sensor.frarik_bolletta_giornaliera') | float(0) }}" }
              - service: input_number.set_value
                target: { entity_id: input_number.frarik_bolletta_storico_kwh_mar }
                data: { value: "{{ states('sensor.frarik_bolletta_energia_giornaliera_safe') | float(0) }}" }
          - conditions: "{{ now().weekday() == 2 }}"
            sequence:
              - service: input_number.set_value
                target: { entity_id: input_number.frarik_bolletta_storico_costo_mer }
                data: { value: "{{ states('sensor.frarik_bolletta_giornaliera') | float(0) }}" }
              - service: input_number.set_value
                target: { entity_id: input_number.frarik_bolletta_storico_kwh_mer }
                data: { value: "{{ states('sensor.frarik_bolletta_energia_giornaliera_safe') | float(0) }}" }
          - conditions: "{{ now().weekday() == 3 }}"
            sequence:
              - service: input_number.set_value
                target: { entity_id: input_number.frarik_bolletta_storico_costo_gio }
                data: { value: "{{ states('sensor.frarik_bolletta_giornaliera') | float(0) }}" }
              - service: input_number.set_value
                target: { entity_id: input_number.frarik_bolletta_storico_kwh_gio }
                data: { value: "{{ states('sensor.frarik_bolletta_energia_giornaliera_safe') | float(0) }}" }
          - conditions: "{{ now().weekday() == 4 }}"
            sequence:
              - service: input_number.set_value
                target: { entity_id: input_number.frarik_bolletta_storico_costo_ven }
                data: { value: "{{ states('sensor.frarik_bolletta_giornaliera') | float(0) }}" }
              - service: input_number.set_value
                target: { entity_id: input_number.frarik_bolletta_storico_kwh_ven }
                data: { value: "{{ states('sensor.frarik_bolletta_energia_giornaliera_safe') | float(0) }}" }
          - conditions: "{{ now().weekday() == 5 }}"
            sequence:
              - service: input_number.set_value
                target: { entity_id: input_number.frarik_bolletta_storico_costo_sab }
                data: { value: "{{ states('sensor.frarik_bolletta_giornaliera') | float(0) }}" }
              - service: input_number.set_value
                target: { entity_id: input_number.frarik_bolletta_storico_kwh_sab }
                data: { value: "{{ states('sensor.frarik_bolletta_energia_giornaliera_safe') | float(0) }}" }
          - conditions: "{{ now().weekday() == 6 }}"
            sequence:
              - service: input_number.set_value
                target: { entity_id: input_number.frarik_bolletta_storico_costo_dom }
                data: { value: "{{ states('sensor.frarik_bolletta_giornaliera') | float(0) }}" }
              - service: input_number.set_value
                target: { entity_id: input_number.frarik_bolletta_storico_kwh_dom }
                data: { value: "{{ states('sensor.frarik_bolletta_energia_giornaliera_safe') | float(0) }}" }

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
          entity_id: "input_number.frarik_bolletta_storico_mese_curr_{{ now().strftime('%m') }}"
        data:
          value: "{{ states('sensor.frarik_bolletta_mensile') | float(0) }}"
      - service: input_number.set_value
        target:
          entity_id: "input_number.frarik_bolletta_storico_kwh_curr_{{ now().strftime('%m') }}"
        data:
          value: "{{ states('sensor.frarik_bolletta_energia_mensile_safe') | float(0) }}"
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_bonus_mese_corrente }
        data: { value: 0 }
      - repeat:
          for_each: *push
          sequence:
            - service: "notify.{{ repeat.item.service }}"
              continue_on_error: true
              data:
                title: "Frarik Bolletta — Fine mese"
                message: >
                  Storico salvato: {{ now().strftime('%B %Y') }}
                  Bolletta: {{ states('sensor.frarik_bolletta_mensile') }} €
                  Consumo: {{ states('sensor.frarik_bolletta_energia_mensile_safe') }} kWh

  - alias: "Frarik — Bolletta: Reset Mensile Manuale"
    trigger:
      - platform: state
        entity_id: input_boolean.frarik_bolletta_reset_consumo_mensile
        to: "on"
    action:
      - service: utility_meter.reset
        target: { entity_id: sensor.frarik_bolletta_energia_mensile }
      - service: input_boolean.turn_off
        target: { entity_id: input_boolean.frarik_bolletta_reset_consumo_mensile }

  - alias: "Frarik — Bolletta: Report Mattutino"
    trigger:
      - platform: time
        at: "08:00:00"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_bolletta_notify_push_giornaliero
        state: "on"
    action:
      - repeat:
          for_each: *push
          sequence:
            - service: "notify.{{ repeat.item.service }}"
              continue_on_error: true
              data:
                title: "Buongiorno — Report Energia"
                message: >
                  Ieri: {{ states('input_number.frarik_bolletta_storico_kwh_ieri') }} kWh = {{ states('input_number.frarik_bolletta_storico_costo_ieri') }} €
                  Mese: {{ states('sensor.frarik_bolletta_energia_mensile_safe') }} kWh = {{ states('sensor.frarik_bolletta_mensile') }} €
                  Proiezione: {{ states('sensor.frarik_bolletta_proiezione_fine_mese') }} €
                  Saldo Octopus: {{ states('sensor.frarik_bolletta_saldo_octopus') }} €

  - alias: "Frarik — Bolletta: Alert Costo Giornaliero"
    trigger:
      - platform: time
        at: "22:00:00"
    condition:
      - condition: template
        value_template: >
          {{ states('sensor.frarik_bolletta_giornaliera') | float(0) > states('input_number.frarik_bolletta_soglia_costo_giornaliero') | float(5) }}
      - condition: state
        entity_id: input_boolean.frarik_bolletta_notify_push_giornaliero
        state: "on"
    action:
      - repeat:
          for_each: *push
          sequence:
            - service: "notify.{{ repeat.item.service }}"
              continue_on_error: true
              data:
                title: "Costo giornaliero elevato"
                message: >
                  Oggi: {{ states('sensor.frarik_bolletta_giornaliera') }} €
                  Consumo: {{ states('sensor.frarik_bolletta_energia_giornaliera_safe') }} kWh

  - alias: "Frarik — Bolletta: Alert Soglia Potenza"
    trigger:
      - platform: numeric_state
        entity_id: *sensore_potenza_bolletta
        above: input_number.frarik_bolletta_soglia_lavoro_w
        for:
          seconds: "{{ states('input_number.frarik_bolletta_ritardo_soglia_sec') | int(60) }}"
    condition:
      - condition: time
        after: input_datetime.frarik_bolletta_orario_inizio_notifiche_soglia
        before: input_datetime.frarik_bolletta_orario_fine_notifiche_soglia
      - condition: state
        entity_id: input_boolean.frarik_bolletta_notify_push_soglia
        state: "on"
    action:
      - repeat:
          for_each: *push
          sequence:
            - service: "notify.{{ repeat.item.service }}"
              continue_on_error: true
              data:
                title: "Consumo elevato"
                message: >
                  Soglia {{ states('input_number.frarik_bolletta_soglia_lavoro_w') | int }} W superata!
                  Costo stimato oggi: {{ states('sensor.frarik_bolletta_giornaliera') }} €

  - alias: "Frarik — Bolletta: Report Mensile"
    trigger:
      - platform: time
        at: "09:00:00"
    condition:
      - condition: template
        value_template: "{{ now().day == 1 }}"
      - condition: state
        entity_id: input_boolean.frarik_bolletta_notify_push_mensile
        state: "on"
    action:
      - repeat:
          for_each: *push
          sequence:
            - service: "notify.{{ repeat.item.service }}"
              continue_on_error: true
              data:
                title: "Report Bolletta Mese Scorso"
                message: >
                  {% set m = now().month - 1 %}{% if m == 0 %}{% set m = 12 %}{% endif %}
                  {% set mm = '%02d' | format(m) %}
                  Bolletta: {{ states('input_number.frarik_bolletta_storico_mese_curr_' ~ mm) }} €
                  Consumo: {{ states('input_number.frarik_bolletta_storico_kwh_curr_' ~ mm) }} kWh
                  Saldo Octopus: {{ states('sensor.frarik_bolletta_saldo_octopus') }} €

  - alias: "Frarik — Bolletta: Archiviazione Anno Nuovo"
    trigger:
      - platform: time
        at: "23:59:30"
    condition:
      - condition: template
        value_template: "{{ now().month == 12 and now().day == 31 }}"
    action:
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_mese_prev_01 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_mese_curr_01') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_mese_prev_02 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_mese_curr_02') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_mese_prev_03 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_mese_curr_03') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_mese_prev_04 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_mese_curr_04') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_mese_prev_05 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_mese_curr_05') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_mese_prev_06 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_mese_curr_06') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_mese_prev_07 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_mese_curr_07') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_mese_prev_08 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_mese_curr_08') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_mese_prev_09 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_mese_curr_09') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_mese_prev_10 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_mese_curr_10') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_mese_prev_11 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_mese_curr_11') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_mese_prev_12 }
        data: { value: "{{ states('sensor.frarik_bolletta_mensile') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_kwh_prev_01 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_kwh_curr_01') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_kwh_prev_02 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_kwh_curr_02') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_kwh_prev_03 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_kwh_curr_03') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_kwh_prev_04 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_kwh_curr_04') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_kwh_prev_05 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_kwh_curr_05') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_kwh_prev_06 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_kwh_curr_06') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_kwh_prev_07 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_kwh_curr_07') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_kwh_prev_08 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_kwh_curr_08') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_kwh_prev_09 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_kwh_curr_09') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_kwh_prev_10 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_kwh_curr_10') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_kwh_prev_11 }
        data: { value: "{{ states('input_number.frarik_bolletta_storico_kwh_curr_11') | float(0) }}" }
      - service: input_number.set_value
        target: { entity_id: input_number.frarik_bolletta_storico_kwh_prev_12 }
        data: { value: "{{ states('sensor.frarik_bolletta_energia_mensile_safe') | float(0) }}" }
      - repeat:
          for_each: *push
          sequence:
            - service: "notify.{{ repeat.item.service }}"
              continue_on_error: true
              data:
                title: "Frarik Bolletta — Anno Archiviato"
                message: "Anno {{ now().year }} archiviato."

  - alias: "Frarik — Bolletta: Alert Scadenza Octopus"
    trigger:
      - platform: numeric_state
        entity_id: sensor.frarik_bolletta_giorni_scadenza_offerta
        below: 61
    condition:
      - condition: template
        value_template: "{{ states('sensor.frarik_bolletta_giorni_scadenza_offerta') | int(999) in [60,30,15,7] }}"
    action:
      - repeat:
          for_each: *push
          sequence:
            - service: "notify.{{ repeat.item.service }}"
              continue_on_error: true
              data:
                title: "Scadenza Offerta Octopus"
                message: >
                  Mancano {{ states('sensor.frarik_bolletta_giorni_scadenza_offerta') }} giorni.
                  Ricordati di rinnovare l'offerta!
`;

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

  function openWizard(hass, onDone) {
    var states = (hass && hass.states) || {};
    var allIds = Object.keys(states).sort();
    var iSt = 'width:100%;padding:8px 10px;border-radius:8px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none;margin-top:3px';
    var stDrop = 'position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:200;max-height:130px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.15);border-radius:8px;display:none;scrollbar-width:none';

    function wfield(id, lbl2, ph) {
      return '<div style="margin-bottom:10px;position:relative"><label style="font-size:11px;color:#fff;display:block;margin-bottom:2px">' + lbl2 + '</label>'
        + '<input id="' + id + '" type="text" autocomplete="off" placeholder="' + ph + '" style="' + iSt + '">'
        + '<div id="' + id + '-d" style="' + stDrop + '"></div></div>';
    }

    var formHtml = '<div style="font-size:11px;color:rgba(255,255,255,.4);background:rgba(' + RGB + ',.08);border-radius:8px;padding:10px;margin-bottom:12px">Inserisci i dati del tuo impianto — il package verrà installato automaticamente su Home Assistant.</div>'
      + wfield('wz-pot', '⚡ Sensore Potenza Casa (W)', 'sensor.potenza_istantanea')
      + wfield('wz-tar', '💰 Tariffa Energia (€/kWh)', '0.090000')
      + wfield('wz-kw',  '🔌 Potenza Impegnata (kW)',   '4.5')
      + '<div style="margin-bottom:14px"><label style="font-size:11px;color:rgba(255,255,255,.6);display:block;margin-bottom:2px">📱 App notifica push</label>'
      + '<input id="wz-push" type="text" placeholder="notify.mobile_app_smartphone" style="' + iSt + '"></div>'
      + '<button id="wz-install" style="width:100%;padding:13px;border-radius:10px;background:#22c55e;color:#000;font-size:14px;font-weight:800;border:none;cursor:pointer">⬇ Installa PKG</button>';

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

    ov.querySelector('#wz-install').addEventListener('click', function() {
      var pot = g3('wz-pot'), tar = g3('wz-tar'), kw = g3('wz-kw');
      var push = g3('wz-push') ? [g3('wz-push')] : null;
      var btn = ov.querySelector('#wz-install');
      btn.textContent = 'Installazione…'; btn.disabled = true;
      var yaml = _bBuildPkg(pot, tar, kw, push);
      var m = location.pathname.match(/^(.*\/api\/hassio_ingress\/[^/]+)/);
      var base = location.origin + (m ? m[1] : '');
      fetch(base + '/api/frarik/pkg/install', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: 'frarik/frarik_bolletta.yaml', content: yaml})
      }).then(function(r) { return r.json().then(function(j) { return {r: r, j: j}; }); })
        .then(function(res) {
          ov._close();
          if (res.r.ok && res.j.ok) {
            try { if (typeof window.showToast === 'function') window.showToast('📦 PKG Bolletta installato! Riavvia HA.'); } catch(e) {}
            if (typeof onDone === 'function') onDone();
          } else {
            try { if (typeof window.showToast === 'function') window.showToast('⚠️ Errore installazione PKG: ' + ((res.j && res.j.error) || '')); } catch(e) {}
          }
        }).catch(function() {
          ov._close();
          try { if (typeof window.showToast === 'function') window.showToast('⚠️ Errore connessione installazione PKG'); } catch(e) {}
        });
    });
  }

  /* ── IMPOSTAZIONI HA POPUP ALIAS ── */
  function openImpostazioniHAPopup(card) {
    var h = H(), c = cfgFor(card);
    openImpostazioni(card, c, null);
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
    configure: null,
    frarik_no_edit: true,
    frarik_pkg_check: 'sensor.frarik_bolletta_versione',
    frarik_pkg_id: 'frarik_bolletta',
    frarik_pkg_version: '2.0',
    openWizard: openWizard,
  };

})();
