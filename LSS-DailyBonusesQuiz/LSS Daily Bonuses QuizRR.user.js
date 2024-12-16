// ==UserScript==
// @name         LSS Daily Bonuses Quiz Rettungsrambo
// @namespace    https://www.leitstellenspiel.de
// @version      1.11r
// @description  Popup quiz for the daily bonuses Rettungsrambo Version
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
      	            {
        frage: "Die Größe eines Guedeltubus wird ausgemessen ...",
        antworten: [
            "anhand der Körpergröße",
            "vom Augenwinkel bis zum Ohr",
            "von der Nasenspitze bis zum Ohrläppchen",
            "vom Mundwinkel bis zum Ohrläppchen"
        ],
        richtigeAntwort: 3
    },
		            {
        frage: "Unsichere Frakturzeichen sind ...",
        antworten: [
            "Bewegungseinschränkung, Schmerzen, Hämatom, Schwellung",
            "abnormale Beweglichkeit, Schmerzen, Hämatom",
            "Fehlstellung, Schmerzen",
            "Krepitation, Schwellung, Schmerzen"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Die Herzfrequenz des Erwachsenen beträgt in Ruhe ...",
        antworten: [
            "50-60 Schläge pro Minute",
            "60-80 Schläge pro Minute",
            "70-90 Schläge pro Minute",
            "80-100 Schläge pro Minute"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Zum Totraum der Atmung zählen",
        antworten: [
            "Nase bzw. Mundraum, Trachea und Rachen, Bronchien",
            "Trachea und Rachen, Bronchien, Alveolen",
            "Bronchien, Alveolen",
            "Alveolen, Trachea"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Der Einsatz eines Guedeltubus erfordert ...",
        antworten: [
            "tiefe Bewusstlosigkeit",
            "aktive Mitarbeit des Patienten",
            "Gleitgel zum Einführen",
            "Freigabe durch Arzt"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Der Mensch wandelt mit jedem Atemzug ...",
        antworten: [
            "80%punkte des Sauerstoffs in Kohlendioxid um",
            "12%punkte des Sauerstoffs in Kohlenmonoxid um",
            "4%punkte des Sauerstoffs in Stickstoff um",
            "4%punkte des Sauerstoffs in Kohlendioxid um"
        ],
        richtigeAntwort: 3
    },
		            {
        frage: "Atemstillstand ist ein spezifisches Risiko der O2-Gabe bei ...",
        antworten: [
            "COPD",
            "Zustand nach Apoplex",
            "Diabetes",
            "Myokardinfarkt"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Ein Arm mit Verschluss einer Arterie wird ...",
        antworten: [
            "hoch gelagert",
            "waagerecht gelagert",
            "hängend gelagert",
            "beliebig gelagert"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Wirkstoff 1. Wahl bei Angina Pectoris ist ...",
        antworten: [
            "Furosemid",
            "Dobutamin",
            "Morphium",
            "Glyceroltrinitrat"
        ],
        richtigeAntwort: 3
    },
		            {
        frage: "Mit welchen Blutverlusten muss im Frakturfall maximal gerechnet werden?",
        antworten: [
            "Becken 6l, Oberschenkel 3l, Untersch. 2l, Oberarm 0,8l, Untera. 0,4l",
            "Becken 4l, Oberschenkel 1l, Untersch. 0,5l, Oberarm 0,8l, Untera. 0,4l",
            "Becken 5l, Oberschenkel 2l, Untersch. 1l, Oberarm 0,8l, Untera. 0,4l",
            "Becken 1l, Oberschenkel 1l, Untersch. 1l, Oberarm 0,8l, Untera. 0,4l"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Als Folge von Hyperventilation tritt eine ... auf.",
        antworten: [
            "Metabolische Azidose",
            "Metabolische Alkalose",
            "Respiratorische Azidose",
            "Respiratorische Alkalose"
        ],
        richtigeAntwort: 3
    },
		            {
        frage: "Eine verlängerte Rekapillarisierungszeit kann vorliegen bei ...",
        antworten: [
            "Schock, Exsikkation",
            "Exsikkation, Pneumothorax",
            "Pneumothorax, Schock",
            "Myokardinfarkt"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Zur Diagnose Bradykardie, Hypotonie passen welche Werte?",
        antworten: [
            "HF 130/Min., RR 80/60 mmHg, SpO2 80%, BZ 60 mg/dl",
            "HF 50/Min., RR 90/50 mmHg, SpO2 99%, BZ 110 mg/dl",
            "HF 160/Min., RR 220/110 mmHg, SpO2 95%, BZ 95 mg/dl",
            "HF 120/Min., RR 200/190 mmHg, SpO2 98%, BZ 60 mg/dl"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Für die Herzdruckmassage beim Erwachsenen gilt",
        antworten: [
            "Frequenz 80/Min., Drucktiefe 7-10cm",
            "Frequenz 100/Min., Drucktiefe 2-3cm",
            "Frequenz 100-120/Min., Drucktiefe 5-6cm",
            "Frequenz 60/Min., Drucktiefe 2-4cm"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Ein Myokardinfarkt gilt als nachgewiesen bei",
        antworten: [
            "ST-Streckenhebung, Troponin-Erhöhung",
            "ST-Streckenhebung, ST-Streckensenkung",
            "ST-Streckensenkung, Troponin-Erhöhung",
            "nur bei ST-Streckensenkung"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Die Umgebungsluft enthält ca.",
        antworten: [
            "88% Stickstoff, 11% Sauerstoff, 1% Edelgase und CO2",
            "30% Stickstoff, 17% Sauerstoff, 50% CO2, 3% Edelgase",
            "78% Stickstoff, 21% Sauerstoff, 1% Edelgase und CO2",
            "90% Stickstoff, 9% Sauerstoff, 1% Edelgase und CO2"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Welche Aussage zum Coma diabeticum ist richtig?",
        antworten: [
            "Ist durch Glukosegabe meist rasch beherrschbar",
            "Ist auf einen Mangel an Glukagon zurückzuführen",
            "Ist auf einen Mangel an Insulin zurückzuführen",
            "Ist nicht auf einen Mangel an Insulin zurückzuführen"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Funktion des Blutes ist ...",
        antworten: [
            "der Sauerstofftransport, die Wärmeregulation, die Immunabwehr",
            "nur der Sauerstofftransport",
            "nur die Wärmeregulation",
            "der Sauerstofftransport, die Immunabwehr"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Pro Herzschlag beim Erwachsenen werden ca. ... cm3 Blut ausgeworfen",
        antworten: [
            "50",
            "55",
            "70",
            "100"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Übelkeit, Schwindel, Erbrechen, vorübergehende Lähmungen passen zur Diagnose ...",
        antworten: [
            "SHT 1. Grades",
            "STH 2. Grades",
            "SHT 3. Grades",
            "STH 2. und 3. Grades"
        ],
        richtigeAntwort: 3
    },
	
		            {
        frage: "Der Kreislauf des Erwachsenen (70kg) enthält ...",
        antworten: [
            "5-6 Liter Blut",
            "6-7 Liter Blut",
            "7-8 Liter Blut",
            "9-10 Liter Blut"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Symptome einer peripheren Venenthrombose sind ...",
        antworten: [
            "Schwellung und Wärme, rote bis blaue Farbe distal der Thrombose",
            "Schwellung und Wärme, rote bis blaue Farbe proximal der Thrombose",
            "plötzliche starke Schmerzen, kein Puls tastbar distal der Thrombose",
            "plötzliche starke Schmerzen, kein Puls tastbar proximal der Thrombose"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Der systolische Blutdruckwert bezeichnet ...",
        antworten: [
            "den unteren Wert, also den Druck in der Entspannungsphase des Herzens",
            "den über eine Minute gemittelten Druck",
            "den höchsten Druck direkt nach Ventrikelkontraktion",
            "das Gleiche, wie der diastolische Wert"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Ein epileptischer Anfall mit Verkrampfung gefolgt von Zuckungen ist ...",
        antworten: [
            "nicht konvulsiv",
            "atonisch",
            "myoklonisch",
            "tonisch-klonisch"
        ],
        richtigeAntwort: 3
    },
		            {
        frage: "Die Atemfrequenz des Erwachsenen beträgt in Ruhe ca. ... Atemzüge pro Minute",
        antworten: [
            "10-11",
            "12-15",
            "17-19",
            "19-21"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Der Lungenkreislauf führt vom rechten Ventrikel ...",
        antworten: [
            "über die Lungenarterie zur Lunge",
            "über den rechten Vorhof zur Lunge",
            "in die Lungenvene",
            "in den linken Vorhof"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Bei einer metabolischen Azidose ist mit welchem Atemtyp zu rechnen?",
        antworten: [
            "Cheyne-Stokes-Atmung",
            "Biot-Atmung",
            "Kußmaul-Atmung",
            "Schnappatmung"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Für eine totale Verlegung der Atemwege spricht die ...",
        antworten: [
            "paradoxe Atmung",
            "inverse Atmung",
            "Cheyne-Stokes-Atmung",
            "Hyperventilation"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Tramadol, Codein, Tilidin sind ...",
        antworten: [
            "Opioid-Analgetika",
            "Nichtopioid-Analgetika",
            "Antiarrhythmika",
            "Calciumantagonisten"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Die Gefahr einer Schockniere besteht bei einem Blutdruck von ...",
        antworten: [
            "systolisch über 200mmHg",
            "diastolisch unter 90mmHg",
            "diastolisch unter 80mmHg",
            "systolisch unter 60mmHg"
        ],
        richtigeAntwort: 3
    },
	
		            {
        frage: "Die Lungenvene führt ...",
        antworten: [
            "O2-armes Blut",
            "O2-reiches Blut",
            "in den rechten Vorhof",
            "wird auch Vena palminalos genannt"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Symptome einer Hyperglykämie sind ...",
        antworten: [
            "Acetongeruch, Sehstörungen, Frieren, Juckreiz, trockene/rote Haut",
            "Acetongeruch, Biot-Atmung, Juckreiz, rote Haut",
            "Heißhunger, Sehstörungen, Frieren, Juckreiz",
            "Sprachstörungen, halbseitige Lähmungen, Acetongeruch"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Zur Beendigung von Vorhoftachykardien/AV-Reentry-Tachykardien kommt in Betracht ...",
        antworten: [
            "Dopamin",
            "Glyceroltrinitrat",
            "Metamizol",
            "Adenosin"
        ],
        richtigeAntwort: 3
    },
		            {
        frage: "Das Atemzugvolumen beträgt in Ruhe ca.",
        antworten: [
            "2 ml/kg KG",
            "4 ml/kg KG",
            "10 ml/kg KG",
            "15 ml/kg KG"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Zur Diagnose hypovolämischer Schock passen folgende Werte",
        antworten: [
            "HF 85/Min., RR 150/80 mmHg, SpO2 98%, BZ 130 mg/dl",
            "HF 140/Min., RR 75/60 mmHg, SpO2 97%, BZ 95 mg/dl",
            "HF 145/Min., RR 200/130 mmHg, SpO2 85%, BZ 130 mg/dl",
            "Ist nicht messbar und kann nur im OP ermittelt werden"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Die normale partielle Sauerstoffsättigung SpO2 beträgt ...",
        antworten: [
            "95-99%",
            "80-90%",
            "80-110%",
            "60-70%"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Kohlenmonoxid bindet sich ca. ... mal stärker an Hämoglobin als Sauerstoff",
        antworten: [
            "2",
            "100",
            "300",
            "1000"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "O2-armes Blut gelangt auf diesem Weg zum und durchs Herz",
        antworten: [
            "Venolen→ Hohlvene→ li.Vorhof→ re.Ventrikel",
            "Kapillaren→ Venen→ Venolen→ Hohlvene→ li.Ventrikel→ re.Vorhof",
            "Kapillaren→ Venolen→ Venen→ Hohlvene→ re.Vorhof→ re.Ventrikel",
            "Kapillaren→ re.Vorhof→ Venolen→ Venen→ Hohlvene re.Ventrikel"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Der Körperkreislauf O2-reichen Blutes ist ...",
        antworten: [
            "li.Vorhof→ li.Ventrikel→ Aorta→ Arterien→ Arteriolen→ Kapillaren",
            "re.Vorhof→ re.Ventrikel→ Lungenvene→ Aorta→ Arteriolen→ Kapillaren",
            "li.Ventrikel→ li.Vorhof→ Aorta→ Arteriolen→ Kapillaren",
            "li.Ventrikel→ Arteriolen→ li.Vorhof→ Aorta→  Kapillaren"
        ],
        richtigeAntwort: 0
    },
	
		            {
        frage: "Regurgitation ist ein spezifisches Risiko ...",
        antworten: [
            "beim Status asthmaticus",
            "bei Verbrennungen II. und III. Grades",
            "bei Bewusstlosigkeit",
            "bei Langeweile"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Die Reihenfolge bei der Reanimation eines Kleinkinds mit zwei Helfern ist ...",
        antworten: [
            "30x HDM, 2x Beatmung etc.",
            "5x Beatmung, 15x HDM, 2x Beatmung, 15x HDM, 2x Beatmung etc.",
            "1x Beatmung, 30x HDM etc.",
            "60x HDM, 2x Beatmung etc."
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Welche Aussagen zu Bewusstseinszuständen sind richtig?",
        antworten: [
            "somnolent = nur d. Schmerzreiz erweckbar, soporös = d. Ansprache erweckbar, komatös = nicht erwb.",
            "soporös = nur d. Schmerzreiz erweckbar, somnolent = d. Ansprache erweckbar, komatös = nicht erwb.",
            "komatös = nur d. Schmerzr. erwb., somnolent = d. Ansprache erwb., soporös = nur d. Schmerzr. erwb.",
            "komatös = nur d. Schmerzr. erwb., somnolent = nur d. Schmerzreiz erweckbar, soporös = d. Ansprache erwb."
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "In der ausgeatmeten Luft ist der O2-Gehalt ca. ... %punkte niedriger als in der Umgebungsluft",
        antworten: [
            "80",
            "4",
            "15",
            "1"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Paradoxe Atmung ist Leitsymptom bei ...",
        antworten: [
            "Rippenserienfraktur",
            "COPD",
            "Asthma",
            "SHT 1. Grades"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Der O2-Gehalt in der Umgebungsluft beträgt ca.",
        antworten: [
            "17%",
            "21%",
            "26%",
            "1%"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Ein Brandverletzter II. Grades ist in der Frühphase am meisten gefährdet durch ...",
        antworten: [
            "Volumenmangel",
            "Infektion",
            "Schmerzreaktionen",
            "Gar nichts. Erst ab III. Grades besteht eine Gefährdung"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Verapamil ist indiziert bei ...",
        antworten: [
            "Hypotonie",
            "Bradykardie",
            "bestimmten Arrhythmien",
            "Krämpfen"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Welche Reihenfolge der Maßnahmen bei arterieller Blutung am Unterarm ist richtig?",
        antworten: [
            "Abbinden, Hochhalten, Druckverband",
            "Hochhalten, Abbinden, Druckverband",
            "Hochhalten, Abdrücken, Druckverband",
            "Druckverband, Hochhalten, Abbinden"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Der AV-Knoten erzeugt ca. ... Impulse pro Minute",
        antworten: [
            "40-60",
            "10-50",
            "70-100",
            "20-50"
        ],
        richtigeAntwort: 0
    },
	
		            {
        frage: "Die Verbrennung eines Beines beim Erwachsenen entspricht ...",
        antworten: [
            "9% der Körperoberfläche",
            "18% der Körperoberfläche",
            "20% der Körperoberfläche",
            "60% der Körperoberfläche"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Die elementaren Vitalzeichen sind",
        antworten: [
            "Bewusstsein, Atmung, Kreislauf",
            "Bewusstsein, Atmung",
            "Blut, Sauerstoff, Puls",
            "Blut, Sauerstoff, Puls, Bewusstsein, Atmung, Kreislauf"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Bei welcher Diagnose ist die Hochlagerung der Beine kontraindiziert?",
        antworten: [
            "Hypovolämischer Schock",
            "Anaphylaktischer Schock",
            "Hypoglykämischer Schock",
            "Kardiogener Schock"
        ],
        richtigeAntwort: 3
    },
		            {
        frage: "Welche der folgenden Stoffe sind Katecholamine?",
        antworten: [
            "Adrenalin, Noradrenalin, Dopamin",
            "Dopamin, Thyroxin",
            "Thyroxin, Morphium",
            "Morphium, Adrenalin"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Beim AV-Block I. Grades ist ...",
        antworten: [
            "die QT-Zeit verlängert",
            "die PQ-Zeit verlängert",
            "die ST-Strecke gesenkt",
            "sofort eine OP notwendig"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Das Herzminutenvolumen beim Erwachsenen beträgt in Ruhe ...",
        antworten: [
            "ca. 3 Liter",
            "ca. 5 Liter",
            "ca. 6,5 Liter",
            "ca. 9 Liter"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Butylscopolamin ist indiziert bei ...",
        antworten: [
            "Atemnot",
            "Koliken und Spasmen",
            "Hypotonie",
            "Tachykardie"
        ],
        richtigeAntwort: 1
    },
		            {
        frage: "Leitsymptom eines SHT I. Grades ist ...",
        antworten: [
            "Blutung aus dem Ohr",
            "Austritt von Hirnmasse",
            "Retograde Amnesie",
            "Bewusstlosigkeit > 30 Minuten"
        ],
        richtigeAntwort: 2
    },
		            {
        frage: "Maßnahmen 1. Wahl beim Hyperventilationssyndrom sind ...",
        antworten: [
            "beruhigender Zuspruch, Tütenrückatmung, Atemanweisungen",
            "Injektion von Diazepam und Calcium",
            "Beatmung mit 100% Sauerstoff",
            "setzen eines Schmerzimpuls"
        ],
        richtigeAntwort: 0
    },
		            {
        frage: "Der normale Blutdruck beim Erwachsenen in Ruhe beträgt ...",
        antworten: [
            "120-140/70-90 mmHg",
            "100-165/70-95 mmHg",
            "110-115/60-70 mmHg",
            "120-140/100-90 mmHg"
        ],
        richtigeAntwort: 0
    },
			            {
        frage: "Beim akuten Asthmaanfall ist indiziert ...",
        antworten: [
            "Verapamil",
            "Fenoterol",
            "Haloperidol",
            "4-Dimethylaminophenol"
        ],
        richtigeAntwort: 1
    },
				            {
        frage: "Bei Niederspannungsunfällen ...",
        antworten: [
            "ist die Gefahr thermischer Schädigung geringer als bei Hochspannungsunfällen",
            "besteht nicht die Gefahr von Herzrhythmusstörungen",
            "treten keine Nervenschädigungen auf",
            "besteht keinerlei Gefahr"
        ],
        richtigeAntwort: 0
    },	
				            {
        frage: "Zu einem Asthmaanfall passt das Symptom ...",
        antworten: [
            "eines inspiratorischen Stridors",
            "eines exspiratorischen Stridors",
            "der Cheyne-Stokes-Atmung",
            "der Biot-Atmung"
        ],
        richtigeAntwort: 1
    },	
				            {
        frage: "Der normale nüchtern-BZ beim Erwachsenen beträgt ...",
        antworten: [
            "90-110 mg/dl",
            "50-200 mg/dl",
            "100-130 mg/dl",
            "60-80 mg/dl"
        ],
        richtigeAntwort: 0
    },	
				            {
        frage: "Durchblutung, Motorik und Sensorik zu untersuchen ist wichtig ...",
        antworten: [
            "beim Myokardinfarkt",
            "bei einer Fraktur",
            "bei Hyperglykämie",
            "bei Apoplex"
        ],
        richtigeAntwort: 1
    },
				            {
        frage: "Die Erregungsrückbildung stellt sich dar ...",
        antworten: [
            "durch den QRS-Komplex",
            "durch die P-Welle",
            "durch die T-Welle",
            "durch die R-Progression"
        ],
        richtigeAntwort: 2
    },
				            {
        frage: "Die Gefahr eines diabetischen Komas besteht bei einem BZ von ...",
        antworten: [
            "< 20 mg/dl",
            "< 50 mg/dl",
            "< 90 mg/dl",
            "> 300 mg/dl"
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
    antwortButtonsContainer.style.color = "black";
    popupContent.appendChild(antwortButtonsContainer);

    // Popup zur Seite hinzufügen
    document.body.appendChild(popup);

    // Popup initialisieren
    aktualisierePopup();
    anzeigenZähler();
})();
