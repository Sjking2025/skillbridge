# Observability — Production Knowledge Base

> **Category**: Production Readiness  
> **Mandatory Load**: Yes — load for production readiness audit category  
> **Version**: v1.0

---

## The Three Pillars of Observability

Every production system must implement all three:

| Pillar | Purpose | Minimum Viable Implementation |
|--------|---------|-------------------------------|
| **Logs** | What happened | Structured JSON logs + error tracking (Sentry) |
| **Metrics** | How the system performs | `prom-client` + Grafana OR Datadog APM |
| **Traces** | Why something is slow | OpenTelemetry + Jaeger/Tempo OR Datadog Tracing |

---

## PROD-003: No Centralized Error Logging

*(See full entry in `deployment-playbook.md`)*

---

## OBS-001: No Structured Logging

**Confidence**: 89 | **Stability**: Permanent | **Frequency**: Very Common

### Detection Logic
- `console.log('User logged in:', userId)` (unstructured string)
- Log messages not searchable/filterable in log aggregation system
- No consistent log format across services
- Log level not attached to each message
- Request context (requestId, userId) not threaded through logs

### Root Cause Pattern
`console.log` is the path of least resistance. Structured logging requires upfront discipline.

### Risk Pattern
- Logs unsearchable during incidents → debugging takes hours instead of minutes
- Correlation of logs across services impossible without request IDs
- Log volume forces expensive full-text search instead of fast indexed queries

### Prevention Checklist
- [ ] Structured JSON logger (Pino, Winston, Bunyan for Node.js)
- [ ] Every log entry includes: `timestamp`, `level`, `requestId`, `service`, `message`
- [ ] Log levels used correctly: DEBUG (dev), INFO (events), WARN (degraded), ERROR (failures)
- [ ] Child loggers carry request context automatically
- [ ] Log sampling for high-volume DEBUG/INFO in production

### Standard Log Schema
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "error",
  "service": "api-server",
  "version": "1.2.3",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": 12345,
  "method": "POST",
  "path": "/api/orders",
  "statusCode": 500,
  "duration": 145,
  "message": "Order creation failed",
  "error": {
    "type": "DatabaseError",
    "message": "Connection timeout",
    "code": "ECONNRESET"
  }
}
```

---

## OBS-002: No Application Performance Metrics

**Confidence**: 86 | **Stability**: Evolving | **Frequency**: Very Common

### Detection Logic
- No metrics endpoint (`/metrics`)
- No Prometheus, Datadog, or New Relic APM integration
- No alerting configured on response time degradation
- No dashboards showing request rate, error rate, latency (RED metrics)
- No tracking of business metrics (orders per minute, active users)

### Root Cause Pattern
Metrics infrastructure requires additional setup. "We can add monitoring later" — "later" is during an outage.

### Prevention Checklist
- [ ] RED metrics tracked per service: Rate, Errors, Duration
- [ ] P50/P95/P99 latency tracked per endpoint
- [ ] Error rate alert: > 1% errors triggers page
- [ ] Latency alert: P99 > 2x baseline triggers warning
- [ ] Business metric dashboards for SLA verification

### Remediation Strategy
```javascript
import promClient from 'prom-client';

// Collect default metrics (CPU, memory, event loop lag)
promClient.collectDefaultMetrics({ prefix: 'api_' });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Middleware to instrument all requests
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const labels = { method: req.method, route: req.route?.path || req.path, status_code: res.statusCode };
    end(labels);
    httpRequestTotal.inc(labels);
  });
  next();
});

// Expose metrics endpoint (restricted to internal)
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.send(await promClient.register.metrics());
});
```

---

## OBS-003: No Distributed Tracing

**Confidence**: 78 | **Stability**: Evolving | **Frequency**: High (critical for multi-service)

### Detection Logic
- No `traceparent` / `X-Trace-ID` header propagation between services
- No OpenTelemetry or Datadog tracing SDK
- Impossible to follow a single request across service calls
- Performance debugging requires guessing which service is slow

### Root Cause Pattern
Tracing is optional for monoliths — becomes critical once services multiply. Often neglected because it works fine in development.

### Risk Pattern
- Multi-service bugs impossible to debug without traces
- Performance regressions invisible (which service call added 500ms?)
- On-call engineers spend hours correlating logs manually during incidents

### Prevention Checklist
- [ ] OpenTelemetry SDK installed across all services
- [ ] `traceparent` header propagated on all inter-service calls
- [ ] Traces sent to Jaeger, Tempo, or Datadog
- [ ] Sampling rate configured (100% in staging, 10-20% in production)
- [ ] Database queries included in traces

### Remediation Strategy
```javascript
// OpenTelemetry setup (Node.js)
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  }),
  instrumentations: [
    new HttpInstrumentation(), // auto-instruments all HTTP calls
    new PgInstrumentation(),   // auto-instruments all DB queries
  ],
});

sdk.start(); // call before anything else
```

---

## OBS-004: No Alerting Configuration

**Confidence**: 88 | **Stability**: Permanent | **Frequency**: Very Common

### Detection Logic
- No PagerDuty / OpsGenie / alerting system integrated
- Prometheus rules file absent
- Datadog monitors not configured
- Team learns of outages from user reports or Twitter

### Root Cause Pattern
Alerting feels like "ops work" — developers skip it. Monitoring dashboards exist but no one watches them.

### Minimum Alert Set (Production Baseline)

```yaml
# Prometheus alerting rules
groups:
  - name: api_alerts
    rules:
      # Service down
      - alert: ServiceDown
        expr: up{job="api"} == 0
        for: 1m
        severity: critical

      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
        for: 2m
        severity: critical  # > 1% 5xx errors

      # High latency
      - alert: HighLatency
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        severity: warning  # P99 > 2 seconds

      # Database connection pool saturation
      - alert: DBPoolSaturation
        expr: db_pool_waiting > 5
        for: 1m
        severity: warning

      # Memory pressure
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / container_spec_memory_limit_bytes > 0.85
        for: 5m
        severity: warning
```
