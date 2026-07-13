/* frarik-version: 1.0 */
/**
 * _colorRules.js — Modulo condiviso FratechColorRules v1.0
 * Gestione colore chip dinamico: automatico / fisso / condizioni.
 * Caricato prima di tutti i distintivi (prefisso underscore).
 */
(function () {
  'use strict';

  function eh(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function _selSt() {
    return 'padding:4px 7px;border-radius:6px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:11px;cursor:pointer;width:100%;box-sizing:border-box';
  }

  function _btnSt(active) {
    return active
      ? 'flex:1;padding:5px 8px;border-radius:6px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);color:#fff;font-size:10px;font-weight:700;cursor:pointer'
      : 'flex:1;padding:5px 8px;border-radius:6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.5);font-size:10px;font-weight:600;cursor:pointer';
  }

  function _detailHtml(type, cond) {
    if (!type || type === 'none') return '';
    if (type === 'compare') {
      const entity = (cond && cond.entity) || '';
      const attr   = (cond && cond.attr)   || '';
      const op     = (cond && cond.op)     || '>';
      const val    = (cond && cond.val !== undefined) ? cond.val : '';
      const ops    = ['==', '!=', '>', '<', '>=', '<=', 'contains'];
      return `<div style="display:flex;flex-direction:column;gap:4px;margin-top:5px">
        <input data-fcr-entity type="text" placeholder="entity_id (es. sensor.temp)" value="${eh(entity)}"
          style="padding:4px 7px;border-radius:6px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:11px;width:100%;box-sizing:border-box">
        <input data-fcr-attr type="text" placeholder="attributo (opzionale, es. brightness)" value="${eh(attr)}"
          style="padding:4px 7px;border-radius:6px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:11px;width:100%;box-sizing:border-box">
        <div style="display:flex;gap:4px">
          <select data-fcr-op style="${_selSt()};width:auto;flex-shrink:0">
            ${ops.map(o => `<option value="${o}"${o === op ? ' selected' : ''}>${o}</option>`).join('')}
          </select>
          <input data-fcr-val type="text" placeholder="valore" value="${eh(val)}"
            style="flex:1;padding:4px 7px;border-radius:6px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:11px;box-sizing:border-box">
        </div>
      </div>`;
    }
    /* entity-list types: any_on / all_on / any_off / all_off */
    const entities = (cond && Array.isArray(cond.entities)) ? cond.entities.join('\n') : '';
    return `<div style="margin-top:5px">
      <textarea data-fcr-entities rows="2" placeholder="entity_id (uno per riga)"
        style="width:100%;box-sizing:border-box;padding:4px 7px;border-radius:6px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:11px;resize:vertical;min-height:44px">${eh(entities)}</textarea>
    </div>`;
  }

  function _ruleHtml(rule, i) {
    const color = rule.color || '#4ade80';
    const cond  = rule.cond;
    const type  = !cond ? 'none' : (cond.type || 'any_on');
    const types = ['none', 'any_on', 'all_on', 'any_off', 'all_off', 'compare'];
    const lbl   = { none: 'Fallback (sempre)', any_on: 'Almeno uno ON', all_on: 'Tutti ON', any_off: 'Almeno uno OFF', all_off: 'Tutti OFF', compare: 'Confronto valore' };
    return `<div data-fcr-rule="${i}" style="margin-bottom:6px;padding:8px;background:rgba(255,255,255,.04);border-radius:8px;border:1px solid rgba(255,255,255,.08)">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
        <input type="color" data-fcr-rcolor value="${eh(color)}" style="width:28px;height:28px;border:none;cursor:pointer;border-radius:4px;background:transparent;padding:0;flex-shrink:0">
        <select data-fcr-rtype style="${_selSt()};flex:1">
          ${types.map(t => `<option value="${t}"${t === type ? ' selected' : ''}>${lbl[t]}</option>`).join('')}
        </select>
        <button data-fcr-del style="flex-shrink:0;width:22px;height:22px;padding:0;border-radius:4px;background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.3);color:#f87171;font-size:12px;cursor:pointer;line-height:1">✕</button>
      </div>
      <div data-fcr-detail>${_detailHtml(type, cond)}</div>
    </div>`;
  }

  /* ── html(): genera HTML della sezione colore ── */
  function html(colorCfg) {
    const mode  = (colorCfg && colorCfg.mode)  || 'auto';
    const fixed = (colorCfg && colorCfg.fixed) || '#60a5fa';
    const rules = (colorCfg && Array.isArray(colorCfg.rules)) ? colorCfg.rules : [];
    const showAuto  = mode === 'auto'        ? 'block' : 'none';
    const showFixed = mode === 'fixed'       ? 'flex'  : 'none';
    const showCond  = mode === 'conditional' ? 'block' : 'none';
    return `<div id="fcr-section" style="margin:8px 0;padding:12px;background:rgba(255,255,255,.05);border-radius:10px;border:1px solid rgba(255,255,255,.1)">
      <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.5);letter-spacing:.8px;margin-bottom:7px">🎨 COLORE CHIP</div>
      <div style="display:flex;gap:4px;margin-bottom:8px">
        <button data-fcr-mode="auto"        style="${_btnSt(mode === 'auto')}">Automatico</button>
        <button data-fcr-mode="fixed"       style="${_btnSt(mode === 'fixed')}">Fisso</button>
        <button data-fcr-mode="conditional" style="${_btnSt(mode === 'conditional')}">Condizioni</button>
      </div>
      <div id="fcr-auto-info"  style="display:${showAuto};font-size:11px;color:rgba(255,255,255,.5);padding:2px 0">Il chip usa il colore predefinito del distintivo.</div>
      <div id="fcr-fixed-wrap" style="display:${showFixed};align-items:center;gap:8px">
        <input type="color" id="fcr-fixed-inp" value="${eh(fixed)}" style="width:34px;height:34px;border:none;cursor:pointer;border-radius:6px;background:transparent;padding:0">
        <span style="font-size:11px;color:#fff">Colore fisso del chip</span>
      </div>
      <div id="fcr-cond-wrap" style="display:${showCond}">
        <div id="fcr-rules-list">${rules.map((r, i) => _ruleHtml(r, i)).join('')}</div>
        <button id="fcr-add-rule" style="margin-top:6px;padding:4px 10px;font-size:11px;border-radius:6px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;cursor:pointer">+ Aggiungi regola</button>
      </div>
    </div>`;
  }

  /* ── attach(): collega tutti i handler interattivi della sezione ── */
  function attach(sec, onChange) {
    if (!sec) return;

    function _setMode(m) {
      sec.querySelector('#fcr-auto-info').style.display  = m === 'auto'        ? 'block' : 'none';
      sec.querySelector('#fcr-fixed-wrap').style.display = m === 'fixed'       ? 'flex'  : 'none';
      sec.querySelector('#fcr-cond-wrap').style.display  = m === 'conditional' ? 'block' : 'none';
      sec.querySelectorAll('[data-fcr-mode]').forEach(function (b) {
        const a = b.dataset.fcrMode === m;
        b.style.background  = a ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.05)';
        b.style.border      = a ? '1px solid rgba(255,255,255,.3)' : '1px solid rgba(255,255,255,.1)';
        b.style.color       = a ? '#fff' : 'rgba(255,255,255,.5)';
        b.style.fontWeight  = a ? '700' : '600';
      });
      if (onChange) onChange();
    }

    sec.querySelectorAll('[data-fcr-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () { _setMode(btn.dataset.fcrMode); });
    });

    var addBtn = sec.querySelector('#fcr-add-rule');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var rulesEl = sec.querySelector('#fcr-rules-list');
        var idx = rulesEl.querySelectorAll('[data-fcr-rule]').length;
        var tmp = document.createElement('div');
        tmp.innerHTML = _ruleHtml({ color: '#4ade80', cond: null }, idx);
        var ruleEl = tmp.firstElementChild;
        rulesEl.appendChild(ruleEl);
        _attachRule(sec, ruleEl, onChange);
        if (onChange) onChange();
      });
    }

    sec.querySelectorAll('[data-fcr-rule]').forEach(function (ruleEl) {
      _attachRule(sec, ruleEl, onChange);
    });
  }

  function _attachRule(sec, ruleEl, onChange) {
    var delBtn = ruleEl.querySelector('[data-fcr-del]');
    if (delBtn) {
      delBtn.addEventListener('click', function () {
        ruleEl.remove();
        sec.querySelectorAll('[data-fcr-rule]').forEach(function (el, i) { el.dataset.fcrRule = i; });
        if (onChange) onChange();
      });
    }
    var typeSelect = ruleEl.querySelector('[data-fcr-rtype]');
    if (typeSelect) {
      typeSelect.addEventListener('change', function () {
        var detailEl = ruleEl.querySelector('[data-fcr-detail]');
        if (detailEl) detailEl.innerHTML = _detailHtml(typeSelect.value, null);
        if (onChange) onChange();
      });
    }
  }

  /* ── read(): legge lo stato corrente della sezione dal DOM ── */
  function read(sec) {
    if (!sec) return { colorMode: 'auto', colorFixed: '#60a5fa', colorRules: [] };
    var mode = 'auto';
    var fw = sec.querySelector('#fcr-fixed-wrap');
    var cw = sec.querySelector('#fcr-cond-wrap');
    if (fw && fw.style.display !== 'none') mode = 'fixed';
    else if (cw && cw.style.display !== 'none') mode = 'conditional';
    var colorFixed = (sec.querySelector('#fcr-fixed-inp') || {}).value || '#60a5fa';
    var rules = [];
    sec.querySelectorAll('[data-fcr-rule]').forEach(function (ruleEl) {
      var color = (ruleEl.querySelector('[data-fcr-rcolor]') || {}).value || '#4ade80';
      var cond  = _readDetail(ruleEl);
      rules.push({ color: color, cond: cond });
    });
    return { colorMode: mode, colorFixed: colorFixed, colorRules: rules };
  }

  function _readDetail(ruleEl) {
    var typeEl = ruleEl.querySelector('[data-fcr-rtype]');
    var type   = typeEl ? typeEl.value : 'none';
    if (!type || type === 'none') return null;
    if (type === 'compare') {
      var entity = ((ruleEl.querySelector('[data-fcr-entity]') || {}).value || '').trim();
      var attr   = ((ruleEl.querySelector('[data-fcr-attr]')   || {}).value || '').trim();
      var op     = ((ruleEl.querySelector('[data-fcr-op]')     || {}).value) || '>';
      var val    = ((ruleEl.querySelector('[data-fcr-val]')    || {}).value || '').trim();
      var result = { type: 'compare', entity: entity, op: op, val: val };
      if (attr) result.attr = attr;
      return result;
    }
    var ta       = ruleEl.querySelector('[data-fcr-entities]');
    var entities = ta ? ta.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean) : [];
    return { type: type, entities: entities };
  }

  /* ── evalColor(): valuta il colore in base alla configurazione e allo stato HA ── */
  function evalColor(cfg, h) {
    if (!cfg || !cfg.colorMode || cfg.colorMode === 'auto') return null;
    if (cfg.colorMode === 'fixed') return cfg.colorFixed || null;
    if (cfg.colorMode === 'conditional') {
      var rules = Array.isArray(cfg.colorRules) ? cfg.colorRules : [];
      for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        if (!rule.cond) return rule.color || null;
        if (_matchCond(rule.cond, h)) return rule.color || null;
      }
    }
    return null;
  }

  function _matchCond(cond, h) {
    if (!cond || !h) return false;
    var st = h.states || {};
    function _state(id) { return ((st[id] && st[id].state) || '').toLowerCase(); }
    function _attr(id, a) { return (st[id] && st[id].attributes && st[id].attributes[a] !== undefined) ? st[id].attributes[a] : null; }
    if (cond.type === 'any_on')  return (cond.entities || []).some(function (id) { return _state(id) === 'on'; });
    if (cond.type === 'all_on')  return (cond.entities || []).length > 0 && (cond.entities || []).every(function (id) { return _state(id) === 'on'; });
    if (cond.type === 'any_off') return (cond.entities || []).some(function (id) { return _state(id) !== 'on'; });
    if (cond.type === 'all_off') return (cond.entities || []).every(function (id) { return _state(id) !== 'on'; });
    if (cond.type === 'compare') {
      var actual = cond.attr ? _attr(cond.entity, cond.attr) : (st[cond.entity] ? st[cond.entity].state : null);
      if (actual === null || actual === undefined) return false;
      var na = parseFloat(actual), nt = parseFloat(cond.val), isNum = !isNaN(na) && !isNaN(nt);
      switch (cond.op) {
        case '==':       return String(actual) === String(cond.val);
        case '!=':       return String(actual) !== String(cond.val);
        case '>':        return isNum && na > nt;
        case '<':        return isNum && na < nt;
        case '>=':       return isNum && na >= nt;
        case '<=':       return isNum && na <= nt;
        case 'contains': return String(actual).toLowerCase().indexOf(String(cond.val).toLowerCase()) >= 0;
      }
    }
    return false;
  }

  window.FratechColorRules = { html: html, attach: attach, read: read, evalColor: evalColor };
})();
