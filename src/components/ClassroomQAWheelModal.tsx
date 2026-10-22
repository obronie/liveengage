'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  RotateCw, 
  X, 
  Maximize2, 
  Minimize2, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Users, 
  Volume2, 
  VolumeX, 
  RefreshCw,
  HelpCircle,
  Award,
  Check,
  Flame
} from 'lucide-react';
import { QuestionSet, Question } from '@/types';
import { DEFAULT_CORRUSEAL_LEARNERS, getStoredLearners, saveStoredLearners } from '@/lib/ilearnSync';

// ============================================================================
// Web Audio API Synthesizer (Zero External Audio Dependencies)
// ============================================================================
class QAWheelAudio {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Snappy mechanical tick as wheel rim pegs flick past the needle
   */
  playTick() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(620, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(190, ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio context may be restricted by browser policy before first interaction
    }
  }

  /**
   * Celebratory ascending victory fanfare chord for correct answers
   */
  playFanfare() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      // C5, E5, G5, C6 triumph progression
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = ctx.currentTime + idx * 0.085;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.6);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Gentle two-tone descending sound for incorrect choice (supportive, not jarring)
   */
  playIncorrect() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(320, ctx.currentTime);
      gain1.gain.setValueAtTime(0.18, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(240, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.36);
    } catch {
      // ignore
    }
  }
}

const audioSynthesizer = new QAWheelAudio();

// ============================================================================
// iLearn Classroom Hub Brand Palette
// ============================================================================
const WHEEL_PALETTE = [
  '#00B0F0', // iLearn Primary Cyan
  '#1F3864', // iLearn Primary Navy
  '#4FA6DE', // iLearn Sky Blue
  '#0570B0', // iLearn Deep Blue
];

// ============================================================================
// Full-Screen Fireworks & Confetti Canvas Overlay (2.5 Seconds Celebration)
// ============================================================================
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
  isRibbon: boolean;
}

