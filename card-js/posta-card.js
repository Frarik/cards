/* frarik-version: 3.0 */
/* Centro Controllo Posta — Frarik card standalone */
(function(){
'use strict';

/* ══════════════════════════════════════════════════════════════
   PKG YAML v1.2
   - Aggiunge input_text.frarik_posta_oggi_orari (orari consegne giornalieri)
   - Corregge indentazione choose (reset sett/mese ora funziona)
   - Aggiunge script separati per reset manuale sett/mese
   ══════════════════════════════════════════════════════════════ */
const _PKG_YAML = `###############################################################
#                                                             #
#   Package: Centro Controllo Posta                           #
#   Versione: 1.2  |  Frarik / Fratech                       #
#                                                             #
###############################################################
#
# INSTALLAZIONE COMPLETATA DA FRARIK DASHBOARD
# Verifica che in configuration.yaml sia presente:
#
#   homeassistant:
#     packages: !include_dir_named packages
#
# Poi: Strumenti sviluppatori → YAML → Ricarica tutto
#
###############################################################

homeassistant:
  customize:
    package.node_anchors:
      customize: &customize
        package: 'Frarik — Centro Controllo Posta'
        author: 'Frarik / Fratech'
        version: '1.2'

      setting:
        Sensore Cassetta: &sensore_cassetta
          "%%SENSORE_CASSETTA%%"

        MediaPlayer Google: &google
%%GOOGLE_LINES%%

        MediaPlayer Alexa: &alexa
%%ALEXA_LINES%%

        Notifiche Push: &push
%%PUSH_LINES%%


####################################################
notify:
  - name: frarik_posta
    platform: group
    services: *push


####################################################
counter:
  frarik_posta_oggi:
    name: "Posta — Consegne Oggi"
    icon: mdi:mailbox-up-outline

  frarik_posta_settimana:
    name: "Posta — Consegne Settimana"
    icon: mdi:calendar-week

  frarik_posta_mese:
    name: "Posta — Consegne Mese"
    icon: mdi:calendar-month-outline


####################################################
input_datetime:
  frarik_posta_ultima_consegna:
    name: "Posta — Ultima Consegna"
    has_date: true
    has_time: true
    icon: mdi:clock-check-outline

  frarik_posta_notifiche_media_inizio:
    name: "Posta — Inizio Notifiche Media"
    has_date: false
    has_time: true
    initial: "08:00"
    icon: mdi:bell-ring-outline

  frarik_posta_notifiche_media_fine:
    name: "Posta — Fine Notifiche Media"
    has_date: false
    has_time: true
    initial: "22:00"
    icon: mdi:bell-off-outline

  frarik_posta_notifiche_push_inizio:
    name: "Posta — Inizio Notifiche Push"
    has_date: false
    has_time: true
    initial: "07:00"
    icon: mdi:cellphone-message

  frarik_posta_notifiche_push_fine:
    name: "Posta — Fine Notifiche Push"
    has_date: false
    has_time: true
    initial: "23:00"
    icon: mdi:cellphone-off


####################################################
input_boolean:
  frarik_posta_notifiche_attive:
    name: "Posta — Notifiche Attive"
    icon: mdi:bell-outline

  frarik_posta_notifica_push:
    name: "Posta — Notifica Push"
    icon: mdi:cellphone-message

  frarik_posta_notifica_google:
    name: "Posta — Annuncio Google"
    icon: mdi:google-assistant

  frarik_posta_notifica_alexa:
    name: "Posta — Annuncio Alexa"
    icon: mdi:amazon-alexa


####################################################
input_text:
  frarik_posta_storico:
    name: "Posta — Storico Consegne"
    max: 255
    icon: mdi:history

  frarik_posta_oggi_orari:
    name: "Posta — Orari di Oggi"
    max: 255
    icon: mdi:clock-time-four-outline


####################################################
template:
  - sensor:
      - name: "Frarik Posta Versione"
        unique_id: frarik_posta_versione
        state: "1.2"
        icon: mdi:package-variant-closed

  - binary_sensor:
      - name: "Frarik Posta Ricevuta Oggi"
        unique_id: frarik_posta_ricevuta_oggi
        state: "{{ states('counter.frarik_posta_oggi') | int(0) > 0 }}"
        device_class: occupancy
        icon: "{{ 'mdi:mailbox-up' if states('counter.frarik_posta_oggi') | int(0) > 0 else 'mdi:mailbox-outline' }}"


####################################################
script:
  frarik_posta_reset_oggi:
    alias: "Frarik — Reset Posta Oggi"
    icon: mdi:restart
    sequence:
      - service: counter.reset
        target:
          entity_id: counter.frarik_posta_oggi
      - service: input_text.set_value
        target:
          entity_id: input_text.frarik_posta_oggi_orari
        data:
          value: ""

  frarik_posta_reset_settimana:
    alias: "Frarik — Reset Posta Settimana"
    icon: mdi:calendar-refresh
    sequence:
      - service: counter.reset
        target:
          entity_id: counter.frarik_posta_settimana

  frarik_posta_reset_mese:
    alias: "Frarik — Reset Posta Mese"
    icon: mdi:calendar-month
    sequence:
      - service: counter.reset
        target:
          entity_id: counter.frarik_posta_mese


####################################################
automation:

  - alias: "Frarik — Posta (arrivo)"
    id: frarik_posta_eventi
    description: "Rileva arrivo posta, aggiorna contatori, storico orari e invia notifiche"
    mode: single

    trigger:
      - platform: state
        entity_id: *sensore_cassetta
        from: 'off'
        to: 'on'

    condition: []

    action:
      - delay: '00:00:05'

      - condition: state
        entity_id: *sensore_cassetta
        state: 'on'

      - service: counter.increment
        target:
          entity_id: counter.frarik_posta_oggi

      - service: counter.increment
        target:
          entity_id: counter.frarik_posta_settimana

      - service: counter.increment
        target:
          entity_id: counter.frarik_posta_mese

      - service: input_datetime.set_datetime
        target:
          entity_id: input_datetime.frarik_posta_ultima_consegna
        data:
          datetime: "{{ now().strftime('%Y-%m-%d %H:%M:%S') }}"

      - service: input_text.set_value
        target:
          entity_id: input_text.frarik_posta_oggi_orari
        data:
          value: >-
            {% set cur = states('input_text.frarik_posta_oggi_orari') | trim %}
            {% set nuovo = now().strftime('%H:%M') %}
            {{ (cur ~ (',' if cur else '') ~ nuovo)[:255] }}

      - service: input_text.set_value
        target:
          entity_id: input_text.frarik_posta_storico
        data:
          value: >-
            {% set cur = states('input_text.frarik_posta_storico') | trim %}
            {% set nuovo = now().strftime('%d/%m %H:%M') %}
            {{ (nuovo ~ (' · ' if cur else '') ~ cur)[:255] }}

      - condition: state
        entity_id: input_boolean.frarik_posta_notifiche_attive
        state: 'on'

      - parallel:
          - choose:
              - conditions:
                  - condition: state
                    entity_id: input_boolean.frarik_posta_notifica_push
                    state: 'on'
                  - condition: time
                    after: input_datetime.frarik_posta_notifiche_push_inizio
                    before: input_datetime.frarik_posta_notifiche_push_fine
                sequence:
                  - service: notify.frarik_posta
                    data:
                      title: "🏡 Frarik — Posta"
                      message: >-
                        📭 Posta in arrivo!
                        🕐 Ore {{ now().strftime('%H:%M') }}
                        📦 {{ states('counter.frarik_posta_oggi') }}ª consegna di oggi
                        📅 Settimana: {{ states('counter.frarik_posta_settimana') }} consegne

          - choose:
              - conditions:
                  - condition: state
                    entity_id: input_boolean.frarik_posta_notifica_google
                    state: 'on'
                  - condition: time
                    after: input_datetime.frarik_posta_notifiche_media_inizio
                    before: input_datetime.frarik_posta_notifiche_media_fine
                sequence:
                  - service: tts.google_translate_say
                    data:
                      entity_id: *google
                      language: 'it'
                      message: >-
                        C'è Posta per Te!
                        {% if states('counter.frarik_posta_oggi') | int(0) > 1 %}
                        Sono {{ states('counter.frarik_posta_oggi') }} consegne oggi.
                        {% endif %}

          - choose:
              - conditions:
                  - condition: state
                    entity_id: input_boolean.frarik_posta_notifica_alexa
                    state: 'on'
                  - condition: time
                    after: input_datetime.frarik_posta_notifiche_media_inizio
                    before: input_datetime.frarik_posta_notifiche_media_fine
                sequence:
                  - service: notify.alexa_media
                    data:
                      target: *alexa
                      data:
                        type: announce
                        method: spoken
                      message: >-
                        C'è Posta per Te!
                        {% if states('counter.frarik_posta_oggi') | int(0) > 1 %}
                        Sono {{ states('counter.frarik_posta_oggi') }} consegne oggi.
                        {% endif %}


  - alias: "Frarik — Posta (reset automatico)"
    id: frarik_posta_reset_auto
    description: "Reset automatico: ogni mezzanotte (oggi), lunedì (settimana), 1° del mese (mese)"
    mode: single

    trigger:
      - platform: time
        at: '00:00:00'

    condition: []

    action:
      - service: counter.reset
        target:
          entity_id: counter.frarik_posta_oggi

      - service: input_text.set_value
        target:
          entity_id: input_text.frarik_posta_oggi_orari
        data:
          value: ""

      - choose:
          - conditions:
              - condition: template
                value_template: "{{ now().weekday() == 0 }}"
            sequence:
              - service: counter.reset
                target:
                  entity_id: counter.frarik_posta_settimana

      - choose:
          - conditions:
              - condition: template
                value_template: "{{ now().day == 1 }}"
            sequence:
              - service: counter.reset
                target:
                  entity_id: counter.frarik_posta_mese

###############################################################
#  Fine package — Frarik Centro Controllo Posta v1.2
###############################################################
`;

/* ── SVG cassetta postale ────────────────────────────────── */
function _svgMailbox(count,isOpen){
  const n=Math.min(count,4);
  const has=n>0;
  const [t,,b]=isOpen?['#16a34a','#15803d','#166534']:has?['#3b82f6','#2563eb','#1d4ed8']:['#475569','#334155','#1e293b'];
  const glow=isOpen?'rgba(34,197,94,.5)':has?'rgba(59,130,246,.55)':'rgba(0,0,0,0)';
  const pos=[[],[{x:29,r:0}],[{x:21,r:-14},{x:37,r:14}],[{x:17,r:-18},{x:29,r:0},{x:41,r:18}],[{x:13,r:-21},{x:22,r:-7},{x:36,r:7},{x:45,r:21}]];
  const env=(pos[n]||[]).map(({x,r},i)=>`
    <g transform="rotate(${r},${x},16)" style="animation:lpop .27s ${(i*.09).toFixed(2)}s cubic-bezier(.32,1.6,.56,1) both">
      <rect x="${x-9}" y="0" width="18" height="24" rx="3" fill="#fefce8" opacity=".96"/>
      <line x1="${x-9}" y1="0" x2="${x}" y2="8" stroke="#c8a060" stroke-width="1.3" stroke-linecap="round"/>
      <line x1="${x+9}" y1="0" x2="${x}" y2="8" stroke="#c8a060" stroke-width="1.3" stroke-linecap="round"/>
    </g>`).join('');
  return `<svg viewBox="0 0 58 72" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;filter:drop-shadow(0 8px 28px ${glow})">
    <defs>
      <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${t}"/><stop offset="100%" stop-color="${b}"/></linearGradient>
      <linearGradient id="hg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="rgba(255,255,255,.14)"/><stop offset="40%" stop-color="rgba(255,255,255,.04)"/><stop offset="100%" stop-color="rgba(0,0,0,.22)"/></linearGradient>
      <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(0,0,0,.9)"/><stop offset="100%" stop-color="rgba(0,0,0,.55)"/></linearGradient>
      <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(255,255,255,.25)"/><stop offset="100%" stop-color="rgba(255,255,255,.05)"/></linearGradient>
      <filter id="sf"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(0,0,0,.5)"/></filter>
    </defs>
    ${has?env:''}
    <rect x="3" y="16" width="52" height="50" rx="6" fill="url(#vg)"/>
    <rect x="3" y="16" width="52" height="50" rx="6" fill="url(#hg)"/>
    <rect x="1" y="11" width="56" height="9" rx="4" fill="${t}"/>
    <rect x="1" y="11" width="56" height="9" rx="4" fill="url(#tg)"/>
    <rect x="3" y="19" width="52" height="3" fill="rgba(0,0,0,.28)" rx="1"/>
    <rect x="6" y="28" width="46" height="16" rx="4" fill="rgba(0,0,0,.2)" filter="url(#sf)"/>
    <rect x="9" y="31" width="40" height="10" rx="5" fill="url(#sg)"/>
    <rect x="9" y="31" width="40" height="3" rx="2" fill="rgba(255,255,255,.14)"/>
    <rect x="9" y="40" width="40" height="1.5" rx=".5" fill="rgba(255,255,255,.09)"/>
    <rect x="3" y="16" width="52" height="50" rx="6" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="1"/>
    <circle cx="10" cy="56" r="3" fill="rgba(0,0,0,.45)"/><circle cx="10" cy="56" r="1.6" fill="rgba(255,255,255,.1)"/><line x1="8.5" y1="56" x2="11.5" y2="56" stroke="rgba(255,255,255,.15)" stroke-width=".7"/>
    <circle cx="48" cy="56" r="3" fill="rgba(0,0,0,.45)"/><circle cx="48" cy="56" r="1.6" fill="rgba(255,255,255,.1)"/><line x1="46.5" y1="56" x2="49.5" y2="56" stroke="rgba(255,255,255,.15)" stroke-width=".7"/>
    <circle cx="29" cy="52" r="4.5" fill="rgba(0,0,0,.55)"/><circle cx="29" cy="52" r="2.8" fill="#0c0f16"/><circle cx="28.2" cy="51.3" r="1" fill="rgba(255,255,255,.08)"/><rect x="28.1" y="53.5" width="1.8" height="4" rx=".9" fill="#0c0f16"/>
    ${has?`<circle cx="51" cy="14" r="8.5" fill="#fbbf24" stroke="#0d0b1e" stroke-width="2"/><text x="51" y="18.5" text-anchor="middle" fill="#1a1000" font-size="9" font-weight="900" font-family="system-ui,sans-serif">${count>9?'9+':count}</text>`:''}
    ${isOpen?`<circle cx="7" cy="14" r="6" fill="#22c55e" stroke="#0d0b1e" stroke-width="1.5"/><text x="7" y="18" text-anchor="middle" fill="#fff" font-size="7" font-weight="900" font-family="system-ui">✓</text>`:''}
  </svg>`;
}

/* ── Genera YAML con i dati utente ──────────────────────── */
function _buildCustomPkg(sensor,google,alexa,push){
  const ind='          ';
  return _PKG_YAML
    .replace('%%SENSORE_CASSETTA%%',sensor||'binary_sensor.IL_TUO_SENSORE')
    .replace('%%GOOGLE_LINES%%',google.length?google.map(e=>`${ind}- ${e}`).join('\n'):`${ind}# - media_player.IL_TUO_GOOGLE`)
    .replace('%%ALEXA_LINES%%',alexa.length?alexa.map(e=>`${ind}- ${e}`).join('\n'):`${ind}# - media_player.LA_TUA_ALEXA`)
    .replace('%%PUSH_LINES%%',push.length?push.map(s=>`${ind}- service: ${s}`).join('\n'):`${ind}# - service: IL_TUO_MOBILE_APP`);
}

/* ── Autocomplete ─────────────────────────────────────── */
let _acInput=null;
function _acShow(inputEl,hass,domain){
  _acInput=inputEl;
  const q=(inputEl.value||'').trim().toLowerCase();
  const all=Object.keys(hass?.states||{});
  let res=q?all.filter(id=>id.toLowerCase().includes(q)):all.filter(id=>id.startsWith(domain+'.'));
  if(domain) res.sort((a,b)=>(b.startsWith(domain+'.')?1:0)-(a.startsWith(domain+'.')?1:0));
  res=res.slice(0,8);
  _acHide();
  if(!res.length) return;
  const ac=document.createElement('div');
  ac.id='__frk_posta_ac__';
  const rect=inputEl.getBoundingClientRect();
  ac.style.cssText=`position:fixed;top:${rect.bottom+3}px;left:${rect.left}px;width:${rect.width}px;background:#0e0c1e;border:1px solid rgba(251,191,36,.35);border-radius:10px;overflow-y:auto;max-height:200px;z-index:999999;box-shadow:0 10px 40px rgba(0,0,0,.85);scrollbar-width:none`;
  const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hilite=id=>{
    if(!q) return `<span style="color:#fff">${esc(id)}</span>`;
    const i=id.toLowerCase().indexOf(q); if(i<0) return `<span style="color:#fff">${esc(id)}</span>`;
    return `<span style="color:#fff">${esc(id.slice(0,i))}<strong style="color:#fbbf24">${esc(id.slice(i,i+q.length))}</strong>${esc(id.slice(i+q.length))}</span>`;
  };
  ac.innerHTML=res.map(id=>`<div data-v="${esc(id)}" style="padding:8px 12px;font-size:12px;font-family:monospace;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${hilite(id)}</div>`).join('');
  ac.querySelectorAll('[data-v]').forEach(el=>{
    el.addEventListener('mousedown',e=>e.preventDefault());
    el.addEventListener('click',()=>{ if(_acInput){ _acInput.value=el.dataset.v; _acInput.dispatchEvent(new Event('input',{bubbles:true})); _acInput.focus(); } _acHide(); });
    el.addEventListener('mouseenter',()=>{ el.style.background='rgba(251,191,36,.12)'; });
    el.addEventListener('mouseleave',()=>{ el.style.background=''; });
  });
  document.body.appendChild(ac);
}
function _acHide(){ document.getElementById('__frk_posta_ac__')?.remove(); }

/* ══════════════════════════════════════════════════════════════
   PostaCard — custom element
   ══════════════════════════════════════════════════════════════ */
let PostaCard;
if(!customElements.get('posta-card')){
  PostaCard=class extends HTMLElement{
    static getStubConfig(){ return {storageKey:''}; }

    constructor(){
      super();
      this.attachShadow({mode:'open'});
      this._h=null;
      this._c={storageKey:'',label:'Centro Posta',sensorEntity:''};
      this._frarikCard=null;
      this._modalHost=null;
      this._click=this._onClick.bind(this);
      this._change=this._onChange.bind(this);
      this._prevSig='';
      this._drawerOpen=false;
    }

    set hass(h){
      this._h=h;
      const sig=[
        h?.states?.['sensor.frarik_posta_versione']?.state,
        h?.states?.['counter.frarik_posta_oggi']?.state,
        h?.states?.['counter.frarik_posta_settimana']?.state,
        h?.states?.['counter.frarik_posta_mese']?.state,
        h?.states?.['input_datetime.frarik_posta_ultima_consegna']?.state,
        h?.states?.['input_text.frarik_posta_oggi_orari']?.state,
        h?.states?.['input_boolean.frarik_posta_notifiche_attive']?.state,
        h?.states?.['input_boolean.frarik_posta_notifica_push']?.state,
        h?.states?.['input_boolean.frarik_posta_notifica_google']?.state,
        h?.states?.['input_boolean.frarik_posta_notifica_alexa']?.state,
        h?.states?.['input_datetime.frarik_posta_notifiche_media_inizio']?.state,
        h?.states?.['input_datetime.frarik_posta_notifiche_media_fine']?.state,
        h?.states?.['input_datetime.frarik_posta_notifiche_push_inizio']?.state,
        h?.states?.['input_datetime.frarik_posta_notifiche_push_fine']?.state,
        this._c.sensorEntity?h?.states?.[this._c.sensorEntity]?.state:'',
      ].join('|');
      if(sig===this._prevSig) return;
      this._prevSig=sig;
      this._build();
    }

    setConfig(cfg){
      const sk=cfg.storageKey||'';
      let stored={};
      try{ stored=JSON.parse(localStorage.getItem('posta-card:'+sk)||'{}'); }catch(_){}
      this._c={storageKey:sk,label:'Centro Posta',sensorEntity:'',...stored};
      this._build();
    }

    configure(card){ if(card?.id) this._frarikCard=card; this._openSettings(); }
    connectedCallback(){ this.shadowRoot.addEventListener('click',this._click); this.shadowRoot.addEventListener('change',this._change); }
    disconnectedCallback(){ this.shadowRoot.removeEventListener('click',this._click); this.shadowRoot.removeEventListener('change',this._change); this._destroyModal(); _acHide(); }

    /* ── helpers ── */
    _skKey(){ return 'posta-card:'+(this._c.storageKey||'default'); }
    _save(){ try{ localStorage.setItem(this._skKey(),JSON.stringify(this._c)); }catch(_){} }
    _st(eid){ return this._h?.states?.[eid]?.state; }
    _isPkg(){ return !!this._h?.states?.['sensor.frarik_posta_versione']; }
    _today(){ return parseInt(this._st('counter.frarik_posta_oggi')||'0',10); }
    _week(){ return parseInt(this._st('counter.frarik_posta_settimana')||'0',10); }
    _month(){ return parseInt(this._st('counter.frarik_posta_mese')||'0',10); }
    _isOpen(){ return this._c.sensorEntity?this._st(this._c.sensorEntity)==='on':false; }
    _bool(eid){ return this._st(eid)==='on'; }

    _lastDelivery(){
      const s=this._st('input_datetime.frarik_posta_ultima_consegna');
      if(!s||s==='unknown'||s==='unavailable') return null;
      try{
        const d=new Date(s); if(isNaN(d)) return null;
        const now=new Date();
        const isToday=d.toDateString()===now.toDateString();
        const isYest=new Date(now-86400000).toDateString()===d.toDateString();
        const hhmm=d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
        return isToday?`oggi alle ${hhmm}`:isYest?`ieri alle ${hhmm}`:d.toLocaleDateString('it-IT',{day:'2-digit',month:'short'})+' alle '+hhmm;
      }catch(_){ return null; }
    }

    _orariOggi(){
      const s=this._st('input_text.frarik_posta_oggi_orari')||'';
      if(!s||s==='unknown'||s==='unavailable') return [];
      return s.split(',').map(t=>t.trim()).filter(Boolean);
    }

    _getTime(eid){
      const s=this._st(eid);
      return(s&&s!=='unknown'&&s!=='unavailable')?s.substring(0,5):'';
    }

    _callSvc(domain,service,data){
      if(this._h?.callService) this._h.callService(domain,service,data);
      else window.frarikCallService?.(domain,service,data,{});
    }

    _onChange(e){
      const inp=e.target.closest('[data-a]'); if(!inp) return;
      const a=inp.dataset.a,v=inp.value||'';
      if(a==='set-media-start') this._setTime('input_datetime.frarik_posta_notifiche_media_inizio',v);
      else if(a==='set-media-end') this._setTime('input_datetime.frarik_posta_notifiche_media_fine',v);
      else if(a==='set-push-start') this._setTime('input_datetime.frarik_posta_notifiche_push_inizio',v);
      else if(a==='set-push-end') this._setTime('input_datetime.frarik_posta_notifiche_push_fine',v);
    }
    _setTime(eid,v){ if(!v) return; this._callSvc('input_datetime','set_datetime',{entity_id:eid,time:v+':00'}); }

    _build(){
      if(!this.shadowRoot) return;
      this.shadowRoot.innerHTML=this._isPkg()?this._renderMain():this._renderNotInstalled();
    }

    /* ── render: pkg non installato ── */
    _renderNotInstalled(){
      return `<style>${this._css()}</style>
      <div class="card">
        <div class="hdr">
          <div class="hdr-ico">📬</div>
          <div class="hdr-tit">${this._c.label||'Centro Posta'}</div>
        </div>
        <div class="ni">
          <div class="ni-icon">📦</div>
          <div class="ni-title">Package non installato</div>
          <div class="ni-sub">Installa il package dallo <strong>Store Frarik</strong>, poi riavvia Home Assistant per attivarlo.</div>
        </div>
      </div>`;
    }

    /* ── render: principale ── */
    _renderMain(){
      const today=this._today(), week=this._week(), month=this._month();
      const isOpen=this._isOpen(), last=this._lastDelivery();
      const orari=this._orariOggi();
      const master=this._bool('input_boolean.frarik_posta_notifiche_attive');
      const bPush=this._bool('input_boolean.frarik_posta_notifica_push');
      const bGoog=this._bool('input_boolean.frarik_posta_notifica_google');
      const bAlex=this._bool('input_boolean.frarik_posta_notifica_alexa');
      const mStart=this._getTime('input_datetime.frarik_posta_notifiche_media_inizio')||'08:00';
      const mEnd=this._getTime('input_datetime.frarik_posta_notifiche_media_fine')||'22:00';
      const pStart=this._getTime('input_datetime.frarik_posta_notifiche_push_inizio')||'07:00';
      const pEnd=this._getTime('input_datetime.frarik_posta_notifiche_push_fine')||'23:00';

      const tgl=on=>`<div class="tgl${on?' on':''}"><div class="tgl-k"></div></div>`;

      /* lista orari arrivo */
      let orariHtml='';
      if(orari.length){
        orariHtml=orari.map((t,i)=>{
          const isLast=i===orari.length-1;
          return `<div class="orario-row${isLast?' last':''}">
            <div class="orario-dot"></div>
            <div class="orario-time">${t}</div>
            ${isLast?'<div class="orario-badge">ultima</div>':''}
          </div>`;
        }).join('');
      } else {
        orariHtml=`<div class="orari-empty">Nessuna consegna registrata oggi</div>`;
      }

      /* drawer impostazioni */
      const drawerHtml=this._drawerOpen?`
      <div class="drawer">
        <div class="drw-sec">NOTIFICHE</div>
        <div class="drw-row" data-a="toggle-master">
          <span class="drw-row-ico">🔔</span>
          <span class="drw-row-lbl">Tutte le notifiche</span>
          ${tgl(master)}
        </div>
        <div class="drw-sub${master?'':' locked'}">
          <div class="drw-row" data-a="toggle-push">
            <span class="drw-row-ico">📱</span><span class="drw-row-lbl">Push smartphone</span>${tgl(bPush)}
          </div>
          <div class="drw-row" data-a="toggle-google">
            <span class="drw-row-ico">🔊</span><span class="drw-row-lbl">Google Home</span>${tgl(bGoog)}
          </div>
          <div class="drw-row" data-a="toggle-alexa">
            <span class="drw-row-ico">📣</span><span class="drw-row-lbl">Amazon Alexa</span>${tgl(bAlex)}
          </div>
        </div>

        <div class="drw-sec" style="margin-top:10px">ORARI MEDIA (Google / Alexa)</div>
        <div class="time-row">
          <span class="time-lbl">Dalle</span>
          <input class="time-inp" type="time" data-a="set-media-start" value="${mStart}">
          <span class="time-lbl">alle</span>
          <input class="time-inp" type="time" data-a="set-media-end" value="${mEnd}">
        </div>

        <div class="drw-sec" style="margin-top:8px">ORARI PUSH (Smartphone)</div>
        <div class="time-row">
          <span class="time-lbl">Dalle</span>
          <input class="time-inp" type="time" data-a="set-push-start" value="${pStart}">
          <span class="time-lbl">alle</span>
          <input class="time-inp" type="time" data-a="set-push-end" value="${pEnd}">
        </div>

        <div class="drw-sec" style="margin-top:10px">RESET MANUALI</div>
        <div class="reset-row">
          <button class="rst-btn" data-a="reset-oggi">🔄 Oggi</button>
          <button class="rst-btn" data-a="reset-sett">📅 Settimana</button>
          <button class="rst-btn" data-a="reset-mese">🗓️ Mese</button>
        </div>

        <div class="drw-sec" style="margin-top:10px">CONFIGURAZIONE</div>
        <button class="cfg-btn" data-a="open-wizard">🔧 Riconfigura sensori e dispositivi</button>
      </div>`:''

      return `<style>${this._css()}</style>
      <div class="card">

        <div class="hdr">
          <div class="hdr-ico">📬</div>
          <div class="hdr-tit">${this._c.label||'Centro Posta'}</div>
          <div class="hdr-status${today>0?' active':''}">
            <div class="hdr-dot"></div>
            <span class="hdr-slbl">${today>0?'Posta ricevuta':'Nessuna posta'}</span>
          </div>
        </div>

        <div class="body-scroll">

          <div class="main-row">
            <div class="mb-col">${_svgMailbox(today,isOpen)}</div>
            <div class="main-info">
              <div class="big-num${today>0?' active':''}${isOpen?' open':''}">${today}</div>
              <div class="big-lbl">consegn${today===1?'a':'e'} oggi</div>
              ${last?`<div class="last-row"><span class="last-ico">🕐</span><span class="last-txt">${last}</span></div>`:''}
              ${isOpen?'<div class="open-pill">📬 Cassetta aperta</div>':''}
            </div>
          </div>

          <div class="section">
            <div class="sec-hdr">
              <div class="sec-line"></div>
              <span class="sec-lbl">Consegne di oggi</span>
              <div class="sec-line"></div>
            </div>
            <div class="orari-list">${orariHtml}</div>
          </div>

          <div class="stats-bar">
            <div class="stat">
              <span class="stat-n">${week}</span>
              <span class="stat-l">Settimana</span>
            </div>
            <div class="stat-sep"></div>
            <div class="stat">
              <span class="stat-n">${month}</span>
              <span class="stat-l">Mese</span>
            </div>
          </div>

          <div class="drawer-toggle" data-a="toggle-drawer">
            <span class="drw-ico">⚙️</span>
            <span class="drw-lbl">Impostazioni</span>
            <span class="drw-chev">${this._drawerOpen?'▲':'▼'}</span>
          </div>

          ${drawerHtml}

        </div>
      </div>`;
    }

    /* ── click handler ── */
    _onClick(e){
      const b=e.target.closest('[data-a]'); if(!b) return;
      const a=b.dataset.a;
      if(a==='toggle-drawer'){
        this._drawerOpen=!this._drawerOpen;
        this._prevSig='';
        this._build();
      }
      else if(a==='toggle-master') this._callSvc('homeassistant',this._bool('input_boolean.frarik_posta_notifiche_attive')?'turn_off':'turn_on',{entity_id:'input_boolean.frarik_posta_notifiche_attive'});
      else if(a==='toggle-push'){ if(this._bool('input_boolean.frarik_posta_notifiche_attive')) this._callSvc('homeassistant',this._bool('input_boolean.frarik_posta_notifica_push')?'turn_off':'turn_on',{entity_id:'input_boolean.frarik_posta_notifica_push'}); }
      else if(a==='toggle-google'){ if(this._bool('input_boolean.frarik_posta_notifiche_attive')) this._callSvc('homeassistant',this._bool('input_boolean.frarik_posta_notifica_google')?'turn_off':'turn_on',{entity_id:'input_boolean.frarik_posta_notifica_google'}); }
      else if(a==='toggle-alexa'){ if(this._bool('input_boolean.frarik_posta_notifiche_attive')) this._callSvc('homeassistant',this._bool('input_boolean.frarik_posta_notifica_alexa')?'turn_off':'turn_on',{entity_id:'input_boolean.frarik_posta_notifica_alexa'}); }
      else if(a==='reset-oggi') this._confirmReset('script.frarik_posta_reset_oggi','il contatore giornaliero e gli orari di oggi');
      else if(a==='reset-sett') this._confirmReset('script.frarik_posta_reset_settimana','il contatore settimanale');
      else if(a==='reset-mese') this._confirmReset('script.frarik_posta_reset_mese','il contatore mensile');
      else if(a==='open-wizard'){ this._destroyModal(); PostaCard.openWizard(this._h,()=>{}); }
    }

    /* ── confirm reset ── */
    _confirmReset(scriptId,label){
      this._destroyModal();
      const host=document.createElement('div'); this._modalHost=host;
      host.attachShadow({mode:'open'}); document.body.appendChild(host);
      const self=this;
      host.shadowRoot.innerHTML=`<style>
        *{box-sizing:border-box;margin:0;padding:0}
        .ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.65);backdrop-filter:blur(6px)}
        .mo{width:100%;background:#0a0816;border:1px solid rgba(239,68,68,.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:su .2s cubic-bezier(.32,1.12,.56,1)}
        @keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .mhdr{display:flex;align-items:center;gap:10px;padding:16px 18px 12px;border-bottom:1px solid rgba(255,255,255,.07)}
        .mico{width:36px;height:36px;border-radius:10px;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
        .mtit{flex:1;font-size:15px;font-weight:800;color:#fff;font-family:system-ui,sans-serif}
        .mxbtn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:6px 12px;color:#fff;font-size:13px;cursor:pointer;font-family:system-ui,sans-serif}
        p{font-family:system-ui,sans-serif;font-size:13px;color:rgba(255,255,255,.65);line-height:1.7;padding:14px 18px 8px}
        .btns{display:flex;gap:10px;padding:8px 18px 28px}
        button{flex:1;padding:13px;border-radius:12px;font-size:13px;font-weight:800;cursor:pointer;font-family:system-ui,sans-serif;color:#fff;border:none}
        .bconf{background:rgba(239,68,68,.7);border:1.5px solid rgba(239,68,68,.5)}
        .bcanc{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15)}
      </style>
      <div class="ov"><div class="mo">
        <div class="mhdr"><div class="mico">🔄</div><div class="mtit">Reset contatore</div><button class="mxbtn" id="c-x">✕</button></div>
        <p>Azzerare ${label}?</p>
        <div class="btns">
          <button class="bcanc" id="c-no">Annulla</button>
          <button class="bconf" id="c-yes">Sì, azzera</button>
        </div>
      </div></div>`;
      const sr=host.shadowRoot;
      sr.getElementById('c-x').onclick=()=>self._destroyModal();
      sr.getElementById('c-no').onclick=()=>self._destroyModal();
      sr.getElementById('c-yes').onclick=()=>{ self._destroyModal(); self._callSvc('script','turn_on',{entity_id:scriptId}); };
    }

    /* ── popup impostazioni card (matita dashboard) ── */
    _openSettings(){
      this._destroyModal(); _acHide();
      const host=document.createElement('div'); this._modalHost=host;
      host.attachShadow({mode:'open'}); document.body.appendChild(host);
      const self=this, c=this._c;
      host.shadowRoot.innerHTML=`<style>
        *{box-sizing:border-box;margin:0;padding:0}
        .ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.65);backdrop-filter:blur(6px)}
        .mo{width:100%;max-height:80vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(139,92,246,.32);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.8);animation:su .22s cubic-bezier(.32,1.12,.56,1)}
        @keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .mhdr{display:flex;align-items:center;gap:12px;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0}
        .mico{width:40px;height:40px;border-radius:12px;background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
        .mtit{flex:1;font-size:16px;font-weight:900;color:#fff;font-family:system-ui,sans-serif}
        .mxbtn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:6px 14px;color:#fff;font-size:13px;cursor:pointer;font-family:system-ui,sans-serif}
        .mbody{overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px;scrollbar-width:none}
        .flbl{font-size:11px;font-weight:800;color:rgba(255,255,255,.45);letter-spacing:.7px;text-transform:uppercase;font-family:system-ui,sans-serif;margin-bottom:6px;display:flex;align-items:center;gap:6px}
        .fopt{font-size:10px;font-weight:700;background:rgba(255,255,255,.07);color:rgba(255,255,255,.4);padding:2px 6px;border-radius:5px;text-transform:none;letter-spacing:0}
        .finp{width:100%;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.11);border-radius:10px;padding:11px 13px;color:#fff;font-size:13px;font-family:system-ui,sans-serif;outline:none;transition:border-color .15s}
        .finp:focus{border-color:rgba(251,191,36,.5)}
        .fhint{font-size:11px;color:rgba(255,255,255,.32);margin-top:5px;font-family:system-ui,sans-serif;line-height:1.5}
        .fsave{width:100%;padding:14px;border-radius:13px;background:#fbbf24;border:none;color:#1a1a2e;font-size:14px;font-weight:900;cursor:pointer;font-family:system-ui,sans-serif}
      </style>
      <div class="ov"><div class="mo">
        <div class="mhdr">
          <div class="mico">📬</div>
          <div class="mtit">Impostazioni Card</div>
          <button class="mxbtn" id="s-x">✕</button>
        </div>
        <div class="mbody">
          <div>
            <div class="flbl">✏️ Etichetta</div>
            <input class="finp" id="s-label" type="text" value="${(c.label||'Centro Posta').replace(/"/g,'&quot;')}" placeholder="Centro Posta"/>
          </div>
          <div>
            <div class="flbl">📡 Sensore cassetta <span class="fopt">opzionale</span></div>
            <input class="finp" id="s-sensor" type="text" value="${(c.sensorEntity||'').replace(/"/g,'&quot;')}" placeholder="binary_sensor.cassetta_postale" autocomplete="off" spellcheck="false"/>
            <div class="fhint">Mostra "Cassetta aperta" quando il sensore è on</div>
          </div>
          <button class="fsave" id="s-save">💾 Salva</button>
        </div>
      </div></div>`;
      const sr=host.shadowRoot;
      sr.getElementById('s-x').onclick=()=>self._destroyModal();
      const sInp=sr.getElementById('s-sensor');
      sInp.addEventListener('focus',()=>_acShow(sInp,self._h,'binary_sensor'));
      sInp.addEventListener('blur',()=>setTimeout(_acHide,160));
      sInp.addEventListener('input',()=>_acShow(sInp,self._h,'binary_sensor'));
      sr.getElementById('s-save').onclick=()=>{
        self._c.label=sr.getElementById('s-label').value||'Centro Posta';
        self._c.sensorEntity=(sr.getElementById('s-sensor').value||'').trim();
        self._save(); _acHide(); self._destroyModal();
        self._prevSig=''; self._build();
      };
    }

    _destroyModal(){ this._modalHost?.remove(); this._modalHost=null; }

    /* ── CSS ── */
    _css(){ return `
:host{display:block;height:100%;font-family:system-ui,sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
@keyframes lpop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

.card{height:100%;display:flex;flex-direction:column;background:linear-gradient(160deg,#0d0b1e 0%,#0a0f1e 60%,#080b18 100%);border-radius:16px;overflow:hidden}

/* header */
.hdr{display:flex;align-items:center;gap:10px;padding:13px 16px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}
.hdr-ico{font-size:22px;line-height:1}
.hdr-tit{flex:1;font-size:15px;font-weight:900;color:#fff;letter-spacing:.3px}
.hdr-status{display:flex;align-items:center;gap:5px}
.hdr-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.18);transition:background .4s}
.hdr-status.active .hdr-dot{background:#4ade80;box-shadow:0 0 8px rgba(74,222,128,.6);animation:pulse 2.2s ease-in-out infinite}
.hdr-slbl{font-size:10px;font-weight:700;color:rgba(255,255,255,.3);letter-spacing:.3px}
.hdr-status.active .hdr-slbl{color:#4ade80}

/* body scroll */
.body-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none}
.body-scroll::-webkit-scrollbar{display:none}

/* main row */
.main-row{display:flex;align-items:center;gap:14px;padding:14px 16px 10px}
.mb-col{flex:0 0 38%;max-width:38%}
.main-info{flex:1;display:flex;flex-direction:column;gap:3px}
.big-num{font-size:52px;font-weight:900;color:rgba(255,255,255,.18);line-height:1;transition:color .4s;letter-spacing:-2px}
.big-num.active{color:#93c5fd}
.big-num.open{color:#4ade80}
.big-lbl{font-size:10px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.6px;margin-top:2px}
.last-row{display:flex;align-items:flex-start;gap:5px;margin-top:9px;padding:6px 10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:9px}
.last-ico{font-size:11px;margin-top:1px;flex-shrink:0}
.last-txt{font-size:12px;color:#c4d8f5;font-weight:600;line-height:1.4}
.open-pill{display:inline-flex;align-items:center;gap:5px;margin-top:6px;padding:4px 10px;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.25);border-radius:20px;font-size:11px;color:#4ade80;font-weight:700}

/* orari section */
.section{padding:0 16px 10px}
.sec-hdr{display:flex;align-items:center;gap:8px;margin-bottom:7px}
.sec-line{flex:1;height:1px;background:rgba(255,255,255,.06)}
.sec-lbl{font-size:9px;font-weight:800;color:rgba(255,255,255,.28);text-transform:uppercase;letter-spacing:.9px;white-space:nowrap}
.orari-list{display:flex;flex-direction:column;gap:4px}
.orario-row{display:flex;align-items:center;gap:10px;padding:9px 12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;animation:lpop .2s ease both}
.orario-row.last{background:rgba(74,222,128,.05);border-color:rgba(74,222,128,.18)}
.orario-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.2);flex-shrink:0}
.orario-row.last .orario-dot{background:#4ade80;box-shadow:0 0 7px rgba(74,222,128,.5)}
.orario-time{flex:1;font-size:16px;font-weight:800;color:#fff;font-variant-numeric:tabular-nums;letter-spacing:.5px}
.orario-badge{font-size:9px;font-weight:800;padding:2px 7px;border-radius:10px;background:rgba(74,222,128,.14);border:1px solid rgba(74,222,128,.28);color:#4ade80;text-transform:uppercase;letter-spacing:.4px}
.orari-empty{padding:14px;text-align:center;font-size:12px;color:rgba(255,255,255,.22);background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:10px}

/* stats bar */
.stats-bar{display:flex;align-items:stretch;margin:0 16px 12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;overflow:hidden}
.stat{flex:1;display:flex;flex-direction:column;align-items:center;padding:10px 8px;gap:2px}
.stat-sep{width:1px;background:rgba(255,255,255,.07)}
.stat-n{font-size:20px;font-weight:900;color:#fff;line-height:1}
.stat-l{font-size:9px;font-weight:700;color:rgba(255,255,255,.32);text-transform:uppercase;letter-spacing:.5px}

/* drawer toggle */
.drawer-toggle{display:flex;align-items:center;gap:8px;padding:11px 16px;background:rgba(255,255,255,.03);border-top:1px solid rgba(255,255,255,.07);cursor:pointer;user-select:none;transition:background .15s;flex-shrink:0}
.drawer-toggle:active{background:rgba(255,255,255,.07)}
.drw-ico{font-size:14px}
.drw-lbl{flex:1;font-size:12px;font-weight:700;color:rgba(255,255,255,.55)}
.drw-chev{font-size:11px;color:rgba(255,255,255,.3)}

/* drawer content */
.drawer{padding:12px 16px 18px;display:flex;flex-direction:column;gap:5px;animation:lpop .18s ease}
.drw-sec{font-size:9px;font-weight:800;color:rgba(255,255,255,.28);text-transform:uppercase;letter-spacing:.9px;margin-top:6px;margin-bottom:3px}
.drw-row{display:flex;align-items:center;gap:10px;padding:9px 12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:11px;cursor:pointer;user-select:none;transition:background .15s}
.drw-row:active{background:rgba(255,255,255,.09)}
.drw-row-ico{font-size:16px;flex-shrink:0}
.drw-row-lbl{flex:1;font-size:13px;font-weight:700;color:#fff}
.drw-sub{display:flex;flex-direction:column;gap:5px;padding-left:8px;transition:opacity .2s}
.drw-sub.locked{opacity:.3;pointer-events:none}

/* toggle switch */
.tgl{width:44px;height:26px;border-radius:13px;background:rgba(255,255,255,.15);position:relative;transition:background .2s;flex-shrink:0}
.tgl.on{background:#4ade80}
.tgl-k{width:22px;height:22px;border-radius:50%;background:#fff;position:absolute;top:2px;left:2px;transition:transform .2s;box-shadow:0 2px 5px rgba(0,0,0,.4)}
.tgl.on .tgl-k{transform:translateX(18px)}

/* time row */
.time-row{display:flex;align-items:center;gap:7px;padding:8px 12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:11px}
.time-lbl{font-size:11px;color:rgba(255,255,255,.45);min-width:28px}
.time-inp{flex:1;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:8px;color:#fff;font-size:12px;font-weight:700;padding:5px 7px;font-family:system-ui,sans-serif;appearance:none;text-align:center;outline:none}
.time-inp:focus{border-color:rgba(251,191,36,.55);background:rgba(251,191,36,.07)}

/* reset row */
.reset-row{display:flex;gap:7px}
.rst-btn{flex:1;padding:10px 4px;border-radius:11px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.22);color:rgba(255,255,255,.8);font-size:11px;font-weight:800;cursor:pointer;font-family:system-ui,sans-serif;transition:all .15s}
.rst-btn:active{background:rgba(239,68,68,.25)}

/* config btn */
.cfg-btn{width:100%;padding:11px 14px;border-radius:11px;background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.25);color:rgba(167,139,250,.9);font-size:12px;font-weight:700;cursor:pointer;font-family:system-ui,sans-serif;text-align:left;transition:all .15s}
.cfg-btn:active{background:rgba(139,92,246,.2)}

/* not installed */
.ni{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;padding:28px 18px}
.ni-icon{font-size:52px;line-height:1}
.ni-title{font-size:17px;font-weight:900;color:#fff}
.ni-sub{font-size:13px;color:rgba(255,255,255,.45);line-height:1.8;max-width:260px}
.ni-sub strong{color:#fbbf24;opacity:1}
`;}
  };
  customElements.define('posta-card',PostaCard);
} else {
  PostaCard=customElements.get('posta-card');
}

/* ══════════════════════════════════════════════════════════════
   openWizard — chiamato dallo Store quando si installa la card
   ══════════════════════════════════════════════════════════════ */
PostaCard.openWizard=function(hass,onDone){
  document.getElementById('__frk_posta_wizard__')?.remove();
  const host=document.createElement('div');
  host.id='__frk_posta_wizard__';
  host.attachShadow({mode:'open'});
  document.body.appendChild(host);
  const destroy=()=>{ _acHide(); host.remove(); };
  let _ridG=1,_ridA=1,_ridP=1;

  host.shadowRoot.innerHTML=`<style>
    *{box-sizing:border-box;margin:0;padding:0}
    .ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.72);backdrop-filter:blur(6px)}
    .mo{width:100%;max-height:88vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(251,191,36,.28);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.8);animation:su .22s cubic-bezier(.32,1.12,.56,1)}
    @keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
    .mhdr{display:flex;align-items:center;gap:12px;padding:18px 18px 14px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}
    .mico{width:40px;height:40px;border-radius:12px;background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
    .mtxt{flex:1}.mtit{font-size:15px;font-weight:900;color:#fff;font-family:system-ui,sans-serif}
    .msub{font-size:11px;color:rgba(255,255,255,.4);font-family:system-ui,sans-serif;margin-top:2px}
    .mxbtn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:8px;padding:6px 12px;color:#fff;font-size:13px;cursor:pointer;font-family:system-ui,sans-serif}
    .mbody{flex:1;overflow-y:auto;padding:16px 18px 4px;display:flex;flex-direction:column;gap:18px;scrollbar-width:none}
    .mbody::-webkit-scrollbar{display:none}
    .wsec{display:flex;flex-direction:column;gap:9px}
    .wsec-hdr{display:flex;align-items:center;gap:8px}
    .wsec-ico{font-size:17px;line-height:1}
    .wsec-ttl{font-size:12px;font-weight:900;color:#fff;letter-spacing:.6px;text-transform:uppercase;font-family:system-ui,sans-serif}
    .tag{font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;font-family:system-ui,sans-serif}
    .req{background:rgba(239,68,68,.2);color:#fca5a5;border:1px solid rgba(239,68,68,.3)}
    .opt{background:rgba(255,255,255,.07);color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.12)}
    .wsec-hint{font-size:11px;color:rgba(255,255,255,.42);font-family:system-ui,sans-serif;line-height:1.6}
    .wsec-hint code{background:rgba(255,255,255,.1);padding:1px 5px;border-radius:4px;font-size:10px;color:#fbbf24;font-family:monospace}
    .wlist{display:flex;flex-direction:column;gap:6px}
    .wrow{display:flex;gap:6px;align-items:center}
    .winp{flex:1;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 12px;color:#fff;font-size:13px;font-family:monospace;outline:none;transition:border-color .15s}
    .winp:focus{border-color:rgba(251,191,36,.55);background:rgba(255,255,255,.09)}
    .winp.err{border-color:rgba(239,68,68,.6)!important}
    .wrem{width:32px;height:32px;flex-shrink:0;border-radius:8px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.22);color:#fca5a5;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;font-family:system-ui,sans-serif}
    .wadd{align-self:flex-start;background:none;border:1px dashed rgba(255,255,255,.18);border-radius:9px;padding:7px 16px;color:rgba(255,255,255,.55);font-size:12px;font-weight:600;cursor:pointer;font-family:system-ui,sans-serif;transition:all .15s}
    .wadd:hover{opacity:.9;border-color:rgba(251,191,36,.45);color:#fbbf24}
    .werr{font-size:11px;color:#fca5a5;font-family:system-ui,sans-serif}
    .wdiv{height:1px;background:rgba(255,255,255,.06)}
    .mftr{padding:14px 18px 28px;flex-shrink:0;border-top:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;gap:8px}
    .wbtn-ok{width:100%;padding:14px;border-radius:13px;background:#fbbf24;border:none;color:#1a1a2e;font-size:14px;font-weight:900;cursor:pointer;font-family:system-ui,sans-serif}
    .wbtn-ok:disabled{opacity:.5;cursor:default}
    .winst-err{font-size:12px;color:#fca5a5;font-family:system-ui,sans-serif;text-align:center;display:none}
  </style>
  <div class="ov"><div class="mo" id="wiz_mo">
    <div class="mhdr">
      <div class="mico">📦</div>
      <div class="mtxt">
        <div class="mtit">Configura Package Posta</div>
        <div class="msub">Inserisci i tuoi sensori e dispositivi</div>
      </div>
      <button class="mxbtn" id="wiz_close">✕</button>
    </div>
    <div class="mbody">
      <div class="wsec">
        <div class="wsec-hdr"><span class="wsec-ico">📡</span><span class="wsec-ttl">Sensore Cassetta</span><span class="tag req">obbligatorio</span></div>
        <div class="wsec-hint">entity_id del binary sensor che si attiva (<strong>on</strong>) quando la cassetta viene aperta.</div>
        <div class="wlist"><div class="wrow" data-group="sensor">
          <input class="winp" id="w_sensor" placeholder="binary_sensor.cassetta_postale" type="text" autocomplete="off" spellcheck="false"/>
        </div></div>
        <div class="werr" id="w_sensor_err" style="display:none">⚠️ Campo obbligatorio</div>
      </div>
      <div class="wdiv"></div>
      <div class="wsec">
        <div class="wsec-hdr"><span class="wsec-ico">🔊</span><span class="wsec-ttl">Google Home / Nest</span><span class="tag opt">opzionale</span></div>
        <div class="wsec-hint">entity_id dei media player Google per annunci vocali.</div>
        <div class="wlist" id="w_google_list"><div class="wrow" data-group="google" data-rid="0">
          <input class="winp" placeholder="media_player.google_home_cucina" type="text" autocomplete="off" spellcheck="false"/>
          <button class="wrem" data-rid="0" data-grp="google">✕</button>
        </div></div>
        <button class="wadd" data-add="google">+ Aggiungi dispositivo</button>
      </div>
      <div class="wdiv"></div>
      <div class="wsec">
        <div class="wsec-hdr"><span class="wsec-ico">📣</span><span class="wsec-ttl">Amazon Alexa / Echo</span><span class="tag opt">opzionale</span></div>
        <div class="wsec-hint">entity_id dei media player Alexa. Richiede integrazione Alexa Media Player.</div>
        <div class="wlist" id="w_alexa_list"><div class="wrow" data-group="alexa" data-rid="0">
          <input class="winp" placeholder="media_player.alexa_cucina" type="text" autocomplete="off" spellcheck="false"/>
          <button class="wrem" data-rid="0" data-grp="alexa">✕</button>
        </div></div>
        <button class="wadd" data-add="alexa">+ Aggiungi dispositivo</button>
      </div>
      <div class="wdiv"></div>
      <div class="wsec">
        <div class="wsec-hdr"><span class="wsec-ico">📱</span><span class="wsec-ttl">Push Smartphone</span><span class="tag opt">opzionale</span></div>
        <div class="wsec-hint">Nome servizio mobile_app (parte dopo <code>notify.</code>).</div>
        <div class="wlist" id="w_push_list"><div class="wrow" data-group="push" data-rid="0">
          <input class="winp" placeholder="mobile_app_iphone_mario" type="text" autocomplete="off" spellcheck="false"/>
          <button class="wrem" data-rid="0" data-grp="push">✕</button>
        </div></div>
        <button class="wadd" data-add="push">+ Aggiungi smartphone</button>
      </div>
    </div>
    <div class="mftr">
      <button class="wbtn-ok" id="wiz_install">⚡ Installa Package</button>
      <div class="winst-err" id="wiz_inst_err"></div>
    </div>
  </div></div>`;

  const sr=host.shadowRoot;
  sr.getElementById('wiz_close').addEventListener('click',()=>destroy());

  sr.getElementById('wiz_mo').addEventListener('click',e=>{
    const addBtn=e.target.closest('[data-add]');
    if(addBtn){
      const grp=addBtn.dataset.add;
      const rid=(grp==='google'?_ridG++:grp==='alexa'?_ridA++:_ridP++);
      const listEl=sr.getElementById(`w_${grp}_list`);
      const ph={google:'media_player.google_home_2',alexa:'media_player.alexa_2',push:'mobile_app_samsung_2'}[grp]||'';
      const row=document.createElement('div');
      row.className='wrow'; row.dataset.group=grp; row.dataset.rid=rid;
      row.innerHTML=`<input class="winp" placeholder="${ph}" type="text" autocomplete="off" spellcheck="false"/><button class="wrem" data-rid="${rid}" data-grp="${grp}">✕</button>`;
      listEl.appendChild(row);
      const ni=row.querySelector('.winp'); ni.focus(); _bindAcW(ni,grp);
      return;
    }
    const remBtn=e.target.closest('.wrem');
    if(remBtn){ const row=remBtn.closest('.wrow'); if(row){ _acHide(); row.remove(); } }
  });

  sr.getElementById('wiz_install').addEventListener('click',async()=>{
    const sensor=(sr.getElementById('w_sensor').value||'').trim();
    const errEl=sr.getElementById('w_sensor_err');
    if(!sensor){
      errEl.style.display=''; sr.getElementById('w_sensor').classList.add('err'); sr.getElementById('w_sensor').focus(); return;
    }
    errEl.style.display='';
    const _vals=g=>[...sr.querySelectorAll(`#w_${g}_list .winp`)].map(i=>i.value.trim()).filter(Boolean);
    const yaml=_buildCustomPkg(sensor,_vals('google'),_vals('alexa'),_vals('push'));
    const btn=sr.getElementById('wiz_install'), errBnr=sr.getElementById('wiz_inst_err');
    btn.textContent='⚙️ Installazione…'; btn.disabled=true; errBnr.style.display='none';
    try{
      const m=location.pathname.match(/^(.*\/api\/hassio_ingress\/[^/]+)/);
      const base=location.origin+(m?m[1]:'');
      const r=await fetch(base+'/api/frarik/pkg/install',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'frarik/frarik_posta.yaml',content:yaml})});
      const j=await r.json().catch(()=>({}));
      if(r.ok&&j.ok){
        _acHide();
        sr.getElementById('wiz_mo').querySelector('.mbody').innerHTML=`
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:36px 20px;gap:16px;text-align:center">
            <div style="font-size:52px">✅</div>
            <div style="font-size:16px;font-weight:900;color:#fff;font-family:system-ui,sans-serif">Package installato!</div>
            <div style="font-size:13px;color:rgba(255,255,255,.6);font-family:system-ui,sans-serif;line-height:1.8">
              Riavvia <strong style="color:#fbbf24;opacity:1">Home Assistant</strong> per attivare le entità.<br>
              Poi torna nello Store e aggiungi la card alla dashboard.
            </div>
          </div>`;
        sr.getElementById('wiz_mo').querySelector('.mftr').innerHTML=`<button class="wbtn-ok" id="wiz_done" style="background:rgba(34,197,94,.85);color:#fff">Chiudi</button>`;
        sr.getElementById('wiz_done').addEventListener('click',()=>{ destroy(); if(typeof onDone==='function') onDone(); });
      } else {
        btn.textContent='⚡ Installa Package'; btn.disabled=false;
        errBnr.textContent='⚠️ Errore: '+(j.error||('HTTP '+r.status)); errBnr.style.display='';
      }
    }catch(e){
      btn.textContent='⚡ Installa Package'; btn.disabled=false;
      errBnr.textContent='⚠️ '+e.message; errBnr.style.display='';
    }
  });

  const domainMap={sensor:'binary_sensor',google:'media_player',alexa:'media_player'};
  function _bindAcW(inp,grp){
    if(grp==='push') return;
    const domain=domainMap[grp]||'';
    inp.addEventListener('focus',()=>_acShow(inp,hass,domain));
    inp.addEventListener('blur',()=>setTimeout(_acHide,160));
    inp.addEventListener('input',()=>_acShow(inp,hass,domain));
  }
  sr.querySelectorAll('.winp').forEach(inp=>{
    const grp=inp.closest('[data-group]')?.dataset.group||'sensor';
    _bindAcW(inp,grp);
  });
  sr.getElementById('w_sensor').addEventListener('input',()=>{ sr.getElementById('w_sensor_err').style.display='none'; sr.getElementById('w_sensor').classList.remove('err'); });
  setTimeout(()=>sr.getElementById('w_sensor')?.focus(),80);
};

/* ── registrazione customCards ── */
const _ccArr=(window.customCards=window.customCards||[]);
const _ccIdx=_ccArr.findIndex(c=>c&&c.type==='posta-card');
const _ccEntry={type:'posta-card',name:'Centro Controllo Posta',description:'Monitora la cassetta postale: consegne giornaliere con orari, storico, notifiche push/Google/Alexa.',icon:'mdi:mailbox',frarik_pkg_check:'sensor.frarik_posta_versione',frarik_pkg_version:'1.2'};
if(_ccIdx>=0) _ccArr[_ccIdx]=_ccEntry; else _ccArr.push(_ccEntry);
})();
