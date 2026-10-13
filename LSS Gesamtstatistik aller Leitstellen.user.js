// ==UserScript==
// @name         LSS Gesamtstatistik aller Leitstellen
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0
// @author       Sobol
// @description  Summiert die Statistiktabellen aller Leitstellen auf der Hauptleitstelle.
// @match        https://www.leitstellenspiel.de/buildings/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    if (window.name === 'lss-gesamtstatistik-abfrage') return;

    const idMatch = location.pathname.match(/^\/buildings\/(\d+)\/?$/);
    if (!idMatch) return;
    const currentBuildingId = idMatch[1];

    async function waitFor(check, description, timeout = 8000) {
        const deadline = Date.now() + timeout;
        let lastError = null;
        while (Date.now() < deadline) {
            try {
                const value = check();
                if (value) return value;
            } catch (error) {
                lastError = error;
            }
            await new Promise(resolve => setTimeout(resolve, 250));
        }
        throw new Error(`${description} konnte nicht geladen werden.${lastError ? ` (${lastError.message})` : ''}`);
    }

    function normalizeText(value) {
        return (value || '').replace(/\s+/g, ' ').trim();
    }

    function sectionName(table) {
        let heading = table.previousElementSibling;
        while (heading && !/^H[1-6]$/.test(heading.tagName)) {
            heading = heading.previousElementSibling;
        }
        return heading ? normalizeText(heading.textContent) : '';
    }

    function readStatistics(page) {
        const statisticsTab = page.querySelector('#tab_stats');
        const tables = statisticsTab
            ? [...statisticsTab.querySelectorAll('table.stats-table')]
            : [];

        if (!statisticsTab || tables.length < 3) {
            throw new Error(`Statistik-Tabellen fehlen (gefunden: ${tables.length}).`);
        }

        const sections = new Map();
        let numericRows = 0;

        for (const table of tables) {
            const category = sectionName(table);
            if (!category || sections.has(category) || !table.tBodies.length) {
                throw new Error('Statistik-Tabellen sind unvollständig oder uneindeutig.');
            }

            const entries = new Map();
            for (const row of table.tBodies[0].rows) {
                if (row.cells.length === 0) continue;
                if (row.cells.length < 2) {
                    throw new Error(`Unvollständige Tabellenzeile in „${category}“.`);
                }

                const label = normalizeText(row.cells[0].textContent);
                if (!label) continue;

                const raw = normalizeText(row.cells[1].textContent).replace(/[\s.]/g, '');
                if (!/^\d+$/.test(raw)) {
                    throw new Error(`Ungültiger Wert in „${category} / ${label}“.`);
                }

                const count = Number(raw);
                if (!Number.isSafeInteger(count)) {
                    throw new Error(`Zu großer Wert in „${category} / ${label}“.`);
                }

                const next = (entries.get(label) || 0) + count;
                if (!Number.isSafeInteger(next)) {
                    throw new Error(`Zählerüberlauf in „${category} / ${label}“.`);
                }
                entries.set(label, next);
                numericRows++;
            }

            sections.set(category, entries);
        }

        if (numericRows === 0) {
            throw new Error('Statistiktabellen enthalten keine Zahlen.');
        }
        return sections;
    }

    function addStatistics(totals, statistics) {
        for (const [category, rows] of statistics) {
            if (!totals.has(category)) totals.set(category, new Map());
            const categoryTotals = totals.get(category);

            for (const [label, value] of rows) {
                const sum = (categoryTotals.get(label) || 0) + value;
                if (!Number.isSafeInteger(sum)) {
                    throw new Error(`Zählerüberlauf in „${category} / ${label}“.`);
                }
                categoryTotals.set(label, sum);
            }
        }
    }

    function fillTable(table, values) {
        const body = table.tBodies[0];
        if (!body) throw new Error('Die Tabellenvorlage hat keinen Tabellenkörper.');

        const shown = new Set();
        for (const row of [...body.rows]) {
            if (row.cells.length < 2) {
                row.remove();
                continue;
            }

            const label = normalizeText(row.cells[0].textContent);
            if (!label || shown.has(label)) {
                row.remove();
                continue;
            }

            row.cells[1].textContent = (values.get(label) || 0).toLocaleString('de-DE');
            shown.add(label);
        }

        for (const [label, value] of values) {
            if (shown.has(label)) continue;

            const row = document.createElement('tr');
            const nameCell = document.createElement('td');
            const valueCell = document.createElement('td');
            nameCell.textContent = label;
            valueCell.textContent = value.toLocaleString('de-DE');
            valueCell.className = body.querySelector('tr td:nth-child(2)')?.className || '';
            row.append(nameCell, valueCell);
            body.appendChild(row);
        }
    }

    function buildResults(tab, totals) {
        const exampleTable = tab.querySelector('table.stats-table');
        const exampleRow = exampleTable?.closest('.row');
        if (!exampleRow) {
            throw new Error('Die originale Statistik-Vorlage ist nicht vorhanden.');
        }

        const clone = exampleRow.cloneNode(true);
        clone.removeAttribute('id');
        clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));

        const displayedCategories = new Set();
        for (const table of clone.querySelectorAll('table.stats-table')) {
            const category = sectionName(table);
            if (!category) throw new Error('Überschrift in der Tabellenvorlage fehlt.');
            displayedCategories.add(category);
            fillTable(table, totals.get(category) || new Map());
        }

        const columns = clone.querySelectorAll('.col-sm-6');
        for (const [category, values] of totals) {
            if (displayedCategories.has(category)) continue;
            const target = /fahrzeug|personal/i.test(category)
                ? (columns[1] || clone)
                : (columns[0] || clone);

            const heading = document.createElement('h3');
            heading.textContent = category;
            const table = document.createElement('table');
            table.className = 'table table-striped tablesorter stats-table';
            table.innerHTML = '<thead><tr><th>Name</th><th class="stats-column"></th></tr></thead><tbody></tbody>';
            target.append(heading, table);
            fillTable(table, values);
        }

        return clone;
    }

    let wrapper = null;

    function createInterface() {
        wrapper = document.createElement('div');
        wrapper.id = 'lss-gesamtstatistik';
        wrapper.style.marginTop = '24px';

        const divider = document.createElement('hr');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-primary';
        button.textContent = 'Gesamtstatistik abfragen';

        const message = document.createElement('div');
        message.setAttribute('role', 'status');
        message.style.marginTop = '12px';
        message.hidden = true;

        const result = document.createElement('div');
        result.hidden = true;

        wrapper.append(divider, button, message, result);

        function showMessage(text, type) {
            message.hidden = false;
            message.className = `alert alert-${type}`;
            message.textContent = text;
        }

        button.addEventListener('click', async () => {
            button.disabled = true;
            result.hidden = true;
            result.replaceChildren();

            const totals = new Map();
            let station = null;

            try {
                const selector = document.getElementById('user_leitstelle_building_id');
                if (!selector || selector.value !== currentBuildingId) {
                    throw new Error('Die Hauptleitstelle ist nicht mehr ausgewählt.');
                }
                const stations = [...new Map(
                    [...selector.options]
                        .filter(option => /^\d+$/.test(option.value))
                        .map(option => [option.value, {
                            id: option.value,
                            name: normalizeText(option.textContent) || option.value
                        }])
                ).values()];

                if (!stations.length || !stations.some(item => item.id === currentBuildingId)) {
                    throw new Error('Die Leitstellen-Auswahl ist unvollständig.');
                }

                for (let i = 0; i < stations.length; i++) {
                    station = stations[i];

                    if (i > 0) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }

                    showMessage(
                        `Lade Leitstelle ${i + 1} von ${stations.length}: ${station.name} …`,
                        'info'
                    );

                    const frame = document.createElement('iframe');
                    frame.name = 'lss-gesamtstatistik-abfrage';
                    frame.title = `Statistikabfrage ${station.name}`;
                    frame.setAttribute('aria-hidden', 'true');
                    frame.tabIndex = -1;
                    Object.assign(frame.style, {
                        position: 'fixed',
                        top: '0',
                        left: '0',
                        width: '1280px',
                        height: '900px',
                        opacity: '0',
                        pointerEvents: 'none',
                        zIndex: '-2147483647',
                        border: '0'
                    });

                    try {
                        const loaded = new Promise((resolve, reject) => {
                            const timeout = setTimeout(() => {
                                cleanup();
                                reject(new Error(`Ladezeit fuer ${station.name} ueberschritten.`));
                            }, 30000);
                            function cleanup() {
                                clearTimeout(timeout);
                                frame.removeEventListener('load', onLoad);
                                frame.removeEventListener('error', onError);
                            }
                            function onLoad() {
                                cleanup();
                                resolve();
                            }
                            function onError() {
                                cleanup();
                                reject(new Error(`Seite von ${station.name} konnte nicht geladen werden.`));
                            }
                            frame.addEventListener('load', onLoad);
                            frame.addEventListener('error', onError);
                        });
                        frame.src = `/buildings/${station.id}`;
                        document.body.appendChild(frame);
                        await loaded;

                        let page;
                        try {
                            if (frame.contentWindow.location.pathname.replace(/\/$/, '') !== `/buildings/${station.id}`) {
                                throw new Error(`Unerwartete Weiterleitung bei ${station.name}.`);
                            }
                            page = frame.contentDocument;
                        } catch (error) {
                            throw new Error(`Leitstellenseite von ${station.name} ist nicht zugänglich: ${error.message}`);
                        }
                        if (!page) throw new Error(`Das Dokument von ${station.name} ist nicht verfuegbar.`);

                        const tabLink = await waitFor(() => {
                            const candidates = [...page.querySelectorAll('a, button, [role="tab"]')];
                            return candidates.find(element => {
                                const href = element.getAttribute('href') || '';
                                const target = element.getAttribute('data-target') ||
                                    element.getAttribute('data-bs-target') || '';
                                return href === '#tab_stats' ||
                                    href.endsWith('#tab_stats') ||
                                    target === '#tab_stats' ||
                                    element.getAttribute('aria-controls') === 'tab_stats';
                            });
                        }, `Statistik-Reiter bei ${station.name}`);

                        showMessage(
                            `Öffne Statistik-Reiter: ${station.name} (${i + 1}/${stations.length}) …`,
                            'info'
                        );
                        tabLink.click();

                        await new Promise(resolve => setTimeout(resolve, 1000));

                        const statistics = readStatistics(page);
                        addStatistics(totals, statistics);
                    } finally {
                        frame.remove();
                    }
                }

                const tab = wrapper.closest('#tab_stats');
                if (!tab) {
                    throw new Error('Der Statistik-Tab ist nicht mehr vorhanden.');
                }
                const title = document.createElement('h3');
                title.textContent = `Gesamtstatistik aller ${stations.length} Leitstellen`;
                result.append(title, buildResults(tab, totals));
                result.hidden = false;
                showMessage(`Gesamtstatistik aus ${stations.length} Leitstellen erfolgreich erstellt.`, 'success');
            } catch {
                result.replaceChildren();
                result.hidden = true;
                showMessage(
                    `Abfrage abgebrochen${station ? ` bei „${station.name}“` : ''}. ` +
                    'Die Statistik konnte nicht vollständig geladen werden. ' +
                    'Bitte stelle das Leitstellenladeverhalten in den Einstellungen auf ' +
                    '„Standard“ oder „Lazy Loading“.',
                    'danger'
                );
            } finally {
                button.disabled = false;
            }
        });
    }

    function ensureInterface() {
        const selector = document.getElementById('user_leitstelle_building_id');

        if (!selector) {
            if (wrapper?.isConnected) {
                wrapper.remove();
            }
            return;
        }

        if (selector.value !== currentBuildingId) {
            if (wrapper?.isConnected) {
                wrapper.remove();
            }
            return;
        }

        const tab = document.getElementById('tab_stats');
        if (!tab) {
            if (wrapper?.isConnected) {
                wrapper.remove();
            }
            return;
        }

        const originalTables = [...tab.querySelectorAll('table.stats-table')]
            .filter(table => !table.closest('#lss-gesamtstatistik'));

        const lastTable = originalTables[originalTables.length - 1];
        let anchor = lastTable || null;
        while (anchor?.parentElement && anchor.parentElement !== tab) {
            anchor = anchor.parentElement;
        }
        if (anchor?.parentElement !== tab) anchor = null;

        if (!wrapper) createInterface();

        const needsPlacement = anchor
            ? wrapper.parentElement !== tab || wrapper.previousElementSibling !== anchor
            : wrapper.parentElement !== tab || wrapper !== tab.lastElementChild;
        if (needsPlacement) {
            if (anchor) anchor.after(wrapper);
            else tab.appendChild(wrapper);
        }
    }

    const observer = new MutationObserver(ensureInterface);
    document.addEventListener('change', event => {
        if (event.target?.id === 'user_leitstelle_building_id') {
            ensureInterface();
        }
    });

    setTimeout(() => {
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'hidden', 'disabled', 'selected']
        });
        ensureInterface();
    }, 1000);
})();
