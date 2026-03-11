# fuku

Team and roster management tool for organizations.

## Development

### Quick start

```bash
pnpm install -r
pnpm up:dev
pnpm dev
```

### Prerequisites

- Node.js (v18 or later)
- pnpm
- Prisma CLI
- Docker
- PostgreSQL

### Installing dependencies

```bash
pnpm install -r # Install dependencies for all packages
```

Use Docker to set up PostgreSQL and CP-SAT solver containers:

```bash
pnpm up:dev
```

### Migrating Prisma database

When you make changes to the Prisma schema, you need to generate a new migration file:

```bash
pnpm db:migrate:dev
# or
pnpm db:migrate:dev:auto
```

Then apply the migration to your local database:

```bash
pnpm db:push
```

### Running the development server

To start the development server, run:

```bash
pnpm dev
```

As this monorepo uses Turborepo, it will automatically start the necessary
services based on the configuration in `turbo.json`.

### Running tests

TBD

### Updating barrel files

```bash
pnpm barrels
```

This runs the `generate-barrels.js` script, which updates the `index.ts` files in the following directories:

- `packages/domain/src/schemas` - schemas for domain entities
- `packages/api/src/schemas` - schemas for API request/response validation
- `packages/scheduling/src/domain/types/` - types for scheduling domain
- `packages/ui/src/components/` - shadcn UI components

## Structure

This monorepo is organized into several packages, each serving a specific
purpose:

- `apps/web` - Next.js frontend application
- `packages/api` - API server built with tRPC and better-auth
- `packages/db` - Database access layer using Prisma
- `packages/domain` - Shared domain logic and types using Zod
- `packages/scheduling` - Scheduler service and engine
- `packages/solver` - FastAPI CP-SAT solver using OR-Tools
- `packages/ui` - Shared UI components using shadcn/ui

```markdown
                         ┌─────────────────────┐
                         │     apps/web        │
                         │   Next.js Frontend  │
                         └──────────┬──────────┘
                                    │
                                    │ tRPC requests using React Query
                                    ▼
                         ┌─────────────────────┐
                         │    packages/api     │
                         │   API Server        │
                         │ (tRPC + better-auth)│
                         └───────┬─────┬───────┘
                                 │     │
                                 │     │ database queries
                                 │     ▼
                                 │   ┌─────────────────────┐
                                 │   │     packages/db     │
                                 │   │   Prisma Layer      │
                                 │   └──────────┬──────────┘
                                 │              │
                                 │              ▼
                                 │        ┌───────────┐
                                 │        │ Database  │
                                 │        └───────────┘
                                 │
                                 │ scheduling request
                                 ▼
                        ┌─────────────────────────┐
                        │   packages/scheduling   │
                        │   Scheduler Engine      │
                        └───────────┬─────────────┘
                                    │
                                    │ optimization problem
                                    ▼
                        ┌─────────────────────────┐
                        │     packages/solver     │
                        │ FastAPI OR-Tools CP-SAT │
                        └───────────┬─────────────┘
                                    │
                                    │ schedule result
                                    ▼
                             (back to Engine)
```
