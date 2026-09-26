// ==UserScript==
// @name         LSS Code Lesezeichnen
// @namespace    https://www.leitstellenspiel.de/
// @version      1.1.0
// @description  Speichert und führt Codeschnipsel und URL Anfragen mit json Antwort aus.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/
// @resource     icon https://github.com/Sobol0202/LSS-Scripte/raw/main/LSS%20Code%20Lesezeichen/icon-Code.png
// @grant        GM_getResourceURL
// @grant        GM_xmlhttpRequest
// @connect      *
// @run-at       document-idle
// ==/UserScript==

(() => {
    'use strict';

    const DB_NAME = 'lss-code-queries';
    const DB_VERSION = 1;
    const STORE_NAME = 'queries';
    const MODAL_ID = 'lss-code-query-modal';
    const STYLE_ID = 'lss-code-query-style';

    let dbPromise;
    let modalRoot = null;
    let selectedId = null;
    let listSearch = '';
    let listSort = 'name-asc';


    function openDB() {
        if (dbPromise) return dbPromise;

        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            request.onblocked = () => reject(new Error('IndexedDB ist blockiert. Bitte andere Leitstellenspiel-Tabs schließen und erneut versuchen.'));
        });

        return dbPromise;
    }

    async function dbGetAll() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }

    async function dbGet(id) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).get(Number(id));
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function dbPut(record) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const req = tx.objectStore(STORE_NAME).put(record);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function dbDelete(id) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const req = tx.objectStore(STORE_NAME).delete(Number(id));
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    async function dbClear() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const req = tx.objectStore(STORE_NAME).clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
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

    function formatJson(value) {
        if (typeof value === 'string') {
            try {
                return JSON.stringify(JSON.parse(value), null, 2);
            } catch {
                return value;
            }
        }

        try {
            return JSON.stringify(value, null, 2);
        } catch (error) {
            return JSON.stringify({
                error: 'Ergebnis konnte nicht als JSON serialisiert werden.',
                message: error?.message || String(error),
            }, null, 2);
        }
    }

    async function normalizeResult(value) {
        if (value instanceof Response) {
            const contentType = value.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                return await value.json();
            }

            const text = await value.text();
            try {
                return JSON.parse(text);
            } catch {
                return {
                    status: value.status,
                    statusText: value.statusText,
                    body: text,
                };
            }
        }

        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }

        return value;
    }

    function openResultTab(title = 'Code-Abfrage') {
        const tab = window.open('', '_blank');
        if (!tab) {
            throw new Error('Der Ergebnis-Tab wurde vom Browser blockiert. Pop-ups für leitstellenspiel.de müssen erlaubt sein.');
        }

        tab.document.open();
        tab.document.write(`<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
    :root { color-scheme: light dark; }
    body { margin: 0; padding: 20px; font: 14px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
    h1 { margin: 0; font: 600 18px/1.2 system-ui, sans-serif; }
    .header-actions { display: flex; align-items: center; gap: 10px; }
    .status { opacity: .7; font-family: system-ui, sans-serif; }
    button { border: 1px solid #8887; border-radius: 6px; padding: 7px 11px; cursor: pointer; font: 600 13px/1.2 system-ui, sans-serif; background: #8882; color: inherit; }
    button:hover { background: #8883; }
    button:disabled { opacity: .55; cursor: default; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; margin: 0; padding: 16px; border: 1px solid #8885; border-radius: 8px; background: #8881; }
</style>
</head>
<body>
<header>
    <h1>${escapeHtml(title)}</h1>
    <div class="header-actions">
        <span class="status" id="status">Abfrage läuft …</span>
        <button type="button" id="copy-result" disabled>In Zwischenablage kopieren</button>
    </div>
</header>
<pre id="result">Bitte warten …</pre>
<script>
(() => {
    const button = document.getElementById('copy-result');
    const result = document.getElementById('result');
    button.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(result.textContent || '');
            const oldText = button.textContent;
            button.textContent = 'Kopiert';
            setTimeout(() => { button.textContent = oldText; }, 1500);
        } catch (error) {
            const range = document.createRange();
            range.selectNodeContents(result);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            try {
                document.execCommand('copy');
                button.textContent = 'Kopiert';
                setTimeout(() => { button.textContent = 'In Zwischenablage kopieren'; }, 1500);
            } finally {
                selection.removeAllRanges();
            }
        }
    });
})();
<\/script>
</body>
</html>`);
        tab.document.close();

        return {
            show(value, ok = true) {
                const status = tab.document.getElementById('status');
                const pre = tab.document.getElementById('result');
                if (status) status.textContent = ok ? 'Fertig' : 'Fehler';
                if (pre) pre.textContent = formatJson(value);
                const copyButton = tab.document.getElementById('copy-result');
                if (copyButton) copyButton.disabled = false;
                tab.document.title = `${ok ? '' : 'Fehler - '}${title}`;
            },
            close() {
                try { tab.close(); } catch { /* ignore */ }
            },
        };
    }

    function parseHeaders(text) {
        const trimmed = (text || '').trim();
        if (!trimmed) return {};

        const value = JSON.parse(trimmed);
        if (!value || Array.isArray(value) || typeof value !== 'object') {
            throw new Error('Header müssen ein JSON-Objekt sein.');
        }
        return value;
    }

    function resolveUrl(url) {
        return new URL(url, location.origin).href;
    }

    function headersToObject(headersInit) {
        if (!headersInit) return {};
        const headers = new Headers(headersInit);
        return Object.fromEntries(headers.entries());
    }

    function parseRawResponseHeaders(raw = '') {
        const headers = new Headers();
        for (const line of raw.split(/\r?\n/)) {
            const idx = line.indexOf(':');
            if (idx <= 0) continue;
            const name = line.slice(0, idx).trim();
            const value = line.slice(idx + 1).trim();
            if (name) headers.append(name, value);
        }
        return headers;
    }

    function gmFetch(input, init = {}) {
        const url = resolveUrl(typeof input === 'string' || input instanceof URL ? String(input) : input.url);
        const method = String(init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
        const headers = headersToObject(init.headers || (input instanceof Request ? input.headers : undefined));
        const body = init.body ?? undefined;

        return new Promise((resolve, reject) => {
            const request = GM_xmlhttpRequest({
                method,
                url,
                headers,
                data: body,
                responseType: 'text',
                anonymous: false,
                onload: response => {
                    const responseHeaders = parseRawResponseHeaders(response.responseHeaders || '');
                    const result = new Response(response.responseText ?? '', {
                        status: response.status,
                        statusText: response.statusText || '',
                        headers: responseHeaders,
                    });
                    try {
                        Object.defineProperty(result, 'url', {
                            value: response.finalUrl || url,
                            configurable: true,
                        });
                    } catch { /* optional */ }
                    resolve(result);
                },
                onerror: () => reject(new TypeError(`Netzwerkfehler beim Abruf von ${url}`)),
                ontimeout: () => reject(new TypeError(`Zeitüberschreitung beim Abruf von ${url}`)),
                onabort: () => reject(new DOMException('Abfrage abgebrochen', 'AbortError')),
            });

            if (init.signal) {
                if (init.signal.aborted) {
                    request.abort();
                    return;
                }
                init.signal.addEventListener('abort', () => request.abort(), { once: true });
            }
        });
    }

    function smartFetch(input, init = {}) {
        const url = resolveUrl(typeof input === 'string' || input instanceof URL ? String(input) : input.url);
        const targetOrigin = new URL(url).origin;

        if (targetOrigin === location.origin) {
            return fetch(url, {
                credentials: 'include',
                ...init,
            });
        }

        return gmFetch(url, init);
    }

    async function executeUrlQuery(query) {
        const method = (query.method || 'GET').toUpperCase();
        const headers = parseHeaders(query.headers || '');
        const options = {
            method,
            headers,
            credentials: 'include',
        };

        if (!['GET', 'HEAD'].includes(method) && query.body) {
            options.body = query.body;
        }

        const response = await smartFetch(resolveUrl(query.url), options);
        const contentType = response.headers.get('content-type') || '';
        const text = await response.text();

        let body = text;
        if (contentType.includes('application/json')) {
            try { body = JSON.parse(text); } catch { /* keep text */ }
        } else {
            try { body = JSON.parse(text); } catch { /* keep text */ }
        }

        if (!response.ok) {
            return {
                ok: false,
                status: response.status,
                statusText: response.statusText,
                url: response.url,
                body,
            };
        }

        return body;
    }

    async function executeCodeQuery(query) {
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
        const code = String(query.code || '').trim();
        const consoleOutput = [];

        const ctx = Object.freeze({
            fetch: (input, init = {}) => smartFetch(input, init),
            origin: location.origin,
            href: location.href,
            pathname: location.pathname,
            resolveUrl,
        });

        const queryConsole = Object.create(null);
        for (const method of ['log', 'info', 'warn', 'error', 'debug']) {
            queryConsole[method] = (...args) => {
                consoleOutput.push({ method, args });
                return undefined;
            };
        }

        let fn;
        let expressionMode = false;
        let awaitedTrailingCall = false;

        const expressionCode = code.replace(/;\s*$/, '');
        try {
            fn = new AsyncFunction(
                'ctx',
                'console',
                `"use strict";\nreturn await (\n${expressionCode}\n);`,
            );
            expressionMode = true;
        } catch (error) {
            if (!(error instanceof SyntaxError)) throw error;

            const trailingCallPattern = /(^|\n)([ \t]*)([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\s*\([^;\n]*\))\s*;\s*$/;
            const awaitedCode = code.replace(
                trailingCallPattern,
                (_match, prefix, indent, call) => `${prefix}${indent}return await (${call});`,
            );

            if (awaitedCode !== code) {
                try {
                    fn = new AsyncFunction(
                        'ctx',
                        'console',
                        `"use strict";\n${awaitedCode}`,
                    );
                    awaitedTrailingCall = true;
                } catch (awaitError) {
                    if (!(awaitError instanceof SyntaxError)) throw awaitError;
                }
            }

            if (!fn) {
                fn = new AsyncFunction(
                    'ctx',
                    'console',
                    `"use strict";\n${code}`,
                );
            }
        }

        const result = await fn(ctx, queryConsole);

        if (result !== undefined) {
            return normalizeResult(result);
        }

        if (consoleOutput.length) {

            if (consoleOutput.length === 1) {
                const only = consoleOutput[0];
                const value = only.args.length <= 1 ? only.args[0] : only.args;
                return normalizeResult(value);
            }

            return normalizeResult({
                console: consoleOutput.map(entry => ({
                    method: entry.method,
                    value: entry.args.length <= 1 ? entry.args[0] : entry.args,
                })),
            });
        }

        return {
            result: null,
            message: expressionMode
                ? 'Die Abfrage wurde ausgeführt, hat aber keinen Wert zurückgegeben.'
                : awaitedTrailingCall
                    ? 'Der asynchrone Funktionsaufruf wurde vollständig abgewartet, hat aber weder einen Wert zurückgegeben noch etwas auf console ausgegeben.'
                    : 'Die Abfrage wurde ausgeführt. Verwende return <Wert>, await <Promise> oder console.log(<Wert>), damit ein Ergebnis angezeigt werden kann.',
        };
    }

    async function runQuery(query) {
        const resultTab = openResultTab(query.name || 'Code-Abfrage');

        try {
            let result;
            if (query.type === 'url') {
                result = await executeUrlQuery(query);
            } else if (query.type === 'code') {
                result = await executeCodeQuery(query);
            } else {
                throw new Error(`Unbekannter Abfragetyp: ${query.type}`);
            }

            resultTab.show(await normalizeResult(result), true);
        } catch (error) {
            resultTab.show({
                error: error?.name || 'Error',
                message: error?.message || String(error),
                stack: error?.stack || undefined,
            }, false);
        }
    }

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
#${MODAL_ID} {
    position: fixed;
    inset: 0;
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(0,0,0,.56);
}
#${MODAL_ID}[hidden] { display: none !important; }
#${MODAL_ID} * { box-sizing: border-box; }
#${MODAL_ID} .cq-dialog {
    width: min(1050px, 96vw);
    max-height: 92vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #fff;
    color: #222;
    border-radius: 8px;
    box-shadow: 0 16px 60px rgba(0,0,0,.35);
    font: 14px/1.4 Arial, sans-serif;
}
#${MODAL_ID} .cq-header,
#${MODAL_ID} .cq-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid #ddd;
}
#${MODAL_ID} .cq-footer {
    border-top: 1px solid #ddd;
    border-bottom: 0;
}
#${MODAL_ID} .cq-header h2 { margin: 0; font-size: 20px; }
#${MODAL_ID} .cq-body {
    display: grid;
    grid-template-columns: minmax(290px, 38%) 1fr;
    min-height: 0;
    overflow: hidden;
}
#${MODAL_ID} .cq-list-pane {
    padding: 14px;
    border-right: 1px solid #ddd;
    overflow: auto;
}
#${MODAL_ID} .cq-editor-pane {
    padding: 14px;
    overflow: auto;
}
#${MODAL_ID} .cq-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
}
#${MODAL_ID} .cq-list-controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 170px;
    gap: 8px;
    margin-bottom: 12px;
}
#${MODAL_ID} .cq-list-controls input,
#${MODAL_ID} .cq-list-controls select {
    width: 100%;
}
#${MODAL_ID} .cq-list-count {
    margin: -4px 0 10px;
    color: #777;
    font-size: 12px;
}
#${MODAL_ID} button,
#${MODAL_ID} .cq-file-label {
    border: 1px solid #bbb;
    background: #f7f7f7;
    color: #222;
    border-radius: 4px;
    padding: 7px 10px;
    cursor: pointer;
    font: inherit;
}
#${MODAL_ID} button:hover,
#${MODAL_ID} .cq-file-label:hover { background: #eee; }
#${MODAL_ID} button.cq-primary { background: #337ab7; border-color: #2e6da4; color: white; }
#${MODAL_ID} button.cq-danger { background: #d9534f; border-color: #d43f3a; color: white; }
#${MODAL_ID} button:disabled { opacity: .5; cursor: not-allowed; }
#${MODAL_ID} .cq-query-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
#${MODAL_ID} .cq-query-item {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: center;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: #fafafa;
}
#${MODAL_ID} .cq-query-item.cq-active { border-color: #337ab7; box-shadow: 0 0 0 1px #337ab7 inset; }
#${MODAL_ID} .cq-query-main { min-width: 0; cursor: pointer; }
#${MODAL_ID} .cq-query-name { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${MODAL_ID} .cq-query-meta { margin-top: 3px; color: #777; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${MODAL_ID} .cq-query-actions { display: flex; gap: 5px; }
#${MODAL_ID} .cq-query-actions button { padding: 5px 7px; }
#${MODAL_ID} .cq-field { margin-bottom: 12px; }
#${MODAL_ID} label { display: block; margin-bottom: 5px; font-weight: 700; }
#${MODAL_ID} input[type="text"],
#${MODAL_ID} select,
#${MODAL_ID} textarea {
    width: 100%;
    padding: 8px 9px;
    border: 1px solid #bbb;
    border-radius: 4px;
    background: #fff;
    color: #222;
    font: inherit;
}
#${MODAL_ID} textarea { min-height: 100px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
#${MODAL_ID} #cq-code { min-height: 260px; }
#${MODAL_ID} .cq-grid-2 { display: grid; grid-template-columns: 150px 1fr; gap: 10px; }
#${MODAL_ID} .cq-hint { margin-top: 5px; color: #777; font-size: 12px; }
#${MODAL_ID} .cq-empty { padding: 20px 8px; text-align: center; color: #777; }
#${MODAL_ID} .cq-message { flex: 1; min-height: 20px; color: #555; }
#${MODAL_ID} .cq-message.cq-error { color: #b52b27; }
#${MODAL_ID} .cq-type-section[hidden] { display: none !important; }
#${MODAL_ID} .cq-close { font-size: 20px; line-height: 1; padding: 4px 9px; }
@media (max-width: 760px) {
    #${MODAL_ID} { padding: 8px; }
    #${MODAL_ID} .cq-dialog { max-height: 96vh; }
    #${MODAL_ID} .cq-body { display: block; overflow: auto; }
    #${MODAL_ID} .cq-list-pane { border-right: 0; border-bottom: 1px solid #ddd; max-height: 38vh; }
    #${MODAL_ID} .cq-editor-pane { overflow: visible; }
    #${MODAL_ID} .cq-grid-2 { grid-template-columns: 1fr; }
    #${MODAL_ID} .cq-list-controls { grid-template-columns: 1fr; }
}
`;
        document.head.append(style);
    }

    function createModal() {
        injectStyles();

        if (modalRoot) {
            modalRoot.hidden = false;
            renderList();
            return;
        }

        modalRoot = document.createElement('div');
        modalRoot.id = MODAL_ID;
        modalRoot.innerHTML = `
