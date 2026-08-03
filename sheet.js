const SHEET_ID = DASHBOARD_CONFIG.spreadsheetId;
const SHEET_NAME = DASHBOARD_CONFIG.sheetName;

const CSV_URL =
`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

async function loadSheetData() {

    const response = await fetch(CSV_URL);

    const csv = await response.text();

    const rows = csv
        .trim()
        .split("\n")
        .map(r => r.split(","));

    console.log(rows);

    return rows;

}
