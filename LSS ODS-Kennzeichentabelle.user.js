// ==UserScript==
// @name         LSS ODS-Kennzeichentabelle
// @version      1.0
// @description  ODS importieren, Kennzeichen mit Strg+< einfügen und Restbestand als ODS exportieren.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/*
// @run-at       document-idle
// @require      https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_getResourceURL
// ==/UserScript==

(() => {
    'use strict';

    const STORAGE_KEY = 'kennzeichentabelle_queue';
    const MENU_ID = 'lss-kennzeichentabelle-split';

    let queue = GM_getValue(STORAGE_KEY, []);
    if (!Array.isArray(queue)) queue = [];
    queue = queue.map(String).filter(Boolean);

    let countBadge = null;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.ods,application/vnd.oasis.opendocument.spreadsheet';
    fileInput.hidden = true;
    document.body.append(fileInput);

    function saveQueue() {
        GM_setValue(STORAGE_KEY, queue);

        if (countBadge) {
            countBadge.textContent = String(queue.length);
            countBadge.title = `${queue.length} Kennzeichen verbleibend`;
        }
    }

    function showMessage(message, type = 'info') {
        document.getElementById('lss-kennzeichentabelle-message')?.remove();

        const box = document.createElement('div');
        box.id = 'lss-kennzeichentabelle-message';
        box.className = `alert alert-${type}`;
        box.textContent = message;

        Object.assign(box.style, {
            position: 'fixed',
            top: '70px',
            right: '20px',
            zIndex: '100000',
            maxWidth: '420px',
            boxShadow: '0 2px 8px rgba(0,0,0,.25)'
        });

        document.body.append(box);
        setTimeout(() => box.remove(), 2800);
    }

    async function importOds(file) {
        const workbook = XLSX.read(await file.arrayBuffer());
        const sheetName = workbook.SheetNames[0];

        if (!sheetName) {
            throw new Error('Die ODS-Datei enthält kein Tabellenblatt.');
        }

        const rows = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheetName],
            {
                header: 1,
                raw: false,
                defval: ''
            }
        );

        const imported = rows
            .map(row => String(row?.[0] ?? '').trim())
            .filter(Boolean);

        if (!imported.length) {
            throw new Error(
                'In Spalte A wurden keine Kennzeichen gefunden.'
            );
        }

        queue = imported;

        saveQueue();

        showMessage(
            `${queue.length} Kennzeichen importiert.`,
            'success'
        );
    }

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files?.[0];

        if (!file) {
            return;
        }

        try {
            await importOds(file);
        } catch (error) {
            console.error(
                '[kennzeichentabelle] Importfehler:',
                error
            );

            showMessage(
                `Import fehlgeschlagen: ${error?.message ?? error}`,
                'danger'
            );
        } finally {

            fileInput.value = '';
        }
    });

    function exportOds() {
        try {

            const rows = queue.length
                ? queue.map(value => [value])
                : [['']];

            const worksheet =
                XLSX.utils.aoa_to_sheet(rows);

            const workbook =
                XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                'kennzeichentabelle'
            );

            const data = XLSX.write(
                workbook,
                {
                    bookType: 'ods',
                    type: 'array'
                }
            );

            const blob = new Blob(
                [data],
                {
                    type: 'application/vnd.oasis.opendocument.spreadsheet'
                }
            );

            const now = new Date();

            const pad = number =>
                String(number).padStart(2, '0');

            const filename =
                `kennzeichentabelle_restbestand_` +
                `${now.getFullYear()}-` +
                `${pad(now.getMonth() + 1)}-` +
                `${pad(now.getDate())}_` +
                `${pad(now.getHours())}-` +
                `${pad(now.getMinutes())}.ods`;

            const url =
                URL.createObjectURL(blob);

            const link =
                document.createElement('a');

            link.href = url;
            link.download = filename;

            document.body.append(link);

            link.click();
            link.remove();

            setTimeout(
                () => URL.revokeObjectURL(url),
                1000
            );

            showMessage(
                `${queue.length} verbleibende Kennzeichen exportiert.`,
                'info'
            );

        } catch (error) {

            console.error(
                '[kennzeichentabelle] Exportfehler:',
                error
            );

            showMessage(
                `Export fehlgeschlagen: ${error?.message ?? error}`,
                'danger'
            );
        }
    }

