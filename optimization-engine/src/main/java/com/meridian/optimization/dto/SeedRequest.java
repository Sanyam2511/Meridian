package com.meridian.optimization.dto;

import java.util.List;

public class SeedRequest {
    private List<RiderSeedDto> riders;

    public SeedRequest() {}

    public SeedRequest(List<RiderSeedDto> riders) {
        this.riders = riders;
    }

    public List<RiderSeedDto> getRiders() {
        return riders;
    }

    public void setRiders(List<RiderSeedDto> riders) {
        this.riders = riders;
    }
}
