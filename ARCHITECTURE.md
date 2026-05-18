# Telegram Booking System Architecture

## Goal

This project is organized as a modular monorepo so the API, Telegram bot, admin panel, shared contracts, database layer, and infrastructure can evolve independently without turning into a tightly coupled codebase.

## Top-Level Structure

```text
debug_bot_tgh/
├── backend/
├── bot/
├── admin/
├── prisma/
├── shared/
├── docker/
└── ARCHITECTURE.md
```

## Folder Responsibilities

### `backend/`

Main business API for the whole system.

- `src/app` - application bootstrap, module wiring, and server entry composition.
- `src/config` - environment parsing, feature flags, and runtime configuration.
- `src/common` - cross-cutting backend concerns used by many modules.
- `src/database` - Prisma client bootstrap, repositories, and transaction helpers.
- `src/integrations` - external providers such as Telegram, payment gateways, storage, and notification services.
- `src/modules` - business domains separated by feature.
- `src/jobs` - background processes for reminders, payment reconciliation, schedule sync, and reporting.
- `tests` - backend unit and integration tests.

### `backend/src/modules/`

Feature-first backend organization.

- `auth` - authentication and session/token logic.
- `users` - user profiles and identity-related rules.
- `roles` - permissions, admin roles, and future tenant-aware access rules.
- `services` - services offered for booking.
- `masters` - specialists, their metadata, and availability ownership.
- `portfolio` - work examples and media metadata linked to masters.
- `bookings` - booking lifecycle and booking state management.
- `reviews` - client feedback and moderation flow.
- `payments` - full payment records and payment status tracking.
- `prepayments` - deposit logic before booking confirmation.
- `schedules` - working hours, blocked slots, exceptions, and availability calculations.
- `notifications` - outbound notifications orchestration.
- `analytics` - reporting queries, aggregates, and dashboard metrics.

Why it exists:

- Keeps each business capability isolated.
- Makes scaling easier because teams can work by module.
- Reduces accidental coupling between unrelated features.
- Makes future extraction into microservices possible if growth requires it.

### `bot/`

Telegram application built separately from the API so messaging logic does not leak into backend business rules.

- `src/app` - bot bootstrap and Telegraf setup.
- `src/config` - bot runtime configuration.
- `src/common` - shared Telegram-specific utilities and middleware primitives.
- `src/handlers` - updates entrypoints grouped by Telegram update type.
- `src/scenes` - multi-step conversations such as booking flow or review submission.
- `src/services` - bot application services coordinating handlers and API calls.
- `src/integrations/api` - typed HTTP clients for backend communication.
- `src/integrations/notifications` - adapters for sending internal bot-side alerts if needed.
- `src/integrations/storage` - temporary media/file helpers if the bot handles uploads.
- `src/templates` - message text builders and reusable response formatting.
- `src/modules` - bot-side feature grouping parallel to backend business domains.
- `tests` - bot unit and integration tests.

Why it exists:

- Keeps Telegram UX concerns separate from API concerns.
- Allows replacing or adding channels later, such as WhatsApp or web client, without rewriting domain logic.
- Makes the bot a thin orchestration layer instead of a second backend.

### `admin/`

React + Vite admin panel for operators, managers, and admins.

- `src/app/routes` - route definitions and route composition.
- `src/app/layouts` - shell layouts for admin pages.
- `src/app/providers` - app-wide providers such as auth, query, theme, and state bootstrapping.
- `src/pages` - route-level screens.
- `src/features` - domain-driven UI modules aligned with backend capabilities.
- `src/components/ui` - reusable presentational building blocks.
- `src/components/forms` - reusable form primitives.
- `src/components/layout` - shell and layout components.
- `src/components/charts` - analytics visualizations.
- `src/components/tables` - reusable data-table primitives.
- `src/api/client` - base API client configuration.
- `src/api/endpoints` - feature endpoint wrappers.
- `src/hooks` - reusable React hooks.
- `src/store` - client-side state composition.
- `src/lib` - helpers with no UI responsibility.
- `src/styles` - global Tailwind entry styles and theme-level styles.
- `src/types` - admin-specific types not suitable for global sharing.
- `public` - static assets.

Why it exists:

- Separates route composition from feature logic and reusable UI.
- Supports growth from a simple admin panel into a larger back-office product.
- Makes permission-based screens and future white-label admin customization easier.

### `prisma/`

Database ownership layer.

- `schema` - Prisma schema split by concern if needed as the project grows.
- `migrations` - database migration history.
- `seeds` - controlled seed data for local/dev/staging environments.

Why it exists:

- Centralizes data model ownership.
- Keeps persistence concerns outside the API feature modules.
- Supports future multi-tenant schema evolution in one predictable place.

### `shared/`

Code reused safely across backend, bot, and admin.

- `contracts/api` - shared request/response contracts and DTO-facing types.
- `contracts/events` - event payload contracts for internal async flows.
- `types` - business types shared across applications.
- `constants` - enums and shared constant values.
- `validators` - reusable schema validation definitions.
- `utils` - framework-agnostic helpers only.

Why it exists:

- Prevents duplicated type definitions between API, bot, and admin.
- Makes contract drift less likely.
- Helps future package versioning if the monorepo grows into multiple deployable services.

### `docker/`

Containerization and environment setup.

- `backend` - backend image definition.
- `bot` - bot image definition.
- `admin` - admin image definition.
- `postgres` - database container configuration.
- `nginx` - reverse proxy or static admin serving configuration.
- `scripts` - environment bootstrap and container helper scripts.

