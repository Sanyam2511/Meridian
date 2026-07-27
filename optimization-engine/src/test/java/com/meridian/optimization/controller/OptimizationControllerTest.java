package com.meridian.optimization.controller;

import com.meridian.optimization.dto.SolverResult;
import com.meridian.optimization.service.OptimizationOrchestrator;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.ResponseEntity;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

class OptimizationControllerTest {

    @Test
    void shouldReturnOptimizationResult() {
        // Arrange
        OptimizationOrchestrator mockOrchestrator = Mockito.mock(OptimizationOrchestrator.class);
        SolverResult mockResult = new SolverResult(Collections.emptyList(), 10, true);
        when(mockOrchestrator.runOptimizationCycle()).thenReturn(mockResult);

        OptimizationController controller = new OptimizationController(mockOrchestrator);

        // Act
        ResponseEntity<SolverResult> response = controller.runOptimization();

        // Assert
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccessful());
        assertEquals(10, response.getBody().getComputationTimeMs());
        assertTrue(response.getBody().getAssignments().isEmpty());
    }
}
