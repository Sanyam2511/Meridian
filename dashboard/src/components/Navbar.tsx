import React from 'react';
import { Compass, Activity, Server, Radio } from 'lucide-react';

interface NavbarProps {
  activeRidersCount: number;
  pendingOrdersCount: number;
  onResetSimulation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRidersCount,
  pendingOrdersCount,
  onResetSimulation,
}) => {
  return (
    <header className="glass-panel sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-zinc-800">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Compass className="w-6 h-6 text-black animate-spin-slow" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            MERIDIAN
          </h1>
          <p className="text-xs text-zinc-400 font-mono">ALGORITHMIC DISPATCH & EQUITY SOLVER</p>
        </div>
      </div>

      {/* System Telemetry Badges */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800">
          <Server className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-zinc-400">VRP ENGINE:</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE (8080)
          </span>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800">
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-zinc-400">GATEWAY:</span>
          <span className="text-cyan-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            ONLINE (3000)
          </span>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800">
          <Activity className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-zinc-300">ACTIVE FLEET: <strong className="text-white">{activeRidersCount}</strong></span>
          <span className="text-zinc-500">|</span>
          <span className="text-zinc-300">QUEUE: <strong className="text-white">{pendingOrdersCount}</strong></span>
        </div>

        <button
          onClick={onResetSimulation}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors cursor-pointer"
        >
          Reset Fleet State
        </button>
      </div>
    </header>
  );
};
