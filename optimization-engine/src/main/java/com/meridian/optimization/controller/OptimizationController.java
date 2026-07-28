package com.meridian.optimization.controller;

import com.meridian.optimization.dto.SolverResult;
import com.meridian.optimization.service.OptimizationOrchestrator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@RequestMapping("/api/v1/optimization")
@CrossOrigin(origins = "*") // For the dashboard
public class OptimizationController {

    private final OptimizationOrchestrator optimizationOrchestrator;

    public OptimizationController(OptimizationOrchestrator optimizationOrchestrator) {
        this.optimizationOrchestrator = optimizationOrchestrator;
    }

    @PostMapping("/run")
    public ResponseEntity<SolverResult> runOptimization() {
        SolverResult result = optimizationOrchestrator.runOptimizationCycle();
        return ResponseEntity.ok(result);
    }
}
