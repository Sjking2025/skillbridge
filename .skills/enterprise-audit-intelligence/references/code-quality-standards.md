# Code Quality Standards Reference

> **Category**: Reference  
> **Load When**: Running code quality audit category  
> **Version**: v1.0

---

## SOLID Principles — Audit Checklist

### S — Single Responsibility Principle
**Violation signals**:
- Class/module name contains "And" or "Or" (UserAndBillingService)
- Function > 50 lines
- File > 300 lines with unrelated exports
- One change requires touching multiple unrelated files

**Audit question**: "What is the ONE reason this unit would change?"

---

### O — Open/Closed Principle
**Violation signals**:
- Long `if/else` or `switch` chains that grow with new features
- New requirement requires modifying existing working code
- No strategy, factory, or plugin pattern for extensible behavior

**Audit question**: "To add a new variant, must we edit this file?"

---

### L — Liskov Substitution Principle
**Violation signals**:
- Subclass throws exceptions that parent doesn't declare
- Override method checks `instanceof` to branch behavior
- Subclass ignores or no-ops inherited behavior

---

### I — Interface Segregation Principle
**Violation signals**:
- Interface/type with 20+ methods (many irrelevant to most implementors)
- Classes implementing interface but throwing `NotImplementedError` on half the methods
- Functions accepting massive config objects where only 2 fields are used

---

### D — Dependency Inversion Principle
**Violation signals**:
- `new DatabaseConnection()` inside a business logic class
- Hard-coded external service calls in domain logic
- Tests require mocking concrete classes (not interfaces)

**Fix**: Constructor injection, dependency injection container

---

## Code Smell Catalogue

| Smell | Detection | Risk |
|-------|-----------|------|
| Magic numbers | `if (status === 3)` with no constant | Future maintainers have no context |
| Deep nesting | > 3 levels of if/for nesting | Impossible to test all paths |
| Long parameter lists | Function with > 4 parameters | Hard to use, easy to misuse |
| Duplicate code | Copy-paste with minor variations | Bug fixed in one place, stays in others |
| Dead code | Commented-out blocks, unreachable branches | Confusion, false security |
| Premature optimization | Complex caching before profiling shows need | Complexity without measured benefit |
| Shotgun surgery | One change requires touching 10 files | Hidden coupling |
| Feature envy | Method uses another class's data more than its own | Misplaced responsibility |
| Data clumps | Same 4 parameters always appear together | Should be an object |
| God class | Class knows everything, does everything | Untestable, unmaintainable |

---

## Code Review Checklist (Audit Use)

### Security (check every PR)
- [ ] No secrets / credentials in code or config
- [ ] User input validated before use
- [ ] Auth middleware on all protected routes
- [ ] No raw HTML rendering from user content
- [ ] SQL/NoSQL queries parameterized

### Error Handling
- [ ] All async operations have error handling
- [ ] Errors logged with context (not just `console.error(e)`)
- [ ] User-facing errors don't expose internals
- [ ] Promise rejections not silently swallowed

### Data Handling
- [ ] No sensitive data in logs
- [ ] PII handled according to data classification policy
- [ ] Database queries paginated (no unbounded reads)
- [ ] Transactions used where atomicity is required

### Testing
- [ ] New code has tests
- [ ] Error paths tested (not just happy path)
- [ ] Integration test covers the critical flow

### Performance
- [ ] No N+1 queries introduced
- [ ] No synchronous heavy operations on main thread
- [ ] Appropriate indexes on new query patterns

### Documentation
- [ ] Public APIs documented
- [ ] Complex algorithms explained with comments
- [ ] Architecture decisions recorded (ADR) for non-obvious choices

---

## Async Code Quality

### Anti-patterns to flag

```javascript
// 1. Fire-and-forget (unhandled rejection)
sendEmail(user.email); // no await, no catch

// 2. Sequential awaits that could be parallel
const user = await getUser(id);
const posts = await getPosts(id); // doesn't depend on user result!

// 3. Promise hell (callback hell reborn)
getUser(id).then(user => {
  getPosts(user.id).then(posts => {
    getComments(posts[0].id).then(comments => { ... })
  })
})
```

```javascript
// 1. Fixed: explicit error handling
sendEmail(user.email).catch(err => logger.error({ err }, 'Email send failed'));

// 2. Fixed: parallel execution
const [user, posts] = await Promise.all([getUser(id), getPosts(id)]);

// 3. Fixed: async/await chain
const user = await getUser(id);
const posts = await getPosts(user.id);
const comments = await getComments(posts[0].id);
```

---

## Naming Standards

### Violations to flag
- Single-letter variables outside loop counters (`const d = new Date()`)
- Abbreviated names that lose meaning (`usrMgr`, `calcTtl`)
- Boolean variables without `is`/`has`/`can` prefix (`active`, `valid`)
- Functions that don't start with a verb (`userData()` vs `getUserData()`)
- Inconsistent naming within same file (camelCase AND snake_case)

### Conventions to enforce
```javascript
// Variables: nouns
const userProfile = {};
const orderCount = 0;
const isAuthenticated = true; // boolean: is/has/can prefix

// Functions: verb + noun
const getUserById = (id) => {};
const validatePaymentMethod = (method) => {};
const hasPermission = (user, resource) => {}; // boolean return: has/is

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_PAGE_SIZE = 20;

// Classes: PascalCase, noun
class UserRepository {}
class PaymentProcessor {}
```
