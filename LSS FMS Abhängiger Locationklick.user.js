// ==UserScript==
// @name         LSS FMS Abhängiger Locationklick
// @version      1.0
// @description  Erweitertes Klickverhalten für das Standort-Icon im Funkfenster
// @match        https://www.leitstellenspiel.de/*
// @match        https://leitstellenspiel.de/*
// @grant        GM_xmlhttpRequest
// @connect      leitstellenspiel.de
// @author       Sobol
// ==/UserScript==

(function() {
    "use strict";

    const observer = new MutationObserver(() => {
        addClickHandlers();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    function addClickHandlers() {
        document.querySelectorAll("#radio_messages li img.vehicle_search").forEach(img => {
            if (!img.dataset.lssEnhanced) {
                img.dataset.lssEnhanced = "true";
                img.addEventListener("click", onLocationClick);
            }
        });
    }

    function onLocationClick(event) {
        const li = event.target.closest("li");
        if (!li) return;

        const vehicleId = event.target.getAttribute("vehicle_id");

        // FMS ermitteln
        const fmsSpan = li.querySelector("span[class*='building_list_fms_']");
        if (!fmsSpan) return;
        const fms = parseInt(fmsSpan.textContent.trim());

        const vehicleLink = li.querySelector("a[href*='/vehicles/']");
        const missionLink = li.querySelector("a[href*='/missions/']");

        // FMS 1, 3 oder 7
        // Standardverhalten durchlaufen lassen
        if ([1, 3, 7].includes(fms)) {
            return;
        }

        // alle anderen FMS Standardverhalten verhindern
        event.preventDefault();
        event.stopImmediatePropagation();

        // FMS 4 oder 5 → Einsatz öffnen
        if ([4, 5].includes(fms)) {
            if (missionLink) {
                window.open(missionLink.href, "_blank");
            }
            return;
        }

        // FMS 2 oder 6 → Gebäude öffnen
        if ([2, 6].includes(fms)) {
            if (!vehicleLink) return;

            GM_xmlhttpRequest({
                method: "GET",
                url: vehicleLink.href,
                onload: function(response) {
                    const html = document.createElement("html");
                    html.innerHTML = response.responseText;

                    const buildingLink = html.querySelector("#vehicle-attr-station a[href*='/buildings/']");
                    if (buildingLink) {
                        window.open(buildingLink.href, "_blank");
                    }
                }
            });

            return;
        }
    }
})();
