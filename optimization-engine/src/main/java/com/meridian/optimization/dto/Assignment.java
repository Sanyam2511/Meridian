package com.meridian.optimization.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class Assignment {
    private UUID riderId;
    private UUID orderId;
    private BigDecimal distanceScore;
    private BigDecimal fairnessPenalty;
    private BigDecimal totalCost;

    public Assignment(UUID riderId, UUID orderId, BigDecimal distanceScore, BigDecimal fairnessPenalty, BigDecimal totalCost) {
        this.riderId = riderId;
        this.orderId = orderId;
        this.distanceScore = distanceScore;
        this.fairnessPenalty = fairnessPenalty;
        this.totalCost = totalCost;
    }

    public UUID getRiderId() {
        return riderId;
    }

    public UUID getOrderId() {
        return orderId;
    }

    public BigDecimal getDistanceScore() {
        return distanceScore;
    }

    public BigDecimal getFairnessPenalty() {
        return fairnessPenalty;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }
}
