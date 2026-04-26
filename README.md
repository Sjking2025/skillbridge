<div align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Google%20Cloud-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white" alt="Google Cloud APIs">
</div>

# 🌉 SkillBridge 

**SkillBridge** is a community-driven, non-profit platform designed to help students from tier-2/tier-3 colleges and non-IT backgrounds build real-world tech skills, confidence, and careers—completely free of charge. We believe in replacing "tutorial hell" with raw problem-solving, curiosity, and peer learning.

## 🧠 The Philosophy: Incremental Learning

Our core methodology is built on a simple yet powerful idea: **we start from the basics as we grow further, and we never forget the past.** We learn by combining the past with the present.

Instead of isolating topics, we continuously stack and mix concepts:
- **Phase 1:** Learn `Concept 1`
- **Phase 2:** Learn `Concept 1 + Concept 2`
- **Phase 3:** Learn `Concept 1 + Concept 2 + Concept 3`

This compound learning approach ensures that foundational skills remain sharp, and you understand how different technologies interact in real-world environments. It's not about watching isolated videos; it's about building, breaking, fixing, and mixing concepts together.

## 🚀 Key Features

### 1. Premium Frontend Interface
- Fully responsive, modern UI built with **Next.js** and **React**.
- Deep integration with **Framer Motion** for smooth, professional micro-interactions.
- Robust Light/Dark mode support using `next-themes`.
- Curated learning paths broken down into Core Engineering, Dev Tools, and Design.

### 2. Intelligent Automation Engine (`join.js`)
At the heart of the SkillBridge platform is a highly robust monolithic API handler (`pages/api/join.js`) that automatically processes new community registrations. Upon form submission, the system:
1. **Appends to Google Sheets:** Logs user details (name, college, year, selected path) directly into a master tracking sheet via the Google Sheets API.
2. **Dispatches Premium HTML Emails:** Compiles and sends a high-fidelity, customized HTML welcome email via the Gmail API. Emails are built using rigid `<table>` architectures to guarantee pixel-perfect rendering across legacy and modern email clients (including Outlook). Emails dynamically adapt to the user's chosen skill path with personalized icons, colors, and progress trackers.
3. **Generates `.ics` Invites:** Creates a standardized calendar invite containing Google Meet links and event reminders, ensuring the student never misses the daily 8 PM IST coding practice.
4. **Patches Google Calendar:** Automatically adds the user as an attendee to the master Google Calendar event.

### 3. Diverse Learning Paths
SkillBridge natively supports a variety of technical domains, including:
- **Core Engineering:** Web Development, Java Backend, AI / Machine Learning, Data Structures & Algorithms.
- **Infrastructure & Tools:** Git & GitHub, Linux / Dev Tools, Google Cloud / DevOps.
- **Design & Product:** UI/UX Design (Figma).

## 🛠 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Styling:** CSS Modules with dynamic theme variables
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Backend/API:** Next.js Serverless Functions
- **Integrations:** Google Workspace APIs (`googleapis`) — Sheets, Calendar, Gmail

## 💻 Getting Started (Local Development)

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v16+) installed on your machine.
To run the full backend automation locally, you will need a Google Cloud Project with a Service Account and the necessary API scopes enabled.

### 1. Clone & Install
```bash
git clone https://github.com/Sjking2025/skillbridge.git
cd skillbridge
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory. You must configure the following variables for the backend automation to function:

```env
# Google Service Account Credentials
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\n-----END PRIVATE KEY-----\n"

# Google Workspace IDs
GOOGLE_SHEET_ID="your_google_sheet_id"
GOOGLE_CALENDAR_ID="your_google_calendar_id"
GOOGLE_CALENDAR_EVENT_ID="your_master_recurring_event_id"

# Platform Metadata
SENDER_EMAIL="your.email@example.com"
SENDER_NAME="SkillBridge Community"
GOOGLE_MEET_LINK="https://meet.google.com/xxx-xxxx-xxx"
CALENDAR_APPOINTMENT_LINK="https://calendar.app.google/your-link"
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Community Impact
- **Growing Community** across 180+ colleges in India.
- **Daily Sessions:** Peer learning in small groups (6-8 students).
- **Mentorship:** Industry professionals who review resumes and conduct mock interviews.

## 📄 License
This project is open-source and intended to empower learners globally.
