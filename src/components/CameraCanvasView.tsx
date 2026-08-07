import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  AppSettings,
  HandStats,
  InteractiveSquare,
  DrawingTrail,
  TrackedHand,
} from '../types';
import { handTrackerService } from '../utils/handTracker';
import { HandSmoothingFilter } from '../utils/handSmoothing';
import { audioSynth } from '../utils/audioSynth';
import {
  getPaletteColors,
  drawHandSkeleton,
  drawLaserStringsBetweenHands,
  drawPinchVisuals,
  drawInteractiveSquares,
  drawDrawingTrails,
} from '../utils/drawing';
import { Camera, RefreshCw, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';

interface CameraCanvasViewProps {
  settings: AppSettings;
  onUpdateStats: (stats: HandStats) => void;
  squares: InteractiveSquare[];
  setSquares: React.Dispatch<React.SetStateAction<InteractiveSquare[]>>;
  trails: DrawingTrail[];
  setTrails: React.Dispatch<React.SetStateAction<DrawingTrail[]>>;
}

export const CameraCanvasView: React.FC<CameraCanvasViewProps> = ({
  settings,
  onUpdateStats,
  squares,
  setSquares,
  trails,
  setTrails,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing Camera & Vision AI...');
  const [loadingProgress, setLoadingProgress] = useState<number>(10);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const smoothingFilterRef = useRef<HandSmoothingFilter>(new HandSmoothingFilter());
  const activeTrailRef = useRef<DrawingTrail | null>(null);
  const prevPinchStateRef = useRef<Map<string, boolean>>(new Map());

  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const fpsRef = useRef<number>(60);
  const mousePosRef = useRef<{ x: number; y: number; isDown: boolean }>({ x: 640, y: 360, isDown: false });

  // Two-hand pinch state tracking
  const initialTwoHandDistRef = useRef<number | null>(null);
  const initialSquareDimensionsRef = useRef<{ w: number; h: number; rot: number } | null>(null);

  // Initialize Camera Stream
  const setupCamera = useCallback(async () => {
    setCameraError(null);
    setIsDemoMode(false);
    setLoadingStatus('Accessing camera feed...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve(true);
          }
        });
        await videoRef.current.play();
        setIsCameraReady(true);
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      const errMsg = err instanceof Error ? err.message : 'Could not access webcam';
      setCameraError(`Camera Permission Error: Camera access was blocked or denied by the browser context.`);
    }
  }, []);

  // Mouse / Touch event handlers for Demo Mode
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current.x = e.clientX;
      mousePosRef.current.y = e.clientY;
    };
    const handleMouseDown = () => {
      mousePosRef.current.isDown = true;
    };
    const handleMouseUp = () => {
      mousePosRef.current.isDown = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Initialize MediaPipe AI Hand Tracker
  useEffect(() => {
    let isMounted = true;

    async function loadAI() {
      try {
        await setupCamera();
        if (!isMounted) return;

        await handTrackerService.initialize(settings.maxHands, (msg, prog) => {
          if (isMounted) {
            setLoadingStatus(msg);
            if (prog !== undefined) setLoadingProgress(prog);
          }
        });

        if (isMounted) {
          setLoadingStatus('Ready');
        }
      } catch (err) {
        if (isMounted) {
          setCameraError('Failed to load AI hand tracker model. Please refresh and try again.');
        }
      }
    }

    loadAI();

    return () => {
      isMounted = false;
      handTrackerService.destroy();
    };
  }, [setupCamera, settings.maxHands]);

  // Audio Mute setting sync
  useEffect(() => {
    audioSynth.setMuted(!settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Main 60FPS Detection & Drawing Animation Loop
  const renderFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) {
      animFrameIdRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    if (!isDemoMode && (!video || video.readyState < 2)) {
      animFrameIdRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match Canvas dimensions
    const width = isDemoMode ? (window.innerWidth || 1280) : (video?.videoWidth || 1280);
    const height = isDemoMode ? (window.innerHeight || 720) : (video?.videoHeight || 720);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // FPS calculation
    const now = performance.now();
    frameCountRef.current++;
    if (now - lastTimeRef.current >= 1000) {
      fpsRef.current = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    const rawHands: { landmarks: { x: number; y: number; z: number }[]; handedness: 'Left' | 'Right'; score: number }[] = [];

    if (isDemoMode) {
      // Demo Mode: Generate 2 simulated interactive hands
      const time = now * 0.0015;
      const mX = mousePosRef.current.x / width;
      const mY = mousePosRef.current.y / height;
      const isPinching = mousePosRef.current.isDown;

      // Left hand follows mouse cursor with pinch on mouse down
      const h1cx = Math.max(0.1, Math.min(0.9, mX));
      const h1cy = Math.max(0.1, Math.min(0.9, mY));

      // Right hand moves smoothly in a wave or mirrors Left hand
      const h2cx = Math.max(0.1, Math.min(0.9, 0.7 + Math.sin(time) * 0.15));
      const h2cy = Math.max(0.1, Math.min(0.9, 0.45 + Math.cos(time * 0.8) * 0.15));

      const generateHandLandmarks = (cx: number, cy: number, pinch: boolean) => {
        const lms = [];
        for (let i = 0; i < 21; i++) {
          lms.push({ x: cx, y: cy, z: 0 });
        }
        // Wrist
        lms[0] = { x: cx, y: cy + 0.12, z: 0 };
        // Thumb (1..4)
        lms[1] = { x: cx - 0.03, y: cy + 0.08, z: 0 };
        lms[2] = { x: cx - 0.05, y: cy + 0.04, z: 0 };
        lms[3] = { x: cx - 0.06, y: cy, z: 0 };
        lms[4] = { x: pinch ? cx - 0.02 : cx - 0.07, y: pinch ? cy - 0.02 : cy - 0.03, z: 0 };
        // Index (5..8)
        lms[5] = { x: cx - 0.02, y: cy + 0.02, z: 0 };
        lms[6] = { x: cx - 0.022, y: cy - 0.02, z: 0 };
        lms[7] = { x: cx - 0.024, y: cy - 0.05, z: 0 };
        lms[8] = { x: pinch ? cx - 0.02 : cx - 0.025, y: pinch ? cy - 0.02 : cy - 0.08, z: 0 };
        // Middle (9..12)
        lms[9] = { x: cx, y: cy + 0.02, z: 0 };
        lms[10] = { x: cx, y: cy - 0.03, z: 0 };
        lms[11] = { x: cx, y: cy - 0.06, z: 0 };
        lms[12] = { x: cx, y: cy - 0.09, z: 0 };
        // Ring (13..16)
        lms[13] = { x: cx + 0.02, y: cy + 0.02, z: 0 };
        lms[14] = { x: cx + 0.022, y: cy - 0.025, z: 0 };
        lms[15] = { x: cx + 0.024, y: cy - 0.055, z: 0 };
        lms[16] = { x: cx + 0.025, y: cy - 0.08, z: 0 };
        // Pinky (17..20)
        lms[17] = { x: cx + 0.04, y: cy + 0.03, z: 0 };
        lms[18] = { x: cx + 0.042, y: cy, z: 0 };
        lms[19] = { x: cx + 0.044, y: cy - 0.03, z: 0 };
        lms[20] = { x: cx + 0.045, y: cy - 0.06, z: 0 };

        return lms;
      };

      rawHands.push({
        landmarks: generateHandLandmarks(h1cx, h1cy, isPinching),
        handedness: 'Left',
        score: 0.99,
      });

      rawHands.push({
        landmarks: generateHandLandmarks(h2cx, h2cy, false),
        handedness: 'Right',
        score: 0.99,
      });
    } else if (video) {
      // Real Camera MediaPipe AI Detection
      const startTimeMs = performance.now();
      const results = handTrackerService.detectForVideo(video, startTimeMs);

      if (results && results.landmarks && results.landmarks.length > 0) {
        for (let i = 0; i < results.landmarks.length; i++) {
          const handednessLabel = results.handednesses[i]?.[0]?.categoryName === 'Left' ? 'Left' : 'Right';
          const actualHandedness = settings.mirrorVideo
            ? (handednessLabel === 'Left' ? 'Right' : 'Left')
            : handednessLabel;

          rawHands.push({
            landmarks: results.landmarks[i],
            handedness: actualHandedness,
            score: results.handednesses[i]?.[0]?.score || 0.9,
          });
        }
      }
    }

    // Apply Exponential Moving Average (EMA) Landmark Smoothing
    const pinchPxThreshold = settings.pinchSensitivity;
    const trackedHands = smoothingFilterRef.current.process(
      rawHands,
      settings.fluidity,
      pinchPxThreshold,
      width,
      height
    );

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // Canvas Background (Video Feed vs Dark Cyber Space)
    if (!settings.showVideo) {
      ctx.fillStyle = '#030712'; // Dark slate-950 background
      ctx.fillRect(0, 0, width, height);

      // Subtle Cyber Grid Overlay
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
    }

    const paletteColors = getPaletteColors(settings.palette);

    // Render Laser Web Strings (Photo Match: Glowing colorful strings between fingertips!)
    if (settings.mode === 'laser-web' || settings.mode === 'laser-physics') {
      drawLaserStringsBetweenHands(
        ctx,
        trackedHands,
        width,
        height,
        settings.stringPattern,
        paletteColors,
        settings.lineWidth,
        settings.glowIntensity
      );
    }

    // Render Hand Skeleton & Joint Glow Nodes
    for (const hand of trackedHands) {
      drawHandSkeleton(
        ctx,
        hand,
        width,
        height,
        paletteColors,
        settings.showSkeleton,
        true,
        settings.glowIntensity
      );
      drawPinchVisuals(ctx, hand, paletteColors, settings.glowIntensity);
    }

    // Render & Process Interactive Neon Squares (Hand Mouse & Pinch Manipulation)
    if (settings.mode === 'square-manipulation' || settings.mode === 'laser-physics') {
      let updatedSquares = [...squares];
      const leftHand = trackedHands.find((h) => h.handedness === 'Left');
      const rightHand = trackedHands.find((h) => h.handedness === 'Right');

      // Check single-hand or two-hand square grabs
      const pinchingHands = trackedHands.filter((h) => h.isPinching);

      if (pinchingHands.length === 1) {
        // Single hand pinch -> Drag square around
        const hand = pinchingHands[0];
        const pPos = hand.pinchPosition;

        for (let i = 0; i < updatedSquares.length; i++) {
          const sq = updatedSquares[i];
          const halfW = sq.width / 2;
          const halfH = sq.height / 2;

          // Hit test
          if (
            pPos.x >= sq.x - halfW - 20 &&
            pPos.x <= sq.x + halfW + 20 &&
            pPos.y >= sq.y - halfH - 20 &&
            pPos.y <= sq.y + halfH + 20
          ) {
            updatedSquares[i] = {
              ...sq,
              x: pPos.x,
              y: pPos.y,
              isGrabbed: true,
              grabbedByHand: hand.handedness,
            };
            audioSynth.playSquareSnap();
            break;
          }
        }
      } else if (leftHand?.isPinching && rightHand?.isPinching && updatedSquares.length > 0) {
        // Two-hand pinch -> Minority Report 2-hand scale, rotate & move square!
        const p1 = leftHand.pinchPosition;
        const p2 = rightHand.pinchPosition;

        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

        if (initialTwoHandDistRef.current === null) {
          initialTwoHandDistRef.current = dist;
          const targetSq = updatedSquares[0];
          initialSquareDimensionsRef.current = {
            w: targetSq.width,
            h: targetSq.height,
            rot: targetSq.rotation,
          };
        } else if (initialSquareDimensionsRef.current) {
          const scaleFactor = dist / initialTwoHandDistRef.current;
          const newW = Math.max(60, Math.min(600, initialSquareDimensionsRef.current.w * scaleFactor));
          const newH = Math.max(60, Math.min(600, initialSquareDimensionsRef.current.h * scaleFactor));

          updatedSquares[0] = {
            ...updatedSquares[0],
            x: midX,
            y: midY,
            width: newW,
            height: newH,
            rotation: angle,
            isGrabbed: true,
            grabbedByHand: 'Both',
          };
          audioSynth.playSquareStretchTone(scaleFactor);
        }
      } else {
        // No hands pinching -> Release all grabs
        initialTwoHandDistRef.current = null;
        initialSquareDimensionsRef.current = null;
        updatedSquares = updatedSquares.map((sq) => ({ ...sq, isGrabbed: false, grabbedByHand: undefined }));
      }

      setSquares(updatedSquares);
      drawInteractiveSquares(ctx, updatedSquares, paletteColors, settings.glowIntensity);
    }

    // Render & Process Air Painting Trails
    if (settings.mode === 'paint-drawing') {
      const pinchingHand = trackedHands.find((h) => h.isPinching);

      if (pinchingHand) {
        const pPos = pinchingHand.pinchPosition;
        if (!activeTrailRef.current) {
          activeTrailRef.current = {
            id: `trail-${Date.now()}`,
            points: [{ x: pPos.x, y: pPos.y, color: paletteColors.primary, width: settings.lineWidth * 1.5 }],
            color: paletteColors.primary,
            createdAt: Date.now(),
          };
          audioSynth.playPinchSound(pinchingHand.handedness);
        } else {
          activeTrailRef.current.points.push({
            x: pPos.x,
            y: pPos.y,
            color: paletteColors.primary,
            width: settings.lineWidth * 1.5,
          });
        }
      } else if (activeTrailRef.current) {
        // Unpinched -> save completed trail to state
        const finishedTrail = activeTrailRef.current;
        activeTrailRef.current = null;
        if (finishedTrail && finishedTrail.points && finishedTrail.points.length > 1) {
          setTrails((prev) => [...prev.filter(Boolean), finishedTrail]);
        }
      }

      const allTrails = (activeTrailRef.current ? [...trails, activeTrailRef.current] : trails).filter(Boolean);
      drawDrawingTrails(ctx, allTrails, settings.glowIntensity);
    }

    // Audio Feedback & Gesture Sound Synthesis
    if (settings.soundEnabled && trackedHands.length > 0) {
      const h1 = trackedHands[0];
      const h2 = trackedHands[1];
      const h1Pos = { x: h1.wrist.x / width, y: h1.wrist.y / height };
      const h2Pos = h2 ? { x: h2.wrist.x / width, y: h2.wrist.y / height } : null;

      audioSynth.updateContinuousSynth(true, h1Pos, h2Pos, settings.audioVolume);

      // Play pinch chime tones when pinch gesture triggers
      for (const hand of trackedHands) {
        const wasPinching = prevPinchStateRef.current.get(hand.handedness) || false;
        if (hand.isPinching && !wasPinching) {
          audioSynth.playPinchSound(hand.handedness, hand.pinchPosition.y / height);
        }
        prevPinchStateRef.current.set(hand.handedness, hand.isPinching);
      }
    } else {
      audioSynth.updateContinuousSynth(false, null, null, 0);
    }

    // Update HUD Stats
    let activeGestureText = 'SEARCHING HANDS';
    if (trackedHands.length > 0) {
      const isAnyPinching = trackedHands.some((h) => h.isPinching);
      if (isAnyPinching) {
        activeGestureText = settings.mode === 'square-manipulation' ? 'PINCH & DRAG MOUSE' : 'PINCH ACTIVE';
      } else {
        activeGestureText = 'OPEN PALM / POINT';
      }
    }

    const leftH = trackedHands.find((h) => h.handedness === 'Left');
    const rightH = trackedHands.find((h) => h.handedness === 'Right');

    let interHandDistance: number | null = null;
    if (leftH && rightH) {
      interHandDistance = Math.round(
        Math.hypot(leftH.wrist.x - rightH.wrist.x, leftH.wrist.y - rightH.wrist.y)
      );
    }

    onUpdateStats({
      fps: fpsRef.current,
      handsDetected: trackedHands.length,
      leftHandPinching: !!leftH?.isPinching,
      rightHandPinching: !!rightH?.isPinching,
      handDistance: interHandDistance,
      activeGesture: activeGestureText,
    });

    animFrameIdRef.current = requestAnimationFrame(renderFrame);
  }, [
    settings,
    squares,
    setSquares,
    trails,
    setTrails,
    onUpdateStats,
  ]);

  // Start Animation Loop once video & AI are ready OR Demo Mode is active
  useEffect(() => {
    if (isCameraReady || isDemoMode) {
      animFrameIdRef.current = requestAnimationFrame(renderFrame);
    }
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isCameraReady, isDemoMode, renderFrame]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden flex items-center justify-center">
      {/* Hidden/Active HTML5 Video element */}
      <video
        ref={videoRef}
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          settings.showVideo && !isDemoMode ? 'opacity-100' : 'opacity-0'
        } ${settings.mirrorVideo ? 'scale-x-[-1]' : ''}`}
      />

      {/* Main Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full object-cover ${
          settings.mirrorVideo ? 'scale-x-[-1]' : ''
        }`}
      />

      {/* Loading Screen Indicator */}
      {(!isCameraReady || loadingStatus !== 'Ready') && !cameraError && !isDemoMode && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="absolute -inset-2 rounded-3xl border border-cyan-500/20 animate-ping opacity-25" />
          </div>

          <h3 className="text-lg font-bold text-slate-100 tracking-wide uppercase mb-1">
            Hand Laser AI Engine
          </h3>
          <p className="text-xs text-slate-400 mb-6 max-w-sm">{loadingStatus}</p>

          <div className="w-64 bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="bg-gradient-to-r from-cyan-400 to-pink-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-cyan-400 mt-2">{loadingProgress}%</span>
        </div>
      )}

      {/* Camera Error / Permission Request Screen */}
      {cameraError && !isDemoMode && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center text-slate-200">
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 mb-4 animate-pulse">
            <Camera className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">Camera Access Restricted</h3>
          <p className="text-xs text-slate-300 max-w-md mb-6 leading-relaxed">
            Camera permissions are restricted in this preview frame context. You can open the app in a dedicated browser tab to grant webcam permissions, or try the interactive demo mode right now!
          </p>

          <div className="flex flex-col gap-3 w-full max-w-sm">
            <button
              onClick={() => {
                setIsDemoMode(true);
                setCameraError(null);
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-cyan-950/50"
            >
              <Sparkles className="w-4 h-4" />
              Start Interactive Demo Mode
            </button>

            <button
              onClick={() => window.open(window.location.href, '_blank')}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 font-semibold rounded-xl transition flex items-center justify-center gap-2 text-xs"
            >
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              Open App in New Tab for Camera
            </button>

            <button
              onClick={setupCamera}
              className="w-full py-2.5 px-4 bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 rounded-xl transition flex items-center justify-center gap-2 text-[11px]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Camera Permission
            </button>
          </div>
        </div>
      )}

      {/* Demo Mode Badge */}
      {isDemoMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>Interactive Demo Mode (Move mouse & click to pinch!)</span>
          <button
            onClick={setupCamera}
            className="ml-2 underline text-amber-200 hover:text-white text-[11px]"
          >
            Switch to Camera
          </button>
        </div>
      )}

      {/* Mirror / Mode Onscreen Notification pill */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-4 py-2 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-full text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
        <Camera className="w-3.5 h-3.5 text-cyan-400" />
        <span>Mode: <strong className="text-cyan-300 font-semibold uppercase">{settings.mode.replace('-', ' ')}</strong></span>
        <span className="text-slate-600">•</span>
        <span className="text-slate-400">Position 2 hands to trigger Laser Strings</span>
      </div>
    </div>
  );
};
