/* frarik-version: 5.2 */
/* Centro Controllo Posta — Frarik card standalone */
/* v4.4: aggiunta icona ingranaggio interna (la card non ne aveva una) e
   frarik_no_edit per nascondere la matita esterna in modifica; eliminato
   ogni accento giallo/ambra da tutti i popup interni (impostazioni, conferma
   reset, wizard di installazione, dropdown autocomplete entità) — ora tutto
   bianco/neutro; sezione entità/sensori del wizard racchiusa in riquadro
   con contorno; tutti i popup si chiudono anche cliccando fuori. */
/* v4.5: rimosso pallino misterioso vuoto nell'header quando non ci sono
   consegne; testi/numeri della card (etichette, orari, statistiche, drawer)
   ora bianchi pieni invece che grigi/opachi; popup impostazioni ampliato con
   riquadro Notifiche (toggle master/push/Google/Alexa + orari media e push)
   e riquadro Reset manuali (oggi/settimana/mese), rimossa la funzione morta
   openImpostazioniHAPopup mai richiamata; aggiunta anteprima live + slider
   dimensione card (altezza/larghezza) a 2 colonne, stesso meccanismo di
   Meteo.js (localStorage _frk_layout_ + evento frarik-card-layout). */
/* v4.6: rimosso il drawer "Notifiche e opzioni" dentro la card (toggle,
   orari, reset) perché duplicato — le stesse impostazioni sono ora
   raggiungibili solo dal popup dell'ingranaggio; ripulito il codice morto
   collegato (stato _drawerOpen, handler onChange, CSS del drawer). */
/* v4.8: cassetta postale ridisegnata in stile realistico (niente faccia/
   occhi) — corpo in metallo con sfumature, scritta "POSTA" incisa, viti,
   bandierina rossa che si alza quando c'è posta, spia LED di stato (blu =
   posta in arrivo, verde = cassetta aperta), busta di carta che sbircia
   dalla fessura. Layout della card completamente rifatto: banner a tutta
   larghezza con numero consegne in overlay (al posto di immagine+numero
   affiancati), orari di oggi come chip in fila (al posto della timeline
   verticale a puntini), statistiche settimana/mese come tile con icona. */
/* v4.9: cassetta rurale ridisegnata in vista 3/4 realistica — palo in legno
   con venatura, corpo in metallo scuro con sportello sagomato che si apre
   ruotando quando la cassetta è aperta, bandierina rossa fuori dal corpo,
   spia LED montata sullo sportello. Layout tornato a 2 colonne: immagine
   a sinistra (tutta l'altezza), numero/pill/orari/statistiche impilati
   a destra, al posto del banner a tutta larghezza. */
/* v5.0: cassetta ridisegnata da zero in volume isometrico reale (3 facce
   con ombreggiatura corretta: alto/fronte/lato) invece del profilo piatto
   precedente — cassetta smart con sportello che si apre ruotando sul
   cardine, spia LED di stato, busta che sbircia dalla fessura sul top.
   Rimossa la bandierina (non coerente con una cassetta smart da esterno).
   Corpo della card semplificato: colonna destra ora mostra solo i 3
   numeri oggi/settimana/mese (niente più chip orari), con un riquadro
   a piena larghezza sotto per data/ora dell'ultima consegna. */
/* v5.1: cassetta ridisegnata in chiave "smart moderna" — colori scuri
   minimal, angoli del corpo arrotondati, maniglia a incasso al posto
   della manopola, barra LED di stato luminosa sul fronte invece del
   pallino. Colonne corpo card ora esattamente uguali (50/50, era 40/60).
   Rimossa la mini-chip "N oggi/Aperta" nell'header accanto all'ingranaggio. */
/* v5.2: cassetta ridisegnata da zero in vista frontale stile "Alubox" su
   riferimento fornito dall'utente — corpo rettangolare grigio antracite
   con angoli smussati, coperchio superiore a listello, grande motivo a V
   incassato (piega a "busta") sul fronte, fessura per pacchi/giornale in
   basso. Animazioni quando arriva posta: motivo a V che pulsa nel colore
   di stato, busta che sbircia dalla fessura del coperchio con leggero
   movimento, spia LED che pulsa; il coperchio si solleva leggermente
   quando la cassetta risulta aperta. */
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
#   ███████╗██████╗  █████╗ ██████╗ ██╗██╗  ██╗             #
#   ██╔════╝██╔══██╗██╔══██╗██╔══██╗██║██║ ██╔╝             #
#   █████╗  ██████╔╝███████║██████╔╝██║█████╔╝              #
#   ██╔══╝  ██╔══██╗██╔══██║██╔══██╗██║██╔═██╗              #
#   ██║     ██║  ██║██║  ██║██║  ██║██║██║  ██╗             #
#   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝            #
#                                                             #
#   Package: Centro Controllo Posta                           #
#   Versione: 2.0  |  Frarik / Fratech                       #
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
#  Poi copia questo file nella cartella "packages" e
#  riavvia Home Assistant per attivare le modifiche.
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
#  PASSO 4 — Aggiungi la card dal pannello Frarik
#  ───────────────────────────────────────────────
#  Frarik Dashboard → Store → "Centro Controllo Posta"
#  La card si collega automaticamente a questo package.
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
        version: '2.0'

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
        Sensore Cassetta: &sensore_cassetta IL_TUO_SENSORE_CASSETTA

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
          - IL_TUO_MEDIA_PLAYER_GOOGLE

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
          - IL_TUO_MEDIA_PLAYER_ALEXA

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
          - service: IL_TUO_MOBILE_APP


