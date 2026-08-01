// ==UserScript==
// @name         LSS Einsatzabschlussmeldung
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0.0
// @description  Zeigt nach Einsatzabschluss eine kleine Meldung an, mit dem Wert des fertigen Einsatzes
// @author       Sobol
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const MISSION_LIST_SELECTOR = '#mission_list';
    const COMPLETED_CLASS = 'mission_deleted';
    const processedMissions = new Set();

    function getMissionCaption(missionElement) {
        const captionElement = missionElement.querySelector(
            'a[id^="mission_caption_"], a#mission_caption'
        );

        if (!captionElement) {
            return null;
        }

        const clone = captionElement.cloneNode(true);

        clone.querySelectorAll('small').forEach(el => el.remove());

        let caption = clone.textContent.trim();

        caption = caption.replace(/,\s*$/, '').trim();

        return caption || null;
    }


    async function getMissionValueFromCredits(caption) {
        try {
            const response = await fetch(
                'https://www.leitstellenspiel.de/credits',
                {
                    method: 'GET',
                    credentials: 'same-origin',
                    cache: 'no-store'
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Credits-Seite antwortete mit HTTP ${response.status}`
                );
            }

            const html = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const table = doc.querySelector('table.table.table-striped');

            if (!table) {
                console.warn(
                    '[Einsatzwert] Tabelle auf /credits nicht gefunden.'
                );
                return null;
            }

            const rows = Array.from(table.querySelectorAll('tr'))
                .filter(row => row.querySelectorAll('td').length >= 2)
                .slice(0, 5);

            for (const row of rows) {
                const cells = row.querySelectorAll('td');

                const value = cells[0].textContent.trim();
                const creditCaption = cells[1].textContent.trim();

                if (
                    creditCaption === caption ||
                    creditCaption.includes(caption)
                ) {
                    return value;
                }
            }

            return null;

        } catch (error) {
            console.error(
                '[Einsatzwert] Fehler beim Abrufen der Credits:',
                error
            );

            return null;
        }
    }


function getPopupContainer() {
    let container = document.getElementById('lss-mission-value-popups');

    if (!container) {
        container = document.createElement('div');
        container.id = 'lss-mission-value-popups';

        Object.assign(container.style, {
            position: 'fixed',
            right: '20px',
            bottom: '20px',
            zIndex: '999999',
            display: 'flex',
            flexDirection: 'column-reverse',
            gap: '8px',
            alignItems: 'flex-end',
            pointerEvents: 'none'
        });

        document.body.appendChild(container);
    }

    return container;
}


function showPopup(caption, value) {
    const container = getPopupContainer();

    const popup = document.createElement('div');

    popup.innerHTML = `
    Einsatz <span style="font-weight: bold; text-decoration: underline;">${caption}</span>
    abgeschlossen. Einsatzwert: ${value}`;

    Object.assign(popup.style, {
        background: 'rgba(30, 30, 30, 0.92)',
        color: '#fff',
        padding: '10px 14px',
        borderRadius: '5px',
        fontSize: '13px',
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',

        whiteSpace: 'nowrap',
        width: 'max-content',
        maxWidth: 'none',

        opacity: '0',
        transform: 'translateY(5px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        pointerEvents: 'none'
    });

    container.appendChild(popup);

    requestAnimationFrame(() => {
        popup.style.opacity = '1';
        popup.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        popup.style.opacity = '0';
        popup.style.transform = 'translateY(5px)';

        setTimeout(() => {
            popup.remove();

            if (container.children.length === 0) {
                container.remove();
            }
        }, 300);

    }, 5000);
}

async function handleCompletedMission(missionElement) {
    const missionId =
        missionElement.getAttribute('mission_id') ||
        missionElement.id ||
        null;

    if (!missionId) {
        return;
    }

    if (processedMissions.has(missionId)) {
        return;
    }

    processedMissions.add(missionId);

    const caption = getMissionCaption(missionElement);

    await new Promise(resolve => setTimeout(resolve, 10000));

    const value = await getMissionValueFromCredits(caption);

    if (value !== null) {
        showPopup(caption, value);
    } else {
    }
}

    function checkMissionElement(element) {
        if (!(element instanceof HTMLElement)) {
            return;
        }

        if (
            element.matches('.missionSideBarEntry') &&
            element.classList.contains(COMPLETED_CLASS)
        ) {
            handleCompletedMission(element);
            return;
        }

        const completedMissions = element.querySelectorAll?.(
            `.missionSideBarEntry.${COMPLETED_CLASS}`
        );

        completedMissions?.forEach(handleCompletedMission);
    }

    function startObserver() {
        const missionList = document.querySelector(MISSION_LIST_SELECTOR);

        if (!missionList) {
            return false;
        }

        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {

                if (
                    mutation.type === 'attributes' &&
                    mutation.attributeName === 'class'
                ) {
                    checkMissionElement(mutation.target);
                }

                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        checkMissionElement(node);
                    });
                }
            }
        });

        observer.observe(missionList, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['class']
        });

        return true;
    }

    if (!startObserver()) {
        const initObserver = new MutationObserver(() => {
            if (startObserver()) {
                initObserver.disconnect();
            }
        });

        initObserver.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

})();
