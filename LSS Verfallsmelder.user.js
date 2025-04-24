// ==UserScript==
// @name         LSS Verfallsmelder
// @namespace    www.leitstellenspiel.de
// @version      1.1
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

    function getLastUTC2AM() {
        const now = new Date();
        const utcHour = now.getUTCHours();

        const lastUTC2am = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            2, 0, 0, 0
        ));

        if (utcHour < 2) {
            // Wenn es vor 2 Uhr UTC ist, dann auf den Vortag zurückgehen
            lastUTC2am.setUTCDate(lastUTC2am.getUTCDate() - 1);
        }

        return lastUTC2am;
    }

    function checkMissions() {
        const lastUTC2am = getLastUTC2AM();
        const lastUTC2amTimestamp = lastUTC2am.getTime();

        const missionsPanel = document.getElementById('missions-panel-body');
        if (!missionsPanel) return;

        const missions = missionsPanel.getElementsByClassName('missionSideBarEntry');

        Array.from(missions).forEach(mission => {
            const missionDataRaw = mission.getAttribute('data-sortable-by');
            if (!missionDataRaw) return;

            const missionData = JSON.parse(missionDataRaw);
            const createdAtUnix = missionData.created_at; // in Sekunden
            const createdAtMs = createdAtUnix * 1000; // in Millisekunden

            if (createdAtMs < lastUTC2amTimestamp) {
                const missionId = missionData.id;
                const heading = document.getElementById('mission_panel_heading_' + missionId);

                if (heading && !heading.querySelector('.verfallsmelder-alert')) {
                    const alert = document.createElement('span');
                    alert.className = 'verfallsmelder-alert';
                    alert.textContent = '!!!';
                    alert.style.color = 'red';
                    alert.style.float = 'right';
                    alert.style.fontWeight = 'bold';
                    heading.appendChild(alert);
                }
            }
        });
    }

    // Einmal direkt ausführen
    checkMissions();

    // Optional: Wiederholen
    // setInterval(checkMissions, 60000); // alle 60 Sekunden
})();
