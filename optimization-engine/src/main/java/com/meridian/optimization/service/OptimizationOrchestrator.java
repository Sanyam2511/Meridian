package com.meridian.optimization.service;

import com.meridian.optimization.dto.SolverResult;
import com.meridian.optimization.entity.Order;
import com.meridian.optimization.entity.OrderStatus;
import com.meridian.optimization.entity.Rider;
import com.meridian.optimization.entity.RiderStatus;
import com.meridian.optimization.repository.OrderRepository;
import com.meridian.optimization.repository.RiderRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class OptimizationOrchestrator {

    private final RiderRepository riderRepository;
    private final OrderRepository orderRepository;
    private final VrpSolverService vrpSolverService;

    public OptimizationOrchestrator(RiderRepository riderRepository, OrderRepository orderRepository, VrpSolverService vrpSolverService) {
        this.riderRepository = riderRepository;
        this.orderRepository = orderRepository;
        this.vrpSolverService = vrpSolverService;
    }

    public SolverResult runOptimizationCycle() {
        // Fetch eligible riders and orders
        List<Rider> activeRiders = riderRepository.findByCurrentStatus(RiderStatus.ACTIVE);
        List<Order> pendingOrders = orderRepository.findByStatus(OrderStatus.PENDING);

        if (activeRiders.isEmpty() || pendingOrders.isEmpty()) {
            return new SolverResult(List.of(), 0, true);
        }

        // Calculate average fleet earnings for the fairness penalty
        BigDecimal totalEarnings = BigDecimal.ZERO;
        for (Rider r : activeRiders) {
            totalEarnings = totalEarnings.add(r.getDailyEarningsBalance());
        }
        BigDecimal averageEarnings = totalEarnings.divide(new BigDecimal(activeRiders.size()), 2, RoundingMode.HALF_UP);

        // Run the solver
        return vrpSolverService.solveAssignments(activeRiders, pendingOrders, averageEarnings);
    }
}