const FireworksConfettiOverlay: React.FC<{ active: boolean; onDone: () => void }> = ({ active, onDone }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const colors = ['#00B0F0', '#1F3864', '#4FA6DE', '#10B981', '#F59E0B', '#EC4899', '#6366F1'];
    const particles: Particle[] = [];

    // Spawn 3 bursts of fireworks
    const burstCenters = [
      { x: width * 0.25, y: height * 0.35 },
      { x: width * 0.5, y: height * 0.25 },
      { x: width * 0.75, y: height * 0.35 },
    ];

    burstCenters.forEach((center) => {
      // 55 radial spark particles
      for (let i = 0; i < 55; i++) {
        const angle = (Math.PI * 2 * i) / 55 + (Math.random() - 0.5) * 0.4;
        const speed = 4 + Math.random() * 8;
        particles.push({
          x: center.x,
          y: center.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 3 + Math.random() * 3,
          alpha: 1,
          decay: 0.012 + Math.random() * 0.01,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.2,
          isRibbon: false,
        });
      }

      // 30 fluttering confetti ribbons
      for (let i = 0; i < 30; i++) {
        particles.push({
          x: center.x + (Math.random() - 0.5) * 80,
          y: center.y + (Math.random() - 0.5) * 80,
          vx: (Math.random() - 0.5) * 7,
          vy: -2 - Math.random() * 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 8 + Math.random() * 8,
          alpha: 1,
          decay: 0.008 + Math.random() * 0.007,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.3,
          isRibbon: true,
        });
      }
    });

    let animationId: number;
    const startTime = performance.now();

    const render = (time: number) => {
      const elapsed = time - startTime;
      ctx.clearRect(0, 0, width, height);

      let aliveCount = 0;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.16; // gravity
        p.vx *= 0.98; // air drag
        p.alpha -= p.decay;
        p.rotation += p.vRot;

        if (p.alpha > 0 && p.y < height + 40) {
          aliveCount++;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;

          if (p.isRibbon) {
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      if (elapsed < 2500 && aliveCount > 0) {
        animationId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
        onDone();
      }
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [active, onDone]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[70]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};

// ============================================================================
// Classroom Q&A Wheel Modal Props
// ============================================================================
interface ClassroomQAWheelModalProps {
  set: QuestionSet;
  initialLearners?: string[];
  onClose: () => void;
}

export const ClassroomQAWheelModal: React.FC<ClassroomQAWheelModalProps> = ({
  set,
  initialLearners,
  onClose,
}) => {
  // Sound toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Full-screen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Classroom Projector Font Size Mode ('normal' | 'large' | 'xl')
  const [fontSizeMode, setFontSizeMode] = useState<'normal' | 'large' | 'xl'>('normal');

  // Active question index
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Score tracker
  const [score, setScore] = useState({ correct: 0, answered: 0 });

  // Learner Pool State
  const initialPool = useMemo(() => {
    if (initialLearners && initialLearners.length > 0) return initialLearners;
    const stored = getStoredLearners();
    return stored.length > 0 ? stored : DEFAULT_CORRUSEAL_LEARNERS;
  }, [initialLearners]);

  const [remainingPool, setRemainingPool] = useState<string[]>(initialPool);
  const [pickedLearners, setPickedLearners] = useState<string[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null);

  // Settings
  const [removeAfterAnswer, setRemoveAfterAnswer] = useState<boolean>(true);

  // Learner Editor Drawer / Modal
  const [showLearnerEditor, setShowLearnerEditor] = useState<boolean>(false);
  const [learnerInputText, setLearnerInputText] = useState<string>(initialPool.join('\n'));

  // Question Answer State
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // Wheel Animation State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const currentAngleRef = useRef<number>(0);
  const flapperAngleRef = useRef<number>(0);
  const recoilVelocityRef = useRef<number>(0);
  const lastPegPassedRef = useRef<number>(-1);
  const animFrameIdRef = useRef<number | null>(null);

  const questions: Question[] = set.questions || [];
  const currentQuestion: Question | undefined = questions[currentQIndex];
  const totalQuestions = questions.length;

  // Sync initialPool changes if passed
  useEffect(() => {
    if (initialLearners && initialLearners.length > 0) {
      setRemainingPool(initialLearners);
      setLearnerInputText(initialLearners.join('\n'));
    }
  }, [initialLearners]);

  // Full-screen toggle
  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // ==========================================================================
  // Wheel Canvas Rendering (White Background + iLearn Palette + Red Needle)
  // Double-sized high-DPI canvas (720x720) for large classroom visibility
  // ==========================================================================
  const drawWheel = useCallback(
    (angle: number, flapperAngle: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 38;

      ctx.clearRect(0, 0, width, height);

      const items = remainingPool.length > 0 ? remainingPool : ['All Picked!'];
      const numSlices = items.length;
      const sliceAngle = (2 * Math.PI) / numSlices;

      // Outer subtle shadow base
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#E2E8F0';
      ctx.fill();
      ctx.restore();

      // Draw Wedges
      for (let i = 0; i < numSlices; i++) {
        const startA = angle + i * sliceAngle;
        const endA = startA + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startA, endA);
        ctx.closePath();

        // Alternate brand palette colors
        ctx.fillStyle =
          remainingPool.length > 0
            ? WHEEL_PALETTE[i % WHEEL_PALETTE.length]
            : '#94A3B8';
        ctx.fill();

        // Clean white separator line
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Radial Learner Name Text (Enlarged for classroom distance reading)
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startA + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';

        let displayName = items[i];
        if (numSlices > 16 && displayName.length > 20) {
          displayName = displayName.substring(0, 19) + '…';
        } else if (displayName.length > 26) {
          displayName = displayName.substring(0, 25) + '…';
        }

        ctx.font =
          numSlices > 18
            ? 'bold 18px system-ui, -apple-system, sans-serif'
            : 'bold 21px system-ui, -apple-system, sans-serif';

        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 4;
        ctx.fillText(displayName, radius - 28, 0);
        ctx.restore();
      }

      // Outer Rim Accent Ring in Navy (High Contrast)
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#1F3864';
      ctx.lineWidth = 8;
      ctx.stroke();

      // Outer Rim Mechanical Pegs (Enlarged)
      for (let i = 0; i < numSlices; i++) {
        const pegA = angle + i * sliceAngle;
        const pegX = centerX + radius * Math.cos(pegA);
        const pegY = centerY + radius * Math.sin(pegA);

        ctx.beginPath();
        ctx.arc(pegX, pegY, 5.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#1F3864';
        ctx.lineWidth = 2.4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pegX, pegY, 2.6, 0, 2 * Math.PI);
        ctx.fillStyle = '#00B0F0';
        ctx.fill();
      }

      // Center Hub Outer White Ring (Enlarged)
      ctx.beginPath();
      ctx.arc(centerX, centerY, 70, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#1F3864';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Center Hub Inner Cyan Ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, 54, 0, 2 * Math.PI);
      ctx.fillStyle = '#00B0F0';
      ctx.fill();

      // Center Hub "SPIN" Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('SPIN', centerX, centerY);

      // Flexible Red Needle Pointer at 12 o'clock (top center, enlarged)
      ctx.save();
      ctx.translate(centerX, centerY - radius - 4);
      ctx.rotate(flapperAngle);

      ctx.beginPath();
      ctx.moveTo(-18, -12);
      ctx.quadraticCurveTo(-12, 22, 0, 48);
      ctx.quadraticCurveTo(12, 22, 18, -12);
      ctx.closePath();

      ctx.fillStyle = '#EF4444'; // Bold Red
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Needle center spine highlight
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(0, 42);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Hinge Pin
      ctx.beginPath();
      ctx.arc(0, -8, 8.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#1F3864';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -8, 3.8, 0, 2 * Math.PI);
      ctx.fillStyle = '#00B0F0';
      ctx.fill();

      ctx.restore();
    },
    [remainingPool]
  );

  // Redraw whenever pool updates
  useEffect(() => {
    drawWheel(currentAngleRef.current, flapperAngleRef.current);
  }, [drawWheel]);

  // ==========================================================================
  // Wheel Spin & Deceleration Animation (~3.2s Cubic-Bezier Spin)
  // ==========================================================================
  const handleSpinWheel = useCallback(() => {
    if (isSpinning) return;

    // Auto-recycle if pool is completely exhausted
    let pool = remainingPool;
    if (pool.length === 0) {
      if (pickedLearners.length > 0) {
        pool = [...pickedLearners];
        setRemainingPool(pool);
        setPickedLearners([]);
      } else {
        return;
      }
    }

    setIsSpinning(true);

    const candidates = pool;
    const numSlices = candidates.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    // Pick random candidate
    const winnerIndex = Math.floor(Math.random() * numSlices);
    const chosenWinner = candidates[winnerIndex];

    // Pointer is at 12 o'clock (3 * Math.PI / 2)
    const pointerAngle = (3 * Math.PI) / 2;
    const sliceCenterOffset = winnerIndex * sliceAngle + sliceAngle / 2;

    // Slight random jitter inside slice
    const jitter = (Math.random() - 0.5) * (sliceAngle * 0.7);

    // 8 to 11 full spins for suspenseful classroom pacing
    const fullSpins = (8 + Math.floor(Math.random() * 3)) * 2 * Math.PI;
    const currentAngleNorm = currentAngleRef.current % (2 * Math.PI);

    let targetAngle =
      currentAngleNorm + fullSpins + (pointerAngle - sliceCenterOffset - currentAngleNorm + jitter);
    while (targetAngle <= currentAngleRef.current + fullSpins) {
      targetAngle += 2 * Math.PI;
    }

    const startAngle = currentAngleRef.current;
    const totalDistance = targetAngle - startAngle;
    const duration = 4800; // ~4.8 seconds (50% longer than 3.2s)
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Deceleration curve: power 4.2 provides a long, suspenseful final creep across the last few pegs
      const easeOut = 1 - Math.pow(1 - progress, 4.2);
      const angle = startAngle + totalDistance * easeOut;
      currentAngleRef.current = angle;

      // Needle deflection physics against pegs
      const pegPosition = (angle - pointerAngle) / sliceAngle;
      const currentPegIndex = Math.floor(pegPosition);
      let fractional = pegPosition - currentPegIndex;
      if (fractional < 0) fractional += 1;

      let targetBend = 0;
      if (fractional >= 0.84) {
        const penetration = (fractional - 0.84) / 0.16;
        targetBend = penetration * 0.44; // bend needle tip up to ~25 degrees
      }

      if (currentPegIndex !== lastPegPassedRef.current) {
        lastPegPassedRef.current = currentPegIndex;
        recoilVelocityRef.current = -0.30;
        if (soundEnabled) {
          audioSynthesizer.playTick();
        }
      }

      recoilVelocityRef.current += -0.35 * flapperAngleRef.current;
      recoilVelocityRef.current *= 0.72;
      flapperAngleRef.current += recoilVelocityRef.current;

      if (fractional >= 0.84) {
        flapperAngleRef.current = Math.max(flapperAngleRef.current, targetBend);
      }

      drawWheel(angle, flapperAngleRef.current);

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        flapperAngleRef.current = 0;
        drawWheel(angle, 0);
        setIsSpinning(false);
        setSelectedLearner(chosenWinner);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);
  }, [isSpinning, remainingPool, pickedLearners, soundEnabled, drawWheel]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  // ==========================================================================
  // Option Click & Answer Evaluation
  // ==========================================================================
  const handleSelectOption = (optIndex: number) => {
    if (isRevealed || !currentQuestion) return;

    setSelectedOptionIndex(optIndex);
    setIsRevealed(true);

    const isCorrect = currentQuestion.correct_options.includes(optIndex);

    // Update score
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      answered: prev.answered + 1,
    }));

    // If removeAfterAnswer is active and a learner is answering, remove them from remaining pool
    if (removeAfterAnswer && selectedLearner) {
      setRemainingPool((prev) => prev.filter((name) => name !== selectedLearner));
      setPickedLearners((prev) => [selectedLearner, ...prev.filter((n) => n !== selectedLearner)]);
    }

    if (isCorrect) {
      if (soundEnabled) audioSynthesizer.playFanfare();
      setShowCelebration(true);
    } else {
      if (soundEnabled) audioSynthesizer.playIncorrect();
    }
  };

  // ==========================================================================
  // Question Navigation
  // ==========================================================================
  const handleNextQuestion = useCallback(() => {
    if (currentQIndex < totalQuestions - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setIsRevealed(false);
      setSelectedOptionIndex(null);
      setShowCelebration(false);
      setSelectedLearner(null);
      // Auto-spin for the next learner immediately!
      setTimeout(() => {
        handleSpinWheel();
      }, 150);
    }
  }, [currentQIndex, totalQuestions, handleSpinWheel]);

  const handlePrevQuestion = useCallback(() => {
    if (currentQIndex > 0) {
      setCurrentQIndex((prev) => prev - 1);
      setIsRevealed(false);
      setSelectedOptionIndex(null);
      setShowCelebration(false);
    }
  }, [currentQIndex]);

  const handleRetryQuestion = () => {
    setIsRevealed(false);
    setSelectedOptionIndex(null);
    setShowCelebration(false);
  };

  // Keyboard navigation & wireless presenter clicker integration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'Escape') {
        if (showLearnerEditor) {
          setShowLearnerEditor(false);
        } else {
          onClose();
        }
      } else if (e.code === 'Space' || e.key === 'PageDown') {
        e.preventDefault();
        handleSpinWheel();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextQuestion();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showLearnerEditor, handleSpinWheel, handleNextQuestion, handlePrevQuestion]);

  // Save edited learner pool
  const handleSaveLearnerPool = () => {
    const parsed = learnerInputText
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const cleaned = Array.from(new Set(parsed));
    if (cleaned.length > 0) {
      setRemainingPool(cleaned);
      setPickedLearners([]);
      setSelectedLearner(null);
      saveStoredLearners(cleaned);
    }
    setShowLearnerEditor(false);
  };

  // Reset to default 19 Corruseal learners
  const handleResetToCorruseal = () => {
    setLearnerInputText(DEFAULT_CORRUSEAL_LEARNERS.join('\n'));
    setRemainingPool(DEFAULT_CORRUSEAL_LEARNERS);
    setPickedLearners([]);
    setSelectedLearner(null);
    saveStoredLearners(DEFAULT_CORRUSEAL_LEARNERS);
  };

  // Explanation fallback with "How points are awarded / scoring rubric" stripped out
  const getExplanationText = (): string => {
    if (!currentQuestion) return '';
    const raw =
      currentQuestion.additional_text ||
      (currentQuestion as unknown as { explanation?: string }).explanation ||
      (currentQuestion as unknown as { rationale?: string }).rationale ||
      (currentQuestion as unknown as { reason?: string }).reason;
    if (raw && raw.trim().length > 0) {
      // Strip out any section discussing how points/marks are awarded or assessor rubric
      let cleaned = raw
        .replace(/(?:📝\s*)?(?:How the Assessor Marks This|Marking & Distractor Guide|Scoring Rubric|Mark Breakdown|Points Awarded|How points are awarded)[\s\S]*$/i, '')
        .trim();

      // Filter out any standalone lines specifically describing points or marks awarded
      cleaned = cleaned
        .split('\n')
        .filter((line) => !/^\s*(?:•|-|\*)?\s*(?:\d+\s*marks?|\d+\s*points?|full\s*\d+\s*marks?|zero\s*marks?)\s*(?:awarded|allocated|for\b)/i.test(line))
        .join('\n')
        .trim();

      if (cleaned.length > 0) {
        return cleaned;
      }
    }
    const correctOptIndex = currentQuestion.correct_options[0] ?? 0;
    const correctText = currentQuestion.options[correctOptIndex] || 'Correct procedure';
    return `In South African logistics and warehousing operations, selecting "${correctText}" enforces standard operating procedures, audit compliance, and workplace safety.`;
  };

  // Dynamic font size classes for classroom projector readability
  const fontSizeClasses = useMemo(() => {
    switch (fontSizeMode) {
      case 'xl':
        return {
          stem: 'text-xl sm:text-2xl md:text-3xl',
          options: 'text-base sm:text-lg md:text-xl',
          optionLetter: 'w-8 h-8 text-sm',
          optionPadding: 'py-3.5 px-4',
          respondent: 'text-base sm:text-lg md:text-xl',
          explanation: 'text-sm sm:text-base md:text-lg',
        };
      case 'large':
        return {
          stem: 'text-lg sm:text-xl md:text-2xl',
          options: 'text-sm sm:text-base md:text-lg',
          optionLetter: 'w-7 h-7 text-xs sm:text-sm',
          optionPadding: 'py-3 px-3.5',
          respondent: 'text-sm sm:text-base md:text-lg',
          explanation: 'text-xs sm:text-sm md:text-base',
        };
      case 'normal':
      default:
        return {
          stem: 'text-base sm:text-lg md:text-xl',
          options: 'text-xs sm:text-sm md:text-base',
          optionLetter: 'w-7 h-7 text-xs',
          optionPadding: 'py-2.5 px-3',
          respondent: 'text-sm sm:text-base',
          explanation: 'text-xs sm:text-sm',
        };
    }
  }, [fontSizeMode]);

  // Renders question stem with explicit bracketed blanks [1] and underline indicator for CLOZE/Fill-in-the-gap
  const renderQuestionStem = (
    rawBody: string,
    revealed: boolean,
    q: Question,
    sizeClass: string
  ) => {
    const hasClozeMarkers = /(\[\d+\]|___+|\[blank\])/i.test(rawBody) || q.format === 'CLOZE';

    if (!hasClozeMarkers) {
      return (
        <h1 className={`${sizeClass} font-bold text-[#1F3864] leading-snug`}>
          {rawBody}
        </h1>
      );
    }

    let normalized = rawBody;
    let counter = 1;
    // If underscores or [blank] exist, replace sequentially with [1], [2], etc.
    if (!/\[\d+\]/.test(normalized) && /(_{2,}|\[blank\])/i.test(normalized)) {
      normalized = normalized.replace(/(_{2,}|\[blank\])/gi, () => `[${counter++}]`);
    } else if (q.format === 'CLOZE' && !/\[\d+\]/.test(normalized)) {
      // If marked as CLOZE format but missing gap syntax, append [1]
      normalized = `${normalized} [1]`;
    }

    const parts = normalized.split(/(\[\d+\])/g);

    return (
      <h1 className={`${sizeClass} font-bold text-[#1F3864] leading-relaxed`}>
        {parts.map((part, pIdx) => {
          const match = part.match(/^\[(\d+)\]$/);
          if (!match) {
            return <span key={pIdx}>{part}</span>;
          }

          const gapNum = parseInt(match[1], 10);
          const gapIndex = gapNum - 1;

          let correctWord = '';
          if (q.options && q.options.length > 0) {
            const optIdx =
              q.correct_options && q.correct_options[gapIndex] !== undefined
                ? q.correct_options[gapIndex]
                : (q.correct_options?.[0] ?? 0);
            correctWord = q.options[optIdx] || '';
          }

          if (revealed && correctWord) {
            return (
              <span
                key={pIdx}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mx-1.5 rounded-lg bg-emerald-100 border-2 border-emerald-500 text-emerald-950 font-black shadow-2xs align-baseline animate-in zoom-in-95 duration-200"
              >
                <span className="w-5 h-5 rounded-md bg-emerald-600 text-white font-mono text-xs flex items-center justify-center shrink-0">
                  {gapNum}
                </span>
                <span className="underline decoration-emerald-600 decoration-2">{correctWord}</span>
              </span>
            );
          }

          return (
            <span
              key={pIdx}
              className="inline-flex items-baseline gap-1.5 px-2 py-0.5 mx-1 rounded-md bg-sky-50 border border-sky-200 align-baseline"
            >
              <span className="font-mono font-black text-[#00B0F0] text-xs sm:text-sm bg-white px-1.5 py-0.5 rounded border border-sky-200 shadow-2xs">
                [{gapNum}]
              </span>
              <span
                className="inline-block border-b-2 border-[#1F3864] min-w-[65px] sm:min-w-[95px] h-3.5 mb-0.5"
                title={`Gap ${gapNum}: 1 word required`}
              />
            </span>
          );
        })}
      </h1>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] text-slate-900 flex flex-col overflow-hidden font-sans select-none">
      {/* Celebration Fireworks & Confetti Overlay */}
      <FireworksConfettiOverlay
        active={showCelebration}
        onDone={() => setShowCelebration(false)}
      />

      {/* ==================================================================== */}
      {/* TOP PRESENTER BAR (Compact Height)                                   */}
      {/* ==================================================================== */}
      <header className="h-13 bg-white border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between shrink-0 shadow-xs z-20">
        {/* Left: Brand + Set Title + Question Progress + Score */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-[#00B0F0] text-white font-black rounded-lg flex items-center justify-center text-base shadow-xs shrink-0">
            i
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#00B0F0] hidden sm:inline">
                LiveEngage
              </span>
              <h2 className="text-xs sm:text-sm font-bold text-[#1F3864] truncate">
                {set.title}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="px-2 py-0.2 rounded-full font-bold bg-sky-50 text-[#00B0F0] border border-sky-200">
                Question {currentQIndex + 1} of {totalQuestions}
              </span>
              <span className="px-2 py-0.2 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Score: {score.correct} / {score.answered}
                {score.answered > 0 ? ` (${Math.round((score.correct / score.answered) * 100)}%)` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Controls & Learner Pool Drawer Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-2 text-slate-500 hover:text-[#1F3864] hover:bg-slate-100 rounded-lg transition-colors"
            title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#00B0F0]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Classroom Projector Font Size Control */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-300" title="Classroom Projector Font Size">
            <button
              type="button"
              onClick={() => setFontSizeMode('normal')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                fontSizeMode === 'normal'
                  ? 'bg-white text-[#1F3864] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Standard Font Size"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSizeMode('large')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                fontSizeMode === 'large'
                  ? 'bg-[#00B0F0] text-white shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Large Projector Font"
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => setFontSizeMode('xl')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                fontSizeMode === 'xl'
                  ? 'bg-[#1F3864] text-white shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Extra Large Projector Font"
            >
              A++
            </button>
          </div>

          {/* Remove Learner Checkbox Toggle */}
          <label className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={removeAfterAnswer}
              onChange={(e) => setRemoveAfterAnswer(e.target.checked)}
              className="w-3.5 h-3.5 text-[#00B0F0] rounded border-slate-300 focus:ring-[#00B0F0] cursor-pointer"
            />
            <span>Remove learner after answering</span>
          </label>

          {/* Edit / Paste Learners Button */}
          <button
            onClick={() => setShowLearnerEditor(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5"
            title="Edit or paste learner names for the wheel"
          >
            <Users className="w-3.5 h-3.5 text-[#00B0F0]" />
            <span>
              Learners ({remainingPool.length})
            </span>
          </button>

          {/* Full Screen Toggle */}
          <button
            onClick={toggleFullScreen}
            className="p-2 text-slate-600 hover:text-[#1F3864] hover:bg-slate-100 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Close Presenter (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* SPLIT-SCREEN MAIN STAGE                                              */}
      {/* ==================================================================== */}
      {/* ==================================================================== */}
      {/* SPLIT-SCREEN MAIN STAGE (40/60 Split, Compact No-Scroll Layout)      */}
      {/* ==================================================================== */}
      <main className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4 p-2.5 sm:p-3.5 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
        
        {/* ================================================================== */}
        {/* LEFT COLUMN: Spinning Name Wheel (40% Split: 2 of 5 Columns)       */}
        {/* ================================================================== */}
        <section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-between shadow-xs min-h-0">
          
          {/* HTML5 Canvas Wheel (Double-Sized 720x720 High-DPI Wheel) */}
          <div className="relative my-auto flex items-center justify-center w-full shrink-0 py-1 flex-1 min-h-0">
            <canvas
              ref={canvasRef}
              width={720}
              height={720}
              className="w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[520px] xl:max-w-[580px] max-h-[48vh] sm:max-h-[54vh] lg:max-h-[60vh] aspect-square object-contain drop-shadow-xl cursor-pointer select-none transition-transform hover:scale-[1.01] active:scale-[0.99]"
              onClick={handleSpinWheel}
            />
          </div>

          {/* Active Responder Banner */}
          <div className="w-full space-y-2 shrink-0">
            <div
              className={`p-2.5 rounded-xl text-center transition-all ${
                selectedLearner
                  ? 'bg-gradient-to-r from-[#1F3864] to-[#0570B0] text-white shadow-sm'
                  : 'bg-slate-50 border border-slate-200 text-slate-600'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                Current Respondent
              </div>
              <div className={`${fontSizeClasses.respondent} font-black mt-0.5 truncate`}>
                {selectedLearner ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <span>🎤 {selectedLearner}</span>
                  </span>
                ) : (
                  <span>🎯 Click below or press Space to spin</span>
                )}
              </div>
            </div>

            {/* Spin Button */}
            <button
              onClick={handleSpinWheel}
              disabled={isSpinning || remainingPool.length === 0}
              className="w-full py-2.5 px-3 bg-[#00B0F0] hover:bg-[#0090C0] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'Spinning Wheel...' : '🎯 Spin to Pick Learner'}</span>
            </button>

            {/* Pool status count & quick reset */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>{remainingPool.length} learners remaining</span>
              {pickedLearners.length > 0 && (
                <button
                  onClick={() => {
                    setRemainingPool([...remainingPool, ...pickedLearners]);
                    setPickedLearners([]);
                  }}
                  className="text-[#00B0F0] hover:underline font-bold"
                >
                  Recycle All ({pickedLearners.length})
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* RIGHT COLUMN: Interactive Question & Answer Stage (60%: 3 Columns)  */}
        {/* ================================================================== */}
        <section className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-xs min-h-0 overflow-y-auto">
          
          {currentQuestion ? (
            <div className="space-y-2.5 flex-1 min-h-0 flex flex-col justify-between">
              <div>
                {/* Question Header & Badges (Marks badge removed for clean classroom viewing) */}
                <div className="space-y-1.5 pb-2 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#1F3864] text-white">
                      Question {currentQIndex + 1} of {totalQuestions}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                      {currentQuestion.format || 'MCQ'}
                    </span>
                    {currentQuestion.guide_topic_hint && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 text-[#00B0F0] border border-sky-100 truncate max-w-xs">
                        📖 {currentQuestion.guide_topic_hint}
                      </span>
                    )}
                  </div>

                  {/* High-Contrast Question Stem with CLOZE Bracketed Underline Support */}
                  {renderQuestionStem(currentQuestion.body, isRevealed, currentQuestion, fontSizeClasses.stem)}
                </div>

                {/* CLOZE Word Bank Prompt Banner */}
                {currentQuestion.format === 'CLOZE' && (
                  <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-[#00B0F0] flex items-center gap-1.5 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Word Bank — Select the correct term to complete the passage:</span>
                  </div>
                )}

                {/* Interactive Options Cards */}
                <div className="space-y-2 mt-2.5">
                  {currentQuestion.options && currentQuestion.options.length > 0 ? (
                    currentQuestion.options.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx); // A, B, C, D...
                      const isSelected = selectedOptionIndex === idx;
                      const isCorrect = currentQuestion.correct_options.includes(idx);

                      // Dynamic styling based on answer state
                      let cardStyle = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-[#00B0F0]/50';
                      let letterStyle = 'bg-slate-100 text-[#1F3864]';
                      let badge = null;

                      if (isRevealed) {
                        if (isSelected && isCorrect) {
                          cardStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-300';
                          letterStyle = 'bg-emerald-600 text-white';
                          badge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white">
                              <Check className="w-3 h-3" />
                              CORRECT!
                            </span>
                          );
                        } else if (isSelected && !isCorrect) {
                          cardStyle = 'bg-rose-50 border-rose-500 text-rose-950';
                          letterStyle = 'bg-rose-600 text-white';
                          badge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-600 text-white">
                              <X className="w-3 h-3" />
                              Incorrect
                            </span>
                          );
                        } else if (isCorrect) {
                          cardStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-400';
                          letterStyle = 'bg-emerald-600 text-white';
                          badge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white">
                              <Check className="w-3 h-3" />
                              Correct Answer
                            </span>
                          );
                        } else {
                          cardStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                          letterStyle = 'bg-slate-200 text-slate-500';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectOption(idx)}
                          disabled={isRevealed}
                          className={`w-full ${fontSizeClasses.optionPadding} rounded-xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer disabled:cursor-default ${cardStyle}`}
                        >
                          <div className={`${fontSizeClasses.optionLetter} rounded-lg font-bold flex items-center justify-center shrink-0 ${letterStyle}`}>
                            {letter}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className={`${fontSizeClasses.options} font-medium leading-normal`}>
                              {opt}
                            </p>
                          </div>
                          {badge && <div className="shrink-0 pt-0.5">{badge}</div>}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <p className="text-xs text-slate-600 font-medium">
                        This question requires an open learner response or discussion.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsRevealed(true)}
                        className="px-3.5 py-1.5 bg-[#00B0F0] text-white font-bold rounded-lg text-xs"
                      >
                        Reveal Model Answer & Rationale
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Revealed Teaching & Explanation Panels (Points awarded rubric removed) */}
              {isRevealed && (
                <div className="pt-1 animate-fadeIn">
                  {selectedOptionIndex !== null && currentQuestion.correct_options.includes(selectedOptionIndex) ? (
                    // CORRECT ANSWER CELEBRATORY PANEL
                    <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-3 text-emerald-950 space-y-1 shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>✓ Model Explanation & Rationale:</span>
                      </div>
                      <p className={`${fontSizeClasses.explanation} leading-relaxed text-emerald-900 whitespace-pre-line`}>
                        {getExplanationText()}
                      </p>
                    </div>
                  ) : (
                    // INCORRECT ANSWER TEACHING PANEL
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 text-amber-950 space-y-1 shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                        <Award className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Key Learning Takeaway & Correct Answer:</span>
                      </div>
                      <div className={`${fontSizeClasses.explanation} font-semibold text-amber-950`}>
                        Correct Answer:{' '}
                        <span className="font-bold underline decoration-amber-500">
                          Option {String.fromCharCode(65 + (currentQuestion.correct_options[0] ?? 0))}:{' '}
                          {currentQuestion.options[currentQuestion.correct_options[0] ?? 0]}
                        </span>
                      </div>
                      <p className={`${fontSizeClasses.explanation} leading-relaxed text-amber-900 whitespace-pre-line`}>
                        {getExplanationText()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">No Questions in Set</h3>
              <p className="text-xs text-slate-500">
                Please add or generate questions for this question set before launching the Q&A Wheel.
              </p>
            </div>
          )}

          {/* ================================================================ */}
          {/* BOTTOM QUESTION NAVIGATION BAR                                   */}
          {/* ================================================================ */}
          <div className="pt-2 border-t border-slate-100 mt-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              {/* Previous Question Button */}
              <button
                type="button"
                onClick={handlePrevQuestion}
                disabled={currentQIndex === 0}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {/* Retry / Hide Answer Button */}
              {isRevealed && (
                <button
                  type="button"
                  onClick={handleRetryQuestion}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Let another learner attempt this question"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              )}
            </div>

            {/* Primary Action Button: Next Question & Spin Next Learner */}
            {currentQIndex < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-4 py-2 bg-[#00B0F0] hover:bg-[#0090C0] text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-md"
              >
                <span>Next Question & Spin Next Learner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#1F3864] hover:bg-[#0570B0] text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Finish Q&A Session</span>
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </section>
      </main>

      {/* ==================================================================== */}
      {/* LEARNER ROSTER DRAWER / MODAL                                        */}
      {/* ==================================================================== */}
      {showLearnerEditor && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00B0F0]" />
                <h3 className="text-base font-bold text-[#1F3864]">
                  Edit Learner Pool ({remainingPool.length} Remaining)
                </h3>
              </div>
              <button
                onClick={() => setShowLearnerEditor(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Paste or edit learner names (one name per line or comma-separated). These names appear on the spinning wheel.
            </p>

            <textarea
              rows={8}
              value={learnerInputText}
              onChange={(e) => setLearnerInputText(e.target.value)}
              placeholder="Wandile Mashinini&#10;Fortune Layini&#10;Nkosinathi Gift Mabuza..."
              className="w-full p-3 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:border-[#00B0F0] focus:ring-1 focus:ring-[#00B0F0]"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResetToCorruseal}
                className="text-xs text-[#00B0F0] hover:underline font-bold"
              >
                Load 19 Corruseal Learners
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLearnerEditor(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveLearnerPool}
                  className="px-4 py-1.5 text-xs font-bold bg-[#00B0F0] hover:bg-[#0090C0] text-white rounded-xl shadow-xs"
                >
                  Save & Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
