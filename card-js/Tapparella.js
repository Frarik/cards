/* frarik-version: 3.2 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(card) { return 'frarik_tapparellacard_' + (card.id || 'x'); }
  function load(card) { try { return JSON.parse(localStorage.getItem(keyOf(card)) || '{}') || {}; } catch (e) { return {}; } }
  function save(card, o) { try { localStorage.setItem(keyOf(card), JSON.stringify(Object.assign(load(card), o))); } catch (e) {} }
  function entOf(card) { const c = load(card); return String(c.entity || card.entity || '').trim(); }
  function nameOf(card, h) {
    const c = load(card); if (c.name) return c.name;
    const id = entOf(card), s = h && h.states && h.states[id];
    return (s && s.attributes && s.attributes.friendly_name) || 'Copertura';
  }
  function learnedTravel(card) { const t = parseFloat(load(card).travel); return (t >= 1 && t <= 180) ? t : 22; }
  function learn(card, sec) { if (sec >= 1 && sec <= 180) save(card, { travel: Math.round(sec * 10) / 10 }); }
  function typeOf(card) { return load(card).coverType || 'tapparella'; }

  function getPos(h, id) {
    const s = h && h.states && h.states[id]; if (!s) return null;
    let p = s.attributes && s.attributes.current_position;
    if (p == null) { const st = s.state; p = st === 'open' ? 100 : st === 'closed' ? 0 : 50; }
    p = parseFloat(p); if (isNaN(p)) return null;
    return Math.max(0, Math.min(100, Math.round(p)));
  }
  function stateOf(h, id) { const s = h && h.states && h.states[id]; return s ? s.state : null; }
  function statusLabel(st, pos) {
    if (st === 'opening') return 'In apertura…';
    if (st === 'closing') return 'In chiusura…';
    if (pos == null) return '—';
    if (pos >= 99 || st === 'open') return 'Aperta';
    if (pos <= 1 || st === 'closed') return 'Chiusa';
    return 'Parziale';
  }
  function statusColor(st, pos) {
    if (st === 'opening' || st === 'closing') return '#fb923c';
    if (pos != null && (pos >= 99 || st === 'open')) return '#4ade80';
    if (pos != null && (pos <= 1 || st === 'closed')) return '#f87171';
    return '#38bdf8';
  }
  function listCovers(h) {
    const out = []; const st = (h && h.states) || {};
    for (const id in st) { if (id.indexOf('cover.') === 0) out.push({ id: id, name: (st[id].attributes && st[id].attributes.friendly_name) || id }); }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }

  const COVER_TYPES = [
    { id: 'tapparella',     icon: '🪟', label: 'Tapp. finestra',       desc: 'Tapparella finestra a stecche' },
    { id: 'tenda_interna',  icon: '🎪', label: 'Tenda interna',        desc: 'Tendaggio a due pannelli' },
    { id: 'tenda_sole',     icon: '☀️', label: 'Tenda da sole',        desc: 'Cappottina con bracci motorizzati' },
    { id: 'basculante',     icon: '🚗', label: 'Basculante',           desc: 'Porta basculante garage' },
    { id: 'tenda_rullo',    icon: '📜', label: 'Tenda a rullo',        desc: 'Roller blind, tessuto liscio' },
  ];
  function coverIcon(type) { const t = COVER_TYPES.find(x => x.id === type); return t ? t.icon : '🪟'; }
  function header(nm, type) {
    return `<div style="display:flex;align-items:center;gap:7px;flex-shrink:0">
      <span style="font-size:15px;line-height:1">${coverIcon(type)}</span>
      <span style="flex:1;min-width:0;font-size:13px;font-weight:800;color:#e8ebf5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nm}</span>
    </div>`;
  }


  // ─── TAPPARELLA ──────────────────────────────────────────────────────────
  function drawTapparella(pos) {
    const ty = -(pos == null ? 0 : pos);
    return `<div style="position:relative;flex:1;min-height:260px;border-radius:12px;
      background:linear-gradient(145deg,#525a66,#363c46 55%,#262b33);
      box-shadow:0 12px 28px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.14)">
      <div style="position:absolute;inset:7px;border-radius:6px;overflow:hidden;
        background:linear-gradient(to bottom,#13345a,#2c5f93 45%,#6fa6da);
        box-shadow:inset 0 0 20px rgba(0,0,0,.55),inset 0 0 0 1px rgba(0,0,0,.4)">
        <div style="position:absolute;inset:0;pointer-events:none;
          background:linear-gradient(118deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,.04) 26%,transparent 46%,rgba(255,255,255,.07) 100%)"></div>
        <div data-open style="position:absolute;left:0;right:0;top:13%;bottom:0;overflow:hidden;z-index:2">
          <div data-sh style="position:absolute;left:0;right:0;top:0;height:100%;
            transform:translateY(${ty}%);transition:transform .5s linear;
            background:repeating-linear-gradient(180deg,rgba(255,255,255,.45) 0px,#c8d0db 1px,#b0b8c5 5px,#8c94a2 8px,rgba(0,0,0,.42) 9px,#b0b8c5 10px);
            box-shadow:0 8px 14px rgba(0,0,0,.5)">
            <div style="position:absolute;bottom:0;left:0;right:0;height:10px;
              background:linear-gradient(to bottom,#aeb6c2,#7c8492 45%,#3f444d);box-shadow:0 -1px 0 rgba(0,0,0,.3),0 3px 7px rgba(0,0,0,.55)">
              <div style="position:absolute;left:30%;top:3.5px;width:16px;height:3px;border-radius:2px;background:rgba(0,0,0,.5)"></div>
              <div style="position:absolute;right:30%;top:3.5px;width:16px;height:3px;border-radius:2px;background:rgba(0,0,0,.5)"></div>
            </div>
          </div>
        </div>
        <div style="position:absolute;top:0;left:0;right:0;height:13%;z-index:3;border-radius:0 0 8px 8px;
          background:linear-gradient(to bottom,#8d95a2,#aeb6c2 22%,#6b7280 60%,#3c424c);
          box-shadow:0 6px 13px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.4)"></div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:6px;z-index:1;background:linear-gradient(to bottom,#5b626e,#363c46)"></div>
      </div>
    </div>`;
  }

  // ─── TENDA DA INTERNO (tendaggio grigio tortora, pieghe lisce, senza clip-path) ─
  function drawTendaInterna(pos) {
    const p = pos == null ? 0 : pos;
    const txL = -(p * 0.78);
    const txR =  (p * 0.78);
    // grigio tortora: toni caldi neutri
    const v0='#3c3830',v1='#6e6860',v2='#9a9288',v3='#bcb4aa',v4='#d4ccc4';
    const folds=`repeating-linear-gradient(90deg,${v0} 0px,${v1} 5px,${v2} 10px,${v3} 15px,${v4} 18px,${v3} 21px,${v2} 26px,${v1} 30px,${v0} 34px)`;
    const silk='linear-gradient(150deg,rgba(255,255,255,.11) 0%,transparent 38%,rgba(255,255,255,.06) 65%,transparent 100%)';
    const edgeDark='linear-gradient(to right,rgba(0,0,0,.42) 0px,transparent 16px,transparent calc(100% - 16px),rgba(0,0,0,.42) 100%)';
    return `<div style="position:relative;flex:1;min-height:260px;border-radius:8px;overflow:hidden;
      background:linear-gradient(to bottom,#13345a,#2c5f93 45%,#6fa6da);
      box-shadow:0 12px 28px rgba(0,0,0,.55)">
      <div style="position:absolute;inset:0;pointer-events:none;
        background:linear-gradient(118deg,rgba(255,255,255,.13) 0%,rgba(255,255,255,.03) 28%,transparent 52%,rgba(255,255,255,.05) 100%)"></div>
      <!-- CORNICIONE grigio scuro -->
      <div style="position:absolute;top:0;left:0;right:0;height:13%;z-index:9;
        background:linear-gradient(to bottom,#6a6460 0%,#908880 25%,#787068 55%,#585048 80%,#403830 100%);
        box-shadow:0 7px 18px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.16)">
        <div style="position:absolute;top:20%;left:0;right:0;height:2px;background:rgba(255,255,255,.13)"></div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:3px;
          background:linear-gradient(to right,#282420,#504840 20%,#807870 50%,#504840 80%,#282420)"></div>
      </div>
      <!-- BINARIO (cromo satinato) -->
      <div style="position:absolute;top:13%;left:1%;right:1%;height:3px;z-index:8;border-radius:1px;
        background:linear-gradient(to bottom,#d8d4d0,#a8a4a0 40%,#888480);
        box-shadow:0 2px 5px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.28)"></div>
      <!-- AREA TENDE -->
      <div data-open style="position:absolute;left:0;right:0;top:16%;bottom:0;overflow:hidden;z-index:4">
        <!-- PANNELLO SINISTRO -->
        <div data-sh style="position:absolute;left:0;top:0;width:57%;height:100%;
          transform:translateX(${txL.toFixed(1)}%);transition:transform .5s ease-in-out;
          background:${silk},${edgeDark},${folds};
          box-shadow:9px 0 26px rgba(0,0,0,.5)">
          <div style="position:absolute;top:0;left:3%;right:7%;height:5px;pointer-events:none;
            background:repeating-linear-gradient(90deg,rgba(160,155,150,.9) 0px,rgba(160,155,150,.9) 3px,transparent 3px,transparent 22px)"></div>
          <div style="position:absolute;top:0;left:0;right:0;height:7%;pointer-events:none;
            background:linear-gradient(to bottom,rgba(0,0,0,.26),transparent)"></div>
          <div style="position:absolute;bottom:0;left:0;right:7%;height:5px;
            background:linear-gradient(to bottom,${v1},${v0});border-radius:0 0 0 2px"></div>
        </div>
        <!-- PANNELLO DESTRO -->
        <div data-sh2 style="position:absolute;right:0;top:0;width:57%;height:100%;
          transform:translateX(${txR.toFixed(1)}%);transition:transform .5s ease-in-out;
          background:${silk},${edgeDark},${folds};
          box-shadow:-9px 0 26px rgba(0,0,0,.5)">
          <div style="position:absolute;top:0;left:7%;right:3%;height:5px;pointer-events:none;
            background:repeating-linear-gradient(90deg,rgba(160,155,150,.9) 0px,rgba(160,155,150,.9) 3px,transparent 3px,transparent 22px)"></div>
          <div style="position:absolute;top:0;left:0;right:0;height:7%;pointer-events:none;
            background:linear-gradient(to bottom,rgba(0,0,0,.26),transparent)"></div>
          <div style="position:absolute;bottom:0;left:7%;right:0;height:5px;
            background:linear-gradient(to bottom,${v1},${v0});border-radius:0 0 2px 0"></div>
        </div>
      </div>
    </div>`;
  }

  function ensureRippleAnim() {
    if (document.getElementById('ti-ripple')) return;
    const s = document.createElement('style'); s.id = 'ti-ripple';
    s.textContent = '@keyframes tiRipple{0%,100%{filter:brightness(1) contrast(1)}30%{filter:brightness(1.09) contrast(.93)}65%{filter:brightness(.94) contrast(1.04)}}';
    document.head.appendChild(s);
  }

  // ─── TENDA DA SOLE (bracci motorizzati articolati) ────────────────────────
  function drawTendaSole(pos) {
    const p = pos == null ? 0 : pos;
    const ty = p - 100; // fabric: reversed (pos=100→ty=0 estesa, pos=0→ty=-100 ritirata)
    const armAngleL = (-80 + p * 0.70).toFixed(1); // braccio sx: da -80° (chiuso) a -10° (aperto)
    const armAngleR = (80  - p * 0.70).toFixed(1); // braccio dx: da +80° a +10°
    return `<div style="position:relative;flex:1;min-height:260px;border-radius:8px;overflow:hidden;
      background:linear-gradient(to bottom,#87ceeb,#c8e8f8 60%,#e8f4f8);
      box-shadow:0 12px 28px rgba(0,0,0,.55)">
      <!-- sole -->
      <div style="position:absolute;top:10%;right:12%;width:26px;height:26px;border-radius:50%;
        background:radial-gradient(circle,#fffbe0,#ffe066);
        box-shadow:0 0 16px 6px rgba(255,224,0,.3)"></div>
      <!-- facciata edificio -->
      <div style="position:absolute;top:0;left:0;right:0;height:27%;
        background:linear-gradient(145deg,#e2c8a0,#d4b478 50%,#c09850);
        box-shadow:0 4px 12px rgba(0,0,0,.4)">
        <div style="position:absolute;inset:0;opacity:.28;
          background:repeating-linear-gradient(0deg,transparent 0,transparent 6px,rgba(0,0,0,.2) 6px,rgba(0,0,0,.2) 7px),
          repeating-linear-gradient(90deg,transparent 0,transparent 12px,rgba(0,0,0,.15) 12px,rgba(0,0,0,.15) 13px)"></div>
      </div>
      <!-- cassone (z-index 6: sopra bracci) -->
      <div style="position:absolute;left:5%;right:5%;top:27%;height:10px;z-index:6;
        background:linear-gradient(to bottom,#5a6270,#3c4250 60%,#2c3240);border-radius:0 0 5px 5px;
        box-shadow:0 4px 10px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.15)"></div>
      <!-- BRACCIO SINISTRO -->
      <div data-arm-l style="position:absolute;left:5%;top:37%;width:7px;height:52%;z-index:5;
        transform-origin:top center;transform:rotate(${armAngleL}deg);transition:transform .5s linear;
        border-radius:4px;overflow:visible">
        <div style="position:absolute;top:0;left:0;right:0;bottom:10px;border-radius:3px;
          background:linear-gradient(to right,#3c4250 0%,#6a7280 35%,#7e8a98 50%,#6a7280 65%,#3c4250 100%);
          box-shadow:1px 2px 5px rgba(0,0,0,.5)"></div>
        <!-- giunto a gomito -->
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          width:13px;height:13px;border-radius:50%;
          background:radial-gradient(circle at 35% 35%,#8a9aaa,#3c4250);
          box-shadow:0 2px 5px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.2)"></div>
        <!-- staffa finale -->
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
          width:15px;height:10px;border-radius:3px;
          background:linear-gradient(to bottom,#4a5260,#2c3240);box-shadow:0 2px 4px rgba(0,0,0,.5)"></div>
      </div>
      <!-- BRACCIO DESTRO -->
      <div data-arm-r style="position:absolute;right:5%;top:37%;width:7px;height:52%;z-index:5;
        transform-origin:top center;transform:rotate(${armAngleR}deg);transition:transform .5s linear;
        border-radius:4px;overflow:visible">
        <div style="position:absolute;top:0;left:0;right:0;bottom:10px;border-radius:3px;
          background:linear-gradient(to right,#3c4250 0%,#6a7280 35%,#7e8a98 50%,#6a7280 65%,#3c4250 100%);
          box-shadow:-1px 2px 5px rgba(0,0,0,.5)"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          width:13px;height:13px;border-radius:50%;
          background:radial-gradient(circle at 35% 35%,#8a9aaa,#3c4250);
          box-shadow:0 2px 5px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.2)"></div>
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
          width:15px;height:10px;border-radius:3px;
          background:linear-gradient(to bottom,#4a5260,#2c3240);box-shadow:0 2px 4px rgba(0,0,0,.5)"></div>
      </div>
      <!-- telo (z-index 4: sotto bracci) -->
      <div data-open style="position:absolute;left:5%;right:5%;top:37%;bottom:0;overflow:hidden;z-index:4">
        <div data-sh style="position:absolute;left:0;right:0;top:0;height:100%;
          transform:translateY(${ty.toFixed(1)}%);transition:transform .5s linear">
          <div style="position:absolute;left:0;right:0;top:0;bottom:16px;
            background:repeating-linear-gradient(180deg,#e8472a 0px,#e8472a 12px,#f5f5f5 12px,#f5f5f5 24px);
            box-shadow:2px 8px 18px rgba(0,0,0,.4)">
            <div style="position:absolute;top:0;left:0;width:7px;bottom:0;background:linear-gradient(to right,#3c4250,#5a6270)"></div>
            <div style="position:absolute;top:0;right:0;width:7px;bottom:0;background:linear-gradient(to left,#3c4250,#5a6270)"></div>
          </div>
          <!-- balza ondulata -->
          <div style="position:absolute;bottom:0;left:0;right:0;height:16px;
            background:linear-gradient(to bottom,#e8472a,#c83010 60%,#a02008);
            clip-path:polygon(0 0,100% 0,97% 100%,90% 45%,83% 100%,76% 45%,69% 100%,62% 45%,55% 100%,48% 45%,41% 100%,34% 45%,27% 100%,20% 45%,13% 100%,6% 45%,3% 100%,0 100%);
            box-shadow:0 3px 8px rgba(0,0,0,.3)"></div>
        </div>
      </div>
    </div>`;
  }

  // ─── BASCULANTE (apre verso l'ESTERNO: rotateX positivo, pivot in alto) ───
  function drawBasculante(pos) {
    const p = pos == null ? 0 : pos;
    const deg = (p * 0.82).toFixed(1); // positivo = fondo porta viene verso viewer (esterno)
    return `<div style="position:relative;flex:1;min-height:260px;border-radius:8px;overflow:hidden;
      background:linear-gradient(to bottom,#1a1a2e,#16213e 50%,#0f3460);
      box-shadow:0 12px 28px rgba(0,0,0,.55)">
      <div style="position:absolute;bottom:0;left:0;right:0;height:18%;
        background:linear-gradient(to bottom,#5a5a5a,#3a3a3a);
        box-shadow:inset 0 4px 8px rgba(0,0,0,.4)">
        <div style="position:absolute;top:32%;left:8%;right:8%;height:2px;background:rgba(255,255,255,.18);border-radius:1px"></div>
      </div>
      <!-- muro -->
      <div style="position:absolute;top:0;left:0;right:0;bottom:18%;
        background:linear-gradient(to bottom,#6b7280,#4b5563)">
        <div style="position:absolute;left:7%;right:7%;top:5%;bottom:0;
          background:linear-gradient(to bottom,#080c18,#0d1525);
          border-radius:4px 4px 0 0;box-shadow:inset 0 4px 20px rgba(0,0,0,.8)"></div>
      </div>
      <!-- binari -->
      <div style="position:absolute;left:5%;top:5%;bottom:18%;width:4px;
        background:linear-gradient(to right,#374151,#4b5563)"></div>
      <div style="position:absolute;right:5%;top:5%;bottom:18%;width:4px;
        background:linear-gradient(to left,#374151,#4b5563)"></div>
      <!-- porta 3D — perspective-origin in basso per effetto apertura verso esterno -->
      <div style="position:absolute;left:7%;right:7%;top:5%;bottom:18%;
        perspective:500px;perspective-origin:50% 100%">
        <div data-sh style="position:absolute;left:0;right:0;top:0;height:100%;
          transform-origin:top center;transform:rotateX(${deg}deg);
          transition:transform .6s ease-in-out;
          background:linear-gradient(to bottom,#d1d5db,#e5e7eb 30%,#d1d5db);
          border-radius:3px 3px 0 0;
          box-shadow:0 8px 20px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.4)">
          <div style="position:absolute;top:20%;left:2%;right:2%;height:2px;background:rgba(0,0,0,.2);border-radius:1px"></div>
          <div style="position:absolute;top:40%;left:2%;right:2%;height:2px;background:rgba(0,0,0,.2);border-radius:1px"></div>
          <div style="position:absolute;top:60%;left:2%;right:2%;height:2px;background:rgba(0,0,0,.2);border-radius:1px"></div>
          <div style="position:absolute;top:80%;left:2%;right:2%;height:2px;background:rgba(0,0,0,.2);border-radius:1px"></div>
          <div style="position:absolute;top:0;bottom:0;left:50%;width:2px;background:rgba(0,0,0,.15);transform:translateX(-50%)"></div>
          <div style="position:absolute;bottom:8%;left:50%;transform:translateX(-50%);
            width:32px;height:8px;border-radius:4px;
            background:linear-gradient(to bottom,#9ca3af,#6b7280);box-shadow:0 2px 5px rgba(0,0,0,.5)"></div>
          <div style="position:absolute;inset:3px;border-radius:2px;
            box-shadow:inset 0 0 0 2px rgba(255,255,255,.18),inset 0 0 0 4px rgba(0,0,0,.08)"></div>
        </div>
      </div>
    </div>`;
  }

  // ─── TENDA A RULLO ────────────────────────────────────────────────────────
  function drawTendaRullo(pos) {
    const p = pos == null ? 0 : pos;
    const ty = -p;
    const rollerH = (8 + p * 0.05).toFixed(1);
    return `<div style="position:relative;flex:1;min-height:260px;border-radius:12px;
      background:linear-gradient(145deg,#2d3142,#1e2131 55%,#141825);
      box-shadow:0 12px 28px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.12)">
      <div style="position:absolute;inset:7px;border-radius:6px;overflow:hidden;
        background:linear-gradient(to bottom,#13345a,#2c5f93 45%,#6fa6da);
        box-shadow:inset 0 0 20px rgba(0,0,0,.55),inset 0 0 0 1px rgba(0,0,0,.4)">
        <div style="position:absolute;inset:0;pointer-events:none;
          background:linear-gradient(118deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,.04) 26%,transparent 46%,rgba(255,255,255,.07) 100%)"></div>
        <div data-open style="position:absolute;left:0;right:0;top:${rollerH}%;bottom:0;overflow:hidden;z-index:2">
          <div data-sh style="position:absolute;left:0;right:0;top:0;height:100%;
            transform:translateY(${ty}%);transition:transform .5s linear;
            background:linear-gradient(to bottom,#2a2a3a,#1e1e2e);
            box-shadow:0 4px 12px rgba(0,0,0,.5)">
            <div style="position:absolute;inset:0;background:repeating-linear-gradient(180deg,
              transparent 0px,transparent 7px,rgba(255,255,255,.04) 7px,rgba(255,255,255,.04) 8px)"></div>
            <div style="position:absolute;bottom:0;left:0;right:0;height:13px;
              background:linear-gradient(to bottom,#4a4a5a,#2a2a3a 40%,#1a1a28);
              box-shadow:0 -1px 0 rgba(255,255,255,.1),0 4px 10px rgba(0,0,0,.6)">
              <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:26px;height:4px;border-radius:2px;background:rgba(255,255,255,.15)"></div>
            </div>
          </div>
        </div>
        <div style="position:absolute;top:0;left:0;right:0;height:${rollerH}%;z-index:3;border-radius:0 0 10px 10px;
          background:linear-gradient(to bottom,#4a4a5a,rgba(255,255,255,.18) 18%,#3a3a4a 45%,#2a2a38 80%,#1a1a28);
          box-shadow:0 4px 12px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.25)"></div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:5px;z-index:1;background:linear-gradient(to bottom,#3a4050,#252a35)"></div>
      </div>
    </div>`;
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  function render(card) {
    const h = H(), id = entOf(card), acc = card.color || '#38bdf8', nm = nameOf(card, h), type = typeOf(card);
    if (!id || id.split('.')[0] !== 'cover') {
      return `<div style="height:100%;display:flex;flex-direction:column;min-height:0;gap:8px">${header(nm, type)}
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:rgba(255,255,255,.55);text-align:center;padding:10px">
          <div style="font-size:34px">${coverIcon(type)}</div>
          <div style="font-size:11px">Tocca <b style="color:${acc}">✏️ → ⚙️ Configura</b> per scegliere l'entità <b style="color:${acc}">cover</b></div>
        </div></div>`;
    }
    const pos = getPos(h, id), st = stateOf(h, id);
    const draws = { tapparella: drawTapparella, tenda_interna: drawTendaInterna, tenda_sole: drawTendaSole, basculante: drawBasculante, tenda_rullo: drawTendaRullo };
    const draw = (draws[type] || drawTapparella)(pos);
    const btn = (act, ico, lbl, col) =>
      `<button data-cov="${act}" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;
        padding:8px 4px;border-radius:11px;cursor:pointer;border:1px solid ${col}44;background:${col}1a;
        color:${col};font-weight:800;font-size:11px;transition:all .15s"
        onmouseover="this.style.background='${col}2e'" onmouseout="this.style.background='${col}1a'">
        <span style="font-size:15px;line-height:1">${ico}</span>${lbl}</button>`;
    return `<div style="height:100%;display:flex;flex-direction:column;min-height:0;gap:8px">${header(nm, type)}
      ${draw}
      <div style="display:flex;align-items:baseline;justify-content:space-between;padding:0 2px">
        <span data-pct style="font-size:24px;font-weight:800;color:${acc}">${pos == null ? '—' : pos + '%'}</span>
        <span data-st style="font-size:12px;font-weight:800;letter-spacing:.3px;color:${statusColor(st, pos)}">${statusLabel(st, pos)}</span>
      </div>
      <div style="display:flex;gap:6px">
        ${btn('open', '▲', 'Apri', '#4ade80')}
        ${btn('stop', '■', 'Ferma', '#fb923c')}
        ${btn('close', '▼', 'Chiudi', '#f87171')}
      </div>
    </div>`;
  }

  // ─── APPLY STATE (real-time per tutti i tipi) ─────────────────────────────
  function applyState(card, el) {
    const h = H(), id = entOf(card);
    const sh = el.querySelector('[data-sh]'); if (!sh) return;
    const type = typeOf(card);
    const s = h && h.states && h.states[id];
    const st = s ? s.state : null, pos = getPos(h, id);
    const prev = el._tapPrev; el._tapPrev = st;
    const pe = el.querySelector('[data-pct]'), se = el.querySelector('[data-st]');

    // ── Basculante: rotateX positivo (apertura verso esterno) ──
    if (type === 'basculante') {
      const deg = ((pos == null ? 0 : pos) * 0.82).toFixed(1);
      sh.style.transition = 'transform .6s ease-in-out';
      sh.style.transform = `rotateX(${deg}deg)`;
      if (pe) pe.textContent = pos == null ? '—' : pos + '%';
      if (se) { se.textContent = statusLabel(st, pos); se.style.color = statusColor(st, pos); }
      return;
    }

    // ── Tenda interna: translateX su due pannelli + ripple durante movimento ──
    if (type === 'tenda_interna') {
      ensureRippleAnim();
      const sh2 = el.querySelector('[data-sh2]');
      const isMoving = st === 'opening' || st === 'closing';
      const anim1 = isMoving ? 'tiRipple .65s ease-in-out infinite' : '';
      const anim2 = isMoving ? 'tiRipple .65s ease-in-out .11s infinite' : '';
      const setX = (p, dur) => {
        sh.style.transition = `transform ${dur} ease-in-out`;  sh.style.transform  = `translateX(${-p}%)`; sh.style.animation = anim1;
        if (sh2) { sh2.style.transition = `transform ${dur} ease-in-out`; sh2.style.transform = `translateX(${p}%)`; sh2.style.animation = anim2; }
      };
      if (isMoving) {
        if (prev !== st) {
          const start = pos == null ? (st === 'opening' ? 0 : 100) : pos;
          el._tapStart = { pos: start, ts: Date.now() }; el._tapLive = start;
          const target = st === 'opening' ? 100 : 0;
          const frac = Math.abs(target - start) / 100;
          const interp = start + (target - start) * 0.92;
          setX(interp, Math.max(0.4, learnedTravel(card) * frac).toFixed(1) + 's');
        } else if (pos != null && pos !== el._tapLive) { el._tapLive = pos; setX(pos, '.7s'); }
        if (pe) pe.textContent = (el._tapLive != null ? el._tapLive : pos != null ? pos : 0) + '%';
      } else {
        if ((prev === 'opening' || prev === 'closing') && el._tapStart && pos != null) {
          const dp = Math.abs(pos - el._tapStart.pos), dt = (Date.now() - el._tapStart.ts) / 1000;
          if (dp >= 8 && dt >= 0.6) learn(card, dt / (dp / 100));
          el._tapStart = null;
        }
        setX(pos == null ? 0 : pos, '.5s');
        if (pe) pe.textContent = pos == null ? '—' : pos + '%';
      }
      if (se) { se.textContent = statusLabel(st, pos); se.style.color = statusColor(st, pos); }
      return;
    }

    // ── Tenda da sole: translateY invertita + rotazione bracci ──
    const rev = type === 'tenda_sole';
    const calcY = p => rev ? (p - 100) : -p;
    const openTarget = rev ? 0 : -100, closeTarget = rev ? -100 : 0;

    function applyArms(p) {
      if (!rev) return;
      const aL = el.querySelector('[data-arm-l]'), aR = el.querySelector('[data-arm-r]');
      const dur = '.5s linear';
      if (aL) { aL.style.transition = `transform ${dur}`; aL.style.transform = `rotate(${(-80 + p * 0.70).toFixed(1)}deg)`; }
      if (aR) { aR.style.transition = `transform ${dur}`; aR.style.transform = `rotate(${(80  - p * 0.70).toFixed(1)}deg)`; }
    }

    const setY = (y, dur) => { sh.style.transition = `transform ${dur} linear`; sh.style.transform = `translateY(${y}%)`; };

    if (st === 'opening' || st === 'closing') {
      if (prev !== st) {
        const start = pos == null ? (st === 'opening' ? 0 : 100) : pos;
        el._tapStart = { pos: start, ts: Date.now() }; el._tapLive = start;
        const startY = calcY(start), targetY = st === 'opening' ? openTarget : closeTarget;
        const frac = Math.abs(targetY - startY) / 100;
        setY((startY + (targetY - startY) * 0.92).toFixed(1), Math.max(0.4, learnedTravel(card) * frac).toFixed(1) + 's');
      } else if (pos != null && pos !== el._tapLive) { el._tapLive = pos; setY(calcY(pos), '.7s'); }
      applyArms(el._tapLive != null ? el._tapLive : pos != null ? pos : (st === 'opening' ? 100 : 0));
      if (pe) {
        const op = el.querySelector('[data-open]');
        if (op) {
          const oR = op.getBoundingClientRect(), sR = sh.getBoundingClientRect();
          const raw = Math.round(-(sR.top - oR.top) / (oR.height || 1) * 100);
          pe.textContent = Math.max(0, Math.min(100, rev ? 100 - raw : raw)) + '%';
        }
      }
    } else {
      if ((prev === 'opening' || prev === 'closing') && el._tapStart && pos != null) {
        const dp = Math.abs(pos - el._tapStart.pos), dt = (Date.now() - el._tapStart.ts) / 1000;
        if (dp >= 8 && dt >= 0.6) learn(card, dt / (dp / 100));
        el._tapStart = null;
      }
      const p = pos == null ? 0 : pos;
      setY(calcY(p), '.5s');
      applyArms(p);
      if (pe) pe.textContent = pos == null ? '—' : pos + '%';
    }
    if (se) { se.textContent = statusLabel(st, pos); se.style.color = statusColor(st, pos); }
  }

  function update(card, hass, el) {
    try {
      const type = typeOf(card);
      if (!el.querySelector('[data-sh]') || el._tapType !== type) {
        el._tapType = type; el.innerHTML = render(card); return;
      }
      applyState(card, el);
    } catch (e) {}
  }

  function mount(card, hass, el) {
    if (!el._tapWired) {
      el._tapWired = true;
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-cov]'); if (!b) return;
        const id = entOf(card); if (!id) { openCfg(card, el); return; }
        const act = b.getAttribute('data-cov');
        const svc = act === 'open' ? 'open_cover' : act === 'close' ? 'close_cover' : 'stop_cover';
        try { window.callSvc('cover', svc, id); } catch (e2) {}
      });
    }
    if (el._tapTick) clearInterval(el._tapTick);
    el._tapTick = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._tapTick); el._tapTick = null; return; }
      try { update(card, null, el); } catch (e) {}
    }, 450);
  }

  // ─── CONFIG POPUP ─────────────────────────────────────────────────────────
  function openCfg(card, el) {
    const h = H(), cur = entOf(card), curType = typeOf(card), covers = listCovers(h);
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,16,.74);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';
    const opts = ['<option value="">— Seleziona —</option>']
      .concat(covers.map(c => `<option value="${c.id}"${c.id === cur ? ' selected' : ''}>${c.name}</option>`)).join('');
    const inp = 'width:100%;padding:11px;border-radius:11px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.2);font-size:13px;box-sizing:border-box';
    const typeBtns = COVER_TYPES.map(t =>
      `<button data-type-btn="${t.id}" style="padding:10px 4px;border-radius:10px;cursor:pointer;
        border:2px solid ${t.id === curType ? '#38bdf8' : 'rgba(255,255,255,.12)'};
        background:${t.id === curType ? 'rgba(56,189,248,.15)' : 'rgba(255,255,255,.05)'};
        color:#f1f5f9;font-size:10px;font-weight:700;text-align:center;
        display:flex;flex-direction:column;align-items:center;gap:3px;line-height:1.2">
        <span style="font-size:20px">${t.icon}</span>${t.label}
      </button>`
    ).join('');
    ov.innerHTML = `<div style="width:min(460px,95vw);background:#0b1220;border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.6);padding:20px;color:#f1f5f9;max-height:90vh;overflow-y:auto">
      <div style="font-size:16px;font-weight:800;margin-bottom:14px">⚙️ Configura copertura</div>
      <div style="font-size:11px;color:#94a3b8;margin-bottom:7px">Tipo di copertura</div>
      <div id="tap-types" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">${typeBtns}</div>
      <div style="font-size:11px;color:#94a3b8;margin-bottom:5px">Nome</div>
      <input id="tap-name" placeholder="es. Tapparella salotto" value="${(load(card).name || '').replace(/"/g, '&quot;')}" style="${inp};margin-bottom:12px">
      <div style="font-size:11px;color:#94a3b8;margin-bottom:5px">Entità cover (${covers.length} trovate)</div>
      <select id="tap-sel" style="${inp};margin-bottom:8px">${opts}</select>
      <input id="tap-man" placeholder="oppure: cover.tapparella_salotto" value="${cur}" style="${inp};font-size:12px;font-family:monospace">
      <div style="font-size:10px;color:#64748b;margin-top:10px">⚡ La velocità è automatica: la card impara il tempo di corsa dai movimenti reali.</div>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button id="tap-cancel" style="flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#e2e8f0">Annulla</button>
        <button id="tap-save" style="flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;background:#22c55e;color:#04210f">Salva</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
    const close = () => { try { document.body.removeChild(ov); } catch (e) {} };
    let selType = curType;
    ov.querySelector('#tap-types').addEventListener('click', e => {
      const b = e.target.closest('[data-type-btn]'); if (!b) return;
      selType = b.getAttribute('data-type-btn');
      ov.querySelectorAll('[data-type-btn]').forEach(btn => {
        const on = btn.getAttribute('data-type-btn') === selType;
        btn.style.border = '2px solid ' + (on ? '#38bdf8' : 'rgba(255,255,255,.12)');
        btn.style.background = on ? 'rgba(56,189,248,.15)' : 'rgba(255,255,255,.05)';
      });
    });
    ov.querySelector('#tap-sel').addEventListener('change', function () { if (this.value) ov.querySelector('#tap-man').value = this.value; });
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    ov.querySelector('#tap-cancel').addEventListener('click', close);
    ov.querySelector('#tap-save').addEventListener('click', () => {
      const man = ov.querySelector('#tap-man').value.trim();
      const entity = man || ov.querySelector('#tap-sel').value || '';
      const name = ov.querySelector('#tap-name').value.trim();
      save(card, { entity: entity, name: name, coverType: selType });
      close();
      try { el._tapType = selType; el.innerHTML = render(card); } catch (e) {}
    });
  }

  const CARD = {
    id: 'tapparella', name: 'Tapparella', icon: '🪟', version: '3.3',
    desc: 'Tapparella finestra, tenda interna (grigio tortora), tenda da sole, basculante, tenda a rullo — animazioni real-time.',
    colSpan: 2, rowSpan: 3,
    render, update, mount, configure: openCfg
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: tapparella v' + CARD.version); } catch (e) {}

  // ─── TAPPARELLA PORTA FINESTRA (card separata, doppia altezza) ────────────
  function renderPorta(card) {
    const h = H(), id = entOf(card), acc = card.color || '#38bdf8', nm = nameOf(card, h);
    if (!id || id.split('.')[0] !== 'cover') {
      return `<div style="height:100%;display:flex;flex-direction:column;min-height:0;gap:8px">
        ${header(nm, 'porta_finestra')}
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:rgba(255,255,255,.55);text-align:center;padding:10px">
          <div style="font-size:34px">🚪</div>
          <div style="font-size:11px">Tocca <b style="color:${acc}">✏️ → ⚙️ Configura</b> per scegliere l'entità <b style="color:${acc}">cover</b></div>
        </div></div>`;
    }
    const pos = getPos(h, id), st = stateOf(h, id);
    const ty = -(pos == null ? 0 : pos);
    const draw = `<div style="position:relative;flex:1;min-height:520px;border-radius:12px;
      background:linear-gradient(145deg,#525a66,#363c46 55%,#262b33);
      box-shadow:0 12px 28px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.14)">
      <div style="position:absolute;inset:7px;border-radius:6px;overflow:hidden;
        background:linear-gradient(to bottom,#13345a,#2c5f93 45%,#6fa6da);
        box-shadow:inset 0 0 20px rgba(0,0,0,.55),inset 0 0 0 1px rgba(0,0,0,.4)">
        <div style="position:absolute;inset:0;pointer-events:none;
          background:linear-gradient(118deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,.04) 26%,transparent 46%,rgba(255,255,255,.07) 100%)"></div>
        <div data-open style="position:absolute;left:0;right:0;top:7%;bottom:0;overflow:hidden;z-index:2">
          <div data-sh style="position:absolute;left:0;right:0;top:0;height:100%;
            transform:translateY(${ty}%);transition:transform .5s linear;
            background:repeating-linear-gradient(180deg,rgba(255,255,255,.45) 0px,#c8d0db 1px,#b0b8c5 5px,#8c94a2 8px,rgba(0,0,0,.42) 9px,#b0b8c5 10px);
            box-shadow:0 8px 14px rgba(0,0,0,.5)">
            <div style="position:absolute;bottom:0;left:0;right:0;height:10px;
              background:linear-gradient(to bottom,#aeb6c2,#7c8492 45%,#3f444d);box-shadow:0 -1px 0 rgba(0,0,0,.3),0 3px 7px rgba(0,0,0,.55)">
              <div style="position:absolute;left:30%;top:3.5px;width:16px;height:3px;border-radius:2px;background:rgba(0,0,0,.5)"></div>
              <div style="position:absolute;right:30%;top:3.5px;width:16px;height:3px;border-radius:2px;background:rgba(0,0,0,.5)"></div>
            </div>
          </div>
        </div>
        <div style="position:absolute;top:0;left:0;right:0;height:7%;z-index:3;border-radius:0 0 8px 8px;
          background:linear-gradient(to bottom,#8d95a2,#aeb6c2 22%,#6b7280 60%,#3c424c);
          box-shadow:0 6px 13px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.4)"></div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:6px;z-index:1;background:linear-gradient(to bottom,#5b626e,#363c46)"></div>
      </div>
    </div>`;
    const col = acc, btn = (act, ico, lbl, c) =>
      `<button data-cov="${act}" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;
        padding:8px 4px;border-radius:11px;cursor:pointer;border:1px solid ${c}44;background:${c}1a;
        color:${c};font-weight:800;font-size:11px;transition:all .15s"
        onmouseover="this.style.background='${c}2e'" onmouseout="this.style.background='${c}1a'">
        <span style="font-size:15px;line-height:1">${ico}</span>${lbl}</button>`;
    return `<div style="height:100%;display:flex;flex-direction:column;min-height:0;gap:8px">
      ${header(nm, 'porta_finestra')}${draw}
      <div style="display:flex;align-items:baseline;justify-content:space-between;padding:0 2px">
        <span data-pct style="font-size:24px;font-weight:800;color:${col}">${pos == null ? '—' : pos + '%'}</span>
        <span data-st style="font-size:12px;font-weight:800;letter-spacing:.3px;color:${statusColor(st, pos)}">${statusLabel(st, pos)}</span>
      </div>
      <div style="display:flex;gap:6px">
        ${btn('open', '▲', 'Apri', '#4ade80')}${btn('stop', '■', 'Ferma', '#fb923c')}${btn('close', '▼', 'Chiudi', '#f87171')}
      </div></div>`;
  }
  function updatePorta(card, hass, el) {
    try {
      if (!el.querySelector('[data-sh]')) { el.innerHTML = renderPorta(card); return; }
      const h = H(), id = entOf(card), s = h && h.states && h.states[id];
      const st = s ? s.state : null, pos = getPos(h, id);
      const prev = el._tapPrev; el._tapPrev = st;
      const sh = el.querySelector('[data-sh]'), pe = el.querySelector('[data-pct]'), se = el.querySelector('[data-st]');
      if (!sh) return;
      const ty = -(pos == null ? 0 : pos);
      if (st === 'opening' || st === 'closing') {
        if (prev !== st) {
          el._tapStart = { pos: pos == null ? (st === 'opening' ? 0 : 100) : pos, ts: Date.now() };
          el._tapLive = el._tapStart.pos;
          const target = st === 'opening' ? -100 : 0, start = -el._tapStart.pos;
          const frac = Math.abs(target - start) / 100;
          sh.style.transition = `transform ${Math.max(0.4, learnedTravel(card) * frac).toFixed(1)}s linear`;
          sh.style.transform = `translateY(${(start + (target - start) * 0.92).toFixed(1)}%)`;
        } else if (pos != null && pos !== el._tapLive) { el._tapLive = pos; sh.style.transition = 'transform .7s linear'; sh.style.transform = `translateY(${-pos}%)`; }
        const op = el.querySelector('[data-open]');
        if (pe && op) {
          const oR = op.getBoundingClientRect(), sR = sh.getBoundingClientRect();
          const raw = Math.round(-(sR.top - oR.top) / (oR.height || 1) * 100);
          pe.textContent = Math.max(0, Math.min(100, raw)) + '%';
        }
      } else {
        if ((prev === 'opening' || prev === 'closing') && el._tapStart && pos != null) {
          const dp = Math.abs(pos - el._tapStart.pos), dt = (Date.now() - el._tapStart.ts) / 1000;
          if (dp >= 8 && dt >= 0.6) learn(card, dt / (dp / 100));
          el._tapStart = null;
        }
        sh.style.transition = 'transform .5s linear'; sh.style.transform = `translateY(${ty}%)`;
        if (pe) pe.textContent = pos == null ? '—' : pos + '%';
      }
      if (se) { se.textContent = statusLabel(st, pos); se.style.color = statusColor(st, pos); }
    } catch (e) {}
  }
  function mountPorta(card, hass, el) {
    if (!el._pWired) {
      el._pWired = true;
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-cov]'); if (!b) return;
        const id = entOf(card); if (!id) { openCfgPorta(card, el); return; }
        const act = b.getAttribute('data-cov');
        const svc = act === 'open' ? 'open_cover' : act === 'close' ? 'close_cover' : 'stop_cover';
        try { window.callSvc('cover', svc, id); } catch (e2) {}
      });
    }
    if (el._pTick) clearInterval(el._pTick);
    el._pTick = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._pTick); el._pTick = null; return; }
      try { updatePorta(card, null, el); } catch (e) {}
    }, 450);
  }
  function openCfgPorta(card, el) {
    const h = H(), cur = entOf(card), covers = listCovers(h);
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,16,.74);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';
    const opts = ['<option value="">— Seleziona —</option>']
      .concat(covers.map(c => `<option value="${c.id}"${c.id === cur ? ' selected' : ''}>${c.name}</option>`)).join('');
    const inp = 'width:100%;padding:11px;border-radius:11px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.2);font-size:13px;box-sizing:border-box';
    ov.innerHTML = `<div style="width:min(420px,95vw);background:#0b1220;border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.6);padding:20px;color:#f1f5f9">
      <div style="font-size:16px;font-weight:800;margin-bottom:14px">🚪 Tapparella porta finestra</div>
      <div style="font-size:11px;color:#94a3b8;margin-bottom:5px">Nome</div>
      <input id="pp-name" placeholder="es. Tapparella portafinestra" value="${(load(card).name || '').replace(/"/g, '&quot;')}" style="${inp};margin-bottom:12px">
      <div style="font-size:11px;color:#94a3b8;margin-bottom:5px">Entità cover (${covers.length} trovate)</div>
      <select id="pp-sel" style="${inp};margin-bottom:8px">${opts}</select>
      <input id="pp-man" placeholder="oppure: cover.porta_finestra_salotto" value="${cur}" style="${inp};font-size:12px;font-family:monospace">
      <div style="display:flex;gap:10px;margin-top:16px">
        <button id="pp-cancel" style="flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#e2e8f0">Annulla</button>
        <button id="pp-save" style="flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;background:#22c55e;color:#04210f">Salva</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
    const close = () => { try { document.body.removeChild(ov); } catch (e) {} };
    ov.querySelector('#pp-sel').addEventListener('change', function () { if (this.value) ov.querySelector('#pp-man').value = this.value; });
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    ov.querySelector('#pp-cancel').addEventListener('click', close);
    ov.querySelector('#pp-save').addEventListener('click', () => {
      const man = ov.querySelector('#pp-man').value.trim();
      const entity = man || ov.querySelector('#pp-sel').value || '';
      const name = ov.querySelector('#pp-name').value.trim();
      save(card, { entity, name });
      close();
      try { el.innerHTML = renderPorta(card); } catch (e) {}
    });
  }

  const CARD_PORTA = {
    id: 'tapparella_porta', name: 'Tapparella porta finestra', icon: '🚪', version: '3.3',
    desc: 'Tapparella porta-finestra (doppia altezza) — identica alla tapparella finestra ma in una card alta il doppio.',
    colSpan: 2, rowSpan: 6,
    render: renderPorta, update: updatePorta, mount: mountPorta, configure: openCfgPorta
  };
  window.FratechCardRegistry[CARD_PORTA.id] = CARD_PORTA;
  window.FratechCards[CARD_PORTA.id] = CARD_PORTA;
  try { console.log('[FratechStore] Card registrata: tapparella_porta v' + CARD_PORTA.version); } catch (e) {}
})();
