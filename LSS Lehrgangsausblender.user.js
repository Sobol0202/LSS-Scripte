// ==UserScript==
// @name         LSS Lehrgangsausblender
// @namespace    www.leitstellenspiel.de
// @version      1.2
// @description  Versteckt Lehrgänge, die nicht gewünscht/benötigt werden
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Definiere welche Lehrgänge versteckt werden sollen (true um zu verstecken, false um anzuzeigen)
    var filterSettings = {
        "Messtechnik":{
            "education_keys": {
                "0": false, //Messtechnik Feuerwehr
            }
        },
        "GW-Gefahrgut Lehrgang": {
            "education_keys": {
                "1": false, //Gefahrgut Feuerwehr
            }
        },
        "Höhenrettung": {
            "education_keys": {
                "2": false, //Höhenrettung Feuerwehr
            }
        },
        "ELW 2": {
            "education_keys": {
                "3": false, //ELW2 Feuerwehr
            }
        },
        "Wechsellader": {
            "education_keys": {
                "4": false, //Wechsellader Feuerwehr
            }
        },
        "Dekon-P": {
            "education_keys": {
                "5": false, //DekonP Feuerwehr
            }
        },
        "Feuerwehrkran": {
            "education_keys": {
                "6": false, //FwK Feuerwehr
            }
        },
        "Flugfeldlöschfahrzeug": {
            "education_keys": {
                "10": false, //FLF Feuerwehr
            }
        },
        "Rettungstreppen": {
            "education_keys": {
                "11": false, //Rettungstreppe Feuerwehr
            }
        },
        "Werkfeuerwehr": {
            "education_keys": {
                "12": false, //Werkfeuerwehr Feuerwehr
            }
        },
        "Feuerwehr-Verpflegungseinheit": {
            "education_keys": {
                "16": true, //Feuerwehr-Verpflegungseinheit Feuerwehr
            }
        },
        "NEA200": {
            "education_keys": {
                "14": false, //NEA200 Feuerwehr
            }
        },
        "Drohnen-Schulung": {
            "education_keys": {
                "15": false, //Drohne Feuerwehr
            }
        },
        "LNA": {
            "education_keys": {
                "1": false, //LNA Rettungsdienst
            }
        },
        "OrgL": {
            "education_keys": {
                "2": false, //OrgL Rettungsdienst
            }
        },
        "Betreuungsdienst": {
            "education_keys": {
                "10": false, //Betreuungsdienst Rettungsdienst
            }
        },
        "SEG - Einsatzleitung": {
            "education_keys": {
                "3": false, //ELW-SEG
            }
        },
        "SEG - GW-San": {
            "education_keys": {
                "4": false, //GW-San SEG
            }
        },
        "Rettungshundeführer (SEG)": {
            "education_keys": {
                "7": false, //Rettungshundeführer SEG
            }
        },
        "SEG Drohne": {
            "education_keys": {
                "9": false, //Drohne SEG
            }
        },
        "Zugtrupp": {
            "education_keys": {
                "0": false, //Zugtruppe THW
            }
        },
        "Fachgruppe Räumen": {
            "education_keys": {
                "1": false, //Räumen THW
            }
        },
        "Fachgruppe Wassergefahren": {
            "education_keys": {
                "2": true, //Wassergefahren THW
            }
        },
        "Fachgruppe Bergungstaucher": {
            "education_keys": {
                "3": true, //Bergungstaucher THW
            }
        },
        "Fachgruppe Rettungshundeführer": {
            "education_keys": {
                "4": false, //Rettungshund THW
            }
        },
        "Fachgruppe Wasserschaden/Pumpen": {
            "education_keys": {
                "5": false, //Pumpen THW
            }
        },
        "Fachgruppe Schwere Bergung": {
            "education_keys": {
                "6": false, //SB THW
            }
        },
        "Fachgruppe Elektroversorgung": {
            "education_keys": {
                "7": false, //Elektroversorgung THW
            }
        },
        "Trupp Unbemannte Luftfahrtsysteme": {
            "education_keys": {
                "8": false, //Drohne THW
            }
        },
        "Führung und Kommunikation": {
            "education_keys": {
                "9": true, //Kommunikation THW
            }
        },
        "Zugführer": {
            "education_keys": {
                "0": false, //Zugführer Polizei
            }
        },
        "Hundertschaftsführer": {
            "education_keys": {
                "1": false, //Hundertschaftsführer Polizei
            }
        },
        "Polizeihubschrauber": {
            "education_keys": {
                "2": false, //Polizeihubschrauber Polizei (duh)
            }
        },
        "Wasserwerfer": {
            "education_keys": {
                "3": false, //Wasserwerfer Polizei
            }
        },
        "SEK": {
            "education_keys": {
                "4": false, //SEK Polizei
            }
        },
        "MEK": {
            "education_keys": {
                "5": false, //MEK Polizei
            }
        },
        "Hundeführer (Schutzhund)": {
            "education_keys": {
                "6": false, //Schutzhund Polizei
            }
        },
        "Motorradstaffel": {
            "education_keys": {
                "7": false, //Motorrad Polizei
            }
        },
        "Brandbekämpfung": {
            "education_keys": {
                "8": false, //Löschen Polizei
            }
        },
        "Kriminalpolizei": {
            "education_keys": {
                "9": false, //Kripo Polizei (was du nicht sagst)
            }
        },
        "Dienstgruppenleitung": {
            "education_keys": {
                "10": false, //DGL Polizei
            }
        },
        "Reiterstaffel": {
            "education_keys": {
                "11": false, //Pferd Polizei
            }
        },
        "Notarzt-Ausbildung": {
            "education_keys": {
                "0": false, // Notarzt Rettungsdienst
                "9": true, // Notarzt Feuerwehr
            }
        },
        "Verpflegungshelfer": {
            "education_keys": {
                "11": true, // Verpflegungshelfer Rettungsdienst
                "17": true, // Verpflegungshelfer Feuerwehr
            }
        },
        "Intensivpflege": {
            "education_keys": {
                "8": false, // Intansivpflege Rettungsdienst
                "13": true, // Intansivpflege Feuerwehr
            }
        },
        "Wasserrettung": {
            "education_keys": {
                "5": false, // Wasserrettung Rettungsdienst
                "7": false, // Wasserrettung Feuerwehr
            }
        },
        "GW-Taucher": {
            "education_keys": {
                "6": false, // Taucher Rettungsdienst
                "8": false, // Taucher Feuerwehr
            }
        },
    };

    // Funktion zum Verstecken von Elementen basierend auf den Filtereinstellungen
    function hideElements() {
        var schoolingDiv = document.getElementById('schooling');
        if (schoolingDiv) {
            var radioElements = schoolingDiv.getElementsByClassName('radio');
            for (var i = 0; i < radioElements.length; i++) {
                var label = radioElements[i].getElementsByTagName('label')[0];
                if (label) {
                    var labelText = label.textContent.trim();
                    for (var filter in filterSettings) {
                        if (labelText.includes(filter)) {
                            var educationKey = radioElements[i].querySelector('input.radio').getAttribute('value');
                            var educationSettings = filterSettings[filter]["education_keys"];
                            if (educationSettings && educationSettings[educationKey] !== undefined && educationSettings[educationKey]) {
                                radioElements[i].style.display = 'none';
                                //console.log('Verstecke Lehrgang:', filter, 'mit education_key:', educationKey);
                            } else {
                                radioElements[i].style.display = '';
                                //console.log('Zeige Lehrgang:', filter, 'mit education_key:', educationKey);
                            }
                        }
                    }
                }
            }
        }
    }

    // Führe die Funktion zum Verstecken auf Seitenladung aus
    hideElements();

})();
