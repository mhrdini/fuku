from typing import Literal

from pydantic import BaseModel


# All values for CP-SAT model are integers,
# so we can represent bools as 0/1
# and continuous variables as ints with a large range.
class Variable(BaseModel):
    name: str
    type: Literal["bool", "int"]
    min: int | None = None
    max: int | None = None


class Term(BaseModel):
    var: str
    coeff: int


class Constraint(BaseModel):
    name: str
    terms: list[Term]
    rhs: int
    op: Literal["<=", ">=", "=="]


class Objective(BaseModel):
    sense: Literal["minimize", "maximize"]
    terms: list[Term]


class SolverOptions(BaseModel):
    time_limit_seconds: int | None = None


class SolverRequest(BaseModel):
    variables: list[Variable]
    constraints: list[Constraint]
    objective: Objective | None = None
    options: SolverOptions | None = None


class SolverResponse(BaseModel):
    status: Literal["OPTIMAL", "FEASIBLE", "INFEASIBLE", "MODEL_INVALID", "UNKNOWN"]
    values: dict[str, int] | None = None
    objective_value: int | None = None
    solution_info: str | None = None
    added_constraints: list[str] | None = None
    error: str | None = None
