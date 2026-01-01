---
project_name: 'bpa-ai-native'
user_name: 'Moulaymehdi'
date: '2025-12-26'
status: complete
sections_completed:
  - technology_stack
  - language_rules
  - framework_rules
  - gdb_patterns
  - schema_migrations
  - analytics
  - audit_trail
existing_patterns_found: 39
legacy_gdb_validated: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Technology | Version | Critical Notes |
|------------|---------|----------------|
| **Node.js** | 20.9+ | Minimum required |
| **pnpm** | 9.15.0 | Package manager - DO NOT use npm/yarn |
| **Turborepo** | 2.3.0 | Monorepo orchestration |
| **Next.js** | 16.1 | App Router ONLY, use Turbopack |
| **React** | 19.2 | RSC default, Client for interactive |
| **NestJS** | 11.1.10 | Backend API framework |
| **Prisma** | 7.2.0 | ORM - requires TS 5.7+ |
| **TypeScript** | 5.7+ | Strict mode required |
| **PostgreSQL** | 16 | Primary database |
| **PostgREST** | 12.0.2 | Auto-generated REST API for GDB schema |
| **pgroll** | latest | Zero-downtime schema migrations (Apache 2.0) |
| **Redis** | 7-alpine | Sessions, cache, pub/sub |

### Form & Expression Engines

| Technology | Version | Purpose |
|------------|---------|---------|
| **JSON Forms** | latest | Form rendering with custom renderers |
| **JSONata** | latest | Formulas, transforms, calculations |
| **JSON Rules Engine** | latest | Visibility, routing, transitions |

### Auth & LLM

| Technology | Version | Purpose |
|------------|---------|---------|
| **Keycloak** | - | SSO with OAuth2 + PKCE |
| **LiteLLM** | latest | LLM gateway (Groq → Claude fallback) |

### Observability Stack (Zero Vendor Lock-in)

| Technology | Version | License | Purpose |
|------------|---------|---------|---------|
| **OpenTelemetry** | latest | Apache 2.0 | Standard protocol for traces/metrics |
| **OpenLLMetry** | latest | Apache 2.0 | LLM-specific OTel instrumentation |
| **Langfuse** | latest | MIT | Self-hosted LLM tracing (Docker) |
| **Prometheus** | latest | Apache 2.0 | Metrics collection & storage |
| **Grafana** | latest | AGPL 3.0 | Ops dashboards (optional) |
| **Chart.js** | 4.x | MIT | In-app metrics visualization |
| **react-chartjs-2** | 5.x | MIT | React wrapper for Chart.js |

### Version Constraints

- **Prisma 7 requires TypeScript 5.7+** - Do not downgrade
- **Next.js 16 uses "use cache" directive** - Not getStaticProps/getServerSideProps
- **React 19.2** - Use View Transitions for navigation animations
- **pnpm workspaces** - All package references use `workspace:*` protocol
- **OpenTelemetry** - All instrumentation must use OTel standard, not vendor-specific

---

## Critical Implementation Rules

### TypeScript Configuration

- **Strict mode required** - `"strict": true` in all tsconfig.json
- **No `any` types** - Use `unknown` with type guards instead
- **Explicit return types** - All exported functions must have explicit return types
- **No implicit `this`** - Arrow functions for callbacks
- **Null checks** - Use optional chaining (`?.`) and nullish coalescing (`??`)

### Import/Export Patterns

```typescript
// ✅ Named exports for utilities
export { formatDate } from './formatDate';
export { parseSchema } from './parseSchema';

// ✅ Default export ONLY for React components
export default function ServiceCard() {}

// ❌ WRONG: Barrel exports with side effects
export * from './utils'; // Avoid - breaks tree shaking

// ✅ Explicit barrel exports
export { formatDate, parseSchema } from './utils';
```

### Error Handling Patterns

```typescript
// ✅ Typed errors with discriminated unions
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// ✅ Async error handling
try {
  const result = await api.services.create(data);
} catch (error) {
  if (error instanceof ApiException) {
    // Handle known API errors
  }
  throw error; // Re-throw unknown errors
}

// ❌ WRONG: Swallowing errors
catch (error) {
  console.log(error); // Never just log and continue
}
```

### Async/Await Patterns

