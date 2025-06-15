// ==UserScript==
// @name         LSS AAO Alarmiert immer
// @namespace    https://www.leitstellenspiel.de
// @version      1.0
// @description  Dropdown für AAO-Alarmierungs-Automatik
// @author       Sobol
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    const ZUSTAENDE = {
        0: { label: "Keine Automatik", symbol: "❌" },
        1: { label: "Alarmieren", symbol: "📣" },
        2: { label: "Alarmieren und weiter zum nächsten Einsatz", symbol: "📣⏩" },
        3: { label: "Alarmieren, im Verband freigeben und weiter zum nächsten Einsatz", symbol: "📣👥⏩" }
    };

    const STORAGE_KEY = "auto_zustand";

    let aktuellerZustand = GM_getValue(STORAGE_KEY, 0);

    function createDropdown() {
        const dropdown = document.createElement("select");
        dropdown.id = "autoZustandDropdown";
        dropdown.style.marginLeft = "10px";
        dropdown.className = "form-control input-sm";
        dropdown.style.width = "auto";
        dropdown.title = "Alarmierungsmodus wählen";

        // Nur Symbole anzeigen, Beschriftung als Tooltip
        Object.entries(ZUSTAENDE).forEach(([key, zustand]) => {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = zustand.symbol;
            option.title = zustand.label;
            if (parseInt(key) === aktuellerZustand) option.selected = true;
            dropdown.appendChild(option);
        });

        // Tooltip live aktualisieren beim Wechsel
        dropdown.addEventListener("change", () => {
            aktuellerZustand = parseInt(dropdown.value);
            GM_setValue(STORAGE_KEY, aktuellerZustand);
            dropdown.title = ZUSTAENDE[aktuellerZustand].label;
        });

        // Initialer Tooltip
        dropdown.title = ZUSTAENDE[aktuellerZustand].label;

        return dropdown;
    }

    function appendDropdownToTabs() {
        const tabs = document.getElementById("aao-tabs");
        if (!tabs) return;

        const wrapper = document.createElement("li");
        wrapper.role = "presentation";
        wrapper.style.padding = "5px";
        wrapper.appendChild(createDropdown());

        tabs.appendChild(wrapper);
    }

    function handleGlobalClick(e) {

        // Versuche, den übergeordneten AAO-Link zu finden
        const aaoButton = e.target.closest("a.aao_btn");

        if (!aaoButton) {
            return;
        }

        if (!aaoButton.id || !aaoButton.id.startsWith("aao_")) {
            return;
        }


        if (aktuellerZustand === 0) {
            return;
        }

        // 100ms Verzögerung, dann Aktion abhängig vom Zustand
        setTimeout(() => {
            let button = null;

            switch (aktuellerZustand) {
                case 1:
                    button = document.getElementById("mission_alarm_btn");
                    break;
                case 2:
                    button = document.querySelector("a.alert_next");
                    break;
                case 3:
                    button = document.querySelector("a.alert_next_alliance");
                    break;
            }

            if (button) {
                button.click();
            } else {
                console.warn("[Automatik-Modus] Kein entsprechender Button gefunden.");
            }
        }, 100);
    }


    function init() {
        appendDropdownToTabs();
        document.addEventListener('click', handleGlobalClick, true);

    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
