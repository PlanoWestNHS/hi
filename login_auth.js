// login_auth.js
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const SPREADSHEET_ID = '1vQ36Tjil5IaU9uui9NwX6hOr1Tz9Fc2wMkeKlZc5zWg';

const RANGES = [
  'Seniors!A2:M',
  'Inducted Juniors!A2:M',
  'Applying Juniors!A2:M'
]; //  read all needed columns from all three sheets

function getCredentials() {
  return JSON.parse(process.env.GOOGLE_CREDENTIALS);
}

async function getSheetData() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: SPREADSHEET_ID,
    ranges: RANGES,
  }); 

  const users = [];

  for (const valueRange of res.data.valueRanges || []) {
    const rows = valueRange.values || [];

    for (const row of rows) {
      if (!row[0]) continue;

      users.push([
        row[0], row[2], row[1],  row[6] || 0, row[7] || 0, row[8] || 0,
        0,            // placeholder for old Final Penalty Hours column
        row[9] || '', row[10] || '', row[11] || '', row[12] || ''
      ]);
    }
  }

  return users;
}

module.exports = getSheetData;