- **Always use async/await** - No raw Promises with `.then()`
- **Parallel execution** - Use `Promise.all()` for independent async operations
- **No floating promises** - All promises must be awaited or explicitly voided
- **AbortController** - Use for cancellable operations (LLM streaming)

```typescript
// ✅ Parallel independent operations
const [services, forms] = await Promise.all([
  api.services.list(),
  api.forms.list(serviceId),
]);

// ✅ Cancellable streaming
const controller = new AbortController();
const stream = await llm.stream({ signal: controller.signal });
```

---

### JSONata Expression Engine

**Security:**
- JSONata expressions are sandboxed - no arbitrary JS execution
- ⚠️ `$match()` function can leak memory - avoid in loops
- Always compile once, evaluate many times

**Compilation & Caching:**
```typescript
// packages/expressions/src/jsonata/compiler.ts
const expressionCache = new Map<string, jsonata.Expression>();

export function getCompiledExpression(expr: string): jsonata.Expression {
  if (!expressionCache.has(expr)) {
    expressionCache.set(expr, jsonata(expr));
  }
  return expressionCache.get(expr)!;
}

// Evaluate with timeout protection
export async function evaluateSafely(
  expr: string,
  data: unknown,
  timeoutMs = 5000
): Promise<unknown> {
  const compiled = getCompiledExpression(expr);
  return Promise.race([
    compiled.evaluate(data),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('JSONata timeout')), timeoutMs)
    ),
  ]);
}
```

**Custom Functions:**
```typescript
const expr = jsonata('$formatCurrency(amount)');
expr.registerFunction('formatCurrency', (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}, '<n:s>'); // signature: number -> string
```

---

### JSON Rules Engine

**NestJS Service Pattern:**
```typescript
@Injectable()
export class RulesEngineService {
  private engine: Engine;

  async loadRules(serviceId: string): Promise<void> {
    const rules = await this.prisma.visibilityRule.findMany({
      where: { formId: serviceId },
    });
    rules.forEach(rule => this.engine.addRule(this.toEngineRule(rule)));
  }

  // Dynamic facts for real-time external data
  async evaluate(facts: Record<string, unknown>): Promise<EngineResult> {
    this.engine.addFact('externalData', async (params, almanac) => {
      const fieldValue = await almanac.factValue(params.field);
      return this.fetchExternalData(fieldValue);
    });
    return this.engine.run(facts);
  }
}
```

---

### JSON Forms Custom Renderers

**Renderer Pattern:**
```typescript
'use client';

import { withJsonFormsControlProps, ControlProps } from '@jsonforms/react';
import { rankWith, scopeEndsWith } from '@jsonforms/core';

export function CurrencyControl({ data, handleChange, path }: ControlProps) {
  return (
    <input
      type="number"
      value={data ?? ''}
      onChange={(e) => handleChange(path, parseFloat(e.target.value))}
    />
  );
}

export const currencyTester = rankWith(3, scopeEndsWith('amount'));
export default withJsonFormsControlProps(CurrencyControl);
```

**Performance - Memoize props:**
```typescript
const stableSchema = useMemo(() => schema, [schema.version]);
const stableUiSchema = useMemo(() => uiSchema, [uiSchema.version]);
```

---

### Keycloak Authentication (PKCE)

**Next.js 16 App Router + Auth.js:**
```typescript
// lib/auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      // No clientSecret for PKCE public client
      issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
    }),
  ],
});
```

**Token Lifetime:**
- Access token: 5-15 minutes
- Refresh token: 1 day - 1 month
- Auto-refresh before expiry

---

### LLM Streaming (LiteLLM)

**⚠️ Known Issue:** Fallbacks may NOT work with `stream=True` - implement manual fallback

**NestJS SSE Two-Step Pattern:**
```typescript
// Step 1: Create stream session (POST)
@Post('generate')
async createStream(@Body() dto: GenerateDto): Promise<{ streamId: string }> {
  const streamId = randomUUID();
  await this.cache.set(`stream:${streamId}`, dto, 300_000);
  return { streamId };
}

// Step 2: SSE endpoint (GET)
@Sse('stream/:id')
stream(@Param('id') streamId: string): Observable<MessageEvent> {
  return new Observable((subscriber) => {
    this.processStreamWithFallback(streamId, subscriber);
  });
}
```

