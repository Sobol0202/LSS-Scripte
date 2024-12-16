// ==UserScript==
// @name         LSS Laufleistung 30 Tage
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Fügt die Laufleistung der letzten 30 Tage auf der Fahrzeugseite hinzu.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/vehicles/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion, um die Fahrzeug-ID aus der URL zu extrahieren
    function getVehicleIdFromUrl() {
        const urlParts = window.location.href.split('/');
        return urlParts[urlParts.length - 1];
    }

    // Funktion, um die Laufleistung der letzten 30 Tage abzurufen und in das HTML-Element einzufügen
    function insertDistance30d() {
        const vehicleId = getVehicleIdFromUrl();

        //console.log('Fahrzeug-ID:', vehicleId);

        // API-Aufruf, um die Laufleistung der letzten 30 Tage zu erhalten
        fetch(`https://www.leitstellenspiel.de/api/v1/vehicle_distances.json`)
            .then(response => response.json())
            .then(data => {
                // Filtern Sie die Daten basierend auf der Fahrzeug-ID
                const filteredData = data.result.filter(item => item.vehicle_id === parseInt(vehicleId));

                if (filteredData.length > 0) {
                    const distance30d = filteredData[0].distance_km_30d.toFixed(2).replace('.', ',');
                    //console.log('Laufleistung 30 Tage:', distance30d);

                    const vehicleDetails = document.getElementById('vehicle_details');
                    //console.log('Fahrzeugdetails-Element:', vehicleDetails);

                    // HTML-Element erstellen und einfügen
                    const distanceElement = document.createElement('div');
                    distanceElement.className = 'row';
                    distanceElement.innerHTML = `
                        <div class="col-xs-6"><strong>Laufleistung 30 Tage:</strong></div>
                        <div class="col-xs-6" id="vehicle-attr-distance-30d">${distance30d} km</div>
                    `;

                    vehicleDetails.appendChild(distanceElement);
                    //console.log('Laufleistung 30 Tage eingefügt');
                } else {
                    //console.error('Fahrzeug mit ID ' + vehicleId + ' nicht gefunden.');
                }
            })
            .catch(error => console.error('Fehler beim Abrufen der Laufleistung:', error));
    }
    insertDistance30d();
})();
