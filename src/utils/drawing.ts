import { TrackedHand, ColorPalette, StringPatternMode, InteractiveSquare, DrawingTrail } from '../types';

export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [5, 9], [9, 10], [10, 11], [11, 12], // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17] // Pinky & Palm
];

export const FINGERTIP_INDICES = [4, 8, 12, 16, 20];

export function getPaletteColors(palette: ColorPalette): { primary: string; secondary: string; glow: string; accent: string; gradient: string[] } {
  switch (palette) {
    case 'cyber':
      return {
        primary: '#00f0ff',
        secondary: '#ff007f',
        glow: '#00f0ff',
        accent: '#7000ff',
        gradient: ['#00f0ff', '#7000ff', '#ff007f', '#00ffff'],
      };
    case 'matrix':
      return {
        primary: '#00ff66',
        secondary: '#00cc44',
        glow: '#00ff66',
        accent: '#aaff00',
        gradient: ['#00ff66', '#aaff00', '#00ffcc', '#00ff66'],
      };
    case 'sunset':
      return {
        primary: '#ff3366',
        secondary: '#ff9900',
        glow: '#ff3366',
        accent: '#ff00cc',
        gradient: ['#ff3366', '#ff9900', '#ff00cc', '#ffcc00'],
      };
    case 'rainbow':
      return {
        primary: '#00f0ff',
        secondary: '#ff0055',
        glow: '#00ffff',
        accent: '#ffe600',
        gradient: ['#ff0055', '#ff9900', '#ffe600', '#00ff66', '#00ffff', '#9900ff'],
      };
    case 'plasma':
      return {
        primary: '#ffaa00',
        secondary: '#ff3300',
        glow: '#ffaa00',
        accent: '#ffffff',
        gradient: ['#ff3300', '#ffaa00', '#ffffff', '#ff00aa'],
      };
    case 'electric-cyan':
    default:
      return {
        primary: '#00f3ff',
        secondary: '#0088ff',
        glow: '#00f3ff',
        accent: '#ffffff',
        gradient: ['#00f3ff', '#0088ff', '#ffffff', '#00f3ff'],
      };
  }
}

