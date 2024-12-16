// ==UserScript==
// @name         LSS Sicherheitswachen über Notfalleinsätzen
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Verschiebt die Sicherheitswachen über die Notffalleinsätze
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Finde die Elemente
    var missionListSicherheitswache = document.getElementById('mission_list_sicherheitswache');
    var missionList = document.getElementById('mission_list');
    var missionListKrankentransporte = document.getElementById('mission_list_krankentransporte');
    var missionListAlliance = document.getElementById('mission_list_alliance');
    var missionListAllianceEvent = document.getElementById('mission_list_alliance_event');

    // Überprüfe, ob die Elemente gefunden wurden
    if (missionListSicherheitswache && missionList && missionListKrankentransporte && missionListAlliance && missionListAllianceEvent) {
        // Verschiebe mission_list_sicherheitswache vor mission_list
        missionList.parentNode.insertBefore(missionListSicherheitswache, missionList);

        // Verschiebe mission_list_krankentransporte vor mission_list_alliance
        missionListAlliance.parentNode.insertBefore(missionListKrankentransporte, missionListAlliance);

        // Verschiebe mission_list_alliance vor mission_list_alliance_event
        missionListAllianceEvent.parentNode.insertBefore(missionListAlliance, missionListAllianceEvent);

        // Verschiebe mission_list_alliance_event nach mission_list_alliance
        missionListAlliance.appendChild(missionListAllianceEvent);
    }
})();
