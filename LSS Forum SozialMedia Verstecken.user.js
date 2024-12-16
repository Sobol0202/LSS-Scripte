// ==UserScript==
// @name         LSS Forum: SozialMedia Verstecken
// @namespace    leitstellenspiel.de
// @version      1.1
// @description  Blendet bestimmte Forenelemente aus
// @author       MissSobol
// @match        https://forum.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Flags zum Steuern des Ausblendens
    const hideSocialMedia = true; // Facebook, Instagram, TikTok
    const hideToGame = true; // Leitstellenspiel

    // Href-URLs, die ausgeblendet werden sollen
    const socialMediaHrefs = [
        "https://www.facebook.com/Leitstellenspiel.de",
        "https://www.instagram.com/leitstellenspiel/",
        "https://www.tiktok.com/@leitstellenspiel.de"
    ];

    const toGameHref = "https://www.leitstellenspiel.de";

    // Funktion zum Verstecken der Elemente
    function hideElements() {
        if (hideSocialMedia) {
            socialMediaHrefs.forEach(href => {
                const elements = document.querySelectorAll(`li a[href='${href}']`);
                elements.forEach(element => {
                    element.closest('li').style.display = 'none';
                });
            });
        }

        if (hideToGame) {
            const elements = document.querySelectorAll(`li a[href='${toGameHref}']`);
            elements.forEach(element => {
                element.closest('li').style.display = 'none';
            });
        }
    }

    // Verstecke Elemente sofort beim Start des Skripts
    hideElements();

    // Zusätzlicher Schutz für dynamische Inhalte
    new MutationObserver(hideElements).observe(document.body, { childList: true, subtree: true });

})();