// ==UserScript==
// @name         LSS Rabattrechner vom letzten Monat
// @version      1.0
// @description  Berechnet den Rabattwert für alle Mitglieder abhängig von ihrem im letzten Monat eingezahlten Betrag.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/verband/kasse?scroll=-1&type=monthly
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Abrufen der verdienten Credits eines Spielers über sein Profil
    async function fetchUserCredits(profileUrl) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: profileUrl,
                onload: function(response) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');
                    const userInfoDiv = doc.querySelector('#userinfo');
                    if (userInfoDiv) {
                        const earnedCredits = parseInt(userInfoDiv.getAttribute('data-credits-earned') || '0', 10);
                        resolve(earnedCredits);
                    } else {
                        resolve(0);
                    }
                },
                onerror: function() {
                    resolve(0);
                }
            });
        });
    }

    // Funktion zum Runden auf die nächste Zehnerstelle
    function roundToNearestTen(value) {
        return Math.round(value / 10) * 10;
    }

    // Funktion zum Senden der Rabattwerte an den Server
    async function applyDiscounts() {
        const tableRows = document.querySelectorAll('#alliance-finances-earnings .table-striped tbody tr');
        for (const row of tableRows) {
            const nameCell = row.querySelector('td:first-child a');
            const discountCell = row.querySelector('td:last-child');
            if (!nameCell || !discountCell) continue;

            // Extrahiere die Profil-ID aus der URL
            const profileIdMatch = nameCell.href.match(/\/profile\/(\d+)/);
            if (!profileIdMatch) continue;

            const profileId = profileIdMatch[1];
            let discountValue = parseInt(discountCell.dataset.discountValue || '0', 10);
            if (!profileId || isNaN(discountValue)) continue;

            // Begrenze den maximalen Rabatt auf 100%
            if (discountValue > 100) discountValue = 100;
            const discountUrl = `https://www.leitstellenspiel.de/verband/discount/${profileId}/${discountValue / 10}`;
            GM_xmlhttpRequest({
                method: 'GET',
                url: discountUrl,
                onload: function() {
                    discountCell.textContent = `${discountValue}% ✔`;
                }
            });
            await new Promise(r => setTimeout(r, 100)); // 100ms Pause zwischen den Anfragen
        }
    }

    // Funktion zur Verarbeitung der Tabelle und Berechnung der Rabatte
    async function processTable() {
        const table = document.querySelector('#alliance-finances-earnings .table-striped');
        if (!table) return;

        // Füge eine neue Spalte "Rabatt" in den Tabellenkopf ein
        const headerRow = table.querySelector('thead tr');
        if (headerRow) {
            const discountHeader = document.createElement('th');
            discountHeader.textContent = 'Rabatt';
            discountHeader.style.cursor = 'pointer';
            discountHeader.addEventListener('click', applyDiscounts);
            headerRow.appendChild(discountHeader);
        }

        // Füge eine neue Spalte für den Rabatt in jede Zeile ein
        const tableRows = document.querySelectorAll('#alliance-finances-earnings .table-striped tbody tr');
        tableRows.forEach(row => {
            const discountCell = document.createElement('td');
            discountCell.textContent = 'Berechnung...';
            row.appendChild(discountCell);
        });

        // Berechnung der Rabatte für jede Zeile
        for (const row of tableRows) {
            const nameCell = row.querySelector('td:first-child a');
            const amountCell = row.querySelector('td:nth-child(2)');
            const discountCell = row.querySelector('td:last-child');
            if (!nameCell || !amountCell || !discountCell) continue;

            const profileUrl = nameCell.href;
            const depositedAmount = parseInt(amountCell.textContent.replace(/\D/g, ''), 10);

            if (profileUrl && depositedAmount) {
                const userCredits = await fetchUserCredits(profileUrl);
                let discount = 100;
                if (userCredits >= 1000000) {
                    discount = ((depositedAmount * 100) / userCredits) * 100;
                    discount = roundToNearestTen(discount);
                    if (discount > 100) discount = 100;
                }
                discountCell.dataset.discountValue = discount;
                discountCell.textContent = `${discount}%`;
                await new Promise(r => setTimeout(r, 100));
            }
        }
    }

    // Starte die Verarbeitung der Tabelle
    processTable();
})();
