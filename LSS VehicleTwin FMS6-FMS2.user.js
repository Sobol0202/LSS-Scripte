// ==UserScript==
// @name         LSS-VehicleTwin FMS6-FMS2
// @namespace    https://www.leitstellenspiel.de/
// @version      2.2r
// @description  Schaltet ein Fahrzeug in S6, wenn das andere in S2 geht
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

// Konfiguration
const fahrzeugPaare = [
  {
    fahrzeug1ID: '51973941', // Hier Fahrzeug 1 ID eintragen
    fahrzeug2ID: '46968798', // Hier Fahrzeug 2 ID eintragen
  },
  {
    fahrzeug1ID: '15963635', // Hier Fahrzeug 1 ID des nächsten Paares eintragen
    fahrzeug2ID: '15963639', // Hier Fahrzeug 2 ID des nächsten Paares eintragen
  },
  // Weitere Fahrzeugpaare können nach Bedarf hinzugefügt werden
];

// Status der Fahrzeuge speichern
const fahrzeugStatus = {};

// Funktion zum Überprüfen der Checkboxen der Fahrzeuge
function checkVehicleCheckboxes() {
  fahrzeugPaare.forEach(fahrzeugPaar => {
    const checkbox1 = document.getElementById('vehicle_checkbox_' + fahrzeugPaar.fahrzeug1ID);
    const checkbox2 = document.getElementById('vehicle_checkbox_' + fahrzeugPaar.fahrzeug2ID);

    if (checkbox1 && checkbox2 && checkbox1.checked && checkbox2.checked) {
      // Beide Checkboxen sind ausgewählt
      checkbox2.checked = false; // Die Checkbox des zweiten Fahrzeugs wird abgewählt

      // Manuell den "change" Event auslösen, um das System über die Änderung zu informieren
      const changeEvent = new Event('change', { bubbles: true });
      checkbox2.dispatchEvent(changeEvent);
    }
  });
}

// Funktion zum Klicken auf den Button basierend auf FMS-Status
function handleFMSStatus(vehicleID, fmsStatus) {
  if (fahrzeugStatus[vehicleID] === '3') {
    return; // Fahrzeug befindet sich bereits im Status 3, keine Aktion erforderlich
  }

  const setFMSURL = `https://www.leitstellenspiel.de/vehicles/${vehicleID}/set_fms/${fmsStatus}`;

  const xhr = new XMLHttpRequest();
  xhr.open('GET', setFMSURL, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
      // Fahrzeugstatus erfolgreich aktualisiert
    } else {
      console.log(`Fahrzeug ${vehicleID}: Fehler beim Umschalten auf FMS-Status ${fmsStatus}.`);
    }
  };
  xhr.send();
}

// Überwachung der Checkboxen bei Änderungen
document.addEventListener('change', checkVehicleCheckboxes);

// Überwachung der Checkboxen bei Aktualisierungen durch das System
setInterval(checkVehicleCheckboxes, 1000); // Überprüfung alle 1 Sekunde (kann angepasst werden)

// Funktion zum Auslesen des aktuellen Fahrzeugstatus von der Detailseite
function getVehicleStatus(vehicleID) {
  const vehicleURL = `https://www.leitstellenspiel.de/vehicles/${vehicleID}`;
  fetch(vehicleURL)
    .then(response => response.text())
    .then(data => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, 'text/html');
      const fmsStatusElement = doc.querySelector('.building_list_fms');
      if (fmsStatusElement) {
        const fmsStatus = fmsStatusElement.innerText;
        updateVehicleStatus(vehicleID, fmsStatus);
      }
    });
}

// Funktion zum Aktualisieren des Fahrzeugstatus und Ausführen der Aktionen
function updateVehicleStatus(vehicleID, fmsStatus) {
  fahrzeugStatus[vehicleID] = fmsStatus;

  fahrzeugPaare.forEach(fahrzeugPaar => {
    const { fahrzeug1ID, fahrzeug2ID } = fahrzeugPaar;
    if (vehicleID === fahrzeug1ID) {
      if (fmsStatus === '2') {
        fahrzeugStatus[fahrzeug1ID] = '2';
        fahrzeugStatus[fahrzeug2ID] = '2';
      } else if (fmsStatus === '3') {
        fahrzeugStatus[fahrzeug1ID] = '3';
        fahrzeugStatus[fahrzeug2ID] = '2';
      }
    } else if (vehicleID === fahrzeug2ID) {
      if (fmsStatus === '2') {
        fahrzeugStatus[fahrzeug1ID] = '2';
        fahrzeugStatus[fahrzeug2ID] = '2';
      } else if (fmsStatus === '3') {
        fahrzeugStatus[fahrzeug1ID] = '2';
        fahrzeugStatus[fahrzeug2ID] = '3';
      }
    }
  });
}

// Funktion zum Überprüfen und Steuern der Fahrzeuge
function checkAndControlVehicles() {
  const radioMessages = document.getElementById('radio_messages');
  if (!radioMessages) return;

  const messages = radioMessages.querySelectorAll('li');
  if (!messages) return;

  messages.forEach(message => {
    const vehicleIDElement = message.querySelector('img.vehicle_search');
    if (!vehicleIDElement) return;

    const vehicleID = vehicleIDElement.getAttribute('vehicle_id');
    const fmsStatus = message.querySelector('span.building_list_fms').innerText;

    if (fahrzeugStatus[vehicleID] === fmsStatus) {
      return; // Keine Änderung des FMS-Status, keine Aktion erforderlich
    }

    fahrzeugPaare.forEach(fahrzeugPaar => {
      const { fahrzeug1ID, fahrzeug2ID } = fahrzeugPaar;
      if (vehicleID === fahrzeug1ID) {
        if (fmsStatus === '3' && fahrzeugStatus[fahrzeug1ID] !== '3') {
          handleFMSStatus(fahrzeug2ID, '6');
          fahrzeugStatus[fahrzeug1ID] = '3';
          fahrzeugStatus[fahrzeug2ID] = '2';
        } else if (fmsStatus === '2' && fahrzeugStatus[fahrzeug1ID] !== '2') {
          handleFMSStatus(fahrzeug2ID, '2');
          fahrzeugStatus[fahrzeug1ID] = '2';
          fahrzeugStatus[fahrzeug2ID] = '2';
        }
      } else if (vehicleID === fahrzeug2ID) {
        if (fmsStatus === '3' && fahrzeugStatus[fahrzeug2ID] !== '3') {
          handleFMSStatus(fahrzeug1ID, '6');
          fahrzeugStatus[fahrzeug1ID] = '2';
          fahrzeugStatus[fahrzeug2ID] = '3';
        } else if (fmsStatus === '2' && fahrzeugStatus[fahrzeug2ID] !== '2') {
          handleFMSStatus(fahrzeug1ID, '2');
          fahrzeugStatus[fahrzeug1ID] = '2';
          fahrzeugStatus[fahrzeug2ID] = '2';
        }
      }
    });
  });
}

// Überprüfung der Seite auf Änderungen
const observer = new MutationObserver(() => {
  checkAndControlVehicles();
});

observer.observe(document.body, { childList: true, subtree: true });

// Auslesen des aktuellen Fahrzeugstatus beim Seitenladen
fahrzeugPaare.forEach(fahrzeugPaar => {
  const { fahrzeug1ID, fahrzeug2ID } = fahrzeugPaar;
  getVehicleStatus(fahrzeug1ID);
  getVehicleStatus(fahrzeug2ID);
});

// Initiale Überprüfung der Fahrzeuge
checkAndControlVehicles();
