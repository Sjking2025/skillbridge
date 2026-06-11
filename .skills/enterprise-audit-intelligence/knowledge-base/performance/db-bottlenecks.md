# Database Bottlenecks — Performance Knowledge Base

> **Category**: Performance → Database  
> **Mandatory Load**: Yes — load for performance and database audit categories  
> **Version**: v1.0

---

## PERF-001: N+1 Database Query Pattern

**Confidence**: 97 | **Stability**: Permanent | **Frequency**: Extremely Common

### Detection Logic
- ORM `.find()` inside a loop: `for (const user of users) { await user.getPosts() }`
- Query count scales linearly with result set size
- `sequelize`/`prisma`/`typeorm` relations not using `.include`/`.with`/eager loading
- DB query logs showing repeated identical queries with different IDs

### Root Cause Pattern
ORM lazy loading is convenient for development. Developers access related data naturally without considering the SQL being generated. Works fine with small datasets — catastrophic at scale.

### Risk Pattern
- 100-item list → 101 database queries instead of 2
- Response time: O(n) instead of O(1) relative to dataset size
- Database connection pool exhaustion under moderate load
- Database CPU spike → cascading slowdown across all queries

### Detection in Code Review
```javascript
// SMELL: Loop + async call = likely N+1
const orders = await Order.findAll();
for (const order of orders) {
  order.user = await User.findByPk(order.userId); // N+1!
}
```

### Remediation Strategy
```javascript
// BEFORE (N+1)
const orders = await Order.findAll();
for (const order of orders) {
  order.user = await User.findByPk(order.userId);
}

// AFTER (Sequelize eager loading — 2 queries total)
const orders = await Order.findAll({
  include: [{ model: User, as: 'user' }],
});

// AFTER (Prisma — 1 query with JOIN)
const orders = await prisma.order.findMany({
  include: { user: true },
});

// AFTER (raw SQL for complex cases)
const orders = await db.query(`
  SELECT o.*, u.name as user_name, u.email as user_email
  FROM orders o
  JOIN users u ON u.id = o.user_id
  WHERE o.status = $1
`, ['pending']);
```

### Prevention Checklist
- [ ] ORM query logging enabled in development/staging
- [ ] `sequelize-log-queries` or equivalent to count queries per request
- [ ] Code review checklist includes N+1 check for any new list endpoint
- [ ] Integration tests verify query count for critical list endpoints
- [ ] DataLoader pattern for GraphQL resolvers

---

## PERF-002: Missing Database Indexes on Frequently-Queried Columns

**Confidence**: 96 | **Stability**: Permanent | **Frequency**: Extremely Common

### Detection Logic
- `WHERE` clauses on columns with no index defined
- `ORDER BY` on non-indexed columns (full table sort)
- Foreign keys without index (common in MySQL — not auto-created)
- `LIKE '%search%'` queries (leading wildcard prevents index use)
- `EXPLAIN ANALYZE` shows `Seq Scan` on large tables
- Columns used in JOIN conditions without indexes

### Root Cause Pattern
Indexes added when performance problems appear — not designed upfront. ORM migrations create columns without indexes because developers don't specify them.

### Risk Pattern
- Full table scans on every request
- Query time: O(n) → sub-millisecond becomes seconds at scale
- Database CPU pegged under normal load
- Cascading slow queries → connection pool exhaustion → application outage

