import { setRedisClient } from '../redis/redisClient';
import { geoService } from '../redis/geoService';
import { RedisGeoMock } from './redisGeoMock';

describe('GeoService with RedisGeoMock', () => {
  beforeEach(() => {
    const mockRedis = new RedisGeoMock() as any;
    setRedisClient(mockRedis);
  });

  it('should add a rider location to the geospatial index', async () => {
    const res = await geoService.updateRiderLocation('rider-101', 37.7749, -122.4194);
    expect(res).toBe(1);
  });

  it('should find nearby riders within the specified radius', async () => {
    // San Francisco coordinates
    await geoService.updateRiderLocation('rider-sf-1', 37.7749, -122.4194); // Central SF
    await geoService.updateRiderLocation('rider-sf-2', 37.7833, -122.4167); // ~1 km away in SF
    await geoService.updateRiderLocation('rider-ny-1', 40.7128, -74.0060);  // New York City (~4000 km away)

    // Search within 5 km of Central SF
    const nearby = await geoService.getNearbyRiders(37.7749, -122.4194, 5.0);

    expect(nearby).toContain('rider-sf-1');
    expect(nearby).toContain('rider-sf-2');
    expect(nearby).not.toContain('rider-ny-1');
    expect(nearby.length).toBe(2);
  });

  it('should remove a rider from the geospatial index on disconnect/offline', async () => {
    await geoService.updateRiderLocation('rider-temp', 37.7749, -122.4194);
    let nearby = await geoService.getNearbyRiders(37.7749, -122.4194, 5.0);
    expect(nearby).toContain('rider-temp');

    await geoService.removeRiderLocation('rider-temp');
    nearby = await geoService.getNearbyRiders(37.7749, -122.4194, 5.0);
    expect(nearby).not.toContain('rider-temp');
  });
});