####################################################
#                                                  #
#              NOTIFICHE GRUPPO PUSH               #
#                                                  #
####################################################



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
        state: "2.0"
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
              - repeat:
                  for_each: *push
                  sequence:
                    - service: "notify.{{ repeat.item.service }}"
                      continue_on_error: true
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
#  Fine package — Frarik Centro Controllo Posta v2.0
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
function _buildCustomPkg(sensor,google,alexa,push,_tpl){
  var ind='          ';
  var googleLines=(google&&google.length)?google.map(function(e){return ind+'- '+e;}).join('\n'):ind+'- media_player.tv';
  var alexaLines=(alexa&&alexa.length)?alexa.map(function(e){return ind+'- '+e;}).join('\n'):ind+'- media_player.alexa';
  var pushLines=(push&&push.length)?push.map(function(s){return ind+'- service: '+s;}).join('\n'):ind+'- service: mobile_app_smartphone';
  return (_tpl||_PKG_YAML)
    .replace('IL_TUO_SENSORE_CASSETTA',sensor||'binary_sensor.cassetta_posta')
    .replace(/[ 	]*- IL_TUO_MEDIA_PLAYER_GOOGLE/,googleLines)
    .replace(/[ 	]*- IL_TUO_MEDIA_PLAYER_ALEXA/,alexaLines)
    .replace(/[ 	]*- service: IL_TUO_MOBILE_APP/,pushLines);
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
  ac.style.cssText=`position:fixed;top:${rect.bottom+3}px;left:${rect.left}px;width:${rect.width}px;background:#0e0c1e;border:1px solid rgba(255,255,255,.18);border-radius:10px;overflow-y:auto;max-height:200px;z-index:999999;box-shadow:0 10px 40px rgba(0,0,0,.85);scrollbar-width:none`;
  const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hilite=id=>{
    if(!q) return `<span style="color:#fff">${esc(id)}</span>`;
    const i=id.toLowerCase().indexOf(q); if(i<0) return `<span style="color:#fff">${esc(id)}</span>`;
    return `<span style="color:#fff">${esc(id.slice(0,i))}<strong style="color:#fff;font-weight:900">${esc(id.slice(i,i+q.length))}</strong>${esc(id.slice(i+q.length))}</span>`;
  };
  ac.innerHTML=res.map(id=>`<div data-v="${esc(id)}" style="padding:8px 12px;font-size:12px;font-family:monospace;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${hilite(id)}</div>`).join('');
  ac.querySelectorAll('[data-v]').forEach(el=>{
    el.addEventListener('mousedown',e=>e.preventDefault());
    el.addEventListener('click',()=>{ if(_acInput){ _acInput.value=el.dataset.v; _acInput.dispatchEvent(new Event('input',{bubbles:true})); _acInput.focus(); } _acHide(); });
    el.addEventListener('mouseenter',()=>{ el.style.background='rgba(255,255,255,.08)'; });
    el.addEventListener('mouseleave',()=>{ el.style.background=''; });
  });
  document.body.appendChild(ac);
}
function _acHide(){ document.getElementById('__frk_posta_ac__')?.remove(); }

/* ══════════════════════════════════════════════════════════════
   PostaCard v5.2 — cassetta a parete stile "Alubox" (motivo a V)
   ══════════════════════════════════════════════════════════════ */

function _svgMailbox(count, isOpen){
  const active=isOpen||count>0;
  const led=isOpen?'#34d399':count>0?'#38bdf8':'rgba(255,255,255,.18)';
  const seamCol=active?led:'#14171a';

  const envelope=count>0?`<g class="mbx-env" style="transform-origin:60px 36px">
      <rect x="48" y="31" width="24" height="10" rx="1.3" fill="#f5f7f9" stroke="#cbd5e1" stroke-width=".7"/>
      <path d="M48 32 L60 39 L72 32" stroke="#cbd5e1" stroke-width=".7" fill="none"/>
    </g>`:'';

  return `<svg viewBox="0 10 120 130" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;overflow:visible">
    <defs>
      <linearGradient id="mbxFront" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#454b53"/>
        <stop offset="100%" stop-color="#22262b"/>
      </linearGradient>
      <linearGradient id="mbxLid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#565c65"/>
        <stop offset="100%" stop-color="#383e46"/>
      </linearGradient>
      <filter id="mbx-ledblur" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="2.4"/></filter>
      <filter id="mbx-shblur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.5"/></filter>
    </defs>

    <rect x="15" y="24" width="100" height="112" rx="8" fill="#000" opacity=".38" filter="url(#mbx-shblur)"/>

    <rect x="10" y="18" width="100" height="112" rx="7" fill="url(#mbxFront)" stroke="#0a0c0e" stroke-width="1.4"/>
    <rect x="10" y="18" width="5" height="112" rx="2.5" fill="#000" opacity=".18"/>

    <rect x="10" y="100" width="100" height="1.3" fill="#0a0c0e" opacity=".65"/>
    <rect x="20" y="108" width="40" height="9" rx="2" fill="#0e1013"/>

    <g class="mbx-seam${active?' active':''}">
      <path d="M20,40 L60,88" stroke="${seamCol}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M100,40 L60,88" stroke="${seamCol}" stroke-width="2.6" stroke-linecap="round"/>
    </g>
    <path d="M19,39 L59,87" stroke="#6b7178" stroke-width="1" opacity=".35"/>
    <path d="M99,39 L59,87" stroke="#6b7178" stroke-width="1" opacity=".35"/>

    <g class="mbx-door${isOpen?' open':''}" style="transform-origin:60px 18px">
      <rect x="10" y="18" width="100" height="15" rx="7" fill="url(#mbxLid)" stroke="#0a0c0e" stroke-width="1.2"/>
      <rect x="16" y="21" width="88" height="3" rx="1.5" fill="#fff" opacity=".12"/>
      <circle cx="96" cy="25" r="5" fill="${led}" opacity=".25" filter="url(#mbx-ledblur)"/>
      <circle class="mbx-led${active?' active':''}" cx="96" cy="25" r="2" fill="${led}"/>
    </g>
    <rect x="10" y="32.5" width="100" height="1.3" fill="#0a0c0e" opacity=".65"/>
    ${envelope}
  </svg>`;
}

