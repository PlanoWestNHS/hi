// login_auth.js
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const SPREADSHEET_ID = '1vQ36Tjil5IaU9uui9NwX6hOr1Tz9Fc2wMkeKlZc5zWg'; // Replace with your sheet ID
const RANGE = [ 'Seniors!A2:C', 'Seniors!G2:L', 'Inducted Juniors!A2:C', 'Inducted Juniors!G2:L', 'Applying Juniors!A2:C', 'Applying Juniors!G2:L' ] ; // Adjust as needed

function getCredentials() {
  return JSON.parse(process.env.GOOGLE_CREDENTIALS);
}

async function getSheetData() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  return res.data.values || [];
}

module.exports = getSheetData;
