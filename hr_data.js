// hr_data.js
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = '1vQ36Tjil5IaU9uui9NwX6hOr1Tz9Fc2wMkeKlZc5zWg';
const SHEET_NAME = 'Hour Log'; 

// CHANGED: students are now split across three sheets
const PEOPLE_SHEETS = ['Seniors', 'Inducted Juniors', 'Applying Juniors'];

function getCredentials() {
  return JSON.parse(process.env.GOOGLE_CREDENTIALS);
}

let sheets;

async function initSheets() {
  if (!sheets) {
    const credentials = getCredentials();
    const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
    const client = await auth.getClient();
    sheets = google.sheets({ version: 'v4', auth: client });
  }
}

async function getUserHours(userId) {
  await initSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:E`,
  });
  const rows = res.data.values || [];

  const entries = rows
    .filter(row => row[0] === userId)
    .map(row => ({
      id: row[0],
      date: row[1],
      hours: parseFloat(row[2]),
      description: row[3],
      fullName: row[4],
    }));

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  return { entries, totalHours };
}

// CHANGED: finds the user's sheet and row automatically
async function findUserInPeopleSheets(userId) {
  await initSheets();

  for (const sheetName of PEOPLE_SHEETS) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2:H`,
    });

    const rows = res.data.values || [];

    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === String(userId).trim()) {
        return {
          sheetName,
          sheetRowNumber: i + 2,
        };
      }
    }
  }

  throw new Error(`User ${userId} was not found`);
}

// CHANGED: finds the correct sheet/row and updates Physical Hours in column H
async function updatePeopleSheet(userId, totalHours) {
  await initSheets();

  const userLocation = await findUserInPeopleSheets(userId);
  const range = `${userLocation.sheetName}!H${userLocation.sheetRowNumber}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [[totalHours]] },
  });
}


async function addUserHour(userId, date, hours, description, firstName, lastName) {
  await initSheets();
  const fullName = `${firstName} ${lastName}`;
  const row = [userId, date, hours, description, fullName];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:E`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [row] },
  });

  const { totalHours } = await getUserHours(userId);

  // CHANGED: userId is used to locate the correct student row
  await updatePeopleSheet(userId, totalHours);
}


async function deleteUserHour(userId, indexToDelete) {
  await initSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:E`,
  });
  const rows = res.data.values || [];

  const userRowsWithSheetIndex = [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === userId) {
      userRowsWithSheetIndex.push({ row: rows[i], sheetRowNumber: i + 2 });
    }
  }

  if (indexToDelete < 0 || indexToDelete >= userRowsWithSheetIndex.length) {
    throw new Error(`Index out of bounds. Index: ${indexToDelete}, Entries found: ${userRowsWithSheetIndex.length}`);
  }

  const sheetRowToDelete = userRowsWithSheetIndex[indexToDelete].sheetRowNumber;
  const rangeToClear = `${SHEET_NAME}!A${sheetRowToDelete}:E${sheetRowToDelete}`;

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: rangeToClear,
  });

  const { totalHours } = await getUserHours(userId);

  // CHANGED: userId is used to locate the correct student row
  await updatePeopleSheet(userId, totalHours);
}

module.exports = { getUserHours, addUserHour, deleteUserHour };
