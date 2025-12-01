// ==UserScript==
// @name         LSS Verbandrang im Profil anzeigen
// @version      1.0
// @description  Zeigt im Profil an, ob ein Spieler in seinem Verband einen Rang hat
// @author       Sobol
// @match        https://www.leitstellenspiel.de/profile/*
// @grant        GM_xmlhttpRequest
// @connect      leitstellenspiel.de
// ==/UserScript==

(function() {
    'use strict';

    // Profilname aus dem <h1> extrahieren
    const h1 = document.querySelector("h1");
    if (!h1) return;

    const username = h1.textContent.trim().replace(/\s+/g, "");

    // Verbandselement suchen
    const allianceLink = document.querySelector('a[href^="/alliances/"]');
    if (!allianceLink) return; // Kein Verband vorhanden

    const allianceId = allianceLink.getAttribute("href").replace("/alliances/", "").trim();
    const allianceName = allianceLink.textContent.trim();

    // Container für Ausgabe einfügen
    const infoSpan = document.createElement("span");
    infoSpan.style.marginLeft = "6px";
    infoSpan.textContent = " (lade Rang...)";
    allianceLink.insertAdjacentElement("afterend", infoSpan);

    // URL zur Mitgliedersuche
    const url = `https://www.leitstellenspiel.de/verband/mitglieder/${allianceId}?utf8=%E2%9C%93&username=${encodeURIComponent(username)}`;

    // Mitgliederübersicht abrufen
    GM_xmlhttpRequest({
        method: "GET",
        url: url,
        onload: function(response) {
            if (response.status !== 200) {
                infoSpan.textContent = " (Fehler beim Laden)";
                return;
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(response.responseText, "text/html");

            const rows = doc.querySelectorAll("table.table.table-striped tbody tr");
            if (!rows.length) {
                infoSpan.textContent = " (kein Rang gefunden)";
                return;
            }

            let found = false;
            rows.forEach(row => {
                const userCell = row.querySelector("td a[href^='/profile/']");
                if (!userCell) return;

                if (userCell.textContent.trim() === username) {
                    found = true;

                    const rankCell = row.querySelectorAll("td")[1];
                    let rank = rankCell ? rankCell.innerText.trim() : "";

                    rank = rank.replace(/\s+/g, " ").trim();

                    if (rank === "" || rank === "-") {
                        infoSpan.textContent = " – kein Rang";
                    } else {
                        infoSpan.textContent = ` – Rang: ${rank}`;
                    }
                }
            });

            if (!found) {
                infoSpan.textContent = " – nicht im Verband gefunden";
            }
        }
    });

})();
