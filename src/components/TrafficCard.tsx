import React from 'react';
import { ArrowDown, ArrowUp, Clock, ShieldCheck, Zap, Globe } from 'lucide-react';
import { VpnSessionStats, VpnServer } from '../types/vpn';
import { formatBytes, formatSpeed, formatDuration } from '../utils/vpnProtocol';

interface TrafficCardProps {
  stats: VpnSessionStats;
  currentServer: VpnServer;
  onOpenSpeedTest: () => void;
}

export const TrafficCard: React.FC<TrafficCardProps> = ({
  stats,
  currentServer,
  onOpenSpeedTest
}) => {
  const isConnected = stats.status === 'connected';

  return (
    <div className="w-full px-4 mb-4">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        {/* Top Header: Virtual IP & Protocol */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Virtual IP:</span>
            <span className="font-mono font-medium text-slate-200">
              {isConnected ? stats.virtualIp : '---.---.---.---'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {currentServer.protocol.replace('-', ' ')}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {currentServer.network.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Speed Meters */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Download */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ArrowDown className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Download</p>
                <p className="text-base font-extrabold text-slate-100 font-mono leading-tight">
                  {isConnected ? formatSpeed(stats.speedDown) : '0 KB/s'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {isConnected ? formatBytes(stats.bytesDown) : '0.00 MB'}
                </p>
              </div>
            </div>
          </div>

          {/* Upload */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <ArrowUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Upload</p>
                <p className="text-base font-extrabold text-slate-100 font-mono leading-tight">
                  {isConnected ? formatSpeed(stats.speedUp) : '0 KB/s'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {isConnected ? formatBytes(stats.bytesUp) : '0.00 MB'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Duration</span>
            </div>
            <p className="text-xs font-mono font-bold text-slate-200">
              {isConnected ? formatDuration(stats.durationSeconds) : '00:00'}
            </p>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Latency</span>
            </div>
            <p className="text-xs font-mono font-bold text-slate-200">
              {isConnected ? `${stats.latency} ms` : `${currentServer.ping} ms`}
            </p>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
              <ShieldCheck className="w-3 h-3 text-teal-400" />
              <span>Cipher</span>
            </div>
            <p className="text-[10px] font-mono font-bold text-slate-200 truncate px-1">
              {stats.encryptionCipher.includes('chacha') ? 'ChaCha20' : 'AES-256'}
            </p>
          </div>
        </div>

        {/* Speed Test Trigger */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {currentServer.udpSupport ? '⚡ UDP BBR Turbo Acceleration Active' : 'TCP Fast Open'}
          </span>
          <button
            onClick={onOpenSpeedTest}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 py-1 px-2.5 rounded-md hover:bg-emerald-500/10 transition-colors"
          >
            <span>Speed Benchmark</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