<div class="cq-dialog" role="dialog" aria-modal="true" aria-labelledby="cq-title">
    <div class="cq-header">
        <h2 id="cq-title">Code-Abfragen</h2>
        <button type="button" class="cq-close" id="cq-close" title="Schließen">×</button>
    </div>

    <div class="cq-body">
        <section class="cq-list-pane">
            <div class="cq-toolbar">
                <button type="button" class="cq-primary" id="cq-new">+ Neue Abfrage</button>
                <button type="button" id="cq-export">Export</button>
                <label class="cq-file-label" for="cq-import-file">Import</label>
                <input type="file" id="cq-import-file" accept="application/json,.json" hidden>
            </div>
            <div class="cq-list-controls">
                <input type="search" id="cq-search" placeholder="Abfragen durchsuchen …" autocomplete="off">
                <select id="cq-sort" title="Sortierung">
                    <option value="name-asc">Name A–Z</option>
                    <option value="name-desc">Name Z–A</option>
                    <option value="updated-desc">Zuletzt geändert</option>
                    <option value="updated-asc">Älteste Änderung</option>
                    <option value="created-desc">Zuletzt erstellt</option>
                    <option value="type-asc">Typ</option>
                </select>
            </div>
            <div class="cq-list-count" id="cq-list-count"></div>
            <div class="cq-query-list" id="cq-query-list"></div>
        </section>

        <section class="cq-editor-pane">
            <form id="cq-form">
                <div class="cq-field">
                    <label for="cq-name">Name</label>
                    <input type="text" id="cq-name" required placeholder="z. B. Einsatzdaten laden">
                </div>

                <div class="cq-field cq-grid-2">
                    <div>
                        <label for="cq-type">Typ</label>
                        <select id="cq-type">
                            <option value="url">URL</option>
                            <option value="code">JavaScript-Code</option>
                        </select>
                    </div>
                    <div>
                        <label for="cq-description">Beschreibung</label>
                        <input type="text" id="cq-description" placeholder="optional">
                    </div>
                </div>

                <div class="cq-type-section" id="cq-url-section">
                    <div class="cq-field">
                        <label for="cq-url">URL</label>
                        <input type="text" id="cq-url" placeholder="/api/… oder https://www.leitstellenspiel.de/…">
                        <div class="cq-hint">Relative URLs werden gegen https://www.leitstellenspiel.de aufgelöst.</div>
                    </div>

                    <div class="cq-field cq-grid-2">
                        <div>
                            <label for="cq-method">Methode</label>
                            <select id="cq-method">
                                <option>GET</option>
                                <option>POST</option>
                                <option>PUT</option>
                                <option>PATCH</option>
                                <option>DELETE</option>
                                <option>HEAD</option>
                            </select>
                        </div>
                        <div>
                            <label for="cq-headers">Header als JSON</label>
                            <textarea id="cq-headers" rows="3" placeholder='{"Accept":"application/json"}'></textarea>
                        </div>
                    </div>

                    <div class="cq-field" id="cq-body-field">
                        <label for="cq-body">Request-Body</label>
                        <textarea id="cq-body" rows="5" placeholder='{"foo":"bar"}'></textarea>
                    </div>
                </div>

                <div class="cq-type-section" id="cq-code-section" hidden>
                    <div class="cq-field">
                        <label for="cq-code">JavaScript-Code</label>
                        <textarea id="cq-code" spellcheck="false" placeholder="const r = await ctx.fetch('/api/...');\nreturn await r.json();"></textarea>
                        <div class="cq-hint">
                            Der Code läuft als async-Funktion. Verfügbar: <code>ctx.fetch</code>, <code>ctx.origin</code>,
                            <code>ctx.href</code>, <code>ctx.pathname</code>, <code>ctx.resolveUrl</code>. Das Ergebnis kann mit <code>return</code> zurückgegeben werden. Reine Promise-Ausdrücke und <code>console.log(...)</code> werden ebenfalls als Ergebnis erkannt.
                        </div>
                    </div>
                </div>

                <div class="cq-toolbar">
                    <button type="submit" class="cq-primary">Speichern</button>
                    <button type="button" id="cq-run-editor">Ausführen</button>
                    <button type="button" class="cq-danger" id="cq-delete" disabled>Löschen</button>
                </div>
            </form>
        </section>
    </div>

    <div class="cq-footer">
        <div class="cq-message" id="cq-message"></div>
        <button type="button" id="cq-close-footer">Schließen</button>
    </div>
