package com.meridian.optimization.service;

import com.meridian.optimization.dto.Assignment;
import com.meridian.optimization.dto.SolverResult;
import com.meridian.optimization.entity.Order;
import com.meridian.optimization.entity.Rider;
import com.meridian.optimization.entity.RiderStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VrpSolverServiceTest {

    private VrpSolverService vrpSolverService;
    private GeometryFactory geometryFactory = new GeometryFactory();

    @BeforeEach
    void setUp() {
        vrpSolverService = new VrpSolverService();
        vrpSolverService.init(); // Loads native libraries

        // Set weights
        ReflectionTestUtils.setField(vrpSolverService, "weightDistance", 1.0);
        ReflectionTestUtils.setField(vrpSolverService, "weightFairness", 5.0);
    }

    @Test
    void shouldPrioritizeUnderEarningRider() {
        // Create Orders
        Order order = new Order();
        order.setId(UUID.randomUUID());
        order.setPickupLocation(geometryFactory.createPoint(new Coordinate(10.0, 10.0)));
        order.setDropoffLocation(geometryFactory.createPoint(new Coordinate(20.0, 20.0)));

        // Create Riders
        Rider closeRider = new Rider();
        closeRider.setId(UUID.randomUUID());
        closeRider.setCurrentStatus(RiderStatus.ACTIVE);
        closeRider.setLastKnownLocation(geometryFactory.createPoint(new Coordinate(10.1, 10.1))); // Very close
        closeRider.setDailyEarningsBalance(new BigDecimal("150.0")); // Earning more

        Rider underEarningRider = new Rider();
        underEarningRider.setId(UUID.randomUUID());
        underEarningRider.setCurrentStatus(RiderStatus.ACTIVE);
        underEarningRider.setLastKnownLocation(geometryFactory.createPoint(new Coordinate(12.0, 12.0))); // Farther away
        underEarningRider.setDailyEarningsBalance(new BigDecimal("50.0")); // Earning less

        BigDecimal avgEarnings = new BigDecimal("100.0");

        SolverResult result = vrpSolverService.solveAssignments(
                List.of(closeRider, underEarningRider),
                List.of(order),
                avgEarnings
        );

        assertTrue(result.isSuccessful());
        assertEquals(1, result.getAssignments().size());

        // Because fairness weight is high (5.0) and underEarningRider is -50 below avg,
        // their penalty is -250.
        // closeRider is +50 above avg, penalty +250.
        // Distance difference is small, so underEarningRider should win.
        Assignment assignment = result.getAssignments().get(0);
        assertEquals(underEarningRider.getId(), assignment.getRiderId());
    }
}
