// ==UserScript==
// @name         LSS Systemnachrichten Lösch-Button
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Fügt einen Löschen-Button zu jeder Systemnachricht hinzu, um die Nachricht zu löschen.
// @author       MissSobol
// @match        https://www.operacni-stredisko.cz/messages
// @match        https://policie.operacni-stredisko.cz/messages
// @match        https://www.alarmcentral-spil.dk/messages
// @match        https://politi.alarmcentral-spil.dk/messages
// @match        https://www.leitstellenspiel.de/messages
// @match        https://polizei.leitstellenspiel.de/messages
// @match        https://www.missionchief-australia.com/messages
// @match        https://police.missionchief-australia.com/messages
// @match        https://www.missionchief.co.uk/messages
// @match        https://police.missionchief.co.uk/messages
// @match        https://www.missionchief.com/messages
// @match        https://police.missionchief.com/messages
// @match        https://www.centro-de-mando.es/messages
// @match        https://www.centro-de-mando.mx/messages
// @match        https://www.hatakeskuspeli.com/messages
// @match        https://poliisi.hatakeskuspeli.com/messages
// @match        https://www.operateur112.fr/messages
// @match        https://police.operateur112.fr/messages
// @match        https://www.operatore112.it/messages
// @match        https://polizia.operatore112.it/messages
// @match        https://www.missionchief-japan.com/messages
// @match        https://www.missionchief-korea.com/messages
// @match        https://www.nodsentralspillet.com/messages
// @match        https://politiet.nodsentralspillet.com/messages
// @match        https://www.meldkamerspel.com/messages
// @match        https://politie.meldkamerspel.com/messages
// @match        https://www.operatorratunkowy.pl/messages
// @match        https://policja.operatorratunkowy.pl/messages
// @match        https://www.operador193.com/messages
// @match        https://www.jogo-operador112.com/messages
// @match        https://policia.jogo-operador112.com/messages
// @match        https://www.jocdispecerat112.com/messages
// @match        https://www.dispetcher112.ru/messages
// @match        https://www.dispecerske-centrum.com/messages
// @match        https://www.larmcentralen-spelet.se/messages
// @match        https://polis.larmcentralen-spelet.se/messages
// @match        https://www.112-merkez.com/messages
// @match        https://www.dyspetcher101-game.com/messages
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Erstellen des Löschbuttons
    function createDeleteButton(href) {
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Löschen';
        deleteButton.className = 'btn btn-xs btn-danger';
        deleteButton.addEventListener('click', function() {
            deleteMessage(href);
        });
        return deleteButton;
    }

    // Funktion zum Löschen einer Nachricht
    function deleteMessage(href) {
        const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (!authToken) {
            console.error('AuthToken nicht gefunden');
            return;
        }

        const deleteUrl = `${href}/remove`;
        fetch(deleteUrl, {
            method: 'POST',
            headers: {
                'X-CSRF-Token': authToken
            },
            body: new URLSearchParams({
                'authenticity_token': authToken
            })
        })
        .then(response => {
            if (response.ok) {
                // Entferne die Zeile nach erfolgreichem Löschen
                const row = document.querySelector(`a[href="${href}"]`).closest('tr');
                row.remove();
            } else {
                console.error('Fehler beim Löschen der Nachricht');
            }
        })
        .catch(error => {
            console.error('Fehler beim Löschen der Nachricht:', error);
        });
    }

    // Füge die Löschen-Buttons zu den Systemnachrichten hinzu
    function addDeleteButtons() {
        const messageContainer = document.querySelector('.panel-body.system_messages_container');
        if (!messageContainer) {
            console.error('System Messages Container nicht gefunden');
            return;
        }

        const rows = messageContainer.querySelectorAll('table tbody tr');
        rows.forEach(row => {
            const link = row.querySelector('a');
            if (link) {
                const deleteButton = createDeleteButton(link.getAttribute('href'));

                // Erstelle eine neue Zelle für den Button
                const newCell = document.createElement('td');
                newCell.style.width = '1%';
                newCell.appendChild(deleteButton);

                // Füge die neue Zelle am Anfang der Zeile hinzu
                row.insertBefore(newCell, row.firstChild);
            }
        });
    }

    // Füge die Löschen-Buttons sofort hinzu
    addDeleteButtons();
})();
