// ==UserScript==
// @name         LSS AAO Generator
// @version      1.2
// @description  Fügt einen Button ein um einen neuen AAO Eintrag zu erzeugen
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/einsaetze/*
// @match        https://www.leitstellenspiel.de/aaos/new
// @grant        GM_openInTab
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Hinzufügen des Buttons auf der Einsatzseite
    function addButton() {
        // Button erstellen
        var button = document.createElement("button");
        button.className = "btn btn-default";
        button.innerHTML = "AAO Eintrag erzeugen";
        button.style.position = "absolute";
        button.style.top = "60px";
        button.style.right = "15px";
        //button.style.zIndex = "1000";
        document.body.appendChild(button);

        // Event Listener für Button
        button.addEventListener("click", function() {
            // Einsatznamen aus dem <h1>-Tag extrahieren
            var missionNameElement = document.querySelector("h1");
            var missionName = missionNameElement ? missionNameElement.childNodes[missionNameElement.childNodes.length - 1].textContent.trim() : null;

            if (!missionName) {
                alert("Einsatzname nicht gefunden");
                return;
            }

            // Tabelle mit Fahrzeugen und Personal finden
            var tables = document.querySelectorAll("table.table-striped");
            var table = null;

            // Überprüfen, ob die Tabelle die gewünschte Überschrift hat
            tables.forEach(function(tbl) {
                var header = tbl.querySelector("thead th");
                if (header && header.textContent.includes("Benötigte Fahrzeuge und Personal")) {
                    table = tbl;
                }
            });

            if (!table) {
                alert("Tabelle nicht gefunden");
                return;
            }

            // Werte aus der Tabelle auslesen
            var values = { missionName: missionName };
            var rows = table.querySelectorAll("tbody tr");
            rows.forEach(function(row) {
                var cells = row.querySelectorAll("td");
                if (cells.length >= 2) {
                    var key = cells[0].textContent.trim();
                    var value = cells[1].textContent.trim();
                    values[key] = value;
                }
            });

            // Werte in Local Storage speichern
            localStorage.setItem("aaoValues", JSON.stringify(values));

            // URL für das neue Tab öffnen
            var newTabUrl = "https://www.leitstellenspiel.de/aaos/new";
            GM_openInTab(newTabUrl, true);
        });
    }

    // Funktion zum Einfügen der Werte auf der AAO-Seite
    function fillAAOValues() {
        var aaoValues = JSON.parse(localStorage.getItem("aaoValues"));
        if (aaoValues) {
            // Map von Fahrzeugnamen zu Input-Namen
            var inputMap = {
                "Benötigte Löschfahrzeuge": "aao[fire]", //LF oder TLF
                //"Benötigte Löschfahrzeuge": "aao[lf_only]", //LF
                //"Benötigte Tanklöschfahrzeuge": "aao[tlf_only]", //TLF
                "Wasserbedarf": "aao[wasser_amount]", //Liter Wasser
                //"Wasserbedarf": "aao[wasser_amount_tlf]", //Liter Wasser - Nur TLF
                //"Wasserbedarf": "aao[water_amount_water_carrier]", //Liter Wasser - Nur Großtankfahrzeuge
                //"Wasserbedarf": "aao[water_amount_tlf_water_carrier]", //Liter Wasser - Nur TLF oder Großtankfahrzeuge
                "Min. Pumpenleistung": "aao[water_damage_pump_value]", //Pumpenleistung
                //"Min. Pumpenleistung": "aao[water_damage_pump_value_only_pumps]", //Pumpenleistung - Nur Schmutzwasserpumpen
                "Benötigte ELW 1": "aao[elw]", //Einsatzleitfahrzeuge 1
                "Benötigte ELW 2": "aao[elw2]", //Einsatzleitfahrzeuge 2
                //"Benötigte ELW 1": "aao[elw1_or_elw2]", //ELW 1, ELW 2 oder AB-Einsatzleitung
                //"Benötigte ELW 2": "aao[ab_einsatzleitung_only]", //AB-Einsatzleitung
                //"Benötigte ELW 2": "aao[elw2_or_ab_elw]", //ELW 2 oder AB-Einsatzleitung
                //"Benötigte ELW 1": "aao[elw1_or_elw_drone]", //ELW1 oder ELW Drohne
                //"Benötigte ELW 2": "aao[elw2_or_elw2_drone]", //ELW2 oder ELW2 Drohne
                "Benötigte Drehleitern": "aao[dlk]", //Drehleitern
                //"Benötigte Drehleitern": "aao[dlk_or_tm50]", //DLK oder TM 50
                //"Benötigte Rüstwagen": "aao[hlf_only]", //HLF
                //"Benötigte Rüstwagen": "aao[hlf_or_rw_and_lf]", //HLF oder RW und LF
                "Benötigte Rüstwagen": "aao[rw]", //Rüstwagen oder HLF
                //"Benötigte Rüstwagen": "aao[rw_only]", //Rüstwagen
                //"Benötigte Rüstwagen": "aao[ab_ruest]", //AB Rüst
                //"Benötigte Rüstwagen": "aao[ab_ruest_rw]", //AB Rüst oder Rüstwagen oder HLF
                "Benötigte GW-A": "aao[gwa]", //GW-A oder AB-Atemschutz
                //"Benötigte GW-A": "aao[ab_atemschutz_only]", //AB-Atemschutz
                //"Benötigte GW-A": "aao[gw_atemschutz_only]", //GW-A
                "Benötigte GW-Öl": "aao[gwoel]", //GW-Öl oder AB-Öl
                //"Benötigte GW-Öl": "aao[ab_oel_only]", //AB-Öl
                //"Benötigte GW-Öl": "aao[gw_oel_only]", //GW-Öl
                //"Benötigte Schlauchwagen (GW-L2 Wasser, SW 1000, SW 2000 oder Ähnliches)": "aao[gwl2wasser]", //Schlauchwagen oder AB-Schlauch
                //"Benötigte Schlauchwagen (GW-L2 Wasser, SW 1000, SW 2000 oder Ähnliches)": "aao[gwl2wasser_only]", //Nur Schlauchwagen
                //"Benötigte Schlauchwagen (GW-L2 Wasser, SW 1000, SW 2000 oder Ähnliches)": "aao[abl2wasser_only]", //AB-Schlauch
                "Benötigte Schlauchwagen (GW-L2 Wasser, SW 1000, SW 2000 oder Ähnliches)": "aao[gwl2wasser_all]", //Alle Schlauchfahrzeuge
                "Benötigte GW-Mess": "aao[gwmesstechnik]", //GW-Messtechnik
                "Benötigte GW-Gefahrgut": "aao[gwgefahrgut]", //GW-Gefahrgut oder AB-Gefahrgut
                //"Benötigte GW-Gefahrgut": "aao[gw_gefahrgut_only]", //GW-Gefahrgut
                //"Benötigte GW-Gefahrgut": "aao[ab_gefahrgut_only]", //AB-Gefahrgut
                "Benötigte GW-Höhenrettung": "aao[gwhoehenrettung]", //GW-Höhenrettung
                "Benötigte Dekon-P": "aao[dekon_p]", //Dekon-P oder AB-Dekon-P
                //"Benötigte Dekon-P": "aao[only_dekon_p]", //Dekon-P
                //"Benötigte Dekon-P": "aao[only_ab_dekon_p]", //AB-Dekon-P
                //"Benötigte Personal": "aao[mtw]", //MTW
                "Benötigte Feuerwehrkräne (FwK)": "aao[fwk]", //Feuerwehrkran
                "Benötigte Flugfeldlöschfahrzeuge": "aao[arff]", //Flugfeldlöschfahrzeug
                "Benötigte Rettungstreppen": "aao[rettungstreppe]", //Rettungstreppe
                "Benötigte Turbolöscher": "aao[turboloescher]", //Turbolöscher
                "Benötigte Teleskopmasten": "aao[tm50]", //TM50
                "Benötigte ULF mit Löscharm": "aao[ulf]", //ULF mit Löscharm
                "Benötigte GW-Werkfeuerwehr": "aao[gw_werkfeuerwehr]", //GW-Werkfeuerwehr
                "Benötigte Lüfter": "aao[ventilation]", //Lüfter
                //"Benötigte GW-L1": "vehicle_type_ids[104]", //GW-L1
                //"Benötigte GW-L2": "vehicle_type_ids[105]", //GW-L2
                //"Benötigte MTF-L": "vehicle_type_ids[106]", //MTF-L
                //"Benötigte Großtanklöschfahrzeuge": "aao[water_carrier]", //Beliebiges Großtankfahrzeug
                //"Benötigte Kleintankwagen": "vehicle_type_ids[118]", //Kleintankwagen
                //"Benötigte Tankwagen": "vehicle_type_ids[120]", //Tankwagen
                //"Benötigte GTLF": "vehicle_type_ids[121]", //GTLF
                //"Benötigte AB-Tank": "vehicle_type_ids[117]", //AB-Tank
                //"Benötigte AB-Lösch": "vehicle_type_ids[119]", //AB-Lösch
                //"Benötigte Drohneneinheiten": "vehicle_type_ids[126]", //MTF Drohne
                //"Benötigte Drohneneinheiten": "vehicle_type_ids[128]", //ELW Drohne
                //"Benötigte Drohneneinheiten": "vehicle_type_ids[129]", //ELW2 Drohne
                //"Benötigte MTW-Verpflegung": "vehicle_type_ids[140]", //Kleintankwagen
                //"Benötigte GW-Küche": "vehicle_type_ids[139]", //GW-Küche
                //"Benötigte GW-Verpflegung": "vehicle_type_ids[138]", //GW-Verpflegung
                //"Benötigte FKH": "vehicle_type_ids[141]", //FKH
                //"Benötigte AB-Küche": "vehicle_type_ids[142]", //AB-Küche
                "Benötigte RTW": "aao[rtw]", //Rettungswagen
                //"Benötigte KTW": "aao[ktw]", //Krankentransportwagen
                //"Benötigte RTW": "aao[ktw_or_rtw]", //KTW oder RTW
                //"Benötigte RTW": "aao[ktw_or_rtw_2]", //KTW oder RTW oder ITW
                "Benötigte Notärzte": "aao[nef]", //Notarzteinsatzfahrzeug oder Rettungshubschrauber
                "Benötigte Rettungshubschrauber": "aao[rth_only]", //Rettungshubschrauber
                //"Benötigte Notärzte": "vehicle_type_ids[74]", //NAW
                //"Benötigte Notärzte": "aao[nef_only]", //Notarzteinsatzfahrzeug
                //"Benötigte ITW": "vehicle_type_ids[97]", //ITW
                //"Benötigte Notärzte": "aao[naw]", //NAW oder ITW
                //"Benötigte Notärzte": "aao[naw_or_rtw_and_nef]", //NAW oder ITW oder NEF+RTW
                //"Benötigte Notärzte": "aao[naw_or_rtw_and_nef_or_rth]", //NAW oder ITW oder NEF/RTH+RTW
                "Benötigte LNA": "aao[kdow_lna]", //KdoW-LNA
                "Benötigte OrgL": "aao[kdow_orgl]", //KdoW-OrgL
                "Benötigte GRTW": "aao[grtw]", //GRTW
                //"Benötigte GRTW": "aao[grtw0]", //GRTW (7 Patienten - ohne Notarzt)
                //"Benötigte GRTW": "aao[grtw1]", //GRTW (3 Patienten - inkl. Notarzt)
                "Benötigte Bergrettungsfahrzeuge": "vehicle_type_ids[150]", //GW-Bergrettung
                //"Benötigte Bergrettungsfahrzeuge": "vehicle_type_ids[149]", //GW-Bergrettung (NEF)
                "Benötigte ELW Bergrettung": "vehicle_type_ids[151]", //ELW Bergrettung
                "Benötigte ATV": "vehicle_type_ids[152]", //ATV
                //"Benötigte Rettungshundestaffeln": "vehicle_type_ids[153]", //Hundestaffel (Bergrettung)
                "Benötigte Schneefahrzeuge": "vehicle_type_ids[154]", //Schneefahrzeug
                "Benötigte Höhenrettung (Bergrettung)": "aao[mountain_height_rescue]", //Höhenrettung (Bergrettung)
                //"Benötigte Höhenrettung (Bergrettung)": "vehicle_type_ids[158]", //GW-Höhenrettung (Bergrettung)
                //"Benötigte Höhenrettung (Bergrettung)": "vehicle_type_ids[155]", //Anh Höhenrettung (Bergrettung)
                "Benötigte Hubschrauber mit Winde": "aao[lift]", //Hubschrauber mit Winde
                "Benötigte Streifenwagen": "aao[fustw]", //Funkstreifenwagen
                "Benötigte leBefKw": "aao[lebefkw]", //Leichter Befehlskraftwagen (leBefKw)
                "Benötigte FüKW (Polizei)": "aao[fukw]", //FüKW (Führungskraftwagen - Polizei)
                "Benötigte GruKw": "aao[grukw]", //GruKw (Gruppenkraftwagen)
                "Benötigte GefJw": "aao[gefkw]", //GefKw (Gefangenenkraftwagen)
                "Benötigte Polizeihubschrauber": "aao[polizeihubschrauber]", //Polizeihubschrauber
                "Benötigte Wasserwerfer": "aao[wasserwerfer]", //Wasserwerfer
                "Benötigte SEK-Fahrzeuge": "aao[sek_zf]", //SEK - ZF
                //"Benötigte SEK-Fahrzeuge": "aao[sek_mtf]", //SEK - MTF
                "Benötigte MEK-Fahrzeuge": "aao[mek_zf]", //MEK - ZF
                //"Benötigte MEK-Fahrzeuge": "aao[mek_mtf]", //MEK - MTF
                "Benötigte DHuFüKW": "aao[k9]", //Diensthundeführerkraftwagen
                "Benötigte Polizeimotorräder": "aao[police_motorcycle]", //Polizeimotorrad
                //"Benötigte Polizeimotorräder": "aao[fustw_or_police_motorcycle]", //Funkstreifenwagen oder Polizeimotorrad
                "Benötigte Außenlastbehälter (allgemein)": "aao[helicopter_bucket]", //Außenlastbehälter (allgemein)
                "Benötigte Funkstreifenwagen (Dienstgruppenleitung)": "vehicle_type_ids[103]", //FuStW (DGL)
                //"Benötigte Funkstreifenwagen (Dienstgruppenleitung)": "aao[police_car_or_service_group_leader]", //FuStW oder FuStW (DGL)
                "Benötigte Zivilstreifenwagen": "vehicle_type_ids[98]", //Zivilstreifenwagen
                "Benötigte Polizeipferde": "aao[police_horse_count]", //Polizeipferde
                "Benötigte GKW": "aao[gkw]", //Gerätekraftwagen (GKW)
                "Benötigte MTW-TZ": "aao[thw_mtw]", //Mannschaftstransportwagen Technischer Zug (MTW-TZ - THW)
                //"Benötigte MTW-OV": "vehicle_type_ids[124]", //MTW-OV
                "Benötigte MzGW (FGr N)": "aao[thw_mzkw]", //Mehrzweck-Gerätewagen (FGr N)
                "LKW K 9": "aao[thw_lkw]", //Lastkraftwagen-Kipper 9 t (LKW K 9)
                "BRmG R": "aao[thw_brmg_r]", //Radlader groß (BRmG R)
                "Anhänger Drucklufterzeugung": "aao[thw_dle]", //Anhänger Drucklufterzeugung (Anh DLE)
                "Benötigte MLW 4": "vehicle_type_ids[100]", //MLW 4
                "Benötigte MLW 5": "aao[thw_mlw5]", //Mannschaftslastwagen Typ V (MLW 5)
                //"Benötigte GW-Taucher": "aao[thw_tauchkraftwagen]", //Tauchkraftwagen
                "Benötigte GW-Taucher": "aao[thw_tauchkraftwagen_or_gw_taucher]", //Tauchkraftwagen oder GW-Taucher
                //"Benötigte Boote": "aao[thw_anh_mzab]", //Anh MzAB
                //"Benötigte Boote": "aao[thw_anh_schlb]", //Anh SchlB
                //"Benötigte Boote": "aao[thw_anh_mzb]", //Anh MzB
                //"Benötigte Boote": "aao[thw_lkw_7_lkr_19_tm]", //LKW 7 Lkr 19 tm
                //"Benötigte Rettungshundestaffeln": "aao[rescue_dogs_thw]", //Anhänger Hundetransport
                "Benötigte Schmutzwasserpumpen": "aao[pump]", //Schmutzwasserpumpen
                "Benötigte LKW 7 Lbw (FGr WP)": "vehicle_type_ids[123]", //LKW 7 Lbw (FGr WP)
                "Benötigte Anh SwPu": "vehicle_type_ids[101]", //Anh SwPu
                "Benötigte Anh 7": "vehicle_type_ids[102]", //Anh 7
                "Benötigte MzGW SB": "vehicle_type_ids[109]", //MzGW SB
                "Benötigte LKW 7 Lbw (FGr E)": "vehicle_type_ids[122]", //LKW 7 Lbw (FGr E)
                "Benötigte NEA50": "aao[energy_supply]", //NEA50
                "Benötigte NEA200": "aao[energy_supply_2]", //NEA200
                "Benötigte Drohneneinheiten": "aao[drone]", //Beliebige Drohneneinheit
                "Benötigte MTW-Tr UL": "vehicle_type_ids[125]", //MTW-Tr UL
                "Benötigte FüKW (THW)": "vehicle_type_ids[144]", //FüKW (THW)
                "Benötigte FüKomKW": "vehicle_type_ids[145]", //FüKomKW
                "Benötigte Anh FüLa": "vehicle_type_ids[146]", //Anh FüLa
                "Benötigte FmKW": "vehicle_type_ids[147]", //FmKW
                "Benötigte MTW FGr K": "vehicle_type_ids[148]", //MTW-FGr K
                "Benötigte KTW Typ B": "aao[ktw_b]", //KTW Typ B
                //"Benötigte Drohneneinheiten": "vehicle_type_ids[127]", //GW-UAS
                //"Benötigte Betreuungs- und Verpflegungsausstattung": "vehicle_type_ids[131]", //Bt-Kombi
                "Benötigte ELW 1 (SEG)": "aao[seg_elw]", //ELW 1 (SEG)
                "Benötigte GW-San": "aao[gw_san]", //GW-San
                "Benötigte Rettungshundestaffeln": "aao[rescue_dogs_seg]", //Rettungshundefahrzeug
                "Benötigte Betreuungs- und Verpflegungsausstattung": "aao[care_service_equipment]", //Betreuungs- und Verpflegungsausstattung
                //"Benötigte Betreuungs- und Verpflegungsausstattung": "vehicle_type_ids[130]", //GW-Bt
                //"Benötigte Betreuungs- und Verpflegungsausstattung": "vehicle_type_ids[133]", //Bt LKW
                //"Benötigte Betreuungs- und Verpflegungsausstattung": "vehicle_type_ids[132]", //FKH
                //"Benötigte GW-Taucher": "aao[gw_taucher]", //GW-Taucher
                //"Benötigte GW-Wasserrettung": "aao[gw_wasserrettung]", //GW-Wasserrettung
                "Benötigte Boote": "aao[boot]", //Boote (Allgemein)
                //"Benötigte Boote": "aao[mzb]", //Mehrzweckboot
                //"Benötigte Rettungshundestaffeln": "aao[rescue_dogs]", //Anhänger Hundetransport oder Rettungshundefahrzeug
                "Benötigte Seenotrettungsboote oder Seenotrettungskreuzer": "vehicle_type_ids[[160, 159]]", //Beliebiges Seenotrettungsschiff
                "Benötigte Seenotrettungskreuzer": "vehicle_type_ids[159]", //Seenotrettungskreuzer
                "Benötigte Hubschrauber (Seenotrettung)": "vehicle_type_ids[161]", //Hubschrauber (Seenotrettung)
                //"Benötigte Seenotrettungsboote oder Seenotrettungskreuzer": "vehicle_type_ids[160]", //Seenotrettungsboot
                "Benötigte Bahnrettungsfahrzeuge": "aao[railway_fire]", //Beliebiges Bahnrettungsfahrzeug
                //"Benötigte Bahnrettungsfahrzeuge": "vehicle_type_ids[162]", //RW-Schiene
                //"Benötigte Bahnrettungsfahrzeuge": "vehicle_type_ids[163]", //HLF Schiene
                //"Benötigte Bahnrettungsfahrzeuge": "vehicle_type_ids[164]", //AB-Schiene

            };


            // Einsatznamen in das entsprechende Input-Feld einfügen
            var missionNameInput = document.querySelector("input[name='aao[caption]']");
            if (missionNameInput) {
                missionNameInput.value = aaoValues.missionName;
            }

            // Werte in die richtigen Inputs schreiben
            for (var key in aaoValues) {
                if (aaoValues.hasOwnProperty(key) && key !== "missionName") {
                    var inputName = inputMap[key];
                    if (inputName) {
                        var inputElement = document.querySelector(`input[name='${inputName}']`);
                        if (inputElement) {
                            inputElement.value = aaoValues[key];
                        }
                    }
                }
            }

            // Nach dem Einfügen der Werte aus dem Local Storage entfernen
            localStorage.removeItem("aaoValues");
        }
    }

    // Überprüfen, auf welcher Seite das Skript ausgeführt wird
    if (window.location.href.includes("https://www.leitstellenspiel.de/einsaetze/")) {
        addButton();
    } else if (window.location.href === "https://www.leitstellenspiel.de/aaos/new") {
        fillAAOValues();
    }
})();
