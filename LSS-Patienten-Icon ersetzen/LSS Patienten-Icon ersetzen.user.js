// ==UserScript==
// @name         LSS Patienten-Icon ersetzen
// @version      1.1
// @description  Ersetzt das Patienten-Icon durch das Ambulance Symbol
// @author       Sobol
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const NEW_ICON_URL = 'https://github.com/Sobol0202/LSS-Scripte/raw/main/LSS-Patienten-Icon%20ersetzen/icons8-krankenwagen-50.png';
    const TARGET_SELECTOR = '#mission_general_info img.patientPrisonerIcon[src*="patient_dark.svg"]';

    function replacePatientIcon() {
        const img = document.querySelector(TARGET_SELECTOR);
        if (!img) return false;

        img.src = NEW_ICON_URL;
        img.removeAttribute('srcset');
        return true;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', replacePatientIcon);
    } else {
        replacePatientIcon();
    }

    const observer = new MutationObserver(() => replacePatientIcon());
    observer.observe(document.body, { childList: true, subtree: true });

    let tries = 0;
    const interval = setInterval(() => {
        tries++;
        if (replacePatientIcon() || tries > 15) {
            clearInterval(interval);
        }
    }, 2000);
})();
