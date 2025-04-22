// ==UserScript==
// @name         LSS Fahrzeuge Wachenweise verschrotten
// @version      1.0
// @description  Fügt einen Button zum Verschrotten aller Fahrzeuge einer Wache hinzu
// @author       Sobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // CSRF-Token aus dem Meta-Tag auslesen
    const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    // Funktion zum Hinzufügen des neuen Buttons
    function addScrapAllButton() {
        // Vorhandenen "Abreißen (Keine Gutschrift!)"-Button finden
        const deleteButton = document.querySelector('#delete_no_refund');
        if (!deleteButton) return;

        // Neuen Button erstellen
        const scrapButton = document.createElement('a');
        scrapButton.className = 'btn btn-danger';
        scrapButton.style.marginLeft = '10px';
        scrapButton.innerHTML = '<span class="glyphicon glyphicon-trash"></span> Alle Fahrzeuge verschrotten';

        // Klick-Event für den Button
        scrapButton.addEventListener('click', async () => {
            // Fahrzeugtabelle finden
            const vehicleTable = document.getElementById('vehicle_table');
            if (!vehicleTable) {
                alert('Fahrzeugtabelle nicht gefunden.');
                return;
            }

            // Alle Fahrzeug-IDs auslesen
            const vehicleLinks = vehicleTable.querySelectorAll('td:nth-child(2) a[href^="/vehicles/"]');
            const vehicleIDs = Array.from(vehicleLinks).map(link => {
                const match = link.getAttribute('href').match(/\/vehicles\/(\d+)/);
                return match ? match[1] : null;
            }).filter(id => id !== null);

            // Sicherheitsabfrage
            const confirmText = `Sollen wirklich ${vehicleIDs.length} Fahrzeuge dieser Wache verschrottet werden?`;
            if (!confirm(confirmText)) return;

            // Für jedes Fahrzeug eine DELETE-Anfrage senden
            for (let i = 0; i < vehicleIDs.length; i++) {
                const id = vehicleIDs[i];
                await fetch(`/vehicles/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-Token': authToken
                    }
                }).then(response => {
                    if (response.ok) {
                        console.log(`Fahrzeug ${id} erfolgreich verschrottet.`);
                    } else {
                        console.error(`Fehler beim Verschrotten von Fahrzeug ${id}`);
                    }
                });

                // 100ms Pause zwischen den Requests
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Seite nach Abschluss neu laden
            location.reload();
        });

        // Neuen Button neben dem "Abreißen"-Button einfügen
        deleteButton.parentNode.insertBefore(scrapButton, deleteButton.nextSibling);
    }

    addScrapAllButton();
})();
