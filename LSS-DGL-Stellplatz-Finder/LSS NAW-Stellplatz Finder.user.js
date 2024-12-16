// ==UserScript==
// @name         LSS NAW Finder
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Sucht und Zeigt alle Rettungswachen ohne NAW
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @resource     icon https://github.com/Sobol0202/LSS-DGL-Stellplatz-Finder/raw/main/icons8-police-64.png
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceURL
// ==/UserScript==

(function() {
    'use strict';

    // Funktion, um ein neues Tab mit der Tabelle zu öffnen
    function openNewTabWithTable() {
        const newTab = window.open('', '_blank');
        newTab.document.write(`
            <html>
            <head>
                <title>Fehlende Fahrzeuge des Typs 74</title>
                <style>
                    body {
                        background-color: #1e1e1e;
                        color: #e0e0e0;
                        font-family: Arial, sans-serif;
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        margin-top: 20px;
                    }
                    th, td {
                        border: 1px solid #555;
                        text-align: left;
                        padding: 8px;
                    }
                    th {
                        background-color: #333;
                    }
                    .no-vehicle {
                        background-color: #660000;
                    }
                    a {
                        color: #fafafa;
                        text-decoration: none;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <h1>Fehlende NAW</h1>
                <table id="vehicleTable">
                    <thead>
                        <tr>
                            <th>Wache</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </body>
            </html>
        `);
        return newTab.document.querySelector('#vehicleTable tbody');
    }

    // Funktion, um Gebäudedaten abzurufen und auf fehlende Fahrzeuge des Typs 74 zu überprüfen
    function fetchAndCheckVehicles(tableBody) {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://www.leitstellenspiel.de/api/buildings",
            onload: function(response) {
                const buildings = JSON.parse(response.responseText);
                fetchVehiclesAndCheck(buildings, tableBody);
            }
        });
    }

    // Funktion, um Fahrzeuge abzurufen und für jedes Gebäude die Fahrzeuge des Typs 74 zu überprüfen
    function fetchVehiclesAndCheck(buildings, tableBody) {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://www.leitstellenspiel.de/api/vehicles",
            onload: function(response) {
                const vehicles = JSON.parse(response.responseText);
                buildings.forEach(building => {
                    if (building.building_type === 2) {
                        const hasVehicleType74 = vehicles.some(vehicle => vehicle.vehicle_type === 74 && vehicle.building_id === building.id);
                        if (!hasVehicleType74) {
                            addBuildingToTable(building.id, building.caption, tableBody);
                        }
                    }
                });
            }
        });
    }

    // Funktion, um ein Gebäude zur Tabelle hinzuzufügen
    function addBuildingToTable(buildingId, caption, tableBody) {
        const row = document.createElement('tr');
        row.classList.add('no-vehicle');
        const buildingLink = `https://www.leitstellenspiel.de/buildings/${buildingId}`;
        row.innerHTML = `
            <td><a href="${buildingLink}" target="_blank">${caption}</a></td>
        `;
        tableBody.appendChild(row);
    }

    // Trigger-Element erstellen
    const triggerLi = document.createElement('li');
    const triggerA = document.createElement('a');
    const triggerImg = document.createElement('img');
    triggerImg.src = GM_getResourceURL('icon');
    triggerImg.width = 24;
    triggerImg.height = 24;
    triggerA.href = '#';
    triggerA.append(triggerImg, 'NAW Finder');
    triggerLi.appendChild(triggerA);

    triggerLi.addEventListener('click', event => {
        event.preventDefault();
        const tableBody = openNewTabWithTable();
        fetchAndCheckVehicles(tableBody); // Gebäudedaten abrufen und Fahrzeuge überprüfen, wenn auf den Button geklickt wird
    });

    // Trigger-Element ins DOM einfügen
    const menuProfile = document.querySelector('#menu_profile');
    if (menuProfile) {
        const dropdownMenu = menuProfile.nextElementSibling;
        if (dropdownMenu) {
            const divider = dropdownMenu.querySelector('li.divider');
            if (divider) {
                divider.before(triggerLi);
            }
        }
    }

})();
