// ==UserScript==
// @name         LSS Bereitstellung zu Zug
// @version      1.0
// @description  Erzeugt einen Zug aus den anwesenden Fahrzeugen eines Bereitstellungsraums.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @match        https://www.leitstellenspiel.de/vehicle_groups/new
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// ==/UserScript==

(function() {
    'use strict';

    // Prüft, ob die aktuelle Seite eine Gebäudeseite ist
    if (window.location.href.includes("/buildings/")) {
        let stagingAlert = document.getElementById("staging_area_alert"); // Überprüft, ob der BR-Hinweis existiert
        if (stagingAlert) {
            let dissolveButton = document.querySelector("input[value='Bereitschaftsraum der ausgewählten Fahrzeuge auflösen']");
            if (dissolveButton) {
                // Erstelle einen neuen Button
                let newButton = document.createElement("button");
                newButton.className = "btn btn-default";
                newButton.textContent = "Fahrzeuge in Zug verwandeln";
                newButton.style.marginLeft = "10px";
                newButton.type = "button";

                // Füge eine Klick-EventListener hinzu
                newButton.addEventListener("click", function(event) {
                    event.preventDefault();
                    let vehicleIds = [];

                    // Extrahiere die Fahrzeug-IDs aus der Tabelle
                    document.querySelectorAll("#vehicle_table tr td:nth-child(3) a").forEach(a => {
                        let vehicleId = a.href.match(/\d+$/);
                        if (vehicleId) vehicleIds.push(vehicleId[0]);
                    });

                    // Speichere die Fahrzeug-IDs im GM-Speicher
                    GM_setValue("vehicle_ids", vehicleIds);

                    // Öffne die Seite zur Erstellung einer neuen Fahrzeuggruppe
                    GM_openInTab("https://www.leitstellenspiel.de/vehicle_groups/new", { active: true });
                });

                // Füge den Button neben dem Auflösungs-Button ein
                dissolveButton.parentNode.insertBefore(newButton, dissolveButton.nextSibling);
            }
        }
    }

    // Prüft, ob die aktuelle Seite die Fahrzeuggruppen-Erstellungsseite ist
    if (window.location.href.includes("/vehicle_groups/new")) {
        let vehicleIds = GM_getValue("vehicle_ids", []); // Lade gespeicherte Fahrzeug-IDs
        if (vehicleIds.length > 0) {
            // Gehe alle Checkboxen durch und wähle die gespeicherten IDs aus
            document.querySelectorAll("#new_vehicle_group label input[type='checkbox']").forEach(input => {
                if (vehicleIds.includes(input.value)) {
                    input.checked = true;
                    input.dispatchEvent(new Event("change", { bubbles: true })); // Löst ein Change-Event aus
                }
            });

            // Lösche die gespeicherten Fahrzeug-IDs nach dem Setzen
            GM_setValue("vehicle_ids", []);
        }
    }
})();
