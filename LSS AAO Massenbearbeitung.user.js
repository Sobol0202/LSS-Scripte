// ==UserScript==
// @name         LSS AAO Massenbearbeitung
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0.3
// @description  Massenbearbeitungsmodus für die AAOs
// @author       Sobol
// @match        https://www.leitstellenspiel.de/aaos
// @run-at       document-end
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  const REQUEST_DELAY_MS = 100;
  const EDIT_TO_SAVE_DELAY_MS = 300;

  // Helper
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function $(sel, root = document) {
    return root.querySelector(sel);
  }
  function $all(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function findTutorialButton() {
    return $("#tutorial_video_show");
  }

  function findAllAaoGroups() {
    return $all(".btn-group.aao_btn_group");
  }

  function getEditHrefFromGroup(groupEl) {
    const a = $('a[href$="/edit"]', groupEl);
    return a?.getAttribute("href") || null;
  }

  function absolutizeUrl(pathOrUrl) {
    try {
      return new URL(pathOrUrl, location.origin).toString();
    } catch {
      return null;
    }
  }

  async function fetchHtml(url) {
    const res = await fetch(url, { credentials: "include" });
    await sleep(REQUEST_DELAY_MS);
    if (!res.ok) throw new Error(`GET fehlgeschlagen: ${res.status} ${res.statusText}`);
    return await res.text();
  }

  function parseHtmlToDoc(html) {
    return new DOMParser().parseFromString(html, "text/html");
  }

  function serializeFormLikeRails(formEl) {
    const params = new URLSearchParams();

    const fields = Array.from(formEl.querySelectorAll("input, select, textarea"));
    for (const el of fields) {
      const name = el.getAttribute("name");
      if (!name) continue;

      const tag = el.tagName.toLowerCase();
      const type = (el.getAttribute("type") || "").toLowerCase();

      if (tag === "input") {
        if (type === "checkbox" || type === "radio") {
          if (!el.checked) continue;
          params.append(name, el.value ?? "on");
        } else if (type === "submit" || type === "button") {
          continue;
        } else {
          params.append(name, el.value ?? "");
        }
      } else if (tag === "select") {
        params.append(name, el.value ?? "");
      } else if (tag === "textarea") {
        params.append(name, el.value ?? "");
      }
    }
    return params;
  }

  function dispatchUserEvents(el) {
    if (!el) return;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  async function loadInHiddenIframe(url) {
    const iframe = document.createElement("iframe");
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    iframe.style.top = "-9999px";
    iframe.style.opacity = "0";
    iframe.setAttribute("aria-hidden", "true");

    const loaded = new Promise((resolve, reject) => {
      const onLoad = () => {
        iframe.removeEventListener("load", onLoad);
        resolve();
      };
      iframe.addEventListener("load", onLoad);
      iframe.addEventListener(
        "error",
        () => reject(new Error("Iframe konnte nicht laden.")),
        { once: true }
      );
    });

    document.body.appendChild(iframe);
    iframe.src = url;
    await loaded;
    await sleep(250);

    return iframe;
  }

  async function submitIframeFormAndWait(iframe, form) {
    const navDone = new Promise((resolve) => {
      const onLoad = () => {
        iframe.removeEventListener("load", onLoad);
        resolve();
      };
      iframe.addEventListener("load", onLoad);
    });

    const submitBtn =
      form.querySelector('button[type="submit"]') ||
      form.querySelector('input[type="submit"]') ||
      form.querySelector('button[name="commit"]') ||
      form.querySelector('input[name="commit"]');

    if (submitBtn) submitBtn.click();
    else form.submit();

    await navDone;
    await sleep(250);
  }

  // UI Status
  let massModeEnabled = false;

  const state = {
    categories: [],
    columns: [],
    isRunning: false,
  };

  // CSS
  function injectStyles() {
    const css = `
      #aao_mm_fab {
        position: fixed;
        right: 14px;
        bottom: 14px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-end;
        font-family: inherit;
      }
      #aao_mm_panel {
        width: min(560px, calc(100vw - 28px));
        max-height: min(70vh, 560px);
        overflow: auto;
        background: #fff;
        border: 1px solid rgba(0,0,0,.12);
        border-radius: 10px;
        box-shadow: 0 12px 28px rgba(0,0,0,.20);
        padding: 10px;
        display: none;
      }
      #aao_mm_panel .mm-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: flex-end;
      }
      #aao_mm_panel .mm-card {
        border: 1px solid rgba(0,0,0,.08);
        border-radius: 8px;
        padding: 8px;
        background: #fafafa;
      }
      #aao_mm_panel .mm-title {
        font-weight: 700;
        margin-bottom: 6px;
      }
      #aao_mm_panel .mm-small {
        font-size: 12px;
        opacity: .8;
      }
      #aao_mm_close {
        position: sticky;
        top: 0;
        background: #fff;
        padding-bottom: 8px;
        margin-bottom: 8px;
        border-bottom: 1px solid rgba(0,0,0,.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      }
      #aao_mm_close .mm-head {
        font-weight: 800;
      }
      #aao_mm_panel .mm-log {
        margin-top: 8px;
        max-height: 220px;
        overflow: auto;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 12px;
        background: #fff;
        border: 1px solid rgba(0,0,0,.08);
        padding: 8px;
        border-radius: 8px;
      }
      .aao_mm_wrap {
        display: inline-flex;
        align-items: center;
        margin-right: 6px;
        vertical-align: middle;
      }
    `;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildFloatingUiAndInlineButton() {
    const tutorialBtn = findTutorialButton();
    if (!tutorialBtn) return;

    // Inline Button
    const inlineToggle = document.createElement("a");
    inlineToggle.href = "javascript:void(0)";
    inlineToggle.id = "aao_massmode_open";
    inlineToggle.className = "btn btn-xs btn-default";
    inlineToggle.textContent = "Massenbearbeitung öffnen";
    inlineToggle.style.marginRight = "6px";
    tutorialBtn.parentElement.insertBefore(inlineToggle, tutorialBtn);

    // UI
    const fab = document.createElement("div");
    fab.id = "aao_mm_fab";

    const panel = document.createElement("div");
    panel.id = "aao_mm_panel";
    panel.innerHTML = `
      <div id="aao_mm_close">
        <div class="mm-head">AAO Massenbearbeitung</div>
        <div style="display:flex; gap:8px;">
          <button id="aao_mm_hide" class="btn btn-default btn-xs" type="button">Schließen</button>
        </div>
      </div>

      <div class="mm-row">
        <div class="mm-card" style="min-width:240px; flex:1;">
          <div class="mm-title">Aktion</div>
          <label style="display:block; margin:2px 0;">
            <input type="radio" name="aao_mm_action" value="prefix" checked> Präfix ändern
          </label>
          <label style="display:block; margin:2px 0;">
            <input type="radio" name="aao_mm_action" value="suffix"> Suffix ändern
          </label>
          <label style="display:block; margin:2px 0;">
            <input type="radio" name="aao_mm_action" value="category"> In andere Kategorie verschieben
          </label>
          <label style="display:block; margin:2px 0;">
            <input type="radio" name="aao_mm_action" value="column"> In andere Spalte verschieben
          </label>
        </div>

        <div class="mm-card" style="min-width:260px; flex:1;">
          <div class="mm-title">Präfix / Suffix</div>

          <div class="mm-small">Neues Präfix</div>
          <input id="aao_mm_prefix" class="form-control input-sm" type="text" placeholder="z.B. 2x">
          <label class="mm-small" style="display:block; margin-top:6px;">
            <input id="aao_mm_prefix_remove_old" type="checkbox">
            altes Präfix entfernen (bis erstes Leerzeichen)
          </label>

          <div style="height:8px;"></div>

          <div class="mm-small">Neues Suffix</div>
          <input id="aao_mm_suffix" class="form-control input-sm" type="text" placeholder="z.B. (AAO)">
          <label class="mm-small" style="display:block; margin-top:6px;">
            <input id="aao_mm_suffix_remove_old" type="checkbox">
            altes Suffix entfernen (ab letztem Leerzeichen)
          </label>
        </div>

        <div class="mm-card" style="min-width:240px; flex:1;">
          <div class="mm-title">Kategorie / Spalte</div>

          <div class="mm-small">Kategorie</div>
          <select id="aao_mm_category" class="form-control input-sm"></select>

          <div style="height:8px;"></div>

          <div class="mm-small">Spalte</div>
          <select id="aao_mm_column" class="form-control input-sm"></select>
        </div>

        <div class="mm-card" style="min-width:240px;">
          <div class="mm-title">Auswahl</div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button id="aao_mm_select_all" class="btn btn-default btn-sm" type="button">Alle</button>
            <button id="aao_mm_select_none" class="btn btn-default btn-sm" type="button">Keine</button>
            <button id="aao_mm_invert" class="btn btn-default btn-sm" type="button">Invertieren</button>
          </div>
          <div style="height:8px;"></div>
          <button id="aao_mm_save" class="btn btn-success btn-sm" type="button">
            Massenänderung speichern
          </button>
        </div>
      </div>

      <div class="mm-card" style="margin-top:10px;">
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
          <div id="aao_mm_progress" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">
            Bereit.
          </div>
          <div class="mm-small">(100ms Abstand zwischen Requests)</div>
        </div>
        <div id="aao_mm_log" class="mm-log"></div>
      </div>
    `;

    fab.appendChild(panel);
    document.body.appendChild(fab);

    // Sichtbarkeit UI Umschalten
    inlineToggle.addEventListener("click", () => openPanel(true));
    $("#aao_mm_hide", panel).addEventListener("click", () => openPanel(false));

    $("#aao_mm_select_all", panel).addEventListener("click", () => setAllCheckboxes(true));
    $("#aao_mm_select_none", panel).addEventListener("click", () => setAllCheckboxes(false));
    $("#aao_mm_invert", panel).addEventListener("click", () => invertCheckboxes());
    $("#aao_mm_save", panel).addEventListener("click", () => runBulkSave());

    function openPanel(enable) {
      if (state.isRunning) return;
      massModeEnabled = !!enable;
      panel.style.display = massModeEnabled ? "block" : "none";
      setCheckboxVisibility(massModeEnabled);

      if (massModeEnabled) {
        setProgress("Lade Kategorien/Spalten…");
        loadMetaFromFirstEdit()
          .then(() => setProgress("Bereit."))
          .catch((e) => {
            setProgress("Fehler beim Laden der Meta-Daten.");
            logLine(`FEHLER: ${e?.message || e}`);
          });
      }
    }
  }

  // Checkboxen einfügen
  function ensureCheckboxes() {
    const groups = findAllAaoGroups();
    for (const g of groups) {
      if (g.dataset.mmPrepared === "1") continue;

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "aao_mm_checkbox";
      cb.style.marginRight = "6px";

      const wrap = document.createElement("span");
      wrap.className = "aao_mm_wrap";
      wrap.appendChild(cb);

      g.parentElement.insertBefore(wrap, g);
      g.dataset.mmPrepared = "1";
    }
  }

  function setCheckboxVisibility(visible) {
    $all(".aao_mm_wrap").forEach((w) => (w.style.display = visible ? "inline-flex" : "none"));
  }

  function getSelectedGroups() {
    const groups = findAllAaoGroups();
    const selected = [];
    for (const g of groups) {
      const wrap = g.previousElementSibling;
      const cb = wrap?.querySelector?.("input.aao_mm_checkbox");
      if (cb?.checked) selected.push(g);
    }
    return selected;
  }

  function setAllCheckboxes(value) {
    $all("input.aao_mm_checkbox").forEach((cb) => (cb.checked = value));
  }

  function invertCheckboxes() {
    $all("input.aao_mm_checkbox").forEach((cb) => (cb.checked = !cb.checked));
  }

  // UI Helper
  function fillSelect(selectEl, items, includeEmpty = true) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    if (includeEmpty) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "";
      selectEl.appendChild(opt);
    }
    for (const it of items) {
      const opt = document.createElement("option");
      opt.value = it.value;
      opt.textContent = it.label;
      selectEl.appendChild(opt);
    }
  }

  function logLine(text) {
    const log = $("#aao_mm_log");
    if (!log) return;
    const div = document.createElement("div");
    div.innerHTML = escapeHtml(text);
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  function setProgress(text) {
    const el = $("#aao_mm_progress");
    if (el) el.textContent = text;
  }

  // Kategorien und Spalten laden (für UI)
  async function loadMetaFromFirstEdit() {
    const firstGroup = findAllAaoGroups()[0];
    const href = firstGroup ? getEditHrefFromGroup(firstGroup) : null;
    if (!href) throw new Error("Konnte keinen Bearbeiten-Link in der ersten Button-Group finden.");

    const url = absolutizeUrl(href);
    const html = await fetchHtml(url);
    const doc = parseHtmlToDoc(html);

    const catSel = doc.querySelector("#aao_aao_category_id");
    const colSel = doc.querySelector("#aao_column_number");

    if (!catSel) throw new Error("Kategorien-Select (#aao_aao_category_id) nicht gefunden.");
    if (!colSel) throw new Error("Spalten-Select (#aao_column_number) nicht gefunden.");

    const categories = Array.from(catSel.querySelectorAll("option")).map((o) => ({
      value: o.getAttribute("value") ?? "",
      label: (o.textContent || "").trim(),
      selected: o.hasAttribute("selected"),
    }));

    const columns = Array.from(colSel.querySelectorAll("option")).map((o) => ({
      value: o.getAttribute("value") ?? "",
      label: (o.textContent || "").trim(),
      selected: o.hasAttribute("selected"),
    }));

    state.categories = categories.filter((x) => x.label !== "" || x.value === "");
    state.columns = columns.filter((x) => x.label !== "" || x.value === "");

    fillSelect($("#aao_mm_category"), state.categories, true);
    fillSelect($("#aao_mm_column"), state.columns, true);

    const selectedCat = categories.find((c) => c.selected)?.value ?? "";
    const selectedCol = columns.find((c) => c.selected)?.value ?? "";
    const catUi = $("#aao_mm_category");
    const colUi = $("#aao_mm_column");
    if (catUi) catUi.value = selectedCat;
    if (colUi) colUi.value = selectedCol;

    logLine(`Meta geladen: ${state.categories.length - 1} Kategorien, ${state.columns.length - 1} Spalten.`);
  }

  // Name bearbeiten
  function applyPrefix(caption, prefix, removeOld) {
    let base = caption || "";
    if (removeOld) {
      const idx = base.indexOf(" ");
      if (idx > -1) base = base.slice(idx + 1);
    }
    return `${prefix || ""}${base}`;
  }

  function applySuffix(caption, suffix, removeOld) {
    let base = caption || "";
    if (removeOld) {
      const idx = base.lastIndexOf(" ");
      if (idx > -1) base = base.slice(0, idx);
    }
    return `${base}${suffix || ""}`;
  }

  function getChosenAction() {
    const r = $('input[name="aao_mm_action"]:checked');
    return r ? r.value : "prefix";
  }

  // Hauptfunktion
  async function processOneGroup(groupEl, index, total) {
    const editHref = getEditHrefFromGroup(groupEl);
    if (!editHref) throw new Error("Bearbeiten-Link nicht gefunden.");
    const editUrl = absolutizeUrl(editHref);

    setProgress(`[${index}/${total}] Öffne Edit-Seite (iframe)…`);
    const iframe = await loadInHiddenIframe(editUrl);

    try {
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) throw new Error("Kein Zugriff auf iframe-Dokument (CSP/Same-Origin?).");

      const form = doc.querySelector("form");
      if (!form) throw new Error("Formular auf Edit-Seite nicht gefunden.");

      const captionInput = doc.querySelector("#aao_caption");
      const catSelect = doc.querySelector("#aao_aao_category_id");
      const colSelect = doc.querySelector("#aao_column_number");

      const action = getChosenAction();

      if (action === "prefix") {
        if (!captionInput) throw new Error("Caption-Input (#aao_caption) nicht gefunden.");
        const prefix = $("#aao_mm_prefix")?.value || "";
        const removeOld = $("#aao_mm_prefix_remove_old")?.checked || false;
        const current = captionInput.value ?? "";
        captionInput.value = applyPrefix(current, prefix, removeOld);
        dispatchUserEvents(captionInput);
      }

      if (action === "suffix") {
        if (!captionInput) throw new Error("Caption-Input (#aao_caption) nicht gefunden.");
        const suffix = $("#aao_mm_suffix")?.value || "";
        const removeOld = $("#aao_mm_suffix_remove_old")?.checked || false;
        const current = captionInput.value ?? "";
        captionInput.value = applySuffix(current, suffix, removeOld);
        dispatchUserEvents(captionInput);
      }

      if (action === "category") {
        if (!catSelect) throw new Error("Kategorie-Select (#aao_aao_category_id) nicht gefunden.");
        const newCat = $("#aao_mm_category")?.value;
        if (!newCat) throw new Error("Keine Ziel-Kategorie ausgewählt.");
        catSelect.value = newCat;
        dispatchUserEvents(catSelect);
      }

      if (action === "column") {
        if (!colSelect) throw new Error("Spalten-Select (#aao_column_number) nicht gefunden.");
        const newCol = $("#aao_mm_column")?.value;
        if (!newCol) throw new Error("Keine Ziel-Spalte ausgewählt.");
        colSelect.value = newCol;
        dispatchUserEvents(colSelect);
      }

      setProgress(`[${index}/${total}] Warte vor dem Speichern…`);
      await sleep(EDIT_TO_SAVE_DELAY_MS);

      setProgress(`[${index}/${total}] Speichere (echter Submit)…`);
      await submitIframeFormAndWait(iframe, form);

      // Grobe Fehler-Erkennung nach Submit
      const afterDoc = iframe.contentDocument;
      if (afterDoc?.querySelector(".error_explanation, .flash.alert, .alert.alert-danger")) {
        throw new Error("Server meldet Fehler nach dem Speichern (Edit-Seite enthält Fehlermeldung).");
      }

      setProgress(`[${index}/${total}] OK`);
    } finally {
      iframe.remove();
      await sleep(REQUEST_DELAY_MS);
    }
  }

  async function runBulkSave() {
    if (state.isRunning) return;

    const selected = getSelectedGroups();
    const total = selected.length;

    const log = $("#aao_mm_log");
    if (log) log.innerHTML = "";

    if (total === 0) {
      setProgress("Keine AAOs ausgewählt.");
      return;
    }

    const action = getChosenAction();
    if (action === "prefix" && !($("#aao_mm_prefix")?.value || "")) {
      logLine("Warnung: Präfix ist leer (es wird nur ggf. altes Präfix entfernt).");
    }
    if (action === "suffix" && !($("#aao_mm_suffix")?.value || "")) {
      logLine("Warnung: Suffix ist leer (es wird nur ggf. altes Suffix entfernt).");
    }

    state.isRunning = true;
    setProgress(`Starte… (0/${total})`);

    const saveBtn = $("#aao_mm_save");
    if (saveBtn) saveBtn.disabled = true;

    let ok = 0;
    let fail = 0;

    for (let i = 0; i < total; i++) {
      const idx = i + 1;
      const group = selected[i];

      try {
        logLine(`→ [${idx}/${total}] ${getEditHrefFromGroup(group)}`);
        await processOneGroup(group, idx, total);
        ok++;
        logLine(`   ✓ OK`);
      } catch (e) {
        fail++;
        logLine(`   ✗ FEHLER: ${e?.message || e}`);
      }

      setProgress(`Fertig: ${ok} OK, ${fail} Fehler (von ${total})`);
    }

    logLine(`Done. ${ok} OK, ${fail} Fehler.`);
    state.isRunning = false;
    if (saveBtn) saveBtn.disabled = false;

    setProgress("Fertig. Seite wird neu geladen…");
    await sleep(400);
    location.reload();
  }

  // Initialisierung
  function init() {
    if (!findTutorialButton()) return;

    injectStyles();
    ensureCheckboxes();
    setCheckboxVisibility(false);
    buildFloatingUiAndInlineButton();
  }

  init();
})();
