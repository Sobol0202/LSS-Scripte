// ==UserScript==
// @name         LSS-Bereitstellungsraum verbessern
// @namespace    https://www.leitstellenspiel.de/
// @version      1.3r
// @description  Fügt Sortier und Auswahloptionen zum BR hinzu
// @match        https://www.leitstellenspiel.de/buildings/*
// @author       MissSobol
// @grant        none
// ==/UserScript==

// Erzeuge das Dropdown-Menü für Leitstellen
var leitstelleDropdown = document.createElement('select');
leitstelleDropdown.id = 'leitstelleDropdown';
leitstelleDropdown.style.marginRight = '10px';

// Füge die Option "Alle Leitstellen" hinzu
var alleOption = document.createElement('option');
alleOption.value = 'Alle';
alleOption.text = 'Alle Leitstellen';
leitstelleDropdown.add(alleOption);

// API-Aufruf für Gebäudedaten
fetch('https://www.leitstellenspiel.de/api/buildings')
  .then(response => response.json())
  .then(data => {
    // Filtere Leitstellen-Gebäude
    var leitstellenBuildings = data.filter(building => building.building_type === 7);

    // Erfasse die Leitstellen-IDs und Captions aus den Gebäudedaten
    var leitstellen = leitstellenBuildings.map(building => ({
      id: building.id,
      caption: building.caption
    }));

    // Erzeuge die Optionen für das Dropdown-Menü basierend auf den erfassten Leitstellen
    for (var i = 0; i < leitstellen.length; i++) {
        var leitstelle = leitstellen[i];
        var option = document.createElement('option');
        option.value = leitstelle.id;
        option.text = leitstelle.caption;
        leitstelleDropdown.add(option);
    }
  });
// Erzeuge das Dropdown-Menü für Fahrzeugtypen
var vehicleDropdown = document.createElement('select');
vehicleDropdown.id = 'vehicleDropdown';
vehicleDropdown.style.marginRight = '10px';

// Erzeuge die Optionen für das Dropdown-Menü
var vehicleTypes = ['Alle', 'LF 20', 'LF 10', 'DLK 23', 'ELW 1', 'RW', 'GW-A', 'LF 8/6', 'LF 20/16', 'LF 10/6', 'LF 16-TS', 'GW-Öl', 'GW-L2-Wasser', 'GW-Messtechnik', 'SW 1000', 'SW 2000', 'SW 2000-Tr', 'SW Kats', 'TLF 2000', 'TLF 3000', 'TLF 8/8', 'TLF 8/18', 'TLF 16/24-Tr', 'TLF 16/25', 'TLF 16/45', 'TLF 20/40', 'TLF 20/40-SL', 'TLF 16', 'GW-Gefahrgut', 'RTW', 'NEF', 'HLF 20', 'RTH', 'FuStW', 'GW-Höhenrettung', 'ELW 2', 'leBefKw', 'MTW', 'TSF-W', 'KTW', 'GKW', 'MTW-TZ', 'MzGW (FGr N)', 'LKW K 9', 'BRmG R', 'Anh DLE', 'MLW 5', 'WLF', 'AB-Rüst', 'AB-Atemschutz', 'AB-Öl', 'GruKw', 'FüKw', 'GefKw', 'Dekon-P', 'AB-Dekon-P', 'KdoW-LNA', 'KdoW-OrgL', 'FwK', 'KTW Typ B', 'ELW 1 (SEG)', 'GW-San', 'Polizeihubschrauber', 'AB-Schlauch', 'GW-Taucher', 'GW-Wasserrettung', 'LKW 7 Lkr 19 tm', 'Anh MzB', 'Anh SchlB', 'Anh MzAB', 'Tauchkraftwagen', 'MZB', 'AB-MZB', 'WaWe 10', 'GRTW', 'NAW', 'FLF', 'Rettungstreppe', 'AB-Gefahrgut', 'AB-Einsatzleitung', 'SEK - ZF', 'SEK - MTF', 'MEK - ZF', 'MEK - MTF', 'GW-Werkfeuerwehr', 'ULF mit Löscharm', 'TM 50', 'Turbolöscher', 'TLF 4000', 'KLF', 'MLF', 'HLF 10', 'Rettungshundefahrzeug', 'Anh Hund', 'MTW-OV', 'DHuFüKw', 'Polizeimotorrad', 'Außenlastbehälter (allgemein)', 'ITW', 'Zivilstreifenwagen', 'LKW 7 Lbw', 'MLW 4', 'Anh SwPu', 'Anh 7', 'FuStW (DGL)', 'GW-L1', 'GW-L2', 'MTF-L', 'LF-L', 'AB-L', 'MzGW SB', 'NEA50', 'NEA200', 'NEA200', 'MGV/Lüfter'];
for (var i = 0; i < vehicleTypes.length; i++) {
    var option = document.createElement('option');
    option.text = vehicleTypes[i];
    vehicleDropdown.add(option);
}

