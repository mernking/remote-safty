Nice brief — I dug into best practices and current tooling and wrote a complete, dev-ready **Next.js** project description you can hand to Gemini (or copy into your repo). It includes routes (UI + API), a Prisma/SQLite schema, sync design (offline-first), conflict rules, attachments strategy, security notes, sample payloads, and the Tailwind color tokens you requested.

Where helpful I cite authoritative/modern sources on offline sync, PWA/service-worker patterns, Prisma+SQLite, resumable uploads, and CRDT/conflict ideas. Use this as the single-source spec to generate code with Gemini or start implementing.

---

# Remote Jobsite Safety Compliance App — Project Spec (vite.js + Prisma(SQLITE) + Tailwind)

## One-line

Mobile-first offline-capable PWA for Safety Managers and Site Supervisors to run structured equipment checks, log incidents and toolbox talks, and produce auditable compliance records that sync automatically when connectivity returns.

---

## Tech stack (recommended)

- Frontend: Next.js (Pages or App Router) — mobile-first PWA
- Styling: Tailwind (you handle setup). Color tokens below.
- Local client DB: IndexedDB (Dexie.js) or PouchDB for local storage/queue
- Sync: service-worker background-sync + queued REST sync; resumable uploads via tus (or chunked POST) for photos/videos.
- Backend: Next.js API routes (Node) + Prisma ORM + SQLite (initial / dev). Move to Postgres for production scale.
- Auth: JWT + refresh tokens, optional SSO (OIDC/SAML) later.
- File storage: cloud object store (S3-compatible) or local server storage (signed URLs). Use server-side encryption for sensitive attachments.
- Optional libs: Workbox (service worker helper), tus-js-client (resumable uploads), Dexie.js (IndexedDB queue), Automerge/Yjs (only if you need CRDT merging). ([FreeCodeCamp][1])

---

## Goals & constraints

- **Offline-first**: app must fully function offline (create inspections, record incidents, take photos, fill forms).
- **Guaranteed delivery**: queued local actions must retry & resume uploads when connectivity restored.
- **Auditable**: immutable audit logs, change history, user/role attribution, tamper-evident metadata.
- **Lightweight**: initial DB is SQLite with Prisma for quick setup; design must make a later migration to Postgres trivial.
- **Mobile-first UX**: big buttons, camera integration, offline sync status, low-bandwidth operation.

---

## High-level architecture & sync model

1. **Local store**: Use IndexedDB (Dexie) to store the canonical client-side models and a `sync_queue` table of operations (create/update/delete) with UUIDs and timestamps. Alternatively PouchDB if you plan to use CouchDB-style replication. PouchDB gives built-in replication but requires CouchDB-like server or extra server adapter. ([PouchDB][2])

2. **Service worker + Background Sync**: Register sync events for reliable background pushes when connectivity returns. Use Workbox to simplify caching and background-sync registration. For large files (photos or video) use tus/resumable uploads to avoid re-transmitting partial uploads. ([FreeCodeCamp][1])

3. **Sync API**: Server exposes a `POST /api/v1/sync/push` that accepts batched operations (JSON ops) and `/api/v1/sync/ack` to confirm server-assigned canonical IDs/versions. Attachments are handled via resumable upload endpoints (tus) or chunked uploads; a metadata entry is created first in the push batch with a localAttachmentId; once file upload completes, server marks it attached.

4. **Conflict handling**: default to explicit, field-level policies:

   - For most inspection logs and incidents: **last-writer-wins (LWW)** on `updatedAt` with server authoritative timestamps and a version number. Keep original client meta for audit and to allow manual merge if LWW would lose critical info.
   - For safety-critical fields (e.g., incident severity, injury count) require server-side merge or human review: server flags conflicts and creates a `merge_task` assigned to a manager. Consider storing old + new versions for audit. If you need automatic conflict-free merging for collaborative fields, consider CRDT libs (Automerge/Yjs). ([stack.convex.dev][3])

5. **Audit trail**: Every accepted change creates an `AuditLog` entry (user, action, entity, diff, timestamp). Audit logs are append-only (logical immutability). Keep snapshots for legal compliance.

6. **Scalability**: SQLite is for dev and small sites. It has writer concurrency limitations; recommend Postgres for production. Document migration path in README. ([robinwieruch.de][4])

---

## Routes — UI routes (pages) (mobile-first)

