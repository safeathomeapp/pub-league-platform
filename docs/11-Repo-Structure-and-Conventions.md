# 11 Repo Structure and Conventions
Generated: 2026-02-12

## Proposed monorepo layout
/ apps
  / api          (NestJS)
  / web          (Next.js)
/ packages
  / shared       (types, zod schemas, constants)
  / rules-engine (ruleset evaluation, standings calc)
  / ui           (optional shared UI components)
/ infra
  docker-compose.yml
  migrations/
/ docs
  (this pack)

## Coding conventions
- TypeScript everywhere
- Zod schemas for request validation
- DTOs in API mapped to domain types
- No business logic in controllers
- Services are pure and testable
- Event types enumerated and versioned

## Migrations
- Use a single migration tool (Prisma or TypeORM migrations).
- No manual DB edits outside migrations.

## Branching
- trunk-based (main + short-lived branches)
- PR required for merges

## Seed data
- Provide a seed script to create:
  - demo org
  - league
  - season
  - division
  - 8 teams
  - fixtures
