// ==UserScript==
// @name         LSS SpielerID im Profil
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Zeigt die Spieler-ID und den ungefähren Registrierungszeitpunkt im Profil an
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/profile/*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Extrahieren der Spieler-ID aus der URL
    function getPlayerIDFromURL() {
        var url = window.location.href;
        var match = url.match(/\/profile\/(\d+)$/);
        if (match) {
            return match[1];
        }
        return null;
    }

    // Funktion zum Ermitteln des ungefähren Registrierungsdatums
    function getApproximateRegistrationDate(playerID) {
        var registrationList = {
            "571": "vor August 2013",
            "6571": "September 2013",
            "12571": "Oktober 2013",
            "18571": "November 2013",
            "24571": "Dezember 2013",
            "30571": "Januar 2014",
            "36571": "Februar 2014",
            "42571": "März 2014",
            "48571": "April 2014",
            "53355": "Mai 2014",
            "61050": "Juni 2014",
            "68192": "Juli 2014",
            "75334": "August 2014",
            "82476": "September 2014",
            "89618": "Oktober 2014",
            "96760": "November 2014",
            "103902": "Dezember 2014",
            "111044": "Januar 2015",
            "118186": "Februar 2015",
            "125328": "März 2015",
            "132470": "April 2015",
            "137300": "Mai 2015",
            "144924": "Juni 2015",
            "152600": "Juli 2015",
            "160236": "August 2015",
            "167772": "September 2015",
            "177278": "Oktober 2015",
            "186510": "November 2015",
            "195742": "Dezember 2015",
            "202564": "Januar 2016",
            "211329": "Februar 2016",
            "222049": "März 2016",
            "228386": "April 2016",
            "234723": "Mai 2016",
            "241060": "Juni 2016",
            "252330": "Juli 2016",
            "263600": "August 2016",
            "274870": "September 2016",
            "286142": "Oktober 2016",
            "294900": "November 2016",
            "303658": "Dezember 2016",
            "312418": "Januar 2017",
            "327907": "Februar 2017",
            "343396": "März 2017",
            "359747": "April 2017",
            "376098": "Mai 2017",
            "394187": "Juni 2017",
            "412276": "Juli 2017",
            "430365": "August 2017",
            "440036": "September 2017",
            "449707": "Oktober 2017",
            "459378": "November 2017",
            "469049": "Dezember 2017",
            "493534": "Januar 2018",
            "518019": "Februar 2018",
            "542504": "März 2018",
            "570416": "April 2018",
            "597309": "Mai 2018",
            "623602": "Juni 2018",
            "634401": "Juli 2018",
            "645200": "August 2018",
            "655999": "September 2018",
            "666798": "Oktober 2018",
            "677596": "November 2018",
            "697033": "Dezember 2018",
            "704980": "Januar 2019",
            "721382": "Februar 2019",
            "738454": "März 2019",
            "746991": "21.03.2019",
            "756091": "April 2019",
            "765191": "Mai 2019",
            "768227": "Juni 2019",
            "787587": "Juli 2019",
            "806947": "August 2019",
            "851989": "September 2019",
            "897031": "Oktober 2019",
            "942073": "November 2019",
            "987115": "Dezember 2019",
            "1032157": "Januar 2020",
            "1077199": "Februar 2020",
            "1122241": "März 2020",
            "1257372": "April 2020",
            "1320616": "Mai 2020",
            "1383860": "Juni 2020",
            "1447105": "Juli 2020",
            "1493766": "August 2020",
            "1526069": "September 2020",
            "1565874": "Oktober 2020",
            "1605679": "November 2020",
            "1645486": "Dezember 2020",
            "1703954": "Januar 2021",
            "1759287": "Februar 2021",
            "1814620": "März 2021",
            "1875774": "April 2021",
            "1907019": "Mai 2021",
            "1938264": "Juni 2021",
            "1969509": "Juli 2021",
            "2000754": "August 2021",
            "2033126": "September 2021",
            "2065498": "Oktober 2021",
            "2097870": "November 2021",
            "2123935": "Dezember 2021",
            "2150000": "Januar 2022",
            "2181933": "Februar 2022",
            "2213866": "März 2022",
            "2245799": "April 2022",
            "2269945": "Mai 2022",
            "2294091": "Juni 2022",
            "2318237": "Juli 2022",
            "2342383": "August 2022",
            "2369671": "September 2022",
            "2396959": "Oktober 2022",
            "2424247": "November 2022",
            "2451535": "Dezember 2022",
            "2477826": "Januar 2023",
            "2503049": "Februar 2023",
            "2528272": "März 2023",
            "2553496": "April 2023",
            "2576498": "Mai 2023",
            "2599500": "Juni 2023",
            "2620385": "Juli 2023",
            "2646992": "August 2023",
            "2673599": "September 2023",
            "2700206": "Oktober 2023",
            "2726813": "November 2023",
            "2753420": "Dezember 2023",
            "2780032": "Januar 2024",
            "2805262": "Februar 2024",
            "2833256": "März 2024",
            "2859868": "April 2024",
            "2886480": "Mai 2024",
            "2913092": "Juni 2024",
            "2939704": "Juli 2024",
            "2966316": "August 2024",
            "2992928": "September 2024",
            "3019540": "Oktober 2024",
            "3046152": "November 2024",
        };

        // Finde die nächstgelegene Spieler-ID in der Liste
        var nearestPlayerID = Object.keys(registrationList).reduce(function (a, b) {
            return Math.abs(b - playerID) < Math.abs(a - playerID) ? b : a;
        });

        return registrationList[nearestPlayerID] || "Unbekannt";
    }

    // Funktion zum Anzeigen der Spieler-ID und des ungefähren Registrierungsdatums am Ende des "userinfo" div-Elements
    function displayPlayerIDAndApproximateRegistrationDate() {
        var playerId = getPlayerIDFromURL();
        if (playerId) {
            var userinfoDiv = document.getElementById('userinfo');
            if (userinfoDiv) {
                var playerIdElement = document.createElement('div');
                var approximateRegistrationDate = getApproximateRegistrationDate(playerId);
                var playerIdText = 'Spieler-ID: ' + playerId + ' | Ungefähres Registrierungsdatum: ' + approximateRegistrationDate;
                playerIdElement.textContent = playerIdText;

                // Füge einen Event Listener hinzu, um auf Klicks zu reagieren
                playerIdElement.addEventListener('click', function() {
                    // Kopiere die ID in die Zwischenablage
                    GM_setClipboard(playerId, 'text');
                });

                userinfoDiv.appendChild(playerIdElement);
            }
        }
    }

    // Aufrufen der Funktion beim Laden der Seite
    displayPlayerIDAndApproximateRegistrationDate();
})();
