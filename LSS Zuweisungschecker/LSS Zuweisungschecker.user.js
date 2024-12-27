// ==UserScript==
// @name         LSS Zuweisungschecker
// @version      1.3
// @description  Fügt ein Menü ein um nicht vollständig zugewiesene Fahrzeuge anzuzeigen
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceURL
// @resource     icon https://github.com/Sobol0202/LSS-Scripte/raw/main/LSS%20Zuweisungschecker/icons8-approve-80.png
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Mapping für vehicle_type (manuelle Zuweisung der Beschriftungen)
    const vehicleTypeMap = {
        0: { name: "LF 20", maxPersonnel: 9 },
        1: { name: "LF 10", maxPersonnel: 9 },
        2: { name: "DLK 23", maxPersonnel: 3 },
        3: { name: "ELW 1", maxPersonnel: 3 },
        4: { name: "RW", maxPersonnel: 3 },
        5: { name: "GW-A", maxPersonnel: 3 },
        6: { name: "LF 8/6", maxPersonnel: 9 },
        7: { name: "LF 20/16", maxPersonnel: 9 },
        8: { name: "LF 10/6", maxPersonnel: 9 },
        9: { name: "LF 16-TS", maxPersonnel: 9 },
        10: { name: "GW-Öl", maxPersonnel: 3 },
        11: { name: "GW-L2-Wasser", maxPersonnel: 3 },
        12: { name: "GW-Messtechnik 🎓", maxPersonnel: 3 },
        13: { name: "SW 1000", maxPersonnel: 3 },
        14: { name: "SW 2000", maxPersonnel: 6 },
        15: { name: "SW 2000-Tr", maxPersonnel: 3 },
        16: { name: "SW Kats", maxPersonnel: 3 },
        17: { name: "TLF 2000", maxPersonnel: 3 },
        18: { name: "TLF 3000", maxPersonnel: 3 },
        19: { name: "TLF 8/8", maxPersonnel: 3 },
        20: { name: "TLF 8/18", maxPersonnel: 3 },
        21: { name: "TLF 16/24-Tr", maxPersonnel: 3 },
        22: { name: "TLF 16/25", maxPersonnel: 6 },
        23: { name: "TLF 16/45", maxPersonnel: 3 },
        24: { name: "TLF 20/40", maxPersonnel: 3 },
        25: { name: "TLF 20/40-SL", maxPersonnel: 3 },
        26: { name: "TLF 16", maxPersonnel: 3 },
        27: { name: "GW-Gefahrgut 🎓", maxPersonnel: 3 },
        28: { name: "RTW", maxPersonnel: 2 },
        29: { name: "NEF 🎓", maxPersonnel: 2 },
        30: { name: "HLF 20", maxPersonnel: 9 },
        31: { name: "RTH 🎓", maxPersonnel: 3 },
        32: { name: "FuStW", maxPersonnel: 2 },
        33: { name: "GW-Höhenrettung 🎓", maxPersonnel: 9 },
        34: { name: "ELW 2 🎓", maxPersonnel: 6 },
        35: { name: "leBefKw 🎓", maxPersonnel: 3 },
        36: { name: "MTW", maxPersonnel: 9 },
        37: { name: "TSF-W", maxPersonnel: 6 },
        38: { name: "KTW", maxPersonnel: 2 },
        39: { name: "GKW", maxPersonnel: 3 },
        40: { name: "MTW-TZ 🎓", maxPersonnel: 4 },
        41: { name: "MzGW (FGr N)", maxPersonnel: 9 },
        42: { name: "LKW K 9 🎓", maxPersonnel: 3 },
        45: { name: "MLW 5 🎓", maxPersonnel: 6 },
        46: { name: "WLF 🎓", maxPersonnel: 3 },
        50: { name: "GruKw", maxPersonnel: 9 },
        51: { name: "FüKW (Polizei) 🎓", maxPersonnel: 3 },
        52: { name: "GefKw", maxPersonnel: 2 },
        53: { name: "Dekon-P 🎓", maxPersonnel: 6 },
        55: { name: "KdoW-LNA 🎓", maxPersonnel: 1 },
        56: { name: "KdoW-OrgL 🎓", maxPersonnel: 1 },
        57: { name: "FwK 🎓", maxPersonnel: 2 },
        58: { name: "KTW Typ B", maxPersonnel: 2 },
        59: { name: "ELW 1 (SEG) 🎓", maxPersonnel: 2 },
        60: { name: "GW-San 🎓", maxPersonnel: 6 },
        61: { name: "Polizeihubschrauber 🎓", maxPersonnel: 3 },
        63: { name: "GW-Taucher 🎓", maxPersonnel: 2 },
        64: { name: "GW-Wasserrettung 🎓", maxPersonnel: 6 },
        65: { name: "LKW 7 Lkr 19 tm", maxPersonnel: 2 },
        69: { name: "Tauchkraftwagen", maxPersonnel: 2 },
        72: { name: "WaWe 10 🎓", maxPersonnel: 5 },
        73: { name: "GRTW 🎓", maxPersonnel: 6 },
        74: { name: "NAW 🎓", maxPersonnel: 3 },
        75: { name: "FLF 🎓", maxPersonnel: 3 },
        76: { name: "Rettungstreppe 🎓", maxPersonnel: 2 },
        79: { name: "SEK - ZF 🎓", maxPersonnel: 4 },
        80: { name: "SEK - MTF 🎓", maxPersonnel: 9 },
        81: { name: "MEK - ZF 🎓", maxPersonnel: 4 },
        82: { name: "MEK - MTF 🎓", maxPersonnel: 9 },
        83: { name: "GW-Werkfeuerwehr 🎓", maxPersonnel: 9 },
        84: { name: "ULF mit Löscharm 🎓", maxPersonnel: 3 },
        85: { name: "TM 50 🎓", maxPersonnel: 3 },
        86: { name: "Turbolöscher 🎓", maxPersonnel: 3 },
        87: { name: "TLF 4000", maxPersonnel: 3 },
        88: { name: "KLF", maxPersonnel: 6 },
        89: { name: "MLF", maxPersonnel: 6 },
        90: { name: "HLF 10", maxPersonnel: 9 },
        91: { name: "Rettungshundefahrzeug 🎓", maxPersonnel: 5 },
        93: { name: "MTW-O 🎓", maxPersonnel: 5 },
        94: { name: "DHuFüKW 🎓", maxPersonnel: 2 },
        95: { name: "Polizeimotorrad 🎓", maxPersonnel: 1 },
        97: { name: "ITW 🎓", maxPersonnel: 3 },
        98: { name: "Zivilstreifenwagen 🎓", maxPersonnel: 2 },
        100: { name: "MLW 4 🎓", maxPersonnel: 7 },
        103: { name: "FuStW (DGL) 🎓", maxPersonnel: 2 },
        104: { name: "GW-L1", maxPersonnel: 6 },
        105: { name: "GW-L2", maxPersonnel: 6 },
        106: { name: "MTF-L", maxPersonnel: 6 },
        107: { name: "LF-L", maxPersonnel: 9 },
        109: { name: "MzGW SB 🎓", maxPersonnel: 9 },
        114: { name: "GW-Lüfter", maxPersonnel: 2 },
        118: { name: "Kleintankwagen", maxPersonnel: 3 },
        120: { name: "Tankwagen", maxPersonnel: 3 },
        121: { name: "GTLF", maxPersonnel: 3 },
        122: { name: "LKW 7 Lbw (FGr E) 🎓", maxPersonnel: 3 },
        123: { name: "LKW 7 Lbw (FGr WP) 🎓", maxPersonnel: 3 },
        124: { name: "MTW-OV", maxPersonnel: 7 },
        125: { name: "MTW-Tr UL 🎓", maxPersonnel: 4 },
        126: { name: "MTF Drohne 🎓", maxPersonnel: 5 },
        127: { name: "GW UAS 🎓", maxPersonnel: 4 },
        128: { name: "ELW Drohne 🎓", maxPersonnel: 5 },
        129: { name: "ELW2 Drohne 🎓", maxPersonnel: 6 },
        130: { name: "GW-Bt 🎓", maxPersonnel: 3 },
        131: { name: "Bt-Kombi 🎓", maxPersonnel: 9 },
        133: { name: "Bt LKW 🎓", maxPersonnel: 3 },
        134: { name: "Pferdetransporter klein 🎓", maxPersonnel: 4 },
        135: { name: "Pferdetransporter groß 🎓", maxPersonnel: 2 },
        137: { name: "Zugfahrzeug Pferdetransport 🎓", maxPersonnel: 6 },
        138: { name: "GW-Verpflegung 🎓", maxPersonnel: 6 },
        139: { name: "GW-Küche 🎓", maxPersonnel: 3 },
        140: { name: "MTW-Verpflegung 🎓", maxPersonnel: 6 },
        144: { name: "FüKW (THW) 🎓", maxPersonnel: 4 },
        145: { name: "FüKomKW 🎓", maxPersonnel: 7 },
        147: { name: "FmKW 🎓", maxPersonnel: 7 },
        148: { name: "MTW-FGr K 🎓", maxPersonnel: 4 },
        149: { name: "GW-Bergrettung (NEF) 🎓", maxPersonnel: 6 },
        150: { name: "GW-Bergrettung 🎓", maxPersonnel: 6 },
        151: { name: "ELW Bergrettung 🎓", maxPersonnel: 3 },
        152: { name: "ATV 🎓", maxPersonnel: 1 },
        153: { name: "Hundestaffel (Bergrettung) 🎓", maxPersonnel: 5 },
        154: { name: "Schneefahrzeug 🎓", maxPersonnel: 1 },
        156: { name: "Polizeihubschrauber mit verbauter Winde 🎓", maxPersonnel: 3 },
        157: { name: "RTH Winde 🎓", maxPersonnel: 2 },
        158: { name: "GW-Höhenrettung (Bergrettung) 🎓", maxPersonnel: 4 },
        159: { name: "Seenotrettungskreuzer 🎓", maxPersonnel: 9 },
        160: { name: "Seenotrettungsboot 🎓", maxPersonnel: 2 },
        161: { name: "Hubschrauber (Seenotrettung) 🎓", maxPersonnel: 4 },
        162: { name: "RW-Schiene 🎓", maxPersonnel: 3 },
        163: { name: "HLF Schiene 🎓", maxPersonnel: 9 },
    };

    // Funktion, um ein "Lädt..." Modal zu erstellen
    function createLoadingModal() {
        // Modal-Element erstellen
        const modal = document.createElement('div');
        modal.id = 'loading-modal';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.backgroundColor = '#1e1e1e';
        modal.style.padding = '30px';
        modal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        modal.style.zIndex = '10000';
        modal.style.maxHeight = '80vh';
        modal.style.overflowY = 'auto';
        modal.style.borderRadius = '8px';
        modal.style.width = '50%';

        // Schließen-Button erstellen
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Schließen';
        closeButton.style.marginBottom = '10px';
        closeButton.style.backgroundColor = '#e74c3c';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.padding = '10px 20px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.borderRadius = '5px';
        closeButton.addEventListener('click', () => modal.remove());
        modal.append(closeButton);

        // Lade-Text erstellen
        const loadingText = document.createElement('p');
        loadingText.id = 'loading-text';
        loadingText.textContent = 'Lädt';
        loadingText.style.fontSize = '20px';
        loadingText.style.fontWeight = 'bold';
        loadingText.style.color = 'white';
        loadingText.style.animation = 'fadeInOut 2s infinite';
        modal.append(loadingText);

        // Modal zum Body hinzufügen
        document.body.append(modal);

        // CSS für das "Lädt..." Modal und die Animation
        const style = document.createElement('style');
        style.innerHTML = `
        #loading-modal #loading-text {
            font-size: 20px;
            font-weight: bold;
            color: white;
            animation: fadeInOut 1s infinite; /* Animation nur für das spezifische Modal */
        }

        @keyframes fadeInOut {
            0% { opacity: 0; }
            25% { opacity: 1; }
            50% { opacity: 0; }
            75% { opacity: 1; }
            100% { opacity: 0; }
        }
    `;
        document.head.appendChild(style);

        let dotCount = 0;

        // Funktion zum Aktualisieren des Lade-Textes mit Punkten
        function updateLoadingText() {
            loadingText.textContent = 'Lädt' + '.'.repeat(dotCount);
            dotCount = (dotCount % 3) + 1; // Punkte nach 3 wieder zurücksetzen
        }

        setInterval(updateLoadingText, 900); // Alle 900ms die Punkte aktualisieren

        return modal;
    }

    // Funktion, um das Modal nach dem Laden der Daten zu aktualisieren
    function updateModal(modal, vehicleData, buildingData) {
        modal.innerHTML = ''; // Entferne bisherigen Inhalt

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Schließen';
        closeButton.style.marginBottom = '15px';
        closeButton.style.backgroundColor = '#e74c3c';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.padding = '10px 20px';
        closeButton.style.fontSize = '16px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.borderRadius = '5px';
        closeButton.addEventListener('click', () => modal.remove());
        modal.append(closeButton);

        // Dropdown für vehicle_type
        const dropdown = document.createElement('select');
        dropdown.style.padding = '10px';
        dropdown.style.fontSize = '16px';
        dropdown.style.marginBottom = '20px';
        dropdown.addEventListener('change', () => filterTable(dropdown.value));

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Alle Fahrzeugtypen';
        dropdown.append(defaultOption);

        // Zähle die Fahrzeugtypen, die mindestens einmal vorkommen
        const vehicleTypeCounts = vehicleData.reduce((counts, vehicle) => {
            if (vehicle.assigned_personnel_count < (vehicleTypeMap[vehicle.vehicle_type]?.maxPersonnel || 0)) {
                counts[vehicle.vehicle_type] = (counts[vehicle.vehicle_type] || 0) + 1;
            }
            return counts;
        }, {});

        // Alphabetische Sortierung der Fahrzeugtypen
        const sortedVehicleTypes = Object.entries(vehicleTypeMap)
            .sort(([, a], [, b]) => a.name.localeCompare(b.name));

        // Füge nur Fahrzeugtypen hinzu, die mindestens einmal vorkommen
        Object.entries(vehicleTypeMap)
            .filter(([key]) => vehicleTypeCounts[key] > 0)
            .sort(([, a], [, b]) => a.name.localeCompare(b.name)) // Alphabetische Sortierung
            .forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = value.name;
            dropdown.append(option);
        });

        modal.append(dropdown);
        // Tabelle erstellen
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginBottom = '20px';

        const headerRow = document.createElement('tr');
        const vehicleHeader = document.createElement('th');
        vehicleHeader.textContent = 'Fahrzeug';
        vehicleHeader.style.backgroundColor = '#34495e';
        vehicleHeader.style.color = 'white';
        const buildingHeader = document.createElement('th');
        buildingHeader.textContent = 'Wache';
        buildingHeader.style.backgroundColor = '#34495e';
        buildingHeader.style.color = 'white';

        headerRow.append(vehicleHeader, buildingHeader);
        table.append(headerRow);

        vehicleData
            .filter(vehicle => vehicle.assigned_personnel_count < (vehicleTypeMap[vehicle.vehicle_type]?.maxPersonnel || 0))
            .forEach(vehicle => {
                const row = document.createElement('tr');
                row.style.transition = 'background-color 0.3s ease';

                const vehicleCell = document.createElement('td');
                const vehicleLink = document.createElement('a');
                vehicleLink.href = `https://www.leitstellenspiel.de/vehicles/${vehicle.id}/zuweisung`;
                vehicleLink.target = '_blank';
                vehicleLink.textContent = vehicle.caption;
                vehicleCell.append(vehicleLink);

                const buildingCell = document.createElement('td');
                const building = buildingData.find(b => b.id === vehicle.building_id);
                if (building) {
                    const buildingLink = document.createElement('a');
                    buildingLink.href = `https://www.leitstellenspiel.de/buildings/${building.id}`;
                    buildingLink.target = '_blank';
                    buildingLink.textContent = building.caption;
                    buildingCell.append(buildingLink);
                } else {
                    buildingCell.textContent = 'Wache nicht gefunden';
                }

                row.dataset.vehicleType = vehicle.vehicle_type; // Vehicle-Type als Attribut speichern
                row.append(vehicleCell, buildingCell);
                table.append(row);

                // Hover-Effekt für Zeilen
                row.addEventListener('mouseover', () => {
                    row.style.backgroundColor = '#ecf0f1';
                });
                row.addEventListener('mouseout', () => {
                    row.style.backgroundColor = '';
                });
            });

        modal.append(table);

        // Filterfunktion
        function filterTable(vehicleType) {
            Array.from(table.querySelectorAll('tr')).forEach((row, index) => {
                if (index === 0) return; // Header nicht filtern

                const rowVehicleType = row.dataset.vehicleType;
                row.style.display = vehicleType === '' || vehicleType === rowVehicleType ? '' : 'none';
            });
        }
    }

    // Paging für die v2-API handhaben
    async function fetchAllVehicles() {
        let allVehicles = [];
        let lastId = 0;
        let hasMore = true;
        const vehicleSet = new Set();

        while (hasMore) {
            try {
                const response = await fetch(`https://www.leitstellenspiel.de/api/v2/vehicles?last_id=${lastId}`, {
                    headers: { "X-Requested-With": "XMLHttpRequest" },
                });

                if (!response.ok) break;

                const data = await response.json();
                if (data.result.length === 0) break;

                data.result.forEach(vehicle => {
                    if (!vehicleSet.has(vehicle.id)) {
                        vehicleSet.add(vehicle.id);
                        allVehicles.push(vehicle);
                    }
                });

                const previousLastId = lastId;
                lastId = data.paging?.last_id;
                if (lastId === previousLastId) break;
            } catch {
                break;
            }
        }

        return allVehicles;
    }

    // API-Aufruf
    function fetchData() {
        const modal = createLoadingModal();

        Promise.all([
            fetchAllVehicles(),
            new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: 'https://www.leitstellenspiel.de/api/buildings',
                    onload: (response) => {
                        try {
                            const parsedBuildings = JSON.parse(response.responseText);
                            resolve(parsedBuildings);
                        } catch {
                            resolve([]);
                        }
                    }
                });
            })
        ]).then(([vehicleData, buildingData]) => {
            updateModal(modal, vehicleData, buildingData); // Aktualisiere den Modalinhalt
        }).catch(() => {
            modal.innerHTML = '<p style="color: white;">Fehler beim Laden der Daten. Bitte versuche es erneut.</p>';
        });
    }

    // Button erstellen und einfügen
    const triggerLi = document.createElement('li');
    const triggerA = document.createElement('a');
    const triggerImg = document.createElement('img');
    triggerImg.src = GM_getResourceURL('icon');
    triggerImg.width = 24;
    triggerImg.height = 24;
    triggerA.href = '#';
    triggerA.append(triggerImg, '\xa0Zuweisungschecker');
    triggerLi.append(triggerA);

    triggerLi.addEventListener('click', event => {
        event.preventDefault();
        fetchData();
    });

    document
        .querySelector('#menu_profile + .dropdown-menu > li.divider')
        ?.before(triggerLi);
})();
