// ==UserScript==
// @name         Leitstellenspiel POI Zähler
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Fügt einen Hyperlink im Footer hinzu, um POIs zu zählen und sie in einer Tabelle anzuzeigen.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Zählen der POIs und Anzeigen in einer Tabelle
    function countAndDisplayPOIs() {
        // Zählt die POIs und speichert sie in einem Objekt
        const poiCounts = map_pois_service.getMissionPoiMarkersArray().map(poi => poi.getTooltip().getContent()).reduce((a, b) => (a[b] = (a[b] ?? 0) + 1, a), {});

        // Erstellt eine Tabelle für die Anzeige der POIs
        const poiTable = document.createElement('table');
        const headerRow = poiTable.insertRow();
        const headerCell1 = headerRow.insertCell();
        const headerCell2 = headerRow.insertCell();
        headerCell1.textContent = 'POI Typ';
        headerCell2.textContent = 'Anzahl';

        // Füllt die Tabelle mit den gezählten POIs
        for (const poiType in poiCounts) {
            const row = poiTable.insertRow();
            const cell1 = row.insertCell();
            const cell2 = row.insertCell();
            cell1.textContent = poiType;
            cell2.textContent = poiCounts[poiType];
        }

        // Öffnet ein neues Fenster und fügt die Tabelle hinzu
        const newWindow = window.open();
        newWindow.document.body.appendChild(poiTable);
    }

    // Funktion zum Erstellen des Hyperlinks im Footer
    function createLink() {
        // Erstelle ein neues Element für den "Zähle POIs" Link
        var poiCounterLink = document.createElement('a');
        poiCounterLink.href = '#'; // Setze die URL oder den Klick-Handler für den POI-Zähler hier ein
        poiCounterLink.innerText = 'Zähle POIs';

        // Erstelle ein neues Element für den Trennpunkt
        var separator = document.createElement('span');
        separator.innerText = ' · ';

        // Finde das Element für "Impressum" im Footer
    var impressumLink = document.querySelector('.footer.hidden-xs a[href="/impressum"]');

        // Füge den "Zähle POIs" Link vor dem "Grafiksets" Link ein
    if (impressumLink && impressumLink.parentNode) {
        impressumLink.parentNode.insertBefore(poiCounterLink, impressumLink);
        impressumLink.parentNode.insertBefore(separator, impressumLink);
        }

        // Füge einen Klick-Handler zum Zählen und Anzeigen der POIs hinzu
        poiCounterLink.addEventListener('click', countAndDisplayPOIs);
    }

    // Ruft die Funktion zum Erstellen des Hyperlinks im Footer auf
    createLink();
})();
