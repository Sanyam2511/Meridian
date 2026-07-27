import React from 'react';
import { AssignmentLogItem } from '../types';
import { Terminal, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

interface ActivityFeedProps {
  logs: AssignmentLogItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ logs }) => {
  return (
    <div className="flex flex-col bg-zinc-950/90 rounded-2xl border border-zinc-800 p-5 shadow-xl font-mono text-xs h-full">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-zinc-200 tracking-wide">VRP SOLVER TELEMETRY STREAM</span>
        </div>
        <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
          REAL-TIME LEDGER
        </span>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[340px] pr-1">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-600 text-center">
            <Sparkles className="w-8 h-8 mb-2 opacity-30 animate-pulse" />
            <p>Awaiting dispatch allocation cycle...</p>
            <p className="text-[10px] text-zinc-700 mt-1">Adjust w1/w2 sliders and trigger VRP solver above.</p>
          </div>
        ) : (
          logs.map((log) => {
            const isEquityDriven = log.fairnessPenalty < log.distanceScore * 0.5;

            return (
              <div
                key={log.id}
                className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80 hover:border-zinc-700 transition-all animate-fade-in"
              >
                <div className="flex items-center justify-between mb-1.5 border-b border-zinc-800/60 pb-1.5">
                  <span className="text-[10px] text-zinc-500 font-semibold">{log.timestamp}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-1 ${
                    isEquityDriven
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                  }`}>
                    <CheckCircle className="w-2.5 h-2.5 inline" />
                    {isEquityDriven ? 'EQUITY PRIORITY MATCH' : 'PROXIMITY OPTIMIZED'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-zinc-200 font-semibold text-sm mb-2">
                  <span className="text-rose-400 font-mono">{log.orderId}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                  <span className="text-cyan-300 font-mono">{log.riderId}</span>
                </div>

                {/* Mathematical Cost Breakdown */}
                <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-900 grid grid-cols-3 gap-2 text-[10px] text-center">
                  <div>
                    <span className="text-zinc-500 block">DISTANCE</span>
                    <span className="text-zinc-300 font-bold">{log.distanceKm} km</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">EQUITY PENALTY</span>
                    <span className={log.fairnessPenalty === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      +{log.fairnessPenalty.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-l border-zinc-800 pl-1">
                    <span className="text-zinc-500 block">TOTAL VRP COST</span>
                    <span className="text-white font-bold bg-purple-950/60 px-1 rounded border border-purple-800/50">
                      {log.totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
