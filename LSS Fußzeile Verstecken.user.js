// ==UserScript==
// @name         LSS Fußzeile Verstecken
// @version      1.0
// @description  Blendet den Footer aus.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

        // Den Footer anhand der Klasse suchen
        const footer = document.querySelector('.footer.hidden-xs');
        if (footer) {
            // Footer ausblenden
            footer.style.display = 'none';
        }
})();
