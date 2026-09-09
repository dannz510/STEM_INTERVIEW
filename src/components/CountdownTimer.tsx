import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  ChevronDown,
} from 'lucide-react';

interface CountdownTimerProps {
  currentQuestionIndex: number;
  onTimeExpired?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  currentQuestionIndex,
  onTimeExpired,
}) => {
  const [mode, setMode] = useState<'question' | 'overall'>('question');

  const QUESTION_PRESETS = [
    { label: '1:30', seconds: 90 },
    { label: '2:00', seconds: 120 },
    { label: '3:00', seconds: 180 },
    { label: '5:00', seconds: 300 },
  ];

  const OVERALL_PRESETS = [
    { label: '10p', seconds: 600 },
    { label: '15p', seconds: 900 },
    { label: '20p', seconds: 1200 },
    { label: '30p', seconds: 1800 },
  ];

  const [questionDuration, setQuestionDuration] = useState<number>(180);
  const [overallDuration, setOverallDuration] = useState<number>(900);

  const [remainingSeconds, setRemainingSeconds] = useState<number>(180);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [autoResetOnNextQ, setAutoResetOnNextQ] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  const prevQuestionIndexRef = useRef<number>(currentQuestionIndex);

  const playChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Ignored for auto-play audio restriction
    }
  };

  const handleModeChange = (newMode: 'question' | 'overall') => {
    setMode(newMode);
    setIsRunning(false);
    setRemainingSeconds(newMode === 'question' ? questionDuration : overallDuration);
  };

  useEffect(() => {
    if (prevQuestionIndexRef.current !== currentQuestionIndex) {
      prevQuestionIndexRef.current = currentQuestionIndex;
      if (mode === 'question' && autoResetOnNextQ) {
        setRemainingSeconds(questionDuration);
        setIsRunning(true);
      }
    }
  }, [currentQuestionIndex, mode, autoResetOnNextQ, questionDuration]);

  useEffect(() => {
    let interval: number | null = null;
    if (isRunning) {
      interval = window.setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev === 1) {
            playChime();
            if (onTimeExpired) onTimeExpired();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, onTimeExpired]);

  const formatTime = (totalSec: number) => {
    const isNegative = totalSec < 0;
    const absSec = Math.abs(totalSec);
    const m = Math.floor(absSec / 60);
    const s = absSec % 60;
    return `${isNegative ? '+' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentTotal = mode === 'question' ? questionDuration : overallDuration;
  const isOvertime = remainingSeconds < 0;
  const isWarning = remainingSeconds <= 30 && remainingSeconds >= 0;
  const progressRatio = Math.max(0, Math.min(1, remainingSeconds / currentTotal));

  return (
    <div className="relative rounded-2xl bg-[#faf8f4]/90 dark:bg-neutral-900/90 backdrop-blur-md border border-[#e8e3d8]/80 dark:border-neutral-800 p-2.5 sm:p-3 shadow-xs">
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-1.5 bg-[#eee9df] dark:bg-neutral-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => handleModeChange('question')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              mode === 'question'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Theo câu hỏi
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('overall')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              mode === 'overall'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Toàn bộ PV
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="w-8 h-8 transform -rotate-90">
              <circle cx="16" cy="16" r="13" strokeWidth="2.5" className="stroke-neutral-200 dark:stroke-neutral-800 fill-none" />
              <circle
                cx="16"
                cy="16"
                r="13"
                strokeWidth="2.5"
                strokeDasharray={81.68}
                strokeDashoffset={81.68 * (1 - progressRatio)}
                strokeLinecap="round"
                className={`fill-none transition-all duration-300 ${
                  isOvertime ? 'stroke-red-500' : isWarning ? 'stroke-amber-500' : 'stroke-emerald-600'
                }`}
              />
            </svg>
            <Clock className={`w-3.5 h-3.5 absolute ${isOvertime ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`} />
          </div>

          <span className={`font-mono text-xl font-bold ${isOvertime ? 'text-red-600 animate-pulse' : 'text-neutral-900 dark:text-neutral-100'}`}>
            {formatTime(remainingSeconds)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setRemainingSeconds((prev) => prev - 30)}
            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-600 dark:text-neutral-300"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setRemainingSeconds((prev) => prev + 30)}
            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-600 dark:text-neutral-300"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
              isRunning ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200' : 'bg-emerald-600 text-white'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isRunning ? 'Dừng' : 'Bắt đầu'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRunning(false);
              setRemainingSeconds(mode === 'question' ? questionDuration : overallDuration);
            }}
            className="p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="mt-2.5 pt-2.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">Mốc:</span>
            {(mode === 'question' ? QUESTION_PRESETS : OVERALL_PRESETS).map((p) => (
              <button
                key={p.seconds}
                type="button"
                onClick={() => {
                  if (mode === 'question') setQuestionDuration(p.seconds);
                  else setOverallDuration(p.seconds);
                  setRemainingSeconds(p.seconds);
                  setIsRunning(false);
                }}
                className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-neutral-800 dark:text-neutral-200"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;