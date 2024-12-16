// ==UserScript==
// @name         LSS AAO-Editor Alphabetisch Sortieren
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Sortiert die Felder im AAO-Editor nach dem Alphabet
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/aaos/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Sortieren der Elemente innerhalb eines Tab-Panels
    function sortTabPanel(panel) {
        // Alle form-group-Elemente innerhalb des Tab-Panels abrufen
        const formGroups = Array.from(panel.getElementsByClassName('form-group'));

        // Form-Gruppen basierend auf dem Textinhalt ihres Labels sortieren
        formGroups.sort((a, b) => {
            const labelA = a.querySelector('label').textContent.trim();
            const labelB = b.querySelector('label').textContent.trim();
            return labelA.localeCompare(labelB, 'de');
        });

        // Die sortierten Elemente wieder zurück in das Panel einfügen
        formGroups.forEach(group => panel.appendChild(group));
    }

    // Funktion zum Sortieren aller Tab-Panels
    function sortAllTabPanels() {
        // Alle Tab-Panels auf der Seite abrufen
        const tabPanels = document.querySelectorAll('div[role="tabpanel"]');

        // Jedes Tab-Panel sortieren
        tabPanels.forEach(sortTabPanel);
    }

    // Sortierfunktion sofort ausführen
    sortAllTabPanels();
})();
