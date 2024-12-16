// ==UserScript==
// @name         LSS Fahrzeugtabellen im Einsatz immer Sortieren
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Fügt Checkboxen hinzu, um die Fahrzeugtabellen grundsätzlich zu sortieren
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Sortieren der Tabelle
    function sortTable(tableId) {
        let table = document.getElementById(tableId);
        if (!table) {
            //console.log(`Tabelle mit ID ${tableId} nicht gefunden.`);
            return;
        }

        let tbody = table.querySelector('tbody');
        if (!tbody) {
            //console.log(`tbody in Tabelle mit ID ${tableId} nicht gefunden.`);
            return;
        }

        let rows = Array.from(tbody.rows); // alle Zeilen im tbody

        // Überprüfen, ob jede Zeile die erwartete Anzahl an Zellen hat
        rows.forEach((row, index) => {
            if (row.cells.length < 2) {
                //console.warn(`Zeile ${index} in Tabelle ${tableId} hat weniger als 2 Zellen.`);
            }
        });

        rows.sort((a, b) => {
            let aText = a.cells[1] ? a.cells[1].innerText : '';
            let bText = b.cells[1] ? b.cells[1].innerText : '';
            return aText.localeCompare(bText);
        });

        // Alle Zeilen aus tbody entfernen und sortierte Zeilen wieder hinzufügen
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }

        rows.forEach(row => tbody.appendChild(row)); // Zeilen neu anordnen
        //console.log(`Tabelle mit ID ${tableId} wurde sortiert.`);
    }

    // Funktion zum Erstellen der Checkbox
    function createCheckbox(tableId, localStorageKey) {
        let headerCell = document.querySelector(`#${tableId} th[data-column="1"] .tablesorter-header-inner`);
        if (!headerCell) {
            //console.log(`Header-Zelle für Tabelle mit ID ${tableId} nicht gefunden.`);
            return;
        }

        if (headerCell.querySelector('input[type="checkbox"]')) {
            //console.log(`Checkbox für Tabelle mit ID ${tableId} bereits vorhanden.`);
            return;
        }

        // Checkbox erstellen
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.style.marginLeft = '10px';
        checkbox.title = 'Tabelle immer sortieren';

        // Zustand der Checkbox aus dem LocalStorage laden
        checkbox.checked = localStorage.getItem(localStorageKey) === 'true';

        // Event-Listener für das Ändern der Checkbox
        checkbox.addEventListener('change', function() {
            localStorage.setItem(localStorageKey, checkbox.checked);
            if (checkbox.checked) {
                sortTable(tableId);
            }
        });

        // Checkbox zum Header hinzufügen
        headerCell.appendChild(checkbox);
        //console.log(`Checkbox für Tabelle mit ID ${tableId} wurde hinzugefügt.`);
    }

    // Initialisieren
    function init() {
        // Warten bis die Tabellen geladen sind
        let observer = new MutationObserver((mutations, observer) => {
            let missionVehicleAtMissionTable = document.getElementById('mission_vehicle_at_mission');
            let missionVehicleDrivingTable = document.getElementById('mission_vehicle_driving');

            if (missionVehicleAtMissionTable) {
                createCheckbox('mission_vehicle_at_mission', 'sortMissionTableAtMission');
                if (localStorage.getItem('sortMissionTableAtMission') === 'true') {
                    sortTable('mission_vehicle_at_mission');
                }
            }

            if (missionVehicleDrivingTable) {
                createCheckbox('mission_vehicle_driving', 'sortMissionTableDriving');
                if (localStorage.getItem('sortMissionTableDriving') === 'true') {
                    sortTable('mission_vehicle_driving');
                }
            }

            if (missionVehicleAtMissionTable || missionVehicleDrivingTable) {
                observer.disconnect(); // Beobachtung beenden, wenn mindestens eine Tabelle gefunden wurde
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Direkte Überprüfung bei Seitenaufruf
        window.addEventListener('load', () => {
            let missionVehicleAtMissionTable = document.getElementById('mission_vehicle_at_mission');
            let missionVehicleDrivingTable = document.getElementById('mission_vehicle_driving');

            if (missionVehicleAtMissionTable) {
                createCheckbox('mission_vehicle_at_mission', 'sortMissionTableAtMission');
                if (localStorage.getItem('sortMissionTableAtMission') === 'true') {
                    sortTable('mission_vehicle_at_mission');
                }
            }

            if (missionVehicleDrivingTable) {
                createCheckbox('mission_vehicle_driving', 'sortMissionTableDriving');
                if (localStorage.getItem('sortMissionTableDriving') === 'true') {
                    sortTable('mission_vehicle_driving');
                }
            }
        });
    }

    // Skript starten
    init();
})();
