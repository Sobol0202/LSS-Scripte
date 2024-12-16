// ==UserScript==
// @name         LSS-Fahrzeug Verschieben im Gebäude
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0
// @description  Fügt einen Button zum Verschieben von Fahrzeugen im Gebäudemenü hinzu
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Finde alle Zeilen in der Tabelle mit der ID "vehicle_table"
    const rows = document.querySelectorAll('#vehicle_table tbody tr');

    // Iteriere über jede Zeile
    rows.forEach(row => {
        // Finde den Bearbeiten-Button in der Zeile
        const editButton = row.querySelector('a[href^="/vehicles/"][href$="/edit"]');

        if (editButton) {
            // Extrahiere die Fahrzeug-ID aus dem href-Attribut
            const vehicleID = editButton.getAttribute('href').match(/\/vehicles\/(\d+)\/edit/)[1];

            // Erstelle den Verschieben-Button
            const moveButton = document.createElement('a');
            moveButton.setAttribute('class', 'btn btn-default btn-xs');
            moveButton.innerHTML = '<span title="Verschieben" class="glyphicon glyphicon-move"></span>';
            moveButton.href = `/vehicles/${vehicleID}/move`;

            // Füge den Verschieben-Button neben den Bearbeiten-Button ein
            editButton.parentNode.insertBefore(moveButton, editButton.nextSibling);
        }
    });
})();
