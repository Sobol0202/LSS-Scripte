// ==UserScript==
// @name         LSS Fahrzeuggrafiken Schnell Kopieren und Einfügen
// @version      1.0
// @description  Speichert Fahrzeuggrafiken und ermöglicht das Hochladen auf der Bearbeitungsseite
// @author       Sobol
// @match        https://www.leitstellenspiel.de/vehicle_graphics/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Speichern eines Bildes als Base64 in den lokalen Speicher
    function saveImage(imageSrc, key) {
        GM_xmlhttpRequest({
            method: "GET",
            url: imageSrc,
            responseType: "blob",
            onload: function(response) {
                let reader = new FileReader();
                reader.onloadend = function() {
                    // Speichert das Bild mit dem gegebenen Key
                    GM_setValue(key, reader.result);
                    alert(`Bild (${key}) gespeichert!`);
                };
                reader.readAsDataURL(response.response);
            },
            onerror: function(error) {
                console.error("Fehler beim Laden des Bildes:", error);
                alert("Fehler beim Speichern des Bildes.");
            }
        });
    }

    // --- Teil 1: Bild auf der Übersichtsseite speichern ---
    if (window.location.href.includes("/vehicle_graphics/") && !window.location.href.includes("/edit")) {
        document.querySelectorAll(".table.table-striped tr").forEach(row => {
            row.querySelectorAll("td img").forEach(img => {
                // Beim Klick auf ein Bild speichern, STRG = zweites Bild
                img.addEventListener("click", (event) => {
                    try {
                        console.log("Bild wird gespeichert:", img.src);
                        let key = event.ctrlKey ? "savedVehicleGraphic2" : "savedVehicleGraphic1";
                        saveImage(img.src, key);
                    } catch (error) {
                        console.error("Fehler beim Speichern des Bildes:", error);
                        alert(`Fehler beim Speichern des Bildes: ${error.message}`);
                    }
                });
            });
        });
    }

    // --- Teil 2: Gespeicherte Bilder auf der Edit-Seite einfügen ---
    if (window.location.href.includes("/vehicle_graphics/") && window.location.href.includes("/edit")) {
        // Beide gespeicherten Bilder auslesen
        let savedImage1 = GM_getValue("savedVehicleGraphic1", null);
        let savedImage2 = GM_getValue("savedVehicleGraphic2", null);

        // Für jedes Uploadfeld einen Einfügebutton hinzufügen
        document.querySelectorAll("input[type='file']").forEach(input => {
            let btn = document.createElement("button");
            btn.innerText = "Gespeichertes Bild einfügen";
            btn.style.marginLeft = "10px";

            btn.addEventListener("click", async (event) => {
                event.preventDefault();
                try {
                    // STRG = zweites Bild, sonst erstes Bild einfügen
                    let savedImage = event.ctrlKey ? savedImage2 : savedImage1;
                    if (!savedImage) {
                        alert("Kein gespeichertes Bild vorhanden!");
                        return;
                    }

                    console.log("Bild wird eingefügt in:", input.name);

                    // Base64 in Byte-Array konvertieren
                    let byteCharacters = atob(savedImage.split(',')[1]);
                    let byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    let byteArray = new Uint8Array(byteNumbers);
                    let blob = new Blob([byteArray], { type: "image/png" });
                    let file = new File([blob], "savedImage.png", { type: "image/png" });

                    // Simuliert einen Datei-Upload durch DataTransfer
                    let dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    input.files = dataTransfer.files;

                    // "change"-Event auslösen, damit die Webseite die Änderung erkennt
                    let changeEvent = new Event("change", { bubbles: true });
                    input.dispatchEvent(changeEvent);

                    alert("Bild eingefügt!");
                } catch (error) {
                    console.error("Fehler beim Einfügen des Bildes:", error);
                    alert(`Fehler beim Einfügen des Bildes: ${error.message}`);
                }
            });

            // Button neben dem Uploadfeld einfügen
            input.parentNode.insertBefore(btn, input.nextSibling);
        });
    }
})();
