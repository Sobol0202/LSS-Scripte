// ==UserScript==
// @name         LSS Winterfahrzeuge
// @namespace    https://leitstellenspiel.de/
// @version      1.0
// @description  Ermöglicht Fahrzeuge zu definieren, die nur im Winter zum Einsatz kommen und sonst im FMS 6 sind
// @author       Sobol
// @match        https://www.leitstellenspiel.de/
// @match        https://www.leitstellenspiel.de/vehicles/*/edit
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  const STORE_KEY = "tm_winterVehicles";

  const STATUS_WINTER = 2; // Einsatzbereit (Winter)
  const STATUS_SUMMER = 6; // Außer Dienst / Sommermodus

  const REQUEST_DELAY_MS = 100;

  function getStore() {
    const raw = GM_getValue(STORE_KEY, "{}");
    try {
      return JSON.parse(raw) || {};
    } catch {
      return {};
    }
  }

  function saveStore(store) {
    GM_setValue(STORE_KEY, JSON.stringify(store));
  }

  function getVehicle(id) {
    return getStore()[String(id)] || null;
  }

  function setVehicleWinter(id, isWinter) {
    const store = getStore();
    const key = String(id);

    if (isWinter) {
      store[key] = store[key] || {};
      store[key].isWinter = true;
    } else {
      delete store[key];
    }

    saveStore(store);
  }

  function setVehicleLastMode(id, mode) {
    const store = getStore();
    const key = String(id);
    if (!store[key]) return;
    store[key].lastMode = mode;
    saveStore(store);
  }

  function getDesiredMode(date = new Date()) {
    const y = date.getFullYear();

    const winterStart = new Date(y, 11, 1); // 1. Dezember
    const winterEnd = new Date(y, 3, 30, 23, 59, 59); // 30. April

    if (date >= winterStart || date <= winterEnd) return "winter";
    return "summer";
  }

  async function setFmsStatus(vehicleId, status) {
    const url = `/vehicles/${vehicleId}/set_fms/${status}`;
    const res = await fetch(url, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function showProgressOverlay(text, total) {
    GM_addStyle(`
      .tm-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
      }
      .tm-box {
        background: #fff;
        padding: 20px;
        border-radius: 12px;
        width: 420px;
        text-align: center;
        font-family: system-ui, sans-serif;
      }
      .tm-progress {
        height: 12px;
        background: #eee;
        border-radius: 999px;
        overflow: hidden;
        margin-top: 12px;
      }
      .tm-progress-inner {
        height: 100%;
        width: 0%;
        background: #3b82f6;
        transition: width 0.15s linear;
      }
    `);

    const overlay = document.createElement("div");
    overlay.className = "tm-overlay";

    const box = document.createElement("div");
    box.className = "tm-box";

    const title = document.createElement("div");
    title.textContent = text;

    const counter = document.createElement("div");
    counter.style.marginTop = "6px";

    const progOuter = document.createElement("div");
    progOuter.className = "tm-progress";

    const progInner = document.createElement("div");
    progInner.className = "tm-progress-inner";

    progOuter.appendChild(progInner);
    box.append(title, counter, progOuter);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    return {
      update(done) {
        counter.textContent = `${done} / ${total}`;
        progInner.style.width = `${Math.round((done / total) * 100)}%`;
      },
      remove() {
        overlay.remove();
      },
    };
  }

  function handleEditPage() {
    const match = location.pathname.match(/^\/vehicles\/(\d+)\/edit$/);
    if (!match) return;

    const vehicleId = match[1];
    const anchor = document.querySelector("#vehicle_vehicle_type_ignore_default_aao");
    if (!anchor) return;

    const parent = anchor.closest("div");
    if (!parent || parent.dataset.tmInjected) return;
    parent.dataset.tmInjected = "1";

    const wrapper = document.createElement("div");
    wrapper.className = parent.className;

    const label = document.createElement("label");
    label.className = "boolean optional checkbox";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "boolean optional";
    cb.checked = !!getVehicle(vehicleId)?.isWinter;

    label.append(
      cb,
      document.createTextNode(
        " Winterfahrzeug (automatische Sommer-/Winterumschaltung)"
      )
    );

    cb.addEventListener("change", async () => {
      setVehicleWinter(vehicleId, cb.checked);
      if (!cb.checked) return;

      const desiredMode = getDesiredMode();
      const targetStatus =
        desiredMode === "winter" ? STATUS_WINTER : STATUS_SUMMER;

      const data = getVehicle(vehicleId);
      if (data?.lastMode === desiredMode) return;

      try {
        await setFmsStatus(vehicleId, targetStatus);
        setVehicleLastMode(vehicleId, desiredMode);
      } catch (e) {
        console.error("Winterfahrzeug Statuswechsel fehlgeschlagen", e);
      }
    });

    wrapper.appendChild(label);
    parent.insertAdjacentElement("afterend", wrapper);
  }

  async function handleHomepage() {
    if (location.pathname !== "/") return;

    const desiredMode = getDesiredMode();
    const store = getStore();

    const ids = Object.keys(store).filter(
      (id) => store[id].isWinter && store[id].lastMode !== desiredMode
    );

    if (!ids.length) return;

    const status =
      desiredMode === "winter" ? STATUS_WINTER : STATUS_SUMMER;

    const overlay = showProgressOverlay(
      desiredMode === "winter"
        ? "Es werden Fahrzeuge für den Winter einsatzbereit gemacht. Bitte warten."
        : "Es werden Fahrzeuge für den Sommer außer Dienst gestellt. Bitte warten.",
      ids.length
    );

    let done = 0;

    for (const id of ids) {
      try {
        await setFmsStatus(id, status);
        setVehicleLastMode(id, desiredMode);
      } catch (e) {
        console.error("Fehler bei Fahrzeug", id, e);
      }

      done++;
      overlay.update(done);
      await sleep(REQUEST_DELAY_MS);
    }

    await sleep(300);
    overlay.remove();
  }

  function init() {
    handleEditPage();
    handleHomepage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
