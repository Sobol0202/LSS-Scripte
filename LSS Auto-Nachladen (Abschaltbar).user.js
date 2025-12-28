// ==UserScript==
// @name         LSS Auto-Nachladen (Abschaltbar)
// @namespace    www.leitstellenspiel.de
// @version      1.3
// @description  Lädt Fahrzeuge nach, wenn über eine nicht verfügbare AAO gefahren wird (GM-gespeichert).
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';


    let sperrTimer = false;

    const GM_KEY = 'lss_auto_reload_active';
    let autoReloadActive = GM_getValue(GM_KEY, true); // Default: aktiv


    const missionH1 = document.getElementById('missionH1');
    if (missionH1) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'btn btn-success btn-xs';
        toggleBtn.style.marginLeft = '10px';
        toggleBtn.style.verticalAlign = 'middle';

        const updateButtonText = () => {
            toggleBtn.textContent = autoReloadActive
                ? '⏸️ Auto aus'
                : '▶️ Auto an';
        };

        updateButtonText();

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // verhindert unerwünschte Nebeneffekte
            autoReloadActive = !autoReloadActive;
            GM_setValue(GM_KEY, autoReloadActive);
            updateButtonText();
        });

        // Button INS h3 einfügen (am Ende, gleiche Zeile)
        missionH1.appendChild(toggleBtn);
    }


    document.getElementById('mission-aao-group')?.addEventListener('mouseover', function (e) {
        if (!autoReloadActive) return;

        const target = e.target;
        if (!(target instanceof HTMLElement)) return;

        const aaoEntry = target.closest('a.aao');
        if (!aaoEntry) return;

        const dangerLabel = aaoEntry.querySelector('.label.label-danger');
        if (!dangerLabel) return;

        const timer = setTimeout(() => {
            if (sperrTimer) return;
            sperrTimer = true;

            const reloadButton = document.querySelector('.missing_vehicles_load.btn-warning');
            if (reloadButton) reloadButton.click();

            setTimeout(() => {
                sperrTimer = false;
            }, 3000);
        }, 500);

        aaoEntry.addEventListener(
            'mouseleave',
            () => clearTimeout(timer),
            { once: true }
        );
    });
})();
