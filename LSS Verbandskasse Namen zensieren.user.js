// ==UserScript==
// @name         LSS Verbandskasse Namen zensieren
// @version      1.1
// @description  Zensiert die Namen der Einzahler in der Verbandskasse und im Einsatz.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/verband/kasse*
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function replaceCharacters(name) {
        const vowels = {'a': 'e', 'e': 'i', 'i': 'o', 'o': 'u', 'u': 'a'};
        const umlauts = {'ä': 'ö', 'ö': 'ü', 'ü': 'ä'};
        const digits = {'0': '9', '1': '8', '2': '7', '3': '6', '4': '5', '5': '4', '6': '3', '7': '2', '8': '1', '9': '0'};
        const consonants = {'b': 'c', 'c': 'd', 'd': 'f', 'f': 'g', 'g': 'h', 'h': 'j', 'j': 'k', 'k': 'l', 'l': 'm', 'm': 'n',
                            'n': 'p', 'p': 'q', 'q': 'r', 'r': 's', 's': 't', 't': 'v', 'v': 'w', 'w': 'x', 'x': 'y', 'y': 'z', 'z': 'b'};

        return name.split('').map((char, index) => {
            const lowerChar = char.toLowerCase();
            let newChar = char;

            if (index > 1) {
                if (vowels[lowerChar]) newChar = vowels[lowerChar];
                if (umlauts[lowerChar]) newChar = umlauts[lowerChar];
                if (digits[lowerChar]) newChar = digits[lowerChar];
                if (consonants[lowerChar]) newChar = consonants[lowerChar];
            }

            return char === lowerChar ? newChar : newChar.toUpperCase();
        }).join('');
    }

    function censorNames(selector) {
        document.querySelectorAll(selector).forEach(element => {
            if (!element.dataset.censored) {
                element.textContent = replaceCharacters(element.textContent);
                element.dataset.censored = "true";
            }
        });
    }

    function observeMutations() {
        const observer = new MutationObserver(() => {
            censorNames("#alliance-finances-earnings .table tbody tr td:first-child a");
            censorNames("#mission_replies li a");
            censorNames("#mission_vehicle_driving td a[href^='/profile/']");
            censorNames("#mission_vehicle_at_mission td a[href^='/profile/']");
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Initiales Zensieren und Beobachten von Änderungen
    censorNames("#alliance-finances-earnings .table tbody tr td:first-child a");
    censorNames("#mission_replies li a");
    censorNames("#mission_vehicle_driving td a[href^='/profile/']");
    censorNames("#mission_vehicle_at_mission td a[href^='/profile/']");
    observeMutations();
})();
