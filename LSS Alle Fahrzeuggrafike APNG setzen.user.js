// ==UserScript==
// @name         LSS-Fahrzeug AJPG-Selector
// @namespace    https://www.leitstellenspiel.de
// @version      1.5
// @description  Fügt einen neuen Button ein um alle Fahrzeuge einzeln als AJPG zu setzen
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/settings/index*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Button erstellen
    var button = document.createElement("button");
    button.innerHTML = "AJPG-Setzen";
    button.style.position = "fixed";
    button.style.bottom = "10px";
    button.style.left = "10px";
    button.style.zIndex = "9999";
    button.style.color = "black";

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

                // Popup-Fenster anzeigen, um die Konfiguration der Fahrzeuge zu ermöglichen
                var startVehicle = parseInt(prompt("Es wurden " + vehicleIDs.length + " Fahrzeuge gefunden. Bitte gib ein, mit dem wievielten Fahrzeug begonnen werden soll.", "1"), 10);
                var endVehicle = parseInt(prompt("Bitte gib ein, bei wie vielen Fahrzeugen aufgehört werden soll.", vehicleIDs.length), 10);
                if (isNaN(startVehicle) || isNaN(endVehicle)) {
                    console.log("Ungültige Eingabe. Das Skript wird beendet.");
                    isRunning = false;
                    return;
                }

                // Funktion, um die Detailseite eines Fahrzeugs zu besuchen und die Checkbox zu aktivieren
                function visitVehicleDetailPage(index) {
                    if (!isRunning) {
                        console.log("Das Skript wurde unterbrochen.");
                        return;
                    }

                    if (index >= vehicleIDs.length || index >= endVehicle) {
                        // Alle Fahrzeuge wurden bearbeitet oder das Ende erreicht
                        console.log("Bearbeitung abgeschlossen!");
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

                    // Warte eine halbe Sekunde, bevor die Checkbox und den Submit-Button geklickt werden
                    setTimeout(setCheckboxAndSubmit, 500);
                }

                // Erste Detailseite besuchen
                visitVehicleDetailPage(startVehicle - 1);
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

    // Button zur Seite hinzufügen
    document.body.appendChild(button);
})();
