// ==UserScript==
// @name         LSS Hauptleitstelle Dropdown Alphabetisch sortieren
// @version      1.0
// @description  Sortiert das Dropdown "Haupt-Leitstelle" alphabetisch
// @author       Sobol
// @match        https://www.leitstellenspiel.de/settings/index
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';


    // Findet ein <select> basierend auf einem Label-Text
    function findSelectByLabel(labelText, root = document) {
        const labels = root.querySelectorAll("label");
        for (const label of labels) {
            if (label.textContent.trim() === labelText) {
                const forAttr = label.getAttribute("for");
                if (forAttr) {
                    return root.getElementById
                        ? root.getElementById(forAttr)
                        : document.getElementById(forAttr);
                }
            }
        }
        return null;
    }

    // Sortiert die Optionen eines Selects alphabetisch
    function sortSelectOptions(select) {
        if (!select) return;

        const options = Array.from(select.options);
        const selectedValue = select.value;

        // Leere Option oben behalten (falls vorhanden)
        const emptyOption = options.find(opt => opt.value === "");

        const sorted = options
            .filter(opt => opt.value !== "")
            .sort((a, b) => a.text.localeCompare(b.text, "de", { sensitivity: "base" }));

        select.innerHTML = "";

        if (emptyOption) {
            select.appendChild(emptyOption);
        }

        sorted.forEach(opt => select.appendChild(opt));

        // Auswahl beibehalten
        select.value = selectedValue;
    }

     // Fügt einen Event Listener hinzu, der beim Öffnen des Dropdowns die Optionen sortiert.
    function attachSortOnOpen(select) {
        if (!select) return;
        if (select.dataset.sortAttached === "true") return;

        select.addEventListener("mousedown", () => sortSelectOptions(select));
        select.addEventListener("focus", () => sortSelectOptions(select));

        // einmal initial sortieren
        sortSelectOptions(select);

        select.dataset.sortAttached = "true";
    }


    // Initialisierung für settings/index
        function initSettingsPage() {
        const select = findSelectByLabel("Haupt-Leitstelle");
        attachSortOnOpen(select);
    }

    // Initialisierung für buildings/
        function initBuildingsPage() {
        const target = document.getElementById("tab_settings");
        if (!target) return;

        const observer = new MutationObserver(() => {
            const select = findSelectByLabel("Haupt-Leitstelle", target);
            attachSortOnOpen(select);
        });

        observer.observe(target, { childList: true, subtree: true });
    }

    // Seite erkennen und passende Init-Funktion starten
    if (location.pathname.startsWith("/settings/index")) {
        initSettingsPage();
    } else if (location.pathname.startsWith("/buildings/")) {
        initBuildingsPage();
    }

})();
