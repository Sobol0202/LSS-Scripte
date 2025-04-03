// ==UserScript==
// @name         LSS Fahrzeuggrafik beim Kauf setzen
// @version      1.0
// @description  Setzt automatisch die Grafik eines gekauften Fahrzeugs
// @author       Sobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    //Mapping des Fahrzeugtyps zur GrafikID
    const vehicleTypeToGraphic = {
        0: 0, // LF 20
        1: 0, // LF 10
        2: 26149, // DLK 23
        3: 26150, // ELW 1
        4: 0, // RW
        5: 44163, // GW-A
        6: 0, // LF 8/6
        7: 0, // LF 20/16
        8: 0, // LF 10/6
        9: 0, // LF 16-TS
        10: 0, // GW-Öl
        11: 26158, // GW-L2-Wasser
        12: 0, // GW-Messtechnik
        13: 0, // SW 1000
        14: 0, // SW 2000
        15: 0, // SW 2000-Tr
        16: 0, // SW Kats
        17: 0, // TLF 2000
        18: 0, // TLF 3000
        19: 0, // TLF 8/8
        20: 0, // TLF 8/18
        21: 0, // TLF 16/24-Tr
        22: 0, // TLF 16/25
        23: 0, // TLF 16/45
        24: 0, // TLF 20/40
        25: 0, // TLF 20/40-SL
        26: 0, // TLF 16
        27: 6784, // GW-Gefahrgut
        28: 0, // RTW
        29: 0, // NEF
        30: 0, // HLF 20
        31: 0, // RTH
        32: 0, // FuStW
        33: 26180, // GW-Höhenrettung
        34: 26181, // ELW 2
        35: 0, // leBefKw
        36: 0, // MTW
        37: 0, // TSF-W
        38: 0, // KTW
        39: 0, // GKW
        40: 0, // MTW-TZ
        41: 0, // MzGW (FGr N)
        42: 0, // LKW K 9
        43: 0, // BRmG R
        44: 0, // Anh DLE
        45: 0, // MLW 5
        46: 0, // WLF
        47: 0, // AB-Rüst
        48: 0, // AB-Atemschutz
        49: 0, // AB-Öl
        50: 0, // GruKw
        51: 0, // FüKW (Polizei)
        52: 0, // GefKw
        53: 118492, // Dekon-P
        54: 0, // AB-Dekon-P
        55: 0, // KdoW-LNA
        56: 0, // KdoW-OrgL
        57: 38878, // FwK
        58: 0, // KTW Typ B
        59: 0, // ELW 1 (SEG)
        60: 0, // GW-San
        61: 0, // Polizeihubschrauber
        62: 0, // AB-Schlauch
        63: 0, // GW-Taucher
        64: 0, // GW-Wasserrettung
        65: 0, // LKW 7 Lkr 19 tm
        66: 0, // Anh MzB
        67: 0, // Anh SchlB
        68: 0, // Anh MzAB
        69: 0, // Tauchkraftwagen
        70: 0, // MZB
        71: 0, // AB-MZB
        72: 0, // WaWe 10
        73: 0, // GRTW
        74: 0, // NAW
        75: 117915, // FLF
        76: 0, // Rettungstreppe
        77: 0, // AB-Gefahrgut
        78: 0, // AB-Einsatzleitung
        79: 0, // SEK - ZF
        80: 0, // SEK - MTF
        81: 0, // MEK - ZF
        82: 0, // MEK - MTF
        83: 0, // GW-Werkfeuerwehr
        84: 0, // ULF mit Löscharm
        85: 0, // TM 50
        86: 0, // Turbolöscher
        87: 0, // TLF 4000
        88: 0, // KLF
        89: 0, // MLF
        90: 0, // HLF 10
        91: 0, // Rettungshundefahrzeug
        92: 0, // Anh Hund
        93: 0, // MTW-O
        94: 0, // DHuFüKW
        95: 0, // Polizeimotorrad
        96: 0, // Außenlastbehälter (allgemein)
        97: 0, // ITW
        98: 0, // Zivilstreifenwagen
        99: 0, //
        100: 0, // MLW 4
        101: 0, // Anh SwPu
        102: 0, // Anh 7
        103: 0, // FuStW (DGL)
        104: 0, // GW-L1
        105: 0, // GW-L2
        106: 0, // MTF-L
        107: 0, // LF-L
        108: 0, // AB-L
        109: 0, // MzGW SB
        110: 0, // NEA50
        111: 0, // NEA50
        112: 0, // NEA200
        113: 0, // NEA200
        114: 0, // GW-Lüfter
        115: 0, // Anh Lüfter
        116: 0, // AB-Lüfter
        117: 0, // AB-Tank
        118: 0, // Kleintankwagen
        119: 0, // AB-Lösch
        120: 0, // Tankwagen
        121: 0, // GTLF
        122: 0, // LKW 7 Lbw (FGr E)
        123: 0, // LKW 7 Lbw (FGr WP)
        124: 0, // MTW-OV
        125: 0, // MTW-Tr UL
        126: 0, // MTF Drohne
        127: 0, // GW UAS
        128: 0, // ELW Drohne
        129: 0, // ELW2 Drohne
        130: 0, // GW-Bt
        131: 0, // Bt-Kombi
        132: 0, // FKH
        133: 0, // Bt LKW
        134: 0, // Pferdetransporter klein
        135: 0, // Pferdetransporter groß
        136: 0, // Anh Pferdetransport
        137: 0, // Zugfahrzeug Pferdetransport
        138: 0, // GW-Verpflegung
        139: 0, // GW-Küche
        140: 0, // MTW-Verpflegung
        141: 0, // FKH
        142: 0, // AB-Küche
        143: 0, // Anh Schlauch
        144: 0, // FüKW (THW)
        145: 0, // FüKomKW
        146: 0, // Anh FüLa
        147: 0, // FmKW
        148: 0, // MTW-FGr K
        149: 0, // GW-Bergrettung (NEF)
        150: 0, // GW-Bergrettung
        151: 0, // ELW Bergrettung
        152: 0, // ATV
        153: 0, // Hundestaffel (Bergrettung)
        154: 0, // Schneefahrzeug
        155: 0, // Anh Höhenrettung (Bergrettung)
        156: 0, // Polizeihubschrauber mit verbauter Winde
        157: 0, // RTH Winde
        158: 0, // GW-Höhenrettung (Bergrettung)
        159: 0, // Seenotrettungskreuzer
        160: 0, // Seenotrettungsboot
        161: 0, // Hubschrauber (Seenotrettung)
        162: 0, // RW-Schiene
        163: 0, // HLF Schiene
        164: 0, // AB-Schiene
        165: 0, // LauKw
        166: 0, // PTLF 4000
        167: 0, // SLF
        168: 0, // Anh Sonderlöschmittel
        169: 0, // AB-Sonderlöschmittel
        170: 0, // AB-Wasser/Schaum

        // Hier weitere Zuordnungen ergänzen
    };

    // Fügt einen Button in die Erfolgsnachricht ein
    function addButton(vehicleId) {
        const alertBox = document.querySelector(".alert.alert-success");
        if (!alertBox) return;

        const button = document.createElement("button");
        button.className = "btn btn-default";
        button.innerHTML = '<span class="glyphicon glyphicon-film"></span>';
        button.style.marginLeft = "10px";
        button.onclick = () => fetchVehicleType(vehicleId);

        alertBox.appendChild(button);
    }

    // Ruft die Fahrzeugseite im Hintergrund auf und ermittelt den Fahrzeugtyp
    function fetchVehicleType(vehicleId) {
        GM_xmlhttpRequest({
            method: "GET",
            url: `https://www.leitstellenspiel.de/vehicles/${vehicleId}`,
            onload: function(response) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, "text/html");
                const typeElement = doc.querySelector("#vehicle-attr-type a");
                if (typeElement) {
                    const typeId = typeElement.getAttribute("href").split("/").pop();
                    setVehicleGraphic(vehicleId, typeId);
                }
            }
        });
    }

    // Setzt die Grafik basierend auf dem Fahrzeugtyp
    function setVehicleGraphic(vehicleId, typeId) {
        const graphicId = vehicleTypeToGraphic[typeId];
        if (!graphicId) {
            alert("Keine Grafikzuordnung für diesen Fahrzeugtyp gefunden.");
            return;
        }

        GM_xmlhttpRequest({
            method: "GET",
            url: `https://www.leitstellenspiel.de/vehicle_graphic_image_search/${vehicleId}/set/${graphicId}`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: function(response) {
                if (response.status === 200) {
                    alert("Grafik erfolgreich gesetzt!");
                } else {
                    alert("Fehler beim Setzen der Grafik.");
                }
            }
        });
    }

    // Initialisiert das Skript und sucht nach gekauften Fahrzeugen
    function init() {
        const alertBox = document.querySelector(".alert.alert-success");
        if (!alertBox) return;

        const vehicleLink = alertBox.querySelector(".btn-group a");
        if (vehicleLink) {
            const vehicleId = vehicleLink.getAttribute("href").split("/").pop();
            addButton(vehicleId);
        }
    }

    // Führt das Skript aus, sobald die Seite geladen ist
    window.addEventListener("load", init);
})();

