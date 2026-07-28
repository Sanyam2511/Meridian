"use client";

import React, { useState, useEffect } from 'react';
import { Rider, Order, AssignmentLogItem } from '../types';
import { Navbar } from '../components/Navbar';
import { DispatchMap } from '../components/DispatchMap';
import { EquityAnalytics } from '../components/EquityAnalytics';
import { OptimizationControls } from '../components/OptimizationControls';
import { ActivityFeed } from '../components/ActivityFeed';

const INITIAL_RIDERS: Rider[] = [
  { id: 'R-01', name: 'Alex M.', lat: 37.7749, lon: -122.4194, dailyEarnings: 45.50, status: 'ACTIVE', vehicle: 'E-BIKE' },
  { id: 'R-02', name: 'Jordan K.', lat: 37.7833, lon: -122.4167, dailyEarnings: 142.00, status: 'ACTIVE', vehicle: 'SCOOTER' },
  { id: 'R-03', name: 'Sara V.', lat: 37.7690, lon: -122.4400, dailyEarnings: 32.00, status: 'ACTIVE', vehicle: 'E-BIKE' },
  { id: 'R-04', name: 'Marcus T.', lat: 37.7890, lon: -122.4010, dailyEarnings: 88.50, status: 'ACTIVE', vehicle: 'MOTORCYCLE' },
  { id: 'R-05', name: 'Elena R.', lat: 37.7580, lon: -122.4210, dailyEarnings: 55.00, status: 'ACTIVE', vehicle: 'SCOOTER' },
  { id: 'R-06', name: 'David L.', lat: 37.7710, lon: -122.4080, dailyEarnings: 115.00, status: 'ACTIVE', vehicle: 'E-BIKE' },
  { id: 'R-07', name: 'Chloé B.', lat: 37.7950, lon: -122.4350, dailyEarnings: 64.00, status: 'ACTIVE', vehicle: 'SCOOTER' },
  { id: 'R-08', name: 'Samir P.', lat: 37.7620, lon: -122.4310, dailyEarnings: 128.50, status: 'ACTIVE', vehicle: 'MOTORCYCLE' },
];

const INITIAL_ORDERS: Order[] = [
  { id: 'ORD-801', restaurantName: 'Tartine Bakery', pickupLat: 37.7614, pickupLon: -122.4241, dropoffLat: 37.7700, dropoffLon: -122.4100, payout: 18.50, status: 'PENDING' },
  { id: 'ORD-802', restaurantName: 'House of Prime Rib', pickupLat: 37.7924, pickupLon: -122.4232, dropoffLat: 37.7800, dropoffLon: -122.4000, payout: 24.00, status: 'PENDING' },
  { id: 'ORD-803', restaurantName: 'Tony\'s Pizza Napoletana', pickupLat: 37.8003, pickupLon: -122.4091, dropoffLat: 37.7850, dropoffLon: -122.4200, payout: 21.50, status: 'PENDING' },
  { id: 'ORD-804', restaurantName: 'La Taqueria', pickupLat: 37.7509, pickupLon: -122.4181, dropoffLat: 37.7600, dropoffLon: -122.4350, payout: 15.00, status: 'PENDING' },
  { id: 'ORD-805', restaurantName: 'Marufuku Ramen', pickupLat: 37.7851, pickupLon: -122.4319, dropoffLat: 37.7750, dropoffLon: -122.4450, payout: 19.00, status: 'PENDING' },
  { id: 'ORD-806', restaurantName: 'Swan Oyster Depot', pickupLat: 37.7907, pickupLon: -122.4216, dropoffLat: 37.7780, dropoffLon: -122.4120, payout: 26.50, status: 'PENDING' },
];

export default function Home() {
  const [riders, setRiders] = useState<Rider[]>(INITIAL_RIDERS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [logs, setLogs] = useState<AssignmentLogItem[]>([]);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      const [ridersRes, ordersRes, logsRes] = await Promise.all([
        fetch('http://localhost:8080/api/v1/data/riders'),
        fetch('http://localhost:8080/api/v1/data/orders'),
        fetch('http://localhost:8080/api/v1/data/logs')
      ]);
      if (ridersRes.ok) setRiders(await ridersRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
    } catch (error) {
      console.error('Failed to fetch data from backend', error);
      // Fallback to initial data if backend is down
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunOptimization = async (w1: number, w2: number) => {
    setIsOptimizing(true);
    try {
      const response = await fetch('http://localhost:8080/api/v1/optimization/run', {
        method: 'POST',
      });
      if (response.ok) {
        // Refresh data after optimization
        await fetchData();
      }
    } catch (error) {
      console.error('Optimization failed', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleResetSimulation = () => {
    // In a real app, this would reset the backend DB.
    // For now, we just reset the UI to initial static mock data.
    setRiders(INITIAL_RIDERS.map((r) => ({ ...r })));
    setOrders(INITIAL_ORDERS.map((o) => ({ ...o })));
    setLogs([]);
  };

  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-500 selection:text-black pb-12">
      <Navbar
        activeRidersCount={riders.length}
        pendingOrdersCount={pendingOrdersCount}
        onResetSimulation={handleResetSimulation}
      />

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Dispatch Grid Map (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col min-h-[500px]">
          <DispatchMap riders={riders} orders={orders} />
        </div>

        {/* Right Column: Analytics, Controls, and Telemetry Feed (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Equity Analytics Panel */}
          <EquityAnalytics riders={riders} />

          {/* Solver Control Panel */}
          <OptimizationControls
            onRunOptimization={handleRunOptimization}
            isOptimizing={isOptimizing}
          />

          {/* Live Telemetry Activity Feed */}
          <ActivityFeed logs={logs} />
        </div>
      </main>
    </div>
  );
}