**Manual Fallback Pattern:**
```typescript
try {
  // Try Groq first
  const stream = await this.litellm.stream({ model: 'groq/llama-3.1-70b', ... });
} catch (error) {
  // Fallback to Claude
  const stream = await this.litellm.stream({ model: 'claude-3-5-sonnet', ... });
}
```

---

### GDB (Generic Database) & PostgREST

**Architecture:** Dual-schema pattern with typed table generation

```
┌──────────────────────────────────────────────────────────────────┐
│                        PostgreSQL 16                              │
│  ┌─────────────────────┐  ┌────────────────────────────────────┐ │
│  │   public schema     │  │           gdb schemas               │ │
│  │   (Prisma ORM)      │  │                                    │ │
│  │                     │  │  gdb_meta: schema definitions      │ │
│  │ - services          │  │  gdb_data: typed tables (generated)│ │
│  │ - forms             │  │  gdb_stats: materialized views     │ │
│  │ - workflows         │  │                                    │ │
│  │ - users             │  │  + pgroll for migrations           │ │
│  └─────────────────────┘  └────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**When to use which:**
- **Prisma (public schema)**: Core app logic, workflows, forms, BOT
- **PostgREST (gdb_data schema)**: External registries via auto-generated typed tables

---

### Legacy GDB Architecture (Reference)

Understanding the legacy system helps avoid its pitfalls:

```python
# Legacy GDB stores ALL data in a single JSONB column
class Data(models.Model):
    content = JSONBField()  # ← All registry data here

# Denormalized "index" tables for searching (requires JOINs)
class DataContentText(models.Model):
    data = ForeignKey(Data)      # ← JOIN required
    field = ForeignKey(Field)    # ← Another JOIN
    value = TextField()          # ← Finally the searchable value
```

**Why legacy GDB is slow:**
- Every query needs JOINs across content tables
- No native PostgreSQL query optimization
- Aggregations require scanning all denormalized tables

**What legacy GDB does well (preserve this):**
- Field `$id` mapping: Each schema field has stable ID for data migration
- Schema versioning: Draft → Published workflow
- Data migration: Uses field IDs, not paths (survives renames)

---

### GDB Schema Design (Typed Table Generation)

**Key Principle:** Schema stored as JSON, but DATA stored in typed PostgreSQL tables.

**Schema Metadata Tables:**
```sql
CREATE SCHEMA IF NOT EXISTS gdb_meta;

-- Registry definitions (like legacy Database model)
CREATE TABLE gdb_meta.registries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,           -- 'companies_syria', 'permits_kenya'
  name TEXT NOT NULL,
  schema JSONB NOT NULL,               -- Field definitions with $id
  version DECIMAL(5,1) NOT NULL,
  is_draft BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Field ID mapping (preserves legacy GDB's $id approach)
CREATE TABLE gdb_meta.field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_id UUID REFERENCES gdb_meta.registries(id),
  field_id TEXT NOT NULL,              -- Stable field identifier (like $id)
  column_name TEXT NOT NULL,           -- PostgreSQL column name
  field_type TEXT NOT NULL,            -- 'text', 'integer', 'boolean', etc.
  is_indexed BOOLEAN DEFAULT false,
  UNIQUE (registry_id, field_id)
);
```

**Generated Typed Tables (per registry):**
```sql
CREATE SCHEMA IF NOT EXISTS gdb_data;

-- Example: Generated from "companies_syria" schema
-- NOT manually created - generated by Schema Generator Service
CREATE TABLE gdb_data.companies_syria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Typed columns generated from schema
  name TEXT NOT NULL,                  -- field_id: 'f_001'
  registration_number TEXT UNIQUE,     -- field_id: 'f_002'
  address TEXT,                        -- field_id: 'f_003'
  phone TEXT,                          -- field_id: 'f_004'
  email TEXT,                          -- field_id: 'f_005'
  is_active BOOLEAN DEFAULT true,      -- field_id: 'f_006'
  sector TEXT,                         -- field_id: 'f_007' (catalog)

  -- Nested/complex fields stay as JSONB
  employees JSONB,                     -- field_id: 'f_008' (array of objects)
  company_block JSONB,                 -- field_id: 'f_009' (nested block)

  -- System columns
  tenant_id UUID NOT NULL,
  registry_number TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Auto-generated indexes for searchable fields
