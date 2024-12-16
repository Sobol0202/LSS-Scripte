// ==UserScript==
// @name         LSS-Einsatz-Notizen
// @namespace    Leitstellenspiel.de
// @version      1.2r
// @description  Fügt einen Button zur Hinzufügung von Einsatz-Notizen hinzu und speichert diese im local storage des Browsers.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Erzeuge den Button für die Einsatz-Notiz
    var noteButton = document.createElement('button');
    noteButton.innerHTML = 'Einsatz-Notiz';

    // Finde das Element mit der ID "h2_free_vehicles"
    var freeVehiclesElement = document.getElementById('h2_free_vehicles');

    // Füge den neuen Button unter dem Element "h2_free_vehicles" hinzu
    freeVehiclesElement.parentNode.insertBefore(noteButton, freeVehiclesElement.nextSibling);

    // Hinzufügen des Klickereignisses für den neuen Button
    noteButton.addEventListener('click', function() {
        var missionId = window.location.pathname.split('/').pop();
        var storageKey = 'missionNote_' + missionId;
        var note = localStorage.getItem(storageKey) || '';

        note = prompt('Schreibe eine Notiz für diesen Einsatz:', note);

        if (note !== null) {
            // Speichern der Notiz im local storage
            localStorage.setItem(storageKey, note);

            // Setze einen Timer zum Löschen der Notiz nach 24 Stunden
            var expirationKey = storageKey + '_expiration';
            var expirationTime = new Date();
            expirationTime.setHours(expirationTime.getHours() + 24);
            localStorage.setItem(expirationKey, expirationTime.getTime().toString());
        }
    });

// Überprüfe und lösche abgelaufene Notizen beim Laden der Seite
var currentMissionId = window.location.pathname.split('/').pop();
var storageKeyPrefix = 'missionNote_';

Object.keys(localStorage).forEach(function(key) {
    if (key.startsWith(storageKeyPrefix)) {
        var missionId = key.replace(storageKeyPrefix, '');

        if (missionId !== currentMissionId) {
            // Lösche abgelaufene Notizen
            var expirationKey = key + '_expiration';
            var expirationTime = localStorage.getItem(expirationKey);
            if (expirationTime && parseInt(expirationTime) < Date.now()) {
                localStorage.removeItem(key);
                localStorage.removeItem(expirationKey);
            }
        } else if (localStorage.getItem(key) === null) {
            // Lösche Notizen, wenn der Einsatz nicht erneut aufgerufen wird
            localStorage.removeItem(key);
            localStorage.removeItem(key + '_expiration');
        } else {
            // Zeige die gespeicherte Notiz an
            var note = localStorage.getItem(key);
            if (note) {
                var noteButton = document.getElementById('h2_free_vehicles');
                noteButton.insertAdjacentHTML('afterend', '<div><strong>Notiz:</strong> ' + note + '</div>');
            }
        }
    }
});

})();
