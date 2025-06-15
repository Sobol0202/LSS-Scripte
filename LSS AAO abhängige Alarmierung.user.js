// ==UserScript==
// @name         LSS AAO abhängige Alarmierung
// @namespace    http://tampermonkey.net/
// @version      1.0
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

    const MODES = {
        [MODE_NONE]: 'Keine Automatik',
        [MODE_ALARM]: 'Alarm',
        [MODE_ALARM_NEXT]: 'Alarm und Weiter',
        [MODE_ALARM_SHARE_NEXT]: 'Alarm, Freigeben und Weiter'
    };
    const pathname = window.location.pathname;

    // Erzeugt das Dropdown auf der Editseite
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

        hotkeyGroup.insertAdjacentElement('afterend', dropdownWrapper);

        const select = document.getElementById('aao_automatik_select');

        // Vorher gespeicherten Wert laden
        const savedMode = GM_getValue(`aao_auto_mode_${aaoId}`, 'none');
        select.value = savedMode;

        // Beim Wechsel speichern
        select.addEventListener('change', () => {
            const selected = select.value;
            if (selected === 'none') {
                GM_deleteValue(`aao_auto_mode_${aaoId}`);
            } else {
                GM_setValue(`aao_auto_mode_${aaoId}`, selected);
            }
        });
    }

    //Einsatzseite
    else if (pathname.startsWith('/missions/')) {

        //Hört auf Click auf AAO
        document.addEventListener('click', (e) => {
            const aaoBtn = e.target.closest('a.aao_btn[aao_id]');
            if (!aaoBtn) {
                return;
            }

            //Liest AAO-ID aus
            const aaoId = aaoBtn.getAttribute('aao_id');

            //Vergleicht AAO ID mit gespeicherten Werten aus dem GM
            const mode = GM_getValue(`aao_auto_mode_${aaoId}`, MODE_NONE);

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

                //Klickt Button
                const buttonToClick = document.querySelector(selector);
                if (buttonToClick) {
                    buttonToClick.click();
                } else {
                }
            }, 100);
        }, true);
    }
})();
