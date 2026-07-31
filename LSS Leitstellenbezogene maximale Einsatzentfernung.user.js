// ==UserScript==
// @name         LSS Leitstellenbezogene maximale Einsatzentfernung
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0
// @description  Speichert je Leitstelle eine maximale Entfernung und wählt sie auf der Einsatzseiten automatisch aus.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(() => {
    'use strict';

    const STORAGE_KEY = 'lss_control_center_max_distances';
    const DISTANCES = [1, 5, 10, 20, 40, 50, 100, 200, 300, 400];
    const DEFAULT_DISTANCE = 400;

    function getStoredDistances() {
        const value = GM_getValue(STORAGE_KEY, {});

        return value &&
            typeof value === 'object' &&
            !Array.isArray(value)
            ? value
            : {};
    }

    function saveDistance(controlCenterId, distance) {
        const storedDistances = getStoredDistances();

        storedDistances[String(controlCenterId)] = Number(distance);

        GM_setValue(STORAGE_KEY, storedDistances);
    }

    function getBuildingIdFromUrl() {
        const match = window.location.pathname.match(
            /^\/buildings\/(\d+)/
        );

        return match ? match[1] : null;
    }

    function addControlCenterDistanceSelector() {
        const controlCenterId = getBuildingIdFromUrl();

        const settingsTabLink = document.querySelector(
            'a[href="#tab_settings"][url*="/leitstelle-settings"]'
        );

        const settingsTab = document.getElementById(
            'tab_settings'
        );

        if (
            !controlCenterId ||
            !settingsTabLink ||
            !settingsTab
        ) {
            return false;
        }

        const allianceDistanceSelect = settingsTab.querySelector(
            '#user_alliance_mission_distance'
        );

        if (!allianceDistanceSelect) {
            return false;
        }


        if (
            settingsTab.querySelector(
                '#lss_control_center_mission_distance'
            )
        ) {
            return true;
        }

        const storedDistances = getStoredDistances();

        const storedDistance = Number(
            storedDistances[controlCenterId]
        );

        const selectedDistance = DISTANCES.includes(
            storedDistance
        )
            ? storedDistance
            : DEFAULT_DISTANCE;


        if (!DISTANCES.includes(storedDistance)) {
            saveDistance(
                controlCenterId,
                DEFAULT_DISTANCE
            );
        }

        const formGroup = document.createElement('div');

        formGroup.className = [
            'form-group',
            'select',
            'optional',
            'lss_control_center_mission_distance'
        ].join(' ');

        const label = document.createElement('label');

        label.className =
            'col-sm-3 control-label select optional';

        label.htmlFor =
            'lss_control_center_mission_distance';

        label.textContent =
            'Maximale Entfernung für Einsätze dieser Leitstelle';

        const inputContainer = document.createElement('div');

        inputContainer.className = 'col-sm-9';

        const select = document.createElement('select');

        select.className =
            'select optional form-control';

        select.id =
            'lss_control_center_mission_distance';

        for (const distance of DISTANCES) {
            const option = document.createElement('option');

            option.value = String(distance);
            option.textContent = `${distance} km`;
            option.selected =
                distance === selectedDistance;

            select.appendChild(option);
        }

        select.addEventListener('change', () => {
            saveDistance(
                controlCenterId,
                Number(select.value)
            );
        });

        inputContainer.appendChild(select);

        formGroup.append(
            label,
            inputContainer
        );

        const originalFormGroup =
            allianceDistanceSelect.closest('.form-group');

        if (
            !originalFormGroup ||
            !settingsTab.contains(originalFormGroup)
        ) {
            return false;
        }

        originalFormGroup.insertAdjacentElement(
            'afterend',
            formGroup
        );

        return true;
    }


    function initializeBuildingSettingsObserver() {
        let updateScheduled = false;

        const tryToAddSelector = () => {
            updateScheduled = false;
            addControlCenterDistanceSelector();
        };


        const scheduleUpdate = () => {
            if (updateScheduled) {
                return;
            }

            updateScheduled = true;

            window.requestAnimationFrame(
                tryToAddSelector
            );
        };


        scheduleUpdate();

        const observer = new MutationObserver(
            scheduleUpdate
        );

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function getGeneratingBuildingId() {
        const missionInfo = document.getElementById(
            'mission_general_info'
        );

        return missionInfo
            ?.getAttribute(
                'data-generating-building-id'
            )
            ?.trim() || null;
    }


    function findControlCenterId(
        generatingBuildingId
    ) {
        const vehicleInputs = document.querySelectorAll(
            [
                'input.vehicle_checkbox[building_id]',
                'input[id^="vehicle_checkbox_"][building_id]'
            ].join(', ')
        );

        for (const input of vehicleInputs) {
            const buildingData = input
                .getAttribute('building_id')
                ?.trim();

            if (!buildingData) {
                continue;
            }

            const match = buildingData.match(
                /^(\d+)_(\d+)$/
            );

            if (!match) {
                continue;
            }

            const [
                ,
                buildingId,
                controlCenterId
            ] = match;

            if (
                buildingId ===
                String(generatingBuildingId)
            ) {
                return controlCenterId;
            }
        }

        return null;
    }

    function getSelectedDistance(group) {
        const searchParams = new URLSearchParams(
            window.location.search
        );

        const distanceFromUrl = Number(
            searchParams.get('distance_max')
        );

        if (
            DISTANCES.includes(distanceFromUrl)
        ) {
            return distanceFromUrl;
        }

        const activeButton = group.querySelector(
            'a.btn-success'
        );

        if (!activeButton) {
            return null;
        }

        const activeUrl = new URL(
            activeButton.href,
            window.location.origin
        );

        const distanceFromButton = Number(
            activeUrl.searchParams.get(
                'distance_max'
            )
        );

        return DISTANCES.includes(
            distanceFromButton
        )
            ? distanceFromButton
            : null;
    }


    function applyMissionDistance(
        forceDefault = false
    ) {
        const group = document.getElementById(
            'group_max_distance'
        );

        const generatingBuildingId =
            getGeneratingBuildingId();

        const vehicleInputs =
            document.querySelectorAll(
                'input[building_id]'
            );

        if (!group || !generatingBuildingId) {
            return false;
        }


        if (
            vehicleInputs.length === 0 &&
            !forceDefault
        ) {
            return false;
        }

        const controlCenterId =
            findControlCenterId(
                generatingBuildingId
            );

        const storedDistances =
            getStoredDistances();

        const storedDistance = controlCenterId
            ? Number(
                storedDistances[controlCenterId]
            )
            : NaN;


        const targetDistance =
            DISTANCES.includes(storedDistance)
                ? storedDistance
                : DEFAULT_DISTANCE;


        if (
            getSelectedDistance(group) ===
            targetDistance
        ) {
            return true;
        }

        const targetButton = [
            ...group.querySelectorAll('a.btn')
        ].find((button) => {
            const buttonUrl = new URL(
                button.href,
                window.location.origin
            );

            return Number(
                buttonUrl.searchParams.get(
                    'distance_max'
                )
            ) === targetDistance;
        });

        if (targetButton) {
            targetButton.click();
        } else {
            console.warn(
                '[LSS Leitstellenentfernung]',
                `Kein Schalter für ${targetDistance} km gefunden.`
            );
        }

        return true;
    }


    function initializeMissionPage() {
        let attempts = 0;
        const maxAttempts = 100;

        const intervalId = window.setInterval(
            () => {
                attempts += 1;

                const finished =
                    applyMissionDistance(
                        attempts >= maxAttempts
                    );

                if (
                    finished ||
                    attempts >= maxAttempts
                ) {
                    window.clearInterval(
                        intervalId
                    );
                }
            },
            100
        );
    }

    if (
        window.location.pathname.startsWith(
            '/buildings/'
        )
    ) {
        initializeBuildingSettingsObserver();
    } else if (
        window.location.pathname.startsWith(
            '/missions/'
        )
    ) {
        initializeMissionPage();
    }
})();
