import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class HandTrackerService {
  private landmarker: HandLandmarker | null = null;
  private isLoading = false;
  private isReady = false;

  public async initialize(
    maxHands: number = 2,
    onStatusChange?: (status: string, progress?: number) => void
  ): Promise<HandLandmarker> {
    if (this.landmarker && this.isReady) {
      return this.landmarker;
    }

    if (this.isLoading) {
      // Wait for existing initialization to complete
      while (this.isLoading) {
        await new Promise((r) => setTimeout(r, 100));
      }
      if (this.landmarker) return this.landmarker;
    }

    this.isLoading = true;
    try {
      if (onStatusChange) onStatusChange('Loading MediaPipe Vision WASM...', 20);

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );

      if (onStatusChange) onStatusChange('Downloading Hand Landmarker AI Model...', 60);

      const modelAssetPath =
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

      try {
        this.landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: maxHands,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch (gpuError) {
        console.warn('GPU Delegate failed, falling back to CPU:', gpuError);
        if (onStatusChange) onStatusChange('Falling back to CPU engine...', 75);

        this.landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: maxHands,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      }

      this.isReady = true;
      this.isLoading = false;
      if (onStatusChange) onStatusChange('Hand Tracker Ready', 100);
      return this.landmarker;
    } catch (error) {
      this.isLoading = false;
      this.isReady = false;
      console.error('Failed to initialize HandLandmarker:', error);
      throw error;
    }
  }

  public detectForVideo(video: HTMLVideoElement, timestampMs: number) {
    if (!this.landmarker || !this.isReady) return null;
    try {
      return this.landmarker.detectForVideo(video, timestampMs);
    } catch (err) {
      console.error('Detection frame error:', err);
      return null;
    }
  }

  public destroy() {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch {
        // silent
      }
      this.landmarker = null;
    }
    this.isReady = false;
    this.isLoading = false;
  }
}

export const handTrackerService = new HandTrackerService();
