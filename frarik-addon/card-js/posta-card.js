/* frarik-version: 1.0 */
/* Centro Controllo Posta — Frarik card standalone */
(function(){
  'use strict';
  if(customElements.get('posta-card')) return;

  /* ─────────────────────────────────────────────
     PKG YAML — installato automaticamente
  ───────────────────────────────────────────── */
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
# COSA FA QUESTO PACKAGE
# ──────────────────────────────────────────────────────────
# Monitora la cassetta postale e gestisce in automatico:
#
#  ▸ Contatore consegne giornaliero (reset a mezzanotte)
#  ▸ Contatore consegne settimanale (reset ogni lunedì)
#  ▸ Data e ora dell'ultima consegna ricevuta
#  ▸ Storico testuale delle ultime consegne
#  ▸ Notifiche push su smartphone (richissime di info)
#  ▸ Annunci vocali Google Home / Nest
#  ▸ Annunci vocali Amazon Alexa / Echo
#  ▸ Finestra oraria per TTS (evita annunci di notte)
#  ▸ Interruttore master per silenziare tutto
#  ▸ Protezione anti-rimbalzo sul sensore fisico
#
###############################################################
#
# INSTALLAZIONE — LEGGI PRIMA DI INIZIARE
# ──────────────────────────────────────────────────────────
#
#  PASSO 1 — Abilita i package in configuration.yaml
#  ───────────────────────────────────────────────────
#  Apri il tuo configuration.yaml e verifica che sia
#  presente questa sezione (aggiungila se manca):
#
#    homeassistant:
#      packages: !include_dir_named packages
#
#  Poi riavvia Home Assistant per attivare le modifiche.
#
#  PASSO 2 — Personalizza i segnaposto qui sotto
#  ───────────────────────────────────────────────
#  Nella sezione IMPOSTAZIONI trovi tutti i valori
#  da sostituire. Ogni segnaposto ha il formato:
#
#    IL_TUO_VALORE_QUI
#
#  e un commento che spiega esattamente cosa inserire.
#
#  PASSO 3 — Ricarica la configurazione
#  ───────────────────────────────────────────────
#  Dopo aver salvato le modifiche:
#  Strumenti per sviluppatori → YAML → Ricarica tutto
#  (oppure riavvia Home Assistant)
#
###############################################################
#
# ENTITÀ CREATE DA QUESTO PACKAGE
# ──────────────────────────────────────────────────────────
#  sensor.frarik_posta_versione              ← rilevamento pkg
#  binary_sensor.frarik_posta_ricevuta_oggi  ← posta oggi?
#  counter.frarik_posta_oggi                 ← consegne oggi
#  counter.frarik_posta_settimana            ← consegne settimana
#  input_datetime.frarik_posta_ultima_consegna
#  input_datetime.frarik_posta_notifiche_inizio
#  input_datetime.frarik_posta_notifiche_fine
#  input_boolean.frarik_posta_notifiche_attive  ← master switch
#  input_boolean.frarik_posta_notifica_push
#  input_boolean.frarik_posta_notifica_google
#  input_boolean.frarik_posta_notifica_alexa
#  input_text.frarik_posta_storico           ← ultime consegne
#  notify.frarik_posta                       ← gruppo push
#  script.frarik_posta_reset                 ← reset manuale
#  automation: Frarik — Posta (eventi)
#  automation: Frarik — Posta (reset)
#
###############################################################


####################################################
#                                                  #
#                  IMPOSTAZIONI                    #
#          ↓  MODIFICA SOLO QUESTA SEZIONE  ↓      #
#                                                  #
####################################################

homeassistant:
  customize:
    package.node_anchors:
      customize: &customize
        package: 'Frarik — Centro Controllo Posta'
        author: 'Frarik / Fratech'
        version: '1.0'

      setting:

        # ─────────────────────────────────────────────────
        # SENSORE CASSETTA POSTALE
        # Inserisci l'entity_id del binary sensor che rileva
        # l'apertura della tua cassetta postale.
        # Il sensore deve essere 'on' quando la cassetta
        # viene aperta (es. contatto magnetico, sensore vibrazione).
        # Esempi:
        #   binary_sensor.cassetta_postale
        #   binary_sensor.sensore_posta_ingresso
        # ─────────────────────────────────────────────────
        Sensore Cassetta: &sensore_cassetta
          "binary_sensor.IL_TUO_SENSORE_CASSETTA_POSTALE"

        # ─────────────────────────────────────────────────
        # SPEAKER GOOGLE HOME / NEST
        # Entità media player dei tuoi dispositivi Google.
        # Rimuovi la riga se non hai Google Home.
        # Puoi aggiungere più dispositivi su righe separate.
        # Esempi:
        #   - media_player.google_home_cucina
        #   - media_player.nest_mini_salotto
        # ─────────────────────────────────────────────────
        MediaPlayer Google: &google
          - media_player.IL_TUO_GOOGLE_HOME_1
          # - media_player.IL_TUO_GOOGLE_HOME_2

        # ─────────────────────────────────────────────────
        # DISPOSITIVI AMAZON ALEXA / ECHO
        # Entità media player dei tuoi dispositivi Alexa.
        # Rimuovi la riga se non hai Alexa.
        # Richiede l'integrazione Alexa Media Player.
        # Esempi:
        #   - media_player.alexa_cucina
        #   - media_player.echo_dot_camera
        # ─────────────────────────────────────────────────
        MediaPlayer Alexa: &alexa
          - media_player.LA_TUA_ALEXA_1
          # - media_player.LA_TUA_ALEXA_2

        # ─────────────────────────────────────────────────
        # SERVIZI NOTIFICA PUSH (smartphone)
        # Inserisci il nome del servizio mobile_app per
        # ogni smartphone che deve ricevere la notifica.
        # Trovi i nomi in: Impostazioni → App Companion
        # oppure in: Strumenti per sviluppatori → Servizi
        # cercando "notify.mobile_app_".
        # Esempi:
        #   - service: mobile_app_iphone_di_mario
        #   - service: mobile_app_samsung_giulia
        # ─────────────────────────────────────────────────
        Notifiche Push: &push
          - service: IL_TUO_MOBILE_APP_1
          # - service: IL_TUO_MOBILE_APP_2


####################################################
#                                                  #
#              NOTIFICHE GRUPPO PUSH               #
#                                                  #
####################################################

notify:
  - name: frarik_posta
    platform: group
    services: *push


####################################################
#                                                  #
#                    CONTATORI                     #
#                                                  #
####################################################

counter:
  frarik_posta_oggi:
    name: "Posta — Consegne Oggi"
    icon: mdi:mailbox-up-outline

  frarik_posta_settimana:
    name: "Posta — Consegne Settimana"
    icon: mdi:calendar-week


####################################################
#                                                  #
#               DATE E ORARI                       #
#                                                  #
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
#                                                  #
#               INTERRUTTORI                       #
#                                                  #
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
#                                                  #
#                   STORICO                        #
#                                                  #
####################################################

input_text:
  frarik_posta_storico:
    name: "Posta — Storico Consegne"
    max: 255
    icon: mdi:history


####################################################
#                                                  #
#                    SENSORI                       #
#                                                  #
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
#                                                  #
#                    SCRIPT                        #
#                                                  #
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
#                                                  #
#                  AUTOMAZIONI                     #
#                                                  #
####################################################

automation:

  ####################################################
  # Gestione eventi cassetta postale

  - alias: "Frarik — Posta (eventi)"
    id: frarik_posta_eventi
    description: "Rileva arrivo posta, aggiorna contatori e invia notifiche"
    mode: single

    trigger:
      - platform: state
        entity_id: *sensore_cassetta
        from: 'off'
        to: 'on'
        id: posta_arrivata

    condition: []

    action:

      # Anti-rimbalzo: aspetta 5s per filtrare aperture accidentali
      - delay: '00:00:05'

      # Verifica che il sensore sia ancora attivo
      - condition: state
        entity_id: *sensore_cassetta
        state: 'on'

      # Aggiorna contatore giornaliero
      - service: counter.increment
        target:
          entity_id: counter.frarik_posta_oggi

      # Aggiorna contatore settimanale
      - service: counter.increment
        target:
          entity_id: counter.frarik_posta_settimana

      # Salva data e ora ultima consegna
      - service: input_datetime.set_datetime
        target:
          entity_id: input_datetime.frarik_posta_ultima_consegna
        data:
          datetime: "{{ now().strftime('%Y-%m-%d %H:%M:%S') }}"

      # Aggiorna storico (prepende la nuova voce, max 255 caratteri)
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

      # Notifiche: procedi solo se il master switch è attivo
      - condition: state
        entity_id: input_boolean.frarik_posta_notifiche_attive
        state: 'on'

      # Notifiche in parallelo
      - parallel:

          # ── Notifica Push ──────────────────────────
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

          # ── Annuncio Google Home ───────────────────
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

          # ── Annuncio Alexa ─────────────────────────
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

  ####################################################
  # Reset contatori

  - alias: "Frarik — Posta (reset)"
    id: frarik_posta_reset
    description: "Reset giornaliero e settimanale dei contatori posta"
    mode: single

    trigger:
      - platform: time
        at: '00:00:00'

    condition: []

    action:

      # Reset giornaliero — sempre a mezzanotte
      - service: counter.reset
        target:
          entity_id: counter.frarik_posta_oggi

      # Reset settimanale — solo il lunedì
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

  /* ── helpers colore ── */
  const _PC={
    bg:'linear-gradient(160deg,#0d0b1e 0%,#0a0f1e 60%,#080b18 100%)',
    bodyNoMail:'#1a2744', topNoMail:'#131d38', doorNoMail:'#0f1a32',
    bodyMail:'#2d1b69', topMail:'#1e0f4a', doorMail:'#221354',
    bodyOpen:'#1a2a0d', topOpen:'#142208', doorOpen:'#102007',
    accent:'#fbbf24', accentMail:'#a78bfa', accentOpen:'#4ade80',
  };

  /* ── SVG cassetta postale ── */
  function _svgBox(state){
    const hasMail = state==='mail', isOpen = state==='open';
    const body = hasMail?_PC.bodyMail : isOpen?_PC.bodyOpen : _PC.bodyNoMail;
    const top  = hasMail?_PC.topMail  : isOpen?_PC.topOpen  : _PC.topNoMail;
    const door = hasMail?_PC.doorMail : isOpen?_PC.doorOpen : _PC.doorNoMail;
    const glow = hasMail?'rgba(167,139,250,.35)' : isOpen?'rgba(74,222,128,.3)':'rgba(99,102,241,.15)';
    const flagUp = hasMail || isOpen;

    const envelope = hasMail ? `
      <g class="letter-bob">
        <rect x="46" y="62" width="60" height="42" rx="5" fill="white" opacity=".96"/>
        <path d="M46,62 L76,86 L106,62" fill="none" stroke="#d1d5db" stroke-width="2"/>
        <rect x="56" y="82" width="40" height="4" rx="2" fill="#e5e7eb" opacity=".7"/>
        <rect x="62" y="90" width="28" height="3" rx="1.5" fill="#e5e7eb" opacity=".5"/>
      </g>` : '';

    const openDoor = isOpen ? `
      <g transform="rotate(-42,32,80)">
        <rect x="32" y="80" width="72" height="50" rx="9" fill="${door}" opacity=".9"/>
        <rect x="40" y="106" width="56" height="8" rx="4" fill="rgba(0,0,0,.45)"/>
      </g>` : '';

    const sparkles = hasMail ? `
      <circle class="sp1" cx="18" cy="44" r="5" fill="#fbbf24"/>
      <circle class="sp2" cx="184" cy="40" r="4" fill="#a78bfa"/>
      <circle class="sp3" cx="12" cy="86" r="3" fill="#34d399"/>
      <circle class="sp4" cx="190" cy="90" r="3" fill="#f472b6"/>
      <text x="168" y="30" font-size="16" class="sp5">✨</text>` : '';

    const openSparkles = isOpen ? `
      <circle class="sp1" cx="16" cy="50" r="4" fill="#4ade80"/>
      <circle class="sp2" cx="188" cy="44" r="3" fill="#86efac"/>
      <text x="170" y="34" font-size="14" class="sp5">📬</text>` : '';

    return `<svg viewBox="0 0 200 190" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:180px;filter:drop-shadow(0 8px 32px ${glow})">
      <defs>
        <linearGradient id="pg_body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,.12)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,.18)"/>
        </linearGradient>
        <linearGradient id="pg_door" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,.06)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,.22)"/>
        </linearGradient>
        <filter id="pg_glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      <!-- Ombra sotto -->
      <ellipse cx="100" cy="172" rx="52" ry="9" fill="rgba(0,0,0,.35)"/>

      <!-- Palo -->
      <rect x="90" y="142" width="14" height="36" rx="5" fill="#374151"/>
      <rect x="80" y="152" width="34" height="8" rx="4" fill="#1f2937"/>

      <!-- Corpo cassetta -->
      <rect x="18" y="60" width="148" height="84" rx="14" fill="${body}"/>
      <path d="M18,78 Q18,42 100,40 Q182,42 182,78" fill="${top}"/>
      <rect x="18" y="60" width="148" height="84" rx="14" fill="url(#pg_body)" opacity=".7"/>

      <!-- Pannello porta (solo se chiusa) -->
      ${!isOpen ? `<rect x="22" y="74" width="118" height="62" rx="10" fill="${door}"/>
      <rect x="22" y="74" width="118" height="62" rx="10" fill="url(#pg_door)" opacity=".6"/>` : ''}

      <!-- Slot lettere -->
      ${!isOpen ? `<rect x="32" y="118" width="98" height="11" rx="5.5" fill="rgba(0,0,0,.55)"/>
      <rect x="34" y="120" width="94" height="7" rx="3.5" fill="rgba(0,0,0,.75)"/>` : ''}

      <!-- Vite decorative angoli porta -->
      ${!isOpen ? `<circle cx="28" cy="80" r="2.5" fill="rgba(255,255,255,.12)"/>
      <circle cx="134" cy="80" r="2.5" fill="rgba(255,255,255,.12)"/>
      <circle cx="28" cy="130" r="2.5" fill="rgba(255,255,255,.12)"/>
      <circle cx="134" cy="130" r="2.5" fill="rgba(255,255,255,.12)"/>` : ''}

      <!-- Porta aperta -->
      ${openDoor}

      <!-- Busta (quando c'è posta) -->
      ${envelope}

      <!-- Palo bandierina -->
      <rect x="159" y="76" width="5" height="52" rx="2.5" fill="#6b7280"/>

      <!-- Bandierina GIÙ (nessuna posta) -->
      ${!flagUp ? `<g>
        <rect x="155" y="110" width="5" height="18" rx="2" fill="#dc2626"/>
        <path d="M160,110 L173,115 L160,120 Z" fill="#ef4444"/>
      </g>` : ''}

      <!-- Bandierina SU (posta ricevuta / aperta) animata -->
      ${flagUp ? `<g filter="url(#pg_glow)">
        <rect x="159" y="76" width="5" height="20" rx="2" fill="${hasMail?'#dc2626':'#4ade80'}"/>
        <path class="flag-wave" d="M164,76 Q178,72 180,80 Q178,88 164,84 Z" fill="${hasMail?'#ef4444':'#86efac'}"/>
      </g>` : ''}

      <!-- Scintille -->
      ${sparkles}${openSparkles}
    </svg>`;
  }

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
      this._prevSig='';
      this._pkgState='idle'; // idle | installing | done | error
      this._pkgError='';
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
    connectedCallback(){ this.shadowRoot.addEventListener('click',this._click); }
    disconnectedCallback(){ this.shadowRoot.removeEventListener('click',this._click); this._destroyModal(); }

    _skKey(){ return 'posta-card:'+(this._c.storageKey||'default'); }
    _save(){ try{ localStorage.setItem(this._skKey(),JSON.stringify(this._c)); }catch(_){} }
    _st(eid){ return this._h?.states?.[eid]?.state; }
    _isPkg(){ return !!this._h?.states?.['sensor.frarik_posta_versione']; }
    _countToday(){ return parseInt(this._st('counter.frarik_posta_oggi')||'0',10); }
    _countWeek(){ return parseInt(this._st('counter.frarik_posta_settimana')||'0',10); }
    _hasMail(){ const s=this._st('binary_sensor.frarik_posta_ricevuta_oggi'); return s==='on'||s==='true'; }
    _isDoorOpen(){ return this._c.sensorEntity ? this._st(this._c.sensorEntity)==='on' : false; }
    _bool(eid){ return this._st(eid)==='on'; }
    _lastDelivery(){
      const s=this._st('input_datetime.frarik_posta_ultima_consegna');
      if(!s||s==='unknown'||s==='unavailable') return null;
      try{
        const d=new Date(s);
        if(isNaN(d)) return null;
        const now=new Date();
        const isToday=d.toDateString()===now.toDateString();
        const isYest=new Date(now-86400000).toDateString()===d.toDateString();
        const hhmm=d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
        return isToday?`oggi alle ${hhmm}`:isYest?`ieri alle ${hhmm}`:d.toLocaleDateString('it-IT',{day:'2-digit',month:'short'})+' alle '+hhmm;
      }catch(_){ return null; }
    }
    _storico(){ return this._st('input_text.frarik_posta_storico')||''; }

    _build(){
      if(!this.shadowRoot) return;
      this.shadowRoot.innerHTML = this._isPkg() ? this._renderMain() : this._renderNotInstalled();
    }

    /* ── STATO: pkg non installato ── */
    _renderNotInstalled(){
      const st=this._pkgState;
      let body='';
      if(st==='installing'){
        body=`<div class="ni-icon" style="animation:spin 1s linear infinite;display:inline-block">⚙️</div>
          <div class="ni-title">Installazione in corso…</div>
          <div class="ni-sub">Scrittura package in /config/packages/</div>`;
      } else if(st==='done'){
        body=`<div class="ni-icon">✅</div>
          <div class="ni-title">Package installato!</div>
          <div class="ni-sub">Vai su <strong>Strumenti per sviluppatori → YAML → Ricarica tutto</strong> (oppure riavvia HA) per attivare il package.<br><br>Poi personalizza i segnaposto nel file <code style="background:rgba(255,255,255,.1);padding:2px 6px;border-radius:4px;font-size:11px">frarik_posta.yaml</code> con i tuoi sensori e dispositivi.</div>
          <button class="ni-btn ni-btn-sec" data-a="how-to">📋 Istruzioni personalizzazione</button>`;
      } else if(st==='error'){
        body=`<div class="ni-icon">❌</div>
          <div class="ni-title">Installazione non riuscita</div>
          <div class="ni-sub">${this._pkgError||'Errore sconosciuto'}<br><br>Prova l'installazione manuale.</div>
          <div style="display:flex;gap:8px;width:100%;margin-top:4px">
            <button class="ni-btn" style="flex:1" data-a="install-pkg">🔄 Riprova</button>
            <button class="ni-btn ni-btn-sec" style="flex:1" data-a="how-to">📋 Manuale</button>
          </div>`;
      } else {
        body=`<div class="ni-icon">📦</div>
          <div class="ni-title">Package non installato</div>
          <div class="ni-sub">Per usare questa card hai bisogno del<br>package <strong>Frarik Posta</strong> installato<br>su Home Assistant.</div>
          <button class="ni-btn" data-a="install-pkg">⚡ Installa automaticamente</button>
          <button class="ni-btn ni-btn-sec" data-a="how-to">📋 Installazione manuale</button>`;
      }
      return `<style>${this._css()}</style>
      <div class="wrap">
        <div class="hdr"><span class="hico">📬</span><span class="htit">${this._c.label}</span></div>
        <div class="body ni-body">${body}</div>
      </div>`;
    }

    /* ── INSTALL PKG ── */
    async _installPkg(){
      if(this._pkgState==='installing') return;
      this._pkgState='installing';
      this._build();
      try{
        const m=location.pathname.match(/^(.*\/api\/hassio_ingress\/[^/]+)/);
        const base=location.origin+(m?m[1]:'');
        const r=await fetch(base+'/api/frarik/pkg/install',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({name:'frarik_posta.yaml',content:_PKG_YAML})
        });
        const j=await r.json().catch(()=>({}));
        if(r.ok && j.ok){ this._pkgState='done'; }
        else{ this._pkgState='error'; this._pkgError=j.error||('HTTP '+r.status); }
      }catch(e){
        this._pkgState='error';
        this._pkgError=e.message||'Errore di rete';
      }
      this._build();
    }

    /* ── STATO: principale ── */
    _renderMain(){
      const mail=this._hasMail(), open=this._isDoorOpen();
      const svgState=open?'open':mail?'mail':'none';
      const today=this._countToday(), week=this._countWeek();
      const last=this._lastDelivery();
      const master=this._bool('input_boolean.frarik_posta_notifiche_attive');
      const bPush=this._bool('input_boolean.frarik_posta_notifica_push');
      const bGoog=this._bool('input_boolean.frarik_posta_notifica_google');
      const bAlex=this._bool('input_boolean.frarik_posta_notifica_alexa');

      const statusTxt = open
        ? `<span class="status open">📬 Cassetta aperta!</span>`
        : mail
          ? `<span class="status mail">📭 ${today} consegn${today===1?'a':'e'} oggi</span>`
          : `<span class="status none">📪 Nessuna posta oggi</span>`;

      return `<style>${this._css()}</style>
      <div class="wrap">

        <div class="hdr">
          <span class="hico">📬</span>
          <span class="htit">${this._c.label}</span>
        </div>

        <div class="body">

          <div class="mailbox-wrap ${svgState}">
            ${_svgBox(svgState)}
          </div>

          <div class="status-row">${statusTxt}</div>

          <div class="counters">
            <div class="cnt-card">
              <div class="cnt-val ${mail?'cnt-active':''}">${today}</div>
              <div class="cnt-lbl">📦 Oggi</div>
            </div>
            <div class="cnt-sep"></div>
            <div class="cnt-card">
              <div class="cnt-val">${week}</div>
              <div class="cnt-lbl">📅 Settimana</div>
            </div>
          </div>

          <div class="last-row">
            <span class="last-ico">🕐</span>
            <span class="last-txt">${last?`Ultima consegna <strong>${last}</strong>`:'Nessuna consegna registrata'}</span>
          </div>

          <div class="divider"></div>

          <div class="section-title">Notifiche</div>

          <div class="toggle-row ${master?'':'dimmed'}" data-a="toggle-master" style="margin-bottom:4px">
            <span class="trow-ico">🔔</span>
            <span class="trow-lbl">Tutte le notifiche</span>
            <div class="tgl ${master?'on':'off'}"><div class="tgl-k"></div></div>
          </div>

          <div class="toggle-group ${master?'':'locked'}">
            <div class="toggle-row" data-a="toggle-push">
              <span class="trow-ico">📱</span>
              <span class="trow-lbl">Push smartphone</span>
              <div class="tgl ${bPush?'on':'off'}"><div class="tgl-k"></div></div>
            </div>
            <div class="toggle-row" data-a="toggle-google">
              <span class="trow-ico">🔊</span>
              <span class="trow-lbl">Google Home</span>
              <div class="tgl ${bGoog?'on':'off'}"><div class="tgl-k"></div></div>
            </div>
            <div class="toggle-row" data-a="toggle-alexa">
              <span class="trow-ico">📣</span>
              <span class="trow-lbl">Amazon Alexa</span>
              <div class="tgl ${bAlex?'on':'off'}"><div class="tgl-k"></div></div>
            </div>
          </div>

          <div class="actions">
            <button class="act-btn" data-a="storico">📋 Storico</button>
            <button class="act-btn act-btn-sec" data-a="reset">🔄 Reset</button>
          </div>

        </div>
      </div>`;
    }

    /* ── CLICK HANDLER ── */
    _onClick(e){
      const b=e.target.closest('[data-a]'); if(!b) return;
      const a=b.dataset.a;
      if(a==='how-to') this._openHowTo();
      else if(a==='install-pkg') this._installPkg();
      else if(a==='storico') this._openStorico();
      else if(a==='reset') this._confirmReset();
      else if(a==='toggle-master') this._toggle('input_boolean.frarik_posta_notifiche_attive');
      else if(a==='toggle-push') { if(this._bool('input_boolean.frarik_posta_notifiche_attive')) this._toggle('input_boolean.frarik_posta_notifica_push'); }
      else if(a==='toggle-google') { if(this._bool('input_boolean.frarik_posta_notifiche_attive')) this._toggle('input_boolean.frarik_posta_notifica_google'); }
      else if(a==='toggle-alexa') { if(this._bool('input_boolean.frarik_posta_notifiche_attive')) this._toggle('input_boolean.frarik_posta_notifica_alexa'); }
      else if(a==='close-modal') this._destroyModal();
      else if(a==='confirm-reset') { this._destroyModal(); window.frarikCallService?.('script','frarik_posta_reset',{},{}); }
    }

    _toggle(eid){
      window.frarikCallService?.('homeassistant', this._bool(eid)?'turn_off':'turn_on', {entity_id:eid}, {});
    }

    /* ── POPUP STORICO ── */
    _openStorico(){
      this._destroyModal();
      const host=document.createElement('div');
      this._modalHost=host;
      host.attachShadow({mode:'open'});
      document.body.appendChild(host);
      const raw=this._storico();
      const entries=raw?raw.split(' · ').filter(Boolean):[];
      const rows=entries.length
        ? entries.map((e,i)=>`<div class="sh-row"><span class="sh-n">${i+1}</span><span class="sh-v">${e}</span></div>`).join('')
        : `<div class="sh-empty">Nessuna consegna registrata.<br>Lo storico si aggiorna automaticamente<br>ad ogni nuova posta ricevuta.</div>`;
      host.shadowRoot.innerHTML=`
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          .ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.65);backdrop-filter:blur(6px)}
          .mo{width:100%;max-width:480px;max-height:72vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(251,191,36,.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:su .22s cubic-bezier(.32,1.12,.56,1)}
          @keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
          .mhdr{display:flex;align-items:center;gap:10px;padding:16px 18px 12px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0}
          .mico{width:36px;height:36px;border-radius:10px;background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
          .mtit{flex:1;font-size:15px;font-weight:800;color:#fff;font-family:system-ui,sans-serif}
          .mxbtn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:6px 12px;color:#fff;font-size:13px;cursor:pointer}
          .mbody{flex:1;overflow-y:auto;padding:14px 18px 24px;scrollbar-width:none;display:flex;flex-direction:column;gap:6px}
          .mbody::-webkit-scrollbar{display:none}
          .sh-row{display:flex;align-items:center;gap:12px;padding:10px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px}
          .sh-n{min-width:24px;height:24px;border-radius:50%;background:rgba(251,191,36,.18);color:#fbbf24;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif}
          .sh-v{font-size:13px;font-weight:600;color:#fff;font-family:system-ui,sans-serif}
          .sh-empty{text-align:center;padding:30px 16px;color:#fff;opacity:.5;font-size:13px;line-height:1.8;font-family:system-ui,sans-serif}
        </style>
        <div class="ov" data-a="close-modal">
          <div class="mo" onclick="event.stopPropagation()">
            <div class="mhdr">
              <div class="mico">📋</div>
              <div class="mtit">Storico Consegne</div>
              <button class="mxbtn" data-a="close-modal">✕</button>
            </div>
            <div class="mbody">${rows}</div>
          </div>
        </div>`;
      host.shadowRoot.addEventListener('click',e=>{
        if(e.target.closest('[data-a="close-modal"]')) this._destroyModal();
      });
    }

    /* ── POPUP COME INSTALLARE (manuale) ── */
    _openHowTo(){
      this._destroyModal();
      const host=document.createElement('div');
      this._modalHost=host;
      host.attachShadow({mode:'open'});
      document.body.appendChild(host);
      host.shadowRoot.innerHTML=`
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          .ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.65);backdrop-filter:blur(6px)}
          .mo{width:100%;max-width:480px;max-height:80vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(99,102,241,.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:su .22s cubic-bezier(.32,1.12,.56,1)}
          @keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
          .mhdr{display:flex;align-items:center;gap:10px;padding:16px 18px 12px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0}
          .mico{width:36px;height:36px;border-radius:10px;background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.3);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
          .mtit{flex:1;font-size:15px;font-weight:800;color:#fff;font-family:system-ui,sans-serif}
          .mxbtn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:6px 12px;color:#fff;font-size:13px;cursor:pointer}
          .mbody{flex:1;overflow-y:auto;padding:16px 18px 24px;scrollbar-width:none;display:flex;flex-direction:column;gap:14px}
          .mbody::-webkit-scrollbar{display:none}
          h3{font-family:system-ui,sans-serif;font-size:13px;font-weight:900;color:#fff;letter-spacing:.6px;text-transform:uppercase;opacity:.5;margin-bottom:2px}
          p,li{font-family:system-ui,sans-serif;font-size:13px;color:#fff;line-height:1.7}
          ol{padding-left:18px;display:flex;flex-direction:column;gap:6px}
          code{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);border-radius:5px;padding:3px 8px;font-size:12px;color:#fbbf24;font-family:monospace;display:block;margin-top:6px;line-height:1.9}
          .step{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:6px}
          .step-n{font-size:11px;font-weight:900;color:#6366f1;letter-spacing:.8px;font-family:system-ui,sans-serif}
        </style>
        <div class="ov" data-a="close-modal">
          <div class="mo" onclick="event.stopPropagation()">
            <div class="mhdr">
              <div class="mico">📦</div>
              <div class="mtit">Personalizzazione Package Posta</div>
              <button class="mxbtn" data-a="close-modal">✕</button>
            </div>
            <div class="mbody">
              <div class="step">
                <span class="step-n">PASSO 1</span>
                <p>Verifica che nel tuo <strong>configuration.yaml</strong> sia presente questa riga:</p>
                <code>homeassistant:
  packages: !include_dir_named packages</code>
                <p style="margin-top:8px;opacity:.6;font-size:12px">Se la sezione non esiste, aggiungila e riavvia HA.</p>
              </div>
              <div class="step">
                <span class="step-n">PASSO 2</span>
                <p>Apri il file <strong>frarik_posta.yaml</strong> in <strong>File Editor</strong> dalla cartella <code>/config/packages/</code> e sostituisci i segnaposto con le tue entità:</p>
                <code>binary_sensor.IL_TUO_SENSORE_CASSETTA
media_player.IL_TUO_GOOGLE_HOME_1
media_player.LA_TUA_ALEXA_1
IL_TUO_MOBILE_APP_1</code>
              </div>
              <div class="step">
                <span class="step-n">PASSO 3</span>
                <p>Vai su <strong>Strumenti per sviluppatori → YAML → Ricarica tutto</strong> oppure riavvia Home Assistant. La card si attiverà automaticamente.</p>
              </div>
            </div>
          </div>
        </div>`;
      host.shadowRoot.addEventListener('click',e=>{
        if(e.target.closest('[data-a="close-modal"]')) this._destroyModal();
      });
    }

    /* ── CONFIRM RESET ── */
    _confirmReset(){
      this._destroyModal();
      const host=document.createElement('div');
      this._modalHost=host;
      host.attachShadow({mode:'open'});
      document.body.appendChild(host);
      host.shadowRoot.innerHTML=`
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          .ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.65);backdrop-filter:blur(6px)}
          .mo{width:100%;max-width:420px;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(239,68,68,.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:su .22s cubic-bezier(.32,1.12,.56,1);padding:22px 18px 32px}
          @keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
          p{font-family:system-ui,sans-serif;font-size:14px;color:#fff;text-align:center;line-height:1.6;margin-bottom:20px}
          .btns{display:flex;gap:10px}
          button{flex:1;padding:14px;border-radius:12px;font-size:13px;font-weight:800;cursor:pointer;font-family:system-ui,sans-serif;color:#fff;border:none}
          .bconf{background:rgba(239,68,68,.7);border:2px solid rgba(239,68,68,.5)}
          .bcanc{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.15)}
        </style>
        <div class="ov" data-a="close-modal">
          <div class="mo" onclick="event.stopPropagation()">
            <p>🔄 Resettare il contatore giornaliero?<br><span style="opacity:.5;font-size:12px">Il contatore tornerà a 0. Lo storico resta invariato.</span></p>
            <div class="btns">
              <button class="bcanc" data-a="close-modal">Annulla</button>
              <button class="bconf" data-a="confirm-reset">Sì, resetta</button>
            </div>
          </div>
        </div>`;
      host.shadowRoot.addEventListener('click',e=>{
        const t=e.target.closest('[data-a]'); if(!t) return;
        if(t.dataset.a==='close-modal') this._destroyModal();
        else if(t.dataset.a==='confirm-reset'){ this._destroyModal(); window.frarikCallService?.('script','frarik_posta_reset',{},{}); }
      });
    }

    /* ── SETTINGS ── */
    _openSettings(){
      this._destroyModal();
      const host=document.createElement('div');
      this._modalHost=host;
      host.attachShadow({mode:'open'});
      document.body.appendChild(host);
      const c=this._c;
      host.shadowRoot.innerHTML=`
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          .ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.65);backdrop-filter:blur(6px)}
          .mo{width:100%;max-width:900px;max-height:80vh;display:flex;flex-direction:column;background:rgba(10,8,20,.98);border:1px solid rgba(139,92,246,.32);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:su .22s cubic-bezier(.32,1.12,.56,1)}
          @keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
          .shdr{display:flex;align-items:center;gap:12px;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0}
          .sico{width:40px;height:40px;border-radius:12px;background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
          .stit{flex:1;font-size:16px;font-weight:900;color:#fff;font-family:system-ui,sans-serif}
          .ssub{font-size:12px;color:#fff;opacity:.45;font-family:system-ui,sans-serif;margin-top:1px}
          .scls{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:6px 14px;color:#fff;font-size:13px;cursor:pointer;font-family:system-ui,sans-serif}
          .sbody{display:flex;flex:1;overflow:hidden}
          .sleft{flex:1;overflow-y:auto;padding:18px 20px 24px;scrollbar-width:none;display:flex;flex-direction:column;gap:14px;min-width:0}
          .sleft::-webkit-scrollbar{display:none}
          .sright{width:280px;padding:18px 20px 24px;border-left:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;gap:14px;flex-shrink:0}
          label{font-size:11px;font-weight:800;color:#fff;opacity:.5;letter-spacing:.7px;text-transform:uppercase;font-family:system-ui,sans-serif;display:block;margin-bottom:5px}
          input[type=text]{width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:9px;padding:10px 12px;color:#fff;font-size:13px;font-family:system-ui,sans-serif;outline:none}
          input[type=text]:focus{border-color:rgba(251,191,36,.5);background:rgba(255,255,255,.09)}
          input[type=range]{width:100%;accent-color:#fbbf24}
          .sv-row{display:flex;justify-content:space-between;align-items:center;margin-top:4px}
          .sv-val{font-size:12px;color:#fbbf24;font-weight:700;font-family:system-ui,sans-serif}
          .sbtn{width:100%;padding:13px;border-radius:12px;background:#fbbf24;color:#1a1a2e;font-size:13px;font-weight:900;cursor:pointer;border:none;font-family:system-ui,sans-serif;letter-spacing:.4px;margin-top:4px}
          .prev-wrap{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:240px}
          .prev-lbl{font-size:11px;font-weight:800;color:#fff;opacity:.4;letter-spacing:.6px;text-transform:uppercase;font-family:system-ui,sans-serif;text-align:center;margin-bottom:8px}
        </style>
        <div class="ov" data-a="close-modal">
          <div class="mo" onclick="event.stopPropagation()">
            <div class="shdr">
              <div class="sico">📬</div>
              <div><div class="stit">Impostazioni — Centro Posta</div><div class="ssub">Personalizza etichetta e sensore opzionale</div></div>
              <button class="scls" data-a="close-modal">✕</button>
            </div>
            <div class="sbody">
              <div class="sleft">
                <div>
                  <label>Etichetta card</label>
                  <input type="text" id="s_label" value="${c.label||'Centro Posta'}" placeholder="Centro Posta"/>
                </div>
                <div>
                  <label>Sensore cassetta (opzionale)</label>
                  <input type="text" id="s_sensor" value="${c.sensorEntity||''}" placeholder="binary_sensor.cassetta_postale"/>
                  <div style="font-size:11px;color:#fff;opacity:.4;margin-top:5px;font-family:system-ui,sans-serif;line-height:1.6">Se configurato, mostra l'animazione "Cassetta aperta" quando il sensore fisico è attivo.</div>
                </div>
                <div>
                  <label>Scala card — <span id="sv_scale">${c.cardScale||100}</span>%</label>
                  <input type="range" id="s_scale" min="20" max="100" step="5" value="${c.cardScale||100}"/>
                </div>
                <div>
                  <label>Larghezza card — <span id="sv_w">${c.cardW||100}</span>%</label>
                  <input type="range" id="s_w" min="20" max="100" step="5" value="${c.cardW||100}"/>
                </div>
                <button class="sbtn" data-a="save-settings">💾 Salva impostazioni</button>
              </div>
              <div class="sright">
                <div class="prev-lbl">Anteprima</div>
                <div class="prev-wrap">
                  <posta-card id="s_prev" style="display:block;width:100%"></posta-card>
                </div>
              </div>
            </div>
          </div>
        </div>`;

      const sr=host.shadowRoot;
      sr.getElementById('s_scale').addEventListener('input',e=>{ sr.getElementById('sv_scale').textContent=e.target.value; });
      sr.getElementById('s_w').addEventListener('input',e=>{ sr.getElementById('sv_w').textContent=e.target.value; });

      const prev=sr.getElementById('s_prev');
      try{ prev.setConfig({type:'custom:posta-card',storageKey:'__posta_prev__'}); prev.hass=this._h; }catch(_){}

      sr.addEventListener('click',e=>{
        const t=e.target.closest('[data-a]'); if(!t) return;
        if(t.dataset.a==='close-modal') this._destroyModal();
        else if(t.dataset.a==='save-settings'){
          this._c.label=sr.getElementById('s_label').value||'Centro Posta';
          this._c.sensorEntity=sr.getElementById('s_sensor').value.trim();
          this._c.cardScale=parseInt(sr.getElementById('s_scale').value)||100;
          this._c.cardW=parseInt(sr.getElementById('s_w').value)||100;
          this._save();
          if(this._frarikCard){
            this.dispatchEvent(new CustomEvent('frarik-card-layout',{bubbles:true,composed:true,detail:{cardId:this._frarikCard.id,cardScale:this._c.cardScale,cardW:this._c.cardW}}));
          }
          this._destroyModal();
          this._prevSig='';
          this._build();
        }
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
.htit{font-size:15px;font-weight:900;color:#fff;letter-spacing:.4px}
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
.sp1{animation:sp 2s ease-in-out infinite}
.sp2{animation:sp 2s ease-in-out .4s infinite}
.sp3{animation:sp 2s ease-in-out .8s infinite}
.sp4{animation:sp 2s ease-in-out 1.2s infinite}
.sp5{animation:sp 2s ease-in-out .6s infinite}

.status-row{text-align:center;font-size:13px;font-weight:700}
.status{display:inline-block;padding:6px 14px;border-radius:20px}
.status.none{background:rgba(255,255,255,.07);color:#fff;opacity:.7}
.status.mail{background:rgba(167,139,250,.18);color:#c4b5fd;border:1px solid rgba(167,139,250,.3)}
.status.open{background:rgba(74,222,128,.15);color:#4ade80;border:1px solid rgba(74,222,128,.3)}

.counters{display:flex;align-items:stretch;gap:0;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden}
.cnt-card{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px 10px;gap:4px}
.cnt-sep{width:1px;background:rgba(255,255,255,.08)}
.cnt-val{font-size:36px;font-weight:900;color:#fff;line-height:1;transition:color .3s}
.cnt-val.cnt-active{color:#c4b5fd}
.cnt-lbl{font-size:11px;font-weight:700;color:#fff;opacity:.45;letter-spacing:.4px}

.last-row{display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:11px}
.last-ico{font-size:16px;flex-shrink:0}
.last-txt{font-size:12px;color:#fff;opacity:.7;line-height:1.5}
.last-txt strong{color:#fff;opacity:1}

.divider{height:1px;background:rgba(255,255,255,.07);flex-shrink:0}
.section-title{font-size:11px;font-weight:800;color:#fff;opacity:.35;letter-spacing:.8px;text-transform:uppercase}

.toggle-row{display:flex;align-items:center;gap:10px;padding:9px 12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:11px;cursor:pointer;transition:background .15s;user-select:none}
.toggle-row:active{background:rgba(255,255,255,.08)}
.dimmed{opacity:1}
.trow-ico{font-size:17px;flex-shrink:0}
.trow-lbl{flex:1;font-size:13px;font-weight:700;color:#fff}
.tgl{width:44px;height:26px;border-radius:13px;background:rgba(255,255,255,.15);position:relative;transition:background .2s;flex-shrink:0}
.tgl.on{background:#fbbf24}
.tgl-k{width:22px;height:22px;border-radius:50%;background:#fff;position:absolute;top:2px;left:2px;transition:transform .2s;box-shadow:0 2px 6px rgba(0,0,0,.35)}
.tgl.on .tgl-k{transform:translateX(18px)}
.toggle-group{display:flex;flex-direction:column;gap:6px;transition:opacity .2s}
.toggle-group.locked{opacity:.35;pointer-events:none}

.actions{display:flex;gap:8px;margin-top:2px}
.act-btn{flex:1;padding:12px;border-radius:12px;background:rgba(251,191,36,.18);border:1px solid rgba(251,191,36,.35);color:#fbbf24;font-size:12px;font-weight:800;cursor:pointer;transition:all .15s;font-family:system-ui,sans-serif}
.act-btn:active{background:rgba(251,191,36,.28)}
.act-btn-sec{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.14);color:#fff;opacity:.7}
.act-btn-sec:active{background:rgba(255,255,255,.1)}

.ni-body{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;padding:24px 18px}
.ni-icon{font-size:52px;line-height:1}
.ni-title{font-size:17px;font-weight:900;color:#fff}
.ni-sub{font-size:13px;color:#fff;opacity:.6;line-height:1.7}
.ni-btn{padding:13px 24px;border-radius:13px;background:rgba(251,191,36,.25);border:1px solid rgba(251,191,36,.45);color:#fbbf24;font-size:13px;font-weight:800;cursor:pointer;font-family:system-ui,sans-serif;transition:all .15s;width:100%}
.ni-btn:active{background:rgba(251,191,36,.4)}
.ni-btn-sec{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.15);color:#fff;opacity:.7}
.ni-btn-sec:active{background:rgba(255,255,255,.1)}
`; }
  }

  customElements.define('posta-card', PostaCard);
  (window.customCards = window.customCards || []).push({
    type: 'posta-card',
    name: 'Centro Controllo Posta',
    description: 'Monitora la cassetta postale: contatori giornaliero e settimanale, storico consegne, notifiche push/Google/Alexa. Richiede il package Frarik Posta.',
    icon: 'mdi:mailbox'
  });
})();
