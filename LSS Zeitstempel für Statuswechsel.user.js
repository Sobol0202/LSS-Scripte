// ==UserScript==
// @name         LSS Zeitstempel für Statuswechsel
// @version      1.1
// @description  Fügt Zeitstempel bei Statuswechseln im Funkbereich ein
// @author       Sobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Gibt den aktuellen Zeitstempel im Format HH:MM:SS zurück
    function getCurrentTimestamp() {
        const now = new Date();
        return now.toLocaleTimeString('de-DE', { hour12: false });
    }

    // Fügt in einem <li> den Zeitstempel zwischen Icon und Fahrzeuglink ein
    function insertTimestamp(liElement) {
        const vehicleIcon = liElement.querySelector('img.vehicle_search');
        const vehicleLink = liElement.querySelector('a.btn.btn-xs.btn-default.lightbox-open');

        if (vehicleIcon && vehicleLink) {
            const timestamp = document.createElement('span');
            timestamp.textContent = ` [${getCurrentTimestamp()}] `;
            timestamp.style.fontSize = 'smaller';
            timestamp.style.color = '#888';

            // Nur wenn noch kein Timestamp drin ist
            if (!vehicleIcon.nextSibling?.textContent?.includes('[')) {
                vehicleIcon.insertAdjacentElement('afterend', timestamp);
            }
        }
    }

    // Initialisiert den Observer auf ein gegebenes UL-Element
    function observeRadioList(ulElement) {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'LI') {
                        insertTimestamp(node);
                    }
                });
            });
        });

        observer.observe(ulElement, { childList: true });
    }

    // Warten bis DOM verfügbar ist
    function init() {
        const importantList = document.querySelector('#radio_messages_important');
        const normalList = document.querySelector('#radio_messages');

        if (importantList) observeRadioList(importantList);
        if (normalList) observeRadioList(normalList);
    }

    // Stelle sicher, dass DOM geladen ist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