let PostaCard;
if(!customElements.get('posta-card')){
  PostaCard=class extends HTMLElement{
    static getStubConfig(){ return {storageKey:''}; }

    constructor(){
      super();
      this.attachShadow({mode:'open'});
      this._h=null;
      this._c={storageKey:'',label:'Centro Posta',sensorEntity:'',cardScale:100,cardW:100};
      this._frarikCard=null;
      this._modalHost=null;
      this._click=this._onClick.bind(this);
      this._prevSig='';
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
      this._c={storageKey:sk,label:'Centro Posta',sensorEntity:'',cardScale:100,cardW:100,...stored};
      this._build();
    }

    configure(card){ if(card?.id) this._frarikCard=card; this._openSettings(); }
    connectedCallback(){ this.shadowRoot.addEventListener('click',this._click); }
    disconnectedCallback(){ this.shadowRoot.removeEventListener('click',this._click); this._destroyModal(); _acHide(); }

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

    _getTime(eid){
      const s=this._st(eid);
      return(s&&s!=='unknown'&&s!=='unavailable')?s.substring(0,5):'';
    }

    _callSvc(domain,service,data){
      if(this._h?.callService) this._h.callService(domain,service,data);
      else window.frarikCallService?.(domain,service,data,{});
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
          <div class="hdr-icon-wrap"><svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px"><path d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          <div class="hdr-tit">${this._c.label||'Centro Posta'}</div>
        </div>
        <div class="ni">
          <div class="ni-env">${_svgMailbox(0,false)}</div>
          <div class="ni-title">Package non installato</div>
          <div class="ni-sub">Installa il package dallo <strong>Store Frarik</strong>, poi riavvia Home Assistant per attivarlo.</div>
        </div>
      </div>`;
    }

    /* ── render: principale ── */
    _renderMain(){
      const today=this._today(), week=this._week(), month=this._month();
      const isOpen=this._isOpen(), last=this._lastDelivery();
      const acc=isOpen?'#34d399':today>0?'#38bdf8':'rgba(255,255,255,.2)';

      return `<style>${this._css()}</style>
      <div class="card">

        <div class="hdr">
          <div class="hdr-icon-wrap"><svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px"><path d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="${acc}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          <div class="hdr-tit">${this._c.label||'Centro Posta'}</div>
          <button class="gbtn" data-a="gear" title="Impostazioni">⚙️</button>
        </div>

        <div class="bscroll">

          <div class="body2col">
            <div class="img-col">${_svgMailbox(today,isOpen)}</div>
            <div class="info-col">
              <div class="num-row">
                <span class="num-n${today>0?' act':''}${isOpen?' open':''}">${today}</span>
                <span class="num-l">Oggi</span>
              </div>
              <div class="num-row">
                <span class="num-n2">${week}</span>
                <span class="num-l">Settimana</span>
              </div>
              <div class="num-row">
                <span class="num-n2">${month}</span>
                <span class="num-l">Mese</span>
              </div>
            </div>
          </div>

          <div class="last-box">
            <div class="last-ic"><svg viewBox="0 0 16 16" fill="none" style="width:15px;height:15px"><circle cx="8" cy="8" r="6.5" stroke="#38bdf8" stroke-width="1.3"/><path d="M8 5v3.2l2 1.3" stroke="#38bdf8" stroke-width="1.3" stroke-linecap="round"/></svg></div>
            <div class="last-tx">
              <span class="last-lbl">Ultima consegna</span>
              <span class="last-val">${last||'Nessuna consegna registrata'}</span>
            </div>
          </div>

        </div>
      </div>`;
    }

    /* ── click handler ── */
    _onClick(e){
      const b=e.target.closest('[data-a]'); if(!b) return;
      const a=b.dataset.a;
      if(a==='gear') this._openSettings();
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
        .mtit{flex:1;font-size:15px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.3px;font-family:system-ui,sans-serif}
        .mxbtn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:6px 12px;color:#fff;font-size:13px;cursor:pointer;font-family:system-ui,sans-serif}
        p{font-family:system-ui,sans-serif;font-size:13px;font-weight:600;color:#fff;line-height:1.7;padding:14px 18px 8px}
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
      host.shadowRoot.addEventListener('click',e=>{ if(e.target.classList.contains('ov')) self._destroyModal(); });
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
      const _mll=JSON.parse(localStorage.getItem('_frk_layout_'+(this._frarikCard?.id||''))||'{}');
      this._tCardScale=_mll.cardScale??c.cardScale??100;
      this._tCardW=_mll.cardW??c.cardW??100;

      const master=this._bool('input_boolean.frarik_posta_notifiche_attive');
      const bPush=this._bool('input_boolean.frarik_posta_notifica_push');
      const bGoog=this._bool('input_boolean.frarik_posta_notifica_google');
      const bAlex=this._bool('input_boolean.frarik_posta_notifica_alexa');
      const mStart=this._getTime('input_datetime.frarik_posta_notifiche_media_inizio')||'08:00';
      const mEnd=this._getTime('input_datetime.frarik_posta_notifiche_media_fine')||'22:00';
      const pStart=this._getTime('input_datetime.frarik_posta_notifiche_push_inizio')||'07:00';
      const pEnd=this._getTime('input_datetime.frarik_posta_notifiche_push_fine')||'23:00';
      const stgl=(on,tg)=>`<div class="stgl${on?' on':''}" data-tg="${tg}"><div class="stgl-k"></div></div>`;
      const cardScaleV=this._tCardScale, cardWV=this._tCardW;

      host.shadowRoot.innerHTML=`<style>
        *{box-sizing:border-box;margin:0;padding:0}
        .ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.65);backdrop-filter:blur(6px)}
        .mo{width:100%;max-height:86vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(255,255,255,.12);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);animation:su .22s cubic-bezier(.32,1.12,.56,1)}
        @keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .mhdr{display:flex;align-items:center;gap:12px;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0}
        .mico{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;color:#fff}
        .mtit{flex:1;font-size:16px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.3px;font-family:system-ui,sans-serif}
        .mxbtn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:6px 14px;color:#fff;font-size:13px;cursor:pointer;font-family:system-ui,sans-serif}
        .sov-2col{display:flex;flex:1;overflow:hidden;min-height:0}
        .sbdy{width:50%;flex-shrink:0;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px;scrollbar-width:none;border-right:1px solid rgba(255,255,255,.07)}
        .sbdy::-webkit-scrollbar{display:none}
        .flbl{font-size:12px;font-weight:900;color:#fff;letter-spacing:.7px;text-transform:uppercase;font-family:system-ui,sans-serif;margin-bottom:6px;display:flex;align-items:center;gap:6px}
        .fopt{font-size:10px;font-weight:700;background:rgba(255,255,255,.07);color:#fff;opacity:.6;padding:2px 6px;border-radius:5px;text-transform:none;letter-spacing:0}
        .finp{width:100%;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.11);border-radius:10px;padding:11px 13px;color:#fff;font-size:13px;font-family:system-ui,sans-serif;outline:none;transition:border-color .15s}
        .finp:focus{border-color:rgba(255,255,255,.4)}
        .fhint{font-size:11px;color:#fff;opacity:.55;margin-top:5px;font-family:system-ui,sans-serif;line-height:1.5}
        .fsec{font-size:10px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:.8px;margin-top:10px;margin-bottom:2px}
        .fsave{width:100%;padding:14px;border-radius:13px;background:#38bdf8;border:none;color:#fff;font-size:14px;font-weight:800;cursor:pointer;font-family:system-ui,sans-serif}
        .sensbox{padding:14px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid #fff}
        .stgl-row{display:flex;align-items:center;gap:9px;padding:8px 0}
        .stgl-lbl{flex:1;font-size:12px;font-weight:700;color:#fff}
        .stgl{width:40px;height:24px;border-radius:12px;background:rgba(255,255,255,.12);position:relative;transition:background .2s;flex-shrink:0;cursor:pointer}
        .stgl.on{background:#38bdf8}
        .stgl-k{width:20px;height:20px;border-radius:50%;background:#fff;position:absolute;top:2px;left:2px;transition:transform .18s;box-shadow:0 2px 4px rgba(0,0,0,.4)}
        .stgl.on .stgl-k{transform:translateX(16px)}
        .stgl-sub{display:flex;flex-direction:column;gap:0;padding-left:4px;transition:opacity .2s}
        .stgl-sub.slocked{opacity:.3;pointer-events:none}
        .stime-row{display:flex;align-items:center;gap:6px;padding:7px 11px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06);border-radius:10px;margin-top:4px}
        .stime{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:7px;color:#fff;font-size:12px;font-weight:700;padding:4px 6px;font-family:system-ui,sans-serif;text-align:center;outline:none}
        .stime-sep{font-size:11px;color:#fff;opacity:.5}
        .srst-row{display:flex;gap:6px;margin-top:4px}
        .srst-btn{flex:1;padding:9px 2px;border-radius:9px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.18);color:#fff;font-size:11px;font-weight:800;cursor:pointer;font-family:system-ui,sans-serif;transition:all .15s;letter-spacing:.1px}
        .srst-btn:active{background:rgba(239,68,68,.22)}
        .sov-prev{width:50%;flex-shrink:0;display:flex;flex-direction:column;gap:10px;padding:14px 16px;overflow-y:auto;background:rgba(0,0,0,.15);scrollbar-width:none}
        .sov-prev::-webkit-scrollbar{display:none}
        .prev-ttl{font-size:11px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.7px;opacity:.6}
        .prev-wrap{border-radius:14px;overflow:hidden;background:rgba(255,255,255,.02);padding:10px;display:flex;justify-content:center}
        .lsect{padding-top:12px;border-top:1px solid rgba(255,255,255,.08)}
        .layout-row{display:flex;align-items:center;gap:8px;margin-top:10px}
        .layout-lbl{font-size:12px;font-weight:900;color:#fff;width:72px;flex-shrink:0}
        .layout-val{font-size:12px;font-weight:900;color:#fff;width:54px;text-align:right;flex-shrink:0}
        input[type=range].lslider{flex:1;cursor:pointer;accent-color:#fff;height:4px}
        @media(max-width:620px){.sov-2col{flex-direction:column!important;overflow-y:auto!important;overflow-x:hidden!important}.sbdy{width:100%!important;border-right:none!important;border-bottom:1px solid rgba(255,255,255,.07)!important;overflow-y:visible!important;flex-shrink:0!important}.sov-prev{min-width:0!important;overflow-y:visible!important;width:100%!important}}
      </style>
      <div class="ov"><div class="mo">
        <div class="mhdr">
          <div class="mico">📬</div>
          <div class="mtit">Impostazioni Card</div>
          <button class="mxbtn" id="s-x">✕</button>
        </div>
        <div class="sov-2col">
          <div class="sbdy">
            <div>
              <div class="flbl">✏️ Etichetta</div>
              <input class="finp" id="s-label" type="text" value="${(c.label||'Centro Posta').replace(/"/g,'&quot;')}" placeholder="Centro Posta"/>
            </div>
            <div class="sensbox">
              <div class="flbl">📡 Sensore cassetta <span class="fopt">opzionale</span></div>
              <input class="finp" id="s-sensor" type="text" value="${(c.sensorEntity||'').replace(/"/g,'&quot;')}" placeholder="binary_sensor.cassetta_postale" autocomplete="off" spellcheck="false"/>
              <div class="fhint">Mostra "Cassetta aperta" quando il sensore è on</div>
            </div>
            <div class="sensbox">
              <div class="flbl">🔔 Notifiche <span class="fopt">pkg</span></div>
              <div class="stgl-row" data-tg="master"><span class="stgl-lbl">Notifiche attive</span>${stgl(master,'master')}</div>
              <div class="stgl-sub${master?'':' slocked'}" id="s-tgl-sub">
                <div class="stgl-row" data-tg="push"><span class="stgl-lbl">📱 Push smartphone</span>${stgl(bPush,'push')}</div>
                <div class="stgl-row" data-tg="google"><span class="stgl-lbl">🔊 Google Home</span>${stgl(bGoog,'google')}</div>
                <div class="stgl-row" data-tg="alexa"><span class="stgl-lbl">📣 Amazon Alexa</span>${stgl(bAlex,'alexa')}</div>
              </div>
              <div class="fsec">Orari media (Google / Alexa)</div>
              <div class="stime-row"><input class="stime" type="time" id="s-mstart" value="${mStart}"><span class="stime-sep">–</span><input class="stime" type="time" id="s-mend" value="${mEnd}"></div>
              <div class="fsec">Orari push (smartphone)</div>
              <div class="stime-row"><input class="stime" type="time" id="s-pstart" value="${pStart}"><span class="stime-sep">–</span><input class="stime" type="time" id="s-pend" value="${pEnd}"></div>
            </div>
            <div class="sensbox">
              <div class="flbl">🔄 Reset manuali</div>
              <div class="srst-row">
                <button class="srst-btn" id="s-rst-oggi">↺ Oggi</button>
                <button class="srst-btn" id="s-rst-sett">↺ Settimana</button>
                <button class="srst-btn" id="s-rst-mese">↺ Mese</button>
              </div>
            </div>
            <button class="fsave" id="s-save">💾 Salva</button>
          </div>
          <div class="sov-prev">
            <div class="prev-ttl">Anteprima live</div>
            <div class="prev-wrap"><posta-card id="posta-preview-card" style="--fgear:none;display:block;"></posta-card></div>
            <div class="lsect">
              <div class="prev-ttl">Dimensione card</div>
              <div class="layout-row">
                <span class="layout-lbl">Altezza</span>
                <input type="range" class="lslider" id="s-cardscale" min="20" max="100" step="5" value="${cardScaleV}">
                <span class="layout-val" id="s-cardscale-lbl">${cardScaleV>=100?'Auto (100%)':cardScaleV+'%'}</span>
              </div>
              <div class="layout-row">
                <span class="layout-lbl">Larghezza</span>
                <input type="range" class="lslider" id="s-cardw" min="20" max="100" step="5" value="${cardWV}">
                <span class="layout-val" id="s-cardw-lbl">${cardWV>=100?'Auto (100%)':cardWV+'%'}</span>
              </div>
            </div>
          </div>
        </div>
      </div></div>`;
      const sr=host.shadowRoot;
      host.shadowRoot.addEventListener('click',e=>{ if(e.target.classList.contains('ov')) self._closeSettings(); });
      sr.getElementById('s-x').onclick=()=>self._closeSettings();
      const sInp=sr.getElementById('s-sensor');
      sInp.addEventListener('focus',()=>_acShow(sInp,self._h,'binary_sensor'));
      sInp.addEventListener('blur',()=>setTimeout(_acHide,160));
      sInp.addEventListener('input',()=>{ _acShow(sInp,self._h,'binary_sensor'); self._schedPrev(); });
      sr.getElementById('s-label').addEventListener('input',()=>self._schedPrev());

      const tgEid={master:'input_boolean.frarik_posta_notifiche_attive',push:'input_boolean.frarik_posta_notifica_push',google:'input_boolean.frarik_posta_notifica_google',alexa:'input_boolean.frarik_posta_notifica_alexa'};
      sr.querySelectorAll('.stgl').forEach(sw=>{
        sw.addEventListener('click',()=>{
          const tg=sw.dataset.tg, eid=tgEid[tg]; if(!eid) return;
          if(tg!=='master'){
            const sub=sr.getElementById('s-tgl-sub');
            if(!sub||sub.classList.contains('slocked')) return;
          }
          const nowOn=!sw.classList.contains('on');
          self._callSvc('homeassistant',nowOn?'turn_on':'turn_off',{entity_id:eid});
          sw.classList.toggle('on',nowOn);
          if(tg==='master') sr.getElementById('s-tgl-sub')?.classList.toggle('slocked',!nowOn);
        });
      });
      sr.getElementById('s-mstart').addEventListener('change',e=>self._setTime('input_datetime.frarik_posta_notifiche_media_inizio',e.target.value));
      sr.getElementById('s-mend').addEventListener('change',e=>self._setTime('input_datetime.frarik_posta_notifiche_media_fine',e.target.value));
      sr.getElementById('s-pstart').addEventListener('change',e=>self._setTime('input_datetime.frarik_posta_notifiche_push_inizio',e.target.value));
      sr.getElementById('s-pend').addEventListener('change',e=>self._setTime('input_datetime.frarik_posta_notifiche_push_fine',e.target.value));

      sr.getElementById('s-rst-oggi').onclick=()=>self._confirmReset('script.frarik_posta_reset_oggi','il contatore giornaliero e gli orari di oggi');
      sr.getElementById('s-rst-sett').onclick=()=>self._confirmReset('script.frarik_posta_reset_settimana','il contatore settimanale');
      sr.getElementById('s-rst-mese').onclick=()=>self._confirmReset('script.frarik_posta_reset_mese','il contatore mensile');

      sr.getElementById('s-cardscale').addEventListener('input',e=>{
        self._tCardScale=Math.max(20,Math.min(100,parseInt(e.target.value)||100));
        const lbl=sr.getElementById('s-cardscale-lbl'); if(lbl) lbl.textContent=self._tCardScale>=100?'Auto (100%)':self._tCardScale+'%';
        self._schedPrev();
      });
      sr.getElementById('s-cardw').addEventListener('input',e=>{
        self._tCardW=Math.max(20,Math.min(100,parseInt(e.target.value)||100));
        const lbl=sr.getElementById('s-cardw-lbl'); if(lbl) lbl.textContent=self._tCardW>=100?'Auto (100%)':self._tCardW+'%';
        self._schedPrev();
      });

      sr.getElementById('s-save').onclick=()=>{
        self._c.label=sr.getElementById('s-label').value||'Centro Posta';
        self._c.sensorEntity=(sr.getElementById('s-sensor').value||'').trim();
        self._c.cardScale=Math.max(20,Math.min(100,parseInt(self._tCardScale)||100));
        self._c.cardW=Math.max(20,Math.min(100,parseInt(self._tCardW)||100));
        self._save(); _acHide();
        if(self._frarikCard?.id){
          self.dispatchEvent(new CustomEvent('frarik-card-layout',{
            bubbles:true,composed:true,
            detail:{cardId:self._frarikCard.id,cardScale:self._c.cardScale,cardW:self._c.cardW}
          }));
        }
        self._destroyModal();
        self._prevSig=''; self._build();
      };
      this._updatePreview();
    }

    _closeSettings(){
      _acHide(); this._destroyModal();
      if(this._frarikCard?.id){
        this.dispatchEvent(new CustomEvent('frarik-card-layout',{
          bubbles:true,composed:true,
          detail:{cardId:this._frarikCard.id,cardScale:this._c.cardScale??100,cardW:this._c.cardW??100}
        }));
      }
    }

    _schedPrev(){
      if(this._prevTimer) clearTimeout(this._prevTimer);
      this._prevTimer=setTimeout(()=>this._updatePreview(),180);
    }

    _updatePreview(){
      const sr=this._modalHost?.shadowRoot;
      const pc=sr?.querySelector('#posta-preview-card');
      if(!pc) return;
      try{
        pc.setConfig({
          storageKey:'__prev__',
          label:sr.getElementById('s-label')?.value||this._c.label||'Centro Posta',
          sensorEntity:(sr.getElementById('s-sensor')?.value||'').trim(),
        });
        if(this._h) pc.hass=this._h;
        const sc=this._tCardScale??100;
        pc.style.display='block';
        pc.style.zoom=sc<100?sc+'%':'';
        pc.style.width=this._tCardW<100?this._tCardW+'%':'';
      }catch(err){}
    }

    _destroyModal(){ this._modalHost?.remove(); this._modalHost=null; }

    /* ── CSS ── */
    _css(){ return `
:host{display:block;height:100%;font-family:system-ui,sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
@keyframes fade-up{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(.96)}}

.card{height:100%;display:flex;flex-direction:column;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:200px;background:radial-gradient(ellipse at 20% 0%,rgba(56,189,248,.08) 0%,transparent 65%);pointer-events:none}

/* header */
.hdr{display:flex;align-items:center;gap:9px;padding:12px 15px 10px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}
.hdr-icon-wrap{width:28px;height:28px;border-radius:8px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.gbtn{width:26px;height:26px;border-radius:8px;border:none;background:rgba(255,255,255,.06);cursor:pointer;align-items:center;justify-content:center;color:#fff;flex-shrink:0;font-size:13px;transition:background .15s;display:var(--fgear,flex)}
.gbtn:hover{background:rgba(255,255,255,.12)}
.hdr-tit{flex:1;font-size:14px;font-weight:800;color:#fff;letter-spacing:.2px}

/* body scroll */
.bscroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}
.bscroll::-webkit-scrollbar{display:none}

/* corpo a 2 colonne: immagine a sinistra, numeri a destra */
.body2col{display:flex;gap:14px;padding:14px 15px 10px;align-items:stretch}
.img-col{flex:1;min-width:0;aspect-ratio:120/130}
.info-col{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center}
.num-row{display:flex;align-items:baseline;gap:9px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.num-row:last-child{border-bottom:none}
.num-n{font-size:32px;font-weight:900;color:rgba(255,255,255,.18);line-height:1;letter-spacing:-1px}
.num-n.act{color:#38bdf8;text-shadow:0 0 20px rgba(56,189,248,.3)}
.num-n.open{color:#34d399;text-shadow:0 0 20px rgba(52,211,153,.3)}
.num-n2{font-size:22px;font-weight:900;color:#fff;line-height:1}
.num-l{font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.5px;opacity:.6}

/* cassetta a parete stile "Alubox" */
@keyframes mbx-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.8px)}}
@keyframes mbx-led-pulse{0%,100%{opacity:1}50%{opacity:.55}}
@keyframes mbx-seam-pulse{0%,100%{opacity:.7}50%{opacity:1}}
.mbx-env{animation:mbx-bob 2.6s ease-in-out infinite}
.mbx-led.active{animation:mbx-led-pulse 2.2s ease-in-out infinite}
.mbx-door{transform:rotate(0deg)}
.mbx-door.open{transform:rotate(-7deg) translateY(-2px)}
.mbx-seam{opacity:.5}
.mbx-seam.active{animation:mbx-seam-pulse 2.2s ease-in-out infinite}

/* ultima consegna */
.last-box{display:flex;align-items:center;gap:10px;margin:4px 15px 16px;padding:12px 13px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px}
.last-ic{width:32px;height:32px;border-radius:9px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.22);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.last-tx{display:flex;flex-direction:column;gap:1px;min-width:0}
.last-lbl{font-size:9px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:.6px;opacity:.6}
.last-val{font-size:13px;font-weight:700;color:#fff}

/* not installed */
.ni{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;padding:26px 18px}
.ni-env{width:96px;height:104px;opacity:.4}
.ni-title{font-size:16px;font-weight:900;color:#fff}
.ni-sub{font-size:12px;color:rgba(255,255,255,.4);line-height:1.8;max-width:240px}
.ni-sub strong{color:#38bdf8;opacity:1}
`;}
  };
  customElements.define('posta-card',PostaCard);
} else {
  PostaCard=customElements.get('posta-card');
}

/* ══════════════════════════════════════════════════════════════
   openWizard — chiamato dallo Store quando si installa la card
   ══════════════════════════════════════════════════════════════ */
PostaCard.openWizard=function(hass,onDone,_tpl,opts){
  const isUpdate=!!(opts&&opts.isUpdate);
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
    .mo{width:100%;max-height:88vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(255,255,255,.12);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);animation:su .22s cubic-bezier(.32,1.12,.56,1)}
    @keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
    .mhdr{display:flex;align-items:center;gap:12px;padding:18px 18px 14px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0}
    .mico{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;color:#fff}
    .mtxt{flex:1}.mtit{font-size:15px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.3px;font-family:system-ui,sans-serif}
    .msub{font-size:11px;font-weight:700;color:#fff;opacity:.55;font-family:system-ui,sans-serif;margin-top:2px}
    .mxbtn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:8px;padding:6px 12px;color:#fff;font-size:13px;cursor:pointer;font-family:system-ui,sans-serif}
    .mbody{flex:1;overflow-y:auto;padding:16px 18px 4px;scrollbar-width:none}
    .mbody::-webkit-scrollbar{display:none}
    .sensbox{padding:14px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid #fff;display:flex;flex-direction:column;gap:18px}
    .wsec{display:flex;flex-direction:column;gap:9px}
    .wsec-hdr{display:flex;align-items:center;gap:8px}
    .wsec-ico{font-size:17px;line-height:1}
    .wsec-ttl{font-size:12px;font-weight:900;color:#fff;letter-spacing:.6px;text-transform:uppercase;font-family:system-ui,sans-serif}
    .tag{font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;font-family:system-ui,sans-serif}
    .req{background:rgba(239,68,68,.2);color:#fca5a5;border:1px solid rgba(239,68,68,.3)}
    .opt{background:rgba(255,255,255,.07);color:#fff;opacity:.6;border:1px solid rgba(255,255,255,.12)}
    .wsec-hint{font-size:11px;color:#fff;opacity:.55;font-family:system-ui,sans-serif;line-height:1.6}
    .wsec-hint code{background:rgba(255,255,255,.1);padding:1px 5px;border-radius:4px;font-size:10px;color:#fff;font-family:monospace}
    .wlist{display:flex;flex-direction:column;gap:6px}
    .wrow{display:flex;gap:6px;align-items:center}
    .winp{flex:1;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 12px;color:#fff;font-size:13px;font-family:monospace;outline:none;transition:border-color .15s}
    .winp:focus{border-color:rgba(255,255,255,.4);background:rgba(255,255,255,.09)}
    .winp.err{border-color:rgba(239,68,68,.6)!important}
    .wrem{width:32px;height:32px;flex-shrink:0;border-radius:8px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.22);color:#fca5a5;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;font-family:system-ui,sans-serif}
    .wadd{align-self:flex-start;background:none;border:1px dashed rgba(255,255,255,.18);border-radius:9px;padding:7px 16px;color:#fff;opacity:.6;font-size:12px;font-weight:600;cursor:pointer;font-family:system-ui,sans-serif;transition:all .15s}
    .wadd:hover{opacity:1;border-color:rgba(255,255,255,.4)}
    .werr{font-size:11px;color:#fca5a5;font-family:system-ui,sans-serif}
    .wdiv{height:1px;background:rgba(255,255,255,.08)}
    .mftr{padding:14px 18px 28px;flex-shrink:0;border-top:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;gap:8px}
    .wbtn-ok{width:100%;padding:14px;border-radius:13px;background:#38bdf8;border:none;color:#fff;font-size:14px;font-weight:800;cursor:pointer;font-family:system-ui,sans-serif}
    .wbtn-ok:disabled{opacity:.5;cursor:default}
    .winst-err{font-size:12px;color:#fca5a5;font-family:system-ui,sans-serif;text-align:center;display:none}
  </style>
  <div class="ov"><div class="mo" id="wiz_mo">
    <div class="mhdr">
      <div class="mico">📦</div>
      <div class="mtxt">
        <div class="mtit">${isUpdate?'Aggiorna Package Posta':'Configura Package Posta'}</div>
        <div class="msub">Inserisci i tuoi sensori e dispositivi</div>
      </div>
      <button class="mxbtn" id="wiz_close">✕</button>
    </div>
    <div class="mbody">
      <div class="sensbox">
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
    </div>
    <div class="mftr">
      <button class="wbtn-ok" id="wiz_install">${isUpdate?'🔄 Aggiorna Package':'⚡ Installa Package'}</button>
      <div class="winst-err" id="wiz_inst_err"></div>
    </div>
  </div></div>`;

  const sr=host.shadowRoot;
  const _WIZ_KEY='frarik_pkg_wizard_posta-card';

  /* helper: aggiunge una riga ad un gruppo e la restituisce */
  function _addRow(grp,val=''){
    const rid=(grp==='google'?_ridG++:grp==='alexa'?_ridA++:_ridP++);
    const listEl=sr.getElementById(`w_${grp}_list`);
    const ph={google:'media_player.google_home_2',alexa:'media_player.alexa_2',push:'mobile_app_samsung_2'}[grp]||'';
    const row=document.createElement('div');
    row.className='wrow'; row.dataset.group=grp; row.dataset.rid=rid;
    row.innerHTML=`<input class="winp" placeholder="${ph}" type="text" autocomplete="off" spellcheck="false" value="${val.replace(/"/g,'&quot;')}"/><button class="wrem" data-rid="${rid}" data-grp="${grp}">✕</button>`;
    listEl.appendChild(row);
    return row.querySelector('.winp');
  }

  /* pre-carica config salvata */
  try{
    const saved=JSON.parse(localStorage.getItem(_WIZ_KEY)||'null');
    if(saved){
      if(saved.sensor) sr.getElementById('w_sensor').value=saved.sensor;
      /* per i gruppi opzionali: rimpiazza la riga esistente con i valori salvati */
      ['google','alexa','push'].forEach(grp=>{
        const arr=(saved[grp]||[]).filter(Boolean);
        if(!arr.length) return;
        const listEl=sr.getElementById(`w_${grp}_list`);
        /* aggiorna prima riga */
        const first=listEl.querySelector('.winp'); if(first) first.value=arr[0];
        /* aggiungi righe extra */
        arr.slice(1).forEach(v=>_addRow(grp,v));
      });
    }
  }catch(e){}

  sr.getElementById('wiz_close').addEventListener('click',()=>destroy());
  host.shadowRoot.addEventListener('click',e=>{ if(e.target.classList.contains('ov')) destroy(); });

  sr.getElementById('wiz_mo').addEventListener('click',e=>{
    const addBtn=e.target.closest('[data-add]');
    if(addBtn){
      const grp=addBtn.dataset.add;
      const ni=_addRow(grp,'');
      ni.focus(); _bindAcW(ni,grp);
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
    const gVals=_vals('google'), aVals=_vals('alexa'), pVals=_vals('push');
    const btn=sr.getElementById('wiz_install'), errBnr=sr.getElementById('wiz_inst_err');
    btn.textContent='⚙️ Installazione…'; btn.disabled=true; errBnr.style.display='none';
    let yaml=_buildCustomPkg(sensor,gVals,aVals,pVals,_tpl);
    btn.textContent='⚙️ Installazione…';
    try{
      const m=location.pathname.match(/^(.*\/api\/hassio_ingress\/[^/]+)/);
      const base=location.origin+(m?m[1]:'');
      const r=await fetch(base+'/api/frarik/pkg/install',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'frarik/frarik_posta.yaml',content:yaml})});
      const j=await r.json().catch(()=>({}));
      if(r.ok&&j.ok){
        /* salva config per futuri aggiornamenti */
        try{ localStorage.setItem(_WIZ_KEY,JSON.stringify({sensor,google:gVals,alexa:aVals,push:pVals})); }catch(e){}
        _acHide();
        sr.getElementById('wiz_mo').querySelector('.mbody').innerHTML=`
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:36px 20px;gap:16px;text-align:center">
            <div style="font-size:52px">✅</div>
            <div style="font-size:16px;font-weight:900;color:#fff;font-family:system-ui,sans-serif">Package installato!</div>
            <div style="font-size:13px;color:rgba(255,255,255,.6);font-family:system-ui,sans-serif;line-height:1.8">
              Riavvia <strong style="color:#fff;opacity:1">Home Assistant</strong> per attivare le entità.<br>
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

/* Reinstalla il PKG con config già nota — usato per silent auto-update dallo store */
PostaCard._buildPkgFromConfig=function(cfg,_tpl){
  return _buildCustomPkg(cfg.sensor||'',cfg.google||[],cfg.alexa||[],cfg.push||[],_tpl);
};

/* ── registrazione customCards ── */
const _ccArr=(window.customCards=window.customCards||[]);
const _ccIdx=_ccArr.findIndex(c=>c&&c.type==='posta-card');
const _ccEntry={type:'posta-card',name:'Centro Controllo Posta',description:'Monitora la cassetta postale: consegne giornaliere con orari, storico, notifiche push/Google/Alexa.',icon:'mdi:mailbox',frarik_pkg_check:'sensor.frarik_posta_versione',frarik_pkg_id:'frarik_posta',frarik_pkg_version:'2.0',frarik_no_edit:true};
if(_ccIdx>=0) _ccArr[_ccIdx]=_ccEntry; else _ccArr.push(_ccEntry);
})();
