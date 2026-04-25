// lib/googleClient.js
// Shared authenticated Google API client for Sheets, Gmail, Calendar

import { google } from 'googleapis'

export function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  )
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  })
  return oauth2Client
}

export function getGmail(auth) {
  return google.gmail({ version: 'v1', auth })
}

export function getSheets(auth) {
  return google.sheets({ version: 'v4', auth })
}

export function getCalendar(auth) {
  return google.calendar({ version: 'v3', auth })
}
