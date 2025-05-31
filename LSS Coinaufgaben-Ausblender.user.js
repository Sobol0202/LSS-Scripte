// ==UserScript==
// @name         LSS-Coinaufgaben-Ausblender
// @namespace    leitstellenspiel.de
// @version      1.9
// @description  Blendet Aufgaben aus, die etwas mit Coins ausgeben zu tun haben.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/tasks/index
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Suche nach Panels mit der Klasse panel panel-default mission_panel_green task_panel hidden-xs
    const panels = document.querySelectorAll('.panel.panel-default.mission_panel_green.task_panel');

    // Iteriere über die gefundenen Panels
    for (let i = 0; i < panels.length; i++) {
        const panel = panels[i];
        const taskDescription = panel.querySelector('.panel-heading').textContent;

        // Überprüfe, ob die Beschreibung das Wort "Coin", "Coins", "sofort!" oder "sofort fertig" enthält
        if (taskDescription.includes('Coin') || taskDescription.includes('Coins') || taskDescription.includes('Rekrutiere') || taskDescription.includes('immediately') || taskDescription.includes('sofort!') || taskDescription.includes('sofort fertig')) {
            // Verstecke das Panel
            panel.style.display = 'none';
            // Füge die unsichtbare Klasse hinzu
            panel.classList.add('hidden-xs');
            // Gib die Taskbeschreibung in der Konsole aus (wenn nicht gewünscht, die folgende Zeile einfach auskommentieren)
            console.log('Ausgeblendete Taskbeschreibung:', taskDescription.trim());
        }
    }
})();
