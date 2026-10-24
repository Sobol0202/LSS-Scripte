// ==UserScript==
// @name         LSS Kilometerauswertung
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0.0
// @description  Vergleicht Kilometerstände und zeigt sie für die Top und die Worst 10 als Grafik und Liste an.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/
// @resource     icon https://github.com/Sobol0202/LSS-Scripte/raw/refs/heads/main/LSS-Kilometerauswertung/multimedia-speed.svg
// @grant        GM_getResourceURL
// @run-at       document-idle
// ==/UserScript==

(() => {
    'use strict';

    const DB_NAME = 'LSS-Kilometerauswertung';
    const DB_VERSION = 1;
    const MAX_RECORDS = 5_000_000;
    const KM_FORMAT = new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    const DATE_FORMAT = new Intl.DateTimeFormat('de-DE', {
        dateStyle: 'short',
        timeStyle: 'medium',
    });

    let dbPromise;
    let modal;
    let running = false;
    let lastRun = null;

    async function getJSON(url) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const response = await fetch(url, {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${url}`);
        }
        return response.json();
    }

    function openDatabase() {
        if (!dbPromise) {
            dbPromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);
                request.onupgradeneeded = () => {
                    const db = request.result;
                    db.createObjectStore('runs', {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    const samples = db.createObjectStore('samples', {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    samples.createIndex('byRun', 'runId');
                    samples.createIndex('byVehicleTime', ['vehicleId', 'timestamp']);
                };
                request.onsuccess = () => {
                    request.result.onversionchange = () => request.result.close();
                    resolve(request.result);
                };
                request.onerror = () => reject(request.error);
                request.onblocked = () => reject(new Error('Die Datenbank ist in einem anderen Tab gesperrt.'));
            }).catch(error => {
                dbPromise = undefined;
                throw error;
            });
        }
        return dbPromise;
    }

    function getLatestRun(db) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('runs', 'readonly');
            const request = tx.objectStore('runs').openCursor(null, 'prev');
            request.onsuccess = () => resolve(request.result?.value ?? null);
            request.onerror = () => reject(request.error);
            tx.onabort = () => reject(tx.error);
        });
    }

    function getPreviousDistances(db, runId) {
        return new Promise((resolve, reject) => {
            const distances = new Map();
            if (runId == null) {
                resolve(distances);
                return;
            }
            const tx = db.transaction('samples', 'readonly');
            const request = tx.objectStore('samples')
                .index('byRun')
                .openCursor(IDBKeyRange.only(runId));
            request.onsuccess = () => {
                const cursor = request.result;
                if (!cursor) {
                    resolve(distances);
                    return;
                }
                distances.set(cursor.value.vehicleId, cursor.value.distanceKm);
                cursor.continue();
            };
            request.onerror = () => reject(request.error);
            tx.onabort = () => reject(tx.error);
        });
    }

    function saveRun(db, runData, vehicles) {
        if (vehicles.length > MAX_RECORDS) {
            return Promise.reject(new Error('Mehr als 5 Millionen Fahrzeuge in einer Abfrage.'));
        }

        return new Promise((resolve, reject) => {
            const tx = db.transaction(['runs', 'samples'], 'readwrite');
            const runStore = tx.objectStore('runs');
            const sampleStore = tx.objectStore('samples');
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error ?? new Error('Fehler beim Speichern.'));
            tx.onabort = () => reject(tx.error ?? new Error('Speichervorgang abgebrochen.'));

            const countRequest = sampleStore.count();
            countRequest.onsuccess = () => {
                let toRemove = Math.max(0, countRequest.result + vehicles.length - MAX_RECORDS);
                if (toRemove === 0) {
                    insertRun();
                    return;
                }

                const oldestCursor = sampleStore.openCursor();
                oldestCursor.onsuccess = () => {
                    const cursor = oldestCursor.result;
                    if (cursor && toRemove > 0) {
                        cursor.delete();
                        toRemove--;
                        cursor.continue();
                    } else {
                        insertRun();
                    }
                };
            };

            function insertRun() {
                const addRun = runStore.add(runData);
                addRun.onsuccess = () => {
                    const runId = addRun.result;
                    let position = 0;
                    insertBatch();

                    function insertBatch() {
                        let lastRequest;
                        for (let i = 0; i < 500 && position < vehicles.length; i++) {
                            const vehicle = vehicles[position++];
                            lastRequest = sampleStore.add({
                                runId,
                                timestamp: runData.timestamp,
                                vehicleId: vehicle.vehicleId,
                                distanceKm: vehicle.distanceKm,
                                distanceKm30d: vehicle.distanceKm30d,
                            });
                        }
                        if (lastRequest) {
                            lastRequest.onsuccess = () => {
                                if (position < vehicles.length) insertBatch();
                                else cleanOldRunMetadata();
                            };
                        } else {
                            cleanOldRunMetadata();
                        }
                    }

                    function cleanOldRunMetadata() {
                        const oldRuns = runStore.openCursor(
                            IDBKeyRange.upperBound(runId, true)
                        );
                        oldRuns.onsuccess = () => {
                            const cursor = oldRuns.result;
                            if (cursor) {
                                cursor.delete();
                                cursor.continue();
                            }
                        };
                    }
                };
            }
        });
    }

    function getVehicleHistory(db, vehicleId) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('samples', 'readonly');
            const index = tx.objectStore('samples').index('byVehicleTime');
            const range = IDBKeyRange.bound(
                [vehicleId, 0],
                [vehicleId, Number.MAX_SAFE_INTEGER]
            );
            const points = [];
            const countRequest = index.count(range);
            countRequest.onsuccess = () => {
                if (countRequest.result === 0) {
                    resolve(points);
                    return;
                }
                const stride = Math.max(1, Math.ceil(countRequest.result / 400));
                const cursorRequest = index.openCursor(range);
                cursorRequest.onsuccess = () => {
                    const cursor = cursorRequest.result;
                    if (cursor) {
                        points.push({
                            timestamp: cursor.value.timestamp,
                            distanceKm: cursor.value.distanceKm,
                        });
                        cursor.advance(stride);
                    } else {
                        const newestRequest = index.openCursor(range, 'prev');
                        newestRequest.onsuccess = () => {
                            const last = newestRequest.result?.value;
                            if (last && (points.length === 0 ||
                                points[points.length - 1].timestamp !== last.timestamp)) {
                                points.push({
                                    timestamp: last.timestamp,
                                    distanceKm: last.distanceKm,
                                });
                            }
                            resolve(points);
                        };
                    }
                };
            };
            tx.onabort = () => reject(tx.error);
            tx.onerror = () => reject(tx.error);
        });
    }

    function ageLabel(timestamp) {
        if (!timestamp) return 'noch nie';
        const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
        if (seconds < 60) return 'gerade eben';
        if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Min.`;
        if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Std.`;
        return `vor ${Math.floor(seconds / 86400)} Tagen`;
    }

    function km(value) {
        return `${KM_FORMAT.format(value)} km`;
    }

    function setStatus(message, level = 'info') {
        const status = modal.querySelector('#lss-km-status');
        status.className = `alert alert-${level}`;
        status.textContent = message;
        status.hidden = !message;
    }

    function updateLastQuery() {
        if (!modal) return;
        const label = modal.querySelector('#lss-km-last-query');
        label.textContent = `Letzte Abfrage: ${ageLabel(lastRun?.timestamp)}`;
        label.title = lastRun ? DATE_FORMAT.format(new Date(lastRun.timestamp)) : '';
    }

    function renderTable(tbody, rows) {
        tbody.replaceChildren();
        if (rows.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 4;
            td.className = 'text-muted';
            td.textContent = 'Noch keine vergleichbaren Kilometerstände vorhanden.';
            tr.append(td);
            tbody.append(tr);
            return;
        }

        for (const entry of rows) {
            const tr = document.createElement('tr');
            const nameCell = document.createElement('td');
            const link = document.createElement('a');
            link.href = `/vehicles/${entry.vehicleId}`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = entry.caption || `Fahrzeug #${entry.vehicleId}`;
            link.title = `Fahrzeug-ID: ${entry.vehicleId}`;
            nameCell.append(link);

            const deltaCell = document.createElement('td');
            deltaCell.className = 'text-right';
            deltaCell.textContent = `${entry.deltaKm >= 0 ? '+' : ''}${km(entry.deltaKm)}`;

            const totalCell = document.createElement('td');
            totalCell.className = 'text-right';
            totalCell.textContent = km(entry.distanceKm);

            const chartCell = document.createElement('td');
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-default btn-xs';
            button.textContent = 'Verlauf';
            button.dataset.vehicleId = String(entry.vehicleId);
            button.dataset.caption = link.textContent;
            chartCell.append(button);

            tr.append(nameCell, deltaCell, totalCell, chartCell);
            tbody.append(tr);
        }
    }

    function renderRun(run) {
        lastRun = run;
        updateLastQuery();
        renderTable(modal.querySelector('#lss-km-top'), run?.top ?? []);
        renderTable(modal.querySelector('#lss-km-worst'), run?.worst ?? []);

        const summary = modal.querySelector('#lss-km-summary');
        if (!run) {
            summary.textContent = 'Bei der ersten Abfrage wird der Ausgangskilometerstand gespeichert. Ab der zweiten Abfrage erfolgt der Vergleich.';
        } else if (run.previousTimestamp == null) {
            summary.textContent = `${run.vehicleCount.toLocaleString('de-DE')} Fahrzeuge als Ausgangsmessung gespeichert. Für die Ranglisten ist eine weitere Abfrage erforderlich.`;
        } else {
            summary.textContent = `Stand: ${DATE_FORMAT.format(new Date(run.timestamp))} · Vergleich mit ${DATE_FORMAT.format(new Date(run.previousTimestamp))} · ${run.comparedCount.toLocaleString('de-DE')} vergleichbare Fahrzeuge · ${run.newCount.toLocaleString('de-DE')} neue Fahrzeuge.`;
        }
    }

    const SVG_NS = 'http://www.w3.org/2000/svg';
    function svgElement(tag, attributes = {}, text) {
        const element = document.createElementNS(SVG_NS, tag);
        for (const [name, value] of Object.entries(attributes)) {
            element.setAttribute(name, String(value));
        }
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function drawChart(points) {
        const root = modal.querySelector('#lss-km-chart');
        root.replaceChildren();
        if (points.length === 0) {
            root.textContent = 'Für dieses Fahrzeug sind keine gespeicherten Messwerte vorhanden.';
            return;
        }
        const width = 960;
        const height = 340;
        const left = 94;
        const right = 20;
        const top = 20;
        const bottom = 54;
        const timestamps = points.map(item => item.timestamp);
        const distances = points.map(item => item.distanceKm);
        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps);
        const minDistance = Math.min(...distances);
        const maxDistance = Math.max(...distances);
        const spread = maxDistance - minDistance || 1;
        const x = time => left + (time - minTime) / (maxTime - minTime || 1) * (width - left - right);
        const y = distance => top + (maxDistance - distance) / spread * (height - top - bottom);

        const svg = svgElement('svg', {
            viewBox: `0 0 ${width} ${height}`,
            role: 'img',
            'aria-label': 'Verlauf des Gesamtkilometerstands',
            style: 'display:block;width:100%;height:auto;',
        });
        for (let i = 0; i <= 4; i++) {
            const yPos = top + i * (height - top - bottom) / 4;
            const value = maxDistance - spread * i / 4;
            svg.append(
                svgElement('line', {
                    x1: left, y1: yPos, x2: width - right, y2: yPos,
                    stroke: '#ddd', 'stroke-width': 1,
                }),
                svgElement('text', {
                    x: left - 8, y: yPos + 4, 'text-anchor': 'end',
                    fill: '#666', 'font-size': 13,
                }, KM_FORMAT.format(value))
            );
        }
        const polyline = svgElement('polyline', {
            points: points.map(point => `${x(point.timestamp)},${y(point.distanceKm)}`).join(' '),
            fill: 'none', stroke: '#337ab7', 'stroke-width': 2.5,
            'stroke-linejoin': 'round', 'stroke-linecap': 'round',
        });
        svg.append(polyline);
        for (const point of points) {
            const circle = svgElement('circle', {
                cx: x(point.timestamp), cy: y(point.distanceKm), r: 3,
                fill: '#337ab7', stroke: '#fff', 'stroke-width': 1,
            });
            circle.append(svgElement('title', {},
                `${DATE_FORMAT.format(new Date(point.timestamp))}: ${km(point.distanceKm)}`
            ));
            svg.append(circle);
        }
        svg.append(
            svgElement('text', {
                x: left, y: height - 19, fill: '#666', 'font-size': 13,
            }, DATE_FORMAT.format(new Date(minTime))),
            svgElement('text', {
                x: width - right, y: height - 19, 'text-anchor': 'end',
                fill: '#666', 'font-size': 13,
            }, DATE_FORMAT.format(new Date(maxTime)))
        );
        root.append(svg);
        const note = document.createElement('p');
        note.className = 'text-muted small';
        note.textContent = `${points.length.toLocaleString('de-DE')} dargestellte Messpunkte (bei langen Verläufen ausgedünnt).`;
        root.append(note);
    }

    async function showVehicleHistory(vehicleId, caption) {
        const panel = modal.querySelector('#lss-km-chart-panel');
        const chart = modal.querySelector('#lss-km-chart');
        panel.hidden = false;
        modal.querySelector('#lss-km-chart-title').textContent =
            `Kilometerverlauf: ${caption} (#${vehicleId})`;
        chart.textContent = 'Lade Verlauf …';
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        try {
            const db = await openDatabase();
            const points = await getVehicleHistory(db, vehicleId);
            // Kein älteres, parallel angefragtes Diagramm darüberzeichnen.
            if (panel.dataset.vehicleId !== String(vehicleId)) return;
            drawChart(points);
        } catch (error) {
            chart.textContent = `Verlauf konnte nicht geladen werden: ${error.message}`;
        }
    }

    async function refreshDistances() {
        if (running) return;
        running = true;
        const button = modal.querySelector('#lss-km-refresh');
        button.disabled = true;
        button.textContent = 'Abfrage läuft …';
        setStatus('Lade aktuelle Kilometerstände …');

        try {
            const db = await openDatabase();
            const previousRun = await getLatestRun(db);
            const previousDistances = await getPreviousDistances(db, previousRun?.id);
            const response = await getJSON('/api/v1/vehicle_distances');
            if (!Array.isArray(response?.result)) {
                throw new Error('Die Kilometer-API hat kein gültiges result-Array geliefert.');
            }
            const timestamp = Date.now();
            const vehicleMap = new Map();
            for (const raw of response.result) {
                const vehicleId = Number(raw.vehicle_id);
                const distanceKm = Number(raw.distance_km);
                const distanceKm30d = Number(raw.distance_km_30d);
                if (!Number.isSafeInteger(vehicleId) || vehicleId <= 0 ||
                    !Number.isFinite(distanceKm) || distanceKm < 0) continue;
                vehicleMap.set(vehicleId, {
                    vehicleId,
                    distanceKm,
                    distanceKm30d: Number.isFinite(distanceKm30d) ? distanceKm30d : null,
                });
            }
            const vehicles = Array.from(vehicleMap.values());
            const comparable = vehicles
                .filter(vehicle => previousDistances.has(vehicle.vehicleId))
                .map(vehicle => ({
                    vehicleId: vehicle.vehicleId,
                    distanceKm: vehicle.distanceKm,
                    deltaKm: vehicle.distanceKm - previousDistances.get(vehicle.vehicleId),
                }));
            const top = [...comparable]
                .sort((a, b) => b.deltaKm - a.deltaKm || a.vehicleId - b.vehicleId)
                .slice(0, 10);
            const worst = [...comparable]
                .sort((a, b) => a.deltaKm - b.deltaKm || a.vehicleId - b.vehicleId)
                .slice(0, 10);

            const captions = new Map();
            const ids = [...new Set([...top, ...worst].map(vehicle => vehicle.vehicleId))];
            let failedNames = 0;
            for (let i = 0; i < ids.length; i++) {
                setStatus(`Lade Fahrzeugnamen (${i + 1}/${ids.length}) …`);
                try {
                    const info = await getJSON(`/api/v2/vehicles/${ids[i]}`);
                    if (typeof info?.result?.caption === 'string' && info.result.caption.trim()) {
                        captions.set(ids[i], info.result.caption.trim());
                    } else {
                        failedNames++;
                    }
                } catch (error) {
                    console.warn('[Kilometerauswertung] Fahrzeugname nicht abrufbar:', ids[i], error);
                    failedNames++;
                }
            }
            for (const entry of [...top, ...worst]) {
                entry.caption = captions.get(entry.vehicleId) || `Fahrzeug #${entry.vehicleId}`;
            }

            const run = {
                timestamp,
                previousTimestamp: previousRun?.timestamp ?? null,
                vehicleCount: vehicles.length,
                comparedCount: comparable.length,
                newCount: vehicles.length - comparable.length,
                top,
                worst,
            };
            setStatus(`Speichere ${vehicles.length.toLocaleString('de-DE')} Messwerte …`);
            await saveRun(db, run, vehicles);
            renderRun(await getLatestRun(db));
            setStatus(
                `Abfrage gespeichert (${vehicles.length.toLocaleString('de-DE')} Fahrzeuge).` +
                (failedNames ? ` ${failedNames} Fahrzeugnamen konnten nicht abgerufen werden.` : ''),
                failedNames ? 'warning' : 'success'
            );
        } catch (error) {
            console.error('[Kilometerauswertung] Abfrage fehlgeschlagen:', error);
            setStatus(`Abfrage fehlgeschlagen: ${error.message}`, 'danger');
        } finally {
            running = false;
            button.disabled = false;
            button.textContent = 'Kilometerstände abfragen';
        }
    }

    function closeModal() {
        if (!modal) return;
        modal.hidden = true;
        document.removeEventListener('keydown', handleEscape);
    }

    function handleEscape(event) {
        if (event.key === 'Escape') closeModal();
    }

    // Öffnet ein eigenes Overlay, verwendet aber die Bootstrap-Klassen des Spiels.
    async function createModal() {
        if (!modal) {
            const style = document.createElement('style');
            style.textContent = `
                #lss-km-overlay[hidden], #lss-km-chart-panel[hidden], #lss-km-status[hidden] { display:none !important; }
                #lss-km-overlay { position:fixed;inset:0;z-index:200000;background:rgba(0,0,0,.55);overflow:auto;padding:24px 12px; }
                #lss-km-window { margin:0 auto;max-width:1100px;background:#fff;color:#333;border-radius:6px;box-shadow:0 8px 35px rgba(0,0,0,.35); }
                #lss-km-window .modal-header { display:flex;align-items:center;justify-content:space-between;gap:12px; }
                #lss-km-window .modal-body { max-height:none; }
                #lss-km-window .lss-km-toolbar { display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:12px; }
                #lss-km-window .lss-km-table { overflow-x:auto; }
                #lss-km-window .lss-km-table table { margin-bottom:0; }
                #lss-km-window .lss-km-table td,#lss-km-window .lss-km-table th { vertical-align:middle; }
                #lss-km-window #lss-km-chart-panel { margin-top:20px; }
                #lss-km-window #lss-km-last-query { color:#777; }
                #lss-km-window .lss-km-close { float:none; margin:0; font-size:26px; }
            `;
            document.head.append(style);

            modal = document.createElement('div');
            modal.id = 'lss-km-overlay';
            modal.hidden = true;
            modal.innerHTML = `
                <div id="lss-km-window" class="modal-content" role="dialog" aria-modal="true" aria-labelledby="lss-km-title">
                    <div class="modal-header">
                        <h3 class="modal-title" id="lss-km-title">Kilometerauswertung</h3>
                        <button class="close lss-km-close" type="button" aria-label="Schließen" id="lss-km-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="lss-km-toolbar">
                            <button type="button" class="btn btn-primary" id="lss-km-refresh">Kilometerstände abfragen</button>
                            <span id="lss-km-last-query">Letzte Abfrage: noch nie</span>
                        </div>
                        <div id="lss-km-status" class="alert alert-info" hidden></div>
                        <p id="lss-km-summary" class="text-muted"></p>
                        <h4>Top 10 – größte Fahrstreckenveränderung</h4>
                        <div class="lss-km-table">
                            <table class="table table-striped table-hover">
                                <thead><tr><th>Fahrzeug</th><th class="text-right">Seit letzter Abfrage</th><th class="text-right">Gesamtkilometerstand</th><th>Diagramm</th></tr></thead>
                                <tbody id="lss-km-top"></tbody>
                            </table>
                        </div>
                        <h4>Worst 10 – kleinste Fahrstreckenveränderung</h4>
                        <div class="lss-km-table">
                            <table class="table table-striped table-hover">
                                <thead><tr><th>Fahrzeug</th><th class="text-right">Seit letzter Abfrage</th><th class="text-right">Gesamtkilometerstand</th><th>Diagramm</th></tr></thead>
                                <tbody id="lss-km-worst"></tbody>
                            </table>
                        </div>
                        <div id="lss-km-chart-panel" class="panel panel-default" hidden>
                            <div class="panel-heading" style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
                                <strong id="lss-km-chart-title">Kilometerverlauf</strong>
                                <button type="button" class="btn btn-default btn-xs" id="lss-km-chart-close">Schließen</button>
                            </div>
                            <div class="panel-body" id="lss-km-chart"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" id="lss-km-close-footer">Schließen</button>
                    </div>
                </div>
            `;
            document.body.append(modal);

            modal.querySelector('#lss-km-refresh').addEventListener('click', refreshDistances);
            modal.querySelector('#lss-km-close').addEventListener('click', closeModal);
            modal.querySelector('#lss-km-close-footer').addEventListener('click', closeModal);
            modal.querySelector('#lss-km-chart-close').addEventListener('click', () => {
                modal.querySelector('#lss-km-chart-panel').hidden = true;
            });
            modal.addEventListener('click', event => {
                if (event.target === modal) closeModal();
                const button = event.target.closest?.('button[data-vehicle-id]');
                if (!button || !modal.contains(button)) return;
                const panel = modal.querySelector('#lss-km-chart-panel');
                panel.dataset.vehicleId = button.dataset.vehicleId;
                showVehicleHistory(Number(button.dataset.vehicleId), button.dataset.caption);
            });
            setInterval(updateLastQuery, 60_000);
        }
        modal.hidden = false;
        document.addEventListener('keydown', handleEscape);
        try {
            renderRun(await getLatestRun(await openDatabase()));
        } catch (error) {
            setStatus(`Gespeicherte Daten konnten nicht gelesen werden: ${error.message}`, 'danger');
        }
    }

    function insertTrigger() {
        if (document.querySelector('#lss-km-trigger')) return true;
        const divider = document.querySelector('#menu_profile + .dropdown-menu > li.divider');
        if (!divider) return false;

        const triggerLi = document.createElement('li');
        triggerLi.id = 'lss-km-trigger';
        const triggerA = document.createElement('a');
        const triggerImg = document.createElement('img');
        triggerImg.src = GM_getResourceURL('icon');
        triggerImg.width = 24;
        triggerImg.height = 24;
        triggerA.href = '#';
        triggerA.append(triggerImg, '\u00a0Kilometerauswertung');
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
    }
})();
