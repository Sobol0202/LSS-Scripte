// ==UserScript==
// @name         LSS Verfallsmelder
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Fügt "Läuft bald ab" zu alten Missionen hinzu
// @author       MissSobol
// @match       https://www.leitstellenspiel.de/
// @match       https://polizei.leitstellenspiel.de/
// @match       https://www.leitstellenspiel.de/
// @match       https://polizei.leitstellenspiel.de/
// @match       https://www.meldkamerspel.com/
// @match       https://politie.meldkamerspel.com/
// @match       https://www.meldkamerspel.com/
// @match       https://politie.meldkamerspel.com/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion, die die Missionen überprüft
    function checkMissions() {
        const HOURS_LIMIT = 22;
        const MILLISECONDS_LIMIT = HOURS_LIMIT * 3600000;
        const CURRENT_TIME = Date.now();

        //console.log("Aktuelle Zeit:", new Date(CURRENT_TIME).toISOString());

        // Holen des Mission Panels
        const missionsPanel = document.getElementById('missions-panel-body');
        if (!missionsPanel) {
            //console.log("Mission Panel nicht gefunden.");
            return;
        } else {
            //console.log("Mission Panel gefunden.");
        }

        // Holen aller Missionen
        const missions = missionsPanel.getElementsByClassName('missionSideBarEntry');
        //console.log("Anzahl gefundener Missionen:", missions.length);

        // Überprüfung jeder Mission
        Array.from(missions).forEach(mission => {
            const missionData = JSON.parse(mission.getAttribute('data-sortable-by'));
            const missionAgeUnix = missionData.age * 1000; // Alter der Mission in Millisekunden
            const missionCreationTime = missionAgeUnix;

            //console.log(`Mission ID: ${missionData.id}, Mission Erstellungszeit: ${new Date(missionCreationTime).toISOString()}`);

            if (CURRENT_TIME - missionCreationTime > MILLISECONDS_LIMIT) {
                // Holen des Elements mit der ID 'mission_panel_heading_' + mission_id
                const missionId = missionData.id;
                const missionPanelHeading = document.getElementById('mission_panel_heading_' + missionId);

                if (missionPanelHeading) {
                    console.log(`Mission Panel Heading für Mission ${missionId} gefunden.`);
                    // Hinweis "Läuft bald ab" einfügen
                    const alertText = document.createElement('span');
                    alertText.textContent = '!!!';
                    alertText.style.color = 'red';
                    alertText.style.float = 'right';
                    alertText.style.fontWeight = 'bold';
                    missionPanelHeading.appendChild(alertText);
                    //console.log(`Hinweis für Mission ${missionId} eingefügt.`);
                } else {
                    //console.log(`Mission Panel Heading für Mission ${missionId} nicht gefunden.`);
                }
            } else {
                //console.log(`Mission ${missionData.id} ist noch nicht abgelaufen.`);
            }
        });
    }

    // Funktion regelmäßig ausführen
    // setInterval(checkMissions, 60000); // alle 60 Sekunden
    // Initiales Ausführen der Funktion
    checkMissions();

})();
