// ==UserScript==
// @name         LSS Zug-Löschen Button nach oben
// @version      1.0
// @description  Verschiebe den Zug-Löschen Button nach oben rechts
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/vehicle_groups/*/edit
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Wähle den Löschen-Button anhand seiner Klasse und Datenattribute aus
    var deleteButton = document.querySelector('a.btn.btn-danger.pull-right[data-method="delete"]');

    if (deleteButton) {
        // Erstelle einen Container für den Button
        var container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '10px';
        container.style.right = '10px';
        container.style.zIndex = '1000';

        // Füge den Button dem Container hinzu
        container.appendChild(deleteButton);

        // Füge den Container dem body der Seite hinzu
        document.body.appendChild(container);
    }
})();