- `/` — Landing / quick actions (Start inspection, Log incident, Toolbox talk)
- `/login` — Auth (email/password, SSO)
- `/dashboard` — Overview: active sites, sync status, outstanding actions
- `/sites` — List of sites / jobs
- `/sites/[siteId]` — Site detail (maps basic info, crew on site, latest inspections)
- `/inspections` — All inspections
- `/inspections/new` — Create inspection (select site/equipment, checklist)
- `/inspections/[id]` — Inspection detail, attachments, history
- `dashboard/incidents` — All incidents / near-misses
- `dashboard/incidents/new` — Log incident (severity, witnesses, photos, location)
- `dashboard/incidents/[id]` — Incident detail, CAPA tasks, audit trail
- `/toolbox-talks` — Create/view toolbox talks (attendance capture)
- `/users` — User list and management (mobile simplified)
- `/settings` — App & site settings (sync frequency, offline retention)
- `/sync-status` — Advanced sync queue view (queued items, retry, force sync)
- `/reports` — Generate/export reports (PDF/CSV)
- `/attachments/:id` — Attachment serving (signed URL redirect)

---

## API routes (REST, versioned) — path and behavior

Base: `/api/v1/...`

### Auth

- `POST /api/v1/auth/login` — { email, password } → { accessToken, refreshToken, user }
- `POST /api/v1/auth/refresh` — { refreshToken } → new tokens
- `POST /api/v1/auth/logout` — invalidate refresh token

### Sync & items

- `POST /api/v1/sync/push` — batch push of queued client operations:

  - payload: `{ clientId, ops: [{ opId, opType, entity, payload, localId, timestamp, attachmentsMeta }] }`
  - returns per-op status (accepted / conflict / error), serverId/version for each accepted op.

- `POST /api/v1/sync/ack` — client confirms server IDs
- `GET /api/v1/sync/pull?since=<iso>` — receive changes since last sync (for clients that pulled)
- `GET /api/v1/sync/status` — server-side sync health

### CRUD for master data (used by sync and direct)

- `GET /api/v1/sites`, `GET /api/v1/sites/:id`, `POST /api/v1/sites`, `PUT /api/v1/sites/:id`, `DELETE /api/v1/sites/:id`
- Similar for `inspections`, `incidents`, `toolbox-talks`, `users`, `audit-logs` (read-only for most roles)

### Attachments and uploads

- `POST /api/v1/attachments/init` — create metadata placeholder → returns upload endpoints (tus URL or chunk POST URL)
- `POST /api/v1/attachments/complete` — finalize and attach to entity (server verifies checksum/size)
- `GET /api/v1/attachments/:id` — signed URL or redirect; requires auth/authorization

### Admin & reports

- `GET /api/v1/reports/export?type=csv|pdf&from=...&to=...&siteId=...`
- `GET /api/v1/audit-logs?entity=...&since=...`

---

## Prisma schema (SQLite) — core models (abridged)

Below is a compact Prisma schema for SQLite; you can expand fields as needed.

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL") // file: ./dev.db
}

model User {
  id          String   @id @default(uuid())
  email       String   @unique
  name        String?
  password    String   // hashed
  role        Role     @default(SUPERVISOR)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  inspections Inspection[] @relation("inspector")
  auditLogs   AuditLog[]
}

enum Role {
  ADMIN
  SAFETY_MANAGER
  SUPERVISOR
  WORKER
}

model Site {
  id          String   @id @default(uuid())
  name        String
  lat         Float?
  lng         Float?
  address     String?
  meta        Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  inspections Inspection[]
  incidents   Incident[]
}

model Inspection {
  id             String   @id @default(uuid())
  siteId         String
  site           Site     @relation(fields: [siteId], references: [id])
  createdById    String
  createdBy      User     @relation("inspector", fields: [createdById], references: [id])
  checklist      Json     // structured checklist + answers
  status         String   // e.g., completed, draft
  localClientId  String?  // client's local UUID for sync mapping
  version        Int      @default(1)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  attachments    Attachment[]
  auditLogs      AuditLog[]
}

model Incident {
  id             String   @id @default(uuid())
  siteId         String
  site           Site     @relation(fields: [siteId], references: [id])
  reportedById   String
  reportedBy     User     @relation(fields: [reportedById], references: [id])
  type           String
  severity       Int
  description    String?
  location       Json?    // coordinates or free text
  localClientId  String?
  version        Int      @default(1)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  attachments    Attachment[]
  auditLogs      AuditLog[]
}

