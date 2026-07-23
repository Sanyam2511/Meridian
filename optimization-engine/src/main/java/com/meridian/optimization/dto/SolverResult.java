package com.meridian.optimization.dto;

import java.util.List;

public class SolverResult {
    private List<Assignment> assignments;
    private long computationTimeMs;
    private boolean successful;

    public SolverResult(List<Assignment> assignments, long computationTimeMs, boolean successful) {
        this.assignments = assignments;
        this.computationTimeMs = computationTimeMs;
        this.successful = successful;
    }

    public List<Assignment> getAssignments() {
        return assignments;
    }

    public long getComputationTimeMs() {
        return computationTimeMs;
    }

    public boolean isSuccessful() {
        return successful;
    }
}
