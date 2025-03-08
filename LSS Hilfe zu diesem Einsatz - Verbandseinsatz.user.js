// ==UserScript==
// @name         LSS Hilfe zu diesem Einsatz - Verbandseinsatz
// @version      1.0
// @description  Fügt Buttons für die Einsatzhilfe bei den Verbandseinsätzen ein
// @author       Sobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function addButtons() {
        const form = document.getElementById('new_mission_position');
        if (!form) return;

        // Layout-Container erstellen (Formular + Buttons nebeneinander)
        const layoutContainer = document.createElement('div');
        layoutContainer.style.display = 'flex';
        form.parentNode.insertBefore(layoutContainer, form);
        layoutContainer.appendChild(form);

        // Container für Buttons erstellen
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
        //buttonContainer.style.marginRight = '20%';
        buttonContainer.style.marginTop = '10px';
        buttonContainer.style.gap = '0px';
        layoutContainer.appendChild(buttonContainer);

        // Alle Radio-Labels durchgehen
        const labels = form.querySelectorAll('label.radio');
        labels.forEach((label) => {
            const input = label.querySelector('input[type="radio"]');

            // Prüfen, ob ein Input existiert und ob der value > 0 ist
            if (input && input.value && parseInt(input.value) > 0) {
                // Button erstellen
                const button = document.createElement('button');
                button.className = 'btn btn-xs btn-default';
                button.textContent = 'Hilfe zu diesem Einsatz';
                button.onclick = (event) => {
                    event.preventDefault();
                    window.open(`https://www.leitstellenspiel.de/einsaetze/${input.value}`, '_blank');
                };

                // Platzhalter für die vertikale Ausrichtung hinzufügen
                const placeholder = document.createElement('div');
                placeholder.style.height = `${label.offsetHeight}px`;
                placeholder.style.display = 'flex';
                placeholder.style.alignItems = 'center';
                placeholder.appendChild(button);

                // Button in den Container setzen
                buttonContainer.appendChild(placeholder);
            }
        });
    }

    // Warten, bis das Formular verfügbar ist
    const observer = new MutationObserver(() => {
        if (document.getElementById('new_mission_position')) {
            addButtons();
            observer.disconnect();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
