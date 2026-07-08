/**
 * antizanzare-card.js v3.0
 */

// ─── FratechStore Integration ────────────────────────────────────────────────
;(function () {
  'use strict';

  var _AZ_WIZ_KEY = 'frarik_pkg_wizard_antizanzare';

  var _AZ_PKG_YAML = `homeassistant:
  customize:
    package.node_anchors:
      customize: &customize
        package: 'Frarik Anti Zanzare'
        author: 'Frarik / Fratech'
        reference: 'github.com/Frarik/cards'
      setting:

####################################################
#                                                  #
#              IMPOSTAZIONI PACKAGE                #
#                                                  #
####################################################

        Sensore Vento:               &sensore_vento      'IL_TUO_SENSORE_VENTO'
        Sensore Pioggia:             &sensore_pioggia_az 'IL_TUO_SENSORE_PIOGGIA'
        Sensore Probabilità Pioggia: &sensore_prob_pioggia 'IL_TUO_SENSORE_PROBABILITA_PIOGGIA'
        Sensore Presenza:            &sensore_presenza   'IL_TUO_SENSORE_PRESENZA'
        Sensore Livello Tanica: &sensore_livello    'IL_TUO_SENSORE_LIVELLO_TANICA'
        Sensore Perdita Acqua:  &sensore_perdita    'IL_TUO_SENSORE_PERDITA'
        Sensore Pompa:          &sensore_pompa      'IL_TUO_SENSORE_POMPA'
        Presa Antizanzare:      &presa_az           'IL_TUO_PRESA_ANTIZANZARE'
        Device push:            &push_az
          - service: IL_TUO_MOBILE_APP
        Media Player Alexa:     &alexa_az
          - IL_TUO_MEDIA_PLAYER_ALEXA

# INPUT BOOLEAN - Giorni attivi
input_boolean:
  frarik_antizanzare_lunedi:
    name: "Anti Zanzare Lunedì"
    icon: mdi:calendar
  frarik_antizanzare_martedi:
    name: "Anti Zanzare Martedì"
    icon: mdi:calendar
  frarik_antizanzare_mercoledi:
    name: "Anti Zanzare Mercoledì"
    icon: mdi:calendar
  frarik_antizanzare_giovedi:
    name: "Anti Zanzare Giovedì"
    icon: mdi:calendar
  frarik_antizanzare_venerdi:
    name: "Anti Zanzare Venerdì"
    icon: mdi:calendar
  frarik_antizanzare_sabato:
    name: "Anti Zanzare Sabato"
    icon: mdi:calendar
  frarik_antizanzare_domenica:
    name: "Anti Zanzare Domenica"
    icon: mdi:calendar

  # Stati sistema
  frarik_antizanzare_automazione_attiva:
    name: "Automazione Anti Zanzare Attiva"
    icon: mdi:autorenew
  frarik_antizanzare_manuale_attiva:
    name: "Anti Zanzare Manuale Attiva"
    icon: mdi:hand-back-right
  frarik_antizanzare_notify_push:
    name: "Notifiche Push Anti Zanzare"
    icon: mdi:bell
  frarik_antizanzare_notify_alexa:
    name: "Notifiche Alexa Anti Zanzare"
    icon: mdi:speaker
  frarik_antizanzare_presenza_attiva:
    name: "Pausa per Presenza"
    icon: mdi:motion-sensor
  frarik_antizanzare_abilita_soglia_pioggia:
    name: "Abilita Blocco Pioggia"
    initial: true
    icon: mdi:weather-rainy
  frarik_antizanzare_abilita_soglia_vento:
    name: "Abilita Blocco Vento"
    initial: true
    icon: mdi:weather-windy

# INPUT NUMBER - Cicli per giorno
input_number:
  # SISTEMA GIORNALIERO - Numero cicli per giorno
  # LUNEDÌ
  frarik_antizanzare_lunedi_num_cicli:
    name: "Lunedì - Numero Cicli"
    min: 0
    max: 5
    step: 1
    mode: slider
    icon: mdi:counter

  frarik_antizanzare_lunedi_durata_ciclo1:
    name: "Lunedì - Durata Ciclo 1"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_lunedi_durata_ciclo2:
    name: "Lunedì - Durata Ciclo 2"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_lunedi_durata_ciclo3:
    name: "Lunedì - Durata Ciclo 3"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_lunedi_durata_ciclo4:
    name: "Lunedì - Durata Ciclo 4"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_lunedi_durata_ciclo5:
    name: "Lunedì - Durata Ciclo 5"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  # MARTEDÌ
  frarik_antizanzare_martedi_num_cicli:
    name: "Martedì - Numero Cicli"
    min: 0
    max: 5
    step: 1
    mode: slider
    icon: mdi:counter

  frarik_antizanzare_martedi_durata_ciclo1:
    name: "Martedì - Durata Ciclo 1"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_martedi_durata_ciclo2:
    name: "Martedì - Durata Ciclo 2"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_martedi_durata_ciclo3:
    name: "Martedì - Durata Ciclo 3"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_martedi_durata_ciclo4:
    name: "Martedì - Durata Ciclo 4"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_martedi_durata_ciclo5:
    name: "Martedì - Durata Ciclo 5"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  # MERCOLEDÌ
  frarik_antizanzare_mercoledi_num_cicli:
    name: "Mercoledì - Numero Cicli"
    min: 0
    max: 5
    step: 1
    mode: slider
    icon: mdi:counter

  frarik_antizanzare_mercoledi_durata_ciclo1:
    name: "Mercoledì - Durata Ciclo 1"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_mercoledi_durata_ciclo2:
    name: "Mercoledì - Durata Ciclo 2"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_mercoledi_durata_ciclo3:
    name: "Mercoledì - Durata Ciclo 3"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_mercoledi_durata_ciclo4:
    name: "Mercoledì - Durata Ciclo 4"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_mercoledi_durata_ciclo5:
    name: "Mercoledì - Durata Ciclo 5"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  # GIOVEDÌ
  frarik_antizanzare_giovedi_num_cicli:
    name: "Giovedì - Numero Cicli"
    min: 0
    max: 5
    step: 1
    mode: slider
    icon: mdi:counter

  frarik_antizanzare_giovedi_durata_ciclo1:
    name: "Giovedì - Durata Ciclo 1"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_giovedi_durata_ciclo2:
    name: "Giovedì - Durata Ciclo 2"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_giovedi_durata_ciclo3:
    name: "Giovedì - Durata Ciclo 3"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_giovedi_durata_ciclo4:
    name: "Giovedì - Durata Ciclo 4"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_giovedi_durata_ciclo5:
    name: "Giovedì - Durata Ciclo 5"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  # VENERDÌ
  frarik_antizanzare_venerdi_num_cicli:
    name: "Venerdì - Numero Cicli"
    min: 0
    max: 5
    step: 1
    mode: slider
    icon: mdi:counter

  frarik_antizanzare_venerdi_durata_ciclo1:
    name: "Venerdì - Durata Ciclo 1"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_venerdi_durata_ciclo2:
    name: "Venerdì - Durata Ciclo 2"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_venerdi_durata_ciclo3:
    name: "Venerdì - Durata Ciclo 3"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_venerdi_durata_ciclo4:
    name: "Venerdì - Durata Ciclo 4"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_venerdi_durata_ciclo5:
    name: "Venerdì - Durata Ciclo 5"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  # SABATO
  frarik_antizanzare_sabato_num_cicli:
    name: "Sabato - Numero Cicli"
    min: 0
    max: 5
    step: 1
    mode: slider
    icon: mdi:counter

  frarik_antizanzare_sabato_durata_ciclo1:
    name: "Sabato - Durata Ciclo 1"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_sabato_durata_ciclo2:
    name: "Sabato - Durata Ciclo 2"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_sabato_durata_ciclo3:
    name: "Sabato - Durata Ciclo 3"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_sabato_durata_ciclo4:
    name: "Sabato - Durata Ciclo 4"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_sabato_durata_ciclo5:
    name: "Sabato - Durata Ciclo 5"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  # DOMENICA
  frarik_antizanzare_domenica_num_cicli:
    name: "Domenica - Numero Cicli"
    min: 0
    max: 5
    step: 1
    mode: slider
    icon: mdi:counter

  frarik_antizanzare_domenica_durata_ciclo1:
    name: "Domenica - Durata Ciclo 1"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_domenica_durata_ciclo2:
    name: "Domenica - Durata Ciclo 2"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_domenica_durata_ciclo3:
    name: "Domenica - Durata Ciclo 3"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_domenica_durata_ciclo4:
    name: "Domenica - Durata Ciclo 4"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  frarik_antizanzare_domenica_durata_ciclo5:
    name: "Domenica - Durata Ciclo 5"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer

  # Anti Zanzare manuale
  frarik_antizanzare_durata_manuale:
    name: "Durata Anti Zanzare Manuale"
    min: 10
    max: 3600
    step: 10
    mode: box
    unit_of_measurement: "sec"
    icon: mdi:timer-cog

  # Soglia probabilità pioggia
  frarik_antizanzare_soglia_pioggia:
    name: "Soglia Probabilità Pioggia (%)"
    min: 0
    max: 100
    step: 5
    initial: 50
    mode: slider
    unit_of_measurement: "%"
    icon: mdi:weather-rainy

  # CICLI TARGET MENSILI
  frarik_antizanzare_cicli_target_mensili:
    name: "Cicli Target Mensili"
    min: 1
    max: 200
    step: 1
    mode: box
    unit_of_measurement: "cicli"
    icon: mdi:target
  frarik_antizanzare_soglia_vento:
    name: "Soglia Velocità Vento (km/h)"
    min: 0
    max: 100
    step: 1
    mode: slider
    unit_of_measurement: "km/h"
    icon: mdi:weather-windy

  frarik_antizanzare_soglia_livello_tanica:
    name: "Soglia Livello Tanica (%)"
    min: 0
    max: 100
    step: 5
    initial: 20
    mode: slider
    unit_of_measurement: "%"
    icon: mdi:water-alert

# INPUT DATETIME - Orari cicli
input_datetime:
  # SISTEMA GIORNALIERO - Orari cicli per giorno
  # LUNEDÌ
  frarik_antizanzare_lunedi_orario_ciclo1:
    name: "Lunedì - Orario Ciclo 1"
    has_date: false
    has_time: true

  frarik_antizanzare_lunedi_orario_ciclo2:
    name: "Lunedì - Orario Ciclo 2"
    has_date: false
    has_time: true

  frarik_antizanzare_lunedi_orario_ciclo3:
    name: "Lunedì - Orario Ciclo 3"
    has_date: false
    has_time: true

  frarik_antizanzare_lunedi_orario_ciclo4:
    name: "Lunedì - Orario Ciclo 4"
    has_date: false
    has_time: true

  frarik_antizanzare_lunedi_orario_ciclo5:
    name: "Lunedì - Orario Ciclo 5"
    has_date: false
    has_time: true

  # MARTEDÌ
  frarik_antizanzare_martedi_orario_ciclo1:
    name: "Martedì - Orario Ciclo 1"
    has_date: false
    has_time: true

  frarik_antizanzare_martedi_orario_ciclo2:
    name: "Martedì - Orario Ciclo 2"
    has_date: false
    has_time: true

  frarik_antizanzare_martedi_orario_ciclo3:
    name: "Martedì - Orario Ciclo 3"
    has_date: false
    has_time: true

  frarik_antizanzare_martedi_orario_ciclo4:
    name: "Martedì - Orario Ciclo 4"
    has_date: false
    has_time: true

  frarik_antizanzare_martedi_orario_ciclo5:
    name: "Martedì - Orario Ciclo 5"
    has_date: false
    has_time: true

  # MERCOLEDÌ
  frarik_antizanzare_mercoledi_orario_ciclo1:
    name: "Mercoledì - Orario Ciclo 1"
    has_date: false
    has_time: true

  frarik_antizanzare_mercoledi_orario_ciclo2:
    name: "Mercoledì - Orario Ciclo 2"
    has_date: false
    has_time: true

  frarik_antizanzare_mercoledi_orario_ciclo3:
    name: "Mercoledì - Orario Ciclo 3"
    has_date: false
    has_time: true

  frarik_antizanzare_mercoledi_orario_ciclo4:
    name: "Mercoledì - Orario Ciclo 4"
    has_date: false
    has_time: true

  frarik_antizanzare_mercoledi_orario_ciclo5:
    name: "Mercoledì - Orario Ciclo 5"
    has_date: false
    has_time: true

  # GIOVEDÌ
  frarik_antizanzare_giovedi_orario_ciclo1:
    name: "Giovedì - Orario Ciclo 1"
    has_date: false
    has_time: true

  frarik_antizanzare_giovedi_orario_ciclo2:
    name: "Giovedì - Orario Ciclo 2"
    has_date: false
    has_time: true

  frarik_antizanzare_giovedi_orario_ciclo3:
    name: "Giovedì - Orario Ciclo 3"
    has_date: false
    has_time: true

  frarik_antizanzare_giovedi_orario_ciclo4:
    name: "Giovedì - Orario Ciclo 4"
    has_date: false
    has_time: true

  frarik_antizanzare_giovedi_orario_ciclo5:
    name: "Giovedì - Orario Ciclo 5"
    has_date: false
    has_time: true

  # VENERDÌ
  frarik_antizanzare_venerdi_orario_ciclo1:
    name: "Venerdì - Orario Ciclo 1"
    has_date: false
    has_time: true

  frarik_antizanzare_venerdi_orario_ciclo2:
    name: "Venerdì - Orario Ciclo 2"
    has_date: false
    has_time: true

  frarik_antizanzare_venerdi_orario_ciclo3:
    name: "Venerdì - Orario Ciclo 3"
    has_date: false
    has_time: true

  frarik_antizanzare_venerdi_orario_ciclo4:
    name: "Venerdì - Orario Ciclo 4"
    has_date: false
    has_time: true

  frarik_antizanzare_venerdi_orario_ciclo5:
    name: "Venerdì - Orario Ciclo 5"
    has_date: false
    has_time: true

  # SABATO
  frarik_antizanzare_sabato_orario_ciclo1:
    name: "Sabato - Orario Ciclo 1"
    has_date: false
    has_time: true

  frarik_antizanzare_sabato_orario_ciclo2:
    name: "Sabato - Orario Ciclo 2"
    has_date: false
    has_time: true

  frarik_antizanzare_sabato_orario_ciclo3:
    name: "Sabato - Orario Ciclo 3"
    has_date: false
    has_time: true

  frarik_antizanzare_sabato_orario_ciclo4:
    name: "Sabato - Orario Ciclo 4"
    has_date: false
    has_time: true

  frarik_antizanzare_sabato_orario_ciclo5:
    name: "Sabato - Orario Ciclo 5"
    has_date: false
    has_time: true

  # DOMENICA
  frarik_antizanzare_domenica_orario_ciclo1:
    name: "Domenica - Orario Ciclo 1"
    has_date: false
    has_time: true

  frarik_antizanzare_domenica_orario_ciclo2:
    name: "Domenica - Orario Ciclo 2"
    has_date: false
    has_time: true

  frarik_antizanzare_domenica_orario_ciclo3:
    name: "Domenica - Orario Ciclo 3"
    has_date: false
    has_time: true

  frarik_antizanzare_domenica_orario_ciclo4:
    name: "Domenica - Orario Ciclo 4"
    has_date: false
    has_time: true

  frarik_antizanzare_domenica_orario_ciclo5:
    name: "Domenica - Orario Ciclo 5"
    has_date: false
    has_time: true
  frarik_antizanzare_orario_inizio_notifiche:
    name: "Orario Inizio Notifiche Anti Zanzare"
    has_date: false
    has_time: true
  frarik_antizanzare_orario_fine_notifiche:
    name: "Orario Fine Notifiche Anti Zanzare"
    has_date: false
    has_time: true

# INPUT TEXT
input_text:
  frarik_antizanzare_nome:
    name: "Nome Anti Zanzare"
    max: 64

  frarik_antizanzare_entity_presa:
    name: "Entity Presa Anti Zanzare"
    max: 128
    initial: *presa_az

# INPUT BUTTON - Comandi
input_button:
  frarik_antizanzare_start_automazione:
    name: "Avvia Automazione Anti Zanzare"
    icon: mdi:play-circle

  frarik_antizanzare_stop_automazione:
    name: "Ferma Automazione Anti Zanzare"
    icon: mdi:stop-circle

  frarik_antizanzare_start_manuale:
    name: "Avvia Anti Zanzare Manuale"
    icon: mdi:play-circle-outline

  frarik_antizanzare_stop_manuale:
    name: "Ferma Anti Zanzare Manuale"
    icon: mdi:stop-circle-outline

# TIMER
timer:
  frarik_antizanzare_ciclo_timer:
    name: "Timer Ciclo Anti Zanzare"
    icon: mdi:clock
    restore: true

  frarik_antizanzare_manuale_timer:
    name: "Timer Anti Zanzare Manuale"
    icon: mdi:hand-back-right
    restore: true

# COUNTER
counter:
  frarik_antizanzare_cicli_mensili:
    name: "Cicli Anti Zanzare Questo Mese"
    step: 1
    icon: mdi:counter

  frarik_antizanzare_cicli_rimanenti:
    name: "Cicli Anti Zanzare Rimanenti Questo Mese"
    step: 1
    icon: mdi:counter-outline

# NOTIFY GROUP
notify:
  - name: frarik_antizanzare_notify
    platform: group
    services: *push_az

# SENSORI TEMPLATE
template:
  - sensor:
      - name: "Frarik Antizanzare Versione"
        state: "2.0"
        icon: mdi:package-variant-closed

  - trigger:
      - platform: time_pattern
        seconds: "/1"  # Aggiorna ogni secondo
    sensor:
      # Sensore stato anti_zanzare
      - name: "Frarik Antizanzare Stato Sistema"
        state: >
          {% if is_state('input_boolean.frarik_antizanzare_manuale_attiva', 'on') %}
            Manuale Attiva
          {% elif is_state('timer.frarik_antizanzare_ciclo_timer', 'active') %}
            Ciclo in Corso
          {% elif is_state('input_boolean.frarik_antizanzare_automazione_attiva', 'on') %}
            Automazione Attiva
          {% else %}
            Spenta
          {% endif %}
        icon: >
          {% if is_state('input_boolean.frarik_antizanzare_manuale_attiva', 'on') %}
            mdi:hand-back-right
          {% elif is_state('timer.frarik_antizanzare_ciclo_timer', 'active') %}
            mdi:sprinkler-variant
          {% elif is_state('input_boolean.frarik_antizanzare_automazione_attiva', 'on') %}
            mdi:autorenew
          {% else %}
            mdi:sprinkler-variant-off
          {% endif %}

      # Sensore prossimo ciclo completo - trova il prossimo ciclo tra tutti quelli configurati
      - name: "Frarik Antizanzare Prossimo Ciclo Completo"
        state: >
          {% if not is_state('input_boolean.frarik_antizanzare_automazione_attiva', 'on') %}
            Automazione Disattivata
          {% else %}
            {% set current_time = now() %}
            {% set current_day = current_time.weekday() %}
            {% set current_timestamp = as_timestamp(current_time) %}
            {% set day_names = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'] %}
            {% set day_labels = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'] %}
            {% set day_entities = [
              'input_boolean.frarik_antizanzare_lunedi',
              'input_boolean.frarik_antizanzare_martedi', 
              'input_boolean.frarik_antizanzare_mercoledi',
              'input_boolean.frarik_antizanzare_giovedi',
              'input_boolean.frarik_antizanzare_venerdi',
              'input_boolean.frarik_antizanzare_sabato',
              'input_boolean.frarik_antizanzare_domenica'
            ] %}

            {% set next_cycles = [] %}

            {# Cicla attraverso i prossimi 7 giorni #}
            {% for day_offset in range(8) %}
              {% set check_day = (current_day + day_offset) % 7 %}
              {% set check_date = (current_time + timedelta(days=day_offset)).date() %}
              {% set day_name = day_names[check_day] %}
              {% set day_label = day_labels[check_day] %}

              {# Controlla solo se il giorno è attivo #}
              {% if is_state(day_entities[check_day], 'on') %}
                {% set num_cicli = states('input_number.frarik_antizanzare_' + day_name + '_num_cicli') | int(0) %}

                {# Cicla attraverso tutti i cicli del giorno #}
                {% for ciclo in range(1, num_cicli + 1) %}
                  {% set orario_entity = 'input_datetime.frarik_antizanzare_' + day_name + '_orario_ciclo' + ciclo|string %}
                  {% set durata_entity = 'input_number.frarik_antizanzare_' + day_name + '_durata_ciclo' + ciclo|string %}

                  {% if states(orario_entity) not in ['unknown', 'unavailable'] and 
                        states(durata_entity) not in ['unknown', 'unavailable'] %}

                    {% set orario = states(orario_entity) %}
                    {% set durata = states(durata_entity) | int(0) %}

                    {# Crea timestamp del ciclo #}
                    {% set cycle_time = strptime(check_date.strftime('%Y-%m-%d') + ' ' + orario, '%Y-%m-%d %H:%M:%S') %}
                    {% set cycle_timestamp = as_timestamp(cycle_time) %}

                    {# Se è oggi, controlla che non sia già passato #}
                    {% if day_offset == 0 and cycle_timestamp <= current_timestamp %}
                      {# Ciclo già passato oggi, salta #}
                    {% else %}
                      {% set next_cycles = next_cycles + [
                        {
                          'timestamp': cycle_timestamp,
                          'day': day_label,
                          'ciclo': ciclo,
                          'orario': orario,
                          'durata': durata,
                          'day_offset': day_offset
                        }
                      ] %}
                    {% endif %}
                  {% endif %}
                {% endfor %}
              {% endif %}
            {% endfor %}

            {# Ordina per timestamp e prendi il primo #}
            {% if next_cycles %}
              {% set sorted_cycles = next_cycles | sort(attribute='timestamp') %}
              {% set next_cycle = sorted_cycles[0] %}
              {% if next_cycle.day_offset == 0 %}
                Oggi {{ next_cycle.orario[:5] }} - Ciclo {{ next_cycle.ciclo }}
              {% elif next_cycle.day_offset == 1 %}
                Domani {{ next_cycle.orario[:5] }} - Ciclo {{ next_cycle.ciclo }}
              {% else %}
                {{ next_cycle.day }} {{ next_cycle.orario[:5] }} - Ciclo {{ next_cycle.ciclo }}
              {% endif %}
            {% else %}
              Nessun ciclo programmato
            {% endif %}
          {% endif %}
        icon: mdi:calendar-clock
        attributes:
          next_cycle_timestamp: >
            {% if is_state('input_boolean.frarik_antizanzare_automazione_attiva', 'on') %}
              {% set current_time = now() %}
              {% set current_day = current_time.weekday() %}
              {% set current_timestamp = as_timestamp(current_time) %}
              {% set day_names = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'] %}
              {% set day_entities = [
                'input_boolean.frarik_antizanzare_lunedi',
                'input_boolean.frarik_antizanzare_martedi', 
                'input_boolean.frarik_antizanzare_mercoledi',
                'input_boolean.frarik_antizanzare_giovedi',
                'input_boolean.frarik_antizanzare_venerdi',
                'input_boolean.frarik_antizanzare_sabato',
                'input_boolean.frarik_antizanzare_domenica'
              ] %}
              {% set next_cycles = [] %}

              {% for day_offset in range(8) %}
                {% set check_day = (current_day + day_offset) % 7 %}
                {% set check_date = (current_time + timedelta(days=day_offset)).date() %}
                {% set day_name = day_names[check_day] %}

                {% if is_state(day_entities[check_day], 'on') %}
                  {% set num_cicli = states('input_number.frarik_antizanzare_' + day_name + '_num_cicli') | int(0) %}

                  {% for ciclo in range(1, num_cicli + 1) %}
                    {% set orario_entity = 'input_datetime.frarik_antizanzare_' + day_name + '_orario_ciclo' + ciclo|string %}
                    {% set durata_entity = 'input_number.frarik_antizanzare_' + day_name + '_durata_ciclo' + ciclo|string %}

                    {% if states(orario_entity) not in ['unknown', 'unavailable'] and 
                          states(durata_entity) not in ['unknown', 'unavailable'] %}
                      {% set orario = states(orario_entity) %}
                      {% set durata = states(durata_entity) | int(0) %}
                      {% set cycle_time = strptime(check_date.strftime('%Y-%m-%d') + ' ' + orario, '%Y-%m-%d %H:%M:%S') %}
                      {% set cycle_timestamp = as_timestamp(cycle_time) %}

                      {% if day_offset > 0 or cycle_timestamp > current_timestamp %}
                        {% set next_cycles = next_cycles + [
                          {
                            'timestamp': cycle_timestamp,
                            'durata': durata
                          }
                        ] %}
                      {% endif %}
                    {% endif %}
                  {% endfor %}
                {% endif %}
              {% endfor %}

              {% if next_cycles %}
                {% set sorted_cycles = next_cycles | sort(attribute='timestamp') %}
                {{ sorted_cycles[0].timestamp }}
              {% endif %}
            {% endif %}
          next_cycle_duration: >
            {% if is_state('input_boolean.frarik_antizanzare_automazione_attiva', 'on') %}
              {% set current_time = now() %}
              {% set current_day = current_time.weekday() %}
              {% set current_timestamp = as_timestamp(current_time) %}
              {% set day_names = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'] %}
              {% set day_entities = [
                'input_boolean.frarik_antizanzare_lunedi',
                'input_boolean.frarik_antizanzare_martedi', 
                'input_boolean.frarik_antizanzare_mercoledi',
                'input_boolean.frarik_antizanzare_giovedi',
                'input_boolean.frarik_antizanzare_venerdi',
                'input_boolean.frarik_antizanzare_sabato',
                'input_boolean.frarik_antizanzare_domenica'
              ] %}
              {% set next_cycles = [] %}

              {% for day_offset in range(8) %}
                {% set check_day = (current_day + day_offset) % 7 %}
                {% set check_date = (current_time + timedelta(days=day_offset)).date() %}
                {% set day_name = day_names[check_day] %}

                {% if is_state(day_entities[check_day], 'on') %}
                  {% set num_cicli = states('input_number.frarik_antizanzare_' + day_name + '_num_cicli') | int(0) %}

                  {% for ciclo in range(1, num_cicli + 1) %}
                    {% set orario_entity = 'input_datetime.frarik_antizanzare_' + day_name + '_orario_ciclo' + ciclo|string %}
                    {% set durata_entity = 'input_number.frarik_antizanzare_' + day_name + '_durata_ciclo' + ciclo|string %}

                    {% if states(orario_entity) not in ['unknown', 'unavailable'] and 
                          states(durata_entity) not in ['unknown', 'unavailable'] %}
                      {% set orario = states(orario_entity) %}
                      {% set durata = states(durata_entity) | int(0) %}
                      {% set cycle_time = strptime(check_date.strftime('%Y-%m-%d') + ' ' + orario, '%Y-%m-%d %H:%M:%S') %}
                      {% set cycle_timestamp = as_timestamp(cycle_time) %}

                      {% if day_offset > 0 or cycle_timestamp > current_timestamp %}
                        {% set next_cycles = next_cycles + [
                          {
                            'timestamp': cycle_timestamp,
                            'durata': durata
                          }
                        ] %}
                      {% endif %}
                    {% endif %}
                  {% endfor %}
                {% endif %}
              {% endfor %}

              {% if next_cycles %}
                {% set sorted_cycles = next_cycles | sort(attribute='timestamp') %}
                {{ sorted_cycles[0].durata }}
              {% endif %}
            {% endif %}




            {% if is_state('input_boolean.frarik_antizanzare_automazione_attiva', 'on') %}
              {% set current_time = now() %}
              {% set current_timestamp = as_timestamp(current_time) %}
              {% set current_day = current_time.weekday() %} 
              {% set day_names = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'] %}
              {% set day_entities = [
                'input_boolean.frarik_antizanzare_lunedi',
                'input_boolean.frarik_antizanzare_martedi', 
                'input_boolean.frarik_antizanzare_mercoledi',
                'input_boolean.frarik_antizanzare_giovedi',
                'input_boolean.frarik_antizanzare_venerdi',
                'input_boolean.frarik_antizanzare_sabato',
                'input_boolean.frarik_antizanzare_domenica'
              ] %}

              {% set next_cycles = [] %}

              {# Cicla attraverso i prossimi 7 giorni #}
              {% for day_offset in range(8) %}
                {% set check_day = (current_day + day_offset) % 7 %}
                {% set check_date = (current_time + timedelta(days=day_offset)).date() %}
                {% set day_name = day_names[check_day] %}

                {# Controlla solo se il giorno è attivo #}
                {% if is_state(day_entities[check_day], 'on') %}
                  {% set num_cicli = states('input_number.frarik_antizanzare_' + day_name + '_num_cicli') | int(0) %}

                  {# Cicla attraverso tutti i cicli del giorno #}
                  {% for ciclo in range(1, num_cicli + 1) %}
                    {% set orario_entity = 'input_datetime.frarik_antizanzare_' + day_name + '_orario_ciclo' + ciclo|string %}
                    {% set durata_entity = 'input_number.frarik_antizanzare_' + day_name + '_durata_ciclo' + ciclo|string %}

                    {% if states(orario_entity) not in ['unknown', 'unavailable'] and 
                          states(durata_entity) not in ['unknown', 'unavailable'] %}

                      {% set orario = states(orario_entity) %}
                      {% set durata = states(durata_entity) | int(0) %}

                      {# Crea timestamp del ciclo #}
                      {% set cycle_time = strptime(check_date.strftime('%Y-%m-%d') + ' ' + orario, '%Y-%m-%d %H:%M:%S') %}
                      {% set cycle_timestamp = as_timestamp(cycle_time) %}

                      {# Se è oggi, controlla che non sia già passato #}
                      {% if day_offset == 0 and cycle_timestamp <= current_timestamp %}
                        {# Ciclo già passato oggi, salta #}
                      {% else %}
                        {% set next_cycles = next_cycles + [
                          {
                            'timestamp': cycle_timestamp,
                            'time_diff': cycle_timestamp - current_timestamp
                          }
                        ] %}
                      {% endif %}
                    {% endif %}
                  {% endfor %}
                {% endif %}
              {% endfor %}

              {# Trova il ciclo più vicino #}
              {% if next_cycles | length > 0 %}
                {% set sorted_cycles = next_cycles | sort(attribute='timestamp') %}
                {% set next_cycle = sorted_cycles[0] %}
                {% if next_cycle.time_diff > 0 %}
                  {{ next_cycle.time_diff | int }}
                {% else %}
                  0
                {% endif %}
              {% else %}
                999999
              {% endif %}
            {% else %}
              999999
            {% endif %}
          within_10_minutes: >
            {% if is_state('input_boolean.frarik_antizanzare_automazione_attiva', 'on') %}
              {% set current_time = now() %}
              {% set current_timestamp = as_timestamp(current_time) %}
              {% set current_day = current_time.weekday() %} 
              {% set day_names = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'] %}
              {% set day_entities = [
                'input_boolean.frarik_antizanzare_lunedi',
                'input_boolean.frarik_antizanzare_martedi', 
                'input_boolean.frarik_antizanzare_mercoledi',
                'input_boolean.frarik_antizanzare_giovedi',
                'input_boolean.frarik_antizanzare_venerdi',
                'input_boolean.frarik_antizanzare_sabato',
                'input_boolean.frarik_antizanzare_domenica'
              ] %}

              {% set next_cycles = [] %}

              {# Cicla attraverso i prossimi 7 giorni #}
              {% for day_offset in range(8) %}
                {% set check_day = (current_day + day_offset) % 7 %}
                {% set check_date = (current_time + timedelta(days=day_offset)).date() %}
                {% set day_name = day_names[check_day] %}

                {# Controlla solo se il giorno è attivo #}
                {% if is_state(day_entities[check_day], 'on') %}
                  {% set num_cicli = states('input_number.frarik_antizanzare_' + day_name + '_num_cicli') | int(0) %}

                  {# Cicla attraverso tutti i cicli del giorno #}
                  {% for ciclo in range(1, num_cicli + 1) %}
                    {% set orario_entity = 'input_datetime.frarik_antizanzare_' + day_name + '_orario_ciclo' + ciclo|string %}

                    {% if states(orario_entity) not in ['unknown', 'unavailable'] %}
                      {% set orario = states(orario_entity) %}

                      {# Crea timestamp del ciclo #}
                      {% set cycle_time = strptime(check_date.strftime('%Y-%m-%d') + ' ' + orario, '%Y-%m-%d %H:%M:%S') %}
                      {% set cycle_timestamp = as_timestamp(cycle_time) %}

                      {# Se è oggi, controlla che non sia già passato #}
                      {% if day_offset == 0 and cycle_timestamp <= current_timestamp %}
                        {# Ciclo già passato oggi, salta #}
                      {% else %}
                        {% set time_diff = cycle_timestamp - current_timestamp %}
                        {% set next_cycles = next_cycles + [time_diff] %}
                      {% endif %}
                    {% endif %}
                  {% endfor %}
                {% endif %}
              {% endfor %}

              {# Trova il tempo minimo #}
              {% if next_cycles | length > 0 %}
                {% set min_time = next_cycles | min %}
                {{ min_time <= 600 and min_time > 0 }}
              {% else %}
                false
              {% endif %}
            {% else %}
              false
            {% endif %}

      # Sensore che mostra il prossimo ciclo configurato tra tutti i giorni
      - name: "Frarik Antizanzare Prossimo Ciclo Semplice"
        state: >
          {% if is_state('input_boolean.frarik_antizanzare_automazione_attiva', 'on') %}
            {% set current_time = now() %}
            {% set current_timestamp = as_timestamp(current_time) %}
            {% set current_day = current_time.weekday() %}
            {% set day_names = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'] %}
            {% set day_labels = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'] %}
            {% set day_entities = [
              'input_boolean.frarik_antizanzare_lunedi',
              'input_boolean.frarik_antizanzare_martedi', 
              'input_boolean.frarik_antizanzare_mercoledi',
              'input_boolean.frarik_antizanzare_giovedi',
              'input_boolean.frarik_antizanzare_venerdi',
              'input_boolean.frarik_antizanzare_sabato',
              'input_boolean.frarik_antizanzare_domenica'
            ] %}

            {% set next_cycles = [] %}

            {# Cicla attraverso i prossimi 7 giorni #}
            {% for day_offset in range(8) %}
              {% set check_day = (current_day + day_offset) % 7 %}
              {% set check_date = (current_time + timedelta(days=day_offset)).date() %}
              {% set day_name = day_names[check_day] %}
              {% set day_label = day_labels[check_day] %}

              {# Controlla solo se il giorno è attivo #}
              {% if is_state(day_entities[check_day], 'on') %}
                {% set num_cicli = states('input_number.frarik_antizanzare_' + day_name + '_num_cicli') | int(0) %}

                {# Cicla attraverso tutti i cicli del giorno #}
                {% for ciclo in range(1, num_cicli + 1) %}
                  {% set orario_entity = 'input_datetime.frarik_antizanzare_' + day_name + '_orario_ciclo' + ciclo|string %}

                  {% if states(orario_entity) not in ['unknown', 'unavailable'] %}
                    {% set orario = states(orario_entity) %}

                    {# Crea timestamp del ciclo #}
                    {% set cycle_time = strptime(check_date.strftime('%Y-%m-%d') + ' ' + orario, '%Y-%m-%d %H:%M:%S') %}
                    {% set cycle_timestamp = as_timestamp(cycle_time) %}

                    {# Se è oggi, controlla che non sia già passato #}
                    {% if day_offset == 0 and cycle_timestamp <= current_timestamp %}
                      {# Ciclo già passato oggi, salta #}
                    {% else %}
                      {% set next_cycles = next_cycles + [
                        {
                          'timestamp': cycle_timestamp,
                          'day_label': day_label,
                          'orario': orario,
                          'ciclo': ciclo
                        }
                      ] %}
                    {% endif %}
                  {% endif %}
                {% endfor %}
              {% endif %}
            {% endfor %}

            {# Trova il ciclo più vicino #}
            {% if next_cycles | length > 0 %}
              {% set sorted_cycles = next_cycles | sort(attribute='timestamp') %}
              {% set next_cycle = sorted_cycles[0] %}
              {{ next_cycle.day_label }} {{ next_cycle.orario[:5] }} - Ciclo {{ next_cycle.ciclo }}
            {% else %}
              Nessun ciclo configurato
            {% endif %}
          {% else %}
            Automazione disattivata
          {% endif %}
        icon: mdi:calendar-clock

      # Sensore tempo al prossimo ciclo semplificato (formato umano)
      - name: "Frarik Antizanzare Tempo Al Prossimo Ciclo"
        icon: mdi:clock-outline
        state: >
          {% if is_state('input_boolean.frarik_antizanzare_automazione_attiva', 'on') %}
            {% set current_time = now() %}
            {% set current_timestamp = as_timestamp(current_time) %}
            {% set current_day = current_time.weekday() %}
            {% set day_names = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'] %}
            {% set day_entities = [
              'input_boolean.frarik_antizanzare_lunedi',
              'input_boolean.frarik_antizanzare_martedi', 
              'input_boolean.frarik_antizanzare_mercoledi',
              'input_boolean.frarik_antizanzare_giovedi',
              'input_boolean.frarik_antizanzare_venerdi',
              'input_boolean.frarik_antizanzare_sabato',
              'input_boolean.frarik_antizanzare_domenica'
            ] %}

            {% set next_cycles = [] %}

            {# Cicla attraverso i prossimi 7 giorni #}
            {% for day_offset in range(8) %}
              {% set check_day = (current_day + day_offset) % 7 %}
              {% set check_date = (current_time + timedelta(days=day_offset)).date() %}
              {% set day_name = day_names[check_day] %}

              {# Controlla solo se il giorno è attivo #}
              {% if is_state(day_entities[check_day], 'on') %}
                {% set num_cicli = states('input_number.frarik_antizanzare_' + day_name + '_num_cicli') | int(0) %}

                {# Cicla attraverso tutti i cicli del giorno #}
                {% for ciclo in range(1, num_cicli + 1) %}
                  {% set orario_entity = 'input_datetime.frarik_antizanzare_' + day_name + '_orario_ciclo' + ciclo|string %}

                  {% if states(orario_entity) not in ['unknown', 'unavailable'] %}
                    {% set orario = states(orario_entity) %}

                    {# Crea timestamp del ciclo #}
                    {% set cycle_time = strptime(check_date.strftime('%Y-%m-%d') + ' ' + orario, '%Y-%m-%d %H:%M:%S') %}
                    {% set cycle_timestamp = as_timestamp(cycle_time) %}

                    {# Se è oggi, controlla che non sia già passato #}
                    {% if day_offset == 0 and cycle_timestamp <= current_timestamp %}
                      {# Ciclo già passato oggi, salta #}
                    {% else %}
                      {% set time_diff = cycle_timestamp - current_timestamp %}
                      {% set next_cycles = next_cycles + [time_diff] %}
                    {% endif %}
                  {% endif %}
                {% endfor %}
              {% endif %}
            {% endfor %}

            {# Trova il tempo minimo #}
            {% if next_cycles | length > 0 %}
              {% set min_time = next_cycles | min %}
              {% if min_time > 0 %}
                {% if min_time < 3600 %}
                  {% set minutes = (min_time // 60) | int %}
                  {{ '%d minuti' | format(minutes) }}
                {% elif min_time < 86400 %}
                  {% set hours = (min_time // 3600) | int %}
                  {% set minutes = ((min_time % 3600) // 60) | int %}
                  {{ '%d:%02d ore' | format(hours, minutes) }}
                {% else %}
                  {% set days = (min_time // 86400) | int %}
                  {% set hours = ((min_time % 86400) // 3600) | int %}
                  {{ '%d giorni %d ore' | format(days, hours) }}
                {% endif %}
              {% else %}
                Avvio imminente
              {% endif %}
            {% else %}
              Nessun ciclo configurato
            {% endif %}
          {% else %}
            --
          {% endif %}

      # Sensore secondi rimanenti per bar-card (compatibile con countdown dal sistema day-based)
      - name: "Frarik Antizanzare Tempo Al Prossimo Ciclo Secondi"
        unit_of_measurement: "sec"
        icon: mdi:timer
        state: >
          {% if is_state('timer.frarik_antizanzare_ciclo_timer', 'active') %}
            {% set remaining = state_attr('timer.frarik_antizanzare_ciclo_timer', 'remaining') %}
            {% if remaining %}
              {{ remaining.split(':')[0]|int * 3600 + remaining.split(':')[1]|int * 60 + remaining.split(':')[2]|int }}
            {% else %}
              0
            {% endif %}
          {% else %}
            0
          {% endif %}

      # Sensore consumo acqua (collegato a sensore reale)
      - name: "Frarik Antizanzare Consumo Acqua"
        state: "{{ states('IL_TUO_SENSORE_LIVELLO_TANICA') | float(0) }}"
        unit_of_measurement: "L/min"
        icon: mdi:water-pump

      # Sensore timer manuale percentuale (decresce da 100 a 0)
      - name: "Frarik Antizanzare Timer Manuale Percentage"
        unit_of_measurement: "%"
        icon: mdi:timer
        state: >-
          {% if is_state('timer.frarik_antizanzare_manuale_timer', 'active') %}
            {% set remaining = state_attr('timer.frarik_antizanzare_manuale_timer', 'remaining') %}
            {% set duration = state_attr('timer.frarik_antizanzare_manuale_timer', 'duration') %}
            {% if remaining and duration %}
              {% set rem_seconds = remaining.split(':')[0]|int * 3600 + remaining.split(':')[1]|int * 60 + remaining.split(':')[2]|int %}
              {% set dur_seconds = duration.split(':')[0]|int * 3600 + duration.split(':')[1]|int * 60 + duration.split(':')[2]|int %}
              {% if dur_seconds > 0 %}
                {{ (rem_seconds / dur_seconds * 100) | round(1) }}
              {% else %}
                0
              {% endif %}
            {% else %}
              0
            {% endif %}
          {% else %}
            0
          {% endif %}
        attributes:
          remaining_time: >-
            {% if is_state('timer.frarik_antizanzare_manuale_timer', 'active') %}
              {{ state_attr('timer.frarik_antizanzare_manuale_timer', 'remaining') }}
            {% else %}
              "00:00:00"
            {% endif %}
          duration: >-
            {% if is_state('timer.frarik_antizanzare_manuale_timer', 'active') %}
              {{ state_attr('timer.frarik_antizanzare_manuale_timer', 'duration') }}
            {% else %}
              "00:00:00"
            {% endif %}

      # Sensore timer manuale - tempo rimanente mm:ss
      - name: "Frarik Antizanzare Manuale Countdown"
        icon: mdi:timer
        state: >-
          {% if is_state('timer.frarik_antizanzare_manuale_timer', 'active') %}
            {% set finishes_at = state_attr('timer.frarik_antizanzare_manuale_timer', 'finishes_at') %}
            {% if finishes_at %}
              {% set finish_time = as_timestamp(finishes_at) %}
              {% set current_time = as_timestamp(now()) %}
              {% set remaining_seconds = (finish_time - current_time) | int %}
              {% if remaining_seconds > 0 %}
                {% set minutes = (remaining_seconds // 60) %}
                {% set seconds = (remaining_seconds % 60) %}
                {{ '%02d:%02d' | format(minutes, seconds) }}
              {% else %}
                00:00
              {% endif %}
            {% else %}
              --:--
            {% endif %}
          {% else %}
            00:00
          {% endif %}

      # Sensore timer manuale percentuale per bar-card
      - name: "Frarik Antizanzare Timer Manuale Bar"
        unit_of_measurement: "%"
        icon: mdi:timer
        state: >-
          {% if is_state('timer.frarik_antizanzare_manuale_timer', 'active') %}
            {% set finishes_at = state_attr('timer.frarik_antizanzare_manuale_timer', 'finishes_at') %}
            {% if finishes_at %}
              {% set finish_time = as_timestamp(finishes_at) %}
              {% set current_time = as_timestamp(now()) %}
              {% set remaining_seconds = finish_time - current_time %}
              {% set duration_seconds = states('input_number.frarik_antizanzare_durata_manuale') | int %}
              {% if duration_seconds > 0 %}
                {% set remaining_percent = (remaining_seconds / duration_seconds * 100) %}
                {{ [0, remaining_percent] | max | round(1) }}
              {% else %}
                0
              {% endif %}
            {% else %}
              100
            {% endif %}
          {% else %}
            0
          {% endif %}

      # Sensore timer ciclo - tempo rimanente mm:ss
      - name: "Frarik Antizanzare Ciclo Countdown"
        icon: mdi:timer
        state: >-
          {% if is_state('timer.frarik_antizanzare_ciclo_timer', 'active') %}
            {% set finishes_at = state_attr('timer.frarik_antizanzare_ciclo_timer', 'finishes_at') %}
            {% if finishes_at %}
              {% set finish_time = as_timestamp(finishes_at) %}
              {% set current_time = as_timestamp(now()) %}
              {% set remaining_seconds = (finish_time - current_time) | int %}
              {% if remaining_seconds > 0 %}
                {% set minutes = (remaining_seconds // 60) %}
                {% set seconds = (remaining_seconds % 60) %}
                {{ '%02d:%02d' | format(minutes, seconds) }}
              {% else %}
                00:00
              {% endif %}
            {% else %}
              --:--
            {% endif %}
          {% else %}
            00:00
          {% endif %}

      # Sensore timer ciclo percentuale per bar-card
      - name: "Frarik Antizanzare Timer Ciclo Bar"
        unit_of_measurement: "%"
        icon: mdi:timer
        state: >-
          {% if is_state('timer.frarik_antizanzare_ciclo_timer', 'active') %}
            {% set finishes_at = state_attr('timer.frarik_antizanzare_ciclo_timer', 'finishes_at') %}
            {% set duration = state_attr('timer.frarik_antizanzare_ciclo_timer', 'duration') %}
            {% if finishes_at and duration %}
              {% set finish_time = as_timestamp(finishes_at) %}
              {% set current_time = as_timestamp(now()) %}
              {% set remaining_seconds = finish_time - current_time %}
              {% set dur_parts = duration.split(':') %}
              {% set duration_seconds = dur_parts[0]|int * 3600 + dur_parts[1]|int * 60 + dur_parts[2]|int %}
              {% if duration_seconds > 0 %}
                {% set remaining_percent = (remaining_seconds / duration_seconds * 100) %}
                {{ [0, remaining_percent] | max | round(1) }}
              {% else %}
                0
              {% endif %}
            {% else %}
              100
            {% endif %}
          {% else %}
            0
          {% endif %}

      # Sensore timer ciclo automatico percentuale (decresce da 100 a 0)
      - name: "Frarik Antizanzare Timer Ciclo Percentage"
        unit_of_measurement: "%"
        icon: mdi:timer
        state: >-
          {% if is_state('timer.frarik_antizanzare_ciclo_timer', 'active') %}
            {% set remaining = state_attr('timer.frarik_antizanzare_ciclo_timer', 'remaining') %}
            {% set duration = state_attr('timer.frarik_antizanzare_ciclo_timer', 'duration') %}
            {% if remaining and duration %}
              {% set rem_seconds = remaining.split(':')[0]|int * 3600 + remaining.split(':')[1]|int * 60 + remaining.split(':')[2]|int %}
              {% set dur_seconds = duration.split(':')[0]|int * 3600 + duration.split(':')[1]|int * 60 + duration.split(':')[2]|int %}
              {% if dur_seconds > 0 %}
                {{ (rem_seconds / dur_seconds * 100) | round(1) }}
              {% else %}
                0
              {% endif %}
            {% else %}
              0
            {% endif %}
          {% else %}
            0
          {% endif %}

      # Sensore probabilità pioggia (collegato a sensore meteo reale, valore numerico %)
      - name: "Frarik Antizanzare Probabilita Pioggia"
        state: "{{ states('IL_TUO_SENSORE_PROBABILITA_PIOGGIA') | float(0) | round(0) | int }}"
        unit_of_measurement: "%"
        icon: mdi:weather-rainy

      # Sensore potenza pompa (collegato a sensore reale opzionale)
      - name: "Frarik Antizanzare Potenza Pompa"
        state: "{{ states('IL_TUO_SENSORE_POMPA') | float(0) }}"
        unit_of_measurement: "W"
        icon: mdi:pump

      # Sensore cicli rimanenti mensili
      - name: "Frarik Antizanzare Cicli Rimanenti Mensili"
        state: >
          {% set target = states('input_number.frarik_antizanzare_cicli_target_mensili') | int(0) %}
          {% set completati = states('counter.frarik_antizanzare_cicli_mensili') | int(0) %}
          {% set rimanenti = target - completati %}
          {{ [0, rimanenti] | max }}
        unit_of_measurement: "cicli"
        icon: mdi:counter-outline
        attributes:
          cicli_target: "{{ states('input_number.frarik_antizanzare_cicli_target_mensili') | int(0) }}"
          cicli_completati: "{{ states('counter.frarik_antizanzare_cicli_mensili') | int(0) }}"
          percentuale_completamento: >
            {% set target = states('input_number.frarik_antizanzare_cicli_target_mensili') | int(1) %}
            {% set completati = states('counter.frarik_antizanzare_cicli_mensili') | int(0) %}
            {% if target > 0 %}
              {{ ((completati / target) * 100) | round(1) }}
            {% else %}
              0
            {% endif %}

      # Sensore avanzamento mensile
      - name: "Frarik Antizanzare Avanzamento Mensile"
        state: >
          {% set target = states('input_number.frarik_antizanzare_cicli_target_mensili') | int(1) %}
          {% set completati = states('counter.frarik_antizanzare_cicli_mensili') | int(0) %}
          {% if completati >= target %}
            Obiettivo Raggiunto!
          {% else %}
            {{ completati }} / {{ target }} cicli
          {% endif %}
        icon: >
          {% set target = states('input_number.frarik_antizanzare_cicli_target_mensili') | int(1) %}
          {% set completati = states('counter.frarik_antizanzare_cicli_mensili') | int(0) %}
          {% if completati >= target %}
            mdi:check-circle
          {% elif completati >= target * 0.8 %}
            mdi:progress-check
          {% elif completati >= target * 0.5 %}
            mdi:progress-clock
          {% else %}
            mdi:progress-alert
          {% endif %}
        attributes:
          percentuale: >
            {% set target = states('input_number.frarik_antizanzare_cicli_target_mensili') | int(1) %}
            {% set completati = states('counter.frarik_antizanzare_cicli_mensili') | int(0) %}
            {{ ((completati / target) * 100) | round(1) }}
          giorni_rimasti_nel_mese: >
            {% set oggi = now() %}
            {% set prossimo_mese = oggi.replace(day=28) + timedelta(days=4) %}
            {% set ultimo_giorno_mese = (prossimo_mese - timedelta(days=prossimo_mese.day)).day %}
            {{ ultimo_giorno_mese - oggi.day + 1 }}
          media_cicli_giornalieri_necessaria: >
            {% set target = states('input_number.frarik_antizanzare_cicli_target_mensili') | int(1) %}
            {% set completati = states('counter.frarik_antizanzare_cicli_mensili') | int(0) %}
            {% set rimanenti = target - completati %}
            {% set oggi = now() %}
            {% set prossimo_mese = oggi.replace(day=28) + timedelta(days=4) %}
            {% set ultimo_giorno_mese = (prossimo_mese - timedelta(days=prossimo_mese.day)).day %}
            {% set giorni_rimasti = ultimo_giorno_mese - oggi.day + 1 %}
            {% if giorni_rimasti > 0 and rimanenti > 0 %}
              {{ (rimanenti / giorni_rimasti) | round(1) }}
            {% else %}
              0
            {% endif %}

      # Sensore velocità vento (collegato a sensore reale, già in km/h — nessuna conversione)
      - name: "Frarik Antizanzare Velocita Vento"
        state: "{{ states('IL_TUO_SENSORE_VENTO') | float(0) | round(1) }}"
        unit_of_measurement: "km/h"
        icon: mdi:weather-windy

      # Sensore livello tanica (collegato a sensore reale)
      # Supporta sia un sensore percentuale (0-100) sia un sensore/binary_sensor
      # asciutto/bagnato: se il valore non è numerico viene passato così com'è,
      # altrimenti viene convertito in float per il caso percentuale.
      - name: "Frarik Antizanzare Livello Tanica"
        state: >
          {% set raw = states('IL_TUO_SENSORE_LIVELLO_TANICA') %}
          {% if raw in ['unavailable', 'unknown', 'none', ''] %}
            unknown
          {% elif raw | float(none) is not none %}
            {{ raw | float }}
          {% else %}
            {{ raw }}
          {% endif %}
        unit_of_measurement: "%"
        icon: mdi:water-percent

  - binary_sensor:
      # Sensore pioggia in corso: on se il sensore fisico di pioggia è attivo
      - name: "Frarik Antizanzare Pioggia Corso"
        state: "{{ is_state('IL_TUO_SENSORE_PIOGGIA', 'on') }}"
        icon: >
          {{ 'mdi:weather-rainy' if is_state('IL_TUO_SENSORE_PIOGGIA', 'on') else 'mdi:weather-cloudy' }}

      # Sensore blocco vento separato (per notifiche specifiche per vento)
      - name: "Frarik Antizanzare Blocco Vento"
        state: >
          {% set abilita_vento = is_state('input_boolean.frarik_antizanzare_abilita_soglia_vento', 'on') %}
          {% set soglia_vento = states('input_number.frarik_antizanzare_soglia_vento') | float(0) %}
          {{ abilita_vento and soglia_vento > 0 and states('sensor.frarik_antizanzare_velocita_vento') | float(0) >= soglia_vento }}
        icon: mdi:weather-windy-variant

      # Sensore blocco probabilità pioggia separato (per notifiche specifiche)
      - name: "Frarik Antizanzare Blocco Pioggia Prob"
        state: >
          {% set abilita_pioggia = is_state('input_boolean.frarik_antizanzare_abilita_soglia_pioggia', 'on') %}
          {% set soglia_pioggia = states('input_number.frarik_antizanzare_soglia_pioggia') | float(0) %}
          {{ abilita_pioggia and soglia_pioggia > 0 and states('IL_TUO_SENSORE_PROBABILITA_PIOGGIA') | float(0) >= soglia_pioggia }}
        icon: mdi:weather-pouring

      # Sensore blocco per condizioni meteo, vento e presenza
      - name: "Frarik Antizanzare Blocco Meteo"
        state: >
          {% set soglia_pioggia = states('input_number.frarik_antizanzare_soglia_pioggia') | float(0) %}
          {% set abilita_pioggia = is_state('input_boolean.frarik_antizanzare_abilita_soglia_pioggia', 'on') %}
          {% set blocco_pioggia = abilita_pioggia and soglia_pioggia > 0 and states('IL_TUO_SENSORE_PROBABILITA_PIOGGIA') | float(0) >= soglia_pioggia %}
          {% set soglia_vento = states('input_number.frarik_antizanzare_soglia_vento') | float(0) %}
          {% set abilita_vento = is_state('input_boolean.frarik_antizanzare_abilita_soglia_vento', 'on') %}
          {% set blocco_vento = abilita_vento and soglia_vento > 0 and states('sensor.frarik_antizanzare_velocita_vento') | float(0) >= soglia_vento %}
          {% set blocco_presenza = is_state('input_boolean.frarik_antizanzare_presenza_attiva', 'on') and is_state('IL_TUO_SENSORE_PRESENZA', 'on') %}
          {% set blocco_pioggia_corso = abilita_pioggia and is_state('IL_TUO_SENSORE_PIOGGIA', 'on') %}
          {{ blocco_pioggia or blocco_vento or blocco_presenza or blocco_pioggia_corso }}
        icon: >
          {% set soglia_pioggia = states('input_number.frarik_antizanzare_soglia_pioggia') | float(0) %}
          {% set abilita_pioggia = is_state('input_boolean.frarik_antizanzare_abilita_soglia_pioggia', 'on') %}
          {% set blocco_pioggia = abilita_pioggia and soglia_pioggia > 0 and states('IL_TUO_SENSORE_PROBABILITA_PIOGGIA') | float(0) >= soglia_pioggia %}
          {% set soglia_vento = states('input_number.frarik_antizanzare_soglia_vento') | float(0) %}
          {% set abilita_vento = is_state('input_boolean.frarik_antizanzare_abilita_soglia_vento', 'on') %}
          {% set blocco_vento = abilita_vento and soglia_vento > 0 and states('sensor.frarik_antizanzare_velocita_vento') | float(0) >= soglia_vento %}
          {% set blocco_presenza = is_state('input_boolean.frarik_antizanzare_presenza_attiva', 'on') and is_state('IL_TUO_SENSORE_PRESENZA', 'on') %}
          {% set blocco_pioggia_corso = abilita_pioggia and is_state('IL_TUO_SENSORE_PIOGGIA', 'on') %}
          {{ 'mdi:account-cancel' if blocco_presenza else ('mdi:weather-rainy' if (blocco_pioggia or blocco_pioggia_corso) else ('mdi:weather-windy' if blocco_vento else 'mdi:weather-partly-cloudy')) }}

      # Sensore perdita acqua (collegato a sensore reale opzionale)
      - name: "Frarik Antizanzare Perdita Acqua"
        state: >
          {% if states('IL_TUO_SENSORE_PERDITA') in ['unavailable', 'unknown'] %}
            off
          {% else %}
            {{ is_state('IL_TUO_SENSORE_PERDITA', 'on') }}
          {% endif %}
        icon: mdi:water-alert



# AUTOMAZIONI
automation:
  # Reset contatori il primo del mese
  - id: frarik_antizanzare_reset_contatori
    alias: "Anti Zanzare - Reset Contatori Mensili"
    trigger:
      - platform: template
        value_template: "{{ now().day == 1 and now().hour == 0 and now().minute == 0 }}"
    action:
      - service: counter.reset
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.set_value
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
        data:
          value: "{{ states('input_number.frarik_antizanzare_cicli_target_mensili') | int }}"

  # Inizializza counter rimanenti quando cambia il target
  - id: frarik_antizanzare_inizializza_counter_rimanenti
    alias: "Anti Zanzare - Inizializza Counter Rimanenti"
    trigger:
      - platform: state
        entity_id: input_number.frarik_antizanzare_cicli_target_mensili
    action:
      - service: counter.set_value
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
        data:
          value: >
            {% set target = trigger.to_state.state | int %}
            {% set completati = states('counter.frarik_antizanzare_cicli_mensili') | int(0) %}
            {% set rimanenti = target - completati %}
            {{ [0, rimanenti] | max }}

  # Inizializza counter rimanenti all'avvio di Home Assistant
  - id: frarik_antizanzare_inizializza_counter_avvio
    alias: "Anti Zanzare - Inizializza Counter all'Avvio"
    trigger:
      - platform: homeassistant
        event: start
    action:
      - delay: "00:00:30"  # Aspetta che tutte le entità siano caricate
      - service: counter.set_value
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
        data:
          value: >
            {% set target = states('input_number.frarik_antizanzare_cicli_target_mensili') | int %}
            {% set completati = states('counter.frarik_antizanzare_cicli_mensili') | int(0) %}
            {% set rimanenti = target - completati %}
            {{ [0, rimanenti] | max }}

  # Avvio automazione
  - id: frarik_antizanzare_avvio_automazione
    alias: "Anti Zanzare - Avvio Automazione"
    trigger:
      - platform: state
        entity_id: input_button.frarik_antizanzare_start_automazione
    action:
      - service: input_boolean.turn_on
        target:
          entity_id: input_boolean.frarik_antizanzare_automazione_attiva

  # Stop automazione
  - id: frarik_antizanzare_stop_automazione
    alias: "Anti Zanzare - Stop Automazione"
    trigger:
      - platform: state
        entity_id: input_button.frarik_antizanzare_stop_automazione
    action:
      - service: input_boolean.turn_off
        target:
          entity_id: input_boolean.frarik_antizanzare_automazione_attiva
      - service: timer.cancel
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer

  # SISTEMA SEMPLICE - FUNZIONA DAVVERO!
  # Automazioni dirette per ogni giorno - LUNEDÌ
  - id: frarik_antizanzare_lunedi_ciclo1
    alias: "Anti Zanzare - Lunedì Ciclo 1"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: mon
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_lunedi_orario_ciclo1')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_lunedi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_lunedi_num_cicli') | int >= 1 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: "{{ states('input_number.frarik_antizanzare_lunedi_durata_ciclo1') | int(0) }}"
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_lunedi_ciclo2
    alias: "Anti Zanzare - Lunedì Ciclo 2"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: mon
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_lunedi_orario_ciclo2')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_lunedi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_lunedi_num_cicli') | int >= 2 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: "{{ states('input_number.frarik_antizanzare_lunedi_durata_ciclo2') | int(0) }}"
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_lunedi_ciclo3
    alias: "Anti Zanzare - Lunedì Ciclo 3"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: mon
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_lunedi_orario_ciclo3')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_lunedi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_lunedi_num_cicli') | int >= 3 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: "{{ states('input_number.frarik_antizanzare_lunedi_durata_ciclo3') | int(0) }}"
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_lunedi_ciclo4
    alias: "Anti Zanzare - Lunedì Ciclo 4"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: mon
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_lunedi_orario_ciclo4')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_lunedi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_lunedi_num_cicli') | int >= 4 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: "{{ states('input_number.frarik_antizanzare_lunedi_durata_ciclo4') | int(0) }}"
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_lunedi_ciclo5
    alias: "Anti Zanzare - Lunedì Ciclo 5"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: mon
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_lunedi_orario_ciclo5')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_lunedi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_lunedi_num_cicli') | int >= 5 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: "{{ states('input_number.frarik_antizanzare_lunedi_durata_ciclo5') | int(0) }}"
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  # MARTEDÌ - TUTTI I CICLI
  - id: frarik_antizanzare_martedi_ciclo1
    alias: "Anti Zanzare - Martedì Ciclo 1"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: tue
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_martedi_orario_ciclo1')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_martedi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_martedi_num_cicli') | int >= 1 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: "{{ states('input_number.frarik_antizanzare_martedi_durata_ciclo1') | int(0) }}"
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_martedi_ciclo2
    alias: "Anti Zanzare - Martedì Ciclo 2"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: tue
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_martedi_orario_ciclo2')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_martedi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_martedi_num_cicli') | int >= 2 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: "{{ states('input_number.frarik_antizanzare_martedi_durata_ciclo2') | int(0) }}"
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_martedi_ciclo3
    alias: "Anti Zanzare - Martedì Ciclo 3"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: tue
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_martedi_orario_ciclo3')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_martedi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_martedi_num_cicli') | int >= 3 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: "{{ states('input_number.frarik_antizanzare_martedi_durata_ciclo3') | int(0) }}"
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_martedi_ciclo4
    alias: "Anti Zanzare - Martedì Ciclo 4"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: tue
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_martedi_orario_ciclo4')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_martedi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_martedi_num_cicli') | int >= 4 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: "{{ states('input_number.frarik_antizanzare_martedi_durata_ciclo4') | int(0) }}"
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_martedi_ciclo5
    alias: "Anti Zanzare - Martedì Ciclo 5"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: tue
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_martedi_orario_ciclo5')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_martedi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_martedi_num_cicli') | int >= 5 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: "{{ states('input_number.frarik_antizanzare_martedi_durata_ciclo5') | int(0) }}"
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  # MERCOLEDÌ - TUTTI I CICLI
  - id: frarik_antizanzare_mercoledi_ciclo1
    alias: "Anti Zanzare - Mercoledì Ciclo 1"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: wed
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_mercoledi_orario_ciclo1')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_mercoledi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_mercoledi_num_cicli') | int >= 1 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_mercoledi_durata_ciclo1') | int // 60), (states('input_number.frarik_antizanzare_mercoledi_durata_ciclo1') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_mercoledi_ciclo2
    alias: "Anti Zanzare - Mercoledì Ciclo 2"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: wed
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_mercoledi_orario_ciclo2')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_mercoledi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_mercoledi_num_cicli') | int >= 2 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_mercoledi_durata_ciclo2') | int // 60), (states('input_number.frarik_antizanzare_mercoledi_durata_ciclo2') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_mercoledi_ciclo3
    alias: "Anti Zanzare - Mercoledì Ciclo 3"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: wed
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_mercoledi_orario_ciclo3')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_mercoledi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_mercoledi_num_cicli') | int >= 3 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_mercoledi_durata_ciclo3') | int // 60), (states('input_number.frarik_antizanzare_mercoledi_durata_ciclo3') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_mercoledi_ciclo4
    alias: "Anti Zanzare - Mercoledì Ciclo 4"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: wed
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_mercoledi_orario_ciclo4')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_mercoledi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_mercoledi_num_cicli') | int >= 4 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_mercoledi_durata_ciclo4') | int // 60), (states('input_number.frarik_antizanzare_mercoledi_durata_ciclo4') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_mercoledi_ciclo5
    alias: "Anti Zanzare - Mercoledì Ciclo 5"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: wed
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_mercoledi_orario_ciclo5')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_mercoledi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_mercoledi_num_cicli') | int >= 5 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_mercoledi_durata_ciclo5') | int // 60), (states('input_number.frarik_antizanzare_mercoledi_durata_ciclo5') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  # GIOVEDÌ - TUTTI I CICLI
  - id: frarik_antizanzare_giovedi_ciclo1
    alias: "Anti Zanzare - Giovedì Ciclo 1"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: thu
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_giovedi_orario_ciclo1')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_giovedi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_giovedi_num_cicli') | int >= 1 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_giovedi_durata_ciclo1') | int // 60), (states('input_number.frarik_antizanzare_giovedi_durata_ciclo1') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_giovedi_ciclo2
    alias: "Anti Zanzare - Giovedì Ciclo 2"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: thu
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_giovedi_orario_ciclo2')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_giovedi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_giovedi_num_cicli') | int >= 2 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_giovedi_durata_ciclo2') | int // 60), (states('input_number.frarik_antizanzare_giovedi_durata_ciclo2') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_giovedi_ciclo3
    alias: "Anti Zanzare - Giovedì Ciclo 3"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: thu
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_giovedi_orario_ciclo3')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_giovedi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_giovedi_num_cicli') | int >= 3 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_giovedi_durata_ciclo3') | int // 60), (states('input_number.frarik_antizanzare_giovedi_durata_ciclo3') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_giovedi_ciclo4
    alias: "Anti Zanzare - Giovedì Ciclo 4"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: thu
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_giovedi_orario_ciclo4')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_giovedi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_giovedi_num_cicli') | int >= 4 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_giovedi_durata_ciclo4') | int // 60), (states('input_number.frarik_antizanzare_giovedi_durata_ciclo4') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_giovedi_ciclo5
    alias: "Anti Zanzare - Giovedì Ciclo 5"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: thu
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_giovedi_orario_ciclo5')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_giovedi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_giovedi_num_cicli') | int >= 5 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_giovedi_durata_ciclo5') | int // 60), (states('input_number.frarik_antizanzare_giovedi_durata_ciclo5') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  # VENERDÌ - TUTTI I CICLI
  - id: frarik_antizanzare_venerdi_ciclo1
    alias: "Anti Zanzare - Venerdì Ciclo 1"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: fri
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_venerdi_orario_ciclo1')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_venerdi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_venerdi_num_cicli') | int >= 1 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_venerdi_durata_ciclo1') | int // 60), (states('input_number.frarik_antizanzare_venerdi_durata_ciclo1') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_venerdi_ciclo2
    alias: "Anti Zanzare - Venerdì Ciclo 2"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: fri
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_venerdi_orario_ciclo2')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_venerdi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_venerdi_num_cicli') | int >= 2 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_venerdi_durata_ciclo2') | int // 60), (states('input_number.frarik_antizanzare_venerdi_durata_ciclo2') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_venerdi_ciclo3
    alias: "Anti Zanzare - Venerdì Ciclo 3"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: fri
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_venerdi_orario_ciclo3')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_venerdi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_venerdi_num_cicli') | int >= 3 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_venerdi_durata_ciclo3') | int // 60), (states('input_number.frarik_antizanzare_venerdi_durata_ciclo3') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_venerdi_ciclo4
    alias: "Anti Zanzare - Venerdì Ciclo 4"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: fri
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_venerdi_orario_ciclo4')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_venerdi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_venerdi_num_cicli') | int >= 4 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_venerdi_durata_ciclo4') | int // 60), (states('input_number.frarik_antizanzare_venerdi_durata_ciclo4') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_venerdi_ciclo5
    alias: "Anti Zanzare - Venerdì Ciclo 5"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: fri
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_venerdi_orario_ciclo5')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_venerdi
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_venerdi_num_cicli') | int >= 5 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_venerdi_durata_ciclo5') | int // 60), (states('input_number.frarik_antizanzare_venerdi_durata_ciclo5') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  # SABATO - TUTTI I CICLI
  - id: frarik_antizanzare_sabato_ciclo1
    alias: "Anti Zanzare - Sabato Ciclo 1"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: sat
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_sabato_orario_ciclo1')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_sabato
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_sabato_num_cicli') | int >= 1 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_sabato_durata_ciclo1') | int // 60), (states('input_number.frarik_antizanzare_sabato_durata_ciclo1') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_sabato_ciclo2
    alias: "Anti Zanzare - Sabato Ciclo 2"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: sat
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_sabato_orario_ciclo2')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_sabato
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_sabato_num_cicli') | int >= 2 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_sabato_durata_ciclo2') | int // 60), (states('input_number.frarik_antizanzare_sabato_durata_ciclo2') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_sabato_ciclo3
    alias: "Anti Zanzare - Sabato Ciclo 3"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: sat
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_sabato_orario_ciclo3')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_sabato
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_sabato_num_cicli') | int >= 3 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_sabato_durata_ciclo3') | int // 60), (states('input_number.frarik_antizanzare_sabato_durata_ciclo3') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_sabato_ciclo4
    alias: "Anti Zanzare - Sabato Ciclo 4"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: sat
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_sabato_orario_ciclo4')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_sabato
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_sabato_num_cicli') | int >= 4 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_sabato_durata_ciclo4') | int // 60), (states('input_number.frarik_antizanzare_sabato_durata_ciclo4') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_sabato_ciclo5
    alias: "Anti Zanzare - Sabato Ciclo 5"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: sat
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_sabato_orario_ciclo5')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_sabato
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_sabato_num_cicli') | int >= 5 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_sabato_durata_ciclo5') | int // 60), (states('input_number.frarik_antizanzare_sabato_durata_ciclo5') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  # DOMENICA - TUTTI I CICLI
  - id: frarik_antizanzare_domenica_ciclo1
    alias: "Anti Zanzare - Domenica Ciclo 1"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: sun
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_domenica_orario_ciclo1')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_domenica
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_domenica_num_cicli') | int >= 1 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_domenica_durata_ciclo1') | int // 60), (states('input_number.frarik_antizanzare_domenica_durata_ciclo1') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_domenica_ciclo2
    alias: "Anti Zanzare - Domenica Ciclo 2"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: sun
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_domenica_orario_ciclo2')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_domenica
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_domenica_num_cicli') | int >= 2 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_domenica_durata_ciclo2') | int // 60), (states('input_number.frarik_antizanzare_domenica_durata_ciclo2') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_domenica_ciclo3
    alias: "Anti Zanzare - Domenica Ciclo 3"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: sun
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_domenica_orario_ciclo3')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_domenica
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_domenica_num_cicli') | int >= 3 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_domenica_durata_ciclo3') | int // 60), (states('input_number.frarik_antizanzare_domenica_durata_ciclo3') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_domenica_ciclo4
    alias: "Anti Zanzare - Domenica Ciclo 4"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: sun
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_domenica_orario_ciclo4')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_domenica
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_domenica_num_cicli') | int >= 4 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_domenica_durata_ciclo4') | int // 60), (states('input_number.frarik_antizanzare_domenica_durata_ciclo4') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  - id: frarik_antizanzare_domenica_ciclo5
    alias: "Anti Zanzare - Domenica Ciclo 5"
    trigger:
      - platform: time_pattern
        minutes: "/1"
    condition:
      - condition: time
        weekday: sun
      - condition: template
        value_template: >
          {{ now().strftime('%H:%M') == states('input_datetime.frarik_antizanzare_domenica_orario_ciclo5')[:5] }}
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_domenica
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
      - condition: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        state: "off"
      - condition: not
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
      - condition: template
        value_template: "{{ states('input_number.frarik_antizanzare_domenica_num_cicli') | int >= 5 }}"
    action:
      - service: timer.start
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
        data:
          duration: >
            {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_domenica_durata_ciclo5') | int // 60), (states('input_number.frarik_antizanzare_domenica_durata_ciclo5') | int % 60)) }}
      - service: counter.increment
        target:
          entity_id: counter.frarik_antizanzare_cicli_mensili
      - service: counter.decrement
        target:
          entity_id: counter.frarik_antizanzare_cicli_rimanenti
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  # SISTEMA COMPLETATO - FUNZIONA!

  # Stop anti_zanzare automatica quando timer finisce
  - id: frarik_antizanzare_stop_automatica
    alias: "Anti Zanzare - Stop Automatica"
    trigger:
      - platform: state
        entity_id: timer.frarik_antizanzare_ciclo_timer
        from: "active"
        to: "idle"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_manuale_attiva
        state: "off"
    action:
      # Disattiva pompa reale
      - service: switch.turn_off
        target:
          entity_id: *presa_az
      - service: timer.cancel
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer

  # Blocco per pioggia e soglia probabilità
  - id: frarik_antizanzare_blocco_meteo
    alias: "Anti Zanzare - Blocco per Condizioni Meteo"
    trigger:
      - platform: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        to: "on"
    action:
      - service: timer.cancel
        target:
          entity_id: timer.frarik_antizanzare_ciclo_timer
      - service: input_boolean.turn_off
        target:
          entity_id: input_boolean.frarik_antizanzare_manuale_attiva
      # Disattivare pompa (TEMPORANEO: sostituire con switch reale)
      - service: switch.turn_off
        target:
          entity_id: *presa_az

  # Disattivazione automazione per condizioni meteo
  - id: frarik_antizanzare_disattiva_automazione_meteo
    alias: "Anti Zanzare - Disattiva Automazione per Meteo"
    trigger:
      - platform: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        to: "on"
        for: "00:00:01"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "on"
    action:
      - service: input_boolean.turn_off
        target:
          entity_id: input_boolean.frarik_antizanzare_automazione_attiva
          
  # Riattivazione automazione per condizioni meteo migliorate           
  - id: frarik_antizanzare_riattiva_automazione_meteo
    alias: "Anti Zanzare - Riattiva Automazione per Meteo"
    trigger:
      - platform: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
        to: "off"
        for: "00:01:00"  # Aspetta 1 minuti prima di riattivare automazione
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_automazione_attiva
        state: "off"
    action:
      - service: input_boolean.turn_on
        target:
          entity_id: input_boolean.frarik_antizanzare_automazione_attiva          
          

  # Avvio anti_zanzare manuale
  - id: frarik_antizanzare_avvio_manuale
    alias: "Anti Zanzare - Avvio Manuale"
    trigger:
      - platform: state
        entity_id: input_boolean.frarik_antizanzare_manuale_attiva
        to: "on"
    action:
      # Se blocco_meteo è attivo (vento/pioggia/pioggia in corso/presenza), non
      # avviare nulla: annulla subito lo stato "manuale attiva" così la card
      # non resta bloccata su ON
      - if:
          - condition: state
            entity_id: binary_sensor.frarik_antizanzare_blocco_meteo
            state: "on"
        then:
          - service: input_boolean.turn_off
            target:
              entity_id: input_boolean.frarik_antizanzare_manuale_attiva
        else:
          # Ferma automazione se attiva
          - service: timer.cancel
            target:
              entity_id: timer.frarik_antizanzare_ciclo_timer
          # Avvia timer manuale con durata impostata
          - service: timer.start
            target:
              entity_id: timer.frarik_antizanzare_manuale_timer
            data:
              duration: >
                {{ '00:%02d:%02d' | format((states('input_number.frarik_antizanzare_durata_manuale') | int // 60), (states('input_number.frarik_antizanzare_durata_manuale') | int % 60)) }}
          # Attiva pompa reale
          - service: switch.turn_on
            target:
              entity_id: *presa_az
          # Incrementa contatore mensile
          - service: counter.increment
            target:
              entity_id: counter.frarik_antizanzare_cicli_mensili
          # Decrementa contatore rimanenti
          - service: counter.decrement
            target:
              entity_id: counter.frarik_antizanzare_cicli_rimanenti

  # Avvio manuale da pulsante (imposta il boolean e quindi scatena l'automazione esistente)
  - id: frarik_antizanzare_avvio_manuale_button
    alias: "Anti Zanzare - Avvio Manuale (Button)"
    trigger:
      - platform: state
        entity_id: input_button.frarik_antizanzare_start_manuale
    condition: []
    action:
      - service: input_boolean.turn_on
        target:
          entity_id: input_boolean.frarik_antizanzare_manuale_attiva
    mode: single

  # Stop manuale da pulsante (spegne tutto e cancella timer)
  - id: frarik_antizanzare_stop_manuale_button
    alias: "Anti Zanzare - Stop Manuale (Button)"
    trigger:
      - platform: state
        entity_id: input_button.frarik_antizanzare_stop_manuale
    action:
      - service: input_boolean.turn_off
        target:
          entity_id: input_boolean.frarik_antizanzare_manuale_attiva
      - service: timer.cancel
        target:
          entity_id: timer.frarik_antizanzare_manuale_timer
      # Spegne pompa (sostituire con switch reale se necessario)
      - service: switch.turn_off
        target:
          entity_id: *presa_az
    mode: restart

  # Fine anti_zanzare manuale - Timer finito
  - id: frarik_antizanzare_fine_timer_manuale
    alias: "Anti Zanzare - Fine Timer Manuale"
    trigger:
      - platform: state
        entity_id: timer.frarik_antizanzare_manuale_timer
        from: "active"
        to: "idle"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_manuale_attiva
        state: "on"
    action:
      # Spegni pompa reale
      - service: switch.turn_off
        target:
          entity_id: *presa_az
      # Disattiva boolean manuale
      - service: input_boolean.turn_off
        target:
          entity_id: input_boolean.frarik_antizanzare_manuale_attiva

  # Stop manuale - Interruzione timer
  - id: frarik_antizanzare_stop_manuale_forzato
    alias: "Anti Zanzare - Stop Manuale Forzato"
    trigger:
      - platform: state
        entity_id: input_boolean.frarik_antizanzare_manuale_attiva
        to: "off"
    condition:
      - condition: state
        entity_id: timer.frarik_antizanzare_manuale_timer
        state: "active"
    action:
      # Ferma timer manuale
      - service: timer.cancel
        target:
          entity_id: timer.frarik_antizanzare_manuale_timer
      # Spegni pompa
      - service: switch.turn_off
        target:
          entity_id: *presa_az

####################################################
#             AUTOMAZIONI NOTIFICA                 #
####################################################

  # ── CICLI AUTOMATICI ─────────────────────────────────────────────────────────
  - alias: Notifica inizio ciclo automatico anti_zanzare
    trigger:
      - platform: state
        entity_id: timer.frarik_antizanzare_ciclo_timer
        to: "active"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_notify_push
        state: "on"
    action:
      - service: notify.frarik_antizanzare_notify
        data:
          title: "🌿 Anti Zanzare"
          message: >
            🌱 Ciclo automatico avviato.
            ⏱️ Nebulizzazione in corso...

  - alias: Notifica fine ciclo automatico anti_zanzare
    trigger:
      - platform: state
        entity_id: timer.frarik_antizanzare_ciclo_timer
        to: "idle"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_notify_push
        state: "on"
    action:
      - service: notify.frarik_antizanzare_notify
        data:
          title: "🌿 Anti Zanzare"
          message: "✅ Ciclo automatico completato."

  # ── CICLO MANUALE (nessuna condizione meteo/presenza) ────────────────────────
  - alias: Notifica inizio ciclo manuale anti_zanzare
    trigger:
      - platform: state
        entity_id: timer.frarik_antizanzare_manuale_timer
        to: "active"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_notify_push
        state: "on"
    action:
      - service: notify.frarik_antizanzare_notify
        data:
          title: "🔧 Anti Zanzare — Manuale"
          message: >
            🔧 Ciclo manuale avviato.
            ⏱️ Durata: {{ (states('input_number.frarik_antizanzare_durata_manuale') | int(0) // 60) }} min {{ (states('input_number.frarik_antizanzare_durata_manuale') | int(0) % 60) }} sec

  - alias: Notifica fine ciclo manuale anti_zanzare
    trigger:
      - platform: state
        entity_id: timer.frarik_antizanzare_manuale_timer
        to: "idle"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_notify_push
        state: "on"
    action:
      - service: notify.frarik_antizanzare_notify
        data:
          title: "🔧 Anti Zanzare — Manuale"
          message: "✅ Ciclo manuale completato."

  # ── VENTO ─────────────────────────────────────────────────────────────────────
  - alias: Notifica stop automazione per meteo
    trigger:
      - platform: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_vento
        from: "off"
        to: "on"
        for: "00:05:00"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_notify_push
        state: "on"
      - condition: template
        value_template: >
          {{ states('sensor.frarik_antizanzare_prossimo_ciclo_semplice') not in
             ['Nessun ciclo configurato', 'Automazione disattivata'] }}
    action:
      - service: notify.frarik_antizanzare_notify
        data:
          title: "💨 Anti Zanzare — Cicli Bloccati"
          message: >
            💨 Vento oltre la soglia — cicli sospesi.
            Velocità: {{ states('sensor.frarik_antizanzare_velocita_vento') | round(0) }} km/h (soglia {{ states('input_number.frarik_antizanzare_soglia_vento') | round(0) }} km/h)

  - alias: Notifica riattivazione vento anti_zanzare
    trigger:
      - platform: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_vento
        from: "on"
        to: "off"
        for: "00:05:00"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_notify_push
        state: "on"
      - condition: template
        value_template: >
          {{ states('sensor.frarik_antizanzare_prossimo_ciclo_semplice') not in
             ['Nessun ciclo configurato', 'Automazione disattivata'] }}
    action:
      - service: notify.frarik_antizanzare_notify
        data:
          title: "✅ Anti Zanzare — Vento"
          message: >
            ✅ Vento rientrato — cicli riattivati.
            Velocità attuale: {{ states('sensor.frarik_antizanzare_velocita_vento') | round(0) }} km/h

  # ── PROBABILITÀ PIOGGIA ───────────────────────────────────────────────────────
  - alias: Notifica blocco probabilita pioggia anti_zanzare
    trigger:
      - platform: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_pioggia_prob
        from: "off"
        to: "on"
        for: "00:05:00"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_notify_push
        state: "on"
      - condition: template
        value_template: >
          {{ states('sensor.frarik_antizanzare_prossimo_ciclo_semplice') not in
             ['Nessun ciclo configurato', 'Automazione disattivata'] }}
    action:
      - service: notify.frarik_antizanzare_notify
        data:
          title: "🌧️ Anti Zanzare — Cicli Bloccati"
          message: >
            🌧️ Alta probabilità pioggia — cicli sospesi.
            Probabilità: {{ states('IL_TUO_SENSORE_PROBABILITA_PIOGGIA') | round(0) }}% (soglia {{ states('input_number.frarik_antizanzare_soglia_pioggia') | round(0) }}%)

  - alias: Notifica riattivazione automazione per meteo
    trigger:
      - platform: state
        entity_id: binary_sensor.frarik_antizanzare_blocco_pioggia_prob
        from: "on"
        to: "off"
        for: "00:05:00"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_notify_push
        state: "on"
      - condition: template
        value_template: >
          {{ states('sensor.frarik_antizanzare_prossimo_ciclo_semplice') not in
             ['Nessun ciclo configurato', 'Automazione disattivata'] }}
    action:
      - service: notify.frarik_antizanzare_notify
        data:
          title: "✅ Anti Zanzare — Pioggia"
          message: >
            ✅ Probabilità pioggia rientrata — cicli riattivati.
            Probabilità attuale: {{ states('IL_TUO_SENSORE_PROBABILITA_PIOGGIA') | round(0) }}%

  # ── PIOGGIA IN CORSO ──────────────────────────────────────────────────────────
  - alias: Notifica pioggia in corso anti_zanzare
    trigger:
      - platform: state
        entity_id: binary_sensor.frarik_antizanzare_pioggia_corso
        from: "off"
        to: "on"
        for: "00:03:00"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_abilita_soglia_pioggia
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_notify_push
        state: "on"
      - condition: template
        value_template: >
          {{ states('sensor.frarik_antizanzare_prossimo_ciclo_semplice') not in
             ['Nessun ciclo configurato', 'Automazione disattivata'] }}
    action:
      - service: notify.frarik_antizanzare_notify
        data:
          title: "🌧️ Anti Zanzare — Sta Piovendo"
          message: "🌧️ Pioggia rilevata — cicli sospesi."

  - alias: Notifica pioggia cessata anti_zanzare
    trigger:
      - platform: state
        entity_id: binary_sensor.frarik_antizanzare_pioggia_corso
        from: "on"
        to: "off"
        for: "00:05:00"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_abilita_soglia_pioggia
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_notify_push
        state: "on"
      - condition: template
        value_template: >
          {{ states('sensor.frarik_antizanzare_prossimo_ciclo_semplice') not in
             ['Nessun ciclo configurato', 'Automazione disattivata'] }}
    action:
      - service: notify.frarik_antizanzare_notify
        data:
          title: "✅ Anti Zanzare — Pioggia"
          message: "✅ Pioggia cessata — cicli riattivati."

  # ── PERDITA ACQUA ─────────────────────────────────────────────────────────────
  - alias: Perdita cassetta spegne anti zanzare e notifica
    trigger:
      - platform: state
        entity_id: IL_TUO_SENSORE_PERDITA
        to: "on"
    action:
      - service: switch.turn_off
        target:
          entity_id: *presa_az
      - service: notify.frarik_antizanzare_notify
        data:
          title: "⚠️ Anti Zanzare — PERDITA ACQUA"
          message: >
            ⚠️ Perdita d'acqua rilevata!
            La nebulizzazione è stata interrotta automaticamente.
            Controllare immediatamente la cassetta.

  # ── LIVELLO TANICA ────────────────────────────────────────────────────────────
  - alias: Notifica livello tanica basso anti_zanzare
    trigger:
      - platform: numeric_state
        entity_id: sensor.frarik_antizanzare_livello_tanica
        below: input_number.frarik_antizanzare_soglia_livello_tanica
        for: "00:05:00"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_notify_push
        state: "on"
    action:
      - service: notify.frarik_antizanzare_notify
        data:
          title: "💧 Anti Zanzare — Tanica"
          message: >
            💧 Livello tanica basso!
            Livello attuale: {{ states('sensor.frarik_antizanzare_livello_tanica') | round(0) }}%
            Ricaricare la tanica al più presto.

# ----------------------------------------------------------------------
  # SICUREZZA PERSONA (Telecamera Giardino DX)
  # ----------------------------------------------------------------------

  # Sistema unificato presenza: un solo interruttore (input_boolean.presenza_attiva,
  # impostabile dalla card in Impostazioni) governa sia il blocco immediato che il
  # blocco preventivo dei nuovi cicli. NON tocca i timer/automazione_attiva: spegne
  # solo la presa, così il ciclo interrotto può riprendere da solo quando l'area si libera.

  # 1. Persona rilevata → spegni SUBITO la presa (indipendentemente da cicli/timer)
  - id: frarik_antizanzare_presenza_blocca
    alias: "Anti Zanzare - Presenza: Blocco Immediato"
    trigger:
      - platform: state
        entity_id: *sensore_presenza
        to: "on"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_presenza_attiva
        state: "on"
    action:
      - service: switch.turn_off
        target:
          entity_id: *presa_az

  # 2. Persona non più presente → riaccendi la presa SOLO se un ciclo era ancora
  #    in corso (timer attivo): significa che era stato interrotto dalla presenza,
  #    quindi va ripreso. Se non c'era nessun ciclo in corso non fa nulla.
  - id: frarik_antizanzare_presenza_riaccendi
    alias: "Anti Zanzare - Presenza: Riprendi Ciclo se Interrotto"
    trigger:
      - platform: state
        entity_id: *sensore_presenza
        to: "off"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_presenza_attiva
        state: "on"
      - condition: or
        conditions:
          - condition: state
            entity_id: timer.frarik_antizanzare_ciclo_timer
            state: "active"
          - condition: state
            entity_id: timer.frarik_antizanzare_manuale_timer
            state: "active"
    action:
      - service: switch.turn_on
        target:
          entity_id: *presa_az

  # ── PRESENZA ──────────────────────────────────────────────────────────────────
  - id: frarik_antizanzare_notifica_presenza_rilevata
    alias: "Anti Zanzare - Notifica Presenza Rilevata"
    trigger:
      - platform: state
        entity_id: *sensore_presenza
        from: "off"
        to: "on"
        for: "00:01:00"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_presenza_attiva
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_notify_push
        state: "on"
      - condition: template
        value_template: >
          {{ states('sensor.frarik_antizanzare_prossimo_ciclo_semplice') not in
             ['Nessun ciclo configurato', 'Automazione disattivata'] }}
    action:
      - service: notify.frarik_antizanzare_notify
        data:
          title: "🚶 Anti Zanzare — Presenza"
          message: "🚶 Persona rilevata — nebulizzazione sospesa."

  - id: frarik_antizanzare_notifica_area_libera
    alias: "Anti Zanzare - Notifica Area Libera"
    trigger:
      - platform: state
        entity_id: *sensore_presenza
        from: "on"
        to: "off"
        for: "00:02:00"
    condition:
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_presenza_attiva
        state: "on"
      - condition: state
        entity_id: input_boolean.frarik_antizanzare_notify_push
        state: "on"
      - condition: template
        value_template: >
          {{ states('sensor.frarik_antizanzare_prossimo_ciclo_semplice') not in
             ['Nessun ciclo configurato', 'Automazione disattivata'] }}
    action:
      - service: notify.frarik_antizanzare_notify
        data:
          title: "✅ Anti Zanzare — Presenza"
          message: "✅ Area libera — nebulizzazione ripristinata."

  # ── SPEGNIMENTO TIMER ────────────────────────────────────────────────────────
  # Quando il timer ciclo automatico finisce → spegni la presa
  - id: frarik_antizanzare_timer_ciclo_finished
    alias: "Anti Zanzare - Timer Ciclo Terminato"
    trigger:
      - platform: event
        event_type: timer.finished
        event_data:
          entity_id: timer.frarik_antizanzare_ciclo_timer
    action:
      - service: switch.turn_off
        target:
          entity_id: *presa_az

  # Quando il timer manuale finisce → spegni la presa e resetta lo stato
  - id: frarik_antizanzare_timer_manuale_finished
    alias: "Anti Zanzare - Timer Manuale Terminato"
    trigger:
      - platform: event
        event_type: timer.finished
        event_data:
          entity_id: timer.frarik_antizanzare_manuale_timer
    action:
      - service: switch.turn_off
        target:
          entity_id: *presa_az
      - service: input_boolean.turn_off
        target:
          entity_id: input_boolean.frarik_antizanzare_manuale_attiva`;

  function _buildPkgAZ(sw, push, pioggia, _tpl, vento, tanica, presenza, perdita, pompa, probPioggia) {
    var ind = '          ';
    var pushLines = (push && push.length)
      ? push.map(function(p) { return ind + '- service: ' + p; }).join('\n')
      : ind + '- service: mobile_app_smartphone';
    var yaml = (_tpl || _AZ_PKG_YAML)
      .split('IL_TUO_PRESA_ANTIZANZARE').join(sw || 'switch.presa_anti_zanzare')
      .split('IL_TUO_SENSORE_PROBABILITA_PIOGGIA').join(probPioggia || 'sensor.probabilita_pioggia')
      .split('IL_TUO_SENSORE_PIOGGIA').join(pioggia || 'binary_sensor.pioggia')
      .split('IL_TUO_SENSORE_LIVELLO_TANICA').join(tanica || 'sensor.non_configurato')
      .split('IL_TUO_SENSORE_VENTO').join(vento || 'sensor.non_configurato')
      .split('IL_TUO_SENSORE_PRESENZA').join(presenza || 'binary_sensor.non_configurato')
      .split('IL_TUO_SENSORE_PERDITA').join(perdita || 'binary_sensor.non_configurato')
      .split('IL_TUO_SENSORE_POMPA').join(pompa || 'sensor.non_configurato');
    yaml = yaml.replace(/[ 	]*- service: IL_TUO_MOBILE_APP/, pushLines);
    yaml = yaml.replace(/[ 	]*- IL_TUO_MEDIA_PLAYER_ALEXA/, ind + '- media_player.non_configurato');
    return yaml;
  }

  function _azOpenImpostazioni() {
    var h;
    try { h = typeof window.frarikHass === 'function' ? window.frarikHass() : null; } catch(e) { h = null; }
    function bs(e) { return !!(h && h.states && h.states[e] && h.states[e].state === 'on'); }
    function ss(e) { var st = h && h.states && h.states[e]; return (st && st.state) || ''; }
    function ns(e) { var st = h && h.states && h.states[e]; var v = parseFloat(st ? st.state : ''); return isNaN(v) ? 0 : v; }
    function csvc(d, s, data) { try { if (h && h.callService) h.callService(d, s, data||{}); } catch(e) {} }

    var iBase = 'background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);border-radius:8px;font-size:12px;font-family:system-ui;box-sizing:border-box;outline:none;color-scheme:dark';
    var rows = [];
    function dSec(lbl) {
      rows.push('<div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;padding:12px 0 6px;border-bottom:1px solid rgba(56,189,248,.15)">' + lbl + '</div>');
    }
    function dToggle(entity, lbl) {
      var on = bs(entity);
      rows.push('<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
        + '<span style="font-size:13px;color:#fff">' + lbl + '</span>'
        + '<div class="az-sw ' + (on ? 'on' : 'off') + '" data-entity="' + entity + '"><div class="az-knob"></div></div>'
        + '</div>');
    }
    function dTime(entity, lbl) {
      var raw = ss(entity), val = raw && raw.length >= 5 ? raw.substring(0, 5) : '';
      rows.push('<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04);gap:10px">'
        + '<span style="font-size:13px;color:#fff;flex:1">' + lbl + '</span>'
        + '<input type="time" class="az-inp" data-entity="' + entity + '" data-svctype="time" value="' + val + '" style="' + iBase + ';width:108px;padding:6px 8px;text-align:center">'
        + '</div>');
    }
    function dNum(entity, lbl, unit, mn, mx, step) {
      var val = ns(entity);
      rows.push('<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04);gap:10px">'
        + '<span style="font-size:13px;color:#fff;flex:1">' + lbl + (unit ? ' <span style="font-size:10px;color:rgba(255,255,255,.6)">(' + unit + ')</span>' : '') + '</span>'
        + '<input type="number" class="az-inp" data-entity="' + entity + '" data-svctype="number" value="' + val + '" min="' + (mn||0) + '" max="' + (mx||9999) + '" step="' + (step||1) + '" style="' + iBase + ';width:90px;padding:6px 8px;text-align:right">'
        + '</div>');
    }
    function dText(entity, lbl) {
      var val = ss(entity);
      rows.push('<div style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
        + '<div style="font-size:13px;color:#fff;margin-bottom:5px">' + lbl + '</div>'
        + '<input type="text" class="az-inp" data-entity="' + entity + '" data-svctype="text" value="' + (val||'').replace(/"/g,'&quot;') + '" style="' + iBase + ';width:100%;padding:7px 10px">'
        + '</div>');
    }

    dSec('🔔 Notifiche');
    dToggle('input_boolean.frarik_antizanzare_notify_push',  '📱 Push');
    dToggle('input_boolean.frarik_antizanzare_notify_alexa', '🔊 Alexa');
    dTime('input_datetime.frarik_antizanzare_orario_inizio_notifiche', '⏰ Inizio notifiche');
    dTime('input_datetime.frarik_antizanzare_orario_fine_notifiche',   '⏰ Fine notifiche');

    dSec('🌬 Condizioni blocco');
    dToggle('input_boolean.frarik_antizanzare_abilita_soglia_vento',   '💨 Abilita blocco vento');
    dNum('input_number.frarik_antizanzare_soglia_vento',   'Soglia vento',   'km/h', 0, 100, 1);
    dToggle('input_boolean.frarik_antizanzare_abilita_soglia_pioggia', '🌧 Abilita blocco pioggia');
    dNum('input_number.frarik_antizanzare_soglia_pioggia', 'Soglia pioggia', '%',    0, 100, 5);

    dSec('👤 Presenza');
    dToggle('input_boolean.frarik_antizanzare_presenza_attiva', 'Pausa per presenza');

    dSec('⚙ Automazioni');
    dToggle('input_boolean.frarik_antizanzare_automazione_attiva', 'Automazione attiva');
    dToggle('input_boolean.frarik_antizanzare_manuale_attiva',     'Manuale attiva');

    dSec('🎯 Cicli mensili');
    dNum('input_number.frarik_antizanzare_cicli_target_mensili', 'Target mensile', 'cicli', 1, 200, 1);

    dSec('⏱ Durata manuale');
    dNum('input_number.frarik_antizanzare_durata_manuale', 'Durata', 'sec', 10, 3600, 10);

    dSec('📝 Nome');
    dText('input_text.frarik_antizanzare_nome', 'Nome dispositivo');

    var swCss = '<style>'
      + '.az-sw{width:44px;height:26px;border-radius:13px;cursor:pointer;position:relative;flex-shrink:0;transition:background .25s}'
      + '.az-sw.on{background:#06b6d4}.az-sw.off{background:rgba(255,255,255,.12)}'
      + '.az-knob{position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .25s;box-shadow:0 1px 4px rgba(0,0,0,.4)}'
      + '.az-sw.on .az-knob{left:21px}.az-sw.off .az-knob{left:3px}'
      + '.az-inp:focus{border-color:rgba(6,182,212,.55)!important}'
      + '</style>';
    var saveBtn = '<button id="az-save" style="width:100%;margin-top:12px;padding:13px;border-radius:12px;background:rgba(6,182,212,.15);border:1px solid rgba(6,182,212,.4);color:#06b6d4;font-size:14px;font-weight:700;cursor:pointer">💾 Salva impostazioni</button>';
    var closeId = 'az-imp-' + Math.random().toString(36).slice(2,6);

    /* build overlay using the page-level overlay helper if available */
    var ov;
    var html = '<div id="' + closeId + '-bd" style="position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;pointer-events:auto">'
      + '<div style="background:#0d1627;border-radius:18px;border:1px solid rgba(6,182,212,.3);width:min(96vw,430px);max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.7)">'
      + '<div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.07)">'
      + '<span style="font-size:20px">⚙</span>'
      + '<span style="font-size:15px;font-weight:800;color:#fff;flex:1">Impostazioni Anti Zanzare</span>'
      + '<button id="' + closeId + '" style="background:none;border:none;color:rgba(255,255,255,.4);font-size:20px;cursor:pointer;padding:4px">✕</button>'
      + '</div>'
      + '<div style="overflow-y:auto;padding:14px 16px;flex:1">'
      + swCss + rows.join('') + saveBtn
      + '</div>'
      + '</div>'
      + '</div>';

    var host = document.createElement('div');
    host.innerHTML = html;
    ov = host.firstChild;
    var closeEl = ov.querySelector ? ov.querySelector('#' + closeId) : null;
    if (closeEl) closeEl.addEventListener('click', function() { if (ov.parentNode) ov.parentNode.removeChild(ov); });
    ov.addEventListener('click', function(e) { if (e.target.id === closeId + '-bd') { if (ov.parentNode) ov.parentNode.removeChild(ov); } });

    ov.querySelectorAll('.az-sw').forEach(function(sw) {
      sw.addEventListener('click', function() { sw.classList.toggle('on'); sw.classList.toggle('off'); });
    });

    var sb = ov.querySelector('#az-save');
    if (sb) sb.addEventListener('click', function() {
      ov.querySelectorAll('.az-sw[data-entity]').forEach(function(sw) {
        var entity = sw.dataset.entity;
        csvc(entity.split('.')[0], sw.classList.contains('on') ? 'turn_on' : 'turn_off', {entity_id: entity});
      });
      ov.querySelectorAll('.az-inp[data-entity]').forEach(function(inp) {
        var entity = inp.dataset.entity, type = inp.dataset.svctype;
        if (!entity) return;
        if (type === 'time') { if (inp.value) csvc('input_datetime','set_datetime',{entity_id:entity,time:inp.value+':00'}); }
        else if (type === 'number') { var v = parseFloat(inp.value); if (!isNaN(v)) csvc('input_number','set_value',{entity_id:entity,value:v}); }
        else if (type === 'text') { csvc('input_text','set_value',{entity_id:entity,value:inp.value}); }
      });
      sb.textContent = '✅ Salvato!';
      sb.style.background = 'rgba(34,197,94,.15)';
      sb.style.borderColor = 'rgba(34,197,94,.4)';
      sb.style.color = '#4ade80';
      setTimeout(function() { sb.textContent = '💾 Salva impostazioni'; sb.style.background=''; sb.style.borderColor=''; sb.style.color=''; }, 2000);
    });

    var target = document.querySelector('home-assistant') || document.body;
    if (target) target.appendChild(ov);
  }
  window._azOpenImpostazioni = _azOpenImpostazioni;

  function _openWizardAZ(hass, onDone, _tpl) {
    var states = (hass && hass.states) || {};
    var switchIds  = Object.keys(states).filter(function(id) { return /^switch\./.test(id); }).sort();
    var sensorIds  = Object.keys(states).filter(function(id) { return /^sensor\./.test(id); }).sort();
    var bsIds      = Object.keys(states).filter(function(id) { return /^binary_sensor\./.test(id); }).sort();
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(_AZ_WIZ_KEY) || 'null'); } catch(e) {}
    var pushRows = (saved && saved.push && saved.push.length) ? saved.push.slice() : [''];

    var host = document.createElement('div');
    var sr = host.attachShadow({mode: 'open'});
    document.body.appendChild(host);
    function destroy() { try { document.body.removeChild(host); } catch(e) {} }

    function setupAC(inp, drop, ids) {
      if (!inp || !drop) return;
      function show() {
        var q = inp.value.toLowerCase().trim();
        var hits = (q ? ids.filter(function(id) { return id.toLowerCase().includes(q); }) : ids).slice(0, 50);
        if (!hits.length) { drop.style.display = 'none'; return; }
        drop.innerHTML = hits.map(function(id) { return '<div class="wd-item" data-pick="' + id + '">' + id + '</div>'; }).join('');
        drop.style.display = 'block';
        drop.querySelectorAll('[data-pick]').forEach(function(row) {
          row.addEventListener('mousedown', function(ev) { ev.preventDefault(); inp.value = row.getAttribute('data-pick'); drop.style.display = 'none'; });
          row.addEventListener('mouseover', function() { row.style.background = 'rgba(255,255,255,.08)'; });
          row.addEventListener('mouseout', function() { row.style.background = ''; });
        });
      }
      inp.addEventListener('focus', show);
      inp.addEventListener('input', show);
      inp.addEventListener('blur', function() { setTimeout(function() { drop.style.display = 'none'; }, 200); });
    }

    function multiRows(rows, cls, placeholder) {
      return rows.map(function(v, i) {
        return '<div class="wd-push-row"><div style="position:relative;flex:1"><input class="wd-inp ' + cls + '" type="text" autocomplete="off" placeholder="' + placeholder + '" value="' + (v || '').replace(/"/g, '&quot;') + '"><div class="wd-drop"></div></div><button class="wd-rm" data-rm="' + i + '">✕</button></div>';
      }).join('');
    }

    function renderWiz() {
      var swVal       = (saved && saved.sw)         || '';
      var pioggiaVal  = (saved && saved.pioggia)    || '';
      var probPiogVal = (saved && saved.probPioggia)|| '';
      var ventoVal    = (saved && saved.vento)      || '';
      var tanicaVal   = (saved && saved.tanica)     || '';
      var presVal     = (saved && saved.presenza)   || '';
      var perdVal     = (saved && saved.perdita)    || '';
      var pompaVal    = (saved && saved.pompa)      || '';
      sr.innerHTML = '<style>'
        + ':host{all:initial;font-family:system-ui,sans-serif}'
        + '.wd-bd{position:fixed;inset:0;z-index:200000;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);display:flex;align-items:flex-end}'
        + '.wd-panel{width:100%;max-height:88vh;display:flex;flex-direction:column;background:#080f18;border:1px solid rgba(56,189,248,.3);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.8);color:#fff;overflow:hidden;animation:wUp .22s cubic-bezier(.32,1.12,.56,1)}'
        + '@keyframes wUp{from{transform:translateY(100%)}to{transform:translateY(0)}}'
        + '.wd-hdr{display:flex;align-items:center;gap:10px;padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}'
        + '.wd-ico{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;background:rgba(56,189,248,.15);border:1px solid rgba(56,189,248,.3);flex-shrink:0}'
        + '.wd-tit{font-size:14px;font-weight:800}.wd-sub{font-size:11px;color:rgba(255,255,255,.45);margin-top:1px}'
        + '.wd-x{margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none}'
        + '.wd-body{flex:1;overflow-y:auto;padding:16px;scrollbar-width:none;display:flex;flex-direction:column;gap:14px}'
        + '.wd-body::-webkit-scrollbar{display:none}'
        + '.wd-sec{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;padding-bottom:5px;border-bottom:1px solid rgba(56,189,248,.18);margin-bottom:10px}'
        + '.wd-lbl{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px}'
        + '.wd-frow{position:relative;margin-bottom:10px}'
        + '.wd-inp{width:100%;padding:9px 11px;border-radius:10px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none}'
        + '.wd-inp:focus{border-color:rgba(56,189,248,.5)}'
        + '.wd-drop{position:absolute;left:0;right:0;top:100%;z-index:10;max-height:150px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 9px 9px;display:none}'
        + '.wd-item{padding:5px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#e2e8f0}'
        + '.wd-push-row{display:flex;gap:6px;margin-bottom:6px}'
        + '.wd-rm{width:30px;height:38px;border-radius:8px;background:rgba(255,255,255,.07);border:none;color:#fff;cursor:pointer;font-size:14px;flex-shrink:0}'
        + '.wd-add{padding:6px 12px;border-radius:8px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.25);color:#38bdf8;font-size:11px;font-weight:700;cursor:pointer}'
        + '.wd-note{font-size:11px;color:rgba(255,255,255,.4);line-height:1.5;margin:0 0 10px}'
        + '.wd-foot{padding:12px 16px;border-top:1px solid rgba(255,255,255,.07);display:flex;gap:8px;flex-shrink:0}'
        + '.wd-cancel{flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:700;font-size:13px;background:rgba(255,255,255,.1);color:#fff}'
        + '.wd-install{flex:2;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;font-size:13px;background:#38bdf8;color:#060d14}'
        + '.wd-loading{opacity:.6;pointer-events:none}'
        + '</style>'
        + '<div class="wd-bd" id="wd-bd"><div class="wd-panel">'
        + '<div class="wd-hdr"><div class="wd-ico">🦟</div>'
        + '<div><div class="wd-tit">Installa PKG Anti Zanzare</div><div class="wd-sub">frarik_antizanzare.yaml → config/packages/</div></div>'
        + '<button class="wd-x" id="wd-x">✕</button></div>'
        + '<div class="wd-body">'
        + '<div><div class="wd-sec">Switch Anti Zanzare</div>'
        + '<p class="wd-note">Switch/presa che controlla il dispositivo antizanzare.</p>'
        + '<div class="wd-lbl">Entity Switch</div>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-switch" type="text" autocomplete="off" placeholder="switch.presa_anti_zanzare" value="' + swVal.replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-switch"></div></div>'
        + '</div>'
        + '<div><div class="wd-sec">Sensori meteo</div>'
        + '<p class="wd-note">Sensore fisico di pioggia (binary_sensor.*, on = sta piovendo) e sensore di probabilità pioggia in % (es. da OpenMeteo, Yr.no).</p>'
        + '<div class="wd-lbl">Pioggia in corso (binary_sensor.*)</div>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-pioggia" type="text" autocomplete="off" placeholder="binary_sensor.pioggia" value="' + pioggiaVal.replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-pioggia"></div></div>'
        + '<div class="wd-lbl">Probabilità pioggia % (sensor.*)</div>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-prob-pioggia" type="text" autocomplete="off" placeholder="sensor.probabilita_pioggia" value="' + probPiogVal.replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-prob-pioggia"></div></div>'
        + '</div>'
        + '<div><div class="wd-sec">Sensori (opzionali)</div>'
        + '<p class="wd-note">Lascia vuoto se non hai il sensore, il PKG usa valori di default.</p>'
        + '<div class="wd-lbl">Velocità vento (sensor.*)</div>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-vento" type="text" autocomplete="off" placeholder="sensor.velocita_vento" value="' + ventoVal.replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-vento"></div></div>'
        + '<div class="wd-lbl">Livello tanica (sensor.* in % oppure binary_sensor.* asciutto/bagnato)</div>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-tanica" type="text" autocomplete="off" placeholder="sensor.livello_tanica" value="' + tanicaVal.replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-tanica"></div></div>'
        + '<div class="wd-lbl">Potenza pompa W (sensor.*)</div>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-pompa" type="text" autocomplete="off" placeholder="sensor.potenza_pompa" value="' + pompaVal.replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-pompa"></div></div>'
        + '<div class="wd-lbl">Rilevazione presenza (binary_sensor.*)</div>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-presenza" type="text" autocomplete="off" placeholder="binary_sensor.presenza_casa" value="' + presVal.replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-presenza"></div></div>'
        + '<div class="wd-lbl">Perdita acqua (binary_sensor.*, opz.)</div>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-perdita" type="text" autocomplete="off" placeholder="binary_sensor.perdita_acqua" value="' + perdVal.replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-perdita"></div></div>'
        + '</div>'
        + '<div><div class="wd-sec">Notifiche Push</div>'
        + '<p class="wd-note">mobile_app dei dispositivi che ricevono le notifiche. Lascia vuoto per saltare.</p>'
        + '<div id="push-rows">' + multiRows(pushRows, 'push-inp', 'mobile_app_...') + '</div>'
        + '<button class="wd-add" id="push-add">+ Aggiungi dispositivo</button>'
        + '</div>'
        + '</div>'
        + '<div class="wd-foot">'
        + '<button class="wd-cancel" id="wd-cancel">Annulla</button>'
        + '<button class="wd-install" id="wd-install">📦 Installa PKG</button>'
        + '</div></div></div>';

      sr.getElementById('wd-x').addEventListener('click', destroy);
      sr.getElementById('wd-cancel').addEventListener('click', destroy);
      sr.getElementById('wd-bd').addEventListener('click', function(e) { if (e.target === sr.getElementById('wd-bd')) destroy(); });

      sr.getElementById('push-rows').addEventListener('click', function(e) {
        var btn = e.target.closest('[data-rm]'); if (!btn) return;
        pushRows.length = 0;
        Array.from(sr.querySelectorAll('.push-inp')).forEach(function(i) { pushRows.push(i.value); });
        pushRows.splice(+btn.dataset.rm, 1);
        if (!pushRows.length) pushRows.push('');
        renderWiz();
      });
      sr.getElementById('push-add').addEventListener('click', function() {
        Array.from(sr.querySelectorAll('.push-inp')).forEach(function(i, idx) { pushRows[idx] = i.value; });
        pushRows.push('');
        renderWiz();
      });

      setupAC(sr.getElementById('f-switch'),      sr.getElementById('d-switch'),      switchIds);
      setupAC(sr.getElementById('f-pioggia'),     sr.getElementById('d-pioggia'),     bsIds);
      setupAC(sr.getElementById('f-prob-pioggia'),sr.getElementById('d-prob-pioggia'),sensorIds);
      setupAC(sr.getElementById('f-vento'),       sr.getElementById('d-vento'),       sensorIds);
      setupAC(sr.getElementById('f-tanica'),   sr.getElementById('d-tanica'),   sensorIds);
      setupAC(sr.getElementById('f-pompa'),    sr.getElementById('d-pompa'),    sensorIds);
      setupAC(sr.getElementById('f-presenza'), sr.getElementById('d-presenza'), bsIds);
      setupAC(sr.getElementById('f-perdita'),  sr.getElementById('d-perdita'),  bsIds);

      sr.getElementById('wd-install').addEventListener('click', function() {
        var sw         = sr.getElementById('f-switch').value.trim();
        var pioggia    = sr.getElementById('f-pioggia').value.trim();
        var probPioggia= sr.getElementById('f-prob-pioggia').value.trim();
        var vento      = sr.getElementById('f-vento').value.trim();
        var tanica     = sr.getElementById('f-tanica').value.trim();
        var pompa      = sr.getElementById('f-pompa').value.trim();
        var presenza   = sr.getElementById('f-presenza').value.trim();
        var perdita    = sr.getElementById('f-perdita').value.trim();
        var push = Array.from(sr.querySelectorAll('.push-inp')).map(function(i) { return i.value.trim(); }).filter(Boolean);
        try { localStorage.setItem(_AZ_WIZ_KEY, JSON.stringify({sw: sw, push: push, pioggia: pioggia, probPioggia: probPioggia, vento: vento, tanica: tanica, pompa: pompa, presenza: presenza, perdita: perdita})); } catch(e) {}
        var m = location.pathname.match(/^(.*\/api\/hassio_ingress\/[^/]+)/);
        var base = location.origin + (m ? m[1] : '');
        var btn = sr.getElementById('wd-install');
        btn.classList.add('wd-loading'); btn.textContent = 'Installazione…';
        var yaml = _buildPkgAZ(sw, push, pioggia, _tpl, vento, tanica, presenza, perdita, pompa, probPioggia);
        btn.textContent = 'Installazione…';
        fetch(base + '/api/frarik/pkg/install', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({name: 'frarik/frarik_antizanzare.yaml', content: yaml})
        }).then(function(r) { return r.json().then(function(j) { return {r: r, j: j}; }); })
          .then(function(res) {
            destroy();
            if (res.r.ok && res.j.ok) {
              try { if (typeof window.showToast === 'function') window.showToast('📦 PKG Anti Zanzare installato! Riavvia HA.'); } catch(e) {}
              if (typeof onDone === 'function') onDone();
            } else {
              try { if (typeof window.showToast === 'function') window.showToast('⚠️ Errore installazione PKG: ' + ((res.j && res.j.error) || '')); } catch(e) {}
            }
          }).catch(function() {
            destroy();
            try { if (typeof window.showToast === 'function') window.showToast('⚠️ Errore connessione al PKG install'); } catch(e) {}
          });
      });
    }
    renderWiz();
  }

  // ── Store helpers v2.1 ───────────────────────────────────────────────
  function _azH() { try { return (typeof window.frarikHass === 'function' && window.frarikHass()) || {}; } catch(e) { return {}; } }
  function _azKey(c) { return 'frarik_azcard_' + (c.id || 'x'); }
  function _azLoad(c) { try { return JSON.parse(localStorage.getItem(_azKey(c)) || '{}') || {}; } catch(e) { return {}; } }
  function _azSave(c, o) { try { localStorage.setItem(_azKey(c), JSON.stringify(o)); } catch(e) {} }
  function _azS(h, id) { return (h && h.states && h.states[id] && h.states[id].state) || null; }
  function _azAttr(h, id, a) { var s = h && h.states && h.states[id]; return (s && s.attributes && s.attributes[a] != null) ? s.attributes[a] : null; }
  function _azNum(v) { var x = parseFloat(String(v != null ? v : '').replace(',','.')); return isNaN(x) ? null : x; }
  function _azIsOn(h, id) { return !!(h && h.states && h.states[id] && h.states[id].state === 'on'); }

  function _azFmtTimer(h, tid) {
    if (_azS(h, tid) !== 'active') return {rem:'--:--', pct:0, active:false};
    var fa = _azAttr(h, tid, 'finishes_at'), dur = _azAttr(h, tid, 'duration');
    var remSec = fa ? Math.max(0, Math.floor((new Date(fa).getTime() - Date.now()) / 1000)) : 0;
    var durSec = 0;
    if (dur) { var p = String(dur).split(':').map(Number); durSec = (p[0]||0)*3600+(p[1]||0)*60+(p[2]||0); }
    var pct = durSec > 0 ? Math.max(0, Math.min(100, (remSec / durSec) * 100)) : 0;
    return {rem:('0'+Math.floor(remSec/60)).slice(-2)+':'+('0'+(remSec%60)).slice(-2), pct:pct, active:true, remSec:remSec, durSec:durSec};
  }

  function _azFmtDurCompact(v) {
    var m = Math.floor(v / 60), s = v % 60;
    return v >= 60 ? (m + 'm' + (s ? (' ' + s + 's') : '')) : (v + 's');
  }

  // Supporta sia sensori % (0-100) sia binary_sensor/sensor asciutto-bagnato:
  // bagnato = c'è ancora acqua nella tanica (OK), asciutto = tanica vuota.
  function _azTanicaInfo(raw, configured) {
    if (raw === null || raw === undefined || raw === '' || raw === 'unavailable' || raw === 'unknown') {
      return { dsp: configured ? '--' : 'N/D', col: '#fff' };
    }
    var num = _azNum(raw);
    if (num !== null) {
      return { dsp: num.toFixed(0) + '%', col: num < 20 ? '#ef4444' : (num < 40 ? '#f59e0b' : '#fff') };
    }
    var s = String(raw).toLowerCase();
    if (s === 'on' || s === 'bagnato' || s === 'wet') return { dsp: '💧 OK', col: '#22c55e' };
    if (s === 'off' || s === 'asciutto' || s === 'dry') return { dsp: '⚠ Vuota', col: '#ef4444' };
    return { dsp: String(raw), col: '#fff' };
  }

  function _azPkgDef() {
    return {
      pk_prefix:          'frarik_antizanzare',
      pk_stato:           'sensor.frarik_antizanzare_stato_sistema',
      pk_auto:            'input_boolean.frarik_antizanzare_automazione_attiva',
      pk_manuale:         'input_boolean.frarik_antizanzare_manuale_attiva',
      pk_timer_ciclo:     'timer.frarik_antizanzare_ciclo_timer',
      pk_timer_manuale:   'timer.frarik_antizanzare_manuale_timer',
      pk_cicli_mensili:   'counter.frarik_antizanzare_cicli_mensili',
      pk_cicli_target:    'input_number.frarik_antizanzare_cicli_target_mensili',
      pk_pioggia:         'sensor.frarik_antizanzare_probabilita_pioggia',
      pk_pioggia_corso:   'binary_sensor.frarik_antizanzare_pioggia_corso',
      pk_blocco_meteo:    'binary_sensor.frarik_antizanzare_blocco_meteo',
      pk_consumo_acqua:   'sensor.frarik_antizanzare_consumo_acqua',
      pk_durata_manuale:  'input_number.frarik_antizanzare_durata_manuale',
      pk_soglia_pioggia:  'input_number.frarik_antizanzare_soglia_pioggia',
      pk_soglia_vento:    'input_number.frarik_antizanzare_soglia_vento',
      pk_btn_auto_on:     'input_button.frarik_antizanzare_start_automazione',
      pk_btn_auto_off:    'input_button.frarik_antizanzare_stop_automazione',
      pk_btn_man_on:      'input_button.frarik_antizanzare_start_manuale',
      pk_btn_man_off:     'input_button.frarik_antizanzare_stop_manuale',
      pk_persona:         '',
      pk_perdita:         'binary_sensor.frarik_antizanzare_perdita_acqua',
      pk_prossimo:        'sensor.frarik_antizanzare_prossimo_ciclo_completo',
      pk_cicli_rim:       'sensor.frarik_antizanzare_cicli_rimanenti_mensili',
      pk_avanzamento:     'sensor.frarik_antizanzare_avanzamento_mensile',
      pk_vento:           'sensor.frarik_antizanzare_velocita_vento',
      pk_tanica:          'sensor.frarik_antizanzare_livello_tanica',
      pk_consumo_pompa:   'sensor.frarik_antizanzare_potenza_pompa',
      pk_presenza_attiva: 'input_boolean.frarik_antizanzare_presenza_attiva',
      pk_notify_push:     'input_boolean.frarik_antizanzare_notify_push',
      pk_notify_alexa:    'input_boolean.frarik_antizanzare_notify_alexa',
      pk_inizio_ntf:      'input_datetime.frarik_antizanzare_orario_inizio_notifiche',
      pk_fine_ntf:        'input_datetime.frarik_antizanzare_orario_fine_notifiche',
      pk_presa_entity:    'input_text.frarik_antizanzare_entity_presa',
      pk_abilita_pioggia: 'input_boolean.frarik_antizanzare_abilita_soglia_pioggia',
      pk_abilita_vento:   'input_boolean.frarik_antizanzare_abilita_soglia_vento',
    };
  }

  function _azCfgFor(card) {
    var st = _azLoad(card), pk = _azPkgDef(), r = {};
    Object.keys(pk).forEach(function(k) { r[k] = (st[k] !== undefined && st[k] !== '') ? st[k] : pk[k]; });
    r.name = st.name || 'Anti Zanzare';
    return r;
  }

  function _azDevSVG(stato, col, colRgb, timerRem, blocco) {
    var active = timerRem !== null;
    var glow = active
      ? 'drop-shadow(0 0 4px rgba(' + colRgb + ',1)) drop-shadow(0 0 16px rgba(' + colRgb + ',.65)) drop-shadow(0 0 40px rgba(' + colRgb + ',.28))'
      : (blocco ? 'drop-shadow(0 0 8px rgba(96,165,250,.5))' : 'drop-shadow(0 0 6px rgba(' + colRgb + ',.18))');
    var remTxt = active ? (timerRem || 'ATTIVO') : 'STAND';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 108" overflow="hidden" style="display:block;width:100%;height:100%;filter:' + glow + '">'
      + '<rect x="8" y="96" width="48" height="7" rx="3.5" fill="#090f1e" stroke="' + col + '" stroke-width=".5" opacity="' + (active ? '.85' : '.5') + '"/>'
      + '<rect x="14" y="24" width="34" height="72" rx="16" fill="' + (active ? 'rgba(' + colRgb + ',.06)' : '#0b1929') + '" stroke="' + col + '" stroke-width="' + (active ? '1.3' : '.85') + '"/>'
      + '<rect x="16" y="30" width="6" height="60" rx="3" fill="rgba(255,255,255,' + (active ? '.1' : '.04') + ')"/>'
      + (active ? '<rect x="15" y="40" width="32" height="56" rx="4" fill="rgba(' + colRgb + ',.22)"><animate attributeName="opacity" values=".22;.55;.22" dur="2.2s" repeatCount="indefinite"/></rect>' : '')
      + '<ellipse cx="31" cy="32" rx="15.5" ry="5" fill="' + (active ? 'rgba(' + colRgb + ',.22)' : '#0d2040') + '" stroke="rgba(' + colRgb + ',' + (active ? '.6' : '.12') + ')" stroke-width="' + (active ? '.9' : '.5') + '"/>'
      + '<ellipse cx="31" cy="88" rx="15.5" ry="4.5" fill="#090f1e" stroke="rgba(' + colRgb + ',' + (active ? '.35' : '.08') + ')" stroke-width=".5"/>'
      + '<text x="31" y="46" text-anchor="middle" font-size="5.5" fill="rgba(255,255,255,' + (active ? '.18' : '.07') + ')" font-family="system-ui,sans-serif" font-weight="800">4L</text>'
      + '<rect x="18" y="50" width="26" height="30" rx="4" fill="#060e1c" stroke="rgba(' + colRgb + ',' + (active ? '.5' : '.2') + ')" stroke-width="' + (active ? '.9' : '.6') + '"/>'
      + (active ? '<circle cx="31" cy="58" r="10" fill="none" stroke="' + col + '" stroke-width="1.5"><animate attributeName="r" values="7.5;14;7.5" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values=".6;0;.6" dur="1.8s" repeatCount="indefinite"/></circle>' : '')
      + '<circle cx="31" cy="58" r="7.5" fill="#091526" stroke="' + col + '" stroke-width="' + (active ? '1.3' : '.85') + '"/>'
      + '<circle cx="31" cy="58" r="4.5" fill="#040a12"/>'
      + '<circle cx="31" cy="58" r="2.8" fill="' + col + '" opacity="' + (active ? '1' : '.35') + '">'
      + (active ? '<animate attributeName="r" values="2.8;4;2.8" dur="1.4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;1;.7" dur="1.4s" repeatCount="indefinite"/>' : '')
      + '</circle>'
      + '<rect x="19.5" y="68.5" width="23" height="6.5" rx="1.8" fill="#02060e" stroke="rgba(' + colRgb + ',' + (active ? '.55' : '.3') + ')" stroke-width=".5"/>'
      + '<text x="31" y="73.5" text-anchor="middle" font-size="4" font-weight="bold" font-family="monospace,system-ui" fill="' + col + '">' + remTxt + '</text>'
      + '<circle cx="31" cy="82" r="3" fill="#060e1c" stroke="rgba(' + colRgb + ',.15)" stroke-width=".6"/>'
      + '<circle cx="31" cy="82" r="1" fill="' + col + '" opacity=".4"/>'
      + '<rect x="43" y="22" width="5" height="10" rx="2.5" fill="#0b1929" stroke="' + (active ? col : '#1e3a5f') + '" stroke-width=".55"/>'
      + '<rect x="43" y="16" width="16" height="5.5" rx="2.75" fill="#0b1929" stroke="' + (active ? col : '#1e3a5f') + '" stroke-width=".55"/>'
      + '<ellipse cx="57" cy="18.75" rx="3" ry="6" fill="#0a1525" stroke="rgba(' + colRgb + ',' + (active ? '.75' : '.3') + ')" stroke-width="' + (active ? '1' : '.6') + '"/>'
      + '<line x1="45" y1="22" x2="45" y2="27" stroke="' + (active ? col : '#1e3a5f') + '" stroke-width="2" stroke-linecap="round"/>'
      + (active ? (
          '<g>'
        + '<line x1="59" y1="9" x2="64" y2="3" stroke="' + col + '" stroke-width="2.2" stroke-linecap="round"><animate attributeName="opacity" values="1;.05;1" dur="0.8s" repeatCount="indefinite"/></line>'
        + '<line x1="60.5" y1="17" x2="66" y2="14" stroke="' + col + '" stroke-width="1.8" stroke-linecap="round"><animate attributeName="opacity" values="1;.05;1" dur="1.0s" begin=".22s" repeatCount="indefinite"/></line>'
        + '<line x1="59" y1="25" x2="64" y2="30" stroke="' + col + '" stroke-width="1.5" stroke-linecap="round"><animate attributeName="opacity" values="1;.05;1" dur="0.75s" begin=".48s" repeatCount="indefinite"/></line>'
        + '<circle cx="63" cy="6" r="2.2" fill="' + col + '"><animate attributeName="r" values="1;3.5;1" dur="1.0s" begin=".08s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="1.0s" begin=".08s" repeatCount="indefinite"/></circle>'
        + '<circle cx="65" cy="16" r="1.8" fill="' + col + '"><animate attributeName="r" values="1;2.8;1" dur="1.2s" begin=".35s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0;.9" dur="1.2s" begin=".35s" repeatCount="indefinite"/></circle>'
        + '</g>'
      ) : '')
      + (blocco ? (
          '<g opacity=".85">'
        + '<line x1="7" y1="5" x2="5" y2="16" stroke="#60a5fa" stroke-width="1.6" stroke-linecap="round"><animateTransform attributeName="transform" type="translate" values="0,-20;0,115" dur="0.88s" begin="0s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.85;.85;0" dur="0.88s" begin="0s" repeatCount="indefinite"/></line>'
        + '<line x1="19" y1="5" x2="17" y2="15" stroke="#93c5fd" stroke-width="1.2" stroke-linecap="round"><animateTransform attributeName="transform" type="translate" values="0,-20;0,115" dur="0.76s" begin="0.18s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.75;.75;0" dur="0.76s" begin="0.18s" repeatCount="indefinite"/></line>'
        + '<line x1="31" y1="5" x2="29" y2="16" stroke="#60a5fa" stroke-width="1.4" stroke-linecap="round"><animateTransform attributeName="transform" type="translate" values="0,-20;0,115" dur="0.95s" begin="0.38s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.8;.8;0" dur="0.95s" begin="0.38s" repeatCount="indefinite"/></line>'
        + '<line x1="44" y1="5" x2="42" y2="15" stroke="#bfdbfe" stroke-width="1.1" stroke-linecap="round"><animateTransform attributeName="transform" type="translate" values="0,-20;0,115" dur="0.82s" begin="0.55s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.7;.7;0" dur="0.82s" begin="0.55s" repeatCount="indefinite"/></line>'
        + '<line x1="57" y1="5" x2="55" y2="16" stroke="#93c5fd" stroke-width="1.5" stroke-linecap="round"><animateTransform attributeName="transform" type="translate" values="0,-20;0,115" dur="0.9s" begin="0.72s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.8;.8;0" dur="0.9s" begin="0.72s" repeatCount="indefinite"/></line>'
        + '<line x1="13" y1="5" x2="11" y2="14" stroke="#60a5fa" stroke-width="1" stroke-linecap="round"><animateTransform attributeName="transform" type="translate" values="0,-20;0,115" dur="1.0s" begin="0.08s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.6;.6;0" dur="1.0s" begin="0.08s" repeatCount="indefinite"/></line>'
        + '</g>'
      ) : '')
      + '</svg>';
  }

  function _azNextCycleInfo(h, prefix) {
    var dayIds = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'];
    var dayLabels = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
    var now = new Date();
    var todayIdx = (now.getDay() + 6) % 7; // Mon=0..Sun=6
    var nowMin = now.getHours() * 60 + now.getMinutes();
    for (var offset = 0; offset < 7; offset++) {
      var dayIdx = (todayIdx + offset) % 7;
      var d = dayIds[dayIdx];
      if (!_azIsOn(h, 'input_boolean.' + prefix + '_' + d)) continue;
      var nC = Math.round(_azNum(_azS(h, 'input_number.' + prefix + '_' + d + '_num_cicli')) || 0);
      if (nC <= 0) continue;
      var times = [];
      for (var ci = 1; ci <= Math.min(nC, 5); ci++) {
        var t = _azS(h, 'input_datetime.' + prefix + '_' + d + '_orario_ciclo' + ci) || '';
        if (t) {
          var pts = t.slice(0, 5).split(':');
          times.push({ min: parseInt(pts[0]) * 60 + parseInt(pts[1] || 0), str: t.slice(0, 5) });
        }
      }
      times.sort(function(a, b) { return a.min - b.min; });
      for (var ti = 0; ti < times.length; ti++) {
        if (offset > 0 || times[ti].min > nowMin) {
          return { day: dayLabels[dayIdx], time: times[ti].str };
        }
      }
    }
    return null;
  }

  function _azRender(card) {
    var h = _azH(), c = _azCfgFor(card);
    var rid = 'fraz' + (card.id || 'az');
    var stato = _azS(h, c.pk_stato) || 'Spenta';
    var autoOn = _azIsOn(h, c.pk_auto), manOn = _azIsOn(h, c.pk_manuale);
    var blocco = _azIsOn(h, c.pk_blocco_meteo);
    var pioggiaCorsoBool = _azIsOn(h, c.pk_pioggia_corso);
    var timerC = _azFmtTimer(h, c.pk_timer_ciclo), timerM = _azFmtTimer(h, c.pk_timer_manuale);
    var cicliM = _azNum(_azS(h, c.pk_cicli_mensili)) || 0;
    var target = _azNum(_azS(h, c.pk_cicli_target)) || 100;
    var pioggia = _azNum(_azS(h, c.pk_pioggia)) || 0;
    var perdita = _azIsOn(h, c.pk_perdita);
    var cicliRim = _azNum(_azS(h, c.pk_cicli_rim));
    var consumo = _azNum(_azS(h, c.pk_consumo_acqua));
    var vento = c.pk_vento ? _azNum(_azS(h, c.pk_vento)) : null;
    var tanicaRaw = c.pk_tanica ? _azS(h, c.pk_tanica) : null;
    var consumoPompa = c.pk_consumo_pompa ? _azNum(_azS(h, c.pk_consumo_pompa)) : consumo;
    var activeTimer = timerC.active ? timerC : timerM;
    var timerActive = timerC.active || timerM.active;
    var timerLabel = timerC.active ? 'CICLO' : 'MANUALE';
    var sogliaPioggia = _azNum(_azS(h, c.pk_soglia_pioggia)) || 0;
    var sogliaVento = _azNum(_azS(h, c.pk_soglia_vento)) || 0;
    var presenzaAttiva  = _azIsOn(h, c.pk_presenza_attiva);
    var col = '#64748b', colRgb = '100,116,139', statusLabel = 'SPENTA';
    if (blocco)                              { col = '#f59e0b'; colRgb = '245,158,11';  statusLabel = 'METEO'; }
    else if (stato === 'Manuale Attiva')     { col = '#f97316'; colRgb = '249,115,22';  statusLabel = 'ACCESA'; }
    else if (stato === 'Ciclo in Corso')     { col = '#22c55e'; colRgb = '34,197,94';   statusLabel = 'ACCESA'; }
    else if (stato === 'Automazione Attiva') { col = '#06b6d4'; colRgb = '6,182,212';   statusLabel = 'ACCESA'; }
    var isAccesa = (autoOn || manOn || timerActive);
    var bgOpacity = isAccesa ? '.15' : '.07';

    var durataManuale = Math.round(_azNum(_azS(h, c.pk_durata_manuale)) || 60);
    var durManHtml = '';
    if (!timerActive) {
      durManHtml = '<div class="fc-met"><span class="fc-met-lbl">Durata manuale</span>'
        + '<span style="display:flex;align-items:center;gap:4px">'
        + '<div class="fc-stp-btn" data-sya="durman-minus" style="width:18px;height:18px;border-radius:5px;background:rgba(255,255,255,.1);color:#fff;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1">−</div>'
        + '<span class="fc-met-v" style="min-width:46px;text-align:center;font-size:12px">' + _azFmtDurCompact(durataManuale) + '</span>'
        + '<div class="fc-stp-btn" data-sya="durman-plus" style="width:18px;height:18px;border-radius:5px;background:rgba(255,255,255,.1);color:#fff;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1">+</div>'
        + '</span></div>';
    }

    var avvisoHtml = '';
    if (blocco) {
      var bloccoPerPioggia = sogliaPioggia > 0 && pioggia >= sogliaPioggia;
      var bloccoPerVento = sogliaVento > 0 && vento !== null && vento >= sogliaVento;
      var reasons = [];
      if (bloccoPerPioggia) reasons.push('🌧 Prob. pioggia ' + pioggia.toFixed(0) + '% ≥ soglia ' + sogliaPioggia.toFixed(0) + '%');
      if (bloccoPerVento) reasons.push('💨 Vento ' + vento.toFixed(0) + ' km/h ≥ soglia ' + sogliaVento.toFixed(0) + ' km/h');
      if (presenzaAttiva && !(bloccoPerPioggia || bloccoPerVento)) reasons.push('👤 Presenza rilevata nell\'area');
      else if (presenzaAttiva && (bloccoPerPioggia || bloccoPerVento)) reasons.push('👤 + Presenza rilevata nell\'area');
      if (reasons.length === 0) reasons.push('⛈ Condizioni sfavorevoli rilevate');
      avvisoHtml = '<div style="margin:0 10px 7px;padding:9px 12px;border-radius:11px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3)">'
        + '<div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#ef4444;margin-bottom:4px">🚫 CICLI BLOCCATI</div>'
        + reasons.map(function(r) { return '<div style="font-size:11px;font-weight:600;color:#fff">' + r + '</div>'; }).join('')
        + '</div>';
    }

    var nextCycleInfo = !timerActive ? _azNextCycleInfo(h, c.pk_prefix || 'frarik_antizanzare') : null;
    var nextCycleHtml = '';
    if (!timerActive) {
      var ncAutoOff = nextCycleInfo && !autoOn;
      var ncBg = ncAutoOff ? 'rgba(245,158,11,.07)' : (nextCycleInfo ? 'rgba(6,182,212,.08)' : 'rgba(255,255,255,.03)');
      var ncBd = ncAutoOff ? 'rgba(245,158,11,.3)' : (nextCycleInfo ? 'rgba(6,182,212,.28)' : 'rgba(255,255,255,.07)');
      var ncCol = ncAutoOff ? '#f59e0b' : (nextCycleInfo ? '#06b6d4' : '#475569');
      nextCycleHtml = '<div style="margin:0 10px 7px;padding:9px 12px;border-radius:11px;background:' + ncBg + ';border:1px solid ' + ncBd + '">'
        + '<div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:' + ncCol + ';margin-bottom:3px">📅 PROSSIMO CICLO</div>'
        + (nextCycleInfo
          ? '<div style="font-size:13px;font-weight:800;color:#fff">' + nextCycleInfo.day + ' alle ' + nextCycleInfo.time + '</div>'
            + (ncAutoOff ? '<div style="font-size:10px;font-weight:600;color:#f59e0b;margin-top:2px">⚠ Automazione disattivata — il ciclo non partirà</div>' : '')
          : '<div style="font-size:11px;font-weight:600;color:#475569">Nessun ciclo programmato</div>')
        + '</div>';
    }

    var css = '<style>'
      + '@keyframes azPulse{0%,100%{opacity:.6}50%{opacity:1}}'
      + '#' + rid + '{position:relative;width:100%;height:100%;min-height:260px;font-family:system-ui,sans-serif;display:block}'
      + '#' + rid + ' .fc-card{display:flex;flex-direction:column;height:100%;background:linear-gradient(155deg,#060d14 0%,#08101a 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#' + rid + ' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:180px;background:radial-gradient(ellipse at 20% 0%,rgba(' + colRgb + ',' + bgOpacity + ') 0%,transparent 65%);pointer-events:none}'
      + '#' + rid + ' .fc-hdr{display:flex;align-items:center;gap:9px;padding:10px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;background:rgba(' + colRgb + ',.1);border:1px solid rgba(' + colRgb + ',.2)}'
      + '#' + rid + ' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fc-hdr-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px;background:rgba(' + colRgb + ',.1);border:1px solid rgba(' + colRgb + ',.28);color:' + col + '}'
      + '#' + rid + ' .fc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:' + col + (timerActive ? ';animation:azPulse 1.5s ease-in-out infinite' : '') + '}'
      + '#' + rid + ' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#' + rid + ' .fc-scroll::-webkit-scrollbar{display:none}'
      + '#' + rid + ' .fc-hero{display:flex;align-items:stretch;padding:9px 14px 7px}'
      + '#' + rid + ' .fc-hero-img{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;max-height:120px}'
      + '#' + rid + ' .fc-hero-r{flex:1;display:flex;flex-direction:column;gap:5px;justify-content:center;min-width:0;border-left:1px solid rgba(255,255,255,.07);padding-left:10px}'
      + '#' + rid + ' .fc-met{display:flex;align-items:center;justify-content:space-between;gap:4px}'
      + '#' + rid + ' .fc-met-lbl{font-size:11px;font-weight:700;color:#fff;flex-shrink:0}'
      + '#' + rid + ' .fc-met-v{font-size:14px;font-weight:800;color:#fff;text-align:right}'
      + '#' + rid + ' .fc-tmr-v{font-size:22px;font-weight:900;color:' + col + ';font-variant-numeric:tabular-nums;letter-spacing:-.02em;text-align:right}'
      + '#' + rid + ' .fc-tmr-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#fff;text-align:right}'
      + '#' + rid + ' .fc-grid{display:flex;margin:0 10px 7px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;overflow:hidden}'
      + '#' + rid + ' .fc-gc{flex:1;display:flex;flex-direction:column;align-items:center;padding:7px 2px;gap:2px;min-width:0}'
      + '#' + rid + ' .fc-gc-sep{width:1px;background:rgba(255,255,255,.07);flex-shrink:0}'
      + '#' + rid + ' .fc-gc-ico{font-size:14px;line-height:1}'
      + '#' + rid + ' .fc-gc-v{font-size:11px;font-weight:800;color:#fff;text-align:center;white-space:nowrap}'
      + '#' + rid + ' .fc-gc-l{font-size:8px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.03em;text-align:center}'
      + '#' + rid + ' .fc-row{display:flex;gap:5px;padding:0 10px 7px}'
      + '#' + rid + ' .fc-pill{flex:1;display:flex;align-items:center;gap:5px;padding:5px 7px;border-radius:8px;min-width:0}'
      + '#' + rid + ' .fc-pill-ico{font-size:13px;flex-shrink:0}'
      + '#' + rid + ' .fc-pill-lbl{font-size:8px;font-weight:700;color:#fff;text-transform:uppercase}'
      + '#' + rid + ' .fc-pill-v{font-size:11px;font-weight:800;color:#fff}'
      + '#' + rid + ' .fc-btns{display:flex;gap:6px;padding:0 14px 11px}'
      + '#' + rid + ' .fc-btn{flex:1;padding:8px 4px;border-radius:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:10px;font-weight:700;color:#fff;text-align:center;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:3px}'
      + '#' + rid + ' .fc-btn:hover{background:rgba(' + colRgb + ',.12);border-color:rgba(' + colRgb + ',.3);color:' + col + '}'
      + '#' + rid + ' .fc-btn-act{background:rgba(' + colRgb + ',.15);border-color:rgba(' + colRgb + ',.35);color:' + col + '}'
      + '</style>';

    // Hero right column — no duplicate status (already in header pill)
    var heroR = '<div class="fc-hero-r">'
      + (timerActive
          ? '<div class="fc-tmr-lbl">' + timerLabel + ' IN CORSO</div><div id="' + rid + '-tt2" class="fc-tmr-v">' + activeTimer.rem + '</div>'
          : '')
      + '<div class="fc-met"><span class="fc-met-lbl">Cicli mese</span><span class="fc-met-v">' + cicliM + ' / ' + target + '</span></div>'
      + '<div class="fc-met"><span class="fc-met-lbl">Rimanenti</span><span class="fc-met-v" style="color:' + (cicliRim !== null && cicliRim <= 5 ? '#f59e0b' : '#fff') + '">' + (cicliRim !== null ? cicliRim : Math.max(0, target - cicliM)) + '</span></div>'
      + durManHtml
      + '</div>';

    var heroHtml = '<div class="fc-hero">'
      + '<div class="fc-hero-img">' + _azDevSVG(stato, col, colRgb, timerActive ? activeTimer.rem : null, blocco) + '</div>'
      + heroR + '</div>';

    // Timer countdown bar — aggiornata via DOM tick (no CSS animation, no re-render jitter)
    var timerBarHtml = '';
    if (timerActive && activeTimer.durSec > 0) {
      var initPct = activeTimer.pct.toFixed(2);
      timerBarHtml = '<div style="padding:0 14px 8px">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'
        + '<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#fff">' + timerLabel + ' in corso</span>'
        + '<span id="' + rid + '-tt" style="font-size:13px;font-weight:900;color:#00b4ff;font-variant-numeric:tabular-nums">' + activeTimer.rem + '</span>'
        + '</div>'
        + '<div style="height:5px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden">'
        + '<div id="' + rid + '-tb" style="height:100%;background:#00b4ff;border-radius:3px;box-shadow:0 0 10px #00b4ff99;width:' + initPct + '%;transition:width .25s linear"></div>'
        + '</div></div>';
    }

    // Sensor grid: Vento / Pioggia / Prob.pioggia / Meteo
    function gc(ico, val, lbl, vc, sya, badge) {
      return '<div class="fc-gc"' + (sya ? ' data-sya="' + sya + '" style="cursor:pointer"' : '') + '>'
        + '<div class="fc-gc-ico">' + ico + '</div>'
        + '<div class="fc-gc-v" style="color:' + (vc||'#fff') + '">' + val + '</div>'
        + '<div class="fc-gc-l">' + lbl + '</div>'
        + (badge ? '<div style="font-size:9px;font-weight:700;letter-spacing:.03em;margin-top:3px;padding:2px 7px;border-radius:5px;' + badge.s + '">' + badge.t + '</div>' : '')
        + '</div>';
    }
    var ventoDsp = vento !== null ? vento.toFixed(0) + ' km/h' : (c.pk_vento ? '--' : 'N/D');
    var pioggiaCol = pioggiaCorsoBool ? '#f59e0b' : '#22c55e';
    var meteoCol = blocco ? '#f59e0b' : '#22c55e';
    var sensorGrid = '<div class="fc-grid">'
      + gc('💨', ventoDsp, 'Vento', vento !== null && vento > 35 ? '#f59e0b' : '#fff')
      + '<div class="fc-gc-sep"></div>'
      + gc('🌧', pioggiaCorsoBool ? 'Sì' : 'No', 'Pioggia', pioggiaCol)
      + '<div class="fc-gc-sep"></div>'
      + gc('🌂', pioggia.toFixed(0) + '%', 'Prob.pioggia', pioggia > 50 ? '#f59e0b' : '#fff')
      + '<div class="fc-gc-sep"></div>'
      + gc(blocco ? '⛈' : '☀️', blocco ? 'Bloccato' : 'OK', 'Meteo', meteoCol)
      + '</div>';

    // Status pills row: prob. pioggia / blocco meteo / perdita cassetta
    function pill(ico, lbl, val, bg, bd, vc, sya) {
      return '<div class="fc-pill" style="background:' + bg + ';border:1px solid ' + bd + ';' + (sya?'cursor:pointer':'') + '"'
        + (sya?' data-sya="'+sya+'"':'') + '>'
        + '<div class="fc-pill-ico">' + ico + '</div>'
        + '<div style="min-width:0"><div class="fc-pill-lbl">' + lbl + '</div><div class="fc-pill-v" style="color:' + vc + '">' + val + '</div></div>'
        + '</div>';
    }
    var pompaDsp = consumoPompa !== null ? consumoPompa.toFixed(0) + ' W' : (c.pk_consumo_pompa ? '--' : 'N/D');
    var tanicaInfo = _azTanicaInfo(tanicaRaw, !!c.pk_tanica);
    var statusRow = '<div class="fc-row">'
      + pill(perdita ? '🚨' : '💧', 'Allagamento', perdita ? '⚠ Perdita' : 'OK',
          perdita ? 'rgba(239,68,68,.08)' : 'rgba(255,255,255,.03)',
          perdita ? 'rgba(239,68,68,.25)' : 'rgba(255,255,255,.07)',
          perdita ? '#ef4444' : '#22c55e')
      + pill('⚡', 'Pompa', pompaDsp, 'rgba(255,255,255,.03)', 'rgba(255,255,255,.07)', col)
      + pill('🪣', 'Livello acqua', tanicaInfo.dsp, 'rgba(255,255,255,.03)', 'rgba(255,255,255,.07)', tanicaInfo.col)
      + '</div>';

    var manStyle = manOn
      ? 'background:rgba(239,68,68,.15);border-color:rgba(239,68,68,.4);color:#ef4444'
      : 'background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.3);color:#22c55e';
    var autoStyle = autoOn
      ? 'background:rgba(239,68,68,.15);border-color:rgba(239,68,68,.4);color:#ef4444'
      : 'background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.3);color:#22c55e';
    var btnsHtml = '<div class="fc-btns">'
      + '<div class="fc-btn" style="' + manStyle + '" data-sya="' + (manOn?'man-off':'man-on') + '">' + (manOn?'⏹ Ferma':'▶ Manuale') + '</div>'
      + '<div class="fc-btn" style="' + autoStyle + '" data-sya="' + (autoOn?'auto-off':'auto-on') + '">' + (autoOn?'⏹ Ferma Auto':'▶ Auto') + '</div>'
      + '<div class="fc-btn" data-sya="popup-cfg" style="flex:0.55">⚙</div>'
      + '</div>';

    return css
      + '<div id="' + rid + '"><div class="fc-card">'
      + '<div class="fc-hdr"><div class="fc-hdr-iw">🦟</div>'
      + '<div class="fc-hdr-tit">' + (c.name || 'Anti Zanzare') + '</div>'
      + '<div class="fc-hdr-pill"><div class="fc-dot"></div>' + statusLabel + '</div></div>'
      + '<div class="fc-scroll">' + heroHtml + timerBarHtml + avvisoHtml + nextCycleHtml + sensorGrid + statusRow + btnsHtml + '</div>'
      + '</div></div>';
  }

  function _azMkOv(html, closeId) {
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

  function _azPopShell(icon, rgb, title, sub, closeId, content) {
    return '<style>@keyframes azUP{from{transform:translateY(100%)}to{transform:translateY(0)}}.azpc{overflow-y:auto;scrollbar-width:none}.azpc::-webkit-scrollbar{display:none}</style>'
      + '<div style="width:100%;max-height:78vh;display:flex;flex-direction:column;background:#060d14;border:1px solid rgba(' + rgb + ',.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:azUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      + '<div style="display:flex;align-items:center;gap:10px;padding:13px 15px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
      + '<div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(' + rgb + ',.15);border:1px solid rgba(' + rgb + ',.3)">' + icon + '</div>'
      + '<div><div style="font-size:14px;font-weight:800;color:#fff">' + title + '</div><div style="font-size:11px;color:#fff;margin-top:1px">' + sub + '</div></div>'
      + '<button id="' + closeId + '" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none">✕</button>'
      + '</div>'
      + '<div class="azpc" style="flex:1;overflow-y:auto;padding:13px 15px;display:flex;flex-direction:column;gap:0">' + content + '</div>'
      + '</div>';
  }

  function _azOpenProgramma(card, el) {
    var h = _azH(), c = _azCfgFor(card);
    var prefix = c.pk_prefix || 'anti_zanzare';
    var dayIds = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'];
    var dayLabels = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
    var col = '#22c55e', rgb = '34,197,94';
    var dayRows = dayIds.map(function(d, i) {
      var isOn = _azIsOn(h, 'input_boolean.' + prefix + '_' + d);
      var nC = Math.round(_azNum(_azS(h, 'input_number.' + prefix + '_' + d + '_num_cicli')) || 0);
      var times = [];
      for (var ci = 1; ci <= Math.min(nC, 5); ci++) {
        var t = _azS(h, 'input_datetime.' + prefix + '_' + d + '_orario_ciclo' + ci) || '';
        if (t) times.push(t.slice(0, 5));
      }
      var pillBg = isOn && nC > 0 ? 'rgba(' + rgb + ',.07)' : 'rgba(255,255,255,.03)';
      var pillBd = isOn && nC > 0 ? 'rgba(' + rgb + ',.22)' : 'rgba(255,255,255,.07)';
      var badge = nC > 0
        ? '<span style="background:rgba(' + rgb + ',.15);border:1px solid rgba(' + rgb + ',.3);border-radius:10px;padding:2px 8px;font-size:10px;font-weight:800;color:' + col + '">' + nC + ' cicl' + (nC===1?'o':'i') + '</span>'
        : '<span style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:2px 8px;font-size:10px;font-weight:600;color:#475569">nessuno</span>';
      return '<div style="background:' + pillBg + ';border:1px solid ' + pillBd + ';border-radius:14px;padding:10px 12px;margin-bottom:7px">'
        + '<div style="display:flex;align-items:center;gap:8px">'
        + '<span style="font-size:12px;font-weight:700;color:#fff;flex:1">' + dayLabels[i] + '</span>'
        + badge
        + '<div class="az-dtog" data-eid="input_boolean.' + prefix + '_' + d + '" data-on="' + (isOn?'1':'0') + '" '
        + 'style="width:36px;height:20px;border-radius:10px;flex-shrink:0;cursor:pointer;background:' + (isOn?col:'rgba(255,255,255,.15)') + ';position:relative;transition:background .2s">'
        + '<div style="position:absolute;top:2px;' + (isOn?'right:2px':'left:2px') + ';width:16px;height:16px;border-radius:50%;background:#fff;transition:all .2s"></div>'
        + '</div>'
        + '</div>'
        + (isOn ? '<div style="display:flex;align-items:center;gap:6px;margin-top:7px">'
          + (times.length ? '<span style="font-size:10px;color:rgba(255,255,255,.45);flex:1">' + times.join(' · ') + '</span>' : '<span style="flex:1"></span>')
          + '<button class="az-dedit" data-day="' + d + '" style="padding:4px 10px;border-radius:8px;border:1px solid rgba(' + rgb + ',.3);background:rgba(' + rgb + ',.1);font-size:10px;font-weight:700;color:' + col + ';cursor:pointer">✏ Modifica cicli</button>'
          + '</div>' : '')
        + '</div>';
    }).join('');
    var content = dayRows
      + '<button id="azpm-ok" style="width:100%;padding:10px;border-radius:11px;border:1px solid rgba(255,255,255,.12);cursor:pointer;font-weight:700;font-size:13px;background:rgba(255,255,255,.07);color:#fff;margin-top:4px">Chiudi</button>';
    var ov = _azMkOv(_azPopShell('📅',rgb,'Programma Settimanale','Attiva giorni e configura orari cicli','az-pm-cl',content),'az-pm-cl');
    ov.querySelector('#azpm-ok').addEventListener('click', function() { ov._close(); if (el) el._fcSig = null; });
    ov.querySelectorAll('.az-dtog').forEach(function(tog) {
      tog.addEventListener('click', function() {
        var wasOn = tog.dataset.on === '1';
        _azCallSvc('input_boolean', wasOn?'turn_off':'turn_on', {entity_id:tog.dataset.eid});
        tog.dataset.on = wasOn ? '0' : '1';
        tog.style.background = wasOn ? 'rgba(255,255,255,.15)' : col;
        var k = tog.querySelector('div'); if (k) { k.style.right = wasOn?'':'2px'; k.style.left = wasOn?'2px':''; }
      });
    });
    ov.querySelectorAll('.az-dedit').forEach(function(btn) {
      btn.addEventListener('click', function() { _azOpenDayDetail(card, btn.dataset.day, prefix, el); });
    });
  }

  function _azOpenDayDetail(card, day, prefix, el) {
    var h = _azH();
    var lbl = {lunedi:'Lunedì',martedi:'Martedì',mercoledi:'Mercoledì',giovedi:'Giovedì',venerdi:'Venerdì',sabato:'Sabato',domenica:'Domenica'}[day]||day;
    var nC = Math.round(_azNum(_azS(h,'input_number.'+prefix+'_'+day+'_num_cicli'))||0);
    var col = '#22c55e', rgb = '34,197,94';
    function fmtDv(v) { var m=Math.floor(v/60),s=v%60; return v>=60?(m+'min'+(s?' '+s+'s':'')):(v+'s'); }
    var rows = '';
    for (var i = 1; i <= 5; i++) {
      var tv = (_azS(h,'input_datetime.'+prefix+'_'+day+'_orario_ciclo'+i)||'07:00:00').slice(0,5);
      var dv = Math.round(_azNum(_azS(h,'input_number.'+prefix+'_'+day+'_durata_ciclo'+i))||60);
      var active = i <= nC;
      var pillBg = active ? 'rgba('+rgb+',.06)' : 'rgba(255,255,255,.03)';
      var pillBd = active ? 'rgba('+rgb+',.2)' : 'rgba(255,255,255,.06)';
      var badgeBg = active ? 'rgba('+rgb+',.15)' : 'rgba(255,255,255,.06)';
      var badgeBd = active ? 'rgba('+rgb+',.3)' : 'rgba(255,255,255,.1)';
      var cycleCol = active ? col : '#374151';
      var dim = active ? '' : 'opacity:0.28;pointer-events:none;';
      rows += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;background:'+pillBg+';border:1px solid '+pillBd+';margin-bottom:6px;'+dim+'">'
        + '<span style="font-size:10px;font-weight:800;color:'+cycleCol+';background:'+badgeBg+';border:1px solid '+badgeBd+';border-radius:6px;padding:2px 7px;flex-shrink:0">C'+i+'</span>'
        + '<input type="time" value="'+tv+'" id="azdd-t'+i+'" style="flex:1;padding:5px 7px;border-radius:8px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:13px;outline:none;min-width:0">'
        + '<div style="display:flex;align-items:center;gap:3px;flex-shrink:0">'
        + '<button id="azdd-dm'+i+'" style="width:24px;height:24px;border-radius:6px;border:none;background:rgba(255,255,255,.08);color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center">−</button>'
        + '<span id="azdd-dv'+i+'" style="font-size:10px;font-weight:700;color:#f1f5f9;min-width:42px;text-align:center">'+fmtDv(dv)+'</span>'
        + '<button id="azdd-dp'+i+'" style="width:24px;height:24px;border-radius:6px;border:none;background:rgba(255,255,255,.08);color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>'
        + '<input type="hidden" id="azdd-d'+i+'" value="'+dv+'">'
        + '</div>'
        + '</div>';
    }
    var content = '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0 12px;border-bottom:1px solid rgba(255,255,255,.07);margin-bottom:10px">'
      + '<span style="font-size:12px;font-weight:600;color:#fff">Cicli attivi (0–5)</span>'
      + '<div style="display:flex;align-items:center;gap:7px">'
      + '<button id="azdd-ncm" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.08);color:#fff;font-size:17px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center">−</button>'
      + '<span id="azdd-ncv" style="font-size:20px;font-weight:800;color:'+col+';min-width:28px;text-align:center">'+nC+'</span>'
      + '<input type="hidden" id="azdd-nc" value="'+nC+'">'
      + '<button id="azdd-ncp" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.08);color:#fff;font-size:17px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>'
      + '</div>'
      + '</div>'
      + rows
      + '<button id="azdd-save" style="width:100%;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;font-size:13px;background:'+col+';color:#022c1b;margin-top:8px">💾 Salva '+lbl+'</button>';
    var ov2 = _azMkOv(_azPopShell('📅',rgb,lbl,'Orari e durate cicli','azdd-cl',content),'azdd-cl');
    var ncInput = ov2.querySelector('#azdd-nc'), ncDisp = ov2.querySelector('#azdd-ncv');
    ov2.querySelector('#azdd-ncm').addEventListener('click', function() {
      var v = Math.max(0, parseInt(ncInput.value)-1); ncInput.value=v; ncDisp.textContent=v;
    });
    ov2.querySelector('#azdd-ncp').addEventListener('click', function() {
      var v = Math.min(5, parseInt(ncInput.value)+1); ncInput.value=v; ncDisp.textContent=v;
    });
    for (var j = 1; j <= 5; j++) {
      (function(ci) {
        var dHid = ov2.querySelector('#azdd-d'+ci), dDisp = ov2.querySelector('#azdd-dv'+ci);
        var dmBtn = ov2.querySelector('#azdd-dm'+ci), dpBtn = ov2.querySelector('#azdd-dp'+ci);
        if (dmBtn) dmBtn.addEventListener('click', function() {
          var v = Math.max(10, parseInt(dHid.value)-10); dHid.value=v; dDisp.textContent=fmtDv(v);
        });
        if (dpBtn) dpBtn.addEventListener('click', function() {
          var v = Math.min(3600, parseInt(dHid.value)+10); dHid.value=v; dDisp.textContent=fmtDv(v);
        });
      })(j);
    }
    ov2.querySelector('#azdd-save').addEventListener('click', function() {
      var h2 = _azH();
      var ncv = parseInt(ncInput.value)||0;
      if (h2&&h2.callService) h2.callService('input_number','set_value',{entity_id:'input_number.'+prefix+'_'+day+'_num_cicli',value:ncv});
      for (var k = 1; k <= 5; k++) {
        var ti = ov2.querySelector('#azdd-t'+k), di = ov2.querySelector('#azdd-d'+k);
        if (ti&&ti.value&&h2&&h2.callService) h2.callService('input_datetime','set_datetime',{entity_id:'input_datetime.'+prefix+'_'+day+'_orario_ciclo'+k,time:ti.value+':00'});
        if (di&&di.value&&h2&&h2.callService) h2.callService('input_number','set_value',{entity_id:'input_number.'+prefix+'_'+day+'_durata_ciclo'+k,value:parseFloat(di.value)});
      }
      ov2._close();
      if (el) el._fcSig = null;
    });
  }

  function _azOpenUserCfg(card, el) {
    var h = _azH(), c = _azCfgFor(card);
    var prefix = c.pk_prefix || 'frarik_antizanzare';
    var autoOn       = _azIsOn(h, c.pk_auto);
    var presenzaOn   = _azIsOn(h, c.pk_presenza_attiva);
    var notifyPushOn = _azIsOn(h, c.pk_notify_push);
    var notifyAlexaOn= _azIsOn(h, c.pk_notify_alexa);
    var abilitaPioggiaOn = c.pk_abilita_pioggia ? _azIsOn(h, c.pk_abilita_pioggia) : false;
    var abilitaVentoOn   = c.pk_abilita_vento ? _azIsOn(h, c.pk_abilita_vento) : false;
    var soglia       = Math.round(_azNum(_azS(h, c.pk_soglia_pioggia)) || 50);
    var sogliaVento  = Math.round(_azNum(_azS(h, c.pk_soglia_vento)) || 0);
    var tarMens      = Math.round(_azNum(_azS(h, c.pk_cicli_target)) || 100);
    var cicliMAttuali = Math.round(_azNum(_azS(h, c.pk_cicli_mensili)) || 0);
    var inizioNtf    = (_azS(h, c.pk_inizio_ntf) || '00:00:00').slice(0, 5);
    var fineNtf      = (_azS(h, c.pk_fine_ntf) || '23:59:00').slice(0, 5);
    var dayIds  = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'];
    var dayLbls = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];

    function sec(ico, t, col) {
      var c2 = col || '34,197,94';
      return '<div style="display:flex;align-items:center;gap:8px;padding:12px 0 8px;border-bottom:1px solid rgba(' + c2 + ',.2);margin-bottom:2px">'
        + '<div style="font-size:15px">' + ico + '</div>'
        + '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:rgb(' + c2 + ')">' + t + '</div>'
        + '</div>';
    }

    function numRow(id, ico, label, val, unit, min, max, step) {
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
        + '<div style="font-size:16px;width:24px;text-align:center;flex-shrink:0">' + ico + '</div>'
        + '<span style="font-size:12px;color:#fff;flex:1">' + label + '</span>'
        + '<input id="azuc-' + id + '" type="number" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"'
        + ' style="width:72px;padding:6px 8px;border-radius:8px;background:#0d1a2b;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:13px;font-weight:700;outline:none;text-align:right">'
        + '<span style="font-size:10px;color:rgba(255,255,255,.4);width:28px;flex-shrink:0">' + unit + '</span>'
        + '</div>';
    }

    function togRow(id, ico, label, desc, isOn, col) {
      var c2 = col || '34,197,94';
      return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
        + '<div style="font-size:19px;width:26px;text-align:center;flex-shrink:0">' + ico + '</div>'
        + '<div style="flex:1;min-width:0">'
        + '<div style="font-size:12px;font-weight:700;color:#fff">' + label + '</div>'
        + '<div style="font-size:10px;color:rgba(255,255,255,.38);margin-top:2px;line-height:1.3">' + desc + '</div>'
        + '</div>'
        + '<div id="' + id + '" data-on="' + (isOn?'1':'0') + '"'
        + ' style="width:46px;height:26px;border-radius:13px;flex-shrink:0;cursor:pointer;'
        + 'background:' + (isOn?'rgb('+c2+')':'rgba(255,255,255,.14)') + ';position:relative;transition:background .25s">'
        + '<div style="position:absolute;top:3px;' + (isOn?'right:3px':'left:3px') + ';width:20px;height:20px;border-radius:50%;background:#fff;transition:all .25s;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>'
        + '</div>'
        + '</div>';
    }

    // Schedule section
    var schedHtml = dayIds.map(function(d, i) {
      var isOn = _azIsOn(h, 'input_boolean.' + prefix + '_' + d);
      var nc = Math.round(_azNum(_azS(h, 'input_number.' + prefix + '_' + d + '_num_cicli')) || 0);
      var times = [], durs = [];
      for (var ci = 1; ci <= 5; ci++) {
        times.push((_azS(h, 'input_datetime.' + prefix + '_' + d + '_orario_ciclo' + ci) || '07:00:00').slice(0,5));
        durs.push(Math.round(_azNum(_azS(h, 'input_number.' + prefix + '_' + d + '_durata_ciclo' + ci)) || 60));
      }
      var timeInputs = '', durInputs = '';
      for (var ti2 = 0; ti2 < 5; ti2++) {
        var active = ti2 < nc;
        var slotStyle = 'flex:1;min-width:0;padding:4px 3px;border-radius:6px;background:#0d1a2b;color:' + (active?'#f1f5f9':'rgba(255,255,255,.18)') + ';border:1px solid rgba(255,255,255,' + (active?'.14':'.05') + ');font-size:10px;outline:none';
        timeInputs += '<input type="time" id="azs-t-' + d + '-' + (ti2+1) + '" value="' + times[ti2] + '" style="' + slotStyle + '"' + (active ? '' : ' disabled') + '>';
        durInputs  += '<input type="number" id="azs-dur-' + d + '-' + (ti2+1) + '" value="' + durs[ti2] + '" min="10" max="7200" step="10" style="' + slotStyle + ';text-align:center"' + (active ? '' : ' disabled') + '>';
      }
      return '<div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:11px;padding:9px 11px;margin-bottom:6px">'
        + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">'
        + '<div id="azs-tog-' + d + '" data-on="' + (isOn?'1':'0') + '" data-day="' + d + '"'
        + ' style="width:36px;height:20px;border-radius:10px;flex-shrink:0;cursor:pointer;background:' + (isOn?'#22c55e':'rgba(255,255,255,.14)') + ';position:relative;transition:background .2s">'
        + '<div style="position:absolute;top:2px;' + (isOn?'right:2px':'left:2px') + ';width:16px;height:16px;border-radius:50%;background:#fff;transition:all .2s;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>'
        + '</div>'
        + '<span style="font-size:12px;font-weight:700;color:#fff;flex:1">' + dayLbls[i] + '</span>'
        + '<div style="display:flex;align-items:center;gap:4px">'
        + '<button id="azs-ncm-' + d + '" style="width:24px;height:24px;border-radius:7px;border:none;background:rgba(255,255,255,.08);color:#fff;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;line-height:1">−</button>'
        + '<span id="azs-ncv-' + d + '" style="font-size:15px;font-weight:800;color:#22c55e;min-width:20px;text-align:center">' + nc + '</span>'
        + '<input type="hidden" id="azs-nc-' + d + '" value="' + nc + '">'
        + '<button id="azs-ncp-' + d + '" style="width:24px;height:24px;border-radius:7px;border:none;background:rgba(255,255,255,.08);color:#fff;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;line-height:1">+</button>'
        + '<span style="font-size:10px;color:rgba(255,255,255,.3);margin-left:2px">cicli</span>'
        + '</div></div>'
        + '<div id="azs-times-' + d + '" style="display:' + (nc===0?'none':'block') + '">'
        + '<div style="font-size:9px;color:rgba(255,255,255,.3);margin-bottom:2px">⏰ Orari</div>'
        + '<div style="display:flex;gap:4px">' + timeInputs + '</div>'
        + '<div style="font-size:9px;color:rgba(255,255,255,.3);margin:5px 0 2px">⏱ Durate (sec)</div>'
        + '<div style="display:flex;gap:4px">' + durInputs + '</div>'
        + '</div>'
        + '</div>';
    }).join('');

    var content = sec('⚡', 'Automazione & Sicurezza')
      + togRow('azuc-tog-auto', '🔄', 'Automazione schedulata', 'Avvia i cicli automaticamente agli orari impostati', autoOn, '34,197,94')
      + togRow('azuc-tog-pres', '👤', 'Blocco presenza', 'Spegne subito la presa se rileva una persona, impedisce nuovi cicli (anche manuali) finché c\'è qualcuno nell\'area, e riaccende il ciclo interrotto quando l\'area si libera', presenzaOn, '245,158,11')
      + sec('🔔', 'Notifiche', '168,85,247')
      + togRow('azuc-tog-npush', '📱', 'Notifiche Push', 'Avvisi sullo smartphone (mobile_app configurate nel wizard)', notifyPushOn, '168,85,247')
      + togRow('azuc-tog-nalexa', '🔊', 'Annunci Alexa', 'Annunci vocali tramite dispositivi Alexa configurati', notifyAlexaOn, '251,146,60')
      + '<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
      + '<div style="flex:1">'
      + '<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:rgba(255,255,255,.38);margin-bottom:4px">Dalle</div>'
      + '<input id="azuc-ntf-start" type="time" value="' + inizioNtf + '" style="width:100%;padding:8px 10px;border-radius:9px;background:#0d1a2b;color:#f1f5f9;border:1px solid rgba(255,255,255,.14);font-size:13px;box-sizing:border-box;outline:none">'
      + '</div>'
      + '<div style="flex:1">'
      + '<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:rgba(255,255,255,.38);margin-bottom:4px">Alle</div>'
      + '<input id="azuc-ntf-end" type="time" value="' + fineNtf + '" style="width:100%;padding:8px 10px;border-radius:9px;background:#0d1a2b;color:#f1f5f9;border:1px solid rgba(255,255,255,.14);font-size:13px;box-sizing:border-box;outline:none">'
      + '</div></div>'
      + sec('📅', 'Programma Settimanale')
      + schedHtml
      + sec('⚙', 'Soglie & Durate')
      + numRow('sog', '🌧', 'Soglia blocco pioggia', soglia, '%', 0, 100, 5)
      + togRow('azuc-tog-pioggia', '🌧', 'Blocco per pioggia attivo', 'Blocca i cicli quando la probabilità di pioggia supera la soglia', abilitaPioggiaOn, '6,182,212')
      + numRow('ven', '💨', 'Soglia blocco vento', sogliaVento, 'km/h', 0, 200, 5)
      + togRow('azuc-tog-vento', '💨', 'Blocco per vento attivo', 'Blocca i cicli quando il vento supera la soglia', abilitaVentoOn, '6,182,212')
      + numRow('tar', '🎯', 'Target cicli mensili', tarMens, 'cicli', 1, 999, 1)
      + '<button id="azuc-reset-cicli" data-armed="0" style="width:100%;padding:9px;border-radius:10px;border:1px solid rgba(239,68,68,.3);background:rgba(239,68,68,.08);color:#ef4444;font-weight:700;font-size:12px;cursor:pointer;margin:2px 0 10px">🔄 Reset cicli mensili (' + cicliMAttuali + ' fatti)</button>'
      + '<button id="azuc-save" style="width:100%;padding:13px;border-radius:12px;border:none;cursor:pointer;font-weight:800;font-size:14px;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);color:#fff;margin-top:10px;box-shadow:0 4px 16px rgba(34,197,94,.28)">💾 Salva tutto</button>';

    var ov = _azMkOv(_azPopShell('⚙','34,197,94','Impostazioni',c.name||'Anti Zanzare','azuc-cl',content),'azuc-cl');

    // Toggle iOS-style handler
    var togCols = {'azuc-tog-auto':'34,197,94','azuc-tog-pres':'245,158,11','azuc-tog-npush':'168,85,247','azuc-tog-nalexa':'251,146,60','azuc-tog-pioggia':'6,182,212','azuc-tog-vento':'6,182,212'};
    Object.keys(togCols).forEach(function(tid) {
      var tb = ov.querySelector('#' + tid); if (!tb) return;
      tb.addEventListener('click', function() {
        var wasOn = tb.dataset.on === '1', nowOn = !wasOn;
        tb.dataset.on = nowOn ? '1' : '0';
        tb.style.background = nowOn ? 'rgb(' + togCols[tid] + ')' : 'rgba(255,255,255,.14)';
        var knob = tb.querySelector('div'); if (knob) { knob.style.right = nowOn ? '3px' : ''; knob.style.left = nowOn ? '' : '3px'; }
      });
    });

    // Reset cicli mensili (richiede doppio click di conferma)
    var resetBtn = ov.querySelector('#azuc-reset-cicli');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        if (resetBtn.dataset.armed !== '1') {
          resetBtn.dataset.armed = '1';
          resetBtn.textContent = '⚠️ Sicuro? Clicca di nuovo per confermare';
          clearTimeout(resetBtn._azResetTimer);
          resetBtn._azResetTimer = setTimeout(function() {
            resetBtn.dataset.armed = '0';
            resetBtn.textContent = '🔄 Reset cicli mensili (' + cicliMAttuali + ' fatti)';
          }, 3000);
          return;
        }
        clearTimeout(resetBtn._azResetTimer);
        var tgt = Math.round(_azNum((ov.querySelector('#azuc-tar') || {}).value) || tarMens);
        if (c.pk_cicli_mensili) _azCallSvc('counter', 'reset', { entity_id: c.pk_cicli_mensili });
        _azCallSvc('counter', 'set_value', { entity_id: 'counter.' + prefix + '_cicli_rimanenti', value: tgt });
        resetBtn.dataset.armed = '0';
        resetBtn.textContent = '✅ Cicli azzerati';
        if (el) el._fcSig = null;
      });
    }

    // Schedule toggles
    ov.querySelectorAll('[id^="azs-tog-"]').forEach(function(tog) {
      tog.addEventListener('click', function() {
        var wasOn = tog.dataset.on === '1'; tog.dataset.on = wasOn ? '0' : '1';
        tog.style.background = wasOn ? 'rgba(255,255,255,.14)' : '#22c55e';
        var k = tog.querySelector('div'); if(k){ k.style.right=wasOn?'':' 2px'; k.style.left=wasOn?'2px':''; }
      });
    });

    // Schedule +/- cicli
    dayIds.forEach(function(d) {
      var ncH = ov.querySelector('#azs-nc-' + d), ncV = ov.querySelector('#azs-ncv-' + d);
      var timesDiv = ov.querySelector('#azs-times-' + d);
      function updateTimes(nc) {
        if (!timesDiv) return;
        timesDiv.style.display = nc === 0 ? 'none' : 'block';
        for (var i2 = 1; i2 <= 5; i2++) {
          var act = i2 <= nc;
          var ti3 = ov.querySelector('#azs-t-' + d + '-' + i2);
          if (ti3) { ti3.disabled = !act; ti3.style.color = act?'#f1f5f9':'rgba(255,255,255,.18)'; ti3.style.borderColor='rgba(255,255,255,'+(act?'.14':'.05')+')'; }
          var di3 = ov.querySelector('#azs-dur-' + d + '-' + i2);
          if (di3) { di3.disabled = !act; di3.style.color = act?'#f1f5f9':'rgba(255,255,255,.18)'; di3.style.borderColor='rgba(255,255,255,'+(act?'.14':'.05')+')'; }
        }
      }
      var ncmBtn = ov.querySelector('#azs-ncm-' + d), ncpBtn = ov.querySelector('#azs-ncp-' + d);
      if (ncmBtn) ncmBtn.addEventListener('click', function() { var v=Math.max(0,parseInt(ncH.value)-1); ncH.value=v; if(ncV) ncV.textContent=v; updateTimes(v); });
      if (ncpBtn) ncpBtn.addEventListener('click', function() { var v=Math.min(5,parseInt(ncH.value)+1); ncH.value=v; if(ncV) ncV.textContent=v; updateTimes(v); });
    });

    // Save
    ov.querySelector('#azuc-save').addEventListener('click', function() {
      var h2 = _azH();
      var sv = (ov.querySelector('#azuc-sog')||{}).value;
      var vv = (ov.querySelector('#azuc-ven')||{}).value;
      var tv = (ov.querySelector('#azuc-tar')||{}).value;
      if (sv && c.pk_soglia_pioggia) _azCallSvc('input_number','set_value',{entity_id:c.pk_soglia_pioggia,value:parseFloat(sv)});
      if (vv && c.pk_soglia_vento)   _azCallSvc('input_number','set_value',{entity_id:c.pk_soglia_vento,value:parseFloat(vv)});
      if (tv && c.pk_cicli_target)   _azCallSvc('input_number','set_value',{entity_id:c.pk_cicli_target,value:parseFloat(tv)});
      var ntfS = (ov.querySelector('#azuc-ntf-start')||{}).value;
      var ntfE = (ov.querySelector('#azuc-ntf-end')||{}).value;
      if (ntfS && c.pk_inizio_ntf) _azCallSvc('input_datetime','set_datetime',{entity_id:c.pk_inizio_ntf,time:ntfS+':00'});
      if (ntfE && c.pk_fine_ntf)   _azCallSvc('input_datetime','set_datetime',{entity_id:c.pk_fine_ntf,time:ntfE+':00'});
      dayIds.forEach(function(d) {
        var togEl = ov.querySelector('#azs-tog-' + d), ncEl = ov.querySelector('#azs-nc-' + d);
        var isOn = togEl ? togEl.dataset.on === '1' : false;
        var nc = parseInt(ncEl ? ncEl.value : 0) || 0;
        if (h2 && h2.callService) {
          h2.callService('input_boolean', isOn?'turn_on':'turn_off', {entity_id:'input_boolean.'+prefix+'_'+d});
          h2.callService('input_number','set_value',{entity_id:'input_number.'+prefix+'_'+d+'_num_cicli',value:nc});
          for (var ci2 = 1; ci2 <= 5; ci2++) {
            var tEl = ov.querySelector('#azs-t-' + d + '-' + ci2);
            if (tEl && tEl.value) h2.callService('input_datetime','set_datetime',{entity_id:'input_datetime.'+prefix+'_'+d+'_orario_ciclo'+ci2,time:tEl.value+':00'});
            var dEl = ov.querySelector('#azs-dur-' + d + '-' + ci2);
            if (dEl && !dEl.disabled && dEl.value) h2.callService('input_number','set_value',{entity_id:'input_number.'+prefix+'_'+d+'_durata_ciclo'+ci2,value:parseFloat(dEl.value)});
          }
        }
      });
      var autoBtn = ov.querySelector('#azuc-tog-auto');
      if (autoBtn && c.pk_auto) _azCallSvc('input_boolean', autoBtn.dataset.on==='1'?'turn_on':'turn_off', {entity_id:c.pk_auto});
      var presBtn = ov.querySelector('#azuc-tog-pres');
      if (presBtn && c.pk_presenza_attiva) _azCallSvc('input_boolean', presBtn.dataset.on==='1'?'turn_on':'turn_off', {entity_id:c.pk_presenza_attiva});
      var npushBtn = ov.querySelector('#azuc-tog-npush');
      if (npushBtn && c.pk_notify_push) _azCallSvc('input_boolean', npushBtn.dataset.on==='1'?'turn_on':'turn_off', {entity_id:c.pk_notify_push});
      var nalexaBtn = ov.querySelector('#azuc-tog-nalexa');
      if (nalexaBtn && c.pk_notify_alexa) _azCallSvc('input_boolean', nalexaBtn.dataset.on==='1'?'turn_on':'turn_off', {entity_id:c.pk_notify_alexa});
      var pioggiaTogBtn = ov.querySelector('#azuc-tog-pioggia');
      if (pioggiaTogBtn && c.pk_abilita_pioggia) _azCallSvc('input_boolean', pioggiaTogBtn.dataset.on==='1'?'turn_on':'turn_off', {entity_id:c.pk_abilita_pioggia});
      var ventoTogBtn = ov.querySelector('#azuc-tog-vento');
      if (ventoTogBtn && c.pk_abilita_vento) _azCallSvc('input_boolean', ventoTogBtn.dataset.on==='1'?'turn_on':'turn_off', {entity_id:c.pk_abilita_vento});
      ov._close();
      if (el) el._fcSig = null;
    });
  }

  function _azOpenEntCfg(card, el) { _azOpenUserCfg(card, el); }

  function _azCallSvc(domain, svc, data) {
    try { var h = _azH(); if (h && h.callService) { h.callService(domain, svc, data); return; } if (window.callSvc) window.callSvc(domain, svc, data); } catch(e) {}
  }

  function _azComputeSig(h, c) {
    var px = c.pk_prefix||'anti_zanzare';
    var dk = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'];
    var dsg = dk.map(function(d){return _azIsOn(h,'input_boolean.'+px+'_'+d)?'1':'0';}).join('');
    var ncsg = dk.map(function(d){return Math.round(_azNum(_azS(h,'input_number.'+px+'_'+d+'_num_cicli'))||0);}).join('');
    var tc = _azS(h,c.pk_timer_ciclo), tm = _azS(h,c.pk_timer_manuale);
    var presaId = c.pk_presa_entity ? _azS(h,c.pk_presa_entity) : null;
    // "Prossimo ciclo" dipende dall'ora corrente: forza un refresh ogni minuto
    // quando nessun timer è attivo, altrimenti resterebbe fermo finché non
    // cambia qualche altra entità (serve altrimenti un refresh manuale pagina).
    var minuteTick = (tc !== 'active' && tm !== 'active') ? (function(){var n=new Date();return n.getHours()+':'+n.getMinutes();})() : '';
    return ['2.6az',_azS(h,c.pk_stato),_azS(h,c.pk_auto),_azS(h,c.pk_manuale),tc,tm,
            _azS(h,c.pk_cicli_mensili),_azS(h,c.pk_cicli_target),
            _azS(h,c.pk_blocco_meteo),_azS(h,c.pk_pioggia),_azS(h,c.pk_pioggia_corso),
            _azS(h,c.pk_durata_manuale),_azS(h,c.pk_soglia_pioggia),_azS(h,c.pk_soglia_vento),
            _azS(h,c.pk_persona),_azS(h,c.pk_perdita),_azS(h,c.pk_prossimo),
            _azS(h,c.pk_cicli_rim),_azS(h,c.pk_consumo_acqua),
            _azS(h,c.pk_vento),_azS(h,c.pk_tanica),
            c.pk_consumo_pompa?_azS(h,c.pk_consumo_pompa):'',
            _azS(h,c.pk_presenza_attiva),
            presaId?_azS(h,presaId):'',
            c.pk_abilita_pioggia?_azS(h,c.pk_abilita_pioggia):'',
            c.pk_abilita_vento?_azS(h,c.pk_abilita_vento):'',
            dsg,ncsg,minuteTick].join('|');
  }

  function _azMount(card, hass, el) {
    if (el._fcBound === '2.6az') return;
    el._fcBound = '2.6az';
    // Rimuove la matita se renderizzata prima del caricamento del registry
    var _azPencil = el.querySelector('.ovb-edit');
    if (_azPencil) _azPencil.remove();
    var rid = 'fraz' + (card.id || 'az');
    if (el._fcHandler) el.removeEventListener('click', el._fcHandler);
    el._fcHandler = function(e) {
      var t = e.target.closest('[data-sya]'); if (!t) return;
      var a = t.dataset.sya, c = _azCfgFor(card);
      if (a === 'man-on')    _azCallSvc('input_button','press',{entity_id:c.pk_btn_man_on});
      if (a === 'man-off')   _azCallSvc('input_button','press',{entity_id:c.pk_btn_man_off});
      if (a === 'auto-on')   _azCallSvc('input_button','press',{entity_id:c.pk_btn_auto_on});
      if (a === 'auto-off')  _azCallSvc('input_button','press',{entity_id:c.pk_btn_auto_off});
      if (a === 'programma') _azOpenProgramma(card, el);
      if (a === 'popup-cfg') _azOpenUserCfg(card, el);
      if (a === 'durman-plus' && c.pk_durata_manuale) {
        var dpH = _azH(), dpCur = Math.round(_azNum(_azS(dpH, c.pk_durata_manuale)) || 60);
        _azCallSvc('input_number','set_value',{entity_id:c.pk_durata_manuale,value:Math.min(7200,dpCur+10)}); if(el) el._fcSig=null;
      }
      if (a === 'durman-minus' && c.pk_durata_manuale) {
        var dmH = _azH(), dmCur = Math.round(_azNum(_azS(dmH, c.pk_durata_manuale)) || 60);
        _azCallSvc('input_number','set_value',{entity_id:c.pk_durata_manuale,value:Math.max(10,dmCur-10)}); if(el) el._fcSig=null;
      }
      if (a.length > 4 && a.slice(0,4) === 'ncp-') {
        var _azNcpPx = (_azCfgFor(card).pk_prefix||'anti_zanzare'), _azNcpH = _azH(), _azNcpD = a.slice(4);
        var _azNcpId = 'input_number.' + _azNcpPx + '_' + _azNcpD + '_num_cicli';
        var _azNcpCur = Math.round(_azNum(_azS(_azNcpH, _azNcpId)) || 0);
        _azCallSvc('input_number','set_value',{entity_id:_azNcpId,value:Math.min(5,_azNcpCur+1)});
        if (!_azIsOn(_azNcpH, 'input_boolean.' + _azNcpPx + '_' + _azNcpD))
          _azCallSvc('input_boolean','turn_on',{entity_id:'input_boolean.' + _azNcpPx + '_' + _azNcpD});
      }
      if (a.length > 4 && a.slice(0,4) === 'ncm-') {
        var _azNcmPx = (_azCfgFor(card).pk_prefix||'anti_zanzare'), _azNcmH = _azH(), _azNcmD = a.slice(4);
        var _azNcmId = 'input_number.' + _azNcmPx + '_' + _azNcmD + '_num_cicli';
        var _azNcmCur = Math.round(_azNum(_azS(_azNcmH, _azNcmId)) || 0);
        var _azNcmNv = Math.max(0, _azNcmCur - 1);
        _azCallSvc('input_number','set_value',{entity_id:_azNcmId,value:_azNcmNv});
        if (_azNcmNv === 0) _azCallSvc('input_boolean','turn_off',{entity_id:'input_boolean.' + _azNcmPx + '_' + _azNcmD});
      }
      if (a.length > 4 && a.slice(0,4) === 'day-') _azOpenDayDetail(card, a.slice(4), _azCfgFor(card).pk_prefix||'anti_zanzare', el);
    };
    el.addEventListener('click', el._fcHandler);
    // Live polling — aggiorna la card ogni 2s solo se lo stato HA è cambiato
    clearInterval(el._azPoll);
    el._azPoll = setInterval(function() {
      try {
        if (!el._fcBound) { clearInterval(el._azPoll); return; }
        var h = _azH(), c2 = _azCfgFor(card);
        var sig = _azComputeSig(h, c2);
        if (el._fcSig !== sig) { el._fcSig = sig; el.innerHTML = _azRender(card); }
      } catch(e) {}
    }, 2000);
    // Timer tick — aggiorna barra e conto alla rovescia ogni 200ms senza re-render
    clearInterval(el._azTimerTick);
    el._azTimerTick = setInterval(function() {
      try {
        if (!el._fcBound) { clearInterval(el._azTimerTick); return; }
        var h2 = _azH(), c2 = _azCfgFor(card);
        var tc2 = _azS(h2, c2.pk_timer_ciclo), tm2 = _azS(h2, c2.pk_timer_manuale);
        var tKey = tc2 === 'active' ? c2.pk_timer_ciclo : (tm2 === 'active' ? c2.pk_timer_manuale : null);
        if (!tKey) return;
        var fmt = _azFmtTimer(h2, tKey);
        var tb = el.querySelector('#' + rid + '-tb');
        var tt = el.querySelector('#' + rid + '-tt');
        var tt2 = el.querySelector('#' + rid + '-tt2');
        if (tb) tb.style.width = fmt.pct.toFixed(2) + '%';
        if (tt) tt.textContent = fmt.rem;
        if (tt2) tt2.textContent = fmt.rem;
      } catch(e) {}
    }, 200);
  }

  function _azUpdate(card, hass, el) {
    var h = _azH(), c = _azCfgFor(card);
    var sig = _azComputeSig(h, c);
    if (!el.querySelector('.fc-card') || el._fcSig !== sig) { el._fcSig = sig; el.innerHTML = _azRender(card); }
    _azMount(card, hass, el);
  }

  var _AZ_CARD = {
    id: 'antizanzare', name: 'Anti Zanzare', icon: '🦟', version: '2.29', frarik_no_edit: true,
    desc: 'Controllo sistema anti zanzare: schedule settimanale, timer, statistiche mensili, blocco meteo, sensori sicurezza.',
    render:    function(card) { return _azRender(card); },
    mount:     function(card, hass, el) { _azMount(card, hass, el); },
    update:    function(card, hass, el) { _azUpdate(card, hass, el); },
    configure: null,
    frarik_pkg_check:   'sensor.frarik_antizanzare_stato_sistema',
    frarik_pkg_id:      'frarik_antizanzare',
    frarik_pkg_version: '2.0',
    openWizard: _openWizardAZ,
    _buildPkgFromConfig: function(cfg, _tpl) { return _buildPkgAZ(cfg.sw || '', cfg.push || [], cfg.pioggia || '', _tpl, cfg.vento || '', cfg.tanica || '', cfg.presenza || '', cfg.perdita || '', cfg.pompa || '', cfg.probPioggia || ''); },
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[_AZ_CARD.id] = _AZ_CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[_AZ_CARD.id] = _AZ_CARD;
  try { console.log('[FratechStore] Card registrata: antizanzare v' + _AZ_CARD.version); } catch(e) {}
})();
