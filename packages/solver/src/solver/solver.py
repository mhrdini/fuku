from ortools.sat.python import cp_model

from .logging import logger
from .models import Constraint, SolverRequest, SolverResponse


class Solver:
    model: cp_model.CpModel = cp_model.CpModel()
    solver: cp_model.CpSolver = cp_model.CpSolver()
    variables: dict[str, cp_model.IntVar] = {}
    constraints: list[str] = []

    def _add_linear_constraint(
        self,
        constraint: Constraint,
    ):
        linear_expr = sum(self.variables[t.var] * t.coeff for t in constraint.terms)
        if constraint.op == "<=":
            self.model.add(linear_expr <= constraint.rhs)
        elif constraint.op == ">=":
            self.model.add(linear_expr >= constraint.rhs)
        elif constraint.op == "==":
            self.model.add(linear_expr == constraint.rhs)
        else:
            raise ValueError(f"Unsupported operator: {constraint.op}")

    def _add_objective(
        self,
        objective,
    ):
        linear_expr = sum(self.variables[t.var] * t.coeff for t in objective.terms)
        if objective.sense == "minimize":
            self.model.minimize(linear_expr)
        elif objective.sense == "maximize":
            self.model.maximize(linear_expr)
        else:
            raise ValueError(f"Unsupported objective sense: {objective.sense}")

    def create_model(self, request: SolverRequest) -> cp_model.CpModel:
        try:
            # Declare model
            self.model = cp_model.CpModel()
            self.variables = {}
            self.constraints = []

            # Build variables
            for var in request.variables:
                if var.type == "bool":
                    self.variables[var.name] = self.model.new_bool_var(var.name)
                elif var.type == "int":
                    self.variables[var.name] = self.model.new_int_var(
                        var.min if var.min is not None else -cp_model.INT32_MAX,
                        var.max if var.max is not None else cp_model.INT32_MAX,
                        var.name,
                    )
                else:
                    raise ValueError(f"Unsupported variable type: {var.type}")

            # Build constraints
            for constraint in request.constraints:
                self._add_linear_constraint(constraint)
                self.constraints.append(constraint.name)

            # Build objective if provided
            if request.objective:
                self._add_objective(request.objective)

            logger.debug(f"Variables: {len(self.variables.keys())}")
            logger.debug(f"Constraints: {len(self.constraints)}")

            return self.model
        except Exception as e:
            raise e

    def solve_with_callback(
        self,
        request: SolverRequest,
        model: cp_model.CpModel,
        callback: cp_model.CpSolverSolutionCallback,
    ) -> SolverResponse:
        try:
            # Solve model
            self.solver = cp_model.CpSolver()

            if request.options:
                if request.options.time_limit_seconds:
                    self.solver.parameters.max_time_in_seconds = (
                        request.options.time_limit_seconds
                    )

            status = self.solver.Solve(model, callback)

            logger.debug(f"Solver status: {self.solver.StatusName(status)}")
            logger.debug(
                f"Solver solution info: {self.solver.response_proto.solution_info}"
            )

            # Build response
            status_name = self.solver.StatusName(status)

            values = (
                {
                    var_name: self.solver.Value(value)
                    for var_name, value in self.variables.items()
                }
                if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE
                else {}
            )

            solution_info = self.solver.response_proto.solution_info

            objective_value = (
                self.solver.ObjectiveValue() if request.objective else None
            )

            return SolverResponse(
                status=status_name,
                values=values,
                objective_value=objective_value,
                solution_info=solution_info,
                added_constraints=self.constraints,
            )
        except Exception as e:
            return SolverResponse(status="MODEL_INVALID", error=str(e))

    def run(self, request: SolverRequest) -> SolverResponse:
        try:
            # Declare model
            self.variables = {}
            self.constraints = []

            model = self.create_model(request)

            # Solve model
            solver = cp_model.CpSolver()

            if request.options:
                if request.options.time_limit_seconds:
                    solver.parameters.max_time_in_seconds = (
                        request.options.time_limit_seconds
                    )

            status = solver.Solve(model)

            logger.debug(f"Solver status: {solver.StatusName(status)}")
            logger.debug(f"Solver solution info: {solver.response_proto.solution_info}")

            # Build response
            status_name = solver.StatusName(status)

            values = (
                {
                    var_name: solver.Value(value)
                    for var_name, value in self.variables.items()
                }
                if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE
                else {}
            )

            solution_info = solver.response_proto.solution_info

            objective_value = solver.ObjectiveValue() if request.objective else None

            return SolverResponse(
                status=status_name,
                values=values,
                objective_value=objective_value,
                solution_info=solution_info,
                added_constraints=self.constraints,
            )
        except Exception as e:
            return SolverResponse(status="MODEL_INVALID", error=str(e))
