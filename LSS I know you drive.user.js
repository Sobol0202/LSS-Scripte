// ==UserScript==
// @name         LSS I know you drive
// @namespace    www.leitstellenspiel.de
// @version      1.1
// @description  Entfernt die Alarmierungsmeldung
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Entfernen des Alert-Elements mit dem spezifischen Text
    function removeSpecificAlertElement() {
        var alertElements = document.querySelectorAll('.alert.fade.in.alert-success');
        alertElements.forEach(function(alertElement) {
                alertElement.remove();

        });
    }

    // Funktion zum Überwachen von DOM-Änderungen
    function observeDOM() {
        var targetNode = document.body;

        // Konfiguration des Observers mit einer Callback-Funktion
        var config = { childList: true, subtree: true };

        // Callback-Funktion wird ausgeführt, wenn Änderungen im DOM festgestellt werden
        var callback = function(mutationsList, observer) {
            for (var mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // Überprüfe, ob das Alert-Element mit dem spezifischen Text hinzugefügt wurde
                    removeSpecificAlertElement();
                }
            }
        };

        // Erstelle einen Observer mit der angegebenen Konfiguration und Callback-Funktion
        var observer = new MutationObserver(callback);

        // Starte die Überwachung des Zielknotens für Änderungen
        observer.observe(targetNode, config);
    }

    // Führe das Skript direkt nach dem Laden der Seite aus
    observeDOM();
})();
