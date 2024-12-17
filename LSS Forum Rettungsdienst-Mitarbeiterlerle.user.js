// ==UserScript==
// @name         LSS+Forum Rettungsdienst-Mitarbeiterler
// @version      1.1
// @description  Ersetze "Rettungsdienstler" durch "Rettungsdienst-Mitarbeiter" und "THWler" durch "THW-Mitarbeiter"
// @author       MissSobol
// @match        *://*.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Ersetzen von Text im DOM
    function replaceText(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            node.nodeValue = node.nodeValue
                .replace(/Rettungsdienstler/g, "Rettungsdienst-Mitarbeiter")
                .replace(/THWler/g, "THW-Mitarbeiter");
        } else {
            for (const child of node.childNodes) {
                replaceText(child);
            }
        }
    }

    // Beobachte Änderungen im DOM, um dynamische Inhalte zu bearbeiten
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            for (const addedNode of mutation.addedNodes) {
                if (addedNode.nodeType === Node.ELEMENT_NODE) {
                    replaceText(addedNode);
                }
            }
        });
    });

    // Beginne mit der Beobachtung des Dokuments
    observer.observe(document.body, { childList: true, subtree: true });

    // Ersetze Text direkt beim Laden der Seite
    replaceText(document.body);
})();
