// ==UserScript==
// @name         LSS POI Counter in POI Menu
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Zeigt die Anzahl der bereits gesetzten POIs jedes Typs im Dropdown-Menü an und färbt Zeilen mit 0 POIs rot.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zur Aktualisierung der POI-Zähler im Dropdown-Menü
    function updatePoiCounter() {
        //console.log('Button geklickt. Warte auf das Erscheinen des Dropdown-Menüs...');
        const intervalId = setInterval(function() {
            const poiDropdown = document.getElementById('mission_position_poi_type');
            if (poiDropdown) {
                //console.log('Dropdown gefunden. Versuche, POI-Marker abzurufen...');
                const poiMarkers = map_pois_service.getMissionPoiMarkersArray();
                //console.log('POI-Marker:', poiMarkers);
                const poiCounts = poiMarkers.reduce((acc, poi) => {
                    const poiType = poi.getTooltip().getContent();
                    acc[poiType] = (acc[poiType] || 0) + 1;
                    return acc;
                }, {});

                const options = poiDropdown.options;
                for (let i = 0; i < options.length; i++) {
                    const poiType = options[i].text;
                    const poiCount = poiCounts[poiType] || 0;
                    options[i].textContent = `(${poiCount}x) ${poiType}`;
                    if (poiCount === 0) {
                        options[i].style.color = 'red'; // Färbe die Zeile rot, wenn die Anzahl der POIs 0 ist
                    } else {
                        options[i].style.color = ''; // Setze die Farbe auf den Standardwert, wenn die Anzahl nicht 0 ist
                    }
                }

                //console.log('POI-Zähler erfolgreich aktualisiert.');
                clearInterval(intervalId); // Stoppe das Intervall, sobald das Dropdown-Menü gefunden und aktualisiert wurde.
            }
        }, 1000);
    }

    // Suche nach dem Element mit der ID 'buildings_outer'
    const buildingsOuter = document.getElementById('buildings_outer');
    if (buildingsOuter) {
        // Suche nach dem Button mit der ID 'build_new_poi' innerhalb von 'buildings_outer'
        const buildButton = buildingsOuter.querySelector('#build_new_poi');
        if (buildButton) {
            //console.log('Button innerhalb von buildings_outer gefunden:', buildButton);
            //console.log('Füge Event-Listener für den Klick auf den Button hinzu.');
            buildButton.addEventListener('click', updatePoiCounter);
        } else {
            //console.log('Button mit der ID "build_new_poi" innerhalb von buildings_outer nicht gefunden.');
        }
    } else {
        //console.log('buildings_outer nicht gefunden.');
    }
})();
