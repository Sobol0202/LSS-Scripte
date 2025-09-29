(async () => {
  const SLEEP_BETWEEN_ACTIONS_MS = 100;
  const SLEEP_BETWEEN_POSTS_MS   = 200;
  const SLEEP_BETWEEN_PAGES_MS   = 150;

  const sleep = (ms) => new Promise(res => setTimeout(res, ms));

  const log = (...args) => console.log("[BulkDelete]", ...args);

  // --- URL / Paging-Helfer ---------------------------------------------------
const currentUrl = new URL(window.location.href);
const urlString = currentUrl.href;
if (!urlString.includes("user-post-list")) {
  console.warn("Bitte auf einer user-post-list-Seite ausführen.");
  return;
}


  const listingUrlForPage = (n) => {
    const u = new URL(currentUrl.href);
    u.searchParams.set("pageNo", String(n));
    return u.toString();
  };

  // --- Seitenzahl aus Pagination lesen ---------------------------------------
  const getMaxPageFromDoc = (doc) => {
    try {
      const anchors = Array.from(
        doc.querySelectorAll('.pagination__list a[aria-label^="Seite"]')
      );
      if (anchors.length === 0) return 1;
      const nums = anchors
        .map(a => parseInt(a.textContent.trim(), 10))
        .filter(n => Number.isFinite(n));
      return nums.length ? Math.max(...nums) : 1;
    } catch {
      return 1;
    }
  };

  // --- fetch + DOMParser ------------------------------------------------------
  const fetchDoc = async (url) => {
    const resp = await fetch(url, { credentials: "include" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status} für ${url}`);
    const html = await resp.text();
    const parser = new DOMParser();
    return parser.parseFromString(html, "text/html");
  };

  // --- Beiträge von einer Übersichtsseite extrahieren -------------------------
  const extractPostLinksFromListingDoc = (doc) => {
    const links = Array.from(
      doc.querySelectorAll('.messageContent .messageHeaderMetaData a.permalink.messagePublicationTime')
    );
    // Fallback: alles, was wie ein postID-Link aussieht
    const uniq = new Map();
    links.forEach(a => {
      const href = a.getAttribute("href");
      if (href && href.includes("postID=")) {
        const abs = new URL(href, doc.baseURI || window.location.origin).toString();
        uniq.set(abs, true);
      }
    });
    return Array.from(uniq.keys());
  };

  // --- Alle Seiten einsammeln -------------------------------------------------
  log("Ermittle Seitenzahl …");
  const firstDoc = document;
  const maxPage = getMaxPageFromDoc(firstDoc);
  log(`Seiten insgesamt: ${maxPage}`);

  const allPostUrls = [];
  for (let p = 1; p <= maxPage; p++) {
    try {
      const url = listingUrlForPage(p);
      const doc = (p === (parseInt(currentUrl.searchParams.get("pageNo") || "1", 10)))
        ? firstDoc
        : await fetchDoc(url);
      const urls = extractPostLinksFromListingDoc(doc);
      log(`Seite ${p}: ${urls.length} Beiträge gefunden`);
      allPostUrls.push(...urls);
      if (p < maxPage) await sleep(SLEEP_BETWEEN_PAGES_MS);
    } catch (e) {
      console.warn(`Fehler beim Laden Seite ${p}:`, e);
    }
  }

  if (allPostUrls.length === 0) {
    console.warn("Keine Beiträge gefunden.");
    return;
  }

  // --- Benutzerabfrage (Bereich wählen) --------------------------------------
  const total = allPostUrls.length;
  log(`Insgesamt gefundene Beiträge: ${total}`);

  const showRangeHelp = () => {
    console.log(
      `Indexbereiche werden 1-basiert gezählt.\n` +
      `Beitrag #1 ist der erste im Gesamtergebnis, Beitrag #${total} der letzte.`
    );
  };
  showRangeHelp();

  const askInt = (msg, def) => {
    const v = prompt(msg, String(def));
    if (v === null) throw new Error("Abgebrochen.");
    const n = parseInt(v.trim(), 10);
    if (!Number.isFinite(n)) throw new Error("Ungültige Zahl.");
    return n;
    };

  let startIdx, endIdx;
  try {
    startIdx = askInt(`Erster zu löschender Beitrag (1–${total})`, 1);
    endIdx   = askInt(`Letzter zu löschender Beitrag (${startIdx}–${total})`, total);
  } catch (e) {
    console.warn(e.message || e);
    return;
  }

  if (startIdx < 1 || endIdx > total || startIdx > endIdx) {
    console.warn("Ungültiger Bereich.");
    return;
  }

  const slice = allPostUrls.slice(startIdx - 1, endIdx);
  log(`Lösche Beiträge #${startIdx}–#${endIdx} (Anzahl: ${slice.length}) …`);

  // --- Utilities fürs Klicken im Iframe --------------------------------------
  const waitFor = async (frameDoc, selector, timeoutMs = 8000) => {
    const start = performance.now();
    while (performance.now() - start < timeoutMs) {
      const el = frameDoc.querySelector(selector);
      if (el) return el;
      await sleep(50);
    }
    throw new Error(`Selector nicht gefunden: ${selector}`);
  };

  const createHiddenFrame = (src) => {
    const ifr = document.createElement("iframe");
    ifr.style.position = "fixed";
    ifr.style.bottom = "-10000px";
    ifr.style.left = "-10000px";
    ifr.style.width = "800px";
    ifr.style.height = "600px";
    ifr.setAttribute("sandbox", "allow-same-origin allow-scripts allow-forms");
    ifr.src = src;
    document.body.appendChild(ifr);
    return ifr;
  };

  const waitFrameLoad = (iframe, timeoutMs = 15000) =>
    new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("Iframe-Timeout")), timeoutMs);
      iframe.addEventListener("load", () => {
        clearTimeout(t);
        resolve();
      }, { once: true });
    });

  // --- Löschroutine für einen einzelnen Post ---------------------------------
  const deleteSinglePost = async (postUrl, indexInBatch) => {
    log(`#${indexInBatch}: Öffne`, postUrl);
    const iframe = createHiddenFrame(postUrl);
    try {
      await waitFrameLoad(iframe);

      const doc = iframe.contentDocument;
      if (!doc) throw new Error("Kein Zugriff auf Iframe-Dokument (CSP/Same-Origin?)");

      // 1) Bearbeiten-Button
      const editBtn = await waitFor(doc, 'a.jsMessageEditButton', 8000);
      editBtn.click();
      await sleep(SLEEP_BETWEEN_ACTIONS_MS);

      // 2) Dropdown "Löschen" (kann in einem Dropdown-Menü als <li data-item="trash"> erscheinen)
      const trashItem = await waitFor(doc, 'li[data-item="trash"]', 8000);
      const clickable = trashItem.querySelector('button, a, span') || trashItem;
      clickable.click();
      await sleep(SLEEP_BETWEEN_ACTIONS_MS);

      // 3) Bestätigungsdialog "OK"
      const okBtn = await waitFor(doc, 'button.buttonPrimary[data-type="submit"]', 8000);
      okBtn.click();
      await sleep(SLEEP_BETWEEN_ACTIONS_MS);
      await sleep(400);

      log(`#${indexInBatch}: ✓ gelöscht`);
    } catch (e) {
      console.warn(`#${indexInBatch}: ✗ Fehler:`, e.message || e);
    } finally {
      iframe.remove();
    }
  };

  // --- Hauptlauf --------------------------------------------------------------
  let counter = 0;
  for (const url of slice) {
    counter++;
    await deleteSinglePost(url, startIdx + counter - 1);
    await sleep(SLEEP_BETWEEN_POSTS_MS);
  }

  log(`Fertig. Versucht zu löschen: ${slice.length} Beiträge (#${startIdx}–#${endIdx}).`);
})();
