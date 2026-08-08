//Achtung: Dieses Script Funktioniert nicht. Es liegt hier nur zur Datensicherung
//Achtung: Dieses Script Funktioniert nicht. Es liegt hier nur zur Datensicherung
//Achtung: Dieses Script Funktioniert nicht. Es liegt hier nur zur Datensicherung
//Achtung: Dieses Script Funktioniert nicht. Es liegt hier nur zur Datensicherung
//Achtung: Dieses Script Funktioniert nicht. Es liegt hier nur zur Datensicherung
//Achtung: Dieses Script Funktioniert nicht. Es liegt hier nur zur Datensicherung
//Achtung: Dieses Script Funktioniert nicht. Es liegt hier nur zur Datensicherung
//Achtung: Dieses Script Funktioniert nicht. Es liegt hier nur zur Datensicherung
//Achtung: Dieses Script Funktioniert nicht. Es liegt hier nur zur Datensicherung
//Achtung: Dieses Script Funktioniert nicht. Es liegt hier nur zur Datensicherung
//Achtung: Dieses Script Funktioniert nicht. Es liegt hier nur zur Datensicherung
//Achtung: Dieses Script Funktioniert nicht. Es liegt hier nur zur Datensicherung
//Achtung: Dieses Script Funktioniert nicht. Es liegt hier nur zur Datensicherung

