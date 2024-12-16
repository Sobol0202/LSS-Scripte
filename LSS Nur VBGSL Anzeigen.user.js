// ==UserScript==
// @name         LSS Nur VBGSL Anzeigen
// @namespace    www.leitstellenspiel.de
// @version      0.9
// @description  Filtert Verbandsgroßeinsätze
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Ausblenden von Missionen, die nicht Verbandsgroßeinsätze sind
    function filterMissions() {
        // Alle Missionen im missions-panel-body finden
        var missionPanels = document.querySelectorAll('#missions-panel-body .missionSideBarEntry');

        missionPanels.forEach(function(panel) {
            // Überprüfen, ob mission_type_id="null" ist
            var missionTypeId = panel.getAttribute('mission_type_id');
            if (missionTypeId !== 'null' && missionTypeId !== null) {
                // Mission ausblenden, wenn nicht Verbandsgroßeinsatz
                panel.style.display = 'none';
            }
        });
    }

    // Funktion zum Anzeigen aller Missionen und Rückkehr zur ursprünglichen Button-Farbe
    function resetMissions() {
        // Alle Missionen im missions-panel-body anzeigen
        var missionPanels = document.querySelectorAll('#missions-panel-body .missionSideBarEntry');
        missionPanels.forEach(function(panel) {
            panel.style.display = '';
        });
    }

    // Neuen Button erstellen und dem DOM hinzufügen
    function createFilterButton() {
        var missionMainPanel = document.querySelector('.missions-panel-main');
        if (missionMainPanel) {
            var newButton = document.createElement('a');
            newButton.href = '#';
            newButton.setAttribute('aria-label', 'Verbandsgroßeinsätze');
            newButton.classList.add('btn', 'btn-xs', 'btn-success');
            newButton.setAttribute('role', 'button');
            newButton.title = 'Verbandsgroßeinsätze';
            newButton.innerHTML = '<img class="icon icons8-Siren-Filled" src="/images/alliance.svg" width="15" height="15"> GSL</a>';
            newButton.addEventListener('click', function(event) {
                event.preventDefault();

                if (newButton.classList.contains('btn-info')) {
                    resetMissions();
                } else {
                    filterMissions();
                }

                // Wechseln zwischen btn-success und btn-danger
                newButton.classList.toggle('btn-success');
                newButton.classList.toggle('btn-info');
            });

            // Den vorherigen Button finden
            var prevButton = document.querySelector('#mission_select_sicherheitswache');
            // Neuen Button hinter dem vorherigen Button einfügen
            prevButton.parentNode.insertBefore(newButton, prevButton.nextSibling);
        }
    }
    createFilterButton();
})();