model Attachment {
  id           String   @id @default(uuid())
  filename     String
  mimeType     String
  size         Int
  storagePath  String   // object store key or server path
  uploaded     Boolean  @default(false)
  checksum     String?
  createdById  String
  createdBy    User     @relation(fields: [createdById], references: [id])
  createdAt    DateTime @default(now())
  linkedEntity String?  // e.g., "Inspection" or "Incident"
  linkedId     String?  // entity id
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  action     String   // CREATE/UPDATE/DELETE/SYNC
  entity     String
  entityId   String
  payload    Json?    // diff or snapshot
  createdAt  DateTime @default(now())
}
```

**Notes:**

- `localClientId` stores the client-generated UUID so sync mapping can map local items to server IDs.
- `version` increments each server-accepted change to help conflict detection.

---

## Client-side DB schema (IndexedDB via Dexie) — suggested tables

- `users`, `sites`, `inspections`, `incidents`, `attachments` (mirror of server)
- `sync_queue` — entries: `{ opId, opType, entity, payload, localId, status, attempts, createdAt }`
- `uploads` — resumable upload state `{ uploadId, attachmentLocalId, offset, tusUrl, status }`
- `sync_meta` — `{ lastPulledAt, lastPushedAt, clientId }`

---

## Sample sync flow (detailed)

1. User creates an inspection offline → app:

   - creates an `Inspection` in IndexedDB with `localId = uuid()`.
   - creates `sync_queue` op: `{ opId: uuid(), opType: 'create', entity: 'Inspection', payload: {...}, localId }`
   - add attachments to `uploads` queue; store image blob in IndexedDB as reference.

2. Service worker registers background sync (or app calls `navigator.onLine` event).

3. On connectivity, service worker triggers sync:

   - pushes batched `sync_queue` ops to `POST /api/v1/sync/push` (max batch size configurable).
   - for attachments: first call `attachments/init` to get upload endpoints; then use tus-js-client to upload file in background; on success, call `attachments/complete`.

4. Server responds:

   - if accepted → returns `{ status: accepted, serverId, version, timestamp }` for each op; client updates local record with serverId/version and removes queue entry; writes AuditLog entry locally.
   - if conflict → server returns `{ status: conflict, serverVersion, serverSnapshot }` → client either (a) auto-merge (if safe) or (b) create local `merge_task` for manager to resolve.

5. Client persists server responses and updates UI.

---

## Conflict resolution policies (practical)

- **Default LWW**: Accept op with greatest server `updatedAt` or higher `version`. Keep lost data in `AuditLog` for manual review.
- **Hard fields**: For `incident.severity`, `injury_count`, or anything that affects OSHA/compliance, **never auto LWW** — server raises a conflict flag and requires manager approval.
- **Attachments**: Attachments are immutable; if two clients attach different images to the same incident, both are stored (no conflict).
- **Manual merge UI**: admin panel shows `server` vs `client` diffs, with "accept client", "accept server", or "merge fields".

---

## Attachments & uploads (photos, video)

- Use a **resumable upload protocol** (tus) or chunked upload endpoints. tus is battle-tested and helps on flaky networks. Client uses `tus-js-client` or browser File API. ([Tus][5])
- Attachments lifecycle:

  1. Client requests `attachments/init` → server creates placeholder with `id` and returns `uploadUrl`.
  2. Client uses `tus` to upload from local blob (supports resume).
  3. On completion, client `POST /attachments/complete` with checksum to finalize; server verifies and sets `uploaded=true`.

- Store metadata in DB; store files in S3-compatible store with server-side encryption. Serve via signed URLs with short TTL.

---

## Security & compliance

- TLS for all traffic.
- Auth: JWT with short expiry; refresh tokens stored securely (httpOnly cookies recommended for web).
- RBAC: roles (ADMIN, SAFETY_MANAGER, SUPERVISOR, WORKER) limit endpoints and UI actions.
- Attachments: AES-256 server-side encryption; access control via signed URLs.
- Audit logs: append-only; restrict deletion. If legal compliance required, consider WORM storage for logs.
- Data retention & export: include export endpoints and retention policy UI.

---

## Performance & scaling considerations

- **SQLite caveat**: SQLite is file-based and has write-lock semantics; acceptable for single-instance or low-write scenarios. For many concurrent writes, migrate to Postgres. Include migration scripts and Prisma configs. ([robinwieruch.de][4])
- Keep sync batches small (e.g., 50 ops) and throttle attachment uploads to reduce retry storms.
- Use server-side queues (BullMQ, Redis) to process heavy tasks: large file post-processing, report generation.

---

## Observability & monitoring

- Log failed syncs, large-attachment retries, and conflict rates.
- Metrics: queuedOps, avgSyncLatency, syncFailureRate, attachmentFailureRate, conflictsPerDay, incidentsPerSite.
- Alerting: sync error spikes, storage fill > 80%, regulatory incidents flagged (injury severity high).

---

## Directory structure (suggested)

```
/app
  /components
  /screens
  /hooks
  /services
    dexie.ts       // client DB + sync queue helpers
    sync.ts        // sync routine
    upload.ts      // tus wrapper
  /pages (or app router)
  /public
  /service-worker.js   // Workbox generated
