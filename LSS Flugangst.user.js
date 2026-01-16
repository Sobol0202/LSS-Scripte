// ==UserScript==
// @name         LSS Flugangst
// @author       Sobol
// @version      1.0
// @description  Blendet fliegende Einheiten für die Einzelauswahl aus
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const HIDDEN_VEHICLE_TYPES = [157, 156, 161, 31, 61, 96];

    function hideVehicles() {
        const container = document.getElementById('vehicle_list_step');
        if (!container) return;

        const rows = container.querySelectorAll('tr.vehicle_select_table_tr');

        rows.forEach(row => {
            let vehicleTypeId = null;

            const tdWithType = row.querySelector('td[vehicle_type_id]');
            if (tdWithType) {
                vehicleTypeId = parseInt(tdWithType.getAttribute('vehicle_type_id'), 10);
            }

            if (!vehicleTypeId) {
                const input = row.querySelector('input.vehicle_checkbox[vehicle_type_id]');
                if (input) {
                    vehicleTypeId = parseInt(input.getAttribute('vehicle_type_id'), 10);
                }
            }

            if (HIDDEN_VEHICLE_TYPES.includes(vehicleTypeId)) {
                row.style.display = 'none';
            }
        });
    }

    hideVehicles();

    const observer = new MutationObserver(() => {
        hideVehicles();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
