// ==UserScript==
// @name         LSS Zeitstempel für Statuswechsel
// @version      1.0
// @description  Fügt Zeitstempel bei Statuswechseln im Funkbereich ein
// @author       Sobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Hilfsfunktion: formatiert das aktuelle Datum/Zeit als HH:MM:SS
    function getCurrentTimestamp() {
        const now = new Date();
        return now.toLocaleTimeString('de-DE', { hour12: false });
    }

    // Beobachte den Bereich #radio_messages auf neue Statuswechsel
    const radioMessages = document.querySelector('#radio_messages');
    if (!radioMessages) return;

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                // Nur li-Elemente verarbeiten
                if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'LI') {
                    const vehicleIcon = node.querySelector('img.vehicle_search');
                    const vehicleLink = node.querySelector('a.btn.btn-xs.btn-default.lightbox-open');

                    // Zeitstempel erstellen und einfügen
                    if (vehicleIcon && vehicleLink) {
                        const timestamp = document.createElement('span');
                        timestamp.textContent = ` [${getCurrentTimestamp()}] `;
                        timestamp.style.fontSize = 'smaller';
                        timestamp.style.color = '#888';
                        vehicleIcon.insertAdjacentElement('afterend', timestamp);
                    }
                }
            });
        });
    });

    // Observer Starten
    observer.observe(radioMessages, { childList: true });
})();
