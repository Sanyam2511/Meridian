"use client";

import React, { useState, useEffect } from 'react';
import { Rider, Order, AssignmentLogItem } from '../types';
import { Navbar } from '../components/Navbar';
import { DispatchMap } from '../components/DispatchMap';
import { EquityAnalytics } from '../components/EquityAnalytics';
import { OptimizationControls } from '../components/OptimizationControls';
import { ActivityFeed } from '../components/ActivityFeed';



export default function Home() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
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
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleRunOptimization = async (w1: number, w2: number) => {
    setIsOptimizing(true);
    try {
      const response = await fetch('http://localhost:8080/api/v1/optimization/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weightDistance: w1,
          weightFairness: w2
        }),
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

  const handleResetSimulation = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/v1/data/reset', { method: 'POST' });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to reset simulation', error);
    }
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
