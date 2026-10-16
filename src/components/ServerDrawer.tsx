import React, { useState } from 'react';
import { 
  X, Search, Plus, Zap, Check, Trash2, QrCode, 
  RotateCw, ArrowUpDown, Filter, Shield
} from 'lucide-react';
import { VpnServer, VpnProtocolType } from '../types/vpn';
import { triggerHaptic, playSound } from '../utils/feedback';

interface ServerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  servers: VpnServer[];
  selectedServerId: string;
  onSelectServer: (server: VpnServer) => void;
  onOpenAddModal: () => void;
  onOpenQrModal: (server: VpnServer) => void;
  onDeleteCustomServer: (id: string) => void;
  onPingAll: () => void;
  isPinging: boolean;
}

export const ServerDrawer: React.FC<ServerDrawerProps> = ({
  isOpen,
  onClose,
  servers,
  selectedServerId,
  onSelectServer,
  onOpenAddModal,
  onOpenQrModal,
  onDeleteCustomServer,
  onPingAll,
  isPinging
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | VpnProtocolType>('all');
  const [sortBy, setSortBy] = useState<'ping' | 'load' | 'name'>('ping');

  if (!isOpen) return null;

  const filteredServers = servers
    .filter(s => {
      if (selectedFilter !== 'all' && s.protocol !== selectedFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.protocol.toLowerCase().includes(q) ||
        s.host.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'ping') return a.ping - b.ping;
      if (sortBy === 'load') return a.load - b.load;
      return a.name.localeCompare(b.name);
    });

  const getPingBadge = (ping: number) => {
    if (ping < 35) {
      return { text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Ultra Low' };
    }
    if (ping < 65) {
      return { text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Fast' };
    }
    return { text: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', label: 'Normal' };
  };

  const handleSelect = (server: VpnServer) => {
    triggerHaptic('tap');
    playSound('click');
    onSelectServer(server);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[82vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Server Selection"
      >
        {/* Handle bar on mobile */}
        <div className="w-12 h-1.5 bg-slate-700/60 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100">Select Server</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {filteredServers.length} nodes
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddModal}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
              aria-label="Add custom VPN server"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Server</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close server selection"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 space-y-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by country, city, protocol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Protocol Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Protocols
            </button>
            <button
              onClick={() => setSelectedFilter('vless')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                selectedFilter === 'vless'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              VLESS Reality
            </button>
            <button
              onClick={() => setSelectedFilter('v2ray-udp')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                selectedFilter === 'v2ray-udp'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              V2Ray UDP
            </button>
            <button
              onClick={() => setSelectedFilter('vmess')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                selectedFilter === 'vmess'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              VMess WS
            </button>
            <button
              onClick={() => setSelectedFilter('trojan')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                selectedFilter === 'trojan'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              Trojan
            </button>
          </div>

          {/* Ping All & Sort */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
            <button
              onClick={onPingAll}
              disabled={isPinging}
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Testing Latency...' : 'Ping All Nodes'}</span>
            </button>

            <div className="flex items-center gap-1">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'ping' | 'load' | 'name')}
                className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-slate-200 focus:outline-none"
              >
                <option value="ping">Lowest Latency</option>
                <option value="load">Lowest Load</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Server List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-800/40">
          {filteredServers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <p>No servers found matching "{searchQuery}".</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedFilter('all'); }}
                className="mt-2 text-emerald-400 font-semibold hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredServers.map((server) => {
              const isSelected = server.id === selectedServerId;
              const badge = getPingBadge(server.ping);

              return (
                <div
                  key={server.id}
                  className={`pt-2.5 first:pt-0 group rounded-xl p-2.5 transition-all duration-200 border ${
                    isSelected 
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm' 
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Server identity */}
                    <button
                      onClick={() => handleSelect(server)}
                      className="flex items-center gap-3 text-left flex-1 min-w-0"
                      aria-label={`Select ${server.name}, ping ${server.ping}ms`}
                    >
                      <div className="text-2xl shrink-0 w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800">
                        {server.flag}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-300' : 'text-slate-100 group-hover:text-emerald-300'}`}>
                            {server.name}
                          </h4>
                          {server.isCustom && (
                            <span className="text-[9px] px-1 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                              CUSTOM
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="font-mono font-medium text-slate-300 uppercase">
                            {server.protocol.replace('-', ' ')}
                          </span>
                          <span>•</span>
                          <span>{server.city}, {server.country}</span>
                          <span>•</span>
                          <span className="text-slate-400">{server.security !== 'none' ? server.security.toUpperCase() : 'DIRECT'}</span>
                        </div>
                      </div>
                    </button>

                    {/* Actions and Stats */}
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      {/* Latency Pill */}
                      <div className={`px-2 py-0.5 rounded-lg border text-[11px] font-mono font-semibold flex items-center gap-1 ${badge.bg} ${badge.text}`}>
                        <Zap className="w-2.5 h-2.5 fill-current" />
                        <span>{server.ping}ms</span>
                      </div>

                      {/* QR Export Action */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenQrModal(server);
                        }}
                        title="Export QR Code for Mobile"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        aria-label={`Show QR code for ${server.name}`}
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      {/* Delete Custom Server */}
                      {server.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCustomServer(server.id);
                          }}
                          title="Delete Custom Server"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          aria-label={`Delete custom server ${server.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Selected Indicator */}
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSelect(server)}
                          className="w-6 h-6 rounded-full border border-slate-700 hover:border-emerald-500 flex items-center justify-center text-transparent hover:text-emerald-500"
                          aria-label={`Connect to ${server.name}`}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Micro load bar */}
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 px-1">
                    <span className="font-mono">Load: {server.load}%</span>
                    <div className="w-32 bg-slate-950 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          server.load < 30 ? 'bg-emerald-500' : server.load < 60 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${server.load}%` }}
                      />
                    </div>
                    <span>{server.udpSupport ? 'UDP ⚡' : 'TCP'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
