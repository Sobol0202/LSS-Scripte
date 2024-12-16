// ==UserScript==
// @name         LSS Fahrzeugverschiebung Sortieren und Filtern
// @version      1.2
// @description  Sortiere und filtere die Tabelle zum Verschieben von Fahrzeugen
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/vehicles/*/move
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Setze diese Variable auf true, um die Button-Klasse anzupassen
    const modifyButtons = true;

    // Filter-Status-Objekt, um die aktiven Filter zu speichern
    const filters = {
        name: '',
        availablePlaces: false
    };

    // Hilfsfunktion zum Sortieren der Tabellenzeilen
    function sortTable(table, colIndex, ascending) {
        const tbody = table.tBodies[0];
        const rows = Array.from(tbody.rows).slice(1); // Überspringe die Kopfzeile
        rows.sort((a, b) => {
            const aText = a.cells[colIndex].textContent.trim().toLowerCase();
            const bText = b.cells[colIndex].textContent.trim().toLowerCase();
            return ascending ? aText.localeCompare(bText) : bText.localeCompare(aText);
        });
        rows.forEach(row => tbody.appendChild(row));
    }

    // Hilfsfunktion zum Umschalten des Pfeilindikators
    function toggleSortIndicator(header, ascending) {
        const arrow = ascending ? ' ↓' : ' ↑';
        const textNode = header.querySelector('.header-text');
        if (textNode) {
            textNode.textContent = textNode.textContent.replace(/[ ↓↑✓]$/, '') + arrow;
        }
    }

    // Hilfsfunktion zum Anwenden der Filterbedingungen
    function applyFilters(table) {
        const tbody = table.tBodies[0];
        const rows = Array.from(tbody.rows).slice(1); // Überspringe die Kopfzeile
        rows.forEach(row => {
            const nameText = row.cells[0].textContent.trim().toLowerCase();
            const availablePlaces = parseInt(row.cells[1].textContent.trim(), 10);
            const vehiclesOnStation = parseInt(row.cells[2].textContent.trim(), 10);

            const nameFilterActive = filters.name ? nameText.includes(filters.name.toLowerCase()) : true;
            const availablePlacesFilterActive = filters.availablePlaces ? availablePlaces > vehiclesOnStation : true;

            row.style.display = nameFilterActive && availablePlacesFilterActive ? '' : 'none';
        });
    }

    // Hilfsfunktion zum Hinzufügen der btn-xs Klasse zu Buttons
    function modifyButtonClasses() {
        const buttons = document.querySelectorAll('a.btn.btn-success');
        buttons.forEach(button => {
            if (!button.classList.contains('btn-xs')) {
                button.classList.add('btn-xs');
            }
        });
    }

    // Wähle die Tabelle und die Header sofort aus
    const table = document.querySelector('table.table-striped.table');
    if (table) {
        const nameHeader = Array.from(table.querySelectorAll('th')).find(th => th.textContent.trim() === 'Name');
        const availablePlacesHeader = Array.from(table.querySelectorAll('th')).find(th => th.textContent.trim() === 'Verfügbare Plätze');

        if (nameHeader) {
            // Wickele den Header-Text in ein span-Tag für einfache Manipulation
            const headerText = document.createElement('span');
            headerText.className = 'header-text';
            headerText.textContent = 'Name';
            nameHeader.textContent = '';
            nameHeader.appendChild(headerText);

            // Füge das Filter-Eingabefeld hinzu
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Filter...';
            input.style.marginLeft = '10px';
            input.addEventListener('input', () => {
                filters.name = input.value;
                applyFilters(table);
            });

            // Verhindere, dass der Klick auf das Eingabefeld das Sortieren auslöst
            input.addEventListener('click', (event) => {
                event.stopPropagation();
            });

            nameHeader.appendChild(input);

            // Füge den Klick-Eventlistener zum Sortieren hinzu
            let ascending = true;
            nameHeader.addEventListener('click', (event) => {
                if (event.target !== input) { // Schließe Klicks auf das Eingabefeld aus
                    sortTable(table, nameHeader.cellIndex, ascending);
                    toggleSortIndicator(nameHeader, ascending);
                    applyFilters(table); // Wende die Filter nach dem Sortieren erneut an
                    ascending = !ascending; // Umschalten der Sortierreihenfolge für den nächsten Klick
                }
            });
        }

        if (availablePlacesHeader) {
            // Wickele den Header-Text in ein span-Tag für einfache Manipulation
            const headerText = document.createElement('span');
            headerText.className = 'header-text';
            headerText.textContent = 'Verfügbare Plätze';
            availablePlacesHeader.textContent = '';
            availablePlacesHeader.appendChild(headerText);

            // Füge ein Häkchen-Element hinzu
            const checkmark = document.createElement('span');
            checkmark.textContent = ' ✓';
            checkmark.style.display = 'none'; // Verstecke das Häkchen standardmäßig
            availablePlacesHeader.appendChild(checkmark);

            // Füge den Klick-Eventlistener zum Filtern hinzu
            availablePlacesHeader.addEventListener('click', () => {
                filters.availablePlaces = !filters.availablePlaces;
                applyFilters(table);
                checkmark.style.display = filters.availablePlaces ? 'inline' : 'none';
            });
        }
    }

    // Führe die Funktion zum Anpassen der Button-Klassen aus, wenn aktiviert
    if (modifyButtons) {
        modifyButtonClasses();
    }
})();
