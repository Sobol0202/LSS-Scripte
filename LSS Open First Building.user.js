// ==UserScript==
// @name         LSS Open First Building
// @namespace    www.leitstellenspiel.de
// @version      1.3
// @description  Fügt Schaltflächen zum Öffnen des ersten gebauten Gebäudes ein.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion, um eine Schaltfläche zu erstellen
    function createButton(text, buildingTypes) {
        var button = document.createElement("button");
        button.textContent = text;
        button.className = "btn btn-xs btn-warning";
        //button.style.marginRight = "5px";
        button.addEventListener("click", function(event) {
            var apiUrl = "https://www.leitstellenspiel.de/api/buildings";
            fetch(apiUrl)
                .then(response => response.json())
                .then(data => {
                    var filteredBuildings = data.filter(building => buildingTypes.includes(building.building_type));
                    if (filteredBuildings.length > 0) {
                        var buildingId;
                        if (event.ctrlKey) {
                            // Wenn Strg-Taste gedrückt ist, wähle die größte ID
                            var maxIdBuilding = filteredBuildings.reduce((max, building) => building.id > max.id ? building : max, filteredBuildings[0]);
                            buildingId = maxIdBuilding.id;
                        } else {
                            // Ansonsten wähle die kleinste ID
                            var minIdBuilding = filteredBuildings.reduce((min, building) => building.id < min.id ? building : min, filteredBuildings[0]);
                            buildingId = minIdBuilding.id;
                        }
                        window.open("https://www.leitstellenspiel.de/buildings/" + buildingId, "_blank");
                    } else {
                        console.log("Kein passendes Gebäude gefunden.");
                    }
                })
                .catch(error => console.error("Fehler beim Abrufen der Gebäude:", error));
        });
        return button;
    }

    // Finde das Container-Div für Gebäudeschaltflächen
    var buildingsDiv = document.getElementById("building_panel_heading");
    if (buildingsDiv) {
        var buttonContainer = document.createElement("div");
        //buttonContainer.style.marginTop = "1px";

        // Definiere Gebäudetypen und ihre IDs
        var buttons = {
            "FW": [0, 18],   // Feuerwehrgebäude, IDs: 0 und 18
            "RD": [2, 20],   // Rettungsdienstgebäude, IDs: 2 und 20
            "Pol": [6, 19],  // Polizeigebäude, IDs: 6 und 19
            "THW": [9],      // THW-Gebäude, ID: 9
            "SEG": [12],     // SEG-Gebäude, ID: 12
            "Bpol": [11],     // Bundespolizeigebäude, ID: 11
            //Hier weitere Typen einfügen. Form muss wie folgt aussehen: "ButtonName": [Typennummer],
        };

        // Erstelle Schaltflächen für jeden definierten Gebäudetyp
        for (var buttonText in buttons) {
            var buildingTypes = buttons[buttonText];
            var button = createButton(buttonText, buildingTypes);
            buttonContainer.appendChild(button);
        }

        // Füge die erstellten Schaltflächen dem Container-Div hinzu
        buildingsDiv.appendChild(buttonContainer, buildingsDiv.firstChild);
    }
})();
