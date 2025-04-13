// ==UserScript==
// @name         LSS Komm in meine Arme
// @version      1.0
// @description  Bewege das Sammelobjekt zur Cursor
// @author       Sobol
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==

//ACHTUNG: Für dieses Script gibt es keine Freigabe vom Betreiber! Es ist fraglich, ob es AGB-Konform ist. Verwendung auf eigene Gefahr!
//ACHTUNG: Für dieses Script gibt es keine Freigabe vom Betreiber! Es ist fraglich, ob es AGB-Konform ist. Verwendung auf eigene Gefahr!
//ACHTUNG: Für dieses Script gibt es keine Freigabe vom Betreiber! Es ist fraglich, ob es AGB-Konform ist. Verwendung auf eigene Gefahr!
//ACHTUNG: Für dieses Script gibt es keine Freigabe vom Betreiber! Es ist fraglich, ob es AGB-Konform ist. Verwendung auf eigene Gefahr!
//ACHTUNG: Für dieses Script gibt es keine Freigabe vom Betreiber! Es ist fraglich, ob es AGB-Konform ist. Verwendung auf eigene Gefahr!
//ACHTUNG: Für dieses Script gibt es keine Freigabe vom Betreiber! Es ist fraglich, ob es AGB-Konform ist. Verwendung auf eigene Gefahr!

(function () {
    'use strict';

    //console.log("[Tampermonkey] Skript gestartet...");

    let cursorPosition = { x: null, y: null };
    let originalStyle = {};
    let originalParent = null;
    let placeholder = null;

    // Aktuelle Mausposition verfolgen
    document.addEventListener("mousemove", (e) => {
        cursorPosition.x = e.clientX;
        cursorPosition.y = e.clientY;
    });

    // Wiederholt prüfen, ob Mausposition verfügbar & Element existiert
    const checkInterval = setInterval(() => {
        const link = document.getElementById("easter-egg-link");

        if (!link) {
            //console.log("[Tampermonkey] Noch kein 'easter-egg-link' gefunden, warte weiter...");
            return;
        }

        if (cursorPosition.x === null || cursorPosition.y === null) {
            //console.log("[Tampermonkey] Warte auf Mausbewegung für Position...");
            return;
        }

        clearInterval(checkInterval);
        //console.log("[Tampermonkey] Link gefunden und Mausposition verfügbar:", cursorPosition);

        const rect = link.getBoundingClientRect();

        // Original-Styles sichern
        originalStyle = {
            position: link.style.position,
            left: link.style.left,
            top: link.style.top,
            zIndex: link.style.zIndex,
        };
        originalParent = link.parentNode;

        // Platzhalter erstellen
        placeholder = document.createElement("div");
        placeholder.style.width = `${rect.width}px`;
        placeholder.style.height = `${rect.height}px`;
        originalParent.insertBefore(placeholder, link);

        // Link zur Maus bewegen
        link.style.position = "fixed";
        link.style.zIndex = "9999";
        link.style.left = `${cursorPosition.x}px`;
        link.style.top = `${cursorPosition.y}px`;

        //console.log("[Tampermonkey] Link zur Maus verschoben.");

        // Klick-Listener
        const onClick = () => {
            //console.log("[Tampermonkey] Klick erkannt. Link wird zurückgesetzt.");

            link.style.position = originalStyle.position;
            link.style.left = originalStyle.left;
            link.style.top = originalStyle.top;
            link.style.zIndex = originalStyle.zIndex;

            if (placeholder) {
                placeholder.replaceWith(link);
            }

            document.removeEventListener("click", onClick);
        };

        document.addEventListener("click", onClick, { once: true });
    }, 100);
})();
