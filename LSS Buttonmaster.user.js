// ==UserScript==
// @name         LSS Buttonmaster
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0
// @description  Eigene Button-Seite unter /buttonmaster
// @author       Sobol
// @match        https://www.leitstellenspiel.de/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// ==/UserScript==

(function () {
    'use strict';

/**********************************************************************
* KONFIGURATION
 *
 * Hier werden die Buttons für den Buttonmaster definiert
 *
 * Normale Buttons:
 * Öffnen eine feste URL im Switcher-Tab.
 * Beispiel:
 * { label: 'Startseite', url: '/' }
 *
 * Ordner:
 * Gruppieren mehrere Buttons in einem Untermenü.
 * Beispiel:
 * {
 *   label: 'Leitstellen',
 *   type: 'folder',
 *   buttons: [
 *     { label: 'Dresden', url: '/buildings/123' }
 *   ]
 * }
 *
 * Spezial-Buttons:
 * Führen besondere Aktionen aus (keine URL nötig).
 * Beispiele:
 * { label: '📣 Sprechwunsch', action: 'sprechwunsch' }
 * { label: '🚨 Einsatz', action: 'einsatz' }
 *
 **********************************************************************/
    const BUTTONS = [
        {
            label: 'Leitstellen',
            type: 'folder',
            buttons: [
                { label: 'Leitstelle Dresden', url: '/buildings/4964558' },
                { label: 'Leitstelle Berlin', url: '/buildings/26153991' },
            ],
        },
        {
            label: 'Verband',
            type: 'folder',
            buttons: [
                { label: 'Verband', url: '/verband' },
                { label: 'Lehrgangswünsche', url: '/alliance_threads/15340' },
            ],
        },
        { label: '📣 Sprechwunsch', action: 'sprechwunsch' },
        { label: '🚨 Einsatz', action: 'einsatz' },
        { label: 'Leitstellenansicht', url: '/leitstellenansicht' },
        { label: 'Aufgaben und Events', url: '/tasks/index' },
        { label: 'Heimat', url: '/' },
    ];

    // Keys
    const KEY_SWITCHER_TAB_ID = 'lss_switcher_tab_id';
    const KEY_SWITCH_COMMAND = 'lss_switch_command';
    const KEY_THIS_TAB_IS_SWITCHER = 'lss_this_tab_is_switcher';
    const KEY_HAS_SPRECHWUNSCH = 'lss_has_sprechwunsch';
    const BUTTONMASTER_PATH = '/buttonmaster';
    const SPECIAL_URL_SPRECHWUNSCH = 'LSS_SPECIAL_SPRECHWUNSCH';
    const SPECIAL_URL_EINSATZ = 'LSS_SPECIAL_EINSATZ';


    // Tab-ID erkennen und auswerten
    function getOrCreateTabId() {
        let tabId = sessionStorage.getItem('lss_tab_id');
        if (!tabId) {
            tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
            sessionStorage.setItem('lss_tab_id', tabId);
        }
        return tabId;
    }

    const THIS_TAB_ID = getOrCreateTabId();

    function normalizeUrl(url) {
        try {
            return new URL(url, location.origin).toString();
        } catch {
            return location.origin + '/';
        }
    }

    function escapeHtml(text) {
        return String(text)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function isButtonmasterPage() {
        return location.pathname === BUTTONMASTER_PATH;
    }

    function isFolderButton(btn) {
        return btn && btn.type === 'folder' && Array.isArray(btn.buttons);
    }

    function getButtonsByPath(path) {
        let current = BUTTONS;

        for (const index of path) {
            const folder = current[index];
            if (!isFolderButton(folder)) return BUTTONS;
            current = folder.buttons;
        }

        return current;
    }

    function getFolderTitleByPath(path) {
        let current = BUTTONS;
        const titles = [];

        for (const index of path) {
            const folder = current[index];
            if (!isFolderButton(folder)) break;

            titles.push(folder.label);
            current = folder.buttons;
        }

        return titles.length ? titles.join(' / ') : 'Hauptmenü';
    }

    // Sprechwunsch finden, erkennen und auswerten
    function findFirstSprechwunschVehicleUrl() {
        const list = document.getElementById('radio_messages_important');
        if (!list) return '';

        const li = list.querySelector('li');
        if (!li) return '';

        const vehicleLink = li.querySelector('a[href^="/vehicles/"]');
        if (!vehicleLink) return '';

        return vehicleLink.href;
    }

    function handleSprechwunsch() {
        const vehicleUrl = findFirstSprechwunschVehicleUrl();

        if (!vehicleUrl) {
            alert('Kein Sprechwunsch gefunden.');
            return;
        }

        location.assign(vehicleUrl);
    }

    function observeSprechwuensche() {
        const list = document.getElementById('radio_messages_important');
        if (!list) {
            GM_setValue(KEY_HAS_SPRECHWUNSCH, false);
            return;
        }

        const update = () => {
            const hasSprechwunsch = !!list.querySelector('li a[href^="/vehicles/"]');
            GM_setValue(KEY_HAS_SPRECHWUNSCH, hasSprechwunsch);
        };

        const observer = new MutationObserver(update);
        observer.observe(list, { childList: true, subtree: true });

        update();
    }

    // Einsatz finden und auswerten
    function findFirstRedMissionUrl() {
        const list = document.getElementById('mission_list');
        if (!list) return '';

        const redPanel = list.querySelector('.panel.panel-default.mission_panel_red');
        if (!redPanel) return '';

        const missionEntry = redPanel.closest('div[id^="mission_"]');
        if (!missionEntry) return '';

        const alarmLink = missionEntry.querySelector('a[href^="/missions/"]');
        if (!alarmLink) return '';

        return alarmLink.href;
    }

    function handleEinsatz() {
        const missionUrl = findFirstRedMissionUrl();

        if (!missionUrl) {
            alert('Kein roter Einsatz gefunden.');
            return;
        }

        location.assign(missionUrl);
    }

    // Buttonmaster-UI
    async function renderButtonmasterPage() {
        document.title = 'Buttonmaster - Leitstellenspiel';

        const activeSwitcherTabId = await GM_getValue(KEY_SWITCHER_TAB_ID, '');
        const hasSprechwunsch = await GM_getValue(KEY_HAS_SPRECHWUNSCH, false);

        let folderPath = [];

        document.documentElement.innerHTML = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Buttonmaster</title>
    <style>
        :root { color-scheme: dark; }
        * { box-sizing: border-box; }

        body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: #111827;
            color: #f3f4f6;
        }

        .wrap {
            max-width: 1100px;
            margin: 0 auto;
            padding: 32px 20px 48px;
        }

        h1 {
            margin: 0 0 10px;
            font-size: 32px;
        }

        .sub {
            margin: 0 0 24px;
            color: #cbd5e1;
            line-height: 1.5;
        }

        .status {
            margin-bottom: 24px;
            padding: 14px 16px;
            border-radius: 12px;
            background: #1f2937;
            border: 1px solid #374151;
            cursor: pointer;
            user-select: none;
        }

        .status.ok {
            border-color: #14532d;
            background: #052e16;
            color: #dcfce7;
        }

        .status.warn {
            border-color: #78350f;
            background: #451a03;
            color: #fef3c7;
        }

        .status:hover {
            filter: brightness(1.08);
        }

        .folder-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 16px;
        }

        .folder-title {
            font-size: 20px;
            font-weight: 800;
            color: #e5e7eb;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
            gap: 14px;
        }

        .lss-bm-btn {
            appearance: none;
            border: 1px solid #374151;
            background: #2563eb;
            color: white;
            padding: 16px 18px;
            border-radius: 14px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: transform 0.08s ease, filter 0.15s ease, box-shadow 0.15s ease;
            min-height: 64px;
        }

        .lss-bm-btn:hover {
            filter: brightness(1.08);
        }

        .lss-bm-btn:active {
            transform: translateY(1px) scale(0.995);
        }

        .lss-bm-folder {
            background: #7c3aed;
        }

        .lss-bm-back {
            background: #374151;
        }

        .lss-bm-special.active {
            background: #dc2626 !important;
            box-shadow: 0 0 16px #ef4444;
            animation: pulse 1s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.045); }
            100% { transform: scale(1); }
        }

        code {
            background: #0f172a;
            padding: 2px 6px;
            border-radius: 6px;
        }

        small {
            opacity: 0.85;
        }
    </style>