### Detection Queries
```sql
-- PostgreSQL: Find tables with sequential scans (missing indexes)
SELECT relname as table, seq_scan, idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
ORDER BY seq_scan DESC;

-- PostgreSQL: Slow query analysis
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Check existing indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Prevention Checklist
- [ ] Index all foreign key columns (especially MySQL — not automatic)
- [ ] Index all columns used in `WHERE`, `ORDER BY`, `GROUP BY` on large tables
- [ ] Composite indexes for multi-column filter patterns (column order matters)
- [ ] Partial indexes for filtered queries (e.g., `WHERE status = 'active'`)
- [ ] `EXPLAIN ANALYZE` review for all new queries on tables > 10k rows
- [ ] Index maintenance: `REINDEX` / `VACUUM ANALYZE` scheduled

### Remediation Strategy
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);
CREATE INDEX CONCURRENTLY idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_users_email ON users(email); -- for login lookups

-- Partial index for common filtered queries
CREATE INDEX CONCURRENTLY idx_orders_pending ON orders(created_at)
WHERE status = 'pending';

-- For text search (PostgreSQL full-text instead of LIKE '%..%')
CREATE INDEX idx_products_name_fts ON products USING GIN(to_tsvector('english', name));
```

```javascript
// Prisma migration example
await prisma.$executeRaw`
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id ON orders(user_id)
`;
```

---

## PERF-003: Missing Database Connection Pooling

**Confidence**: 91 | **Stability**: Permanent | **Frequency**: High

### Detection Logic
- New database connection created per request: `new Client()` / `createConnection()` inside request handler
- No pool configuration in ORM setup
- Serverless functions creating connections without pooling proxy (PgBouncer, RDS Proxy)
- Pool size not configured (using framework defaults — often too small or too large)

### Root Cause Pattern
Database connection creation feels like a simple line of code. Connection cost (TCP handshake, auth, SSL) invisible in development.

### Risk Pattern
- Connection creation time adds 50–200ms to every request
- Database max_connections hit under load → connection refused errors
- Serverless: thousands of concurrent function invocations = thousands of connections

### Prevention Checklist
- [ ] Connection pool configured explicitly (not relying on defaults)
- [ ] Pool size calculated: `(core_count * 2) + effective_spindle_count` as baseline
- [ ] Serverless: PgBouncer / RDS Proxy / Neon connection pooling
- [ ] Pool timeout and idle timeout configured
- [ ] Connection pool metrics monitored (active, idle, waiting)

### Remediation Strategy
```javascript
// Knex pool config
const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 600000,
    reapIntervalMillis: 1000,
  },
});

// Prisma pool config (via connection string)
// DATABASE_URL="postgresql://user:pass@host/db?connection_limit=10&pool_timeout=20"
```

---

## PERF-004: Unbounded Query Results (Missing Pagination)

**Confidence**: 89 | **Stability**: Permanent | **Frequency**: Very Common

### Detection Logic
- `findAll()` / `SELECT *` without `LIMIT`
- List endpoints returning full datasets: `GET /api/users` → all users
- No cursor or page parameter in list API contracts
- Frontend requesting and rendering thousands of rows

### Root Cause Pattern
Works fine with seed data (100 rows). Never tested against production-scale data (100,000 rows).

### Risk Pattern
- Memory spike: loading 100k rows into Node.js heap → OOM crash
- Response payload bloat → client timeout
- Database CPU spike on unbounded reads

### Prevention Checklist
- [ ] Default `LIMIT` on all list queries (even "internal" endpoints)
- [ ] Cursor-based pagination for large datasets (offset pagination breaks at scale)
- [ ] Max page size enforced server-side (never trust client-supplied limit)
- [ ] API response always includes pagination metadata

### Remediation Strategy
```javascript
// Cursor-based pagination (scales infinitely, no offset drift)
app.get('/api/orders', async (req, res) => {
  const { cursor, limit = 20 } = req.query;
  const maxLimit = Math.min(Number(limit), 100); // cap at 100

  const where = cursor ? { id: { [Op.lt]: cursor } } : {};

  const orders = await Order.findAll({
    where,
    order: [['id', 'DESC']],
    limit: maxLimit + 1, // fetch one extra to determine hasMore
  });

  const hasMore = orders.length > maxLimit;
  const data = hasMore ? orders.slice(0, -1) : orders;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  res.json({ data, nextCursor, hasMore });
});
```
