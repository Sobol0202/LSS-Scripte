// ==UserScript==
// @name         LSS Zellanzahl in Leitstellenstatistik einfügen
// @version      1.0
// @description  Fügt im Tab "Statistik" die Anzahl der Zellen hinzu
// @author       Sobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if(element) {
                resolve(element);
                return;
            }
            const observer = new MutationObserver((mutations, obs) => {
                const el = document.querySelector(selector);
                if(el) {
                    obs.disconnect();
                    resolve(el);
                }
            });
            observer.observe(document.body, {childList: true, subtree: true});
            setTimeout(() => {
                observer.disconnect();
                reject(`Timeout waiting for element: ${selector}`);
            }, timeout);
        });
    }

    // Funktion, um building_id aus URL zu bekommen
    function getBuildingIdFromUrl() {
        const match = window.location.pathname.match(/\/buildings\/(\d+)/);
        if(match && match[1]) return parseInt(match[1], 10);
        return null;
    }

    // Fügt die Zeile mit Zellanzahl in die Tabelle ein
    function addCellCountRow(statsDiv, cellCount) {
        // statsDiv ist das div.col-sm-6 mit der Tabelle der Stats
        const table = statsDiv.querySelector('table');
        if(!table) return;

        // Prüfe, ob schon eine Zeile mit "Zellen" existiert, falls ja, entferne sie
        const existingRow = [...table.querySelectorAll('tr')].find(tr => {
            const firstTd = tr.querySelector('td:first-child');
            return firstTd && firstTd.textContent.trim() === 'Zellen';
        });
        if(existingRow) existingRow.remove();

        // Neue Zeile erstellen
        const tr = document.createElement('tr');

        const tdLabel = document.createElement('td');
        tdLabel.textContent = 'Zellen';

        const tdValue = document.createElement('td');
        tdValue.classList.add('stats-column');
        tdValue.textContent = cellCount;

        tr.appendChild(tdLabel);
        tr.appendChild(tdValue);

        // Tabelle einfügen (vorherige Einträge bleiben erhalten)
        table.querySelector('tbody')?.appendChild(tr) ?? table.appendChild(tr);
    }

    // Ruft API ab, filtert und zählt Zellen, aktualisiert UI
    async function updateCellCount() {
        const buildingId = getBuildingIdFromUrl();
        if(!buildingId) return;

        // Warte auf tab_stats, falls noch nicht vorhanden
        const tabStats = await waitForElement('#tab_stats').catch(() => null);
        if(!tabStats) return;

        // Suche erstes div.col-sm-6 im tabStats
        const statsDiv = tabStats.querySelector('div.col-sm-6');
        if(!statsDiv) return;

        // API abrufen
        try {
            const response = await fetch('https://www.leitstellenspiel.de/api/buildings');
            if(!response.ok) throw new Error('API konnte nicht geladen werden');
            const buildings = await response.json();

            // Filtere Gebäude mit leitstelle_building_id = buildingId
            const leitstellenBuildings = buildings.filter(b => b.leitstelle_building_id === buildingId);

            // Von diesen Gebäude mit building_type == 6 filtern
            const type6Buildings = leitstellenBuildings.filter(b => b.building_type === 6);

            // Für diese Gebäude die Extensions filtern, die caption "Zelle" und available true haben
            let totalCells = 0;
            type6Buildings.forEach(b => {
                if(Array.isArray(b.extensions)) {
                    const count = b.extensions.filter(ext => ext.caption === 'Zelle' && ext.available === true).length;
                    totalCells += count;
                }
            });

            // Wert in Tabelle einfügen
            addCellCountRow(statsDiv, totalCells);

        } catch (error) {
            console.error('Fehler beim Laden der Zellanzahl:', error);
        }
    }

    // MutationObserver, der auf Änderungen im tab_stats wartet
    function observeTabStats() {
        const tabStats = document.querySelector('#tab_stats');
        if(!tabStats) return;

        const observer = new MutationObserver((mutations) => {
            const statsDiv = tabStats.querySelector('div.col-sm-6');
            if(statsDiv) {
                updateCellCount();
            }
        });

        observer.observe(tabStats, {childList: true, subtree: true});
    }

    // Beobachte, ob tab_stats hinzugefügt wird, falls noch nicht da
    (async () => {
        // Warte auf tab_stats, dann beobachte es
        const tabStats = await waitForElement('#tab_stats').catch(() => null);
        if(tabStats) {
            observeTabStats();

            // Wenn tab_stats schon Inhalte hat, sofort updaten
            if(tabStats.querySelector('div.col-sm-6')) {
                updateCellCount();
            }
        }
    })();

})();
