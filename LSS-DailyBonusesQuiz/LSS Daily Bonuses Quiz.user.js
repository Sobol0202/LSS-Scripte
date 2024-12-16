// ==UserScript==
// @name         LSS Daily Bonuses Quiz
// @namespace    https://www.leitstellenspiel.de
// @version      1.10r
// @description  Popup quiz for the daily bonuses
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
        frage: "Aktive Mitglieder der Freiwilligen Feuerwehren sind verpflichtet,",
        antworten: [
            "an Brandbekämpfungs- und Hilfeleistungseinsätzen teilzunehmen.",
            "Arbeiten zum Auspumpen von Baugruben im Rahmen von Bauarbeiten durchzuführen.",
            "Sicherungsmaßnahmen bei Laternenumzügen im eigenen Ermessen durchzuführen.",
            "durch den Ortsbrandmeister angesetzten, nicht dienstlichen Veranstaltungen teilzunehmen."
        ],
        richtigeAntwort: 0
    },
    {
        frage: "Berufsfeuerwehren müssen aufgestellt werden",
        antworten: [
            "in Städten mit mehr als 100000 Einwohnern.",
            "in Städten mit viel Industrie und mehr als 50000 Einwohnern.",
            "in Städten ohne Freiwillige Feuerwehren.",
            "in Städten mit besonders hohem Gefahrenpotenzial und einer anerkannten Werkfeuerwehr."
        ],
        richtigeAntwort: 0
    },
    {
        frage: "Feuerwehrangehörige dürfen im Einsatz",
        antworten: [
            "eine Straßensperrung vornehmen.",
            "grundsätzlich keine Eingriffe in den Straßenverkehr vornehmen, da es in den Zuständigkeitsbereich der Polizei fällt.",
            "den Verkehr im Bereich von Einsatzstellen regeln (Verkehrslenkung und -leitung).",
            "beliebig in den Straßenverkehr eingreifen, mit der Einschränkung, dass das nur auf Anforderung des Einsatzleiters der Feuerwehr erfolgen darf."
        ],
        richtigeAntwort: 0
    },
    {
        frage: "Aufgaben der Gemeinden und Landkreise nach dem Nds. Brandschutzgesetz sind",
        antworten: [
            "Brandschutz und Hilfeleistung.",
            "Brandschutz und Rettungsdienst.",
            "Brandschutz und Krankentransport.",
            "Zivilschutzbezogene Aufgaben, hier: Schulung des THW."
        ],
        richtigeAntwort: 0
    },
    {
        frage: "Die Freiwillige Feuerwehr einer Stadt bzw. Gemeinde wird geleitet durch",
        antworten: [
            "den Stadt-/Gemeindebrandmeister.",
            "den Stadt-/Gemeindedirektor.",
            "den für die jeweilige Gemeinde oder Stadt zuständigen Abschnittsleiter.",
            "den vom Feuerschutzausschuss ernannten Ehrenbeamten."
        ],
        richtigeAntwort: 0
    },
    {
        frage: "Der feuerwehrtechnische Aufsichtsbeamte des Landkreises ist",
        antworten: [
            "der Oberkreisdirektor.",
            "der Kreisbrandmeister.",
            "der Brandschutzprüfer.",
            "der Kreisbrandinspektor."
        ],
        richtigeAntwort: 1
    },
    {
        frage: "Im Alarmfall dürfen nur Feuerwehrangehörige ausrücken,",
        antworten: [
            "die zwar Alkohol getrunken haben, sich aber noch fit fühlen.",
            "die krank geschrieben sind, aber nur, wenn es der Gesundheitszustand nach eigener Einschätzung zulässt.",
            "die uneingeschränkt körperlich und geistig tauglich sind.",
            "die Drogen konsumiert haben, sich aber noch fit fühlen."
        ],
        richtigeAntwort: 2
    },
    {
        frage: "Eine Verbrennung ist eine",
        antworten: [
            "schnell ablaufende Reaktion zwischen einem brennbaren Stoff und Kohlenstoffdioxid.",
            "schnell ablaufenden Oxidation unter Licht- und Wärmeerscheinung.",
            "Oxidbildung bei Metallen (Rosten).",
            "schnell verlaufende Reduktion eines brennbaren Stoffs."
        ],
        richtigeAntwort: 1
    },
    {
        frage: "Benzin wird der",
        antworten: [
            "Brandklasse A zugeordnet.",
            "Brandklasse B zugeordnet.",
            "Brandklasse C zugeordnet.",
            "Brandklasse F zugeordnet."
        ],
        richtigeAntwort: 1
    },
    {
        frage: "Zur Bekämpfung von Bränden der Brandklasse „A“ ist",
        antworten: [
            "Wasser geeignet.",
            "Kohlenstoffmonoxid geeignet.",
            "Glutbrandpulver nicht einzusetzen.",
            "nur ein Löschmittel einzusetzen, das mit einem ‚X’ gekennzeichnet ist."
        ],
        richtigeAntwort: 0
    },
    {
        frage: "Zur Brandklasse C gehören",
        antworten: [
            "feste, brennbare Stoffe.",
            "flüssige, brennbare Stoffe.",
            "gasförmige, brennbare Stoffe.",
            "Dämpfe brennbarer Flüssigkeiten."
        ],
        richtigeAntwort: 2
    },
    {
        frage: "Nur mit Glut verbrennen",
        antworten: [
            "Holz, Kohle, Papier.",
            "Holzkohle, Koks.",
            "Wachs, Stearin, Fett.",
            "Hartwachs und entgaste Kohle."
        ],
        richtigeAntwort: 1
    },
        	            {
        frage: "Am mittleren Ausgangsstutzen des Verteilers (B-CBC) ist",
        antworten: [
            "ein B/C-Übergangsstück angekuppelt.",
            "ein A/C-Übergangsstück angekuppelt.",
            "ein A/B-Übergangsstück angekuppelt.",
            "ein C/D-Übergangsstück angekuppelt."
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Ein C-Strahlrohr mit Mundstück hat bei einem Druck von 4 bar eine Wasserdurchflussmenge pro Minute von",
        antworten: [
            "ca. 200 l.",
            "ca. 100 l.",
            "ca. 300 l.",
            "ca. 400 l."
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Ein B-Strahlrohr mit Mundstück hat bei 4 bar Strahlrohrdruck eine Wasserdurchflussmenge von",
        antworten: [
            "ca. 400 l/min.",
            "ca. 300 l/min.",
            "ca. 600 l/min.",
            "ca. 500 l/min."
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "B-Druckschläuche können nach Norm wie folgt bemessen sein:",
        antworten: [
            "85 mm Nennweite; 20 m und 30 m Schlauchlänge.",
            "75 mm Nennweite; 5 m, 20 m und 35 m Schlauchlänge.",
            "75 mm Nennweite; 15 m und 30 m Schlauchlänge.",
            "52 mm Nennweite; 20 m und 30 m Schlauchlänge (nur bei B-52)."
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Zu den wasserführenden Armaturen zählen",
        antworten: [
            "Standrohr, Saugkorb, Sammelstück und Verteiler.",
            "Kübelspritze, Wasserlöscher, Entlüftungseinrichtung.",
            "Tauchpumpe, Hydrantenschlüssel, Auffülltrichter.",
            "Schlauchkupplungen, Strahlrohre, Verteiler, Entlüftungseinrichtung."
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Zum Halten eines B-Strahlrohres mit Stützkrümmer sind mindestens",
        antworten: [
            "zwei Feuerwehrleute erforderlich.",
            "drei bis vier Feuerwehrleute erforderlich.",
            "ein kräftiger Feuerwehrmann erforderlich.",
            "Einsatzkräfte nach Weisung des Gruppenführers, mindestens einer."
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Ein A-Saugschlauch mit der Kennzeichnung A-110-1500-K hat einen Innendurchmesser von",
        antworten: [
            "10 cm.",
            "95 mm.",
            "110 mm.",
            "120 mm."
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Bei einem Mehrzweckstrahlrohr gibt es die Schaltstellungen",
        antworten: [
            "nur Vollstrahl und Sprühstrahl.",
            "Vollstrahl, Sprühstrahl und Wasser Halt.",
            "Vollstrahl und Wasser Halt.",
            "Hohlstrahl, Vollstrahl, Kegelstrahl."
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Das Standrohr dient zur",
        antworten: [
            "Wasserentnahme aus Unterflurhydranten.",
            "Wasserentnahme aus Überflurhydranten.",
            "Straßenüberführung von Schlauchleitungen.",
            "Stabilisierung von Strahlrohren beim stationären Einsatz."
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Ein Schaumrohr wird am Verteiler angeschlossen",
        antworten: [
            "am mittleren Ausgangsstutzen / an der mittleren Kupplung.",
            "nur bei Vornahme eines Schaumrohres S 4.",
            "nach Reihenfolge der eingesetzten Rohre.",
            "nach Vorgabe des Gruppenführers."
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Für die Inbetriebnahme eines Unterflurhydranten werden",
        antworten: [
            "Standrohr und Unterflurhydrantenschlüssel benötigt.",
            "Sammelstück und Kupplungsschlüssel benötigt.",
            "Standrohr und Feuerwehrschlüssel benötigt.",
            "Ausrüstungsteile nach Vorgabe des Gruppenführers benötigt."
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Ein Schild mit der Beschriftung H 100 weist auf",
        antworten: [
            "einen Hydranten für die Löschwasserentnahme in 100 m Entfernung hin.",
            "einen Hydranten für Löschwasser mit einer Ergiebigkeit von 100 l/min hin.",
            "einen Hydranten hin, der auf einer Versorgungsleitung von 100 mm Innendurchmesser montiert ist.",
            "einen Hydranten hin, für den ein Hydrantenschlüssel NW 100 mm erforderlich ist."
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Ein Standrohr mit passendem Schlüssel wird gebraucht zur Inbetriebnahme von",
        antworten: [
            "Überflurhydranten.",
            "Wandhydranten.",
            "Unterflurhydranten.",
            "gegen Missbrauch gesicherten Hydranten."
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Welche Schaltmöglichkeiten müssen bei einem genormten Hohlstrahlrohr gegeben sein?",
        antworten: [
            "Strahlrohr auf/dreiviertel-zu",
            "Strahlrohr auf/zu und Durchflussmengeneinstellung",
            "Strahlrohr auf/zu und Einstellmöglichkeit der Wasserstrahlform",
            "Strahlrohr auf/zu, Einstellmöglichkeit der Wasserstrahlform und Durchflussmengeneinstellung"
        ],
        richtigeAntwort: 3
    },
		            {
        frage: "Welches der nachfolgenden Mehrzweckstrahlrohre ist das Kleinste?",
        antworten: [
            "AM",
            "BM",
            "CM",
            "DM"
        ],
        richtigeAntwort: 3
    },
		            {
        frage: "Mit der vierteiligen Steckleiter ist",
        antworten: [
            "eine Rettungshöhe von 8,40 Meter erreichbar.",
            "das zweite Obergeschoss erreichbar.",
            "das dritte Obergeschoss erreichbar.",
            "das erste Obergeschoss bei einem Anstellwinkel von 90° erreichbar."
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Die Feuerwehrleine wird Personen zu Rettungszwecken in Form",
        antworten: [
            "eines Rettungsbundes angelegt.",
            "eines Kreuzknotens angelegt.",
            "eines Mastwurfes angelegt.",
            "eines Rettungsknotens angelegt."
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Die Feuerwehrleine dient als",
        antworten: [
            "Rettungs- und Führungsleine.",
            "Halte- und Ventilleine.",
            "Absperr- und Abschleppleine.",
            "Mehrzweckleine."
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Es dürfen",
        antworten: [
            "max. drei Steckleiterteile zusammengesteckt werden.",
            "max. vier Steckleiterteile zusammengesteckt werden.",
            "max. fünf Steckleiterteile zusammengesteckt werden.",
            "eine unbegrenzte Anzahl von Steckleiterteilen nach der Vorgabe des Einsatzleiters zusammengesteckt werden."
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Die Feuerwehrleine",
        antworten: [
            "dient zum Einfangen von Tieren, alte Bezeichnung: Fangleine!",
            "dient als Halteleine.",
            "ist ein Rettungsgerät, das zur ergänzenden persönlichen Ausrüstung gehört.",
            "dient in bestimmten Fällen als Auffangsicherung."
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Der Halbschlag",
        antworten: [
            "dient zum Führen von Geräten beim Hochziehen.",
            "dient nur der Einbindung von zwei Personen auf Krankentragen.",
            "dient ausschließlich der Sicherung des Auszugseiles der dreiteiligen Schiebleiter.",
            "dient in bestimmten Fällen als Auffangsicherung beim Retten/Selbstretten."
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Mit der dreiteiligen Schiebleiter ist",
        antworten: [
            "eine Rettungshöhe von 13.40 m erreichbar.",
            "das zweite Obergeschoss erreichbar.",
            "das dritte Obergeschoss erreichbar.",
            "das vierte Obergeschoss bei einem Anstellwinkel von 90° erreichbar."
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Die Multifunktionsleiter",
        antworten: [
            "ist Standardbeladung auf einem HLF 20/16.",
            "ist Standardbeladung auf einem RW.",
            "ist keine genormte Leiter der Feuerwehr.",
            "gehört nicht zur Standardbeladung von Feuerwehrfahrzeugen."
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Beim Einsatz des Einreißhakens",
        antworten: [
            "ist Gesichtschutz niemals erforderlich.",
            "ist Gesichtsschutz erforderlich.",
            "dürfen sich nicht beteiligte Personen im Wirkungsbereich aufhalten.",
            "kann generell auf Grundsätze, die einer Unfallverhütung dienen, verzichtet werden."
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Mit der Feuerwehraxt ist es möglich:",
        antworten: [
            "Türen zu öffnen",
            "Holz für Abstützungen zu kürzen",
            "Die Feuerwehraxt hat heute keine Bedeutung mehr",
            "darf nur truppweise eingesetzt werden"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Bei Einsatz der Winkerkelle ist zu beachten, dass",
        antworten: [
            "Winkerkellen zur Verkehrsregelung eingesetzt werden dürfen.",
            "Winkerkellen nur zur Verkehrssicherung eingesetzt werden dürfen.",
            "Winkerkellen keine Feuerwehrzulassung haben.",
            "Winkerkellen nur auf Anweisung der Polizei eingesetzt werden dürfen."
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Rettungs- und Selbstrettungsübungen dürfen durchgeführt werden bis",
        antworten: [
            "zu max. 8,0 m Höhe.",
            "max. zum 1. Obergeschoss.",
            "zu max. 6,0 m Höhe.",
            "zu einer durch den Übungsleiter vorzugebenden Höhe."
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Der Gerätesatz „Absturzsicherung“ darf",
        antworten: [
            "nur von speziell ausgebildetem Personal eingesetzt werden.",
            "nur bei der Rettung von Personen genutzt werden.",
            "bei Feuerwehren gar nicht verwendet werden.",
            "nur zum öffnen einer Bierflasche verwendet werden."
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Die vier große metallverstärkte Ring an der Schleifkorbtrage",
        antworten: [
            "dienen zum Einhaken von optionaler Zusatzausrüstung, die nicht jeder Hersteller von Schleifkorbtragen im Angebot hat.",
            "dienen zum Einhaken von Karabinerhaken.",
            "sind ohne Bedeutung, da sie lediglich der inneren Versteifung der Trage dienen.",
            "dürfen nur durch Fachpersonal (Einsatz auf See oder Gewässern) benutzt werden."
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Ein Hydranten Hinweisschild gibt",
        antworten: [
            "den Durchmesser der Versorgungsleitung und die Wassermenge an.",
            "den Druck und die Wassermenge an.",
            "den Durchmesser der Versorgungsleitung und die Lage des Hydranten bezogen auf das Schild an.",
            "die Lage des Hydranten und den Nennaußendurchmesser der Kupplung an."
        ],
        richtigeAntwort: 2
    },
			            {
        frage: "Schläuche für Sonderrohre werden am Verteiler (in Fließrichtung)",
        antworten: [
            "an der linken Kupplung angeschlossen.",
            "an der mittleren Kupplung angeschlossen.",
            "an der rechten Kupplung angeschlossen.",
            "nach Weisung des Gruppenführers angeschlossen."
        ],
        richtigeAntwort: 1
    },
			            {
        frage: "Für das Kuppeln von zwei Saugschläuchen (Herstellen der Saugleitung) ist gemäß FwDV 3 „Einheiten im Löscheinsatz“",
        antworten: [
            "der Maschinist zuständig.",
            "der Wassertrupp zuständig.",
            "nur der Wassertruppführer zuständig.",
            "nur das Wassertruppmitglied zuständig."
        ],
        richtigeAntwort: 1
    },
			            {
        frage: "Der Schlauchtrupp verlegt Schlauchleitungen für den Angriffstrupp gemäß FwDV 3 „Einheiten im Löscheinsatz“",
        antworten: [
            "von der Wasserentnahmestelle zur Pumpe.",
            "vom Trupp zum Verteiler.",
            "vom Verteiler zum Trupp.",
            "nur nach Weisung des Gruppenführers."
        ],
        richtigeAntwort: 0
    },
			            {
        frage: "„Schlauchreserven“ müssen berücksichtigt werden,",
        antworten: [
            "damit die Schläuche sauber in Buchten liegen können.",
            "damit der vorgehende Trupp die notwendige Beweglichkeit und Reichweite erhält.",
            "um einem möglichen Mangel an Rollschläuchen vorzubeugen.",
            "um für beschädigte Feuerlöschschläuche Ersatz vorzuhalten."
        ],
        richtigeAntwort: 1
    },
			            {
        frage: "Eine unter elektrischer Spannung stehende Leitung ist vollständig von der Kabeltrommel abzurollen",
        antworten: [
            "wegen der Gefahr einer unzulässig hohen Erwärmung.",
            "wegen einer Gefährdung des Flugfunkverkehrs.",
            "zwecks Sichtkontrolle auf Beschädigungen.",
            "zwecks Kontrolle der Länge der Leitung."
        ],
        richtigeAntwort: 0
    },
			            {
        frage: "Die Aufgaben des Sicherungstrupps werden bei der technischen Hilfeleistung im Allgemeinen vom",
        antworten: [
            "Angriffstrupp wahrgenommen.",
            "Wassertrupp wahrgenommen.",
            "Schlauchtrupp wahrgenommen.",
            "Melder und Maschinist wahrgenommen."
        ],
        richtigeAntwort: 1
    },
			            {
        frage: "An Einsatzstellen hat der Rettungstrupp beim Einsatz von hydr. Rettungsgeräten folgendes zu beachten:",
        antworten: [
            "Vorgehen nach eigenem Ermessen",
            "Vorgehen nach Weisung des zuständigen Gruppenführers",
            "Vorgehen nur nach Wunsch der Unfallopfer",
            "orgehen nach Weisung des Rettungsdienstpersonals."
        ],
        richtigeAntwort: 1
    },
			            {
        frage: "Als „Trümmerschatten“ wird bezeichnet",
        antworten: [
            "ein durch Einsturz bedrohter Bereich, nur innerhalb von Gebäuden.",
            "ein durch Trümmer schwer einsehbarer Bereich (abgeschatteter) Bereich.",
            "ein durch Einsturz bedrohter Bereich.",
            "ein Bereich, in dem man vor herabfallenden Trümmern sicher abgeschattet ist."
        ],
        richtigeAntwort: 2
    },
			            {
        frage: "Atomare Strahlung",
        antworten: [
            "ist messtechnisch erfassbar.",
            "ist messtechnisch nicht erfassbar.",
            "ist nur im ortsfesten Bereich messtechnisch erfassbar.",
            "ist im ortsfesten und Transportbereichen nicht messtechnisch erfassbar."
        ],
        richtigeAntwort: 0
    },
    {
        frage: "Zur Brandklasse A gehören",
        antworten: [
            "feste brennbare Stoffe.",
            "flüssige brennbare Stoffe.",
            "gasförmige brennbare Stoffe.",
            "anorganische nicht brennbare Stoffe."
        ],
        richtigeAntwort: 0
    },
    {
        frage: "Die Hauptlöschwirkung des Wassers besteht im",
        antworten: [
            "Kühlen.",
            "Ersticken.",
            "Verdünnen.",
            "Abmagern."
        ],
        richtigeAntwort: 0
    },
    {
        frage: "Speziell für technische Hilfeleistungen größeren Umfangs sind",
        antworten: [
            "Löschgruppenfahrzeuge geeignet.",
            "Tanklöschfahrzeuge geeignet.",
            "Rüstwagen geeignet.",
            "alle Feuerwehrfahrzeuge geeignet, die einen speziellen Rüstsatz mitführen."
        ],
        richtigeAntwort: 2
    },
            {
        frage: "Ein TSF hat eine ausreichende feuerwehrtechnische Beladung für",
        antworten: [
            "einen selbstständigen Trupp.",
            "eine Löschgruppe.",
            "maximal eine Löschstaffel.",
            "Einsätze im Bereich der technischen Hilfeleistung größeren Umfangs."
        ],
        richtigeAntwort: 1
    },
            {
        frage: "Die Abkürzung FPN 10-1000 bedeutet",
        antworten: [
            "Feuerpumpe, 800 l/min bei 8 MPa.",
            "Feuerlöschkreiselpumpe, Kenndaten: 1000 l/min bei 10 bar.",
            "Feuerlöschkreiselpumpe, Kenndaten: 1000 bar bei 10 l/min.",
            "fest eingebaute Pumpe (am oder im Löschfahrzeug)"
        ],
        richtigeAntwort: 1
    },
            {
        frage: "Auf einem LF 10/6 wird/werden mitgeführt",
        antworten: [
            "die vierteilige Steckleiter.",
            "die zweiteilige Schiebleiter.",
            "die vierteilige Schiebleiter und die dreiteilige Steckleiter.",
            "die zweiteilige Schiebleiter und die Multifunktionsleiter."
        ],
        richtigeAntwort: 0
    },
            {
        frage: "Zu den Tanklöschfahrzeugen zählt/zählen",
        antworten: [
            "das LF 10/6.",
            "das TLF 8/18.",
            "das TSF-W.",
            "alle Fahrzeuge mit eingebauten Löschwasserbehälter."
        ],
        richtigeAntwort: 1
    },
            {
        frage: "Der Löschwasserbehälter im TLF 24/50 enthält",
        antworten: [
            "1600 l.",
            "2400 l.",
            "4800 l",
            "5000 l"
        ],
        richtigeAntwort: 2
    },
            {
        frage: "Der Wasserringmonitor befindet sich in einem TSF generell",
        antworten: [
            "in Fahrtrichtung links.",
            "in Fahrtrichtung rechts.",
            "im Geräteraum auf der Fahrzeugrückseite.",
            "nirgendwo, da eine solche Armatur nicht zur Standardausrüstung eines TSF gehört."
        ],
        richtigeAntwort: 3
    },
            {
        frage: "Zur Gruppe der Löschgruppenfahrzeuge zählt",
        antworten: [
            "das LF 20/16.",
            "das TLF 8/18.",
            "das TSF-W.",
            "das TLF 16/25."
        ],
        richtigeAntwort: 0
    },
            {
        frage: "Eine DLAK 23-12 ist:",
        antworten: [
            "ein Hubrettungsfahrzeug mit Allradantrieb",
            "ein Hubrettungsfahrzeug mit automatischen Leiterbewegungen",
            "ein Hubrettungsfahrzeug mit Automatikgetriebe",
            "ein Hubrettungsfahrzeug mit einer Nennrettungshöhe von 12 m"
        ],
        richtigeAntwort: 1
    },
            {
        frage: "Ein StLF 10/6",
        antworten: [
            "ist ein Löschfahrzeug mit Staffelbeladung und Gruppenbesatzung",
            "muss über eine PFPN 10-1000 verfügen",
            "ist ein Löschfahrzeug mit Beladung für eine Gruppe",
            "ist kein genormtes Löschfahrzeug"
        ],
        richtigeAntwort: 2
    },
            {
        frage: "Zur persönlichen Ausrüstung (Mindestschutzausrüstung) gehört unter anderem",
        antworten: [
            "Feuerwehr-Schutzanzug und Beleuchtungsgerät.",
            "Feuerwehr-Schutzanzug und Fw-Schutzhandschuhe.",
            "Feuerwehr-Schutzhelm und Pressluftatmer.",
            "Gesichtsschutz (Visier) und Feuerwehrhaltegurt."
        ],
        richtigeAntwort: 1
    },
            {
        frage: "Hitzeschutzkleidung schützt vorgehende Einsatzkräfte bei der Brandbekämpfung vorrangig gegen",
        antworten: [
            "einen Fliehkraftzerfall.",
            "herumfliegende Splitter.",
            "Strahlungswärme.",
            "tiefkalte, verflüssigte Gase."
        ],
        richtigeAntwort: 2
    },
            {
        frage: "Abweichungen zur persönlichen Schutzausrüstung sind entsprechend",
        antworten: [
            "UVV Feuerwehren auf Befehl des Einheitsführers möglich.",
            "UVV Feuerwehren auf Befehl des Einheitsführers nicht möglich.",
            "UVV Feuerwehren auf Befehl des Landesbranddirektors möglich.",
            "VUU Pflichtfeuerwehren auf Befehl des Einheitsführers möglich.."
        ],
        richtigeAntwort: 0
    },
            {
        frage: "Ein B-Druckschlauch hat einen Innendurchmesser (Nennweite) von",
        antworten: [
            "7,5 m",
            "7,5 mm",
            "75 mm",
            "7,5 dm"
        ],
        richtigeAntwort: 2
    },
            {
        frage: "Folgende(s) Löschmittel dürfen/darf bei Schornsteinbränden nicht eingesetzt werden:",
        antworten: [
            "ABC-Löschpulver",
            "BC-Löschpulver.",
            "Wasser",
            "Sand"
        ],
        richtigeAntwort: 2
    },
    {
        frage: "Speiseöle, die Anwendung in einer Friteuse finden werden, der",
        antworten: [
            "Brandklasse A zugeordnet.",
            "Brandklasse B zugeordnet.",
            "Brandklasse C zugeordnet.",
            "Brandklasse F zugeordnet."
        ],
        richtigeAntwort: 3
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
    popupContent.appendChild(antwortButtonsContainer);

    // Popup zur Seite hinzufügen
    document.body.appendChild(popup);

    // Popup initialisieren
    aktualisierePopup();
    anzeigenZähler();
})();
