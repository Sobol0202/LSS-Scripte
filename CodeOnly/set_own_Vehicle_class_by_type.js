(async () => {
    'use strict';

    const CONFIG = {
        vehiclesApi: '/api/vehicles',
        vehicleTypesApi: 'https://api.lss-manager.de/de_DE/vehicles',

        requestDelay: 100,

        appId: 'lss-bulk-vehicle-class-editor'
    };

    if (!location.hostname.endsWith('leitstellenspiel.de')) {
        alert('Dieses Skript muss auf leitstellenspiel.de ausgeführt werden.');
        return;
    }

    document.getElementById(CONFIG.appId)?.remove();

    // Hilfsfunktionen
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    const naturalSort = (a, b) =>
        String(a).localeCompare(String(b), 'de', {
            numeric: true,
            sensitivity: 'base'
        });

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    async function getJson(url, options = {}) {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(
                `${url}: HTTP ${response.status} ${response.statusText}`
            );
        }

        return response.json();
    }

    // UI
    const root = document.createElement('div');
    root.id = CONFIG.appId;

    root.innerHTML = `
        <style>
            #${CONFIG.appId} {
                position: fixed;
                inset: 0;
                z-index: 999999;
                background: rgba(0, 0, 0, .55);
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
                color: #222;
            }

            #${CONFIG.appId} * {
                box-sizing: border-box;
            }

            #${CONFIG.appId} .lss-bulk-window {
                width: min(1050px, calc(100vw - 40px));
                height: min(850px, calc(100vh - 40px));
                background: #fff;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 10px 40px rgba(0,0,0,.4);
            }

            #${CONFIG.appId} .lss-bulk-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 14px 18px;
                border-bottom: 1px solid #ccc;
                background: #f7f7f7;
            }

            #${CONFIG.appId} .lss-bulk-header h2 {
                margin: 0;
                font-size: 20px;
            }

            #${CONFIG.appId} .lss-bulk-close {
                border: 0;
                background: transparent;
                font-size: 25px;
                cursor: pointer;
                line-height: 1;
            }

            #${CONFIG.appId} .lss-bulk-content {
                padding: 16px 18px;
                overflow: auto;
                flex: 1;
            }

            #${CONFIG.appId} .lss-bulk-field {
                margin-bottom: 15px;
            }

            #${CONFIG.appId} label {
                display: block;
                font-weight: bold;
                margin-bottom: 5px;
            }

            #${CONFIG.appId} select,
            #${CONFIG.appId} input[type="text"] {
                width: 100%;
                height: 36px;
                border: 1px solid #bbb;
                border-radius: 4px;
                padding: 6px 9px;
                background: #fff;
                color: #222;
            }

            #${CONFIG.appId} .lss-bulk-table-container {
                border: 1px solid #ccc;
                height: 390px;
                overflow: auto;
                margin-bottom: 15px;
            }

            #${CONFIG.appId} table {
                width: 100%;
                border-collapse: collapse;
            }

            #${CONFIG.appId} th {
                position: sticky;
                top: 0;
                z-index: 2;
                background: #eee;
                text-align: left;
                border-bottom: 1px solid #bbb;
                padding: 8px;
            }

            #${CONFIG.appId} td {
                border-bottom: 1px solid #eee;
                padding: 7px 8px;
            }

            #${CONFIG.appId} tbody tr:hover {
                background: #f4f8fb;
                cursor: pointer;
            }

            #${CONFIG.appId} .lss-bulk-checkbox-column {
                width: 50px;
                text-align: center;
            }

            #${CONFIG.appId} input[type="checkbox"] {
                cursor: pointer;
                width: 17px;
                height: 17px;
            }

            #${CONFIG.appId} .lss-bulk-selection-info {
                margin: 5px 0 10px;
                font-size: 13px;
                color: #555;
            }

            #${CONFIG.appId} .lss-bulk-buttons {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }

            #${CONFIG.appId} button {
                padding: 8px 13px;
                border-radius: 4px;
                border: 1px solid #aaa;
                cursor: pointer;
            }

            #${CONFIG.appId} .lss-bulk-start {
                background: #28a745;
                border-color: #218838;
                color: white;
            }

            #${CONFIG.appId} .lss-bulk-start:disabled {
                opacity: .5;
                cursor: not-allowed;
            }

            #${CONFIG.appId} .lss-bulk-cancel {
                background: #dc3545;
                border-color: #bd2130;
                color: white;
            }

            #${CONFIG.appId} .lss-bulk-progress-area {
                margin-top: 15px;
                border-top: 1px solid #ddd;
                padding-top: 15px;
            }

            #${CONFIG.appId} progress {
                width: 100%;
                height: 22px;
            }

            #${CONFIG.appId} .lss-bulk-status {
                margin-top: 6px;
                font-size: 13px;
            }

            #${CONFIG.appId} .lss-bulk-summary {
                margin-top: 8px;
                font-size: 13px;
            }

            #${CONFIG.appId} .lss-bulk-log {
                margin-top: 10px;
                height: 90px;
                overflow: auto;
                background: #f4f4f4;
                border: 1px solid #ddd;
                padding: 7px;
                font-family: monospace;
                font-size: 11px;
                white-space: pre-wrap;
            }

            #${CONFIG.appId} .lss-bulk-muted {
                color: #777;
            }

            #${CONFIG.appId} .lss-bulk-error {
                color: #b00020;
                font-weight: bold;
            }

            #${CONFIG.appId} .lss-bulk-success {
                color: #188038;
                font-weight: bold;
            }
        </style>

        <div class="lss-bulk-window">
            <div class="lss-bulk-header">
                <h2>Fahrzeugklassen bearbeiten</h2>
                <button class="lss-bulk-close" title="Schließen">&times;</button>
            </div>

            <div class="lss-bulk-content">
                <div class="lss-bulk-field">
                    <label>Fahrzeugtyp</label>
                    <select class="lss-bulk-type" disabled>
                        <option value="">Fahrzeugdaten werden geladen …</option>
                    </select>
                </div>

                <div class="lss-bulk-selection-info">
                    <span class="lss-bulk-type-count">0 Fahrzeuge</span>
                    ·
                    <strong class="lss-bulk-selected-count">0 ausgewählt</strong>
                </div>

                <div class="lss-bulk-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th class="lss-bulk-checkbox-column">
                                    <input
                                        type="checkbox"
                                        class="lss-bulk-select-all"
                                        title="Alle auswählen"
                                    >
                                </th>
                                <th>Fahrzeugbezeichnung</th>
                            </tr>
                        </thead>
                        <tbody class="lss-bulk-tbody">
                            <tr>
                                <td colspan="2" class="lss-bulk-muted">
                                    Fahrzeugdaten werden geladen …
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="lss-bulk-field">
                    <label>Eigene Fahrzeugklasse</label>
                    <input
                        type="text"
                        class="lss-bulk-class-name"
                        placeholder="z. B. HLF Löschzug"
                        autocomplete="off"
                    >
                </div>

                <div class="lss-bulk-buttons">
                    <button class="lss-bulk-start" disabled>
                        Ausgewählte Fahrzeuge bearbeiten
                    </button>

                    <button
                        class="lss-bulk-cancel"
                        style="display:none"
                    >
                        Abbrechen
                    </button>
                </div>

                <div class="lss-bulk-progress-area">
                    <progress class="lss-bulk-progress" value="0" max="1"></progress>

                    <div class="lss-bulk-status">
                        Bereit.
                    </div>

                    <div class="lss-bulk-summary"></div>

                    <div class="lss-bulk-log"></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(root);

    // DOM-Referenzieren
    const elements = {
        close: root.querySelector('.lss-bulk-close'),
        type: root.querySelector('.lss-bulk-type'),
        tbody: root.querySelector('.lss-bulk-tbody'),
        selectAll: root.querySelector('.lss-bulk-select-all'),
        typeCount: root.querySelector('.lss-bulk-type-count'),
        selectedCount: root.querySelector('.lss-bulk-selected-count'),
        className: root.querySelector('.lss-bulk-class-name'),
        start: root.querySelector('.lss-bulk-start'),
        cancel: root.querySelector('.lss-bulk-cancel'),
        progress: root.querySelector('.lss-bulk-progress'),
        status: root.querySelector('.lss-bulk-status'),
        summary: root.querySelector('.lss-bulk-summary'),
        log: root.querySelector('.lss-bulk-log')
    };

    // Status
    const state = {
        vehicles: [],
        vehicleTypes: {},
        currentVehicles: [],
        selectedIds: new Set(),
        lastSelectedIndex: null,

        running: false,
        cancelRequested: false,

        processed: 0,
        successful: 0,
        failed: 0
    };

    function log(message) {
        const time = new Date().toLocaleTimeString();

        elements.log.textContent += `[${time}] ${message}\n`;
        elements.log.scrollTop = elements.log.scrollHeight;
    }

    function setStatus(message, className = '') {
        elements.status.textContent = message;
        elements.status.className = `lss-bulk-status ${className}`;
    }

    function updateStartButton() {
        elements.start.disabled =
            state.running ||
            state.selectedIds.size === 0 ||
            !elements.className.value.trim() ||
            elements.type.value === '';
    }

    function updateSelectionDisplay() {
        elements.selectedCount.textContent =
            `${state.selectedIds.size} ausgewählt`;

        const checkboxes = [
            ...elements.tbody.querySelectorAll(
                'input.lss-bulk-vehicle-checkbox'
            )
        ];

        const selected = checkboxes.filter(cb => cb.checked).length;

        elements.selectAll.checked =
            checkboxes.length > 0 &&
            selected === checkboxes.length;

        elements.selectAll.indeterminate =
            selected > 0 &&
            selected < checkboxes.length;

        updateStartButton();
    }

    function rebuildSelectedIds() {
        state.selectedIds.clear();

        elements.tbody
            .querySelectorAll('input.lss-bulk-vehicle-checkbox:checked')
            .forEach(checkbox => {
                state.selectedIds.add(Number(checkbox.dataset.vehicleId));
            });

        updateSelectionDisplay();
    }

    // Fahrzeugtabelle
    function renderVehicleTable(vehicleType) {
        const typeNumber = Number(vehicleType);

        state.currentVehicles = state.vehicles
            .filter(vehicle => Number(vehicle.vehicle_type) === typeNumber)
            .sort((a, b) => naturalSort(a.caption, b.caption));

        state.selectedIds.clear();
        state.lastSelectedIndex = null;

        elements.typeCount.textContent =
            `${state.currentVehicles.length} Fahrzeuge`;

        elements.selectAll.checked = false;
        elements.selectAll.indeterminate = false;

        elements.tbody.replaceChildren();

        if (!state.currentVehicles.length) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');

            cell.colSpan = 2;
            cell.textContent = 'Keine Fahrzeuge dieses Typs gefunden.';
            cell.className = 'lss-bulk-muted';

            row.appendChild(cell);
            elements.tbody.appendChild(row);

            updateSelectionDisplay();
            return;
        }

        const fragment = document.createDocumentFragment();

        state.currentVehicles.forEach((vehicle, index) => {
            const row = document.createElement('tr');
            row.dataset.index = index;

            const checkboxCell = document.createElement('td');
            checkboxCell.className = 'lss-bulk-checkbox-column';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'lss-bulk-vehicle-checkbox';
            checkbox.dataset.vehicleId = vehicle.id;
            checkbox.dataset.index = index;

            checkboxCell.appendChild(checkbox);

            const captionCell = document.createElement('td');
            captionCell.textContent =
                vehicle.caption || `Fahrzeug ${vehicle.id}`;

            row.append(checkboxCell, captionCell);
            fragment.appendChild(row);
        });

        elements.tbody.appendChild(fragment);

        updateSelectionDisplay();
    }

    function handleVehicleSelection(checkbox, shiftKey) {
        const currentIndex = Number(checkbox.dataset.index);

        if (
            shiftKey &&
            state.lastSelectedIndex !== null &&
            state.lastSelectedIndex !== currentIndex
        ) {
            const from = Math.min(
                state.lastSelectedIndex,
                currentIndex
            );

            const to = Math.max(
                state.lastSelectedIndex,
                currentIndex
            );

            const targetState = checkbox.checked;

            for (let i = from; i <= to; i++) {
                const rangeCheckbox =
                    elements.tbody.querySelector(
                        `input.lss-bulk-vehicle-checkbox[data-index="${i}"]`
                    );

                if (rangeCheckbox) {
                    rangeCheckbox.checked = targetState;
                }
            }
        }

        state.lastSelectedIndex = currentIndex;
        rebuildSelectedIds();
    }

    elements.tbody.addEventListener('click', event => {
        if (state.running) {
            return;
        }

        const checkbox = event.target.closest(
            'input.lss-bulk-vehicle-checkbox'
        );

        if (checkbox) {
            handleVehicleSelection(
                checkbox,
                event.shiftKey
            );

            return;
        }

        const row = event.target.closest('tr[data-index]');

        if (!row) {
            return;
        }

        const rowCheckbox = row.querySelector(
            'input.lss-bulk-vehicle-checkbox'
        );

        if (!rowCheckbox) {
            return;
        }

        rowCheckbox.checked = !rowCheckbox.checked;

        handleVehicleSelection(
            rowCheckbox,
            event.shiftKey
        );
    });

    elements.selectAll.addEventListener('change', () => {
        if (state.running) {
            return;
        }

        const checked = elements.selectAll.checked;

        elements.tbody
            .querySelectorAll('input.lss-bulk-vehicle-checkbox')
            .forEach(checkbox => {
                checkbox.checked = checked;
            });

        state.lastSelectedIndex = null;

        rebuildSelectedIds();
    });

    // Typenauswahl

    elements.type.addEventListener('change', () => {
        if (!elements.type.value) {
            state.currentVehicles = [];
            state.selectedIds.clear();
            elements.tbody.replaceChildren();
            updateSelectionDisplay();
            return;
        }

        renderVehicleTable(elements.type.value);
    });

    elements.className.addEventListener(
        'input',
        updateStartButton
    );

    let hasSentEditingRequest = false;

    async function throttledFetch(url, options = {}) {


        if (hasSentEditingRequest) {
            await sleep(CONFIG.requestDelay);
        }

        if (state.cancelRequested) {
            throw new Error('__CANCELLED__');
        }

        hasSentEditingRequest = true;

        return fetch(url, options);
    }

    // Fahrzeug bearbeiten
    async function editVehicle(vehicle, customClass) {
        const editUrl =
            `/vehicles/${vehicle.id}/edit`;

        setStatus(
            `${state.processed + 1}/${elements.progress.max}: ` +
            `${vehicle.caption} – Bearbeitungsseite laden …`
        );

        const editResponse = await throttledFetch(editUrl, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        });

        if (!editResponse.ok) {
            throw new Error(
                `Bearbeitungsseite: HTTP ${editResponse.status}`
            );
        }

        const editHtml = await editResponse.text();

        const documentParser = new DOMParser();
        const editDocument = documentParser.parseFromString(
            editHtml,
            'text/html'
        );

        const captionInput =
            editDocument.querySelector(
                '#vehicle_vehicle_type_caption'
            );

        const ignoreDefaultAAO =
            editDocument.querySelector(
                '#vehicle_vehicle_type_ignore_default_aao'
            );

        if (!captionInput) {
            throw new Error(
                'Feld #vehicle_vehicle_type_caption nicht gefunden.'
            );
        }

        if (!ignoreDefaultAAO) {
            throw new Error(
                'Checkbox #vehicle_vehicle_type_ignore_default_aao nicht gefunden.'
            );
        }

        const form =
            captionInput.closest('form') ||
            ignoreDefaultAAO.closest('form');

        if (!form) {
            throw new Error(
                'Fahrzeugformular konnte nicht gefunden werden.'
            );
        }

        if (!captionInput.name) {
            throw new Error(
                'Das Feld für die Fahrzeugklasse besitzt keinen Namen.'
            );
        }

        if (!ignoreDefaultAAO.name) {
            throw new Error(
                'Die AAO-Checkbox besitzt keinen Namen.'
            );
        }

        const formData = new FormData(form);

        // Eigene Fahrzeugklasse
        formData.set(
            captionInput.name,
            customClass
        );

        // "Nur die eigene Fahrzeugklasse in der AAO verwenden"
        formData.set(
            ignoreDefaultAAO.name,
            '1'
        );

        formData.set(
            'commit',
            'Speichern'
        );

        const formAction = new URL(
            form.getAttribute('action') || `/vehicles/${vehicle.id}`,
            location.origin
        );

        const formMethod =
            (form.getAttribute('method') || 'post')
                .toUpperCase();

        setStatus(
            `${state.processed + 1}/${elements.progress.max}: ` +
            `${vehicle.caption} – speichern …`
        );

        const saveResponse = await throttledFetch(
            formAction.href,
            {
                method: formMethod,
                credentials: 'same-origin',
                body: formData,
                redirect: 'follow'
            }
        );

        if (!saveResponse.ok) {
            throw new Error(
                `Speichern: HTTP ${saveResponse.status}`
            );
        }

        if (!saveResponse.redirected) {
            const resultHtml = await saveResponse.text();

            const resultDocument =
                documentParser.parseFromString(
                    resultHtml,
                    'text/html'
                );

            const errorElement =
                resultDocument.querySelector(
                    '.alert-danger, ' +
                    '.field_with_errors, ' +
                    '.has-error, ' +
                    '.invalid-feedback'
                );

            if (errorElement) {
                throw new Error(
                    'Der Server hat nach dem Speichern einen Formularfehler zurückgegeben.'
                );
            }
        }

        return true;
    }

    // UI sperren
    function setRunning(running) {
        state.running = running;

        elements.type.disabled = running;
        elements.className.disabled = running;
        elements.selectAll.disabled = running;

        elements.tbody
            .querySelectorAll('input[type="checkbox"]')
            .forEach(checkbox => {
                checkbox.disabled = running;
            });

        elements.start.style.display =
            running ? 'none' : '';

        elements.cancel.style.display =
            running ? '' : 'none';

        updateStartButton();
    }

    elements.start.addEventListener('click', async () => {
        if (state.running) {
            return;
        }

        const customClass =
            elements.className.value.trim();

        if (!customClass) {
            alert('Bitte eine eigene Fahrzeugklasse eingeben.');
            return;
        }

        const selectedVehicles =
            state.currentVehicles.filter(vehicle =>
                state.selectedIds.has(Number(vehicle.id))
            );

        if (!selectedVehicles.length) {
            alert('Bitte mindestens ein Fahrzeug auswählen.');
            return;
        }

        state.processed = 0;
        state.successful = 0;
        state.failed = 0;
        state.cancelRequested = false;

        hasSentEditingRequest = false;

        elements.progress.max =
            selectedVehicles.length;

        elements.progress.value = 0;

        elements.summary.textContent = '';

        log(
            `Starte Bearbeitung von ${selectedVehicles.length} Fahrzeug(en).`
        );

        log(
            `Neue Fahrzeugklasse: "${customClass}"`
        );

        setRunning(true);

        for (
            let index = 0;
            index < selectedVehicles.length;
            index++
        ) {
            if (state.cancelRequested) {
                break;
            }

            const vehicle = selectedVehicles[index];

            try {
                await editVehicle(
                    vehicle,
                    customClass
                );

                state.successful++;

                log(
                    `OK: ${vehicle.caption} (${vehicle.id})`
                );

            } catch (error) {

                if (
                    error instanceof Error &&
                    error.message === '__CANCELLED__'
                ) {
                    break;
                }

                state.failed++;

                console.error(
                    'Fehler bei Fahrzeug',
                    vehicle,
                    error
                );

                log(
                    `FEHLER: ${vehicle.caption} (${vehicle.id}) – ` +
                    `${error?.message || error}`
                );

            } finally {

                if (!state.cancelRequested) {
                    state.processed++;
                    elements.progress.value =
                        state.processed;
                }

                elements.summary.textContent =
                    `Erfolgreich: ${state.successful} · ` +
                    `Fehler: ${state.failed} · ` +
                    `Bearbeitet: ${state.processed}/${selectedVehicles.length}`;
            }
        }

        setRunning(false);

        if (state.cancelRequested) {
            setStatus(
                `Abgebrochen. ${state.processed}/${selectedVehicles.length} Fahrzeuge bearbeitet.`
            );

            log('Bearbeitung abgebrochen.');

        } else if (state.failed > 0) {
            setStatus(
                `Fertig mit ${state.failed} Fehler(n).`,
                'lss-bulk-error'
            );

            log(
                `Fertig. Erfolgreich: ${state.successful}, Fehler: ${state.failed}.`
            );

        } else {
            setStatus(
                `Fertig. ${state.successful} Fahrzeuge erfolgreich bearbeitet.`,
                'lss-bulk-success'
            );

            log(
                `Alle ${state.successful} Fahrzeuge erfolgreich bearbeitet.`
            );
        }
    });

    // Abbrechen
    elements.cancel.addEventListener('click', () => {
        state.cancelRequested = true;
        elements.cancel.disabled = true;

        setStatus(
            'Abbruch angefordert – laufende Anfrage wird noch beendet …'
        );

        log('Abbruch angefordert.');
    });

    elements.close.addEventListener('click', () => {
        if (state.running) {
            const reallyClose = confirm(
                'Die Bearbeitung läuft noch. Wirklich schließen und abbrechen?'
            );

            if (!reallyClose) {
                return;
            }

            state.cancelRequested = true;
        }

        root.remove();
    });

    // Fahrzeugdaten laden
    try {
        setStatus('Fahrzeuge und Fahrzeugtypen werden geladen …');
        log('Lade Fahrzeugdaten …');

        const [
            vehicles,
            vehicleTypes
        ] = await Promise.all([
            getJson(CONFIG.vehiclesApi, {
                credentials: 'same-origin',
                cache: 'no-store'
            }),

            getJson(CONFIG.vehicleTypesApi, {
                mode: 'cors',
                cache: 'no-store'
            })
        ]);

        if (!Array.isArray(vehicles)) {
            throw new Error(
                'Die Fahrzeug-API hat kein Array zurückgegeben.'
            );
        }

        if (
            !vehicleTypes ||
            typeof vehicleTypes !== 'object'
        ) {
            throw new Error(
                'Die Fahrzeugtyp-API hat ungültige Daten zurückgegeben.'
            );
        }

        state.vehicles = vehicles;
        state.vehicleTypes = vehicleTypes;

        const counts = new Map();

        for (const vehicle of vehicles) {
            const type = Number(vehicle.vehicle_type);

            counts.set(
                type,
                (counts.get(type) || 0) + 1
            );
        }

        const availableTypes =
            [...counts.keys()]
                .map(type => ({
                    type,
                    caption:
                        vehicleTypes[String(type)]?.caption ??
                        `Unbekannter Fahrzeugtyp ${type}`,
                    count: counts.get(type)
                }))
                .sort((a, b) => {
                    const captionCompare =
                        naturalSort(
                            a.caption,
                            b.caption
                        );

                    if (captionCompare !== 0) {
                        return captionCompare;
                    }

                    return a.type - b.type;
                });

        elements.type.replaceChildren();

        const defaultOption =
            document.createElement('option');

        defaultOption.value = '';
        defaultOption.textContent =
            'Fahrzeugtyp auswählen …';

        elements.type.appendChild(defaultOption);

        for (const entry of availableTypes) {
            const option =
                document.createElement('option');

            option.value = String(entry.type);

            option.textContent =
                `${entry.caption} (${entry.count})`;

            elements.type.appendChild(option);
        }

        elements.type.disabled = false;

        elements.tbody.innerHTML = `
            <tr>
                <td colspan="2" class="lss-bulk-muted">
                    Bitte oben einen Fahrzeugtyp auswählen.
                </td>
            </tr>
        `;

        setStatus(
            `${vehicles.length} Fahrzeuge geladen.`
        );

        log(
            `${vehicles.length} Fahrzeuge geladen.`
        );

        log(
            `${availableTypes.length} vorhandene Fahrzeugtypen gefunden.`
        );

    } catch (error) {
        console.error(error);

        setStatus(
            `Fehler beim Laden: ${error?.message || error}`,
            'lss-bulk-error'
        );

        log(
            `FEHLER: ${error?.message || error}`
        );

        elements.type.disabled = true;

        elements.tbody.innerHTML = `
            <tr>
                <td colspan="2" class="lss-bulk-error">
                    Fahrzeugdaten konnten nicht geladen werden.
                </td>
            </tr>
        `;
    }
})();
