/* Frarik — pannello sidebar di Home Assistant che incorpora la plancia (/local/frarik.html).
   Stessa tecnica usata da Oikos (panel_custom). La pagina dentro l'iframe si connette da sola
   alla stessa origine → funziona sia in locale sia da remoto (Nabu Casa). */
class FrarikPanel extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;
    this.style.cssText = 'display:block;width:100%;height:100%;min-height:100vh;overflow:hidden;background:#060810';
    const f = document.createElement('iframe');
    // versione fissa: la pagina va in cache (apertura veloce); cambio questo numero quando aggiorno frarik.html
    var FRARIK_VER = '20260603-960';
    f.src = '/local/frarik.html?v=' + FRARIK_VER;
    f.setAttribute('allow', 'fullscreen; clipboard-write; geolocation; camera; microphone; autoplay');
    f.setAttribute('allowfullscreen', 'true');
    f.style.cssText = 'border:0;width:100%;height:100%;min-height:100vh;display:block';
    this.appendChild(f);
  }
  // HA imposta queste proprietà sul pannello; non servono ma le assorbiamo per evitare errori.
  set hass(_) {}
  set narrow(_) {}
  set route(_) {}
  set panel(_) {}
}
if (!customElements.get('frarik-panel')) customElements.define('frarik-panel', FrarikPanel);
