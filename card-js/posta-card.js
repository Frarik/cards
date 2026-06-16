/* frarik-version: 1.6 */
/* Centro Controllo Posta — Frarik card standalone */
(function(){
  'use strict';
  if(customElements.get('posta-card')) return;

  const _PKG_YAML = `###############################################################
#                                                             #
#   ███████╗██████╗  █████╗ ██████╗ ██╗██╗  ██╗             #
#   ██╔════╝██╔══██╗██╔══██╗██╔══██╗██║██║ ██╔╝             #
#   █████╗  ██████╔╝███████║██████╔╝██║█████╔╝              #
#   ██╔══╝  ██╔══██╗██╔══██║██╔══██╗██║██╔═██╗              #
#   ██║     ██║  ██║██║  ██║██║  ██║██║██║  ██╗             #
#   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝            #
#                                                             #
#   Package: Centro Controllo Posta                           #
#   Versione: 1.0  |  Frarik / Fratech                       #
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
        version: 1.0

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


####################################################
input_datetime:
  frarik_posta_ultima_consegna:
    name: "Posta — Ultima Consegna"
    has_date: true
    has_time: true
    icon: mdi:clock-check-outline

  frarik_posta_notifiche_inizio:
    name: "Posta — Inizio Notifiche TTS"
    has_date: false
    has_time: true
    icon: mdi:bell-ring-outline

  frarik_posta_notifiche_fine:
    name: "Posta — Fine Notifiche TTS"
    has_date: false
    has_time: true
    icon: mdi:bell-off-outline


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


####################################################
template:
  - sensor:
      - name: "Frarik Posta Versione"
        unique_id: frarik_posta_versione
        state: "1.0"
        icon: mdi:package-variant-closed

  - binary_sensor:
      - name: "Frarik Posta Ricevuta Oggi"
        unique_id: frarik_posta_ricevuta_oggi
        state: "{{ states('counter.frarik_posta_oggi') | int(0) > 0 }}"
        device_class: occupancy
        icon: "{{ 'mdi:mailbox-up' if states('counter.frarik_posta_oggi') | int(0) > 0 else 'mdi:mailbox-outline' }}"


####################################################
script:
  frarik_posta_reset:
    alias: "Frarik — Reset Contatore Posta"
    icon: mdi:restart
    sequence:
      - service: counter.reset
        target:
          entity_id: counter.frarik_posta_oggi
      - service: input_text.set_value
        target:
          entity_id: input_text.frarik_posta_storico
        data:
          value: ""


####################################################
automation:

  - alias: "Frarik — Posta (eventi)"
    id: frarik_posta_eventi
    description: "Rileva arrivo posta, aggiorna contatori e invia notifiche"
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

      - service: input_datetime.set_datetime
        target:
          entity_id: input_datetime.frarik_posta_ultima_consegna
        data:
          datetime: "{{ now().strftime('%Y-%m-%d %H:%M:%S') }}"

      - service: input_text.set_value
        target:
          entity_id: input_text.frarik_posta_storico
        data:
          value: >-
            {% set attuale = states('input_text.frarik_posta_storico') %}
            {% set nuova = now().strftime('%d/%m %H:%M') %}
            {% if attuale | length > 0 %}
              {{ (nuova ~ ' · ' ~ attuale)[:255] }}
            {% else %}
              {{ nuova }}
            {% endif %}

      - condition: state
        entity_id: input_boolean.frarik_posta_notifiche_attive
        state: 'on'

      - parallel:

          - choose:
            - conditions:
              - condition: state
                entity_id: input_boolean.frarik_posta_notifica_push
                state: 'on'
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
                after: input_datetime.frarik_posta_notifiche_inizio
                before: input_datetime.frarik_posta_notifiche_fine
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
                after: input_datetime.frarik_posta_notifiche_inizio
                before: input_datetime.frarik_posta_notifiche_fine
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

  - alias: "Frarik — Posta (reset)"
    id: frarik_posta_reset
    description: "Reset giornaliero e settimanale dei contatori posta"
    mode: single

    trigger:
      - platform: time
        at: '00:00:00'

    condition: []

    action:
      - service: counter.reset
        target:
          entity_id: counter.frarik_posta_oggi

      - choose:
        - conditions:
          - condition: template
            value_template: "{{ now().weekday() == 0 }}"
          sequence:
          - service: counter.reset
            target:
              entity_id: counter.frarik_posta_settimana

###############################################################
#  Fine package — Frarik Centro Controllo Posta v1.0
###############################################################
`;

  const _PC={
    bg:'linear-gradient(160deg,#0d0b1e 0%,#0a0f1e 60%,#080b18 100%)',
    bodyNoMail:'#1a2744',topNoMail:'#131d38',doorNoMail:'#0f1a32',
    bodyMail:'#2d1b69',topMail:'#1e0f4a',doorMail:'#221354',
    bodyOpen:'#1a2a0d',topOpen:'#142208',doorOpen:'#102007',
  };

  function _svgBox(state){
    const hasMail=state==='mail',isOpen=state==='open';
    const body=hasMail?_PC.bodyMail:isOpen?_PC.bodyOpen:_PC.bodyNoMail;
    const top=hasMail?_PC.topMail:isOpen?_PC.topOpen:_PC.topNoMail;
    const door=hasMail?_PC.doorMail:isOpen?_PC.doorOpen:_PC.doorNoMail;
    const glow=hasMail?'rgba(167,139,250,.35)':isOpen?'rgba(74,222,128,.3)':'rgba(99,102,241,.15)';
    const flagUp=hasMail||isOpen;
    const envelope=hasMail?`<g class="letter-bob"><rect x="46" y="62" width="60" height="42" rx="5" fill="white" opacity=".96"/><path d="M46,62 L76,86 L106,62" fill="none" stroke="#d1d5db" stroke-width="2"/><rect x="56" y="82" width="40" height="4" rx="2" fill="#e5e7eb" opacity=".7"/></g>`:'';
    const openDoor=isOpen?`<g transform="rotate(-42,32,80)"><rect x="32" y="80" width="72" height="50" rx="9" fill="${door}" opacity=".9"/></g>`:'';
    const sp=hasMail?`<circle class="sp1" cx="18" cy="44" r="5" fill="#fbbf24"/><circle class="sp2" cx="184" cy="40" r="4" fill="#a78bfa"/><circle class="sp3" cx="12" cy="86" r="3" fill="#34d399"/><text x="168" y="30" font-size="16" class="sp5">✨</text>`:'';
    const osp=isOpen?`<circle class="sp1" cx="16" cy="50" r="4" fill="#4ade80"/><text x="170" y="34" font-size="14" class="sp5">📬</text>`:'';
    return `<svg viewBox="0 0 200 190" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:180px;filter:drop-shadow(0 8px 32px ${glow})">
      <defs>
        <linearGradient id="pg_body" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(255,255,255,.12)"/><stop offset="100%" stop-color="rgba(0,0,0,.18)"/></linearGradient>
        <linearGradient id="pg_door" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(255,255,255,.06)"/><stop offset="100%" stop-color="rgba(0,0,0,.22)"/></linearGradient>
        <filter id="pg_glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <ellipse cx="100" cy="172" rx="52" ry="9" fill="rgba(0,0,0,.35)"/>
      <rect x="90" y="142" width="14" height="36" rx="5" fill="#374151"/>
      <rect x="80" y="152" width="34" height="8" rx="4" fill="#1f2937"/>
      <rect x="18" y="60" width="148" height="84" rx="14" fill="${body}"/>
      <path d="M18,78 Q18,42 100,40 Q182,42 182,78" fill="${top}"/>
      <rect x="18" y="60" width="148" height="84" rx="14" fill="url(#pg_body)" opacity=".7"/>
      ${!isOpen?`<rect x="22" y="74" width="118" height="62" rx="10" fill="${door}"/><rect x="22" y="74" width="118" height="62" rx="10" fill="url(#pg_door)" opacity=".6"/>`:''}
      ${!isOpen?`<rect x="32" y="118" width="98" height="11" rx="5.5" fill="rgba(0,0,0,.55)"/><rect x="34" y="120" width="94" height="7" rx="3.5" fill="rgba(0,0,0,.75)"/>`:''}
      ${!isOpen?`<circle cx="28" cy="80" r="2.5" fill="rgba(255,255,255,.12)"/><circle cx="134" cy="80" r="2.5" fill="rgba(255,255,255,.12)"/><circle cx="28" cy="130" r="2.5" fill="rgba(255,255,255,.12)"/><circle cx="134" cy="130" r="2.5" fill="rgba(255,255,255,.12)"/>`:''}
      ${openDoor}${envelope}
      <rect x="159" y="76" width="5" height="52" rx="2.5" fill="#6b7280"/>
      ${!flagUp?`<g><rect x="155" y="110" width="5" height="18" rx="2" fill="#dc2626"/><path d="M160,110 L173,115 L160,120 Z" fill="#ef4444"/></g>`:''}
      ${flagUp?`<g filter="url(#pg_glow)"><rect x="159" y="76" width="5" height="20" rx="2" fill="${hasMail?'#dc2626':'#4ade80'}"/><path class="flag-wave" d="M164,76 Q178,72 180,80 Q178,88 164,84 Z" fill="${hasMail?'#ef4444':'#86efac'}"/></g>`:''}
      ${sp}${osp}
    </svg>`;
  }

  /* ── autocomplete globale (document.body) ── */
  let _acInput=null;
  function _acShow(inputEl, hass, domain){
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
    ac.style.cssText=`position:fixed;top:${rect.bottom+3}px;left:${rect.left}px;width:${rect.width}px;`+
      `background:#0e0c1e;border:1px solid rgba(251,191,36,.35);border-radius:10px;`+
      `overflow-y:auto;max-height:200px;z-index:999999;box-shadow:0 10px 40px rgba(0,0,0,.85);scrollbar-width:none`;
    const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const hilite=id=>{
      if(!q) return `<span style="color:#fff">${esc(id)}</span>`;
      const i=id.toLowerCase().indexOf(q);
      if(i<0) return `<span style="color:#fff">${esc(id)}</span>`;
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

  class PostaCard extends HTMLElement {
    static getStubConfig(){ return {storageKey:''} }

    constructor(){
      super();
      this.attachShadow({mode:'open'});
      this._h=null;
      this._c={storageKey:'',cardScale:100,cardW:100,label:'Centro Posta',sensorEntity:''};
      this._frarikCard=null;
      this._modalHost=null;
      this._click=this._onClick.bind(this);
      this._change=this._onChange.bind(this);
      this._prevSig='';
      this._pkgState='idle';
      this._pkgError='';
      this._menuOpen=false;
    }

    set hass(h){
      this._h=h;
      const sig=[
        h?.states?.['sensor.frarik_posta_versione']?.state,
        h?.states?.['counter.frarik_posta_oggi']?.state,
        h?.states?.['binary_sensor.frarik_posta_ricevuta_oggi']?.state,
        h?.states?.['input_datetime.frarik_posta_ultima_consegna']?.state,
        h?.states?.['input_text.frarik_posta_storico']?.state,
        h?.states?.['input_boolean.frarik_posta_notifiche_attive']?.state,
        h?.states?.['input_boolean.frarik_posta_notifica_push']?.state,
        h?.states?.['input_boolean.frarik_posta_notifica_google']?.state,
        h?.states?.['input_boolean.frarik_posta_notifica_alexa']?.state,
        h?.states?.['input_datetime.frarik_posta_notifiche_inizio']?.state,
        h?.states?.['input_datetime.frarik_posta_notifiche_fine']?.state,
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
      this._c={storageKey:sk,cardScale:100,cardW:100,label:'Centro Posta',sensorEntity:'',...stored};
      if(cfg.cardScale) this._c.cardScale=cfg.cardScale;
      if(cfg.cardW) this._c.cardW=cfg.cardW;
      this._build();
    }

    configure(card){ if(card?.id) this._frarikCard=card; this._openSettings(); }
    connectedCallback(){ this.shadowRoot.addEventListener('click',this._click); this.shadowRoot.addEventListener('change',this._change); }
    disconnectedCallback(){ this.shadowRoot.removeEventListener('click',this._click); this.shadowRoot.removeEventListener('change',this._change); this._destroyModal(); _acHide(); }

    _skKey(){ return 'posta-card:'+(this._c.storageKey||'default'); }
    _save(){ try{ localStorage.setItem(this._skKey(),JSON.stringify(this._c)); }catch(_){} }
    _st(eid){ return this._h?.states?.[eid]?.state; }
    _isPkg(){ return !!this._h?.states?.['sensor.frarik_posta_versione']; }
    _countToday(){ return parseInt(this._st('counter.frarik_posta_oggi')||'0',10); }
    _countWeek(){ return parseInt(this._st('counter.frarik_posta_settimana')||'0',10); }
    _hasMail(){ const s=this._st('binary_sensor.frarik_posta_ricevuta_oggi'); return s==='on'||s==='true'; }
    _isDoorOpen(){ return this._c.sensorEntity?this._st(this._c.sensorEntity)==='on':false; }
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
    _storico(){ return this._st('input_text.frarik_posta_storico')||''; }
    _timeOf(eid){ const s=this._st(eid); if(!s||s==='unknown'||s==='unavailable') return ''; return s.slice(0,5); }

    _callSvc(domain,service,data){
      if(this._h?.callService) this._h.callService(domain,service,data);
      else window.frarikCallService?.(domain,service,data,{});
    }

    _build(){
      if(!this.shadowRoot) return;
      this.shadowRoot.innerHTML=this._isPkg()?this._renderMain():this._renderNotInstalled();
    }

    /* ── MENU NOTIFICHE (in fondo al body) ── */
    _renderMenu(){
      const master=this._bool('input_boolean.frarik_posta_notifiche_attive');
      const bPush=this._bool('input_boolean.frarik_posta_notifica_push');
      const bGoog=this._bool('input_boolean.frarik_posta_notifica_google');
      const bAlex=this._bool('input_boolean.frarik_posta_notifica_alexa');
      const tInizio=this._timeOf('input_datetime.frarik_posta_notifiche_inizio');
      const tFine=this._timeOf('input_datetime.frarik_posta_notifiche_fine');
      return `
        <div class="btm-toggle" data-a="toggle-menu">
          <span class="btm-lbl">🔔 Notifiche e opzioni</span>
          <span class="btm-chev">${this._menuOpen?'▴':'▾'}</span>
        </div>
        ${this._menuOpen?`<div class="bmenu">
          <div class="menu-sec">NOTIFICHE</div>
          <div class="trow" data-a="toggle-master">
            <span class="trow-ico">🔔</span>
            <span class="trow-lbl">Tutte le notifiche</span>
            <div class="tgl ${master?'on':'off'}"><div class="tgl-k"></div></div>
          </div>
          <div class="tgrp ${master?'':'locked'}">
            <div class="trow sub" data-a="toggle-push">
              <span class="trow-ico">📱</span><span class="trow-lbl">Push smartphone</span>
              <div class="tgl ${bPush?'on':'off'}"><div class="tgl-k"></div></div>
            </div>
            <div class="trow sub" data-a="toggle-google">
              <span class="trow-ico">🔊</span><span class="trow-lbl">Google Home</span>
              <div class="tgl ${bGoog?'on':'off'}"><div class="tgl-k"></div></div>
            </div>
            <div class="trow sub" data-a="toggle-alexa">
              <span class="trow-ico">📣</span><span class="trow-lbl">Amazon Alexa</span>
              <div class="tgl ${bAlex?'on':'off'}"><div class="tgl-k"></div></div>
            </div>
          </div>
          <div class="tgrp-tts ${master?'':'locked'}">
            <div class="menu-sec" style="margin-top:6px">FASCIA ORARIA TTS</div>
            <div class="ttime-row">
              <div class="ttime-item">
                <div class="ttime-lbl">Dalle</div>
                <input class="ttime-inp" type="time" data-a="time-inizio" value="${tInizio}"/>
              </div>
              <div class="ttime-sep">→</div>
              <div class="ttime-item">
                <div class="ttime-lbl">Alle</div>
                <input class="ttime-inp" type="time" data-a="time-fine" value="${tFine}"/>
              </div>
            </div>
            <div class="ttime-hint">Orario in cui Google/Alexa possono fare annunci vocali</div>
          </div>
          <div class="menu-actions">
            <button class="act-btn" data-a="storico">📋 Storico</button>
            <button class="act-btn act-btn-sec" data-a="reset">🔄 Reset</button>
          </div>
        </div>`:''}`;
    }

    /* ── STATO: pkg non installato ── */
    _renderNotInstalled(){
      const st=this._pkgState;
      let body='';
      if(st==='installing'){
        body=`<div class="ni-icon" style="animation:spin 1s linear infinite">⚙️</div>
          <div class="ni-title">Installazione in corso…</div>
          <div class="ni-sub">Creazione cartella e scrittura<br><code>/config/packages/frarik/frarik_posta.yaml</code></div>`;
      } else if(st==='done'){
        body=`<div class="ni-icon">✅</div>
          <div class="ni-title">Package installato!</div>
          <div class="ni-sub">File salvato in<br><code>/config/packages/frarik/frarik_posta.yaml</code><br><br>Verifica che in <strong>configuration.yaml</strong> ci sia:<br><code>homeassistant:<br>&nbsp;&nbsp;packages: !include_dir_named packages</code><br><br>Poi: <strong>Strumenti sviluppatori → YAML → Ricarica tutto</strong></div>`;
      } else if(st==='error'){
        body=`<div class="ni-icon">❌</div>
          <div class="ni-title">Installazione non riuscita</div>
          <div class="ni-sub">${this._pkgError||'Errore sconosciuto'}</div>
          <button class="ni-btn" data-a="open-wizard">🔄 Riprova</button>`;
      } else {
        body=`<div class="ni-icon">📦</div>
          <div class="ni-title">Package non installato</div>
          <div class="ni-sub">Configura i tuoi sensori e dispositivi:<br>la card installa il package in automatico.</div>
          <button class="ni-btn" data-a="open-wizard">⚡ Configura e Installa</button>`;
      }
      return `<style>${this._css()}</style>
      <div class="wrap">
        <div class="hdr">
          <span class="hico">📬</span>
          <span class="htit">${this._c.label}</span>
        </div>
        <div class="body ni-body">${body}</div>
      </div>`;
    }

    /* ── STATO: principale ── */
    _renderMain(){
      const mail=this._hasMail(),open=this._isDoorOpen();
      const svgState=open?'open':mail?'mail':'none';
      const today=this._countToday(),week=this._countWeek();
      const last=this._lastDelivery();
      const statusTxt=open?`<span class="status open">📬 Cassetta aperta!</span>`
        :mail?`<span class="status mail">📭 ${today} consegn${today===1?'a':'e'} oggi</span>`
        :`<span class="status none">📪 Nessuna posta oggi</span>`;
      return `<style>${this._css()}</style>
      <div class="wrap">
        <div class="hdr">
          <span class="hico">📬</span>
          <span class="htit">${this._c.label}</span>
        </div>
        <div class="body">
          <div class="mailbox-wrap ${svgState}">${_svgBox(svgState)}</div>
          <div class="status-row">${statusTxt}</div>
          <div class="counters">
            <div class="cnt-card"><div class="cnt-val ${mail?'cnt-active':''}">${today}</div><div class="cnt-lbl">📦 Oggi</div></div>
            <div class="cnt-sep"></div>
            <div class="cnt-card"><div class="cnt-val">${week}</div><div class="cnt-lbl">📅 Settimana</div></div>
          </div>
          <div class="last-row">
            <span class="last-ico">🕐</span>
            <span class="last-txt">${last?`Ultima consegna <strong>${last}</strong>`:'Nessuna consegna registrata'}</span>
          </div>
          ${this._renderMenu()}
        </div>
      </div>`;
    }

    /* ── CLICK HANDLER ── */
    _onClick(e){
      const b=e.target.closest('[data-a]'); if(!b) return;
      const a=b.dataset.a;
      if(a==='open-wizard') this._openInstallWizard();
      else if(a==='toggle-menu'){
        this._menuOpen=!this._menuOpen;
        this._prevSig='';
        this._build();
      }
      else if(a==='storico') this._openStorico();
      else if(a==='reset') this._confirmReset();
      else if(a==='toggle-master') this._callSvc('homeassistant',this._bool('input_boolean.frarik_posta_notifiche_attive')?'turn_off':'turn_on',{entity_id:'input_boolean.frarik_posta_notifiche_attive'});
      else if(a==='toggle-push'){ if(this._bool('input_boolean.frarik_posta_notifiche_attive')) this._callSvc('homeassistant',this._bool('input_boolean.frarik_posta_notifica_push')?'turn_off':'turn_on',{entity_id:'input_boolean.frarik_posta_notifica_push'}); }
      else if(a==='toggle-google'){ if(this._bool('input_boolean.frarik_posta_notifiche_attive')) this._callSvc('homeassistant',this._bool('input_boolean.frarik_posta_notifica_google')?'turn_off':'turn_on',{entity_id:'input_boolean.frarik_posta_notifica_google'}); }
      else if(a==='toggle-alexa'){ if(this._bool('input_boolean.frarik_posta_notifiche_attive')) this._callSvc('homeassistant',this._bool('input_boolean.frarik_posta_notifica_alexa')?'turn_off':'turn_on',{entity_id:'input_boolean.frarik_posta_notifica_alexa'}); }
    }

    /* ── CHANGE HANDLER (input time) ── */
    _onChange(e){
      const el=e.target; if(!el.dataset?.a) return;
      if(el.dataset.a==='time-inizio')
        this._callSvc('input_datetime','set_datetime',{entity_id:'input_datetime.frarik_posta_notifiche_inizio',time:el.value+':00'});
      else if(el.dataset.a==='time-fine')
        this._callSvc('input_datetime','set_datetime',{entity_id:'input_datetime.frarik_posta_notifiche_fine',time:el.value+':00'});
    }

    /* ── SETTINGS POPUP (matita / configure) ── */
    _openSettings(){
      this._destroyModal();
      _acHide();
      const host=document.createElement('div'); this._modalHost=host;
      host.attachShadow({mode:'open'}); document.body.appendChild(host);
      const self=this;
      const c=this._c;

      host.shadowRoot.innerHTML=`<style>
        *{box-sizing:border-box;margin:0;padding:0}
        .ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.65);backdrop-filter:blur(6px)}
        .mo{width:100%;max-height:85vh;display:flex;flex-direction:column;background:rgba(10,8,20,.98);border:1px solid rgba(139,92,246,.32);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.8);animation:su .22s cubic-bezier(.32,1.12,.56,1)}
        @keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .shdr{display:flex;align-items:center;gap:12px;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0}
        .sico{width:40px;height:40px;border-radius:12px;background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
        .stxt{flex:1}
        .stit{font-size:16px;font-weight:900;color:#fff;font-family:system-ui,sans-serif}
        .ssub{font-size:12px;color:#fff;opacity:.4;font-family:system-ui,sans-serif;margin-top:2px}
        .scls{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:6px 14px;color:#fff;font-size:13px;cursor:pointer;font-family:system-ui,sans-serif}
        .sbody{display:flex;flex:1;overflow:hidden}
        .sleft{flex:1;overflow-y:auto;padding:20px;scrollbar-width:none;display:flex;flex-direction:column;gap:16px;min-width:0;max-width:520px}
        .sleft::-webkit-scrollbar{display:none}
        .sright{flex:0 0 42%;min-width:300px;padding:20px;border-left:1px solid rgba(255,255,255,.07);display:flex;flex-direction:column;gap:10px;overflow:hidden}
        .flbl{font-size:11px;font-weight:800;color:#fff;opacity:.5;letter-spacing:.7px;text-transform:uppercase;font-family:system-ui,sans-serif;display:flex;align-items:center;gap:6px;margin-bottom:6px}
        .fopt{font-size:10px;font-weight:700;background:rgba(255,255,255,.08);color:#fff;opacity:.6;padding:2px 7px;border-radius:5px;letter-spacing:0;text-transform:none}
        .finp{width:100%;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.11);border-radius:10px;padding:11px 13px;color:#fff;font-size:13px;font-family:system-ui,sans-serif;outline:none;transition:border-color .15s}
        .finp:focus{border-color:rgba(251,191,36,.5);background:rgba(255,255,255,.09)}
        .fhint{font-size:11px;color:#fff;opacity:.35;margin-top:5px;font-family:system-ui,sans-serif;line-height:1.5}
        .frange{width:100%;accent-color:#fbbf24;margin-top:4px}
        .frow{display:flex;flex-direction:column}
        .fsave{width:100%;padding:14px;border-radius:13px;background:#fbbf24;border:none;color:#1a1a2e;font-size:14px;font-weight:900;cursor:pointer;font-family:system-ui,sans-serif;transition:filter .15s;margin-top:4px}
        .fsave:active{filter:brightness(.9)}
        .prev-lbl{font-size:11px;font-weight:800;color:#fff;opacity:.35;letter-spacing:.6px;text-transform:uppercase;font-family:system-ui,sans-serif;text-align:center;margin-bottom:8px;flex-shrink:0}
        .prev-wrap{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow-y:auto;display:flex;align-items:flex-start;justify-content:center;flex:1;min-height:0;scrollbar-width:none}
        .prev-wrap::-webkit-scrollbar{display:none}
      </style>
      <div class="ov">
        <div class="mo">
          <div class="shdr">
            <div class="sico">📬</div>
            <div class="stxt">
              <div class="stit">Impostazioni — Centro Posta</div>
              <div class="ssub">Personalizza la card</div>
            </div>
            <button class="scls" id="set-close">✕</button>
          </div>
          <div class="sbody">
            <div class="sleft">
              <div class="frow">
                <label class="flbl">✏️ Etichetta</label>
                <input class="finp" id="s_label" type="text" value="${(c.label||'Centro Posta').replace(/"/g,'&quot;')}" placeholder="Centro Posta" autocomplete="off"/>
              </div>
              <div class="frow">
                <label class="flbl">📡 Sensore cassetta <span class="fopt">opzionale</span></label>
                <input class="finp" id="s_sensor" type="text" value="${(c.sensorEntity||'').replace(/"/g,'&quot;')}" placeholder="binary_sensor.cassetta_postale" autocomplete="off" spellcheck="false"/>
                <div class="fhint">Mostra "Cassetta aperta" quando il sensore fisico è on</div>
              </div>
              <div class="frow">
                <label class="flbl">📐 Scala — <span id="sv_scale">${c.cardScale||100}</span>%</label>
                <input type="range" class="frange" id="s_scale" min="20" max="100" step="5" value="${c.cardScale||100}"/>
              </div>
              <div class="frow">
                <label class="flbl">↔️ Larghezza — <span id="sv_w">${c.cardW||100}</span>%</label>
                <input type="range" class="frange" id="s_w" min="20" max="100" step="5" value="${c.cardW||100}"/>
              </div>
              <button class="fsave" id="s_save">💾 Salva impostazioni</button>
            </div>
            <div class="sright">
              <div class="prev-lbl">Anteprima</div>
              <div class="prev-wrap"><posta-card id="s_prev" style="display:block;width:100%"></posta-card></div>
            </div>
          </div>
        </div>
      </div>`;

      const sr=host.shadowRoot;

      sr.getElementById('set-close').addEventListener('click',()=>self._destroyModal());

      sr.getElementById('s_scale').addEventListener('input',e=>{
        sr.getElementById('sv_scale').textContent=e.target.value;
      });
      sr.getElementById('s_w').addEventListener('input',e=>{
        sr.getElementById('sv_w').textContent=e.target.value;
      });

      /* autocomplete su sensore */
      const sensorInp=sr.getElementById('s_sensor');
      sensorInp.addEventListener('focus',()=>_acShow(sensorInp,self._h,'binary_sensor'));
      sensorInp.addEventListener('blur',()=>setTimeout(_acHide,160));
      sensorInp.addEventListener('input',()=>_acShow(sensorInp,self._h,'binary_sensor'));

      sr.getElementById('s_save').addEventListener('click',()=>{
        self._c.label=sr.getElementById('s_label').value||'Centro Posta';
        self._c.sensorEntity=(sr.getElementById('s_sensor').value||'').trim();
        self._c.cardScale=parseInt(sr.getElementById('s_scale').value)||100;
        self._c.cardW=parseInt(sr.getElementById('s_w').value)||100;
        self._save();
        if(self._frarikCard) self.dispatchEvent(new CustomEvent('frarik-card-layout',{bubbles:true,composed:true,detail:{cardId:self._frarikCard.id,cardScale:self._c.cardScale,cardW:self._c.cardW}}));
        _acHide();
        self._destroyModal();
        self._prevSig='';
        self._build();
      });

      const prev=sr.getElementById('s_prev');
      try{ prev.setConfig({type:'custom:posta-card',storageKey:'__posta_prev__'}); prev.hass=self._h; }catch(_){}
    }

    /* ── WIZARD INSTALLAZIONE ── */
    _openInstallWizard(){
      this._destroyModal();
      _acHide();
      const host=document.createElement('div'); this._modalHost=host;
      host.attachShadow({mode:'open'}); document.body.appendChild(host);
      const self=this;
      let _ridG=1,_ridA=1,_ridP=1;

      host.shadowRoot.innerHTML=`<style>
        *{box-sizing:border-box;margin:0;padding:0}
        .ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.72);backdrop-filter:blur(6px)}
        .mo{width:100%;max-height:88vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(251,191,36,.28);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.8);animation:su .22s cubic-bezier(.32,1.12,.56,1)}
        @keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .mhdr{display:flex;align-items:center;gap:12px;padding:18px 18px 14px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}
        .mico{width:40px;height:40px;border-radius:12px;background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
        .mtxt{flex:1}
        .mtit{font-size:15px;font-weight:900;color:#fff;font-family:system-ui,sans-serif}
        .msub{font-size:11px;color:#fff;opacity:.4;font-family:system-ui,sans-serif;margin-top:2px}
        .mxbtn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:8px;padding:6px 12px;color:#fff;font-size:13px;cursor:pointer;font-family:system-ui,sans-serif}
        .mbody{flex:1;overflow-y:auto;padding:16px 18px 4px;display:flex;flex-direction:column;gap:18px;scrollbar-width:none}
        .mbody::-webkit-scrollbar{display:none}
        .wsec{display:flex;flex-direction:column;gap:9px}
        .wsec-hdr{display:flex;align-items:center;gap:8px}
        .wsec-ico{font-size:17px;line-height:1}
        .wsec-ttl{font-size:12px;font-weight:900;color:#fff;letter-spacing:.6px;text-transform:uppercase;font-family:system-ui,sans-serif}
        .tag{font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;font-family:system-ui,sans-serif}
        .req{background:rgba(239,68,68,.2);color:#fca5a5;border:1px solid rgba(239,68,68,.3)}
        .opt{background:rgba(255,255,255,.07);color:#fff;opacity:.5;border:1px solid rgba(255,255,255,.12)}
        .wsec-hint{font-size:11px;color:#fff;opacity:.42;font-family:system-ui,sans-serif;line-height:1.6}
        .wsec-hint code{background:rgba(255,255,255,.1);padding:1px 5px;border-radius:4px;font-size:10px;color:#fbbf24;font-family:monospace}
        .wlist{display:flex;flex-direction:column;gap:6px}
        .wrow{display:flex;gap:6px;align-items:center}
        .winp{flex:1;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 12px;color:#fff;font-size:13px;font-family:monospace;outline:none;transition:border-color .15s}
        .winp:focus{border-color:rgba(251,191,36,.55);background:rgba(255,255,255,.09)}
        .winp.err{border-color:rgba(239,68,68,.6)!important}
        .wrem{width:32px;height:32px;flex-shrink:0;border-radius:8px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.22);color:#fca5a5;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;font-family:system-ui,sans-serif;line-height:1}
        .wadd{align-self:flex-start;background:none;border:1px dashed rgba(255,255,255,.18);border-radius:9px;padding:7px 16px;color:#fff;opacity:.55;font-size:12px;font-weight:600;cursor:pointer;font-family:system-ui,sans-serif;transition:all .15s}
        .wadd:hover{opacity:.9;border-color:rgba(251,191,36,.45);color:#fbbf24}
        .werr{font-size:11px;color:#fca5a5;font-family:system-ui,sans-serif}
        .wdiv{height:1px;background:rgba(255,255,255,.06)}
        .mftr{padding:14px 18px 28px;flex-shrink:0;border-top:1px solid rgba(255,255,255,.06)}
        .wbtn-ok{width:100%;padding:14px;border-radius:13px;background:#fbbf24;border:none;color:#1a1a2e;font-size:14px;font-weight:900;cursor:pointer;font-family:system-ui,sans-serif}
        .wbtn-ok:active{filter:brightness(.9)}
      </style>
      <div class="ov">
        <div class="mo" id="wiz_mo">
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
              <div class="wlist">
                <div class="wrow" data-group="sensor">
                  <input class="winp" id="w_sensor" placeholder="binary_sensor.cassetta_postale" type="text" autocomplete="off" spellcheck="false"/>
                </div>
              </div>
              <div class="werr" id="w_sensor_err" style="display:none">⚠️ Campo obbligatorio</div>
            </div>
            <div class="wdiv"></div>
            <div class="wsec">
              <div class="wsec-hdr"><span class="wsec-ico">🔊</span><span class="wsec-ttl">Google Home / Nest</span><span class="tag opt">opzionale</span></div>
              <div class="wsec-hint">entity_id dei media player Google per annunci vocali.</div>
              <div class="wlist" id="w_google_list">
                <div class="wrow" data-group="google" data-rid="0">
                  <input class="winp" placeholder="media_player.google_home_cucina" type="text" autocomplete="off" spellcheck="false"/>
                  <button class="wrem" data-rid="0" data-grp="google">✕</button>
                </div>
              </div>
              <button class="wadd" data-add="google">+ Aggiungi dispositivo</button>
            </div>
            <div class="wdiv"></div>
            <div class="wsec">
              <div class="wsec-hdr"><span class="wsec-ico">📣</span><span class="wsec-ttl">Amazon Alexa / Echo</span><span class="tag opt">opzionale</span></div>
              <div class="wsec-hint">entity_id dei media player Alexa. Richiede integrazione Alexa Media Player.</div>
              <div class="wlist" id="w_alexa_list">
                <div class="wrow" data-group="alexa" data-rid="0">
                  <input class="winp" placeholder="media_player.alexa_cucina" type="text" autocomplete="off" spellcheck="false"/>
                  <button class="wrem" data-rid="0" data-grp="alexa">✕</button>
                </div>
              </div>
              <button class="wadd" data-add="alexa">+ Aggiungi dispositivo</button>
            </div>
            <div class="wdiv"></div>
            <div class="wsec">
              <div class="wsec-hdr"><span class="wsec-ico">📱</span><span class="wsec-ttl">Push Smartphone</span><span class="tag opt">opzionale</span></div>
              <div class="wsec-hint">Nome servizio mobile_app (parte dopo <code>notify.</code>).</div>
              <div class="wlist" id="w_push_list">
                <div class="wrow" data-group="push" data-rid="0">
                  <input class="winp" placeholder="mobile_app_iphone_mario" type="text" autocomplete="off" spellcheck="false"/>
                  <button class="wrem" data-rid="0" data-grp="push">✕</button>
                </div>
              </div>
              <button class="wadd" data-add="push">+ Aggiungi smartphone</button>
            </div>
          </div>
          <div class="mftr">
            <button class="wbtn-ok" id="wiz_install">⚡ Installa Package</button>
          </div>
        </div>
      </div>`;

      const sr=host.shadowRoot;
      const moEl=sr.getElementById('wiz_mo');

      sr.getElementById('wiz_close').addEventListener('click',()=>{ _acHide(); self._destroyModal(); });

      moEl.addEventListener('click',e=>{
        const addBtn=e.target.closest('[data-add]');
        if(addBtn){
          const grp=addBtn.dataset.add;
          const rid=(grp==='google'?_ridG++:grp==='alexa'?_ridA++:_ridP++);
          const listEl=sr.getElementById(`w_${grp}_list`);
          const ph={google:'media_player.google_home_2',alexa:'media_player.alexa_2',push:'mobile_app_samsung_2'}[grp]||'';
          const row=document.createElement('div');
          row.className='wrow'; row.dataset.group=grp; row.dataset.rid=rid;
          row.innerHTML=`<input class="winp" placeholder="${ph}" type="text" autocomplete="off" spellcheck="false"/>
            <button class="wrem" data-rid="${rid}" data-grp="${grp}">✕</button>`;
          listEl.appendChild(row);
          const newInp=row.querySelector('.winp');
          newInp.focus();
          _bindAc(newInp,grp);
          return;
        }
        const remBtn=e.target.closest('.wrem');
        if(remBtn){ const row=remBtn.closest('.wrow'); if(row){ _acHide(); row.remove(); } }
      });

      sr.getElementById('wiz_install').addEventListener('click',()=>{
        const sensor=(sr.getElementById('w_sensor').value||'').trim();
        const errEl=sr.getElementById('w_sensor_err');
        if(!sensor){
          errEl.style.display='';
          sr.getElementById('w_sensor').classList.add('err');
          sr.getElementById('w_sensor').focus();
          return;
        }
        errEl.style.display='none';
        const _vals=g=>[...sr.querySelectorAll(`#w_${g}_list .winp`)].map(i=>i.value.trim()).filter(Boolean);
        const customYaml=self._buildCustomPkg(sensor,_vals('google'),_vals('alexa'),_vals('push'));
        _acHide();
        self._destroyModal();
        self._pkgState='installing';
        self._build();
        self._installPkg(customYaml);
      });

      const domainMap={sensor:'binary_sensor',google:'media_player',alexa:'media_player'};
      function _bindAc(inp,grp){
        if(grp==='push') return;
        const domain=domainMap[grp]||'';
        inp.addEventListener('focus',()=>_acShow(inp,self._h,domain));
        inp.addEventListener('blur',()=>setTimeout(_acHide,160));
        inp.addEventListener('input',()=>_acShow(inp,self._h,domain));
      }
      sr.querySelectorAll('.winp').forEach(inp=>{
        const grp=inp.closest('[data-group]')?.dataset.group||'sensor';
        _bindAc(inp,grp);
      });
      sr.getElementById('w_sensor').addEventListener('input',()=>{
        sr.getElementById('w_sensor_err').style.display='none';
        sr.getElementById('w_sensor').classList.remove('err');
      });
      setTimeout(()=>sr.getElementById('w_sensor')?.focus(),80);
    }

    _buildCustomPkg(sensor,google,alexa,push){
      const ind='          ';
      return _PKG_YAML
        .replace('%%SENSORE_CASSETTA%%',sensor||'binary_sensor.IL_TUO_SENSORE')
        .replace('%%GOOGLE_LINES%%',google.length?google.map(e=>`${ind}- ${e}`).join('\n'):`${ind}# - media_player.IL_TUO_GOOGLE_HOME`)
        .replace('%%ALEXA_LINES%%',alexa.length?alexa.map(e=>`${ind}- ${e}`).join('\n'):`${ind}# - media_player.LA_TUA_ALEXA`)
        .replace('%%PUSH_LINES%%',push.length?push.map(s=>`${ind}- service: ${s}`).join('\n'):`${ind}# - service: IL_TUO_MOBILE_APP`);
    }

    async _installPkg(customYaml){
      try{
        const m=location.pathname.match(/^(.*\/api\/hassio_ingress\/[^/]+)/);
        const base=location.origin+(m?m[1]:'');
        const r=await fetch(base+'/api/frarik/pkg/install',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({name:'frarik/frarik_posta.yaml',content:customYaml||_PKG_YAML})
        });
        const j=await r.json().catch(()=>({}));
        if(r.ok&&j.ok){ this._pkgState='done'; }
        else{ this._pkgState='error'; this._pkgError=j.error||('HTTP '+r.status); }
      }catch(e){
        this._pkgState='error';
        this._pkgError=e.message||'Errore di rete';
      }
      this._build();
    }

    /* ── POPUP STORICO ── */
    _openStorico(){
      this._destroyModal();
      const host=document.createElement('div'); this._modalHost=host;
      host.attachShadow({mode:'open'}); document.body.appendChild(host);
      const raw=this._storico();
      const entries=raw?raw.split(' · ').filter(Boolean):[];
      const rows=entries.length
        ?entries.map((e,i)=>`<div class="sh-row"><span class="sh-n">${i+1}</span><span class="sh-v">${e}</span></div>`).join('')
        :`<div class="sh-empty">Nessuna consegna registrata.<br>Lo storico si aggiorna automaticamente ad ogni nuova posta.</div>`;
      host.shadowRoot.innerHTML=`<style>
        *{box-sizing:border-box;margin:0;padding:0}
        .ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.65);backdrop-filter:blur(6px)}
        .mo{width:100%;max-height:72vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(251,191,36,.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:su .22s cubic-bezier(.32,1.12,.56,1)}
        @keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .mhdr{display:flex;align-items:center;gap:10px;padding:16px 18px 12px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0}
        .mico{width:36px;height:36px;border-radius:10px;background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
        .mtit{flex:1;font-size:15px;font-weight:800;color:#fff;font-family:system-ui,sans-serif}
        .mxbtn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:6px 12px;color:#fff;font-size:13px;cursor:pointer;font-family:system-ui,sans-serif}
        .mbody{flex:1;overflow-y:auto;padding:14px 18px 28px;scrollbar-width:none;display:flex;flex-direction:column;gap:6px}
        .mbody::-webkit-scrollbar{display:none}
        .sh-row{display:flex;align-items:center;gap:12px;padding:10px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px}
        .sh-n{min-width:24px;height:24px;border-radius:50%;background:rgba(251,191,36,.18);color:#fbbf24;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif}
        .sh-v{font-size:13px;font-weight:600;color:#fff;font-family:system-ui,sans-serif}
        .sh-empty{text-align:center;padding:30px 16px;color:#fff;opacity:.5;font-size:13px;line-height:1.8;font-family:system-ui,sans-serif}
      </style>
      <div class="ov">
        <div class="mo">
          <div class="mhdr"><div class="mico">📋</div><div class="mtit">Storico Consegne</div><button class="mxbtn" id="sh-close">✕</button></div>
          <div class="mbody">${rows}</div>
        </div>
      </div>`;
      host.shadowRoot.getElementById('sh-close').addEventListener('click',()=>this._destroyModal());
    }

    /* ── CONFIRM RESET ── */
    _confirmReset(){
      this._destroyModal();
      const host=document.createElement('div'); this._modalHost=host;
      host.attachShadow({mode:'open'}); document.body.appendChild(host);
      const self=this;
      host.shadowRoot.innerHTML=`<style>
        *{box-sizing:border-box;margin:0;padding:0}
        .ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.65);backdrop-filter:blur(6px)}
        .mo{width:100%;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(239,68,68,.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:su .22s cubic-bezier(.32,1.12,.56,1)}
        @keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .mhdr{display:flex;align-items:center;gap:10px;padding:16px 18px 12px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0}
        .mico{width:36px;height:36px;border-radius:10px;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
        .mtit{flex:1;font-size:15px;font-weight:800;color:#fff;font-family:system-ui,sans-serif}
        .mxbtn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:6px 12px;color:#fff;font-size:13px;cursor:pointer;font-family:system-ui,sans-serif}
        p{font-family:system-ui,sans-serif;font-size:13px;color:#fff;line-height:1.7;opacity:.7;padding:16px 18px 8px}
        .btns{display:flex;gap:10px;padding:8px 18px 28px}
        button{flex:1;padding:14px;border-radius:12px;font-size:13px;font-weight:800;cursor:pointer;font-family:system-ui,sans-serif;color:#fff;border:none}
        .bconf{background:rgba(239,68,68,.7);border:2px solid rgba(239,68,68,.5)}
        .bcanc{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.15)}
      </style>
      <div class="ov">
        <div class="mo">
          <div class="mhdr"><div class="mico">🔄</div><div class="mtit">Reset contatore</div><button class="mxbtn" id="rst-close">✕</button></div>
          <p>Resettare il contatore giornaliero a 0?<br>Lo storico consegne rimarrà invariato.</p>
          <div class="btns">
            <button class="bcanc" id="rst-cancel">Annulla</button>
            <button class="bconf" id="rst-ok">Sì, resetta</button>
          </div>
        </div>
      </div>`;
      const sr=host.shadowRoot;
      sr.getElementById('rst-close').addEventListener('click',()=>self._destroyModal());
      sr.getElementById('rst-cancel').addEventListener('click',()=>self._destroyModal());
      sr.getElementById('rst-ok').addEventListener('click',()=>{
        self._destroyModal();
        self._callSvc('script','turn_on',{entity_id:'script.frarik_posta_reset'});
      });
    }

    _destroyModal(){ this._modalHost?.remove(); this._modalHost=null; }

    /* ── CSS ── */
    _css(){ return `
:host{display:block;height:100%;border-radius:16px;overflow:hidden;font-family:system-ui,sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
.wrap{height:100%;display:flex;flex-direction:column;background:${_PC.bg};border-radius:16px;overflow:hidden}
.hdr{display:flex;align-items:center;gap:10px;padding:14px 16px 10px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}
.hico{font-size:22px;line-height:1}
.htit{flex:1;font-size:15px;font-weight:900;color:#fff;letter-spacing:.4px}
/* ── bottom menu toggle ── */
.btm-toggle{display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:11px;cursor:pointer;user-select:none;transition:background .15s;margin-top:2px}
.btm-toggle:active{background:rgba(255,255,255,.09)}
.btm-lbl{flex:1;font-size:12px;font-weight:700;color:#fff;opacity:.7}
.btm-chev{font-size:13px;color:#fff;opacity:.45}
.bmenu{display:flex;flex-direction:column;gap:8px;animation:mslide .15s ease;padding-bottom:4px}
@keyframes mslide{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
.menu-sec{font-size:10px;font-weight:800;color:#fff;opacity:.35;letter-spacing:.9px;text-transform:uppercase;margin-bottom:2px}
.trow{display:flex;align-items:center;gap:10px;padding:9px 12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:11px;cursor:pointer;transition:background .15s;user-select:none}
.trow:active{background:rgba(255,255,255,.09)}
.trow.sub{padding:8px 12px;background:rgba(255,255,255,.02);border-color:rgba(255,255,255,.05)}
.trow-ico{font-size:17px;flex-shrink:0}
.trow-lbl{flex:1;font-size:13px;font-weight:700;color:#fff}
.tgrp{display:flex;flex-direction:column;gap:5px;transition:opacity .2s}
.tgrp.locked{opacity:.3;pointer-events:none}
.tgl{width:44px;height:26px;border-radius:13px;background:rgba(255,255,255,.15);position:relative;transition:background .2s;flex-shrink:0}
.tgl.on{background:#fbbf24}
.tgl-k{width:22px;height:22px;border-radius:50%;background:#fff;position:absolute;top:2px;left:2px;transition:transform .2s;box-shadow:0 2px 6px rgba(0,0,0,.35)}
.tgl.on .tgl-k{transform:translateX(18px)}
.menu-actions{display:flex;gap:8px;margin-top:4px}
.act-btn{flex:1;padding:11px;border-radius:11px;background:rgba(251,191,36,.18);border:1px solid rgba(251,191,36,.35);color:#fbbf24;font-size:12px;font-weight:800;cursor:pointer;transition:all .15s;font-family:system-ui,sans-serif}
.act-btn:active{background:rgba(251,191,36,.28)}
.act-btn-sec{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.14);color:#fff;opacity:.7}
.act-btn-sec:active{background:rgba(255,255,255,.1)}
.tgrp-tts{display:flex;flex-direction:column;gap:6px;transition:opacity .2s}
.tgrp-tts.locked{opacity:.3;pointer-events:none}
.ttime-row{display:flex;align-items:flex-end;gap:8px;padding:9px 12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:11px}
.ttime-item{flex:1;display:flex;flex-direction:column;gap:4px}
.ttime-lbl{font-size:10px;font-weight:700;color:#fff;opacity:.45;letter-spacing:.5px;text-transform:uppercase}
.ttime-inp{width:100%;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.1);border-radius:8px;padding:7px 8px;color:#fff;font-size:13px;font-weight:700;font-family:system-ui,sans-serif;outline:none;cursor:pointer;-webkit-appearance:none;color-scheme:dark}
.ttime-inp:focus{border-color:rgba(251,191,36,.5);background:rgba(255,255,255,.09)}
.ttime-sep{font-size:16px;color:#fff;opacity:.3;padding-bottom:8px;flex-shrink:0}
.ttime-hint{font-size:10px;color:#fff;opacity:.35;font-family:system-ui,sans-serif;line-height:1.5;padding:0 2px}
/* ── body ── */
.body{flex:1;overflow-y:auto;padding:14px 14px 16px;display:flex;flex-direction:column;gap:10px;scrollbar-width:none}
.body::-webkit-scrollbar{display:none}
.mailbox-wrap{width:100%;display:flex;justify-content:center;padding:4px 0 0}
.mailbox-wrap.mail svg{filter:drop-shadow(0 0 18px rgba(167,139,250,.5)) drop-shadow(0 8px 32px rgba(167,139,250,.35))}
.mailbox-wrap.open svg{filter:drop-shadow(0 0 18px rgba(74,222,128,.45)) drop-shadow(0 8px 32px rgba(74,222,128,.3))}
@keyframes flagWave{0%,100%{transform:skewY(-3deg)}50%{transform:skewY(3deg)}}
@keyframes letterBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes sp{0%,100%{opacity:0;transform:scale(.5)}50%{opacity:1;transform:scale(1)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.flag-wave{animation:flagWave 1.2s ease-in-out infinite;transform-origin:left center}
.letter-bob{animation:letterBob 1.8s ease-in-out infinite}
.sp1{animation:sp 2s ease-in-out infinite}.sp2{animation:sp 2s ease-in-out .4s infinite}
.sp3{animation:sp 2s ease-in-out .8s infinite}.sp5{animation:sp 2s ease-in-out .6s infinite}
.status-row{text-align:center;font-size:13px;font-weight:700}
.status{display:inline-block;padding:6px 14px;border-radius:20px}
.status.none{background:rgba(255,255,255,.07);color:#fff;opacity:.7}
.status.mail{background:rgba(167,139,250,.18);color:#c4b5fd;border:1px solid rgba(167,139,250,.3)}
.status.open{background:rgba(74,222,128,.15);color:#4ade80;border:1px solid rgba(74,222,128,.3)}
.counters{display:flex;align-items:stretch;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden}
.cnt-card{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px 10px;gap:4px}
.cnt-sep{width:1px;background:rgba(255,255,255,.08)}
.cnt-val{font-size:36px;font-weight:900;color:#fff;line-height:1;transition:color .3s}
.cnt-val.cnt-active{color:#c4b5fd}
.cnt-lbl{font-size:11px;font-weight:700;color:#fff;opacity:.45;letter-spacing:.4px}
.last-row{display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:11px}
.last-ico{font-size:16px;flex-shrink:0}
.last-txt{font-size:12px;color:#fff;opacity:.7;line-height:1.5}
.last-txt strong{color:#fff;opacity:1}
/* ── not installed ── */
.ni-body{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;padding:24px 18px}
.ni-icon{font-size:52px;line-height:1}
.ni-title{font-size:17px;font-weight:900;color:#fff}
.ni-sub{font-size:13px;color:#fff;opacity:.6;line-height:1.8;max-width:300px}
.ni-sub code{background:rgba(255,255,255,.1);padding:2px 6px;border-radius:4px;font-size:11px;color:#fbbf24;font-family:monospace}
.ni-btn{padding:13px 28px;border-radius:13px;background:rgba(251,191,36,.25);border:1px solid rgba(251,191,36,.45);color:#fbbf24;font-size:13px;font-weight:800;cursor:pointer;font-family:system-ui,sans-serif;transition:all .15s;min-width:200px}
.ni-btn:active{background:rgba(251,191,36,.4)}
`; }
  }

  customElements.define('posta-card', PostaCard);
  (window.customCards=window.customCards||[]).push({
    type:'posta-card',
    name:'Centro Controllo Posta',
    description:'Monitora la cassetta postale: contatori, storico, notifiche push/Google/Alexa. Installa il package con wizard guidato e autocomplete entità.',
    icon:'📬'
  });
})();
