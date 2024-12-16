// ==UserScript==
// @name         LSS Fahrzeuggrafik-ID anzeigen
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Zeigt die Fahrzeug-Grafik-IDs an
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/vehicles/*
// @match        https://www.leitstellenspiel.de/vehicle_graphics/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    //console.log('Tampermonkey script started.');

    // Funktion zum Anzeigen der Fahrzeug-Bild-IDs als Tooltip
    function showVehicleImageIDs() {
        // Alle Bilder mit der Klasse "vehicle_image_reload" finden
        let images = document.querySelectorAll('img.vehicle_image_reload');
        //console.log('Found images:', images.length);

        // Durch jedes gefundene Bild iterieren
        images.forEach(function(img, index) {
            // Die src-URL des Bildes analysieren und die ID extrahieren
            let src = img.src;
            //console.log(`Processing image ${index + 1}:`, src);

            let match = src.match(/images\/\d{3}\/(\d{3}\/\d{3})\/original/);
            if (match) {
                // Die ID aus der Übereinstimmung extrahieren und formatieren
                let id = match[1].replace(/\//g, '');
                //console.log(`Extracted ID for image ${index + 1}:`, id);

                // Das title-Attribut des Bildes setzen, um die ID als Tooltip anzuzeigen
                img.title = `Bild-ID: ${id}`;

                //console.log(`Tooltip set for image ${index + 1}.`);
            } else {
                //console.log(`No match found for image ${index + 1}.`);
            }
        });
    }

    // Funktion zum Anzeigen der versteckten Fahrzeug-Grafik-IDs
    function showHiddenGraphicIDs() {
        // Alle Zellen (td und th) mit der Klasse "vehicle_image_graphic_id_hidden" finden
        let hiddenCells = document.querySelectorAll('td.vehicle_image_graphic_id_hidden, th.vehicle_image_graphic_id_hidden');

        // Durch jede gefundene Zelle iterieren und das Attribut "style" entfernen, falls es auf "display:none" gesetzt ist
        hiddenCells.forEach(function(cell) {
            if (cell.style.display === 'none') {
                cell.style.display = ''; // Leeren Wert setzen, um die Anzeige wiederherzustellen
            }
        });
    }

    // Entscheiden, welche Funktion basierend auf der URL aufgerufen werden soll
    if (window.location.href.startsWith('https://www.leitstellenspiel.de/vehicles/')) {
        showVehicleImageIDs();
    } else if (window.location.href.startsWith('https://www.leitstellenspiel.de/vehicle_graphics/')) {
        showHiddenGraphicIDs();
    }
})();
