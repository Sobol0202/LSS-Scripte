// ==UserScript==
// @name         LSS Ausgebildete Wachen ausblenden
// @namespace    www.leitstellenspiel.de
// @version      1.5.2
// @description  Blende Wachen in der Schule aus, die mehr ausgebildetes Personal haben, als angegeben
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @match        https://www.leitstellenspiel.de/schoolings/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let currentEducationValue = null;

    function updateEducationValue(EducationCounter) {
        if (currentEducationValue !== EducationCounter) {
            currentEducationValue = EducationCounter;
            const event = new CustomEvent('educationValueChanged', { detail: EducationCounter });
            document.dispatchEvent(event);
        }
    }

    const educationForm = document.querySelector('form[action$="/education"]');
    const educationSelect = document.getElementById('education_select');

    if (!educationSelect && !educationForm) {
        return;
    }

    const getPersonalSelectHeadingElements = () =>
        document.querySelectorAll('#accordion > .panel.panel-default .personal-select-heading-building');

    observePanels();

    document.addEventListener(
        'ausbildungs-mausschoner:buildings-appended',
        observePanels
    );

    if (educationSelect) {
        const inputElements = createInputElements(getEducationKey());
        const headline = document.createElement('h3');
        headline.textContent = 'Ausgebildete Wachen ausblenden';
        inputElements.classList.add('education');
        inputElements.insertBefore(headline, inputElements.firstChild);
        educationSelect.parentNode.insertBefore(inputElements, educationSelect.nextSibling);

        educationSelect.addEventListener('change', () => {
            updateInputField();
            checkPanels();
        });

        function updateInputField() {
            const educationKey = getEducationKey();
            const inputField = inputElements.querySelector('.educationInput');
            const storedValue = localStorage.getItem(educationKey);
            inputField.value = storedValue || '';
        }
    }

    function createInputElements(educationKey) {
        const container = document.createElement('div');
        container.classList.add('education-filter-container');

        const inputField = document.createElement('input');
        inputField.type = 'number';
        inputField.className = 'educationInput';
        inputField.placeholder = 'Min. Personal';
        const storedValue = localStorage.getItem(educationKey);
        if (storedValue) inputField.value = storedValue;
        container.append(inputField);

        const saveButton = document.createElement('button');
        saveButton.type = 'button';
        saveButton.textContent = 'Speichern';
        saveButton.className = 'btn btn-xs btn-success';
        saveButton.addEventListener('click', () => {
            saveToLocalStorage(getEducationKey(), inputField.value.trim());
            checkPanels();
        });
        container.append(saveButton);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.textContent = 'Löschen';
        deleteButton.className = 'btn btn-xs btn-danger';
        deleteButton.addEventListener('click', () => {
            inputField.value = '';
            localStorage.removeItem(getEducationKey());
            checkPanels();
        });
        container.append(deleteButton);

        return container;
    }

    function observePanels() {
        getPersonalSelectHeadingElements().forEach(observeEducationInfo);
    }

    function observeEducationInfo(element) {
        const observer = new MutationObserver(() => {
            checkPanels();
        });
        observer.observe(element, { childList: true, subtree: true });
    }

    function checkPanels() {
        const educationKey = getEducationKey();
        const thresholdTrained = getThresholdTrained(educationKey);

        getPersonalSelectHeadingElements().forEach(element => {
            const isFavorite = isBuildingFavorite(element);
            checkPanel(element, thresholdTrained, isFavorite);
        });
    }

    function checkPanel(element, thresholdTrained, isFavorite) {
        const panelElement = element.closest('.panel.panel-default');
        const educatedCount = getTrainedAmount(element);

        if (!isFavorite && thresholdTrained && educatedCount >= thresholdTrained) {
            panelElement.style.display = 'none';
        } else {
            panelElement.style.removeProperty('display');
        }
    }

    function getTrainedAmount(element) {
        const labelTextEducated = element.textContent.match(/(\d+) ausgebildete Person/);
        const labelTextInEducation = element.textContent.match(/(\d+) in Ausbildung/);
        let numEducated = 0;
        if (labelTextEducated) numEducated += parseInt(labelTextEducated[1]);
        if (labelTextInEducation) numEducated += parseInt(labelTextInEducation[1]);
        return numEducated;
    }

    function getThresholdTrained(educationKey) {
        const storedValue = localStorage.getItem(educationKey);
        return storedValue ? parseInt(storedValue) : 0;
    }

    function getEducationKey() {
        if (typeof globalEducationKey !== 'undefined') return globalEducationKey;
        if (educationSelect) {
            const value = educationSelect.value;
            if (!value) return null;
            return value.split(':')[0];
        }
        return null;
    }

    function saveToLocalStorage(educationKey, value) {
        if (educationKey) {
            if (value !== '') {
                localStorage.setItem(educationKey, value);
            } else {
                localStorage.removeItem(educationKey);
            }
            updateEducationValue(value);
        }
    }

    function isBuildingFavorite(element) {
        const buildingId = element.closest('.panel.panel-default').querySelector('.panel-heading').getAttribute('building_id');
        return localStorage.getItem('favorite_' + buildingId) === '1';
    }

    function insertFavoriteCheckboxes() {
        document.querySelectorAll('.panel-heading').forEach(heading => {
            const buildingId = heading.getAttribute('building_id');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'favoriteCheckbox';
            checkbox.checked = localStorage.getItem('favorite_' + buildingId) === '1';
            checkbox.addEventListener('change', () => {
                localStorage.setItem('favorite_' + buildingId, checkbox.checked ? '1' : '0');
                checkPanels();
            });
            heading.appendChild(checkbox);
        });
    }

    insertFavoriteCheckboxes();

    const styles = `
        .education-filter-container button:first-of-type { margin-right: 5px; margin-left: 10px; }
        .education-filter-container.education { margin-bottom: 15px; }
    `;
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

})();
