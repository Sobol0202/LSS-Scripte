// ==UserScript==
// @name         LSS AAO abhängige Alarmierung
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Fügt AAO abhängige Alarmierung ein
// @author       Sobol
// @match        https://www.leitstellenspiel.de/aaos
// @match        https://www.leitstellenspiel.de/aaos/*/edit
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// ==/UserScript==

(function () {
    'use strict';

    const MODE_NONE = 'none';
    const MODE_ALARM = 'alarm';
    const MODE_ALARM_NEXT = 'alarm_next';
    const MODE_ALARM_SHARE_NEXT = 'alarm_share_next';

    const STORAGE_PREFIX = 'aao_auto_mode_';

    const VALID_MODES = [
        MODE_ALARM,
        MODE_ALARM_NEXT,
        MODE_ALARM_SHARE_NEXT
    ];

    const pathname = window.location.pathname;

    // Import / Export auf AAO-Übersichtsseite
    if (pathname === '/aaos') {
        const targetButton = document.querySelector('a.btn.btn-xs.btn-default[href="/aao_categorys"]');

        if (!targetButton) {
            console.warn('[AAO-Automatik] Ziel-Button nicht gefunden!');
            return;
        }

        const exportButton = document.createElement('button');
        exportButton.type = 'button';
        exportButton.className = 'btn btn-xs btn-default';
        exportButton.textContent = 'AAO-Automatik exportieren';
        exportButton.style.marginRight = '5px';

        const importButton = document.createElement('button');
        importButton.type = 'button';
        importButton.className = 'btn btn-xs btn-default';
        importButton.textContent = 'AAO-Automatik importieren';
        importButton.style.marginRight = '5px';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'application/json,.json';
        fileInput.style.display = 'none';

        targetButton.parentNode.insertBefore(exportButton, targetButton);
        targetButton.parentNode.insertBefore(importButton, targetButton);
        targetButton.parentNode.insertBefore(fileInput, targetButton);

        exportButton.addEventListener('click', () => {
            const settings = {};

            GM_listValues()
                .filter(key => key.startsWith(STORAGE_PREFIX))
                .forEach(key => {
                    const aaoId = key.replace(STORAGE_PREFIX, '');
                    const mode = GM_getValue(key, MODE_NONE);

                    if (VALID_MODES.includes(mode)) {
                        settings[aaoId] = mode;
                    }
                });

            const exportData = {
                script: 'LSS AAO abhängige Alarmierung',
                version: 1,
                exportedAt: new Date().toISOString(),
                settings
            };

            const blob = new Blob(
                [JSON.stringify(exportData, null, 2)],
                { type: 'application/json' }
            );

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = 'lss-aao-automatik-einstellungen.json';
            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);
        });

        importButton.addEventListener('click', () => {
            fileInput.value = '';
            fileInput.click();
        });

        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];

            if (!file) {
                return;
            }

            const reader = new FileReader();

            reader.onload = () => {
                try {
                    const importedData = JSON.parse(reader.result);
                    const settings = importedData.settings;

                    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
                        alert('Ungültige Import-Datei: Keine Einstellungen gefunden.');
                        return;
                    }

                    let importedCount = 0;

                    Object.entries(settings).forEach(([aaoId, mode]) => {
                        if (!/^\d+$/.test(aaoId)) {
                            return;
                        }

                        if (!VALID_MODES.includes(mode)) {
                            return;
                        }

                        GM_setValue(`${STORAGE_PREFIX}${aaoId}`, mode);
                        importedCount++;
                    });

                    alert(`${importedCount} AAO-Automatik-Einstellungen wurden importiert.`);
                } catch (error) {
                    console.error('[AAO-Automatik] Import fehlgeschlagen:', error);
                    alert('Import fehlgeschlagen. Die Datei konnte nicht gelesen werden.');
                }
            };

            reader.readAsText(file);
        });
    }

    // Erzeugt das Dropdown auf der Editseite
    else if (pathname.match(/^\/aaos\/\d+\/edit$/)) {

        const aaoIdMatch = pathname.match(/^\/aaos\/(\d+)\/edit$/);
        const aaoId = aaoIdMatch ? aaoIdMatch[1] : null;

        if (!aaoId) {
            console.warn('[AAO-Automatik] Konnte keine AAO-ID extrahieren!');
            return;
        }

        const hotkeyGroup = document.querySelector('.form-group.aao_hotkey');
        if (!hotkeyGroup) {
            console.warn('[AAO-Automatik] Hotkey-Element nicht gefunden!');
            return;
        }

        const dropdownWrapper = document.createElement('div');
        dropdownWrapper.className = 'form-group aao_automatik';

        dropdownWrapper.innerHTML = `
            <label class="col-sm-3 control-label">Automatik</label>
            <div class="col-sm-9">
                <select class="form-control" id="aao_automatik_select">
                    <option value="none">Kein automatischer Alarm</option>
                    <option value="alarm">Alarmieren</option>
                    <option value="alarm_next">Alarmieren und weiter zum nächsten Einsatz</option>
                    <option value="alarm_share_next">Alarmieren, im Verband freigeben und weiter zum nächsten Einsatz</option>
                </select>
                <p class="help-block">Wähle eine Alarmart aus, die beim Klick dieser AAO ausgeführt werden soll.</p>
            </div>
        `;

        hotkeyGroup.insertAdjacentElement('afterend', dropdownWrapper);

        const select = document.getElementById('aao_automatik_select');

        const savedMode = GM_getValue(`${STORAGE_PREFIX}${aaoId}`, MODE_NONE);
        select.value = savedMode;

        select.addEventListener('change', () => {
            const selected = select.value;

            if (selected === MODE_NONE) {
                GM_deleteValue(`${STORAGE_PREFIX}${aaoId}`);
            } else {
                GM_setValue(`${STORAGE_PREFIX}${aaoId}`, selected);
            }
        });
    }

    // Einsatzseite
    else if (pathname.startsWith('/missions/')) {

        document.addEventListener('click', (e) => {
            const aaoBtn = e.target.closest('a.aao_btn[aao_id]');
            if (!aaoBtn) {
                return;
            }

            const aaoId = aaoBtn.getAttribute('aao_id');
            const mode = GM_getValue(`${STORAGE_PREFIX}${aaoId}`, MODE_NONE);

            if (mode === MODE_NONE) {
                return;
            }

            setTimeout(() => {
                let selector = '';

                switch (mode) {
                    case MODE_ALARM:
                        selector = '#mission_alarm_btn';
                        break;
                    case MODE_ALARM_NEXT:
                        selector = 'a.alert_next';
                        break;
                    case MODE_ALARM_SHARE_NEXT:
                        selector = 'a.alert_next_alliance';
                        break;
                }

                const buttonToClick = document.querySelector(selector);
                if (buttonToClick) {
                    buttonToClick.click();
                }
            }, 100);
        }, true);
    }
})();
