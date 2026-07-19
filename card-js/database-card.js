/* frarik-version: 3.0 */
/* v3.0: rimosso il limite max-width:340px sulla colonna anteprima, che la
   rendeva più stretta della colonna impostazioni nei popup larghi: ora le
   due colonne restano sempre esattamente uguali. */
/* v2.9: il popup Impostazioni ora è a due colonne (impostazioni a sinistra,
   anteprima live + dimensione card subito visibili a destra, 50/50) invece
   di avere l'anteprima in fondo a una colonna unica scrollabile. */
/* v2.8: raggruppati i controlli del popup Impostazioni (Automazioni, Orario
   e giorni, Soglie) in riquadri con contorno bianco, come nelle altre card. */
/* v2.7: allineati popup ed etichette allo standard delle altre card (sfondo
   #0a0816, icona/bordo neutri, titolo maiuscolo, niente sottotitoli); bagliore
   card più visibile (.08→.16); pulsante "Salva impostazioni" ora blu pieno
   invece che translucido; applicato maiuscolo+grassetto a TUTTO il testo di
   card e popup tramite regola CSS universale; rimaste scritte sbiadite
   (anche nel grafico SVG) portate a bianco pieno. Aggiunta sezione "Aspetto"
   nel popup Impostazioni con zoom/larghezza card e anteprima live (mancava
   del tutto). */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { var h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function S(h, id) { var s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function N(h, id, fb) { var v = parseFloat(S(h, id)); return isNaN(v) ? (fb === undefined ? 0 : fb) : v; }
  function isOn(h, id) { return !!(h && h.states && h.states[id] && h.states[id].state === 'on'); }
  function callSvc(domain, service, data) { try { var h = H(); if (h && h.callService) h.callService(domain, service, data || {}); } catch (e) {} }

  var ACC = '56,189,248';
  var ACCH = '#38bdf8';

  /* ──────────────────────────── SVG DATABASE ──────────────────────── */
  function dbSVG(busy) {
    var cx = 32, cy = 34;
    var platDur = busy ? '.6s' : '5s';
    var armAnim = busy
      ? 'animation:dbArmB 1.2s ease-in-out infinite;transform-origin:'+cx+'px '+cy+'px'
      : 'animation:dbArm 6s ease-in-out infinite;transform-origin:'+cx+'px '+cy+'px';
    var kf = '<defs><style>'
      + '@keyframes dbPlat{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'
      + '@keyframes dbArm{0%,100%{transform:rotate(-28deg)}50%{transform:rotate(22deg)}}'
      + '@keyframes dbArmB{0%,100%{transform:rotate(-35deg)}50%{transform:rotate(35deg)}}'
      + '@keyframes dbLed{0%,100%{opacity:.35}50%{opacity:1}}'
      + '@keyframes dbGlow{0%,100%{opacity:.6}50%{opacity:1}}'
      + (busy ? '@keyframes dbBit{0%{opacity:0;transform:scale(1.8)}60%{opacity:.9}100%{opacity:0;transform:scale(.2)}}' : '')
      + '</style></defs>';

    /* piatto rotante — settori di dati + track rings */
    var platter = '<g style="transform-origin:'+cx+'px '+cy+'px;animation:dbPlat '+platDur+' linear infinite">'
      /* tracce concentriche */
      + '<circle cx="'+cx+'" cy="'+cy+'" r="24" fill="none" stroke="rgba('+ACC+',.07)" stroke-width=".8"/>'
      + '<circle cx="'+cx+'" cy="'+cy+'" r="19" fill="none" stroke="rgba('+ACC+',.07)" stroke-width=".7"/>'
      + '<circle cx="'+cx+'" cy="'+cy+'" r="14" fill="none" stroke="rgba('+ACC+',.06)" stroke-width=".6"/>'
      + '<circle cx="'+cx+'" cy="'+cy+'" r="9"  fill="none" stroke="rgba('+ACC+',.05)" stroke-width=".5"/>'
      /* settori dati (archi colorati sulle tracce) */
      + '<path d="M'+cx+','+( cy-24)+' A24,24 0 0,1 '+(cx+20.8)+','+(cy-11.9)+'" fill="none" stroke="rgba('+ACC+',.35)" stroke-width="3.5" stroke-linecap="round"/>'
      + '<path d="M'+(cx+16.6)+','+(cy+17.6)+' A24,24 0 0,1 '+(cx-9.3)+','+(cy+22.1)+'" fill="none" stroke="rgba('+ACC+',.22)" stroke-width="3.5" stroke-linecap="round"/>'
      + '<path d="M'+cx+','+(cy-19)+' A19,19 0 0,1 '+(cx+13.4)+','+(cy-13.4)+'" fill="none" stroke="rgba('+ACC+',.45)" stroke-width="4" stroke-linecap="round"/>'
      + '<path d="M'+(cx-6.5)+','+(cy+17.8)+' A19,19 0 0,0 '+(cx-18.1)+','+(cy+6.1)+'" fill="none" stroke="rgba('+ACC+',.28)" stroke-width="4" stroke-linecap="round"/>'
      + '<path d="M'+cx+','+(cy-14)+' A14,14 0 0,1 '+(cx+9.9)+','+(cy-9.9)+'" fill="none" stroke="rgba('+ACC+',.55)" stroke-width="4.5" stroke-linecap="round"/>'
      + '<path d="M'+(cx+14)+','+cy+' A14,14 0 0,1 '+(cx+9.9)+','+(cy+9.9)+'" fill="none" stroke="rgba('+ACC+',.32)" stroke-width="4.5" stroke-linecap="round"/>'
      + '<path d="M'+cx+','+(cy-9)+' A9,9 0 0,1 '+(cx+6.4)+','+(cy-6.4)+'" fill="none" stroke="rgba('+ACC+',.6)" stroke-width="5" stroke-linecap="round"/>'
      /* punti luminosi (bit di dati) */
      + '<circle cx="'+cx+'" cy="'+(cy-24)+'" r="1.8" fill="'+ACCH+'" opacity=".8"/>'
      + '<circle cx="'+(cx+20.8)+'" cy="'+(cy-11.9)+'" r="1.5" fill="'+ACCH+'" opacity=".65"/>'
      + '<circle cx="'+(cx+13.4)+'" cy="'+(cy-13.4)+'" r="1.6" fill="'+ACCH+'" opacity=".7"/>'
      + '<circle cx="'+(cx-18.1)+'" cy="'+(cy+6.1)+'" r="1.4" fill="'+ACCH+'" opacity=".5"/>'
      + '</g>';

    /* bit animati in entrata durante repack */
    var bits = busy ? (
      '<circle r="2" fill="'+ACCH+'" style="animation:dbBit 1.1s ease-in-out infinite"><animateMotion dur="1.1s" repeatCount="indefinite" path="M '+(cx+28)+','+cy+' L '+cx+','+cy+'"/></circle>'
      + '<circle r="1.5" fill="'+ACCH+'" style="animation:dbBit 1.4s ease-in-out infinite .4s"><animateMotion dur="1.4s" repeatCount="indefinite" begin=".4s" path="M '+cx+','+(cy-28)+' L '+cx+','+cy+'"/></circle>'
      + '<circle r="1.8" fill="#a5f3fc" style="animation:dbBit .9s ease-in-out infinite .2s"><animateMotion dur=".9s" repeatCount="indefinite" begin=".2s" path="M '+(cx-24)+','+(cy-14)+' L '+cx+','+cy+'"/></circle>'
    ) : '';

    /* braccio lettura/scrittura */
    var arm = '<g style="'+armAnim+'">'
      + '<line x1="'+cx+'" y1="'+cy+'" x2="'+cx+'" y2="'+(cy-25)+'" stroke="rgba(180,190,220,.55)" stroke-width="1.4" stroke-linecap="round"/>'
      + '<line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+8)+'" y2="'+(cy+4)+'" stroke="rgba(180,190,220,.35)" stroke-width="1" stroke-linecap="round"/>'
      + '<rect x="'+(cx-3)+'" y="'+(cy-28)+'" width="6" height="4" rx="2" fill="'+ACCH+'" opacity=".9"/>'
      + '<circle cx="'+cx+'" cy="'+(cy-22)+'" r="1.3" fill="rgba('+ACC+',.5)"/>'
      + '<circle cx="'+cx+'" cy="'+(cy-14)+'" r=".9" fill="rgba('+ACC+',.3)"/>'
      + '</g>';

    /* corpo disco esterno */
    var body = '<circle cx="'+cx+'" cy="'+cy+'" r="27" fill="#04091a" stroke="rgba('+ACC+',.5)" stroke-width="1.5"/>'
      /* viti angoli */
      + '<circle cx="9"  cy="11" r="2" fill="#0a1428" stroke="rgba('+ACC+',.25)" stroke-width=".8"/>'
      + '<line x1="7.6" y1="11" x2="10.4" y2="11" stroke="rgba('+ACC+',.3)" stroke-width=".6"/>'
      + '<line x1="9" y1="9.6" x2="9" y2="12.4" stroke="rgba('+ACC+',.3)" stroke-width=".6"/>'
      + '<circle cx="55" cy="11" r="2" fill="#0a1428" stroke="rgba('+ACC+',.25)" stroke-width=".8"/>'
      + '<line x1="53.6" y1="11" x2="56.4" y2="11" stroke="rgba('+ACC+',.3)" stroke-width=".6"/>'
      + '<line x1="55" y1="9.6" x2="55" y2="12.4" stroke="rgba('+ACC+',.3)" stroke-width=".6"/>'
      + '<circle cx="9"  cy="57" r="2" fill="#0a1428" stroke="rgba('+ACC+',.25)" stroke-width=".8"/>'
      + '<line x1="7.6" y1="57" x2="10.4" y2="57" stroke="rgba('+ACC+',.3)" stroke-width=".6"/>'
      + '<line x1="9" y1="55.6" x2="9" y2="58.4" stroke="rgba('+ACC+',.3)" stroke-width=".6"/>'
      + '<circle cx="55" cy="57" r="2" fill="#0a1428" stroke="rgba('+ACC+',.25)" stroke-width=".8"/>'
      + '<line x1="53.6" y1="57" x2="56.4" y2="57" stroke="rgba('+ACC+',.3)" stroke-width=".6"/>'
      + '<line x1="55" y1="55.6" x2="55" y2="58.4" stroke="rgba('+ACC+',.3)" stroke-width=".6"/>';

    /* mozzo centrale */
    var hub = '<circle cx="'+cx+'" cy="'+cy+'" r="5.5" fill="#060d1f" stroke="rgba('+ACC+',.45)" stroke-width="1.2"/>'
      + '<circle cx="'+cx+'" cy="'+cy+'" r="3" fill="rgba('+ACC+',.2)"/>'
      + '<circle cx="'+cx+'" cy="'+cy+'" r="1.5" fill="'+ACCH+'" style="animation:dbGlow 2s ease-in-out infinite" opacity=".85"/>';

    /* pannello status in basso */
    var panel = '<rect x="5" y="68" width="54" height="12" rx="3" fill="#04091a" stroke="rgba('+ACC+',.2)" stroke-width=".8"/>'
      /* LED */
      + '<circle cx="13" cy="74" r="2.2" fill="'+(busy?'#22c55e':'rgba('+ACC+',.2)')+'" style="animation:dbLed '+(busy?'.6s':' 3s')+' ease-in-out infinite"/>'
      + '<circle cx="20" cy="74" r="2.2" fill="'+(busy?ACCH:'rgba('+ACC+',.12)')+'" style="animation:dbLed '+(busy?'.9s':'4s')+' ease-in-out infinite '+(busy?'.15s':'.5s')+'"/>'
      + '<circle cx="27" cy="74" r="2.2" fill="'+(busy?ACCH:'rgba('+ACC+',.08)')+'" style="animation:dbLed '+(busy?'1.1s':'5s')+' ease-in-out infinite '+(busy?'.3s':'1s')+'"/>'
      /* barra attività */
      + '<rect x="34" y="70.5" width="22" height="7" rx="2" fill="rgba('+ACC+',.08)" stroke="rgba('+ACC+',.15)" stroke-width=".6"/>'
      + (busy
        ? '<rect x="35" y="71.5" width="20" height="5" rx="1.5" fill="rgba('+ACC+',.35)" style="animation:dbGlow 1s ease-in-out infinite"/>'
          + '<rect x="35" y="71.5" width="14" height="5" rx="1.5" fill="rgba('+ACC+',.6)"/>'
          + '<text x="45" y="75.5" text-anchor="middle" font-size="4.2" font-weight="800" font-family="monospace" fill="'+ACCH+'">REPACK</text>'
        : '<rect x="35" y="71.5" width="6" height="5" rx="1.5" fill="rgba('+ACC+',.25)"/>'
          + '<text x="45" y="75.5" text-anchor="middle" font-size="4.5" font-weight="700" font-family="monospace" fill="rgba('+ACC+',.5)"> IDLE </text>'
      );

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 82" style="display:block;width:100%;height:100%;filter:drop-shadow(0 0 12px rgba('+ACC+','+(busy?'.4':'.15')+'))">'
      + kf
      + body
      + platter
      + bits
      + arm
      + hub
      + panel
      + '</svg>';
  }

  /* ──────────────────────────── CHART SVG ─────────────────────────── */
  function chartSVG(h) {
    var keys = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'];
    var lbl  = ['L','M','M','G','V','S','D'];
    var vals = keys.map(function(k){ return N(h,'input_number.frarik_db_'+k,0); });
    var maxV = Math.max.apply(null, vals.concat([1]));
    var W = 280, H2 = 70, pl = 26, pr = 4, pt = 6, pb = 16;
    var cW = W-pl-pr, cH = H2-pt-pb;
    var bW = Math.floor((cW - keys.length*3) / keys.length);
    var todayIdx = (new Date().getDay()+6)%7;
    var out = '<svg viewBox="0 0 '+W+' '+H2+'" style="width:100%;height:auto;display:block">';
    for (var g=0;g<=4;g++) {
      var gy = pt+cH - Math.round((g/4)*cH);
      out += '<line x1="'+pl+'" y1="'+gy+'" x2="'+(W-pr)+'" y2="'+gy+'" stroke="rgba(255,255,255,.05)" stroke-width="1"/>';
      if (g>0) { var gl = Math.round((maxV/4)*g); gl = gl>=1000?(gl/1000).toFixed(1)+'k':gl+''; out += '<text x="'+(pl-3)+'" y="'+(gy+3)+'" text-anchor="end" fill="#fff" font-size="7" font-family="system-ui" font-weight="800">'+gl+'</text>'; }
    }
    vals.forEach(function(v,i){
      var bH = v>0 ? Math.max(3,Math.round((v/maxV)*cH)) : 2;
      var x = pl + i*(bW+3), y = pt+cH-bH;
      var isT = i===todayIdx;
      out += '<rect x="'+x+'" y="'+y+'" width="'+bW+'" height="'+bH+'" rx="2" fill="'+(isT?ACCH:'rgba('+ACC+',.4)')+'"/>';
      if (isT&&v>0){ var vl=v>=1000?(v/1000).toFixed(1)+'k':Math.round(v)+''; out+='<text x="'+(x+bW/2)+'" y="'+(y-3)+'" text-anchor="middle" fill="'+ACCH+'" font-size="7" font-family="system-ui">'+vl+'</text>'; }
      out += '<text x="'+(x+bW/2)+'" y="'+(H2-pb+11)+'" text-anchor="middle" fill="#fff" font-size="8" font-family="system-ui" font-weight="800">'+lbl[i]+'</text>';
    });
    return out+'</svg>';
  }

  /* ──────────────────────────── RENDER ────────────────────────────── */
  function render(card) {
    var h = H();
    var rid = 'dbc' + (card.id || 'x').replace(/[^a-z0-9]/gi,'');

    var dimRaw = N(h, 'sensor.frarik_db_dimensione', 0);
    var dimD   = dimRaw >= 1000 ? (dimRaw/1000).toFixed(2) : Math.round(dimRaw)+'';
    var dimU   = dimRaw >= 1000 ? 'GB' : 'MB';
    var dimMax = Math.round(N(h,'input_number.frarik_db_dimensione_massima',1000));
    var pct    = dimMax>0 ? Math.min(100,Math.round((dimRaw/dimMax)*100)) : 0;
    var media  = N(h,'sensor.frarik_db_media_7_giorni',0);
    var mediaS = media>=1000?(media/1000).toFixed(1)+' GB':Math.round(media)+' MB';
    var giP    = Math.round(N(h,'sensor.frarik_db_giorni_passati_repack',0));
    var giM    = Math.round(N(h,'input_number.frarik_db_giorni_da_mantenere',30));
    var stato  = S(h,'input_text.frarik_db_stato') || 'Standby';
    var ultRep = S(h,'input_text.frarik_db_ultimo_repack') || '—';
    var dimPrec= Math.round(N(h,'input_number.frarik_db_dimensione_precedente',0));
    var busy   = stato === 'In Corso';
    var giRim  = Math.max(0, giM-giP);

    var repO = isOn(h,'input_boolean.frarik_db_repack_orario');
    var repD = isOn(h,'input_boolean.frarik_db_repack_dimensione');

    var pillTxt, pillBg, pillBdr, pillCol;
    if (busy)                          { pillTxt='⚙ REPACK';    pillBg='rgba('+ACC+',.18)';    pillBdr='rgba('+ACC+',.4)';    pillCol=ACCH; }
    else if (pct>=100||giP>=giM)       { pillTxt='⚠ ATTENZIONE';pillBg='rgba(251,146,60,.12)'; pillBdr='rgba(251,146,60,.3)'; pillCol='#fb923c'; }
    else                               { pillTxt='● STANDBY';   pillBg='rgba('+ACC+',.08)';    pillBdr='rgba('+ACC+',.2)';    pillCol=ACCH; }

    var barCol = pct>=100?'#ef4444':pct>=80?'#f97316':ACCH;

    var css = '<style>'
      + '#'+rid+'{position:relative;width:100%;height:100%;min-height:280px;font-family:system-ui,sans-serif;display:block}'
      + '#'+rid+' .dc-card{display:flex;flex-direction:column;height:100%;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#'+rid+' .dc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:200px;background:radial-gradient(ellipse at 20% 0%,rgba(56,189,248,.16) 0%,transparent 65%);pointer-events:none}'
      + '#'+rid+' .dc-card *{text-transform:uppercase!important;font-weight:800!important}'
      + '#'+rid+' .dc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#'+rid+' .dc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;background:rgba('+ACC+',.12);border:1px solid rgba('+ACC+',.25)}'
      + '#'+rid+' .dc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#'+rid+' .dc-pill{font-size:9px;font-weight:800;padding:3px 9px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px;border:1px solid}'
      + '#'+rid+' .dc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#'+rid+' .dc-scroll::-webkit-scrollbar{display:none}'
      + '#'+rid+' .dc-hero{display:flex;align-items:stretch;padding:10px 14px 8px;flex:1}'
      + '#'+rid+' .dc-hero-img{flex:1;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;max-height:130px}'
      + '#'+rid+' .dc-hero-r{flex:1;display:flex;flex-direction:column;gap:5px;justify-content:center;min-width:0;border-left:1px solid rgba(255,255,255,.06);padding-left:12px}'
      + '#'+rid+' .dc-dim{display:flex;align-items:baseline;gap:3px}'
      + '#'+rid+' .dc-dim-n{font-size:30px;font-weight:900;color:#fff;line-height:1}'
      + '#'+rid+' .dc-dim-u{font-size:13px;font-weight:700;color:#fff}'
      + '#'+rid+' .dc-bar{height:5px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:1px}'
      + '#'+rid+' .dc-bar-f{height:5px;border-radius:3px;transition:width .5s,background .3s}'
      + '#'+rid+' .dc-pct{font-size:10px;color:#fff;margin-top:2px}'
      + '#'+rid+' .dc-met{display:flex;align-items:center;justify-content:space-between;gap:6px}'
      + '#'+rid+' .dc-met-l{font-size:11px;font-weight:700;color:#fff;flex-shrink:0}'
      + '#'+rid+' .dc-met-v{font-size:13px;font-weight:800;color:#fff;text-align:right}'
      + '#'+rid+' .dc-stats{display:flex;margin:0 14px 8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden;cursor:pointer}'
      + '#'+rid+' .dc-stats:hover{background:rgba(255,255,255,.06)}'
      + '#'+rid+' .dc-sb{flex:1;display:flex;flex-direction:column;align-items:center;padding:8px 3px;gap:2px}'
      + '#'+rid+' .dc-sb-sep{width:1px;background:rgba(255,255,255,.07);flex-shrink:0}'
      + '#'+rid+' .dc-sb-n{font-size:12px;font-weight:900;color:'+ACCH+';height:18px;display:flex;align-items:center;justify-content:center}'
      + '#'+rid+' .dc-sb-l{font-size:8px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.4px;text-align:center}'
      + '#'+rid+' .dc-btns{display:flex;gap:6px;padding:0 14px 12px}'
      + '#'+rid+' .dc-btn{flex:1;padding:8px 4px;border-radius:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:10px;font-weight:700;color:#fff;text-align:center;cursor:pointer;transition:all .15s}'
      + '#'+rid+' .dc-btn:hover{background:rgba('+ACC+',.12);border-color:rgba('+ACC+',.3);color:'+ACCH+'}'
      + '#'+rid+' .dc-busy-banner{display:flex;align-items:center;gap:10px;margin:8px 14px 0;background:rgba('+ACC+',.12);border:1px solid rgba('+ACC+',.3);border-radius:10px;padding:9px 12px}'
      + '#'+rid+' .dc-spin{display:inline-block;animation:dcSpin 1.5s linear infinite}'
      + '#'+rid+' .dc-busy-t{font-size:12px;font-weight:700;color:#fff}'
      + '#'+rid+' .dc-busy-s{font-size:10px;color:#fff;opacity:.6;margin-top:2px}'
      + '#'+rid+' [data-sya]{cursor:pointer}'
      + (busy?'@keyframes dcSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}':'')
      + '</style>';

    var busyBanner = busy
      ? '<div class="dc-busy-banner"><span class="dc-spin" style="font-size:18px">⚙️</span><div><div class="dc-busy-t">Repack in corso…</div><div class="dc-busy-s">Ottimizzazione database attiva</div></div></div>'
      : '';

    var heroHtml = '<div class="dc-hero">'
      + '<div class="dc-hero-img" data-sya="popup-storico">' + dbSVG(busy) + '</div>'
      + '<div class="dc-hero-r">'
      + '<div class="dc-dim"><span class="dc-dim-n">'+dimD+'</span><span class="dc-dim-u">'+dimU+'</span></div>'
      + '<div class="dc-bar"><div class="dc-bar-f" style="width:'+pct+'%;background:'+barCol+';box-shadow:0 0 5px '+barCol+'88"></div></div>'
      + '<div class="dc-pct">'+pct+'% di '+dimMax+' MB</div>'
      + '<div class="dc-met"><span class="dc-met-l">Stato</span><span class="dc-met-v">'+(busy?'<span class="dc-spin" style="font-size:10px">⚙</span> Repack…':stato)+'</span></div>'
      + '<div class="dc-met"><span class="dc-met-l">Ultimo</span><span class="dc-met-v">'+ultRep+'</span></div>'
      + '<div class="dc-met"><span class="dc-met-l">Media 7gg</span><span class="dc-met-v">'+mediaS+'</span></div>'
      + '</div>'
      + '</div>';

    var statsHtml = '<div class="dc-stats" data-sya="popup-storico">'
      + '<div class="dc-sb"><div class="dc-sb-n">'+giM+'gg</div><div class="dc-sb-l">storico</div></div>'
      + '<div class="dc-sb-sep"></div>'
      + '<div class="dc-sb"><div class="dc-sb-n">'+giRim+'gg</div><div class="dc-sb-l">al repack</div></div>'
      + '<div class="dc-sb-sep"></div>'
      + '<div class="dc-sb"><div class="dc-sb-n">'+giP+'gg</div><div class="dc-sb-l">passati</div></div>'
      + '<div class="dc-sb-sep"></div>'
      + '<div class="dc-sb"><div class="dc-sb-n">'+(dimPrec>0?dimPrec+'M':'—')+'</div><div class="dc-sb-l">pre-rp</div></div>'
      + '</div>';

    var btnsHtml = '<div class="dc-btns">'
      + '<div class="dc-btn" data-sya="popup-storico">📊 Statistiche</div>'
      + (repO||repD?'<div class="dc-btn" data-sya="repack-now">'+(busy?'<span class="dc-spin">⚙</span> Repack…':'🔄 Repack')+'</div>':'')
      + '<div class="dc-btn" data-sya="popup-impostazioni">⚙ Impostazioni</div>'
      + '</div>';

    return css
      + '<div id="'+rid+'">'
      + '<div class="dc-card">'
      + '<div class="dc-hdr">'
      + '<div class="dc-hdr-iw">🗄️</div>'
      + '<div class="dc-hdr-tit">'+(card.config&&card.config.name||'Database HA')+'</div>'
      + '<div class="dc-pill" style="background:'+pillBg+';border-color:'+pillBdr+';color:'+pillCol+'">'+pillTxt+'</div>'
      + '</div>'
      + '<div class="dc-scroll">'
      + busyBanner
      + heroHtml
      + statsHtml
      + btnsHtml
      + '</div>'
      + '</div>'
      + '</div>';
  }

  /* ──────────────────────────── POPUP HELPERS ─────────────────────── */
  function mkOv(html, closeId) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)';
    ov.innerHTML = html;
    document.body.appendChild(ov);
    var close = function () { try { document.body.removeChild(ov); } catch (e) {} };
    var btn = ov.querySelector('#'+closeId); if (btn) btn.addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov._close = close;
    return ov;
  }
  var POP_CSS = '<style>@keyframes dcUP{from{transform:translateY(100%)}to{transform:translateY(0)}}.dcpc{overflow-y:auto;scrollbar-width:none}.dcpc::-webkit-scrollbar{display:none}.dcpc *{text-transform:uppercase!important;font-weight:800!important}.dc-fi-sw{width:44px;height:26px;border-radius:13px;cursor:pointer;position:relative;flex-shrink:0;transition:background .25s}.dc-fi-sw.on{background:'+ACCH+'}.dc-fi-sw.off{background:rgba(255,255,255,.12)}.dc-fi-knob{position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .25s;box-shadow:0 1px 4px rgba(0,0,0,.4)}.dc-fi-sw.on .dc-fi-knob{left:21px}.dc-fi-sw.off .dc-fi-knob{left:3px}.dc-fi-inp{background:#0b1422;color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:8px;font-size:12px;font-family:monospace;box-sizing:border-box;outline:none}.dc-fi-inp:focus{border-color:rgba('+ACC+',.55)!important}</style>';
  function popShell(icon, title, closeId, content) {
    return POP_CSS+'<div style="width:100%;max-height:88vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(255,255,255,.12);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:dcUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      +'<div style="display:flex;align-items:center;gap:12px;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">'
      +'<div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#fff;flex-shrink:0">'+icon+'</div>'
      +'<div style="flex:1;font-size:16px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.3px">'+title+'</div>'
      +'<button id="'+closeId+'" style="width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);flex-shrink:0">✕</button>'
      +'</div>'
      +'<div class="dcpc" style="flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:0">'+content+'</div>'
      +'</div>';
  }
  function pRow(lbl, val, col) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
      +'<span style="font-size:12px;color:#fff">'+lbl+'</span>'
      +'<span style="font-size:13px;font-weight:800;color:'+(col||ACCH)+'">'+val+'</span>'
      +'</div>';
  }
  function pSec(lbl) {
    return '<div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:'+ACCH+';padding:12px 0 6px;border-bottom:1px solid rgba('+ACC+',.15)">'+lbl+'</div>';
  }

  /* ──────────────────────────── POPUP STORICO ─────────────────────── */
  function openStorico(card) {
    var h = H();
    var dimRaw = N(h,'sensor.frarik_db_dimensione',0);
    var dimD = dimRaw>=1000?(dimRaw/1000).toFixed(2):Math.round(dimRaw);
    var dimU = dimRaw>=1000?'GB':'MB';
    var media = N(h,'sensor.frarik_db_media_7_giorni',0);
    var dimPrec = N(h,'input_number.frarik_db_dimensione_precedente',0);
    var rid2 = 'dcs'+Math.round(Math.random()*1e6);
    var content = '<div style="background:rgba('+ACC+',.1);border-radius:12px;padding:12px 14px;text-align:center;margin-bottom:12px">'
      +'<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Dimensione Attuale</div>'
      +'<div style="font-size:28px;font-weight:900;color:'+ACCH+'">'+dimD+' '+dimU+'</div>'
      +'</div>'
      +pSec('📊 Andamento settimanale')
      +'<div style="background:rgba(0,0,0,.2);border-radius:10px;padding:6px 4px 2px;margin:6px 0 8px">'+chartSVG(h)+'</div>'
      +pSec('📈 Statistiche')
      +pRow('Dimensione attuale', dimD+' '+dimU)
      +pRow('Media 7 giorni', media>=1000?(media/1000).toFixed(1)+' GB':Math.round(media)+' MB')
      +pRow('Pre-repack', dimPrec>0?dimPrec+' MB':'—','#fff')
      +pRow('Riduzione ultima volta', dimPrec>0&&dimPrec>dimRaw?((dimPrec-dimRaw).toFixed(1)+' MB'):'—','#4ade80')
      +pSec('🗓 Repack')
      +pRow('Giorni passati', Math.round(N(h,'sensor.frarik_db_giorni_passati_repack',0))+'gg','#fff')
      +pRow('Giorni da mantenere', Math.round(N(h,'input_number.frarik_db_giorni_da_mantenere',30))+'gg','#fff')
      +pRow('Prossimo repack', Math.max(0,Math.round(N(h,'input_number.frarik_db_giorni_da_mantenere',30)-N(h,'sensor.frarik_db_giorni_passati_repack',0)))+'gg')
      +pRow('Ultimo repack', S(h,'input_text.frarik_db_ultimo_repack')||'—','#fff')
      +pSec('📦 Versione PKG')
      +pRow('Versione', S(h,'sensor.frarik_database_versione')||'—','#fff');
    mkOv(popShell('🗄️', 'Statistiche Database', rid2, content), rid2);
  }

  /* ──────────────────────────── POPUP IMPOSTAZIONI ────────────────── */
  function openImpostazioni(card, el) {
    var h = H();
    var orario = S(h,'input_datetime.frarik_db_orario_repack')||'';
    if (orario&&orario.length>=5) orario=orario.substring(0,5); else orario='';
    var giM = Math.round(N(h,'input_number.frarik_db_giorni_da_mantenere',30));
    var dimMax = Math.round(N(h,'input_number.frarik_db_dimensione_massima',1000));
    var dkKeys = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'];
    var dkLbl  = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
    var rid2 = 'dci'+Math.round(Math.random()*1e6);
    var iBase = 'background:#0b1422;color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:8px;font-size:12px;box-sizing:border-box;outline:none';

    function tog(eid, on, lbl) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
        +'<span style="font-size:13px;color:#fff">'+lbl+'</span>'
        +'<div class="dc-fi-sw '+(on?'on':'off')+'" data-entity="'+eid+'"><div class="dc-fi-knob"></div></div>'
        +'</div>';
    }

    var daysHtml = '<div style="display:flex;flex-wrap:wrap;gap:6px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
      +'<div style="font-size:11px;color:#fff;width:100%;margin-bottom:2px">Giorni attivi</div>';
    dkKeys.forEach(function(k,i){
      var on = isOn(h,'input_boolean.frarik_db_repack_'+k);
      daysHtml += '<div class="dc-fi-sw '+(on?'on':'off')+'" data-entity="input_boolean.frarik_db_repack_'+k+'" style="width:auto;height:28px;border-radius:8px;padding:0 10px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff"><div class="dc-fi-knob" style="display:none"></div>'+dkLbl[i]+'</div>';
    });
    daysHtml += '</div>';

    var cardId = (card && card.id) || '';
    var _ll = {}; try { _ll = JSON.parse(localStorage.getItem('_frk_layout_'+cardId)||'{}'); } catch(e) {}
    var tScale = _ll.cardScale!=null?_ll.cardScale:100, tW = _ll.cardW!=null?_ll.cardW:100;
    function layoutRow(lbl, id, val) {
      var vLbl = val>=100?'Auto (100%)':val+'%';
      return '<div style="display:flex;align-items:center;gap:8px;margin-top:10px">'
        +'<span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#fff;width:72px;flex-shrink:0">'+lbl+'</span>'
        +'<input type="range" id="'+id+'" min="20" max="100" step="5" value="'+val+'" style="flex:1;accent-color:'+ACCH+';cursor:pointer">'
        +'<span id="'+id+'-lbl" style="font-size:12px;font-weight:900;color:#fff;width:54px;text-align:right;flex-shrink:0">'+vLbl+'</span>'
        +'</div>';
    }
    var previewHtml = '<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#fff">Anteprima live</div>'
      + '<div id="dc-prev-'+rid2+'" style="border-radius:14px;overflow:hidden;background:rgba(255,255,255,.02);margin-top:8px;padding:10px;display:flex;justify-content:center;transform-origin:top left"></div>'
      + '<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#fff;margin-top:16px">Dimensione card</div>'
      + layoutRow('Altezza', 'dc-scale-'+rid2, tScale)
      + layoutRow('Larghezza', 'dc-w-'+rid2, tW);

    var boxOpen = '<div style="padding:14px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid #fff">';
    var boxClose = '</div>';

    var settingsHtml = pSec('⚡ Automazioni')
      + boxOpen
      + tog('input_boolean.frarik_db_repack_orario', isOn(h,'input_boolean.frarik_db_repack_orario'), 'Repack automatico a orario')
      + tog('input_boolean.frarik_db_repack_dimensione', isOn(h,'input_boolean.frarik_db_repack_dimensione'), 'Repack per dimensione massima')
      + tog('input_boolean.frarik_db_notifiche_push', isOn(h,'input_boolean.frarik_db_notifiche_push'), 'Notifiche push')
      + boxClose
      + pSec('🕐 Orario e giorni')
      + boxOpen
      + '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04);gap:10px">'
      + '<span style="font-size:13px;color:#fff">Orario repack</span>'
      + '<input type="time" id="dc-orario-'+rid2+'" style="'+iBase+';width:110px;padding:6px 8px;text-align:center;font-family:system-ui" value="'+orario+'">'
      + '</div>'
      + daysHtml
      + boxClose
      + pSec('📏 Soglie')
      + boxOpen
      + '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04);gap:10px">'
      + '<span style="font-size:13px;color:#fff">Giorni da mantenere</span>'
      + '<input type="number" id="dc-gm-'+rid2+'" style="'+iBase+';width:90px;padding:6px 8px;text-align:right;font-family:system-ui" value="'+giM+'" min="1" max="365" step="1">'
      + '</div>'
      + '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04);gap:10px">'
      + '<span style="font-size:13px;color:#fff">Dimensione massima (MB)</span>'
      + '<input type="number" id="dc-dm-'+rid2+'" style="'+iBase+';width:90px;padding:6px 8px;text-align:right;font-family:system-ui" value="'+dimMax+'" min="1" max="1000000" step="100">'
      + '</div>'
      + boxClose
      + pSec('⚙ Repack Manuale')
      + '<button id="dc-repack-'+rid2+'" style="width:100%;padding:12px;border-radius:11px;border:none;cursor:pointer;font-size:13px;font-weight:800;color:#fff;background:linear-gradient(135deg,#38bdf8,#0ea5e9);font-family:system-ui;margin-top:4px">🔄 Esegui Repack Ora</button>'
      + '<button id="dc-save-'+rid2+'" style="width:100%;margin-top:8px;padding:13px;border-radius:12px;background:#38bdf8;border:none;color:#fff;font-size:14px;font-weight:800;cursor:pointer;font-family:system-ui">💾 Salva impostazioni</button>';

    var content = '<div style="display:flex;gap:20px;align-items:flex-start">'
      + '<div style="flex:1;min-width:0">' + settingsHtml + '</div>'
      + '<div style="flex:1;min-width:0">' + previewHtml + '</div>'
      + '</div>';

    var ov = mkOv(popShell('⚙', 'Impostazioni', rid2+'x', content), rid2+'x');

    function _dcUpdatePreview() {
      var wrap = ov.querySelector('#dc-prev-'+rid2); if (!wrap) return;
      var baseRid = 'dbc'+(cardId||'x').replace(/[^a-z0-9]/gi,'');
      var previewRid = baseRid+'-prev';
      try { wrap.innerHTML = render(card).split(baseRid).join(previewRid); } catch(e) {}
      var elp = wrap.querySelector('#'+previewRid);
      if (elp) { elp.style.width = tW<100?tW+'%':''; elp.style.zoom = tScale<100?tScale+'%':''; }
    }
    var dcScaleInp = ov.querySelector('#dc-scale-'+rid2), dcWInp = ov.querySelector('#dc-w-'+rid2);
    if (dcScaleInp) dcScaleInp.addEventListener('input', function(){
      tScale = parseInt(dcScaleInp.value,10);
      var l = ov.querySelector('#dc-scale-'+rid2+'-lbl'); if (l) l.textContent = tScale>=100?'Auto (100%)':tScale+'%';
      _dcUpdatePreview();
    });
    if (dcWInp) dcWInp.addEventListener('input', function(){
      tW = parseInt(dcWInp.value,10);
      var l = ov.querySelector('#dc-w-'+rid2+'-lbl'); if (l) l.textContent = tW>=100?'Auto (100%)':tW+'%';
      _dcUpdatePreview();
    });
    _dcUpdatePreview();

    ov.querySelectorAll('.dc-fi-sw[data-entity]').forEach(function(sw){
      sw.addEventListener('click', function(){
        var isD = sw.style.display==='flex'&&sw.textContent.trim().length<=3;
        if (isD) {
          sw.classList.toggle('on'); sw.classList.toggle('off');
          sw.style.background = sw.classList.contains('on')?('rgba('+ACC+',.5)'):'rgba(255,255,255,.1)';
        } else {
          sw.classList.toggle('on'); sw.classList.toggle('off');
        }
      });
    });

    var rb = ov.querySelector('#dc-repack-'+rid2);
    if (rb) rb.addEventListener('click', function(){
      callSvc('script','turn_on',{entity_id:'script.frarik_db_repack'});
      rb.textContent='✅ Repack avviato!'; rb.style.background='rgba(34,197,94,.3)';
      setTimeout(function(){ try{ov._close();}catch(e){} },1500);
    });

    var sb = ov.querySelector('#dc-save-'+rid2);
    if (sb) sb.addEventListener('click', function(){
      ov.querySelectorAll('.dc-fi-sw[data-entity]').forEach(function(sw){
        var eid = sw.dataset.entity, svc = sw.classList.contains('on')?'turn_on':'turn_off';
        callSvc(eid.split('.')[0], svc, {entity_id:eid});
      });
      var ori = ov.querySelector('#dc-orario-'+rid2); if (ori&&ori.value) callSvc('input_datetime','set_datetime',{entity_id:'input_datetime.frarik_db_orario_repack',time:ori.value+':00'});
      var gmE = ov.querySelector('#dc-gm-'+rid2); if (gmE&&gmE.value) callSvc('input_number','set_value',{entity_id:'input_number.frarik_db_giorni_da_mantenere',value:parseFloat(gmE.value)});
      var dmE = ov.querySelector('#dc-dm-'+rid2); if (dmE&&dmE.value) callSvc('input_number','set_value',{entity_id:'input_number.frarik_db_dimensione_massima',value:parseFloat(dmE.value)});
      try {
        localStorage.setItem('_frk_layout_'+cardId, JSON.stringify({cardScale:tScale, cardW:tW}));
        document.dispatchEvent(new CustomEvent('frarik-card-layout', {bubbles:true, detail:{cardId:cardId, cardScale:tScale, cardW:tW}}));
        if (el) el._dcSig = '';
      } catch(e) {}
      sb.textContent='✅ Salvato!'; sb.style.background='rgba(34,197,94,.15)'; sb.style.borderColor='rgba(34,197,94,.4)'; sb.style.color='#4ade80';
      setTimeout(function(){ try{ov._close();}catch(e){} },1500);
    });
  }

  /* ──────────────────────────── MOUNT / UPDATE ────────────────────── */
  function mount(card, hass, el) {
    if (el._dcBound === CARD.version) return;
    el._dcBound = CARD.version;
    if (el._dcHandler) el.removeEventListener('click', el._dcHandler);
    el._dcHandler = function (e) {
      var sya = e.target.closest('[data-sya]'); if (!sya) return;
      var a = sya.dataset.sya;
      if (a === 'popup-storico')      { openStorico(card); return; }
      if (a === 'popup-impostazioni') { openImpostazioni(card, el); return; }
      if (a === 'repack-now')         { callSvc('script','turn_on',{entity_id:'script.frarik_db_repack'}); return; }
    };
    el.addEventListener('click', el._dcHandler);
  }

  function update(card, hass, el) {
    var h = H();
    var sig = [CARD.version, S(h,'sensor.frarik_db_dimensione'), S(h,'input_text.frarik_db_stato'), S(h,'input_text.frarik_db_ultimo_repack'), S(h,'sensor.frarik_db_giorni_passati_repack'), S(h,'sensor.frarik_db_media_7_giorni')].join('|');
    if (!el.querySelector('.dc-card') || el._dcSig !== sig) {
      el._dcSig = sig;
      el.innerHTML = render(card);
    }
    mount(card, hass, el);
  }

  var CARD = {
    id: 'database-card', name: 'Database HA', icon: '🗄️', version: '3.0',
    desc: 'Monitoraggio database HA: dimensione, repack automatico, statistiche.',
    colSpan: 2, rowSpan: 3,
    frarik_no_edit: true,
    render: render, mount: mount, update: update,
    frarik_pkg_check: 'sensor.frarik_database_versione',
    frarik_pkg_id: 'frarik_database',
    frarik_pkg_version: '1.0',
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: '+CARD.id+' v'+CARD.version); } catch (e) {}
})();
