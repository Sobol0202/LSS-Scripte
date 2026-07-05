// ==UserScript==
// @name         LSS AAO-Spalten 7 und 8
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0
// @description  Zeigt AAO-Spalten 7 und 8 in Einsätzen und der AAO-Verwaltung an und erweitert die Spaltenauswahl.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/missions/*
// @match        https://www.leitstellenspiel.de/aaos*
// @icon         https://www.leitstellenspiel.de/favicon.ico
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    const API_URL = '/api/v1/aaos';
    const FIRST_EXTRA_COLUMN = 7;
    const LAST_EXTRA_COLUMN = 8;
    const PAGE = detectPage();

    let aaosPromise = null;
    let updateScheduled = false;
    let updateRunning = false;

    addStyles();
    initializePage();

    function detectPage() {
        const path = location.pathname.replace(/\/+$/, '');

        if (/^\/missions\/[^/]+$/.test(path)) {
            return 'mission';
        }

        if (path === '/aaos') {
            return 'management';
        }

        if (/^\/aaos\/(?:new|[^/]+\/(?:edit|copy))$/.test(path)) {
            return 'form';
        }

        return 'other';
    }

    function initializePage() {
        if (PAGE === 'mission' || PAGE === 'management') {
            observeAaoContainer();
            scheduleUpdate();
            return;
        }

        if (PAGE === 'form') {
            extendColumnDropdown();
            observeColumnDropdown();
        }
    }

    function loadAaos() {
        if (!aaosPromise) {
            aaosPromise = fetch(API_URL, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error();
                    }

                    return response.json();
                })
                .then(data => {
                    if (!Array.isArray(data)) {
                        throw new TypeError();
                    }

                    return data;
                })
                .catch(error => {
                    aaosPromise = null;
                    throw error;
                });
        }

        return aaosPromise;
    }

    function observeAaoContainer() {
        const connect = () => {
            const group = document.getElementById('mission-aao-group');

            if (!group) {
                return false;
            }

            const observer = new MutationObserver(scheduleUpdate);

            observer.observe(group, {
                childList: true,
                subtree: true
            });

            scheduleUpdate();
            return true;
        };

        if (connect()) {
            return;
        }

        const waitingObserver = new MutationObserver(() => {
            if (connect()) {
                waitingObserver.disconnect();
            }
        });

        waitingObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function scheduleUpdate() {
        if (updateScheduled) {
            return;
        }

        updateScheduled = true;

        window.setTimeout(() => {
            updateScheduled = false;
            void updateExtraColumns();
        }, 150);
    }

    async function updateExtraColumns() {
        if (updateRunning) {
            return;
        }

        const aaoGroup = document.getElementById('mission-aao-group');

        if (!aaoGroup) {
            return;
        }

        if (
            !document.getElementById('mission_aao_no_category') &&
            !aaoGroup.querySelector('[id^="aao_category_"]')
        ) {
            return;
        }

        updateRunning = true;

        try {
            const allAaos = await loadAaos();

            const extraAaos = allAaos
                .filter(aao => {
                    const column = Number(aao?.column);

                    return (
                        Number.isInteger(column) &&
                        column >= FIRST_EXTRA_COLUMN &&
                        column <= LAST_EXTRA_COLUMN
                    );
                })
                .sort((a, b) => {
                    const categoryA = a.aao_category_id ?? -1;
                    const categoryB = b.aao_category_id ?? -1;

                    return (
                        categoryA - categoryB ||
                        Number(a.column) - Number(b.column) ||
                        String(a.caption ?? '').localeCompare(
                            String(b.caption ?? ''),
                            'de'
                        )
                    );
                });

            const availabilityIds = [];
            const rowsAndMaxColumns = new Map();

            for (const aao of extraAaos) {
                if (aaoAlreadyExists(aao)) {
                    continue;
                }

                const row = findTargetRow(aao);

                if (!row) {
                    continue;
                }

                const columnNumber = Number(aao.column);
                const column = ensureColumn(row, columnNumber);

                if (!column) {
                    continue;
                }

                if (PAGE === 'management') {
                    appendManagementEntry(column, aao);
                } else {
                    const button = createMissionAaoButton(aao);

                    column.append(
                        button,
                        document.createElement('br')
                    );

                    availabilityIds.push(Number(aao.id));
                }

                rowsAndMaxColumns.set(
                    row,
                    Math.max(
                        rowsAndMaxColumns.get(row) ?? 6,
                        columnNumber
                    )
                );
            }

            for (const [row, maxColumn] of rowsAndMaxColumns) {
                prepareExpandedRow(row, maxColumn);
            }

            if (availabilityIds.length > 0) {
                refreshAvailability(availabilityIds);
            }
        } catch {
        } finally {
            updateRunning = false;
        }
    }

    function aaoAlreadyExists(aao) {
        const id = String(Number(aao.id));

        if (PAGE === 'management') {
            return Boolean(
                document.querySelector(
                    `[data-lss-extra-aao-id="${id}"]`
                ) ||
                document.querySelector(
                    `a[href="/aaos/${id}/edit"]`
                )
            );
        }

        return Boolean(document.getElementById(`aao_${id}`));
    }

    function findTargetRow(aao) {
        if (
            aao.aao_category_id === null ||
            aao.aao_category_id === undefined
        ) {
            return document.getElementById('mission_aao_no_category');
        }

        const category = document.getElementById(
            `aao_category_${aao.aao_category_id}`
        );

        if (!category) {
            return null;
        }

        return (
            category.querySelector(':scope > .row') ??
            category.querySelector('.row')
        );
    }

    function ensureColumn(row, requestedColumn) {
        const columns = getDirectColumns(row);

        while (columns.length < requestedColumn) {
            const newColumn = document.createElement('div');

            newColumn.className =
                row.id === 'mission_aao_no_category'
                    ? 'aao-tab active col-sm-2 col-xs-4 lss-extra-aao-column'
                    : 'col-sm-2 col-xs-4 lss-extra-aao-column';

            newColumn.dataset.lssAaoColumn = String(columns.length + 1);

            const insertionPoint = Array.from(row.children).find(
                child =>
                    child.classList.contains('clearfix') ||
                    child.classList.contains('pull-right')
            );

            row.insertBefore(newColumn, insertionPoint ?? null);
            columns.push(newColumn);
        }

        return columns[requestedColumn - 1] ?? null;
    }

    function getDirectColumns(row) {
        return Array.from(row.children).filter(child => {
            if (!(child instanceof HTMLElement)) {
                return false;
            }

            if (
                child.classList.contains('clearfix') ||
                child.classList.contains('pull-right')
            ) {
                return false;
            }

            return (
                child.classList.contains('col-sm-2') ||
                child.classList.contains('lss-extra-aao-column')
            );
        });
    }

    function prepareExpandedRow(row, maxColumn) {
        row.classList.add('lss-expanded-aao-row');

        row.style.setProperty(
            '--lss-aao-column-count',
            String(maxColumn)
        );

        getDirectColumns(row).forEach((column, index) => {
            column.classList.add('lss-expanded-aao-column');
            column.dataset.lssAaoColumn = String(index + 1);
        });
    }

    function createMissionAaoButton(aao) {
        const template = document.querySelector(
            '#mission-aao-group a.aao_btn'
        );

        let button;

        if (template && window.jQuery) {
            button = window.jQuery(template).clone(true, true).get(0);
        } else if (template) {
            button = template.cloneNode(true);
        } else {
            button = document.createElement('a');
        }

        for (const attribute of Array.from(button.attributes)) {
            button.removeAttribute(attribute.name);
        }

        button.replaceChildren();

        const id = Number(aao.id);
        const caption = getCaption(aao);
        const vehicleClasses = isPlainObject(aao.vehicle_classes)
            ? aao.vehicle_classes
            : {};

        const equipmentMode = vehicleClasses.equipment_mode ?? 0;

        button.id = `aao_${id}`;
        button.href = '#';
        button.className =
            'btn btn-xs btn-default aao aao_searchable ' +
            'aao_btn calculate_aao_time lss-extra-aao';

        button.setAttribute('aao_id', String(id));
        button.setAttribute('search_attribute', caption);
        button.setAttribute('title', caption);
        button.setAttribute('accesskey', String(aao.hotkey ?? ''));
        button.setAttribute('reset', String(Boolean(aao.reset)));
        button.setAttribute('building_ids', '');
        button.setAttribute('equipment_mode', String(equipmentMode));
        button.setAttribute(
            'custom',
            JSON.stringify(normalizeObject(aao.custom))
        );
        button.setAttribute('all_ok', 'false');

        for (const [requirement, amount] of Object.entries(vehicleClasses)) {
            if (
                requirement === 'equipment_mode' ||
                amount === null ||
                amount === undefined
            ) {
                continue;
            }

            button.setAttribute(requirement, String(amount));
        }

        if (isPlainObject(aao.vehicle_types)) {
            button.setAttribute(
                'vehicle_type_ids',
                JSON.stringify(aao.vehicle_types)
            );

            button.setAttribute(
                'vehicle_type_captions',
                JSON.stringify(
                    normalizeObject(aao.vehicle_type_captions)
                )
            );
        }

        applyAaoColors(button, aao);

        const availability = document.createElement('span');

        availability.id = `available_aao_${id}`;
        availability.className = 'label label-default';

        const availabilityIcon = document.createElement('span');

        availabilityIcon.id = `available_aao_${id}_icon`;
        availabilityIcon.className = 'glyphicon glyphicon-time';

        availability.append(availabilityIcon);

        const captionElement = document.createElement('span');

        captionElement.textContent = caption;

        button.append(
            availability,
            document.createTextNode(' '),
            captionElement
        );

        return button;
    }

    function appendManagementEntry(column, aao) {
        const id = Number(aao.id);
        const caption = getCaption(aao);

        const selectionWrapper = document.createElement('span');

        selectionWrapper.className = 'aao_mm_wrap';
        selectionWrapper.style.display = 'none';

        const selection = document.createElement('input');

        selection.type = 'checkbox';
        selection.className = 'aao_mm_checkbox';
        selection.style.marginRight = '6px';

        selectionWrapper.append(selection);

        const group = document.createElement('div');

        group.className =
            'btn-group aao_btn_group lss-extra-aao-management';

        group.setAttribute('menu-adjust', 'auto');
        group.dataset.mmPrepared = '1';
        group.dataset.lssExtraAaoId = String(id);

        const editUrl = `/aaos/${encodeURIComponent(id)}/edit`;
        const copyUrl = `/aaos/${encodeURIComponent(id)}/copy`;
        const deleteUrl = `/aaos/${encodeURIComponent(id)}`;

        const mainLink = document.createElement('a');

        mainLink.href = editUrl;
        mainLink.title = caption;
        mainLink.className = 'btn btn-xs btn-default';
        mainLink.setAttribute('role', 'button');
        mainLink.setAttribute('aria-disabled', 'true');
        mainLink.textContent = caption;

        applyAaoColors(mainLink, aao);

        const dropdownButton = document.createElement('button');

        dropdownButton.type = 'button';
        dropdownButton.className =
            'btn btn-default btn-xs dropdown-toggle';

        dropdownButton.setAttribute('data-toggle', 'dropdown');
        dropdownButton.setAttribute('aria-haspopup', 'true');
        dropdownButton.setAttribute('aria-expanded', 'false');

        applyAaoColors(dropdownButton, aao);

        const caret = document.createElement('span');

        caret.className = 'caret';

        dropdownButton.append(caret);

        const menu = document.createElement('ul');

        menu.className = 'dropdown-menu';

        menu.append(
            createManagementMenuItem(
                editUrl,
                'glyphicon-edit',
                'Bearbeiten'
            ),
            createManagementMenuItem(
                copyUrl,
                'glyphicon-copy',
                'Kopieren'
            ),
            createSeparator(),
            createManagementMenuItem(
                deleteUrl,
                'glyphicon-trash',
                'Löschen',
                true
            )
        );

        group.append(mainLink, dropdownButton, menu);

        column.append(
            selectionWrapper,
            group,
            document.createElement('br')
        );
    }

    function createManagementMenuItem(
        url,
        iconClass,
        label,
        isDelete = false
    ) {
        const item = document.createElement('li');
        const link = document.createElement('a');

        link.href = url;

        if (isDelete) {
            link.setAttribute('data-method', 'delete');
            link.setAttribute('rel', 'nofollow');
        }

        const icon = document.createElement('span');

        icon.className = `glyphicon ${iconClass}`;
        icon.textContent = ` ${label}`;

        link.append(icon);
        item.append(link);

        return item;
    }

    function createSeparator() {
        const separator = document.createElement('li');

        separator.setAttribute('role', 'separator');
        separator.className = 'divider';

        return separator;
    }

    function refreshAvailability(ids, attempt = 0) {
        if (typeof window.aao_available !== 'function') {
            if (attempt < 20) {
                window.setTimeout(() => {
                    refreshAvailability(ids, attempt + 1);
                }, 250);
            }

            return;
        }

        const calculateTime = Boolean(
            document.querySelector('.aao_timer')
        );

        for (const id of ids) {
            try {
                window.aao_available(id, calculateTime);
            } catch {
            }
        }
    }

    function extendColumnDropdown() {
        const select = document.getElementById('aao_column_number');

        if (!(select instanceof HTMLSelectElement)) {
            return false;
        }

        for (
            let value = FIRST_EXTRA_COLUMN;
            value <= LAST_EXTRA_COLUMN;
            value++
        ) {
            if (select.querySelector(`option[value="${value}"]`)) {
                continue;
            }

            const option = document.createElement('option');

            option.value = String(value);
            option.textContent = String(value);

            select.append(option);
        }

        return true;
    }

    function observeColumnDropdown() {
        if (extendColumnDropdown()) {
            return;
        }

        const observer = new MutationObserver(() => {
            if (extendColumnDropdown()) {
                observer.disconnect();
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    function applyAaoColors(element, aao) {
        const backgroundColor = normalizeHexColor(aao.color);
        const textColor = normalizeHexColor(aao.text_color);

        if (!backgroundColor) {
            return;
        }

        element.style.textShadow = 'none';
        element.style.backgroundColor = backgroundColor;
        element.style.backgroundImage = 'none';

        if (textColor) {
            element.style.color = textColor;
        }
    }

    function getCaption(aao) {
        const id = Number(aao.id);

        return String(aao.caption ?? `AAO ${id}`);
    }

    function normalizeHexColor(value) {
        const color = String(value ?? '')
            .trim()
            .replace(/^#/, '');

        return /^[0-9a-f]{6}$/i.test(color)
            ? `#${color}`
            : '';
    }

    function isPlainObject(value) {
        return (
            value !== null &&
            typeof value === 'object' &&
            !Array.isArray(value)
        );
    }

    function normalizeObject(value) {
        return isPlainObject(value) ? value : {};
    }

    function addStyles() {
        if (
            document.getElementById(
                'lss-extra-aao-columns-style'
            )
        ) {
            return;
        }

        const style = document.createElement('style');

        style.id = 'lss-extra-aao-columns-style';

        style.textContent = `
            #mission-aao-group .lss-extra-aao,
            #mission-aao-group .lss-extra-aao-management {
                max-width: 100%;
            }

            @media (min-width: 768px) {
                #mission-aao-group .lss-expanded-aao-row {
                    display: flex;
                    flex-wrap: wrap;
                }

                #mission-aao-group
                .lss-expanded-aao-row
                > .lss-expanded-aao-column {
                    float: none !important;
                    width: calc(
                        100% /
                        var(--lss-aao-column-count)
                    ) !important;
                    flex: 0 0 calc(
                        100% /
                        var(--lss-aao-column-count)
                    );
                    min-width: 0;
                }

                #mission-aao-group
                .lss-expanded-aao-row
                > .clearfix {
                    display: none;
                }

                #mission-aao-group
                .lss-expanded-aao-row
                > .pull-right {
                    flex: 0 0 100%;
                    margin-left: auto;
                }
            }
        `;

        document.head.append(style);
    }
})();