(async () => {
  'use strict';

  const CONFIG = {
    requestDelayMs: 100,
    apiUrl: `${location.origin}/api/vehicles`,
    refitPageUrl: (id) => `${location.origin}/vehicles/${id}/refit`,
    refitPostUrl: (id) => `${location.origin}/refit_vehicle/${id}`,
  };

  if (!/(^|\.)leitstellenspiel\.de$/i.test(location.hostname)) {
    alert('Dieses Skript bitte eingeloggt auf leitstellenspiel.de ausführen.');
    return;
  }

  window.__LSS_REFIT_TOOL__?.destroy?.();

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const esc = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const formatNumber = new Intl.NumberFormat('de-DE');
  const formatCredits = (n) => `${formatNumber.format(n)} Credits`;

  let destroyed = false;
  let stopRequested = false;
  let lastRequestStartedAt = 0;
  let sourceFrame = null;

  async function pacedFetch(url, options = {}) {
    const elapsed = Date.now() - lastRequestStartedAt;
    if (elapsed < CONFIG.requestDelayMs) {
      await sleep(CONFIG.requestDelayMs - elapsed);
    }
    lastRequestStartedAt = Date.now();

    return fetch(url, {
      credentials: 'same-origin',
      ...options,
    });
  }

  async function fetchVehicles() {
    const response = await pacedFetch(CONFIG.apiUrl, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Fahrzeug-API: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Die Fahrzeug-API hat kein Array zurückgegeben.');
    }
    return data;
  }

  function getAuthToken(doc = document) {
    return (
      doc.querySelector('input[name="authenticity_token"]')?.value ||
      doc.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
      document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
      ''
    );
  }

  function parseCredits(text) {
    const match = String(text ?? '').match(/([\d.\s]+)\s*Credits/i);
    if (!match) return null;
    const value = Number(match[1].replace(/\D/g, ''));
    return Number.isFinite(value) ? value : null;
  }

  // UI
  const host = document.createElement('div');
  host.id = 'lss-refit-tool-host';
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; }
      .overlay {
        position: fixed; inset: 0; z-index: 2147483647;
        background: rgba(0,0,0,.58); display: flex; align-items: center;
        justify-content: center; padding: 20px;
        font-family: Arial, Helvetica, sans-serif; color: #222;
      }
      .panel {
        width: min(900px, 96vw); max-height: 90vh; overflow: auto;
        background: #fff; border-radius: 10px; box-shadow: 0 18px 60px rgba(0,0,0,.35);
      }
      .head {
        position: sticky; top: 0; z-index: 2; background: #fff;
        padding: 18px 20px 14px; border-bottom: 1px solid #ddd;
      }
      .head h2 { margin: 0; font-size: 20px; }
      .body { padding: 18px 20px; }
      .footer {
        position: sticky; bottom: 0; background: #fff; padding: 14px 20px;
        border-top: 1px solid #ddd; display: flex; gap: 10px; justify-content: flex-end;
      }
      button, select, input { font: inherit; }
      button {
        border: 0; border-radius: 6px; padding: 9px 14px; cursor: pointer;
        background: #e5e7eb; color: #111;
      }
      button.primary { background: #198754; color: #fff; }
      button.danger { background: #dc3545; color: #fff; }
      button:disabled { opacity: .55; cursor: not-allowed; }
      select, input[type="number"], input[type="text"] {
        width: 100%; border: 1px solid #bbb; border-radius: 5px; padding: 8px 10px;
        background: #fff; color: #111;
      }
      input[type="range"] { width: 100%; }
      .muted { color: #666; font-size: 13px; }
      .loading { padding: 25px 0; text-align: center; }
      .grid { display: grid; gap: 14px; }
      .prop {
        border: 1px solid #ddd; border-radius: 8px; padding: 13px;
        display: grid; grid-template-columns: 1fr 180px; gap: 10px 16px;
      }
      .prop .label { font-weight: 700; }
      .prop .desc { color: #666; font-size: 12px; margin-top: 4px; }
      .prop .range { grid-column: 1 / -1; }
      .prop .limits { display: flex; justify-content: space-between; color: #777; font-size: 11px; }
      .summary {
        display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px;
        margin: 14px 0;
      }
      .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
      .card strong { display: block; margin-top: 4px; font-size: 18px; }
      .warning { background: #fff3cd; border: 1px solid #ffe69c; border-radius: 6px; padding: 10px; }
      .error { background: #f8d7da; border: 1px solid #f1aeb5; border-radius: 6px; padding: 10px; }
      .success { background: #d1e7dd; border: 1px solid #a3cfbb; border-radius: 6px; padding: 10px; }
      .progress {
        height: 22px; background: #e9ecef; border-radius: 999px; overflow: hidden; margin: 12px 0;
      }
      .bar {
        height: 100%; width: 0%; background: #198754; color: #fff; display: flex;
        align-items: center; justify-content: center; font-size: 12px; transition: width .15s ease;
      }
      .log {
        height: 220px; overflow: auto; background: #111; color: #eee;
        border-radius: 6px; padding: 10px; font: 12px/1.45 Consolas, monospace; white-space: pre-wrap;
      }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 7px; border-bottom: 1px solid #eee; }
      @media (max-width: 650px) {
        .prop { grid-template-columns: 1fr; }
        .prop .range { grid-column: 1; }
        .summary { grid-template-columns: 1fr; }
      }
    </style>
    <div class="overlay">
      <div class="panel">
        <div class="head"><h2 id="title">LSS Fahrzeug-Umrüstung</h2></div>
        <div class="body" id="body"><div class="loading">Initialisiere…</div></div>
        <div class="footer" id="footer"></div>
      </div>
    </div>
  `;

  const $ = (sel) => shadow.querySelector(sel);
  const body = $('#body');
  const footer = $('#footer');
  const title = $('#title');

  function setView({ titleText, html, buttons = [] }) {
    title.textContent = titleText;
    body.innerHTML = html;
    footer.innerHTML = '';
    for (const cfg of buttons) {
      const btn = document.createElement('button');
      btn.textContent = cfg.text;
      if (cfg.className) btn.className = cfg.className;
      if (cfg.disabled) btn.disabled = true;
      btn.addEventListener('click', cfg.onClick);
      footer.appendChild(btn);
    }
  }

  function destroy() {
    destroyed = true;
    sourceFrame?.remove();
    host.remove();
    delete window.__LSS_REFIT_TOOL__;
  }

  window.__LSS_REFIT_TOOL__ = { destroy };

  function showFatal(error) {
    console.error('[LSS-Refit]', error);
    setView({
      titleText: 'LSS Fahrzeug-Umrüstung – Fehler',
      html: `<div class="error"><strong>Fehler:</strong><br>${esc(error?.message || error)}</div>`,
      buttons: [{ text: 'Schließen', onClick: destroy }],
    });
  }

  function chooseVehicleType(vehicles) {
    return new Promise((resolve) => {
      const groups = new Map();
      for (const vehicle of vehicles) {
        const type = Number(vehicle.vehicle_type);
        if (!groups.has(type)) groups.set(type, []);
        groups.get(type).push(vehicle);
      }

      const options = [...groups.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([type, list]) => {
          const samples = [...new Set(list.slice(0, 3).map((v) => v.caption).filter(Boolean))].join(', ');
          return `<option value="${type}">Vehicle Type ${type} — ${list.length} Fahrzeug${list.length === 1 ? '' : 'e'}${samples ? ` — z. B. ${esc(samples)}` : ''}</option>`;
        })
        .join('');

      setView({
        titleText: '1/4 – Fahrzeugtyp auswählen',
        html: `
          <p>Wähle den <code>vehicle_type</code>, dessen Fahrzeuge umgerüstet werden sollen.</p>
          <select id="vehicleType">${options}</select>
          <p class="muted">Es werden später alle Fahrzeuge dieses Typs erneut über die Fahrzeug-API ermittelt.</p>
        `,
        buttons: [
          { text: 'Abbrechen', onClick: destroy },
          {
            text: 'Weiter', className: 'primary', onClick: () => {
              const selected = Number($('#vehicleType').value);
              resolve(selected);
            }
          }
        ]
      });
    });
  }

  function loadRefitFrame(vehicleId) {
    return new Promise((resolve, reject) => {
      sourceFrame?.remove();
      sourceFrame = document.createElement('iframe');
      sourceFrame.setAttribute('aria-hidden', 'true');
      sourceFrame.style.cssText = 'position:fixed;left:-10000px;top:-10000px;width:1200px;height:900px;opacity:0;pointer-events:none;';

      const timeout = setTimeout(() => {
        reject(new Error('Die Umrüstungsseite konnte nicht rechtzeitig geladen werden.'));
      }, 20000);

      sourceFrame.addEventListener('load', () => {
        clearTimeout(timeout);
        try {
          const doc = sourceFrame.contentDocument;
          if (!doc) throw new Error('Kein Zugriff auf die Umrüstungsseite im iframe.');
          resolve(doc);
        } catch (err) {
          reject(err);
        }
      }, { once: true });

      sourceFrame.src = CONFIG.refitPageUrl(vehicleId);
      document.body.appendChild(sourceFrame);
    });
  }

  function findProperties(doc) {
    const seen = new Set();
    const properties = [];

    for (const hidden of doc.querySelectorAll('input[type="hidden"][name$="_new_value"]')) {
      const name = hidden.name;
      if (!name || seen.has(name)) continue;
      seen.add(name);

      let container = hidden.closest('.slider-container, [id$="_progress"], .form-group');
      if (!container) {
        let node = hidden.parentElement;
        for (let depth = 0; node && depth < 6; depth++, node = node.parentElement) {
          if (node.querySelector('input[type="number"], input[type="range"]')) {
            container = node;
            break;
          }
        }
      }
      container ||= hidden.parentElement;

      const numberInput = container?.querySelector('input[type="number"]') || null;
      const rangeInput = container?.querySelector('input[type="range"]') || null;
      const control = numberInput || rangeInput;

      const minRaw = control?.getAttribute('min') ?? rangeInput?.getAttribute('min');
      const maxRaw = control?.getAttribute('max') ?? rangeInput?.getAttribute('max');
      const stepRaw = control?.getAttribute('step') ?? rangeInput?.getAttribute('step') ?? '1';

      const min = minRaw !== null && minRaw !== '' ? Number(minRaw) : null;
      const max = maxRaw !== null && maxRaw !== '' ? Number(maxRaw) : null;
      const step = stepRaw !== null && stepRaw !== '' ? Number(stepRaw) : 1;

      const label = container?.querySelector('label')?.textContent?.replace(/\s+/g, ' ').trim() || name;
      const description = container?.querySelector('p')?.textContent?.replace(/\s+/g, ' ').trim() || '';

      properties.push({
        name,
        label,
        description,
        currentValue: hidden.value,
        min: Number.isFinite(min) ? min : null,
        max: Number.isFinite(max) ? max : null,
        step: Number.isFinite(step) && step > 0 ? step : 1,
        hidden,
        numberInput,
        rangeInput,
      });
    }

    return properties;
  }

  function chooseProperties(properties) {
    return new Promise((resolve) => {
      const html = properties.map((p, idx) => {
        const current = Number(p.currentValue);
        const minAttr = p.min !== null ? `min="${p.min}"` : '';
        const maxAttr = p.max !== null ? `max="${p.max}"` : '';
        const stepAttr = `step="${p.step}"`;
        const range = p.min !== null && p.max !== null
          ? `
            <div class="range">
              <input type="range" data-range="${idx}" min="${p.min}" max="${p.max}" step="${p.step}" value="${Number.isFinite(current) ? current : p.min}">
              <div class="limits"><span>${formatNumber.format(p.min)}</span><span>${formatNumber.format(p.max)}</span></div>
            </div>`
          : '';

        return `
          <div class="prop">
            <div>
              <div class="label">${esc(p.label)}</div>
              <div class="muted"><code>${esc(p.name)}</code></div>
              ${p.description ? `<div class="desc">${esc(p.description)}</div>` : ''}
            </div>
            <div>
              <input type="number" data-number="${idx}" ${minAttr} ${maxAttr} ${stepAttr} value="${esc(p.currentValue)}">
            </div>
            ${range}
          </div>
        `;
      }).join('');

      setView({
        titleText: '2/4 – Umrüstungseigenschaften',
        html: `
          <p>Lege die Zielwerte fest. Die Werte stammen aus der Umrüstungsseite des ersten Fahrzeugs dieses Typs.</p>
          <div class="grid">${html || '<div class="warning">Keine *_new_value-Eigenschaften gefunden.</div>'}</div>
        `,
        buttons: [
          { text: 'Abbrechen', onClick: destroy },
          {
            text: 'Kosten prüfen', className: 'primary', disabled: properties.length === 0, onClick: () => {
              const values = {};
              for (let i = 0; i < properties.length; i++) {
                const p = properties[i];
                const input = shadow.querySelector(`input[data-number="${i}"]`);
                const n = Number(input.value);
                if (!Number.isFinite(n)) {
                  alert(`Ungültiger Wert für „${p.label}“.`);
                  input.focus();
                  return;
                }
                if (p.min !== null && n < p.min) {
                  alert(`„${p.label}“ muss mindestens ${p.min} sein.`);
                  input.focus();
                  return;
                }
                if (p.max !== null && n > p.max) {
                  alert(`„${p.label}“ darf höchstens ${p.max} sein.`);
                  input.focus();
                  return;
                }
                values[p.name] = input.value;
              }
              resolve(values);
            }
          }
        ]
      });


      properties.forEach((p, idx) => {
        const number = shadow.querySelector(`input[data-number="${idx}"]`);
        const range = shadow.querySelector(`input[data-range="${idx}"]`);
        if (!number || !range) return;
        number.addEventListener('input', () => { range.value = number.value; });
        range.addEventListener('input', () => { number.value = range.value; });
      });
    });
  }

  async function applyValuesToSourcePage(properties, values, doc) {
    const win = doc.defaultView;

    for (const p of properties) {
      const value = String(values[p.name]);

      for (const el of [p.numberInput, p.rangeInput].filter(Boolean)) {
        el.value = value;
        el.dispatchEvent(new win.Event('input', { bubbles: true }));
        el.dispatchEvent(new win.Event('change', { bubbles: true }));
      }


      p.hidden.value = value;
      p.hidden.dispatchEvent(new win.Event('input', { bubbles: true }));
      p.hidden.dispatchEvent(new win.Event('change', { bubbles: true }));

      await sleep(0);
    }


    await sleep(100);
  }

  function readRefitButton(doc) {
    const button = doc.querySelector('#refit_with_credits_button');
    if (!button) throw new Error('Der Button #refit_with_credits_button wurde nicht gefunden.');
    const value = button.value || button.getAttribute('value') || '';
    const cost = parseCredits(value);
    if (cost === null) {
      throw new Error(`Kosten konnten aus dem Button nicht gelesen werden: „${value}“`);
    }
    return { button, value, cost };
  }

  function confirmSummary({ vehicleType, vehicles, costPerVehicle, totalCost, values, properties }) {
    return new Promise((resolve) => {
      const propRows = properties.map((p) => `
        <tr><td>${esc(p.label)}</td><td><code>${esc(p.name)}</code></td><td>${esc(values[p.name])}</td></tr>
      `).join('');

      setView({
        titleText: '3/4 – Umrüstung bestätigen',
        html: `
          <div class="summary">
            <div class="card">Vehicle Type<strong>${vehicleType}</strong></div>
            <div class="card">Fahrzeuge<strong>${formatNumber.format(vehicles.length)}</strong></div>
            <div class="card">Gesamtkosten<strong>${formatCredits(totalCost)}</strong></div>
          </div>
          <p>Preis pro Fahrzeug: <strong>${formatCredits(costPerVehicle)}</strong></p>
          <table>
            <thead><tr><th>Eigenschaft</th><th>POST-Name</th><th>Zielwert</th></tr></thead>
            <tbody>${propRows}</tbody>
          </table>
          <div class="warning" style="margin-top:14px">
            Nach der Bestätigung werden die ${formatNumber.format(vehicles.length)} Fahrzeuge nacheinander umgerüstet.
            Zwischen den Requests liegen mindestens ${CONFIG.requestDelayMs} ms.
          </div>
        `,
        buttons: [
          { text: 'Abbrechen', onClick: () => resolve(false) },
          { text: `${vehicles.length} Fahrzeuge umrüsten`, className: 'danger', onClick: () => resolve(true) }
        ]
      });
    });
  }

  function createProgressView(total) {
    stopRequested = false;
    setView({
      titleText: '4/4 – Umrüstung läuft',
      html: `
        <div id="progressText">0 / ${total}</div>
        <div class="progress"><div class="bar" id="bar">0%</div></div>
        <div class="log" id="log"></div>
      `,
      buttons: [
        {
          text: 'Nach aktuellem Fahrzeug stoppen', className: 'danger', onClick: (event) => {
            stopRequested = true;
            event.currentTarget.disabled = true;
            event.currentTarget.textContent = 'Stopp angefordert…';
          }
        }
      ]
    });

    const logEl = $('#log');
    return {
      log(message) {
        const time = new Date().toLocaleTimeString('de-DE');
        logEl.textContent += `[${time}] ${message}\n`;
        logEl.scrollTop = logEl.scrollHeight;
      },
      update(done, success, failed) {
        const pct = total ? Math.round((done / total) * 100) : 100;
        $('#bar').style.width = `${pct}%`;
        $('#bar').textContent = `${pct}%`;
        $('#progressText').textContent = `${done} / ${total} erledigt — ${success} erfolgreich, ${failed} fehlgeschlagen`;
      },
      finish({ done, success, failed, stopped }) {
        const cls = failed ? 'warning' : 'success';
        body.insertAdjacentHTML('afterbegin', `
          <div class="${cls}" style="margin-bottom:12px">
            <strong>${stopped ? 'Vorgang gestoppt.' : 'Vorgang abgeschlossen.'}</strong><br>
            ${done} von ${total} verarbeitet, ${success} erfolgreich, ${failed} fehlgeschlagen.
          </div>
        `);
        footer.innerHTML = '';
        const close = document.createElement('button');
        close.textContent = 'Schließen';
        close.className = 'primary';
        close.addEventListener('click', destroy);
        footer.appendChild(close);
      }
    };
  }

  async function refitVehicle(vehicle, { values, commitValue, token }) {
    const formData = new FormData();
    formData.append('utf8', '✓');
    formData.append('authenticity_token', token);
    formData.append('vehicle_fitting_template[id]', '');
    formData.append('vehicle_fitting_template[template_caption]', '');

    for (const [name, value] of Object.entries(values)) {
      formData.append(name, String(value));
    }

    formData.append('refit_with_coins', '');
    formData.append('commit', commitValue);

    const response = await pacedFetch(CONFIG.refitPostUrl(vehicle.id), {
      method: 'POST',
      body: formData,
      headers: token ? { 'X-CSRF-Token': token } : undefined,
      redirect: 'follow',
    });


    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const responseText = await response.text();

    if (responseText) {
      const resultDoc = new DOMParser().parseFromString(responseText, 'text/html');
      const alerts = [...resultDoc.querySelectorAll('.alert-danger, .alert-error')]
        .map((el) => el.textContent.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
      const visibleFitErrors = [...resultDoc.querySelectorAll('.fit-error-label')]
        .filter((el) => !/display\s*:\s*none/i.test(el.getAttribute('style') || ''))
        .map((el) => el.textContent.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
      const errors = [...alerts, ...visibleFitErrors];
      if (errors.length) {
        throw new Error(`Servermeldung: ${errors.join(' | ')}`);
      }
    }

    return response;
  }

  try {
    setView({
      titleText: 'LSS Fahrzeug-Umrüstung',
      html: '<div class="loading">Fahrzeuge werden geladen…</div>',
      buttons: [{ text: 'Abbrechen', onClick: destroy }],
    });

    const firstVehicleSnapshot = await fetchVehicles();
    if (destroyed) return;
    if (!firstVehicleSnapshot.length) throw new Error('Keine Fahrzeuge gefunden.');

    const vehicleType = await chooseVehicleType(firstVehicleSnapshot);
    if (destroyed) return;

    const sampleVehicle = firstVehicleSnapshot.find((v) => Number(v.vehicle_type) === vehicleType);
    if (!sampleVehicle) throw new Error(`Kein Fahrzeug für vehicle_type ${vehicleType} gefunden.`);

    setView({
      titleText: 'Umrüstungsdaten werden gelesen',
      html: `<div class="loading">Lade /vehicles/${sampleVehicle.id}/refit …</div>`,
      buttons: [{ text: 'Abbrechen', onClick: destroy }],
    });

    const refitDoc = await loadRefitFrame(sampleVehicle.id);
    if (destroyed) return;

    const properties = findProperties(refitDoc);
    if (!properties.length) {
      throw new Error('Auf der Umrüstungsseite wurden keine hidden Inputs mit *_new_value gefunden.');
    }

    const values = await chooseProperties(properties);
    if (destroyed) return;

    setView({
      titleText: 'Kosten werden berechnet',
      html: '<div class="loading">Übernehme Zielwerte in die Original-Umrüstungsseite und lese den Credits-Preis aus…</div>',
      buttons: [{ text: 'Abbrechen', onClick: destroy }],
    });

    await applyValuesToSourcePage(properties, values, refitDoc);
    const { value: commitValue, cost: costPerVehicle } = readRefitButton(refitDoc);

    const latestVehicles = await fetchVehicles();
    const affectedVehicles = latestVehicles.filter((v) => Number(v.vehicle_type) === vehicleType);

    if (!affectedVehicles.length) {
      throw new Error(`Es wurden aktuell keine Fahrzeuge mit vehicle_type ${vehicleType} gefunden.`);
    }

    const totalCost = costPerVehicle * affectedVehicles.length;
    const confirmed = await confirmSummary({
      vehicleType,
      vehicles: affectedVehicles,
      costPerVehicle,
      totalCost,
      values,
      properties,
    });

    if (!confirmed) {
      destroy();
      return;
    }

    const token = getAuthToken(refitDoc);
    if (!token) {
      throw new Error('Kein CSRF/authenticity_token gefunden.');
    }

    const progress = createProgressView(affectedVehicles.length);
    let done = 0;
    let success = 0;
    let failed = 0;

    for (const vehicle of affectedVehicles) {
      if (stopRequested) break;

      progress.log(`#${vehicle.id} ${vehicle.caption || ''} — starte Umrüstung…`);
      try {
        await refitVehicle(vehicle, { values, commitValue, token });
        success++;
        progress.log(`#${vehicle.id} — OK`);
      } catch (error) {
        failed++;
        progress.log(`#${vehicle.id} — FEHLER: ${error.message}`);
        console.error('[LSS-Refit] Fahrzeug fehlgeschlagen', vehicle, error);
      }

      done++;
      progress.update(done, success, failed);

      await sleep(CONFIG.requestDelayMs);
    }

    progress.finish({
      done,
      success,
      failed,
      stopped: stopRequested,
    });

  } catch (error) {
    if (!destroyed) showFatal(error);
  }
})();
