# AGENTS.md

Living reference for future code generation in this repository.

## Scope

- Focus only on API routes, API validation schemas, and DB schemas.
- Ignore cron/scheduler parts unless explicitly requested.
- Treat these as the optimized baseline for new CRUD modules:
- `src/api/admin/doctor/doctor.routes.ts`
- `src/api/admin/doctor/doctor.schema.ts`

## Project Snapshot

- Runtime: Bun
- Framework: Elysia
- Validation/OpenAPI: Elysia `t` schemas
- DB layer: MongoDB + Mongoose + Typegoose

Current size (API/schema/model only):

- Admin route files: 40
- Admin schema files: 40
- Web route files: 2
- Web schema files: 2
- Webhook route files: 1
- Webhook schema files: 1
- Model files: 57

## API Mount Points

- Admin routes are mounted at `/admin` from `src/api/admin/admin.index.ts`.
- Web routes are mounted at `/v1-web` from `src/api/web/web.index.ts`.
- Webhook routes are mounted at `/webhook` from `src/api/webhook/webhook.index.ts`.

## Core Helpers and Conventions

Use these consistently in new routes:

- `createElysia(...)` from `src/utils/createElysia.ts`
- `R(...)` response helper from `src/utils/response-helpers.ts`
- `customError(...)` from `src/utils/AppErr.ts`
- `MetaPaginationSchema` from `src/utils/common.ts`

Response contract style:

- Success and handled errors should resolve to `{ status, message, data }`.
- List responses should also include `meta` with `{ pages, total, page, size }`.

## Auth and Permission Wiring (Important)

Admin auth is guard-driven:

- `beforeHandle: isAdminAuthenticated` from `src/guard/auth.guard.ts`

Module-based permission resolution:

- Route guard `detail.summary` should be `Summary([ModuleId.X])`.
- `Summary(...)` comes from `src/config/modules.ts`.
- `src/index.ts` builds `routeMap` from route summaries.
- `isAdminAuthenticated` reads module permissions and HTTP method ability.

Rule:

- For any admin route meant for non-super-admin roles, always include `Summary([ModuleId...])`.

## Optimized Baseline: Doctor Module

Reference:

- `src/api/admin/doctor/doctor.routes.ts`
- `src/api/admin/doctor/doctor.schema.ts`

Pattern to replicate:

1. Schema exports `meta` with `name`, `detail`, `module`.
2. Route prefix comes from `schema.meta.name`.
3. Guard detail tags come from `schema.meta.name`.
4. Guard summary comes from `schema.meta.module` via `Summary(...)`.
5. CRUD set is standardized:

- `GET /`
- `POST /`
- `PUT /`
- `GET /detail`
- `DELETE /`

6. Schema object has matching keys: `list`, `create`, `update`, `detail`, `delete`.
7. Schema `operationId` is explicit per operation.

Note:

- Doctor currently maps to `ModuleId.GAME_CATEGORY` (no dedicated doctor module id exists yet).

## Route Generation Rules for New Modules

When generating a new module, do this order:

1. Create/update DB model in `src/models/...` (or `src/models/clicknic/...`).
2. Create `<module>.schema.ts` with:

- `meta` object (`name`, `detail`, `module`)
- validators for `list/create/update/detail/delete`
- response envelopes using `status/message/data` and pagination `meta`

3. Create `<module>.routes.ts` with doctor-style guard and CRUD shape.
4. Register route in `src/api/admin/admin.index.ts`.
5. Keep route responses aligned with schema response definitions.

Implementation standards:

- Use `parseInt(query.page || "0")` and `parseInt(query.size || "10")`.
- Use `.skip(page * size).limit(size)` in paginated list handlers.
- Prefer `Promise.all([listQuery, countQuery])` for list + total.
- Prefer `findByIdAndUpdate(id, body, { new: true })` when returning updated data.
- Use `customError(...)` for business validation failures.

## Schema Generation Rules

- Keep one reusable detail schema per module.
- Reuse that detail schema in all responses instead of redefining variants.
- For file uploads, set `type: "multipart/form-data"` and use `t.File()` or `t.Files()`.
- Prefer shared pagination schema (`MetaPaginationSchema`) over local duplicates.
- Keep `operationId` values stable and descriptive.

## DB Schema Conventions

Use existing Typegoose style:

- Class + `@prop(...)` fields
- `@modelOptions({ schemaOptions: { collection, timestamps } })`
- `Ref<...>` relations with `@prop({ ref: () => Class })`
- `@index(...)` for critical uniqueness and query paths
- enum-driven status/type fields where relevant

Deletion strategy:

- Some models use soft delete (`deleted: boolean`).
- Some legacy routes still hard-delete (`findByIdAndDelete`).
- Prefer soft delete for transactional/audit-sensitive entities.

