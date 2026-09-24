// ==UserScript==
// @name         LSS Massenentlassungen
// @version      1.2
// @description  Ermöglicht das massenhafte Entlassen von Personal
// @author       Sobol
// @match        https://www.leitstellenspiel.de/buildings/*/personals
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const FILTER_NO_ASSIGNMENT = 'tm-no-assignment';
    const FILTER_NO_EDUCATION_ASSIGNMENT = 'tm-no-education-assignment';

    function getPersonnelRows() {
        return Array.from(
            document.querySelectorAll('input.personal-delete-checkbox')
        )
            .map(input => input.closest('tr'))
            .filter(Boolean);
    }

    function isCellEmpty(td) {
        if (!td) {
            return true;
        }

        return td.textContent.trim() === '';
    }

    function resetCustomRowDisplay() {
        getPersonnelRows().forEach(row => {
            row.style.display = '';
        });
    }

    function applyCustomFilter(filterValue) {
        const rows = getPersonnelRows();

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');

            const educationCell = cells[2];
            const assignmentCell = cells[3];

            let show = true;

            if (filterValue === FILTER_NO_ASSIGNMENT) {
                show = isCellEmpty(assignmentCell);
            }

            if (filterValue === FILTER_NO_EDUCATION_ASSIGNMENT) {
                show =
                    isCellEmpty(educationCell) &&
                    isCellEmpty(assignmentCell);
            }

            row.style.display = show ? '' : 'none';
        });
    }

    function isRowVisible(row) {
        if (!row) {
            return false;
        }

        return (
            window.getComputedStyle(row).display !== 'none' &&
            row.getClientRects().length > 0
        );
    }

    function setCheckbox(checkbox, checked) {
        if (!checkbox || checkbox.checked === checked) {
            return;
        }

        checkbox.checked = checked;

        checkbox.dispatchEvent(
            new Event('change', {
                bubbles: true
            })
        );
    }

    function selectVisibleRows() {
        getPersonnelRows().forEach(row => {
            if (!isRowVisible(row)) {
                return;
            }

            const checkbox = row.querySelector(
                'input.personal-delete-checkbox'
            );

            if (checkbox) {
                setCheckbox(checkbox, true);
            }
        });
    }

    function resetSelection() {
        document
            .querySelectorAll('input.personal-delete-checkbox')
            .forEach(checkbox => {
                if (checkbox.checked) {
                    setCheckbox(checkbox, false);
                }
            });
    }

    function enableFilter(select) {
        if (!select) {
            return;
        }

        select.disabled = false;
        select.removeAttribute('disabled');

        const bootstrapSelect = select.closest('.bootstrap-select');

        if (bootstrapSelect) {
            bootstrapSelect.classList.remove('disabled');

            const button = bootstrapSelect.querySelector(
                'button.dropdown-toggle'
            );

            if (button) {
                button.disabled = false;
                button.classList.remove('disabled');
                button.removeAttribute('disabled');
                button.removeAttribute('aria-disabled');

                if (button.getAttribute('tabindex') === '-1') {
                    button.removeAttribute('tabindex');
                }
            }
        }
    }

    function refreshSelectpicker(select) {
        if (
            window.jQuery &&
            typeof window.jQuery.fn.selectpicker === 'function'
        ) {
            try {
                window.jQuery(select).selectpicker('refresh');

                enableFilter(select);
            } catch (error) {
                console.warn(
                    'Selectpicker konnte nicht aktualisiert werden:',
                    error
                );
            }
        }
    }

    function addFilterOptions(select) {
        if (
            !select.querySelector(
                `option[value="${FILTER_NO_ASSIGNMENT}"]`
            )
        ) {
            const option = document.createElement('option');

            option.value = FILTER_NO_ASSIGNMENT;
            option.textContent = 'Ohne Zuweisung';

            select.appendChild(option);
        }

        if (
            !select.querySelector(
                `option[value="${FILTER_NO_EDUCATION_ASSIGNMENT}"]`
            )
        ) {
            const option = document.createElement('option');

            option.value = FILTER_NO_EDUCATION_ASSIGNMENT;
            option.textContent = 'Ohne Ausbildung und Zuweisung';

            select.appendChild(option);
        }

        enableFilter(select);
        refreshSelectpicker(select);
    }

    function addButtons(select) {
        if (document.getElementById('tm-personnel-filter-buttons')) {
            return;
        }

        const bootstrapSelect =
            select.closest('.bootstrap-select') ||
            select.parentElement;

        if (!bootstrapSelect) {
            return;
        }

        const wrapper = document.createElement('div');

        wrapper.id = 'tm-personnel-filter-buttons';
        wrapper.className = 'btn-group';

        wrapper.style.marginLeft = '8px';
        wrapper.style.verticalAlign = 'top';

        const selectVisibleButton = document.createElement('button');

        selectVisibleButton.type = 'button';
        selectVisibleButton.className = 'btn btn-primary';
        selectVisibleButton.textContent = 'Angezeigt auswählen';

        selectVisibleButton.addEventListener('click', event => {
            event.preventDefault();
            selectVisibleRows();
        });

        const resetButton = document.createElement('button');

        resetButton.type = 'button';
        resetButton.className = 'btn btn-default';
        resetButton.textContent = 'Auswahl zurücksetzen';

        resetButton.addEventListener('click', event => {
            event.preventDefault();
            resetSelection();
        });

        wrapper.appendChild(selectVisibleButton);
        wrapper.appendChild(resetButton);

        bootstrapSelect.insertAdjacentElement('afterend', wrapper);
    }

    function setupFilterEvents(select) {
        if (select.dataset.tmPersonnelFilterInitialized === 'true') {
            return;
        }

        select.dataset.tmPersonnelFilterInitialized = 'true';

        select.addEventListener(
            'change',
            () => {
                resetCustomRowDisplay();
            },
            true
        );

        select.addEventListener('change', () => {
            const value = select.value;

            if (
                value === FILTER_NO_ASSIGNMENT ||
                value === FILTER_NO_EDUCATION_ASSIGNMENT
            ) {
                applyCustomFilter(value);
            }
        });
    }

    function initialize() {
        const select = document.querySelector(
            'select.selectpicker.education-filter'
        );

        if (!select) {
            return false;
        }

        addFilterOptions(select);
        setupFilterEvents(select);
        addButtons(select);

        enableFilter(select);

        return true;
    }

    if (initialize()) {
        return;
    }

    const observer = new MutationObserver(() => {
        if (initialize()) {
            observer.disconnect();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
