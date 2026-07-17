(async () => {
    const grenzwert = 15000;

    try {
        const response = await fetch(
            "https://www.leitstellenspiel.de/einsaetze.json"
        );

        if (!response.ok) {
            throw new Error(`HTTP-Fehler: ${response.status}`);
        }

        const einsaetze = await response.json();

        const passendeEinsaetze = einsaetze.filter(einsatz => {
            const credits = Number(einsatz.average_credits);
            return Number.isFinite(credits) && credits > grenzwert;
        });

        const anzahlGesamt = einsaetze.length;
        const anzahlPassend = passendeEinsaetze.length;

        const prozent = anzahlGesamt > 0
            ? (anzahlPassend / anzahlGesamt) * 100
            : 0;

        console.log(
            `${anzahlPassend} von ${anzahlGesamt} Einsätzen haben ` +
            `durchschnittlich mehr als ${grenzwert.toLocaleString("de-DE")} Credits. ` +
            `Das entspricht ${prozent.toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })} %.`
        );

        console.table(
            passendeEinsaetze.map(einsatz => ({
                ID: einsatz.id,
                Einsatz: einsatz.name,
                Durchschnittliche_Credits: Number(einsatz.average_credits)
            }))
        );
    } catch (error) {
        console.error(
            "Die Einsatzliste konnte nicht abgerufen werden:",
            error
        );
    }
})();
