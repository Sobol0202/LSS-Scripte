// ==UserScript==
// @name         LSS Streifenrouten Exportieren/Importieren
// @version      1.0
// @description  Ermöglicht das Exportieren und Importieren von Streifenrouten
// @author       Sobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        GM_xmlhttpRequest
// @connect      www.leitstellenspiel.de
// @run-at       document-idle
// ==/UserScript==


(function () {
    'use strict';

    //console.log("[CSV Exporter] Initialisiere...");

    let buttonsAlreadyAdded = false;

    function addExportButtons() {
        const tab = document.querySelector("#tab_patrol");
        if (!tab || !tab.classList.contains("active") || buttonsAlreadyAdded) return;

        const table = tab.querySelector(".table");
        if (!table) {
            //console.warn("[CSV Exporter] Tabelle nicht gefunden im tab_patrol. Aktueller HTML-Inhalt:");
            //console.log(tab.innerHTML);
            return;
        }

        const rows = table.querySelectorAll("tbody > tr");
        //console.log(`[CSV Exporter] ${rows.length} Zeilen erkannt in Streifenrouten-Tabelle.`);

        let addedCount = 0;

        rows.forEach((row, index) => {
            const tds = row.querySelectorAll("td");
            if (tds.length < 2) return;

            const link = tds[0].querySelector("a[href^='/patrols/'][href$='/edit']");
            const deleteBtn = tds[1].querySelector("a.btn-danger");

            if (!link || !deleteBtn) return;

            const routeHref = link.getAttribute("href");
            const match = routeHref.match(/\/patrols\/(\d+)\/edit/);
            if (!match) return;

            const routeId = match[1];

            if (tds[1].querySelector(".csv-export-btn")) return;

            const btn = document.createElement("button");
            btn.textContent = "CSV";
            btn.className = "btn btn-success btn-sm csv-export-btn";
            btn.style.marginRight = "5px";

            btn.addEventListener("click", () => {
                //console.log(`[CSV Exporter] Exportiere Route ${routeId}...`);
                fetchRouteData(routeHref, routeId);
            });

            // Vor den Lösch-Button einfügen
            tds[1].insertBefore(btn, deleteBtn);

            addedCount++;
        });

        if (addedCount === 0) {
            //console.warn("[CSV Exporter] Keine Buttons eingefügt – möglicherweise bereits vorhanden oder keine gültigen Zeilen gefunden.");
        } else {
            //console.log(`[CSV Exporter] Insgesamt ${addedCount} Buttons eingefügt.`);
        }

        buttonsAlreadyAdded = true;
        addImportButton();

    }

    function fetchRouteData(href, id) {
        const url = `https://www.leitstellenspiel.de${href}`;
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: function (response) {
                if (response.status !== 200) return;

                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, "text/html");
                const input = doc.querySelector("input#patrol_waypoints");

                if (!input || !input.value) {
                    //console.warn(`[CSV Exporter] Keine Koordinaten für Route ${id} gefunden.`);
                    return;
                }

                const raw = input.value;
                const csv = raw.split("|").map(coord => coord.replace(",", ";")).join("\n");
                downloadCSV(`Streifenroute_${id}`, csv);
            }
        });
    }

    function downloadCSV(filename, data) {
        const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename + ".csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        //console.log(`[CSV Exporter] Datei ${filename}.csv wurde heruntergeladen.`);
    }

    function observeTabActivation() {
        const tab = document.querySelector("#tab_patrol");
        if (!tab) {
            //console.warn("[CSV Exporter] #tab_patrol nicht gefunden. Wiederhole später...");
            setTimeout(observeTabActivation, 1000);
            return;
        }

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName === "class" && tab.classList.contains("active")) {
                    //console.log("[CSV Exporter] tab_patrol wurde aktiv. Warte 1 Sekunde...");
                    buttonsAlreadyAdded = false;
                    setTimeout(() => {
                        addExportButtons();
                    }, 1000);
                }
            }
        });

        observer.observe(tab, { attributes: true, attributeFilter: ["class"] });

        // Aktiv-überprüfung
        if (tab.classList.contains("active")) {
            //console.log("[CSV Exporter] tab_patrol ist beim Start aktiv. Warte 1 Sekunde...");
            setTimeout(() => {
                addExportButtons();
            }, 1000);
        }
    }

    observeTabActivation();

    function addImportButton() {
        const tab = document.querySelector("#tab_patrol");
        if (!tab) return;

        const addButton = tab.querySelector("a[href='/patrols/new']");
        if (!addButton || tab.querySelector("#csv-import-btn")) return;

        const importBtn = document.createElement("button");
        importBtn.textContent = "CSV Import";
        importBtn.className = "btn btn-primary pull-right";
        importBtn.id = "csv-import-btn";
        importBtn.style.marginRight = "10px";

        importBtn.addEventListener("click", () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".csv";
            input.style.display = "none";

            input.addEventListener("change", async () => {
                if (input.files.length === 0) return;

                const file = input.files[0];
                const caption = file.name.replace(/\.[^/.]+$/, "");
                const text = await file.text();

                // Konvertiere CSV: entweder ; oder , getrennt
                const rows = text.trim().split(/\r?\n/);
                const coords = rows.map(line => line.trim().replace(";", ",")).join("|");

                const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
                if (!token) {
                    //alert("Authenticity Token nicht gefunden!");
                    return;
                }

                const body = new URLSearchParams();
                body.set("utf8", "✓");
                body.set("authenticity_token", token);
                body.set("patrol[caption]", caption);
                body.set("patrol[waypoints]", coords);

                fetch("https://www.leitstellenspiel.de/patrols", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: body.toString(),
                    credentials: "include",
                }).then((res) => {
                    if (res.ok) {
                        alert(`Route "${caption}" erfolgreich importiert.`);
                        location.reload();
                    } else {
                        alert(`Import fehlgeschlagen (${res.status})`);
                    }
                });
            });

            document.body.appendChild(input);
            input.click();
            document.body.removeChild(input);
        });

        // Button vor dem bestehenden "Hinzufügen"-Button einfügen
        addButton.parentNode.insertBefore(importBtn, addButton);
    }

})();
