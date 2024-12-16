// ==UserScript==
// @name         LSS Zerstören und zur Wache
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Entfernt die Sicherheitsabfrage beim Zerstören von Fahrzeugen und leitet zur Wache um, wenn ein Fahrzeug zerstört wurde
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/vehicles/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Entfernt das data-confirm-Attribut von bestimmten Links
    function removeDataConfirm() {
        const links = document.querySelectorAll('a.btn.btn-danger[data-confirm][data-method="delete"]');
        links.forEach(link => {
            link.removeAttribute('data-confirm');
        });
        //console.log(`${links.length} link(s) updated.`);
    }

    // Überprüft und leitet zur Wache um, wenn ein Fahrzeug zerstört wurde
    function checkAndRedirect() {
        let alertElement = document.querySelector('div.alert.alert-success');
        if (alertElement && alertElement.textContent.includes('Das Fahrzeug wurde zerstört.')) {
            let backToBuildingElement = document.getElementById('back_to_building');
            if (backToBuildingElement) {
                window.location.href = backToBuildingElement.href;
            }
        }
    }

    // MutationObserver initialisieren und konfigurieren
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                checkAndRedirect();
            }
        });
    });

    const observerConfig = {
        childList: true,
        subtree: true
    };

    // Funktionen beim Laden der Seite ausführen
    observer.observe(document.body, observerConfig);
    removeDataConfirm();
    checkAndRedirect();
})();
