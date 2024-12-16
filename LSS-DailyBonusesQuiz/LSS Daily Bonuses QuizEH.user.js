// ==UserScript==
// @name         LSS Daily Bonuses Quiz EH
// @namespace    https://www.leitstellenspiel.de
// @version      1.11r
// @description  Popup quiz for the daily bonuses Ersthelfer
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/daily_bonuses
// @match        https://www.leitstellenspiel.de/event-calendar
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var antwortAusgewählt = false; // Variable zum Speichern des Zustands der Frage

    // Fragenkatalog mit Fragen und Antworten
    var fragen = [
    	            {
        frage: "Welche Angaben sind beim Notruf sinnvoll?",
        antworten: [
            "Hausnummer, Ort und genaue Adresse",
            "Body-Maß-Idex",
            "Uhrzeit",
            "Hautfarbe"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Wie wird das Bewusstsein überprüft?",
        antworten: [
            "Notfallpatient sanft massieren, bis der Notarzt eintrifft",
            "Durch lautes Ansprechen und sanftes Schütteln an den Schultern",
            "Pupillenreflexe des Patienten mit einer Taschenlampe überprüfen",
            "Schmerzreiz an beiden Ohren durchführen"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Welchen Grundsatz soll jeder Ersthelfer in einer Gefahrenzone beachten?",
        antworten: [
            "Es gibt nie ein Gefahrenpotential bei der Leistung von Erster Hilfe!",
            "Selbstschutz geht vor Fremdschutz!",
            "Fremdschutz geht vor Eigenschutz!",
            "Dem Mutigen gehört die Welt!"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Wie lautet die Notrufnummer der Feuerwehr?",
        antworten: [
            "113",
            "115",
            "32 18 8",
            "112"
        ],
        richtigeAntwort: 3
    },
		            {
        frage: "Wie lautet die Notrufnummer der Polizei?",
        antworten: [
            "110",
            "115",
            "112",
            "32 18 8"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Welche Lagerung wird bei einer Kopfverletzung (Erste Hilfe) durchgeführt?",
        antworten: [
            "Stabile Seitenlage",
            "Bein-Hochlagerung",
            "Oberkörper-Hochlagerung",
            "Keine spezielle Lagerung erforderlich"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Wie wird die stabile Seitenlage korrekt durchgeführt?",
        antworten: [
            "Arm zur Seite legen, gegenüberliegendes Knie hochziehen, Handgelenk aufs Knie legen und herdrehen",
            "Arm nach oben legen, gegenüberliegendes Knie hochziehen und herdrehen",
            "Arm zur Seite legen, gegenüberliegendes Knie hochziehen, Ellbogen aufs Knie und herdrehen",
            "beide Arme zur Seite legen, gegenüberliegendes Knie hochziehen und herdrehen"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Welche Erste-Hilfe-Ausrüstung kann den Helfer vor Infektionen schützen?",
        antworten: [
            "Einmalhandschuhe",
            "Taschentuch",
            "Warnweste",
            "Alarmblinkanlage"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Welche Lagerung wird bei einem bewusstlosen Menschen durchgeführt?",
        antworten: [
            "Oberkörper-Hochlagerung",
            "Lagerung ohne Veränderung der Körperhaltung",
            "Deckenrolle unter dem Knie",
            "Stabile Seitenlage"
        ],
        richtigeAntwort: 3
    },
		            {
        frage: "Welche Lagerung wird bei Atemnot durchgeführt?",
        antworten: [
            "Bauchlage",
            "Oberkörper-Hochlagerung",
            "Keine besondere Lagerung erforderlich",
            "Beine-Hochlagerung"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Wie gehen Sie bei der Wiederbelebung als trainierter Ersthelfer vor?",
        antworten: [
            "3 Herzdruckmassagen / 1 Beatmung",
            "10 Herzdruckmassagen / 6 Beatmungen",
            "15 Herzdruckmassagen / 2 Beatmungen",
            "30 Herzdruckmassagen / 2 Beatmungen"
        ],
        richtigeAntwort: 3
    },
		            {
        frage: "Wann spricht man von einem bewusstlosen Notfallpatienten?",
        antworten: [
            "Patient reagiert nur auf Schmerzreize wie Zwicken in die Wangen",
            "Notfallpatient ist verwirrt und kann sich an nichts erinnern",
            "keine Reaktion auf lautes Ansprechen und sanftes Schütteln, hat normale Atmung",
            "Bewusstseinslage kann durch den Ersthelfer nicht überprüft werden"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Was bedeutet die Abkürzung AED?",
        antworten: [
            "Automatische - Eingangs - Dosis",
            "Automatische - Erdgas - Dauerfunktion",
            "Automatisierte - Externe - Defibrillation",
            "Automatisierte - Extrem - Defibrillation"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Was bedeutet defibrillieren?",
        antworten: [
            "flimmern",
            "früherkennen",
            "entflimmern",
            "reanimieren"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Welche Maßnahmen führen Sie bei Bewusstlosigkeit durch?",
        antworten: [
            "stabile Seitenlage zum Freihalten der Atemwege",
            "auf dem Rücken liegend und mit überstrecktem Kopf lagern",
            "flache Rückenlagerung und Beine hochlagern",
            "erhöhter Oberkörper ist die optimale Lagerung"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Wie viel Prozent Sauerstoff bekommt der Patient bei einer Mund-zu-Mund-Beatmung?",
        antworten: [
            "ca. 34 %",
            "ca. 21 %",
            "ca. 83 %",
            "ca. 17 %"
        ],
        richtigeAntwort: 3
    },
		            {
        frage: "Wenn ein Erwachsener nicht ansprechbar ist und nicht normal atmet, rufen Sie die Rettung und...",
        antworten: [
            "führen eine stabile Seitenlage durch",
            "führen sofort Beatmungen durch",
            "beginnen sofort mit der Herzdruckmassage",
            "versuchen eine Lagerung mit erhöhten Beinen"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Wann darf eine Ersthelferdefibrillation nicht angewendet werden?",
        antworten: [
            "z.B. bei Säuglingen",
            "z.B. Patient liegt in einer Wasserlacke",
            "z.B. Patient liegt auf Eisenbahnschienen",
            "Alle 3 Antworten treffen zu"
        ],
        richtigeAntwort: 3
    },
		            {
        frage: "Aus welchen Schritten besteht der Notfallcheck?",
        antworten: [
            "Atemwege freimachen und Atmung kontrollieren, laut ansprechen und sanft schütteln, Hilferuf",
            "Notfallcheck darf nur ein Sanitäter oder Notarzt durchführen",
            "es ist nur der Notruf abzusetzen",
            "Alkoholtest durchführen"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Bei welchen Notfällen ist eine Seitenlage sinnvoll?",
        antworten: [
            "Bewusstseinsstörung",
            "Herzbeschwerden mit Atemnot",
            "verstauchtem Knöchel",
            "verletzung HWS"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Welche Vorgehensweise ist bei der Anwendung eines Defibrillators korrekt?",
        antworten: [
            "Defibrillator einschalten und den Anweisungen des Geräts folgen",
            "während Schockabgabe Herzdruckmassage durchführen",
            "Elektroden aufkleben und dann erst Defibrillator einschalten",
            "solange eine Beatmung durchgeführt wird keine Elektroden aufkleben"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Wofür steht das A in FAST bei Verdacht auf Schlaganfall",
        antworten: [
            "Apoplexie",
            "Arms",
            "Arrhythmie",
            "Azidose"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Was versteht man unter einer Vergiftung?",
        antworten: [
            "schwere, oft lebensbedrohlicher Krankheitsbilder nach Aufnahme giftiger Substanzen",
            "entstehen am häufigsten bei Gefahrengutunfällen",
            "Nur bei Aufnahme großer Mengen schädlicher Substanzen kann von einer Vergiftung gesprochen werden",
            "Nur feste Stoffe können Vergiftungen hervorrufen"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Was sollte der Ersthelfer bei der Blutstillung vermeiden?",
        antworten: [
            "Verwendung einer keimfreien Wundauflage",
            "Durchführung der Basismaßnahmen",
            "Direkter Kontakt mit Blut",
            "Verwendung von Mullbindenverbänden"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Bei welcher Verletzung ist der manuelle Druck zur Blutstillung geeignet?",
        antworten: [
            "Schürfwunde",
            "Magenblutung",
            "Verrenkung",
            "Halsschlagaderverletzung"
        ],
        richtigeAntwort: 3
    },
		            {
        frage: "Was ist das Prinzip bei der Versorgung von chemischen Wunden?",
        antworten: [
            "Neutralisierung durch die Verabreichung von Gegenmitteln durch den Ersthelfer",
            "Bei chemischen Wunden im Verdauungstrakt stets zum Erbrechen bringen",
            "Die rasche Entfernung bzw. Verdünnung der ätzenden Substanz",
            "Patienten in sitzender Position so schnell wie möglich zum Betriebsarzt bringen"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Warum werden bei schwerer Schädigung eines Auges beide Augen keimfrei bedeckt?",
        antworten: [
            "um die Lichtstärke zu vermindern",
            "ohne Bedeckung würde das verletzte Auge synchron den Bewegungen des unverletzten Auges folgen",
            "damit die Schädigung nicht auf das unverletzte Auge übergreifen kann",
            "um bleibendes Schielen zu verhindern"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Wie sollte der Ersthelfer bei einem abgetrennten Körperteil vorgehen?",
        antworten: [
            "nichts unternehmen, nur auf Rettungsdienst warten",
            "abgetrennten Körperteil mit Eiswürfel kühlen",
            "abgetrennten Körperteil mit Seife reinigen, Wundversorgung durchführen",
            "keimfreie Wundversorgung durchführen und abgetrennten Körperteil in Rettungsdecke/Plastiksack wickeln"
        ],
        richtigeAntwort: 3
    },
		            {
        frage: "Wann wird ein Pflasterwundverband verwendet?",
        antworten: [
            "Zeckenstich",
            "Bei kleinen, nicht stark blutenden Wunden",
            "Verbrennungen",
            "Erfrierungen"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Der durchschnittliche Blutdruck einer gesunden erwachsenen Person liegt bei",
        antworten: [
            "200/100",
            "140/60",
            "120/80",
            "100/50"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Die 9er-Regel angewandt bei",
        antworten: [
            "Thermischen Notfällen",
            "Psychatrischen Notfällen",
            "Internistischen Notfällen",
            "Gynäkologischen Notfällen"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Der Status zum Patiententransport lautet:",
        antworten: [
            "3",
            "6",
            "0",
            "7"
        ],
        richtigeAntwort: 3
    },
		            {
        frage: "Wozu ist der Druck in Druckverband?",
        antworten: [
            "Steht für die bedrückende Situation des Patienten",
            "Übt Druck auf eine stark blutende Wunde aus",
            "Muss ausgedruckt werden",
            "Klemmt eine Aterie ab."
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Der europäische Notruf lautet?",
        antworten: [
            "112",
            "911",
            "999",
            "110"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Eine plötzliche Undeutliche Aussprache und halbseitige Lähmungserscheinungen sind ein starkes Zeichen für:",
        antworten: [
            "Herzinfarkt",
            "Magen-Darm-Infekt",
            "Schlaganfall",
            "Patellaluxation"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Eine Person liegt in einer Fußgängerzone auf dem Boden. Was tust du?",
        antworten: [
            "Nichts, da kümmert sich schon wer drum",
            "Selfies mit der Person",
            "Ansprechen, rütteln, falls keine Reaktion erfolgt weiter nach dem Schema der Lebensrettenden Sofortmaßnahmen.",
            "Ich mache andere Passanten auf die Situation aufmerksam und gehe"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Was ist bei einer Reanimation zu beachten?",
        antworten: [
            "Der Patient sollte auf einer harten Unterlage liegen.",
            "Die Drucktiefe sollte 5-6cm betragen.",
            "Alle drei Antworten sind richtig",
            "Der Druckpunkt sollte auf dem Brustbein zwischen etwas unter den Brustwarzen sein."
        ],
        richtigeAntwort:2 
    },
		            {
        frage: "Warum muss der Sturzhelm abgenommen werden, wenn der Verletzte nicht reagiert?",
        antworten: [
            "aus versicherungstechnischen Gründen",
            "zur Durchführung des Notfallchecks, Gefahr des Erstickens",
            "möglichkeit zur Flüssigkeitsaufnahme",
            "Weil Rettungssanitäter das nicht bringen."
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Welche Haltung muss der Helfer bei der psychischen Betreuung haben?",
        antworten: [
            "Mit Psychotricks arbeiten, um den Patienten zu beruhigen",
            "Witze Reißen, alles halb so wild",
            "Leere Versprechungen machen.",
            "Einfach sprechen, keine medizinischen Fremdwörter verwenden"
        ],
        richtigeAntwort: 3
    },
		            {
        frage: "Bei jedem Stromschlag können",
        antworten: [
            "Herzrhythmusstörungen entstehen",
            "nur Muskelkrämpfe entstehen",
            "nur Lähmungserscheinungen entstehen",
            "keine Beeinträchtigungen auftreten."
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Warum kann eine allergische Reaktion gefährlich sein?",
        antworten: [
            "Es kann zu massiven Rötungen kommen",
            "Sie kann zu Atemnot bis Herzstillstand führen",
            "Es kann zu übermässigem Juckreiz kommen",
            "Kann sie nicht."
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Welchen Griff kann man anwenden, um eine Person aus dem Auto zu retten?",
        antworten: [
            "Rautekgriff",
            "Würgegriff",
            "Gar nicht. Personen unter gar keinen Umständen bewegen.",
            "Pistolengriff"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Was ist die Systole?",
        antworten: [
            "obere Herzkranzgefäße",
            "Anpannungsphase des Herzen",
            "obere Atemwege",
            "Knochen im Arm"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Wieso braucht unser Gehirn Sauerstoff?",
        antworten: [
            "Damit es gut gepolstert ist.",
            "Damit die Nervenzellen nicht absterben",
            "Braucht es nicht.",
            "Das weiß niemand."
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Nach welcher Regel wird ein Notruf abgesetzt?",
        antworten: [
            "5 W Regel",
            "5 G Regel",
            "3 F Regel",
            "3 V Regel"
        ],
        richtigeAntwort: 0
    },
        // Weitere Fragen hier hinzufügen...
    ];

    // Funktion zum Aktualisieren des Popup-Inhalts
    function aktualisierePopup() {
        // Zufällige Frage auswählen
        var zufallsIndex = Math.floor(Math.random() * fragen.length);
        var aktuelleFrage = fragen[zufallsIndex];

        // Frage aktualisieren
        frageElement.textContent = aktuelleFrage.frage;

        // Antwortbuttons aktualisieren
        while (antwortButtonsContainer.firstChild) {
            antwortButtonsContainer.firstChild.removeEventListener("click", antwortButtonClickHandler);
            antwortButtonsContainer.firstChild.remove();
        }

        aktuelleFrage.antworten.forEach(function(antwort, index) {
            var antwortButton = document.createElement("button");
            antwortButton.textContent = antwort;
            antwortButton.style.display = "block";
            antwortButton.style.margin = "10px auto";
            antwortButton.style.padding = "20px 40px";
            antwortButton.style.fontSize = "20px";
            antwortButton.addEventListener("click", antwortButtonClickHandler);
            antwortButtonsContainer.appendChild(antwortButton);
        });

        antwortAusgewählt = false; // Zustand der Frage zurücksetzen
    }

    // Funktion zum Aktualisieren des Popup-Inhalts
    function aktualisierePopup() {
        // Zufällige Frage auswählen
        var zufallsIndex = Math.floor(Math.random() * fragen.length);
        var aktuelleFrage = fragen[zufallsIndex];

        // Frage aktualisieren
        frageElement.textContent = aktuelleFrage.frage;

        // Antwortbuttons aktualisieren
        while (antwortButtonsContainer.firstChild) {
            antwortButtonsContainer.firstChild.removeEventListener("click", antwortButtonClickHandler);
            antwortButtonsContainer.firstChild.remove();
        }

        aktuelleFrage.antworten.forEach(function(antwort, index) {
            var antwortButton = document.createElement("button");
            antwortButton.textContent = antwort;
            antwortButton.style.display = "block";
            antwortButton.style.margin = "10px auto";
            antwortButton.style.padding = "20px 40px";
            antwortButton.style.fontSize = "20px";
            antwortButton.addEventListener("click", antwortButtonClickHandler);
            antwortButtonsContainer.appendChild(antwortButton);
        });

        antwortAusgewählt = false; // Zustand der Frage zurücksetzen
    }

    // Funktion zum Behandeln des Klicks auf eine Antwort
    function antwortButtonClickHandler(event) {
        if (!antwortAusgewählt) { // Überprüfen, ob noch keine Antwort ausgewählt wurde
            var antwortButton = event.target;
            var antwortIndex = Array.from(antwortButtonsContainer.children).indexOf(antwortButton);
            var aktuelleFrage = fragen.find(function(frage) {
                return frage.frage === frageElement.textContent;
            });

            antwortAusgewählt = true; // Zustand der Frage auf "Antwort ausgewählt" setzen

            if (antwortIndex === aktuelleFrage.richtigeAntwort) {
                antwortButton.style.backgroundColor = "green";
                incrementCounter("DailyWin"); // DailyWin-Zähler erhöhen
                anzeigenZähler(); // Zähler im Popup aktualisieren
                setTimeout(function() {
                    popup.remove();
                }, 3000);
            } else {
                antwortButton.style.backgroundColor = "red";
                // Die richtige Antwort markieren
                var buttons = antwortButtonsContainer.querySelectorAll("button");
                buttons[aktuelleFrage.richtigeAntwort].style.backgroundColor = "yellow";

                incrementCounter("DailyFail"); // DailyFail-Zähler erhöhen
                anzeigenZähler(); // Zähler im Popup aktualisieren
                setTimeout(function() {
                    // Nächste Frage anzeigen
                    aktualisierePopup();
                }, 3000);
            }
        }
    }

    // Funktion zum Erhöhen der Zähler im LocalStorage
    function incrementCounter(counterName) {
        var counterValue = localStorage.getItem(counterName);
        if (counterValue) {
            localStorage.setItem(counterName, parseInt(counterValue) + 1);
        } else {
            localStorage.setItem(counterName, 1);
        }
    }

    // Funktion zum Anzeigen der Zähler im Popup
    function anzeigenZähler() {
        var zählerContainer = document.getElementById("zählerContainer");
        if (zählerContainer) {
            zählerContainer.remove();
        }

        zählerContainer = document.createElement("div");
        zählerContainer.id = "zählerContainer";
        zählerContainer.style.position = "absolute";
        zählerContainer.style.top = "10px";
        zählerContainer.style.right = "10px";
        zählerContainer.style.display = "flex";
        zählerContainer.style.justifyContent = "flex-end";
        zählerContainer.style.alignItems = "center";

        var dailyFailCounter = document.createElement("span");
        dailyFailCounter.style.color = "red";
        dailyFailCounter.style.marginRight = "10px";
        dailyFailCounter.textContent = "Daily Fail: " + (localStorage.getItem("DailyFail") || 0);

        var dailyWinCounter = document.createElement("span");
        dailyWinCounter.style.color = "green";
        dailyWinCounter.style.marginRight = "10px";
        dailyWinCounter.textContent = "Daily Win: " + (localStorage.getItem("DailyWin") || 0);

        var totalCounter = document.createElement("span");
        totalCounter.style.color = "black";
        totalCounter.textContent = "Total: " + ((parseInt(localStorage.getItem("DailyFail")) || 0) + (parseInt(localStorage.getItem("DailyWin")) || 0));

        zählerContainer.appendChild(dailyFailCounter);
        zählerContainer.appendChild(dailyWinCounter);
        zählerContainer.appendChild(totalCounter);

        popupContent.appendChild(zählerContainer);
    }

    // Popup erstellen
    var popup = document.createElement("div");
    popup.style.position = "fixed";
    popup.style.top = "0";
    popup.style.left = "0";
    popup.style.width = "100%";
    popup.style.height = "100%";
    popup.style.display = "flex";
    popup.style.alignItems = "center";
    popup.style.justifyContent = "center";
    popup.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    popup.style.zIndex = "9999";

    var popupContent = document.createElement("div");
    popupContent.style.backgroundColor = "white";
    popupContent.style.padding = "20px";
    popupContent.style.borderRadius = "10px";
    popupContent.style.overflowY = "auto"; // Hinzugefügt: Scrollbar aktivieren
    popupContent.style.maxHeight = "80vh"; // Hinzugefügt: Maximale Höhe für den Inhalt festlegen
    popup.appendChild(popupContent);

    // Frage hinzufügen
    var frageElement = document.createElement("p");
    frageElement.style.fontSize = "24px";
    frageElement.style.textAlign = "center";
    frageElement.style.color = "black";
    popupContent.appendChild(frageElement);

    // Antwortbuttons Container erstellen
    var antwortButtonsContainer = document.createElement("div");
    antwortButtonsContainer.style.textAlign = "center";
    antwortButtonsContainer.style.color = "black";
    popupContent.appendChild(antwortButtonsContainer);

    // Popup zur Seite hinzufügen
    document.body.appendChild(popup);

    // Popup initialisieren
    aktualisierePopup();
    anzeigenZähler();
})();