</div>`;

        document.body.append(modalRoot);
        bindModalEvents();
        clearEditor();
        renderList();
    }

    function closeModal() {
        if (modalRoot) modalRoot.hidden = true;
    }

    function setMessage(message = '', isError = false) {
        const el = modalRoot?.querySelector('#cq-message');
        if (!el) return;
        el.textContent = message;
        el.classList.toggle('cq-error', Boolean(isError));
    }

    function updateTypeUI() {
        if (!modalRoot) return;
        const type = modalRoot.querySelector('#cq-type').value;
        modalRoot.querySelector('#cq-url-section').hidden = type !== 'url';
        modalRoot.querySelector('#cq-code-section').hidden = type !== 'code';
        updateBodyVisibility();
    }

    function updateBodyVisibility() {
        if (!modalRoot) return;
        const method = modalRoot.querySelector('#cq-method').value.toUpperCase();
        modalRoot.querySelector('#cq-body-field').hidden = ['GET', 'HEAD'].includes(method);
    }

    function getEditorRecord() {
        const name = modalRoot.querySelector('#cq-name').value.trim();
        const type = modalRoot.querySelector('#cq-type').value;

        if (!name) throw new Error('Bitte einen Namen angeben.');

        const base = {
            ...(selectedId ? { id: Number(selectedId) } : {}),
            name,
            type,
            description: modalRoot.querySelector('#cq-description').value.trim(),
            updatedAt: new Date().toISOString(),
        };

        if (type === 'url') {
            const url = modalRoot.querySelector('#cq-url').value.trim();
            if (!url) throw new Error('Bitte eine URL angeben.');

            const headers = modalRoot.querySelector('#cq-headers').value.trim();
            if (headers) parseHeaders(headers);

            return {
                ...base,
                url,
                method: modalRoot.querySelector('#cq-method').value.toUpperCase(),
                headers,
                body: modalRoot.querySelector('#cq-body').value,
                code: '',
            };
        }

        const code = modalRoot.querySelector('#cq-code').value;
        if (!code.trim()) throw new Error('Bitte JavaScript-Code angeben.');

        return {
            ...base,
            code,
            url: '',
            method: 'GET',
            headers: '',
            body: '',
        };
    }

    function clearEditor() {
        if (!modalRoot) return;
        selectedId = null;
        modalRoot.querySelector('#cq-form').reset();
        modalRoot.querySelector('#cq-type').value = 'url';
        modalRoot.querySelector('#cq-method').value = 'GET';
        modalRoot.querySelector('#cq-delete').disabled = true;
        updateTypeUI();
        setMessage('Neue Abfrage');
        renderList();
    }

    async function loadIntoEditor(id) {
        try {
            const query = await dbGet(id);
            if (!query) throw new Error('Abfrage wurde nicht gefunden.');

            selectedId = Number(id);
            modalRoot.querySelector('#cq-name').value = query.name || '';
            modalRoot.querySelector('#cq-type').value = query.type || 'url';
            modalRoot.querySelector('#cq-description').value = query.description || '';
            modalRoot.querySelector('#cq-url').value = query.url || '';
            modalRoot.querySelector('#cq-method').value = query.method || 'GET';
            modalRoot.querySelector('#cq-headers').value = query.headers || '';
            modalRoot.querySelector('#cq-body').value = query.body || '';
            modalRoot.querySelector('#cq-code').value = query.code || '';
            modalRoot.querySelector('#cq-delete').disabled = false;
            updateTypeUI();
            setMessage(`Bearbeiten: ${query.name}`);
            renderList();
        } catch (error) {
            setMessage(error.message || String(error), true);
        }
    }

    async function renderList() {
        if (!modalRoot) return;
        const list = modalRoot.querySelector('#cq-query-list');
        list.innerHTML = '<div class="cq-empty">Lade …</div>';

        try {
            const allQueries = await dbGetAll();
            const search = listSearch.trim().toLocaleLowerCase('de');
            const queries = allQueries.filter(query => {
                if (!search) return true;
                const haystack = [
                    query.name,
                    query.description,
                    query.type,
                    query.method,
                    query.url,
                    query.code,
                ].filter(Boolean).join('\n').toLocaleLowerCase('de');
                return haystack.includes(search);
            });

            const compareText = (a, b) => String(a || '').localeCompare(String(b || ''), 'de', { sensitivity: 'base' });
            const compareDate = (a, b) => new Date(a || 0).getTime() - new Date(b || 0).getTime();

            queries.sort((a, b) => {
                switch (listSort) {
                    case 'name-desc': return compareText(b.name, a.name);
                    case 'updated-desc': return compareDate(b.updatedAt, a.updatedAt) || compareText(a.name, b.name);
                    case 'updated-asc': return compareDate(a.updatedAt, b.updatedAt) || compareText(a.name, b.name);
                    case 'created-desc': return compareDate(b.createdAt, a.createdAt) || compareText(a.name, b.name);
                    case 'type-asc': return compareText(a.type, b.type) || compareText(a.name, b.name);
                    case 'name-asc':
                    default: return compareText(a.name, b.name);
                }
            });

            const count = modalRoot.querySelector('#cq-list-count');
            if (count) {
                count.textContent = search
                    ? `${queries.length} von ${allQueries.length} Abfrage(n)`
                    : `${allQueries.length} Abfrage(n)`;
            }

            if (!allQueries.length) {
                list.innerHTML = '<div class="cq-empty">Noch keine Abfragen gespeichert.</div>';
                return;
            }

            if (!queries.length) {
                list.innerHTML = '<div class="cq-empty">Keine Abfrage passt zur Suche.</div>';
                return;
            }

            list.innerHTML = '';
            for (const query of queries) {
                const item = document.createElement('div');
                item.className = `cq-query-item${Number(selectedId) === Number(query.id) ? ' cq-active' : ''}`;

                const meta = query.type === 'url'
                    ? `${query.method || 'GET'} · ${query.url || ''}`
                    : 'JavaScript-Code';

                item.innerHTML = `
