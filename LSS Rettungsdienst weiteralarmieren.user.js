// ==UserScript==
// @name           LSS Rettungsdienst weiteralarmieren
// @namespace      https://www.leitstellenspiel.de/
// @version        1.3r
// @description    Zusätzlicher Button um allen Rettungsdienst direkt als Folgeeinsatz zu alarmieren
// @author         MissSobol
// @match          https://www.leitstellenspiel.de/missions/*
// @grant          none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Aktivieren der Checkboxen
    function activateCheckboxes() {
        var vehicleTypeIds = ['28', '29', '31', '60', '73', '74', '97', '58', '38'];
        var checkboxes = document.querySelectorAll('#vehicle_show_table_body_occupied input[type="checkbox"]');
        for (var i = 0; i < checkboxes.length; i++) {
            var vehicleTypeId = checkboxes[i].getAttribute('vehicle_type_id');
            if (vehicleTypeIds.includes(vehicleTypeId)) {
                checkboxes[i].checked = true;
                simulateChangeEvent(checkboxes[i]);
            }
        }
//        console.log('Checkboxen wurden aktiviert.');
    }

    // Funktion zum Simulieren des Änderungsereignisses
    function simulateChangeEvent(element) {
        var event = new Event('change', {
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(event);
    }

    // Funktion zum Hinzufügen des neuen Buttons
    function addNewButton() {
        var backButton = document.querySelector('a[href^="/missions/"][href$="/backalarmAll"]');
        if (backButton) {
            var newButton = document.createElement('button');
            newButton.textContent = 'Allen Rettungsdienst weiteralarmieren';
            newButton.addEventListener('click', function() {
                var tabContent = document.querySelector('div#vehicle_list_step div.tab-content');
                if (tabContent) {
                    var tabLink = tabContent.querySelector('div#occupied');
                    if (tabLink) {
                        tabLink.classList.add('active');
                        setTimeout(activateCheckboxes, 500); // Wartezeit vor dem Aktivieren der Checkboxen
                    } else {
//                        console.log('Tab mit der ID "occupied" wurde nicht gefunden.');
                    }
                } else {
//                    console.log('Tab-Inhaltsdiv wurde nicht gefunden.');
                }
            });

            backButton.parentNode.insertBefore(newButton, backButton);
//            console.log('Neuer Button wurde hinzugefügt.');
        } else {
//            console.log('Back-Button wurde nicht gefunden.');
        }
    }

    // Skript ausführen
    addNewButton();
})();
