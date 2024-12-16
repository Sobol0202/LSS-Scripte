// ==UserScript==
// @name         Leitstellenspiel Data Extraktor
// @namespace    https://www.leitstellenspiel.de
// @version      1.0.4r
// @description  Fügt einen Button ein um verschiedene Daten aus dem LSS zu sammeln und in die Zwischenablage zu nehmen.
// @match        https://www.leitstellenspiel.de/credits/daily
// @author       MissSobol
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
  'use strict';

  // Funktion zum Abrufen der API-Daten und Speichern in den Local Storage
  function getDataAndSaveToLocalStorage() {
    // API "credits" aufrufen
    GM_xmlhttpRequest({
      method: "GET",
      url: "https://www.leitstellenspiel.de/api/credits",
      onload: function(response) {
        var data = JSON.parse(response.responseText);
        var credits = data.credits_user_total;

        // Wert in den Local Storage schreiben
        localStorage.setItem("credits", "Credits: " + credits);

        // API "buildings" aufrufen
        GM_xmlhttpRequest({
          method: "GET",
          url: "https://www.leitstellenspiel.de/api/buildings",
          onload: function(response) {
            var data = JSON.parse(response.responseText);
            var buildings = {};

            // Anzahl der Gebäude jedes Typs zählen
            data.forEach(function(building) {
              var buildingType = building.building_type;
              buildings[buildingType] = (buildings[buildingType] || 0) + 1;
            });

            // Gebäudezählungen in den Local Storage schreiben
            var buildingCounts = Object.entries(buildings).map(function(entry) {
              var buildingType = parseInt(entry[0]);
              var count = entry[1];
              var buildingName = getBuildingName(buildingType);
              return buildingName + ": " + count;
            }).join(", ");
            localStorage.setItem("buildingCounts", buildingCounts);

            // Selektiere alle Zeilen mit Einsätzen
            const einsatzZeilen = document.querySelectorAll('tr');

            let gesamtAnzahlEinsaetze = 0;
            let gesamtAnzahlPatienten = 0;

            // Iteriere über jede Zeile (überspringe die erste Zeile mit Überschriften)
            for (let i = 1; i < einsatzZeilen.length; i++) {
              const zeile = einsatzZeilen[i];

              // Extrahiere den Text der dritten "sortvalue"
              const dritteSortvalueText = zeile.querySelectorAll('td[sortvalue]')[3].textContent.trim();

              // Überprüfe, ob der Text das Wort "Patient" enthält
              if (dritteSortvalueText.includes('Patient')) {
                // Extrahiere den Wert der dritten "sortvalue"
                const anzahlString = zeile.querySelectorAll('td[sortvalue]')[2].textContent.trim();

                // Extrahiere nur die Anzahl als Ganzzahl
                const anzahl = parseInt(anzahlString.split(' ')[0]);

                // Addiere die Anzahl zum Gesamtwert
                gesamtAnzahlPatienten += anzahl;
              } else {
                // Extrahiere den Text der letzten "sortvalue"
                const letzteSortvalueText = zeile.querySelectorAll('td[sortvalue]')[3].textContent.trim();

                // Überprüfe, ob der Text der letzten Sortvalue eine der Ausnahmen enthält
                const istAusnahme = /(Bonus|Abgebrochen|Gebaut|abgerissen)/i.test(letzteSortvalueText);

                // Wenn die letzte Sortvalue keine Ausnahme ist, erhöhe die Gesamtanzahl um 1
                if (!istAusnahme) {
                  // Extrahiere den Wert der dritten "sortvalue"
                  const anzahlString = zeile.querySelectorAll('td[sortvalue]')[2].textContent.trim();

                  // Extrahiere nur die Anzahl als Ganzzahl
                  const anzahl = parseInt(anzahlString.split(' ')[0]);

                  // Addiere die Anzahl zum Gesamtwert
                  gesamtAnzahlEinsaetze += anzahl;
                }
              }
            }

            // Einsatzzählung und Patientenzählung in den Local Storage schreiben
            localStorage.setItem("totalEinsaetze", "Gesamt gefahrene Einsätze: " + gesamtAnzahlEinsaetze);
            localStorage.setItem("totalPatients", "Gesamt behandelte Patienten: " + gesamtAnzahlPatienten);

            // Daten in den Local Storage zusammenfassen
            var data = getCurrentDateTime() + "; " +
              localStorage.getItem("credits") + "; " +
              localStorage.getItem("buildingCounts") + "; " +
              localStorage.getItem("totalPatients") + "; " +
              localStorage.getItem("totalEinsaetze");

            // Daten im Local Storage speichern
            localStorage.setItem("data", data);
            alert("Daten wurden erfolgreich gesammelt!")
          }
        });
      }
    });
  }

  // Funktion zum Ermitteln des Gebäudenamens anhand des Gebäudetyps
  function getBuildingName(buildingType) {
    // Gebäudetypen-Bezeichnungen hier einfügen
    var buildingNames = {
      0: "Feuerwachen",
      1: "Feuerwehrschulen",
      2: "Rettungswachen",
      3: "Rettungsschulen",
      4: "Krankenhäuser",
      5: "Rettungshubschrauber-Stationen",
      6: "Polizeiwachen",
      7: "Leitstellen",
      8: "Polizeischulen",
      9: "THW-Ortsverbände",
      10: "THW-Bundesschulen",
      11: "Bereitschaftspolizei",
      12: "Schnelleinsatzgruppen (SEG)",
      13: "Polizeihubschrauberstationen",
      14: "Bereitstellungsraum",
      15: "Wasserrettung",
      16: "Verbandszellen",
      17: "Polizei-Sondereinheiten",
      18: "Feuerwachen (Kleinwachen)",
      19: "Polizeiwachen (Kleinwachen)",
      20: "Rettungswachen (Kleinwachen)",
      21: "Rettungshundestaffeln",
      22: "Große Komplexe",
      23: "Kleine Komplexe"
    };

    return buildingNames[buildingType] || "Unbekannt";
  }

  // Funktion zum Hinzufügen des Buttons zur Seite
  function addButton() {
    var button = document.createElement("button");
    button.innerHTML = "Daten speichern";
    button.addEventListener("click", getDataAndSaveToLocalStorage);

    var container = document.getElementById("iframe-inside-container");
    if (container) {
      container.appendChild(button);
    }
  }

  // Funktion zum Generieren des aktuellen Datums und der Uhrzeit
  function getCurrentDateTime() {
    var currentDate = new Date();
    var day = String(currentDate.getDate()).padStart(2, "0");
    var month = String(currentDate.getMonth() + 1).padStart(2, "0");
    var year = currentDate.getFullYear();
    var hours = String(currentDate.getHours()).padStart(2, "0");
    var minutes = String(currentDate.getMinutes()).padStart(2, "0");
    var seconds = String(currentDate.getSeconds()).padStart(2, "0");

    return day + "." + month + "." + year + "; " + hours + ":" + minutes + ":" + seconds;
  }

  // Funktion zum Kopieren des Datensatzes in die Zwischenablage
  function copyToClipboard() {
    var data = localStorage.getItem("data");
    if (data) {
      navigator.clipboard.writeText(data);
    }
  }

// Funktion zum Erstellen des Feldes zum Kopieren in die Zwischenablage und zum direkten Download
function createCopyField() {
  var copyField = document.createElement("div");
  copyField.style.marginTop = "10px";

  var copyButton = document.createElement("button");
  copyButton.innerHTML = "Daten in Zwischenablage kopieren";
  copyButton.style.marginRight = "10px";
  copyButton.addEventListener("click", copyToClipboard);
  copyField.appendChild(copyButton);

  var downloadButton = document.createElement("a");
  downloadButton.innerHTML = "Daten als CSV herunterladen";
  downloadButton.style.color = "blue";
  downloadButton.style.cursor = "pointer";
  downloadButton.addEventListener("click", downloadCSV);
  copyField.appendChild(downloadButton);

  var container = document.getElementById("iframe-inside-container");
  if (container) {
    container.appendChild(copyField);
  }
}

    // Funktion zum Herunterladen des Datensatzes als CSV-Datei
function downloadCSV() {
  var data = localStorage.getItem("data");
  if (data) {
    var csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(data);
    var downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", csvContent);
    downloadLink.setAttribute("download", "datensatz.csv");
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }
}
  addButton();
  createCopyField();
})();
