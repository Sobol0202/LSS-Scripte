// ==UserScript==
// @name         LSS Status 0
// @namespace    www.leitstellenspiel.de
// @version      0.9
// @description  Löst ab und zu einen Status 0 Funkspruch aus
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Zähler initialisieren oder aus dem Local Storage abrufen
    let counter = localStorage.getItem('funkCounter') || 0;

    // Funktion zum Erhöhen des Zählers
    function increaseCounter() {
        counter++;
        // Zählerstand im Local Storage speichern
        localStorage.setItem('funkCounter', counter);
        // Zählerstand in der Console anzeigen
        //console.log('Funkspruch-Zähler: ' + counter);

        // Wenn der Zähler 10000 erreicht, erstelle einen Fake Sprechwunsch und setze den Zähler zurück
        if (counter > 10000) {
            createFakeRadioMessage();
            resetCounter();
        }
    }

    // Funktion zum Zurücksetzen des Zählers
    function resetCounter() {
        counter = 0;
        localStorage.setItem('funkCounter', counter);
        //console.log('Funkspruch-Zähler wurde zurückgesetzt: ' + counter);
    }

    function createFakeRadioMessage() {
        // API-Aufruf, um ein Fahrzeug mit FMS-Status 4 zu erhalten
        fetch('https://www.leitstellenspiel.de/api/vehicles')
            .then(response => response.json())
            .then(data => {
                const vehicle = data.find(v => v.fms_real === 4);
                if (vehicle) {
                    const fakeRadioMessage = document.createElement('li');
                    fakeRadioMessage.className = `radio_message_vehicle_${vehicle.id}`;
                    fakeRadioMessage.innerHTML = `<span title="Dringender Sprechwunsch!" class="building_list_fms building_list_fms_5">0</span>
                        <img src="/images/icons8-location_off.svg" class="vehicle_search " vehicle_id="${vehicle.id}" data-dblclick="true">
                        <a href="/vehicles/${vehicle.id}" class="btn btn-xs btn-default lightbox-open">${vehicle.caption}</a>
                        <a href="/missions/${vehicle.target_id}" class="btn btn-xs btn-default lightbox-open">Zum Einsatz</a> Dringender Sprechwunsch!`;

                    // Fake Sprechwunsch zum important-Radio-Nachrichten-Element hinzufügen
                    const radioMessagesImportant = document.getElementById('radio_messages_important');
                    radioMessagesImportant.appendChild(fakeRadioMessage);
                }
            })
            .catch(error => {
                //console.error('Fehler beim Abrufen von Fahrzeugdaten:', error);
            });
    }

    // Funktion zum Überprüfen und Zählen der ungezählten Funksprüche
    function checkAndCountMessages() {
        // Alle ungezählten Elemente mit der Klasse "building_list_fms_4" auswählen
        const messages = document.querySelectorAll('.building_list_fms_4:not([data-counted="true"])');
        // Durch die Elemente gehen und den Zähler erhöhen
        messages.forEach(function(message) {
            increaseCounter();
            // Markiere das Element als gezählt, um Mehrfachzählungen zu verhindern
            message.setAttribute('data-counted', 'true');
        });
    }

    // Die Funktion initial aufrufen, um vorhandene ungezählte Funksprüche zu zählen
    checkAndCountMessages();

    // Die Funktion in einem Intervall aufrufen, um Änderungen zu überwachen
    setInterval(checkAndCountMessages, 1000);

})();
