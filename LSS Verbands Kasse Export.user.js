// ==UserScript==
// @name         LSS Verband Kasse Export
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Exportiert Mitglieder und ihre eingezahlten Beträge in die Zwischenablage
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/verband/kasse*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Kopieren in die Zwischenablage
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    // Hauptfunktion zum Extrahieren der Mitglieder und Beträge
    function extractData() {
        const table = document.getElementById('alliance-finances-earnings');
        if (!table) {
            console.error('Tabelle nicht gefunden!');
            return;
        }

        let data = '';

        // Iteriere durch jede Zeile in der Tabelle
        const rows = table.getElementsByTagName('tr');
        for (let i = 1; i < rows.length; i++) {
            const columns = rows[i].getElementsByTagName('td');
            const name = columns[0].innerText.trim();
            const amount = columns[1].innerText.trim();

            // Füge Namen und Beträge zur Datenzeichenfolge hinzu
            data += `${name}\t${amount}\n`;
        }

        // Kopiere die Daten in die Zwischenablage
        copyToClipboard(data);

        // Ändere den Button-Stil und Text
        const exportButton = document.getElementById('exportButton');
        if (exportButton) {
            exportButton.classList.add('btn', 'btn-success');
            exportButton.innerText = 'Daten kopiert';

            // Setze nach 2 Sekunden den Button zurück
            setTimeout(() => {
                exportButton.classList.remove('btn-success');
                exportButton.innerText = 'Daten exportieren';
            }, 2000);
        } else {
            console.error('Export-Button nicht gefunden!');
        }

        //console.log('Daten wurden in die Zwischenablage kopiert:');
        //console.log(data);
    }

    // Füge Export-Button hinzu
    function addExportButton() {
        const exportButton = document.createElement('button');
        exportButton.id = 'exportButton';
        exportButton.innerText = 'Daten exportieren';
        exportButton.classList.add('btn', 'btn-default');
        exportButton.style.marginLeft = '10px';
        exportButton.addEventListener('click', extractData);

        // Finde den vorhandenen Button mit dem href "/verband/kasse?type=monthly"
        const monthlyButton = document.querySelector('a[href="/verband/kasse?type=monthly"]');
        if (monthlyButton) {
            // Füge den Export-Button rechts neben dem monatlichen Button hinzu
            monthlyButton.parentNode.appendChild(exportButton);
        } else {
            console.error('Monatlicher Button nicht gefunden!');
        }
    }

    // Füge den Export-Button hinzu, wenn die Tabelle vorhanden ist
    if (document.getElementById('alliance-finances-earnings')) {
        addExportButton();
    }
})();
