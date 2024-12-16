// ==UserScript==
// @name         LSS Zugewiesenes Personal
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Zeigt im Alarmfenster das aktuell zugewiesene Personal für jedes Fahrzeug an
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==

// Füge den CSS-Code für die rechtsbündige Personalanzahl hinzu
const style = document.createElement('style');
style.textContent = `
    .personal-count {
        float: right;
    }
`;

// Füge das CSS zu <head> hinzu
document.head.appendChild(style);

(function() {
    'use strict';

// Funktion, um die zugewiesenen Personalinformationen für ein Fahrzeug abzurufen und anzuzeigen
function fetchAssignedPersonnel(vehicleId, row) {
    fetch(`https://www.leitstellenspiel.de/api/vehicles/${vehicleId}`)
        .then(response => response.json())
        .then(data => {
            const assignedPersonnelCount = data.assigned_personnel_count;
            const buildingElement = row.querySelector('.mission_vehicle_label');

            // Überprüfe, ob assignedPersonnelCount nicht null oder undefined ist
            if (assignedPersonnelCount !== null && assignedPersonnelCount !== undefined) {
                const personnelDisplay = document.createElement('span');
                // Füge eine CSS-Klasse hinzu, um die Personalanzahl rechtsbündig zu machen
                personnelDisplay.className = 'personal-count';
                personnelDisplay.textContent = ` (${assignedPersonnelCount} Personal)`;
                buildingElement.appendChild(personnelDisplay);
            }
        })
        .catch(error => console.error('Fehler beim Abrufen der Daten:', error));
}

    // Funktion zum Verarbeiten der Fahrzeuge und Anzeigen des zugewiesenen Personals
    function processVehicles() {
        const vehicleRows = document.querySelectorAll('#vehicle_show_table_body_all > tr');
        vehicleRows.forEach(row => {
            const checkbox = row.querySelector('.vehicle_checkbox');
            if (checkbox) {
                const vehicleId = checkbox.value;
                fetchAssignedPersonnel(vehicleId, row);
            }
        });
    }

    // Warte 100 ms, bevor das Skript die Fahrzeuge verarbeitet
    setTimeout(function() {
        //console.log('Wartezeit abgelaufen. Verarbeite Fahrzeuge.');
        processVehicles();
    }, 100);
})();