## Domain Model Map

Auth/RBAC/Tenant:

- `Admin`, `Role`, `Tenant`, `AdminRequest`, `AccessGrant`

Game core:

- `GameCategory`, `Game`, `GameTime`, `GameNumber`, `Result`, `Group`, `GroupGameTime`, `GroupAdmin`, `Notice`

Numbers and entries:

- `Numbers`, `NumbersEntry`, `NumberEntryTransection`, `NumberEntryShare`, `SpinnerMarket`
- `SattaEntry`, `SattaNumberEntry`, `SattaNumberEntryShare`, `SattaResult`
- `HisabCommision`, `JodiMixHisabCommision`

Wallet:

- `Wallet`, `WalletTransaction`, `WalletAllocation`, `WalletPlan`

User and verification:

- `User`, `Country`, `Category`, `Astrologer`, `Kyc`, `Bank`, `AstrologerInsights`, `AstroOrder`, `Client`

Ecommerce:

- `Product`, `ProductCategory`, `Cart`, `Order`, `Payment`, `Address`

clicknic:

- `clicknic/Clinic`, `clicknic/Doctor`, `clicknic/Patient`, `clicknic/AutoIncementalId`

Messaging and webhook:

- `Message`, `MessageQueue`, `MessageReactQueue`

## API Module Inventory

Admin modules under `src/api/admin`:

- `auth`, `roles`, `modules`, `admins`, `admin_requests`
- `doctor`
- `users`, `astrologers`, `verification`, `country`, `categories`, `client`
- `game-category`, `games`, `game-time`, `games-number`
- `group`, `group-admin`, `group-game-time`
- `numbers`, `numbers-entry`, `number-entry-share`
- `satta_entry`, `satta_number_entry`, `satta_number_entry_share`
- `spinner-market`, `spinner-result`, `spinner-dashboard`, `dashboard`, `home`
- `hisab-book`, `hisab-comission`
- `wallet`, `wallet-transaction`, `wallet_plans`
- ecommerce nested modules: `ecommerce/product`, `ecommerce/order`
- `setting`, `message`, `notice`

Web modules under `src/api/web`:

- `home`, `game-time`

Webhook modules under `src/api/webhook`:

- `wati`

## clicknic Notes

- Seeder (`src/db/seeder/index.ts`) guarantees a default clinic record.
- `Doctor` and `Patient` pre-save hooks assign default clinic if missing.
- `Clinic` pre-save hook assigns auto-increment id.
- Auto increment ids are managed by `clicknic/AutoIncementalId` + `GetAutoIncrId(...)`.
- Current `Patient` pre-save hook uses `AutoIncIdModel.CLINIC` instead of `PATIENT`; treat this as an existing inconsistency and verify before extending patient id logic.

## Legacy Inconsistencies to Avoid in New Code

- Pagination mistakes in old modules: `.limit(page)` instead of `.limit(size)`.
- Missing `{ new: true }` on many `findByIdAndUpdate` calls.
- Local copies of pagination schema instead of shared `MetaPaginationSchema`.
- Mixed naming styles across modules (snake_case / kebab-case / pluralization).
- Missing `Summary([ModuleId...])` in some admin routes.

## Minimal Templates

Schema template:

```ts
export default {
  meta: {
    name: "<module>",
    detail: DetailSchema,
    module: ModuleId.<MODULE_ID>,
  },
  list: { ... },
  create: { ... },
  update: { ... },
  detail: { ... },
  delete: { ... },
};
```

Route template:

```ts
export default createElysia({ prefix: schema.meta.name }).guard(
	{
		detail: {
			tags: [schema.meta.name],
			summary: Summary([schema.meta.module]),
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app
			.get("/", listHandler, schema.list)
			.post("/", createHandler, schema.create)
			.put("/", updateHandler, schema.update)
			.get("/detail", detailHandler, schema.detail)
			.delete("/", deleteHandler, schema.delete),
);
```

## Final Rule

For all future API generation in this repo:

- Start from doctor module structure.
- Keep schema and response contracts strict.
- Keep permission metadata complete.
- Keep DB writes aligned with model constraints.
- Do not use cron/scheduler code as reference unless explicitly requested.

<!-- code-review-graph MCP tools -->

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool                        | Use when                                               |
| --------------------------- | ------------------------------------------------------ |
| `detect_changes`            | Reviewing code changes — gives risk-scored analysis    |
| `get_review_context`        | Need source snippets for review — token-efficient      |
| `get_impact_radius`         | Understanding blast radius of a change                 |
| `get_affected_flows`        | Finding which execution paths are impacted             |
| `query_graph`               | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes`     | Finding functions/classes by name or keyword           |
| `get_architecture_overview` | Understanding high-level codebase structure            |
| `refactor_tool`             | Planning renames, finding dead code                    |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
