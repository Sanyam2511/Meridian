package com.meridian.optimization.service;

import com.google.ortools.Loader;
import com.google.ortools.constraintsolver.*;
import com.meridian.optimization.dto.Assignment;
import com.meridian.optimization.dto.SolverResult;
import com.meridian.optimization.entity.Order;
import com.meridian.optimization.entity.Rider;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class VrpSolverService {

    @Value("${meridian.solver.weight.distance:1.0}")
    private double weightDistance;

    @Value("${meridian.solver.weight.fairness:5.0}")
    private double weightFairness;

    @PostConstruct
    public void init() {
        // Load the OR-Tools native libraries
        Loader.loadNativeLibraries();
    }

    /**
     * Solves the VRP to assign the given orders to the available riders.
     * Uses Euclidean distance for the distance score and the difference between average earnings and rider earnings for the fairness penalty.
     */
    public SolverResult solveAssignments(List<Rider> riders, List<Order> orders, BigDecimal averageFleetEarnings) {
        long startTime = System.currentTimeMillis();

        if (riders.isEmpty() || orders.isEmpty()) {
            return new SolverResult(new ArrayList<>(), System.currentTimeMillis() - startTime, true);
        }

        // Setup for OR-Tools VRP
        // Nodes = 1 depot (dummy start) + orders
        // Vehicles = riders
        int numNodes = orders.size() + 1;
        int numVehicles = riders.size();
        int depot = 0; // Node 0 is the dummy depot

        RoutingIndexManager manager = new RoutingIndexManager(numNodes, numVehicles, depot);
        RoutingModel routing = new RoutingModel(manager);

        // Precompute cost matrix (vehicles x nodes)
        // In OR-Tools, cost is usually long, so we scale our decimal costs by 1000
        final int SCALE = 1000;
        
        long[][] costMatrix = new long[numVehicles][numNodes];

        for (int v = 0; v < numVehicles; v++) {
            Rider rider = riders.get(v);
            
            // Calculate fairness penalty (negative if rider needs more earnings)
            // Penalty = (RiderEarnings - AverageEarnings)
            double riderEarnings = rider.getDailyEarningsBalance().doubleValue();
            double avgEarnings = averageFleetEarnings.doubleValue();
            double fairnessPenalty = riderEarnings - avgEarnings;

            for (int n = 1; n < numNodes; n++) { // Node 0 is depot, cost is 0
                Order order = orders.get(n - 1);

                // Calculate Euclidean distance between Rider and Order Pickup
                double dx = rider.getLastKnownLocation().getX() - order.getPickupLocation().getX();
                double dy = rider.getLastKnownLocation().getY() - order.getPickupLocation().getY();
                double distanceScore = Math.sqrt(dx * dx + dy * dy);

                // Total Cost = (w1 * DistanceScore) + (w2 * FairnessPenalty)
                double totalCost = (weightDistance * distanceScore) + (weightFairness * fairnessPenalty);
                
                // Ensure cost is non-negative for the solver (shift if necessary)
                // For a real app we'd handle negative costs carefully, but for this basic VRP we floor at 0.
                costMatrix[v][n] = (long) Math.max(0, totalCost * SCALE);
            }
        }

        // Register transit callback per vehicle
        int[] transitCallbackIndices = new int[numVehicles];
        for (int v = 0; v < numVehicles; v++) {
            final int vehicleIndex = v;
            transitCallbackIndices[v] = routing.registerTransitCallback((long fromIndex, long toIndex) -> {
                int fromNode = manager.indexToNode(fromIndex);
                int toNode = manager.indexToNode(toIndex);
                if (fromNode == depot || toNode == depot) {
                    return 0; // Cost from/to depot is 0
                }
                return costMatrix[vehicleIndex][toNode];
            });
            routing.setArcCostEvaluatorOfVehicle(transitCallbackIndices[v], v);
        }

        // Add dummy capacity constraint so each vehicle takes at most 1 order
        long[] vehicleCapacities = new long[numVehicles];
        for (int i = 0; i < numVehicles; i++) vehicleCapacities[i] = 1;

        int demandCallbackIndex = routing.registerUnaryTransitCallback((long fromIndex) -> {
            int node = manager.indexToNode(fromIndex);
            return node == depot ? 0 : 1;
        });

        routing.addDimensionWithVehicleCapacity(
                demandCallbackIndex,
                0, // null capacity slack
                vehicleCapacities, // vehicle maximum capacities
                true, // start cumul to zero
                "Capacity");

        // Allow unassigned orders with a high penalty
        long penalty = 10000000;
        for (int i = 1; i < numNodes; ++i) {
            routing.addDisjunction(new long[]{manager.nodeToIndex(i)}, penalty);
        }

        RoutingSearchParameters searchParameters =
                main.defaultRoutingSearchParameters()
                        .toBuilder()
                        .setFirstSolutionStrategy(FirstSolutionStrategy.Value.PATH_CHEAPEST_ARC)
                        .build();

        com.google.ortools.constraintsolver.Assignment solution = routing.solveWithParameters(searchParameters);

        List<Assignment> assignments = new ArrayList<>();
        if (solution != null) {
            for (int v = 0; v < numVehicles; ++v) {
                long index = routing.start(v);
                index = solution.value(routing.nextVar(index));
                if (!routing.isEnd(index)) {
                    int nodeIndex = manager.indexToNode(index);
                    if (nodeIndex > 0) {
                        Order assignedOrder = orders.get(nodeIndex - 1);
                        Rider assignedRider = riders.get(v);
                        
                        // Re-calculate the exact cost components for logging
                        double dx = assignedRider.getLastKnownLocation().getX() - assignedOrder.getPickupLocation().getX();
                        double dy = assignedRider.getLastKnownLocation().getY() - assignedOrder.getPickupLocation().getY();
                        double dist = Math.sqrt(dx * dx + dy * dy);
                        double fair = assignedRider.getDailyEarningsBalance().doubleValue() - averageFleetEarnings.doubleValue();
                        double tot = (weightDistance * dist) + (weightFairness * fair);

                        assignments.add(new Assignment(
                                assignedRider.getId(),
                                assignedOrder.getId(),
                                BigDecimal.valueOf(dist).setScale(4, RoundingMode.HALF_UP),
                                BigDecimal.valueOf(fair).setScale(4, RoundingMode.HALF_UP),
                                BigDecimal.valueOf(tot).setScale(4, RoundingMode.HALF_UP)
                        ));
                    }
                }
            }
        }

        return new SolverResult(assignments, System.currentTimeMillis() - startTime, solution != null);
    }
}
