import request from 'supertest';
import { createAppServer } from '../server';
import { setRedisClient } from '../redis/redisClient';
import { geoService } from '../redis/geoService';
import { RedisGeoMock } from './redisGeoMock';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { AddressInfo } from 'net';

describe('Gateway Server & Socket Integration', () => {
  let app: any;
  let server: any;
  let ioServer: any;
  let clientSocket: ClientSocket;
  let port: number;

  beforeEach((done) => {
    const mockRedis = new RedisGeoMock() as any;
    setRedisClient(mockRedis);

    const { app: expressApp, server: httpServer, io } = createAppServer();
    app = expressApp;
    server = httpServer;
    ioServer = io;

    server.listen(0, () => {
      port = (server.address() as AddressInfo).port;
      clientSocket = Client(`http://localhost:${port}`, {
        transports: ['websocket', 'polling'],
        forceNew: true,
      });
      clientSocket.on('connect', () => {
        done();
      });
    });
  });

  afterEach((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    ioServer.close();
    server.close(done);
  });

  it('should accept rider:ping via WebSocket and store location in Redis', (done) => {
    clientSocket.emit('rider:ping', { riderId: 'socket-rider-1', lat: 37.7749, lon: -122.4194 });

    clientSocket.on('rider:ping:ack', async (ack: any) => {
      try {
        expect(ack.status).toBe('OK');
        const nearby = await geoService.getNearbyRiders(37.7749, -122.4194, 5.0);
        expect(nearby).toContain('socket-rider-1');
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should return nearby riders via REST endpoint GET /api/v1/riders/nearby', async () => {
    await geoService.updateRiderLocation('rest-rider-1', 37.7749, -122.4194);

    const response = await request(app)
      .get('/api/v1/riders/nearby')
      .query({ lat: 37.7749, lon: -122.4194, radius: 5.0 });

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.riders).toContain('rest-rider-1');
  });
});
