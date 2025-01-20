// ==UserScript==
// @name         LSS RTH-Sprechwünsche nach oben
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Sortiert Fahrzeuge nach Typ, wenn auf "Funk" geklickt wird
// @author       Sobol
// @match        https://www.leitstellenspiel.de/
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      www.leitstellenspiel.de
// ==/UserScript==

(function () {
    'use strict';

    // Hilfsfunktion, um die Fahrzeuge von der API zu laden
    async function fetchVehicles(forceUpdate = false) {
        //console.log('Rufe Fahrzeugdaten aus dem Speicher ab...');
        const lastFetch = GM_getValue('lastFetch', 0);
        const now = Date.now();
        if (!forceUpdate && now - lastFetch < 24 * 60 * 60 * 1000) {
            //console.log('Gespeicherte Fahrzeugdaten werden verwendet');
            return GM_getValue('vehicles', []);
        }

        return new Promise((resolve, reject) => {
            //console.log('Rufe Fahrzeugdaten aus dem Speicher ab...');
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://www.leitstellenspiel.de/api/v2/vehicles',
                onload: (response) => {
                    if (response.status === 200) {
                        //console.log('API-Antwort erfolgreich.');
                        const data = JSON.parse(response.responseText);
                        GM_setValue('vehicles', data.result);
                        GM_setValue('lastFetch', now);
                        resolve(data.result);
                    } else {
                        console.error(`API-Anfrage gescheitert: ${response.status}`);
                        reject(new Error(`API-Anfrage gescheitert: ${response.status}`));
                    }
                },
                onerror: () => {
                    console.error('API-Anfrage gescheitert');
                    reject(new Error('API-Anfrage gescheitert'));
                },
            });
        });
    }

    // Sortiert die Fahrzeugliste im DOM basierend auf den Typen
    function sortVehicleList(vehicleData) {
        //console.log('Sortiere Liste...');
        const list = document.getElementById('radio_messages_important');
        if (!list) {
            //console.warn('Keine Sprechwünsche gefunden!');
            return;
        }

        const listItems = Array.from(list.querySelectorAll('li'));
        //console.log(`Es wurden ${listItems.length} Sprechwünsche zum sortieren gefunden.`);
        const vehicleMap = new Map(vehicleData.map(v => [v.id, v.vehicle_type]));

        listItems.sort((a, b) => {
            const vehicleIdA = parseInt(a.querySelector('[vehicle_id]').getAttribute('vehicle_id'), 10);
            const vehicleIdB = parseInt(b.querySelector('[vehicle_id]').getAttribute('vehicle_id'), 10);

            const typeA = vehicleMap.get(vehicleIdA) || Infinity;
            const typeB = vehicleMap.get(vehicleIdB) || Infinity;

            // Priorisiere Typ 31
            if (typeA === 31 && typeB !== 31) return -1;
            if (typeB === 31 && typeA !== 31) return 1;

            return typeA - typeB;
        });

        //console.log('Rufe gespeicherte Fahrzeugdaten ab!');
        // Neu sortierte Elemente in die Liste einfügen
        listItems.forEach(item => list.appendChild(item));
        //console.log('Sprechwünsche erfolgreich sortiert');
    }

    // Klick-Event auf "Funk" hinzufügen
    async function setupClickListener() {
        const radioPanel = document.querySelector('#radio_panel_heading .flex-grow-1');
        if (!radioPanel) {
            console.warn('Radio panel element nicht gefunden!');
            return;
        }

        radioPanel.addEventListener('click', async (event) => {
            const forceUpdate = event.ctrlKey;
            //console.log(`"Funk" button clicked. Force update: ${forceUpdate}`);
            try {
                const vehicles = await fetchVehicles(forceUpdate);
                sortVehicleList(vehicles);
            } catch (error) {
                console.error('Fehler beim Laden der Fahrzeuge:', error);
            }
        });
    }

    // Initialisierung
    function init() {
        setupClickListener();
    }
    init();
})();
