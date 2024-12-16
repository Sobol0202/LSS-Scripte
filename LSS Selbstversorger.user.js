// ==UserScript==
// @name         LSS Selbstversorger
// @namespace    www.leitstellenspiel.de
// @version      1.1
// @description  Versteckt die Betreuungsseinheitanforderungsbenachrichtungstextbox
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Überprüfen und Ausblenden der Alerts mit spezifischem Text
    function checkAndHideAlerts() {
        // Alle Elemente mit der Klasse 'alert alert-success' auswählen
        var alertElements = document.querySelectorAll('.alert.alert');
        // Schleife durch alle gefundenen Elemente
        alertElements.forEach(function(alertElement) {
            // Text im Element überprüfen
            var alertText = alertElement.textContent.trim();
            // Regulärer Ausdruck für den gesuchten Text
            var regex = /(\d+) Betroffene und (\d+) Einsatzkräfte müssen versorgt werden\./;
            if (regex.test(alertText)) {
                // Element ausblenden
                alertElement.style.display = 'none';
            }
        });
    }

    // Überprüfung bei Seitenaufbau und Änderungen im DOM ausführen
    checkAndHideAlerts();
    var observer = new MutationObserver(checkAndHideAlerts);
    observer.observe(document.body, { childList: true, subtree: true });
})();
