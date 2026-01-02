// ==UserScript==
// @name         LSS Notizen+
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0
// @author       Sobol
// @description  Verbessert die Notizen um einige Funktionen. Darunter Tabellen, Schriftarten, Wachennotizen und noch einiges mehr
// @match        https://www.leitstellenspiel.de/note
// @match        https://www.leitstellenspiel.de/buildings/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  const DB_NAME = "lss_note_plus_db";
  const DB_VERSION = 2;
  const STORE_NAME = "notes";
  const DB_KEY = "leitstellenspiel_note_plus_state_v2";

  const ROOT_ID = "lss-note-plus-root";
  const STYLE_ID = "lss-note-plus-style";

  const BUILDINGS_API = "https://www.leitstellenspiel.de/api/buildings";

  // Standard UI-Settings
  const DEFAULT_UI = {
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    fontSize: "14px",
    lineHeight: "1.5",
    editorPadding: "12px",
  };

  // Default-Tab
  function defaultTabsHtml() {
    return [
      {
        id: uid("tab"),
        title: "Notiz 1",
        html: "<p><b>Willkommen!</b> Du kannst hier Text formatieren und Tabellen einfügen.</p>",
      },
    ];
  }

  // Default State
  const DEFAULT_STATE_V2 = {
    version: 2,
    global: {
      activeTabId: null,
      tabs: defaultTabsHtml(),
      ui: { ...DEFAULT_UI },
      lastSelectedBuildingId: "",
      lastSelectedBuildingCaption: "",
    },
    buildings: {
    },
  };

  //Utils
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function uid(prefix = "id") {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function escapeHtml(str) {
    return (str ?? "").toString().replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[m]));
  }

  function clamp(n, min, max) {
    n = Number(n);
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function safeJsonParse(text) {
    try { return JSON.parse(text); } catch { return null; }
  }

  function nowIso() {
    return new Date().toISOString();
  }

  // Toast
  function toast(msg, type = "info", ttl = 1800) {
    const el = document.createElement("div");
    el.className = `lssnp-toast lssnp-toast-${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 260);
    }, ttl);
  }

  // IndexDB Helper
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        // Store anlegen falls nicht vorhanden
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbGet(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  }

  async function idbSet(key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  }

  // Migration (depricated)
  function isV2State(s) {
    return s && typeof s === "object" && s.version === 2 && s.global && s.buildings;
  }
  function migrateV1toV2(s) {
    const v2 = structuredClone(DEFAULT_STATE_V2);
    v2.global.tabs = Array.isArray(s?.tabs) ? s.tabs.map(t => ({
      id: t?.id || uid("tab"),
      title: (t?.title ?? "Notiz").toString(),
      html: (t?.html ?? "<p></p>").toString(),
    })) : defaultTabsHtml();

    v2.global.activeTabId = (s?.activeTabId && v2.global.tabs.some(t => t.id === s.activeTabId))
      ? s.activeTabId
      : v2.global.tabs[0].id;

    v2.global.ui = {
      ...DEFAULT_UI,
      ...(s?.ui && typeof s.ui === "object" ? s.ui : {}),
    };

    v2.global.lastSelectedBuildingId = "";
    v2.global.lastSelectedBuildingCaption = "";
    v2.buildings = {};
    return v2;
  }
  function normalizeV2(s) {
    const base = structuredClone(DEFAULT_STATE_V2);
    if (!s || typeof s !== "object") return base;
    if (s.version === 1) {
      return migrateV1toV2(s);
    }
    if (!isV2State(s)) return base;
    const g = s.global || {};
    base.global.ui = { ...DEFAULT_UI, ...(g.ui || {}) };
    base.global.tabs = Array.isArray(g.tabs) && g.tabs.length
      ? g.tabs.map(t => ({
        id: t?.id || uid("tab"),
        title: (t?.title ?? "Notiz").toString(),
        html: (t?.html ?? "<p></p>").toString(),
      }))
      : defaultTabsHtml();
    base.global.activeTabId = (g.activeTabId && base.global.tabs.some(t => t.id === g.activeTabId))
      ? g.activeTabId
      : base.global.tabs[0].id;
    base.global.lastSelectedBuildingId = (g.lastSelectedBuildingId ?? "").toString();
    base.global.lastSelectedBuildingCaption = (g.lastSelectedBuildingCaption ?? "").toString();
    base.buildings = {};
    if (s.buildings && typeof s.buildings === "object") {
      for (const [bid, b] of Object.entries(s.buildings)) {
        const idStr = (b?.buildingId ?? bid ?? "").toString();
        if (!idStr) continue;

        const tabs = Array.isArray(b?.tabs) && b.tabs.length
          ? b.tabs.map(t => ({
            id: t?.id || uid("tab"),
            title: (t?.title ?? "Notiz").toString(),
            html: (t?.html ?? "<p></p>").toString(),
          }))
          : defaultTabsHtml();

        const activeTabId = (b?.activeTabId && tabs.some(t => t.id === b.activeTabId))
          ? b.activeTabId
          : tabs[0].id;

        base.buildings[idStr] = {
          buildingId: Number.isFinite(Number(idStr)) ? Number(idStr) : idStr,
          caption: (b?.caption ?? `Gebäude ${idStr}`).toString(),
          tabs,
          activeTabId,
          ui: { ...DEFAULT_UI, ...(b?.ui || {}) },
          meta: {
            updatedAt: b?.meta?.updatedAt || nowIso(),
          },
        };
      }
    }

    return base;
  }

  // Global-Wache Unterscheidung
  const buildingMatch = location.pathname.match(/\/buildings\/(\d+)/);
  const PAGE_IS_BUILDING = !!buildingMatch;
  const PAGE_BUILDING_ID = buildingMatch ? buildingMatch[1] : null;

  // Auf /note zusätzliches Dropdown
  // Auf /buildings/ID immer aktuelle Wache
  let context = {
    type: PAGE_IS_BUILDING ? "building" : "global",
    buildingId: PAGE_IS_BUILDING ? PAGE_BUILDING_ID : "",
  };

  function getCtxRef(state) {
    if (context.type === "global") return state.global;
    const bid = context.buildingId;
    return state.buildings[bid];
  }

  function ensureBuildingContext(state, buildingId, captionMaybe = "") {
      function buildingHasNote(buildingId) {
          const b = state.buildings?.[String(buildingId)];
          if (!b) return false;

          // Hat mindestens einen Tab mit Inhalt?
          return Array.isArray(b.tabs) && b.tabs.some(t =>
                                                      t.html && t.html.replace(/<[^>]+>/g, "").trim().length > 0
                                                     );
      }

    const bid = buildingId.toString();
    if (!state.buildings[bid]) {
      state.buildings[bid] = {
        buildingId: Number(bid),
        caption: captionMaybe ? captionMaybe.toString() : `Gebäude ${bid}`,
        tabs: defaultTabsHtml(),
        activeTabId: null,
        ui: { ...DEFAULT_UI },
        meta: { updatedAt: nowIso() },
      };
      state.buildings[bid].activeTabId = state.buildings[bid].tabs[0].id;
    } else {
      // caption nachziehen, falls neu bekannt
      if (captionMaybe && captionMaybe.toString().trim()) {
        state.buildings[bid].caption = captionMaybe.toString().trim();
      }
      if (!state.buildings[bid].activeTabId || !state.buildings[bid].tabs.some(t => t.id === state.buildings[bid].activeTabId)) {
        state.buildings[bid].activeTabId = state.buildings[bid].tabs[0]?.id || uid("tab");
      }
    }
  }

  // UI 🤮
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* Root Container */
      #${ROOT_ID}{
        margin: 12px 0 0 0;
        border: 1px solid rgba(0,0,0,.08);
        border-radius: 14px;
        background: #fff;
        box-shadow: 0 4px 18px rgba(0,0,0,.06);
        overflow: hidden;
      }

      /* Header */
      #${ROOT_ID} .lssnp-header{
        display:flex;
        gap:10px;
        align-items:center;
        padding: 10px 10px;
        border-bottom: 1px solid rgba(0,0,0,.06);
        background: linear-gradient(#ffffff, #fbfbfb);
        flex-wrap: wrap;
      }

      #${ROOT_ID} .lssnp-left{
        display:flex;
        gap:8px;
        align-items:center;
        flex-wrap:wrap;
      }

      #${ROOT_ID} .lssnp-building-wrap{
        display:flex;
        align-items:center;
        gap:8px;
        padding: 6px 8px;
        border: 1px solid rgba(0,0,0,.10);
        border-radius: 999px;
        background:#fff;
      }

      #${ROOT_ID} .lssnp-building-label{
        font-size: 12.5px;
        font-weight: 700;
        opacity: .75;
        white-space: nowrap;
      }

      #${ROOT_ID} .lssnp-building-select{
        border: 0;
        outline: none;
        font-size: 12.5px;
        background: transparent;
        max-width: 320px;
      }

      #${ROOT_ID} .lssnp-building-select:disabled{
        opacity:.7;
      }

      #${ROOT_ID} .lssnp-tabs{
        display:flex;
        gap:6px;
        align-items:center;
        flex:1;
        flex-wrap:wrap;
      }

      #${ROOT_ID} .lssnp-tab{
        display:inline-flex;
        align-items:center;
        gap:8px;
        padding: 7px 10px;
        border-radius: 999px;
        border: 1px solid rgba(0,0,0,.10);
        background:#fff;
        cursor:pointer;
        user-select:none;
        max-width: 320px;
      }
      #${ROOT_ID} .lssnp-tab.active{
        border-color: rgba(0,0,0,.25);
        box-shadow: 0 1px 0 rgba(0,0,0,.06);
      }
      #${ROOT_ID} .lssnp-tab-title{
        white-space: nowrap;
        overflow:hidden;
        text-overflow: ellipsis;
        max-width: 240px;
        font-weight: 700;
        font-size: 12.5px;
      }
      #${ROOT_ID} .lssnp-tab-actions{
        display:inline-flex;
        gap:6px;
        opacity:.75;
      }
      #${ROOT_ID} .lssnp-iconbtn{
        border:0;
        background: transparent;
        padding:0;
        cursor:pointer;
        line-height:1;
        font-size:14px;
      }
      #${ROOT_ID} .lssnp-iconbtn:hover{ opacity:1; }

      #${ROOT_ID} .lssnp-right{
        display:flex;
        gap:8px;
        align-items:center;
        flex-wrap:wrap;
      }

      /* Buttons / inputs */
      #${ROOT_ID} .lssnp-btn{
        border: 1px solid rgba(0,0,0,.14);
        border-radius: 10px;
        background:#fff;
        padding: 7px 10px;
        cursor:pointer;
        font-size: 12.5px;
        line-height: 1;
      }
      #${ROOT_ID} .lssnp-btn:hover{
        background:#f7f7f7;
      }
      #${ROOT_ID} .lssnp-btn:active{
        transform: translateY(1px);
      }
      #${ROOT_ID} .lssnp-btn-primary{
        border-color: rgba(0,0,0,.18);
        font-weight: 700;
      }
      #${ROOT_ID} .lssnp-btn-danger{
        border-color: rgba(170,50,50,.4);
      }

      #${ROOT_ID} .lssnp-toolbar{
        display:flex;
        gap:8px;
        align-items:center;
        padding: 10px;
        border-bottom: 1px solid rgba(0,0,0,.06);
        flex-wrap: wrap;
        background:#fff;
      }

      #${ROOT_ID} .lssnp-group{
        display:inline-flex;
        gap:6px;
        align-items:center;
        padding-right: 10px;
        border-right: 1px solid rgba(0,0,0,.08);
      }
      #${ROOT_ID} .lssnp-group:last-child{
        border-right: 0;
        padding-right: 0;
      }

      #${ROOT_ID} select.lssnp-select,
      #${ROOT_ID} input.lssnp-input,
      #${ROOT_ID} input[type="color"].lssnp-color{
        border: 1px solid rgba(0,0,0,.14);
        border-radius: 10px;
        background:#fff;
        padding: 6px 10px;
        font-size: 12.5px;
        height: 32px;
      }
      #${ROOT_ID} input[type="color"].lssnp-color{
        padding:0;
        width: 36px;
      }

      /* Editor */
      #${ROOT_ID} .lssnp-editor-wrap{
        padding: 10px;
        background:#fff;
      }
      #${ROOT_ID} .lssnp-editor{
        border: 1px solid rgba(0,0,0,.12);
        border-radius: 14px;
        min-height: 320px;
        padding: 12px;
        outline:none;
        line-height: 1.5;
      }
      #${ROOT_ID} .lssnp-editor:focus{
        border-color: rgba(0,0,0,.28);
        box-shadow: 0 0 0 4px rgba(0,0,0,.06);
      }

      /* Tables in editor */
      #${ROOT_ID} .lssnp-editor table{
        border-collapse: collapse;
        width: 100%;
        margin: 10px 0;
      }
      #${ROOT_ID} .lssnp-editor td,
      #${ROOT_ID} .lssnp-editor th{
        border: 1px solid rgba(0,0,0,.25);
        padding: 6px 8px;
        vertical-align: top;
        min-width: 48px;
      }
      #${ROOT_ID} .lssnp-editor th{
        font-weight: 800;
        background: #f7f7f7;
      }

      /* Footer hint */
      #${ROOT_ID} .lssnp-hint{
        font-size: 12px;
        opacity: .72;
        padding: 0 12px 12px 12px;
      }
      #${ROOT_ID} .lssnp-hint code{
        background: #f5f5f5;
        padding: 1px 6px;
        border-radius: 999px;
      }

      /* Toasts */
      .lssnp-toast{
        position: fixed;
        right: 14px;
        bottom: 14px;
        z-index: 999999;
        background: rgba(20,20,20,.92);
        color: #fff;
        padding: 10px 12px;
        border-radius: 12px;
        font-size: 13px;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity .18s ease, transform .18s ease;
        max-width: 44vw;
      }
      .lssnp-toast.show{ opacity: 1; transform: translateY(0); }
      .lssnp-toast-success{ background: rgba(20,120,60,.92); }
      .lssnp-toast-warn{ background: rgba(160,120,20,.92); }
      .lssnp-toast-error{ background: rgba(150,30,30,.92); }

      /* Small subtle chip */
      #${ROOT_ID} .lssnp-chip{
        display:inline-flex;
        align-items:center;
        gap:6px;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px dashed rgba(0,0,0,.18);
        background: rgba(0,0,0,.02);
        font-size: 12px;
        opacity: .85;
        white-space: nowrap;
      }
      #${ROOT_ID} .lssnp-building-save-wrap{
  padding: 0 12px 14px 12px;
  display: flex;
  justify-content: flex-end;
}

#${ROOT_ID} .lssnp-building-save-btn{
  padding: 8px 18px;
  font-weight: 700;
  border-radius: 10px;
}

    `;
    document.head.appendChild(style);
  }

  function buildUI(container, options) {
    const { showBuildingSelect } = options;

    container.innerHTML = `
      <div class="lssnp-header">
        <div class="lssnp-left">
          ${
            showBuildingSelect
              ? `
            <div class="lssnp-building-wrap" title="Wache auswählen (lädt erst beim Klick die Gebäude über /api/buildings)">
              <span class="lssnp-building-label">Wache</span>
              <select class="lssnp-building-select" id="lssnp-building-select">
                <option value="">🌍 Allgemein</option>
              </select>
            </div>
          `
              : `
            <span class="lssnp-chip" title="Gebäude-Kontext">
              🏢 Gebäude: <b id="lssnp-building-chip"></b>
            </span>
          `
          }
        </div>

        <div class="lssnp-tabs" role="tablist" aria-label="Notiz-Tabs"></div>

        <div class="lssnp-right">
          <button class="lssnp-btn lssnp-btn-primary" data-action="add-tab" title="Neuen Tab anlegen">+ Tab</button>
          <button class="lssnp-btn" data-action="export-json" title="Export als JSON (Backup)">Export</button>
          <button class="lssnp-btn" data-action="import-json" title="Import JSON (Backup)">Import</button>
        </div>
      </div>

      <div class="lssnp-toolbar" aria-label="Formatierungsleiste">
        <div class="lssnp-group" aria-label="Schrift">
          <select class="lssnp-select" data-action="font-family" title="Schriftart">
            <option value="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">System</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Verdana, sans-serif">Verdana</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Times New Roman', serif">Times</option>
            <option value="'Courier New', monospace">Courier</option>
          </select>

          <select class="lssnp-select" data-action="font-size" title="Schriftgröße">
            <option value="12px">12</option>
            <option value="14px" selected>14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="22px">22</option>
            <option value="28px">28</option>
          </select>

          <input class="lssnp-color" data-action="fore-color" type="color" title="Schriftfarbe" />
          <input class="lssnp-color" data-action="back-color" type="color" title="Markierung" />
        </div>

        <div class="lssnp-group" aria-label="Stil">
          <button class="lssnp-btn" data-cmd="bold" title="Fett"><b>B</b></button>
          <button class="lssnp-btn" data-cmd="italic" title="Kursiv"><i>I</i></button>
          <button class="lssnp-btn" data-cmd="underline" title="Unterstrichen"><u>U</u></button>
          <button class="lssnp-btn" data-cmd="strikeThrough" title="Durchgestrichen"><s>S</s></button>
          <button class="lssnp-btn" data-cmd="removeFormat" title="Formatierung entfernen">⟲</button>
        </div>

        <div class="lssnp-group" aria-label="Absatz">
          <button class="lssnp-btn" data-cmd="insertUnorderedList" title="Aufzählung">• Liste</button>
          <button class="lssnp-btn" data-cmd="insertOrderedList" title="Nummerierung">1. Liste</button>
          <button class="lssnp-btn" data-cmd="justifyLeft" title="Links">⟸</button>
          <button class="lssnp-btn" data-cmd="justifyCenter" title="Zentriert">≡</button>
          <button class="lssnp-btn" data-cmd="justifyRight" title="Rechts">⟹</button>
          <button class="lssnp-btn" data-action="indent" title="Einzug +">↦</button>
          <button class="lssnp-btn" data-action="outdent" title="Einzug −">↤</button>
        </div>

        <div class="lssnp-group" aria-label="Einfügen">
          <button class="lssnp-btn" data-action="insert-link" title="Link einfügen">🔗 Link</button>
          <button class="lssnp-btn" data-action="insert-hr" title="Trennlinie">―</button>
          <button class="lssnp-btn" data-action="insert-date" title="Zeitstempel einfügen">🕒</button>
        </div>

        <div class="lssnp-group" aria-label="Tabelle">
          <button class="lssnp-btn" data-action="insert-table" title="Tabelle einfügen">▦ Tabelle</button>
          <button class="lssnp-btn" data-action="add-row" title="Zeile hinzufügen">+ Zeile</button>
          <button class="lssnp-btn" data-action="add-col" title="Spalte hinzufügen">+ Spalte</button>
          <button class="lssnp-btn" data-action="del-row" title="Zeile löschen">− Zeile</button>
          <button class="lssnp-btn" data-action="del-col" title="Spalte löschen">− Spalte</button>
          <button class="lssnp-btn lssnp-btn-danger" data-action="delete-table" title="Tabelle komplett löschen">🗑 Tabelle</button>
          <input class="lssnp-color" data-action="cell-bg" type="color" title="Zellenhintergrund (aktuelle Zelle)" />
          <input class="lssnp-color" data-action="cell-border" type="color" title="Zellenrahmen (Tabelle)" />
        </div>

        <div class="lssnp-group" aria-label="Werkzeuge">
          <button class="lssnp-btn" data-action="clear-tab" title="Aktuellen Tab leeren">🧹 Leeren</button>
          <button class="lssnp-btn" data-action="duplicate-tab" title="Aktuellen Tab duplizieren">⎘ Dupl.</button>
        </div>
      </div>

      <div class="lssnp-editor-wrap">
        <div class="lssnp-editor" contenteditable="true" spellcheck="true" aria-label="Notiz-Editor"></div>
      </div>

      <div class="lssnp-hint">
            ${PAGE_IS_BUILDING ? `
        <div class="lssnp-building-save-wrap">
          <button class="btn btn-success lssnp-building-save-btn">
            💾 Notiz speichern
          </button>
        </div>
      ` : ``}

        Speicherung erfolgt über den <b>grünen Speichern-Button</b> der Seite (<code>.btn.btn-success</code>) – gilt auch für die Wachenansicht.
        Auf Gebäudeseiten wird automatisch die zugehörige Notiz geladen.
      </div>
    `;
  }

  function mountRoot() {
    if (document.getElementById(ROOT_ID)) return document.getElementById(ROOT_ID);

    const anchor = (PAGE_IS_BUILDING)
      ? (document.querySelector(".building_show") || document.querySelector("main") || document.body)
      : (document.querySelector("main") || document.querySelector("#content") || document.querySelector(".container") || document.body);

    const root = document.createElement("div");
    root.id = ROOT_ID;
    anchor.appendChild(root);
    return root;
  }

  // Tabs Rendern
  function renderTabs(root, ctxRef, activeTabId) {
    const tabsHost = $(".lssnp-tabs", root);
    tabsHost.innerHTML = "";

    for (const tab of ctxRef.tabs) {
      const el = document.createElement("div");
      el.className = `lssnp-tab ${tab.id === activeTabId ? "active" : ""}`;
      el.setAttribute("role", "tab");
      el.setAttribute("aria-selected", tab.id === activeTabId ? "true" : "false");
      el.dataset.tabId = tab.id;

      el.innerHTML = `
        <span class="lssnp-tab-title" title="${escapeHtml(tab.title)}">${escapeHtml(tab.title)}</span>
        <span class="lssnp-tab-actions">
          <button class="lssnp-iconbtn" data-action="rename-tab" title="Umbenennen">✎</button>
          <button class="lssnp-iconbtn" data-action="delete-tab" title="Löschen">🗑</button>
        </span>
      `;
      tabsHost.appendChild(el);
    }
  }

  function renderActiveTab(root, ctxRef) {
    const editor = $(".lssnp-editor", root);
    const active = ctxRef.tabs.find(t => t.id === ctxRef.activeTabId) || ctxRef.tabs[0];
    editor.innerHTML = active?.html || "<p></p>";
  }

  function applyUiToEditor(root, ui) {
    const editor = $(".lssnp-editor", root);
    editor.style.fontFamily = ui.fontFamily || DEFAULT_UI.fontFamily;
    editor.style.fontSize = ui.fontSize || DEFAULT_UI.fontSize;
    editor.style.lineHeight = ui.lineHeight || DEFAULT_UI.lineHeight;
    editor.style.padding = ui.editorPadding || DEFAULT_UI.editorPadding;

    const ff = $('select[data-action="font-family"]', root);
    const fs = $('select[data-action="font-size"]', root);

    if (ff) ff.value = editor.style.fontFamily;
    if (fs) fs.value = editor.style.fontSize;
  }

  function focusEditor(root) {
    const editor = $(".lssnp-editor", root);
    editor.focus();
  }

  function exec(cmd, value = null) {
    try {
      document.execCommand(cmd, false, value);
      return true;
    } catch {
      return false;
    }
  }


  function getClosestCell() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;

    const range = sel.getRangeAt(0);
    let node = sel.anchorNode || range.startContainer;
    if (!node) return null;

    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    if (!(node instanceof HTMLElement)) return null;

    let cell = node.closest("td, th");
    if (!cell) {
      let sc = range.startContainer;
      if (sc && sc.nodeType === Node.TEXT_NODE) sc = sc.parentElement;
      if (sc instanceof HTMLElement) cell = sc.closest("td, th");
    }
    return cell;
  }

  function getClosestTableFromCell(cell) {
    return cell ? cell.closest("table") : null;
  }

  function insertTableAtCursor(rows, cols, withHeader = true) {
    rows = clamp(rows || 2, 1, 30);
    cols = clamp(cols || 3, 1, 20);

    let html = `<table><tbody>`;
    if (withHeader) {
      html += `<tr>`;
      for (let c = 0; c < cols; c++) html += `<th>Header</th>`;
      html += `</tr>`;
    }
    for (let r = 0; r < rows; r++) {
      html += `<tr>`;
      for (let c = 0; c < cols; c++) html += `<td>&nbsp;</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table><p></p>`;

    exec("insertHTML", html);
  }

  function addRowNearSelection() {
    const cell = getClosestCell();
    const table = getClosestTableFromCell(cell);
    if (!table) return false;

    const row = cell.closest("tr");
    if (!row) return false;

    const cols = row.children.length || 1;
    const newRow = document.createElement("tr");
    for (let i = 0; i < cols; i++) {
      const td = document.createElement("td");
      td.innerHTML = "&nbsp;";
      newRow.appendChild(td);
    }
    row.parentElement.insertBefore(newRow, row.nextSibling);
    return true;
  }

  function addColNearSelection() {
    const cell = getClosestCell();
    const table = getClosestTableFromCell(cell);
    if (!table) return false;

    const colIndex = Array.from(cell.parentElement.children).indexOf(cell);
    const rows = Array.from(table.querySelectorAll("tr"));

    for (const r of rows) {
      const isHeaderRow = r.querySelectorAll("th").length > 0;
      const newCell = document.createElement(isHeaderRow ? "th" : "td");
      newCell.innerHTML = isHeaderRow ? "Header" : "&nbsp;";
      const ref = r.children[colIndex + 1] || null;
      r.insertBefore(newCell, ref);
    }
    return true;
  }

  function delRowNearSelection() {
    const cell = getClosestCell();
    const table = getClosestTableFromCell(cell);
    if (!table) return false;

    const row = cell.closest("tr");
    if (!row) return false;

    const tbody = row.parentElement;
    const rows = tbody.querySelectorAll("tr");

    // Wenn letzte Zeile -> ganze Tabelle entfernen
    if (rows.length <= 1) {
      table.remove();
      return true;
    }

    row.remove();
    return true;
  }

  function delColNearSelection() {
    const cell = getClosestCell();
    const table = getClosestTableFromCell(cell);
    if (!table) return false;

    const colIndex = Array.from(cell.parentElement.children).indexOf(cell);
    const rows = Array.from(table.querySelectorAll("tr"));
    const colCount = rows[0]?.children?.length || 0;

    // Wenn letzte Spalte -> ganze Tabelle entfernen
    if (colCount <= 1) {
      table.remove();
      return true;
    }

    for (const r of rows) {
      const target = r.children[colIndex];
      if (target) target.remove();
    }
    return true;
  }

  function setCellBackground(color) {
    const cell = getClosestCell();
    if (!cell) return false;
    cell.style.backgroundColor = color;
    return true;
  }

  function setTableBorderColor(color) {
    const cell = getClosestCell();
    const table = getClosestTableFromCell(cell);
    if (!table) return false;

    table.querySelectorAll("td, th").forEach((x) => {
      x.style.borderColor = color;
    });
    return true;
  }

  function deleteTableNearSelection() {
    const cell = getClosestCell();
    const table = getClosestTableFromCell(cell);
    if (!table) return false;
    const ok = confirm("Tabelle wirklich vollständig löschen?");
    if (!ok) return false;
    table.remove();
    return true;
  }

  // Import, Export
  function downloadJson(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 700);
  }

  function promptImportJson(onLoaded) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      const parsed = safeJsonParse(text);
      if (!parsed) {
        toast("Import fehlgeschlagen: ungültiges JSON.", "error");
        return;
      }
      onLoaded(parsed);
    };
    input.click();
  }

  // Building API
    function buildingHasNote(buildingId) {
  const b = state?.buildings?.[String(buildingId)];
  if (!b) return false;

  return Array.isArray(b.tabs) && b.tabs.some(t =>
    t?.html && t.html.replace(/<[^>]+>/g, "").trim().length > 0
  );
}

  let buildingsLoaded = false;
  let buildingListCache = []; //

  async function loadBuildingsIntoSelect(selectEl) {
    if (buildingsLoaded) return;

    selectEl.disabled = true;
    const prev = selectEl.innerHTML;
    selectEl.innerHTML = `<option value="">Lade…</option>`;

    try {
      const res = await fetch(BUILDINGS_API, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("API response not array");

      buildingListCache = data;
      buildingsLoaded = true;

      selectEl.innerHTML = `<option value="">🌍 Allgemein</option>`;

      // Sortierung nach caption
      data
        .slice()
        .sort((a, b) => (a?.caption ?? "").localeCompare((b?.caption ?? ""), "de"))
        .forEach((b) => {
          if (!b || typeof b !== "object") return;
          const hasNote = buildingHasNote(b.id);

          const opt = document.createElement("option");
          opt.value = String(b.id);
          opt.textContent = `${hasNote ? "📝" : "⬜"} ${b.caption ?? `Gebäude ${b.id}`}`;
          opt.title = hasNote
              ? "Für diese Wache existiert bereits eine Notiz"
          : "Noch keine Notiz für diese Wache";

          if (hasNote) {
              opt.dataset.hasNote = "1";
          }

          selectEl.appendChild(opt);

        });

      toast("Wachen geladen.", "success");
    } catch (e) {
      console.error(e);
      selectEl.innerHTML = prev || `<option value="">🌍 Allgemein</option>`;
      toast("Wachen konnten nicht geladen werden.", "error");
    } finally {
      selectEl.disabled = false;
    }
  }


  function hookSaveButton(root, getStateRef, saveFn) {
    const candidates = $$(".btn.btn-success");
    if (!candidates.length) return false;

    const btn = candidates.find(b => b.offsetParent !== null) || candidates[0];
    if (!btn) return false;

    if (btn.dataset.lssnpHooked === "1") return true;
    btn.dataset.lssnpHooked = "1";

    btn.addEventListener("click", async () => {
      try {
        // Editor -> ctxRef
        const editor = $(".lssnp-editor", root);
        const sref = getStateRef();
        const tab = sref.tabs.find(t => t.id === sref.activeTabId) || sref.tabs[0];
        if (tab) tab.html = editor.innerHTML;

        sref.meta && (sref.meta.updatedAt = nowIso());

        await saveFn();
        toast("Notizen+ gespeichert (IndexedDB).", "success");
    // Dropdown-Icons aktualisieren
    if (!PAGE_IS_BUILDING) {
      const select = document.getElementById("lssnp-building-select");
      if (select && buildingsLoaded) {
        Array.from(select.options).forEach(opt => {
          if (!opt.value) return;
          const hasNote = buildingHasNote(opt.value);
          opt.textContent = `${hasNote ? "📝" : "⬜"} ${opt.textContent.replace(/^📝 |^⬜ /, "")}`;
          opt.title = hasNote
            ? "Für diese Wache existiert bereits eine Notiz"
            : "Noch keine Notiz für diese Wache";
        });
      }
    }

      } catch (e) {
        console.error(e);
        toast("Speichern fehlgeschlagen (IndexedDB).", "error");
      }
    }, true);

    return true;
  }

  let state = null;

  function getCurrentCtxRef() {
    return getCtxRef(state);
  }

  function persistEditorToCtx(root) {
    const editor = $(".lssnp-editor", root);
    const sref = getCurrentCtxRef();
    const tab = sref.tabs.find(t => t.id === sref.activeTabId) || sref.tabs[0];
    if (tab) tab.html = editor.innerHTML;
    if (sref.meta) sref.meta.updatedAt = nowIso();
  }

  function switchContextToGlobal(root) {
    persistEditorToCtx(root);
    context.type = "global";
    context.buildingId = "";

    const g = state.global;
    if (!g.activeTabId || !g.tabs.some(t => t.id === g.activeTabId)) {
      g.activeTabId = g.tabs[0]?.id || uid("tab");
    }

    applyUiToEditor(root, g.ui);
    renderTabs(root, g, g.activeTabId);
    renderActiveTab(root, g);
  }

    function deleteBuildingNote(root, buildingId) {
        const b = state.buildings[buildingId];
        if (!b) return;

        const ok = confirm(`Notiz der Wache "${b.caption}" wirklich löschen?`);
        if (!ok) return;

        delete state.buildings[buildingId];

        // zurück zur globalen Ansicht
        context.type = "global";
        context.buildingId = "";

        applyUiToEditor(root, state.global.ui);
        renderTabs(root, state.global, state.global.activeTabId);
        renderActiveTab(root, state.global);

        toast("Wachen-Notiz gelöscht.", "success");
    }


  function switchContextToBuilding(root, buildingId, caption) {
    persistEditorToCtx(root);
    context.type = "building";
    context.buildingId = buildingId.toString();

    ensureBuildingContext(state, buildingId, caption || "");

      const b = state.buildings[buildingId.toString()];

      context.type = "building";
      context.buildingId = buildingId.toString();

      applyUiToEditor(root, b.ui);
      renderTabs(root, b, b.activeTabId);
      renderActiveTab(root, b);

    state.global.lastSelectedBuildingId = buildingId.toString();
    state.global.lastSelectedBuildingCaption = (caption || b.caption || "").toString();
  }

  // Eventlistener
  function wireEvents(root, options) {
    const { showBuildingSelect } = options;

    // Clicks
    root.addEventListener("click", (ev) => {
      const tabEl = ev.target.closest(".lssnp-tab");
      const actionBtn = ev.target.closest("[data-action]");
      const cmdBtn = ev.target.closest("[data-cmd]");

      if (cmdBtn) {
        focusEditor(root);
        exec(cmdBtn.dataset.cmd);
        return;
      }

      if (actionBtn) {
        const action = actionBtn.dataset.action;

        // Tabs
        if (action === "add-tab") {
          persistEditorToCtx(root);
          const sref = getCurrentCtxRef();

          const id = uid("tab");
          sref.tabs.push({ id, title: `Notiz ${sref.tabs.length + 1}`, html: "<p></p>" });
          sref.activeTabId = id;

          renderTabs(root, sref, sref.activeTabId);
          renderActiveTab(root, sref);
          focusEditor(root);
          return;
        }

        if (action === "rename-tab") {
          const sref = getCurrentCtxRef();
          const tabId = tabEl?.dataset?.tabId;
          const tab = sref.tabs.find(t => t.id === tabId);
          if (!tab) return;

          const name = prompt("Tab-Name:", tab.title);
          if (name != null && name.trim()) {
            tab.title = name.trim();
            renderTabs(root, sref, sref.activeTabId);
          }
          return;
        }

        if (action === "delete-tab") {
          const sref = getCurrentCtxRef();
          const tabId = tabEl?.dataset?.tabId;
          if (!tabId) return;

          if (sref.tabs.length <= 1) {
            toast("Mindestens ein Tab muss bleiben.", "warn");
            return;
          }

          const tab = sref.tabs.find(t => t.id === tabId);
          const ok = confirm(`Tab "${tab?.title ?? "Notiz"}" wirklich löschen?`);
          if (!ok) return;

          persistEditorToCtx(root);

          sref.tabs = sref.tabs.filter(t => t.id !== tabId);
          if (sref.activeTabId === tabId) sref.activeTabId = sref.tabs[0].id;

          renderTabs(root, sref, sref.activeTabId);
          renderActiveTab(root, sref);
          return;
        }

        if (action === "duplicate-tab") {
          const sref = getCurrentCtxRef();
          persistEditorToCtx(root);

          const cur = sref.tabs.find(t => t.id === sref.activeTabId) || sref.tabs[0];
          const id = uid("tab");
          sref.tabs.push({
            id,
            title: `${cur?.title ?? "Notiz"} (Kopie)`,
            html: cur?.html ?? "<p></p>",
          });
          sref.activeTabId = id;

          renderTabs(root, sref, sref.activeTabId);
          renderActiveTab(root, sref);
          toast("Tab dupliziert.", "success");
          return;
        }

        if (action === "clear-tab") {
          const sref = getCurrentCtxRef();
          const ok = confirm("Aktuellen Tab wirklich leeren?");
          if (!ok) return;

          const cur = sref.tabs.find(t => t.id === sref.activeTabId) || sref.tabs[0];
          cur.html = "<p></p>";
          renderActiveTab(root, sref);
          toast("Tab geleert.", "success");
          return;
        }

        // Export / Import
        if (action === "export-json") {
          persistEditorToCtx(root);
          downloadJson("leitstellenspiel-notizen-plus-backup.json", state);
          toast("Export erstellt.", "success");
          return;
        }

        if (action === "import-json") {
          promptImportJson(async (parsed) => {
            const normalized = normalizeV2(parsed);
            state = normalized;
            // Kontext nach Import wiederherstellen
            if (PAGE_IS_BUILDING) {
              ensureBuildingContext(state, PAGE_BUILDING_ID, state.buildings?.[PAGE_BUILDING_ID]?.caption || "");
              context.type = "building";
              context.buildingId = PAGE_BUILDING_ID;
            } else {
              context.type = "global";
              context.buildingId = "";
            }

            // UI rerender
            const sref = getCurrentCtxRef();
            applyUiToEditor(root, sref.ui);
            renderTabs(root, sref, sref.activeTabId);
            renderActiveTab(root, sref);

            try {
              await idbSet(DB_KEY, state);
              toast("Import erfolgreich & gespeichert.", "success");
            } catch {
              toast("Import erfolgreich, aber Speichern schlug fehl.", "warn");
            }
          });
          return;
        }

        if (action === "indent") {
          focusEditor(root);
          exec("indent");
          return;
        }
        if (action === "outdent") {
          focusEditor(root);
          exec("outdent");
          return;
        }

        // Link und Timestamp Helper
        if (action === "insert-link") {
          focusEditor(root);
          const url = prompt("Link-URL eingeben (https://...):");
          if (url) exec("createLink", url);
          return;
        }

        if (action === "insert-hr") {
          focusEditor(root);
          exec("insertHorizontalRule");
          return;
        }

        if (action === "insert-date") {
          focusEditor(root);
          const stamp = new Date().toLocaleString();
          exec("insertText", ` ${stamp} `);
          return;
        }

        // Tabellen
        if (action === "insert-table") {
          focusEditor(root);
          const r = prompt("Wie viele Zeilen? (z.B. 3)", "3");
          const c = prompt("Wie viele Spalten? (z.B. 3)", "3");
          const withHeader = confirm("Kopfzeile (Header) hinzufügen?");
          insertTableAtCursor(Number(r), Number(c), withHeader);
          return;
        }

        if (action === "add-row") {
          focusEditor(root);
          if (!addRowNearSelection()) toast("Cursor in eine Tabellenzelle setzen.", "warn");
          return;
        }

        if (action === "add-col") {
          focusEditor(root);
          if (!addColNearSelection()) toast("Cursor in eine Tabellenzelle setzen.", "warn");
          return;
        }

        if (action === "del-row") {
          focusEditor(root);
          if (!delRowNearSelection()) toast("Cursor in eine Tabellenzelle setzen.", "warn");
          return;
        }

        if (action === "del-col") {
          focusEditor(root);
          if (!delColNearSelection()) toast("Cursor in eine Tabellenzelle setzen.", "warn");
          return;
        }

        if (action === "delete-table") {
          focusEditor(root);
          if (!deleteTableNearSelection()) toast("Cursor in eine Tabellenzelle setzen.", "warn");
          return;
        }
      }

      // Tab umschalten
      if (tabEl && !ev.target.closest("[data-action]")) {
        const sref = getCurrentCtxRef();
        const id = tabEl.dataset.tabId;
        if (!id || id === sref.activeTabId) return;

        persistEditorToCtx(root);
        sref.activeTabId = id;

        renderTabs(root, sref, sref.activeTabId);
        renderActiveTab(root, sref);
        focusEditor(root);
      }
    });

    root.addEventListener("change", (ev) => {
      const el = ev.target;
      if (!(el instanceof HTMLElement)) return;

      const sref = getCurrentCtxRef();

      if (el.matches('select[data-action="font-family"]')) {
        sref.ui.fontFamily = el.value;
        applyUiToEditor(root, sref.ui);
        return;
      }

      if (el.matches('select[data-action="font-size"]')) {
        sref.ui.fontSize = el.value;
        applyUiToEditor(root, sref.ui);
        return;
      }
    });

    // Farbauswahl
    root.addEventListener("input", (ev) => {
      const el = ev.target;
      if (!(el instanceof HTMLInputElement)) return;
      if (el.type !== "color") return;

      const action = el.dataset.action;
      const color = el.value;

      if (action === "fore-color") {
        focusEditor(root);
        exec("foreColor", color);
        return;
      }

      if (action === "back-color") {
        focusEditor(root);
        if (!exec("hiliteColor", color)) exec("backColor", color);
        return;
      }

      if (action === "cell-bg") {
        focusEditor(root);
        if (!setCellBackground(color)) toast("Cursor in eine Tabellenzelle setzen.", "warn");
        return;
      }

      if (action === "cell-border") {
        focusEditor(root);
        if (!setTableBorderColor(color)) toast("Cursor in eine Tabellenzelle setzen.", "warn");
        return;
      }
    });

    const editor = $(".lssnp-editor", root);
    let t = null;
    editor.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        persistEditorToCtx(root);
      }, 250);
    });

    // Shortcut: Ctrl+Shift+Delete -> delete table
    editor.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "Delete" || e.code === "Delete")) {
        if (deleteTableNearSelection()) {
          e.preventDefault();
          toast("Tabelle gelöscht.", "success");
        }
      }
    });

    if (showBuildingSelect) {
      const select = $("#lssnp-building-select", root);

      select.addEventListener("mousedown", async () => {
        await loadBuildingsIntoSelect(select);

        const last = state.global.lastSelectedBuildingId;
        if (last && !select.value) {
          const opt = Array.from(select.options).find(o => o.value === last);
          if (opt) {
            select.value = last;
          }
        }
      });

      select.addEventListener("change", () => {
        const val = select.value;

        if (!val) {
          // global
          state.global.lastSelectedBuildingId = "";
          state.global.lastSelectedBuildingCaption = "";
          switchContextToGlobal(root);
          toast("Allgemeine Notiz.", "info");
          return;
        }

        const caption = select.selectedOptions?.[0]?.textContent || "";
        switchContextToBuilding(root, val, caption);
        toast(`Wache: ${caption}`, "info");
      });
    }
  }

  // Bootstrap
  async function init() {
    injectStyle();

    try {
      const loaded = await idbGet(DB_KEY);
      state = normalizeV2(loaded || structuredClone(DEFAULT_STATE_V2));
    } catch (e) {
      console.error(e);
      state = structuredClone(DEFAULT_STATE_V2);
      toast("IndexedDB nicht verfügbar – nutze Fallback (nicht persistent).", "warn");
    }

    if (PAGE_IS_BUILDING) {
      ensureBuildingContext(state, PAGE_BUILDING_ID, "");
      context.type = "building";
      context.buildingId = PAGE_BUILDING_ID;
    } else {
      context.type = "global";
      context.buildingId = "";
    }

    const root = mountRoot();
    buildUI(root, { showBuildingSelect: !PAGE_IS_BUILDING });

    if (PAGE_IS_BUILDING) {
      const chip = $("#lssnp-building-chip", root);
      if (chip) {
        const b = state.buildings[PAGE_BUILDING_ID];
        chip.textContent = b?.caption ? `${b.caption} (#${PAGE_BUILDING_ID})` : `#${PAGE_BUILDING_ID}`;
      }
    }

    const sref = getCurrentCtxRef();
    if (!sref.activeTabId) sref.activeTabId = sref.tabs[0]?.id || uid("tab");

    applyUiToEditor(root, sref.ui);
    renderTabs(root, sref, sref.activeTabId);
    renderActiveTab(root, sref);


    wireEvents(root, { showBuildingSelect: !PAGE_IS_BUILDING });

    if (PAGE_IS_BUILDING) {
      const saveBtn = root.querySelector(".lssnp-building-save-btn");
      if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
          try {

            persistEditorToCtx(root);

            // IndexedDB speichern
            await idbSet(DB_KEY, state);

            toast("Gebäude-Notiz gespeichert.", "success");

          } catch (e) {
            console.error(e);
            toast("Speichern fehlgeschlagen.", "error");
          }
        });
      }
    }


    const tryHook = () => hookSaveButton(
      root,
      () => getCurrentCtxRef(),
      async () => {

        persistEditorToCtx(root);
        await idbSet(DB_KEY, state);
      }
    );

    if (!tryHook()) {
      const obs = new MutationObserver(() => {
        if (tryHook()) obs.disconnect();
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
    try { await idbSet(DB_KEY, state); } catch {}
  }

  init();
})();
