import React from 'react';
import { Power, Shield, ShieldCheck, Lock, Radio } from 'lucide-react';
import { ConnectionStatus } from '../types/vpn';
import { triggerHaptic, playSound } from '../utils/feedback';

interface ConnectButtonProps {
  status: ConnectionStatus;
  serverName: string;
  protocolName: string;
  ping: number;
  onToggle: () => void;
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({
  status,
  serverName,
  protocolName,
  ping,
  onToggle
}) => {
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  const isDisconnecting = status === 'disconnecting';
  const isDisconnected = status === 'disconnected';

  const handleClick = () => {
    triggerHaptic(isConnected ? 'disconnect' : 'tap');
    playSound(isConnected ? 'disconnect' : 'click');
    onToggle();
  };

  return (
    <div className="flex flex-col items-center justify-center relative py-6">
      {/* Background Pulse Rings when connected or connecting */}
      <div className="relative flex items-center justify-center">
        {isConnected && (
          <>
            <div className="absolute -inset-8 rounded-full bg-emerald-500/10 blur-xl animate-pulse pointer-events-none" />
            <div className="absolute -inset-14 rounded-full border border-emerald-500/20 animate-ping opacity-25 pointer-events-none" style={{ animationDuration: '3s' }} />
            <div className="absolute -inset-6 rounded-full border border-emerald-500/30 animate-pulse pointer-events-none" />
          </>
        )}

        {isConnecting && (
          <>
            <div className="absolute -inset-8 rounded-full bg-cyan-500/20 blur-xl animate-pulse pointer-events-none" />
            <div className="absolute -inset-4 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-cyan-500 border-l-transparent animate-spin pointer-events-none" style={{ animationDuration: '1.2s' }} />
          </>
        )}

        {/* The Giant One-Tap Button */}
        <button
          onClick={handleClick}
          disabled={isConnecting || isDisconnecting}
          aria-label={isConnected ? "Disconnect VPN tunnel" : "Connect to VPN server"}
          aria-pressed={isConnected}
          className={`
            relative z-10 w-44 h-44 rounded-full flex flex-col items-center justify-center
            transition-all duration-500 transform active:scale-95 shadow-2xl focus:outline-none focus:ring-4
            ${isConnected 
              ? 'bg-gradient-to-b from-emerald-500 to-teal-700 text-white shadow-emerald-500/40 ring-emerald-400/30 border-4 border-emerald-300/40' 
              : isConnecting 
                ? 'bg-gradient-to-b from-slate-800 to-cyan-950 text-cyan-300 shadow-cyan-500/20 ring-cyan-500/30 border-4 border-cyan-500/50 cursor-wait'
                : isDisconnecting
                  ? 'bg-gradient-to-b from-slate-800 to-amber-950 text-amber-300 shadow-amber-500/20 border-4 border-amber-500/40 cursor-wait'
                  : 'bg-gradient-to-b from-slate-800 to-slate-900 text-slate-300 hover:text-white shadow-black/80 ring-slate-700/50 border-4 border-slate-700/60 hover:border-emerald-500/50 hover:shadow-emerald-500/10'
            }
          `}
        >
          {/* Inner Neumorphic Gradient Shell */}
          <div className="absolute inset-1.5 rounded-full border border-white/10 pointer-events-none" />

          {/* Main Icon Center */}
          <div className="mb-2 relative">
            {isConnected ? (
              <div className="relative">
                <Power className="w-16 h-16 drop-shadow-md text-white transition-transform duration-300 hover:rotate-12" />
                <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 text-emerald-600 shadow-md">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
            ) : isConnecting ? (
              <div className="relative animate-pulse">
                <Radio className="w-14 h-14 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            ) : isDisconnecting ? (
              <Power className="w-14 h-14 text-amber-400 opacity-60" />
            ) : (
              <div className="relative group">
                <Power className="w-16 h-16 text-slate-400 group-hover:text-emerald-400 transition-colors duration-300" />
                <div className="absolute -bottom-1 -right-1 bg-slate-700 group-hover:bg-emerald-500 rounded-full p-1 text-slate-300 group-hover:text-black transition-colors shadow">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>
            )}
          </div>

          {/* Micro Status inside button */}
          <span className="text-[11px] font-bold tracking-widest uppercase opacity-90">
            {isConnected ? 'PROTECTED' : isConnecting ? 'CONNECTING' : isDisconnecting ? 'CLOSING' : 'READY'}
          </span>
          <span className="text-[9px] text-slate-300/80 font-mono mt-0.5">
            {isConnected ? `${ping}ms • SECURE` : isConnecting ? 'HANDSHAKE' : 'ONE-TAP'}
          </span>
        </button>
      </div>

      {/* Dynamic Status Text & Sub-labels */}
      <div className="mt-5 text-center px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all duration-300
          ${isConnected 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/10' 
            : isConnecting 
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 animate-pulse'
              : isDisconnecting
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-800/80 border-slate-700/50 text-slate-400'
          }"
        >
          <span className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-emerald-400 animate-pulse' : 
            isConnecting ? 'bg-cyan-400 animate-ping' : 
            isDisconnecting ? 'bg-amber-400' : 'bg-slate-500'
          }`} />
          <span>
            {isConnected && 'Connected • AES/ChaCha Encrypted'}
            {isConnecting && 'Negotiating UDP/VLESS Cipher...'}
            {isDisconnecting && 'Tearing Down Tunnel...'}
            {isDisconnected && 'Tap Button to Shield Connection'}
          </span>
        </div>

        <p className="text-xs text-slate-400 mt-2 font-medium">
          {isConnected ? (
            <span className="text-slate-300">
              Tunneling via <span className="text-emerald-400 font-semibold">{serverName}</span> ({protocolName.toUpperCase()})
            </span>
          ) : (
            <span>Target: <strong className="text-slate-300">{serverName}</strong></span>
          )}
        </p>
      </div>
    </div>
  );
};
