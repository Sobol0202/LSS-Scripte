// ==UserScript==
// @name         LSS Meldefunktion
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Fügt Meldefunktion ein.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/messages/*
// @match        https://xyrality.helpshift.com/hc/de/23-mission-chief/contact-us/?p=web
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Hinzufügen eines Buttons und Binden des Klick-Ereignisses zum Extrahieren und Speichern von Meldeinformationen
    function addButton() {
        const button = document.createElement('button');
        button.textContent = 'Diese Nachricht melden!';
        button.classList.add('btn', 'btn-danger');
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.addEventListener('click', extractAndSaveReportData);
        document.body.appendChild(button);
    }

    // Funktion zum Extrahieren von Benutzerdaten mithilfe der Credits-API
    async function fetchUserData() {
        try {
            const response = await fetch('https://www.leitstellenspiel.de/api/credits');
            const userData = await response.json();
            return { username: userData.user_name, userId: userData.user_id };
        } catch (error) {
            console.error('Fehler beim Abrufen von Benutzerdaten:', error);
            return null;
        }
    }

    // Funktion zum Extrahieren von Meldeinformationen und Speichern als GM_Value
    function extractAndSaveReportData() {
        // Extrahieren von Benutzerdaten aus der Benutzer-API
        fetchUserData().then(userData => {
            if (!userData) {
                console.error('Fehler beim Abrufen von Benutzerdaten');
                return;
            }

            const { username: reportingUsername, userId: reportingUserId } = userData;

            // Extrahieren der Melde-ID aus der aktuellen URL
            const reportId = window.location.href;

            // Extrahieren des gemeldeten Benutzernamens und der Benutzer-ID
            const reportedUsernameElement = document.querySelector('a[href^="/profile/"]');
            const reportedUsername = reportedUsernameElement ? reportedUsernameElement.textContent.trim() : null;
            const reportedUserId = reportedUsernameElement ? reportedUsernameElement.getAttribute('href').match(/\d+/)[0] : null;

            // Extrahieren des Melde-Texts
            const reportTextElement = document.querySelector('.well');
            const reportText = reportTextElement ? reportTextElement.textContent.trim() : null;

            // Extrahieren der Meldezeit
            const reportTime = new Date().toLocaleString();

            // Generieren der Melde-Nachricht
            const reportMessage = `Der Nutzer ${reportingUsername} meldet um ${reportTime} den Nutzer ${reportedUsername} mit der ID ${reportedUserId} melden. In der Nachricht ${reportId} hat dieser den folgenden Text versendet: ${reportText}. Die stellt in den Augen von ${reportingUsername} einen Verstoß gegen die AGB oder Geltendes Recht dar. Da ${reportingUsername} über keine Emailadresse verfügt, setzten sie sich für nachfragen mit dem Nutzer Ingame (Profil: ${reportedUserId}) in Verbindung.`;

            // Speichern der Daten als GM_Values
            GM_setValue('reportingUsername', reportingUsername);
            GM_setValue('reportingUserId', reportingUserId);
            GM_setValue('reportId', reportId);
            GM_setValue('reportedUsername', reportedUsername);
            GM_setValue('reportedUserId', reportedUserId);
            GM_setValue('reportText', reportText);
            GM_setValue('reportTime', reportTime);
            GM_setValue('reportMessage', reportMessage);

            // Ausgabe der Daten in die Konsole
            //console.log('Meldender Benutzername:', reportingUsername);
            //console.log('Meldende Benutzer-ID:', reportingUserId);
            //console.log('Melde-ID:', reportId);
            //console.log('Gemeldeter Benutzername:', reportedUsername);
            //console.log('Gemeldete Benutzer-ID:', reportedUserId);
            //console.log('Melde-Text:', reportText);
            //console.log('Meldezeit:', reportTime);
            //console.log('Melde-Nachricht:', reportMessage);

            // fillReportData aufrufen, nachdem die Meldeinformationen extrahiert und gespeichert wurden
            fillReportData();
            // openOtherWebsiteInNewTab aufrufen, nachdem die Meldeinformationen extrahiert und gespeichert wurden
            openOtherWebsiteInNewTab();
        });
    }

    // Funktion zum Öffnen der anderen Website in einem neuen Tab nach dem Speichern der Daten
    function openOtherWebsiteInNewTab() {
        const otherWebsiteURL = 'https://xyrality.helpshift.com/hc/de/23-mission-chief/contact-us/?p=web';
        window.open(otherWebsiteURL, '_blank').focus();
    }

    // Funktion zum Ausfüllen der Meldeinformationen in die Felder
    function fillReportData() {
        const reportingUsername = GM_getValue('reportingUsername');
        const reportTime = GM_getValue('reportTime');
        const reportedUsername = GM_getValue('reportedUsername');
        const reportedUserId = GM_getValue('reportedUserId');
        const reportId = GM_getValue('reportId');
        const reportText = GM_getValue('reportText');
        const reportingUserId = GM_getValue('reportingUserId');
        const reportMessage = `Der Nutzer ${reportingUsername} meldet um ${reportTime} den Nutzer ${reportedUsername} mit der ID ${reportedUserId}. In der Nachricht ${reportId} hat dieser den folgenden Text versendet:\n\n${reportText}\n\nDies stellt in den Augen von ${reportingUsername} einen Verstoß gegen die AGB oder geltendes Recht dar.\nDa ${reportingUsername} über keine Emailadresse verfügt, setzten sie sich für Nachfragen mit dem Nutzer Ingame (Profil: ${reportingUserId}) in Verbindung. \n --- \nDiese Meldung wurde mit dem LSS Meldefunktion Script erstellt`;

        //console.log('Funktion zum Ausfüllen der Meldeinformationen aufgerufen');

        // Warten auf 1 Sekunde, bevor die Meldeinformationen eingefügt werden
        setTimeout(() => {
            // Das contact-us-form Element finden
            const contactUsForm = document.querySelector('contact-us-form');
            if (contactUsForm) {
                // Den Shadow Root von contact-us-form bekommen
                const shadowRoot = contactUsForm.shadowRoot;

                // Die Input-Felder im Shadow Root finden und ausfüllen
                if (shadowRoot) {
                    const inputFields = shadowRoot.querySelectorAll('hc-input');
                    inputFields.forEach(input => {
                        switch (input.getAttribute('placeholder')) {
                            case 'Vollständigen Namen eingeben':
                                input.value = reportingUsername;
                                //console.log('Meldender Name eingefügt:', reportingUsername);
                                break;
                            case 'Ihre E-Mail-Adresse eingeben':
                                input.value = `${reportingUsername}@leitstellenspiel.de`;
                                //console.log('Email eingefügt:', `${reportingUsername}@leitstellenspiel.de`);
                                break;
                            case 'Benutzernamen eingeben':
                                input.value = reportingUsername;
                                //console.log('Benutzername eingefügt:', reportingUsername);
                                break;
                            default:
                                //console.log('Unbekanntes Eingabefeld');
                        }
                    });

                    // Das hc-textarea Element finden
                    const hcTextarea = shadowRoot.querySelector('hc-textarea');
                    if (hcTextarea) {
                        // Den Shadow Root von hc-textarea bekommen
                        const hcTextareaShadowRoot = hcTextarea.shadowRoot;
                        if (hcTextareaShadowRoot) {
                            // Das textarea-Feld im Shadow Root finden und ausfüllen
                            const textarea = hcTextareaShadowRoot.querySelector('textarea');
                            if (textarea) {
                                textarea.value = reportMessage;
                                //console.log('Melde-Nachricht eingefügt:', textarea.value);
                            } else {
                                console.error('Textarea nicht gefunden im Shadow Root von hc-textarea');
                            }
                        } else {
                            console.error('Shadow Root von hc-textarea nicht gefunden');
                        }
                    } else {
                        console.error('hc-textarea nicht gefunden');
                    }
                } else {
                    console.error('Shadow Root von contact-us-form nicht gefunden');
                }
            } else {
                console.error('contact-us-form nicht gefunden');
            }
        }, 1000);
    }

    // Meldeinformationen ausfüllen, wenn die Seite geladen ist
    window.addEventListener('load', function() {
        if (window.location.href.startsWith('https://www.leitstellenspiel.de/messages/')) {
            addButton();
        } else if (window.location.href === 'https://xyrality.helpshift.com/hc/de/23-mission-chief/contact-us/?p=web') {
            fillReportData();
        }
    });
})();
