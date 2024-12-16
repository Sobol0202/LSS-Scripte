// ==UserScript==
// @name         LSS Building Edit Button
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Fügt einen "Edit" Button zu jedem Gebäude in der Gebäudeliste hinzu
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function addEditButton(building) {
        // Überprüfe, ob building.href vorhanden ist, um Fehler zu vermeiden
        if (building.href) {
            // Extrahiere die Gebäude-ID aus dem vorhandenen href
            var buildingId = building.href.match(/\/buildings\/(\d+)/);

            // Überprüfe, ob ein Gebäude-ID-Match vorhanden ist
            if (buildingId && buildingId[1]) {
                buildingId = buildingId[1];

                // Überprüfe, ob der Edit-Button bereits existiert
                if (!document.getElementById('edit_button_' + buildingId)) {
                    // Erstelle einen neuen Button für die Editseite
                    var editButton = document.createElement('a');
                    editButton.href = 'https://www.leitstellenspiel.de/buildings/' + buildingId + '/edit';
                    editButton.textContent = 'Edit';
                    editButton.className = 'btn btn-xs pull-right btn-default lightbox-open';
                    editButton.id = 'edit_button_' + buildingId;

                    // Füge den neuen Button neben dem vorhandenen "Details"-Button hinzu
                    building.parentNode.insertBefore(editButton, building.nextSibling);
                }
            }
        }
    }

    // Funktion zum Verarbeiten des Scroll-Events
    function handleScroll() {
        // Finde alle Gebäude in der Gebäudeliste
        var buildings = document.querySelectorAll('#building_list a.btn');
        buildings.forEach(addEditButton);
    }

    // Höre auf das Scroll-Event
    window.addEventListener('scroll', handleScroll);

    // Füge Edit-Buttons zu bereits sichtbaren Gebäuden hinzu
    var buildings = document.querySelectorAll('#building_list a.btn');
    buildings.forEach(addEditButton);
})();
