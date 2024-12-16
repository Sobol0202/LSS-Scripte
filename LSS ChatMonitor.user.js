// ==UserScript==
// @name         LSS Chat Monitor
// @namespace    https://www.leitstellenspiel.de/
// @version      1.2r
// @description  Überwacht den Chat und ändert den Chatbutton wenn neue Nachricht erkannt wird.
// @match        https://www.leitstellenspiel.de/
// @author       MissSobol
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // CSS-Stil für den grünen und fetten Text des Chat-Buttons bei einer neuen Nachricht
    GM_addStyle(`
        .chat-button-new-message {
            color: green !important;
            font-weight: bold !important;
        }
    `);

    // Funktion zum Speichern des Zeitstempels der letzten Nachricht im Local Storage
    function speichereLetzteNachrichtZeit(zeit) {
        localStorage.setItem('letzteNachrichtZeit', zeit);
//        console.log('Letzte Nachrichtzeit gespeichert: ' + zeit);
    }

    // Funktion zum Zurücksetzen des Chat-Buttons auf den ursprünglichen Text und Stil
    function resetChatButton() {
        var chatButton = document.querySelector('a.btn.btn-xs.navbar-btn.mobile-navbar-selector[target_element="chat"]');
        if (chatButton.classList.contains('chat-button-new-message')) {
            chatButton.textContent = 'Chat';
            chatButton.classList.remove('chat-button-new-message');
        }
    }

    // Funktion zum Überprüfen neuer Nachrichten
    function ueberpruefeNeueNachrichten() {
        var chatElement = document.getElementById('mission_chat_messages');
        if (chatElement) {
            var nachrichten = chatElement.getElementsByTagName('li');
            if (nachrichten.length > 0) {
                var letzteNachricht = nachrichten[0]; // Änderung hier: Index 0 für die oberste Nachricht
                var zeit = letzteNachricht.getAttribute('data-message-time');
                if (zeit) {
                    var letzteNachrichtZeit = localStorage.getItem('letzteNachrichtZeit');
                    if (letzteNachrichtZeit && letzteNachrichtZeit < zeit) {
  //                      console.log('Neue Nachricht empfangen!');
                        var chatButton = document.querySelector('a.btn.btn-xs.navbar-btn.mobile-navbar-selector[target_element="chat"]');
                        chatButton.textContent = 'Chat!!!';
                        chatButton.classList.add('chat-button-new-message');
                    } else {
                        resetChatButton();
                    }
                } else {
      //              console.log('Keine Zeitangabe in der letzten Nachricht gefunden.');
                }
            } else {
    //            console.log('Keine Nachrichten im Chat gefunden.');
            }
        } else {
 //          console.log('Chat-Element nicht gefunden.');
        }
    }

    // Event-Handler für den Klick auf den Chat-Button
    function buttonKlickEventHandler(event) {
        event.preventDefault();
        var chatLink = event.target;
        if (chatLink.getAttribute('target_element') === 'chat') {
            ueberpruefeNeueNachrichten();
            var letzteNachricht = document.getElementById('mission_chat_messages').getElementsByTagName('li')[0];
            var zeit = letzteNachricht.getAttribute('data-message-time');
            speichereLetzteNachrichtZeit(zeit);
        }
    }

    // Überwachung des Chat-Buttons
    var chatButton = document.querySelector('a.btn.btn-xs.navbar-btn.mobile-navbar-selector[target_element="chat"]');
    if (chatButton) {
        chatButton.addEventListener('click', buttonKlickEventHandler);
    } else {
//        console.log('Chat-Button nicht gefunden.');
    }

    // Periodische Überprüfung neuer Nachrichten alle 10 Sekunden
    setInterval(ueberpruefeNeueNachrichten, 10000);
})();
