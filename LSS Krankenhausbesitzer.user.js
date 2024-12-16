// ==UserScript==
// @name         LSS Sprechwunsch Krankenhausbesitzer
// @namespace    www.leitstellenspiel.de
// @version      1.1
// @description  Zeigt den Namen des Besitzers eines Krankenhauses in der Sprechwunschliste an.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/vehicles/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function showOwnerForHospital(buildingRow, hospitalId) {
//        console.log('Fetching owner for hospital', hospitalId);
        const response = await fetch(`https://www.leitstellenspiel.de/buildings/${hospitalId}`);
        const responseText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(responseText, 'text/html');
        const ownerNameElement = doc.querySelector('a[href^="/profile/"]');
        if (ownerNameElement) {
            const ownerName = ownerNameElement.textContent.trim();
            buildingRow.querySelector('td:first-child').title = `Besitzer: ${ownerName}`;
//            console.log('Owner found:', ownerName);
        }
    }

    function attachHoverListeners(row) {
        const hospitalIdElement = row.querySelector('[id^="div_free_beds_"]');
        if (hospitalIdElement) {
            const hospitalId = hospitalIdElement.id.replace('div_free_beds_', '');
//            console.log('Attaching hover listener for row:', hospitalId);

            row.addEventListener('mouseenter', async function() {
//                console.log('Mouse enter row:', hospitalId);
                await showOwnerForHospital(row, hospitalId);
            });

            row.addEventListener('mouseleave', function() {
//                console.log('Mouse leave row:', hospitalId);
                row.querySelector('td:first-child').title = '';
            });
        }
    }

    const targetTable = document.getElementById('alliance-hospitals');
    if (targetTable) {
        const rows = targetTable.querySelectorAll('tbody tr');
        rows.forEach(attachHoverListeners);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes) {
                    const addedRows = Array.from(mutation.addedNodes)
                        .filter(node => node.nodeName === 'TR' && node.querySelector('[id^="div_free_beds_"]'));

                    addedRows.forEach(attachHoverListeners);
                }
            });
        });

        observer.observe(targetTable.querySelector('tbody'), { childList: true });
    }
})();