function createMenuButton() {
    if (document.getElementById(MENU_ID)) return;

    const divider = document.querySelector(
        '#menu_profile + .dropdown-menu > li.divider'
    );

    if (!divider) return;

    const triggerLi = document.createElement('li');
    triggerLi.id = MENU_ID;

    triggerLi.style.display = 'flex';
    triggerLi.style.alignItems = 'stretch';

    const importA = document.createElement('a');

    importA.href = '#';
    importA.title = 'ODS-kennzeichentabelle importieren';

    importA.style.flex = '1 1 50%';
    importA.style.width = '50%';
    importA.style.boxSizing = 'border-box';
    importA.style.display = 'flex';
    importA.style.alignItems = 'center';
    importA.style.minWidth = '0';


    const triggerImg = document.createElement('img');

    let iconUrl = '';

    try {
        iconUrl = GM_getResourceURL('icon') || '';
    } catch (_) {}

    triggerImg.src =
        iconUrl ||
        'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23555" d="M11 3h2v10.17l3.59-3.58L18 11l-6 6-6-6 1.41-1.41L11 13.17V3zM5 19h14v2H5z"/%3E%3C/svg%3E';

    triggerImg.width = 24;
    triggerImg.height = 24;
    triggerImg.alt = '';

    countBadge = document.createElement('span');

    countBadge.style.marginLeft = '5px';
    countBadge.style.fontSize = '11px';
    countBadge.style.opacity = '0.75';

    importA.append(
        triggerImg,
        '\xa0Import',
        countBadge
    );


    const exportA = document.createElement('a');

    exportA.href = '#';
    exportA.title = 'Restbestand als ODS exportieren';
    exportA.textContent = 'Export';

    exportA.style.flex = '1 1 50%';
    exportA.style.width = '50%';
    exportA.style.boxSizing = 'border-box';
    exportA.style.display = 'flex';
    exportA.style.alignItems = 'center';
    exportA.style.justifyContent = 'center';
    exportA.style.minWidth = '0';

    exportA.style.boxShadow =
        'inset 1px 0 rgba(127, 127, 127, 0.25)';


    importA.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();

        fileInput.value = '';
        fileInput.click();
    });


    exportA.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();

        exportOds();
    });


    triggerLi.append(
        importA,
        exportA
    );

    divider.before(triggerLi);

    saveQueue();
}

    function isShortcut(event) {

        return (
            event.ctrlKey &&
            !event.altKey &&
            !event.metaKey &&
            (
                event.key === '<' ||
                event.code === 'IntlBackslash'
            )
        );
    }

    function getEditableTarget() {

        const element =
            document.activeElement;

        if (
            element instanceof
            HTMLTextAreaElement
        ) {

            return (
                !element.disabled &&
                !element.readOnly
            )
                ? element
                : null;
        }


        if (
            element instanceof
            HTMLInputElement
        ) {

            const allowedTypes =
                new Set([
                    'text',
                    'search',
                    'url',
                ]);

            return (
                !element.disabled &&
                !element.readOnly &&
                allowedTypes.has(element.type)
            )
                ? element
                : null;
        }

        if (
            element instanceof HTMLElement &&
            element.isContentEditable
        ) {
            return element;
        }

        return null;
    }

    function beforeInput(
        target,
        text
    ) {

        try {

            return target.dispatchEvent(
                new InputEvent(
                    'beforeinput',
                    {
                        bubbles: true,
                        cancelable: true,
                        inputType:
                            'insertFromPaste',
                        data: text
                    }
                )
            );

        } catch (_) {

            return true;
        }
    }

    function inputEvent(
        target,
        text
    ) {

        try {

            target.dispatchEvent(
                new InputEvent(
                    'input',
                    {
                        bubbles: true,
                        inputType:
                            'insertFromPaste',
                        data: text
                    }
                )
            );

        } catch (_) {

            target.dispatchEvent(
                new Event(
                    'input',
                    {
                        bubbles: true
                    }
                )
            );
        }
    }

    function insertText(
        target,
        text
    ) {

        target.focus();

        if (!beforeInput(target, text)) {
            return false;
        }

        if (
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement
        ) {

            const start =
                target.selectionStart ??
                target.value.length;

            const end =
                target.selectionEnd ??
                start;

            target.setRangeText(
                text,
                start,
                end,
                'end'
            );

            inputEvent(
                target,
                text
            );

            return true;
        }

        if (target.isContentEditable) {

            const selection =
                window.getSelection();

            if (!selection) {
                return false;
            }

            let range;

            if (
                selection.rangeCount &&
                target.contains(
                    selection.anchorNode
                )
            ) {

                range =
                    selection.getRangeAt(0);

            } else {

                range =
                    document.createRange();

                range.selectNodeContents(
                    target
                );

                range.collapse(false);
            }

            range.deleteContents();

            const node =
                document.createTextNode(text);

            range.insertNode(node);

            range.setStartAfter(node);
            range.collapse(true);

            selection.removeAllRanges();
            selection.addRange(range);

            inputEvent(
                target,
                text
            );

            return true;
        }

        return false;
    }

    window.addEventListener(
        'keydown',
        event => {

            if (!isShortcut(event)) {
                return;
            }

            event.preventDefault();
            event.stopImmediatePropagation();

            if (event.repeat) {
                return;
            }

            if (!queue.length) {

                showMessage(
                    'Die kennzeichentabelle ist leer. ' +
                    'Bitte zuerst eine ODS-Datei importieren.',
                    'warning'
                );

                return;
            }


            const target =
                getEditableTarget();

            if (!target) {

                showMessage(
                    'Bitte zuerst das gewünschte Eingabefeld anklicken.',
                    'warning'
                );

                return;
            }

            const value =
                queue[0];

            if (
                insertText(
                    target,
                    value
                )
            ) {

                queue.shift();

                saveQueue();

                showMessage(
                    `„${value}“ eingefügt – ` +
                    `${queue.length} verbleibend.`,
                    'success'
                );
            }

        },
        true
    );


    createMenuButton();

    new MutationObserver(() => {

        if (
            !document.getElementById(
                MENU_ID
            )
        ) {
            createMenuButton();
        }

    }).observe(
        document.documentElement,
        {
            childList: true,
            subtree: true
        }
    );

})();
