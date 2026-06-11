# Schema Integrity — Database Knowledge Base

> **Category**: Database  
> **Mandatory Load**: Yes — load for database audit category  
> **Version**: v1.0

---

## DB-001: Missing Foreign Key Constraints

**Confidence**: 91 | **Stability**: Permanent | **Frequency**: Very Common

### Detection Logic
- Column named `user_id`, `order_id`, `product_id` etc. with no `REFERENCES` constraint
- ORM model has `belongsTo` / `hasMany` but migration has no `FOREIGN KEY`
- `ON DELETE` behavior unspecified (default varies by DB — often `RESTRICT`)
- Rows exist in child table referencing deleted parent rows

### Root Cause Pattern
ORM relationships defined in application code without corresponding DB-level constraints. "The app enforces it" — until it doesn't (race condition, bug, direct DB access).

### Risk Pattern
- Orphaned records: orders with no user, posts with no author
- Silent data corruption accumulates over time
- Application crashes when joining orphaned data
- Compliance issues (deleted user's PII references remain)

### False Positive Notes
NoSQL databases (MongoDB, DynamoDB) don't have FKs — application-level consistency is expected. Only flag for relational databases.

### Prevention Checklist
- [ ] Every `*_id` column referencing another table has `FOREIGN KEY` constraint
- [ ] `ON DELETE` behavior explicitly defined for every FK
- [ ] `ON UPDATE CASCADE` where appropriate
- [ ] FK indexes added (especially MySQL — not auto-created with FK)
- [ ] Data integrity audit: `SELECT count(*) FROM child WHERE parent_id NOT IN (SELECT id FROM parent)`

### Remediation Strategy
```sql
-- Add missing FK constraint
ALTER TABLE orders
ADD CONSTRAINT fk_orders_user_id
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE RESTRICT  -- prevent deleting user with orders
ON UPDATE CASCADE;  -- cascade user ID changes

-- Audit for existing orphans before adding FK
SELECT o.id, o.user_id
FROM orders o
LEFT JOIN users u ON u.id = o.user_id
WHERE u.id IS NULL; -- these must be cleaned up first
```

```javascript
// Prisma schema example
model Order {
  id     Int  @id @default(autoincrement())
  userId Int
  user   User @relation(fields: [userId], references: [id], onDelete: Restrict)
}
```

---

## DB-002: No Database Migration Versioning

**Confidence**: 94 | **Stability**: Permanent | **Frequency**: High

### Detection Logic
- No migration tool in use (Flyway, Liquibase, Knex migrations, Prisma Migrate, Alembic)
- Schema changes applied manually to production database
- No migration files in repository
- `schema.sql` file manually updated (not migration-based)
- Developers have different local database schemas

### Root Cause Pattern
Early-stage project modifies DB directly. "We'll formalize migrations later" — production runs ahead of the process.

### Risk Pattern
- Schema drift between environments (dev ≠ staging ≠ production)
- Unable to reproduce exact production schema for debugging
- Team members overwriting each other's schema changes
- No rollback path for failed schema changes
- Deployment failures from schema/code mismatch

### Prevention Checklist
- [ ] Migration tool installed and enforced
- [ ] All schema changes via migration files (never direct DB modification)
- [ ] Migrations run automatically in CI/CD (before app deploy)
- [ ] Migration history table tracked in DB (`schema_migrations`)
- [ ] Rollback migration (down migration) written for every up migration
- [ ] Migration tested in staging before production

### Remediation Strategy
```bash
# Install Knex migrations (Node.js example)
npm install knex

# Initialize
npx knex init
npx knex migrate:make add_users_table

# Migration file generated:
# migrations/20240101_add_users_table.js
```

```javascript
// migrations/20240101_add_users_table.js
exports.up = async (knex) => {
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('email').notNullable().unique();
    t.string('password_hash').notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable('users');
};
```

---

## DB-003: Sensitive Data Stored Unencrypted

**Confidence**: 90 | **Stability**: Permanent | **Frequency**: Medium

### Detection Logic
- PII columns (SSN, passport, credit card, date of birth) stored as plaintext
- Passwords stored as MD5 / SHA1 / unsalted hash
- Medical data stored without column-level encryption
- No `encrypted_` prefix convention for sensitive columns
- Backups unencrypted (S3 bucket without SSE)

### Root Cause Pattern
Encryption adds complexity. "Database access is already restricted" — backup theft, SQL injection, insider access all bypass this assumption.

### Risk Pattern
- Data breach exposes full PII in plaintext
- GDPR, HIPAA, PCI-DSS compliance violations
- Regulatory fines: GDPR up to 4% of annual global turnover
- Reputation destruction

### Prevention Checklist
- [ ] Passwords: bcrypt (cost factor ≥ 12), scrypt, or Argon2
- [ ] PII fields: application-level encryption before storage (AES-256-GCM)
- [ ] Key management: encryption keys in secrets manager (not in DB or code)
- [ ] Database at-rest encryption enabled (AWS RDS encrypted, PostgreSQL pgcrypto)
- [ ] Backups encrypted (S3 SSE-KMS)
- [ ] Data classification documented (which columns are PII/PHI/PCI)

### Remediation Strategy
```javascript
import bcrypt from 'bcrypt';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Password hashing
const hashPassword = (password) => bcrypt.hash(password, 12);
const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

// Field-level encryption for PII
const ENCRYPTION_KEY = Buffer.from(process.env.FIELD_ENCRYPTION_KEY, 'hex'); // 32 bytes

const encrypt = (plaintext) => {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (ciphertext) => {
  const [ivHex, authTagHex, dataHex] = ciphertext.split(':');
  const decipher = createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return decipher.update(Buffer.from(dataHex, 'hex')) + decipher.final('utf8');
};
```

---

## DB-004: Missing Database Backup Strategy

**Confidence**: 93 | **Stability**: Permanent | **Frequency**: High

### Detection Logic
- No automated backup configuration in cloud DB settings
- Backup retention period too short (< 7 days for most applications)
- Backups never tested / restoration never verified
- No point-in-time recovery (PITR) enabled
- Backup stored in same region as production (no geographic redundancy)

### Root Cause Pattern
Backups invisible until needed. "Cloud provider handles it" assumption without verifying it's actually configured.

### Risk Pattern
- Data loss from accidental deletion, ransomware, or corruption
- Backup exists but restoration fails (never tested)
- RPO (Recovery Point Objective) breached → compliance violation

### Prevention Checklist
- [ ] Automated backups enabled with ≥ 7 day retention (30 days for regulated data)
- [ ] PITR enabled (PostgreSQL WAL archiving, MySQL binlog)
- [ ] Backups copied to separate AWS region / GCP region
- [ ] Monthly restoration drill — verify backup is usable
- [ ] RTO and RPO targets documented and tested
- [ ] Backup access controlled (separate IAM role)
