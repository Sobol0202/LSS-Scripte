// ==UserScript==
// @name         LSS BR-Timer Umrechner
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Umrechnung des Timers im Bereitstellungsraum
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

// Funktion zur Umrechnung der Tage in Jahre, Monate, Wochen, Stunden, Minuten und Sekunden
function umrechnenTimer(timerElement) {
    // Extrahiere den Timer-Text
    const timerText = timerElement.innerText.trim();

    // Extrahiere die Tage, Stunden, Minuten und Sekunden aus dem Timer-Text
    const regex = /(\d+) Tage - (\d+):(\d+):(\d+)/;
    const match = timerText.match(regex);

    if (match) {
        const tage = parseInt(match[1]);
        const stunden = parseInt(match[2]);
        const minuten = parseInt(match[3]);
        const sekunden = parseInt(match[4]);

        // Umrechnung in Jahre, Monate, Wochen, Stunden, Minuten und Sekunden
        const jahre = Math.floor(tage / 365);
        const monate = Math.floor((tage % 365) / 30);
        const wochen = Math.floor((tage % 365) / 7);
        const restlicheTage = tage % 7;

        // Verwende toLocaleString, um Tausender Trennzeichen hinzuzufügen
        const jahreMitTrennzeichen = jahre.toLocaleString();

        // Erstelle den neuen Timer-Text
        const neuerTimerText = `Jahre: ${jahreMitTrennzeichen}, Monate: ${monate}, Wochen: ${wochen}, Tage: ${restlicheTage}, Stunden: ${stunden}, Minuten: ${minuten}, Sekunden: ${sekunden}`;

        // Ersetze den vorhandenen Timer-Text auf der Website
        timerElement.innerText = neuerTimerText;
    }
}

    // Hauptfunktion
    function main() {
        // Suche nach dem Element mit der ID "education_schooling_-1"
        const timerElement = document.getElementById("education_schooling_-1");

        // Prüfe, ob das Element vorhanden ist
        if (timerElement) {
            // Setze eine Intervall-Schleife, um den Timer-Text kontinuierlich zu überwachen und zu aktualisieren
            setInterval(() => {
                umrechnenTimer(timerElement);
            }, 1000); // Alle 1000 Millisekunden (1 Sekunde) überprüfen
        }
    }

    // Führe das Hauptskript aus, wenn das DOM bereit ist
    main();
})();
