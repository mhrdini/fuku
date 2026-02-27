"""FastAPI app for solver microservice."""

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .logging import logger
from .models import SolverRequest, SolverResponse
from .solver import Solver

app = FastAPI(
    title="Fuku Scheduler Solver API",
    description="A minimal MILP solver microservice for Fuku's scheduling engine",
    version="1.0.0",
)


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/solve", response_model=SolverResponse, response_model_exclude_unset=True)
async def solve(request: SolverRequest) -> SolverResponse:
    """Endpoint to solve the scheduling optimization problem."""
    try:
        response = Solver().run(request)
        return response
    except Exception as e:
        # log the error and trigger global exception handler
        logger.debug(f"Error solving model: {e}")
        raise


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Generic exception handler to catch unexpected errors."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": str(exc),
            "path": str(request.url),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"error": "Validation Error", "detail": exc.errors(), "body": exc.body},
    )
