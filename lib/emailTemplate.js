import { THEME } from "./emailTheme"
import { ICONS } from "./emailIcons"

export function buildEmail(data) {
  const {
    firstName,
    fullName,
    college,
    year,
    level,
    skillPath,
    meetLink
  } = data

  const initials = fullName.split(" ").map(n => n[0]).join("").toUpperCase()

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:${THEME.bg};font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" bgcolor="${THEME.bg}">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;">

<!-- HEADER -->
<tr>
<td style="background:${THEME.dark};padding:30px;text-align:center;color:#fff;">
  <div style="font-size:24px;font-weight:800;">
    Skill<span style="color:${THEME.primary};">Bridge</span>
  </div>
  <div style="font-size:28px;margin-top:10px;">🎉</div>
  <div style="font-size:20px;font-weight:700;margin-top:10px;">
    Welcome aboard, ${firstName}!
  </div>
</td>
</tr>

<!-- BODY -->
<tr>
<td style="padding:30px;">

<p style="color:${THEME.text};font-size:14px;">
Hey <b>${firstName}</b>, you're now part of builders 🚀
</p>

<!-- MEMBER CARD -->
<table width="100%" cellpadding="10" cellspacing="0" style="background:${THEME.dark};border-radius:8px;color:#fff;">
<tr>
<td width="60">
  <div style="width:48px;height:48px;border-radius:50%;background:${THEME.primary};text-align:center;line-height:48px;font-weight:700;">
    ${initials}
  </div>
</td>
<td>
  <div style="font-weight:700;">${fullName}</div>
  <div style="font-size:12px;color:${THEME.muted};">Active Member</div>
</td>
</tr>

<tr>
<td colspan="2" style="font-size:13px;">
College: ${college}<br>
Year: ${year}<br>
Level: ${level}<br>
Path: ${skillPath}
</td>
</tr>
</table>

<br>

<!-- SESSION -->
<table width="100%" cellpadding="20" cellspacing="0" style="background:${THEME.accent};border-radius:8px;color:#fff;">
<tr>
<td>
  <div style="font-size:18px;font-weight:700;">Daily Coding Practice</div>
  <div style="font-size:13px;">Every day at 8 PM IST</div>

  <br>

  <table>
  <tr>
  <td bgcolor="#fff" style="border-radius:6px;">
    <a href="${meetLink}" style="display:inline-block;padding:10px 20px;text-decoration:none;color:${THEME.accent};font-weight:700;">
      Join Session
    </a>
  </td>
  </tr>
  </table>

</td>
</tr>
</table>

<br>

<!-- WHAT NEXT -->
<b style="font-size:13px;color:${THEME.muted};">What happens next</b>
<br><br>

${item(ICONS.whatsapp, "WhatsApp Group", "Added within 24 hours")}
${item(ICONS.target, "First Task", "Join today's session")}
${item(ICONS.trophy, "Mock Interviews", "Weekly practice")}
${item(ICONS.mentor, "Mentor Access", "Ask anything")}

<br>

<hr>

<div style="font-size:12px;color:${THEME.muted};">
Sanjay R<br>
Founder, SkillBridge
</div>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`
}

function item(icon, title, desc) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
<tr>
<td width="40">
<img src="${icon}" width="20" style="display:block;">
</td>
<td style="font-size:13px;">
<b>${title}</b><br>
<span style="color:#6B7280;">${desc}</span>
</td>
</tr>
</table>
`
}
