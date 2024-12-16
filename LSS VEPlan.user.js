// ==UserScript==
// @name         VE Plan
// @version      1.0.1
// @description  Schreibt den VE Plan unten hin
// @author       Sobol
// @include      /^https?:\/\/(?:w{3}\.)?(?:(policie\.)?operacni-stredisko\.cz|(politi\.)?alarmcentral-spil\.dk|(polizei\.)?leitstellenspiel\.de|missionchief\.gr|(?:(police\.)?missionchief-australia|(police\.)?missionchief|(poliisi\.)?hatakeskuspeli|missionchief-japan|missionchief-korea|nodsentralspillet|meldkamerspel|operador193|jogo-operador112|jocdispecerat112|dispecerske-centrum|112-merkez|dyspetcher101-game)\.com|(police\.)?missionchief\.co\.uk|centro-de-mando\.es|centro-de-mando\.mx|(police\.)?operateur112\.fr|(polizia\.)?operatore112\.it|operatorratunkowy\.pl|dispetcher112\.ru|larmcentralen-spelet\.se)\/.*$/
// @grant        none
// ==/UserScript==
/* global $ */

(function() {
    $("#btn-alliance-new-mission")
        .parent()
        .parent()
        .after("Montag: Dresden <br> Dienstag: Pirna, Heidenau <br> Mittwoch: Meißen <br> Donnerstag: Stolpen, Radeberg <br> Freitag: Dresden <br> Samstag: Tharandt <br> Sonntag: Glashütte, Kreischa");
})();