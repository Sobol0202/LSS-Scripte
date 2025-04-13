// ==UserScript==
// @name         LSS Easter Egg verschieben
// @version      1.0
// @description  Verschiebt das Easter-Egg in die Navbar am unteren Rand
// @author       Sobol
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Suche nach dem Easter-Egg-Link und der Navbar
    const easterEgg = document.getElementById('easter-egg-link');
    const navbar = document.getElementById('container_navbar_alarm');
    const alertNext = navbar.querySelector('.alert_next');
    const prevMissionBtn = navbar.querySelector('#mission_previous_mission_btn');

    // Überprüfen, ob alle Elemente existieren
    if (easterEgg && alertNext && prevMissionBtn) {
        // Sicherstellen, dass das Element nicht bereits verschoben wurde
        if (!easterEgg.closest('#container_navbar_alarm')) {
            // Stil anpassen, damit es wie ein Button aussieht (optional)
            easterEgg.classList.add('btn', 'btn-info', 'btn-sm', 'navbar-btn');
            easterEgg.style.marginLeft = '5px';

            // Einfügen vor dem vorherigen Missionsbutton
            prevMissionBtn.parentElement.insertBefore(easterEgg, prevMissionBtn);
        }
    }
})();
