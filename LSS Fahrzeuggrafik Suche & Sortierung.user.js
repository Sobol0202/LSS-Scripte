// ==UserScript==
// @name         LSS Fahrzeuggrafik Suche & Sortierung
// @version      1.0
// @description  Fügt Sortierung und Suche in der Fahrzeuggrafiktabelle hinzu
// @author       Sobol
// @match        https://www.leitstellenspiel.de/vehicle_graphics/*/edit
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const table = document.querySelector('.table.table-striped');
    if(!table) return;

    const tbody = table.querySelector('tbody');
    if(!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    const headerRow = rows.shift();
    const dataRows = rows;
    const ths = headerRow.querySelectorAll('th, td');

    // Suchfeld in neue Kopfzeile einfügen
    const searchRow = document.createElement('tr');
    const searchTh = document.createElement('th');
    searchTh.colSpan = headerRow.children.length;

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Suche Bezeichnung...';
    searchInput.style.width = '100%';

    searchInput.addEventListener('input', () => {
        const filter = searchInput.value.toLowerCase();
        dataRows.forEach(row => {
            const text = row.cells[0].innerText.trim().toLowerCase();
            row.style.display = text.includes(filter) ? '' : 'none';
        });
    });

    searchTh.appendChild(searchInput);
    searchRow.appendChild(searchTh);
    tbody.insertBefore(searchRow, headerRow.nextSibling);

    // Sortierung
    let sortAsc = true;
    const bezeichnungCell = ths[0];
    bezeichnungCell.style.cursor = 'pointer';
    bezeichnungCell.title = 'Nach Bezeichnung sortieren';
    bezeichnungCell.addEventListener('click', () => {

        const sorted = dataRows.sort((a, b) => {
            const textA = a.cells[0].innerText.trim().toLowerCase();
            const textB = b.cells[0].innerText.trim().toLowerCase();
            if(textA < textB) return sortAsc ? -1 : 1;
            if(textA > textB) return sortAsc ? 1 : -1;
            return 0;
        });

        sorted.forEach(r => tbody.appendChild(r));
        sortAsc = !sortAsc;
    });
})();
