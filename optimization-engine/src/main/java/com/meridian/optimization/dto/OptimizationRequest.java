package com.meridian.optimization.dto;

public class OptimizationRequest {
    private Double weightDistance;
    private Double weightFairness;

    public OptimizationRequest() {
    }

    public OptimizationRequest(Double weightDistance, Double weightFairness) {
        this.weightDistance = weightDistance;
        this.weightFairness = weightFairness;
    }

    public Double getWeightDistance() {
        return weightDistance;
    }

    public void setWeightDistance(Double weightDistance) {
        this.weightDistance = weightDistance;
    }

    public Double getWeightFairness() {
        return weightFairness;
    }

    public void setWeightFairness(Double weightFairness) {
        this.weightFairness = weightFairness;
    }
}
