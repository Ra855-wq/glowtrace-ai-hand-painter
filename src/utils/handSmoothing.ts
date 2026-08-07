import { TrackedHand, HandLandmark } from '../types';

export class HandSmoothingFilter {
  private prevHands: Map<string, HandLandmark[]> = new Map();
  private prevPinchDistance: Map<string, number> = new Map();

  /**
   * Smooths incoming raw landmarks using Exponential Moving Average (EMA).
   * @param rawHands Raw hands from MediaPipe
   * @param smoothingFactor 0.0 (no smoothing) to 0.9 (heavy smoothing)
   */
  public process(
    rawHands: { landmarks: HandLandmark[]; handedness: 'Left' | 'Right'; score: number }[],
    smoothingFactor: number,
    pinchThreshold: number,
    canvasWidth: number,
    canvasHeight: number
  ): TrackedHand[] {
    // Convert factor: higher factor = smoother (more weight to previous frame)
    // Alpha for EMA: alpha = 1 - smoothingFactor (e.g. smoothing 0.7 -> alpha 0.3)
    const alpha = Math.max(0.05, Math.min(1.0, 1.0 - smoothingFactor));

    const trackedHands: TrackedHand[] = [];

    for (const rawHand of rawHands) {
      const handKey = rawHand.handedness;
      const prevLandmarks = this.prevHands.get(handKey);

      const smoothedLandmarks: HandLandmark[] = [];

      for (let i = 0; i < rawHand.landmarks.length; i++) {
        const raw = rawHand.landmarks[i];

        if (!prevLandmarks || !prevLandmarks[i]) {
          smoothedLandmarks.push({ ...raw });
        } else {
          const prev = prevLandmarks[i];
          smoothedLandmarks.push({
            x: prev.x * (1 - alpha) + raw.x * alpha,
            y: prev.y * (1 - alpha) + raw.y * alpha,
            z: prev.z * (1 - alpha) + raw.z * alpha,
          });
        }
      }

      this.prevHands.set(handKey, smoothedLandmarks);

      // Pinch detection (Index tip index 8, Thumb tip index 4)
      const thumbTip = smoothedLandmarks[4];
      const indexTip = smoothedLandmarks[8];
      const wrist = smoothedLandmarks[0];

      // Calculate Euclidean distance in screen pixels
      const dx = (thumbTip.x - indexTip.x) * canvasWidth;
      const dy = (thumbTip.y - indexTip.y) * canvasHeight;
      const distPx = Math.sqrt(dx * dx + dy * dy);

      // Smooth pinch distance
      const prevDist = this.prevPinchDistance.get(handKey) ?? distPx;
      const smoothedDist = prevDist * (1 - alpha) + distPx * alpha;
      this.prevPinchDistance.set(handKey, smoothedDist);

      const isPinching = smoothedDist < pinchThreshold;

      const pinchPos = {
        x: ((thumbTip.x + indexTip.x) / 2) * canvasWidth,
        y: ((thumbTip.y + indexTip.y) / 2) * canvasHeight,
      };

      trackedHands.push({
        landmarks: smoothedLandmarks,
        handedness: rawHand.handedness,
        score: rawHand.score,
        isPinching,
        pinchDistance: smoothedDist,
        pinchPosition: pinchPos,
        indexTip: { ...indexTip, x: indexTip.x * canvasWidth, y: indexTip.y * canvasHeight },
        thumbTip: { ...thumbTip, x: thumbTip.x * canvasWidth, y: thumbTip.y * canvasHeight },
        wrist: { ...wrist, x: wrist.x * canvasWidth, y: wrist.y * canvasHeight },
      });
    }

    return trackedHands;
  }

  public reset() {
    this.prevHands.clear();
    this.prevPinchDistance.clear();
  }
}