Why it exists:

- Keeps infrastructure artifacts outside application code.
- Supports local development, CI, staging, and production consistency.
- Prepares the codebase for SaaS-style deployment workflows.

## Communication Model

### Backend and Bot

Recommended communication model:

1. The Telegram bot acts as a client of the backend API.
2. The bot collects user input through Telegraf handlers and scenes.
3. The bot sends typed HTTP requests to backend endpoints using shared contracts from `shared/contracts/api`.
4. The backend owns all business rules, persistence, payment state, schedule rules, and permission checks.
5. The backend returns structured responses the bot converts into Telegram messages.

Why this is the right split:

- Prevents business logic duplication between bot and API.
- Makes the backend the single source of truth.
- Lets other clients reuse the same logic later, including mobile or public web booking.

Optional future scaling path:

- For high-load notification workflows, backend modules can publish domain events and the bot can consume them indirectly through a queue or worker process later.
- That can be added without restructuring the whole project because `shared/contracts/events` and `backend/src/jobs` already reserve the boundary.

### Admin Panel and API

Recommended communication model:

1. The admin panel talks only to the backend API over HTTP.
2. Route pages call feature endpoint wrappers from `admin/src/api/endpoints`.
3. Those wrappers use a shared API client from `admin/src/api/client`.
4. Shared request/response contracts from `shared/contracts/api` keep typing aligned with the backend.
5. The backend enforces authorization and role checks for every protected admin action.

Why this is the right split:

- Keeps frontend presentation concerns out of the backend.
- Keeps authorization centralized on the server.
- Makes the admin panel replaceable without touching domain logic.

## SaaS-Ready Considerations

This structure is ready for future SaaS growth because:

- `roles` can evolve into tenant-scoped access control.
- `shared/contracts/events` allows later async service boundaries.
- `docker/` keeps deployments reproducible.
- isolated `modules` make domain growth manageable.
- separate `bot` and `admin` clients allow multiple customer-facing channels.
- `analytics` is separated early so reporting complexity does not leak into booking logic.

## Current Folder Tree

```text
debug_bot_tgh/
├── ARCHITECTURE.md
├── admin/
│   ├── public/
│   └── src/
│       ├── api/
│       │   ├── client/
│       │   └── endpoints/
│       ├── app/
│       │   ├── layouts/
│       │   ├── providers/
│       │   └── routes/
│       ├── components/
│       │   ├── charts/
│       │   ├── forms/
│       │   ├── layout/
│       │   ├── tables/
│       │   └── ui/
│       ├── features/
│       │   ├── analytics/
│       │   ├── auth/
│       │   ├── bookings/
│       │   ├── dashboard/
│       │   ├── masters/
│       │   ├── notifications/
│       │   ├── payments/
│       │   ├── portfolio/
│       │   ├── reviews/
│       │   ├── roles/
│       │   ├── schedules/
│       │   ├── services/
│       │   └── users/
│       ├── hooks/
│       ├── lib/
│       ├── pages/
│       ├── store/
│       ├── styles/
│       └── types/
├── backend/
│   ├── src/
│   │   ├── app/
│   │   ├── common/
│   │   │   ├── dto/
│   │   │   ├── errors/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   ├── middleware/
│   │   │   └── utils/
│   │   ├── config/
│   │   ├── database/
│   │   ├── integrations/
│   │   │   ├── notifications/
│   │   │   ├── payments/
│   │   │   ├── storage/
│   │   │   └── telegram/
│   │   ├── jobs/
│   │   └── modules/
│   │       ├── analytics/
│   │       ├── auth/
│   │       ├── bookings/
│   │       ├── masters/
│   │       ├── notifications/
│   │       ├── payments/
│   │       ├── portfolio/
│   │       ├── prepayments/
│   │       ├── reviews/
│   │       ├── roles/
│   │       ├── schedules/
│   │       ├── services/
│   │       └── users/
│   └── tests/
│       ├── integration/
│       └── unit/
├── bot/
│   ├── src/
│   │   ├── app/
│   │   ├── common/
│   │   │   ├── context/
│   │   │   ├── keyboards/
│   │   │   ├── middlewares/
│   │   │   └── utils/
│   │   ├── config/
│   │   ├── handlers/
│   │   │   ├── actions/
│   │   │   ├── callbacks/
│   │   │   ├── commands/
│   │   │   └── hears/
│   │   ├── integrations/
│   │   │   ├── api/
│   │   │   ├── notifications/
│   │   │   └── storage/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── bookings/
│   │   │   ├── masters/
│   │   │   ├── notifications/
│   │   │   ├── payments/
│   │   │   ├── schedules/
│   │   │   └── services/
│   │   ├── scenes/
│   │   │   ├── booking/
│   │   │   ├── profile/
│   │   │   └── reviews/
│   │   ├── services/
│   │   └── templates/
│   └── tests/
│       ├── integration/
│       └── unit/
├── docker/
│   ├── admin/
│   ├── backend/
│   ├── bot/
│   ├── nginx/
│   ├── postgres/
│   └── scripts/
├── prisma/
│   ├── migrations/
│   ├── schema/
│   └── seeds/
└── shared/
    ├── constants/
    ├── contracts/
    │   ├── api/
    │   └── events/
    ├── types/
    ├── utils/
    └── validators/
```
