// ==UserScript==
// @name         LSS-Fahrzeug AJPG-Selector
// @namespace    https://www.leitstellenspiel.de
// @version      1.2r
// @description  Fügt einen neuen Button ein um alle Fahrzeuge einzeln als AJPG zu setzen
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/vehicle_graphics
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Button erstellen
    var button = document.createElement("button");
    button.innerHTML = "AJPG-Setzen";
    button.style.margin = "10px";

    // Variable zum Verfolgen des Skriptstatus
    var isRunning = false;

    // Funktion, die beim Klick auf den Button ausgeführt wird
    function buttonClick() {
        if (isRunning) {
            console.log("Das Skript läuft bereits.");
            return;
        }

        // Setze den Skriptstatus auf "läuft"
        isRunning = true;

        // API-Aufruf, um die Fahrzeug-IDs abzurufen
        console.log("API wird aufgerufen...");
        fetch("https://www.leitstellenspiel.de/api/vehicles")
            .then(response => response.json())
            .then(data => {
                // IDs der Fahrzeuge auslesen
                var vehicleIDs = data.map(vehicle => vehicle.id);
                console.log("Fahrzeug-IDs erhalten:", vehicleIDs);

                // Funktion, um die Detailseite eines Fahrzeugs zu besuchen und die Checkbox zu aktivieren
                function visitVehicleDetailPage(index) {
                    if (!isRunning) {
                        console.log("Das Skript wurde unterbrochen.");
                        return;
                    }

                    if (index >= vehicleIDs.length) {
                        // Alle Fahrzeuge wurden bearbeitet
                        console.log("Alle Fahrzeuge bearbeitet!");
                        // Setze den Skriptstatus auf "beendet"
                        isRunning = false;
                        return;
                    }

                    var vehicleID = vehicleIDs[index];
                    var detailPageURL = "https://www.leitstellenspiel.de/vehicles/" + vehicleID + "/edit";
                    console.log("Besuche Detailseite für Fahrzeug mit ID", vehicleID);

                    // Neuen Tab öffnen und Detailseite des Fahrzeugs aufrufen
                    var newTab = window.open(detailPageURL, "_blank");

                    // Funktion zum Schließen des Tabs nach 2 Sekunden
                    function closeTab() {
                        setTimeout(function() {
                            newTab.close();
                            // Nächste Detailseite besuchen nachdem der Tab geschlossen wurde
                            visitVehicleDetailPage(index + 1);
                        }, 2000);
                    }

                    // Funktion zum Aktivieren der Checkbox und Klicken des "Submit"-Buttons
                    function setCheckboxAndSubmit() {
                        // Checkbox mit der ID "vehicle_apng" suchen und auf TRUE setzen, wenn sichtbar
                        var checkbox = newTab.document.querySelector("#vehicle_apng");
                        if (checkbox && checkbox.style.display !== "none") {
                            checkbox.checked = true;
                            console.log("Checkbox auf TRUE gesetzt.");

                            // Button mit den spezifizierten Klassen, Attributen und Werten suchen und drücken
                            var submitButton = newTab.document.querySelector(".btn.btn.btn-success[name='commit'][type='submit'][value='Speichern']");
                            if (submitButton) {
                                submitButton.click();
                                console.log("Fahrzeugeinstellungen gespeichert.");
                            }
                        }

                        // Tab schließen
                        closeTab();
                    }

                    // Warten Sie eine halbe Sekunde, bevor Sie die Checkbox und den Submit-Button setzen
                    setTimeout(setCheckboxAndSubmit, 500);
                }

                // Erste Detailseite besuchen
                visitVehicleDetailPage(0);
            });
    }

    // Klick-Ereignis dem Button hinzufügen
    button.addEventListener("click", buttonClick);

    // Überprüfung auf Escape-Taste, um das Skript zu unterbrechen
    document.addEventListener("keyup", function(event) {
        if (event.key === "Escape") {
            isRunning = false;
            console.log("Das Skript wurde unterbrochen.");
        }
    });

    // Element mit der ID "bs-example-navbar-collapse-alliance" auswählen
    var parentElement = document.getElementById("bs-example-navbar-collapse-alliance");
    if (parentElement) {
        parentElement.style.display = "flex";
        parentElement.style.flexDirection = "row-reverse";
        parentElement.insertBefore(button, parentElement.firstChild);
    }
})();
