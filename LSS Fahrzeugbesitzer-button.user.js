// ==UserScript==
// @name         Fahrzeugbesitzer-Button
// @namespace    www.leitstellenspiel.de
// @version      1.4r
// @description  Fügt einen Button neben dem Fahrzeugbesitzer-Namen hinzu, der den Namen in das RMS einfügt.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Überprüfen, ob der Darkmode aktiv ist
    function isDarkMode() {
        const bodyBackgroundColor = window.getComputedStyle(document.body).backgroundColor;
        return bodyBackgroundColor !== 'rgb(250, 250, 250)'; // #fafafa
    }

    // Funktion zum Einfügen des Buttons und Hinzufügen des Klick-Handlers
    function addButtonToOwner(ownerLink) {
        if (ownerLink && !ownerLink.parentElement.querySelector('button[data-owner-button]')) {
            const ownerName = ownerLink.textContent.trim();
            const button = document.createElement('button');
            button.textContent = '@';
            button.style.marginLeft = '5px';
            button.dataset.ownerButton = true;
            button.onclick = function() {
                const input = document.getElementById('mission_reply_content');
                input.value += '@' + ownerName + ' ';
            };

            // Stile für den Darkmode hinzufügen, wenn aktiv
            if (isDarkMode()) {
                button.style.backgroundColor = '#505050';
                button.style.color = '#ffffff';
            } else {
                // Falls Darkmode nicht aktiv, reguläre Stile anwenden
                button.style.backgroundColor = '#fafafa';
                button.style.color = '#000000';
            }

            ownerLink.parentElement.appendChild(button);
        }
    }

    // Funktion zum Hinzufügen des Buttons für die Fahrzeuge in der Tabelle mit der ID "mission_vehicle_driving"
    function addButtonToDrivingVehicles() {
        const rows = document.querySelectorAll('tr[id^="vehicle_row_"]');

        rows.forEach(row => {
            const ownerLink = row.querySelector('td:nth-child(7) a[href^="/profile/"]');
            addButtonToOwner(ownerLink);
        });
    }

    // Funktion zum Hinzufügen des Buttons für die Fahrzeuge in der Haupttabelle
    function addButtonToMainTable() {
        const rows = document.querySelectorAll('tr[id^="vehicle_row_"]');

        rows.forEach(row => {
            const ownerLink = row.querySelector('td:nth-child(5) a[href^="/profile/"]');
            addButtonToOwner(ownerLink);
        });
    }

    addButtonToMainTable();
    addButtonToDrivingVehicles();
})();
