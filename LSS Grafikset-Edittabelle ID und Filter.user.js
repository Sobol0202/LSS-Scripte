// ==UserScript==
// @name         LSS Grafikset-Edittabelle ID und Filter
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0
// @description  Fügt die ID am Anfang jeder Zeile in der Tabelle hinzu und ermöglicht das Filtern nach ID und Bezeichnung.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/*_graphics/*/edit
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Extrahieren der ID aus der href
    function getEinsatzID(href) {
        var parts = href.split('/');
        var id = parts[parts.length - 2];
        if (isNaN(id)) {
            return '-';
        }
        return id;
    }

    // Finde die Tabelle mit der Klasse 'table table-striped'
    var table = document.querySelector('table.table-striped');
    if (table) {
        // Füge "ID" im Tabellenkopf hinzu
        var headerRow = table.querySelector('tr');
        if (headerRow) {
            // ID-Spaltenkopf hinzufügen
            var idTh = document.createElement('th');
            idTh.textContent = 'ID';
            idTh.style.width = '4%'; // Breite der ID-Spalte festlegen
            headerRow.insertBefore(idTh, headerRow.firstChild);

            // Stil für die Eingabefelder
            var inputStyle = 'width: calc(70% - 10px); margin-right: 5px;';

            // Bezeichnungsfilter hinzufügen
            var bezeichnungTh = headerRow.querySelector('th:nth-child(2)');
            var bezeichnungFilterInput = document.createElement('input');
            bezeichnungFilterInput.type = 'text';
            bezeichnungFilterInput.placeholder = 'Bezeichnung Filtern';
            bezeichnungFilterInput.style.cssText = inputStyle;
            bezeichnungTh.appendChild(document.createTextNode(' '));
            bezeichnungTh.appendChild(bezeichnungFilterInput);

            // ID-Filter hinzufügen
            var idFilterInput = document.createElement('input');
            idFilterInput.type = 'text';
            idFilterInput.placeholder = 'ID';
            idFilterInput.style.cssText = inputStyle;
            idTh.appendChild(document.createTextNode(' '));
            idTh.appendChild(idFilterInput);
        }

        // Gehe durch jede Zeile der Tabelle, beginnend ab der zweiten Zeile (Index 1)
        var rows = table.querySelectorAll('tbody tr');
        for (var i = 1; i < rows.length; i++) {
            var row = rows[i];
            var thirdTd = row.querySelector('td:nth-child(3)');
            if (thirdTd) {
                var link = thirdTd.querySelector('a');
                if (link && link.href) {
                    var einsatzID = getEinsatzID(link.href);
                    var newTd = document.createElement('td');
                    newTd.textContent = einsatzID;
                    row.insertBefore(newTd, row.firstChild);
                }
            }
        }

        // Filterfunktion
        function filterTable() {
            var idFilter = idFilterInput.value.toLowerCase();
            var bezeichnungFilter = bezeichnungFilterInput.value.toLowerCase();

            for (var i = 1; i < rows.length; i++) {
                var row = rows[i];
                var idCell = row.querySelector('td:first-child');
                var bezeichnungCell = row.querySelector('td:nth-child(2)');

                var idMatch = idCell && idCell.textContent.toLowerCase().includes(idFilter);
                var bezeichnungMatch = bezeichnungCell && bezeichnungCell.textContent.toLowerCase().includes(bezeichnungFilter);

                if (idMatch && bezeichnungMatch) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        }

        // Event Listener für die Eingabefelder
        idFilterInput.addEventListener('input', filterTable);
        bezeichnungFilterInput.addEventListener('input', filterTable);
    }
})();
