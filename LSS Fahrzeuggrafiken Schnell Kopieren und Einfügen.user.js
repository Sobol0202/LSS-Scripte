// ==UserScript==
// @name         LSS Fahrzeuggrafiken Schnell Kopieren und Einfügen
// @version      0.9
// @description  Speichert Fahrzeuggrafiken und ermöglicht das Hochladen auf der Bearbeitungsseite
// @author       Sobol
// @match        https://www.leitstellenspiel.de/vehicle_graphics/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // Prüft, ob wir uns auf der Seite zur Fahrzeuggrafik befinden und nicht auf der Bearbeitungsseite
    if (window.location.href.includes("/vehicle_graphics/") && !window.location.href.includes("/edit")) {
        // Selektiert alle Tabellenzeilen in der Tabelle mit den Fahrzeuggrafiken
        document.querySelectorAll(".table.table-striped tr").forEach(row => {
            // Selektiert alle Bilder in den Zellen der aktuellen Zeile
            row.querySelectorAll("td img").forEach(img => {
                // Fügt jedem Bild einen Klick-Event-Listener hinzu
                img.addEventListener("click", () => {
                    try {
                        // Loggt die URL des geklickten Bildes in die Konsole
                        //console.log("Bild wird gespeichert:", img.src);
                        // Verwendet GM_xmlhttpRequest, um das Bild als Blob herunterzuladen
                        GM_xmlhttpRequest({
                            method: "GET",
                            url: img.src,
                            responseType: "blob",
                            onload: function(response) {
                                // Erstellt einen FileReader, um das Blob in eine Data-URL umzuwandeln (Base64)
                                let reader = new FileReader();
                                reader.onloadend = function() {
                                    // Speichert die Base64-kodierte Bilddaten mit GM_setValue
                                    GM_setValue("savedVehicleGraphic", reader.result);
                                    // Gibt eine Erfolgsmeldung aus
                                    alert("Bild gespeichert!");
                                };
                                // Startet das Lesen des Blobs als Data-URL
                                reader.readAsDataURL(response.response);
                            },
                            onerror: function(error) {
                                // Loggt einen Fehler, falls das Bild nicht geladen werden konnte
                                //console.error("Fehler beim Laden des Bildes:", error);
                                // Gibt eine Fehlermeldung aus
                                alert("Fehler beim Speichern des Bildes.");
                            }
                        });
                    } catch (error) {
                        // Fängt alle anderen Fehler ab, die beim Speichern auftreten könnten
                        //console.error("Fehler beim Speichern des Bildes:", error);
                        // Gibt eine detaillierte Fehlermeldung aus
                        alert(`Fehler beim Speichern des Bildes: ${error.message}`);
                    }
                });
            });
        });
    }

    // Prüft, ob wir uns auf der Bearbeitungsseite für Fahrzeuggrafiken befinden
    if (window.location.href.includes("/vehicle_graphics/") && window.location.href.includes("/edit")) {
        // Lädt das gespeicherte Bild aus dem GM_setValue
        let savedImage = GM_getValue("savedVehicleGraphic", null);
        // Wenn ein gespeichertes Bild vorhanden ist
        if (savedImage) {
            // Loggt den Anfang der Base64-Daten in die Konsole
            //console.log("Gespeichertes Bild geladen:", savedImage.substring(0, 50) + "...");

            // Selektiert alle Input-Felder vom Typ "file" (für die Bildauswahl)
            document.querySelectorAll("input[type='file']").forEach(input => {
                // Erstellt einen neuen Button
                let btn = document.createElement("button");
                // Setzt den Text des Buttons
                btn.innerText = "Gespeichertes Bild einfügen";
                // Fügt etwas Abstand hinzu
                btn.style.marginLeft = "10px";
                // Fügt dem Button einen Klick-Event-Listener hinzu
                btn.addEventListener("click", async (event) => {
                    // Verhindert die Standardaktion des Buttons
                    event.preventDefault();
                    try {
                        // Loggt den Namen des Input-Feldes in die Konsole
                        console.log("Bild wird eingefügt in:", input.name);
                        // Konvertiert die Base64-Daten zurück in ein Blob
                        let byteCharacters = atob(savedImage.split(',')[1]);
                        let byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        let byteArray = new Uint8Array(byteNumbers);
                        let blob = new Blob([byteArray], { type: "image/png" });
                        // Erstellt ein File-Objekt aus dem Blob
                        let file = new File([blob], "savedImage.png", { type: "image/png" });
                        // Erstellt ein DataTransfer-Objekt, um die Datei dem Input-Feld zuzuweisen
                        let dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        input.files = dataTransfer.files;

                        // Simuliert den "change"-Event, damit die Webseite das Hochladen erkennt
                        let changeEvent = new Event("change", { bubbles: true });
                        input.dispatchEvent(changeEvent);

                        // Gibt eine Erfolgsmeldung aus
                        alert("Bild eingefügt!");
                    } catch (error) {
                        // Fängt Fehler ab, die beim Einfügen auftreten können
                        //console.error("Fehler beim Einfügen des Bildes:", error);
                        // Gibt eine detaillierte Fehlermeldung aus
                        alert(`Fehler beim Einfügen des Bildes: ${error.message}`);
                    }
                });
                // Fügt den Button nach dem Input-Feld hinzu
                input.parentNode.insertBefore(btn, input.nextSibling);
            });
        }
    }
})()
