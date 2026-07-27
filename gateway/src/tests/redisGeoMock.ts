// Lightweight in-memory mock for Redis geospatial commands (geoadd, georadius, zrem)
// to support automated unit and integration testing without a running Redis instance or missing ioredis-mock features.

export class RedisGeoMock {
  private geoStores: Map<string, Map<string, { lat: number; lon: number }>> = new Map();

  private getStore(key: string): Map<string, { lat: number; lon: number }> {
    if (!this.geoStores.has(key)) {
      this.geoStores.set(key, new Map());
    }
    return this.geoStores.get(key)!;
  }

  async geoadd(key: string, lon: number, lat: number, member: string): Promise<number> {
    const store = this.getStore(key);
    const existed = store.has(member);
    store.set(member, { lat, lon });
    return existed ? 0 : 1;
  }

  async georadius(key: string, lon: number, lat: number, radius: number, unit: string, sort: string): Promise<string[]> {
    const store = this.getStore(key);
    const results: { member: string; dist: number }[] = [];

    for (const [member, coords] of store.entries()) {
      const distKm = this.calculateHaversineKm(lat, lon, coords.lat, coords.lon);
      if (distKm <= radius) {
        results.push({ member, dist: distKm });
      }
    }

    if (sort === 'ASC') {
      results.sort((a, b) => a.dist - b.dist);
    } else if (sort === 'DESC') {
      results.sort((a, b) => b.dist - a.dist);
    }

    return results.map((r) => r.member);
  }

  async zrem(key: string, member: string): Promise<number> {
    const store = this.getStore(key);
    const existed = store.has(member);
    store.delete(member);
    return existed ? 1 : 0;
  }

  private calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
