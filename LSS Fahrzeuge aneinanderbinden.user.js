// ==UserScript==
// @name         LSS-Fahrzeuge aneinanderbinden
// @namespace    https://www.leitstellenspiel.de/
// @version      2.10
// @description  Bindet Fahrzeuge aneinander und setzt automatisch die Checkbox, wenn das andere ausgewählt wird.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

// Funktion zum Lesen der vorhandenen Fahrzeuge über die API
async function getVehicles() {
  const response = await fetch('https://www.leitstellenspiel.de/api/vehicles');
  const data = await response.json();
  return data;
}

// Funktion zum Speichern der ID-Paare im Local Storage
function saveIDPair(fahrzeug1ID, fahrzeug2ID) {
  const existingPairs = JSON.parse(localStorage.getItem('vehiclePairs')) || [];
  existingPairs.push({ fahrzeug1ID, fahrzeug2ID });
  localStorage.setItem('vehiclePairs', JSON.stringify(existingPairs));
}

// Funktion zum Laden der ID-Paare aus dem Local Storage
function loadIDPairs() {
  const existingPairs = JSON.parse(localStorage.getItem('vehiclePairs')) || [];
  return existingPairs;
}

// Funktion zum Exportieren der gespeicherten ID-Paare
function exportIDPairs() {
  const existingPairs = loadIDPairs();
  const exportData = JSON.stringify(existingPairs);
  const blob = new Blob([exportData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vehiclePairs.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Funktion zum Importieren von ID-Paaren
function importIDPairs() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedPairs = JSON.parse(e.target.result);
        localStorage.setItem('vehiclePairs', JSON.stringify(importedPairs));
        alert('ID-Paare erfolgreich importiert!');
        window.location.reload();
      } catch (error) {
        console.error('Fehler beim Importieren der ID-Paare:', error);
        alert('Fehler beim Importieren der ID-Paare!');
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

// Überwachung der Checkboxen bei Änderungen
function syncCheckboxes() {
  const vehiclePairs = loadIDPairs();
  vehiclePairs.forEach(async (pair) => {
    const checkbox1 = document.getElementById('vehicle_checkbox_' + pair.fahrzeug1ID);
    const checkbox2 = document.getElementById('vehicle_checkbox_' + pair.fahrzeug2ID);

    if (checkbox1 && checkbox2) {
      if (checkbox1.checked && !checkbox2.checked) {
        checkbox2.checked = true; // Checkbox 2 auswählen
        checkbox2.dispatchEvent(new Event('change', { bubbles: true })); // "change" Event auslösen
      } else if (!checkbox1.checked && checkbox2.checked) {
        checkbox1.checked = true; // Checkbox 1 auswählen
        checkbox1.dispatchEvent(new Event('change', { bubbles: true })); // "change" Event auslösen
      }
    }
  });
}

// Überwachung der Checkboxen bei Aktualisierungen durch das System
setInterval(syncCheckboxes, 1000); // Überprüfung alle 1 Sekunde (kann angepasst werden)

// Überwachung der URL und Einfügen der Fahrzeug-ID-Eingabefelder
const urlRegex = /https:\/\/www.leitstellenspiel.de\/vehicles\/(\d+)\/edit/;
const match = window.location.href.match(urlRegex);

if (match) {
  const inputContainer = document.createElement('div');
  const vehicleID = match[1];
  const existingPairs = loadIDPairs();
  const boundVehicle = existingPairs.find(
    (pair) => pair.fahrzeug1ID === vehicleID || pair.fahrzeug2ID === vehicleID
  );

  if (boundVehicle) {
    const boundVehicleID =
      boundVehicle.fahrzeug1ID === vehicleID ? boundVehicle.fahrzeug2ID : boundVehicle.fahrzeug1ID;
    const boundVehicleText = document.createElement('span');
    const boundVehicleCaption = await getCaptionByID(boundVehicleID);
    boundVehicleText.textContent = `Dieses Fahrzeug ist gebunden an das Fahrzeug: ${boundVehicleCaption}`;
    inputContainer.appendChild(boundVehicleText);

    boundVehicleText.addEventListener('click', () => {
      const confirmDisconnect = confirm('Soll die Verbindung wirklich getrennt werden?');

      if (confirmDisconnect) {
        const updatedPairs = existingPairs.filter((pair) => pair !== boundVehicle);
        localStorage.setItem('vehiclePairs', JSON.stringify(updatedPairs));
        alert('Die Verbindung wurde getrennt.');
        window.location.reload();
      }
    });
  } else {
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Exportieren';
    exportButton.addEventListener('click', exportIDPairs);

    const importButton = document.createElement('button');
    importButton.textContent = 'Importieren';
    importButton.addEventListener('click', importIDPairs);

    inputContainer.appendChild(document.createTextNode('Exportieren/Importieren von ID-Paaren: '));
    inputContainer.appendChild(exportButton);
    inputContainer.appendChild(importButton);
    inputContainer.appendChild(document.createElement('br'));

    const vehicle2IDInput = document.createElement('input');
    vehicle2IDInput.type = 'text';
    vehicle2IDInput.id = 'vehicle2ID';
    vehicle2IDInput.name = 'vehicle2ID';
    vehicle2IDInput.setAttribute('list', 'vehicleList');

    const vehicleList = document.createElement('datalist');
    vehicleList.id = 'vehicleList';

    const saveButton = document.createElement('button');
    saveButton.id = 'saveButton';
    saveButton.textContent = 'Speichern';

    inputContainer.appendChild(document.createTextNode('An dieses Fahrzeug fest ankoppeln: '));
    inputContainer.appendChild(vehicle2IDInput);
    inputContainer.appendChild(document.createElement('br'));
    inputContainer.appendChild(vehicleList);
    inputContainer.appendChild(document.createElement('br'));
    inputContainer.appendChild(saveButton);

    saveButton.addEventListener('click', async () => {
      const vehicle2ID = vehicle2IDInput.value.trim();

      if (vehicle2ID) {
        const vehicles = await getVehicles();
        const filteredVehicles = vehicles.filter((vehicle) => {
          const vehicleID = vehicle.id.toString();
          const vehicleCaption = vehicle.caption.toLowerCase();
          return vehicleID.includes(vehicle2ID) || vehicleCaption.includes(vehicle2ID);
        });

        if (filteredVehicles.length > 0) {
          const selectedVehicle = filteredVehicles[0];
          saveIDPair(vehicleID, selectedVehicle.id.toString());
          alert('ID-Paar erfolgreich gespeichert!');
          vehicle2IDInput.value = '';
        } else {
          alert('Fahrzeug-ID existiert nicht!');
        }
      } else {
        alert('Bitte gib eine Fahrzeug-ID ein!');
      }
    });

    // Laden der ID-Paare aus dem Local Storage
    const existingPairs = loadIDPairs();

    // Vorschläge für Fahrzeug-IDs anzeigen
    vehicle2IDInput.addEventListener('input', async () => {
      const vehicles = await getVehicles();
      vehicleList.innerHTML = '';

      const userInput = vehicle2IDInput.value.trim().toLowerCase();

      vehicles.forEach((vehicle) => {
        const option = document.createElement('option');
        const vehicleID = vehicle.id.toString();
        const vehicleCaption = vehicle.caption;

        if (vehicleID.includes(userInput) || vehicleCaption.toLowerCase().includes(userInput)) {
          option.value = vehicleID;
          option.textContent = `${vehicleCaption} (${vehicleID})`;
          vehicleList.appendChild(option);
        }
      });
    });
  }

  document.body.appendChild(inputContainer);
}

// Hilfsfunktion zum Abrufen der Caption anhand der ID
async function getCaptionByID(vehicleID) {
  const response = await fetch(`https://www.leitstellenspiel.de/api/vehicles/${vehicleID}`);
  const data = await response.json();
  return data.caption;
}
