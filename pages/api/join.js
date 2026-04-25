// pages/api/join.js
// Handles SkillBridge community join form:
//   1. Appends row to Google Sheet
//   2. Sends acknowledgement email from sanjayias91@gmail.com
//   3. Adds user as attendee to the CS02 Daily Coding Practice calendar event

import { getOAuth2Client, getGmail, getSheets, getCalendar } from '../../lib/googleClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { firstName, lastName, email, college, year, level, path: skillPath } = req.body

  if (!firstName || !email || !college || !year || !level) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' })
  }

  try {
    const auth = getOAuth2Client()
    const joinedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    const fullName = `${firstName} ${lastName || ''}`.trim()
    const meetLink = process.env.GOOGLE_MEET_LINK || 'https://meet.google.com/goj-aihh-otd'
    const appointmentLink = process.env.CALENDAR_APPOINTMENT_LINK || 'https://calendar.app.google/TXNTgGhbVGhMAxPs8'

    // ── 1. APPEND TO GOOGLE SHEET ──────────────────────────────────────────
    const sheets = getSheets(auth)
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:H',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          joinedAt,
          fullName,
          email,
          college,
          year,
          level,
          skillPath || 'Not selected',
          'Pending'
        ]],
      },
    })

    // ── 2. SEND ACKNOWLEDGEMENT EMAIL ──────────────────────────────────────
    const gmail = getGmail(auth)

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Welcome to SkillBridge</title>
</head>
<body style="margin:0;padding:0;background:#F7F8F9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8F9;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#0A1F2F 0%,#0A3D3C 100%);padding:40px 48px 36px;text-align:center;">
          <div style="display:inline-block;background:#0EA5A4;border-radius:12px;padding:10px 18px;margin-bottom:20px;">
            <span style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">S</span>
          </div>
          <h1 style="color:#fff;font-size:28px;font-weight:800;margin:0 0 8px;line-height:1.2;">Welcome to SkillBridge, ${firstName}! 🎉</h1>
          <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0;">You just made the most important decision of your tech journey.</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:44px 48px 36px;">
          <p style="font-size:16px;color:#374151;line-height:1.7;margin:0 0 20px;">
            Hey <strong style="color:#0EA5A4;">${firstName}</strong>,
          </p>
          <p style="font-size:16px;color:#374151;line-height:1.7;margin:0 0 20px;">
            We're genuinely thrilled to have you here. You've just joined a community of <strong>2,400+ students</strong> from tier-2 and tier-3 colleges across India — all building real skills, asking real questions, and growing together.
          </p>
          <p style="font-size:16px;color:#374151;line-height:1.7;margin:0 0 32px;">
            No tutorials. No copy-paste. No fake confidence. Just <em>real learning</em> — the kind that actually holds up in an interview room.
          </p>

          <!-- Details box -->
          <div style="background:#F0FDFC;border:1px solid #B2E4E4;border-radius:14px;padding:24px 28px;margin-bottom:32px;">
            <p style="font-size:13px;font-weight:700;color:#0A7B7A;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 14px;">Your Registration Details</p>
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="font-size:14px;color:#6B7280;padding:4px 0;width:40%;">Name</td>
                <td style="font-size:14px;color:#1F2937;font-weight:600;padding:4px 0;">${fullName}</td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#6B7280;padding:4px 0;">College</td>
                <td style="font-size:14px;color:#1F2937;font-weight:600;padding:4px 0;">${college}</td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#6B7280;padding:4px 0;">Year</td>
                <td style="font-size:14px;color:#1F2937;font-weight:600;padding:4px 0;">${year}</td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#6B7280;padding:4px 0;">Skill Level</td>
                <td style="font-size:14px;color:#1F2937;font-weight:600;padding:4px 0;">${level}</td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#6B7280;padding:4px 0;">Path</td>
                <td style="font-size:14px;color:#1F2937;font-weight:600;padding:4px 0;">${skillPath || 'To be decided'}</td>
              </tr>
            </table>
          </div>

          <!-- Calendar CTA -->
          <div style="background:#FFF8F0;border:1px solid #FFD6A5;border-radius:14px;padding:24px 28px;margin-bottom:32px;">
            <p style="font-size:13px;font-weight:700;color:#CC7A29;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 10px;">📅 Daily Coding Practice — CS02</p>
            <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">
              You've been added to our <strong>Daily Coding Practice session</strong> (CS02 by MrSJ). This runs every day at <strong>8:00 PM IST</strong> on Google Meet. Show up consistently — that's 80% of the battle.
            </p>
            <a href="${meetLink}"
               style="display:inline-block;background:#FF9933;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;">
              Join on Google Meet →
            </a>
            <a href="${appointmentLink}"
               style="display:inline-block;background:#0EA5A4;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;margin-left:10px;margin-top:8px;">
              📅 Add to Your Calendar
            </a>
          </div>

          <!-- What's next -->
          <p style="font-size:15px;font-weight:700;color:#1F2937;margin:0 0 14px;">What happens next?</p>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:8px 0;vertical-align:top;width:32px;">
                <div style="width:24px;height:24px;background:#E0F5F5;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#0A7B7A;">1</div>
              </td>
              <td style="padding:8px 0 8px 10px;font-size:14px;color:#374151;">Watch for a <strong>WhatsApp/Discord invite</strong> — we'll add you to your skill group within 24 hours.</td>
            </tr>
            <tr>
              <td style="padding:8px 0;vertical-align:top;">
                <div style="width:24px;height:24px;background:#E0F5F5;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#0A7B7A;">2</div>
              </td>
              <td style="padding:8px 0 8px 10px;font-size:14px;color:#374151;">Join the <strong>Daily Coding Practice at 8 PM IST</strong> — your calendar invite is attached.</td>
            </tr>
            <tr>
              <td style="padding:8px 0;vertical-align:top;">
                <div style="width:24px;height:24px;background:#E0F5F5;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#0A7B7A;">3</div>
              </td>
              <td style="padding:8px 0 8px 10px;font-size:14px;color:#374151;">Reply to this email if you have any questions — I personally read every reply.</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Signature -->
      <tr>
        <td style="padding:0 48px 40px;">
          <div style="border-top:1px solid #E5E7EB;padding-top:28px;">
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 6px;">With purpose,</p>
            <p style="font-size:16px;font-weight:700;color:#1F2937;margin:0 0 4px;">Sanjay R</p>
            <p style="font-size:13px;color:#9CA3AF;margin:0;">Founder, SkillBridge &nbsp;·&nbsp; <a href="mailto:sanjayias91@gmail.com" style="color:#0EA5A4;text-decoration:none;">sanjayias91@gmail.com</a></p>
          </div>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 48px;text-align:center;">
          <p style="font-size:12px;color:#9CA3AF;margin:0;">
            SkillBridge is a free, non-profit community platform. No spam, ever.
            <br/>You're receiving this because you signed up at skillbridge.vercel.app
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`

    // Build the ICS calendar invite attachment
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SkillBridge//CS02//EN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:cs02-skillbridge-${Date.now()}@skillbridge`,
      `DTSTART;TZID=Asia/Kolkata:20260427T200000`,
      `DTEND;TZID=Asia/Kolkata:20260427T210000`,
      'RRULE:FREQ=DAILY',
      `SUMMARY:CS02 – Daily Coding Practice (SkillBridge)`,
      `DESCRIPTION:Daily coding practice session at 8 PM IST.\\nJoin on Google Meet: ${meetLink}\\nAdd to calendar: ${appointmentLink}`,
      `LOCATION:${meetLink}`,
      `ORGANIZER;CN=Sanjay R:mailto:sanjayias91@gmail.com`,
      `ATTENDEE;CN=${fullName};RSVP=TRUE:mailto:${email}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: CS02 Daily Coding Practice in 30 minutes',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    // Encode email with ICS attachment using RFC 2822 MIME
    const boundary = `----=_Part_${Date.now()}`
    const mimeBody = [
      `From: ${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
      `To: ${fullName} <${email}>`,
      `Subject: Welcome to SkillBridge, ${firstName}! 🎉 (+ Daily Session Invite)`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      emailHtml,
      '',
      `--${boundary}`,
      'Content-Type: text/calendar; charset=UTF-8; method=REQUEST; name="skillbridge-session.ics"',
      'Content-Transfer-Encoding: base64',
      'Content-Disposition: attachment; filename="skillbridge-session.ics"',
      '',
      Buffer.from(icsContent).toString('base64'),
      '',
      `--${boundary}--`,
    ].join('\r\n')

    const encodedMessage = Buffer.from(mimeBody)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    })

    // ── 3. ADD ATTENDEE TO GOOGLE CALENDAR EVENT ───────────────────────────
    const calendar = getCalendar(auth)

    // Get current event to preserve existing attendees
    const existingEvent = await calendar.events.get({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId: process.env.GOOGLE_CALENDAR_EVENT_ID,
    })

    const existingAttendees = existingEvent.data.attendees || []
    const alreadyAdded = existingAttendees.some(a => a.email === email)

    if (!alreadyAdded) {
      await calendar.events.patch({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        eventId: process.env.GOOGLE_CALENDAR_EVENT_ID,
        sendUpdates: 'all',
        requestBody: {
          attendees: [...existingAttendees, { email, displayName: fullName }],
        },
      })
    }

    return res.status(200).json({
      success: true,
      message: `Welcome ${firstName}! Check your email at ${email} for the acknowledgement and session invite.`,
    })

  } catch (err) {
    console.error('Join API error:', err)
    return res.status(500).json({
      error: 'Something went wrong. Please try again.',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
    })
  }
}
