// ==UserScript==
// @name         LSS Antwortzeit
// @namespace    www.leitstellenspiel.de
// @version      0.8
// @description  Zeigt die Serverantwortzeit an und speichert die Werte sitzungsübergreifend
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    // Erstelle ein Inline-Element für die Anzeige der Antwortzeit
    const responseDisplay = document.createElement('span');
    responseDisplay.style.display = 'inline-block';
    document.body.appendChild(responseDisplay);

    // Erstelle ein Inline-Element für die Anzeige des Countdowns
    const countdownDisplay = document.createElement('span');
    countdownDisplay.style.display = 'inline-block';
    countdownDisplay.style.marginLeft = '10px';
    document.body.appendChild(countdownDisplay);

    // Funktion zum Senden einer Anfrage und Aktualisierung der Antwortzeit-Anzeige
    function sendRequest() {
        const startTime = new Date().getTime();

        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://www.leitstellenspiel.de/profile/1',
            onload: function(response) {
                const endTime = new Date().getTime();
                const responseTime = endTime - startTime;

                // Aktualisiere die Antwortzeit-Anzeige
                responseDisplay.textContent = `Antwortzeit: ${responseTime} ms`;

                // Speichere die Werte
                const timestamp = new Date().toLocaleString();
                saveValues({ timestamp, responseTime });
            },
            onerror: function(error) {
                console.error('Fehler:', error);
                responseDisplay.textContent = 'Fehler beim Abrufen der Daten';
            }
        });
    }

    // Funktion zum Aktualisieren der Countdown-Anzeige
    function updateCountdown(seconds) {
        countdownDisplay.textContent = `Nächste Messung in: ${seconds} Sekunden`;
    }

    // Funktion zum Starten des Countdowns
    function startCountdown(seconds) {
        let remainingSeconds = seconds;
        updateCountdown(remainingSeconds);

        // Intervall für den Countdown
        const countdownInterval = setInterval(function() {
            remainingSeconds--;
            updateCountdown(remainingSeconds);

            // Wenn der Countdown abgelaufen ist, sende eine Anfrage und starte den Countdown erneut
            if (remainingSeconds <= 0) {
                clearInterval(countdownInterval);
                sendRequest();
                startCountdown(seconds);
            }
        }, 1000);
    }

    // Funktion zum Speichern der Werte im Tampermonkey-internen Speicher
    function saveValues(values) {
        const savedValues = GM_getValue('lss_antwortzeiten', []);
        savedValues.push(values);
        GM_setValue('lss_antwortzeiten', savedValues);
    }

    // Funktion zum Speichern der gespeicherten Werte als CSV
    function saveCSV() {
        const savedValues = GM_getValue('lss_antwortzeiten', []);
        const csvContent = "Timestamp;ResponseTime\n" +
            savedValues.map(entry => `${entry.timestamp};${entry.responseTime}`).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'antwortzeiten.csv';
        link.click();
    }

    // Funktion zum Löschen der gespeicherten Werte
    function clearValues() {
        GM_setValue('lss_antwortzeiten', []);
        responseDisplay.textContent = '';
        countdownDisplay.textContent = 'Nächste Messung in: 300 Sekunden';
    }

    // Klick auf Antwortzeit-Text löst den Download aus
    responseDisplay.addEventListener('click', saveCSV);

    // Klick auf Countdown-Text löst die Löschfunktion aus
    countdownDisplay.addEventListener('click', clearValues);

    // Initialisierung: Sende eine Anfrage und starte den Countdown
    sendRequest();
    startCountdown(300); // 5 Minuten

})();