export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  hand: TrackedHand,
  width: number,
  height: number,
  paletteColors: ReturnType<typeof getPaletteColors>,
  showSkeleton: boolean,
  showJoints: boolean,
  glowIntensity: number
) {
  const landmarks = hand.landmarks;

  if (showSkeleton) {
    ctx.save();
    ctx.lineWidth = 3;
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = hand.handedness === 'Left' ? paletteColors.primary : paletteColors.secondary;
    ctx.strokeStyle = hand.handedness === 'Left' ? paletteColors.primary : paletteColors.secondary;

    for (const [i, j] of HAND_CONNECTIONS) {
      const p1 = landmarks[i];
      const p2 = landmarks[j];

      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (showJoints) {
    ctx.save();
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      const isFingertip = FINGERTIP_INDICES.includes(i);
      const radius = isFingertip ? 7 : 4;

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, radius, 0, Math.PI * 2);

      if (isFingertip) {
        ctx.fillStyle = hand.isPinching && (i === 4 || i === 8) ? '#ffffff' : paletteColors.accent;
        ctx.shadowBlur = glowIntensity * 1.5;
        ctx.shadowColor = paletteColors.glow;
      } else {
        ctx.fillStyle = hand.handedness === 'Left' ? paletteColors.primary : paletteColors.secondary;
        ctx.shadowBlur = glowIntensity * 0.6;
        ctx.shadowColor = ctx.fillStyle;
      }

      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
}

export function drawLaserStringsBetweenHands(
  ctx: CanvasRenderingContext2D,
  hands: TrackedHand[],
  width: number,
  height: number,
  pattern: StringPatternMode,
  paletteColors: ReturnType<typeof getPaletteColors>,
  lineWidth: number,
  glowIntensity: number
) {
  if (hands.length < 1) return;

  ctx.save();
  ctx.lineWidth = lineWidth;

  // Case 1: Two hands detected -> Draw laser web between Hand 0 and Hand 1
  if (hands.length >= 2) {
    const hand1 = hands[0];
    const hand2 = hands[1];

    const hand1Tips = FINGERTIP_INDICES.map((idx) => hand1.landmarks[idx]);
    const hand2Tips = FINGERTIP_INDICES.map((idx) => hand2.landmarks[idx]);

    let connectionPairs: { p1: { x: number; y: number }; p2: { x: number; y: number }; colorIdx: number }[] = [];

    if (pattern === 'fingertips') {
      // 1-to-1 fingertips (Thumb-Thumb, Index-Index, etc.)
      for (let i = 0; i < 5; i++) {
        connectionPairs.push({
          p1: { x: hand1Tips[i].x * width, y: hand1Tips[i].y * height },
          p2: { x: hand2Tips[i].x * width, y: hand2Tips[i].y * height },
          colorIdx: i,
        });
      }
    } else if (pattern === 'cross-web') {
      // All fingertips connected to all fingertips (25 laser strings as shown in photo!)
      let pairIdx = 0;
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          connectionPairs.push({
            p1: { x: hand1Tips[i].x * width, y: hand1Tips[i].y * height },
            p2: { x: hand2Tips[j].x * width, y: hand2Tips[j].y * height },
            colorIdx: pairIdx % paletteColors.gradient.length,
          });
          pairIdx++;
        }
      }
    } else if (pattern === 'nearest-neighbor') {
      // Connect landmarks that are close to each other
      for (let i = 0; i < hand1.landmarks.length; i++) {
        const p1 = { x: hand1.landmarks[i].x * width, y: hand1.landmarks[i].y * height };
        for (let j = 0; j < hand2.landmarks.length; j++) {
          const p2 = { x: hand2.landmarks[j].x * width, y: hand2.landmarks[j].y * height };
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (dist < width * 0.35) {
            connectionPairs.push({
              p1,
              p2,
              colorIdx: (i + j) % paletteColors.gradient.length,
            });
          }
        }
      }
    } else if (pattern === 'starburst') {
      // Connect wrists to all opposite fingertips
      const w1 = { x: hand1.wrist.x, y: hand1.wrist.y };
      const w2 = { x: hand2.wrist.x, y: hand2.wrist.y };

      for (let i = 0; i < 5; i++) {
        connectionPairs.push({ p1: w1, p2: { x: hand2Tips[i].x * width, y: hand2Tips[i].y * height }, colorIdx: i });
        connectionPairs.push({ p1: w2, p2: { x: hand1Tips[i].x * width, y: hand1Tips[i].y * height }, colorIdx: i + 2 });
      }
    }

    // Draw pair lines with gradient glow & energy pulse
    const time = Date.now() * 0.003;

    for (const pair of connectionPairs) {
      const color = paletteColors.gradient[pair.colorIdx % paletteColors.gradient.length];

      ctx.save();
      ctx.shadowBlur = glowIntensity;
      ctx.shadowColor = color;

      // Linear gradient along the laser line
      const grad = ctx.createLinearGradient(pair.p1.x, pair.p1.y, pair.p2.x, pair.p2.y);
      grad.addColorStop(0, color);
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(1, paletteColors.gradient[(pair.colorIdx + 2) % paletteColors.gradient.length]);

      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(pair.p1.x, pair.p1.y);
      ctx.lineTo(pair.p2.x, pair.p2.y);
      ctx.stroke();

      // Energy pulse dot moving along the line
      const t = (Math.sin(time + pair.colorIdx * 0.5) + 1) / 2;
      const px = pair.p1.x + (pair.p2.x - pair.p1.x) * t;
      const py = pair.p1.y + (pair.p2.y - pair.p1.y) * t;

      ctx.beginPath();
      ctx.arc(px, py, lineWidth * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();
    }
  } else if (hands.length === 1 && pattern === 'cross-web') {
    // Single hand -> Connect fingertips to each other inside the single hand!
    const hand = hands[0];
    const tips = FINGERTIP_INDICES.map((idx) => ({
      x: hand.landmarks[idx].x * width,
      y: hand.landmarks[idx].y * height,
    }));

    for (let i = 0; i < tips.length; i++) {
      for (let j = i + 1; j < tips.length; j++) {
        const color = paletteColors.gradient[(i + j) % paletteColors.gradient.length];
        ctx.save();
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;

        ctx.beginPath();
        ctx.moveTo(tips[i].x, tips[i].y);
        ctx.lineTo(tips[j].x, tips[j].y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  ctx.restore();
}

export function drawPinchVisuals(
  ctx: CanvasRenderingContext2D,
  hand: TrackedHand,
  paletteColors: ReturnType<typeof getPaletteColors>,
  glowIntensity: number
) {
  const { pinchPosition, isPinching, pinchDistance } = hand;

  ctx.save();
  ctx.translate(pinchPosition.x, pinchPosition.y);

  if (isPinching) {
    // Active Pinch Ring / Pulse
    ctx.shadowBlur = glowIntensity * 1.8;
    ctx.shadowColor = '#ffffff';

    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = paletteColors.accent;
    ctx.fill();

    // Crosshair target tick marks
    ctx.strokeStyle = paletteColors.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-22, 0); ctx.lineTo(-14, 0);
    ctx.moveTo(14, 0); ctx.lineTo(22, 0);
    ctx.moveTo(0, -22); ctx.lineTo(0, -14);
    ctx.moveTo(0, 14); ctx.lineTo(0, 22);
    ctx.stroke();
  } else {
    // Open Pinch Guide Circle (collapses as fingers get closer)
    const ringRadius = Math.max(10, Math.min(40, pinchDistance * 0.4));
    ctx.shadowBlur = glowIntensity * 0.8;
    ctx.shadowColor = paletteColors.primary;

    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = paletteColors.primary;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawInteractiveSquares(
  ctx: CanvasRenderingContext2D,
  squares: InteractiveSquare[],
  paletteColors: ReturnType<typeof getPaletteColors>,
  glowIntensity: number
) {
  for (const sq of squares) {
    ctx.save();
    ctx.translate(sq.x, sq.y);
    ctx.rotate(sq.rotation);

    const halfW = sq.width / 2;
    const halfH = sq.height / 2;

    ctx.shadowBlur = sq.isGrabbed ? glowIntensity * 2 : glowIntensity;
    ctx.shadowColor = sq.isGrabbed ? '#ffffff' : sq.glowColor || paletteColors.primary;

    // Glowing Neon Square Background Fill & Border
    ctx.fillStyle = sq.isGrabbed ? 'rgba(0, 240, 255, 0.25)' : 'rgba(0, 240, 255, 0.08)';
    ctx.fillRect(-halfW, -halfH, sq.width, sq.height);

    ctx.strokeStyle = sq.isGrabbed ? '#ffffff' : sq.color || paletteColors.primary;
    ctx.lineWidth = sq.isGrabbed ? 4 : 2.5;
    ctx.strokeRect(-halfW, -halfH, sq.width, sq.height);

    // Corner Handles (Sci-Fi Box Brackets)
    const cornerSize = 12;
    ctx.strokeStyle = sq.isGrabbed ? '#ff007f' : paletteColors.accent;
    ctx.lineWidth = 3;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(-halfW, -halfH + cornerSize); ctx.lineTo(-halfW, -halfH); ctx.lineTo(-halfW + cornerSize, -halfH);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(halfW - cornerSize, -halfH); ctx.lineTo(halfW, -halfH); ctx.lineTo(halfW, -halfH + cornerSize);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(-halfW, halfH - cornerSize); ctx.lineTo(-halfW, halfH); ctx.lineTo(-halfW + cornerSize, halfH);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(halfW - cornerSize, halfH); ctx.lineTo(halfW, halfH); ctx.lineTo(halfW, halfH - cornerSize);
    ctx.stroke();

    // Label / Instructions inside Square
    if (sq.label) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sq.label, 0, 0);
    }

    ctx.restore();
  }
}

export function drawDrawingTrails(
  ctx: CanvasRenderingContext2D,
  trails: DrawingTrail[],
  glowIntensity: number
) {
  if (!trails || !Array.isArray(trails)) return;
  ctx.save();
  for (const trail of trails) {
    if (!trail || !trail.points || !Array.isArray(trail.points) || trail.points.length < 2) continue;

    ctx.shadowBlur = glowIntensity * 1.5;
    ctx.shadowColor = trail.color || '#00f0ff';
    ctx.strokeStyle = trail.color || '#00f0ff';

    ctx.beginPath();
    ctx.moveTo(trail.points[0].x, trail.points[0].y);

    for (let i = 1; i < trail.points.length; i++) {
      const p = trail.points[i];
      if (!p) continue;
      ctx.lineWidth = p.width || 4;
      ctx.lineTo(p.x, p.y);
    }

    ctx.stroke();
  }
  ctx.restore();
}