<div class="cq-query-main" title="Zum Bearbeiten anklicken">
    <div class="cq-query-name">${escapeHtml(query.name)}</div>
    <div class="cq-query-meta">${escapeHtml(meta)}</div>
</div>
<div class="cq-query-actions">
    <button type="button" class="cq-run" title="Ausführen">▶</button>
    <button type="button" class="cq-edit" title="Bearbeiten">✎</button>
    <button type="button" class="cq-delete-one" title="Löschen">🗑</button>
</div>`;

                item.querySelector('.cq-query-main').addEventListener('click', () => loadIntoEditor(query.id));
                item.querySelector('.cq-edit').addEventListener('click', () => loadIntoEditor(query.id));
                item.querySelector('.cq-run').addEventListener('click', () => runQuery(query));
                item.querySelector('.cq-delete-one').addEventListener('click', () => deleteQuery(query));
                list.append(item);
            }
        } catch (error) {
            list.innerHTML = `<div class="cq-empty">${escapeHtml(error.message || String(error))}</div>`;
        }
    }

    async function saveEditor() {
        try {
            const record = getEditorRecord();
            const existing = record.id ? await dbGet(record.id) : null;
            record.createdAt = existing?.createdAt || new Date().toISOString();
            const id = await dbPut(record);
            selectedId = Number(id);
            modalRoot.querySelector('#cq-delete').disabled = false;
            setMessage(`Gespeichert: ${record.name}`);
            await renderList();
        } catch (error) {
            setMessage(error.message || String(error), true);
        }
    }

    async function deleteQuery(queryOrId) {
        const query = typeof queryOrId === 'object' ? queryOrId : await dbGet(queryOrId);
        if (!query) return;

        if (!confirm(`Abfrage „${query.name}“ wirklich löschen?`)) return;

        try {
            await dbDelete(query.id);
            if (Number(selectedId) === Number(query.id)) clearEditor();
            setMessage(`Gelöscht: ${query.name}`);
            await renderList();
        } catch (error) {
            setMessage(error.message || String(error), true);
        }
    }

    async function exportQueries() {
        try {
            const queries = await dbGetAll();
            const payload = {
                format: 'lss-code-queries',
                version: 1,
                exportedAt: new Date().toISOString(),
                queries: queries.map(({ id, ...query }) => query),
            };

            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `leitstellenspiel-code-abfragen-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.append(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setMessage(`${queries.length} Abfrage(n) exportiert.`);
        } catch (error) {
            setMessage(error.message || String(error), true);
        }
    }

    function validateImportedQuery(query, index) {
        if (!query || typeof query !== 'object') throw new Error(`Eintrag ${index + 1}: ungültiges Objekt.`);
        if (!query.name || typeof query.name !== 'string') throw new Error(`Eintrag ${index + 1}: Name fehlt.`);
        if (!['url', 'code'].includes(query.type)) throw new Error(`Eintrag ${index + 1}: Typ muss „url“ oder „code“ sein.`);
        if (query.type === 'url' && !query.url) throw new Error(`Eintrag ${index + 1}: URL fehlt.`);
        if (query.type === 'code' && !query.code) throw new Error(`Eintrag ${index + 1}: Code fehlt.`);

        const clean = {
            name: query.name,
            type: query.type,
            description: typeof query.description === 'string' ? query.description : '',
            url: typeof query.url === 'string' ? query.url : '',
            method: typeof query.method === 'string' ? query.method.toUpperCase() : 'GET',
            headers: typeof query.headers === 'string' ? query.headers : '',
            body: typeof query.body === 'string' ? query.body : '',
            code: typeof query.code === 'string' ? query.code : '',
            createdAt: typeof query.createdAt === 'string' ? query.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (clean.headers) parseHeaders(clean.headers);
        return clean;
    }

    async function importQueries(file) {
        if (!file) return;

        try {
            const data = JSON.parse(await file.text());
            const rawQueries = Array.isArray(data) ? data : data?.queries;
            if (!Array.isArray(rawQueries)) {
                throw new Error('Importdatei enthält kein gültiges queries-Array.');
            }

            const queries = rawQueries.map(validateImportedQuery);
            const replace = confirm(
                `${queries.length} Abfrage(n) gefunden.\n\n` +
                'OK = vorhandene Abfragen ersetzen\nAbbrechen = zu vorhandenen Abfragen hinzufügen'
            );

            if (replace) await dbClear();
            for (const query of queries) await dbPut(query);

            clearEditor();
            setMessage(`${queries.length} Abfrage(n) importiert${replace ? ' (Bestand ersetzt)' : ''}.`);
            await renderList();
        } catch (error) {
            setMessage(`Import fehlgeschlagen: ${error.message || String(error)}`, true);
        } finally {
            const input = modalRoot?.querySelector('#cq-import-file');
            if (input) input.value = '';
        }
    }

    function bindModalEvents() {
        modalRoot.querySelector('#cq-close').addEventListener('click', closeModal);
        modalRoot.querySelector('#cq-close-footer').addEventListener('click', closeModal);
        modalRoot.querySelector('#cq-new').addEventListener('click', clearEditor);
        modalRoot.querySelector('#cq-type').addEventListener('change', updateTypeUI);
        modalRoot.querySelector('#cq-method').addEventListener('change', updateBodyVisibility);
        modalRoot.querySelector('#cq-export').addEventListener('click', exportQueries);
        modalRoot.querySelector('#cq-import-file').addEventListener('change', event => importQueries(event.target.files?.[0]));
        modalRoot.querySelector('#cq-search').addEventListener('input', event => {
            listSearch = event.target.value;
            renderList();
        });
        modalRoot.querySelector('#cq-sort').addEventListener('change', event => {
            listSort = event.target.value;
            renderList();
        });

        modalRoot.querySelector('#cq-form').addEventListener('submit', event => {
            event.preventDefault();
            saveEditor();
        });

        modalRoot.querySelector('#cq-run-editor').addEventListener('click', () => {
            try {
                runQuery(getEditorRecord());
            } catch (error) {
                setMessage(error.message || String(error), true);
            }
        });

        modalRoot.querySelector('#cq-delete').addEventListener('click', () => {
            if (selectedId) deleteQuery(selectedId);
        });

        modalRoot.addEventListener('click', event => {
            if (event.target === modalRoot) closeModal();
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && modalRoot && !modalRoot.hidden) closeModal();
        });
    }

    function insertTrigger() {
        if (document.getElementById('lss-code-query-trigger')) return true;

        const divider = document.querySelector('#menu_profile + .dropdown-menu > li.divider');
        if (!divider) return false;

        const triggerLi = document.createElement('li');
        const triggerA = document.createElement('a');
        const triggerImg = document.createElement('img');

        triggerLi.id = 'lss-code-query-trigger';
        triggerImg.src = GM_getResourceURL('icon');
        triggerImg.width = 24;
        triggerImg.height = 24;
        triggerImg.alt = '';
        triggerImg.style.objectFit = 'contain';
        triggerA.href = '#';
        triggerA.append(triggerImg, '\xa0Code-Abfragen');
        triggerLi.append(triggerA);

        triggerLi.addEventListener('click', event => {
            event.preventDefault();
            createModal();
        });

        divider.before(triggerLi);
        return true;
    }

    if (!insertTrigger()) {
        const observer = new MutationObserver(() => {
            if (insertTrigger()) observer.disconnect();
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });

        setTimeout(() => observer.disconnect(), 30_000);
    }
})();
