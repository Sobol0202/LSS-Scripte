        getMissionTypeInMissionWindow() {
            const missionHelpBtn =
                document.querySelector<HTMLAnchorElement>('#mission_help');
            if (!missionHelpBtn) return '-1';

            let missionType = new URL(
                missionHelpBtn.getAttribute('href') ?? '',
                window.location.origin
            ).pathname.split('/')[2];

            const overlayIndex =
                document
                    .querySelector<HTMLDivElement>('#mission_general_info')
                    ?.getAttribute('data-overlay-index') ?? 'null';
            if (overlayIndex && overlayIndex !== 'null')
                missionType += `-${overlayIndex}`;
            const additionalOverlay =
                document
                    .querySelector<HTMLDivElement>('#mission_general_info')
                    ?.getAttribute('data-additive-overlays') ?? 'null';
            if (additionalOverlay && additionalOverlay !== 'null')
                missionType += `/${additionalOverlay}`;

            return missionType;
        },
