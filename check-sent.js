const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');


async function checkSent() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  try {
    const res = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['SENT'],
      maxResults: 1
    });
    
    if (res.data.messages && res.data.messages.length > 0) {
      const msgId = res.data.messages[0].id;
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: msgId,
        format: 'metadata',
        metadataHeaders: ['To', 'Subject', 'Date']
      });
      console.log('Last sent email metadata:', JSON.stringify(msg.data.payload.headers, null, 2));
    } else {
      console.log('No sent emails found.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkSent();
