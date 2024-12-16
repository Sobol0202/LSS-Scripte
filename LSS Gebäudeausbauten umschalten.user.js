// ==UserScript==
// @name         LSS Gebäudeausbauten umschalten
// @namespace    www.leitstellenspiel.de
// @version      1.2
// @description  Fügt einen Button hinzu, um den Status aller Ausbauten in einem Gebäude umzuschalten
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Senden von Hintergrundanfragen
    function sendBackgroundRequests(id, authToken, callback) {
        const totalRequests = 18;
        let completedRequests = 0;

        for (let i = 0; i <= totalRequests; i++) {
            const url = `https://www.leitstellenspiel.de/buildings/${id}/extension_ready/${i}/${id}`;

            // Verwendung von GM_xmlhttpRequest für Cross-Origin-Anfragen
            GM_xmlhttpRequest({
                method: 'POST',
                url: url,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': authToken
                },
                data: JSON.stringify({}),
                onload: function(response) {
                    //console.log(`Anfrage ${i} erfolgreich:`, response.responseText);
                    completedRequests++;

                    // Aufruf des Callbacks, wenn alle Anfragen abgeschlossen sind
                    if (completedRequests === totalRequests) {
                        callback();
                    }
                },
                onerror: function(error) {
                    //console.error(`Fehler beim Senden der Anfrage ${i}:`, error);
                    completedRequests++;

                    // Aufruf des Callbacks, wenn alle Anfragen abgeschlossen sind
                    if (completedRequests === totalRequests) {
                        callback();
                    }
                }
            });
        }
    }

    // Funktion zum Neuladen der Seite
    function reloadPage() {
        location.reload();
    }

    // Funktion zum Hinzufügen des Buttons
    function addButton() {
        //console.log('Button wird hinzugefügt...');
        const currentURL = window.location.href;
        const pathComponents = currentURL.split('/');
        const idIndex = pathComponents.indexOf('buildings') + 1;

        if (idIndex < pathComponents.length) {
            const id = pathComponents[idIndex];
            //console.log('ID:', id);

            // Abrufen des Authentifizierungstokens aus dem Meta-Tag
            const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            if (authToken) {
                //console.log('Authentifizierungstoken:', authToken);

                // Erstellen und Konfigurieren des Buttons
                const button = document.createElement('a');
                button.href = '#';
                button.className = 'btn btn-default btn-xs';
                button.innerText = 'Ausbauten umschalten';

                // Event-Listener für den Button
                button.addEventListener('click', function(event) {
                    event.preventDefault();
                    //console.log('Button wurde geklickt...');
                    sendBackgroundRequests(id, authToken, reloadPage);
                });

                // Finden des Container-Elements und Hinzufügen des Buttons
                const readinessElement = document.querySelector('.dl-horizontal dd span.label');
                if (readinessElement) {
                    //console.log('Element für Einsatzbereitschaft gefunden...');
                    const container = readinessElement.parentElement;
                    container.appendChild(button);
                } else {
                    //console.log('Element für Einsatzbereitschaft nicht gefunden...');
                }
            } else {
                //console.log('Authentifizierungstoken nicht gefunden...');
            }
        } else {
            //console.log('ID nicht gefunden...');
        }
    }
    addButton();
})();
