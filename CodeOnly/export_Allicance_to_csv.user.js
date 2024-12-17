// Funktion zum Herunterladen der CSV-Datei
function downloadCsv(data, filename) {
    const csvData = new Blob([data], { type: 'text/csv' });
    const csvUrl = URL.createObjectURL(csvData);
    const hiddenElement = document.createElement('a');
    hiddenElement.href = csvUrl;
    hiddenElement.target = '_blank';
    hiddenElement.download = filename;
    hiddenElement.click();
}

// Funktion zum Konvertieren eines 2D-Arrays in eine CSV-Zeichenkette
function arrayToCsv(data) {
    return data.map(row =>
        `"${row.join('","')}"`
    ).join('\r\n');
}

// Fetch-Daten und Erstellen des Arrays mit den Daten
let originalArray = [];
fetch("/api/allianceinfo")
    .then(res => res.json())
    .then(res => {
        originalArray = res.users.map(user => [
            user.name,
            user.role_flags.owner,
            user.role_flags.admin,
            user.role_flags.coadmin,
            user.role_flags.schooling,
            user.role_flags.finance,
            user.role_flags.staff,
            user.role_flags.transport_requests,
            user.role_flags.view_logs,
            user.id
        ]);

        // Spaltenüberschriften hinzufügen
        originalArray.unshift([
            "Name",
            "Owner",
            "Admin",
            "Coadmin",
            "Schooling",
            "Finance",
            "Staff",
            "Transport Requests",
            "View Logs",
            "ID"
        ]);

        // CSV-Datei erstellen
        const csvContent = arrayToCsv(originalArray);

        // CSV-Datei herunterladen
        downloadCsv(csvContent, 'user_roles.csv');
    });
