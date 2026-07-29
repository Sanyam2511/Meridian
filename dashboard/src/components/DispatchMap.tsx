import React, { useState } from 'react';
import { Rider, Order } from '../types';
import { Bike, Navigation2, Package, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DispatchMapProps {
  riders: Rider[];
  orders: Order[];
  onSelectRider?: (rider: Rider) => void;
  onSelectOrder?: (order: Order) => void;
}

export const DispatchMap: React.FC<DispatchMapProps> = ({
  riders,
  orders,
  onSelectRider,
  onSelectOrder,
}) => {
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Helper to map lat/lon (around SF 37.77, -122.41) to percentage coordinates [5%, 95%] for visual grid
  const mapToGridX = (lon: number) => {
    const minLon = -122.45;
    const maxLon = -122.38;
    const norm = (lon - minLon) / (maxLon - minLon);
    return Math.min(Math.max(norm * 90 + 5, 5), 95);
  };

  const mapToGridY = (lat: number) => {
    const minLat = 37.74;
    const maxLat = 37.80;
    // Invert Y so North (higher lat) is at top (lower Y %)
    const norm = 1 - (lat - minLat) / (maxLat - minLat);
    return Math.min(Math.max(norm * 90 + 5, 5), 95);
  };

  const getRiderStatusColor = (earnings: number) => {
    if (earnings < 60) return 'bg-amber-500 text-black shadow-amber-500/50 border-amber-300';
    if (earnings > 120) return 'bg-emerald-500 text-black shadow-emerald-500/50 border-emerald-300';
    return 'bg-cyan-500 text-black shadow-cyan-500/50 border-cyan-300';
  };

  const selectedRider = riders.find((r) => r.id === selectedRiderId);
  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  return (
    <div className="flex flex-col h-full bg-zinc-950/80 rounded-2xl border border-zinc-800 overflow-hidden relative shadow-2xl">
      {/* Map Header Bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-zinc-900/90 border-b border-zinc-800 z-10">
        <div className="flex items-center gap-2">
          <Navigation2 className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold tracking-wide text-zinc-200">LIVE ZONE DISPATCH GRID // SAN FRANCISCO METRO</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Under-Earning (&lt;$60)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" /> Balanced ($60-$120)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> High Earner (&gt;$120)
          </span>
        </div>
      </div>

      {/* Grid Canvas Area */}
      <div className="relative flex-1 min-h-[420px] bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] bg-zinc-950 p-6 overflow-hidden">
        {/* Radar scan animation ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-[380px] h-[380px] rounded-full border border-cyan-500/30 animate-ping" style={{ animationDuration: '4s' }} />
          <div className="absolute w-[240px] h-[240px] rounded-full border border-emerald-500/30" />
        </div>

        {/* Render Orders (Pickup pins) */}
        {orders.map((order) => {
          const x = mapToGridX(order.pickupLon);
          const y = mapToGridY(order.pickupLat);
          const isSelected = order.id === selectedOrderId;

          return (
            <div
              key={order.id}
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => {
                setSelectedOrderId(order.id);
                setSelectedRiderId(null);
                if (onSelectOrder) onSelectOrder(order);
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-300 z-20 group ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-xl border-2 shadow-lg ${
                order.status === 'ASSIGNED'
                  ? 'bg-purple-600 border-purple-300 text-white shadow-purple-500/40 animate-pulse'
                  : 'bg-rose-600 border-rose-300 text-white shadow-rose-500/40'
              }`}>
                <Package className="w-4 h-4" />
              </div>
              <span className="absolute left-1/2 -bottom-5 -translate-x-1/2 whitespace-nowrap bg-zinc-900/90 text-[10px] font-mono px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-300 opacity-90 group-hover:opacity-100">
                ${order.payout.toFixed(2)}
              </span>
            </div>
          );
        })}

        {/* Render Riders */}
        {riders.map((rider) => {
          const x = mapToGridX(rider.lon);
          const y = mapToGridY(rider.lat);
          const colorClass = getRiderStatusColor(rider.dailyEarnings);
          const isSelected = rider.id === selectedRiderId;

          return (
            <div
              key={rider.id}
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => {
                setSelectedRiderId(rider.id);
                setSelectedOrderId(null);
                if (onSelectRider) onSelectRider(rider);
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 z-20 group ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
            >
              <div className={`flex items-center justify-center w-9 h-9 rounded-full border-2 shadow-lg ${colorClass} ${
                rider.status === 'BUSY' ? 'opacity-75 ring-2 ring-purple-400' : ''
              }`}>
                <Bike className="w-5 h-5" />
              </div>
              <div className="absolute left-1/2 -bottom-6 -translate-x-1/2 whitespace-nowrap bg-black/90 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md border border-zinc-700 text-zinc-200">
                {rider.name} • <span className={rider.dailyEarnings < 60 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>${rider.dailyEarnings}</span>
              </div>
            </div>
          );
        })}

        {/* Floating Telemetry Detail Popover for Selected Rider */}
        {selectedRider && (
          <div className="absolute bottom-6 right-6 w-80 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 p-4 rounded-xl shadow-2xl z-40 animate-fade-in text-xs font-mono">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
              <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                <Bike className="w-4 h-4 text-cyan-400" /> RIDER TELEMETRY CARD
              </span>
              <button
                onClick={() => setSelectedRiderId(null)}
                className="text-zinc-500 hover:text-white px-1 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-500">ID / NAME:</span>
                <strong className="text-white">{selectedRider.id} ({selectedRider.name})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">VEHICLE TYPE:</span>
                <span className="text-cyan-300">{selectedRider.vehicle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">CURRENT STATUS:</span>
                <span className={selectedRider.status === 'ACTIVE' ? 'text-emerald-400 font-bold' : 'text-purple-400 font-bold'}>
                  {selectedRider.status}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-zinc-800/80">
                <span className="text-zinc-400">TODAY&apos;S EARNINGS:</span>
                <span className="text-lg font-bold text-white flex items-center">
                  <DollarSign className="w-4 h-4 text-emerald-400 inline" />
                  {selectedRider.dailyEarnings.toFixed(2)}
                </span>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800 mt-2 text-[11px]">
                {selectedRider.dailyEarnings < 60 ? (
                  <p className="text-amber-400 flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    EQUITY ALERT: Rider is ${ (85 - selectedRider.dailyEarnings).toFixed(0) } below fleet average. Solver will boost assignment priority.
                  </p>
                ) : (
                  <p className="text-emerald-400 flex items-start gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    EQUITY STATUS: Balanced payout distribution achieved.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Floating Telemetry Detail Popover for Selected Order */}
        {selectedOrder && (
          <div className="absolute bottom-6 right-6 w-80 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 p-4 rounded-xl shadow-2xl z-40 animate-fade-in text-xs font-mono">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
              <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                <Package className="w-4 h-4 text-rose-400" /> ORDER DISPATCH DETAILS
              </span>
              <button
                onClick={() => setSelectedOrderId(null)}
                className="text-zinc-500 hover:text-white px-1 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-500">ORDER ID:</span>
                <strong className="text-white">{selectedOrder.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">RESTAURANT:</span>
                <span className="text-rose-300">{selectedOrder.restaurantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">STATUS:</span>
                <span className={selectedOrder.status === 'ASSIGNED' ? 'text-purple-400 font-bold' : 'text-amber-400 font-bold'}>
                  {selectedOrder.status}
                </span>
              </div>
              {selectedOrder.assignedRiderId && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">ASSIGNED TO:</span>
                  <span className="text-cyan-300 font-bold">{selectedOrder.assignedRiderId}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-zinc-800/80">
                <span className="text-zinc-400">DISPATCH PAYOUT:</span>
                <span className="text-lg font-bold text-emerald-400">
                  ${selectedOrder.payout.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