/server
  /api
    /v1
      auth.ts
      sync.ts
      inspections.ts
      incidents.ts
      attachments.ts
  prisma/
    schema.prisma
  lib/
    storage.ts
    audit.ts
  workers/
    processAttachment.ts
```

---

## Sample JSON payloads

**Client push batch**

```json
{
  "clientId": "client-abc-123",
  "ops": [
    {
      "opId": "op-uuid-1",
      "opType": "create",
      "entity": "Inspection",
      "localId": "local-uuid-1",
      "payload": {
        "siteId": "site-uuid",
        "createdById": "user-uuid",
        "checklist": {...},
        "createdAt": "2025-10-12T10:00:00Z"
      },
      "attachmentsMeta": [
        { "localAttachmentId": "att-local-1", "filename": "photo1.jpg", "size": 12345 }
      ]
    }
  ]
}
```

**Server response**

```json
{
  "results": [
    {
      "opId": "op-uuid-1",
      "status": "accepted",
      "serverId": "inspection-uuid-999",
      "version": 1,
      "serverTimestamp": "2025-10-12T10:05:00Z",
      "attachments": [
        {
          "localAttachmentId": "att-local-1",
          "attachmentId": "att-uuid-1000",
          "uploadUrl": "https://...tus/..."
        }
      ]
    }
  ]
}
```

---

## Testing plan

- Unit tests for sync algorithm and queue processing.
- Integration tests: offline flow using service worker mocks; simulate flaky networks using network throttling.
- End-to-end tests: record inspection offline → push → server verifies DB state and audit log.
- Load test: simulate many offline clients syncing after delay to see server behavior.

---

## Migration notes (SQLite → Postgres)

- Use Prisma migrations (`prisma migrate`) and keep schema compatible.
- Move attachments and files to external object store; only keep metadata in DB.
- For high write throughput use a connection pooler; move long-running tasks to background workers.

---

## Tailwind color tokens

Use these CSS custom properties or Tailwind config token names:

- `--color-text-text` (primary text)
- `--color-accent` (accent: call-to-action)
- `--color-primary` (primary brand color)
- `--color-secoundary` (note spelling preserved per your request)
- `--color-background` (app background)

Example Tailwind tokens (in `tailwind.config.js`):

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        "text-text": "var(--color-text-text)",
        accent: "var(--color-accent)",
        primary: "var(--color-primary)",
        secoundary: "var(--color-secoundary)",
        background: "var(--color-background)",
      },
    },
  },
};
```

