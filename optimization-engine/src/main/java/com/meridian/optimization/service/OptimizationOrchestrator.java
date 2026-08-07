package com.meridian.optimization.service;

import com.meridian.optimization.dto.Assignment;
import com.meridian.optimization.dto.SolverResult;
import com.meridian.optimization.entity.AssignmentLog;
import com.meridian.optimization.entity.Order;
import com.meridian.optimization.entity.OrderStatus;
import com.meridian.optimization.entity.Rider;
import com.meridian.optimization.entity.RiderStatus;
import com.meridian.optimization.repository.AssignmentLogRepository;
import com.meridian.optimization.repository.OrderRepository;
import com.meridian.optimization.repository.RiderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.transaction.annotation.Transactional;
import com.meridian.optimization.dto.NearbyRidersResponse;
import com.meridian.optimization.dto.ActiveRiderDto;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Coordinate;
import java.util.ArrayList;
import java.util.UUID;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

@Service
public class OptimizationOrchestrator {

    private final RiderRepository riderRepository;
    private final OrderRepository orderRepository;
    private final AssignmentLogRepository assignmentLogRepository;
    private final VrpSolverService vrpSolverService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public OptimizationOrchestrator(RiderRepository riderRepository,
                                    OrderRepository orderRepository,
                                    AssignmentLogRepository assignmentLogRepository,
                                    VrpSolverService vrpSolverService,
                                    ObjectMapper objectMapper,
                                    RestTemplate restTemplate) {
        this.riderRepository = riderRepository;
        this.orderRepository = orderRepository;
        this.assignmentLogRepository = assignmentLogRepository;
        this.vrpSolverService = vrpSolverService;
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplate;
    }

    @Transactional
    public SolverResult runOptimizationCycle(Double w1, Double w2) {
        // Fetch pending orders
        List<Order> pendingOrders = orderRepository.findByStatus(OrderStatus.PENDING);

        // Fetch hot state riders from Node.js Gateway (San Francisco center, 25km radius)
        List<Rider> activeRiders = new ArrayList<>();
        try {
            ResponseEntity<NearbyRidersResponse> response = restTemplate.getForEntity(
                    "http://localhost:3000/api/v1/riders/nearby-active?lat=37.7749&lon=-122.4194&radius=25.0",
                    NearbyRidersResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                GeometryFactory geometryFactory = new GeometryFactory();
                List<ActiveRiderDto> hotRiders = response.getBody().getRiders();
                for (ActiveRiderDto dto : hotRiders) {
                    Rider rider = riderRepository.findById(UUID.fromString(dto.getId())).orElse(null);
                    if (rider != null && rider.getCurrentStatus() == RiderStatus.ACTIVE) {
                        // Hydrate the live GPS location from the gateway
                        rider.setLastKnownLocation(geometryFactory.createPoint(new Coordinate(dto.getLon(), dto.getLat())));
                        activeRiders.add(rider);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch hot state riders from gateway: " + e.getMessage());
            // Fallback to postgres
            activeRiders = riderRepository.findByCurrentStatus(RiderStatus.ACTIVE);
        }

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
        SolverResult result = vrpSolverService.solveAssignments(activeRiders, pendingOrders, averageEarnings, w1, w2);

        // Persist assignments
        for (Assignment assignment : result.getAssignments()) {
            Rider rider = riderRepository.findById(assignment.getRiderId()).orElse(null);
            Order order = orderRepository.findById(assignment.getOrderId()).orElse(null);

            if (rider != null && order != null) {
                // Update Order status
                order.setStatus(OrderStatus.ASSIGNED);
                orderRepository.save(order);

                // Update Rider earnings and status
                rider.setCurrentStatus(RiderStatus.BUSY);
                rider.setDailyEarningsBalance(rider.getDailyEarningsBalance().add(order.getPayoutAmount()));
                riderRepository.save(rider);

                // Create Assignment Log
                try {
                    String reasonJson = objectMapper.writeValueAsString(Map.of(
                            "distanceScore", assignment.getDistanceScore(),
                            "fairnessPenalty", assignment.getFairnessPenalty(),
                            "totalCost", assignment.getTotalCost()
                    ));

                    AssignmentLog log = new AssignmentLog();
                    log.setRider(rider);
                    log.setOrder(order);
                    log.setAssignmentReason(reasonJson);
                    assignmentLogRepository.save(log);

                    // Push notification to Node.js Gateway
                    try {
                        Map<String, Object> payload = Map.of(
                                "riderId", rider.getId().toString(),
                                "orderId", order.getId().toString(),
                                "payout", order.getPayoutAmount(),
                                "pickupLat", order.getPickupLocation().getY(),
                                "pickupLon", order.getPickupLocation().getX()
                        );
                        restTemplate.postForEntity("http://localhost:3000/api/v1/notifications/assignment", payload, String.class);
                    } catch (Exception ex) {
                        System.err.println("Failed to push assignment notification to gateway: " + ex.getMessage());
                    }
                } catch (Exception e) {
                    // Ignore JSON serialization errors for now
                    e.printStackTrace();
                }
            }
        }

        return result;
    }
}
