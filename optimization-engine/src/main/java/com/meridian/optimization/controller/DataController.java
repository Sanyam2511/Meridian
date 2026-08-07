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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.client.RestTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Coordinate;
import com.meridian.optimization.dto.SeedRequest;
import com.meridian.optimization.dto.RiderSeedDto;
import com.meridian.optimization.entity.OrderStatus;
import com.meridian.optimization.entity.RiderStatus;
import java.math.BigDecimal;
import java.util.ArrayList;

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
    private final RestTemplate restTemplate;

    public DataController(RiderRepository riderRepository, OrderRepository orderRepository, AssignmentLogRepository assignmentLogRepository, ObjectMapper objectMapper, RestTemplate restTemplate) {
        this.riderRepository = riderRepository;
        this.orderRepository = orderRepository;
        this.assignmentLogRepository = assignmentLogRepository;
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplate;
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

    @PostMapping("/reset")
    @Transactional
    public Map<String, Object> resetSimulation() {
        // 1. Wipe Postgres
        assignmentLogRepository.deleteAll();
        orderRepository.deleteAll();
        riderRepository.deleteAll();

        GeometryFactory gf = new GeometryFactory();
        List<RiderSeedDto> seedDtos = new ArrayList<>();

        // 2. Seed Riders
        double[][] riderData = {
            {37.7749, -122.4194, 45.50}, {37.7833, -122.4167, 142.00},
            {37.7690, -122.4400, 32.00}, {37.7890, -122.4010, 88.50},
            {37.7580, -122.4210, 55.00}, {37.7710, -122.4080, 115.00},
            {37.7950, -122.4350, 64.00}, {37.7620, -122.4310, 128.50}
        };

        for (double[] rd : riderData) {
            Rider r = new Rider();
            r.setCurrentStatus(RiderStatus.ACTIVE);
            r.setDailyEarningsBalance(BigDecimal.valueOf(rd[2]));
            r.setLastKnownLocation(gf.createPoint(new Coordinate(rd[1], rd[0])));
            r = riderRepository.save(r);
            seedDtos.add(new RiderSeedDto(r.getId().toString(), rd[0], rd[1]));
        }

        // 3. Seed Orders
        double[][] orderData = {
            {37.7614, -122.4241, 37.7700, -122.4100, 18.50},
            {37.7924, -122.4232, 37.7800, -122.4000, 24.00},
            {37.8003, -122.4091, 37.7850, -122.4200, 21.50},
            {37.7509, -122.4181, 37.7600, -122.4350, 15.00},
            {37.7851, -122.4319, 37.7750, -122.4450, 19.00},
            {37.7907, -122.4216, 37.7780, -122.4120, 26.50}
        };

        for (double[] od : orderData) {
            Order o = new Order();
            o.setStatus(OrderStatus.PENDING);
            o.setPickupLocation(gf.createPoint(new Coordinate(od[1], od[0])));
            o.setDropoffLocation(gf.createPoint(new Coordinate(od[3], od[2])));
            o.setPayoutAmount(BigDecimal.valueOf(od[4]));
            orderRepository.save(o);
        }

        // 4. Sync Gateway Redis
        try {
            restTemplate.postForEntity(
                "http://localhost:3000/api/v1/riders/seed",
                new SeedRequest(seedDtos),
                String.class
            );
        } catch (Exception e) {
            System.err.println("Failed to sync seed with gateway: " + e.getMessage());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        return result;
    }
}
