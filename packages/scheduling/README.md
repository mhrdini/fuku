# Scheduling module

## Architecture Overview

The scheduling module has the following layers:

1. `SchedulerService` (application layer)
   Orchestrates use-case logic

2. `SchedulerEngine` (domain layer)
   Pure scheduling algorithm / optimization logic, externalizes optimization model solver interaction

Preliminarily, the API module serves as the entry point for any external interactions:

Controller (in API layer): Handles request → orchestrates calls to
`SchedulerService`

## Scheduler Flow

```markdown
                         ┌─────────────────────────────────┐
                         │  application/services           │
                         │  scheduler.service.ts           │
                         │                                 │
                         │ Orchestrates scheduling request │
                         └───────────────┬─────────────────┘
                                         │
                                         │ build scheduler context
                                         ▼
                         ┌─────────────────────────────────┐
                         │  application/ports              │
                         │  team.repository.ts             │
                         │                                 │
                         │ Data access interface           │
                         └───────────────┬─────────────────┘
                                         │
                                         │ returns team snapshot
                                         ▼
                         ┌─────────────────────────────────┐
                         │      domain/types               │
                         │ engine / team / schedule types  │
                         │                                 │
                         │ Shared domain data structures   │
                         └───────────────┬─────────────────┘
                                         │
                                         │ scheduler context
                                         ▼
                ┌──────────────────────────────────────────────┐
                │               domain/engine                  │
                │                                              │
                │  scheduler.engine.ts                         │
                │  Core scheduling engine                      │
                │                                              │
                │  Coordinates model construction and solving  │
                └───────────────┬──────────────────────────────┘
                                │
                                │
                                ▼
        ┌────────────────────────────────────────────────────────────┐
        │                  Optimization Model Layer                  │
        │                                                            │
        │  model.builder.ts                                          │
        │     Builds optimization model from scheduling context      │
        │     (variables, constraints, objective)                    │
        │                                                            │
        │  variable.builder.ts                                       │
        │     Generates solver variables (assignments etc.)          │
        │                                                            │
        │  optimization.model.ts                                     │
        │     Internal representation of constraints/objectives      │
        └───────────────┬────────────────────────────────────────────┘
                        │
                        │ solver model
                        ▼
                ┌─────────────────────────────────┐
                │      solver.adapter.ts          │
                │                                 │
                │ Adapter to external solver      │
                │ (Python OR-Tools CP-SAT)        │
                └───────────────┬─────────────────┘
                                │
                                │ solve()
                                ▼
                  ┌───────────────────────┐
                  │   [External service]  │
                  │         Solver        │
                  │        (CP-SAT)       │
                  └─────────────┬─────────┘
                                │
                                │ solution variables
                                ▼
                ┌─────────────────────────────────┐
                │      solution.mapper.ts         │
                │                                 │
                │ Converts solver output into     │
                │ domain schedule assignments     │
                └───────────────┬─────────────────┘
                                │
                                │
                                ▼
                       Final Schedule Result
         (back to SchedulerService for return and/or persistence)
```

## Layer Responsibilities

### Application Layer: `/application`

### `/services`

`SchedulerService`:

- Validate input
- Create scheduling context
- Call `SchedulerEngine` to generate schedule
- Return structured result containing schedule team, period, and assignments
- If mode is `replace`, persists to DB and replaces existing schedule

### `/ports`

`TeamRepository`:

Interface for:

- Fetching team snapshot (members, shifts, etc) from DB, used by
  `SchedulerService` to get current context for scheduling
- Persisting new schedule to DB if mode is `replace`

### Domain Layer: `/domain/engine`

`SchedulerEngine`:

- Core scheduling logic
- Receives scheduling context, builds optimization model, calls solver adapter, and maps solution back to schedule result

`ConstraintModelBuilder`:

- Builds the optimization model (variables, constraints, objective) from the scheduling context

`SolverAdapter`:

- Translates internal optimization model to the format required by the external solver
- Calls the solver and retrieves the solution

`SolutionMapper`:

- Converts the raw solver output into structured schedule assignments
- Ensures the output is in a format that can be easily consumed by the application layer and persisted to the database

## Helpers

### `/domain/types`

- Define types for team snapshot and scheduler context

### `/shared/date-utils.ts`

- Normalize date formats
- Calculate date ranges
- Handle time zones

### `SchedulerContext`

- Encapsulate all data needed for scheduling (members, shifts, constraints)
- Passed to `SchedulerEngine` for processing

### `/domain/engine/optimization.model.ts`

- Define internal representation of optimization model (variables, constraints, objective)
