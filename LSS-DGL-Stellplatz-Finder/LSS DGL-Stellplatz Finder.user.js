// ==UserScript==
// @name         LSS DGL-Stellplatz Finder
// @namespace    www.leitstellenspiel.de
// @version      1.1
// @description  Sucht und Zeigt nicht ausgebaute DGL Erweiterungen und Stellplätze
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @resource     icon https://github.com/Sobol0202/LSS-Scripte/raw/main/LSS-DGL-Stellplatz-Finder/icons8-police-64.png
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
                <title>Fehlende Dienstgruppenleiter (DGL)</title>
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
                    .no-dgl {
                        background-color: #707600;
                    }
                    .no-dgl-available {
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
                <h1>Fehlende Dienstgruppenleiter (DGL)</h1>
                <table id="dglTable">
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
        return newTab.document.querySelector('#dglTable tbody');
    }

    // Funktion, um Gebäudedaten abzurufen und auf fehlende DGL zu überprüfen
    function fetchAndCheckDGL(tableBody) {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://www.leitstellenspiel.de/api/buildings",
            onload: function(response) {
                const buildings = JSON.parse(response.responseText);
                fetchVehiclesAndCheckDGL(buildings, tableBody);
            }
        });
    }

    // Funktion, um Fahrzeuge abzurufen und für jedes Gebäude die DGL zu überprüfen
    function fetchVehiclesAndCheckDGL(buildings, tableBody) {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://www.leitstellenspiel.de/api/vehicles",
            onload: function(response) {
                const vehicles = JSON.parse(response.responseText);
                buildings.forEach(building => {
                    if (building.building_type === 6) {
                        const dglAvailable = building.extensions.find(ext => ext.caption === "Dienstgruppenleitung" && ext.available === true);
                        if (dglAvailable) {
                            checkDGL(building.id, building.caption, vehicles, tableBody);
                        } else {
                            addBuildingToTable(building.id, building.caption, tableBody, false, true);
                        }
                    }
                });
            }
        });
    }

    // Funktion, um die DGL für ein Gebäude zu überprüfen
    function checkDGL(buildingId, caption, vehicles, tableBody) {
        const hasDGL = vehicles.some(vehicle => vehicle.vehicle_type === 103 && vehicle.building_id === buildingId);
        if (!hasDGL) {
            addBuildingToTable(buildingId, caption, tableBody, true, false);
        }
    }

    // Funktion, um ein Gebäude zur Tabelle hinzuzufügen
    function addBuildingToTable(buildingId, caption, tableBody, isNoDGLAvailable, isNoDGL) {
        const row = document.createElement('tr');
        if (isNoDGLAvailable) {
            row.classList.add('no-dgl-available');
        }
        if (isNoDGL) {
            row.classList.add('no-dgl');
        }
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
    triggerA.append(triggerImg, 'DGL Stellplatz-Finder');
    triggerLi.appendChild(triggerA);

    triggerLi.addEventListener('click', event => {
        event.preventDefault();
        const tableBody = openNewTabWithTable();
        fetchAndCheckDGL(tableBody); // Gebäudedaten abrufen und DGL überprüfen, wenn auf den Button geklickt wird
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
