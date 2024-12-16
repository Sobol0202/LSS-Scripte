// ==UserScript==
// @name         LSS-Fahrzeugstatus Umschalter
// @namespace    https://www.leitstellenspiel.de/*
// @version      1.0
// @description  Umschalten des Fahrzeugstatus per Schalter
// @match        https://www.leitstellenspiel.de/
// @author       MissSobol
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

//    console.log('Script started.');

    const buildings = document.querySelectorAll('.building_list_li');
//    console.log(`Found ${buildings.length} buildings.`);

    for (const building of buildings) {
        addSwitchToBuilding(building);
    }

    function addSwitchToBuilding(building) {
        console.log('Adding switch to building:', building);
        const switchButton = document.createElement('button');
        switchButton.textContent = 'S';
        switchButton.style.marginRight = '10px';
        switchButton.style.color = "black";
        switchButton.addEventListener('click', () => toggleStatus(building));

        const detailButton = building.querySelector('.lightbox-open');
        detailButton.parentNode.insertBefore(switchButton, detailButton);
    }

    async function toggleStatus(building) {
 //       console.log('Toggling status for building:', building);
        const vehicles = building.querySelectorAll('.building_list_vehicle_element');

        for (const vehicle of vehicles) {
            const vehicleId = vehicle.getAttribute('vehicle_id');
            const currentStatus = vehicle.querySelector('.building_list_fms').textContent.trim();

            let targetStatus, url;
            if (currentStatus === '6') {
                targetStatus = '2';
                url = `https://www.leitstellenspiel.de/vehicles/${vehicleId}/set_fms/2`;
            } else {
                targetStatus = '6';
                url = `https://www.leitstellenspiel.de/vehicles/${vehicleId}/set_fms/6`;
            }

 //           console.log(`Updating status for vehicle ${vehicleId} to ${targetStatus}`);

            // Setze den neuen Status durch Aufrufen der URL
            await fetch(url);

            // Aktualisiere den Anzeigestatus
            vehicle.querySelector('.building_list_fms').textContent = targetStatus;
        }
    }

    console.log('Buildings processed.');
})();
