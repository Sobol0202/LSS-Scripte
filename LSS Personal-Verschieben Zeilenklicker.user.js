// ==UserScript==
// @name         LSS Personal-Verschieben Zeilenklicker
// @version      1.0
// @description  Klick auf Zeile aktiviert Checkbox im Einstellungsbereich der LSS-Personalseite
// @author       Sobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // MutationObserver, um dynamisch geladene Panels zu erkennen
    const observer = new MutationObserver(() => {
        document.querySelectorAll('.panel.panel-default').forEach(panel => {
            panel.querySelectorAll('tbody tr').forEach(row => {
                // Verhindert Mehrfachbindung
                if (!row.dataset.checkboxBound) {
                    row.dataset.checkboxBound = 'true';

                    row.addEventListener('click', function (event) {
                        // Verhindert, dass Klick direkt auf die Checkbox sie doppelt toggelt
                        if (event.target.tagName.toLowerCase() !== 'input') {
                            const checkbox = row.querySelector('input[type="checkbox"]');
                            if (checkbox) {
                                checkbox.checked = !checkbox.checked;
                                // Change-Event auslösen
                                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                    });
                }
            });
        });
    });

    // Observer auf body starten
    observer.observe(document.body, { childList: true, subtree: true });
})();