CREATE INDEX idx_companies_syria_name ON gdb_data.companies_syria (name);
CREATE INDEX idx_companies_syria_sector ON gdb_data.companies_syria (sector);
CREATE INDEX idx_companies_syria_tenant ON gdb_data.companies_syria (tenant_id);
```

**Type Mapping (Schema Field → PostgreSQL Column):**
```typescript
// apps/api/src/gdb/type-mapper.ts
const GDB_TYPE_MAP: Record<string, string> = {
  'string': 'TEXT',
  'text': 'TEXT',
  'number': 'NUMERIC',
  'integer': 'INTEGER',
  'boolean': 'BOOLEAN',
  'date': 'DATE',
  'datetime': 'TIMESTAMPTZ',
  'catalog': 'TEXT',           // + FK constraint to catalog table
  'catalogs': 'TEXT[]',        // Array of catalog values
  'file': 'UUID',              // FK to files table
  'files': 'UUID[]',           // Array of file references
  'block': 'JSONB',            // Nested structures stay JSONB
  'array': 'JSONB',            // Arrays of objects stay JSONB
};
```

**Entity Relationships:**
```sql
CREATE TABLE gdb.entity_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES gdb.entities(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES gdb.entities(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,         -- 'owns', 'issued_to', 'certified_for'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (parent_id, child_id, relation_type)
);
CREATE INDEX idx_relations_parent ON gdb.entity_relations (parent_id);
CREATE INDEX idx_relations_child ON gdb.entity_relations (child_id);
```

---

### PostgREST Integration

**Docker Compose:**
```yaml
# docker-compose.yml
services:
  postgrest:
    image: postgrest/postgrest:v12.0.2
    environment:
      PGRST_DB_URI: postgres://postgrest_user:${DB_PASSWORD}@db:5432/bpa
      PGRST_DB_SCHEMA: gdb
      PGRST_DB_ANON_ROLE: gdb_anon
      PGRST_JWT_SECRET: ${JWT_SECRET}  # Same as Keycloak
      PGRST_OPENAPI_SERVER_PROXY_URI: http://localhost:3001
    ports:
      - "3001:3000"
    depends_on:
      - db
```

**Database Roles (Row Level Security):**
```sql
-- Create roles
CREATE ROLE gdb_anon NOLOGIN;
CREATE ROLE gdb_user NOLOGIN;
CREATE ROLE postgrest_user LOGIN PASSWORD 'secure_password';

GRANT gdb_anon TO postgrest_user;
GRANT gdb_user TO postgrest_user;

-- Grant permissions
GRANT USAGE ON SCHEMA gdb TO gdb_anon, gdb_user;
GRANT SELECT ON ALL TABLES IN SCHEMA gdb TO gdb_anon;
GRANT ALL ON ALL TABLES IN SCHEMA gdb TO gdb_user;

-- Row Level Security
ALTER TABLE gdb.entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON gdb.entities
  USING (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid);

CREATE POLICY entity_read ON gdb.entities FOR SELECT
  USING (true);  -- All authenticated users can read

CREATE POLICY entity_write ON gdb.entities FOR ALL
  USING (tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid);
```

**NestJS Proxy Pattern (auth passthrough):**
```typescript
// apps/api/src/gdb/gdb-proxy.controller.ts
@Controller('gdb')
@UseGuards(JwtAuthGuard)
export class GdbProxyController {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  @All('*')
  async proxy(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const postgrestUrl = this.config.get('POSTGREST_URL');
    const path = req.url.replace('/gdb', '');

    // Forward JWT token for RLS
    const response = await this.httpService.axiosRef({
      method: req.method,
      url: `${postgrestUrl}${path}`,
      headers: {
        Authorization: req.headers.authorization,
        'Content-Type': 'application/json',
        Prefer: req.headers.prefer || 'return=representation',
      },
      data: req.body,
      params: req.query,
    });

    res.status(response.status).json(response.data);
  }
}
```

**Frontend Usage:**
```typescript
// packages/ui/src/hooks/useGdbQuery.ts
export function useGdbEntities(entityType: string) {
  return useQuery({
    queryKey: ['gdb', 'entities', entityType],
    queryFn: async () => {
      const res = await fetch(
        `/api/gdb/entities?entity_type=eq.${entityType}&order=created_at.desc`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return res.json();
    },
  });
}

// Usage in component
const { data: companies } = useGdbEntities('company');
```

---

### Schema Migrations with pgroll

**pgroll** handles zero-downtime schema changes when users modify registry schemas.

**Why pgroll (not raw ALTER TABLE):**
- Zero downtime: Old and new schema versions work simultaneously
- Automatic rollback: Instant revert if migration fails
- Data transformation: `up`/`down` SQL expressions handle type changes
- Preserves field IDs: Works with legacy GDB's `$id` mapping approach

**Docker Compose:**
```yaml
# docker-compose.yml
services:
  pgroll:
    image: xataio/pgroll:latest
    environment:
      PGROLL_PG_URL: postgres://user:pass@db:5432/bpa
    volumes:
      - ./migrations/gdb:/migrations
    depends_on:
      - db
```

**Migration Workflow:**

```
┌─────────────────────────────────────────────────────────────────┐
│  User edits schema in GDB Admin UI                              │
│  (adds "email" field, changes "phone" Text → Integer)           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Schema Diff Service (NestJS)                                   │
│  - Compares draft schema vs published schema                    │
│  - Generates pgroll migration JSON                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  pgroll start migration                                         │
│  - Creates shadow columns                                       │
│  - Sets up dual-write triggers                                  │
│  - Creates views: companies_syria@v1.0, companies_syria@v1.1    │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┴───────────────────┐
         │      MIGRATION IN PROGRESS            │
         │  Old clients → @v1.0 view (works!)    │
         │  New clients → @v1.1 view (works!)    │
         └───────────────────┬───────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  pgroll complete migration                                      │
│  - Drops old columns                                            │
│  - Renames shadow columns                                       │
│  - Updates PostgREST schema cache                               │
└─────────────────────────────────────────────────────────────────┘
```

**Migration File Format:**
```json
{
  "name": "02_add_email_change_phone",
  "operations": [
    {
      "add_column": {
        "table": "companies_syria",
        "column": {
          "name": "email",
          "type": "text",
          "nullable": true
        }
      }
    },
    {
      "alter_column": {
        "table": "companies_syria",
        "column": "phone",
        "type": "integer",
        "up": "CASE WHEN phone ~ '^[0-9]+$' THEN phone::integer ELSE NULL END",
        "down": "phone::text"
      }
    }
  ]
}
```

**NestJS Schema Diff Service:**
```typescript
// apps/api/src/gdb/schema-diff.service.ts
@Injectable()
export class GdbSchemaDiffService {

  generateMigration(
    oldSchema: GdbSchema,
    newSchema: GdbSchema,
  ): PgrollMigration {
    const operations: PgrollOperation[] = [];

    // Find added fields
    for (const field of newSchema.fields) {
      const oldField = oldSchema.fields.find(f => f.id === field.id);
      if (!oldField) {
        operations.push({
          add_column: {
            table: newSchema.tableName,
            column: {
              name: field.columnName,
              type: this.mapType(field.type),
              nullable: !field.required,
            },
          },
        });
      }
    }

    // Find removed fields
    for (const oldField of oldSchema.fields) {
      const newField = newSchema.fields.find(f => f.id === oldField.id);
      if (!newField) {
        operations.push({
          drop_column: {
            table: oldSchema.tableName,
            column: oldField.columnName,
          },
        });
      }
    }

    // Find type changes
    for (const newField of newSchema.fields) {
      const oldField = oldSchema.fields.find(f => f.id === newField.id);
      if (oldField && oldField.type !== newField.type) {
        operations.push({
          alter_column: {
            table: newSchema.tableName,
            column: oldField.columnName,
            type: this.mapType(newField.type),
            up: this.generateUpCast(oldField.type, newField.type),
            down: this.generateDownCast(newField.type, oldField.type),
          },
        });
      }
    }

    return { name: `${Date.now()}_schema_update`, operations };
  }
}
```

**Rollback Capability:**
```bash
# If migration fails or needs rollback
pgroll rollback --schema gdb_data

# pgroll automatically:
# - Drops shadow columns
# - Removes dual-write triggers
# - Restores original table structure
```

---

### GDB Analytics (Materialized Views)

**Daily Registration Stats:**
```sql
CREATE MATERIALIZED VIEW gdb.daily_stats AS
SELECT
  date_trunc('day', created_at) AS day,
  entity_type,
  tenant_id,
  count(*) AS registrations,
  count(*) FILTER (WHERE metadata->>'status' = 'approved') AS approved,
  count(*) FILTER (WHERE metadata->>'status' = 'rejected') AS rejected,
  count(*) FILTER (WHERE metadata->>'status' = 'pending') AS pending
FROM gdb.entities
WHERE created_at > now() - INTERVAL '90 days'
GROUP BY 1, 2, 3;

CREATE UNIQUE INDEX idx_daily_stats ON gdb.daily_stats (day, entity_type, tenant_id);

-- Refresh every hour via pg_cron
SELECT cron.schedule('refresh-gdb-stats', '0 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY gdb.daily_stats');
```

**Entity Type Distribution:**
```sql
CREATE MATERIALIZED VIEW gdb.entity_distribution AS
SELECT
  entity_type,
  tenant_id,
  count(*) AS total,
  count(*) FILTER (WHERE created_at > now() - INTERVAL '30 days') AS last_30_days,
  count(*) FILTER (WHERE created_at > now() - INTERVAL '7 days') AS last_7_days
FROM gdb.entities
GROUP BY 1, 2;
```

**NestJS Analytics Endpoint:**
```typescript
// apps/api/src/gdb/gdb-analytics.controller.ts
@Controller('gdb/analytics')
@UseGuards(JwtAuthGuard)
export class GdbAnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('daily')
  async getDailyStats(
    @Query('days') days = 30,
    @CurrentUser() user: User,
  ): Promise<DailyStatsDto[]> {
    return this.prisma.$queryRaw`
      SELECT day, entity_type, registrations, approved, rejected, pending
      FROM gdb.daily_stats
      WHERE tenant_id = ${user.tenantId}
        AND day > now() - ${days}::int * INTERVAL '1 day'
      ORDER BY day DESC
    `;
  }

  @Get('distribution')
  async getDistribution(@CurrentUser() user: User): Promise<DistributionDto[]> {
    return this.prisma.$queryRaw`
      SELECT entity_type, total, last_30_days, last_7_days
      FROM gdb.entity_distribution
      WHERE tenant_id = ${user.tenantId}
    `;
  }
}
```

**Chart.js Integration:**
```typescript
// apps/web/src/components/analytics/RegistrationChart.tsx
'use client';

import { Line } from 'react-chartjs-2';
import { useGdbAnalytics } from '@/hooks/useGdbAnalytics';

export function RegistrationChart() {
  const { data: stats } = useGdbAnalytics('daily', { days: 30 });

  const chartData = {
    labels: stats?.map(s => s.day) ?? [],
    datasets: [
      {
        label: 'Registrations',
        data: stats?.map(s => s.registrations) ?? [],
        borderColor: 'rgb(59, 130, 246)',
        tension: 0.1,
      },
      {
        label: 'Approved',
        data: stats?.map(s => s.approved) ?? [],
        borderColor: 'rgb(34, 197, 94)',
        tension: 0.1,
      },
    ],
  };

  return <Line data={chartData} options={{ responsive: true }} />;
}
```

---

### GDB Audit Trail

**Automatic Audit Logging:**
```sql
CREATE TABLE gdb.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  operation TEXT NOT NULL,  -- 'INSERT', 'UPDATE', 'DELETE'
  old_data JSONB,
  new_data JSONB,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Trigger function
CREATE OR REPLACE FUNCTION gdb.audit_trigger() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO gdb.audit_log (entity_id, operation, old_data, new_data, changed_by)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
    (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER entities_audit
  AFTER INSERT OR UPDATE OR DELETE ON gdb.entities
  FOR EACH ROW EXECUTE FUNCTION gdb.audit_trigger();
```

---

## Domain Implementation Rules

These rules govern how BPA domain entities should be implemented. They derive from the legacy BPA system patterns documented in `_bmad-output/analysis/bpa-api-mental-model-analysis.md`.

### Non-Negotiable Rules

1. **Never change 4-Status codes** — They're hardcoded in legacy systems
   ```
   PENDING=0, PASSED=1, RETURNED=2, REJECTED=3
   ```

2. **Keep Service/Registration separation** — Fundamental to the domain model
   - Service = Configuration container (owns forms, roles, bots, determinants)
   - Registration = Authorization container (what applicants apply for)

3. **Use contract-based BOT mapping** — NOT type-based implementations
   - Bots use InputMapping (form → request) and OutputMapping (response → form)
   - Enables plug & play: AI agents, payment processors, legacy APIs all use same contract

4. **Localize all user-facing strings** — name, shortName, description
   - Follow legacy translation listener architecture
   - Store localized strings in separate translation system

5. **Implement full audit trail** — every change tracked with user/timestamp
   - `createdAt`, `updatedAt`, `createdBy` on all entities
   - Consider Prisma middleware or triggers for automatic tracking

### Data Storage Strategy

**USE JSON FOR: Configuration Expressions**

| Data Type | Reason | Field Example |
|-----------|--------|---------------|
| Form schemas | JSON Schema standard (JSON Forms requires it) | `Form.schema` |
| Visibility rules | Dynamic expressions evaluated at runtime | `FormField.visibilityRule` |
| Condition expressions | JSON Rules Engine evaluates these | `Role.conditions` |
| Field-specific properties | Type-varies (min, max, options, etc.) | `FormField.properties` |
| Template configs | Nested snapshot structures | `ServiceTemplate.config` |

**USE RELATIONAL TABLES FOR: Entity Relationships**

| Data Type | Reason | Table Example |
|-----------|--------|---------------|
| Bot field mappings | Queryable, need FK validation, indexed | `BotMapping` |
| Role-Registration bindings | Join table with referential integrity | `RoleRegistration` |
| Role-Institution assignments | Join table with constraints | `RoleInstitution` |
| Document requirements | Template + link pattern | `DocumentRequirement` |
| Costs | Queryable, aggregatable | `Cost` |

**Rationale**: This follows Architecture "Pattern 3: JSON as Schema Carrier" AND "Pattern 5: Cross-Cutting Relationships via Join Tables" — these patterns coexist:

- **Expressions** (conditions, visibility) → JSON (flexible, evaluated at runtime)
- **Relationships** (mappings, bindings) → Relational (queryable, validated, FK constraints)

### What NOT to Reinvent

| Pattern | Status | Notes |
|---------|--------|-------|
| 4-Status Model | Use as-is | Universal workflow grammar |
| Service/Registration separation | Keep distinction | Core domain model |
| Role inheritance (User/Bot) | Proven pattern | Use discriminator `roleType` |
| Contract-based BOT I/O | Enables extensibility | Already relational in our schema |
| Status destination routing | Proven pattern | `WorkflowTransition` model |

### What TO Transform

| Legacy | AI-Native | Notes |
|--------|-----------|-------|
| Formio forms | JSON Forms + LLM generation | Conversational interface |
| Field-based determinants | Natural language conditions | LLM-evaluable |
| Fixed role sequences | Dynamic context routing | AI-powered decisions |
| Static catalogs | AI-augmented lookups | Dynamic classification |

### Field Reference Consistency

When fields are referenced in expressions (formulas, conditions, visibility rules), we use a **hybrid data-first approach**:

1. **Stable Field IDs**: Each `FormField` has an immutable `fieldId` (like legacy `$id`)
2. **Reference Registry**: `field_references` table auto-populated by database triggers
3. **FK Constraint**: Delete blocked at database level (`ON DELETE RESTRICT`)
4. **Expression Validation**: Triggers validate references exist on save

**Expression syntax**: `$field.f_abc123` (not mutable field names)

**Conceptual Model (Compilation Analogy)**:

| Compiler Concept | Our System | When |
|------------------|------------|------|
| Symbol → Address | `name` → `fieldId` | Expression authored |
| Symbol Table | `field_references` | Triggers sync on save |
| Compile Error | `INVALID_FIELD_REFS` | Save with bad reference |
| Linker Error | `FIELD_IN_USE` | Delete referenced field |

This enables IDE-like tooling: Find All References, Safe Rename, Safe Delete.

See [ADR-001: Field Reference Consistency](./adrs/001-field-reference-consistency.md) for full details.

---

## Architecture Decision Records

Significant technical decisions are documented in `_bmad-output/adrs/`:

| ADR | Title | Status |
|-----|-------|--------|
| [001](./adrs/001-field-reference-consistency.md) | Field Reference Consistency Strategy | Accepted |

---

