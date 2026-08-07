package com.meridian.optimization.dto;

import java.util.List;

public class NearbyRidersResponse {
    private Integer count;
    private List<ActiveRiderDto> riders;

    public NearbyRidersResponse() {}

    public NearbyRidersResponse(Integer count, List<ActiveRiderDto> riders) {
        this.count = count;
        this.riders = riders;
    }

    public Integer getCount() { return count; }
    public void setCount(Integer count) { this.count = count; }

    public List<ActiveRiderDto> getRiders() { return riders; }
    public void setRiders(List<ActiveRiderDto> riders) { this.riders = riders; }
}