</head>
<body>
    <div class="wrap">
        <h1>Buttonmaster</h1>
        <p class="sub">
            Diese Seite wird komplett vom Userscript erzeugt. Ein Klick auf einen Button
            sendet einen Navigationsbefehl an den aktiven Switcher-Tab.
        </p>

        <div id="lss-bm-status" class="status ${activeSwitcherTabId ? 'ok' : 'warn'}" title="Klicken, um den aktiven Switcher zurückzusetzen">
            ${
                activeSwitcherTabId
                    ? `Aktiver Switcher gefunden: <code>${escapeHtml(activeSwitcherTabId)}</code><br><small>Status anklicken zum Zurücksetzen.</small>`
                    : `Kein aktiver Switcher-Tab gesetzt. Öffne einen normalen Tab auf <code>www.leitstellenspiel.de</code> und aktiviere dort unten rechts die Checkbox.`
            }
        </div>

        <div class="folder-head">
            <div id="lss-bm-folder-title" class="folder-title"></div>
        </div>

        <div id="lss-bm-grid" class="grid"></div>
    </div>
</body>
</html>`;

        const statusEl = document.getElementById('lss-bm-status');
        const gridEl = document.getElementById('lss-bm-grid');
        const folderTitleEl = document.getElementById('lss-bm-folder-title');

        statusEl.addEventListener('click', async () => {
            await GM_deleteValue(KEY_SWITCHER_TAB_ID);

            statusEl.className = 'status warn';
            statusEl.innerHTML = `
                Aktiver Switcher wurde zurückgesetzt.<br>
                Öffne einen normalen Tab auf <code>www.leitstellenspiel.de</code>
                und aktiviere dort unten rechts die Checkbox erneut.
            `;
        });

        async function sendButtonCommand(cfg) {
            const switcherTabId = await GM_getValue(KEY_SWITCHER_TAB_ID, '');

            if (!switcherTabId) {
                statusEl.className = 'status warn';
                statusEl.innerHTML = 'Kein aktiver Switcher-Tab gesetzt. Bitte in einem normalen Tab unten rechts die Checkbox aktivieren.';
                return;
            }

            const command = {
                id: 'cmd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
                targetTabId: switcherTabId,
                url:
                    cfg.action === 'sprechwunsch'
                        ? SPECIAL_URL_SPRECHWUNSCH
                        : cfg.action === 'einsatz'
                            ? SPECIAL_URL_EINSATZ
                            : normalizeUrl(cfg.url),
                createdAt: Date.now(),
                sourceTabId: THIS_TAB_ID,
                label: cfg.label,
            };

            await GM_setValue(KEY_SWITCH_COMMAND, command);

            statusEl.className = 'status ok';
            statusEl.innerHTML = `Befehl gesendet`;
        }

        function applySprechwunschHighlight(active) {
            document.querySelectorAll('.lss-bm-special[data-special-action="sprechwunsch"]').forEach(btn => {
                btn.classList.toggle('active', !!active);
            });
        }

        function renderCurrentFolder() {
            const currentButtons = getButtonsByPath(folderPath);
            folderTitleEl.textContent = getFolderTitleByPath(folderPath);

            const backButtonHtml = folderPath.length
                ? `<button class="lss-bm-btn lss-bm-back" data-action="back">← Zurück</button>`
                : '';

            const buttonsHtml = currentButtons.map((btn, index) => {
                const isFolder = isFolderButton(btn);
                const isSprechwunsch = btn.action === 'sprechwunsch';
                const isSpecial = btn.action === 'sprechwunsch' || btn.action === 'einsatz';
                const icon = isFolder ? '📁 ' : '';

                return `
                    <button
                        class="lss-bm-btn ${isFolder ? 'lss-bm-folder' : ''} ${isSpecial ? 'lss-bm-special' : ''} ${isSprechwunsch && hasSprechwunsch ? 'active' : ''}"
                        data-index="${index}"
                        data-action="${isFolder ? 'folder' : 'button'}"
                        data-special-action="${escapeHtml(btn.action || '')}"
                    >
                        ${icon}${escapeHtml(btn.label)}
                    </button>
                `;
            }).join('');

            gridEl.innerHTML = backButtonHtml + buttonsHtml;
        }

        gridEl.addEventListener('click', async event => {
            const button = event.target.closest('button');
            if (!button) return;

            const action = button.dataset.action;

            if (action === 'back') {
                folderPath.pop();
                renderCurrentFolder();
                return;
            }

            const index = Number(button.dataset.index);
            const currentButtons = getButtonsByPath(folderPath);
            const cfg = currentButtons[index];

            if (!cfg) return;

            if (action === 'folder' && isFolderButton(cfg)) {
                folderPath.push(index);
                renderCurrentFolder();
                return;
            }

            if (action === 'button') {
                if (cfg.action === 'sprechwunsch' || cfg.action === 'einsatz') {
                    await sendButtonCommand(cfg);
                    return;
                }

                if (cfg.url) {
                    await sendButtonCommand(cfg);
                }
            }
        });

        GM_addValueChangeListener(KEY_SWITCHER_TAB_ID, async (_key, _oldVal, newVal) => {
            const hasSwitcher = !!newVal;
            statusEl.className = 'status ' + (hasSwitcher ? 'ok' : 'warn');
            statusEl.innerHTML = hasSwitcher
                ? `Aktiver Switcher gefunden: <code>${escapeHtml(newVal)}</code><br><small>Status anklicken zum Zurücksetzen.</small>`
                : `Kein aktiver Switcher-Tab gesetzt. Öffne einen normalen Tab auf <code>www.leitstellenspiel.de</code> und aktiviere dort unten rechts die Checkbox.`;
        });

        GM_addValueChangeListener(KEY_HAS_SPRECHWUNSCH, (_key, _oldVal, newVal) => {
            applySprechwunschHighlight(newVal);
        });

        renderCurrentFolder();
        applySprechwunschHighlight(hasSprechwunsch);
    }

    // Switcher-UI
    async function renderSwitcherWidget() {
        const box = document.createElement('div');
        box.id = 'lss-switcher-box';
        box.innerHTML = `
            <label id="lss-switcher-label" for="lss-switcher-checkbox">
                <input id="lss-switcher-checkbox" type="checkbox">
                <span>Switcher-Tab</span>
            </label>
            <div id="lss-switcher-mini-status"></div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            #lss-switcher-box {
                position: fixed;
                right: 14px;
                bottom: 14px;
                z-index: 999999;
                background: rgba(17, 24, 39, 0.95);
                color: #fff;
                border: 1px solid rgba(255,255,255,0.18);
                border-radius: 12px;
                padding: 10px 12px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.35);
                backdrop-filter: blur(4px);
                font-family: Arial, Helvetica, sans-serif;
                min-width: 180px;
            }

            #lss-switcher-label {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 700;
                margin: 0;
            }

            #lss-switcher-checkbox {
                margin: 0;
            }

            #lss-switcher-mini-status {
                margin-top: 6px;
                font-size: 12px;
                line-height: 1.35;
                color: #d1d5db;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(box);

        const checkbox = document.getElementById('lss-switcher-checkbox');
        const status = document.getElementById('lss-switcher-mini-status');

        async function refreshUi() {
            const activeSwitcherTabId = await GM_getValue(KEY_SWITCHER_TAB_ID, '');
            const wantsToBeSwitcher = sessionStorage.getItem(KEY_THIS_TAB_IS_SWITCHER) === '1';
            const isThisTabSwitcher = activeSwitcherTabId === THIS_TAB_ID;

            checkbox.checked = wantsToBeSwitcher;

            if (isThisTabSwitcher) {
                status.textContent = 'Dieser Tab ist aktiv.';
            } else if (wantsToBeSwitcher && activeSwitcherTabId && activeSwitcherTabId !== THIS_TAB_ID) {
                status.textContent = 'Ein anderer Tab ist aktiv.';
            } else if (wantsToBeSwitcher) {
                status.textContent = 'Dieser Tab wird beim nächsten Laden wieder aktiv.';
            } else {
                status.textContent = 'Kein Switcher aktiv.';
            }
        }

        if (sessionStorage.getItem(KEY_THIS_TAB_IS_SWITCHER) === '1') {
            await GM_setValue(KEY_SWITCHER_TAB_ID, THIS_TAB_ID);
        }

        checkbox.addEventListener('change', async () => {
            if (checkbox.checked) {
                sessionStorage.setItem(KEY_THIS_TAB_IS_SWITCHER, '1');
                await GM_setValue(KEY_SWITCHER_TAB_ID, THIS_TAB_ID);
                status.textContent = 'Dieser Tab ist aktiv.';
            } else {
                sessionStorage.removeItem(KEY_THIS_TAB_IS_SWITCHER);

                const activeSwitcherTabId = await GM_getValue(KEY_SWITCHER_TAB_ID, '');
                if (activeSwitcherTabId === THIS_TAB_ID) {
                    await GM_deleteValue(KEY_SWITCHER_TAB_ID);
                }

                status.textContent = 'Switcher deaktiviert.';
            }
        });

        GM_addValueChangeListener(KEY_SWITCHER_TAB_ID, async () => {
            await refreshUi();
        });

        await refreshUi();
    }

    async function shouldRenderSwitcherWidget() {
        const activeSwitcherTabId = await GM_getValue(KEY_SWITCHER_TAB_ID, '');
        const wantsToBeSwitcher = sessionStorage.getItem(KEY_THIS_TAB_IS_SWITCHER) === '1';

        if (wantsToBeSwitcher) return true;
        if (!activeSwitcherTabId) return true;

        return activeSwitcherTabId === THIS_TAB_ID;
    }

    // Switcher-Logik
    async function handleSwitchCommand(command) {
        if (!command || typeof command !== 'object') return;
        if (!command.targetTabId || !command.url || !command.id) return;

        const activeSwitcherTabId = await GM_getValue(KEY_SWITCHER_TAB_ID, '');
        const isThisTabSwitcher = activeSwitcherTabId === THIS_TAB_ID;

        if (!isThisTabSwitcher) return;
        if (command.targetTabId !== THIS_TAB_ID) return;

        const alreadyProcessedId = sessionStorage.getItem('lss_last_processed_command_id');
        if (alreadyProcessedId === command.id) return;

        sessionStorage.setItem('lss_last_processed_command_id', command.id);

        const currentCommand = await GM_getValue(KEY_SWITCH_COMMAND, null);
        if (currentCommand && currentCommand.id === command.id) {
            await GM_deleteValue(KEY_SWITCH_COMMAND);
        }

        if (command.url === SPECIAL_URL_SPRECHWUNSCH) {
            handleSprechwunsch();
            return;
        }

        if (command.url === SPECIAL_URL_EINSATZ) {
            handleEinsatz();
            return;
        }

        location.assign(command.url);
    }

    async function setupSwitcherListener() {
        const listenerId = GM_addValueChangeListener(KEY_SWITCH_COMMAND, async (_key, _oldVal, newVal, remote) => {
            if (!newVal) return;
            if (!remote) return;

            await handleSwitchCommand(newVal);
        });

        window.addEventListener('beforeunload', () => {
            try {
                GM_removeValueChangeListener(listenerId);
            } catch {
                // egal
            }
        });

        const existingCommand = await GM_getValue(KEY_SWITCH_COMMAND, null);
        if (existingCommand) {
            await handleSwitchCommand(existingCommand);
        }
    }

    // Initialisierung
    async function init() {
        if (isButtonmasterPage()) {
            await renderButtonmasterPage();
            return;
        }

        const startNormalPage = async () => {
            if (await shouldRenderSwitcherWidget()) {
                await renderSwitcherWidget();
            }

            await setupSwitcherListener();
            observeSprechwuensche();
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startNormalPage, { once: true });
        } else {
            await startNormalPage();
        }
    }

    init();
})();
