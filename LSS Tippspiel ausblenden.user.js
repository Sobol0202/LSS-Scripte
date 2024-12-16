// ==UserScript==
// @name         LSS Tippspiel ausblenden
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Blendet den Europameisterschaft-Tippspiel-Knopf aus.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Das Element anhand des Links und des Bildes auswählen
    const euro2024Link = document.querySelector('a[href="/wm_tipps"].lightbox-open img[src="/images/icons8-football.svg"]');

    // Wenn das Element gefunden wird, das übergeordnete <li> Element ausblenden
    if (euro2024Link) {
        euro2024Link.closest('li').style.display = 'none';
    }
})();
