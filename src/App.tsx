import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, ShieldCheck, Zap, Plus, Settings2, Activity, 
  HelpCircle, Sparkles, RefreshCw, Layers 
} from 'lucide-react';
import { 
  VpnServer, ConnectionStatus, VpnSessionStats, VpnSettings 
} from './types/vpn';
import { DEFAULT_SERVERS } from './data/defaultServers';
import { 
  loadSavedServers, saveAllServers, 
  loadSelectedServerId, saveSelectedServerId, 
  loadSettings, saveSettings 
} from './utils/storage';
import { generateVirtualIp } from './utils/vpnProtocol';
import { triggerHaptic, playSound } from './utils/feedback';

import { MobileFrame } from './components/MobileFrame';
import { ConnectButton } from './components/ConnectButton';
import { ServerSelectorBar } from './components/ServerSelectorBar';
import { TrafficCard } from './components/TrafficCard';
import { ServerDrawer } from './components/ServerDrawer';
import { AddServerModal } from './components/AddServerModal';
import { ServerQrModal } from './components/ServerQrModal';
import { SecuritySheet } from './components/SecuritySheet';
import { SpeedTestModal } from './components/SpeedTestModal';

export default function App() {
  const [servers, setServers] = useState<VpnServer[]>(loadSavedServers);
  const [selectedServerId, setSelectedServerId] = useState<string>(loadSelectedServerId);
  const [settings, setSettings] = useState<VpnSettings>(loadSettings);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modals state
  const [isServerDrawerOpen, setIsServerDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isSpeedTestOpen, setIsSpeedTestOpen] = useState(false);
  const [qrModalServer, setQrModalServer] = useState<VpnServer | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  // Active Server
  const currentServer = servers.find((s) => s.id === selectedServerId) || servers[0] || DEFAULT_SERVERS[0];

  // Session Stats
  const [stats, setStats] = useState<VpnSessionStats>({
    status: 'disconnected',
    connectedAt: null,
    durationSeconds: 0,
    virtualIp: generateVirtualIp(currentServer.id),
    publicIp: '198.51.100.24',
    dnsServer: '1.1.1.1 (Cloudflare)',
    bytesDown: 0,
    bytesUp: 0,
    speedDown: 0,
    speedUp: 0,
    latency: currentServer.ping,
    packetLoss: 0,
    encryptionCipher: settings.preferredCipher
  });

  // Save changes to localStorage
  useEffect(() => {
    saveAllServers(servers);
  }, [servers]);

  useEffect(() => {
    saveSelectedServerId(selectedServerId);
  }, [selectedServerId]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Traffic & Timer Simulation loop when connected
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (connectionStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setStats((prev) => {
          const isUdp = currentServer.udpSupport;
          const baseSpeedDown = isUdp ? 3800 : 2100; // in KB/s
          const baseSpeedUp = isUdp ? 1400 : 800; // in KB/s

          const fluctuationDown = Math.max(200, Math.round(baseSpeedDown * (0.8 + Math.random() * 0.4)));
          const fluctuationUp = Math.max(80, Math.round(baseSpeedUp * (0.8 + Math.random() * 0.4)));

          const addedDownBytes = Math.round(fluctuationDown * 1024);
          const addedUpBytes = Math.round(fluctuationUp * 1024);

          return {
            ...prev,
            durationSeconds: prev.durationSeconds + 1,
            speedDown: fluctuationDown,
            speedUp: fluctuationUp,
            bytesDown: prev.bytesDown + addedDownBytes,
            bytesUp: prev.bytesUp + addedUpBytes,
            latency: Math.max(12, Math.round(currentServer.ping + (Math.random() * 6 - 3)))
          };
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [connectionStatus, currentServer]);

  // One-Tap Connection Toggle
  const handleToggleConnection = () => {
    if (connectionStatus === 'disconnected') {
      setConnectionStatus('connecting');
      if (soundEnabled) playSound('click');
      triggerHaptic('tap');

      // Handshake negotiation delay
      setTimeout(() => {
        setConnectionStatus('connected');
        if (soundEnabled) playSound('connect');
        triggerHaptic('success');

        setStats((prev) => ({
          ...prev,
          status: 'connected',
          connectedAt: Date.now(),
          durationSeconds: 0,
          virtualIp: generateVirtualIp(currentServer.id),
          encryptionCipher: settings.preferredCipher,
          dnsServer: settings.dnsProtection === 'cloudflare' ? '1.1.1.1 (Cloudflare)' : '8.8.8.8 (Google)'
        }));
      }, 1200);
    } else if (connectionStatus === 'connected') {
      setConnectionStatus('disconnecting');
      if (soundEnabled) playSound('disconnect');
      triggerHaptic('disconnect');

      setTimeout(() => {
        setConnectionStatus('disconnected');
        setStats((prev) => ({
          ...prev,
          status: 'disconnected',
          speedDown: 0,
          speedUp: 0
        }));
      }, 500);
    }
  };

  // Switch server
  const handleSelectServer = (server: VpnServer) => {
    setSelectedServerId(server.id);
    if (connectionStatus === 'connected') {
      // Smooth re-connect to new node
      setConnectionStatus('connecting');
      setTimeout(() => {
        setConnectionStatus('connected');
        setStats((prev) => ({
          ...prev,
          virtualIp: generateVirtualIp(server.id),
          latency: server.ping
        }));
      }, 900);
    }
  };

  // Add custom server
  const handleAddServer = (newServer: VpnServer, autoSelect: boolean) => {
    setServers((prev) => [newServer, ...prev]);
    if (autoSelect) {
      handleSelectServer(newServer);
    }
  };

  // Add multiple servers from batch or subscription
  const handleAddBatchServers = (newServers: VpnServer[]) => {
    setServers((prev) => [...newServers, ...prev]);
    if (newServers.length > 0) {
      handleSelectServer(newServers[0]);
    }
  };

  // Delete custom server
  const handleDeleteCustomServer = (id: string) => {
    setServers((prev) => prev.filter((s) => s.id !== id));
    if (selectedServerId === id) {
      setSelectedServerId(DEFAULT_SERVERS[0].id);
    }
  };

  // Ping All Nodes
  const handlePingAll = () => {
    setIsPinging(true);
    triggerHaptic('tap');
    playSound('click');

    setTimeout(() => {
      setServers((prev) =>
        prev.map((s) => ({
          ...s,
          ping: Math.max(12, Math.round(s.ping * (0.85 + Math.random() * 0.3))),
          pingStatus: 'tested'
        }))
      );
      setIsPinging(false);
      triggerHaptic('success');
    }, 1100);
  };

  return (
    <MobileFrame
      isConnected={connectionStatus === 'connected'}
      soundEnabled={soundEnabled}
      onToggleSound={() => setSoundEnabled(!soundEnabled)}
      onOpenAddModal={() => setIsAddModalOpen(true)}
      onOpenSecurity={() => setIsSecurityOpen(true)}
    >
      {/* Mobile App Header */}
      <header className="px-5 pt-3 pb-2 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold text-white tracking-tight leading-tight">
                ApexVPN
              </h1>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md uppercase font-mono">
                TURBO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              V2Ray • VLESS • VMess • UDP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            aria-label="Add server"
            className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 flex items-center justify-center transition-colors active:scale-95"
            title="Add V2Ray / VLESS / VMess Server"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsSecurityOpen(true)}
            aria-label="Security settings"
            className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 flex items-center justify-center transition-colors active:scale-95"
            title="Security & Encryption Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-between py-2 z-10 w-full">
        {/* Quick Protocol Banner */}
        <div className="w-full px-5 py-1">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Engine: <strong className="text-slate-200">Xray-core / UDP BBR</strong></span>
            </div>
            <button
              onClick={() => setIsSecurityOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 text-[10px]"
            >
              <span>{settings.preferredCipher.includes('chacha') ? 'ChaCha20' : 'AES-256'}</span>
              <span aria-hidden="true">&bull;</span>
              <span>{settings.killSwitch ? 'KillSwitch ON' : 'Standard'}</span>
            </button>
          </div>
        </div>

        {/* The One-Tap Power Button */}
        <ConnectButton
          status={connectionStatus}
          serverName={currentServer.name}
          protocolName={currentServer.protocol}
          ping={stats.latency}
          onToggle={handleToggleConnection}
        />

        {/* Server Selector Bar */}
        <ServerSelectorBar
          currentServer={currentServer}
          onOpenDrawer={() => setIsServerDrawerOpen(true)}
          disabled={connectionStatus === 'connecting' || connectionStatus === 'disconnecting'}
        />

        {/* Real-time Traffic & Security Card */}
        <TrafficCard
          stats={stats}
          currentServer={currentServer}
          onOpenSpeedTest={() => setIsSpeedTestOpen(true)}
        />
      </main>

      {/* Server Selection Sheet */}
      <ServerDrawer
        isOpen={isServerDrawerOpen}
        onClose={() => setIsServerDrawerOpen(false)}
        servers={servers}
        selectedServerId={selectedServerId}
        onSelectServer={handleSelectServer}
        onOpenAddModal={() => {
          setIsServerDrawerOpen(false);
          setIsAddModalOpen(true);
        }}
        onOpenQrModal={(server) => setQrModalServer(server)}
        onDeleteCustomServer={handleDeleteCustomServer}
        onPingAll={handlePingAll}
        isPinging={isPinging}
      />

      {/* Add Server Modal (Supports Link Paste and Form Builder) */}
      <AddServerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddServer={handleAddServer}
        onAddBatchServers={handleAddBatchServers}
      />

      {/* QR Code & URI Export Modal */}
      <ServerQrModal
        isOpen={!!qrModalServer}
        onClose={() => setQrModalServer(null)}
        server={qrModalServer}
      />

      {/* Security & Cipher Settings Sheet */}
      <SecuritySheet
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      {/* Interactive Speed Benchmark Modal */}
      <SpeedTestModal
        isOpen={isSpeedTestOpen}
        onClose={() => setIsSpeedTestOpen(false)}
        server={currentServer}
        isConnected={connectionStatus === 'connected'}
      />
    </MobileFrame>
  );
}
