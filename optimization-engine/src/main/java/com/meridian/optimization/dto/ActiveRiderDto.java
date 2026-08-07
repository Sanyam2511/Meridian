package com.meridian.optimization.dto;

public class ActiveRiderDto {
    private String id;
    private Double lat;
    private Double lon;

    public ActiveRiderDto() {}

    public ActiveRiderDto(String id, Double lat, Double lon) {
        this.id = id;
        this.lat = lat;
        this.lon = lon;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLon() { return lon; }
    public void setLon(Double lon) { this.lon = lon; }
}
