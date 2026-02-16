# 22 Milestone 1 Implementation Plan — Auth + Organisations + Roles (File-by-File)
Generated: 2026-02-12

Scope: implement Milestone 1 exactly as described in `09-Implementation-Plan-and-Roadmap.md` and `05-API-Spec-v1.md` for:
- Auth (register/login/me)
- Organisations (create/list/get/update)
- Memberships + Roles (invite/create member, list members, update role)
- Hard tenant scoping and RBAC guard foundations

Non-goals in this milestone:
- Fixtures, match ledger, standings, notifications, disputes.
- UI beyond basic pages required to exercise API.

This plan assumes the current repo structure:
- `/apps/api` NestJS
- `/apps/web` Next.js App Router
- Prisma already present in `/apps/api/prisma/schema.prisma`

Important principle: every request after auth must resolve an **active organisation context** and enforce:
1) membership exists for orgId
2) role permits action
3) all DB queries scoped to orgId

---

## 0) Pre-flight
### 0.1 Install missing dependencies
Edit: `apps/api/package.json`
Add dependencies:
- `@prisma/client` already present (devDependencies + dependencies conflict ok, but best in dependencies)
- `@nestjs/swagger` (optional, but recommended)
- `cookie-parser` (optional; only if you use cookies)
- `helmet` (recommended)
- `@nestjs/throttler` (recommended)
- `nanoid` (for invite codes) OR use UUID

Add dev dependencies:
- `ts-node` (if needed)
- `supertest` + `@types/supertest` (integration tests)
- `jest` config (Nest defaults)

Command (from repo root):
- `npm i -w apps/api @nestjs/throttler helmet nanoid`
- `npm i -w apps/api -D supertest @types/supertest`

### 0.2 Ensure Prisma Client generation
Run:
- `npm run db:push`
- `npm --workspace apps/api run prisma:generate`

---

## 1) API: Core Infrastructure

### 1.1 Prisma module/service
Create: `apps/api/src/modules/db/prisma.module.ts`
Create: `apps/api/src/modules/db/prisma.service.ts`
Purpose:
- Provide a singleton PrismaClient via DI
- Handle shutdown hooks
- Centralize query logging toggles

Files:
1) `apps/api/src/modules/db/prisma.service.ts`
2) `apps/api/src/modules/db/prisma.module.ts`

### 1.2 Config + validation
Create: `apps/api/src/config/env.schema.ts`
Create: `apps/api/src/config/env.validation.ts`
Update: `apps/api/src/modules/app/app.module.ts`
Purpose:
- Validate required env vars at boot (DATABASE_URL, JWT secrets, etc.)

### 1.3 Security middleware
Update: `apps/api/src/main.ts`
- Add `helmet()`
- Add global exception filter (custom) to normalize errors
- Add request id middleware (simple UUID) for log correlation

Create: `apps/api/src/common/filters/http-exception.filter.ts`
Create: `apps/api/src/common/middleware/request-id.middleware.ts`

---

## 2) Auth Module

### 2.1 Auth module structure
Create folder: `apps/api/src/modules/auth/`
Files:
- `auth.module.ts`
- `auth.controller.ts`
- `auth.service.ts`
- `dto/register.dto.ts`
- `dto/login.dto.ts`
- `dto/auth-response.dto.ts`
- `password.service.ts` (bcrypt wrapper)
- `jwt.strategy.ts`
- `guards/jwt-auth.guard.ts`
- `decorators/current-user.decorator.ts`
- `types/current-user.type.ts`

### 2.2 Endpoints
Implement:
- POST `/api/v1/auth/register`
- POST `/api/v1/auth/login`
- GET  `/api/v1/auth/me`

Behavior:
Register:
- create User (email unique, bcrypt hash)
- OPTIONAL: create default organisation + membership (role ORG_ADMIN)
  - If you do this, document it and keep it consistent with web onboarding.
Login:
- verify password
- issue JWT access token with claims: userId, email
Me:
- return current user identity + memberships summary

### 2.3 JWT contents and conventions
Token claims (minimum):
- sub: userId
- email
No organisation claim in JWT (membership can change). Org context comes from route parameter orgId.

---

## 3) Organisation Module

### 3.1 Module structure
Create folder: `apps/api/src/modules/orgs/`
Files:
- `orgs.module.ts`
- `orgs.controller.ts`
- `orgs.service.ts`
- `dto/create-org.dto.ts`
- `dto/update-org.dto.ts`
- `dto/org.dto.ts`

### 3.2 Endpoints
Implement:
- POST `/api/v1/orgs`
- GET  `/api/v1/orgs`
- GET  `/api/v1/orgs/:orgId`
- PATCH `/api/v1/orgs/:orgId`

Behavior:
POST orgs:
- create org
- create membership for current user as ORG_ADMIN
GET orgs:
- list orgs user is a member of
GET org:
- ensure membership exists
PATCH org:
- require ORG_ADMIN

---

