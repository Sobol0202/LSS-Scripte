// ==UserScript==
// @name         LSS Massenentlassungen
// @namespace    www.leitstellenspiel.de
// @version      0.5alpha
// @description  Fügt ein Interface zur Personalverwaltung hinzu und bestätigt automatisch die Sicherheitsabfrage.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/buildings/*/personals
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Erstellen einer Checkbox in der letzten Spalte jeder Zeile
    function createCheckboxes() {
        const rows = document.querySelectorAll('#personal_table tbody tr');
        rows.forEach(row => {
            const checkboxCell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);
        });
    }

    // Funktion zum Entlassen der ausgewählten Mitarbeiter und automatischen Bestätigung
    async function entlassenMitarbeiter() {
        const rows = document.querySelectorAll('#personal_table tbody tr');
        const progressBar = document.createElement('progress');
        progressBar.value = 0;
        progressBar.max = rows.length;
        document.body.appendChild(progressBar);

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const checkbox = row.querySelector('input[type="checkbox"]');
            if (checkbox && checkbox.checked) {
                const deleteLink = row.querySelector('td:last-child a[data-method="delete"]');
                if (deleteLink) {
                    const confirmMessage = deleteLink.getAttribute('data-confirm');
                    if (confirmMessage) {
                        // Automatische Bestätigung der Sicherheitsabfrage
                        window.confirm = () => true;
                        deleteLink.click();
                        await new Promise(resolve => setTimeout(resolve, 100)); // Warte 100ms
                        progressBar.value = i + 1;
                    }
                }
            }
        }

        // Seite neu laden nachdem alle Mitarbeiter entlassen wurden
        location.reload();
    }

    // Funktion zum Setzen der Checkboxen für Mitarbeiter ohne Fahrzeugzuweisung
    function setCheckboxNoVehicle() {
        const rows = document.querySelectorAll('#personal_table tbody tr');
        rows.forEach(row => {
            const vehicleCell = row.querySelector('td:nth-child(3)');
            const checkbox = row.querySelector('input[type="checkbox"]');
            if (vehicleCell.textContent.trim() === '' && checkbox) {
                checkbox.checked = true;
            }
        });
    }

    // Funktion zum Setzen der Checkboxen für Mitarbeiter ohne Ausbildung
    function setCheckboxNoEducation() {
        const rows = document.querySelectorAll('#personal_table tbody tr');
        rows.forEach(row => {
            const educationCell = row.querySelector('td:nth-child(2)');
            const checkbox = row.querySelector('input[type="checkbox"]');
            if (educationCell.textContent.trim() === '' && checkbox) {
                checkbox.checked = true;
            }
        });
    }

    // Funktion zum Zurücksetzen aller Checkboxen
    function resetCheckboxes() {
        const checkboxes = document.querySelectorAll('#personal_table tbody tr input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    // Erstellt das Interface oberhalb der Tabelle
    function createInterface() {
        const table = document.querySelector('#personal_table');
        if (table) {
            const interfaceDiv = document.createElement('div');
            interfaceDiv.innerHTML = `
                <button id="addCheckboxesButton">Checkboxes hinzufügen</button>
                <button id="setNoVehicleButton">Mitarbeiter ohne Fahrzeugzuweisung</button>
                <button id="setNoEducationButton">Mitarbeiter ohne Ausbildung</button>
                <button id="resetCheckboxesButton">Alle Checkboxen zurücksetzen</button>
                <button id="entlassenButton">Ausgewählte Mitarbeiter entlassen</button>
                <progress id="progressBar" value="0" max="0"></progress>
            `;
            table.parentNode.insertBefore(interfaceDiv, table);

            // Fügt Event Listener für die Buttons hinzu
            const addCheckboxesButton = document.getElementById('addCheckboxesButton');
            const setNoVehicleButton = document.getElementById('setNoVehicleButton');
            const setNoEducationButton = document.getElementById('setNoEducationButton');
            const resetCheckboxesButton = document.getElementById('resetCheckboxesButton');
            const entlassenButton = document.getElementById('entlassenButton');
            if (addCheckboxesButton && setNoVehicleButton && setNoEducationButton && resetCheckboxesButton && entlassenButton) {
                addCheckboxesButton.addEventListener('click', createCheckboxes);
                setNoVehicleButton.addEventListener('click', setCheckboxNoVehicle);
                setNoEducationButton.addEventListener('click', setCheckboxNoEducation);
                resetCheckboxesButton.addEventListener('click', resetCheckboxes);
                entlassenButton.addEventListener('click', entlassenMitarbeiter);
            }
        }
    }

    // Führt das Skript aus, wenn die Seite vollständig geladen ist
    window.addEventListener('load', createInterface);

})();
