# fuku solver

FastAPI service that solves ILP models using OR-Tools CP-SAT.

Receives constraint model in JSON format, returns the solution.

## Development

```bash
uv sync
```

And in root directory:

```bash
pnpm up:dev --build solver
```

This exposes port 8080 at localhost for the solver API.

## API

### `GET /health`

Returns `{status: "ok"}`.

### `POST /solve`

Receives a constraint model as `SolverRequest`, passes it to `Solver` class to
run CP-SAT, and returns the solution as `SolverResponse`.
