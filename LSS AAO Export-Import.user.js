// ==UserScript==
// @name         LSS AAO Export/Import
// @version      1.1
// @description  Ermöglicht ein echtes Exportieren und Importieren von AAOs
// @author       Sobol
// @match        https://www.leitstellenspiel.de/aaos
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        listPage: 'https://www.leitstellenspiel.de/aaos',
        newPage: 'https://www.leitstellenspiel.de/aaos/new',
        createUrl: 'https://www.leitstellenspiel.de/aaos',
        delayMs: 100,
        exportFilenamePrefix: 'leitstellenspiel-aao-export',
    };

    const IMPORT_DECISIONS = new Map();

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function downloadTextFile(filename, text, mime = 'application/json;charset=utf-8') {
        const blob = new Blob([text], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function parseHtml(html) {
        return new DOMParser().parseFromString(html, 'text/html');
    }

    function getCsrfToken(doc = document) {
        return doc.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    }

    function showError(msg) {
        alert(`AAO Import/Export Fehler:\n\n${msg}`);
    }

    function showInfo(msg) {
        alert(msg);
    }

    function formatDateForFilename() {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}`;
    }

    function cssEscapeValue(value) {
        if (window.CSS && typeof window.CSS.escape === 'function') {
            return window.CSS.escape(value);
        }
        return String(value).replace(/["\\]/g, '\\$&');
    }

    function createProgressUI() {
        const wrap = document.createElement('div');
        wrap.id = 'tm-aao-progress-wrap';
        wrap.style.position = 'fixed';
        wrap.style.right = '20px';
        wrap.style.bottom = '20px';
        wrap.style.width = '420px';
        wrap.style.background = '#fff';
        wrap.style.border = '1px solid #999';
        wrap.style.borderRadius = '8px';
        wrap.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
        wrap.style.padding = '12px';
        wrap.style.zIndex = '999999';

        wrap.innerHTML = `
            <div style="font-weight:bold;margin-bottom:8px;" id="tm-aao-progress-title">AAO Import/Export</div>
            <div style="font-size:12px;margin-bottom:8px;white-space:pre-wrap;" id="tm-aao-progress-text">Bereit</div>
            <div style="width:100%;height:16px;background:#eee;border-radius:8px;overflow:hidden;">
                <div id="tm-aao-progress-bar" style="height:100%;width:0%;background:#5cb85c;transition:width 0.1s ease;"></div>
            </div>
            <div style="font-size:12px;margin-top:6px;" id="tm-aao-progress-count">0 / 0</div>
        `;

        document.body.appendChild(wrap);

        return {
            set(title, text, current, total, percent) {
                wrap.querySelector('#tm-aao-progress-title').textContent = title;
                wrap.querySelector('#tm-aao-progress-text').textContent = text;
                wrap.querySelector('#tm-aao-progress-count').textContent = `${current} / ${total}`;
                wrap.querySelector('#tm-aao-progress-bar').style.width = `${percent}%`;
            },
            done(title, text) {
                wrap.querySelector('#tm-aao-progress-title').textContent = title;
                wrap.querySelector('#tm-aao-progress-text').textContent = text;
                wrap.querySelector('#tm-aao-progress-count').textContent = '';
                wrap.querySelector('#tm-aao-progress-bar').style.width = '100%';
            },
            remove() {
                wrap.remove();
            }
        };
    }

    function normalizeProblemSignature(problem) {
        return String(problem || '').trim();
    }

    function getStoredDecisionForProblems(problems) {
        const signatures = (problems || []).map(normalizeProblemSignature);
        const decisions = signatures
            .map(sig => IMPORT_DECISIONS.get(sig))
            .filter(Boolean);

        if (!decisions.length) return null;
        if (decisions.includes('abort_all')) return 'abort_all';
        if (decisions.includes('skip_aao')) return 'skip_aao';
        if (decisions.includes('skip_missing_and_continue')) return 'skip_missing_and_continue';
        return null;
    }

    function storeDecisionForProblems(problems, decision) {
        for (const problem of (problems || [])) {
            const signature = normalizeProblemSignature(problem);
            IMPORT_DECISIONS.set(signature, decision);
        }
    }

    function splitProblemsByKnownDecision(problems) {
        const known = [];
        const unknown = [];

        for (const problem of (problems || [])) {
            const signature = normalizeProblemSignature(problem);
            const decision = IMPORT_DECISIONS.get(signature);

            if (decision) {
                known.push({ problem, decision });
            } else {
                unknown.push(problem);
            }
        }

        return { known, unknown };
    }

    function mergeDecisionFromKnownAndNew(knownProblems, newDecision) {
        const knownDecisions = (knownProblems || []).map(x => x.decision);

        if (knownDecisions.includes('abort_all') || newDecision === 'abort_all') {
            return 'abort_all';
        }

        if (knownDecisions.includes('skip_aao') || newDecision === 'skip_aao') {
            return 'skip_aao';
        }

        if (knownDecisions.includes('skip_missing_and_continue') || newDecision === 'skip_missing_and_continue') {
            return 'skip_missing_and_continue';
        }

        return null;
    }

    function askImportConflictDecision(aaoData, problems) {
        const aaoName = aaoData.listTitle || aaoData.sourceUrl || 'Unbekannte AAO';
        const { known, unknown } = splitProblemsByKnownDecision(problems);

        if (!unknown.length) {
            return mergeDecisionFromKnownAndNew(known, null);
        }

        let knownInfo = '';
        if (known.length) {
            knownInfo =
                `Bereits bekannte Entscheidungen für andere Probleme dieser AAO:\n` +
                known.map((k, i) => `${i + 1}. ${k.problem} => ${k.decision}`).join('\n') +
                `\n\n`;
        }

        const message =
            `Beim Import der AAO "${aaoName}" wurden neue Probleme gefunden:\n\n` +
            unknown.map((p, i) => `${i + 1}. ${p}`).join('\n') +
            `\n\n` +
            knownInfo +
            `Die jetzt getroffene Entscheidung wird für genau diese Fehler künftig automatisch wiederverwendet.\n\n` +
            `Ja = Diese AAO trotzdem importieren, jedoch ohne fehlendes Element\n` +
            `Abbrechen = Diese AAO nicht importieren oder kompletten Import abbrechen`;

        const first = window.confirm(message);

        let newDecision;
        if (first === true) {
            newDecision = 'skip_missing_and_continue';
        } else {
            const second = window.confirm(
                `Soll diese AAO übersprungen werden?\n\n` +
                `Ja = Diese AAO nicht importieren\n` +
                `Abbrechen = Kompletter Import abbrechen`
            );

            newDecision = second ? 'skip_aao' : 'abort_all';
        }

        storeDecisionForProblems(unknown, newDecision);
        return mergeDecisionFromKnownAndNew(known, newDecision);
    }

    function getAaoEditLinksFromListPage(doc = document) {
        const candidates = [...doc.querySelectorAll('a.btn.btn-xs.btn-default[href^="/aaos/"][href$="/edit"]')];
        const seen = new Set();

        return candidates
            .map(a => {
                const text = (a.textContent || '').trim();
                const title = (a.getAttribute('title') || '').trim();
                return { a, text, title };
            })
            .filter(({ a, text, title }) => {
                if (/^bearbeiten$/i.test(text)) return false;
                if (/^edit$/i.test(text)) return false;
                if (a.getAttribute('role') !== 'button') return false;
                if (!(text || title)) return false;
                return true;
            })
            .map(({ a, text, title }) => ({
                title: text || title || '',
                url: new URL(a.getAttribute('href'), location.origin).href
            }))
            .filter(item => {
                if (seen.has(item.url)) return false;
                seen.add(item.url);
                return true;
            });
    }

    function findAaoForm(doc) {
        return doc.querySelector('form[action="/aaos"], form[action^="/aaos/"]');
    }

function collectFormDataFromDoc(doc, sourceUrl = '') {
    const form = findAaoForm(doc);
    if (!form) {
        throw new Error(`Kein AAO-Formular gefunden: ${sourceUrl}`);
    }

    const result = {
        sourceUrl,
        meta: {
            exportedAt: new Date().toISOString(),
            pageTitle: doc.title || ''
        },
        fields: [],
        selectFields: [],
        checkboxFields: []
    };

    const allElements = [...form.querySelectorAll('input, textarea, select')];

    for (const el of allElements) {
        const tag = el.tagName.toLowerCase();
        const type = (el.getAttribute('type') || '').toLowerCase();
        const id = el.id || '';
        const name = el.name || '';

        if (!name) continue;
        if (['authenticity_token', 'utf8', '_method', 'commit'].includes(name)) continue;

        if (tag === 'select') {
            const options = [...el.options].map(o => ({
                value: o.value,
                text: (o.textContent || '').trim()
            }));

            const selectedOptions = [...el.selectedOptions].map(o => ({
                value: o.value,
                text: (o.textContent || '').trim()
            }));

            result.selectFields.push({
                id,
                name,
                multiple: el.multiple,
                selectedValues: selectedOptions.map(o => o.value),
                selectedTexts: selectedOptions.map(o => o.text),
                options
            });
            continue;
        }

        if (type === 'checkbox') {
            const hiddenFallback = form.querySelector(
                `input[type="hidden"][name="${cssEscapeValue(name)}"]`
            );

            result.checkboxFields.push({
                id,
                name,
                checked: el.checked,
                value: el.value,
                hasHiddenFallback: !!hiddenFallback,
                hiddenFallbackValue: hiddenFallback ? hiddenFallback.value : null
            });
            continue;
        }

        if (type === 'hidden') {
            const matchingCheckbox = form.querySelector(
                `input[type="checkbox"][name="${cssEscapeValue(name)}"]`
            );
            if (matchingCheckbox) {
                continue;
            }
        }

        if (type === 'radio') {
            result.fields.push({
                kind: 'radio',
                id,
                name,
                type,
                value: el.value,
                checked: el.checked
            });
            continue;
        }

        result.fields.push({
            kind: tag,
            id,
            name,
            type: type || tag,
            value: el.value
        });
    }

    return result;
}

    async function fetchText(url) {
        const resp = await fetch(url, {
            credentials: 'same-origin'
        });
        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status} bei ${url}`);
        }
        return await resp.text();
    }

    async function exportAllAaos() {
        const links = getAaoEditLinksFromListPage(document);

        if (!links.length) {
            showError('Keine AAO-Edit-Links gefunden.');
            return;
        }

        const progress = createProgressUI();

        try {
            const exportData = {
                meta: {
                    exportedAt: new Date().toISOString(),
                    origin: location.origin,
                    sourcePage: location.href,
                    version: 1
                },
                aaos: []
            };

            console.log('Erkannte AAOs:', links.length, links);

            for (let i = 0; i < links.length; i++) {
                const item = links[i];
                const percent = Math.round((i / links.length) * 100);

                progress.set(
                    'AAO Export',
                    `Lade ${item.title || item.url}`,
                    i,
                    links.length,
                    percent
                );

                const html = await fetchText(item.url);
                const doc = parseHtml(html);
                const formData = collectFormDataFromDoc(doc, item.url);
                formData.listTitle = item.title || '';

                exportData.aaos.push(formData);
                await sleep(CONFIG.delayMs);
            }

            progress.done('AAO Export', `Export abgeschlossen: ${exportData.aaos.length} AAOs`);

            const filename = `${CONFIG.exportFilenamePrefix}_${formatDateForFilename()}.json`;
            downloadTextFile(filename, JSON.stringify(exportData, null, 2));

            setTimeout(() => progress.remove(), 2000);
        } catch (err) {
            progress.remove();
            console.error(err);
            showError(err.message || String(err));
        }
    }

    function pickFile() {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            input.style.display = 'none';

            input.addEventListener('change', async () => {
                try {
                    const file = input.files?.[0];
                    if (!file) {
                        reject(new Error('Keine Datei ausgewählt.'));
                        return;
                    }
                    const text = await file.text();
                    const json = JSON.parse(text);
                    resolve(json);
                } catch (e) {
                    reject(e);
                } finally {
                    input.remove();
                }
            });

            document.body.appendChild(input);
            input.click();
        });
    }

    function validateImportJson(json) {
        if (!json || typeof json !== 'object') {
            throw new Error('Ungültige JSON-Datei.');
        }
        if (!Array.isArray(json.aaos)) {
            throw new Error('JSON-Datei enthält kein Feld "aaos".');
        }
        if (!json.aaos.length) {
            throw new Error('Die Importdatei enthält keine AAOs.');
        }
    }

    function mapFormElementsByName(form) {
        const map = new Map();
        for (const el of form.querySelectorAll('input, textarea, select')) {
            const name = el.name || '';
            if (!name) continue;
            if (!map.has(name)) map.set(name, []);
            map.get(name).push(el);
        }
        return map;
    }

    function normalizeText(value) {
        return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function isCategorySelectField(field) {
        return field && field.name === 'aao[aao_category_id]';
    }

    function findOptionByText(select, wantedText) {
        const normalizedWanted = normalizeText(wantedText);
        return [...select.options].find(o => normalizeText(o.textContent) === normalizedWanted) || null;
    }

function validateAgainstTemplate(templateDoc, aaoData) {
    const form = findAaoForm(templateDoc);
    if (!form) {
        return {
            fatal: true,
            problems: ['Auf /aaos/new wurde kein Formular gefunden.']
        };
    }

    const byName = mapFormElementsByName(form);
    const problems = [];

    for (const field of aaoData.fields || []) {
        const list = byName.get(field.name);
        if (!list || !list.length) {
            problems.push(`Fehlendes Feld im Formular: ${field.name} (ID: ${field.id || '-'})`);
            continue;
        }

        if (field.kind === 'radio') {
            const radioExists = list.some(el => (el.value || '') === (field.value || ''));
            if (!radioExists) {
                problems.push(`Radio-Wert nicht vorhanden: ${field.name} = ${field.value}`);
            }
        }
    }

    for (const field of aaoData.checkboxFields || []) {
        const list = byName.get(field.name);
        if (!list || !list.length) {
            problems.push(`Fehlende Checkbox im Formular: ${field.name} (ID: ${field.id || '-'})`);
        }
    }

    for (const field of aaoData.selectFields || []) {
        const list = byName.get(field.name);
        if (!list || !list.length) {
            problems.push(`Fehlendes Dropdown im Formular: ${field.name} (ID: ${field.id || '-'})`);
            continue;
        }

        const select = list.find(el => el.tagName.toLowerCase() === 'select');
        if (!select) {
            problems.push(`Feld ist kein Select: ${field.name}`);
            continue;
        }

        if (isCategorySelectField(field)) {
            const selectedTexts = field.selectedTexts || [];
            for (const text of selectedTexts) {
                if (!text) continue;
                const optionExists = !!findOptionByText(select, text);
                if (!optionExists) {
                    problems.push(`Dropdown-Text nicht vorhanden: ${field.name} = ${text}`);
                }
            }
            continue;
        }

        for (const value of field.selectedValues || []) {
            const optionExists = [...select.options].some(o => o.value === value);
            if (!optionExists) {
                problems.push(`Dropdown-Wert nicht vorhanden: ${field.name} = ${value}`);
            }
        }
    }

    return {
        fatal: false,
        problems
    };
}

function buildPostParamsFromTemplate(templateDoc, aaoData, options = {}) {
    const { skipMissing = false } = options;

    const form = findAaoForm(templateDoc);
    if (!form) {
        throw new Error('Kein Formular auf der Zielseite gefunden.');
    }

    const params = new URLSearchParams();
    const byName = mapFormElementsByName(form);
    const skippedProblems = [];

    const authTokenInput = form.querySelector('input[name="authenticity_token"]');
    if (authTokenInput?.value) {
        params.set('authenticity_token', authTokenInput.value);
    } else {
        const metaToken = getCsrfToken(templateDoc) || getCsrfToken(document);
        if (metaToken) params.set('authenticity_token', metaToken);
    }

    const utf8Input = form.querySelector('input[name="utf8"]');
    if (utf8Input?.value) {
        params.set('utf8', utf8Input.value);
    }

    for (const field of aaoData.fields || []) {
        const els = byName.get(field.name);
        if (!els || !els.length) {
            if (skipMissing) {
                skippedProblems.push(`Feld übersprungen: ${field.name}`);
                continue;
            }
            throw new Error(`Fehlendes Feld beim Setzen: ${field.name}`);
        }

        if (field.kind === 'radio') {
            const targetRadio = els.find(el => (el.value || '') === (field.value || ''));
            if (!targetRadio) {
                if (skipMissing) {
                    skippedProblems.push(`Radio-Wert übersprungen: ${field.name} = ${field.value}`);
                    continue;
                }
                throw new Error(`Radio-Wert nicht vorhanden: ${field.name} = ${field.value}`);
            }

            if (field.checked) {
                params.set(field.name, field.value);
            }
            continue;
        }

        params.set(field.name, field.value ?? '');
    }

    for (const field of aaoData.checkboxFields || []) {
        const els = byName.get(field.name);
        if (!els || !els.length) {
            if (skipMissing) {
                skippedProblems.push(`Checkbox übersprungen: ${field.name}`);
                continue;
            }
            throw new Error(`Fehlende Checkbox beim Setzen: ${field.name}`);
        }

        const checkboxEl = els.find(el => (el.getAttribute('type') || '').toLowerCase() === 'checkbox');
        const hiddenEl = els.find(el => (el.getAttribute('type') || '').toLowerCase() === 'hidden');

        if (!checkboxEl) {
            if (skipMissing) {
                skippedProblems.push(`Checkbox-Struktur übersprungen: ${field.name}`);
                continue;
            }
            throw new Error(`Checkbox nicht gefunden: ${field.name}`);
        }

        if (hiddenEl) {
            params.set(field.name, field.checked ? (field.value ?? '1') : (hiddenEl.value ?? '0'));
        } else {
            if (field.checked) {
                params.set(field.name, field.value ?? '1');
            } else {
                params.delete(field.name);
            }
        }
    }

    for (const field of aaoData.selectFields || []) {
        const els = byName.get(field.name);
        if (!els || !els.length) {
            if (skipMissing) {
                skippedProblems.push(`Dropdown übersprungen: ${field.name}`);
                continue;
            }
            throw new Error(`Fehlendes Dropdown beim Setzen: ${field.name}`);
        }

        const select = els.find(el => el.tagName.toLowerCase() === 'select');
        if (!select) {
            if (skipMissing) {
                skippedProblems.push(`Select-Struktur übersprungen: ${field.name}`);
                continue;
            }
            throw new Error(`Feld ist kein Select: ${field.name}`);
        }

        if (isCategorySelectField(field)) {
            const selectedTexts = field.selectedTexts || [];
            const validTargetOptions = [];

            for (const text of selectedTexts) {
                if (!text) continue;

                const targetOption = findOptionByText(select, text);
                if (!targetOption) {
                    if (skipMissing) {
                        skippedProblems.push(`Dropdown-Text übersprungen: ${field.name} = ${text}`);
                        continue;
                    }
                    throw new Error(`Dropdown-Text nicht vorhanden: ${field.name} = ${text}`);
                }

                validTargetOptions.push(targetOption);
            }

            params.delete(field.name);

            if (!field.multiple) {
                params.set(field.name, validTargetOptions[0]?.value ?? '');
            } else {
                for (const option of validTargetOptions) {
                    params.append(field.name, option.value);
                }
            }

            continue;
        }

        const validValues = (field.selectedValues || []).filter(value =>
            [...select.options].some(o => o.value === value)
        );

        if (!field.multiple) {
            if (field.selectedValues?.length && validValues.length === 0) {
                if (skipMissing) {
                    skippedProblems.push(`Dropdown-Wert übersprungen: ${field.name} = ${(field.selectedValues || []).join(', ')}`);
                    continue;
                }
                throw new Error(`Dropdown-Wert nicht vorhanden: ${field.name}`);
            }

            params.set(field.name, validValues[0] ?? '');
        } else {
            params.delete(field.name);

            if ((field.selectedValues || []).length > 0 && validValues.length === 0) {
                if (skipMissing) {
                    skippedProblems.push(`Mehrfach-Dropdown ohne gültige Werte übersprungen: ${field.name}`);
                    continue;
                }
                throw new Error(`Keine gültigen Werte für Mehrfach-Dropdown: ${field.name}`);
            }

            for (const value of validValues) {
                params.append(field.name, value);
            }
        }
    }

    const commitButton = form.querySelector('input[name="commit"], button[name="commit"]');
    if (commitButton) {
        params.set('commit', commitButton.value || 'Speichern');
    } else {
        params.set('commit', 'Speichern');
    }

    return {
        params,
        skippedProblems
    };
}

    async function createOneAao(aaoData) {
        const newHtml = await fetchText(CONFIG.newPage);
        const templateDoc = parseHtml(newHtml);

        const validation = validateAgainstTemplate(templateDoc, aaoData);

        if (validation.fatal) {
            return {
                status: 'fatal',
                problems: validation.problems
            };
        }

        let skipMissing = false;

        if (validation.problems.length > 0) {
            const decision = askImportConflictDecision(aaoData, validation.problems);

            if (decision === 'abort_all') {
                return {
                    status: 'abort_all',
                    problems: validation.problems
                };
            }

            if (decision === 'skip_aao') {
                return {
                    status: 'skip_aao',
                    problems: validation.problems
                };
            }

            if (decision === 'skip_missing_and_continue') {
                skipMissing = true;
            }
        }

        const buildResult = buildPostParamsFromTemplate(templateDoc, aaoData, { skipMissing });

        const resp = await fetch(CONFIG.createUrl, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-CSRF-Token': getCsrfToken(templateDoc) || getCsrfToken(document),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: buildResult.params.toString()
        });

        if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            throw new Error(`Import fehlgeschlagen (HTTP ${resp.status}) bei "${aaoData.listTitle || 'AAO'}". ${text.slice(0, 300)}`);
        }

        return {
            status: 'imported',
            skippedProblems: buildResult.skippedProblems,
            validationProblems: validation.problems
        };
    }

    async function importAllAaos() {
        let json;
        try {
            json = await pickFile();
            validateImportJson(json);
        } catch (err) {
            if (err?.message === 'Keine Datei ausgewählt.') return;
            showError(err.message || String(err));
            return;
        }

        IMPORT_DECISIONS.clear();

        const progress = createProgressUI();

        try {
            let importedCount = 0;
            let skippedCount = 0;
            const warnings = [];

            for (let i = 0; i < json.aaos.length; i++) {
                const aao = json.aaos[i];
                const percent = Math.round((i / json.aaos.length) * 100);

                progress.set(
                    'AAO Import',
                    `Verarbeite ${aao.listTitle || aao.sourceUrl || `AAO ${i + 1}`}`,
                    i,
                    json.aaos.length,
                    percent
                );

                const result = await createOneAao(aao);

                if (result.status === 'abort_all') {
                    progress.remove();
                    showError(
                        `Import vom Benutzer abgebrochen.\n\n` +
                        `Bereits importiert: ${importedCount}\n` +
                        `Übersprungen: ${skippedCount}`
                    );
                    return;
                }

                if (result.status === 'skip_aao') {
                    skippedCount++;
                    warnings.push(`AAO übersprungen: ${aao.listTitle || aao.sourceUrl}`);
                    await sleep(CONFIG.delayMs);
                    continue;
                }

                if (result.status === 'fatal') {
                    progress.remove();
                    showError(
                        `Schwerer Fehler beim Import:\n\n${result.problems.join('\n')}\n\n` +
                        `Bereits importiert: ${importedCount}\n` +
                        `Übersprungen: ${skippedCount}`
                    );
                    return;
                }

                if (result.status === 'imported') {
                    importedCount++;

                    if (result.skippedProblems?.length) {
                        warnings.push(
                            `AAO "${aao.listTitle || aao.sourceUrl}" teilweise importiert:\n- ` +
                            result.skippedProblems.join('\n- ')
                        );
                    }
                }

                await sleep(CONFIG.delayMs);
            }

            progress.done('AAO Import', `Import abgeschlossen: ${importedCount} importiert, ${skippedCount} übersprungen`);
            setTimeout(() => progress.remove(), 2500);

            let finalMessage =
                `Import erfolgreich abgeschlossen.\n\n` +
                `Importierte AAOs: ${importedCount}\n` +
                `Übersprungene AAOs: ${skippedCount}`;

            if (warnings.length) {
                finalMessage += `\n\nHinweise:\n${warnings.join('\n\n')}`;
            }

            showInfo(finalMessage);
        } catch (err) {
            progress.remove();
            console.error(err);
            showError(err.message || String(err));
        }
    }

    function insertButtons() {
        const shareButton = [...document.querySelectorAll('a.btn.btn-xs.btn-default')]
            .find(a => (a.textContent || '').trim() === 'Teilen' && a.getAttribute('href') === '/aao_exports/new');

        if (!shareButton) return;
        if (document.getElementById('tm-aao-real-export')) return;

        const exportBtn = document.createElement('a');
        exportBtn.id = 'tm-aao-real-export';
        exportBtn.href = '#';
        exportBtn.className = 'btn btn-xs btn-default';
        exportBtn.textContent = 'Echter Export';
        exportBtn.style.marginRight = '4px';

        const importBtn = document.createElement('a');
        importBtn.id = 'tm-aao-real-import';
        importBtn.href = '#';
        importBtn.className = 'btn btn-xs btn-default';
        importBtn.textContent = 'Echter Import';
        importBtn.style.marginRight = '4px';

        exportBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await exportAllAaos();
        });

        importBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await importAllAaos();
        });

        shareButton.parentNode.insertBefore(importBtn, shareButton);
        shareButton.parentNode.insertBefore(exportBtn, importBtn);
    }

    function init() {
        if (!location.pathname.startsWith('/aaos')) return;
        insertButtons();

        const observer = new MutationObserver(() => insertButtons());
        observer.observe(document.body, { childList: true, subtree: true });
    }

    init();
})();
