import React from 'react';
import {
  AppSettings,
  AppMode,
  StringPatternMode,
  ColorPalette,
} from '../types';
import {
  Zap,
  Square,
  Paintbrush,
  Sparkles,
  Sliders,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Plus,
  RotateCcw,
  Hand,
  Activity,
  Layers,
} from 'lucide-react';

interface ControlsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onSpawnSquare: () => void;
  onResetSquares: () => void;
  onClearTrails: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  settings,
  onUpdateSettings,
  onSpawnSquare,
  onResetSquares,
  onClearTrails,
  isOpen,
  onToggleOpen,
}) => {
  const modes: { id: AppMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'laser-web',
      label: 'Laser String Web',
      icon: <Zap className="w-4 h-4 text-cyan-400" />,
      desc: 'Draws glowing colorful laser strings between fingertips (Matches photo)',
    },
    {
      id: 'square-manipulation',
      label: 'Square & Pinch Mouse',
      icon: <Square className="w-4 h-4 text-pink-400" />,
      desc: 'Use pinch gesture as a mouse to grab, move, and 2-hand stretch squares',
    },
    {
      id: 'paint-drawing',
      label: 'Neon Air Painter',
      icon: <Paintbrush className="w-4 h-4 text-emerald-400" />,
      desc: 'Pinch your fingers to paint mid-air light trails',
    },
    {
      id: 'laser-physics',
      label: 'Energy Beam Physics',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      desc: 'Interactive glowing force field with particle beams',
    },
  ];

  const patterns: { id: StringPatternMode; label: string }[] = [
    { id: 'cross-web', label: 'Full Cross-Web (25 Lasers)' },
    { id: 'fingertips', label: 'Parallel Fingertip Pairs' },
    { id: 'nearest-neighbor', label: 'Proximity Network' },
    { id: 'starburst', label: 'Wrist Starburst' },
  ];

  const palettes: { id: ColorPalette; label: string; colorPreview: string }[] = [
    { id: 'cyber', label: 'Cyberpunk', colorPreview: 'bg-gradient-to-r from-cyan-400 to-pink-500' },
    { id: 'electric-cyan', label: 'Electric Blue', colorPreview: 'bg-gradient-to-r from-cyan-300 to-blue-600' },
    { id: 'matrix', label: 'Matrix Emerald', colorPreview: 'bg-gradient-to-r from-emerald-400 to-lime-400' },
    { id: 'sunset', label: 'Neon Sunset', colorPreview: 'bg-gradient-to-r from-rose-500 to-amber-400' },
    { id: 'rainbow', label: 'Rainbow Spectrum', colorPreview: 'bg-gradient-to-r from-red-500 via-green-400 to-blue-500' },
    { id: 'plasma', label: 'Plasma Gold', colorPreview: 'bg-gradient-to-r from-amber-400 to-red-600' },
  ];

  return (
    <>
      {/* Toggle Button for Mobile / Small Screens */}
      <button
        onClick={onToggleOpen}
        id="toggle-controls-btn"
        className="fixed top-4 left-4 z-40 p-3 bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-cyan-400 rounded-xl hover:bg-slate-800/90 transition shadow-lg shadow-cyan-950/40 flex items-center gap-2"
        title="Toggle Control Panel"
      >
        <Sliders className="w-5 h-5" />
        <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">
          {isOpen ? 'Close Panel' : 'Control HUD'}
        </span>
      </button>

      {/* Floating Control Drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-30 w-80 sm:w-96 bg-slate-950/90 backdrop-blur-xl border-r border-slate-800 text-slate-100 transition-transform duration-300 ease-out flex flex-col shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between pt-16 sm:pt-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-cyan-300 uppercase">
                Glow Hand Controls
              </h2>
              <p className="text-xs text-slate-400">Gesture & Web Controls</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar text-xs">
          {/* Interaction Mode Selection */}
          <div>
            <label className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Interaction Mode
            </label>
            <div className="grid grid-cols-1 gap-2 mt-1.5">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onUpdateSettings({ mode: m.id })}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                    settings.mode === m.id
                      ? 'bg-cyan-950/50 border-cyan-400 text-cyan-100 shadow-md shadow-cyan-950/50'
                      : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="mt-0.5">{m.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-xs">{m.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions for Squares / Paint */}
          {settings.mode === 'square-manipulation' && (
            <div className="p-3 bg-pink-950/30 border border-pink-500/30 rounded-xl space-y-2">
              <div className="text-pink-300 font-semibold text-xs flex items-center gap-1.5">
                <Square className="w-4 h-4 text-pink-400" />
                Square Control Actions
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Pinch index+thumb to grab and move a square as a mouse cursor. Pinch with both hands to rotate and stretch!
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onSpawnSquare}
                  className="flex-1 py-2 px-3 bg-pink-600/80 hover:bg-pink-500 text-white rounded-lg font-medium transition flex items-center justify-center gap-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Square
                </button>
                <button
                  onClick={onResetSquares}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition flex items-center justify-center gap-1 text-xs"
                  title="Reset Squares"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>
          )}

          {settings.mode === 'paint-drawing' && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-2">
              <div className="text-emerald-300 font-semibold text-xs flex items-center gap-1.5">
                <Paintbrush className="w-4 h-4 text-emerald-400" />
                Air Paint Actions
              </div>
              <p className="text-[11px] text-slate-300">
                Pinch your fingers to paint in glowing light. Release to move freely.
              </p>
              <button
                onClick={onClearTrails}
                className="w-full py-2 px-3 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg font-medium transition flex items-center justify-center gap-1 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Canvas
              </button>
            </div>
          )}

          {/* Laser Web Connection Pattern */}
          {settings.mode === 'laser-web' && (
            <div>
              <label className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Laser Connection Web Pattern
              </label>
              <div className="grid grid-cols-1 gap-1.5 mt-1.5">
                {patterns.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onUpdateSettings({ stringPattern: p.id })}
                    className={`py-2 px-3 rounded-lg border text-left transition text-xs flex items-center justify-between ${
                      settings.stringPattern === p.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-medium'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{p.label}</span>
                    {settings.stringPattern === p.id && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Palette Selection */}
          <div>
            <label className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Glow Palette
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {palettes.map((pal) => (
                <button
                  key={pal.id}
                  onClick={() => onUpdateSettings({ palette: pal.id })}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
                    settings.palette === pal.id
                      ? 'border-cyan-400 bg-cyan-950/40 font-semibold text-white'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full ${pal.colorPreview} shadow-sm`} />
                  <span className="text-[11px] truncate">{pal.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Smoothness / Fluidity Slider ("Haga la interacción más fluida") */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                <Hand className="w-3.5 h-3.5 text-cyan-400" />
                Interaction Smoothness (Fluidity)
              </label>
              <span className="text-cyan-400 font-mono font-bold text-xs">
                {Math.round(settings.fluidity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.85"
              step="0.05"
              value={settings.fluidity}
              onChange={(e) => onUpdateSettings({ fluidity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 leading-tight">
              Higher smoothness prevents landmark jitter & line flickering for silky fluid motion.
            </p>
          </div>

          {/* Line Glow & Thickness Sliders */}
          <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300 font-medium">Glow Intensity</span>
                <span className="text-slate-400 font-mono text-[11px]">{settings.glowIntensity}px</span>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                step="2"
                value={settings.glowIntensity}
                onChange={(e) => onUpdateSettings({ glowIntensity: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300 font-medium">Line Width</span>
                <span className="text-slate-400 font-mono text-[11px]">{settings.lineWidth}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={settings.lineWidth}
                onChange={(e) => onUpdateSettings({ lineWidth: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Video & Display Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider mb-2 block">
              Display & Audio Settings
            </label>

            <button
              onClick={() => onUpdateSettings({ showVideo: !settings.showVideo })}
              className="w-full p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center justify-between text-slate-300 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-2">
                {settings.showVideo ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
                <span>Show Camera Video Stream</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${settings.showVideo ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'}`}>
                {settings.showVideo ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              onClick={() => onUpdateSettings({ mirrorVideo: !settings.mirrorVideo })}
              className="w-full p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center justify-between text-slate-300 hover:border-slate-700 transition"
            >
              <span>Mirror Camera Feed</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${settings.mirrorVideo ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'}`}>
                {settings.mirrorVideo ? 'MIRRORED' : 'NORMAL'}
              </span>
            </button>

            <button
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className="w-full p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center justify-between text-slate-300 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                <span>Futuristic Audio Synth</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${settings.soundEnabled ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'}`}>
                {settings.soundEnabled ? 'ACTIVE' : 'MUTED'}
              </span>
            </button>

            <button
              onClick={() => onUpdateSettings({ showSkeleton: !settings.showSkeleton })}
              className="w-full p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center justify-between text-slate-300 hover:border-slate-700 transition"
            >
              <span>Show Hand Skeleton Bones</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${settings.showSkeleton ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'}`}>
                {settings.showSkeleton ? 'SHOW' : 'HIDE'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
