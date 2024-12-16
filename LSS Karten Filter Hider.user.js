// ==UserScript==
// @name        LSS Karten Filter Hider
// @version     1.0.2r
// @description Removes the Map Filter Button.
// @author      MissSobol
// @include     /^https?:\/\/(?:w{3}\.)?(?:operacni-stredisko\.cz|alarmcentral-spil\.dk|leitstellenspiel\.de|missionchief\.gr|(?:missionchief-australia|missionchief|hatakeskuspeli|missionchief-japan|missionchief-korea|nodsentralspillet|meldkamerspel|operador193|jogo-operador112|jocdispecerat112|dispecerske-centrum|112-merkez|dyspetcher101-game)\.com|missionchief\.co\.uk|centro-de-mando\.es|centro-de-mando\.mx|operateur112\.fr|operatore112\.it|operatorratunkowy\.pl|dispetcher112\.ru|larmcentralen-spelet\.se)\/?$/
// @grant       none
// ==/UserScript==

var test = document.getElementsByClassName('leaflet-control-layers-toggle');
  for (var index = 0; 
       index < test.length; index++) 
          { test[index].remove(); 
}
