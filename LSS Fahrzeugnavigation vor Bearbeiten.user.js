// ==UserScript==
// @name         LSS Fahrzeugnavigation vor Bearbeiten
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Verschiebt die Fahrzeugnavigationspfeile vor den Bearbeiten-Button
// @author       Sobol
// @match        https://www.leitstellenspiel.de/vehicles/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let running = false;

    function fixVehicleButtons() {
        if (running) return;
        running = true;

        try {
            const editButton = document.querySelector('a[href^="/vehicles/"][href$="/edit"]');
            if (!editButton) return;

            const actionGroup = editButton.closest('.btn-group');
            if (!actionGroup) return;

            const leftButton = document
                .querySelector('.glyphicon-arrow-left')
                ?.closest('a');

            const rightButton = document
                .querySelector('.glyphicon-arrow-right')
                ?.closest('a');

            const buttons = [leftButton, rightButton].filter(Boolean);

            if (!buttons.length) return;

            buttons.forEach(button => {
                button.classList.remove('btn-xs');
                button.classList.add('btn-default');
                button.removeAttribute('style');

                actionGroup.insertBefore(button, editButton);
            });

            document.querySelectorAll('.btn-group.pull-right, .btn-group').forEach(group => {
                if (!group.children.length) group.remove();
            });

        } finally {
            running = false;
        }
    }

    function scheduleFix() {
        requestAnimationFrame(fixVehicleButtons);
        setTimeout(fixVehicleButtons, 100);
        setTimeout(fixVehicleButtons, 300);
        setTimeout(fixVehicleButtons, 700);
        setTimeout(fixVehicleButtons, 1200);
        setTimeout(fixVehicleButtons, 2500);
    }

    scheduleFix();

    new MutationObserver(scheduleFix).observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();
