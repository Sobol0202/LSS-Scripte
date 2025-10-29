// ==UserScript==
// @name         LSS Patienten-Icon ersetzen
// @version      1.0
// @description  Ersetzt das Patienten-Icon durch das Ambulance Symbol
// @author       Sobol
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const NEW_ICON_URL = 'LINK';

    function replacePatientIcon() {
        const h3 = document.querySelector('h3#missionH1');
        if (!h3) return;

        const img = h3.querySelector('img.patientPrisonerIcon[src="/images/patient_dark.svg"]');
        if (img) {
            img.src = NEW_ICON_URL;
            console.log('Patienten-Icon ersetzt:', img.src);
        }
    }

    replacePatientIcon();

    const observer = new MutationObserver(() => {
        replacePatientIcon();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
