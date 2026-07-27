import React, { useState } from 'react';
import { Sliders, Zap, ShieldAlert, Cpu } from 'lucide-react';

interface OptimizationControlsProps {
  onRunOptimization: (w1: number, w2: number) => void;
  isOptimizing: boolean;
}

export const OptimizationControls: React.FC<OptimizationControlsProps> = ({
  onRunOptimization,
  isOptimizing,
}) => {
  const [w1, setW1] = useState<number>(1.0); // Distance Weight
  const [w2, setW2] = useState<number>(3.5); // Fairness Penalty Weight

  return (
    <div className="flex flex-col bg-zinc-950/90 rounded-2xl border border-zinc-800 p-5 shadow-xl font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-zinc-200 tracking-wide">CONSTRAINT SOLVER PARAMETERS</span>
        </div>
        <span className="text-[10px] bg-cyan-950/60 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800">
          GOOGLE OR-TOOLS
        </span>
      </div>

      {/* Parameter Sliders */}
      <div className="space-y-4 mb-5">
        {/* w1 Slider */}
        <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              w1: ROUTE EFFICIENCY (DISTANCE)
            </span>
            <span className="text-cyan-400 font-bold bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
              {w1.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="5.0"
            step="0.1"
            value={w1}
            onChange={(e) => setW1(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <p className="text-[10px] text-zinc-500 mt-1.5">
            Minimizes total vehicle kilometers traveled across the active delivery zone.
          </p>
        </div>

        {/* w2 Slider */}
        <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              w2: EARNINGS EQUITY (FAIRNESS)
            </span>
            <span className="text-emerald-400 font-bold bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
              {w2.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="10.0"
            step="0.1"
            value={w2}
            onChange={(e) => setW2(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
          <p className="text-[10px] text-zinc-500 mt-1.5">
            Penalizes assigning orders to high earners. High values prioritize riders with lower daily income.
          </p>
        </div>
      </div>

      {/* Algorithmic Trade-off Explainer */}
      <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60 mb-5 flex items-start gap-2.5 text-zinc-400 text-[11px]">
        <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-zinc-200 font-semibold">DUAL-OBJECTIVE FORMULATION:</span>
          <p className="mt-0.5 text-zinc-400 leading-relaxed">
            Cost = <span className="text-cyan-300">({w1.toFixed(1)} × Distance)</span> + <span className="text-emerald-300">({w2.toFixed(1)} × PayoutVariance)</span>. Increasing w2 overrides proximity to balance fleet equity.
          </p>
        </div>
      </div>

      {/* Trigger Button */}
      <button
        onClick={() => onRunOptimization(w1, w2)}
        disabled={isOptimizing}
        className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all duration-300 cursor-pointer ${
          isOptimizing
            ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black shadow-cyan-500/20 hover:shadow-cyan-500/40 scale-[1.01]'
        }`}
      >
        {isOptimizing ? (
          <>
            <Cpu className="w-4 h-4 animate-spin text-zinc-400" />
            SOLVING VRP CONSTRAINTS...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 fill-black text-black" />
            TRIGGER VRP ALLOCATION CYCLE
          </>
        )}
      </button>
    </div>
  );
};
