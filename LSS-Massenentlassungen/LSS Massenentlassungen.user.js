// ==UserScript==
// @name         LSS Massenentlassungen
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Ermöglicht das massenhafte Entlassen von Personal
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/buildings/*/personals
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const table = document.querySelector('#personal_table');
    if (!table) return;

    // Hauptinterface
    const controlPanel = document.createElement('div');
    controlPanel.style.margin = '1em 0';

    const btnToggleCheckboxes = createButton('Personal auswählen', toggleCheckboxes);
    controlPanel.appendChild(btnToggleCheckboxes);
    table.parentElement.insertBefore(controlPanel, table);

    // Zusätzliche Buttons
    let extraButtonsContainer = null;

    // Toggle-State
    let checkboxesVisible = false;

    function createButton(label, onClick) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.marginRight = '0.5em';
        btn.className = 'btn btn-default btn-xs';
        btn.addEventListener('click', onClick);
        return btn;
    }

    function toggleCheckboxes() {
        if (!checkboxesVisible) {
            addCheckboxes();
            addExtraButtons();
            checkboxesVisible = true;
        } else {
            removeCheckboxes();
            removeExtraButtons();
            checkboxesVisible = false;
        }
    }

    function addExtraButtons() {
        extraButtonsContainer = document.createElement('div');
        extraButtonsContainer.style.margin = '0.5em 0';

        const btnNoTraining = createButton('Personal ohne Ausbildung auswählen', selectWithoutTraining);
        const btnNoBinding = createButton('Personal ohne Bindung auswählen', selectWithoutBinding);
        const btnNoTrainingAndBinding = createButton('Personal ohne Ausbildung und Bindung auswählen', selectWithoutTrainingAndBinding);
        const btnResetSelection = createButton('Auswahl zurücksetzen', resetCheckboxes);
        const btnFire = createButton('Ausgewähltes Personal entlassen', fireSelected);

        extraButtonsContainer.append(btnNoTraining, btnNoBinding, btnNoTrainingAndBinding, btnResetSelection, btnFire);
        controlPanel.appendChild(extraButtonsContainer);
    }

    function removeExtraButtons() {
        if (extraButtonsContainer) {
            extraButtonsContainer.remove();
            extraButtonsContainer = null;
        }
    }

    function addCheckboxes() {
        // Tabellenkopf
        const theadRow = table.querySelector('thead tr');
        const th = document.createElement('th');
        th.textContent = '';
        th.className = 'tm-th-checkbox';
        theadRow.insertBefore(th, theadRow.firstChild);

        // Tabellenzeilen
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.className = 'tm-checkbox';
            const td = document.createElement('td');
            td.className = 'tm-td-checkbox';
            td.appendChild(cb);
            row.insertBefore(td, row.firstChild);
        });
    }

    function removeCheckboxes() {
        // Tabellenkopf
        const th = table.querySelector('thead tr .tm-th-checkbox');
        if (th) th.remove();

        // Tabellenzeilen
        const checkboxes = table.querySelectorAll('tbody tr .tm-td-checkbox');
        checkboxes.forEach(td => td.remove());
    }

    function resetCheckboxes() {
        const checkboxes = document.querySelectorAll('.tm-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
    }

    // Dumm
    function selectWithoutTraining() {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const trainingCell = row.children[2];
            const checkbox = row.querySelector('.tm-checkbox');
            checkbox.checked = trainingCell && trainingCell.textContent.trim() === '';
        });
    }

    // Faul
    function selectWithoutBinding() {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const bindingCell = row.children[3];
            const checkbox = row.querySelector('.tm-checkbox');
            checkbox.checked = bindingCell && bindingCell.textContent.trim() === '';
        });
    }

    // Faul und Dumm
    function selectWithoutTrainingAndBinding() {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const trainingCell = row.children[2];
            const bindingCell = row.children[3];
            const checkbox = row.querySelector('.tm-checkbox');
            checkbox.checked =
                trainingCell && trainingCell.textContent.trim() === '' &&
                bindingCell && bindingCell.textContent.trim() === '';
        });
    }

    // Kündigungen versenden
    function fireSelected() {
        const selected = Array.from(document.querySelectorAll('.tm-checkbox:checked'));
        if (selected.length === 0) {
            alert('Kein Personal ausgewählt!');
            return;
        }

        if (!confirm(`Sollen wirklich ${selected.length} Mitarbeiter entlassen werden?`)) {
            return;
        }

        selected.forEach((cb, index) => {
            const row = cb.closest('tr');
            const fireLink = row.querySelector('a.btn-danger');
            if (fireLink) {
                const url = fireLink.getAttribute('href');
                setTimeout(() => {
                    fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'X-CSRF-Token': authToken
                        },
                        body: `_method=delete&authenticity_token=${encodeURIComponent(authToken)}`
                    }).then(response => {
                        if (response.ok) {
                            row.remove();
                        } else {
                            console.error('Fehler beim Entlassen:', response.statusText);
                        }

                        // nach letzter Kündigung Seite neu Laden
                        if (index === selected.length - 1) {
                            setTimeout(() => location.reload(), 500);
                        }
                    });
                }, index * 100);
            }
        });
    }

})();
