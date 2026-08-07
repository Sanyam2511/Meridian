import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { geoService } from './redis/geoService';

export const createAppServer = () => {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Keep track of which socket belongs to which rider for cleanup on disconnect
  const socketToRiderMap = new Map<string, string>();
  // Reverse lookup to find a rider's socket for push notifications
  const riderToSocketMap = new Map<string, string>();

  io.on('connection', (socket: Socket) => {
    console.log(`[Gateway] New socket connected: ${socket.id}`);

    socket.on('rider:ping', async (data: { riderId: string; lat: number; lon: number }) => {
      try {
        const { riderId, lat, lon } = data;
        if (!riderId || lat === undefined || lon === undefined) {
          socket.emit('rider:ping:error', { message: 'Invalid GPS ping payload' });
          return;
        }

        await geoService.updateRiderLocation(riderId, lat, lon);
        socketToRiderMap.set(socket.id, riderId);
        riderToSocketMap.set(riderId, socket.id);
        socket.emit('rider:ping:ack', { status: 'OK', timestamp: Date.now() });
      } catch (err: any) {
        console.error(`[Gateway] Error updating location for socket ${socket.id}:`, err);
        socket.emit('rider:ping:error', { message: 'Internal server error' });
      }
    });

    socket.on('disconnect', async () => {
      console.log(`[Gateway] Socket disconnected: ${socket.id}`);
      const riderId = socketToRiderMap.get(socket.id);
      if (riderId) {
        try {
          await geoService.removeRiderLocation(riderId);
          socketToRiderMap.delete(socket.id);
          riderToSocketMap.delete(riderId);
          console.log(`[Gateway] Removed rider ${riderId} from hot state layer.`);
        } catch (err) {
          console.error(`[Gateway] Failed to remove rider location on disconnect:`, err);
        }
      }
    });
  });

  // REST endpoint to query nearby riders from Redis
  app.get('/api/v1/riders/nearby', async (req: Request, res: Response) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const radiusKm = parseFloat(req.query.radius as string) || 5.0;

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'lat and lon query parameters are required as numbers.' });
      }

      const nearbyRiders = await geoService.getNearbyRiders(lat, lon, radiusKm);
      return res.json({ lat, lon, radiusKm, count: nearbyRiders.length, riders: nearbyRiders });
    } catch (err: any) {
      console.error('[Gateway] Error fetching nearby riders:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // REST endpoint to query nearby riders WITH coordinates
  app.get('/api/v1/riders/nearby-active', async (req: Request, res: Response) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const radiusKm = parseFloat(req.query.radius as string) || 25.0;

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'lat and lon query parameters are required as numbers.' });
      }

      const activeRiders = await geoService.getNearbyRidersWithLocation(lat, lon, radiusKm);
      return res.json({ count: activeRiders.length, riders: activeRiders });
    } catch (err: any) {
      console.error('[Gateway] Error fetching nearby active riders:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // REST endpoint to seed the hot state layer (clear and recreate)
  app.post('/api/v1/riders/seed', async (req: Request, res: Response) => {
    try {
      const riders = req.body.riders;
      if (!Array.isArray(riders)) {
        return res.status(400).json({ error: 'Expected riders array in body' });
      }

      await geoService.clearAllRiderLocations();
      
      for (const r of riders) {
        if (r.id && r.lat !== undefined && r.lon !== undefined) {
          await geoService.updateRiderLocation(r.id, r.lat, r.lon);
        }
      }
      
      return res.json({ success: true, count: riders.length });
    } catch (err: any) {
      console.error('[Gateway] Error seeding riders:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  // REST endpoint for the Java Optimization Engine to push assignment notifications
  app.post('/api/v1/notifications/assignment', (req: Request, res: Response) => {
    const { riderId, orderId, payout, pickupLat, pickupLon } = req.body;
    
    if (!riderId || !orderId) {
      return res.status(400).json({ error: 'riderId and orderId are required' });
    }

    const socketId = riderToSocketMap.get(riderId);
    if (socketId) {
      io.to(socketId).emit('order:assigned', { orderId, payout, pickupLat, pickupLon, timestamp: Date.now() });
      console.log(`[Gateway] Pushed assignment ${orderId} to rider ${riderId} on socket ${socketId}`);
      return res.json({ success: true, delivered: true });
    } else {
      console.log(`[Gateway] Rider ${riderId} is not connected. Assignment ${orderId} missed push.`);
      return res.json({ success: true, delivered: false });
    }
  });
  return { app, server, io };
};
