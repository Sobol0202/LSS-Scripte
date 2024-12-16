// ==UserScript==
// @name         LSS Nur Zugewiesenes Personal zeigen
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Fügt einen Button ein, der nur Zugewiesenes Personal anzeigt.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/vehicles/*/zuweisung
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Ein- und Ausblenden von Zeilen basierend auf dem Text der Buttons
    function toggleRows() {
        var rows = document.querySelectorAll('#personal_table tbody tr');
        var button = document.getElementById('toggleButton');
        var showAll = button.classList.contains('btn-danger');

        rows.forEach(function(row) {
            var buttons = row.querySelectorAll('a.btn.btn-default.btn-assigned');
            if (buttons.length > 0 || showAll) {
                // Zeile einblenden
                row.style.display = 'table-row';
            } else {
                // Zeile ausblenden
                row.style.display = 'none';
            }
        });

        // Button-Stil aktualisieren
        if (showAll) {
            button.classList.remove('btn-danger');
            button.classList.add('btn-default');
            button.textContent = 'Nur zugewiesenes Personal anzeigen';
        } else {
            button.classList.remove('btn-default');
            button.classList.add('btn-danger');
            button.textContent = 'Alle Mitarbeiter anzeigen';
        }
    }

    // Funktion zum Erstellen des Buttons und Hinzufügen des Klickereignisses
    function addButton() {
        var button = document.createElement('button');
        button.textContent = 'Nur zugewiesenes Personal anzeigen';
        button.className = 'btn btn-default';
        button.style.float = 'right';
        button.id = 'toggleButton';
        button.addEventListener('click', function() {
            toggleRows();
        });
        // Button über der Tabelle einfügen
        var table = document.getElementById('personal_table');
        table.parentNode.insertBefore(button, table);
    }

    // Initialisierung
    addButton();
})();
