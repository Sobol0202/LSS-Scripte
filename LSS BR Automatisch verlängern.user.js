// ==UserScript==
// @name         LSS BR Automatisch verlängern
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Automatische Verlängerung für Bereitstellungsräume
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Definiere den Text, der im Strong-Element gesucht wird
    const resetText = "Zurücksetzen:";

    // Definiere den Schlüssel für den Local Storage
    const storageKey = "automatischeVerlaengerung";

    // Funktion zum Speichern der Gebäude-ID im Local Storage
    function saveToLocalStorage(id) {
        const data = {
            id: id,
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        localStorage.setItem(storageKey, JSON.stringify(data));
    }

    // Funktion zum Abrufen der gespeicherten Daten aus dem Local Storage
    function getStoredData() {
        return JSON.parse(localStorage.getItem(storageKey));
    }

    // Funktion zum Entfernen der gespeicherten Daten aus dem Local Storage
    function removeDataFromLocalStorage() {
        localStorage.removeItem(storageKey);
    }

    // Funktion zum Hinzufügen des Buttons zur Seite
    function addButton() {
        // Suche nach allen Strong-Elementen auf der Seite
        const strongElements = document.querySelectorAll('strong');
        strongElements.forEach(element => {
            // Überprüfe, ob der gesuchte Text im Strong-Element vorhanden ist
            if (element.textContent.includes(resetText)) {
                // Extrahiere die Gebäude-ID aus der URL
                const id = window.location.pathname.split('/').pop();
                // Überprüfe, ob bereits gespeicherte Daten vorhanden sind
                const storedData = getStoredData();
                // Erstelle einen Button
                const button = document.createElement('button');
                // Setze den Text und die Klasse des Buttons basierend auf den gespeicherten Daten
                button.textContent = storedData ? "Automatische Verlängerung aktiv" : "Automatisch verlängern";
                button.className = storedData ? "btn btn-success btn-xs" : "btn btn-default btn-xs";
                // Füge den Button zum DOM hinzu
                element.parentNode.appendChild(button);

                // Suche nach dem vorhandenen Verlängerungsbutton
                const sevenDaysButton = document.querySelector('a.btn.btn-default.btn-xs[href*="bereitstellung-verlaengern?days=7"]');
                // Füge den neuen Button neben dem vorhandenen Verlängerungsbutton ein
                if (sevenDaysButton) {
                    const containerDiv = sevenDaysButton.parentNode;
                    containerDiv.insertBefore(button, sevenDaysButton.nextSibling);
                }

                // Füge einen Eventlistener zum Button hinzu
                button.addEventListener('click', function() {
                    // Wenn bereits gespeicherte Daten vorhanden sind
                    if (storedData) {
                        // Lösche die gespeicherten Daten und setze den Button zurück
                        removeDataFromLocalStorage();
                        button.textContent = "Automatisch verlängern";
                        button.className = "btn btn-default btn-xs";
                    } else {
                        // Speichere die Gebäude-ID und aktualisiere den Button
                        saveToLocalStorage(id);
                        button.textContent = "Automatische Verlängerung aktiv";
                        button.className = "btn btn-success btn-xs";
                    }
                });
            }
        });
    }

    // Funktion zum Durchführen der automatischen Verlängerung
    function performAutoExtension() {
        // Überprüfe, ob bereits gespeicherte Daten vorhanden sind
        const storedData = getStoredData();
        // Wenn gespeicherte Daten vorhanden sind
        if (storedData) {
            // Aktuelles Datum extrahieren
            const currentDate = new Date().toISOString().split('T')[0];
            // Überprüfe, ob die automatische Verlängerung heute bereits durchgeführt wurde
            if (storedData.lastUpdated !== currentDate) {
                // Erstelle die Verlängerungs-URL mit der gespeicherten Gebäude-ID
                const extensionURL = `https://www.leitstellenspiel.de/buildings/${storedData.id}/bereitstellung-verlaengern?days=2`;
                // Führe einen unsichtbaren Fetch-Aufruf durch
                fetch(extensionURL)
                    .then(() => {
                        // Zeige ein Popup an, um die Durchführung der automatischen Verlängerung zu melden
                        alert("Automatische Verlängerung wurde durchgeführt.");
                    })
                    .catch(error => console.error(error));

                // Aktualisiere die gespeicherten Daten mit dem heutigen Datum
                saveToLocalStorage(storedData.id);
            }
        }
    }

    // Rufe die Funktion zum Hinzufügen des Buttons auf
    addButton();
    // Rufe die Funktion zur Durchführung der automatischen Verlängerung auf
    performAutoExtension();
})();
