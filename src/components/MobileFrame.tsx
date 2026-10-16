import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Volume2, VolumeX, Shield, Wifi, Battery, Signal } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  isConnected: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAddModal: () => void;
  onOpenSecurity: () => void;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  isConnected,
  soundEnabled,
  onToggleSound,
  onOpenAddModal,
  onOpenSecurity
}) => {
  const [useDeviceFrame, setUseDeviceFrame] = useState(true);
  const [currentTime, setCurrentTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start sm:justify-center selection:bg-emerald-500 selection:text-black">
      {/* Desktop Top Control Banner */}
      <header className="w-full max-w-4xl py-2.5 px-4 hidden sm:flex items-center justify-between text-xs text-slate-400 border-b border-slate-900 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-200">ApexVPN Mobile Engine</span>
          <span className="text-[10px] text-slate-500 font-mono">v2.4.0 • V2Ray / VLESS / UDP Core</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold transition-colors"
            title="Add servers for your clients"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Add Client Servers</span>
          </button>

          <button
            onClick={() => setUseDeviceFrame(!useDeviceFrame)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            title="Toggle between phone frame and full layout"
          >
            {useDeviceFrame ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                <span>Full Layout</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Phone Frame</span>
              </>
            )}
          </button>

          <button
            onClick={onToggleSound}
            className={`p-1.5 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onOpenSecurity}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Encryption</span>
          </button>
        </div>
      </header>

      {/* Main Container - either in phone mockup or full width */}
      <div className={`w-full flex justify-center ${useDeviceFrame ? 'sm:py-4' : 'py-0'}`}>
        <div
          className={`
            w-full transition-all duration-300 relative flex flex-col bg-slate-950 overflow-hidden
            ${useDeviceFrame 
              ? 'max-w-[400px] sm:min-h-[820px] sm:rounded-[44px] sm:border-[8px] sm:border-slate-800 sm:ring-1 sm:ring-slate-700/50 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]' 
              : 'max-w-md min-h-screen'
            }
          `}
        >
          {/* Mobile Status Bar (Always on top like native phone) */}
          <div className="w-full pt-3 px-6 pb-1 flex items-center justify-between text-xs font-semibold text-slate-200 select-none z-30 shrink-0">
            <span className="font-mono text-[13px] tracking-tight">{currentTime}</span>

            {/* Dynamic Island Pill */}
            <div className="w-24 h-4.5 bg-black rounded-full border border-slate-800/80 flex items-center justify-center gap-1.5 px-2 shadow-inner">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
              <span className="text-[9px] text-slate-400 font-mono tracking-wider">
                {isConnected ? 'VPN ON' : 'STANDBY'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-mono">5G</span>
                <Battery className="w-4 h-4 fill-current text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Phone App Content */}
          <div className="flex-1 flex flex-col w-full overflow-y-auto no-scrollbar relative">
            {children}
          </div>

          {/* Mobile Navigation Home Indicator */}
          <div className="w-full py-2 flex items-center justify-center z-20 shrink-0">
            <div className="w-32 h-1 bg-slate-700/70 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
