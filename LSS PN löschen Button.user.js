// ==UserScript==
// @name         LSS PN löschen Button
// @version      1.0
// @description  Fügt einen Button zum Löschen der aktuellen Nachricht hinzu.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/messages/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Authentifizierungstoken aus dem Meta-Tag extrahieren
    const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (!authToken) {
        console.error("Kein Authentifizierungstoken gefunden.");
        return;
    }

    // Aktuelle Nachricht-ID aus der URL extrahieren
    const conversationId = window.location.pathname.split("/").pop();
    if (!conversationId || isNaN(conversationId)) {
        console.error("Keine gültige Nachrichten-ID gefunden.");
        return;
    }

    // Button erstellen
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Löschen";
    deleteButton.className = "btn btn-danger";
    deleteButton.style.position = "absolute";
    deleteButton.style.right = "10px";
    deleteButton.style.top = "50%";
    deleteButton.style.transform = "translateY(-50%)";

    deleteButton.onclick = () => {
        fetch("https://www.leitstellenspiel.de/messages/trash", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                "utf8": "✓",
                "_method": "delete",
                "authenticity_token": authToken,
                "current_box": "inbox",
                "conversations[]": conversationId,
                "commit": "Nachrichten löschen"
            })
        }).then(response => {
            if (response.ok) {
                window.location.href = "https://www.leitstellenspiel.de/messages"; // Weiterleitung nach dem Löschen
            } else {
                alert("Fehler beim Löschen der Nachricht");
            }
        }).catch(error => {
            console.error("Fehler beim Senden der Anfrage:", error);
            alert("Fehler beim Löschen der Nachricht");
        });
    };

    // Button in das .page-header div einfügen
    const pageHeader = document.querySelector(".page-header");
    if (pageHeader) {
        pageHeader.style.position = "relative";
        pageHeader.appendChild(deleteButton);
    } else {
        console.error("Element .page-header nicht gefunden.");
    }
})();
