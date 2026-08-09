// ==UserScript==
// @name         LSS Fahrzeugtableau
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0
// @description  Frei konfigurierbares Fahrzeugtableau.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/*
// @match        https://leitstellenspiel.de/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// ==/UserScript==

(() => {
    'use strict';

    const APP_PATH = '/fahrzeugtableau';
    const MONITOR_FRAME_QUERY_KEY = 'lss_ft_monitor';
    const IS_TABLEAU = location.pathname.replace(/\/$/, '') === APP_PATH;
    const IS_INTERNAL_MONITOR_FRAME = window.self !== window.top
        && new URLSearchParams(location.search).get(MONITOR_FRAME_QUERY_KEY) === '1';

    const DB_NAME = 'lss-fahrzeugtableau';
    const STORE_SETTINGS = 'settings';
    const STORE_PLACEMENTS = 'placements';
    const STORE_STATES = 'vehicleStates';

    const SETTINGS_KEY = 'grid';
    const UI_SETTINGS_KEY = 'ui';

    const DEFAULT_ROWS = 3;
    const DEFAULT_COLS = 4;
    const MAX_ROWS = 20;
    const MAX_COLS = 20;

    const REQUEST_GAP_MS = 100;
    const FLASH_MS = 850;
    const MISSION_CACHE_TTL_MS = 30_000;

    const GM_EVENT_PREFIX = 'lss_ft_vehicle_event_';
    const GM_PLACEMENTS_REVISION = 'lss_ft_placements_revision';
    const BROADCAST_CHANNEL = 'lss-fahrzeugtableau';

    const STATUS_COLORS = {
        1: '#5a97f3',
        2: '#77dc81',
        3: '#f3d470',
        4: '#f58558',
        5: '#ff0202',
        6: '#000000',
        7: '#ff8600',
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const normalizeUrl = (url) => url ? new URL(url, location.origin).href : null;
    const slotKey = (row, col) => `${row}:${col}`;

    let dbPromise = null;
    let broadcast = null;
    let trackedVehicleIds = new Set();

    try {
        broadcast = new BroadcastChannel(BROADCAST_CHANNEL);
    } catch (_) {
        broadcast = null;
    }

    // IndexDB
    function openDb() {
        if (dbPromise) return dbPromise;

        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME);

            request.onupgradeneeded = () => {
                const db = request.result;

                if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
                    db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
                }

                if (!db.objectStoreNames.contains(STORE_PLACEMENTS)) {
                    const store = db.createObjectStore(STORE_PLACEMENTS, { keyPath: 'slot' });
                    store.createIndex('vehicleId', 'vehicleId', { unique: false });
                }

                if (!db.objectStoreNames.contains(STORE_STATES)) {
                    db.createObjectStore(STORE_STATES, { keyPath: 'vehicleId' });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        return dbPromise;
    }

    async function idbGet(storeName, key) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const req = tx.objectStore(storeName).get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function idbGetAll(storeName) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const req = tx.objectStore(storeName).getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }

    async function idbPut(storeName, value) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const req = tx.objectStore(storeName).put(value);
            req.onsuccess = () => resolve(value);
            req.onerror = () => reject(req.error);
        });
    }

    async function idbDelete(storeName, key) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const req = tx.objectStore(storeName).delete(key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    async function idbClear(storeName) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const req = tx.objectStore(storeName).clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    async function getGridSettings() {
        const settings = await idbGet(STORE_SETTINGS, SETTINGS_KEY);
        if (settings) return settings;

        const initial = { key: SETTINGS_KEY, rows: DEFAULT_ROWS, cols: DEFAULT_COLS };
        await idbPut(STORE_SETTINGS, initial);
        return initial;
    }

    async function getUiSettings() {
        const settings = await idbGet(STORE_SETTINGS, UI_SETTINGS_KEY);
        if (settings) {
            return {
                key: UI_SETTINGS_KEY,
                toolbarAutoHide: Boolean(settings.toolbarAutoHide),
            };
        }

        const initial = { key: UI_SETTINGS_KEY, toolbarAutoHide: false };
        await idbPut(STORE_SETTINGS, initial);
        return initial;
    }

    async function loadTrackedVehicleIds() {
        const placements = await idbGetAll(STORE_PLACEMENTS);
        trackedVehicleIds = new Set(placements.map(p => Number(p.vehicleId)).filter(Number.isFinite));
        return trackedVehicleIds;
    }

    async function notifyPlacementsChanged() {
        await loadTrackedVehicleIds();
        const at = Date.now();
        GM_setValue(GM_PLACEMENTS_REVISION, at);
        broadcast?.postMessage({ type: 'placements-changed', at });
    }

    broadcast?.addEventListener('message', (event) => {
        if (event.data?.type === 'placements-changed') {
            loadTrackedVehicleIds().catch(console.error);
        }
    });

    GM_addValueChangeListener(GM_PLACEMENTS_REVISION, () => {
        loadTrackedVehicleIds().catch(console.error);
    });

    // Funkmonitor-Fallback
    function extractVehicleIdFromRadioItem(li) {
        const className = typeof li.className === 'string' ? li.className : '';
        const match = className.match(/(?:^|\s)radio_message_vehicle_(\d+)(?:\s|$)/);
        return match ? Number(match[1]) : null;
    }

    function extractStatusFromFmsElement(fmsElement) {
        if (!fmsElement) return null;

        const textMatch = fmsElement.textContent?.trim().match(/^([1-7])$/);
        if (textMatch) return Number(textMatch[1]);

        for (const className of fmsElement.classList || []) {
            const match = className.match(/^building_list_fms_([1-7])$/);
            if (match) return Number(match[1]);
        }

        return null;
    }

    function isElementNode(node) {
        return Boolean(node && node.nodeType === 1 && typeof node.querySelector === 'function');
    }

    function extractRadioUpdate(li) {
        if (!isElementNode(li)) return null;

        const vehicleId = extractVehicleIdFromRadioItem(li);
        if (!vehicleId) return null;

        const fms = li.querySelector('span.building_list_fms, .building_list_fms');
        const status = extractStatusFromFmsElement(fms);
        if (!status) return null;

        const missionAnchor = li.querySelector('a.mission-radio-button[href*="/missions/"], a[href*="/missions/"]');
        const missionUrl = missionAnchor ? normalizeUrl(missionAnchor.getAttribute('href')) : null;

        return { vehicleId, status, missionUrl };
    }

    function eventKey(vehicleId) {
        return `${GM_EVENT_PREFIX}${vehicleId}`;
    }

    function makeEventId(vehicleId) {
        if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
        return `${vehicleId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    function publishRadioUpdate(update) {
        if (!trackedVehicleIds.has(update.vehicleId)) return;

        GM_setValue(eventKey(update.vehicleId), {
            eventId: makeEventId(update.vehicleId),
            vehicleId: update.vehicleId,
            status: update.status,
            missionUrl: update.missionUrl,
            observedAt: Date.now(),
            displayed: false,
        });
    }

    function processAddedRadioNode(node) {
        if (!isElementNode(node)) return;

        if (node.matches('li[class*="radio_message_vehicle_"]')) {
            const update = extractRadioUpdate(node);
            if (update) publishRadioUpdate(update);
        }

        node.querySelectorAll?.('li[class*="radio_message_vehicle_"]').forEach(li => {
            const update = extractRadioUpdate(li);
            if (update) publishRadioUpdate(update);
        });
    }

    function attachRadioObserver(panel) {
        if (!panel || panel.dataset.lssFtObserved === '1') return;
        panel.dataset.lssFtObserved = '1';

        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(processAddedRadioNode);
            }
        });

        observer.observe(panel, { childList: true, subtree: true });
    }

    function startRadioMonitoring() {
        const attachExisting = () => attachRadioObserver(document.getElementById('radio_panel_body'));
        attachExisting();

        const pageObserver = new MutationObserver(() => attachExisting());
        pageObserver.observe(document.documentElement, { childList: true, subtree: true });
    }

    // Funkmonitor
    function muteMonitorWindow(targetWindow = window) {
        try {
            const doc = targetWindow.document;
            if (!doc) return;

            const muteMedia = () => {
                doc.querySelectorAll('audio, video').forEach(media => {
                    try {
                        media.muted = true;
                        media.volume = 0;
                    } catch (_) {
                    }
                });

                try {
                    targetWindow.Howler?.mute?.(true);
                } catch (_) {
                }
            };

            const mediaProto = targetWindow.HTMLMediaElement?.prototype;
            if (mediaProto && !mediaProto.__lssFtMutedPlayPatched) {
                const originalPlay = mediaProto.play;
                mediaProto.play = function (...args) {
                    try {
                        this.muted = true;
                        this.volume = 0;
                    } catch (_) {
                    }
                    return originalPlay.apply(this, args);
                };
                Object.defineProperty(mediaProto, '__lssFtMutedPlayPatched', {
                    value: true,
                    configurable: true,
                });
            }

            muteMedia();

            if (doc.documentElement && !doc.documentElement.dataset.lssFtMuteObserved) {
                doc.documentElement.dataset.lssFtMuteObserved = '1';
                const Observer = targetWindow.MutationObserver || MutationObserver;
                const observer = new Observer(() => muteMedia());
                observer.observe(doc.documentElement, { childList: true, subtree: true });
                doc.__lssFtMuteObserver = observer;
            }
        } catch (error) {
            console.warn('Funkmonitor konnte nicht vollständig stummgeschaltet werden:', error);
        }
    }

    function connectEmbeddedRadioMonitor(iframe) {
        try {
            const frameWindow = iframe.contentWindow;
            const frameDocument = iframe.contentDocument;
            if (!frameWindow || !frameDocument) return;

            muteMonitorWindow(frameWindow);

            const attachExisting = () => {
                const panel = frameDocument.getElementById('radio_panel_body');
                if (panel) attachRadioObserver(panel);
            };

            attachExisting();

            if (frameDocument.documentElement && !frameDocument.documentElement.dataset.lssFtRadioPageObserved) {
                frameDocument.documentElement.dataset.lssFtRadioPageObserved = '1';
                const Observer = frameWindow.MutationObserver || MutationObserver;
                const observer = new Observer(() => attachExisting());
                observer.observe(frameDocument.documentElement, { childList: true, subtree: true });
                frameDocument.__lssFtRadioPageObserver = observer;
            }
        } catch (error) {
            console.warn('Eingebetteter Funkmonitor konnte nicht verbunden werden:', error);
        }
    }

    function startEmbeddedRadioMonitor() {
        if (!IS_TABLEAU || document.getElementById('lss-ft-radio-monitor-frame')) return;

        const iframe = document.createElement('iframe');
        iframe.id = 'lss-ft-radio-monitor-frame';
        iframe.title = 'Leitstellenspiel Funkmonitor';
        iframe.src = `/?${MONITOR_FRAME_QUERY_KEY}=1`;
        iframe.tabIndex = -1;
        iframe.setAttribute('aria-hidden', 'true');

        iframe.setAttribute('allow', "autoplay 'none'; microphone 'none'; camera 'none'");

        Object.assign(iframe.style, {
            position: 'fixed',
            width: '2px',
            height: '2px',
            left: '-10000px',
            top: '-10000px',
            border: '0',
            opacity: '0',
            pointerEvents: 'none',
        });

        iframe.addEventListener('load', () => connectEmbeddedRadioMonitor(iframe));
        document.body.appendChild(iframe);
    }

    class RequestQueue {
        constructor(minGapMs) {
            this.minGapMs = minGapMs;
            this.lastFinishedAt = 0;
            this.chain = Promise.resolve();
        }

        enqueue(task) {
            const run = async () => {
                if (this.lastFinishedAt) {
                    const elapsed = Date.now() - this.lastFinishedAt;
                    const wait = Math.max(0, this.minGapMs - elapsed);
                    if (wait > 0) await sleep(wait);
                }

                try {
                    return await task();
                } finally {
                    this.lastFinishedAt = Date.now();
                }
            };

            const result = this.chain.then(run, run);
            this.chain = result.catch(() => undefined);
            return result;
        }
    }

    const requests = new RequestQueue(REQUEST_GAP_MS);

    async function queuedFetch(url, options = {}) {
        return requests.enqueue(async () => {
            const response = await fetch(normalizeUrl(url), {
                credentials: 'same-origin',
                cache: 'no-store',
                ...options,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} für ${url}`);
            }

            return response;
        });
    }

    async function fetchText(url) {
        return (await queuedFetch(url)).text();
    }

    async function fetchJson(url) {
        return (await queuedFetch(url)).json();
    }

    function parseHtml(html) {
        return new DOMParser().parseFromString(html, 'text/html');
    }

    function parseVehiclePage(html) {
        const doc = parseHtml(html);
        const details = doc.querySelector('#vehicle_details');
        if (!details) throw new Error('vehicle_details wurde auf der Fahrzeugseite nicht gefunden.');

        const fms = details.querySelector('#vehicle-attr-fms .building_list_fms, #vehicle-attr-fms [class*="building_list_fms_"]');
        const status = extractStatusFromFmsElement(fms);
        if (!status) throw new Error('FMS-Status konnte auf der Fahrzeugseite nicht ermittelt werden.');

        const missionAnchor = details.querySelector('#vehicle-attr-current-mission a[href*="/missions/"]');

        return {
            status,
            missionUrl: missionAnchor ? normalizeUrl(missionAnchor.getAttribute('href')) : null,
            missionAnchorText: missionAnchor?.textContent?.trim() || null,
        };
    }

    function cleanMissionHeading(h1) {
        if (!h1) return null;
        const clone = h1.cloneNode(true);
        clone.querySelectorAll('a, small, .glyphicon, img, script, style').forEach(el => el.remove());
        return clone.textContent.replace(/\s+/g, ' ').trim() || null;
    }

    function parseMissionPage(html, missionUrl) {
        const doc = parseHtml(html);
        const general = doc.querySelector('#mission_general_info') || doc.querySelector('[data-address]');
        const dataTitleNode = doc.querySelector('[data-mission-title]');
        const h1 = doc.querySelector('#missionH1');

        const missionTitle =
            general?.dataset?.missionTitle ||
            dataTitleNode?.dataset?.missionTitle ||
            cleanMissionHeading(h1) ||
            null;

        let address = general?.dataset?.address || doc.querySelector('[data-address]')?.dataset?.address || null;

        if (!address && general) {
            const small = Array.from(general.children).find(el => el.tagName === 'SMALL');
            address = small?.textContent?.replace(/\s+/g, ' ').trim() || null;
        }

        return {
            missionUrl: normalizeUrl(missionUrl),
            missionTitle,
            address,
        };
    }

    const missionCache = new Map();

    async function getMissionDetails(missionUrl, { force = false } = {}) {
        if (!missionUrl) return { missionUrl: null, missionTitle: null, address: null };

        const url = normalizeUrl(missionUrl);
        const cached = missionCache.get(url);
        const now = Date.now();

        if (!force && cached && cached.data && now - cached.at < MISSION_CACHE_TTL_MS) {
            return cached.data;
        }

        if (!force && cached?.promise) return cached.promise;

        const promise = (async () => {
            const html = await fetchText(url);
            const data = parseMissionPage(html, url);
            missionCache.set(url, { at: Date.now(), data, promise: null });
            return data;
        })();

        missionCache.set(url, { at: now, data: cached?.data || null, promise });

        try {
            return await promise;
        } catch (error) {
            missionCache.delete(url);
            throw error;
        }
    }

    if (!IS_TABLEAU) {
        if (IS_INTERNAL_MONITOR_FRAME) muteMonitorWindow(window);
        loadTrackedVehicleIds().catch(console.error);
        startRadioMonitoring();
        return;
    }

    const app = {
        settings: null,
        uiSettings: { key: UI_SETTINGS_KEY, toolbarAutoHide: false },
        placements: new Map(),
        states: new Map(),
        listeners: new Map(),
        updateChains: new Map(),
        vehiclesApi: null,
        vehiclesApiPromise: null,
        selectedSlot: null,
        dragSourceSlot: null,
        refreshRunning: false,
    };

    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            :root {
                --ft-bg: #12171d;
                --ft-panel: #1b232c;
                --ft-panel-2: #232e39;
                --ft-border: #3a4856;
                --ft-text: #f1f5f9;
                --ft-muted: #9fb0c0;
                --ft-accent: #4e9cff;
                --ft-danger: #d9534f;
                --ft-cell-min-height: 132px;
            }

            html, body {
                min-height: 100%;
                background: var(--ft-bg) !important;
            }

            body {
                margin: 0 !important;
                padding: 0 !important;
                color: var(--ft-text) !important;
                overflow-x: auto;
            }

            #lss-ft-app, #lss-ft-app * {
                box-sizing: border-box;
            }

            #lss-ft-app {
                min-height: 100vh;
                padding: 14px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                background: var(--ft-bg);
                color: var(--ft-text);
            }

            .lss-ft-toolbar {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 8px;
                position: sticky;
                top: 0;
                z-index: 50;
                margin: -14px -14px 14px;
                padding: 10px 14px;
                border-bottom: 1px solid var(--ft-border);
                background: rgba(18, 23, 29, 0.96);
                backdrop-filter: blur(8px);
                transition: transform 180ms ease, box-shadow 180ms ease;
            }

            .lss-ft-toolbar.lss-ft-toolbar-autohide {
                position: fixed;
                left: 0;
                right: 0;
                top: 0;
                margin: 0;
                transform: translateY(calc(-100% + 8px));
                box-shadow: 0 3px 14px rgba(0,0,0,0.32);
            }

            .lss-ft-toolbar.lss-ft-toolbar-autohide:hover,
            .lss-ft-toolbar.lss-ft-toolbar-autohide:focus-within {
                transform: translateY(0);
            }

            .lss-ft-toolbar.lss-ft-toolbar-autohide::after {
                content: "";
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                height: 8px;
                background: rgba(78, 156, 255, 0.42);
                pointer-events: none;
            }

            .lss-ft-title {
                margin: 0 14px 0 0;
                font-size: 20px;
                font-weight: 700;
            }

            .lss-ft-toolbar-group {
                display: inline-flex;
                align-items: center;
                gap: 5px;
            }

            .lss-ft-btn {
                border: 1px solid var(--ft-border);
                border-radius: 5px;
                padding: 7px 10px;
                background: var(--ft-panel-2);
                color: var(--ft-text);
                cursor: pointer;
                font: inherit;
            }

            .lss-ft-btn:hover { border-color: #6b7c8e; }
            .lss-ft-btn:disabled { opacity: 0.5; cursor: default; }
            .lss-ft-btn-primary { background: #246bb2; border-color: #347fc9; }
            .lss-ft-btn-danger { background: #8b3431; border-color: #a94442; }

            .lss-ft-counter,
            .lss-ft-statusline {
                color: var(--ft-muted);
                font-size: 13px;
            }

            .lss-ft-statusline {
                margin-left: auto;
                min-width: 180px;
                text-align: right;
            }

            .lss-ft-grid {
                display: grid;
                gap: 8px;
                align-items: stretch;
            }

            .lss-ft-cell {
                min-width: 250px;
                min-height: var(--ft-cell-min-height);
                border: 1px dashed #465766;
                border-radius: 7px;
                background: rgba(255,255,255,0.025);
                position: relative;
                overflow: hidden;
            }

            .lss-ft-cell.lss-ft-empty {
                display: flex;
                align-items: center;
                justify-content: center;
                color: #708292;
                cursor: pointer;
                user-select: none;
            }

            .lss-ft-cell.lss-ft-empty:hover {
                border-color: #7790a4;
                background: rgba(255,255,255,0.045);
                color: #9fb0c0;
            }

            .lss-ft-cell.lss-ft-dragover {
                outline: 2px solid var(--ft-accent);
                outline-offset: -2px;
            }

            .lss-ft-tile {
                width: 100%;
                min-height: var(--ft-cell-min-height);
                height: 100%;
                display: grid;
                grid-template-columns: 78px minmax(0, 1fr);
                gap: 10px;
                padding: 10px;
                border-radius: 7px;
                background: var(--ft-panel);
                cursor: grab;
                position: relative;
                transition: background-color 120ms linear;
            }

            .lss-ft-tile:active { cursor: grabbing; }

            .lss-ft-statusbox {
                display: flex;
                align-items: center;
                justify-content: center;
                align-self: stretch;
                min-height: 82px;
                border-radius: 6px;
                font-size: 48px;
                line-height: 1;
                font-weight: 800;
                color: #111;
                text-shadow: 0 1px 0 rgba(255,255,255,0.2);
            }

            .lss-ft-details {
                min-width: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 3px;
                padding-right: 28px;
            }

            .lss-ft-vehicle-name {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-size: 17px;
                font-weight: 700;
                color: var(--ft-text);
            }

            .lss-ft-mission {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-size: 14px;
                color: #d6e5f2;
            }

            .lss-ft-address {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-size: 13px;
                color: var(--ft-muted);
            }

            .lss-ft-time {
                margin-top: 4px;
                font-variant-numeric: tabular-nums;
                font-size: 13px;
                color: #bfd2e3;
            }

            .lss-ft-id {
                font-size: 11px;
                color: #718496;
            }

            .lss-ft-remove {
                position: absolute;
                top: 5px;
                right: 5px;
                width: 25px;
                height: 25px;
                padding: 0;
                border: 0;
                border-radius: 4px;
                background: transparent;
                color: #8294a4;
                font-size: 18px;
                line-height: 25px;
                cursor: pointer;
            }

            .lss-ft-remove:hover { background: rgba(255,255,255,0.08); color: #fff; }

            .lss-ft-error {
                margin-top: 3px;
                color: #ff9a95;
                font-size: 11px;
            }

            @keyframes lssFtFlash {
                0%, 100% { box-shadow: inset 0 0 0 0 var(--ft-flash-color); background: var(--ft-panel); }
                18%, 52% { box-shadow: inset 0 0 0 5px var(--ft-flash-color); background: color-mix(in srgb, var(--ft-flash-color) 42%, var(--ft-panel)); }
                35%, 70% { box-shadow: inset 0 0 0 2px var(--ft-flash-color); background: var(--ft-panel); }
            }

            .lss-ft-tile.lss-ft-flashing {
                animation: lssFtFlash ${FLASH_MS}ms ease-in-out;
            }

            .lss-ft-modal-backdrop {
                position: fixed;
                inset: 0;
                z-index: 1000;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding: min(10vh, 80px) 15px 20px;
                background: rgba(0, 0, 0, 0.68);
            }

            .lss-ft-modal-backdrop[hidden] { display: none !important; }

            .lss-ft-modal {
                width: min(720px, 96vw);
                max-height: 80vh;
                display: flex;
                flex-direction: column;
                border: 1px solid var(--ft-border);
                border-radius: 8px;
                background: #18212a;
                box-shadow: 0 20px 60px rgba(0,0,0,0.45);
            }

            .lss-ft-modal-head {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px;
                border-bottom: 1px solid var(--ft-border);
            }

            .lss-ft-modal-head strong { flex: 1; }

            .lss-ft-search {
                width: 100%;
                padding: 10px 11px;
                border: 1px solid #465767;
                border-radius: 5px;
                outline: none;
                background: #0f151b;
                color: #fff;
                font: inherit;
            }

            .lss-ft-search:focus { border-color: var(--ft-accent); }

            .lss-ft-modal-body { padding: 12px; overflow: hidden; }

            .lss-ft-results {
                margin-top: 10px;
                max-height: 55vh;
                overflow: auto;
                border: 1px solid #354452;
                border-radius: 5px;
            }

            .lss-ft-result {
                width: 100%;
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                gap: 12px;
                padding: 9px 10px;
                border: 0;
                border-bottom: 1px solid #2b3844;
                background: #1c2630;
                color: #fff;
                text-align: left;
                cursor: pointer;
            }

            .lss-ft-result:last-child { border-bottom: 0; }
            .lss-ft-result:hover { background: #263544; }
            .lss-ft-result.lss-ft-result-assigned { background: #1b2d25; }
            .lss-ft-result.lss-ft-result-assigned:hover { background: #223a2f; }
            .lss-ft-result-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .lss-ft-result-meta {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                flex-wrap: wrap;
                gap: 5px 9px;
                color: #8da1b3;
                font-variant-numeric: tabular-nums;
                text-align: right;
            }
            .lss-ft-result-id { color: #8da1b3; }
            .lss-ft-result-position { color: #9ee8b7; white-space: nowrap; font-weight: 600; }
            .lss-ft-result-assigned-label {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                color: #9ee8b7;
                font-weight: 700;
                white-space: nowrap;
            }
            .lss-ft-result-check {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 19px;
                height: 19px;
                border-radius: 50%;
                background: #2fa85f;
                color: #fff;
                font-weight: 800;
                line-height: 1;
                box-shadow: 0 0 0 1px rgba(255,255,255,.12) inset;
            }
            .lss-ft-modal-message { padding: 16px; color: var(--ft-muted); text-align: center; }

            @media (max-width: 700px) {
                #lss-ft-app { padding: 8px; }
                .lss-ft-toolbar { margin: -8px -8px 8px; padding: 8px; }
                .lss-ft-statusline { width: 100%; margin-left: 0; text-align: left; }
                .lss-ft-cell { min-width: 220px; }
                .lss-ft-tile { grid-template-columns: 64px minmax(0, 1fr); }
                .lss-ft-statusbox { font-size: 40px; }
            }
        `;
        document.head.appendChild(style);
    }

    function buildAppShell() {
        const root = document.createElement('div');
        root.id = 'lss-ft-app';
        root.innerHTML = `
            <div class="lss-ft-toolbar">
                <h1 class="lss-ft-title">Fahrzeugtableau</h1>

                <div class="lss-ft-toolbar-group">
                    <button class="lss-ft-btn" data-action="row-add" title="Zeile hinzufügen">+ Zeile</button>
                    <button class="lss-ft-btn" data-action="row-remove" title="Letzte Zeile entfernen">− Zeile</button>
                    <button class="lss-ft-btn" data-action="col-add" title="Spalte hinzufügen">+ Spalte</button>
                    <button class="lss-ft-btn" data-action="col-remove" title="Letzte Spalte entfernen">− Spalte</button>
                </div>

                <button class="lss-ft-btn lss-ft-btn-primary" data-action="refresh">Alle prüfen</button>
                <button class="lss-ft-btn" data-action="export" title="Raster und Fahrzeugbelegung exportieren">Export</button>
                <button class="lss-ft-btn" data-action="import" title="Gespeicherte Tableau-Konfiguration importieren">Import</button>
                <button class="lss-ft-btn" data-action="toolbar-autohide" title="Kopfzeile automatisch ausblenden">Kopfzeile ausblenden</button>
                <input id="lss-ft-import-file" type="file" accept=".json,.txt,application/json,text/plain" hidden>
                <span class="lss-ft-counter" id="lss-ft-counter"></span>
                <span class="lss-ft-statusline" id="lss-ft-statusline"></span>
            </div>

            <div class="lss-ft-grid" id="lss-ft-grid"></div>

            <div class="lss-ft-modal-backdrop" id="lss-ft-modal" hidden>
                <div class="lss-ft-modal" role="dialog" aria-modal="true" aria-labelledby="lss-ft-modal-title">
                    <div class="lss-ft-modal-head">
                        <strong id="lss-ft-modal-title">Fahrzeug auswählen</strong>
                        <button class="lss-ft-btn" data-action="modal-close">Schließen</button>
                    </div>
                    <div class="lss-ft-modal-body">
                        <input id="lss-ft-search" class="lss-ft-search" type="search" autocomplete="off" placeholder="Fahrzeugname oder Fahrzeug-ID …">
                        <div id="lss-ft-results" class="lss-ft-results"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.replaceChildren(root);
    }

    function setStatusLine(text) {
        const el = document.getElementById('lss-ft-statusline');
        if (el) el.textContent = text || '';
    }

    function applyToolbarAutoHide() {
        const toolbar = document.querySelector('.lss-ft-toolbar');
        const button = document.querySelector('[data-action="toolbar-autohide"]');
        const enabled = Boolean(app.uiSettings?.toolbarAutoHide);

        toolbar?.classList.toggle('lss-ft-toolbar-autohide', enabled);
        if (button) {
            button.textContent = enabled ? 'Kopfzeile fixieren' : 'Kopfzeile ausblenden';
            button.title = enabled
                ? 'Automatisches Ausblenden der Kopfzeile deaktivieren'
                : 'Kopfzeile automatisch ausblenden; Maus am oberen Rand blendet sie wieder ein';
        }
    }

    async function toggleToolbarAutoHide() {
        app.uiSettings = {
            key: UI_SETTINGS_KEY,
            toolbarAutoHide: !Boolean(app.uiSettings?.toolbarAutoHide),
        };
        await idbPut(STORE_SETTINGS, app.uiSettings);
        applyToolbarAutoHide();
        setStatusLine(app.uiSettings.toolbarAutoHide
            ? 'Kopfzeile wird automatisch ausgeblendet. Maus an den oberen Rand bewegen, um sie einzublenden.'
            : 'Kopfzeile bleibt eingeblendet.');
    }

    function buildExportConfiguration() {
        return {
            format: 'lss-fahrzeugtableau-config',
            exportedAt: new Date().toISOString(),
            grid: {
                rows: app.settings.rows,
                cols: app.settings.cols,
            },
            ui: {
                toolbarAutoHide: Boolean(app.uiSettings?.toolbarAutoHide),
            },
            placements: Array.from(app.placements.values())
                .map(placement => ({
                    slot: String(placement.slot),
                    vehicleId: Number(placement.vehicleId),
                    caption: String(placement.caption || `Fahrzeug ${placement.vehicleId}`),
                }))
                .sort((a, b) => a.slot.localeCompare(b.slot, undefined, { numeric: true })),
        };
    }

    function exportConfiguration() {
        const config = buildExportConfiguration();
        const json = JSON.stringify(config, null, 2);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');

        link.href = url;
        link.download = `lss-fahrzeugtableau-config-${stamp}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setStatusLine(`Konfiguration exportiert: ${config.placements.length} Fahrzeuge, ${config.grid.rows}×${config.grid.cols}.`);
    }

    function validateImportedConfiguration(raw) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
            throw new Error('Die Importdatei enthält keine gültige Konfiguration.');
        }

        if (raw.format && raw.format !== 'lss-fahrzeugtableau-config') {
            throw new Error('Die Datei ist keine Fahrzeugtableau-Konfiguration.');
        }

        const rows = Number(raw.grid?.rows);
        const cols = Number(raw.grid?.cols);
        if (!Number.isInteger(rows) || rows < 1 || rows > MAX_ROWS || !Number.isInteger(cols) || cols < 1 || cols > MAX_COLS) {
            throw new Error(`Ungültige Rastergröße. Erlaubt sind 1–${MAX_ROWS} Zeilen und 1–${MAX_COLS} Spalten.`);
        }

        if (!Array.isArray(raw.placements)) {
            throw new Error('Die Fahrzeugbelegung fehlt oder ist ungültig.');
        }

        const seenSlots = new Set();
        const seenVehicles = new Set();
        const placements = raw.placements.map((entry, index) => {
            const vehicleId = Number(entry?.vehicleId);
            const slot = String(entry?.slot || '');
            const match = slot.match(/^(\d+):(\d+)$/);

            if (!Number.isFinite(vehicleId) || vehicleId <= 0 || !Number.isInteger(vehicleId)) {
                throw new Error(`Ungültige Fahrzeug-ID an Position ${index + 1}.`);
            }
            if (!match) {
                throw new Error(`Ungültige Kachelposition an Position ${index + 1}.`);
            }

            const row = Number(match[1]);
            const col = Number(match[2]);
            if (row < 0 || row >= rows || col < 0 || col >= cols) {
                throw new Error(`Kachel ${slot} liegt außerhalb des importierten Rasters.`);
            }
            if (seenSlots.has(slot)) {
                throw new Error(`Kachel ${slot} ist in der Importdatei mehrfach belegt.`);
            }
            if (seenVehicles.has(vehicleId)) {
                throw new Error(`Fahrzeug ${vehicleId} kommt in der Importdatei mehrfach vor.`);
            }

            seenSlots.add(slot);
            seenVehicles.add(vehicleId);
            return {
                slot,
                vehicleId,
                caption: String(entry?.caption || `Fahrzeug ${vehicleId}`),
            };
        });

        return {
            settings: { key: SETTINGS_KEY, rows, cols },
            uiSettings: {
                key: UI_SETTINGS_KEY,
                toolbarAutoHide: Boolean(raw.ui?.toolbarAutoHide),
            },
            placements,
        };
    }

    async function importConfigurationFile(file) {
        if (!file) return;

        let parsed;
        try {
            parsed = JSON.parse(await file.text());
        } catch (_) {
            throw new Error('Die Importdatei enthält kein gültiges JSON.');
        }

        const imported = validateImportedConfiguration(parsed);

        await idbPut(STORE_SETTINGS, imported.settings);
        await idbPut(STORE_SETTINGS, imported.uiSettings);
        await idbClear(STORE_PLACEMENTS);
        for (const placement of imported.placements) {
            await idbPut(STORE_PLACEMENTS, placement);
        }

        app.settings = imported.settings;
        app.uiSettings = imported.uiSettings;
        app.placements = new Map(imported.placements.map(placement => [placement.slot, placement]));

        applyToolbarAutoHide();
        renderGrid();
        await notifyPlacementsChanged();
        syncGmListeners();
        setStatusLine(`Import übernommen: ${imported.placements.length} Fahrzeuge, ${imported.settings.rows}×${imported.settings.cols}. Prüfe Fahrzeugzustände …`);

        await refreshAllVehicles({ reason: 'manual', animate: false });
    }

    function formatDuration(startAt) {
        if (!startAt) return '—';
        const totalSeconds = Math.max(0, Math.floor((Date.now() - startAt) / 1000));
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const hhmmss = [hours, minutes, seconds].map(n => String(n).padStart(2, '0')).join(':');
        return days > 0 ? `${days}d ${hhmmss}` : hhmmss;
    }

    function statusTextColor(status) {
        return Number(status) === 6 ? '#ffffff' : '#111111';
    }

    function getPlacementByVehicleId(vehicleId) {
        for (const placement of app.placements.values()) {
            if (Number(placement.vehicleId) === Number(vehicleId)) return placement;
        }
        return null;
    }

    function formatSlotPosition(slot) {
        const [row, col] = String(slot || '').split(':').map(Number);
        if (!Number.isInteger(row) || !Number.isInteger(col)) return String(slot || '—');
        return `Zeile ${row + 1}, Spalte ${col + 1}`;
    }

    function cellForSlot(slot) {
        return document.querySelector(`.lss-ft-cell[data-slot="${CSS.escape(slot)}"]`);
    }

    function cellForVehicle(vehicleId) {
        const placement = getPlacementByVehicleId(vehicleId);
        return placement ? cellForSlot(placement.slot) : null;
    }

    function renderGrid() {
        const grid = document.getElementById('lss-ft-grid');
        if (!grid) return;

        grid.style.gridTemplateColumns = `repeat(${app.settings.cols}, minmax(250px, 1fr))`;
        grid.replaceChildren();

        for (let row = 0; row < app.settings.rows; row++) {
            for (let col = 0; col < app.settings.cols; col++) {
                const slot = slotKey(row, col);
                const cell = document.createElement('div');
                cell.className = 'lss-ft-cell';
                cell.dataset.slot = slot;

                const placement = app.placements.get(slot);
                if (placement) {
                    renderVehicleIntoCell(cell, placement);
                } else {
                    renderEmptyCell(cell);
                }

                bindCellDnD(cell);
                grid.appendChild(cell);
            }
        }

        updateCounter();
    }

    function renderEmptyCell(cell) {
        cell.className = 'lss-ft-cell lss-ft-empty';
        cell.textContent = '+ Fahrzeug';
        cell.onclick = () => openVehicleDialog(cell.dataset.slot);
    }

    function renderVehicleIntoCell(cell, placement) {
        const state = app.states.get(Number(placement.vehicleId)) || null;
        const status = Number(state?.status) || 0;
        const color = STATUS_COLORS[status] || '#657786';
        const mission = state?.missionTitle || (state?.missionUrl ? 'Einsatz wird geladen …' : 'Kein Einsatz');
        const address = state?.address || '—';
        const error = state?.error || '';

        cell.className = 'lss-ft-cell';
        cell.onclick = null;
        cell.innerHTML = `
            <div class="lss-ft-tile" draggable="true" data-vehicle-id="${placement.vehicleId}">
                <div class="lss-ft-statusbox" style="background:${color};color:${statusTextColor(status)}">${status || '?'}</div>
                <div class="lss-ft-details">
                    <div class="lss-ft-vehicle-name" title="${escapeHtml(placement.caption)}">${escapeHtml(placement.caption)}</div>
                    <div class="lss-ft-mission" title="${escapeHtml(mission)}">${escapeHtml(mission)}</div>
                    <div class="lss-ft-address" title="${escapeHtml(address)}">${escapeHtml(address)}</div>
                    ${state?.timerStartAt ? `<div class="lss-ft-time">Einsatzzeit: <span class="lss-ft-elapsed" data-start-at="${state.timerStartAt}">${formatDuration(state.timerStartAt)}</span></div>` : ''}
                    <div class="lss-ft-id">ID ${placement.vehicleId}</div>
                    ${error ? `<div class="lss-ft-error">${escapeHtml(error)}</div>` : ''}
                </div>
                <button class="lss-ft-remove" type="button" title="Fahrzeug aus Kachel entfernen" aria-label="Fahrzeug entfernen">×</button>
            </div>
        `;

        const tile = cell.querySelector('.lss-ft-tile');
        tile.addEventListener('dblclick', (event) => {
            if (event.target.closest('.lss-ft-remove')) return;
            openVehicleDialog(placement.slot);
        });

        tile.querySelector('.lss-ft-remove').addEventListener('click', async (event) => {
            event.stopPropagation();
            await removePlacement(placement.slot);
        });
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function bindCellDnD(cell) {
        cell.addEventListener('dragstart', (event) => {
            const tile = event.target.closest('.lss-ft-tile');
            if (!tile) return;
            app.dragSourceSlot = cell.dataset.slot;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', cell.dataset.slot);
        });

        cell.addEventListener('dragover', (event) => {
            if (!app.dragSourceSlot) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            cell.classList.add('lss-ft-dragover');
        });

        cell.addEventListener('dragleave', () => cell.classList.remove('lss-ft-dragover'));

        cell.addEventListener('drop', async (event) => {
            event.preventDefault();
            cell.classList.remove('lss-ft-dragover');
            const source = app.dragSourceSlot || event.dataTransfer.getData('text/plain');
            const target = cell.dataset.slot;
            app.dragSourceSlot = null;
            if (!source || source === target) return;
            await moveOrSwapPlacements(source, target);
        });

        cell.addEventListener('dragend', () => {
            app.dragSourceSlot = null;
            document.querySelectorAll('.lss-ft-dragover').forEach(el => el.classList.remove('lss-ft-dragover'));
        });
    }

    async function moveOrSwapPlacements(sourceSlot, targetSlot) {
        const source = app.placements.get(sourceSlot);
        if (!source) return;
        const target = app.placements.get(targetSlot);

        await idbDelete(STORE_PLACEMENTS, sourceSlot);
        app.placements.delete(sourceSlot);

        if (target) {
            await idbDelete(STORE_PLACEMENTS, targetSlot);
            const movedTarget = { ...target, slot: sourceSlot };
            await idbPut(STORE_PLACEMENTS, movedTarget);
            app.placements.set(sourceSlot, movedTarget);
        }

        const movedSource = { ...source, slot: targetSlot };
        await idbPut(STORE_PLACEMENTS, movedSource);
        app.placements.set(targetSlot, movedSource);

        renderGrid();
        await notifyPlacementsChanged();
        syncGmListeners();
    }

    async function removePlacement(slot) {
        const placement = app.placements.get(slot);
        if (!placement) return;

        await idbDelete(STORE_PLACEMENTS, slot);
        app.placements.delete(slot);
        renderGrid();
        await notifyPlacementsChanged();
        syncGmListeners();
    }

    function updateCounter() {
        const counter = document.getElementById('lss-ft-counter');
        if (!counter) return;
        counter.textContent = `${app.placements.size} Fahrzeuge · ${app.settings.rows}×${app.settings.cols}`;
    }

    async function resizeGrid(rowDelta, colDelta) {
        const nextRows = Math.max(1, Math.min(MAX_ROWS, app.settings.rows + rowDelta));
        const nextCols = Math.max(1, Math.min(MAX_COLS, app.settings.cols + colDelta));

        if (nextRows === app.settings.rows && nextCols === app.settings.cols) return;

        if (nextRows < app.settings.rows || nextCols < app.settings.cols) {
            for (const placement of app.placements.values()) {
                const [row, col] = placement.slot.split(':').map(Number);
                if (row >= nextRows || col >= nextCols) {
                    setStatusLine('Raster kann nicht verkleinert werden: In der zu entfernenden Zeile/Spalte liegt noch ein Fahrzeug.');
                    return;
                }
            }
        }

        app.settings = { key: SETTINGS_KEY, rows: nextRows, cols: nextCols };
        await idbPut(STORE_SETTINGS, app.settings);
        renderGrid();
        setStatusLine('Raster gespeichert.');
    }

    // Fahrzeugauswahl
    async function loadVehiclesApi() {
        if (app.vehiclesApi) return app.vehiclesApi;
        if (app.vehiclesApiPromise) return app.vehiclesApiPromise;

        app.vehiclesApiPromise = (async () => {
            const data = await fetchJson('/api/vehicles');
            if (!Array.isArray(data)) throw new Error('Die Fahrzeug-API hat kein Array geliefert.');

            app.vehiclesApi = data
                .filter(v => v && Number.isFinite(Number(v.id)))
                .map(v => ({
                    id: Number(v.id),
                    caption: String(v.caption || `Fahrzeug ${v.id}`),
                }))
                .sort((a, b) => a.caption.localeCompare(b.caption, 'de', { numeric: true, sensitivity: 'base' }));

            return app.vehiclesApi;
        })();

        try {
            return await app.vehiclesApiPromise;
        } finally {
            app.vehiclesApiPromise = null;
        }
    }

    async function openVehicleDialog(slot) {
        app.selectedSlot = slot;
        const modal = document.getElementById('lss-ft-modal');
        const search = document.getElementById('lss-ft-search');
        const results = document.getElementById('lss-ft-results');

        modal.hidden = false;
        search.value = '';
        results.innerHTML = '<div class="lss-ft-modal-message">Fahrzeugliste wird geladen …</div>';
        search.focus();

        try {
            await loadVehiclesApi();
            renderVehicleSearchResults('');
        } catch (error) {
            results.innerHTML = `<div class="lss-ft-modal-message">Fahrzeugliste konnte nicht geladen werden: ${escapeHtml(error.message)}</div>`;
        }
    }

    function closeVehicleDialog() {
        document.getElementById('lss-ft-modal').hidden = true;
        app.selectedSlot = null;
    }

    function renderVehicleSearchResults(query) {
        const results = document.getElementById('lss-ft-results');
        if (!app.vehiclesApi) return;

        const raw = query.trim();
        const q = raw.toLocaleLowerCase('de');
        const numeric = /^\d+$/.test(raw) ? Number(raw) : null;

        let matches = app.vehiclesApi;
        if (q) {
            matches = app.vehiclesApi.filter(vehicle =>
                (numeric !== null && String(vehicle.id).includes(raw)) ||
                vehicle.caption.toLocaleLowerCase('de').includes(q)
            );
        }

        matches = matches
            .slice()
            .sort((a, b) => {
                if (numeric !== null) {
                    const aExact = a.id === numeric ? 1 : 0;
                    const bExact = b.id === numeric ? 1 : 0;
                    if (aExact !== bExact) return bExact - aExact;
                }
                const aPrefix = q && a.caption.toLocaleLowerCase('de').startsWith(q) ? 1 : 0;
                const bPrefix = q && b.caption.toLocaleLowerCase('de').startsWith(q) ? 1 : 0;
                if (aPrefix !== bPrefix) return bPrefix - aPrefix;
                return a.caption.localeCompare(b.caption, 'de', { numeric: true, sensitivity: 'base' });
            })
            .slice(0, 100);

        if (!matches.length) {
            results.innerHTML = '<div class="lss-ft-modal-message">Kein Fahrzeug gefunden.</div>';
            return;
        }

        const occupiedByVehicleId = new Map();
        for (const placement of app.placements.values()) {
            occupiedByVehicleId.set(Number(placement.vehicleId), placement);
        }

        results.replaceChildren();
        for (const vehicle of matches) {
            const existingPlacement = occupiedByVehicleId.get(Number(vehicle.id)) || null;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `lss-ft-result${existingPlacement ? ' lss-ft-result-assigned' : ''}`;
            button.dataset.vehicleId = String(vehicle.id);
            button.dataset.assigned = existingPlacement ? 'true' : 'false';
            button.innerHTML = `
                <span class="lss-ft-result-name">${escapeHtml(vehicle.caption)}</span>
                <span class="lss-ft-result-meta">
                    <span class="lss-ft-result-id">ID ${vehicle.id}</span>
                    ${existingPlacement ? `
                        <span class="lss-ft-result-assigned-label" title="Dieses Fahrzeug ist bereits im Tableau">
                            <span class="lss-ft-result-check" aria-hidden="true">✓</span>
                            <span>Bereits belegt</span>
                        </span>
                        <span class="lss-ft-result-position">${escapeHtml(formatSlotPosition(existingPlacement.slot))}</span>
                    ` : ''}
                </span>
            `;
            button.addEventListener('click', () => assignVehicleToSelectedSlot(vehicle));
            results.appendChild(button);
        }
    }

    async function assignVehicleToSelectedSlot(vehicle) {
        const targetSlot = app.selectedSlot;
        if (!targetSlot) return;

        const existing = getPlacementByVehicleId(vehicle.id);
        if (existing && existing.slot !== targetSlot) {
            await idbDelete(STORE_PLACEMENTS, existing.slot);
            app.placements.delete(existing.slot);
        }

        const displaced = app.placements.get(targetSlot);
        if (displaced) {
            await idbDelete(STORE_PLACEMENTS, targetSlot);
            app.placements.delete(targetSlot);
        }

        const placement = { slot: targetSlot, vehicleId: vehicle.id, caption: vehicle.caption };
        await idbPut(STORE_PLACEMENTS, placement);
        app.placements.set(targetSlot, placement);

        closeVehicleDialog();
        renderGrid();
        await notifyPlacementsChanged();
        syncGmListeners();

        refreshSingleVehicle(vehicle.id, { reason: 'assign', animate: false }).catch(error => {
            console.error(error);
            setStatusLine(`Fahrzeug ${vehicle.id}: ${error.message}`);
        });
    }


    function isJourneyEndTransition(oldStatus, newStatus) {
        return Number(oldStatus) === 1 && Number(newStatus) === 2;
    }

    function getTimerAction(oldStatus, newStatus) {
        const from = Number(oldStatus);
        const to = Number(newStatus);

        if ((from === 1 || from === 2) && to === 3) return 'start';
        if ((from === 4 && to === 1) || (from === 1 && to === 2)) return 'clear';
        return 'keep';
    }

    function applyTimerAction(currentStartAt, oldStatus, newStatus, observedAt = Date.now()) {
        const action = getTimerAction(oldStatus, newStatus);
        if (action === 'start') return Number(observedAt) || Date.now();
        if (action === 'clear') return null;
        return currentStartAt || null;
    }

    async function saveVehicleState(state) {
        const normalized = { ...state, vehicleId: Number(state.vehicleId) };
        app.states.set(normalized.vehicleId, normalized);
        await idbPut(STORE_STATES, normalized);
        return normalized;
    }

    function enqueueVehicleUpdate(vehicleId, task) {
        const id = Number(vehicleId);
        const previous = app.updateChains.get(id) || Promise.resolve();
        const next = previous.catch(() => undefined).then(task);
        const tracked = next.finally(() => {
            if (app.updateChains.get(id) === tracked) app.updateChains.delete(id);
        });
        app.updateChains.set(id, tracked);
        return tracked;
    }

    async function flashBeforeRender(vehicleId, newStatus) {
        const cell = cellForVehicle(vehicleId);
        const tile = cell?.querySelector('.lss-ft-tile');
        if (!tile) return;

        tile.style.setProperty('--ft-flash-color', STATUS_COLORS[Number(newStatus)] || '#ffffff');
        tile.classList.remove('lss-ft-flashing');
        void tile.offsetWidth;
        tile.classList.add('lss-ft-flashing');
        await sleep(FLASH_MS);
        tile.classList.remove('lss-ft-flashing');
    }

    function rerenderVehicle(vehicleId) {
        const placement = getPlacementByVehicleId(vehicleId);
        if (!placement) return;
        const cell = cellForSlot(placement.slot);
        if (!cell) return;
        renderVehicleIntoCell(cell, placement);
    }

    async function enrichMission(vehicleId, missionUrl, { force = false } = {}) {
        if (!missionUrl) return;

        try {
            const details = await getMissionDetails(missionUrl, { force });
            const current = app.states.get(Number(vehicleId)) || await idbGet(STORE_STATES, Number(vehicleId));
            if (!current || normalizeUrl(current.missionUrl) !== normalizeUrl(missionUrl)) return;

            const next = {
                ...current,
                missionTitle: details.missionTitle || current.missionTitle || 'Unbekannter Einsatz',
                address: details.address || current.address || '—',
                error: null,
                updatedAt: Date.now(),
            };
            await saveVehicleState(next);
            rerenderVehicle(vehicleId);
        } catch (error) {
            const current = app.states.get(Number(vehicleId));
            if (!current) return;
            const next = { ...current, error: `Einsatzdetails: ${error.message}` };
            await saveVehicleState(next);
            rerenderVehicle(vehicleId);
        }
    }

    async function applyRadioEvent(event) {
        const vehicleId = Number(event.vehicleId);
        if (!getPlacementByVehicleId(vehicleId)) return;

        return enqueueVehicleUpdate(vehicleId, async () => {
            const oldState = app.states.get(vehicleId) || await idbGet(STORE_STATES, vehicleId) || {
                vehicleId,
                status: null,
                missionUrl: null,
                missionTitle: null,
                address: null,
                timerStartAt: null,
            };

            const newStatus = Number(event.status);
            const changed = Number(oldState.status) !== newStatus;
            const missionUrl = event.missionUrl ? normalizeUrl(event.missionUrl) : oldState.missionUrl;
            const observedAt = Number(event.observedAt) || Date.now();

            const nextState = {
                ...oldState,
                vehicleId,
                status: newStatus,
                timerStartAt: changed
                    ? applyTimerAction(oldState.timerStartAt, oldState.status, newStatus, observedAt)
                    : oldState.timerStartAt,
                missionUrl,
                updatedAt: observedAt,
                error: null,
            };

            if (changed && isJourneyEndTransition(oldState.status, newStatus)) {
                nextState.timerStartAt = null;
                nextState.missionUrl = null;
                nextState.missionTitle = null;
                nextState.address = null;
            } else if (!event.missionUrl && (newStatus === 1 || newStatus === 2 || newStatus === 6)) {
                nextState.missionUrl = null;
                nextState.missionTitle = null;
                nextState.address = null;
            } else if (event.missionUrl && normalizeUrl(event.missionUrl) !== normalizeUrl(oldState.missionUrl)) {
                nextState.missionTitle = null;
                nextState.address = null;
            }

            await saveVehicleState(nextState);

            if (changed) {
                await flashBeforeRender(vehicleId, newStatus);
            }

            rerenderVehicle(vehicleId);

            if (nextState.missionUrl &&
                (!nextState.missionTitle || normalizeUrl(nextState.missionUrl) !== normalizeUrl(oldState.missionUrl))) {
                await enrichMission(vehicleId, nextState.missionUrl);
            }
        });
    }

    function markEventDisplayed(vehicleId, event) {
        const current = GM_getValue(eventKey(vehicleId), null);
        if (!current || current.eventId !== event.eventId || current.displayed) return;
        GM_setValue(eventKey(vehicleId), {
            ...current,
            displayed: true,
            displayedAt: Date.now(),
        });
    }

    function handleGmEvent(vehicleId, event) {
        if (!event || event.displayed || Number(event.vehicleId) !== Number(vehicleId)) return;

        applyRadioEvent(event)
            .catch(error => {
                console.error('Funkereignis konnte nicht verarbeitet werden:', error);
                setStatusLine(`Funkereignis ${vehicleId}: ${error.message}`);
            })
            .finally(() => markEventDisplayed(vehicleId, event));
    }

    function syncGmListeners() {
        const assignedIds = new Set(Array.from(app.placements.values()).map(p => Number(p.vehicleId)));

        for (const [vehicleId, listenerId] of app.listeners) {
            if (!assignedIds.has(vehicleId)) {
                GM_removeValueChangeListener(listenerId);
                app.listeners.delete(vehicleId);
            }
        }

        for (const vehicleId of assignedIds) {
            if (app.listeners.has(vehicleId)) continue;

            const listenerId = GM_addValueChangeListener(eventKey(vehicleId), (_key, _oldValue, newValue) => {
                handleGmEvent(vehicleId, newValue);
            });
            app.listeners.set(vehicleId, listenerId);

            const pending = GM_getValue(eventKey(vehicleId), null);
            if (pending && !pending.displayed) handleGmEvent(vehicleId, pending);
        }
    }

    async function refreshSingleVehicle(vehicleId, { reason = 'manual', animate = true } = {}) {
        const id = Number(vehicleId);
        if (!getPlacementByVehicleId(id)) return;

        return enqueueVehicleUpdate(id, async () => {
            const oldState = app.states.get(id) || await idbGet(STORE_STATES, id) || {
                vehicleId: id,
                status: null,
                missionUrl: null,
                missionTitle: null,
                address: null,
                timerStartAt: null,
            };

            try {
                const html = await fetchText(`/vehicles/${id}`);
                const parsed = parseVehiclePage(html);
                const changed = Number(oldState.status) !== Number(parsed.status);
                const missionChanged = normalizeUrl(oldState.missionUrl) !== normalizeUrl(parsed.missionUrl);

                const next = {
                    ...oldState,
                    vehicleId: id,
                    status: parsed.status,
                    missionUrl: parsed.missionUrl,
                    missionTitle: parsed.missionUrl
                        ? (missionChanged ? parsed.missionAnchorText : oldState.missionTitle || parsed.missionAnchorText)
                        : null,
                    address: parsed.missionUrl ? (missionChanged ? null : oldState.address) : null,
                    timerStartAt: changed
                        ? applyTimerAction(oldState.timerStartAt, oldState.status, parsed.status, Date.now())
                        : oldState.timerStartAt,
                    updatedAt: Date.now(),
                    error: null,
                };

                if (changed && isJourneyEndTransition(oldState.status, parsed.status)) {
                    next.timerStartAt = null;
                    next.missionUrl = null;
                    next.missionTitle = null;
                    next.address = null;
                }

                await saveVehicleState(next);

                if (changed && animate) {
                    await flashBeforeRender(id, parsed.status);
                }

                rerenderVehicle(id);

                if (parsed.missionUrl) {
                    await enrichMission(id, parsed.missionUrl, { force: reason === 'manual' });
                }
            } catch (error) {
                const next = {
                    ...oldState,
                    vehicleId: id,
                    error: error.message,
                    updatedAt: Date.now(),
                };
                await saveVehicleState(next);
                rerenderVehicle(id);
                throw error;
            }
        });
    }

    async function refreshAllVehicles({ reason = 'manual', animate = true } = {}) {
        if (app.refreshRunning) return;
        app.refreshRunning = true;

        const button = document.querySelector('[data-action="refresh"]');
        if (button) button.disabled = true;

        const ids = Array.from(new Set(Array.from(app.placements.values()).map(p => Number(p.vehicleId))));
        let ok = 0;
        let failed = 0;

        try {
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                setStatusLine(`Prüfe ${i + 1}/${ids.length}: Fahrzeug ${id} …`);
                try {
                    await refreshSingleVehicle(id, { reason, animate });
                    ok++;
                } catch (error) {
                    failed++;
                    console.error(`Fahrzeug ${id}:`, error);
                }
            }

            if (ids.length === 0) {
                setStatusLine('Keine Fahrzeuge belegt.');
            } else {
                setStatusLine(`Prüfung abgeschlossen: ${ok} erfolgreich${failed ? `, ${failed} Fehler` : ''}.`);
            }
        } finally {
            app.refreshRunning = false;
            if (button) button.disabled = false;
        }
    }

    function bindUiEvents() {
        document.querySelector('[data-action="row-add"]').addEventListener('click', () => resizeGrid(1, 0));
        document.querySelector('[data-action="row-remove"]').addEventListener('click', () => resizeGrid(-1, 0));
        document.querySelector('[data-action="col-add"]').addEventListener('click', () => resizeGrid(0, 1));
        document.querySelector('[data-action="col-remove"]').addEventListener('click', () => resizeGrid(0, -1));
        document.querySelector('[data-action="refresh"]').addEventListener('click', () => refreshAllVehicles({ reason: 'manual', animate: true }));
        document.querySelector('[data-action="export"]').addEventListener('click', exportConfiguration);
        document.querySelector('[data-action="import"]').addEventListener('click', () => document.getElementById('lss-ft-import-file').click());
        document.querySelector('[data-action="toolbar-autohide"]').addEventListener('click', () => toggleToolbarAutoHide().catch(console.error));
        document.querySelector('[data-action="modal-close"]').addEventListener('click', closeVehicleDialog);

        const importInput = document.getElementById('lss-ft-import-file');
        importInput.addEventListener('change', async () => {
            const file = importInput.files?.[0];
            importInput.value = '';
            if (!file) return;

            try {
                await importConfigurationFile(file);
            } catch (error) {
                console.error('Konfigurationsimport fehlgeschlagen:', error);
                setStatusLine(`Import fehlgeschlagen: ${error.message}`);
                alert(`Import fehlgeschlagen:
${error.message}`);
            }
        });

        const modal = document.getElementById('lss-ft-modal');
        modal.addEventListener('mousedown', (event) => {
            if (event.target === modal) closeVehicleDialog();
        });

        document.getElementById('lss-ft-search').addEventListener('input', (event) => {
            renderVehicleSearchResults(event.target.value);
        });

        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !modal.hidden) closeVehicleDialog();
        });
    }

    function startElapsedTimer() {
        setInterval(() => {
            document.querySelectorAll('.lss-ft-elapsed').forEach(el => {
                const startAt = Number(el.dataset.startAt) || null;
                el.textContent = formatDuration(startAt);
            });
        }, 1000);
    }

    async function initTableau() {
        injectStyles();
        buildAppShell();
        bindUiEvents();

        [app.settings, app.uiSettings] = await Promise.all([
            getGridSettings(),
            getUiSettings(),
        ]);
        applyToolbarAutoHide();

        const [placements, states] = await Promise.all([
            idbGetAll(STORE_PLACEMENTS),
            idbGetAll(STORE_STATES),
        ]);

        app.placements = new Map(placements.map(p => [p.slot, p]));
        app.states = new Map(states.map(s => [Number(s.vehicleId), s]));

        await loadTrackedVehicleIds();
        renderGrid();
        syncGmListeners();
        startEmbeddedRadioMonitor();
        startElapsedTimer();

        refreshAllVehicles({ reason: 'initial', animate: false }).catch(error => {
            console.error(error);
            setStatusLine(`Initiale Prüfung fehlgeschlagen: ${error.message}`);
        });
    }

    initTableau().catch(error => {
        console.error('Fahrzeugtableau konnte nicht initialisiert werden:', error);
        document.body.innerHTML = `<pre style="padding:20px;color:#fff;background:#111;min-height:100vh">Fahrzeugtableau konnte nicht initialisiert werden:\n${escapeHtml(error.stack || error.message)}</pre>`;
    });
})();
