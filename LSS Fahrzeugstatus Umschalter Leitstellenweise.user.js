// ==UserScript==
// @name         LSS Fahrzeugstatus Umschalter Leitstellenweise
// @version      1.0
// @description  Fügt Buttons hinzu, um alle Fahrzeuge einer Leitstelle auf Status 2 oder 6 zu setzen
// @author       Sobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Vor dem setzen von Status 6 überprüfen ob alle Fahrzeuge im Status 2 sind
    const requireStatus2ForStatus6 = false; // Standardmäßig deaktiviert

    // Funktion zum Extrahieren aller Fahrzeug-IDs aus der Tabelle
    function extractVehicleIDs() {
        return [...document.querySelectorAll("#vehicle_table tbody tr")].map(row => {
            const idCell = row.querySelector("td:nth-child(2) span[id^='vehicle_caption_']");
            return idCell ? idCell.id.replace("vehicle_caption_", "") : null;
        }).filter(id => id);
    }

    // Funktion, um zu überprüfen, ob alle Fahrzeuge Status 2 haben
    function canSwitchToStatus6() {
        return [...document.querySelectorAll("#vehicle_table tbody tr")].every(row => {
            const statusCell = row.querySelector("td:nth-child(3) span.building_list_fms_2");
            return statusCell !== null;
        });
    }

    // Fortschrittsanzeige erstellen
    function createProgressBar() {
        let progressBar = document.getElementById("fmsProgressBar");
        if (!progressBar) {
            progressBar = document.createElement("div");
            progressBar.id = "fmsProgressBar";
            progressBar.style.position = "fixed";
            progressBar.style.bottom = "10px";
            progressBar.style.left = "50%";
            progressBar.style.transform = "translateX(-50%)";
            progressBar.style.width = "300px";
            progressBar.style.height = "20px";
            progressBar.style.backgroundColor = "#ddd";
            progressBar.style.border = "1px solid #000";

            const innerBar = document.createElement("div");
            innerBar.style.height = "100%";
            innerBar.style.width = "0%";
            innerBar.style.backgroundColor = "green";
            innerBar.id = "fmsProgressInner";

            progressBar.appendChild(innerBar);
            document.body.appendChild(progressBar);
        }
    }

    // Fortschrittsanzeige aktualisieren
    function updateProgressBar(progress) {
        const innerBar = document.getElementById("fmsProgressInner");
        if (innerBar) {
            innerBar.style.width = `${progress}%`;
        }
    }

    // Funktion zum Senden der Status-Änderungsanfragen
    function sendStatusChangeRequests(vehicleIDs, status) {
        createProgressBar();
        vehicleIDs.forEach((id, index) => {
            setTimeout(() => {
                fetch(`https://www.leitstellenspiel.de/vehicles/${id}/set_fms/${status}`);
                //console.log(`Setze Fahrzeug ${id} auf Status ${status}`);
                const progress = ((index + 1) / vehicleIDs.length) * 100;
                updateProgressBar(progress);
                // Nach Abschluss der Anfragen Seite neu laden
                if (index === vehicleIDs.length - 1) {
                    setTimeout(() => location.reload(), 500);
                }
            }, index * 200); // 200 ms Wartezeit zwischen den Anfragen
        });
    }

    // Buttons zum Setzen des Fahrzeugstatus hinzufügen
    function addButtons() {
        //console.log("Prüfe auf vorhandene Buttons...");
        const searchField = document.querySelector("#tab_vehicle .search_input_field.pull-right");
        if (!searchField) {
            //console.log("Kein Suchfeld gefunden, Buttons können nicht eingefügt werden.");
            return;
        }

        let existingContainer = document.getElementById("fmsButtonsContainer");
        if (existingContainer) {
            //console.log("Buttons sind bereits vorhanden: ", existingContainer);
            return;
        }

        //console.log("Füge Buttons ein...");
        let btnContainer = document.createElement("div");
        btnContainer.id = "fmsButtonsContainer";
        btnContainer.style.display = "inline-block";
        btnContainer.style.marginRight = "10px";

        const btnStatus2 = document.createElement("button");
        btnStatus2.className = "btn btn-xs btn-default";
        btnStatus2.textContent = "Alle auf Status 2";
        btnStatus2.onclick = () => sendStatusChangeRequests(extractVehicleIDs(), 2);

        const btnStatus6 = document.createElement("button");
        btnStatus6.className = "btn btn-xs btn-default";
        btnStatus6.textContent = "Alle auf Status 6";
        btnStatus6.onclick = () => {
            if (!requireStatus2ForStatus6 || canSwitchToStatus6()) {
                sendStatusChangeRequests(extractVehicleIDs(), 6);
            } else {
                alert("Nicht alle Fahrzeuge haben Status 2!");
            }
        };

        btnContainer.appendChild(btnStatus2);
        btnContainer.appendChild(btnStatus6);
        searchField.parentNode.insertBefore(btnContainer, searchField);
        //console.log("Buttons erfolgreich eingefügt innerhalb von #tab_vehicle:", btnContainer);
    }

    // MutationObserver, um die Tabelle zu überwachen
    const observer = new MutationObserver(() => {
        const table = document.querySelector("#vehicle_table");
        if (table) {
            //console.log("Tabelle gefunden, prüfe Buttons...");
            addButtons();
        } else {
            //console.log("Tabelle nicht vorhanden.");
        }
    });

    // Beobachtung des gesamten Dokumentenbaums
    observer.observe(document.body, { childList: true, subtree: true });
})();
