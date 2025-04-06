// ==UserScript==
// @name         LSS Kopiere Einsatznamen+Einsatztyp+MissionID
// @version      1.0
// @description  Fügt einen Button ein, der Name + EinsatzID + MissionID in die Zwischenablage kopiert.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        GM_setClipboard
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // Funktion zur Ermittlung der EinsatzID (missionType)
    function getMissionTypeInMissionWindow() {
        const missionHelpBtn = document.querySelector('#mission_help'); // Link zur Einsatzhilfe finden
        if (!missionHelpBtn) return '-1'; // Falls nicht gefunden, Rückgabe -1

        // Aus dem Link die EinsatzID extrahieren
        let missionType = new URL(
            missionHelpBtn.getAttribute('href') ?? '',
            window.location.origin
        ).pathname.split('/')[2];

        // Optionalen Overlay-Index anhängen, falls vorhanden
        const overlayIndex =
            document.querySelector('#mission_general_info')
                ?.getAttribute('data-overlay-index') ?? 'null';
        if (overlayIndex && overlayIndex !== 'null')
            missionType += `-${overlayIndex}`;

        // Weitere Overlays anhängen, falls vorhanden
        const additionalOverlay =
            document.querySelector('#mission_general_info')
                ?.getAttribute('data-additive-overlays') ?? 'null';
        if (additionalOverlay && additionalOverlay !== 'null')
            missionType += `/${additionalOverlay}`;

        return missionType;
    }

    // Funktion zur Extraktion der MissionID aus dem href-Link
    function getMissionIdFromHREF() {
        // Suche nach einem Link, der die MissionID enthält
        const missionLink = document.querySelector('#missionH1 a[href*="mission_id="]');
        if (!missionLink) return '-1';

        // Hole die mission_id aus den URL-Parametern
        const urlParams = new URLSearchParams(missionLink.getAttribute('href').split('?')[1]);
        return urlParams.get('mission_id') ?? '-1';
    }

    // Funktion zum Erstellen und Einfügen des Buttons
    function createButton() {
        const h3 = document.querySelector('#missionH1');
        if (!h3) return;

        // Button erstellen
        const button = document.createElement('button');
        button.className = 'btn btn-default';
        button.textContent = '📋 Kopieren';
        button.style.marginLeft = '10px';

        // Klick-Ereignis für den Button definieren
        button.addEventListener('click', () => {
            // Einsatznamen aus dem H3 holen
            const name = h3.childNodes[2]?.textContent?.trim() ?? 'Unbekannt';

            // EinsatzID und MissionID ermitteln
            const einsatzId = getMissionTypeInMissionWindow();
            const missionId = getMissionIdFromHREF();

            // Zusammensetzen der Informationen
            const result = `${name}+${einsatzId}+${missionId}`;

            // In Zwischenablage kopieren
            GM_setClipboard(result);

            // Nutzer informieren
            //alert(`In Zwischenablage kopiert:\n${result}`);
        });

        // Button dem H3-Element hinzufügen
        h3.appendChild(button);
    }

    // Wenn die Seite vollständig geladen ist, Button erstellen
    window.addEventListener('load', () => {
        createButton();
    });

})();
