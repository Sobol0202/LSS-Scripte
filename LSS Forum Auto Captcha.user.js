// ==UserScript==
// @name         [Forum] LSS Auto Captcha
// @namespace    https://forum.leitstellenspiel.de/
// @version      1.0
// @description  Schreibt automatisch 112 in das Captcha-Eingabefeld ein, falls vorhanden.
// @author       Sobol
// @match        https://forum.leitstellenspiel.de/cms/index.php?login/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const captchaInput = document.getElementById('captchaAnswer');
    if (captchaInput) {
        captchaInput.value = '112';
        console.log("Captcha wurde mit '112' ausgefüllt.");
    } else {
        console.log("Kein Captcha-Feld mit der ID 'captchaAnswer' gefunden.");
    }
})();
