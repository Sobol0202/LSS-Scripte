// ==UserScript==
// @name         LSS Chat to Jotform
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Überwacht den Chat nach spezifischen Nachrichten und trägt diese in eine Jotform-Tabelle ein.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // Jotform API-Endpunkt und API-Schlüssel
    const JOTFORM_API_ENDPOINT = 'https://eu-api.jotform.com/form/FORMULAR-ID/submissions';
    const JOTFORM_API_KEY = 'API-KEY';

    // Variable, um verarbeitete Nachrichten zu speichern
    let processedMessages = new Set();

    // Überwacht den Chat auf neue Nachrichten
    function watchChat() {
        const chatMessages = document.getElementById('mission_chat_messages').getElementsByTagName('li');

        // Durchsucht die Chat-Nachrichten
        Array.from(chatMessages).forEach(message => {
            const messageText = message.textContent.trim();
            const messageTime = message.getAttribute('data-message-time');

            // Wenn die Nachricht den spezifischen Text enthält und noch nicht verarbeitet wurde
            if (messageText.includes('Dies ist ein Scripttest') && !processedMessages.has(messageText)) {
                // Sende die Nachricht an Jotform
                sendToJotform(messageText, messageTime);

                // Füge die Nachricht zur Liste der verarbeiteten Nachrichten hinzu
                processedMessages.add(messageText);
            }
        });
    }

    // Sendet die Nachricht an Jotform
    function sendToJotform(message, time) {
        const formData = {
            'submission[5]': message, // Feldnummer für die Nachricht in deiner Jotform-Tabelle
            'submission[4]': time // Feldnummer für die Zeit in deiner Jotform-Tabelle
        };

        GM_xmlhttpRequest({
            method: 'POST',
            url: `${JOTFORM_API_ENDPOINT}?apiKey=${JOTFORM_API_KEY}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: encodeFormData(formData),
            onload: function(response) {
                console.log('Nachricht erfolgreich an Jotform gesendet:', response.responseText);
            },
            onerror: function(error) {
                console.error('Fehler beim Senden der Nachricht an Jotform:', error);
            }
        });
    }

    // Kodiert das Formulardaten-Objekt als URL-codierte Zeichenkette
    function encodeFormData(data) {
        return Object.keys(data)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
            .join('&');
    }

    // Startet die Überwachung des Chats
    setInterval(watchChat, 5000); // Überprüft alle 5 Sekunden nach neuen Nachrichten
})();
