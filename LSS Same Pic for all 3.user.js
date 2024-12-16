// ==UserScript==
// @name         LSS-Same Pic for all 3
// @namespace    Leitstellenspiel - Alle Grafiken mit einem Klick hochladen
// @version      2r
// @description  Mit einem Klick alle Grafiken für eine Mission hochladen statt einzeln auswählen zu müssen
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/mission_graphics/*/mission_graphic_images/*/edit
// @grant        none
// ==/UserScript==


// Funktion zum Hochladen des Bildes in alle 3 Inputs
function uploadToAll() {
  // prüfen, ob ein Bild ausgewählt wurde
  if (!greenFile) {
    console.log("Kein Bild ausgewählt");
    return;
  }
  // Grün-Input füllen
  greenInput.files = greenFile;
  console.log("Grün: " + greenFile[0].name);
  // 500ms warten
  setTimeout(function() {
    // Gelb-Input füllen
    yellowInput.files = greenFile;
    console.log("Gelb: " + greenFile[0].name);
    // 500ms warten
    setTimeout(function() {
      // Rot-Input füllen
      redInput.files = greenFile;
      console.log("Rot: " + greenFile[0].name);
    }, 500);
  }, 500);
}

// Button erstellen
const uploadToAllButton = document.createElement("button");
uploadToAllButton.innerHTML = "In allen hochladen";
uploadToAllButton.onclick = uploadToAll;

// Formular finden
const form = document.getElementById("new_mission_graphic_image");

// Button vor dem Formular einfügen
form.parentNode.insertBefore(uploadToAllButton, form);

// Input-Felder finden
const greenInput = document.getElementById("mission_graphic_image_green_image");
const yellowInput = document.getElementById("mission_graphic_image_yellow_image");
const redInput = document.getElementById("mission_graphic_image_red_image");

// Variable zum Speichern des Bildes
let greenFile;

// Grün-Input überwachen
greenInput.addEventListener("change", function(event) {
  // Bild auslesen
  greenFile = event.target.files;
  console.log("Bild ausgewählt: " + greenFile[0].name);
});
