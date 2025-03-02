// ==UserScript==
// @name         LSS AAO Symbol Replacer
// @version      1.0
// @description  Ersetzt das Icon im Alarm und Ausrückeordnung Menüpunkt
// @author       Sobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function replaceIcon() {
        let menuItem = document.querySelector('ul.dropdown-menu[aria-labelledby="menu_profile"] li a[href="/aaos"] img');
        if (menuItem) {
            menuItem.src = 'https://raw.githubusercontent.com/Sobol0202/LSS-Scripte/refs/heads/main/LSS%20AAO%20Symbol%20Replacer/icons8-cars-80.png';
            menuItem.classList.remove('icons8-Parallel-Tasks');
            menuItem.classList.add('icons8-New-Icon');
        }
    }

    let observer = new MutationObserver(replaceIcon);
    observer.observe(document.body, { childList: true, subtree: true });

    replaceIcon();
})();
