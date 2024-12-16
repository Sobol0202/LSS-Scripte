// ==UserScript==
// @name         LSS Personal Filter
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Fügt Buttons zum Filtern von Personal hinzu
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/vehicles/*/zuweisung
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Initialisierung des ursprünglichen Anzeigezustands
    var originalDisplayStates = {};

    function saveOriginalDisplayStates() {
        var rows = document.querySelectorAll('#personal_table tbody tr');

        rows.forEach(function(row, index) {
            originalDisplayStates[index] = row.style.display;
        });
    }

    function restoreOriginalDisplayStates() {
        var rows = document.querySelectorAll('#personal_table tbody tr');

        rows.forEach(function(row, index) {
            row.style.display = originalDisplayStates[index];
        });
    }

    // Funktion zum Ein- und Ausblenden von Zeilen basierend auf dem Text der Buttons
    function toggleRows(button, showAssigned) {
        var rows = document.querySelectorAll('#personal_table tbody tr');

        rows.forEach(function(row) {
            var buttons = row.querySelectorAll('a.btn.btn-default.btn-assigned');
            var hasAssigned = buttons.length > 0;
            var hasWarning = row.querySelector('a.btn.btn-warning');

            if (((hasAssigned && showAssigned) || (!hasAssigned && !showAssigned)) && (!hasWarning || showAssigned)) {
                // Zeile einblenden
                row.style.display = '';
            } else {
                // Zeile ausblenden
                row.style.display = 'none';
            }
        });

        // Button-Stil aktualisieren
        button.classList.toggle('active-filter', !showAssigned);
    }

    // Funktion zum Erstellen der Filterbuttons und Hinzufügen des Klickereignisses
    function addFilterButton(text, className, showAssigned) {
        var button = document.createElement('button');
        button.textContent = text;
        button.className = 'btn ' + className;
        button.style.float = 'right';

        button.addEventListener('click', function() {
            toggleRows(button, showAssigned);
        });

        // Button über der Tabelle einfügen
        var table = document.getElementById('personal_table');
        table.parentNode.insertBefore(button, table);
    }

    // Initialisierung
    saveOriginalDisplayStates();
    addFilterButton('Nur zugewiesenes Personal anzeigen', 'btn-default', true);
    addFilterButton('Nur unzugewiesenes Personal anzeigen', 'btn-default', false);

    // Hinzufügen des Reset-Buttons
    var resetButton = document.createElement('button');
    resetButton.textContent = 'Reset';
    resetButton.className = 'btn btn-default';
    resetButton.style.float = 'right';
    resetButton.addEventListener('click', function() {
        restoreOriginalDisplayStates();
        var filterButtons = document.querySelectorAll('.btn.active-filter');
        filterButtons.forEach(function(button) {
            button.classList.remove('active-filter');
        });
    });
    var table = document.getElementById('personal_table');
    table.parentNode.insertBefore(resetButton, table);
})();
