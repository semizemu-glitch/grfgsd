import React from 'react';
import { ChevronRight, Signal, Zap } from 'lucide-react';
import { VpnServer } from '../types/vpn';

interface ServerSelectorBarProps {
  currentServer: VpnServer;
  onOpenDrawer: () => void;
  disabled?: boolean;
}

export const ServerSelectorBar: React.FC<ServerSelectorBarProps> = ({
  currentServer,
  onOpenDrawer,
  disabled = false
}) => {
  const getPingColor = (ping: number) => {
    if (ping < 40) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (ping < 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="w-full px-4 mb-4">
      <button
        onClick={onOpenDrawer}
        disabled={disabled}
        aria-label={`Select server: currently ${currentServer.name}, ${currentServer.protocol.toUpperCase()}`}
        className="w-full group bg-slate-900/90 hover:bg-slate-800/90 active:scale-[0.99] border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 shadow-lg flex items-center justify-between transition-all duration-200 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-3xl shrink-0 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 shadow-inner flex items-center justify-center w-12 h-12">
            <span>{currentServer.flag}</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-100 truncate group-hover:text-emerald-300 transition-colors">
                {currentServer.name}
              </h3>
              {currentServer.isCustom && (
                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-semibold uppercase">
                  Custom
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="capitalize font-mono font-medium text-[11px] text-slate-300">
                {currentServer.protocol.replace('-', ' ')}
              </span>
              <span>•</span>
              <span className="text-slate-400">{currentServer.city}, {currentServer.country}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pl-2">
          {/* Ping Badge */}
          <div className={`px-2 py-1 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1 ${getPingColor(currentServer.ping)}`}>
            <Zap className="w-3 h-3 fill-current" />
            <span>{currentServer.ping}ms</span>
          </div>

          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-all">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </button>
    </div>
  );
};
