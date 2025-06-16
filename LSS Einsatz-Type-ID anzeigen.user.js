// ==UserScript==
// @name         LSS Einsatz-Type-ID anzeigen
// @namespace    https://leitstellenspiel.de/
// @version      1.0
// @description  Zeigt die Einsatz-Type-ID auf der Einsatzseite an
// @author       Sobol
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function getMissionTypeInMissionWindow() {
        const missionHelpBtn = document.querySelector('#mission-type-helper-mobile');
        if (!missionHelpBtn) return '-1';

        let missionType = new URL(
            missionHelpBtn.getAttribute('href') ?? '',
            window.location.origin
        ).pathname.split('/')[2];

        const missionInfoDiv = document.querySelector('#mission_general_info');
        const overlayIndex = missionInfoDiv?.getAttribute('data-overlay-index') ?? 'null';
        if (overlayIndex && overlayIndex !== 'null') {
            missionType += `-${overlayIndex}`;
        }

        const additionalOverlay = missionInfoDiv?.getAttribute('data-additive-overlays') ?? 'null';
        if (additionalOverlay && additionalOverlay !== 'null') {
            missionType += `/${additionalOverlay}`;
        }

        return missionType;
    }

    function addMissionTypeID() {
        const missionH1 = document.querySelector('#missionH1');
        if (!missionH1) return;

        const existingBadge = document.querySelector('#mission-type-id-badge');
        if (existingBadge) return; // Nicht doppelt einfügen

        const missionTypeID = getMissionTypeInMissionWindow();

        const badge = document.createElement('span');
        badge.id = 'mission-type-id-badge';
        badge.textContent = `Einsatz-ID: ${missionTypeID}`;
        badge.style.marginLeft = '10px';
        badge.style.fontSize = '12px';
        badge.style.color = '#fff';
        badge.style.backgroundColor = '#007bff';
        badge.style.padding = '2px 6px';
        badge.style.borderRadius = '4px';
        badge.style.verticalAlign = 'middle';

        missionH1.appendChild(badge);
    }

    // Warten bis DOM fertig
    const observer = new MutationObserver(() => {
        const container = document.querySelector('#mission_general_info');
        if (container) {
            addMissionTypeID();
            observer.disconnect();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
