// ==UserScript==
// @name         LSS AAO abhängige Alarmierung
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Fügt AAO abhängige Alarmierung ein
// @author       Sobol
// @match        https://www.leitstellenspiel.de/aaos/*/edit
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

(function () {
    'use strict';

    const MODE_NONE = 'none';
    const MODE_ALARM = 'alarm';
    const MODE_ALARM_NEXT = 'alarm_next';
    const MODE_ALARM_SHARE_NEXT = 'alarm_share_next';

    const pathname = window.location.pathname;

    if (pathname.match(/^\/aaos\/\d+\/edit$/)) {

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

        const delayWrapper = document.createElement('div');
        delayWrapper.className = 'form-group aao_automatik_delay';

        delayWrapper.innerHTML = `
            <label class="col-sm-3 control-label">Verzögerung</label>
            <div class="col-sm-9">
                <input type="number" min="0" step="1" class="form-control" id="aao_automatik_delay" placeholder="0">
                <p class="help-block">Verzögerung in Sekunden, bevor die automatische Alarmierung ausgelöst wird.</p>
            </div>
        `;

        hotkeyGroup.insertAdjacentElement('afterend', delayWrapper);
        hotkeyGroup.insertAdjacentElement('afterend', dropdownWrapper);

        const select = document.getElementById('aao_automatik_select');
        const delayInput = document.getElementById('aao_automatik_delay');

        select.value = GM_getValue(`aao_auto_mode_${aaoId}`, MODE_NONE);
        delayInput.value = GM_getValue(`aao_auto_delay_${aaoId}`, 0);

        select.addEventListener('change', () => {
            const selected = select.value;

            if (selected === MODE_NONE) {
                GM_deleteValue(`aao_auto_mode_${aaoId}`);
            } else {
                GM_setValue(`aao_auto_mode_${aaoId}`, selected);
            }
        });

        delayInput.addEventListener('change', () => {
            let delay = parseInt(delayInput.value, 10);

            if (isNaN(delay) || delay < 0) {
                delay = 0;
                delayInput.value = 0;
            }

            if (delay === 0) {
                GM_deleteValue(`aao_auto_delay_${aaoId}`);
            } else {
                GM_setValue(`aao_auto_delay_${aaoId}`, delay);
            }
        });
    }

    else if (pathname.startsWith('/missions/')) {

        document.addEventListener('click', (e) => {
            const aaoBtn = e.target.closest('a.aao_btn[aao_id]');
            if (!aaoBtn) {
                return;
            }

            const aaoId = aaoBtn.getAttribute('aao_id');
            const mode = GM_getValue(`aao_auto_mode_${aaoId}`, MODE_NONE);

            if (mode === MODE_NONE) {
                return;
            }

            const delaySeconds = parseInt(GM_getValue(`aao_auto_delay_${aaoId}`, 0), 10) || 0;
            const delayMs = delaySeconds * 1000;

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

            }, delayMs);
        }, true);
    }
})();
