# Fuku

Team and roster management tool for organisations.

## Quick Start

```bash
pnpm install -r
pnpm up:dev
pnpm dev
```

## Features

- **Team Management**: Manage teams, locations, members, shift types, and pay grades.
- **Roster Management**: Create and manage schedules based on team requirements and member availability.
- **Automatic Scheduling**: Generate schedules using a constraint-based CP-SAT solver.
- **Scheduling Constraints**: Account for availability, working hours, staffing requirements, rest periods, shift rules, and other constraints.
- **Authentication**: Secure authentication and team access using Better Auth.
- **Internationalisation**: Support for English and Japanese.
- **Data Export**: Export schedules as CSV and PDF.
- **TypeScript and Tooling**: Pre-configured with TypeScript, ESLint, Vitest, and Turborepo.

## Packages

This monorepo contains the following applications and packages:

| Package                                                  | Description                                            |
| -------------------------------------------------------- | ------------------------------------------------------ |
| [`apps/web`](./apps/web/README.md)                       | Next.js frontend application                           |
| [`packages/api`](./packages/api/README.md)               | tRPC API and Better Auth integration                   |
| [`packages/db`](./packages/db/README.md)                 | Database access layer using Prisma                     |
| [`packages/domain`](./packages/domain/README.md)         | Shared domain schemas, types, and validation using Zod |
| [`packages/scheduling`](./packages/scheduling/README.md) | Scheduling domain and schedule generation engine       |
| [`packages/solver`](./packages/solver/README.md)         | FastAPI CP-SAT solver using OR-Tools                   |
| [`packages/ui`](./packages/ui/README.md)                 | Shared UI components using shadcn/ui                   |

## Architecture

Fuku is organised as a Turborepo monorepo. The web application communicates with the API through tRPC and React Query. The API accesses PostgreSQL through Prisma and delegates schedule generation to the scheduling engine, which uses the CP-SAT solver.

```text
                         ┌─────────────────────┐
                         │     apps/web        │
                         │   Next.js Frontend  │
                         └──────────┬──────────┘
                                    │
                                    │ tRPC + React Query
                                    ▼
                         ┌─────────────────────┐
                         │    packages/api     │
                         │   tRPC + Better Auth│
                         └───────┬─────┬───────┘
                                 │     │
                                 │     │ database queries
                                 │     ▼
                                 │   ┌─────────────────────┐
                                 │   │     packages/db     │
                                 │   │    Prisma Layer     │
                                 │   └──────────┬──────────┘
                                 │              │
                                 │              ▼
                                 │        ┌───────────┐
                                 │        │ PostgreSQL│
                                 │        └───────────┘
                                 │
                                 │ scheduling request
                                 ▼
                        ┌─────────────────────────┐
                        │   packages/scheduling   │
                        │    Scheduler Engine     │
                        └───────────┬─────────────┘
                                    │
                                    │ optimisation problem
                                    ▼
                        ┌─────────────────────────┐
                        │     packages/solver     │
                        │ FastAPI + OR-Tools      │
                        │        CP-SAT            │
                        └───────────┬─────────────┘
                                    │
                                    │ schedule result
                                    ▼
                             (back to Engine)
```

## Tools

- [**pnpm**](https://pnpm.io/): Package manager for the monorepo.
- [**Turborepo**](https://turbo.build/): Monorepo build system and task runner.
- [**Next.js**](https://nextjs.org/): React framework for the web application.
- [**React**](https://react.dev/): UI library.
- [**TypeScript**](https://www.typescriptlang.org/): Primary application language.
- [**tRPC**](https://trpc.io/): End-to-end typesafe API layer.
- [**Prisma**](https://www.prisma.io/): Database ORM and access layer.
- [**Better Auth**](https://www.better-auth.com/): Authentication framework.
- [**Zod**](https://zod.dev/): Schema validation and shared domain types.
- [**Tailwind CSS**](https://tailwindcss.com/): Utility-first CSS framework.
- [**shadcn/ui**](https://ui.shadcn.com/): Shared UI components.
- [**Vitest**](https://vitest.dev/): Test framework.
- [**FastAPI**](https://fastapi.tiangolo.com/): Python API framework for the solver service.
- [**OR-Tools**](https://developers.google.com/optimization): Constraint optimisation toolkit used by the scheduler.

## Getting Started

### Prerequisites

- Node.js
- pnpm
- Docker
- PostgreSQL

### Installing dependencies

Install dependencies for the entire monorepo:

```bash
pnpm install -r
```

### Starting development services

Use Docker to start PostgreSQL and the CP-SAT solver:

```bash
pnpm up:dev
```

### Migrating the database

When making changes to the Prisma schema, create a new migration:

```bash
pnpm db:migrate:dev
# or
pnpm db:migrate:dev:auto
```

Then apply the database changes:

```bash
pnpm db:push
```

### Running the development server

Start the development environment with:

```bash
pnpm dev
```

Turborepo will start the required applications and services according to the project's `turbo.json` configuration.

## Usage

### Running tests

Run the test suite with:

```bash
pnpm test
```

> Test coverage and the complete test suite are currently being expanded.

### Updating barrel files

Generate and update barrel `index.ts` files with:

```bash
pnpm barrels
```

This updates barrel files in the following directories:

- `packages/domain/src/schemas` - schemas for domain entities
- `packages/api/src/schemas` - schemas for API request and response validation
- `packages/scheduling/src/domain/types` - scheduling domain types
- `packages/ui/src/components` - shared UI components

## Scripts

The following scripts are available at the root of the project:

| Script                     | Description                                                   |
| -------------------------- | ------------------------------------------------------------- |
| `pnpm install -r`          | Install dependencies for all packages                         |
| `pnpm up:dev`              | Start PostgreSQL and the CP-SAT solver                        |
| `pnpm dev`                 | Start the development environment                             |
| `pnpm test`                | Run the test suite                                            |
| `pnpm db:migrate:dev`      | Create and apply a Prisma development migration               |
| `pnpm db:migrate:dev:auto` | Automatically create and apply a Prisma development migration |
| `pnpm db:push`             | Push the Prisma schema to the database                        |
| `pnpm barrels`             | Generate package barrel files                                 |

## Structure

```text
fuku/
├── apps/
│   └── web/                  # Next.js frontend
├── packages/
│   ├── api/                  # tRPC API and Better Auth
│   ├── db/                   # Prisma database layer
│   ├── domain/               # Shared domain schemas and types
│   ├── scheduling/           # Scheduling engine
│   ├── solver/               # FastAPI + OR-Tools CP-SAT solver
│   └── ui/                   # Shared UI components
├── configs/                  # Shared development configurations
├── docker/                   # Development service configuration
├── turbo.json                # Turborepo configuration
└── pnpm-workspace.yaml       # pnpm workspace configuration
```
