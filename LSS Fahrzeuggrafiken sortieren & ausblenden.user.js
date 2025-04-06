// ==UserScript==
// @name         LSS Fahrzeuggrafiken sortieren & ausblenden
// @version      1.0
// @description  Sortiert Fahrzeuggrafiken nach Bezeichnung und erlaubt Ausblenden per Ctrl+Klick
// @author       Sobol
// @match        https://www.leitstellenspiel.de/vehicle_graphics/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'hiddenRows'; // Schlüssel zum Speichern versteckter Zeilen

    // Tabelle suchen
    const table = document.querySelector('.table.table-striped');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    // Alle Zeilen der Tabelle sammeln
    const allRows = Array.from(tbody.querySelectorAll('tr'));
    if (allRows.length < 2) return;

    // Erste Zeile ist die Kopfzeile mit <th>
    const headerRow = allRows[0];
    const dataRows = allRows.slice(1); // Alle übrigen Zeilen enthalten Daten

    // Spaltenindex der "Bezeichnung"-Spalte ermitteln
    const headers = Array.from(headerRow.querySelectorAll('th'));
    let columnIndex = -1;

    headers.forEach((th, index) => {
        // Inhalte wie <input> entfernen und nur den Text vergleichen
        const rawText = th.cloneNode(true);
        rawText.querySelectorAll('input, select, button')?.forEach(e => e.remove());
        const cleanedText = rawText.textContent.trim().replace(/\s+/g, ' ');
        if (cleanedText === 'Bezeichnung') {
            columnIndex = index;
        }
    });

    if (columnIndex === -1) return;

    // Datenzeilen alphabetisch sortieren (nach Inhalt der Bezeichnungsspalte)
    dataRows.sort((a, b) => {
        const aText = a.querySelectorAll('td')[columnIndex]?.textContent.trim().toLowerCase() || '';
        const bText = b.querySelectorAll('td')[columnIndex]?.textContent.trim().toLowerCase() || '';
        return aText.localeCompare(bText);
    });

    // Tabelle neu zusammenbauen: Header zuerst, dann sortierte Datenzeilen
    tbody.innerHTML = '';
    tbody.appendChild(headerRow);
    dataRows.forEach(row => tbody.appendChild(row));

    // Hilfsfunktion: Identifier für Zeile holen (Textinhalt der Bezeichnungsspalte)
    function getRowIdentifier(row) {
        return row.querySelectorAll('td')[columnIndex]?.textContent.trim() || null;
    }

    // Speicherfunktionen für ausgeblendete Zeilen
    function saveHiddenRows(list) {
        GM_setValue(STORAGE_KEY, JSON.stringify(list));
    }

    function loadHiddenRows() {
        try {
            return JSON.parse(GM_getValue(STORAGE_KEY, '[]'));
        } catch {
            return [];
        }
    }

    const hidden = loadHiddenRows(); // Versteckte Zeilen aus Speicher laden

    // Für jede Datenzeile prüfen, ob sie ausgeblendet werden soll
    dataRows.forEach(row => {
        const id = getRowIdentifier(row);
        if (hidden.includes(id)) {
            row.style.display = 'none';
        }

        // Strg+Klick: Zeile ein- oder ausblenden
        row.addEventListener('click', (e) => {
            if (e.ctrlKey) {
                const index = hidden.indexOf(id);
                if (index > -1) {
                    hidden.splice(index, 1); // Wieder einblenden
                    row.style.display = '';
                } else {
                    hidden.push(id); // Ausblenden
                    row.style.display = 'none';
                }
                saveHiddenRows(hidden);
                e.preventDefault();
            }
        });
    });
})();
