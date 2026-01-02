// ==UserScript==
// @name         LSS Wichtige Info Verstecken
// @version      1.1
// @description  Versteckt die Wichtige Info solange der Inhalt gleich bleibt und sie ein mal bestätigt wurde
// @match           https://www.operacni-stredisko.cz/
// @match           https://policie.operacni-stredisko.cz/
// @match           https://www.alarmcentral-spil.dk/
// @match           https://politi.alarmcentral-spil.dk/
// @match           https://www.leitstellenspiel.de/
// @match           https://polizei.leitstellenspiel.de/
// @match           https://www.missionchief-australia.com/
// @match           https://police.missionchief-australia.com/
// @match           https://www.missionchief.co.uk/
// @match           https://police.missionchief.co.uk/
// @match           https://www.missionchief.com/
// @match           https://police.missionchief.com/
// @match           https://www.centro-de-mando.es/
// @match           https://www.centro-de-mando.mx/
// @match           https://www.hatakeskuspeli.com/
// @match           https://poliisi.hatakeskuspeli.com/
// @match           https://www.operateur112.fr/
// @match           https://police.operateur112.fr/
// @match           https://www.operatore112.it/
// @match           https://polizia.operatore112.it/
// @match           https://www.missionchief-japan.com/
// @match           https://www.missionchief-korea.com/
// @match           https://www.nodsentralspillet.com/
// @match           https://politiet.nodsentralspillet.com/
// @match           https://www.meldkamerspel.com/
// @match           https://politie.meldkamerspel.com/
// @match           https://www.operatorratunkowy.pl/
// @match           https://policja.operatorratunkowy.pl/
// @match           https://www.operador193.com/
// @match           https://www.jogo-operador112.com/
// @match           https://policia.jogo-operador112.com/
// @match           https://www.jocdispecerat112.com/
// @match           https://www.dispetcher112.ru/
// @match           https://www.dispecerske-centrum.com/
// @match           https://www.larmcentralen-spelet.se/
// @match           https://polis.larmcentralen-spelet.se/
// @match           https://www.112-merkez.com/
// @match           https://www.dyspetcher101-game.com/
// @author       Sobol
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'alliance_chat_header_info_content';

    function init() {
        const el = document.getElementById('alliance_chat_header_info');
        if (!el) return;

        const currentContent = el.textContent.trim();
        const storedContent = GM_getValue(STORAGE_KEY, null);

        if (storedContent !== null) {
            if (storedContent === currentContent) {
                el.style.display = 'none';
            } else {
                GM_deleteValue(STORAGE_KEY);
                el.style.display = '';
            }
        }

        el.addEventListener('click', () => {
            const content = el.textContent.trim();
            GM_setValue(STORAGE_KEY, content);
            el.style.display = 'none';
        });

        const observer = new MutationObserver(() => {
            const newContent = el.textContent.trim();
            const saved = GM_getValue(STORAGE_KEY, null);

            if (saved !== null && newContent !== saved) {
                GM_deleteValue(STORAGE_KEY);
                el.style.display = '';
            }
        });

        observer.observe(el, {
            characterData: true,
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
