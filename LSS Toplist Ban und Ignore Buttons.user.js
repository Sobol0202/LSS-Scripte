// ==UserScript==
// @name         LSS Toplist Ban und Ignore Buttons
// @namespace    www.leitstellenspiel.de
// @version      0.9
// @description  Fügt buttons zum Bannen und ignorieren in die Toplist-Tabelle ein.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/toplist*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Überprüfen, ob der Benutzer Admin oder Co-Admin ist
    async function checkAdminRole() {
        // Abrufen von Benutzerdaten über die Credits-API
        const creditsResponse = await fetch('https://www.leitstellenspiel.de/api/credits');
        const creditsData = await creditsResponse.json();
        const userName = creditsData.user_name;

        // Abrufen von Verbandsdaten über die Verbands-API
        const allianceResponse = await fetch('https://www.leitstellenspiel.de/api/allianceinfo');
        const allianceData = await allianceResponse.json();

        // Überprüfen, ob der Benutzer Adminrechte hat
        const user = allianceData.users.find(u => u.name === userName);
        //console.log('Benutzer:', user);
        return user && (user.roles.includes('Verbands-Admin') || user.roles.includes('Verbands-Co-Admin'));
    }

    // Finden der Tabelle mit der Klasse "table-striped"
    const table = document.querySelector('table.table-striped');

    if (table) {
        // CSRF-Token abrufen
        const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        // Alle Zeilen im Tabellenkörper abrufen
        const rows = table.querySelectorAll('tbody > tr');

        // Überprüfen, ob der aktuelle Benutzer Admin oder Co-Admin ist
        checkAdminRole().then(isAdmin => {
            //console.log('isAdmin:', isAdmin);
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                // Benutzer-ID aus dem href-Attribut extrahieren
                const userId = row.querySelector('a').getAttribute('href').match(/\d+/)[0];
                //console.log('Benutzer-ID:', userId);

                // Ignorieren-Button erstellen und hinzufügen
                const ignoreButton = document.createElement('button');
                ignoreButton.textContent = 'Ignorieren';
                ignoreButton.className = 'btn btn-xs btn-danger';
                ignoreButton.addEventListener('click', function() {
                    // Aufrufen der Ignorieren-URL mit Benutzer-ID
                    fetch(`/ignoriert/hinzufuegen/${userId}?user=${userId}`);
                });

                // Zelle für die Buttons erstellen und hinzufügen
                const buttonCell = document.createElement('td');
                buttonCell.appendChild(ignoreButton);
                row.appendChild(buttonCell);

                // Wenn der Benutzer Admin ist, Ban-Button erstellen und hinzufügen
                if (isAdmin) {
                    const banButton = document.createElement('button');
                    banButton.textContent = 'Bannen';
                    banButton.className = 'btn btn-xs btn-danger';
                    banButton.addEventListener('click', function() {
                        // Aufrufen der Bann-URL mit Benutzer-ID und CSRF-Token
                        fetch(`/allianceIgnore/${userId}/add`, {
                            method: 'POST',
                            headers: {
                                'X-CSRF-Token': authToken
                            }
                        });
                    });

                    // Ban-Button zur Zelle hinzufügen
                    buttonCell.appendChild(banButton);
                }
            }
        });
    }
})();
