// ==UserScript==
// @name         LSS Verbandszugehörigkeit in Mitgliederliste
// @version      1.0
// @description  Zeigt die Verbandszugehörigkeit in der Verbandsliste an.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/verband/mitglieder*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(() => {
  "use strict";

  const DEBUG = false;
  const LOG_PREFIX = "[LSS-Join_Legacy]";
  const CACHE_KEY = "lss_join_cache_v2";

  const log  = (...a) => DEBUG && console.log(LOG_PREFIX, ...a);
  const warn = (...a) => DEBUG && console.warn(LOG_PREFIX, ...a);
  const err  = (...a) => DEBUG && console.error(LOG_PREFIX, ...a);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /**
   * Cache-Format:
   * {
   *   [userId]: {
   *     username: "Name",
   *     joinedIso: "YYYY-MM-DDTHH:MM:SS+02:00",
   *     legacy: true|false,
   *     legacyMarkedAt: "YYYY-MM-DDTHH:MM:SS.000Z"
   *   }
   * }
   */

  function loadCache() {
    try {
      const raw = GM_getValue(CACHE_KEY, "{}");
      const obj = JSON.parse(raw);
      return (obj && typeof obj === "object") ? obj : {};
    } catch (e) {
      err("Cache laden fehlgeschlagen:", e);
      return {};
    }
  }

  function saveCache(cache) {
    try {
      GM_setValue(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      err("Cache speichern fehlgeschlagen:", e);
    }
  }

  function pad2(n) { return String(n).padStart(2, "0"); }

  function toLocalDateOnly(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function parseLogTimeToLocalDateOnly(isoLike) {
    if (!isoLike) return null;
    const d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return null;
    return toLocalDateOnly(d);
  }

    function diffYMD_local(startLocalDateOnly, endLocalDateOnly) {
        if (!(startLocalDateOnly instanceof Date) || !(endLocalDateOnly instanceof Date)) return null;

        // Immer nur "date-only" (lokal) verwenden
        const toLocalDateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
        let start = toLocalDateOnly(startLocalDateOnly);
        let end = toLocalDateOnly(endLocalDateOnly);

        if (end < start) {
            const t = start; start = end; end = t;
        }

        const clampDay = (y, m, d) => {
            const last = new Date(y, m + 1, 0).getDate();
            return new Date(y, m, Math.min(d, last));
        };

        const addYears = (date, years) => clampDay(date.getFullYear() + years, date.getMonth(), date.getDate());
        const addMonths = (date, months) => clampDay(date.getFullYear(), date.getMonth() + months, date.getDate());

        // Jahre hochzählen
        let y = 0;
        while (addYears(start, y + 1) <= end) y++;
        let cursor = addYears(start, y);

        // Monate hochzählen
        let m = 0;
        while (addMonths(cursor, m + 1) <= end) m++;
        cursor = addMonths(cursor, m);

        // Resttage
        const msPerDay = 86400000;
        const d = Math.round((end.getTime() - cursor.getTime()) / msPerDay);

        return { y, m, d };
    }

  function formatYYMMDD(diff) {
    if (!diff) return "--:--:--";
    return `${pad2(diff.y)}:${pad2(diff.m)}:${pad2(diff.d)}`;
  }

  function getMembersTable() {
    return document.querySelector("table.table.table-striped");
  }

  function getMemberRows(table) {
    const tbody = table?.querySelector("tbody");
    return tbody ? Array.from(tbody.querySelectorAll("tr")) : [];
  }

  function extractMemberFromRow(tr) {
    const firstTd = tr.querySelector("td");
    if (!firstTd) return null;

    const profileA = firstTd.querySelector('a[href^="/profile/"]');
    if (!profileA) return null;

    const href = profileA.getAttribute("href") || "";
    const m = href.match(/\/profile\/(\d+)/);
    if (!m) return null;

    const userId = m[1];
    const username = (profileA.textContent || "").trim();
    return (userId && username) ? { userId, username } : null;
  }

  function ensureHeaderColumn(table) {
    const thead = table.querySelector("thead");
    const headerRow = thead?.querySelector("tr");
    if (!headerRow) return;

    if (headerRow.querySelector('th[data-lss-join-col="1"]')) return;

    const th = document.createElement("th");
    th.dataset.lssJoinCol = "1";
    th.textContent = "Dabei";
    th.style.whiteSpace = "nowrap";
    headerRow.appendChild(th);
  }

  function upsertRowCell(tr, text, title) {
    let td = tr.querySelector('td[data-lss-join-col="1"]');
    if (!td) {
      td = document.createElement("td");
      td.dataset.lssJoinCol = "1";
      td.style.whiteSpace = "nowrap";
      tr.appendChild(td);
    }
    td.textContent = text;
    if (title) td.title = title;
  }

  function renderKnownDurations(cache, table) {
    const rows = getMemberRows(table);
    const now = toLocalDateOnly(new Date());

    for (const tr of rows) {
      const mem = extractMemberFromRow(tr);
      if (!mem) continue;

      const entry = cache[mem.userId];
      const joinedIso = entry?.joinedIso || "";

      if (!joinedIso) {
        upsertRowCell(tr, "--:--:--", entry?.legacy ? "Legacy (kein Datum)" : "Noch nicht abgefragt");
        continue;
      }

      const joined = parseLogTimeToLocalDateOnly(joinedIso);
      if (!joined) {
        upsertRowCell(tr, "--:--:--", "Ungültiges gespeichertes Datum");
        continue;
      }

      const diff = diffYMD_local(joined, now);
      const legacySuffix = entry?.legacy ? " (Legacy)" : "";
      upsertRowCell(tr, formatYYMMDD(diff), `Aufgenommen: ${joinedIso}${legacySuffix}`);
    }
  }

  function extractProfileIdsFromCell(td) {
    if (!td) return [];
    const links = Array.from(td.querySelectorAll('a[href^="/profile/"]'));
    const ids = [];
    for (const a of links) {
      const href = a.getAttribute("href") || "";
      const m = href.match(/\/profile\/(\d+)/);
      if (m) ids.push(m[1]);
    }
    return ids;
  }

  // Username für die Suche: bei "_" nur bis zum ersten "_" nutzen
  function usernameForLogSearch(username) {
    const idx = username.indexOf("_");
    const search = idx >= 0 ? username.slice(0, idx) : username;
    return search.trim();
  }

  function parseLogfilesHTMLForJoinIso(html, expectedUserId) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const allTr = Array.from(doc.querySelectorAll("tr"));

    const exp = String(expectedUserId);

    for (let i = 0; i < allTr.length; i++) {
      const tr = allTr[i];
      const tds = tr.querySelectorAll("td");
      if (tds.length < 3) continue;

      const actionText = ((tds[2]?.textContent || tr.textContent || "")).trim().replace(/\s+/g, " ");
      if (!actionText.includes("In den Verband aufgenommen")) continue;

      const idsAll = extractProfileIdsFromCell(tr);
      const secondId = idsAll.length >= 2 ? idsAll[1] : null;
      if (secondId !== exp) continue;

      const timeSpan = tds[0]?.querySelector?.("span[data-log-time]") || tr.querySelector("span[data-log-time]");
      const iso = timeSpan?.getAttribute("data-log-time") || null;

      log("Join gefunden:", { trIndex: i, iso, idsAll, expectedUserId: exp });
      return iso;
    }

    return null;
  }

  async function fetchJoinIsoForUser(username, userId) {
    const searchName = usernameForLogSearch(username);
    const url = `/alliance_logfiles?utf8=%E2%9C%93&target_user=${encodeURIComponent(searchName)}`;
    log("Fetch:", { username, searchName, userId, url });

    const res = await fetch(url, { credentials: "same-origin", headers: { "Accept": "text/html" } });
    if (!res.ok) throw new Error(`HTTP ${res.status} bei Logfiles für ${username}`);

    const html = await res.text();
    return parseLogfilesHTMLForJoinIso(html, userId);
  }

  function addButtonNextToOnlineOnly() {
    const onlineOnlyBtn = Array.from(document.querySelectorAll('a.btn.btn-default.btn-xs'))
      .find(a => (a.getAttribute("href") || "").includes("online=true") && (a.textContent || "").includes("Nur online"));

    if (!onlineOnlyBtn) return null;
    if (document.querySelector('button[data-lss-join-fetch="1"]')) return null;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-default btn-xs";
    btn.dataset.lssJoinFetch = "1";
    btn.style.marginLeft = "6px";
    btn.textContent = "Aufnahme-Daten laden";

    const hint = document.createElement("small");
    hint.style.marginLeft = "8px";
    hint.style.opacity = "0.8";
    hint.textContent = "(Strg: alles neu)";

    onlineOnlyBtn.insertAdjacentElement("afterend", btn);
    btn.insertAdjacentElement("afterend", hint);
    return btn;
  }

  function shouldSkipFetch(entry, forceAll) {
    if (!entry) return false;
    if (entry.legacy) return true;          // Legacy nie wieder anfragen
    if (forceAll) return false;             // Strg erzwingt neu (außer Legacy)
    if (entry.joinedIso) return true;       // bekannt => nicht neu anfragen
    return false;
  }

  async function handleFetchClick(ev, table) {
    const forceAll = !!ev.ctrlKey;
    log("Klick. forceAll =", forceAll, "(Legacy wird trotzdem übersprungen)");

    const cache = loadCache();
    const rows = getMemberRows(table);
    const members = rows.map(extractMemberFromRow).filter(Boolean);

    // UI markieren
    for (const tr of rows) {
      const mem = extractMemberFromRow(tr);
      if (!mem) continue;

      const entry = cache[mem.userId];
      if (shouldSkipFetch(entry, forceAll)) continue;
      upsertRowCell(tr, "…", "Wird abgefragt");
    }

    let updated = false;

    for (let idx = 0; idx < members.length; idx++) {
      const mem = members[idx];
      const existing = cache[mem.userId] || null;

      if (shouldSkipFetch(existing, forceAll)) {
        log("Skip:", { userId: mem.userId, username: mem.username, reason: existing?.legacy ? "legacy" : "cached" });
        continue;
      }

      try {
        const iso = await fetchJoinIsoForUser(mem.username, mem.userId);

        if (iso) {
          // gefunden -> normal speichern (legacy ggf. zurücksetzen)
          cache[mem.userId] = {
            username: mem.username,
            joinedIso: iso,
            legacy: false,
          };
          log("Set joinedIso:", mem.userId, iso);
          updated = true;
        } else {
          // NICHT gefunden:
          if (existing?.joinedIso) {
            cache[mem.userId] = {
              ...existing,
              username: mem.username,
              legacy: true,
              legacyMarkedAt: new Date().toISOString(),
            };
            warn("Nicht mehr im Protokoll gefunden -> Legacy markiert (Wert bleibt):", {
              userId: mem.userId,
              username: mem.username,
              joinedIso: existing.joinedIso,
            });
            updated = true;
          } else {
            cache[mem.userId] = {
              username: mem.username,
              joinedIso: "",
              legacy: false,
            };
            warn("Kein Join-Eintrag gefunden (war vorher unbekannt):", mem.userId, mem.username);
            updated = true;
          }
        }
      } catch (e) {
        err("Fehler:", mem, e);
        if (!cache[mem.userId]) {
          cache[mem.userId] = { username: mem.username, joinedIso: "", legacy: false };
          updated = true;
        }
      }

      await sleep(100);

      const tr = rows.find(r => extractMemberFromRow(r)?.userId === mem.userId);
      if (tr) {
        const entry = cache[mem.userId];
        const now = toLocalDateOnly(new Date());

        if (entry?.joinedIso) {
          const joined = parseLogTimeToLocalDateOnly(entry.joinedIso);
          const diff = joined ? diffYMD_local(joined, now) : null;
          const legacySuffix = entry.legacy ? " (Legacy)" : "";
          upsertRowCell(tr, formatYYMMDD(diff), `Aufgenommen: ${entry.joinedIso}${legacySuffix}`);
        } else {
          upsertRowCell(tr, "--:--:--", entry?.legacy ? "Legacy (kein Datum)" : "Kein passender 'In den Verband aufgenommen'-Eintrag gefunden");
        }
      }
    }

    if (updated) saveCache(cache);
    renderKnownDurations(loadCache(), table);
    log("Fertig.");
  }

  function init() {
    const table = getMembersTable();
    if (!table) return;

    ensureHeaderColumn(table);
    renderKnownDurations(loadCache(), table);

    const btn = addButtonNextToOnlineOnly();
    if (!btn) return;

    btn.addEventListener("click", (ev) => handleFetchClick(ev, table));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