(You said you'll do Tailwind setup — so I only provided tokens and CSS variable names.)

---

## Ready-to-feed-to-Gemini checklist

- [x] Routes — UI & API (complete)
- [x] Prisma schema (SQLite initial)
- [x] Client DB layout + sync_queue design
- [x] Sync endpoints & sample payloads
- [x] Conflict policy and manual-merge UX
- [x] Attachment/resumable upload design (tus)
- [x] Security, audit, and deployment notes
- [x] Color tokens for Tailwind: `text-text`, `accent`, `primary`, `secoundary`, `background`

---

## Helpful references (for implementation & design)

- PouchDB for sync-inspired local DB: great if you plan CouchDB-like replication. ([PouchDB][2])
- Service worker + Workbox guides for background sync & caching. ([FreeCodeCamp][1])
- Prisma + SQLite tutorials & caveats (dev vs prod). ([robinwieruch.de][4])
- tus protocol for resumable uploads (recommended for photos/videos over flaky links). ([Tus][5])
- CRDTs and Automerge/Yjs if you later want automatic conflict-free merging. ([stack.convex.dev][3])

---

# Remote Safety Compliance — Uizard Prompt & Complete UI/UX Flow (JavaScript only)

Below is an exhaustive, Uizard-ready design brief + detailed flow map you can paste into Uizard (Autodesigner) or any visual prompt box. It’s written so the resulting output can be handed straight to engineers building a **Next.js (JavaScript only)** PWA. I include screen-by-screen details, component specs, interactions, error states, microinteractions, accessibility notes, sample copy, and export instructions. Everything assumes **no TypeScript** — all files, components, and snippets will be `.js` and use plain JavaScript.

---

# How to use

1. Copy the **Design Prompt** text block (below) and paste into Uizard’s project prompt, Autodesigner or into a new project’s description.
2. Use the **Flow JSON** (further below) to manually recreate a flow diagram in Uizard (or use it as a blueprint).
3. When implementing, use `.js` files for components, pages, API routes (`/pages` or `app` with `.js`), and Dexie/service-worker helpers in JavaScript.

---

# 1 — Uizard Design Prompt (paste this into Uizard)

**Project name:** Remote Safety Compliance — Mobile PWA (JS only)

**Overview:**
A mobile-first PWA for Safety Managers and Site Supervisors to run equipment inspections, log incidents and toolbox talks, capture photos, and produce auditable records that sync automatically when connectivity returns. Must feel rugged, clear, and fast for field use (sunlight, gloves, noisy environments).

**Target users / personas:**

- **Field Supervisor (Mobile):** Quick-start inspections, take photos, save drafts offline, see sync status.
- **Safety Manager (Tablet/Desktop):** Review incidents, resolve conflicts, generate reports, export audits.
- **Worker (Mobile):** Sign toolbox talk attendance, view assigned safety tasks.

**Design priorities:** mobile-first, large tappable controls, offline states clearly visible, unobtrusive audit details, fast camera workflow.

**Platform & constraints:**

- Deliver mobile (iOS/Android PWA) and tablet/desktop responsive.
- Implementation will be Next.js **JavaScript-only** (no TypeScript). All components and pages should be exported as `.js`.
- Use Tailwind tokens (provided): `text-text`, `accent`, `primary`, `secoundary`, `background` (these map to CSS variables). Uizard should mimic these color roles.

**Tone & visual style:**

- Industrial, minimal, high contrast.
- Typography: large body (16–18px) for mobile, bold headings.
- Use clear icons: camera, sync, offline, checklist, incident, export.
- Buttons: large primary CTA with `primary` token, secondary with `secoundary`, accent for destructive or special actions.
- Navigation: bottom tab bar on mobile; sidebar on wider screens.

**Workflows to generate (design each screen & subflow):**

1. **Authentication**

   - Login (email + password)
   - Forgot password flow (single field = email)
   - Offline friendly: show cached user, allow offline sign-in if previously authenticated

2. **Onboarding / Site selection**

   - List of assigned sites (card per site). Each card shows site name, last inspection date, crew size, sync badge.
   - Quick “Pin favorite site” action.

3. **Home / Dashboard (mobile-first)**

   - Top persistent sync indicator (green/yellow/red) with last synced timestamp.
   - Summary cards: Pending tasks, Recent inspections (list), Recent incidents (list).
   - Quick actions row: New Inspection, Log Incident, Toolbox Talk.

4. **Site detail**

   - Map preview (small), site metadata, crew list, last inspections (with thumbnails), quick button to start new inspection.

5. **Inspection creation flow (core flow)**

   - Step 1: Select site & equipment (searchable list)
   - Step 2: Checklist (grouped sections). Controls: toggle, radio, dropdown, text area, numeric input.
   - Step 3: Attachments: camera (open camera), gallery, or pick file. Show thumbnails and allow reorder; indicate offline/queued status per file.
   - Step 4: Signoff — select inspector, optional signature capture (touch-draw), submit or save draft.
   - Final screen: Confirmation with `Pending Sync` badge if offline. CTA: “View details” / “Back to dashboard”.

6. **Inspection detail**

   - Header: status (draft/completed/synced), version number, created & last edited timestamps, “audit” toggle to view history.
   - Attachments gallery (tap to open full-screen).
   - Edit button (if user role permits). On edit, create new version and increment `version`.

7. **Incident logging flow**

   - Fields: Incident type (dropdown), severity (1–5 slider), description, location (gps fallback + manual), witnesses (names), immediate actions taken (checkbox list).
   - Attach photos/videos — resolver shows upload progress.
   - Submit: if offline, “Saved (Pending Sync)”. If conflict upon sync, show conflict resolution UI on manager view.

8. **Toolbox talks**

   - Create talk with title, agenda notes, and attendance checkboxes (names preload from crew).
   - Save & distribute (email or export PDF) — optional.

9. **Sync Status & Queue**

   - Queue list with actionable items: retry, delete, view details. Each queued op shows type (create inspection, upload attachment), size, attempts, last error.
   - Overall sync progress bar with estimated queued count (no time estimate text—show progress and counts only).

10. **Reports page**

    - Filters: site, date range, incident severity, inspector.
    - Preview table (expandable rows), export CSV/PDF button.

11. **Admin / Merge UI (for conflicts)**

    - List conflicts by date. Open a conflict detail showing client vs server values side-by-side, change highlights, and actions: Accept Client, Accept Server, Merge field (select per-field value), Create task for human review.

**Microinteractions & animation hints:**

- Toggle checkmarks animate on state change (small scale + color flash).
- Upload progress uses circular thumbnail indicators.
- Pull-to-refresh on lists.
- Small vibration (if supported) for successful submit confirmation.

**Error & offline states:**

- Offline banner persistent when offline.
- For failed uploads show inline toast with “Retry” CTA.
- For conflicts, badge count shows on Reports/Notifications.

**Accessibility (must-have):**

- All tappable targets ≥ 44x44px.
- Sufficient contrast for text/icons.
- Proper labels for inputs and alt text for images.
- Keyboard navigable for desktop flows.
- Provide readable text sizes and scalable layout.

**Sample copy / placeholders (use these in Uizard):**

- Site name: “Aderemi Quarry — Site A”
- Inspection name: “Daily Equipment Safety Check — Excavator #7”
- Incident example: “Near-miss: hydraulic line leak, no injury”
- Onboarding tip: “When offline, data is saved locally and syncs automatically when connection returns.”

**Deliverables from Uizard:**

- Mobile screens (iPhone-sized) + Tablet layout + Desktop admin layout.
- Flow map linking the main flows above.
- Exported assets/icons and a JSON of component structure (if available).
- Optional: generate design tokens matching Tailwind variables (`--color-text-text`, `--color-accent`, `--color-primary`, `--color-secoundary`, `--color-background`).

---

# 2 — Very detailed Flow JSON (blueprint to recreate the flow in Uizard)

Use this to build a flow diagram. Each node has `id`, `title`, `type`, `content`, and `actions` (transitions). You can copy/paste into a flow editor or use to instruct Uizard.

```json
{
  "nodes": [
    {
      "id": "n-login",
      "title": "Login",
      "type": "screen",
      "content": "Email + Password. Remember me. Offline sign-in when cached.",
      "actions": [
        { "label": "Login", "to": "n-dashboard" },
        { "label": "Forgot password", "to": "n-forgot" }
      ]
    },
    {
      "id": "n-forgot",
      "title": "Forgot password",
      "type": "screen",
      "content": "Email input, Send reset link, Back to Login.",
      "actions": [{ "label": "Send", "to": "n-login" }]
    },
    {
      "id": "n-dashboard",
      "title": "Dashboard / Home",
      "type": "screen",
      "content": "Sync indicator (top). Cards: Pending, Recent Inspections, Recent Incidents. Quick actions: New Inspection, Log Incident, Toolbox Talk.",
      "actions": [
        { "label": "New Inspection", "to": "n-inspect-site-select" },
        { "label": "Log Incident", "to": "n-incident-new" },
        { "label": "Open Site", "to": "n-site-detail" },
        { "label": "Open Sync Queue", "to": "n-sync-queue" }
      ]
    },
    {
      "id": "n-site-detail",
      "title": "Site Detail",
      "type": "screen",
      "content": "Map preview, crew list, last inspections. CTA: Start Inspection.",
      "actions": [
        { "label": "Start Inspection", "to": "n-inspect-site-select" },
        { "label": "Back", "to": "n-dashboard" }
      ]
    },
    {
      "id": "n-inspect-site-select",
      "title": "Inspection: Select Site & Equipment",
      "type": "modal",
      "content": "Searchable site list, equipment picker.",
      "actions": [
        { "label": "Continue", "to": "n-inspect-checklist" },
        { "label": "Cancel", "to": "n-dashboard" }
      ]
    },
    {
      "id": "n-inspect-checklist",
      "title": "Inspection Checklist",
      "type": "screen",
      "content": "Grouped sections with toggles, radios, text inputs. Save draft, Next to Attachments.",
      "actions": [
        { "label": "Add Photo", "to": "n-attachments" },
        { "label": "Save Draft", "to": "n-dashboard" },
        { "label": "Next: Attachments", "to": "n-attachments" }
      ]
    },
    {
      "id": "n-attachments",
      "title": "Attachments",
      "type": "screen",
      "content": "Camera button, gallery, thumbnails with reorder. Offline thumbnail badges. Upload progress.",
      "actions": [
        { "label": "Signoff & Submit", "to": "n-inspect-submit" },
        { "label": "Back", "to": "n-inspect-checklist" }
      ]
    },
    {
      "id": "n-inspect-submit",
      "title": "Submit Inspection",
      "type": "modal",
      "content": "Signoff (select inspector, signature). If offline show \"Pending Sync\".",
      "actions": [
        { "label": "Confirm", "to": "n-inspect-detail" },
        { "label": "Save Draft", "to": "n-dashboard" }
      ]
    },
    {
      "id": "n-inspect-detail",
      "title": "Inspection Detail",
      "type": "screen",
      "content": "Status, attachments gallery, audit toggle, edit.",
      "actions": [
        { "label": "Edit", "to": "n-inspect-checklist" },
        { "label": "Back", "to": "n-dashboard" }
      ]
    },
    {
      "id": "n-incident-new",
      "title": "Log Incident",
      "type": "screen",
      "content": "Type, Severity slider, description, location, witnesses, attachments.",
      "actions": [
        { "label": "Submit", "to": "n-incident-detail" },
        { "label": "Save Draft", "to": "n-dashboard" }
      ]
    },
    {
      "id": "n-incident-detail",
      "title": "Incident Detail",
      "type": "screen",
      "content": "Attachments, corrective actions, audit log, resolve buttons for managers.",
      "actions": [{ "label": "Back", "to": "n-dashboard" }]
    },
    {
      "id": "n-toolbox",
      "title": "Toolbox Talk",
      "type": "screen",
      "content": "Title, Agenda, Attendance checkboxes, Save & Mark Complete.",
      "actions": [{ "label": "Save", "to": "n-dashboard" }]
    },
    {
      "id": "n-sync-queue",
      "title": "Sync Status & Queue",
      "type": "screen",
      "content": "Queued items list, progress bar, retry, force sync.",
      "actions": [
        { "label": "Retry Item", "to": "n-sync-queue" },
        { "label": "View Error", "to": "n-error-detail" },
        { "label": "Back", "to": "n-dashboard" }
      ]
    },
    {
      "id": "n-reports",
      "title": "Reports / Export",
      "type": "screen",
      "content": "Filters: site/date/severity. Preview table. Export CSV/PDF."
    },
    {
      "id": "n-conflicts",
      "title": "Conflicts / Merge UI",
      "type": "screen",
      "content": "List conflicts. Side-by-side diff viewer. Actions: Accept Client, Accept Server, Merge Field-by-field."
    },
    {
      "id": "n-error-detail",
      "title": "Error Detail",
      "type": "modal",
      "content": "Show failed op details and retry/manual resolution."
    }
  ],
  "start": "n-login"
}
```

---

# 3 — Screen-level specs (component structure — JavaScript-only)

For each major screen I define the components you should implement (all `.js` React components using Tailwind classes and tokens).

Example: `components/Header.js` (JS)

- Shows title, small sync indicator (icon + tooltip), offline banner.
- Props: `{title, syncStatus, lastSyncedAt}`

Example pages (JS files):

- `/pages/index.js` → Dashboard component imports `Header.js`, `SummaryCard.js`, `QuickActions.js`
- `/pages/login.js` → Login form logic (plain JS using fetch to `/api/v1/auth/login`)
- `/pages/sites/[siteId].js` → Site detail
- `/pages/inspections/new.js` → Inspection flow router (use internal step state)
- `/pages/inspections/[id].js` → Inspection detail
- `/pages/incidents/new.js`, `/pages/incidents/[id].js`
- `/pages/sync-status.js`, `/pages/reports.js`, `/pages/conflicts.js`

Client-side service files (JS only):

- `/lib/dexieClient.js` — Dexie setup and schema (JS)
- `/lib/syncQueue.js` — functions: `enqueueOp(op)`, `peekQueue(limit)`, `markOpComplete(opId, result)`, `getQueueStats()`
- `/lib/uploadClient.js` — tus-js-client wrapper in JS for resumable uploads
- `/lib/syncWorkerRegister.js` — service worker registration + background sync registration (JS)
- `/lib/apiClient.js` — simple fetch wrapper to call `/api/v1/*` with JWT header (JS)

Server-side API routes (Next.js, JS):

- `/pages/api/v1/auth/login.js`
- `/pages/api/v1/auth/refresh.js`
- `/pages/api/v1/sync/push.js`
- `/pages/api/v1/sync/pull.js`
- `/pages/api/v1/attachments/init.js`
- `/pages/api/v1/attachments/complete.js`
- `/pages/api/v1/sites/index.js` + `[siteId].js`
- `/pages/api/v1/inspections/index.js` + `[id].js`
- `/pages/api/v1/incidents/index.js` + `[id].js`
  (Each API route should export default async function handler(req,res) and use Prisma client in JS.)

---

# 4 — Interaction & state details (very precise)

**Sync indicator states (UI mapping):**

- `online & idle` → green dot + “All caught up — last synced <time>”
- `online & syncing` → pulsing accent icon + progress percent
- `offline` → persistent yellow banner: “Offline — changes saved locally”
- `error` → red icon with error count; link to Sync Queue

**Attachment lifecycle states (per attachment):**

- `local` — stored only in Dexie/IndexedDB, show small local icon
- `uploading` — circular progress overlay
- `uploaded/pending-attach` — metadata sent, waiting server attach confirmation
- `attached` — server confirmed, show cloud-check icon
- `failed` — red exclamation, retry CTA

**Conflict UI precise behavior:**

- When server returns conflict on sync, client shows a “Conflict” notification with count.
- Manager opens `/conflicts` -> chooses a conflict -> UI shows:

  - Left: Client attempted change (timestamp, user)
  - Right: Server current value
  - Below: Per-field radio selectors to choose preferred value or a unified “Accept Client” / “Accept Server”
  - After resolution, server applies resolved version, increments version, and emits sync event.

**Form validation & offline UX:**

- Validate essential fields locally (required fields highlighted in red).
- Do not prevent save draft when required fields missing — instead tag `validationWarnings` and allow draft saving.
- On submit offline, show toast: “Saved locally — will sync when online.”

---

# 5 — Accessibility & localization

- Provide `aria-label` for interactive icons.
- All images should have alt text that can be auto-populated (e.g., `Photo: Excavator #7 - hydraulic line`).
- Date/time must be localizable; use ISO UTC for server timestamps, render localized in client.
- Prepare UI for LTR/RTL (labels, direction-aware layout).

---

# 6 — Exportables for devs (what Uizard should hand you back)

- Screens as PNGs / SVGs
- Component list (if Uizard provides)
- Flow diagram (export JSON or PNG)
- Design tokens: colors, spacing, typography (map to Tailwind tokens)

---

# 7 — Implementation notes (JS-only reminders for engineers)

- Use `pages/` or the App Router but ensure files are `.js`. Example: `pages/inspections/new.js`.
- Prisma usage on server side: `const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient();` (JS import style).
- Dexie JS usage: `import Dexie from 'dexie';` and all code in `.js`.
- Service worker registration in `/lib/syncWorkerRegister.js` using `navigator.serviceWorker.register('/sw.js')` (JS).
- Avoid TypeScript tooling or `.d.ts` files. ESLint config should be set for JS.

---

# 8 — Ready-to-copy Uizard Prompt (single block)

Use the “Design Prompt” from section #1. If you want a single compact copy, here it is:

> Remote Safety Compliance — Mobile PWA (JS only). Mobile-first PWA for Safety Managers and Site Supervisors. Personas: Field Supervisor, Safety Manager, Worker. Priorities: offline-first, large tappable controls, high-contrast for sunlight, resumable photo uploads. Screens: Login, Site Selection, Dashboard (sync indicator), Site Detail, Inspection creation (site → checklist → camera → signoff), Inspection detail (history + attachments), Incident logging, Toolbox talks, Sync status & queue, Reports, Conflicts/Merge UI. Styles: Industrial, minimal; tokens: `text-text`, `accent`, `primary`, `secoundary`, `background`. Interactions: camera-first photo workflow, background sync with queue, resumable uploads, conflict resolution manager UI, prominent offline banner. Microinteractions: animated toggles, upload progress overlays on thumbnails, pull-to-refresh. Accessibility: 44x44 tap targets, aria labels, keyboard nav. Export: mobile/tablet/desktop screens and flow map. All implementation will be in JavaScript (`.js`), no TypeScript.

---

If you’d like I can now (pick one and I’ll produce it immediately — JS only, no TS):

- generate the **full Prisma schema** file with extra fields and a JS migration script; or
- scaffold **Next.js API route templates** for the sync endpoints (JS `pages/api/v1/*` handlers); or
- generate **client Dexie helpers** and a **service-worker (Workbox) config** in JS; or
- produce a **JSON OpenAPI spec** for `/api/v1/*` endpoints suitable to feed into Gemini.

Tell me which of those to generate and I’ll create it right away in JavaScript. (No waiting — I’ll output the files here.)
