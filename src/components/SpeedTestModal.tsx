import React, { useState, useEffect } from 'react';
import { X, Play, RotateCw, Zap, ArrowDown, ArrowUp, Activity, CheckCircle2 } from 'lucide-react';
import { VpnServer } from '../types/vpn';
import { triggerHaptic, playSound } from '../utils/feedback';

interface SpeedTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: VpnServer;
  isConnected: boolean;
}

export const SpeedTestModal: React.FC<SpeedTestModalProps> = ({
  isOpen,
  onClose,
  server,
  isConnected
}) => {
  const [stage, setStage] = useState<'idle' | 'ping' | 'download' | 'upload' | 'finished'>('idle');
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [finalPing, setFinalPing] = useState(server.ping);
  const [finalJitter, setFinalJitter] = useState(2);
  const [finalDown, setFinalDown] = useState(0);
  const [finalUp, setFinalUp] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen && stage === 'idle') {
      startTest();
    }
  }, [isOpen]);

  const startTest = () => {
    setStage('ping');
    setProgress(0);
    setCurrentSpeed(0);
    triggerHaptic('tap');
    playSound('click');

    // Step 1: Ping & Jitter
    let p = 0;
    const pingTimer = setInterval(() => {
      p += 10;
      setProgress(p);
      if (p >= 25) {
        clearInterval(pingTimer);
        const calculatedPing = Math.max(12, Math.round(server.ping * (0.85 + Math.random() * 0.3)));
        setFinalPing(calculatedPing);
        setFinalJitter(Math.floor(Math.random() * 3) + 1);
        runDownloadPhase();
      }
    }, 80);
  };

  const runDownloadPhase = () => {
    setStage('download');
    let p = 25;
    const baseTarget = server.speedRating === 'ultra' ? 180 : 95;
    
    const downTimer = setInterval(() => {
      p += 3;
      setProgress(p);
      const simulatedCur = Math.round(baseTarget * (0.7 + Math.random() * 0.5) * (p / 65));
      setCurrentSpeed(simulatedCur);

      if (p >= 65) {
        clearInterval(downTimer);
        const finalCalculated = Math.round(baseTarget * (0.9 + Math.random() * 0.25));
        setFinalDown(finalCalculated);
        runUploadPhase(finalCalculated);
      }
    }, 70);
  };

  const runUploadPhase = (downVal: number) => {
    setStage('upload');
    let p = 65;
    const baseTarget = Math.round(downVal * 0.55);

    const upTimer = setInterval(() => {
      p += 3.5;
      setProgress(Math.min(100, p));
      const simulatedCur = Math.round(baseTarget * (0.6 + Math.random() * 0.6));
      setCurrentSpeed(simulatedCur);

      if (p >= 100) {
        clearInterval(upTimer);
        const finalCalculated = Math.round(baseTarget * (0.85 + Math.random() * 0.3));
        setFinalUp(finalCalculated);
        setCurrentSpeed(downVal);
        setStage('finished');
        triggerHaptic('success');
        playSound('connect');
      }
    }, 70);
  };

  if (!isOpen) return null;

  // Max gauge scale ~ 250 Mbps
  const gaugePercent = Math.min(100, (currentSpeed / 250) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center"
        role="dialog"
        aria-modal="true"
        aria-label="Speed Benchmark"
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">{server.flag}</span>
            <div className="text-left">
              <h3 className="text-xs font-bold text-slate-100 truncate max-w-[190px]">
                {server.name}
              </h3>
              <p className="text-[10px] text-emerald-400 font-mono">
                {server.protocol.toUpperCase()} {server.udpSupport ? '• UDP BBR' : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close speed test"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Speedometer Gauge */}
        <div className="relative my-6 w-48 h-48 flex items-center justify-center">
          {/* Radial Track */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#1e293b"
              strokeWidth="8"
              strokeDasharray="251.2"
              strokeDashoffset="62.8"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="url(#speedGradient)"
              strokeWidth="8"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (gaugePercent / 100) * 188.4}
              strokeLinecap="round"
              className="transition-all duration-150 ease-out"
            />
            <defs>
              <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>

          {/* Central Speed Dial Value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold font-mono text-slate-100 tracking-tight">
              {stage === 'ping' ? '---' : currentSpeed}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mt-0.5">
              Mbps
            </span>
            <span className="text-[10px] text-slate-400 mt-1 capitalize font-medium">
              {stage === 'idle' && 'Ready'}
              {stage === 'ping' && 'Pinging UDP Pipe...'}
              {stage === 'download' && 'Testing Download...'}
              {stage === 'upload' && 'Testing Upload...'}
              {stage === 'finished' && 'Test Complete'}
            </span>
          </div>
        </div>

        {/* 3 Result Cards */}
        <div className="w-full grid grid-cols-3 gap-2 mb-4">
          {/* Ping */}
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Ping</span>
            </div>
            <p className="text-xs font-mono font-bold text-slate-100">
              {finalPing} <span className="text-[10px] font-normal text-slate-400">ms</span>
            </p>
            <p className="text-[9px] text-slate-500 font-mono">±{finalJitter}ms jitter</p>
          </div>

          {/* Download */}
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
              <ArrowDown className="w-3 h-3 text-emerald-400" />
              <span>Download</span>
            </div>
            <p className="text-xs font-mono font-bold text-emerald-300">
              {finalDown || '---'} <span className="text-[10px] font-normal text-slate-400">Mbps</span>
            </p>
            <p className="text-[9px] text-slate-500 font-mono">0.0% loss</p>
          </div>

          {/* Upload */}
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
              <ArrowUp className="w-3 h-3 text-cyan-400" />
              <span>Upload</span>
            </div>
            <p className="text-xs font-mono font-bold text-cyan-300">
              {finalUp || '---'} <span className="text-[10px] font-normal text-slate-400">Mbps</span>
            </p>
            <p className="text-[9px] text-slate-500 font-mono">BBR active</p>
          </div>
        </div>

        {/* Re-run button */}
        <button
          onClick={startTest}
          disabled={stage !== 'finished' && stage !== 'idle'}
          className="w-full py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 text-xs"
        >
          {stage === 'finished' ? (
            <>
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retest Node Speed</span>
            </>
          ) : stage === 'idle' ? (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Benchmark</span>
            </>
          ) : (
            <>
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>Measuring Performance ({progress}%)...</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
