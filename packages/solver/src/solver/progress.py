from ortools.sat.python import cp_model


class ProgressCallback(cp_model.CpSolverSolutionCallback):
    def __init__(self, send_event):
        cp_model.CpSolverSolutionCallback.__init__(self)
        self.send_event = send_event
        self.solution_count = 0

    def on_solution_callback(self):
        self.solution_count += 1

        obj = self.ObjectiveValue()

        self.send_event(
            {
                "type": "solution",
                "solutionCount": self.solution_count,
                "objective": obj,
            }
        )
