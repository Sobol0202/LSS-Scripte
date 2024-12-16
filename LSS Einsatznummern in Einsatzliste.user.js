// ==UserScript==
// @name         LSS Einsatznummern in Einsatzliste
// @version      1.3
// @description  Fügt Einsatznummern in die Einsatzliste ein.
// @author       MissSobol
// @match        https://www.operacni-stredisko.cz/
// @match        https://policie.operacni-stredisko.cz/
// @match        https://www.alarmcentral-spil.dk/
// @match        https://politi.alarmcentral-spil.dk/
// @match        https://www.leitstellenspiel.de/
// @match        https://polizei.leitstellenspiel.de/
// @match        https://www.missionchief-australia.com/
// @match        https://police.missionchief-australia.com/
// @match        https://www.missionchief.co.uk/
// @match        https://police.missionchief.co.uk/
// @match        https://www.missionchief.com/
// @match        https://police.missionchief.com/
// @match        https://www.centro-de-mando.es/
// @match        https://www.centro-de-mando.mx/
// @match        https://www.hatakeskuspeli.com/
// @match        https://poliisi.hatakeskuspeli.com/
// @match        https://www.operateur112.fr/
// @match        https://police.operateur112.fr/
// @match        https://www.operatore112.it/
// @match        https://polizia.operatore112.it/
// @match        https://www.missionchief-japan.com/
// @match        https://www.missionchief-korea.com/
// @match        https://www.nodsentralspillet.com/
// @match        https://politiet.nodsentralspillet.com/
// @match        https://www.meldkamerspel.com/
// @match        https://politie.meldkamerspel.com/
// @match        https://www.operatorratunkowy.pl/
// @match        https://policja.operatorratunkowy.pl/
// @match        https://www.operador193.com/
// @match        https://www.jogo-operador112.com/
// @match        https://policia.jogo-operador112.com/
// @match        https://www.jocdispecerat112.com/
// @match        https://www.dispetcher112.ru/
// @match        https://www.dispecerske-centrum.com/
// @match        https://www.larmcentralen-spelet.se/
// @match        https://polis.larmcentralen-spelet.se/
// @match        https://www.112-merkez.com/
// @match        https://www.dyspetcher101-game.com/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Hinzufügen der Einsatznummern in die Kacheln und den Suchfilter
    function addMissionNumbers() {
        // Suche alle Kacheln, die eine Einsatznummer haben sollten
        document.querySelectorAll('.missionSideBarEntry').forEach(function(mission) {
            // Hole die Einsatznummer aus dem ID-Attribut
            let missionId = mission.getAttribute('mission_id');

            // Hole das Caption-Element
            let captionElement = mission.querySelector(`#mission_caption_${missionId}`);

            // Prüfe, ob das Mission Caption Element existiert
            if (captionElement) {
                // Prüfen, ob ein durchgestrichener Text existiert und hol den gesamten Inhalt der Kachel
                let originalCaptionHTML = captionElement.innerHTML;

                // Überprüfen, ob die Einsatznummer bereits hinzugefügt wurde
                if (!originalCaptionHTML.includes(`[${missionId}]`)) {
                    // Einsatznummer hinter die letzte Caption hinzufügen
                    captionElement.innerHTML += ` [${missionId}]`;
                    //console.log(`Einsatznummer ${missionId} hinzugefügt.`);
                }
            }

            // Füge die Einsatznummer zum Suchattribut hinzu, falls noch nicht vorhanden
            let searchAttribute = mission.getAttribute('search_attribute');
            if (searchAttribute && !searchAttribute.includes(missionId)) {
                mission.setAttribute('search_attribute', searchAttribute + ' ' + missionId);
                //console.log(`Einsatznummer ${missionId} zum Suchattribut hinzugefügt.`);
            }
        });
    }

    // MutationObserver, der auf Änderungen in der DOM-Struktur achtet
    const observer = new MutationObserver(function(mutationsList, observer) {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                addMissionNumbers();
            }
        }
    });

    // Startet das Überwachen der DOM-Struktur
    observer.observe(document.querySelector('#missions-panel-body'), { childList: true, subtree: true });

    // Initiale Ausführung der Funktion
    addMissionNumbers();
})();
