// ==UserScript==
// @name         LSS Ausgebildete Wachen ausblenden
// @namespace    www.leitstellenspiel.de
// @version      1.1.0
// @description  Blende Wachen in der Schule aus, die mehr ausgebildetes Personal haben, als angegeben
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @match        https://www.leitstellenspiel.de/schoolings/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const schoolingElement = document.getElementById('schooling');
    const educationForm = document.querySelector('form[action$="/education"]');

    // Überprüfen, ob die korrekten Elemente existiert
    if (!schoolingElement && !educationForm) {
        return;
    }

    const getPersonalSelectHeadingElements = () =>
        document.querySelectorAll(
            '#accordion > .panel.panel-default .personal-select-heading-building'
        );
    observePanels();

    // compatibility with Ausbildungs-Mausschoner
    document.addEventListener(
        'ausbildungs-mausschoner:buildings-appended',
        observePanels
    );

    if (schoolingElement) {
        // Einfügen eines Eingabefelds, Speichern-Buttons und Löschen-Buttons neben jedem Radio-Element
        const radioElements = document.querySelectorAll('.radio input[type="radio"]');

        for (let i = 0, n = radioElements.length; i < n; i++) {
            // Direktes Lesen des education_key-Attributs vom Radiobutton
            const educationKey = radioElements[i].getAttribute('education_key');
            if (!educationKey) {
                continue;
            }

            const inputElements = createInputElements(educationKey);
            inputElements.classList.add('schooling');
            radioElements[i].parentNode.parentNode.appendChild(inputElements);
        }
    } else if (educationForm) {
        // Prüfen ob globalEducationKey existiert
        if (typeof globalEducationKey === 'undefined') {
            return;
        }

        const inputElements = createInputElements(globalEducationKey);
        const headline = document.createElement('h3');
        headline.textContent = 'Ausgebildete Wachen ausblenden';
        inputElements.classList.add('education');
        inputElements.insertBefore(headline, inputElements.firstChild);
        educationForm.parentNode.insertBefore(inputElements, educationForm);
    }

    function createInputElements(educationKey) {
        const container = document.createElement('div');
        container.classList.add('education-filter-container');

        const inputField = document.createElement('input');
        inputField.type = 'number';
        inputField.className = 'educationInput';
        inputField.placeholder = 'Min. Personal';

        const storedValue = localStorage.getItem(educationKey);
        if (storedValue) {
            inputField.value = storedValue;
        }

        container.append(inputField);

        // Einfügen der Speichern-Button für jedes Radio-Element
        const saveButton = document.createElement('button');
        saveButton.type = 'button';
        saveButton.textContent = 'Speichern';
        saveButton.id = 'saveButton_' + educationKey;
        saveButton.className = 'btn btn-xs btn-success';
        saveButton.addEventListener('click', (event) => {
            event.preventDefault(); // Verhindert das Standardverhalten des Buttons
            saveToLocalStorage(educationKey, inputField.value.trim());
            checkPanels();
        });
        container.append(saveButton);

        // Einfügen der Löschen-Button für jedes Radio-Element
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.textContent = 'Löschen';
        deleteButton.id = 'deleteButton_' + educationKey;
        deleteButton.className = 'btn btn-xs btn-danger';
        deleteButton.addEventListener('click', (event) => {
            event.preventDefault(); // Verhindert das Standardverhalten des Buttons
            inputField.value = '';
            localStorage.removeItem(educationKey);
            checkPanels();
        });
        container.append(deleteButton);

        return container;
    }

    /**
     * Observe all panels for education info changes
     */
    function observePanels() {
        getPersonalSelectHeadingElements().forEach(observeEducationInfo);
    }

    /**
     * Checks a panel
     */
    function checkPanel(element, thresholdTrained) {
        const educationLabels = element.querySelector('.label');
        const panelElement = element.closest('.panel.panel-default');

        if (educationLabels) {
            const educatedCount = getTrainedAmount(element);
            togglePanel(panelElement, educatedCount, thresholdTrained);
        } else if (panelElement.style.display === 'none') {
            panelElement.style.removeProperty('display');
        }
    }

    /**
     * Checks all panels
     */
    function checkPanels() {
        const educationKey = getEducationKey();
        const thresholdTrained = getThresholdTrained(educationKey);

        getPersonalSelectHeadingElements().forEach(element =>
            checkPanel(element, thresholdTrained)
        );
    }

    /**
     * Observes the education info of the provided panel for changes
     */
    function observeEducationInfo(element) {
        const observer = new MutationObserver((mutations) => {
            for (let i = 0, n = mutations.length; i < n; i++) {
                if (mutations[i].type === 'childList') {
                    const educationKey = getEducationKey();
                    const thresholdTrained = getThresholdTrained(educationKey);
                    checkPanel(element, thresholdTrained);
                }
            }
        });

        observer.observe(element, {
            childList: true
        });
    }

    /**
     * Gets the amount of trained personal
     */
    function getTrainedAmount(element) {
        const labelTextEducated = element.textContent.match(/(\d+) ausgebildete Person/);
        const labelTextInEducation = element.textContent.match(/(\d+) in Ausbildung/);
        let numEducated = 0;

        if (labelTextEducated) {
            numEducated += parseInt(labelTextEducated[1]);
        }

        if (labelTextInEducation) {
            numEducated += parseInt(labelTextInEducation[1])
        }

        return numEducated;
    }

    /**
     * Loads the amount of necessary trained personal depending on the education key
     */
    function getThresholdTrained(educationKey) {
        const storedValue = localStorage.getItem(educationKey);

        if (storedValue) {
            return parseInt(storedValue)
        } else {
            return 0;
        }
    }

    /**
     * Toggles the panel depending on already trained and necessary trained personal
     */
    function togglePanel(element, numTrained, thresholdTrained) {
        if (thresholdTrained && numTrained >= thresholdTrained) {
            element.style.display = 'none';
            // Dispatch scroll event um die Anzahl des ausgebildeten Personals für die neuen Elemente in der aktuellen Ansicht zu laden
            element.dispatchEvent(new CustomEvent('scroll', {bubbles: true}));
        } else {
            element.style.removeProperty('display');
        }
    }

    /**
     * Gets the education key from either the global education key (schooling) or the radio buttons (building)
     */
    function getEducationKey() {
        if (typeof globalEducationKey !== 'undefined') {
            return globalEducationKey;
        }

        const selectedRadio = document.querySelector('.radio input[type="radio"]:checked');
        let educationKey = null;

        if (selectedRadio) {
            educationKey = selectedRadio.getAttribute('education_key');
        }

        return educationKey;
    }

    /**
     * Stores the value in the local storage or deletes the value if it's empty
     */
    function saveToLocalStorage(educationKey, value) {
        if (value !== '') {
            localStorage.setItem(educationKey, value);
        } else {
            localStorage.removeItem(educationKey);
        }
    }

    // CSS-Stile für die Anordnung der Eingabefelder und Buttons
    const styles = `
        label[for^="education_"],
        .education-filter-container {
            display: inline-block;
        }
        
        label[for^="education_"] {
            min-width: 450px;
        }
        
        .education-filter-container button:first-of-type {
            margin-right: 5px;
            margin-left: 25px;
        }
        
        .education-filter-container.education {
            margin-bottom: 25px;
        }
        
        @media (max-width: 812px) {
            label[for^="education_"] {
                padding-bottom: 7px;
            }
        }
    `;

    // CSS-Stile einfügen
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
})();
