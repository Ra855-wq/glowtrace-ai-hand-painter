import React from 'react';
import { HandStats, AppSettings } from '../types';
import { Activity, Radio, Hand, Sparkles, HelpCircle } from 'lucide-react';

interface StatsHUDProps {
  stats: HandStats;
  settings: AppSettings;
  onOpenHelp: () => void;
}

export const StatsHUD: React.FC<StatsHUDProps> = ({ stats, settings, onOpenHelp }) => {
  if (!settings.showStats) return null;

  return (
    <div className="fixed top-4 right-4 z-30 flex flex-col items-end gap-2 pointer-events-none">
      {/* Main HUD Card */}
      <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-slate-200 p-3.5 rounded-2xl shadow-xl shadow-cyan-950/30 w-64 space-y-2.5 pointer-events-auto">
        {/* Top Header & Help Button */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              Hand Tracking Active
            </span>
          </div>
          <button
            onClick={onOpenHelp}
            className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-md transition"
            title="Gesture Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* FPS & Hand Count */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Frame Rate</div>
            <div className="text-lg font-mono font-bold text-emerald-400 flex items-center justify-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              {stats.fps} <span className="text-[10px] text-slate-500 font-normal">FPS</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Hands Detected</div>
            <div className="text-lg font-mono font-bold text-cyan-300 flex items-center justify-center gap-1">
              <Hand className="w-3.5 h-3.5" />
              {stats.handsDetected}
            </div>
          </div>
        </div>

        {/* Pinch Meters for Left & Right Hand */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${stats.leftHandPinching ? 'bg-pink-500 animate-ping' : 'bg-slate-600'}`} />
              Left Hand:
            </span>
            <span className={`font-mono font-bold ${stats.leftHandPinching ? 'text-pink-400' : 'text-slate-400'}`}>
              {stats.leftHandPinching ? 'PINCHING' : 'OPEN'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${stats.rightHandPinching ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
              Right Hand:
            </span>
            <span className={`font-mono font-bold ${stats.rightHandPinching ? 'text-cyan-300' : 'text-slate-400'}`}>
              {stats.rightHandPinching ? 'PINCHING' : 'OPEN'}
            </span>
          </div>
        </div>

        {/* Active Gesture Badge */}
        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium">Active Gesture:</span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-semibold text-[10px] uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            {stats.activeGesture}
          </span>
        </div>
      </div>
    </div>
  );
};
