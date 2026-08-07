import { getRedisClient } from './redisClient';

const GEO_KEY = 'riders_geo';

export class GeoService {
  /**
   * Updates or adds a rider's real-time coordinates in the Redis Geo index.
   * Note: Redis GEOADD takes longitude first, then latitude.
   */
  async updateRiderLocation(riderId: string, lat: number, lon: number): Promise<number | string> {
    const redis = getRedisClient();
    return redis.geoadd(GEO_KEY, lon, lat, riderId);
  }

  /**
   * Retrieves all rider IDs within a specified radius (in kilometers) from a given location,
   * sorted by distance from closest to farthest.
   */
  async getNearbyRiders(lat: number, lon: number, radiusKm: number): Promise<string[]> {
    const redis = getRedisClient();
    // Using georadius as it is universally supported across Redis versions and mock clients
    const result = await redis.georadius(GEO_KEY, lon, lat, radiusKm, 'km', 'ASC');
    return result as string[];
  }

  /**
   * Retrieves all rider IDs within a specified radius, along with their coordinates.
   */
  async getNearbyRidersWithLocation(lat: number, lon: number, radiusKm: number): Promise<Array<{ id: string, lat: number, lon: number }>> {
    const redis = getRedisClient();
    const riderIds = await redis.georadius(GEO_KEY, lon, lat, radiusKm, 'km', 'ASC') as string[];
    
    if (riderIds.length === 0) return [];

    const positions = await redis.geopos(GEO_KEY, ...riderIds);
    return riderIds.map((id, index) => {
      const pos = positions[index];
      // Note: geopos returns [lon, lat]
      return {
        id,
        lat: pos ? parseFloat(pos[1]) : 0,
        lon: pos ? parseFloat(pos[0]) : 0,
      };
    });
  }

  /**
   * Removes a rider from the geospatial index (e.g. when they go offline or disconnect).
   * Since Redis geo indexes are stored as sorted sets, we use zrem.
   */
  async removeRiderLocation(riderId: string): Promise<number> {
    const redis = getRedisClient();
    return redis.zrem(GEO_KEY, riderId);
  }

  /**
   * Completely clears the geospatial index (useful for simulation reset).
   */
  async clearAllRiderLocations(): Promise<number> {
    const redis = getRedisClient();
    return redis.del(GEO_KEY);
  }
}

export const geoService = new GeoService();
