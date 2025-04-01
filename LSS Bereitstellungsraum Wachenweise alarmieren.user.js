// ==UserScript==
// @name         LSS Bereitstellungsraum Wachenweise alarmieren
// @version      1.0
// @description  Fügt ein Interface zur Alarmierung kompletter Gebädue in Bereitstellungsräumen hinzu
// @author       Sobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Prüfen, ob das Gebäude ein Bereitstellungsraum ist
    const stagingAreaAlert = document.getElementById("staging_area_alert");
    if (!stagingAreaAlert) return;

    // CSRF-Token abrufen
    const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    // Mapping der Building Types
    const buildingTypes = {
        0: "Feuerwache",
        2: "Rettungswache",
        5: "Rettungshubschrauberstation",
        6: "Polizeiwache",
        9: "THW-Ortsverband",
        11: "Bereitschaftspolizei",
        12: "Schnelleinsatzgruppe (SEG)",
        13: "Polizeihubschrauberstation",
        15: "Wasserrettung",
        17: "Polizei-Sondereinheiten",
        21: "Rettungshundestaffel",
        25: "Bergrettungswache",
        26: "Seenotrettungswache",
        28: "Hubschrauberstation (Seenotrettung)"
    };

    // Interface erstellen und nach "staging_area_alert" einfügen
    const interfaceDiv = document.createElement("div");
    interfaceDiv.innerHTML = `
        <div class="panel panel-default" style="margin-top: 10px;">
            <div class="panel-heading">Bereitstellungsraum Alarmierung</div>
            <div class="panel-body">
                <button id="loadBuildings" class="btn btn-primary">Gebäude laden</button>
                <select id="buildingType" class="form-control" style="margin-top: 10px; display: none;"></select>
                <select id="buildingSelect" class="form-control" style="margin-top: 10px; display: none;"></select>
                <button id="loadVehicles" class="btn btn-info" style="margin-top: 10px; display: none;">Fahrzeuge laden</button>
                <button id="alarmieren" class="btn btn-success" style="margin-top: 10px; display: none;"></button>
            </div>
        </div>
    `;
    stagingAreaAlert.after(interfaceDiv);

    const loadBuildingsBtn = document.getElementById("loadBuildings");
    const buildingTypeSelect = document.getElementById("buildingType");
    const buildingSelect = document.getElementById("buildingSelect");
    const loadVehiclesBtn = document.getElementById("loadVehicles");
    const alarmierenBtn = document.getElementById("alarmieren");

    let buildings = [];
    let vehicles = [];
    let selectedBuildingId = null;

    // Gebäude laden
    loadBuildingsBtn.addEventListener("click", () => {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://www.leitstellenspiel.de/api/buildings",
            onload: function(response) {
                buildings = JSON.parse(response.responseText);

                // Herausfinden, welche Building Types tatsächlich existieren
                const existingTypes = new Set(buildings.map(b => b.building_type));

                // Dropdown zurücksetzen
                buildingTypeSelect.innerHTML = '<option value="">Gebäudetyp wählen</option>';

                // Nur vorhandene Gebäudetypen hinzufügen
                Object.entries(buildingTypes).forEach(([id, name]) => {
                    if (existingTypes.has(Number(id))) {
                        const option = document.createElement("option");
                        option.value = id;
                        option.textContent = name;
                        buildingTypeSelect.appendChild(option);
                    }
                });

                buildingTypeSelect.style.display = "block";
            }
        });
    });

    // Gebäude eines Typs laden
    buildingTypeSelect.addEventListener("change", () => {
        const selectedType = parseInt(buildingTypeSelect.value, 10);
        buildingSelect.innerHTML = "";

        if (isNaN(selectedType)) return;

        const filteredBuildings = buildings.filter(b => b.building_type === selectedType);
        if (filteredBuildings.length === 0) {
            alert("Keine Gebäude dieses Typs gefunden.");
            return;
        }

        filteredBuildings.forEach(b => {
            const option = document.createElement("option");
            option.value = b.id;
            option.textContent = b.caption;
            buildingSelect.appendChild(option);
        });

        buildingSelect.style.display = "block";
        loadVehiclesBtn.style.display = "block";
    });

    // Fahrzeuge laden
    loadVehiclesBtn.addEventListener("click", () => {
        selectedBuildingId = parseInt(buildingSelect.value, 10);
        if (isNaN(selectedBuildingId)) return;

        GM_xmlhttpRequest({
            method: "GET",
            url: "https://www.leitstellenspiel.de/api/vehicles",
            onload: function(response) {
                vehicles = JSON.parse(response.responseText)
                    .filter(v => v.building_id === selectedBuildingId);

                if (vehicles.length > 0) {
                    alarmierenBtn.textContent = `Alarmieren (${vehicles.length} Fahrzeuge)`;
                    alarmierenBtn.style.display = "block";
                } else {
                    alert("Keine Fahrzeuge gefunden.");
                    alarmierenBtn.style.display = "none";
                }
            }
        });
    });

    // Alarmieren
    alarmierenBtn.addEventListener("click", () => {
        if (isNaN(selectedBuildingId) || vehicles.length === 0) return;

        const vehicleIds = vehicles.map(v => v.id);
        const params = new URLSearchParams();
        params.append("utf8", "✓");
        params.append("authenticity_token", authToken);
        vehicleIds.forEach((id, index) => {
            params.append(`vehicle_ids[]`, id);
            params.append(`vehicle_mode[${id}]`, "2");
        });
        params.append("commit", "Alarmieren");

        GM_xmlhttpRequest({
            method: "POST",
            url: `https://www.leitstellenspiel.de/buildings/alarm/${window.location.pathname.split("/").pop()}`,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            data: params.toString(),
            onload: function() {
                location.reload();
            }
        });
    });
})();
