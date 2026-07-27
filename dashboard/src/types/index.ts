export interface Rider {
  id: string;
  name: string;
  lat: number;
  lon: number;
  dailyEarnings: number;
  status: 'ACTIVE' | 'BUSY' | 'OFFLINE';
  vehicle: 'E-BIKE' | 'SCOOTER' | 'MOTORCYCLE';
}

export interface Order {
  id: string;
  restaurantName: string;
  pickupLat: number;
  pickupLon: number;
  dropoffLat: number;
  dropoffLon: number;
  payout: number;
  status: 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED';
  assignedRiderId?: string;
}

export interface AssignmentLogItem {
  id: string;
  timestamp: string;
  orderId: string;
  riderId: string;
  distanceKm: number;
  distanceScore: number;
  fairnessPenalty: number;
  totalCost: number;
}
