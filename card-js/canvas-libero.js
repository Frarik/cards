/* frarik-version: 1.2 */
/* v1.2: popup Impostazioni ora a due colonne pari (controlli a sinistra,
   canvas/anteprima live a destra) come nelle altre card, invece di tutto
   impilato in un'unica colonna. Il canvas a destra resta interattivo: si
   trascina/ridimensiona direttamente lì, non è solo uno specchietto. */
/* v1.1: aggiunto un quarto tipo di elemento, "Azione" (🔘): un bottone che al
   tap chiama un servizio su un'entità qualsiasi (script/scena → "Attiva",
   switch/luce/input_boolean → "Toggle"), per card tipo "premo e parte lo
   script quando esco di casa". Prima versione aveva solo elementi passivi
   (Testo/Icona/Forma), nessuno cliccabile. */
/* v1.0: prima versione — card "Canvas Libero": dimensione del canvas (larghezza/
   altezza) scelta dall'utente, elementi Testo/Icona/Forma posizionabili
   liberamente trascinandoli (mouse e touch) e ridimensionabili dall'angolo;
   ogni Testo/Icona può leggere qualsiasi sensore Home Assistant (stato o
   attributo); sfondo del canvas e colore di ogni elemento configurabili.
   Deroga intenzionale allo standard "Aspetto" (slider di scala %): qui la
   dimensione la sceglie l'utente in px in modo diretto, un secondo
   meccanismo di scala sarebbe ridondante. Deroga intenzionale anche al
   maiuscolo+grassetto universale: il testo dentro il canvas è contenuto
   creato dall'utente (colore/peso/casing scelti da lui elemento per
   elemento), quindi ne resta escluso — si applica solo alla cornice del
   popup (barra strumenti, lista elementi, pannello proprietà). */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(c) { return 'frarik_canvaslibero_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch (e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch (e) {} }
  function S(h, id) { const s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function Attr(h, id, attr) { const s = h && id && h.states && h.states[id]; return (s && s.attributes && s.attributes[attr] != null) ? s.attributes[attr] : null; }
  function callSvc(domain, service, data) { try { const h = H(); if (h && h.callService) h.callService(domain, service, data || {}); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function cfgFor(card) {
    const c = load(card);
    return {
      name: c.name || '',
      canvasW: c.canvasW || 320,
      canvasH: c.canvasH || 220,
      bgColor: c.bgColor || '#0b1220',
      elementi: c.elementi || [],
    };
  }

  /* ── RENDER DI UN SINGOLO ELEMENTO (condiviso tra card montata ed editor) ── */
  function elementInnerHtml(e, h) {
    if (e.tipo === 'testo') {
      let txt;
      if (e.modo === 'entita' && e.entity) {
        let v = e.attribute ? Attr(h, e.entity, e.attribute) : S(h, e.entity);
        if (v == null) { txt = '—'; }
        else {
          const n = parseFloat(v);
          if (e.decimali != null && e.decimali !== '' && !isNaN(n)) v = n.toFixed(e.decimali);
          txt = v + (e.unit ? ' ' + e.unit : '');
        }
      } else { txt = e.testo || ''; }
      const justify = e.allinea === 'center' ? 'center' : e.allinea === 'right' ? 'flex-end' : 'flex-start';
      return '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:' + justify + ';font-size:' + (e.fontSize || 14) + 'px;font-weight:' + (e.grassetto ? '800' : '400') + ';color:' + (e.colore || '#ffffff') + ';overflow:hidden;white-space:nowrap;text-overflow:ellipsis;line-height:1.1;text-transform:none">' + esc(txt) + '</div>';
    }
    if (e.tipo === 'icona') {
      let col = e.colore || '#ffffff';
      if (e.entity) { const st = S(h, e.entity); col = (st === (e.statoOn || 'on')) ? (e.coloreOn || '#4ade80') : (e.coloreOff || '#f87171'); }
      const sz = Math.max(10, Math.round(Math.min(e.w, e.h) * 0.6));
      return '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:' + sz + 'px;line-height:1;color:' + col + '">' + esc(e.emoji || '❔') + '</div>';
    }
    if (e.tipo === 'forma') {
      return '<div style="width:100%;height:100%;background:' + (e.colore || '#1e293b') + ';border-radius:' + (e.radius != null ? e.radius : 12) + 'px"></div>';
    }
    if (e.tipo === 'azione') {
      const bg = e.bgColore || '#1d4ed8', fg = e.colore || '#ffffff';
      return '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;gap:6px;background:' + bg + ';border-radius:' + (e.radius != null ? e.radius : 12) + 'px;color:' + fg + ';font-size:' + (e.fontSize || 13) + 'px;font-weight:' + (e.grassetto !== false ? '800' : '400') + ';cursor:pointer;user-select:none;transition:transform .1s;text-transform:none;padding:0 8px;box-sizing:border-box;overflow:hidden;white-space:nowrap">'
        + (e.emoji ? '<span>' + esc(e.emoji) + '</span>' : '')
        + (e.testo ? '<span style="overflow:hidden;text-overflow:ellipsis">' + esc(e.testo) + '</span>' : '')
        + '</div>';
    }
    return '';
  }

  function elHtmlRO(e, h, idx) {
    const style = 'position:absolute;left:' + e.x + 'px;top:' + e.y + 'px;width:' + e.w + 'px;height:' + e.h + 'px;box-sizing:border-box';
    const attrs = e.tipo === 'azione' ? ' data-sya="run-action" data-idx="' + idx + '"' : '';
    return '<div class="cl-el-ro" data-idx="' + idx + '" style="' + style + '"' + attrs + '>' + elementInnerHtml(e, h) + '</div>';
  }

  /* ── RENDER CARD ── */
  function render(card) {
    const h = H(), c = cfgFor(card);
    const rid = 'clb' + (card.id || Math.random().toString(36).slice(2, 8));
    const elsHtml = c.elementi.map(function (e, i) { return elHtmlRO(e, h, i); }).join('');
    const css = '<style>'
      + '#' + rid + '{position:relative;width:100%;font-family:system-ui,sans-serif;display:block}'
      + '#' + rid + ' .fc-card{display:flex;flex-direction:column;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#' + rid + ' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:200px;background:radial-gradient(ellipse at 20% 0%,rgba(56,189,248,.16) 0%,transparent 65%);pointer-events:none}'
      + '#' + rid + ' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.2)}'
      + '#' + rid + ' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fc-gear{cursor:pointer;width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;flex-shrink:0}'
      + '#' + rid + ' .fc-gear:hover{background:rgba(255,255,255,.12)}'
      + '#' + rid + ' .cl-wrap{overflow:auto;padding:12px;position:relative;z-index:1;scrollbar-width:none}'
      + '#' + rid + ' .cl-wrap::-webkit-scrollbar{display:none}'
      + '#' + rid + ' .cl-canvas-ro{position:relative;border-radius:10px;margin:0 auto}'
      + '</style>';
    return css
      + '<div id="' + rid + '">'
      + '<div class="fc-card">'
      + '<div class="fc-hdr">'
      + '<div class="fc-hdr-iw">🧩</div>'
      + '<div class="fc-hdr-tit">' + esc(c.name || 'Canvas Libero') + '</div>'
      + '<div class="fc-gear" data-sya="cfg">⚙</div>'
      + '</div>'
      + '<div class="cl-wrap">'
      + '<div class="cl-canvas-ro" style="width:' + c.canvasW + 'px;height:' + c.canvasH + 'px;background:' + c.bgColor + '">' + elsHtml + '</div>'
      + '</div>'
      + '</div>'
      + '</div>';
  }

  /* ── POPUP HELPERS ── */
  function mkOv(html, closeId) {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)';
    ov.innerHTML = html;
    document.body.appendChild(ov);
    const close = function () { try { document.body.removeChild(ov); } catch (e) {} };
    const btn = ov.querySelector('#' + closeId); if (btn) btn.addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov._close = close;
    return ov;
  }

  const POP_CSS = '<style>@keyframes fcUP{from{transform:translateY(100%)}to{transform:translateY(0)}}'
    + '.fcpc{overflow-y:auto;scrollbar-width:none}.fcpc::-webkit-scrollbar{display:none}'
    + '.fcpc .cl-chrome *{text-transform:uppercase!important;font-weight:800!important}'
    + '.cl-el{position:absolute;box-sizing:border-box}'
    + '.cl-el.cl-sel{outline:2px solid #38bdf8;outline-offset:1px}'
    + '.cl-resize{position:absolute;bottom:-2px;right:-2px;width:13px;height:13px;cursor:se-resize;background:#38bdf8;border-radius:3px 0 4px 0;opacity:0;transition:opacity .15s}'
    + '.cl-el:hover .cl-resize,.cl-el.cl-sel .cl-resize{opacity:.9}'
    + '</style>';

  function popShell(icon, title, closeId, content) {
    return POP_CSS + '<div style="width:100%;max-height:90vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(255,255,255,.12);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:fcUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      + '<div style="display:flex;align-items:center;gap:12px;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">'
      + '<div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#fff;flex-shrink:0">' + icon + '</div>'
      + '<div style="flex:1;font-size:16px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.3px">' + title + '</div>'
      + '<button id="' + closeId + '" style="width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);flex-shrink:0">✕</button>'
      + '</div>'
      + '<div class="fcpc" style="flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:0">' + content + '</div>'
      + '</div>';
  }

  /* ── EDITOR ── */
  function openCfg(card, el) {
    const h = H(), c = cfgFor(card);
    const allIds = Object.keys((h && h.states) || {}).sort();
    const stInp = 'width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#fff;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    const stDrop = 'position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:200;max-height:160px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-radius:9px;display:none;scrollbar-width:none';
    const stLbl = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#fff;margin-bottom:3px;display:block';
    const boxOpen = '<div style="padding:14px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid #fff;margin-bottom:9px">';
    const boxClose = '</div>';

    function field(fid, lbl, val, hint) {
      return '<div style="margin-bottom:9px;position:relative"><label style="' + stLbl + '">' + lbl + (hint ? '<span style="font-weight:400;color:#fff;margin-left:6px;font-family:monospace;text-transform:none;letter-spacing:0">' + hint + '</span>' : '') + '</label>'
        + '<input id="' + fid + '" type="text" value="' + esc(val || '') + '" autocomplete="off" placeholder="Cerca entità…" style="' + stInp + '">'
        + '<div id="' + fid + '-d" style="' + stDrop + '"></div></div>';
    }
    function labelInput(id, lbl, val, type) {
      return '<div style="margin-bottom:9px"><label style="' + stLbl + '">' + lbl + '</label>'
        + '<input id="' + id + '" type="' + type + '" value="' + esc(val) + '" style="' + stInp.replace('monospace', 'system-ui') + '"></div>';
    }
    function colorInput(id, lbl, val) {
      return '<div style="margin-bottom:9px"><label style="' + stLbl + '">' + lbl + '</label>'
        + '<input id="' + id + '" type="color" value="' + (val || '#ffffff') + '" style="width:100%;height:34px;border-radius:9px;border:1px solid rgba(255,255,255,.18);background:#0b1422;cursor:pointer;padding:2px"></div>';
    }
    function toggleRow(id, lbl, val) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;margin:9px 0">'
        + '<span style="font-size:12px;font-weight:800;color:#fff">' + lbl + '</span>'
        + '<input id="' + id + '" type="checkbox" ' + (val ? 'checked' : '') + ' style="width:20px;height:20px;accent-color:#38bdf8;cursor:pointer"></div>';
    }
    function selectRow(id, lbl, val, opts) {
      const o = opts.map(function (p) { return '<option value="' + p[0] + '"' + (val === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('');
      return '<div style="margin:9px 0"><label style="' + stLbl + '">' + lbl + '</label><select id="' + id + '" style="' + stInp.replace('monospace', 'system-ui') + '">' + o + '</select></div>';
    }
    function layoutRowPx(lbl, id, val, min, max) {
      return '<div style="display:flex;align-items:center;gap:8px;margin-top:10px">'
        + '<span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#fff;width:110px;flex-shrink:0">' + lbl + '</span>'
        + '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="10" value="' + val + '" style="flex:1;accent-color:#38bdf8;cursor:pointer">'
        + '<span id="' + id + '-lbl" style="font-size:12px;font-weight:900;color:#fff;width:56px;text-align:right;flex-shrink:0">' + val + 'px</span></div>';
    }

    const state = {
      name: c.name,
      canvasW: c.canvasW,
      canvasH: c.canvasH,
      bgColor: c.bgColor,
      elementi: JSON.parse(JSON.stringify(c.elementi)),
      selIdx: -1,
    };

    const toolbarHtml = labelInput('cl-name', 'Nome card', state.name, 'text')
      + '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0">'
      + '<button id="cl-add-testo" style="flex:1;min-width:80px;padding:9px;border-radius:10px;background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.3);color:#fff;font-size:12px;font-weight:800;cursor:pointer">+ 🔤 Testo</button>'
      + '<button id="cl-add-icona" style="flex:1;min-width:80px;padding:9px;border-radius:10px;background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.3);color:#fff;font-size:12px;font-weight:800;cursor:pointer">+ 😀 Icona</button>'
      + '<button id="cl-add-forma" style="flex:1;min-width:80px;padding:9px;border-radius:10px;background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.3);color:#fff;font-size:12px;font-weight:800;cursor:pointer">+ ⬜ Forma</button>'
      + '<button id="cl-add-azione" style="flex:1;min-width:80px;padding:9px;border-radius:10px;background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.3);color:#fff;font-size:12px;font-weight:800;cursor:pointer">+ 🔘 Azione</button>'
      + '</div>'
      + layoutRowPx('Larghezza canvas', 'cl-cw', state.canvasW, 120, 900)
      + layoutRowPx('Altezza canvas', 'cl-ch', state.canvasH, 80, 600)
      + colorInput('cl-bg', 'Colore sfondo canvas', state.bgColor);

    function propsHtml() {
      if (state.selIdx < 0 || !state.elementi[state.selIdx]) {
        return '<div style="padding:16px 0;font-size:12px;font-weight:700;color:#fff;opacity:.6;text-align:center">Clicca un elemento sul canvas (o nella lista qui sotto) per modificarlo</div>';
      }
      const e = state.elementi[state.selIdx];
      let out = boxOpen;
      if (e.tipo === 'testo') {
        out += selectRow('cl-p-modo', 'Contenuto', e.modo || 'fisso', [['fisso', 'Testo fisso'], ['entita', 'Da sensore HA']]);
        if (e.modo === 'entita') {
          out += field('cl-p-entity', 'Entità', e.entity, 'sensor.qualsiasi_cosa')
            + '<div style="display:flex;gap:8px">' + labelInput('cl-p-attr', 'Attributo (opzionale)', e.attribute || '', 'text') + labelInput('cl-p-unit', 'Unità (opzionale)', e.unit || '', 'text') + '</div>'
            + labelInput('cl-p-dec', 'Decimali', e.decimali != null ? e.decimali : '', 'number');
        } else {
          out += labelInput('cl-p-testo', 'Testo', e.testo || '', 'text');
        }
        out += '<div style="display:flex;gap:8px">' + colorInput('cl-p-colore', 'Colore', e.colore || '#ffffff') + labelInput('cl-p-fs', 'Dimensione (px)', e.fontSize || 14, 'number') + '</div>'
          + toggleRow('cl-p-bold', 'Grassetto', !!e.grassetto)
          + selectRow('cl-p-align', 'Allineamento', e.allinea || 'left', [['left', 'Sinistra'], ['center', 'Centro'], ['right', 'Destra']]);
      } else if (e.tipo === 'icona') {
        out += labelInput('cl-p-emoji', 'Emoji / simbolo', e.emoji || '', 'text')
          + colorInput('cl-p-colore', 'Colore fisso', e.colore || '#ffffff')
          + field('cl-p-entity', 'Entità per colore in base allo stato (opz.)', e.entity, 'binary_sensor.qualsiasi_cosa')
          + '<div style="display:flex;gap:8px">' + labelInput('cl-p-statoOn', 'Stato "acceso"', e.statoOn || 'on', 'text') + colorInput('cl-p-colorOn', 'Colore acceso', e.coloreOn || '#4ade80') + colorInput('cl-p-colorOff', 'Colore spento', e.coloreOff || '#f87171') + '</div>';
      } else if (e.tipo === 'forma') {
        out += colorInput('cl-p-colore', 'Colore', e.colore || '#1e293b')
          + labelInput('cl-p-radius', 'Raggio angoli (px)', e.radius != null ? e.radius : 12, 'number');
      } else if (e.tipo === 'azione') {
        out += field('cl-p-entity', 'Entità da attivare', e.entity, 'script.esco_di_casa')
          + selectRow('cl-p-azione', 'Azione', e.azione || 'turn_on', [['turn_on', 'Attiva / Esegui (script, scena, switch...)'], ['toggle', 'Accendi-Spegni (toggle)']])
          + labelInput('cl-p-emoji', 'Emoji (opzionale)', e.emoji || '', 'text')
          + labelInput('cl-p-testo', 'Etichetta (opzionale)', e.testo || '', 'text')
          + '<div style="display:flex;gap:8px">' + colorInput('cl-p-colore', 'Colore testo', e.colore || '#ffffff') + colorInput('cl-p-bg', 'Colore sfondo bottone', e.bgColore || '#1d4ed8') + '</div>'
          + '<div style="display:flex;gap:8px">' + labelInput('cl-p-fs', 'Dimensione testo (px)', e.fontSize || 13, 'number') + labelInput('cl-p-radius', 'Raggio angoli (px)', e.radius != null ? e.radius : 12, 'number') + '</div>';
      }
      out += boxClose;
      out += '<div style="display:flex;gap:8px;margin-top:8px">'
        + '<button id="cl-p-back" style="flex:1;padding:9px;border-radius:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:12px;font-weight:700;cursor:pointer">◀ Indietro</button>'
        + '<button id="cl-p-front" style="flex:1;padding:9px;border-radius:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:12px;font-weight:700;cursor:pointer">Avanti ▶</button>'
        + '</div>'
        + '<button id="cl-p-del" style="width:100%;margin-top:8px;padding:11px;border-radius:12px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.22);color:#f87171;font-size:13px;font-weight:700;cursor:pointer">🗑 Elimina elemento</button>';
      return out;
    }

    const settingsHtml = '<div class="cl-chrome">' + toolbarHtml
      + '<div id="cl-chips" style="display:flex;flex-wrap:wrap;gap:6px;margin:12px 0"></div>'
      + '<div id="cl-props"></div>'
      + '<div style="display:flex;gap:8px;margin-top:16px">'
      + '<button id="cl-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>'
      + '<button id="cl-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#38bdf8;color:#fff">💾 Salva</button>'
      + '</div>'
      + '</div>';

    const previewHtml = '<div class="cl-chrome" style="margin-bottom:8px"><div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#fff">Anteprima live — trascina qui dentro</div></div>'
      + '<div style="overflow:auto;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.28);padding:12px">'
      + '<div id="cl-canvas" style="position:relative;width:' + state.canvasW + 'px;height:' + state.canvasH + 'px;background:' + state.bgColor + ';border-radius:10px;margin:0 auto"></div>'
      + '</div>';

    const content = '<div style="display:flex;gap:20px;align-items:flex-start">'
      + '<div style="flex:1;min-width:0">' + settingsHtml + '</div>'
      + '<div style="flex:1;min-width:0">' + previewHtml + '</div>'
      + '</div>';

    const ov = mkOv(popShell('🧩', 'Impostazioni Canvas', 'cl-close', content), 'cl-close');

    /* ── drag & resize (mouse + touch) ── */
    let drag = null;
    const SNAP = 5;
    function clampV(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
    function snapv(v) { return Math.round(v / SNAP) * SNAP; }
    function onMove(cx, cy) {
      if (!drag) return;
      const e = state.elementi[drag.idx]; if (!e) return;
      const div = ov.querySelector('.cl-el[data-idx="' + drag.idx + '"]'); if (!div) return;
      const dx = cx - drag.startX, dy = cy - drag.startY;
      if (drag.mode === 'move') {
        e.x = clampV(snapv(drag.origX + dx), 0, Math.max(0, state.canvasW - e.w));
        e.y = clampV(snapv(drag.origY + dy), 0, Math.max(0, state.canvasH - e.h));
        div.style.left = e.x + 'px'; div.style.top = e.y + 'px';
      } else {
        e.w = clampV(snapv(drag.origW + dx), 20, state.canvasW - e.x);
        e.h = clampV(snapv(drag.origH + dy), 16, state.canvasH - e.y);
        div.style.width = e.w + 'px'; div.style.height = e.h + 'px';
      }
    }
    function onUp() { drag = null; }
    function onMouseMove(ev) { onMove(ev.clientX, ev.clientY); }
    function onMouseUp() { onUp(); }
    function onTouchMove(ev) { if (!drag) return; const t = ev.touches && ev.touches[0]; if (!t) return; ev.preventDefault(); onMove(t.clientX, t.clientY); }
    function onTouchEnd() { onUp(); }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    function cleanupDrag() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    }
    const xBtn = ov.querySelector('#cl-close'); if (xBtn) xBtn.addEventListener('click', cleanupDrag);
    ov.addEventListener('click', function (ev) { if (ev.target === ov) cleanupDrag(); });

    function bindField(fid) {
      const inp = ov.querySelector('#' + fid), drop = ov.querySelector('#' + fid + '-d');
      if (!inp || !drop) return;
      function showDrop() {
        const q = inp.value.toLowerCase().trim();
        const hits = (q ? allIds.filter(function (id) { return id.toLowerCase().includes(q); }) : allIds).slice(0, 50);
        if (!hits.length) { drop.style.display = 'none'; return; }
        drop.style.display = 'block';
        drop.innerHTML = hits.map(function (id) { return '<div data-pick="' + id + '" style="padding:6px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#fff">' + id + '</div>'; }).join('');
        drop.querySelectorAll('[data-pick]').forEach(function (row) {
          row.addEventListener('mousedown', function (ev) { ev.preventDefault(); inp.value = row.getAttribute('data-pick'); drop.style.display = 'none'; inp.dispatchEvent(new Event('input')); });
          row.addEventListener('mouseover', function () { row.style.background = 'rgba(255,255,255,.08)'; });
          row.addEventListener('mouseout', function () { row.style.background = ''; });
        });
      }
      inp.addEventListener('focus', showDrop);
      inp.addEventListener('input', showDrop);
      inp.addEventListener('blur', function () { setTimeout(function () { drop.style.display = 'none'; }, 200); });
    }

    function elHtml(e, hh, idx) {
      const style = 'position:absolute;left:' + e.x + 'px;top:' + e.y + 'px;width:' + e.w + 'px;height:' + e.h + 'px;box-sizing:border-box;cursor:move';
      return '<div class="cl-el" data-idx="' + idx + '" style="' + style + '">' + elementInnerHtml(e, hh) + '<div class="cl-resize"></div></div>';
    }

    function bindElementDrag(div, idx) {
      const handle = div.querySelector('.cl-resize');
      function selectEl() {
        if (state.selIdx !== idx) {
          state.selIdx = idx;
          ov.querySelectorAll('.cl-el.cl-sel').forEach(function (d) { d.classList.remove('cl-sel'); });
          div.classList.add('cl-sel');
          renderChips(); renderProps();
        }
      }
      div.addEventListener('mousedown', function (ev) {
        if (handle && ev.target === handle) return;
        ev.preventDefault();
        selectEl();
        const e = state.elementi[idx];
        drag = { idx: idx, mode: 'move', startX: ev.clientX, startY: ev.clientY, origX: e.x, origY: e.y };
      });
      div.addEventListener('touchstart', function (ev) {
        if (handle && ev.target === handle) return;
        const t = ev.touches && ev.touches[0]; if (!t) return;
        selectEl();
        const e = state.elementi[idx];
        drag = { idx: idx, mode: 'move', startX: t.clientX, startY: t.clientY, origX: e.x, origY: e.y };
      }, { passive: true });
      if (handle) {
        handle.addEventListener('mousedown', function (ev) {
          ev.preventDefault(); ev.stopPropagation();
          selectEl();
          const e = state.elementi[idx];
          drag = { idx: idx, mode: 'resize', startX: ev.clientX, startY: ev.clientY, origW: e.w, origH: e.h };
        });
        handle.addEventListener('touchstart', function (ev) {
          ev.stopPropagation();
          const t = ev.touches && ev.touches[0]; if (!t) return;
          selectEl();
          const e = state.elementi[idx];
          drag = { idx: idx, mode: 'resize', startX: t.clientX, startY: t.clientY, origW: e.w, origH: e.h };
        }, { passive: true });
      }
    }

    function renderCanvas() {
      const box = ov.querySelector('#cl-canvas'); if (!box) return;
      box.style.width = state.canvasW + 'px';
      box.style.height = state.canvasH + 'px';
      box.style.background = state.bgColor;
      const hh = H();
      box.innerHTML = state.elementi.map(function (e, i) { return elHtml(e, hh, i); }).join('');
      box.querySelectorAll('.cl-el').forEach(function (div) {
        const idx = parseInt(div.getAttribute('data-idx'), 10);
        if (idx === state.selIdx) div.classList.add('cl-sel');
        bindElementDrag(div, idx);
      });
    }

    function renderChips() {
      const box = ov.querySelector('#cl-chips'); if (!box) return;
      const iconFor = { testo: '🔤', icona: '😀', forma: '⬜', azione: '🔘' };
      if (!state.elementi.length) {
        box.innerHTML = '<div style="font-size:11px;font-weight:700;color:#fff;opacity:.55">Nessun elemento — aggiungine uno dalla barra sopra il canvas</div>';
        return;
      }
      box.innerHTML = state.elementi.map(function (e, i) {
        return '<div class="cl-chip" data-idx="' + i + '" style="display:flex;align-items:center;gap:5px;padding:5px 9px;border-radius:20px;font-size:11px;font-weight:800;cursor:pointer;background:' + (i === state.selIdx ? 'rgba(56,189,248,.22)' : 'rgba(255,255,255,.06)') + ';border:1px solid ' + (i === state.selIdx ? 'rgba(56,189,248,.5)' : 'rgba(255,255,255,.12)') + ';color:#fff">'
          + (iconFor[e.tipo] || '•') + ' ' + (i + 1)
          + '<span class="cl-chip-x" data-idx="' + i + '" style="opacity:.6;margin-left:2px">✕</span></div>';
      }).join('');
      box.querySelectorAll('.cl-chip').forEach(function (chip) {
        chip.addEventListener('click', function (ev) {
          if (ev.target.classList.contains('cl-chip-x')) return;
          state.selIdx = parseInt(chip.getAttribute('data-idx'), 10);
          renderCanvas(); renderChips(); renderProps();
        });
      });
      box.querySelectorAll('.cl-chip-x').forEach(function (x) {
        x.addEventListener('click', function (ev) {
          ev.stopPropagation();
          const idx = parseInt(x.getAttribute('data-idx'), 10);
          state.elementi.splice(idx, 1);
          if (state.selIdx === idx) state.selIdx = -1;
          else if (state.selIdx > idx) state.selIdx--;
          renderCanvas(); renderChips(); renderProps();
        });
      });
    }

    function renderProps() {
      const box = ov.querySelector('#cl-props'); if (!box) return;
      box.innerHTML = propsHtml();
      bindPropsEvents();
    }

    function bindPropsEvents() {
      const e = state.elementi[state.selIdx]; if (!e) return;
      const modoSel = ov.querySelector('#cl-p-modo'); if (modoSel) modoSel.addEventListener('change', function () { e.modo = modoSel.value; renderProps(); renderCanvas(); });
      const entityInp = ov.querySelector('#cl-p-entity'); if (entityInp) { bindField('cl-p-entity'); entityInp.addEventListener('input', function () { e.entity = entityInp.value; renderCanvas(); }); }
      const attrInp = ov.querySelector('#cl-p-attr'); if (attrInp) attrInp.addEventListener('input', function () { e.attribute = attrInp.value; renderCanvas(); });
      const unitInp = ov.querySelector('#cl-p-unit'); if (unitInp) unitInp.addEventListener('input', function () { e.unit = unitInp.value; renderCanvas(); });
      const decInp = ov.querySelector('#cl-p-dec'); if (decInp) decInp.addEventListener('input', function () { e.decimali = decInp.value === '' ? null : parseInt(decInp.value, 10); renderCanvas(); });
      const testoInp = ov.querySelector('#cl-p-testo'); if (testoInp) testoInp.addEventListener('input', function () { e.testo = testoInp.value; renderCanvas(); });
      const coloreInp = ov.querySelector('#cl-p-colore'); if (coloreInp) coloreInp.addEventListener('input', function () { e.colore = coloreInp.value; renderCanvas(); });
      const fsInp = ov.querySelector('#cl-p-fs'); if (fsInp) fsInp.addEventListener('input', function () { e.fontSize = parseInt(fsInp.value, 10) || 14; renderCanvas(); });
      const boldInp = ov.querySelector('#cl-p-bold'); if (boldInp) boldInp.addEventListener('change', function () { e.grassetto = boldInp.checked; renderCanvas(); });
      const alignSel = ov.querySelector('#cl-p-align'); if (alignSel) alignSel.addEventListener('change', function () { e.allinea = alignSel.value; renderCanvas(); });
      const emojiInp = ov.querySelector('#cl-p-emoji'); if (emojiInp) emojiInp.addEventListener('input', function () { e.emoji = emojiInp.value; renderCanvas(); });
      const statoOnInp = ov.querySelector('#cl-p-statoOn'); if (statoOnInp) statoOnInp.addEventListener('input', function () { e.statoOn = statoOnInp.value; renderCanvas(); });
      const colorOnInp = ov.querySelector('#cl-p-colorOn'); if (colorOnInp) colorOnInp.addEventListener('input', function () { e.coloreOn = colorOnInp.value; renderCanvas(); });
      const colorOffInp = ov.querySelector('#cl-p-colorOff'); if (colorOffInp) colorOffInp.addEventListener('input', function () { e.coloreOff = colorOffInp.value; renderCanvas(); });
      const radiusInp = ov.querySelector('#cl-p-radius'); if (radiusInp) radiusInp.addEventListener('input', function () { e.radius = parseInt(radiusInp.value, 10) || 0; renderCanvas(); });
      const azioneSel = ov.querySelector('#cl-p-azione'); if (azioneSel) azioneSel.addEventListener('change', function () { e.azione = azioneSel.value; renderCanvas(); });
      const bgInp2 = ov.querySelector('#cl-p-bg'); if (bgInp2) bgInp2.addEventListener('input', function () { e.bgColore = bgInp2.value; renderCanvas(); });
      const frontBtn = ov.querySelector('#cl-p-front'); if (frontBtn) frontBtn.addEventListener('click', function () { moveSelected(1); });
      const backBtn = ov.querySelector('#cl-p-back'); if (backBtn) backBtn.addEventListener('click', function () { moveSelected(-1); });
      const delBtn = ov.querySelector('#cl-p-del'); if (delBtn) delBtn.addEventListener('click', deleteSelected);
    }

    function moveSelected(dir) {
      const i = state.selIdx, j = i + dir;
      if (i < 0 || j < 0 || j >= state.elementi.length) return;
      const tmp = state.elementi[i]; state.elementi[i] = state.elementi[j]; state.elementi[j] = tmp;
      state.selIdx = j;
      renderCanvas(); renderChips(); renderProps();
    }
    function deleteSelected() {
      if (state.selIdx < 0) return;
      state.elementi.splice(state.selIdx, 1);
      state.selIdx = -1;
      renderCanvas(); renderChips(); renderProps();
    }
    function addElement(tipo) {
      const e = { id: 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), tipo: tipo, x: 10, y: 10 };
      if (tipo === 'testo') { e.w = 120; e.h = 28; e.modo = 'fisso'; e.testo = 'Testo'; e.colore = '#ffffff'; e.fontSize = 14; e.grassetto = false; e.allinea = 'left'; state.elementi.push(e); }
      else if (tipo === 'icona') { e.w = 36; e.h = 36; e.emoji = '⭐'; e.colore = '#ffffff'; e.statoOn = 'on'; e.coloreOn = '#4ade80'; e.coloreOff = '#f87171'; state.elementi.push(e); }
      else if (tipo === 'azione') { e.w = 110; e.h = 40; e.entity = ''; e.azione = 'turn_on'; e.emoji = '▶️'; e.testo = 'Esegui'; e.colore = '#ffffff'; e.bgColore = '#1d4ed8'; e.fontSize = 13; e.grassetto = true; e.radius = 12; state.elementi.push(e); }
      else { e.w = 120; e.h = 70; e.colore = '#1e293b'; e.radius = 12; state.elementi.unshift(e); }
      state.selIdx = state.elementi.indexOf(e);
      renderCanvas(); renderChips(); renderProps();
    }

    const nameInp = ov.querySelector('#cl-name'); if (nameInp) nameInp.addEventListener('input', function () { state.name = nameInp.value; });
    const cwInp = ov.querySelector('#cl-cw'); if (cwInp) cwInp.addEventListener('input', function () { state.canvasW = parseInt(cwInp.value, 10); const l = ov.querySelector('#cl-cw-lbl'); if (l) l.textContent = state.canvasW + 'px'; renderCanvas(); });
    const chInp = ov.querySelector('#cl-ch'); if (chInp) chInp.addEventListener('input', function () { state.canvasH = parseInt(chInp.value, 10); const l = ov.querySelector('#cl-ch-lbl'); if (l) l.textContent = state.canvasH + 'px'; renderCanvas(); });
    const bgInp = ov.querySelector('#cl-bg'); if (bgInp) bgInp.addEventListener('input', function () { state.bgColor = bgInp.value; renderCanvas(); });
    const addTestoBtn = ov.querySelector('#cl-add-testo'); if (addTestoBtn) addTestoBtn.addEventListener('click', function () { addElement('testo'); });
    const addIconaBtn = ov.querySelector('#cl-add-icona'); if (addIconaBtn) addIconaBtn.addEventListener('click', function () { addElement('icona'); });
    const addFormaBtn = ov.querySelector('#cl-add-forma'); if (addFormaBtn) addFormaBtn.addEventListener('click', function () { addElement('forma'); });
    const addAzioneBtn = ov.querySelector('#cl-add-azione'); if (addAzioneBtn) addAzioneBtn.addEventListener('click', function () { addElement('azione'); });

    const cancelBtn = ov.querySelector('#cl-cancel'); if (cancelBtn) cancelBtn.addEventListener('click', function () { cleanupDrag(); ov._close(); });
    const saveBtn = ov.querySelector('#cl-save');
    if (saveBtn) saveBtn.addEventListener('click', function () {
      save(card, { name: state.name, canvasW: state.canvasW, canvasH: state.canvasH, bgColor: state.bgColor, elementi: state.elementi });
      saveBtn.textContent = '✅ Salvato!';
      saveBtn.style.background = 'rgba(34,197,94,.15)'; saveBtn.style.color = '#4ade80';
      try { el._clbSig = ''; el.innerHTML = render(card); mount(card, null, el); } catch (err) {}
      cleanupDrag();
      setTimeout(function () { ov._close(); }, 900);
    });

    renderCanvas();
    renderChips();
    renderProps();
  }

  /* ── UPDATE / MOUNT ── */
  function update(card, hass, el) {
    const h = H(), c = cfgFor(card);
    const sig = [CARD.version, c.canvasW, c.canvasH, c.bgColor, c.name, JSON.stringify(c.elementi.map(function (e) { return e.entity ? [e.entity, e.attribute || '', S(h, e.entity)] : null; }))].join('|');
    if (!el.querySelector('.fc-card') || el._clbSig !== sig) { el._clbSig = sig; el.innerHTML = render(card); }
    mount(card, hass, el);
  }
  function mount(card, hass, el) {
    if (el._clbBound === CARD.version) return;
    el._clbBound = CARD.version;
    if (el._clbHandler) el.removeEventListener('click', el._clbHandler);
    el._clbHandler = function (e) {
      const sya = e.target.closest('[data-sya]'); if (!sya) return;
      if (sya.dataset.sya === 'cfg') { openCfg(card, el); return; }
      if (sya.dataset.sya === 'run-action') {
        const idx = parseInt(sya.dataset.idx, 10);
        const elm = (cfgFor(card).elementi || [])[idx];
        if (elm && elm.entity) {
          const domain = elm.entity.split('.')[0];
          if (elm.azione === 'toggle') callSvc('homeassistant', 'toggle', { entity_id: elm.entity });
          else callSvc(domain, 'turn_on', { entity_id: elm.entity });
          sya.style.transform = 'scale(.94)';
          setTimeout(function () { sya.style.transform = ''; }, 150);
        }
        return;
      }
    };
    el.addEventListener('click', el._clbHandler);
  }

  /* ── CARD ── */
  var CARD = {
    id: 'canvas-libero', name: 'Canvas Libero', icon: '🧩', version: '1.2',
    desc: 'Canvas libero: crea la tua card personalizzata trascinando testo, icone e blocchi colorati, ognuno collegabile a qualsiasi sensore Home Assistant.',
    colSpan: 2, rowSpan: 2, frarik_no_edit: true,
    render: function (card) { return render(card); },
    mount: function (card, hass, el) { return mount(card, hass, el); },
    update: function (card, hass, el) { return update(card, hass, el); },
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: canvas-libero v' + CARD.version); } catch (e) {}
})();
