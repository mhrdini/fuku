# Scheduling module

## Architecture Overview

The scheduling module has the following layers:

1. `SchedulerService` (application layer)
   Orchestrates use-case logic

2. `SchedulerEngine` (domain layer)
   Pure scheduling algorithm / decision making

Preliminarily, the API module serves as the entry point for any external interactions:

Controller (in API layer): Handles request → orchestrates calls to `SchedulerService`

## Layer Responsibilities

### Application Layer (`SchedulerService`)

- Validate input
- Create scheduling context
- Call `SchedulerEngine`
- Return structured result
- Does not persist to DB

### Domain Layer (`SchedulerEngine`)

### `/engine`

Pure logic for generating schedules:

- Iterates days
- Iterates required shift slots
- Filters eligible members (based on availability and constraints)
- Scores candidates (calling the `/scoring` module)
- Creates assignments

### `/constraints`

- Hard constraint logic
- Isolates each constraint rule
- Engine iterates through constraints and rejects candidates that fail

### `/scoring`

- Soft fairness logic
- Optimisation

## Helpers

### `/shared/date-utils.ts`

- Normalize date formats
- Calculate date ranges
- Handle time zones

### `SchedulerContext`

- Encapsulates all data needed for scheduling (members, shifts, constraints)
- Passed to `SchedulerEngine` for processing
