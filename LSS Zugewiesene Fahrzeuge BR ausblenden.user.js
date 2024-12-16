// ==UserScript==
// @name         LSS Zugewiesene Fahrzeuge BR ausblenden
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Fahrzeugtabelle bei Klick auf den Text "Zugewiesene Fahrzeuge" aus/einblenden
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Überprüfen, ob das DIV-Element mit der ID "staging_area_alert" vorhanden ist
    var stagingAreaAlert = document.getElementById("staging_area_alert");

    // Überprüfen, ob die beiden Tabellen mit den IDs "vehicle_table" und der Text "Zugewiesene Fahrzeuge" vorhanden sind
    var vehicleTable = document.getElementById("vehicle_table");
    var assignedVehiclesHeader = findElementByTextContent("Zugewiesene Fahrzeuge");

    if (stagingAreaAlert && vehicleTable && assignedVehiclesHeader) {
        // Hinzufügen eines Klickereignisses zum Text "Zugewiesene Fahrzeuge"
        assignedVehiclesHeader.style.cursor = "pointer";
        assignedVehiclesHeader.addEventListener("click", toggleVehicleTable);
    }

    function findElementByTextContent(textContent) {
        // Verwenden von XPath, um das Element mit dem angegebenen Textinhalt zu finden
        var xpath = `//h3[contains(text(), '${textContent}')]`;
        return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    function toggleVehicleTable() {
        // Überprüfen, ob die Tabelle ausgeblendet ist
        var isTableHidden = vehicleTable.style.display === "none";

        // Einklappen oder Ausklappen der Tabelle
        if (isTableHidden) {
            vehicleTable.style.display = "";
            assignedVehiclesHeader.textContent = "Zugewiesene Fahrzeuge (Klick zum einklappen)";
        } else {
            vehicleTable.style.display = "none";
            assignedVehiclesHeader.textContent = "Zugewiesene Fahrzeuge (Klick zum ausklappen)";
        }
    }
})();
