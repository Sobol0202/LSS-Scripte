// ==UserScript==
// @name         LSS KTW-Icon Ebenenreduzierer
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Setzt den z-Index von Leaflet-Markern mit "KTW" im Dateinamen auf -999999
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Anpassen des z-Index für Marker mit "KTW" im Dateinamen
    function adjustMarkerZIndex() {
        const mapElement = document.getElementById('map');
        if (mapElement) {
            const markers = mapElement.getElementsByTagName('img');
            for (let marker of markers) {
                if (marker.src.includes('KTW')) {
                    // Finde das übergeordnete Leaflet-Marker-Element
                    let parent = marker.closest('.leaflet-marker-icon');
                    if (parent) {
                        parent.style.zIndex = -999999;
                    }
                }
            }
        }
    }

    // Beobachte Änderungen im DOM, um Marker zu aktualisieren, wenn sie hinzugefügt werden
    const observer = new MutationObserver(adjustMarkerZIndex);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initiale Anpassung der Marker
    adjustMarkerZIndex();
})();
