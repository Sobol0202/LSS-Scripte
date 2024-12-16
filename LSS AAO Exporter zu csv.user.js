// ==UserScript==
// @name         LSS-AAO Exporter zu csv
// @namespace    www.leitstellenspiel.de
// @version      0.1
// @description  Exportiert die AAOs in eine CSV
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/aaos
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Edit-Links auslesen
    function extractAAOEditLinks(tabContent) {
        const editLinks = tabContent.querySelectorAll('.aao_btn_group a[href^="/aaos/"][href$="/edit"]');
        return Array.from(editLinks).map(link => link.href);
    }

    // Input-IDs und Werte auslesen
    function extractInputData(tabContent) {
        const inputs = tabContent.querySelectorAll('input');
        const inputData = {};
        inputs.forEach(input => {
            inputData[input.id] = input.value;
        });
        return inputData;
    }

    // Function to convert array of objects to CSV
    function convertArrayOfObjectsToCSV(data) {
        const csvContent = [];
        const keys = Object.keys(data[0]);
        csvContent.push(keys.join(',')); // Header row
        data.forEach(item => {
            const values = keys.map(key => item[key]);
            csvContent.push(values.join(','));
        });
        return csvContent.join('\n');
    }

    // Function to download CSV file
    function downloadCSV(data, filename) {
        const csv = convertArrayOfObjectsToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

    // Function to fetch URL content asynchronously
    async function fetchURLContent(url, allData, visitedLinks) {
        if (visitedLinks.has(url)) return;
        visitedLinks.add(url);

        const response = await fetch(url);
        if (response.ok) {
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const tabContent = doc.querySelector('.tab-content');
            const inputData = extractInputData(tabContent);
            allData.push({ ...inputData, id: url.match(/\d+/)[0] });
        } else {
            console.error('Error fetching URL:', url);
        }
    }

    // Event listener für den Export-Button-Klick
    document.addEventListener('click', async function(event) {
        const exportButton = document.querySelector('button.export-button');
        if (event.target === exportButton) {
            const allData = [];
            const visitedLinks = new Set();
            const tabContents = document.querySelectorAll('.tab-content');
            for (let i = 0; i < tabContents.length; i++) {
                const editLinks = extractAAOEditLinks(tabContents[i]);
                for (let j = 0; j < editLinks.length; j++) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    await fetchURLContent(editLinks[j], allData, visitedLinks);
                }
            }
            downloadCSV(allData, 'aao_data.csv');
        }
    });

    // Exportbutton erzeugen
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export AAO Edit Links';
    exportButton.className = 'export-button';
    document.body.insertBefore(exportButton, document.body.firstChild); // Insert before other content
})();
