import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export function getOAuth2Client(): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return oauth2Client;
}

export function getGmail(auth: OAuth2Client) {
  return google.gmail({ version: 'v1', auth });
}

export function getSheets(auth: OAuth2Client) {
  return google.sheets({ version: 'v4', auth });
}

export function getCalendar(auth: OAuth2Client) {
  return google.calendar({ version: 'v3', auth });
}