## 4) Memberships / Roles Module

### 4.1 Decide MVP invite strategy
For MVP speed, pick ONE:
Option A (fastest): direct create member by email (auto-register later)
Option B (cleaner): invite token flow with email send deferred

Recommendation for bootstrapped local-first: **Option A** now, add invite tokens in Phase 2.

Implement Option A:
- POST `/orgs/:orgId/members` with payload: email, role
- If user exists: create membership
- If user does not exist: create a “pending invitation” record (new table) OR block and require user exists

To reduce scope, I recommend:
- Require user exists for now (clear error) OR
- Create user with random password and require password reset (more work)

Most minimal:
- Require user exists; show message: “User must register first.”

### 4.2 Files
Create folder: `apps/api/src/modules/memberships/`
Files:
- `memberships.module.ts`
- `memberships.controller.ts`
- `memberships.service.ts`
- `dto/add-member.dto.ts`
- `dto/update-member-role.dto.ts`
- `dto/member.dto.ts`

### 4.3 Endpoints
Implement:
- POST `/api/v1/orgs/:orgId/members`
- GET  `/api/v1/orgs/:orgId/members`
- PATCH `/api/v1/orgs/:orgId/members/:memberId`

Role rules:
- ORG_ADMIN can add/remove/update anyone
- COMMISSIONER can list but not change roles (MVP)
- CAPTAIN/PLAYER: list maybe allowed; keep simple: only ADMIN + COMMISSIONER can list members

---

## 5) Guards, Decorators, and Tenant Scoping (Non-negotiable)

### 5.1 Membership guard
Create: `apps/api/src/common/guards/org-membership.guard.ts`
Responsibilities:
- Extract orgId from route params
- Verify current user has membership
- Attach membership (orgId + role) to request context

### 5.2 Role guard
Create: `apps/api/src/common/guards/roles.guard.ts`
Create: `apps/api/src/common/decorators/roles.decorator.ts`
- Use metadata to declare required roles per handler

### 5.3 Request context type
Create: `apps/api/src/common/types/request-context.type.ts`
- includes userId, orgId, role, membershipId

### 5.4 Controller usage pattern
Controllers in org-scoped routes must include:
- `@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard?)`

Services must accept `(orgId, ...)` and all Prisma queries must filter by orgId.

---

## 6) Database Changes (Prisma)

### 6.1 Review schema adjustments for Milestone 1
Current schema already contains: Organisation, User, OrgMembership.

Adjustments recommended now:
- Ensure `@prisma/client` in dependencies (not just dev)
- Consider separate TeamPlayer role enum (currently reusing Role) — not required for Milestone 1; defer.

No new tables required for Milestone 1 if you choose “user must already exist” for membership add.

---

## 7) API Responses and Error Conventions

### 7.1 Standard error shape
All errors returned as:
{
  "error": {
    "code": "SOME_CODE",
    "message": "Human readable",
    "details": { ...optional }
  }
}

Implement in `HttpExceptionFilter` and throw `BadRequestException` etc. with metadata.

### 7.2 Status codes
- 400 validation errors
- 401 unauthenticated
- 403 no membership / insufficient role
- 404 resource not found (within org context)
- 409 conflicts (duplicate email, duplicate membership)

---

## 8) Tests (Minimum Required)

Create: `apps/api/test/auth.e2e-spec.ts`
Create: `apps/api/test/orgs.e2e-spec.ts`
Create: `apps/api/test/memberships.e2e-spec.ts`
Add: `apps/api/test/test-utils.ts`

E2E flow (must pass):
1) Register user A
2) Create org
3) List orgs shows org
4) Get org works
5) Update org works for ORG_ADMIN
6) Register user B
7) Add member B to org
8) List members shows both
9) Role update works and is enforced

---

## 9) Web App (Minimal for exercising API)

### 9.1 Pages
Create:
- `apps/web/app/login/page.tsx`
- `apps/web/app/register/page.tsx`
- `apps/web/app/orgs/page.tsx`
- `apps/web/app/orgs/[orgId]/page.tsx`
- `apps/web/app/orgs/[orgId]/members/page.tsx`

Keep styling minimal. Use fetch() to API base URL.

### 9.2 Auth storage
For MVP speed:
- store token in localStorage
- include Authorization header per request
Later: switch to httpOnly cookies.

---

## 10) Deliverables Checklist (Milestone 1 Done)
- [ ] Auth endpoints working + validated
- [ ] Org CRUD working with membership scoping
- [ ] Membership add/list/update working
- [ ] Guards enforce org membership and role
- [ ] E2E tests pass locally
- [ ] Minimal web pages can exercise flows

---

## 11) Commit Plan
Commit granularity:
1) chore: prisma module + env validation + filters
2) feat(auth): register/login/me + tests
3) feat(orgs): org CRUD + membership guard
4) feat(memberships): add/list/update roles + tests
5) feat(web): minimal pages to exercise API

Do not mix multiple features in one commit.
