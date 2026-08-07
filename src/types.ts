export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface TrackedHand {
  landmarks: HandLandmark[];
  worldLandmarks?: HandLandmark[];
  handedness: 'Left' | 'Right';
  score: number;
  isPinching: boolean;
  pinchDistance: number;
  pinchPosition: { x: number; y: number };
  indexTip: Point3D;
  thumbTip: Point3D;
  wrist: Point3D;
}

export type StringPatternMode = 'fingertips' | 'cross-web' | 'nearest-neighbor' | 'skeleton-only' | 'starburst';

export type AppMode = 'laser-web' | 'square-manipulation' | 'pinch-mouse' | 'paint-drawing' | 'laser-physics';

export type ColorPalette = 'cyber' | 'matrix' | 'sunset' | 'rainbow' | 'plasma' | 'electric-cyan';

export interface InteractiveSquare {
  id: string;
  x: number; // center x in normalized or pixel coords
  y: number; // center y
  width: number;
  height: number;
  rotation: number; // in radians
  color: string;
  glowColor: string;
  isGrabbed: boolean;
  grabbedByHand?: 'Left' | 'Right' | 'Both';
  label?: string;
  vx?: number;
  vy?: number;
}

export interface DrawingTrail {
  id: string;
  points: { x: number; y: number; color: string; width: number }[];
  color: string;
  createdAt: number;
}

export interface AppSettings {
  mode: AppMode;
  stringPattern: StringPatternMode;
  palette: ColorPalette;
  fluidity: number; // 0.0 to 0.9 (smoothing factor)
  pinchSensitivity: number; // distance threshold in pixels/ratio
  glowIntensity: number; // 5 to 50 blur radius
  lineWidth: number; // 1 to 10
  showVideo: boolean;
  mirrorVideo: boolean;
  showSkeleton: boolean;
  showJointNodes: boolean;
  showStats: boolean;
  soundEnabled: boolean;
  audioVolume: number;
  maxHands: number;
}

export interface HandStats {
  fps: number;
  handsDetected: number;
  leftHandPinching: boolean;
  rightHandPinching: boolean;
  handDistance: number | null;
  activeGesture: string;
}
