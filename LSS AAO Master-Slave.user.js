// ==UserScript==
// @name         LSS AAO Master-Slave
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Ermöglicht das verknüpfen mehrerer AAOs aneinander (Master-Slave-Prinzip)
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Definition der Master- und Slave-IDs für jede Gruppe
    const masterSlaveGroups = [
        {
            masterId: 25243291, // Master-ID der ersten Gruppe
            slaveIds: [25242211, 44089606] // Slave-IDs der ersten Gruppe
        },
        {
            masterId: 30119743, // Master-ID der zweiten Gruppe
            slaveIds: [34537358, 25243286] // Slave-IDs der zweiten Gruppe
        },
        // Weitere Gruppen können nach Bedarf hinzugefügt werden
    ];

    // Funktion zum Klicken eines AAO-Buttons anhand seiner ID
    function clickAAOButtonById(buttonId) {
        $('#aao_' + buttonId).click();
    }

    // Event-Listener für das Klicken der AAO-Buttons
    $(document).on('click', '.aao_btn', function() {
        const clickedButton = $(this)[0];
        console.dir(clickedButton);

        const clickedButtonId = parseInt($(this).attr('aao_id'));
        const buttonName = $(this).text().trim();
        //console.log('AAO-Button "' + buttonName + '" mit ID ' + clickedButtonId + ' wurde geklickt.');
    });

    // Iteration über jede Gruppe von Master- und Slave-IDs
    masterSlaveGroups.forEach(function(group) {
        const masterId = group.masterId;
        const slaveIds = group.slaveIds;

        // Event-Listener für das Klicken des Master-Buttons
        $('#aao_' + masterId).on('click', function() {
            //console.log('Master-Element mit ID ' + masterId + ' wurde gedrückt.');

            // Slave-Buttons klicken
            slaveIds.forEach(function(slaveId) {
                const slaveButtonName = $('#aao_' + slaveId).text().trim();
                //console.log('Slave-Button "' + slaveButtonName + '" mit ID ' + slaveId + ' wird geklickt.');
                clickAAOButtonById(slaveId);
            });
        });
    });
})();
