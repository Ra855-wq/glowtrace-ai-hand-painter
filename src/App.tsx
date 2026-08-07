import React, { useState, useCallback } from 'react';
import { AppSettings, HandStats, InteractiveSquare, DrawingTrail } from './types';
import { CameraCanvasView } from './components/CameraCanvasView';
import { ControlsPanel } from './components/ControlsPanel';
import { StatsHUD } from './components/StatsHUD';
import { GestureGuideModal } from './components/GestureGuideModal';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>({
    mode: 'laser-web',
    stringPattern: 'cross-web',
    palette: 'cyber',
    fluidity: 0.5, // 50% smoothing by default for fluid movement
    pinchSensitivity: 60, // 60px pinch threshold
    glowIntensity: 22,
    lineWidth: 3,
    showVideo: true,
    mirrorVideo: true,
    showSkeleton: true,
    showJointNodes: true,
    showStats: true,
    soundEnabled: true, // Enabled by default for rich tones & audio interaction
    audioVolume: 0.5,
    maxHands: 2,
  });

  const [stats, setStats] = useState<HandStats>({
    fps: 60,
    handsDetected: 0,
    leftHandPinching: false,
    rightHandPinching: false,
    handDistance: null,
    activeGesture: 'INITIALIZING',
  });

  const [squares, setSquares] = useState<InteractiveSquare[]>([
    {
      id: 'square-default',
      x: typeof window !== 'undefined' ? window.innerWidth / 2 : 640,
      y: typeof window !== 'undefined' ? window.innerHeight / 2 : 360,
      width: 220,
      height: 220,
      rotation: 0,
      color: '#00f0ff',
      glowColor: '#00f0ff',
      isGrabbed: false,
      label: 'PINCH TO DRAG / STRETCH',
    },
  ]);

  const [trails, setTrails] = useState<DrawingTrail[]>([]);

  const [isControlsOpen, setIsControlsOpen] = useState<boolean>(true);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  const handleUpdateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const handleSpawnSquare = useCallback(() => {
    const colors = ['#00f0ff', '#ff007f', '#00ff66', '#ffaa00', '#aa00ff'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newSquare: InteractiveSquare = {
      id: `square-${Date.now()}`,
      x: window.innerWidth / 2 + (Math.random() * 120 - 60),
      y: window.innerHeight / 2 + (Math.random() * 120 - 60),
      width: 180,
      height: 180,
      rotation: 0,
      color: randomColor,
      glowColor: randomColor,
      isGrabbed: false,
      label: `NEON SQUARE #${squares.length + 1}`,
    };
    setSquares((prev) => [...prev, newSquare]);
  }, [squares.length]);

  const handleResetSquares = useCallback(() => {
    setSquares([
      {
        id: 'square-default',
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        width: 220,
        height: 220,
        rotation: 0,
        color: '#00f0ff',
        glowColor: '#00f0ff',
        isGrabbed: false,
        label: 'PINCH TO DRAG / STRETCH',
      },
    ]);
  }, []);

  const handleClearTrails = useCallback(() => {
    setTrails([]);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden font-sans select-none text-slate-100">
      {/* Background Camera & Hand Canvas View */}
      <CameraCanvasView
        settings={settings}
        onUpdateStats={setStats}
        squares={squares}
        setSquares={setSquares}
        trails={trails}
        setTrails={setTrails}
      />

      {/* Control Panel Drawer */}
      <ControlsPanel
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onSpawnSquare={handleSpawnSquare}
        onResetSquares={handleResetSquares}
        onClearTrails={handleClearTrails}
        isOpen={isControlsOpen}
        onToggleOpen={() => setIsControlsOpen((prev) => !prev)}
      />

      {/* Floating HUD Stats */}
      <StatsHUD
        stats={stats}
        settings={settings}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Gesture Instructions Modal */}
      <GestureGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
