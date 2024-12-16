// ==UserScript==
// @name         LSS Fahrzeuge auf Wache
// @namespace    www.leitstellenspiel.de
// @version      1.1
// @description  Zeigt Anzahl der Fahrzeuge im S2 an.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de
// @resource     icon https://github.com/Sobol0202/LSS-Scripte/raw/main/LSS-Fahrzeuge-auf-Wache/icons8-fire-station-24.png
// @grant        GM_getResourceURL
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Abrufen der Fahrzeugdaten von der FahrzeugAPI
    async function getVehicleData() {
        const response = await fetch("https://www.leitstellenspiel.de/api/vehicles");
        const data = await response.json();
        return data;
    }

    // Funktion zum Abrufen der Fahrzeugklassen von der KlassenAPI
    async function getVehicleClasses() {
        const response = await fetch("https://api.lss-manager.de/de_DE/vehicles");
        const data = await response.json();
        return data;
    }

    // Funktion zum Erstellen der Tabelle
    async function createVehicleTable() {
        const vehicleData = await getVehicleData();
        const vehicleClasses = await getVehicleClasses();

        // Filtern der verfügbaren Fahrzeuge mit "fms_real" Wert von 2
        const availableVehicles = vehicleData.filter(vehicle => vehicle.fms_real === 2);

        // Erstellen der Tabelle
        const vehicleTable = availableVehicles.reduce((acc, vehicle) => {
            const vehicleType = vehicle.vehicle_type;
            const vehicleClassCaption = vehicleClasses[vehicleType].caption;

            acc[vehicleClassCaption] = (acc[vehicleClassCaption] || 0) + 1;
            return acc;
        }, {});

        return vehicleTable;
    }

    // Funktion zum Erstellen des Lightbox-Modals
    function createLightboxModal(tableContent) {
        const modalId = 'lightboxModal';
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }

        const modalContent = document.createElement('div');
        modalContent.className = 'lightboxContent';
        modalContent.style.backgroundColor = 'white';
        modalContent.style.padding = '20px';
        modalContent.style.height = '70%';
        modalContent.style.width = '40%';
        modalContent.style.position = 'fixed';
        modalContent.style.top = '50%';
        modalContent.style.left = '50%';
        modalContent.style.transform = 'translate(-50%, -50%)';

        const closeButton = document.createElement('span');
        closeButton.textContent = '✖';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.color = 'black';
        closeButton.addEventListener('click', () => {
            modalContent.remove();
            closeLightbox();
        });

        const tableContainer = document.createElement('div');
        tableContainer.style.maxHeight = '100%'; // Setze die maximale Höhe auf 100%
        tableContainer.style.overflowY = 'auto';

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        for (const [vehicleClass, count] of Object.entries(tableContent)) {
            const row = table.insertRow();
            const cell1 = row.insertCell(0);
            const cell2 = row.insertCell(1);
            cell1.textContent = vehicleClass;
            cell2.textContent = count;
        }

        tableContainer.appendChild(table);

        modalContent.appendChild(closeButton);
        modalContent.appendChild(tableContainer);

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'lightbox';
        modal.appendChild(modalContent);

        document.body.appendChild(modal);
    }

    // Funktion zum Schließen der Lightbox
    function closeLightbox() {
        const lightbox = document.querySelector('.lightbox');
        if (lightbox) {
            lightbox.style.display = 'none';
        }
    }

    // Funktion zum Erstellen des Modal-Fensters mit Dropdown-Menü
    function createModal() {
        createLightboxModal({});
    }

    // Funktion zum Öffnen des Modal-Fensters
    function openModal() {
        // Öffne das Modal-Fenster
        document.getElementById('lightboxModal').style.display = 'block';
    }

    // Funktion zum Schließen des Modal-Fensters
    function closeModal() {
        // Schließe das Modal-Fenster
        document.getElementById('lightboxModal').style.display = 'none';
        closeLightbox();
    }

    // create a trigger-element
    const triggerLi = document.createElement('li');
    const triggerA = document.createElement('a');
    const triggerImg = document.createElement('img');
    triggerImg.src = GM_getResourceURL('icon');
    triggerImg.width = 24;
    triggerImg.height = 24;
    triggerA.href = '#';
    triggerA.append(triggerImg, '\xa0Fahrzeuge auf Wache');
    triggerLi.append(triggerA);

    triggerLi.addEventListener('click', async (event) => {
        event.preventDefault();
        const tableContent = await createVehicleTable();
        createLightboxModal(tableContent);
        openModal();
    });

    // insert the trigger-element to the DOM
    const menuDivider = document.querySelector('#menu_profile + .dropdown-menu > li.divider');
    if (menuDivider) {
        menuDivider.before(triggerLi);
    }

    // Füge das CSS für das Styling hinzu
    GM_addStyle(`
        .lightbox {
            display: none;
            justify-content: center;
            align-items: center;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.4);
            z-index: 9999;
        }

        .lightboxContent {
            background-color: white;
            padding: 20px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            margin: auto;
            z-index: 10000;
            position: relative;
        }

        .lightboxContent table {
            width: 100%;
            border-collapse: collapse;
        }

        .lightboxContent table, .lightboxContent th, .lightboxContent td {
            border: 1px solid #ddd;
        }

        .lightboxContent th, .lightboxContent td {
            padding: 8px;
            text-align: left;
        }

        .lightboxContent th {
            background-color: #f2f2f2;
        }
    `);
})();
