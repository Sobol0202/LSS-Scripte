// ==UserScript==
// @name         LSS Protokoll VBGSL+Event Export
// @version      1.0
// @description  Fügt einen Button hinzu, um VBGSL und Events zu exportieren.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/alliance_logfiles?*logfile_type=27*
// @match        https://www.leitstellenspiel.de/alliance_logfiles?*logfile_type=28*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Hinzufügen des Export-Buttons
    function addExportButton() {
        let dangerButton = document.querySelector('.btn.btn-danger');
        if (!dangerButton) return;

        let exportButton = document.createElement('button');
        exportButton.textContent = 'CSV Export';
        exportButton.className = 'btn btn-success';
        exportButton.style.marginLeft = '10px';
        exportButton.addEventListener('click', fetchAllPages);

        dangerButton.parentNode.insertBefore(exportButton, dangerButton.nextSibling);
    }

    // Funktion zum Abrufen aller Seiten und Speichern der Daten
    async function fetchAllPages() {
        let exportButton = document.querySelector('.btn.btn-success');
        if (exportButton) exportButton.textContent = 'Wird abgerufen...';

        let lastPage = await getLastPageNumber();
        let allData = [];

        for (let i = 1; i <= lastPage; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));
            let pageData = await fetchPageData(i);
            allData = allData.concat(pageData);
        }

        downloadCSV(allData);
        if (exportButton) exportButton.textContent = 'CSV Export';
    }

    // Funktion zur Bestimmung der letzten Seite
    async function getLastPageNumber() {
        let pagination = document.querySelector('.pagination.pagination');
        if (!pagination) return 1;
        let lastPageLink = pagination.querySelector('li:nth-last-child(2) a');
        return lastPageLink ? parseInt(new URL(lastPageLink.href).searchParams.get('page')) : 1;
    }

    // Funktion zum Abrufen der Daten einer einzelnen Seite
    async function fetchPageData(page) {
        let currentType = new URL(window.location.href).searchParams.get('logfile_type') || '27';
        let url = `https://www.leitstellenspiel.de/alliance_logfiles?logfile_type=${currentType}&page=${page}`;
        let response = await fetch(url);
        let text = await response.text();
        let parser = new DOMParser();
        let doc = parser.parseFromString(text, 'text/html');

        let rows = doc.querySelectorAll('.table.table-striped tbody tr');
        let data = [];

        // Durchläuft alle Tabellenzeilen und extrahiert die relevanten Daten
        rows.forEach(row => {
            let cols = row.querySelectorAll('td');
            if (cols.length >= 3) {
                let datum = cols[0].querySelector('span')?.getAttribute('data-log-time') || '';
                let ausloeser = cols[1].innerText.trim();
                let bezeichnung = cols[2].innerText.replace(/\s+/g, ' ').trim(); // Entfernt unnötige Umbrüche
                data.push([datum, ausloeser, bezeichnung]);
            }
        });
        return data;
    }

    // Funktion zum Erstellen und Herunterladen der CSV-Datei
    function downloadCSV(data) {
        let csvContent = '\ufeffDatum;Zeit;Auslöser;Bezeichnung\n';
        data.forEach(row => {
            csvContent += row.map(v => `"${v}"`).join(';') + '\n';
        });

        let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        let link = document.createElement('a');
        let url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'leitstellenspiel_log.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Startet das Skript, indem der Export-Button hinzugefügt wird
    addExportButton();
})();
