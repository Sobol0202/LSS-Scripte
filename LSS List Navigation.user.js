// ==UserScript==
// @name         LSS-List Navigation
// @namespace    https://www.leitstellenspiel.de/toplist
// @version      1.4r
// @description  Add custom page navigation to List websites in LSS
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/toplist*
// @match        https://www.leitstellenspiel.de/alliances*
// @match        https://www.leitstellenspiel.de/vehicle_graphics*
// @match        https://www.leitstellenspiel.de/mission_graphics*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Erstellen des Popups
    function createPopup() {
        const popupContainer = document.createElement('div');
        popupContainer.setAttribute('id', 'customPopup');

        const popupContent = document.createElement('div');
        popupContent.setAttribute('id', 'customPopupContent');

        const label = document.createElement('label');
        label.textContent = 'Gib die gewünschte Seitenzahl ein: ';

        const input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                submitButton.click();
            }
        });

        const submitButton = document.createElement('button');
        submitButton.textContent = 'OK';
        submitButton.addEventListener('click', function() {
            const pageNumber = input.value;
            if (pageNumber) {
                const currentPage = window.location.href;
                if (currentPage.includes('toplist')) {
                    window.location.href = 'https://www.leitstellenspiel.de/toplist?page=' + pageNumber;
                } else if (currentPage.includes('alliances')) {
                    window.location.href = 'https://www.leitstellenspiel.de/alliances?page=' + pageNumber;
                } else if (currentPage.includes('vehicle_graphics')) {
                    window.location.href = 'https://www.leitstellenspiel.de/vehicle_graphics?page=' + pageNumber;
                } else if (currentPage.includes('mission_graphics')) {
                    window.location.href = 'https://www.leitstellenspiel.de/mission_graphics?page=' + pageNumber;
                }
            }
        });

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Abbrechen';
        closeButton.addEventListener('click', function() {
            hidePopup();
        });

        popupContent.appendChild(label);
        popupContent.appendChild(input);
        popupContent.appendChild(submitButton);
        popupContent.appendChild(closeButton);

        popupContainer.appendChild(popupContent);

        return popupContainer;
    }

    function showPopup() {
        const popup = createPopup();
        document.body.appendChild(popup);
        document.body.classList.add('customPopupOpen');
        const input = document.querySelector('#customPopup input');
        input.focus();
    }

    function hidePopup() {
        const popup = document.getElementById('customPopup');
        if (popup) {
            document.body.removeChild(popup);
            document.body.classList.remove('customPopupOpen');
        }
    }

    // CSS-Styling für das Popup
    GM_addStyle(`
        #customPopup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #fff;
            padding: 20px;
            border: 1px solid #ccc;
            z-index: 9999;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            border-radius: 4px;
        }

        #customPopupContent {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        #customPopup button {
            padding: 8px 16px;
            background-color: #007bff;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        #customPopup button:hover {
            background-color: #0056b3;
        }

        body.customPopupOpen {
            position: relative;
            overflow: hidden;
        }
    `);

    // Funktion zum Ändern des Mauszeigers
    function changeCursorOnHover(event) {
        const button = event.target;
        if (button.classList.contains('disabled')) {
            button.style.cursor = 'not-allowed';
        } else {
            button.style.cursor = 'pointer';
        }
    }

    // Finde das Element für die Seitennavigation
    const currentPage = window.location.href;
    const paginationElement = document.querySelector('.pagination.pagination');
    if (paginationElement) {
       // console.log('Seitennavigationselement gefunden:', paginationElement);

        // Finde den Button mit den 3 Punkten basierend auf dem Textinhalt
        const dotsButtons = paginationElement.querySelectorAll('li');
        dotsButtons.forEach(function(dotsButton) {
            const span = dotsButton.querySelector('span');
            if (span && span.textContent === '…') {
               // console.log('Button mit den 3 Punkten gefunden:', dotsButton);

                // Füge dem Button einen Klick-Event hinzu
                dotsButton.addEventListener('click', function() {
                   // console.log('Button wurde geklickt.');

                    // Zeige das Popup an
                    showPopup();
                });

                // Ändere den Pointer beim Hover über den Button
                dotsButton.addEventListener('mouseover', changeCursorOnHover);
                dotsButton.addEventListener('mouseout', changeCursorOnHover);
            }
        });
    }
})();
