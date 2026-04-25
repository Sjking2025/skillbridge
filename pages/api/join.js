// pages/api/join.js — SkillBridge v2
// 1. Appends to Google Sheet (9 columns)
// 2. Sends world-class rich HTML welcome email
// 3. Attaches .ics calendar invite (with 2 reminders)
// 4. Patches Google Calendar event with new attendee

import { getOAuth2Client, getGmail, getSheets, getCalendar } from '../../lib/googleClient'

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
    const emailHtml = buildEmail({ firstName, fullName, email, college, year, level, path, skillPath, initials, joinedAt, meetLink, appointmentLink })

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

// ── Email builder ────────────────────────────────────────────────────────────
function buildEmail({ firstName, fullName, email, college, year, level, path, skillPath, initials, joinedAt, meetLink, appointmentLink }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Welcome to SkillBridge</title>
<style>
*{box-sizing:border-box}
body{margin:0;padding:0;background:#0F172A;font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{background:#0F172A;padding:40px 16px}
.outer{max-width:600px;margin:0 auto}
.topbar{height:3px;background:linear-gradient(90deg,#0EA5A4,#6366F1,#FF9933);border-radius:3px 3px 0 0}
.hdr{background:linear-gradient(145deg,#0A1628 0%,#0D2137 60%,#0A2E2E 100%);padding:44px 44px 36px;text-align:center;border:1px solid rgba(14,165,164,0.18);border-top:none}
.logo-row{display:inline-flex;align-items:center;gap:10px;margin-bottom:24px}
.logo-box{width:40px;height:40px;min-width:40px;flex-shrink:0;background:linear-gradient(135deg,#0EA5A4,#0891B2);border-radius:11px;display:inline-flex;align-items:center;justify-content:center;font-size:19px;font-weight:800;color:#fff;font-style:italic}
.logo-text{font-size:21px;font-weight:700;color:#fff;letter-spacing:-0.4px}
.logo-text span{color:#0EA5A4}
.hdr-emoji{font-size:50px;display:block;margin:0 0 14px;line-height:1}
.hdr h1{font-size:28px;font-weight:800;color:#fff;margin:0 0 10px;line-height:1.2;letter-spacing:-0.5px}
.hdr h1 em{color:#0EA5A4;font-style:normal}
.hdr-sub{font-size:15px;color:rgba(255,255,255,0.55);margin:0;line-height:1.6}
.dots{display:flex;justify-content:center;gap:7px;margin-top:22px}
.dot{width:7px;height:7px;border-radius:50%}
.body{background:#fff;padding:40px 44px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB}
.greeting{font-size:16px;color:#374151;line-height:1.75;margin:0 0 28px}
.greeting strong{color:#0EA5A4;font-weight:700}

/* member card */
.mcard{background:linear-gradient(145deg,#0A1628,#0D2137);border-radius:14px;padding:24px 28px;margin-bottom:26px;border:1px solid rgba(14,165,164,0.22);position:relative;overflow:hidden}
.mcard-bar{position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#0EA5A4,#6366F1)}
.mcard-lbl{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(14,165,164,0.75);margin-bottom:14px}
.mcard-top{display:flex;align-items:center;margin-bottom:18px}
.avtr{width:48px;height:48px;line-height:48px;text-align:center;border-radius:50%;background:linear-gradient(135deg,#0EA5A4,#0891B2);font-size:18px;font-weight:800;color:#fff;}
.mcard-info{flex:1;padding-left:12px}
.mcard-name{font-size:17px;font-weight:800;color:#fff;margin:0 0 3px}
.mcard-since{font-size:11px;color:rgba(255,255,255,0.38)}
.mcard-badge{background:rgba(14,165,164,0.15);border:1px solid rgba(14,165,164,0.3);color:#5EEAD4;font-size:11px;font-weight:700;padding:4px 11px;border-radius:100px;white-space:nowrap;margin-left:auto;align-self:center}
.mdetail-row{display:flex;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
.mdetail-row:last-child{border:none}
.mdetail-lbl{font-size:12px;color:rgba(255,255,255,0.38);width:38%;font-weight:500}
.mdetail-val{font-size:12px;color:rgba(255,255,255,0.82);font-weight:600;flex:1;text-align:right}
.ppill{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:700;background:${path.bg};color:${path.color}}

/* session */
.scard{background:linear-gradient(135deg,#FF6B1A,#FF9933);border-radius:14px;padding:24px 28px;margin-bottom:24px;position:relative;overflow:hidden}
.scard::after{content:'📅';position:absolute;right:20px;top:50%;transform:translateY(-50%);font-size:48px;opacity:0.12}
.scard-lbl{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:6px}
.scard-title{font-size:20px;font-weight:800;color:#fff;margin:0 0 5px;letter-spacing:-0.3px}
.scard-meta{font-size:13px;color:rgba(255,255,255,0.82);margin:0 0 18px;line-height:1.5}
.scard-meta strong{color:#fff}
.btn-meet{display:inline-block;background:#fff;color:#CC7A29;text-decoration:none;font-size:13px;font-weight:800;padding:10px 20px;border-radius:9px;margin-right:8px;margin-bottom:6px}
.btn-cal{display:inline-block;background:rgba(255,255,255,0.18);border:1.5px solid rgba(255,255,255,0.45);color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:10px 20px;border-radius:9px;margin-bottom:6px}

/* what next */
.sec-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9CA3AF;margin:0 0 16px}
.expect-item{display:flex;align-items:flex-start;margin-bottom:14px;gap:13px}
.e-icon{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}
.e-title{font-size:13px;font-weight:700;color:#1F2937;margin:0 0 3px}
.e-desc{font-size:12px;color:#6B7280;line-height:1.55;margin:0}

/* phi */
.phi{background:#F8FAFC;border:1px solid #E5E7EB;border-radius:12px;padding:20px 22px;margin-bottom:26px}
.phi-inner{display:flex;gap:0}
.phi-item{flex:1;text-align:center;padding:0 6px}
.phi-num{font-size:26px;font-weight:800;color:#E5E7EB;display:block;line-height:1;margin-bottom:5px}
.phi-lbl{font-size:10px;color:#6B7280;font-weight:600;line-height:1.4}

/* journey */
.journey{background:linear-gradient(135deg,#E0F5F5,#EEF2FF);border-radius:12px;padding:20px 22px;margin-bottom:26px}
.j-title{font-size:13px;font-weight:700;color:#1F2937;margin:0 0 14px}
.j-row{display:flex;align-items:center}
.j-step{text-align:center;flex:1;min-width:0;padding:0 2px}
.j-dot{width:30px;height:30px;line-height:30px;text-align:center;border-radius:50%;margin:0 auto 5px;font-size:12px;font-weight:800;display:block;}
.j-dot.done{background:#0EA5A4;color:#fff}
.j-dot.now{background:#FF9933;color:#fff}
.j-dot.next{background:#E5E7EB;color:#9CA3AF}
.j-lbl{font-size:10px;font-weight:600;color:#6B7280}
.j-line{flex:1;height:2px;background:#D1D5DB;max-width:28px}
.j-line.done{background:#0EA5A4}

/* sig */
.sig{border-top:1px solid #E5E7EB;padding-top:24px;margin-top:4px}
.sig-pre{font-size:14px;color:#374151;margin:0 0 6px}
.sig-name{font-size:19px;font-weight:800;color:#1F2937;margin:0 0 3px;letter-spacing:-0.3px}
.sig-role{font-size:12px;color:#9CA3AF;margin:0 0 14px}
.sig-links{display:flex;gap:16px;flex-wrap:wrap}
.sig-link{font-size:12px;font-weight:600;color:#0EA5A4;text-decoration:none}

/* footer */
.ftr{background:#0A1628;border:1px solid rgba(14,165,164,0.13);border-top:none;padding:22px 44px;border-radius:0 0 14px 14px;text-align:center}
.ftr-tag{font-size:13px;font-weight:700;display:block;margin-bottom:8px;background:linear-gradient(90deg,#0EA5A4,#6366F1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.ftr-note{font-size:11px;color:rgba(255,255,255,0.28);line-height:1.6}
.ftr-note a{color:rgba(14,165,164,0.6);text-decoration:none}
</style>
</head>
<body>
<div class="wrap">
<div class="outer">

<div class="topbar"></div>

<div class="hdr">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" style="display:inline-table;">
          <tr>
            <td valign="middle" width="40" height="40" align="center" style="background:linear-gradient(135deg,#0EA5A4,#0891B2);border-radius:11px;font-size:19px;font-weight:800;color:#fff;font-style:italic;">S</td>
            <td valign="middle" style="padding-left:10px;">
              <span class="logo-text">Skill<span>Bridge</span></span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <span class="hdr-emoji">🎉</span>
  <h1>Welcome aboard,<br/><em>${firstName}!</em></h1>
  <p class="hdr-sub">You just made the most important decision of your tech journey.</p>
  <div class="dots">
    <div class="dot" style="background:#0EA5A4"></div>
    <div class="dot" style="background:#FF9933"></div>
    <div class="dot" style="background:#6366F1"></div>
    <div class="dot" style="background:#0EA5A4"></div>
    <div class="dot" style="background:#FF9933"></div>
  </div>
</div>

<div class="body">

  <p class="greeting">
    Hey <strong>${firstName}</strong> 👋 —<br/><br/>
    You've just joined <strong>2,400+ students</strong> from tier-2 and tier-3 colleges across India
    who are done watching tutorials and started building real things. No spoon-feeding.
    No copy-paste. Just real thinking, real mistakes, and real growth.<br/><br/>
    Here's everything you need to get started right now.
  </p>

  <!-- MEMBER CARD -->
  <div class="mcard">
    <div class="mcard-bar"></div>
    <div class="mcard-lbl">✦ Your SkillBridge Profile</div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
      <tr>
        <td width="48" valign="middle">
          <div class="avtr">${initials}</div>
        </td>
        <td valign="middle" style="padding-left:12px;">
          <div class="mcard-name">${fullName}</div>
          <div class="mcard-since">Member since ${joinedAt}</div>
        </td>
        <td valign="middle" align="right">
          <div class="mcard-badge" style="display:inline-block;margin:0;">Active Member</div>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="mdetail-lbl" style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);width:38%;">College</td>
        <td class="mdetail-val" align="right" style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">${college}</td>
      </tr>
      <tr>
        <td class="mdetail-lbl" style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);width:38%;">Year</td>
        <td class="mdetail-val" align="right" style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">${year}</td>
      </tr>
      <tr>
        <td class="mdetail-lbl" style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);width:38%;">Level</td>
        <td class="mdetail-val" align="right" style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">${level}</td>
      </tr>
      <tr>
        <td class="mdetail-lbl" style="padding:4px 0;width:38%;">Skill Path</td>
        <td class="mdetail-val" align="right" style="padding:4px 0;text-align:right;"><span class="ppill" style="display:inline-block;">${path.emoji} ${skillPath || 'Exploring'}</span></td>
      </tr>
    </table>
  </div>

  <!-- SESSION CARD -->
  <div class="scard">
    <div class="scard-lbl">Your Daily Live Session</div>
    <div class="scard-title">CS02 — Daily Coding Practice</div>
    <div class="scard-meta">Every day at <strong>8:00 PM IST</strong> on Google Meet &nbsp;·&nbsp; Hosted by MrSJ<br/>Show up consistently. That's 80% of the battle.</div>
    <a href="${meetLink}" class="btn-meet">▶ Join Google Meet</a>
    <a href="${appointmentLink}" class="btn-cal">📅 Add to Calendar</a>
  </div>

  <!-- WHAT NEXT -->
  <p class="sec-title">What happens next</p>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
    <tr>
      <td width="38" valign="top">
        <div style="background:#E0F5F5; width:38px; height:38px; border-radius:11px; text-align:center;">
          <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" width="20" height="20" alt="WhatsApp" style="display:inline-block; vertical-align:middle; margin-top:9px;"/>
        </div>
      </td>
      <td valign="top" style="padding-left:13px;">
        <div class="e-title">WhatsApp / Discord Invite — within 24 hours</div>
        <div class="e-desc">We'll add you to your skill-specific peer group. Small groups of 6–8 students at the same level — no big chaotic chats.</div>
      </td>
    </tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
    <tr>
      <td width="38" valign="top">
        <div style="background:#FFF3E0; width:38px; height:38px; border-radius:11px; text-align:center;">
          <img src="https://cdn-icons-png.flaticon.com/512/1828/1828884.png" width="20" height="20" alt="Target" style="display:inline-block; vertical-align:middle; margin-top:9px;"/>
        </div>
      </td>
      <td valign="top" style="padding-left:13px;">
        <div class="e-title">First Task — Join tonight's 8 PM session</div>
        <div class="e-desc">Don't wait for the "right time". Your first action is to show up to Daily Coding Practice. No preparation needed. Just come.</div>
      </td>
    </tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
    <tr>
      <td width="38" valign="top">
        <div style="background:#EEF2FF; width:38px; height:38px; border-radius:11px; text-align:center;">
          <img src="https://cdn-icons-png.flaticon.com/512/616/616490.png" width="20" height="20" alt="Trophy" style="display:inline-block; vertical-align:middle; margin-top:9px;"/>
        </div>
      </td>
      <td valign="top" style="padding-left:13px;">
        <div class="e-title">Weekly Mock Interview Night</div>
        <div class="e-desc">Every week: structured mock interviews with peer feedback. Practice thinking out loud — the most underrated skill in tech hiring.</div>
      </td>
    </tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
    <tr>
      <td width="38" valign="top">
        <div style="background:#F0FDF4; width:38px; height:38px; border-radius:11px; text-align:center;">
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" width="20" height="20" alt="Mentor" style="display:inline-block; vertical-align:middle; margin-top:9px;"/>
        </div>
      </td>
      <td valign="top" style="padding-left:13px;">
        <div class="e-title">Mentor Access</div>
        <div class="e-desc">Industry professionals who came from exactly where you are. Real questions get real answers. No gatekeeping.</div>
      </td>
    </tr>
  </table>

  <!-- PHILOSOPHY -->
  <p class="sec-title" style="margin-top:28px">The SkillBridge method</p>
  <div class="phi">
    <div class="phi-inner">
      <div class="phi-item"><span class="phi-num">01</span><span class="phi-lbl">Learn by Making Mistakes</span></div>
      <div class="phi-item"><span class="phi-num">02</span><span class="phi-lbl">Ask WHY, Not Just HOW</span></div>
      <div class="phi-item"><span class="phi-num">03</span><span class="phi-lbl">No Spoon-Feeding</span></div>
      <div class="phi-item"><span class="phi-num">04</span><span class="phi-lbl">Thinking Over Memorization</span></div>
    </div>
  </div>

  <!-- JOURNEY -->
  <div class="journey">
    <div class="j-title">🗺️ Your journey — you're at Step 1 of 4</div>
    <div style="text-align:center; font-size:0; width:100%;">
      <div style="display:inline-block; width:22%; vertical-align:top; font-size:11px;"><div class="j-dot done">✓</div><div class="j-lbl">Joined</div></div>
      <div style="display:inline-block; width:4%; height:2px; background:#0EA5A4; vertical-align:top; margin-top:14px;"></div>
      <div style="display:inline-block; width:22%; vertical-align:top; font-size:11px;"><div class="j-dot now">2</div><div class="j-lbl">First Session</div></div>
      <div style="display:inline-block; width:4%; height:2px; background:#D1D5DB; vertical-align:top; margin-top:14px;"></div>
      <div style="display:inline-block; width:22%; vertical-align:top; font-size:11px;"><div class="j-dot next">3</div><div class="j-lbl">First Build</div></div>
      <div style="display:inline-block; width:4%; height:2px; background:#D1D5DB; vertical-align:top; margin-top:14px;"></div>
      <div style="display:inline-block; width:22%; vertical-align:top; font-size:11px;"><div class="j-dot next">🏆</div><div class="j-lbl">Hired</div></div>
    </div>
  </div>

  <!-- SIGNATURE -->
  <div class="sig">
    <p class="sig-pre">With purpose,</p>
    <p class="sig-name">Sanjay R</p>
    <p class="sig-role">Founder, SkillBridge &nbsp;·&nbsp; Chennai, India</p>
    <div class="sig-links">
      <a href="mailto:sanjayias91@gmail.com" class="sig-link">✉ sanjayias91@gmail.com</a>
      <a href="${meetLink}" class="sig-link">📹 Google Meet</a>
      <a href="${appointmentLink}" class="sig-link">📅 Book a slot</a>
    </div>
  </div>

</div>

<div class="ftr">
  <span class="ftr-tag">Bridge the gap. Own your future.</span>
  <p class="ftr-note">
    SkillBridge is a free, non-profit community. No spam, no fees, ever.<br/>
    You received this because you signed up at <a href="https://skillbridge.vercel.app">skillbridge.vercel.app</a><br/>
    <a href="mailto:sanjayias91@gmail.com?subject=Unsubscribe">Unsubscribe</a>
  </p>
</div>

</div>
</div>
</body>
</html>`
}

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