# Client Security — Frontend Knowledge Base

> **Category**: Frontend  
> **Mandatory Load**: Yes — load for frontend audit category  
> **Version**: v1.0

---

## FE-001: Rendering Raw HTML from User Input (XSS Vector)

**Confidence**: 98 | **Stability**: Permanent | **Frequency**: Very Common

### Detection Logic
- React: `dangerouslySetInnerHTML={{ __html: userContent }}`
- Vue: `v-html="userContent"`
- Angular: `[innerHTML]="userContent"` without sanitization
- jQuery: `.html(userContent)`, `.append(userContent)`
- Template literals inserted into DOM: `element.innerHTML = \`Hello ${name}\``
- `document.write(userContent)` anywhere

### Root Cause Pattern
Developers need to render formatted content (rich text, markdown) and take the easiest path. "The content comes from our database" — ignoring that the database may contain user-submitted content.

### Risk Pattern
- Stored XSS: malicious script persists in database, executes for every visitor
- Session hijacking via `document.cookie`
- Credential harvesting via injected fake login forms
- Cryptomining scripts injected into all users' browsers
- Account takeover at scale

### Prevention Checklist
- [ ] Never use `dangerouslySetInnerHTML` / `v-html` with user content
- [ ] DOMPurify to sanitize HTML before rendering (if HTML rendering is required)
- [ ] Markdown: use a safe renderer (marked with sanitize: true, or remark)
- [ ] React: use JSX text nodes (auto-escaped) — never template into innerHTML
- [ ] Content Security Policy header blocks inline script execution (defense in depth)
- [ ] Output encoding validated in code review checklist

### Remediation Strategy
```jsx
import DOMPurify from 'dompurify';

// BEFORE (XSS vulnerable)
<div dangerouslySetInnerHTML={{ __html: userBio }} />

// AFTER (sanitized — only if HTML rendering genuinely required)
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userBio, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
}) }} />

// BEST (for plain text — React escapes automatically)
<div>{userBio}</div>

// For Markdown
import { marked } from 'marked';
const safeHtml = DOMPurify.sanitize(marked.parse(markdownContent));
<div dangerouslySetInnerHTML={{ __html: safeHtml }} />
```

---

## FE-002: Sensitive Data in Client-Side State or URL

**Confidence**: 86 | **Stability**: Permanent | **Frequency**: High

### Detection Logic
- Auth tokens in URL query parameters: `/dashboard?token=eyJhb...`
- PII in URL: `/users/search?ssn=123-45-6789`
- Redux/Zustand store containing full user objects with sensitive fields
- `console.log(user)` in production code (with sensitive fields)
- Sensitive data in `localStorage`/`sessionStorage` (beyond token concerns in SEC-001)

### Root Cause Pattern
Frontend developers treat client state as private. Browser history, proxies, CDN logs, Referer headers, and browser extensions all see the URL.

### Risk Pattern
- Tokens in URLs: saved in browser history, server logs, CDN logs, Referer headers
- PII in URLs: compliance violation (GDPR, HIPAA)
- State management libraries expose full store to browser extensions

### Prevention Checklist
- [ ] Auth tokens passed in HTTP headers (Authorization), never URL parameters
- [ ] PII never in URLs (use POST body or session)
- [ ] Redux DevTools disabled in production
- [ ] Sensitive fields stripped from client-side user object (keep only what UI needs)
- [ ] Production builds: `console.log` stripped or minimal

### Remediation Strategy
```javascript
// BEFORE (token in URL — appears in logs, history)
window.location = `/dashboard?token=${accessToken}`;

// AFTER (token in header, stored in memory)
const response = await fetch('/api/protected', {
  headers: { Authorization: `Bearer ${inMemoryToken}` },
});

// Scrub sensitive fields from client state
const safeUser = {
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  // omit: ssn, dateOfBirth, paymentInfo, internalFlags
};
```

---

## FE-003: Missing Loading, Error, and Empty States

**Confidence**: 82 | **Stability**: Permanent | **Frequency**: Very Common

### Detection Logic
- API call results rendered directly without loading indicator
- Network errors silently fail — user sees blank screen or frozen UI
- Empty arrays render nothing (no "no results" message)
- Form submission has no loading state (double-submit possible)
- Error boundaries absent in React app

### Root Cause Pattern
Happy path developed first. Edge states added "if there's time" — there isn't.

### Risk Pattern
- Double form submissions → duplicate orders, duplicate payments
- Blank screens → user assumes app is broken, churn
- Unhandled promise rejections → React renders nothing (white screen of death)
- No error boundary → one component crash takes down entire app

### Prevention Checklist
- [ ] Loading state for every async operation
- [ ] Error state with user-friendly message for every API call
- [ ] Empty state for every list/table
- [ ] Form submission buttons disabled during in-flight request
- [ ] React Error Boundary wrapping every major page section
- [ ] Global error handler for uncaught async errors

### Remediation Strategy
```jsx
// Error Boundary (required for every major section)
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Report to Sentry
    Sentry.captureException(error, { extra: info });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}

// Form with loading + double-submit protection
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (data) => {
  if (isSubmitting) return; // prevent double submit
  setIsSubmitting(true);
  try {
    await submitOrder(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setIsSubmitting(false);
  }
};

<button disabled={isSubmitting} onClick={handleSubmit}>
  {isSubmitting ? 'Processing...' : 'Place Order'}
</button>
```

---

## FE-004: Client-Side Only Authorization Checks

**Confidence**: 97 | **Stability**: Permanent | **Frequency**: High

### Detection Logic
- Route guards / `PrivateRoute` components that redirect non-admins
- Feature flags checked only in JSX (`{isAdmin && <AdminPanel />}`)
- API calls not made if `user.role !== 'admin'` — but API doesn't also check
- Admin UI hidden via CSS or conditional rendering — API endpoints still open

### Root Cause Pattern
Frontend developer hides the UI and believes that's sufficient access control. Backend access control is treated as optional.

### Risk Pattern
- Any developer with browser DevTools can bypass UI restrictions
- Direct API calls bypass all client-side checks entirely
- Admin endpoints callable with any authenticated token

### Prevention Checklist
- [ ] Client-side checks: UX only (for clean UI, not security)
- [ ] Server-side RBAC on every endpoint regardless of frontend restrictions
- [ ] API tests verify role enforcement server-side (see TEST-001)
- [ ] Penetration test specifically targets "hidden" admin functionality

*See SEC-002 for the server-side RBAC remediation.*
