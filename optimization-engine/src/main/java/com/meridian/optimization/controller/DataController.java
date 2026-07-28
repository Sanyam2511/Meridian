package com.meridian.optimization.controller;

import com.meridian.optimization.entity.AssignmentLog;
import com.meridian.optimization.entity.Order;
import com.meridian.optimization.entity.Rider;
import com.meridian.optimization.repository.AssignmentLogRepository;
import com.meridian.optimization.repository.OrderRepository;
import com.meridian.optimization.repository.RiderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/data")
@CrossOrigin(origins = "*") // For the dashboard
public class DataController {

    private final RiderRepository riderRepository;
    private final OrderRepository orderRepository;
    private final AssignmentLogRepository assignmentLogRepository;
    private final ObjectMapper objectMapper;

    public DataController(RiderRepository riderRepository, OrderRepository orderRepository, AssignmentLogRepository assignmentLogRepository, ObjectMapper objectMapper) {
        this.riderRepository = riderRepository;
        this.orderRepository = orderRepository;
        this.assignmentLogRepository = assignmentLogRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/riders")
    public List<Map<String, Object>> getRiders() {
        return riderRepository.findAll().stream().map(rider -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", rider.getId());
            map.put("name", "Rider-" + rider.getId().toString().substring(0, 4));
            map.put("lat", rider.getLastKnownLocation() != null ? rider.getLastKnownLocation().getY() : 37.7749);
            map.put("lon", rider.getLastKnownLocation() != null ? rider.getLastKnownLocation().getX() : -122.4194);
            map.put("dailyEarnings", rider.getDailyEarningsBalance());
            map.put("status", rider.getCurrentStatus().name());
            map.put("vehicle", "E-BIKE");
            return map;
        }).collect(Collectors.toList());
    }

    @GetMapping("/orders")
    public List<Map<String, Object>> getOrders() {
        return orderRepository.findAll().stream().map(order -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", order.getId());
            map.put("restaurantName", "Rest-" + order.getId().toString().substring(0, 4));
            map.put("pickupLat", order.getPickupLocation() != null ? order.getPickupLocation().getY() : 37.7614);
            map.put("pickupLon", order.getPickupLocation() != null ? order.getPickupLocation().getX() : -122.4241);
            map.put("dropoffLat", order.getDropoffLocation() != null ? order.getDropoffLocation().getY() : 37.7700);
            map.put("dropoffLon", order.getDropoffLocation() != null ? order.getDropoffLocation().getX() : -122.4100);
            map.put("payout", order.getPayoutAmount());
            map.put("status", order.getStatus().name());
            return map;
        }).collect(Collectors.toList());
    }

    @GetMapping("/logs")
    public List<Map<String, Object>> getLogs() {
        return assignmentLogRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream().limit(50).map(log -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", log.getId());
            map.put("timestamp", log.getCreatedAt().toString());
            map.put("orderId", log.getOrder().getId());
            map.put("riderId", "Rider-" + log.getRider().getId().toString().substring(0, 4));
            
            try {
                if (log.getAssignmentReason() != null) {
                    Map<String, Object> reason = objectMapper.readValue(log.getAssignmentReason(), Map.class);
                    map.put("distanceKm", reason.getOrDefault("distanceScore", 0));
                    map.put("distanceScore", reason.getOrDefault("distanceScore", 0));
                    map.put("fairnessPenalty", reason.getOrDefault("fairnessPenalty", 0));
                    map.put("totalCost", reason.getOrDefault("totalCost", 0));
                } else {
                    map.put("distanceKm", 0);
                    map.put("distanceScore", 0);
                    map.put("fairnessPenalty", 0);
                    map.put("totalCost", 0);
                }
            } catch (Exception e) {
                map.put("distanceKm", 0);
                map.put("distanceScore", 0);
                map.put("fairnessPenalty", 0);
                map.put("totalCost", 0);
            }
            return map;
        }).collect(Collectors.toList());
    }
}
