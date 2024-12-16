// ==UserScript==
// @name         LSS Verbandsgebäudefilter
// @namespace    www.leitstellenspiel.de
// @version      1.1
// @description  Fügt Filterbuttons für verschiedene Gebäudearten hinzu und zeigt die Anzahl der Gebäude als Tooltip an.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/verband/gebauede
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let activeType = null;

    async function fetchBuildingData() {
        const response = await fetch('https://www.leitstellenspiel.de/api/alliance_buildings');
        return await response.json();
    }

    function countBuildingsByType(buildings) {
        const typeCount = {
            4: 0,  // Krankenhaus
            16: 0, // Zelle
            3: 0,  // Rettungsschule
            1: 0,  // Feuerwehrschule
            8: 0,  // Polizeischule
            10: 0, // THW-Schule
            14: 0  // Bereitstellungsraum
        };

        buildings.forEach(building => {
            if (typeCount.hasOwnProperty(building.building_type)) {
                typeCount[building.building_type]++;
            }
        });

        return typeCount;
    }

    async function addFilterButtons() {
        const panelHeading = document.querySelector('.panel-heading');
        const buildingTypes = [
            { type: 'building_hospital', label: 'Krankenhäuser', id: 4 },
            { type: 'building_polizeiwache', label: 'Zelle', id: 16 },
            { type: 'building_fireschool', label: 'Feuerwehrschule', id: 1 },
            { type: 'building_polizeischule', label: 'Polizeischule', id: 8 },
            { type: 'building_rettungsschule', label: 'Rettungsschule', id: 3 },
            { type: 'building_thw_school', label: 'THW-Schule', id: 10 },
            { type: 'building_bereitstellungsraum', label: 'Bereitstellungsraum', id: 14 },
        ];

        const buildings = await fetchBuildingData();
        const typeCount = countBuildingsByType(buildings);

        buildingTypes.forEach(info => {
            const button = document.createElement('button');
            button.textContent = info.label;
            button.className = 'btn btn-xs btn-default';
            button.title = `${info.label}: ${typeCount[info.id]}`;
            button.addEventListener('click', () => filterBuildings(info.type, button));
            panelHeading.appendChild(button);
            //console.log('Button added:', info.label, 'Count:', typeCount[info.id]);
        });
    }

    function filterBuildings(buildingType, clickedButton) {
        const rows = document.querySelectorAll('#alliance_buildings_table tbody tr');

        // Überprüfe, ob der aktive Button erneut geklickt wurde
        if (activeType === buildingType) {
            // Entferne den Filter
            rows.forEach(row => {
                row.style.display = ''; // Zeige die Zeile
            });

            // Setze den aktiven Typ auf null
            activeType = null;
        } else {
            // Filtere Gebäude nach Typ
            rows.forEach(row => {
                const imageSrc = row.querySelector('td img').getAttribute('src');
                if (imageSrc.includes('/images/' + buildingType + '.png')) {
                    row.style.display = ''; // Zeige die Zeile
                } else {
                    row.style.display = 'none'; // Verstecke die Zeile
                }
            });

            // Setze den aktiven Typ
            activeType = buildingType;
        }

        //console.log('Filtering buildings by type:', buildingType);

        // Setze den aktiven Button und entferne die Aktivklasse von anderen Buttons
        const buttons = document.querySelectorAll('.btn.btn-xs');
        buttons.forEach(button => {
            if (button === clickedButton) {
                button.classList.toggle('btn-success', activeType === buildingType);
            } else {
                button.classList.remove('btn-success');
            }
        });
    }

    // Warte 100 ms, bevor das Skript ausgeführt wird
    setTimeout(addFilterButtons, 100);
})();
