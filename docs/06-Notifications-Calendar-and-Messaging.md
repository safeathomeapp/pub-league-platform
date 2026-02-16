# 06 Notifications, Calendar, and Messaging (MVP)
Generated: 2026-02-12

MVP includes SMS or WhatsApp + calendar integration.

## Provider abstraction
Implement an interface (ports/adapters pattern):

MessagingProvider:
- send_sms(to, message, metadata)
- send_whatsapp(to, message, metadata)
- (optional) send_email(to, subject, body, metadata)

Do NOT bind business logic to a single vendor. Start with one provider and keep an adapter boundary.

## Outbox pattern (required)
All notifications are queued into notifications_outbox and sent by a worker.

notifications_outbox fields:
- id
- organisation_id
- channel (sms|whatsapp|email)
- to
- template_key
- template_vars (json)
- scheduled_for
- status (pending|sending|sent|failed)
- attempts
- last_error
- provider_message_id
- created_at, updated_at

Retry policy:
- 3 attempts
- exponential backoff (e.g., +1m, +10m, +60m)
- hard fail after attempts and surface in admin UI.

## Notification triggers (MVP)
1) Fixture reminder
- schedule: 24h before fixture.scheduled_at
- recipients: captains (MVP), optionally all rostered players if opted-in

2) Fixture change
- trigger: fixture rescheduled OR venue changed
- immediate send

3) Score submission status
- trigger: fixture completed
- send summary to both captains + commissioner (configurable)

4) Dispute opened/resolved
- trigger: dispute state change

## Message templates
Keep templates versioned. Example keys:
- fixture.reminder
- fixture.changed
- fixture.completed
- dispute.opened
- dispute.resolved

Templates must be short and legible on SMS/WhatsApp.

## Calendar strategy (MVP)
Provide .ics feeds rather than pushing invites.

Feeds:
- division feed (all fixtures)
- team feed (team fixtures)
- player feed (if player linked to roster)

Rules:
- Use stable UID per fixture.
- If fixture rescheduled, update DTSTART/DTEND in feed.
- Consumers (Google/Apple Calendar) periodically refresh feeds; not instant.

## Timezone
UK default: Europe/London.
Store timestamps in UTC in DB; render in local timezone in client and .ics.

## Deliverability notes
- Require E.164 phone normalization at entry.
- Opt-in/out preference per user/player for reminders.
