// ==UserScript==
// Metadaten des Benutzerskripts
// @name         LSS-VerbandsKH export
// @namespace    https://www.leitstellenspiel.de/
// @version      0.1alpha
// @description  Liest alle Verbandskrankenhäuser aus und exportiert sie als CSV-Datei.
// @match        https://www.leitstellenspiel.de/vehicles/*
// @author       MissSobol
// @grant        none
// ==/UserScript==

// Anonyme Funktion, die sofort ausgeführt wird
(function() {
    'use strict';

    // Funktion zur Anzeige eines Popups mit einer Nachricht
    function showPopup(message) {
        // Erstelle ein Popup-Element
        const popup = document.createElement('div');
        popup.style.position = 'fixed';
        popup.style.bottom = '20px';
        popup.style.right = '20px';
        popup.style.zIndex = '9999';
        popup.style.padding = '10px';
        popup.style.background = 'rgba(0, 0, 0, 0.8)';
        popup.style.color = 'white';
        popup.style.borderRadius = '5px';
        popup.textContent = message;

        // Füge das Popup der Webseite hinzu
        document.body.appendChild(popup);

        // Entferne das Popup nach 3 Sekunden
        setTimeout(() => {
            popup.remove();
        }, 3000); // Popup nach 3 Sekunden entfernen
    }

    // Funktion zur Aktualisierung des Zustands des Export-Buttons
    function toggleButtonState(isLoading) {
        const button = document.getElementById('exportButton');
        if (isLoading) {
            button.style.backgroundColor = 'red';
            button.textContent = 'Daten werden gesammelt...';
            button.disabled = true;
        } else {
            button.style.backgroundColor = ''; // Zurücksetzen auf Standardfarbe
            button.textContent = 'Daten als CSV exportieren';
            button.disabled = false;
        }
    }

    // Asynchrone Funktion zum Abrufen von Gebäudedaten
    async function getBuildingData() {
        toggleButtonState(true); // Button in Ladezustand versetzen

        const table = document.getElementById('alliance-hospitals');
        if (!table) return;

        const buildings = table.querySelectorAll('tr');
        const buildingArray = Array.from(buildings);

        const csvData = [];

        // Iteriere über jedes Gebäude in der Liste
        for (const building of buildingArray) {
            // Hole Elemente für Name, ID und Abgabe des Gebäudes
            const nameElement = building.querySelector('td:first-child');
            const idElement = building.querySelector('div[id^="div_free_beds_"]');
            const abgabeElement = building.querySelector('td:nth-child(4)');

            if (nameElement && idElement && abgabeElement) {
                // Extrahiere Informationen aus den Elementen
                const name = nameElement.textContent.trim();
                const id = idElement.id.replace('div_free_beds_', '');
                const abgabe = abgabeElement.textContent.trim();

                try {
                    // Sende eine Anfrage, um Besitzerinformationen abzurufen
                    const response = await fetch(`https://www.leitstellenspiel.de/buildings/${id}`);
                    const data = await response.text();
                    const parser = new DOMParser();
                    const htmlDoc = parser.parseFromString(data, 'text/html');
                    const ownerNameElement = htmlDoc.querySelector('a[href^="/profile/"]');
                    const ownerName = ownerNameElement ? ownerNameElement.textContent : 'Unbekannt';

                    // Füge die Daten zur CSV-Datenliste hinzu
                    csvData.push([name, abgabe, ownerName]);

                } catch (error) {
                    console.error('Fehler beim Abrufen von Besitzerdaten:', error);
                }
            }
        }

        // CSV-Header und -Inhalt erstellen
        const csvHeader = 'Gebäudename,Abgabe,Besitzername\n';
        const csvContent = csvData.map(createCsvRow).join('');

        // Blob erstellen und CSV-Datei herunterladen
        const blob = new Blob([csvHeader, csvContent], { type: 'text/csv;charset=utf-8;' });
        const filename = 'building_data.csv';

        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, filename);
        } else {
            const link = document.createElement('a');
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }

        toggleButtonState(false); // Button zurück zum normalen Zustand setzen
        showPopup('CSV-Datei wurde heruntergeladen!');
    }

    // Funktion zur Erstellung einer CSV-Zeile aus Daten
    function createCsvRow(data) {
        return data.map(value => `"${value}"`).join(',') + '\n';
    }

    // Funktion zur Erstellung des Export-Buttons
    function createExportButton() {
        const button = document.createElement('button');
        button.textContent = 'Daten als CSV exportieren';
        button.id = 'exportButton'; // ID für Styling und Manipulation
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.zIndex = '9999';

        // Event-Listener für den Klick auf den Button hinzufügen
        button.addEventListener('click', getBuildingData);

        // Button zur Webseite hinzufügen
        document.body.appendChild(button);
    }

    // Erstelle den Export-Button
    createExportButton();
})();
