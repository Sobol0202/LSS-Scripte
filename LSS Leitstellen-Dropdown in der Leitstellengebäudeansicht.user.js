// ==UserScript==
// @name         LSS Leitstellen-Dropdown in der Leitstellengebäudeansicht
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Verschiebt die Leitstellenauswahl in der Leitstellenansicht in ein Alphabetisch sortiertes Dropdown-Menü
// @author       Sobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Beobachtet Änderungen im #tabs Element
    const tabs = document.querySelector('#tabs');
    if (!tabs) return;

    const observer = new MutationObserver(() => {
        const activeTab = tabs.querySelector('li.active');
        if (activeTab) initTableObserver();
    });

    observer.observe(tabs, { subtree: true, attributes: true, attributeFilter: ['class'] });

    function initTableObserver() {
        const tableObserver = new MutationObserver(() => {
            const table = document.querySelector('#building_table');
            if (table) {
                tableObserver.disconnect();
                convertButtonsToDropdowns(table);
            }
        });
        tableObserver.observe(document.body, { childList: true, subtree: true });
    }

function convertButtonsToDropdowns(table) {
    table.querySelectorAll('tr').forEach(row => {
        const btnGroup = row.querySelector('.btn-group');
        if (!btnGroup) return;

        const links = [...btnGroup.querySelectorAll('a')];
        if (links.length === 0) return;

        // Alphabetisch sortieren
        links.sort((a, b) => a.textContent.trim().localeCompare(b.textContent.trim(), 'de'));

        const select = document.createElement('select');
        select.className = 'form-control input-sm';

        links.forEach(link => {
            const option = document.createElement('option');
            option.textContent = link.textContent.trim();
            option.value = link.href;

            // aktive Leitstelle grün einfärben
            if (link.classList.contains('btn-success')) {
                option.selected = true;
                option.style.backgroundColor = '#a5d6a7';
                option.style.fontWeight = 'bold';
            }

            select.appendChild(option);
        });

        select.addEventListener('change', async () => {
            const url = select.value;

            try {
                await fetch(url, { method: 'GET', credentials: 'include' });

                // Alle Optionen zurücksetzen
                [...select.options].forEach(opt => {
                    opt.style.backgroundColor = '';
                    opt.style.fontWeight = '';
                });

                // Neue aktive Option markieren
                const activeOpt = select.selectedOptions[0];
                activeOpt.style.backgroundColor = '#a5d6a7';
                activeOpt.style.fontWeight = 'bold';
            } catch (e) {
                console.error('Leitstellenwechsel fehlgeschlagen:', e);
            }
        });


        btnGroup.replaceWith(select);
    });
}

})();
