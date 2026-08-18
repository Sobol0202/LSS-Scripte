// ==UserScript==
// @name         LSS Grafik-Collector
// @version      1.0
// @description  Sammelt Fahrzeug-Grafiken und erstellt eine JSON-Datenbank für die LSS Grafiksuche.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceURL
// @connect      www.leitstellenspiel.de
// @connect      leitstellenspiel.de
// @connect      leitstellenspiel.s3.amazonaws.com
// @resource     icon https://github.com/Sobol0202/LSS-Scripte/raw/main/LSS-Grafiksetsucher/icons8-datenerfassung-64.png
// @run-at       document-idle
// ==/UserScript==

(() => {
    'use strict';

    const REQUEST_DELAY_MS = 100;

    const DCT_SIZE = 32;
    const PHASH_SIZE = 16;
    const HASH_ALGORITHM = 'phash-dct-32-16-median-white-v1';
    const TRANSPARENT_BACKGROUND = '#ffffff';

    let running = false;
    let stopRequested = false;
    let activeRequest = null;
    let runConfig = null;

    const results = [];
    const hashCache = new Map();

    const stats = {
        pagesProcessed: 0,
        parentsFound: 0,
        parentsProcessed: 0,
        imagesFound: 0,
        imagesHashed: 0,
        hashErrors: 0,
        requestErrors: 0,
        requests: 0
    };

    let modal = null;
    let ui = null;

    const style = document.createElement('style');

    style.textContent = `
        #lss-collector-overlay {
            position: fixed;
            inset: 0;
            z-index: 2147483646;
            background: rgba(0, 0, 0, 0.55);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        #lss-collector-modal {
            width: min(560px, 100%);
            max-height: 88vh;
            overflow: auto;
            background: #fff;
            color: #222;
            border-radius: 10px;
            box-shadow: 0 12px 45px rgba(0,0,0,.35);
            font-family: Arial, sans-serif;
        }

        #lss-collector-modal * {
            box-sizing: border-box;
        }

        #lss-collector-modal .lssc-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 14px 16px;
            border-bottom: 1px solid #ddd;
        }

        #lss-collector-modal .lssc-title {
            font-size: 18px;
            font-weight: 700;
        }

        #lss-collector-modal .lssc-close {
            border: 0;
            background: transparent;
            font-size: 24px;
            line-height: 1;
            cursor: pointer;
            color: #666;
        }

        #lss-collector-modal .lssc-body {
            padding: 16px;
        }

        #lss-collector-modal .lssc-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }

        #lss-collector-modal label {
            display: block;
            margin-bottom: 4px;
            font-size: 12px;
            font-weight: 700;
            color: #555;
        }

        #lss-collector-modal input {
            width: 100%;
            padding: 8px 9px;
            border: 1px solid #bbb;
            border-radius: 5px;
        }

        #lss-collector-modal .lssc-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 14px;
        }

        #lss-collector-modal .lssc-buttons button {
            border: 0;
            border-radius: 5px;
            padding: 8px 12px;
            cursor: pointer;
            font-weight: 700;
        }

        #lss-collector-modal .lssc-start {
            background: #28a745;
            color: #fff;
        }

        #lss-collector-modal .lssc-stop {
            background: #dc3545;
            color: #fff;
        }

        #lss-collector-modal .lssc-secondary {
            background: #6c757d;
            color: #fff;
        }

        #lss-collector-modal button:disabled,
        #lss-collector-modal input:disabled {
            opacity: .5;
            cursor: not-allowed;
        }

        #lss-collector-modal .lssc-progress-wrap {
            height: 10px;
            margin-top: 16px;
            overflow: hidden;
            border-radius: 999px;
            background: #e9ecef;
        }

        #lss-collector-modal .lssc-progress {
            width: 0%;
            height: 100%;
            background: #337ab7;
            transition: width .15s linear;
        }

        #lss-collector-modal .lssc-status {
            margin-top: 12px;
            min-height: 38px;
            white-space: pre-line;
            font-weight: 600;
        }

        #lss-collector-modal .lssc-stats {
            margin-top: 10px;
            padding: 10px;
            border-radius: 5px;
            background: #f4f4f4;
            white-space: pre-line;
            font-family: monospace;
            font-size: 12px;
        }

        #lss-collector-modal .lssc-log {
            height: 150px;
            margin-top: 10px;
            overflow: auto;
            padding: 9px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background: #fafafa;
            white-space: pre-wrap;
            word-break: break-word;
            font-family: monospace;
            font-size: 11px;
            color: #555;
        }

        #lss-collector-modal .lssc-note {
            margin-top: 10px;
            color: #777;
            font-size: 12px;
        }

        @media (max-width: 600px) {
            #lss-collector-modal .lssc-grid {
                grid-template-columns: 1fr;
            }
        }
    `;

    document.head.appendChild(style);

    function insertMenuTrigger() {
        if (document.getElementById('lss-collector-menu-entry')) {
            return true;
        }

        const divider = document.querySelector(
            '#menu_profile + .dropdown-menu > li.divider'
        );

        if (!divider) {
            return false;
        }

        // create a trigger-element
        const triggerLi = document.createElement('li');
        const triggerA = document.createElement('a');
        const triggerImg = document.createElement('img');

        triggerLi.id = 'lss-collector-menu-entry';

        triggerImg.src = GM_getResourceURL('icon');
        triggerImg.width = 24;
        triggerImg.height = 24;
        triggerImg.alt = '';

        triggerA.href = '#';
        triggerA.append(triggerImg, '\xa0Grafik-Collector');
        triggerLi.append(triggerA);

        triggerLi.addEventListener('click', event => {
            event.preventDefault();
            createModal();
        });

        // insert the trigger-element to the DOM
        divider.before(triggerLi);

        return true;
    }

    if (!insertMenuTrigger()) {
        const observer = new MutationObserver(() => {
            if (insertMenuTrigger()) {
                observer.disconnect();
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    function createModal() {
        if (modal) {
            modal.style.display = 'flex';
            updateUi();
            return;
        }

        modal = document.createElement('div');
        modal.id = 'lss-collector-overlay';

        modal.innerHTML = `
            <div id="lss-collector-modal" role="dialog" aria-modal="true">
                <div class="lssc-header">
                    <div class="lssc-title">Grafik-Collector</div>
                    <button
                        type="button"
                        class="lssc-close"
                        id="lssc-close"
                        aria-label="Schließen"
                    >×</button>
                </div>

                <div class="lssc-body">
                    <div class="lssc-grid">
                        <div>
                            <label for="lssc-start-page">Startseite</label>
                            <input
                                id="lssc-start-page"
                                type="number"
                                min="1"
                                value="1"
                            >
                        </div>

                        <div>
                            <label for="lssc-end-page">Endseite</label>
                            <input
                                id="lssc-end-page"
                                type="number"
                                min="1"
                                value="25"
                            >
                        </div>
                    </div>

                    <div class="lssc-buttons">
                        <button
                            id="lssc-start"
                            class="lssc-start"
                            type="button"
                        >
                            Sammlung starten
                        </button>

                        <button
                            id="lssc-stop"
                            class="lssc-stop"
                            type="button"
                            disabled
                        >
                            Stop
                        </button>

                        <button
                            id="lssc-download"
                            class="lssc-secondary"
                            type="button"
                            disabled
                        >
                            JSON speichern
                        </button>

                        <button
                            id="lssc-clear"
                            class="lssc-secondary"
                            type="button"
                        >
                            Ergebnisse leeren
                        </button>
                    </div>

                    <div class="lssc-progress-wrap">
                        <div
                            id="lssc-progress"
                            class="lssc-progress"
                        ></div>
                    </div>

                    <div
                        id="lssc-status"
                        class="lssc-status"
                    >
                        Bereit.
                    </div>

                    <div
                        id="lssc-stats"
                        class="lssc-stats"
                    ></div>

                    <div
                        id="lssc-log"
                        class="lssc-log"
                    ></div>

                    <div class="lssc-note">
                        Das Fenster kann während der Sammlung geschlossen
                        und später über das Profilmenü wieder geöffnet werden.
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        ui = {
            close: modal.querySelector('#lssc-close'),
            startPage: modal.querySelector('#lssc-start-page'),
            endPage: modal.querySelector('#lssc-end-page'),
            start: modal.querySelector('#lssc-start'),
            stop: modal.querySelector('#lssc-stop'),
            download: modal.querySelector('#lssc-download'),
            clear: modal.querySelector('#lssc-clear'),
            progress: modal.querySelector('#lssc-progress'),
            status: modal.querySelector('#lssc-status'),
            stats: modal.querySelector('#lssc-stats'),
            log: modal.querySelector('#lssc-log')
        };

        ui.close.addEventListener('click', hideModal);

        modal.addEventListener('click', event => {
            if (event.target === modal) {
                hideModal();
            }
        });

        ui.start.addEventListener('click', () => {
            if (!running) {
                collect();
            }
        });

        ui.stop.addEventListener('click', stopCollection);

        ui.download.addEventListener('click', downloadJson);

        ui.clear.addEventListener('click', () => {
            if (running) {
                return;
            }

            results.length = 0;
            hashCache.clear();
            resetStats();

            if (ui) {
                ui.log.textContent = '';
            }

            setStatus('Bereit.');
            log('Ergebnisse geleert.');
        });

        updateUi();
    }

    function hideModal() {
        if (modal) {
            modal.style.display = 'none';
        }
    }

    function log(message, level = 'log') {
        const time = new Date().toLocaleTimeString();
        const line = `[${time}] ${message}`;

        if (level === 'error') {
            console.error('[LSS Collector]', message);
        } else if (level === 'warn') {
            console.warn('[LSS Collector]', message);
        } else {
            console.log('[LSS Collector]', message);
        }

        if (ui) {
            ui.log.textContent += line + '\n';
            ui.log.scrollTop = ui.log.scrollHeight;
        }
    }

    function setStatus(text) {
        if (ui) {
            ui.status.textContent = text;
        }
    }

    function setProgress(percent) {
        if (!ui) {
            return;
        }

        const clamped = Math.max(
            0,
            Math.min(100, Number(percent) || 0)
        );

        ui.progress.style.width = `${clamped}%`;
    }

    function setRunningState(isRunning) {
        running = isRunning;

        if (!ui) {
            return;
        }

        ui.start.disabled = isRunning;
        ui.stop.disabled = !isRunning;

        ui.startPage.disabled = isRunning;
        ui.endPage.disabled = isRunning;
        ui.clear.disabled = isRunning;

        ui.download.disabled =
            isRunning || results.length === 0;
    }

    function updateUi() {
        if (!ui) {
            return;
        }

        ui.stats.textContent =
            `Seiten: ${stats.pagesProcessed}\n` +
            `Grafiksets: ${stats.parentsProcessed}/${stats.parentsFound}\n` +
            `Grafiken: ${stats.imagesFound}\n` +
            `Hashes: ${stats.imagesHashed}\n` +
            `Fehler: ${stats.hashErrors + stats.requestErrors}\n` +
            `Datensätze: ${results.length}`;

        ui.download.disabled =
            running || results.length === 0;

        ui.start.disabled = running;
        ui.stop.disabled = !running;

        ui.startPage.disabled = running;
        ui.endPage.disabled = running;
        ui.clear.disabled = running;
    }

    function resetStats() {
        for (const key of Object.keys(stats)) {
            stats[key] = 0;
        }

        setProgress(0);
        updateUi();
    }


    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function parseHtml(html) {
        return new DOMParser().parseFromString(
            html,
            'text/html'
        );
    }

    function filenameFromUrl(url) {
        try {
            const parsed = new URL(url);

            return decodeURIComponent(
                parsed.pathname.split('/').pop() || ''
            );
        } catch {
            return url;
        }
    }

    function parentIdFromUrl(url) {
        const match = String(url).match(
            /\/vehicle_graphics\/(\d+)/
        );

        return match
            ? Number(match[1])
            : null;
    }

    function imageVariantFromUrl(url) {
        return String(url).includes(
            '/image_sonderrechtes/'
        )
            ? 'sonderrechte'
            : 'normal';
    }


    function gmRequest(url, responseType = null) {
        return new Promise((resolve, reject) => {
            if (stopRequested) {
                reject(
                    new DOMException(
                        'Vom Benutzer gestoppt.',
                        'AbortError'
                    )
                );

                return;
            }

            const details = {
                method: 'GET',
                url,
                timeout: 30000,
                anonymous: false,

                onload: async response => {
                    activeRequest = null;
                    stats.requests++;
                    updateUi();

                    await sleep(REQUEST_DELAY_MS);

                    if (
                        response.status >= 200 &&
                        response.status < 300
                    ) {
                        resolve(
                            responseType === 'blob'
                                ? response.response
                                : response.responseText
                        );
                    } else {
                        stats.requestErrors++;
                        updateUi();

                        reject(
                            new Error(
                                `HTTP ${response.status} für ${url}`
                            )
                        );
                    }
                },

                onerror: async () => {
                    activeRequest = null;
                    stats.requests++;
                    stats.requestErrors++;
                    updateUi();

                    await sleep(REQUEST_DELAY_MS);

                    reject(
                        new Error(
                            `Netzwerkfehler bei ${url}`
                        )
                    );
                },

                ontimeout: async () => {
                    activeRequest = null;
                    stats.requests++;
                    stats.requestErrors++;
                    updateUi();

                    await sleep(REQUEST_DELAY_MS);

                    reject(
                        new Error(
                            `Timeout bei ${url}`
                        )
                    );
                },

                onabort: () => {
                    activeRequest = null;

                    reject(
                        new DOMException(
                            'Vom Benutzer gestoppt.',
                            'AbortError'
                        )
                    );
                }
            };

            if (responseType) {
                details.responseType = responseType;
            }

            activeRequest = GM_xmlhttpRequest(details);
        });
    }

    const cosineTable = Array.from(
        { length: PHASH_SIZE },
        (_, u) =>
            Array.from(
                { length: DCT_SIZE },
                (_, x) =>
                    Math.cos(
                        (
                            (2 * x + 1) *
                            u *
                            Math.PI
                        ) /
                        (
                            2 *
                            DCT_SIZE
                        )
                    )
            )
    );

    function median(values) {
        const sorted = [...values].sort(
            (a, b) => a - b
        );

        const mid = Math.floor(
            sorted.length / 2
        );

        return sorted.length % 2
            ? sorted[mid]
            : (
                sorted[mid - 1] +
                sorted[mid]
            ) / 2;
    }

    function bitsToHex(bits) {
        let hex = '';

        for (
            let i = 0;
            i < bits.length;
            i += 4
        ) {
            hex += parseInt(
                bits
                    .slice(i, i + 4)
                    .padEnd(4, '0'),
                2
            ).toString(16);
        }

        return hex;
    }

    async function blobToGrayscaleMatrix(blob) {
        let image;
        let objectUrl = null;

        try {
            if ('createImageBitmap' in window) {
                image = await createImageBitmap(blob);
            } else {
                objectUrl = URL.createObjectURL(blob);

                image = await new Promise(
                    (resolve, reject) => {
                        const img = new Image();

                        img.onload = () => resolve(img);

                        img.onerror = () =>
                            reject(
                                new Error(
                                    'Bild konnte nicht verarbeitet werden.'
                                )
                            );

                        img.src = objectUrl;
                    }
                );
            }

            const canvas =
                document.createElement('canvas');

            canvas.width = DCT_SIZE;
            canvas.height = DCT_SIZE;

            const ctx =
                canvas.getContext(
                    '2d',
                    {
                        willReadFrequently: true
                    }
                );

            ctx.fillStyle =
                TRANSPARENT_BACKGROUND;

            ctx.fillRect(
                0,
                0,
                DCT_SIZE,
                DCT_SIZE
            );

            ctx.drawImage(
                image,
                0,
                0,
                DCT_SIZE,
                DCT_SIZE
            );

            const pixels =
                ctx.getImageData(
                    0,
                    0,
                    DCT_SIZE,
                    DCT_SIZE
                ).data;

            const matrix =
                Array.from(
                    { length: DCT_SIZE },
                    () =>
                        new Array(DCT_SIZE)
                );

            for (
                let y = 0;
                y < DCT_SIZE;
                y++
            ) {
                for (
                    let x = 0;
                    x < DCT_SIZE;
                    x++
                ) {
                    const i =
                        (
                            y *
                            DCT_SIZE +
                            x
                        ) * 4;

                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];

                    matrix[y][x] =
                        0.299 * r +
                        0.587 * g +
                        0.114 * b;
                }
            }

            return matrix;
        } finally {
            if (
                image &&
                typeof image.close ===
                    'function'
            ) {
                image.close();
            }

            if (objectUrl) {
                URL.revokeObjectURL(
                    objectUrl
                );
            }
        }
    }

    function calculateLowFrequencyDct(matrix) {
        const rowTransform =
            Array.from(
                { length: DCT_SIZE },
                () =>
                    new Array(
                        PHASH_SIZE
                    ).fill(0)
            );

        for (
            let y = 0;
            y < DCT_SIZE;
            y++
        ) {
            for (
                let u = 0;
                u < PHASH_SIZE;
                u++
            ) {
                let sum = 0;

                for (
                    let x = 0;
                    x < DCT_SIZE;
                    x++
                ) {
                    sum +=
                        matrix[y][x] *
                        cosineTable[u][x];
                }

                rowTransform[y][u] =
                    sum;
            }
        }

        const coefficients =
            Array.from(
                { length: PHASH_SIZE },
                () =>
                    new Array(
                        PHASH_SIZE
                    ).fill(0)
            );

        for (
            let v = 0;
            v < PHASH_SIZE;
            v++
        ) {
            const cv =
                v === 0
                    ? 1 / Math.sqrt(2)
                    : 1;

            for (
                let u = 0;
                u < PHASH_SIZE;
                u++
            ) {
                const cu =
                    u === 0
                        ? 1 / Math.sqrt(2)
                        : 1;

                let sum = 0;

                for (
                    let y = 0;
                    y < DCT_SIZE;
                    y++
                ) {
                    sum +=
                        rowTransform[y][u] *
                        cosineTable[v][y];
                }

                coefficients[v][u] =
                    (
                        2 /
                        DCT_SIZE
                    ) *
                    cu *
                    cv *
                    sum;
            }
        }

        return coefficients;
    }

    async function createPHashFromBlob(blob) {
        const matrix =
            await blobToGrayscaleMatrix(blob);

        const dct =
            calculateLowFrequencyDct(matrix);

        const thresholdValues = [];

        for (
            let y = 0;
            y < PHASH_SIZE;
            y++
        ) {
            for (
                let x = 0;
                x < PHASH_SIZE;
                x++
            ) {
                if (
                    x === 0 &&
                    y === 0
                ) {
                    continue;
                }

                thresholdValues.push(
                    dct[y][x]
                );
            }
        }

        const threshold =
            median(thresholdValues);

        let bits = '';

        for (
            let y = 0;
            y < PHASH_SIZE;
            y++
        ) {
            for (
                let x = 0;
                x < PHASH_SIZE;
                x++
            ) {
                if (
                    x === 0 &&
                    y === 0
                ) {
                    bits += '0';
                } else {
                    bits +=
                        dct[y][x] >=
                        threshold
                            ? '1'
                            : '0';
                }
            }
        }

        return bitsToHex(bits);
    }

    async function getImageHash(imageUrl) {
        if (hashCache.has(imageUrl)) {
            return hashCache.get(imageUrl);
        }

        const blob =
            await gmRequest(
                imageUrl,
                'blob'
            );

        const hash =
            await createPHashFromBlob(blob);

        hashCache.set(
            imageUrl,
            hash
        );

        return hash;
    }

    function buildExportObject() {
        return {
            metadata: {
                generated_at:
                    new Date().toISOString(),

                source:
                    'https://www.leitstellenspiel.de/',

                start_page:
                    runConfig?.startPage ?? null,

                end_page:
                    runConfig?.endPage ?? null,

                request_delay_ms:
                    REQUEST_DELAY_MS,

                hash_algorithm:
                    HASH_ALGORITHM,

                hash_bits:
                    PHASH_SIZE * PHASH_SIZE,

                dct_size:
                    DCT_SIZE,

                phash_size:
                    PHASH_SIZE,

                transparent_background:
                    TRANSPARENT_BACKGROUND,

                statistics: {
                    ...stats
                }
            },

            images: results
        };
    }

    function downloadJson() {
        if (results.length === 0) {
            alert(
                'Es sind noch keine Ergebnisse vorhanden.'
            );

            return;
        }

        const json =
            JSON.stringify(
                buildExportObject(),
                null,
                2
            );

        const blob =
            new Blob(
                [json],
                {
                    type:
                        'application/json;charset=utf-8'
                }
            );

        const url =
            URL.createObjectURL(blob);

        const a =
            document.createElement('a');

        const range =
            runConfig
                ? `${runConfig.startPage}-${runConfig.endPage}`
                : 'partial';

        a.href = url;

        a.download =
            `leitstellenspiel_phash_${range}_` +
            `${new Date().toISOString().slice(0, 10)}.json`;

        document.body.appendChild(a);
        a.click();
        a.remove();

        setTimeout(
            () =>
                URL.revokeObjectURL(url),
            1000
        );
    }


    function stopCollection() {
        if (!running) {
            return;
        }

        stopRequested = true;

        setStatus(
            'Sammlung wird gestoppt …'
        );

        log(
            'Stop angefordert.',
            'warn'
        );

        try {
            activeRequest?.abort?.();
        } catch (error) {
            console.warn(
                '[LSS Collector] Request konnte nicht abgebrochen werden:',
                error
            );
        }
    }

    async function collect() {
        if (!ui) {
            return;
        }

        const startPage =
            Math.max(
                1,
                Number.parseInt(
                    ui.startPage.value,
                    10
                ) || 1
            );

        const endPage =
            Math.max(
                1,
                Number.parseInt(
                    ui.endPage.value,
                    10
                ) || startPage
            );

        if (endPage < startPage) {
            alert(
                'Die Endseite muss größer oder gleich der Startseite sein.'
            );

            return;
        }

        runConfig = {
            startPage,
            endPage
        };

        stopRequested = false;

        results.length = 0;
        hashCache.clear();
        resetStats();

        ui.log.textContent = '';

        setRunningState(true);

        log(
            `Sammlung gestartet: Seiten ${startPage} bis ${endPage}.`
        );

        setStatus(
            'Grafiksets werden gesucht …'
        );

        const parentsMap =
            new Map();

        const totalPages =
            endPage -
            startPage +
            1;

        try {

            for (
                let page = startPage;
                page <= endPage;
                page++
            ) {
                if (stopRequested) {
                    break;
                }

                const pageIndex =
                    page -
                    startPage +
                    1;

                setProgress(
                    (
                        pageIndex - 1
                    ) /
                    totalPages *
                    100
                );

                setStatus(
                    `Suche Grafiksets: ${pageIndex}/${totalPages}`
                );

                log(
                    `Übersichtsseite ${page}`
                );

                try {
                    const pageUrl =
                        `https://www.leitstellenspiel.de/packs?_&page=${page}`;

                    const html =
                        await gmRequest(pageUrl);

                    const doc =
                        parseHtml(html);

                    const rows =
                        doc.querySelectorAll(
                            'table.table tbody tr'
                        );

                    let newParents = 0;

                    for (const row of rows) {
                        const link =
                            row.querySelector(
                                'td:first-child a[href^="/vehicle_graphics/"]'
                            );

                        if (!link) {
                            continue;
                        }

                        const parentUrl =
                            new URL(
                                link.getAttribute(
                                    'href'
                                ),
                                'https://www.leitstellenspiel.de'
                            ).href;

                        if (
                            parentsMap.has(
                                parentUrl
                            )
                        ) {
                            continue;
                        }

                        parentsMap.set(
                            parentUrl,
                            {
                                parent_id:
                                    parentIdFromUrl(
                                        parentUrl
                                    ),

                                parent_url:
                                    parentUrl,

                                parent_name:
                                    link.textContent
                                        .trim(),

                                source_page:
                                    page
                            }
                        );

                        newParents++;
                    }

                    stats.pagesProcessed++;

                    stats.parentsFound =
                        parentsMap.size;

                    updateUi();

                    log(
                        `${newParents} neue Grafiksets gefunden.`
                    );

                } catch (error) {
                    if (
                        error.name ===
                            'AbortError' ||
                        stopRequested
                    ) {
                        throw error;
                    }

                    log(
                        `Fehler auf Seite ${page}: ${error.message}`,
                        'error'
                    );
                }
            }

            if (stopRequested) {
                throw new DOMException(
                    'Vom Benutzer gestoppt.',
                    'AbortError'
                );
            }

            const parents =
                [...parentsMap.values()];

            stats.parentsFound =
                parents.length;

            updateUi();

            setProgress(0);

            log(
                `${parents.length} Grafiksets werden verarbeitet.`
            );

            for (
                let parentIndex = 0;
                parentIndex < parents.length;
                parentIndex++
            ) {
                if (stopRequested) {
                    break;
                }

                const parent =
                    parents[parentIndex];

                const setNumber =
                    parentIndex + 1;

                setProgress(
                    parents.length
                        ? (
                            parentIndex /
                            parents.length
                        ) * 100
                        : 100
                );

                setStatus(
                    `Grafikset ${setNumber}/${parents.length}\n` +
                    `${parent.parent_name}`
                );

                log(
                    `${setNumber}/${parents.length}: ${parent.parent_name}`
                );

                let html;

                try {
                    html =
                        await gmRequest(
                            parent.parent_url
                        );
                } catch (error) {
                    if (
                        error.name ===
                            'AbortError' ||
                        stopRequested
                    ) {
                        throw error;
                    }

                    log(
                        `Grafikset konnte nicht geladen werden: ${error.message}`,
                        'error'
                    );

                    continue;
                }

                const doc =
                    parseHtml(html);

                const idCells =
                    doc.querySelectorAll(
                        '.vehicle_image_graphic_id_hidden'
                    );

                let setImageCount = 0;

                for (const idCell of idCells) {
                    if (stopRequested) {
                        break;
                    }

                    const row =
                        idCell.closest('tr');

                    if (!row) {
                        continue;
                    }

                    const graphicIdText =
                        idCell.textContent.trim();

                    const graphicId =
                        graphicIdText
                            ? Number(
                                graphicIdText
                            )
                            : null;

                    const vehicleCell =
                        idCell.nextElementSibling;

                    const vehicleName =
                        vehicleCell
                            ?.textContent
                            .trim() ||
                        null;

                    const images =
                        row.querySelectorAll(
                            'img[src]'
                        );

                    for (const img of images) {
                        if (stopRequested) {
                            break;
                        }

                        const src =
                            img.getAttribute(
                                'src'
                            );

                        if (!src) {
                            continue;
                        }

                        const imageUrl =
                            new URL(
                                src,
                                parent.parent_url
                            ).href;

                        const filename =
                            filenameFromUrl(
                                imageUrl
                            );

                        stats.imagesFound++;
                        setImageCount++;
                        updateUi();

                        let phash = null;
                        let hashError = null;

                        try {
                            phash =
                                await getImageHash(
                                    imageUrl
                                );

                            stats.imagesHashed++;

                            log(
                                `✓ ${vehicleName || 'Unbekannt'} → ${filename}`
                            );

                        } catch (error) {
                            if (
                                error.name ===
                                    'AbortError' ||
                                stopRequested
                            ) {
                                throw error;
                            }

                            stats.hashErrors++;

                            hashError =
                                error.message;

                            log(
                                `✗ ${filename}: ${error.message}`,
                                'warn'
                            );
                        }

                        results.push({
                            parent_id:
                                parent.parent_id,

                            parent_url:
                                parent.parent_url,

                            parent_name:
                                parent.parent_name,

                            source_page:
                                parent.source_page,

                            vehicle_graphic_id:
                                Number.isFinite(
                                    graphicId
                                )
                                    ? graphicId
                                    : (
                                        graphicIdText ||
                                        null
                                    ),

                            vehicle_name:
                                vehicleName,

                            filename,
                            graphic_url:
                                imageUrl,

                            image_variant:
                                imageVariantFromUrl(
                                    imageUrl
                                ),

                            image_alt:
                                img.getAttribute(
                                    'alt'
                                ) ||
                                null,

                            phash,

                            phash_bits:
                                PHASH_SIZE *
                                PHASH_SIZE,

                            hash_algorithm:
                                HASH_ALGORITHM,

                            hash_error:
                                hashError
                        });

                        updateUi();
                    }
                }

                stats.parentsProcessed++;
                updateUi();

                setProgress(
                    parents.length
                        ? (
                            setNumber /
                            parents.length
                        ) * 100
                        : 100
                );

                log(
                    `${setImageCount} Grafiken in diesem Set.`
                );
            }

            if (stopRequested) {
                throw new DOMException(
                    'Vom Benutzer gestoppt.',
                    'AbortError'
                );
            }

            setProgress(100);

            setStatus(
                `Fertig.\n${results.length} Datensätze erstellt.`
            );

            log(
                `Fertig: ${results.length} Datensätze.`
            );

            console.log(
                '[LSS Collector] Ergebnisse:',
                results
            );

        } catch (error) {
            if (
                error.name ===
                    'AbortError' ||
                stopRequested
            ) {
                setStatus(
                    `Gestoppt.\n${results.length} Datensätze können gespeichert werden.`
                );

                log(
                    `Gestoppt. ${results.length} Datensätze bleiben erhalten.`,
                    'warn'
                );
            } else {
                setStatus(
                    `Abbruch: ${error.message}`
                );

                log(
                    `Abbruch: ${error.message}`,
                    'error'
                );
            }
        } finally {
            activeRequest = null;
            setRunningState(false);
            updateUi();
        }
    }

})();
