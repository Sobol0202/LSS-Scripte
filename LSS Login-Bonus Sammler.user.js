// ==UserScript==
// @name         LSS Login-Bonus Sammler
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0
// @description  Sammelt den Daily-Login Bonus ein, wenn dieser verfügbar ist.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
  'use strict';

  const dailyBonus = document.querySelector('#daily-bonus');

  if (!dailyBonus || !dailyBonus.classList.contains('daily_bonus_not_taken')) {
    return;
  }

  const authToken = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute('content');

  if (!authToken) {
    console.warn('CSRF-Token nicht gefunden.');
    return;
  }

  GM_xmlhttpRequest({
    method: 'GET',
    url: 'https://www.leitstellenspiel.de/daily_bonuses',
    onload: function (response) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.responseText, 'text/html');

      const collectButton = doc.querySelector(
        '.collect-possible-block .collect-button'
      );

      if (!collectButton) {
        console.warn('Kein abholbarer Daily-Bonus gefunden.');
        return;
      }

      const collectUrl = collectButton.getAttribute('url');

      if (!collectUrl) {
        console.warn('Collect-URL nicht gefunden.');
        return;
      }

      const postUrl = new URL(collectUrl, 'https://www.leitstellenspiel.de/');

      const body = new URLSearchParams({
        utf8: '✓',
        authenticity_token: authToken
      }).toString();

      GM_xmlhttpRequest({
        method: 'POST',
        url: postUrl.href,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-CSRF-Token': authToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        data: body,
        onload: function () {
          console.log('Daily-Bonus wurde abgeholt.');
          location.reload();
        },
        onerror: function (error) {
          console.error('Fehler beim Abholen des Daily-Bonus:', error);
        }
      });
    },
    onerror: function (error) {
      console.error('Fehler beim Laden der Daily-Bonus-Seite:', error);
    }
  });
})();
