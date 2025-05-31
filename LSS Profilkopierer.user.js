// ==UserScript==
// @name         LSS Profilkopierer
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Speichert und kopiert Profil-URLs auf Leitstellenspiel.de
// @author       Sobol
// @match        https://www.leitstellenspiel.de/profile/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Hinzufügen eines Buttons zur ul mit der id "tabs"
    function addButton() {
        const ul = document.getElementById('tabs');
        if (!ul) return;

        const li = document.createElement('li');
        const button = document.createElement('button');
        button.innerText = 'Profil merken';
        button.style.cursor = 'pointer';
        button.addEventListener('click', handleButtonClick);
        li.appendChild(button);
        ul.appendChild(li);
    }

    // Event-Handler für den Button-Klick
    function handleButtonClick(event) {
        const currentUrl = window.location.href;
        if (event.shiftKey) {
            // Shift-Taste gedrückt: Alle URLs in die Zwischenablage kopieren und GM löschen
            const urls = GM_getValue('urls', []);
            if (urls.length > 0) {
                const urlText = urls.join('\n');
                GM_setClipboard(urlText);
                alert('Alle URLs wurden in die Zwischenablage kopiert.');
                GM_setValue('urls', []);
            } else {
                alert('Keine URLs gespeichert.');
            }
        } else {
            // Shift-Taste nicht gedrückt: Aktuelle URL speichern
            let urls = GM_getValue('urls', []);
            urls.push(currentUrl);
            GM_setValue('urls', urls);
        }
    }

    // Button direkt hinzufügen
    addButton();

})();
