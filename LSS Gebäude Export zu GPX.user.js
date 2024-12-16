// ==UserScript==
// @name         LSS Gebäude Export zu GPX
// @namespace    www.leitstellenspiel.de
// @version      1.1
// @description  Fügt einen Button zum Exportieren von Gebäudestandorten als GPX-Datei im Tab "Karte und Fahrzeuge" hinzu
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/settings/index
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Abrufen der Gebäudedaten von der API
    function fetchBuildingData(callback) {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://www.leitstellenspiel.de/api/buildings",
            onload: function(response) {
                if (response.status === 200) {
                    const buildings = JSON.parse(response.responseText);
                    callback(buildings);
                } else {
                    console.error("Failed to fetch building data. Status: " + response.status);
                    callback([]);
                }
            },
            onerror: function(error) {
                console.error("Failed to fetch building data:", error);
                callback([]);
            }
        });
    }

    // Funktion zum Generieren der GPX-Datei
    function generateGPX(buildings) {
        let gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Leitstellenspiel GPX Exporter">
  <metadata>
    <name>Building Locations</name>
  </metadata>`;
        buildings.forEach(function(building) {
            gpxContent += `
  <wpt lat="${building.latitude}" lon="${building.longitude}">
    <name>${building.caption}</name>
    <desc>${building.building_type}</desc>
  </wpt>`;
        });
        gpxContent += `
</gpx>`;

        return gpxContent;
    }

    // Funktion zum Herunterladen der GPX-Datei
    function downloadGPX(gpxContent) {
        const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'building_locations.gpx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Hauptfunktion zum Exportieren der GPX-Datei
    function exportGPX() {
        fetchBuildingData(function(buildings) {
            const gpxContent = generateGPX(buildings);
            downloadGPX(gpxContent);
        });
    }

    // Funktion zum Hinzufügen des Buttons
    function addButton() {
        // Prüfen, ob der Button bereits existiert, um Mehrfachhinzufügung zu vermeiden
        if (document.getElementById('gpx-export-button')) {
            return;
        }

        // Neuen Button erstellen
        const button = document.createElement('button');
        button.id = 'gpx-export-button';
        button.className = 'btn btn-xs btn-default';
        button.innerText = 'Eigene Gebäude zu GPX exportieren';
        button.addEventListener('click', exportGPX);

        // Button zum Tab hinzufügen
        const tabContent = document.querySelector('#tab_map_and_vehicles .settings-tab-body');
        if (tabContent) {
            tabContent.appendChild(button);
        } else {
            console.error("Tab content not found");
        }
    }

    // Überwachung des Dokuments auf das Laden des Formulars
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && document.getElementById('form_map_and_vehicles_settings')) {
                addButton();
            }
        });
    });

    // Überwachung starten
    observer.observe(document.body, { childList: true, subtree: true });
})();
