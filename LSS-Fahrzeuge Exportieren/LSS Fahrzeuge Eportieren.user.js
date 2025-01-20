// ==UserScript==
// @name         LSS Fahrzeugexport zu csv
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0
// @description  Fügt einen Button hinzu, um Fahrzeugdaten als CSV herunterzuladen.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_getResourceURL
// @resource     icon https://github.com/Sobol0202/LSS-Scripte/raw/main/LSS-Fahrzeuge%20Exportieren/icons8-convertible-roof-warning-32.png
// ==/UserScript==

(function () {
    'use strict';

    // create a trigger-element
    const triggerLi = document.createElement('li');
    const triggerA = document.createElement('a');
    const triggerImg = document.createElement('img');
    triggerImg.src = GM_getResourceURL('icon');
    triggerImg.width = 24;
    triggerImg.height = 24;
    triggerA.href = '#';
    triggerA.append(triggerImg, '\xa0Fahrzeug Export');
    triggerLi.append(triggerA);

    triggerLi.addEventListener('click', async (event) => {
        event.preventDefault();
        fetchVehiclesAndExportCSV();
    });

    // insert the trigger-element to the DOM
    document
        .querySelector('#menu_profile + .dropdown-menu > li.divider')
        ?.before(triggerLi);

    async function fetchVehiclesAndExportCSV() {
        try {
            // Rufe Fahrzeugdaten über die API ab
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: 'https://www.leitstellenspiel.de/api/v2/vehicles',
                    onload: (res) => {
                        if (res.status === 200) {
                            resolve(JSON.parse(res.responseText));
                        } else {
                            reject(`Fehler beim Abrufen der API: ${res.statusText}`);
                        }
                    },
                    onerror: (err) => reject(`Fehler beim Abrufen der API: ${err}`),
                });
            });

            const vehicles = response.result;

            // Prepare CSV data
            let csvContent = 'Name;Zugewiesenes Personal\n'; // CSV Header
            csvContent += vehicles
                .map((vehicle) => `${vehicle.caption};${vehicle.assigned_personnel_count}`)
                .join('\n'); // CSV Rows

            // Create a Blob for the CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const blobUrl = URL.createObjectURL(blob);

            // Trigger CSV download
            GM_download({
                url: blobUrl,
                name: 'Fahrzeugdaten.csv',
                onload: () => console.log('Download abgeschlossen!'),
                onerror: (err) => console.error('Fehler beim Download:', err),
            });
        } catch (error) {
            console.error('Fehler:', error);
            alert('Fehler beim Abrufen oder Exportieren der Fahrzeugdaten.');
        }
    }
})();
