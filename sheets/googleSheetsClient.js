// sheets/googleSheetsClient.js
require('dotenv').config();
const { google } = require('googleapis');

const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || './credentials.json';
const spreadsheetId = process.env.SPREADSHEET_ID;

let sheetsClient = null;
async function getSheetsClient() {
  if (!sheetsClient) {
    const auth = new google.auth.GoogleAuth({
      keyFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    sheetsClient = google.sheets({ version: 'v4', auth: await auth.getClient() });
  }
  return sheetsClient;
}

// Append a row
async function appendRow(tabName, valuesArray) {
  const client = await getSheetsClient();
  return client.spreadsheets.values.append({
    spreadsheetId,
    range: `${tabName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [valuesArray] },
  });
}

// **New**: Read rows (for Points sheet)
async function readRows(tabName) {
  const client = await getSheetsClient();
  const res = await client.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!A2:Z`,
  });
  return res.data.values || [];
}

// **New**: Update a single cell
async function updateCell(tabName, rowIndex, colIndex, value) {
  const client = await getSheetsClient();
  const colLetter = String.fromCharCode(64 + colIndex); // 1→A, 2→B, etc.
  const range = `${tabName}!${colLetter}${rowIndex + 1}`;
  await client.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[value]] },
  });
}

module.exports = { appendRow, readRows, updateCell };
