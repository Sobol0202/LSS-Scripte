// ==UserScript==
// @name         LSS Verbandsgebäude ausblenden
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Blendet Verbandskrankenhäuser im Sprechwunsch und Verbandszellen im Einsatz aus
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/missions/*
// @match        https://www.leitstellenspiel.de/vehicles/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Ausblenden der Buttons
    function hideAbgabeButtons() {
        // Finde alle Buttons, die den Text "Abgabe an Besitzer" enthalten
        var buttons = document.querySelectorAll('a.btn.btn');

        for (var i = 0; i < buttons.length; i++) {
            var button = buttons[i];
            if (button.textContent.includes('Abgabe an Besitzer')) {
                // Wenn der Text "Abgabe an Besitzer" enthalten ist, entferne den Button
                button.remove();
            }
        }
    }

    // Wenn die aktuelle Seite die Missionsseite ist
    if (window.location.href.includes("https://www.leitstellenspiel.de/missions/")) {
        hideAbgabeButtons();
    }

    // Wenn die aktuelle Seite die Vehicles-Seite ist
    if (window.location.href.includes("https://www.leitstellenspiel.de/vehicles/")) {
        hideAbgabeButtons(); // Buttons auf der Vehicles-Seite ausblenden

        // Finde das Element mit der table id "alliance-hospitals" und blende es aus
        var hospitalsTable = document.getElementById('alliance-hospitals');
        if (hospitalsTable) {
            hospitalsTable.style.display = 'none';
        }
    }
})();
