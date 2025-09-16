// ==UserScript==
// @name         LSS Grafiksetleitstellenmenü alphabetisch sortieren
// @namespace    https://leitstellenspiel.de/
// @version      1.0
// @description  Sortiert das Dropdown-Menü bei den Fahrzeug-Grafiken alphabetisch nach Leitstellen-Namen, sobald es geöffnet wird
// @author       Sobol
// @match        https://www.leitstellenspiel.de/vehicle_graphics/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function sortDropdown(dropdown) {
        if (!dropdown) return;

        // Alle LI-Elemente einsammeln
        const items = Array.from(dropdown.querySelectorAll('li'));

        // Nach dem Text im <span class="text"> sortieren
        items.sort((a, b) => {
            const textA = a.querySelector('.text')?.innerText.trim().toLowerCase() || '';
            const textB = b.querySelector('.text')?.innerText.trim().toLowerCase() || '';
            return textA.localeCompare(textB, 'de');
        });

        // UL leeren und sortierte Items wieder einfügen
        dropdown.innerHTML = '';
        items.forEach(item => dropdown.appendChild(item));
    }

    // Observer für Änderungen an aria-expanded
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === "attributes" && mutation.attributeName === "aria-expanded") {
                const target = mutation.target;
                if (target.getAttribute("aria-expanded") === "true") {
                    sortDropdown(target);
                }
            }
        }
    });

    // Warten, bis das Menü existiert
    function initObserver() {
        const dropdown = document.querySelector('.dropdown-menu.inner[role="listbox"]');
        if (dropdown) {
            observer.observe(dropdown, { attributes: true });
        } else {
            // Wenn noch nicht vorhanden, erneut versuchen
            setTimeout(initObserver, 500);
        }
    }

    initObserver();
})();
