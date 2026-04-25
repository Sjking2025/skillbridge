// pages/api/join.js — SkillBridge v2
// 1. Appends to Google Sheet (9 columns)
// 2. Sends world-class rich HTML welcome email
// 3. Attaches .ics calendar invite (with 2 reminders)
// 4. Patches Google Calendar event with new attendee

import { getOAuth2Client, getGmail, getSheets, getCalendar } from '../../lib/googleClient'
import { buildEmail } from '../../lib/emailTemplate'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { firstName, lastName, email, college, year, level, path: skillPath, whatsapp } = req.body
  if (!firstName || !email || !college || !year || !level)
    return res.status(400).json({ error: 'Missing required fields' })

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email address' })

  try {
    const auth = getOAuth2Client()
    const joinedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    const fullName = `${firstName} ${lastName || ''}`.trim()
    const meetLink = process.env.GOOGLE_MEET_LINK || 'https://meet.google.com/goj-aihh-otd'
    const appointmentLink = process.env.CALENDAR_APPOINTMENT_LINK || 'https://calendar.app.google/TXNTgGhbVGhMAxPs8'

    const pathMeta = {
      'Web Development':      { emoji: '🌐', color: '#0EA5A4', bg: '#E0F5F5' },
      'Java Backend':         { emoji: '☕', color: '#E67E22', bg: '#FFF3E0' },
      'AI / Machine Learning':{ emoji: '🤖', color: '#8E44AD', bg: '#F3E8FF' },
      'Not sure yet':         { emoji: '🧭', color: '#6B7280', bg: '#F3F4F6' },
    }
    const path = pathMeta[skillPath] || pathMeta['Not sure yet']
    const initials = `${firstName.charAt(0)}${(lastName || firstName).charAt(lastName ? 0 : 1)}`.toUpperCase()

    // ── 1. GOOGLE SHEET ──────────────────────────────────────────────────
    const sheets = getSheets(auth)
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:I',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          joinedAt, fullName, email, college, year, level,
          skillPath || 'Not selected', whatsapp || '', 'Active'
        ]],
      },
    })

    // ── 2. RICH EMAIL ────────────────────────────────────────────────────
    const gmail = getGmail(auth)
    const emailHtml = buildEmail({
      firstName,
      fullName,
      college,
      year,
      level,
      skillPath,
      meetLink
    })

    const icsContent = buildICS({ fullName, email, meetLink, appointmentLink, senderEmail: process.env.SENDER_EMAIL })

    const boundary = `sb_${Date.now()}_boundary`
    const mimeBody = [
      `From: ${process.env.SENDER_NAME || 'Sanjay R — SkillBridge'} <${process.env.SENDER_EMAIL}>`,
      `To: ${fullName} <${email}>`,
      `Reply-To: ${process.env.SENDER_EMAIL}`,
      `Subject: Welcome to SkillBridge, ${firstName}! 🎉 Your CS02 invite is inside`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(emailHtml).toString('base64'),
      '',
      `--${boundary}`,
      'Content-Type: text/calendar; charset=UTF-8; method=REQUEST; name="CS02-DailyCodingPractice.ics"',
      'Content-Transfer-Encoding: base64',
      'Content-Disposition: attachment; filename="CS02-DailyCodingPractice.ics"',
      '',
      Buffer.from(icsContent).toString('base64'),
      '',
      `--${boundary}--`,
    ].join('\r\n')

    const raw = Buffer.from(mimeBody).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw } })

    // ── 3. PATCH CALENDAR ────────────────────────────────────────────────
    const calendar = getCalendar(auth)
    const existing = await calendar.events.get({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId: process.env.GOOGLE_CALENDAR_EVENT_ID,
    })
    const attendees = existing.data.attendees || []
    if (!attendees.some(a => a.email === email)) {
      await calendar.events.patch({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        eventId: process.env.GOOGLE_CALENDAR_EVENT_ID,
        sendUpdates: 'all',
        requestBody: { attendees: [...attendees, { email, displayName: fullName }] },
      })
    }

    return res.status(200).json({ success: true, message: `Welcome ${firstName}! Check ${email} for your invite.` })

  } catch (err) {
    console.error('SkillBridge join error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.', detail: process.env.NODE_ENV === 'development' ? err.message : undefined })
  }
}

// (Email builder has been moved to lib/emailTemplate.js)

// ── ICS builder ──────────────────────────────────────────────────────────────
function buildICS({ fullName, email, meetLink, appointmentLink, senderEmail }) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SkillBridge//CS02//EN',
    'METHOD:REQUEST',
    'CALSCALE:GREGORIAN',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Kolkata',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0530',
    'TZOFFSETTO:+0530',
    'TZNAME:IST',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:cs02-sb-${Date.now()}@skillbridge`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:.]/g,'').slice(0,15)}Z`,
    'DTSTART;TZID=Asia/Kolkata:20260428T200000',
    'DTEND;TZID=Asia/Kolkata:20260428T210000',
    'RRULE:FREQ=DAILY;INTERVAL=1',
    'SUMMARY:CS02 — Daily Coding Practice (SkillBridge)',
    `DESCRIPTION:Daily coding practice at 8 PM IST hosted by Sanjay R (MrSJ).\\n\\nJoin: ${meetLink}\\nAdd to calendar: ${appointmentLink}\\n\\n"Start before you feel ready." — SkillBridge`,
    `LOCATION:${meetLink}`,
    `URL:${meetLink}`,
    `ORGANIZER;CN=Sanjay R - SkillBridge:mailto:${senderEmail || 'sanjayias91@gmail.com'}`,
    `ATTENDEE;CN=${fullName};RSVP=TRUE;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:mailto:${email}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:CS02 Daily Coding Practice starts in 30 minutes!',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT5M',
    'ACTION:DISPLAY',
    'DESCRIPTION:CS02 starts in 5 minutes — join Google Meet now!',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}