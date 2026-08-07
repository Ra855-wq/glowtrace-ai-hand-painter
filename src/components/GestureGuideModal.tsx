import React from 'react';
import { X, Hand, Square, Zap, Sparkles, CheckCircle2 } from 'lucide-react';

interface GestureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestureGuideModal: React.FC<GestureGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-cyan-500/30 text-slate-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden space-y-5">
        {/* Glow accent header background */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <Hand className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">Gesture & Control Guide</h3>
            <p className="text-xs text-slate-400">Use your hands as a mouse, pinch, and draw lasers</p>
          </div>
        </div>

        {/* Instructions List */}
        <div className="space-y-3.5 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex gap-3 items-start">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-cyan-300 text-xs mb-0.5">1. Laser String Web (Image Mode)</h4>
              <p className="text-slate-300 leading-relaxed">
                Hold up 2 hands in front of your camera. Bright glowing neon laser strings connect your fingertips instantly across mid-air!
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex gap-3 items-start">
            <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400 mt-0.5">
              <Square className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-pink-300 text-xs mb-0.5">2. Pinch Mouse & Square Manipulation</h4>
              <p className="text-slate-300 leading-relaxed">
                Bring your <strong>Index Finger Tip</strong> and <strong>Thumb Tip</strong> close together to perform a <strong>Pinch</strong>.
                Use pinch as a mouse to grab and drag glowing squares. Pinch with <strong>both hands</strong> to rotate, stretch, and scale squares in 2D space!
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex gap-3 items-start">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-emerald-300 text-xs mb-0.5">3. Ultra Fluidity & Customization</h4>
              <p className="text-slate-300 leading-relaxed">
                Adjust the <strong>Interaction Smoothness (Fluidity)</strong> slider in the Control HUD to eliminate landmark jitter. Switch color palettes, sound synthesis, and string patterns anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl transition shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 text-xs"
        >
          <CheckCircle2 className="w-4 h-4" />
          Start Tracking Hands
        </button>
      </div>
    </div>
  );
};
