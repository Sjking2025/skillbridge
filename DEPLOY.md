# SkillBridge — Complete Deployment Guide
# From Zero → Live on Vercel in ~30 minutes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When someone fills the form:
  ✅ Their details are saved to your Google Sheet
  ✅ They receive a branded welcome email from sanjayias91@gmail.com
  ✅ Email includes a .ics calendar invite for CS02 Daily Coding Practice (8PM IST)
  ✅ They are added as an attendee to your Google Calendar event

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 1: CREATE GOOGLE CLOUD PROJECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to: https://console.cloud.google.com
2. Click "New Project" → Name it "SkillBridge"
3. Select the project

4. Go to "APIs & Services" → "Enable APIs and Services"
5. Enable these 3 APIs:
   - Gmail API
   - Google Sheets API
   - Google Calendar API

6. Go to "APIs & Services" → "OAuth consent screen"
   - User Type: External
   - App name: SkillBridge
   - User support email: sanjayias91@gmail.com
   - Developer contact: sanjayias91@gmail.com
   - Click Save and Continue (skip Scopes for now)
   - Add your email as Test User
   - Save

7. Go to "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: Web application
   - Name: SkillBridge Web
   - Authorized redirect URIs: https://developers.google.com/oauthplayground
   - Click Create
   - COPY the Client ID and Client Secret

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 2: GET YOUR REFRESH TOKEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to: https://developers.google.com/oauthplayground

2. Click the Settings gear icon (top right)
   - Check "Use your own OAuth credentials"
   - Enter your Client ID and Client Secret
   - Close

3. In Step 1 (Select & authorize APIs), paste these scopes one by one:
   https://mail.google.com/
   https://www.googleapis.com/auth/spreadsheets
   https://www.googleapis.com/auth/calendar

4. Click "Authorize APIs"
   - Sign in with sanjayias91@gmail.com
   - Allow all permissions

5. Click "Exchange authorization code for tokens"

6. COPY the "Refresh token" — this is your GOOGLE_REFRESH_TOKEN

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 3: CREATE YOUR GOOGLE SHEET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to: https://docs.google.com/spreadsheets
2. Create a new spreadsheet — name it "SkillBridge Members"
3. In Row 1, add these headers exactly:
   A1: Joined At
   B1: Full Name
   C1: Email
   D1: College
   E1: Year
   F1: Skill Level
   G1: Skill Path
   H1: Status

4. Copy the Sheet ID from the URL:
   https://docs.google.com/spreadsheets/d/[THIS_IS_YOUR_SHEET_ID]/edit
   
   Paste it as GOOGLE_SHEET_ID in your .env.local

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 4: SET UP LOCAL ENVIRONMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Copy .env.example to .env.local:
   cp .env.example .env.local

2. Fill in .env.local with your real values:
   GOOGLE_CLIENT_ID=      ← from Step 1
   GOOGLE_CLIENT_SECRET=  ← from Step 1
   GOOGLE_REFRESH_TOKEN=  ← from Step 2
   SENDER_EMAIL=sanjayias91@gmail.com
   SENDER_NAME=Sanjay R — SkillBridge
   GOOGLE_SHEET_ID=       ← from Step 3
   GOOGLE_CALENDAR_EVENT_ID=292d0s1tbbnjmjkq95jueomvgk
   GOOGLE_CALENDAR_ID=sanjayias91@gmail.com

3. Install dependencies:
   npm install

4. Run locally:
   npm run dev
   → Open http://localhost:3000
   → Test the form with your own email
   → Check your Gmail, Google Sheet, and Calendar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 5: DEPLOY TO VERCEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OPTION A — Vercel CLI (recommended):
  1. npm install -g vercel
  2. vercel login
  3. vercel --prod
  → Follow prompts
  → Add environment variables when asked (paste each from .env.local)

OPTION B — GitHub + Vercel Dashboard:
  1. Create a GitHub repo and push this folder
  2. Go to https://vercel.com → "New Project"
  3. Import your GitHub repo
  4. Go to Settings → Environment Variables
  5. Add ALL variables from .env.local one by one
  6. Redeploy

OPTION C — Direct ZIP:
  1. Go to https://vercel.com/new
  2. Drag and drop this project folder
  3. Add environment variables in the dashboard
  4. Deploy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 6: AFTER DEPLOYMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Test the live form with a real email address
2. Verify:
   ✅ Row appears in Google Sheet
   ✅ Welcome email arrives with calendar attachment
   ✅ Your Google Calendar shows the new attendee
3. Share your Vercel URL with students!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"Invalid Credentials" error:
  → Refresh token may have expired. Repeat Step 2.

"Quota exceeded" / Sheets error:
  → Make sure Google Sheets API is enabled in Cloud Console.

Email not sending:
  → Verify Gmail API is enabled. Check that redirect URI 
    in credentials matches exactly: https://developers.google.com/oauthplayground

"NEXT_PUBLIC_" warning:
  → Never add NEXT_PUBLIC_ to secrets. These env vars are server-only. That's correct.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## YOUR FIXED VALUES (pre-filled)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Gmail:            sanjayias91@gmail.com
Your Calendar ID:      sanjayias91@gmail.com
Your Calendar Event:   292d0s1tbbnjmjkq95jueomvgk
                       (CS02 - Daily Coding Practice - MrSJ)
Google Meet Link:      https://meet.google.com/goj-aihh-otd
Session Time:          Every day at 8:00 PM IST
