// ==UserScript==
// @name         LSS Aufgaben-Favoriten
// @version      1.0
// @description  Favoriten-Interface für Aufgaben
// @author       Sobol
// @match        https://www.leitstellenspiel.de/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      leitstellenspiel.de
// ==/UserScript==

(function () {
    'use strict';

    const FAVORITE_STORAGE_KEY = 'fav_tasks';

    // Hilfsfunktion zum Speichern der Favoriten
    function saveFavorites(favorites) {
        GM_setValue(FAVORITE_STORAGE_KEY, JSON.stringify(favorites));
        //console.log('[LSS-Fav] Favoriten gespeichert:', favorites);
    }

    // Hilfsfunktion zum Laden der Favoriten
    function loadFavorites() {
        const stored = GM_getValue(FAVORITE_STORAGE_KEY, '[]');
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('[LSS-Fav] Fehler beim Laden der Favoriten:', e);
            return [];
        }
    }

    // Funktion zum Einfügen des Buttons und Interfaces auf der Hauptseite
    function injectInterface() {
        const mapElement = document.getElementById('map');
        if (!mapElement) return;

        // Button zum Öffnen
        const btn = document.createElement('button');
        btn.className = 'btn btn-xs btn-default';
        btn.innerHTML = '<span class="glyphicon glyphicon-th-list"></span>';
        btn.style.position = 'absolute';
        btn.style.top = '33%';
        btn.style.right = '10px';
        btn.style.zIndex = '10000';
        btn.onclick = toggleInterface;

        mapElement.appendChild(btn);

        // Interface-Container
        const container = document.createElement('div');
        container.id = 'favTaskInterface';
        container.style.position = 'absolute';
        container.style.top = '36%';
        container.style.right = '10px';
        container.style.width = '320px';
        container.style.maxHeight = '400px';
        container.style.overflowY = 'auto';
        container.style.zIndex = '999';
        container.style.display = 'none';
        container.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        container.style.borderRadius = '10px';
        container.style.padding = '12px';
        container.style.fontSize = '13px';

        // Styling für Light/Dark Mode
        const style = document.createElement('style');
        style.textContent = `
        #favTaskInterface {
            background-color: #ffffff;
            color: #000000;
            border: 1px solid #ccc;
        }

        @media (prefers-color-scheme: dark) {
            #favTaskInterface {
                background-color: #1e1e1e;
                color: #f0f0f0;
                border: 1px solid #555;
            }

            #favTaskInterface button {
                background-color: #444;
                color: #eee;
                border-color: #666;
            }
        }

        #favTaskInterface h5 {
            margin-top: 0;
            font-size: 15px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 4px;
        }

        #favTaskInterface hr {
            border: none;
            border-top: 1px solid #ccc;
            margin: 6px 0;
        }

        #favTaskInterface .fav-task-entry {
            padding: 3px 0;
        }

        #updateFavsBtn {
            margin-top: 10px;
            padding: 4px 8px;
            font-size: 12px;
        }
    `;
        document.head.appendChild(style);

        // Inneres HTML
        container.innerHTML = `
        <h5>⭐ Favoriten-Aufgaben</h5>
        <div id="favTasksList">Lade...</div>
        <button class="btn btn-xs btn-info" id="updateFavsBtn">🔄 Aktualisieren</button>
    `;
        mapElement.appendChild(container);

        document.getElementById('updateFavsBtn').addEventListener('click', () => {
            updateFavoritesList();
        });

        const menuProfile = document.querySelector('#menu_profile');
        if (menuProfile && menuProfile.classList.contains('btn-success')) {
            btn.className = 'btn btn-xs btn-success';
        }

        btn.addEventListener('click', () => {
            if (btn.classList.contains('btn-success')) {
                console.log('[LSS-Fav] Versuche Belohnungen einzusammeln...');
                for (let i = 0; i < 3; i++) {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: 'https://www.leitstellenspiel.de/tasks/claim_all_rewards',
                        onload: function () {
                            //console.log(`[LSS-Fav] Claim-Aufruf ${i + 1} erfolgreich`);
                        }
                    });
                }
                setTimeout(() => {
                    updateFavoritesList();
                }, 2000);
            }
        });

        updateFavoritesList();
    }

    // Interface ein-/ausblenden
    function toggleInterface() {
        const el = document.getElementById('favTaskInterface');
        if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }

    // Favoriten-Liste im Interface aktualisieren
    function updateFavoritesList() {
        const favList = document.getElementById('favTasksList');
        if (!favList) return;
        favList.innerHTML = 'Lade...';

        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://www.leitstellenspiel.de/tasks/index',
            onload: function (response) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, 'text/html');

                const panels = doc.querySelectorAll('.task_panel');
                const favorites = loadFavorites();
                const updatedFavorites = [];

                const list = document.createElement('div');
                const seen = new Set(); // Um Duplikate zu vermeiden

                panels.forEach((panel, index) => {
                    const titleElem = panel.querySelector('b');
                    const progressBar = panel.querySelector('.progress-bar');
                    if (!titleElem || !progressBar) return;

                    const taskName = titleElem.nextSibling.textContent.trim();
                    if (favorites.includes(taskName) && !seen.has(taskName)) {
                        seen.add(taskName);
                        updatedFavorites.push(taskName);

                        const progressText = progressBar.parentElement.textContent.trim();
                        const entry = document.createElement('div');
                        entry.textContent = `${taskName} – ${progressText}`;
                        list.appendChild(entry);

                        if (index !== panels.length - 1) {
                            const hr = document.createElement('hr');
                            hr.style.margin = '5px 0';
                            list.appendChild(hr);
                        }
                    }
                });

                saveFavorites([...seen]); // nur eindeutige Favoriten speichern
                favList.innerHTML = '';
                favList.appendChild(list);

                if (seen.size === 0) {
                    favList.textContent = 'Keine Favoriten gefunden oder alle erledigt.';
                }

                //console.log('[LSS-Fav] Favoriten-Liste aktualisiert:', Array.from(seen));
            }
        });
    }
    // Funktion für task index Seite: Sterne einfügen zum markieren
    function enhanceTaskPage() {
        const panels = document.querySelectorAll('.task_panel');
        const favorites = loadFavorites();

        panels.forEach(panel => {
            const titleElem = panel.querySelector('b');
            if (!titleElem) return;

            const taskName = titleElem.nextSibling.textContent.trim();

            const star = document.createElement('span');
            star.textContent = favorites.includes(taskName) ? '⭐' : '☆';
            star.style.cursor = 'pointer';
            star.style.fontSize = '1.2em';
            star.style.marginLeft = '10px';

            star.addEventListener('click', () => {
                let updated = loadFavorites();
                if (updated.includes(taskName)) {
                    updated = updated.filter(name => name !== taskName);
                } else {
                    updated.push(taskName);
                }
                saveFavorites(updated);
                star.textContent = updated.includes(taskName) ? '⭐' : '☆';
            });

            titleElem.parentElement.appendChild(star);
        });

        //console.log('[LSS-Fav] Sterne wurden auf der Aufgaben-Seite hinzugefügt.');
    }

    // Startlogik
    const url = window.location.href;
    if (url.includes('/tasks/index')) {
        enhanceTaskPage();
    } else {
        window.addEventListener('load', injectInterface);
    }

})();
