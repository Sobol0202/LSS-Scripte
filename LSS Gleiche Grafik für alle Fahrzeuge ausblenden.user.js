// ==UserScript==
// @name         LSS Gleiche Grafik für alle Fahrzeuge ausblenden
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Blendet die Checkbox um Grafik für alle Fahrzeuge dieses Typs zu setzen aus
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/vehicles/*/edit
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Suche nach dem Element, das ausgeblendet werden soll
    var elementToHide = document.querySelector('input[name="vehicle[image_to_all]"]');

    // Überprüfe, ob das Element existiert
    if (elementToHide) {
        // Verstecke das Element, indem die Anzeige-Eigenschaft auf "none" gesetzt wird
        elementToHide.closest('.checkbox').style.display = 'none';
    }
})();
