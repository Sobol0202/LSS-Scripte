// ==UserScript==
// @name         LSS-Ausbreitungszähler
// @namespace    https://www.leitstellenspiel.de/
// @version      1.4r
// @description  Zählt Ausbreitungssprechwünsche und zeigt einen Zähler und Prozentsatz an
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        GM_addStyle
// ==/UserScript==

(function() {
  'use strict';

  // Überprüfe, ob der Browser Local Storage unterstützt
  if (typeof Storage === 'undefined') {
    console.error('Der Browser unterstützt den Local Storage nicht.');
    return;
  }

  // Erstelle oder aktualisiere den Zähler im Local Storage
  if (!localStorage.sprechwunschZaehler) {
    localStorage.sprechwunschZaehler = 0;
  }

  // Funktion zum Inkrementieren des Zählers und Aktualisieren der Anzeige
  function erhoeheZaehler() {
    localStorage.sprechwunschZaehler++;
    document.getElementById('sprechwunsch-zaehler').textContent = localStorage.sprechwunschZaehler;
    console.log('Zähler erhöht. Aktueller Wert: ' + localStorage.sprechwunschZaehler);

    // Rufe die Einsatzanzahl ab und aktualisiere die Anzeige
    abrufenEinsatzanzahl();
  }

  // Funktion zum Zurücksetzen des Zählers und Aktualisieren der Anzeige
  function zuruecksetzenZaehler() {
    localStorage.sprechwunschZaehler = 0;
    document.getElementById('sprechwunsch-zaehler').textContent = localStorage.sprechwunschZaehler;
    console.log('Zähler zurückgesetzt. Aktueller Wert: ' + localStorage.sprechwunschZaehler);

    // Rufe die Einsatzanzahl ab und aktualisiere die Anzeige
    abrufenEinsatzanzahl();
  }

  // Funktion zum Abrufen der Einsatzanzahl
  function abrufenEinsatzanzahl() {
    // Führe eine Hintergrundabfrage der Einsatzanzahl durch
    fetch('https://www.leitstellenspiel.de/credits/daily')
      .then(response => response.text())
      .then(data => {
        // Selektiere alle Zeilen mit Einsätzen
        const einsatzZeilen = new DOMParser().parseFromString(data, 'text/html').querySelectorAll('tr');

        let gesamtAnzahlEinsaetze = 0;
        let gesamtAnzahlPatienten = 0;
        let anzahlAusbreitung = localStorage.sprechwunschZaehler;

        // Iteriere über jede Zeile (überspringe die erste Zeile mit Überschriften)
        for (let i = 1; i < einsatzZeilen.length; i++) {
          const zeile = einsatzZeilen[i];

          // Extrahiere den Text der dritten "sortvalue"
          const dritteSortvalueText = zeile.querySelectorAll('td[sortvalue]')[3].textContent.trim();

          // Überprüfe, ob der Text das Wort "Patient" enthält
          if (dritteSortvalueText.includes('Patient')) {
            // Extrahiere den Wert der dritten "sortvalue"
            const anzahlString = zeile.querySelectorAll('td[sortvalue]')[2].textContent.trim();

            // Extrahiere nur die Anzahl als Ganzzahl
            const anzahl = parseInt(anzahlString.split(' ')[0]);

            // Addiere die Anzahl zum Gesamtwert
            gesamtAnzahlPatienten += anzahl;
          } else {
            // Extrahiere den Text der letzten "sortvalue"
            const letzteSortvalueText = zeile.querySelectorAll('td[sortvalue]')[3].textContent.trim();

            // Überprüfe, ob der Text der letzten Sortvalue eine der Ausnahmen enthält
            const istAusnahme = /(Bonus|Abgebrochen|Gebaut|abgerissen)/i.test(letzteSortvalueText);

            // Wenn die letzte Sortvalue keine Ausnahme ist, erhöhe die Gesamtanzahl um 1
            if (!istAusnahme) {
              // Extrahiere den Wert der dritten "sortvalue"
              const anzahlString = zeile.querySelectorAll('td[sortvalue]')[2].textContent.trim();

              // Extrahiere nur die Anzahl als Ganzzahl
              const anzahl = parseInt(anzahlString.split(' ')[0]);

              // Addiere die Anzahl zum Gesamtwert
              gesamtAnzahlEinsaetze += anzahl;
            }
          }
        }

        // Berechne den Prozentsatz der Einsätze mit Ausbreitung
        const prozentsatz = (anzahlAusbreitung / gesamtAnzahlEinsaetze) * 100;

        // Aktualisiere die Anzeige des Zählers und des Prozentsatzes
        document.getElementById('sprechwunsch-zaehler').textContent = anzahlAusbreitung;
        document.getElementById('prozentsatz-ausbreitung').textContent = prozentsatz.toFixed(2) + '%';
      })
      .catch(error => {
        console.error('Fehler beim Abrufen der Einsatzanzahl:', error);
      });
  }

  // Füge den Zähler zum Funktab hinzu
  const radioButton = document.getElementById('alliance_radio_off');
  if (radioButton) {
    const zaehlerElement = document.createElement('span');
    zaehlerElement.id = 'sprechwunsch-zaehler';
    zaehlerElement.textContent = localStorage.sprechwunschZaehler;
    zaehlerElement.style.cursor = 'pointer';
    zaehlerElement.style.marginLeft = '10px';
    zaehlerElement.style.position = 'relative';
    zaehlerElement.style.top = '50%';
    zaehlerElement.style.transform = 'translateY(-50%)';
    zaehlerElement.addEventListener('click', zuruecksetzenZaehler);

    const prozentsatzElement = document.createElement('span');
    prozentsatzElement.id = 'prozentsatz-ausbreitung';
    prozentsatzElement.style.marginLeft = '5px';

    const separatorElement = document.createTextNode('|');

    radioButton.parentNode.insertBefore(zaehlerElement, radioButton.nextSibling);
    radioButton.parentNode.insertBefore(separatorElement, radioButton.nextSibling);
    radioButton.parentNode.insertBefore(prozentsatzElement, radioButton.nextSibling);

    // Rufe die Einsatzanzahl ab und aktualisiere die Anzeige
    abrufenEinsatzanzahl();
  } else {
    console.error('Das Element mit der ID "alliance_radio_off" wurde nicht gefunden.');
  }

  // Überwache das Erscheinen neuer Sprechwünsche
  if (window.location.href === 'https://www.leitstellenspiel.de/') {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        const nodes = mutation.addedNodes;
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.tagName === 'LI' && node.matches('[class^="radio_message_vehicle"]')) {
            const text = node.textContent.toLowerCase();
            if (text.includes('ausgebreitet')) {
              console.log('Neuer Sprechwunsch mit "ausgebreitet" erfasst.');
              erhoeheZaehler();
            }
          }
        }
      });
    });

    // Überwache Änderungen im Bereich der Sprechwünsche
    const targetNode = document.getElementById('radio_outer');
    if (targetNode) {
      const observerConfig = { childList: true, subtree: true };
      const radioPanelBody = targetNode.querySelector('.panel.panel-default #radio_panel_body');
      if (radioPanelBody) {
        observer.observe(radioPanelBody, observerConfig);
      } else {
        console.error('Das Element mit der ID "radio_panel_body" wurde nicht gefunden.');
      }

      // Zähle bereits vorhandene Sprechwünsche beim initialen Laden der Seite
      const existingRadioMessages = targetNode.querySelectorAll('#radio_messages_important li[class^="radio_message_vehicle"]');
      existingRadioMessages.forEach(function(message) {
        const text = message.textContent.toLowerCase();
        if (text.includes('ausgebreitet')) {
          console.log('Bereits vorhandener Sprechwunsch mit "ausgebreitet" erfasst.');
          erhoeheZaehler();
        }
      });
    } else {
      console.error('Das Element mit der ID "radio_outer" wurde nicht gefunden.');
    }
  }
})();
