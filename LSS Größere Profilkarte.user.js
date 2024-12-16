// ==UserScript==
// @name         LSS Größere Profilkarte
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Vergrößert die Profilkarte
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/profile/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion, um die Karte zu erweitern
    function expandMap() {
        var mapElement = document.getElementById('map');
        var profileMapElement = document.getElementById('profile_map');
        var windowHeight = window.innerHeight;

        // Gewünschte Höhe der Karte: Fensterhöhe minus 270 Pixel
        var desiredHeight = windowHeight - 270;
        profileMapElement.style.height = desiredHeight + 'px'; // Setze die Höhe des Karten-Containers
        mapElement.style.height = '100%'; // Setze die Höhe des Karten-Elements auf 100%

        // Trigger eines Leaflet Karten-Resize-Events, um die Karten-Größe anzupassen
        if (window.map) {
            window.map.invalidateSize();
        }
    }

    // Funktion beim Seitenladen ausführen
    expandMap();

    // Funktion erneut ausführen, wenn das Fenster neu skaliert wird
    window.addEventListener('resize', expandMap);
})();
