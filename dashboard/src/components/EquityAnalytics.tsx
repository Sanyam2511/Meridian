import React from 'react';
import { Rider } from '../types';
import { BarChart3, TrendingUp, Users, Scale } from 'lucide-react';

interface EquityAnalyticsProps {
  riders: Rider[];
}

export const EquityAnalytics: React.FC<EquityAnalyticsProps> = ({ riders }) => {
  if (riders.length === 0) return null;

  const totalEarnings = riders.reduce((sum, r) => sum + r.dailyEarnings, 0);
  const avgEarnings = totalEarnings / riders.length;

  // Calculate variance and standard deviation
  const variance = riders.reduce((sum, r) => sum + Math.pow(r.dailyEarnings - avgEarnings, 2), 0) / riders.length;
  const stdDev = Math.sqrt(variance);

  // Gini-like equity score (0 to 100, where 100 is perfect equality)
  const equityScore = Math.max(0, Math.min(100, Math.round(100 - (stdDev / (avgEarnings || 1)) * 50)));

  // Sort riders by earnings ascending to highlight equity gaps
  const sortedRiders = [...riders].sort((a, b) => a.dailyEarnings - b.dailyEarnings);
  const maxEarnings = Math.max(...riders.map((r) => r.dailyEarnings), 100);

  return (
    <div className="flex flex-col bg-zinc-950/90 rounded-2xl border border-zinc-800 p-5 shadow-xl font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-zinc-200 tracking-wide">EARNINGS EQUITY TELEMETRY</span>
        </div>
        <span className="text-[10px] bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
          DUAL-OBJECTIVE TARGET
        </span>
      </div>

      {/* Equity KPI Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/80 flex flex-col justify-between">
          <span className="text-zinc-500 text-[10px] flex items-center gap-1">
            <Users className="w-3 h-3 text-cyan-400" /> FLEET AVG PAYOUT
          </span>
          <span className="text-xl font-bold text-white mt-1">
            ${avgEarnings.toFixed(2)}
          </span>
          <span className="text-[10px] text-zinc-400 mt-1">Total Pool: ${totalEarnings.toFixed(0)}</span>
        </div>

        <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/80 flex flex-col justify-between">
          <span className="text-zinc-500 text-[10px] flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" /> EQUITY SCORE
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-bold ${equityScore >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {equityScore}
            </span>
            <span className="text-zinc-500 text-[11px]">/ 100</span>
          </div>
          <span className="text-[10px] text-zinc-400 mt-1">Std Dev: ±${stdDev.toFixed(1)}</span>
        </div>
      </div>

      {/* Visual Distribution List */}
      <div className="flex items-center justify-between text-zinc-400 text-[11px] font-semibold mb-2">
        <span className="flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-zinc-400" /> FLEET DISPARITY DISTRIBUTION
        </span>
        <span>TODAY&apos;S PAYOUT</span>
      </div>

      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
        {sortedRiders.map((rider) => {
          const percentage = Math.min(100, Math.round((rider.dailyEarnings / maxEarnings) * 100));
          const isUnderEarning = rider.dailyEarnings < avgEarnings - 15;

          return (
            <div key={rider.id} className="group bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/60 hover:bg-zinc-900 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-zinc-300 group-hover:text-white transition-colors">
                  {rider.name} <span className="text-zinc-500 text-[10px]">({rider.vehicle})</span>
                </span>
                <div className="flex items-center gap-2">
                  {isUnderEarning && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                      PRIORITY BOOST
                    </span>
                  )}
                  <span className={`font-bold ${isUnderEarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                    ${rider.dailyEarnings.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Progress bar comparing against max */}
              <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isUnderEarning
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                  }`}
                  style={{ width: `${Math.max(percentage, 5)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
