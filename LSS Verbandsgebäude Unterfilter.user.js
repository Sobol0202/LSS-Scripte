// ==UserScript==
// @name         LSS Verbandsgebäude Unterfilter
// @version      1.1
// @description  Fügt Unterfilter für Verbandsgebäude im Karten-Dropdown hinzu.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    const buildingMap = {
        "building_hospital_other.png": "Verbandskrankenhäuser",
        "building_polizeiwache_other.png": "Verbandszellen",
        "building_rettungsschule_other.png": "Rettungsschulen",
        "building_polizeischule_other.png": "Polizeischulen",
        "building_thw_school_other.png": "THW-Schulen",
        "building_fireschool_other.png": "Feuerwehrschulen",
        "building_coastal_rescue_school_other.png": "Seenotakademien",
        "building_bereitstellungsraum_other.png": "Bereitstellungsräume"
    };

    const dropdownSelector = "#map_filters";
    const mainFilterSelector = "#alliance_buildings";
    const markerSelector =
        ".leaflet-marker-pane img.leaflet-marker-icon";

    const subFilterClass = "lss-verband-subfilter";

    let mainCheckbox = null;
    let markerObserver = null;
    let updateScheduled = false;

    function getMarkerType(marker) {
        try {
            const url = new URL(marker.src, location.href);
            return url.pathname.split("/").pop();
        } catch {
            return null;
        }
    }

    function getActiveFilters() {
        return new Set(
            [...document.querySelectorAll(
                "." + subFilterClass + " input[type=checkbox]"
            )]
                .filter(cb => cb.checked)
                .map(cb => cb.dataset.src)
        );
    }

    function updateMarkers() {
        if (!mainCheckbox) return;

        const activeFilters = getActiveFilters();

        document.querySelectorAll(markerSelector).forEach(marker => {
            const type = getMarkerType(marker);

            if (!Object.prototype.hasOwnProperty.call(
                buildingMap, type
            )) {
                return;
            }

            if (!mainCheckbox.checked) {
                marker.style.removeProperty("display");
                return;
            }

            if (activeFilters.has(type)) {
                marker.style.removeProperty("display");
            } else {
                marker.style.display = "none";
            }
        });
    }

    function scheduleUpdate() {
        if (updateScheduled) return;

        updateScheduled = true;

        requestAnimationFrame(() => {
            updateScheduled = false;
            updateMarkers();
        });
    }

    function createSubFilterUI() {
        const dropdown = document.querySelector(dropdownSelector);
        mainCheckbox = document.querySelector(mainFilterSelector);

        if (!dropdown || !mainCheckbox) return false;

        const mainLi = mainCheckbox.closest("li");
        if (!mainLi) return false;

        if (dropdown.querySelector("." + subFilterClass)) {
            return true;
        }

        const fragment = document.createDocumentFragment();

        Object.entries(buildingMap).forEach(([src, label]) => {
            const li = document.createElement("li");

            li.className =
                "filter_list__element " +
                "filter_list__element--third " +
                subFilterClass;

            li.style.paddingLeft = "25px";

            const labelElement = document.createElement("label");
            labelElement.style.cursor = "pointer";
            labelElement.style.display = "block";
            labelElement.style.marginBottom = "0";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = true;
            checkbox.dataset.src = src;
            checkbox.id = "lss-filter-" + src.replace(".png", "");

            checkbox.addEventListener("change", () => {
                scheduleUpdate();
            });

            labelElement.appendChild(checkbox);
            labelElement.appendChild(
                document.createTextNode(" " + label)
            );

            li.appendChild(labelElement);
            fragment.appendChild(li);
        });

        mainLi.after(fragment);

        return true;
    }

    function setupMainFilter() {
        if (!mainCheckbox) return;

        mainCheckbox.addEventListener("change", () => {
            const subCheckboxes = document.querySelectorAll(
                "." + subFilterClass + " input[type=checkbox]"
            );

            if (mainCheckbox.checked) {

                subCheckboxes.forEach(cb => {
                    cb.checked = true;
                });
            }

            scheduleUpdate();
        });
    }

    function setupMarkerObserver() {
        const markerPane = document.querySelector(
            ".leaflet-marker-pane"
        );

        if (!markerPane || markerObserver) return;

        markerObserver = new MutationObserver(() => {
            scheduleUpdate();
        });

        markerObserver.observe(markerPane, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["src", "class"]
        });
    }

    function setupMapEvents() {
        if (!window.map || typeof window.map.on !== "function") {
            return;
        }

        window.map.on("zoomend", scheduleUpdate);
        window.map.on("moveend", scheduleUpdate);
        window.map.on("layeradd", scheduleUpdate);
    }

    function initialize() {
        if (!createSubFilterUI()) return false;

        setupMainFilter();
        setupMarkerObserver();
        setupMapEvents();
        scheduleUpdate();

        return true;
    }

    function waitForDropdown() {
        if (initialize()) return;

        const observer = new MutationObserver(() => {
            if (initialize()) {
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            waitForDropdown
        );
    } else {
        waitForDropdown();
    }

})();
