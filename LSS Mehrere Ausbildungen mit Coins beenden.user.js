// ==UserScript==
// @name         LSS Mehrere Ausbildungen mit Coins beenden
// @namespace    www.leitstellenspiel.de
// @version      1.2
// @description  Ermöglicht das beenden mehrerer Lehrgänge mit Coins
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/schoolings
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    addCheckboxesAndButton();

    // Funktion zum Erstellen der Checkboxen und des Buttons
    function addCheckboxesAndButton() {
        // Selektiere die Tabelle
        var table = document.getElementById("schooling_own_table");
        if (!table) return;

        // Selektiere alle Zeilen in der Tabelle außer der Kopfzeile
        var rows = table.getElementsByTagName("tbody")[0].getElementsByTagName("tr");

        // Durchlaufe alle Zeilen und füge Checkboxen hinzu
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];

            // Extrahiere die Lehrgangs-ID aus dem href-Attribut des Links
            var educationId = row.getElementsByTagName("a")[0].href.split('/').pop();
            console.log("Education ID:", educationId);

            // Erstelle eine Checkbox
            var checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            checkbox.id = "checkbox_" + educationId;
            checkbox.className = "education-checkbox";
            var cell = row.insertCell(0); // Füge eine Zelle für die Checkbox am Anfang der Zeile ein
            cell.appendChild(checkbox);
        }

        // Füge im Kopf der Tabelle einen unsichtbaren Button ein
        var headButton = document.createElement('button');
        headButton.style.display = "none";
        var headCell = table.rows[0].insertCell(0);
        headCell.appendChild(headButton);

        // Erstelle den Button zum Beenden der ausgewählten Ausbildungen
        var button = document.createElement('button');
        button.innerHTML = "Ausgewählte Ausbildungen beenden";
        button.className = "btn btn-danger";
        button.addEventListener('click', function() {
            var selectedCount = getSelectedEducationsCount();
            var cost = selectedCount * 5; // Kosten berechnen
            if (confirm("Willst du wirklich " + selectedCount + " Lehrgänge mit Coins beenden? Das kostet dich " + cost + " Coins.")) {
                finishSelectedEducations();
            }
        });
        table.parentNode.insertBefore(button, table.nextSibling);

        // Event Listener für Multiselektion mit Strg-Taste
        table.addEventListener('click', function(event) {
            if (event.target.type === 'checkbox' && event.ctrlKey) {
                var checkboxes = document.getElementsByClassName('education-checkbox');
                var start = null;
                var end = null;
                for (var i = 0; i < checkboxes.length; i++) {
                    if (checkboxes[i] === event.target || checkboxes[i] === end) {
                        if (start === null) {
                            start = checkboxes[i];
                        } else {
                            end = checkboxes[i];
                        }
                    }
                    if (start !== null && end !== null) {
                        var startIndex = Array.from(checkboxes).indexOf(start);
                        var endIndex = Array.from(checkboxes).indexOf(end);
                        var minIndex = Math.min(startIndex, endIndex);
                        var maxIndex = Math.max(startIndex, endIndex);
                        for (var j = minIndex; j <= maxIndex; j++) {
                            checkboxes[j].checked = true;
                        }
                        break;
                    }
                }
            }
        });
    }

    // Funktion zum Zählen der ausgewählten Ausbildungen
    function getSelectedEducationsCount() {
        var checkboxes = document.getElementsByClassName('education-checkbox');
        var count = 0;
        for (var i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                count++;
            }
        }
        return count;
    }

    // Funktion zum Beenden der ausgewählten Ausbildungen
    function finishSelectedEducations() {
        var checkboxes = document.getElementsByClassName('education-checkbox');
        var finishedCount = 0;

        // Durchlaufe alle Checkboxen und beende die ausgewählten Ausbildungen
        for (var i = 0; i < checkboxes.length; i++) {
            var checkbox = checkboxes[i];
            if (checkbox.checked) {
                var educationId = checkbox.id.split('_')[1];
                console.log("Finishing education with ID:", educationId);
                setTimeout(function(id) {
                    finishEducation(id);
                }, finishedCount * 100, educationId); // Wartezeit zwischen den Anfragen
                finishedCount++;
            }
        }

        // Nach der letzten Anfrage die Seite neu laden
        setTimeout(function() {
            location.reload();
        }, finishedCount * 100 + 2000); // Wartezeit für den letzten Aufruf und zusätzliche 2 Sekunden
    }

    // Funktion zum Beenden einer Ausbildung
    function finishEducation(educationId) {
        var url = "https://www.leitstellenspiel.de/schoolings/" + educationId + "/education/finish";
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true); // Öffne eine asynchrone Anfrage
        xhr.send();
    }
})();
