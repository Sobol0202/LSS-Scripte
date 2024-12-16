// ==UserScript==
// @name         LSS-Wichtige Info bearbeiten
// @namespace    www.leitstellenspiel.de
// @version      1.2r
// @description  Ermöglicht das direkte bearbeiten des Wichtigen Verbandstextes
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Element mit der ID "alliance_chat" suchen
    const allianceChat = document.getElementById('alliance_chat');

// Funktion zum Erstellen des Popups
function createPopup() {
    // Popup-Container erstellen
    const popupContainer = document.createElement('div');
    popupContainer.style.position = 'fixed';
    popupContainer.style.top = '50%';
    popupContainer.style.left = '50%';
    popupContainer.style.transform = 'translate(-50%, -50%)';
    popupContainer.style.backgroundColor = '#f8f8f8';
    popupContainer.style.padding = '20px';
    popupContainer.style.border = '1px solid #ccc';
    popupContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    popupContainer.style.zIndex = '9999';

    // Textfeld erstellen
    const textField = document.createElement('input');
    textField.maxLength = 200;
    textField.type = 'text';
    textField.style.width = '300px';
    textField.style.border = '1px solid #ccc';
    textField.style.padding = '5px';
    popupContainer.appendChild(textField);

    // Zeichenanzahl-Anzeige erstellen
    const characterCount = document.createElement('span');
    characterCount.textContent = '0 / 200 Zeichen';
    characterCount.style.fontSize = '12px';
    characterCount.style.color = '#888';
    characterCount.style.marginTop = '5px';
    popupContainer.appendChild(characterCount);

    // Event Listener für das Textfeld, um die Zeichenanzahl zu aktualisieren
    textField.addEventListener('input', function() {
        const text = textField.value;
        const count = text.length;
        characterCount.textContent = count + ' / 200 Zeichen';
    });

    // Bestätigen-Button erstellen
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Bestätigen';
    confirmButton.style.backgroundColor = '#4CAF50';
    confirmButton.style.color = '#fff';
    confirmButton.style.border = 'none';
    confirmButton.style.padding = '8px 16px';
    confirmButton.style.cursor = 'pointer';
    confirmButton.addEventListener('click', function() {
        // Wert des Textfelds holen
        const text = textField.value;

        // Öffnen eines neuen Tabs mit der Edit-Seite
        var editPage = window.open("https://www.leitstellenspiel.de/veband/text/edit");

        // Warten auf das Laden der Edit-Seite
        editPage.addEventListener('load', function() {
            // Einfügen des Texts in das entsprechende Feld
            editPage.document.getElementById("alliance_text_chat_header").value = text;

            // Klicken des Speichern-Buttons
            var saveButton = editPage.document.querySelector('input.btn.btn-primary.btn-success[name="commit"]');
            saveButton.click();

            // Schließen des Tabs nach einer kurzen Verzögerung
            setTimeout(function() {
                editPage.close();
            }, 500); // Hier kannst du die Verzögerungszeit in Millisekunden anpassen
        });

        // Popup schließen
        popupContainer.remove();
    });
    popupContainer.appendChild(confirmButton);

    // Löschen-Button erstellen
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Text Löschen';
    deleteButton.style.backgroundColor = '#f44336';
    deleteButton.style.color = '#fff';
    deleteButton.style.border = 'none';
    deleteButton.style.padding = '8px 16px';
    deleteButton.style.cursor = 'pointer';
    deleteButton.addEventListener('click', function() {
        // Öffnen eines neuen Tabs mit der Edit-Seite
        var editPage = window.open("https://www.leitstellenspiel.de/veband/text/edit");

        // Warten auf das Laden der Edit-Seite
        editPage.addEventListener('load', function() {
            // Löschen des Texts im entsprechenden Feld
            editPage.document.getElementById("alliance_text_chat_header").value = '';

            // Klicken des Speichern-Buttons
            var saveButton = editPage.document.querySelector('input.btn.btn-primary.btn-success[name="commit"]');
            saveButton.click();

            // Schließen des Tabs nach einer kurzen Verzögerung
            setTimeout(function() {
                editPage.close();
            }, 500); // Hier kannst du die Verzögerungszeit in Millisekunden anpassen
        });

        // Popup schließen
        popupContainer.remove();
    });
    popupContainer.appendChild(deleteButton);

    // Abbrechen-Button erstellen
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Abbrechen';
    cancelButton.style.backgroundColor = '#ccc';
    cancelButton.style.border = 'none';
    cancelButton.style.padding = '8px 16px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.addEventListener('click', function() {
        // Popup schließen
        popupContainer.remove();
    });
    popupContainer.appendChild(cancelButton);

    // Popup-Container zum Dokument hinzufügen
    document.body.appendChild(popupContainer);
}



    // *-Element im Alliance Chat suchen
    const asteriskElement = allianceChat.querySelector('abbr[title="required"]');

    // Event-Listener für Klick auf das *-Element hinzufügen
    asteriskElement.addEventListener('click', function() {
        createPopup();
    });
})();
