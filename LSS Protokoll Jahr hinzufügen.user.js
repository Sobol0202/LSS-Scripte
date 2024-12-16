// ==UserScript==
// @name         LSS-Protokoll Jahr hinzufügen
// @version      1.2r
// @description  Fügt das Jahr zu den Zeitstempeln auf der Leitstellenspiel-Webseite hinzu.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/alliance_logfiles*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Hinzufügen des Jahres zu den Zeitstempeln
    function addYearToTimestamp(element) {
        const timestamp = element.getAttribute('data-log-time');
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const formattedTimestamp = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        element.textContent = formattedTimestamp;
    }

    // Alle Elemente mit dem Attribut 'data-log-time' auswählen und das Jahr hinzufügen
    const timestampElements = document.querySelectorAll('[data-log-time]');
    timestampElements.forEach(element => {
        addYearToTimestamp(element);
    });
})();
