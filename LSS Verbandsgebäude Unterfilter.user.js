// ==UserScript==
// @name         LSS Verbandsgebäude Unterfilter
// @version      1.0
// @description  Fügt Unterfilter für Verbandsgebäude hinzu
// @author       Sobol
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    // Mapping der Bilddateien zu den Unterfilter-Bezeichnungen
    const buildingMap = {
        "building_hospital_other.png": "Verbandskrankenhäuser",
        "building_polizeiwache_other.png": "Verbandszellen",
        "building_rettungsschule_other.png": "Rettungsschulen",
        "building_polizeischule_other.png": "Polizeischulen",
        "building_thw_school_other.png": "THW-Schulen",
        "building_fireschool_other.png": "Feuerwehrschulen",
        "building_coastal_rescue_school_other.png": "Seenotakademien",
        "building_bereitstellungsraum_other.png": "Bereitstellungsräume",
    };

    const mapSelector = "div.leaflet-control-layers-overlays";
    const markerSelector = ".leaflet-marker-pane img.leaflet-marker-icon";

    function waitForElement(selector, callback) {
        const existing = document.querySelector(selector);
        if (existing) {
            callback(existing);
            return;
        }

        const observer = new MutationObserver(() => {
            const found = document.querySelector(selector);
            if (found) {
                observer.disconnect();
                callback(found);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Unterfilter UI erstellen
    function createSubFilterUI(labelElement) {
        if (document.getElementById("verband-subfilter-box")) return;

        const container = document.createElement("div");
        container.id = "verband-subfilter-box";
        container.style.marginLeft = "25px";
        container.style.marginTop = "5px";

        Object.entries(buildingMap).forEach(([src, label]) => {
            const id = "filter-" + src.replace(".png", "");

            const wrapper = document.createElement("div");
            wrapper.style.marginBottom = "3px";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = id;
            checkbox.checked = true;
            checkbox.dataset.src = src;

            const lbl = document.createElement("label");
            lbl.setAttribute("for", id);
            lbl.textContent = " " + label;

            checkbox.addEventListener("change", updateMarkers);

            wrapper.appendChild(checkbox);
            wrapper.appendChild(lbl);
            container.appendChild(wrapper);
        });

        labelElement.insertAdjacentElement("afterend", container);
    }

    // Marker anhand der Unterfilter ein-/ausblenden
    function updateMarkers() {
        const activeSrc = [...document.querySelectorAll("#verband-subfilter-box input[type=checkbox]")]
            .filter(cb => cb.checked)
            .map(cb => cb.dataset.src);

        document.querySelectorAll(markerSelector).forEach(marker => {
            const src = marker.src.split("/").pop();

            if (!buildingMap[src]) return; // kein Verbandsgebäude

            marker.style.display = activeSrc.includes(src) ? "" : "none";
        });
    }

    // Reaktion auf Hauptfilter "Verbandsgebäude"
    function setupMainFilterObserver(checkbox) {
        checkbox.addEventListener("change", () => {
            const subs = document.querySelectorAll("#verband-subfilter-box input");

            if (checkbox.checked) {
                subs.forEach(cb => cb.checked = true);
                updateMarkers();
            } else {
                // Alle Verbandsmarker wieder anzeigen
                document.querySelectorAll(markerSelector).forEach(marker => {
                    const src = marker.src.split("/").pop();
                    if (buildingMap[src]) marker.style.display = "";
                });
            }
        });
    }

    // Leaflet Map Zoom/Move Listener → Filter erneut anwenden
    function setupMapObserver() {
        const interval = setInterval(() => {
            if (window.map && typeof window.map.on === "function") {
                clearInterval(interval);

                window.map.on("zoomend", updateMarkers);
                window.map.on("moveend", updateMarkers);
            }
        }, 10);
    }

    // Initialisieren
    waitForElement(mapSelector, () => {
        const labels = document.querySelectorAll(mapSelector + " label");

        labels.forEach(label => {
            const a = label.querySelector("a.alliance-buildings-filter");
            if (!a) return;

            if (a.textContent.includes("Verbandsgebäude")) {
                const checkbox = label.querySelector("input[type=checkbox]");
                if (!checkbox) return;

                createSubFilterUI(label);
                setupMainFilterObserver(checkbox);
                setupMapObserver();
            }
        });
    });

})();
