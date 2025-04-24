// ==UserScript==
// @name         LSS Ausrückeverzögerung Dropdown
// @version      1.0
// @description  Ersetzt das Ausrückeverzögerung Nummernfeld durch ein Dropdown-Menü
// @author       Sobol
// @match        https://www.leitstellenspiel.de/vehicles/*/edit
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    //console.log('Tampermonkey-Skript gestartet.');

    // Dropdown-Werte: ['Anzeigetext', tatsächlicher Wert]
    const options = [
        ['Motor läuft (0 Sekunden)', 0],
        ['Schlüssel steckt (15 Sekunden)', 15],
        ['Sitzen im Auto (30 Sekunden)', 30],
        ['Hauptberufliche (60 Sekunden)', 60],
        ['Mittagessen (120 Sekunden)', 120],
        ['Freiwillige (300 Sekunden)', 300],
    ];

    function replaceInputWithDropdown() {
        //console.log('Versuche, das Input-Feld zu finden...');
        const input = document.querySelector('#vehicle_start_delay');

        if (!input) {
            //console.warn('Feld #vehicle_start_delay nicht gefunden.');
            return;
        }

        //console.log('Input-Feld gefunden:', input);

        const dropdown = document.createElement('select');
        dropdown.id = input.id;
        dropdown.name = input.name;
        dropdown.className = input.className;

        options.forEach(([label, value]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            if (parseInt(input.value) === value) {
                option.selected = true;
            }
            dropdown.appendChild(option);
        });

        input.replaceWith(dropdown);
        //console.log('Input-Feld erfolgreich ersetzt durch Dropdown.');
    }

    replaceInputWithDropdown();
})();
