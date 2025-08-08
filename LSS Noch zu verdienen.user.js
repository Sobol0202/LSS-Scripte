// ==UserScript==
// @name         LSS Noch zu verdienen
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0
// @description  Berechnet wie viele Credits noch zu verdienen sind
// @author       Sobol
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const panelSelector = '#missions-panel-body';

    function getAverageCreditsFromMission(mission) {
        const rawAttr = mission.getAttribute('data-sortable-by');
        if (!rawAttr) {
            return 0;
        }
        try {
            const decoded = rawAttr.replace(/&quot;/g, '"');
            const data = JSON.parse(decoded);
            if (data && typeof data.average_credits === 'number') {
                return data.average_credits;
            }
        } catch (e) {
        }
        return 0;
    }

    function getMissionDivsFromList(listElement) {
        if (!listElement) return [];
        const allChildren = Array.from(listElement.children);
        return allChildren.filter(el => /^mission_\d+$/.test(el.id));
    }

    function calculateAndDisplay() {
        const panel = document.querySelector(panelSelector);
        if (!panel) {
            return;
        }

        let ownMissionsTotal = 0;
        let allianceMissionsTotal = 0;

        const ownLists = [
            'mission_list',
            'mission_list_krankentransporte',
            'mission_list_sicherheitswache'
        ];

        const allianceLists = [
            'mission_list_alliance',
            'mission_list_alliance_event',
            'mission_list_krankentransporte_alliance',
            'mission_list_sicherheitswache_alliance'
        ];

        ownLists.forEach(listId => {
            const listElement = document.getElementById(listId);
            if (!listElement) {
                return;
            }
            const missions = getMissionDivsFromList(listElement);
            missions.forEach(mission => ownMissionsTotal += getAverageCreditsFromMission(mission));
        });

        allianceLists.forEach(listId => {
            const listElement = document.getElementById(listId);
            if (!listElement) {
                return;
            }
            const missions = getMissionDivsFromList(listElement);
            missions.forEach(mission => allianceMissionsTotal += getAverageCreditsFromMission(mission));
        });

        let displayEl = document.getElementById('credits_summary_display');
        if (!displayEl) {
            displayEl = document.createElement('div');
            displayEl.id = 'credits_summary_display';
            displayEl.style.display = 'block';
            displayEl.style.clear = 'both';
            displayEl.style.marginTop = '4px';
            displayEl.style.marginBottom = '4px';
            displayEl.style.fontWeight = 'bold';
            displayEl.style.color = '#007700';
            displayEl.style.fontSize = '14px';

            const participationFiltersDiv = document.querySelector('.mission-participation-filters');

            if (participationFiltersDiv) {
                let displayEl = document.getElementById('credits_summary_display');
                if (!displayEl) {
                    displayEl = document.createElement('div');
                    displayEl.id = 'credits_summary_display';
                    displayEl.style.display = 'block';
                    displayEl.style.width = '100%';
                    displayEl.style.margin = '8px 0';
                    displayEl.style.fontWeight = 'bold';
                    displayEl.style.color = '#007700';
                    displayEl.style.fontSize = '14px';
                }

                participationFiltersDiv.after(displayEl);
            }

        }

        displayEl.textContent =
            ` 👤: ${ownMissionsTotal.toLocaleString()} Cr | 👥: ${allianceMissionsTotal.toLocaleString()} Cr`;
    }

    function initObserver() {
        const panel = document.querySelector(panelSelector);
        if (!panel) {
            return;
        }

        const observer = new MutationObserver(() => {
            calculateAndDisplay();
        });

        observer.observe(panel, { childList: true, subtree: true });
    }

    function init() {
        if (document.querySelector(panelSelector)) {
            calculateAndDisplay();
            initObserver();
        } else {
            const checkInterval = setInterval(() => {
                if (document.querySelector(panelSelector)) {
                    clearInterval(checkInterval);
                    calculateAndDisplay();
                    initObserver();
                }
            }, 500);
        }
    }

    init();
})();
