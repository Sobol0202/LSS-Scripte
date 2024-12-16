// ==UserScript==
// @name         LSS-Protokoll überwacher
// @namespace    https://www.leitstellenspiel.de/
// @version      1.2r
// @description  Färbt die Alliance-Schaltfläche gelb ein, wenn ein neuer Logfile-Eintrag vorhanden ist.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Überprüfen, ob Local Storage unterstützt wird
    if (typeof(Storage) !== "undefined") {
        // Funktion zum Vergleichen des aktuellen Zeitstempels mit dem gespeicherten Zeitstempel
        function checkForNewLog() {
            //console.log('Überprüfe auf neue Logfile-Einträge...');

            // AJAX-Anfrage zum Abrufen des Log-Files
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://www.leitstellenspiel.de/alliance_logfiles", true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    //console.log('Logfile erfolgreich abgerufen.');

                    // HTML-Text der Antwort extrahieren
                    var responseText = xhr.responseText;

                    // Zeitstempel aus der ersten Zeile des Log-Files extrahieren
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(responseText, "text/html");
                    var timestampElement = doc.querySelector('.table.table-striped tbody tr:first-child td:first-child span[data-log-time]');
                    if (timestampElement) {
                        var currentTimestamp = timestampElement.getAttribute('data-log-time');

                        // Gespeicherten Zeitstempel aus dem Local Storage abrufen
                        var savedTimestamp = localStorage.getItem('savedTimestamp');

                        // Wenn ein gespeicherter Zeitstempel vorhanden ist und der aktuelle Zeitstempel neuer ist
                        if (savedTimestamp && currentTimestamp > savedTimestamp) {
                            //console.log('Neuer Logfile-Eintrag gefunden!');

                            // Färbe den Alliance-Button gelb ein
                            GM_addStyle("#alliance_li { background-color: yellow !important; }");
                        } else {
                            //console.log('Kein neuer Logfile-Eintrag vorhanden.');

                            // Entferne die Einfärbung des Alliance-Buttons
                            GM_addStyle("#alliance_li { background-color: initial !important; }");
                        }

                        // Aktuellen Zeitstempel im Local Storage aktualisieren
                        localStorage.setItem('savedTimestamp', currentTimestamp);
                    }
                }
            };
            xhr.send();
        }

        // Überprüfe alle 60 Sekunden auf einen neuen Logfile-Eintrag
        setInterval(checkForNewLog, 60000);

        // Überprüfe beim Öffnen des Logfiles, ob der Zeitstempel neu geschrieben wurde
        window.addEventListener('load', function() {
            //console.log('Logfile wurde geöffnet.');

            // Entferne die Einfärbung des Alliance-Buttons
            GM_addStyle("#alliance_li { background-color: initial !important; }");
        });
    } else {
        console.log('Local Storage wird nicht unterstützt.');
    }
})();
