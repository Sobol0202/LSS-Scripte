// ==UserScript==
// @name         LSS Älteste Wache markieren
// @version      1.0
// @description  Hebt das älteste Gebäude in der Leitstelle hervor.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zur Ermittlung und Hervorhebung der Gebäude mit der niedrigsten ID pro Typ
    function highlightLowestIDBuildings() {
        console.log('Suche nach Gebäuden...');
        const table = document.querySelector('#building_table');
        if (!table) {
            //console.log('Keine Tabelle gefunden.');
            return;
        }

        let buildingsByType = {}; // Objekt zum Speichern der Gebäude nach Typ

        // Durchläuft alle Tabellenzeilen
        table.querySelectorAll('tr').forEach(row => {
            const link = row.querySelector('td:nth-child(2) a'); // Sucht den Link mit den Gebäudeinformationen
            if (!link) return;

            const buildingType = link.getAttribute('building_type'); // Lese den Gebäudetyp aus
            const buildingId = parseInt(link.getAttribute('href').match(/\d+/)[0]); // Extrahiere die ID aus dem href-Link

            //console.log(`Gefundenes Gebäude: Typ=${buildingType}, ID=${buildingId}, Name=${link.textContent}`);

            // Speichere das Gebäude nur, wenn es die niedrigste ID für diesen Typ hat
            if (!buildingsByType[buildingType] || buildingId < buildingsByType[buildingType].id) {
                buildingsByType[buildingType] = { id: buildingId, element: link };
            }
        });

        // Hebt die Gebäude mit der niedrigsten ID pro Typ hervor
        Object.values(buildingsByType).forEach(building => {
            //console.log(`Hebe Gebäude hervor: ID=${building.id}, Name=${building.element.textContent}`);
            building.element.style.fontWeight = 'bold';
        });
    }

    // MutationObserver zum Überwachen von Änderungen im DOM
    const observer = new MutationObserver(() => {
        //console.log('Änderung erkannt, wende Highlighting erneut an.');
        highlightLowestIDBuildings();
    });

    // Überwache das Element mit der ID #tab_buildings
    const targetNode = document.querySelector('#tab_buildings');
    if (targetNode) {
        observer.observe(targetNode, { childList: true, subtree: true });
        //console.log('Observer gestartet. Änderungen werden überwacht.');
    } else {
        //console.log('Kein #tab_buildings Element gefunden. Observer nicht gestartet.');
    }

    // Initiales Markieren der Gebäude beim Laden der Seite
    highlightLowestIDBuildings();
})();
