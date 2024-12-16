// ==UserScript==
// @name         LSS Navbar Buttons
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Fügt in die Navbar AAO-Buttons ein
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==


(function() {
    'use strict';
    // Mit den folgenden Zeilen lassen sich die Buttons einstellen.
    // Die Einzelnen Buttons sind jeweils (Beschriftung, Icon, AAO-ID, Tätigkeit, Farbe.
    // Die Beschriftung lässt sich flexibel anpassen.
    // Die Icons müssen jeweils zb von fontawesome.com kommen.
    // Die AAO-ID muss jeweils zu einem Vorandenen AAO-Button passen. Also die jeweilige AAO bearbeiten und dort aus der URL die id kopieren
    // Die Tätigkeit hat 3 verschiedene Möglichkeiten
         // alarm alarmiert die ausgewählte AAO einfach
         // alarm_next alarmiert die ausgewählte AAO und geht zum nächsten Einsatz
         // alarm_next_alliance alarmiert die ausgewählte AAO, gibt den Einsatz im Verband frei und geht zum nächsten Einsatz
    // Die Farbe hat 4 verschiedene Möglichkeiten
         // danger ist Rot
         // warning ist Orange
         // success ist Grün
         // primary ist Blau
         // weitere Farben sind möglich, dafür jeweils ins bootstrap-Wiki schauen

        // Buttons für die erste btn-group Rot
    let dangerButtons = [
        createButton('DLK', 'fa-solid fa-water-ladder', 25243291, 'alarm', 'btn-danger'),
        createButton('LF', 'fa-solid fa-fire-extinguisher', 25243292, 'alarm_next', 'btn-danger'),
        createButton('Fire', 'fa-solid fa-fire', 25243293, 'alarm_next_alliance', 'btn-danger')
    ];

    // Buttons für die zweite btn-group Orange
    let warningButtons = [
        createButton('RTW', 'fa-solid fa-truck-medical', 25243291, 'alarm', 'btn-warning'),
        createButton('NEF', 'fa-solid fa-stethoscope', 25243295, 'alarm_next', 'btn-warning'),
        createButton('RTH', 'fa-solid fa-helicopter', 25243296, 'alarm_next_alliance', 'btn-warning')
    ];

    // Buttons für die dritte btn-group Grün
    let successButtons = [
        createButton('MTW', 'fas fa-truck', 25243291, 'alarm', 'btn-success'),
        createButton('BRmG', 'fas fa-dumpster', 25243298, 'alarm_next', 'btn-success'),
        createButton('DLE', 'fas fa-trailer', 25243299, 'alarm_next_alliance', 'btn-success')
    ];

    // Buttons für die vierte btn-group Blau
    let primaryButtons = [
        createButton('FuStrW', 'fa-solid fa-handcuffs', 25243291, 'alarm', 'btn-primary'),
        createButton('GruKW', 'fas fa-shuttle-van', 25243301, 'alarm_next', 'btn-primary'),
        createButton('DGL', 'fa-solid fa-book-open-reader', 25243302, 'alarm_next_alliance', 'btn-primary')
    ];

    // Hier enden die Einstellungen der Buttons
    // Alles was nach dieser Linie kommt, solltest du nur bearbeiten, wenn du weißt was du tust
    // ----------------------------------------------------------------------------------------

    // Funktion zum Erstellen eines Buttons
    function createButton(text, iconClass, aaoId, action, buttonClass) {
        let button = $('<a></a>').addClass('btn btn ' + buttonClass)
                                  .text(text)
                                  .attr('href', '#')
                                  .attr('title', text)
                                  .attr('data-aao-id', aaoId)
                                  .attr('data-action', action);
        if (iconClass) {
            button.prepend($('<i></i>').addClass('fas ' + iconClass + ' mr-1'));
        }
        return button;
    }

    // Funktion zum Erstellen einer Button-Gruppe
    function createButtonGroup(classname, buttons) {
        let group = $('<div></div>').addClass('btn-group mr-2 ' + classname);
        buttons.forEach(function(button) {
            group.append(button);
        });
        return group;
    }

    // Button-Gruppen der Navbar hinzufügen
    $('#navbar-alarm-spacer').before(
        createButtonGroup('btn-danger', dangerButtons),
        createButtonGroup('btn-warning', warningButtons),
        createButtonGroup('btn-success', successButtons),
        createButtonGroup('btn-primary', primaryButtons)
    );

    // Event Listener für die Buttons
    $(document).on('click', '.btn-group a', function(e) {
        e.preventDefault();
        let aaoId = $(this).data('aao-id');
        let action = $(this).data('action');
        if (aaoId && action) {
            $('#aao_' + aaoId).click();
            switch (action) {
                case 'alarm':
                    $('#mission_alarm_btn').click();
                    break;
                case 'alarm_next':
                    $('.alert_next').click();
                    break;
                case 'alarm_next_alliance':
                    $('.alert_next_alliance').click();
                    break;
            }
        }
    });
})();
