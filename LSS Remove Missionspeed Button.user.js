// ==UserScript==
// @name         Leitstellenspiel Element ausblenden
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0
// @description  Ausblenden des Elements mit der ID "mission_speed_play" auf Leitstellenspiel.de
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Element mit der ID "mission_speed_play" auswählen
    var elementToHide = document.getElementById("mission_speed_play");

    // Überprüfen, ob das Element existiert
    if (elementToHide) {
        // Element ausblenden, indem der CSS-Stil geändert wird (display: none)
        elementToHide.style.display = "none";
    }
})();
