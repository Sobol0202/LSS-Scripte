// ==UserScript==
// @name         LSS Forum: SozialMedia Verstecken
// @namespace    leitstellenspiel.de
// @version      1.2
// @description  Blendet bestimmte Forenelemente aus
// @author       MissSobol
// @match        https://forum.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const hideSocialMedia = true;
    const hideToGame = true;

    const socialMediaHrefs = [
        "https://www.facebook.com/Leitstellenspiel.de",
        "https://www.instagram.com/leitstellenspiel/",
        "https://www.tiktok.com/@leitstellenspiel.de",
        "https://www.threads.com/@leitstellenspiel"
    ];

    const toGameHref = "https://www.leitstellenspiel.de";

    function hideElements() {
        if (hideSocialMedia) {
            socialMediaHrefs.forEach(href => {
                document.querySelectorAll(`li a[href='${href}']`).forEach(element => {
                    element.closest('li')?.style.setProperty('display', 'none');
                });
            });
        }

        if (hideToGame) {
            document.querySelectorAll(
                `li[data-identifier="com.woltlab.wcf.generic19"] > a.boxMenuLink[href='${toGameHref}']`
            ).forEach(element => {
                element.closest('li')?.style.setProperty('display', 'none');
            });
        }
    }

    hideElements();

    new MutationObserver(hideElements).observe(document.body, {
        childList: true,
        subtree: true
    });

})();