// Erzeuge den Zähler
var counter = document.createElement('input');
counter.type = 'number';
counter.id = 'vehicleCounter';
counter.value = '1';
counter.min = '1';
counter.style.marginRight = '10px';

// Erzeuge den Bestätigen-Button
var button = document.createElement('button');
button.textContent = 'Bestätigen';
button.id = 'confirmButton';
button.style.marginRight = '10px';

// Füge das Dropdown-Menü für Leitstellen, das Dropdown-Menü für Fahrzeugtypen, den Zähler und den Bestätigen-Button zur Seite hinzu
var element = document.getElementById('education_schooling_-1');
element.parentNode.insertBefore(leitstelleDropdown, element.nextSibling);
element.parentNode.insertBefore(vehicleDropdown, element.nextSibling);
element.parentNode.insertBefore(counter, element.nextSibling);
element.parentNode.insertBefore(button, element.nextSibling);

// Füge einen Event-Listener zum Bestätigen-Button hinzu
button.addEventListener('click', function() {
    var selectedType = vehicleDropdown.value;
    var selectedCount = parseInt(counter.value);
    var selectedLeitstelleId = leitstelleDropdown.value;

    // Überprüfe alle Zeilen in der Tabelle
    var rows = document.querySelectorAll('#vehicle_list_step tr.vehicle_select_table_tr');
    var checkboxCounter = 0; // Zähler für die ausgewählten Checkboxen
    for (var j = 0; j < rows.length; j++) {
        var row = rows[j];
        var checkbox = row.querySelector('input.vehicle_checkbox');
        var buildingId = checkbox.getAttribute('building_id');
        var leitstelleId = buildingId.split('_')[1];

        // Überprüfe, ob der Leitstellenfilter aktiviert ist und die Leitstelle übereinstimmt
        var leitstelleFilterActive = selectedLeitstelleId !== 'Alle';
        var leitstelleMatches = !leitstelleFilterActive || leitstelleId === selectedLeitstelleId;

        // Überprüfe, ob "Alle" ausgewählt wurde
        if (selectedType === 'Alle' && leitstelleMatches) {
            if (checkboxCounter < selectedCount) {
                checkbox.checked = true;
                triggerChangeEvent(checkbox); // Löse das Change-Event aus
                checkboxCounter++;
            } else {
                checkbox.checked = false;
                triggerChangeEvent(checkbox); // Löse das Change-Event aus
            }
        } else if (leitstelleMatches) {
            var vehicleType = row.getAttribute('vehicle_type');
            // Überprüfe den Fahrzeugtyp und wähle die Checkbox basierend auf dem ausgewählten Typ aus
            if (vehicleType === selectedType && checkboxCounter < selectedCount) {
                checkbox.checked = true;
                triggerChangeEvent(checkbox); // Löse das Change-Event aus
                checkboxCounter++;
            } else {
                checkbox.checked = false;
                triggerChangeEvent(checkbox); // Löse das Change-Event aus
            }
        }
    }
});

// Funktion zum Auslösen des Change-Events für eine Checkbox
function triggerChangeEvent(element) {
    var event = new Event('change', { bubbles: true });
    element.dispatchEvent(event);
}
