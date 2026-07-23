package com.meridian.optimization.entity;

import jakarta.persistence.*;
import org.locationtech.jts.geom.Point;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "riders")
public class Rider {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiderStatus currentStatus;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyEarningsBalance = BigDecimal.ZERO;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point lastKnownLocation;

    public Rider() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public RiderStatus getCurrentStatus() {
        return currentStatus;
    }

    public void setCurrentStatus(RiderStatus currentStatus) {
        this.currentStatus = currentStatus;
    }

    public BigDecimal getDailyEarningsBalance() {
        return dailyEarningsBalance;
    }

    public void setDailyEarningsBalance(BigDecimal dailyEarningsBalance) {
        this.dailyEarningsBalance = dailyEarningsBalance;
    }

    public Point getLastKnownLocation() {
        return lastKnownLocation;
    }

    public void setLastKnownLocation(Point lastKnownLocation) {
        this.lastKnownLocation = lastKnownLocation;
    }
}
