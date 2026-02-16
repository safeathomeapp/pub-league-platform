# 07 Security, Privacy, and Tenant Isolation
Generated: 2026-02-12

## Threat model (MVP)
- Cross-tenant data leakage (highest risk)
- Privilege escalation (captain acting as commissioner)
- Token misuse (unauthorised match edits)
- Messaging abuse (spam)

## Tenant isolation
- All primary tables include organisation_id.
- Every query in services must filter by organisation_id derived from JWT + membership.
- Prefer enforcing org_id in route params and validate membership early.

Optional later: Postgres RLS. MVP can ship without RLS if service-layer enforcement is strict and tested.

## Authentication
- Email + password (bcrypt/argon2)
- JWT access token
- Refresh token optional (if needed for mobile/PWA smoothness)
- Rate limit login endpoints

## Authorisation (RBAC)
- Use guards/interceptors in NestJS to enforce roles.
- Fine-grained checks for match events:
  - token-holder OR captain override OR commissioner/admin

## Token security (match control)
- Token transfer is a server-side state change, not a shareable string.
- Never rely on “secret codes” pasted around.
- Every match event must check current token holder at time of write.

## PII
- Phone numbers and emails stored for reminders.
- Provide opt-out flags.
- Avoid storing unnecessary personal data.
- Log redaction: never log full phone numbers in plain text (mask in logs).

## Auditability
- match_event_log is append-only at application level.
- Admin actions that modify fixtures, rosters, disputes should also be logged (admin_audit_log table recommended in Phase 2).

## Abuse controls
- Per-org messaging quotas (soft limits).
- Disable WhatsApp/SMS for orgs with repeated failures/spam flags.
