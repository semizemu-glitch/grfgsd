import React from 'react';
import { 
  X, Shield, Lock, Globe, Zap, EyeOff, 
  Smartphone, Check, RefreshCw 
} from 'lucide-react';
import { VpnSettings } from '../types/vpn';
import { triggerHaptic, playSound } from '../utils/feedback';

interface SecuritySheetProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VpnSettings;
  onUpdateSettings: (newSettings: VpnSettings) => void;
}

export const SecuritySheet: React.FC<SecuritySheetProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  if (!isOpen) return null;

  const toggle = (key: keyof VpnSettings) => {
    triggerHaptic('tap');
    playSound('click');
    onUpdateSettings({
      ...settings,
      [key]: !settings[key]
    });
  };

  const setCipher = (cipher: VpnSettings['preferredCipher']) => {
    triggerHaptic('tap');
    playSound('click');
    onUpdateSettings({
      ...settings,
      preferredCipher: cipher
    });
  };

  const setDns = (dns: VpnSettings['dnsProtection']) => {
    triggerHaptic('tap');
    playSound('click');
    onUpdateSettings({
      ...settings,
      dnsProtection: dns
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Security & Encryption Settings"
      >
        {/* Handle bar on mobile */}
        <div className="w-12 h-1.5 bg-slate-700/60 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Security & Encryption</h2>
              <p className="text-[10px] text-slate-400">Military-grade protection & bypass filters</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close security settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Settings */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Encryption Cipher Selection */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Tunnel Encryption Cipher</span>
            </div>
            <p className="text-[11px] text-slate-400">
              ChaCha20 is optimized for mobile ARM processors for superior battery life and zero thermal throttling.
            </p>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                onClick={() => setCipher('chacha20-poly1305')}
                className={`p-2 rounded-xl text-center border font-mono transition-all ${
                  settings.preferredCipher === 'chacha20-poly1305'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-[11px]">ChaCha20</div>
                <div className="text-[9px] opacity-75 font-sans mt-0.5">Mobile Turbo</div>
              </button>

              <button
                onClick={() => setCipher('aes-256-gcm')}
                className={`p-2 rounded-xl text-center border font-mono transition-all ${
                  settings.preferredCipher === 'aes-256-gcm'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-[11px]">AES-256-GCM</div>
                <div className="text-[9px] opacity-75 font-sans mt-0.5">Military Grade</div>
              </button>

              <button
                onClick={() => setCipher('aes-128-gcm')}
                className={`p-2 rounded-xl text-center border font-mono transition-all ${
                  settings.preferredCipher === 'aes-128-gcm'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-[11px]">AES-128-GCM</div>
                <div className="text-[9px] opacity-75 font-sans mt-0.5">Low Overhead</div>
              </button>
            </div>
          </div>

          {/* Kill Switch Toggle */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Always-On Kill Switch</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Instantly cut off network connectivity if VPN tunnel disconnects unexpectedly to prevent IP leaks.
              </p>
            </div>

            <button
              onClick={() => toggle('killSwitch')}
              aria-checked={settings.killSwitch}
              role="switch"
              className={`w-12 h-6.5 rounded-full transition-colors relative shrink-0 p-0.5 ${
                settings.killSwitch ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.killSwitch ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* UDP Acceleration Toggle */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>V2Ray UDP Turbo & BBR</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Enhances packet transmission efficiency over UDP and reduces latency in mobile gaming and voice calls.
              </p>
            </div>

            <button
              onClick={() => toggle('udpAcceleration')}
              aria-checked={settings.udpAcceleration}
              role="switch"
              className={`w-12 h-6.5 rounded-full transition-colors relative shrink-0 p-0.5 ${
                settings.udpAcceleration ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.udpAcceleration ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Obfuscation (Camouflage) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                <EyeOff className="w-4 h-4 text-cyan-400" />
                <span>TLS Traffic Camouflage</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Disguises VPN traffic as standard HTTPS browsing traffic to bypass ISP DPI (Deep Packet Inspection).
              </p>
            </div>

            <button
              onClick={() => toggle('obfuscation')}
              aria-checked={settings.obfuscation}
              role="switch"
              className={`w-12 h-6.5 rounded-full transition-colors relative shrink-0 p-0.5 ${
                settings.obfuscation ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.obfuscation ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Secure DNS Shield */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Encrypted DNS Provider (DoH)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Routes all domain requests through zero-log encrypted resolvers to stop DNS hijacking.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
              {[
                { id: 'cloudflare', name: 'Cloudflare', ip: '1.1.1.1' },
                { id: 'adguard', name: 'AdGuard AdBlock', ip: '94.140.14.14' },
                { id: 'google', name: 'Google DNS', ip: '8.8.8.8' },
                { id: 'quad9', name: 'Quad9 Secure', ip: '9.9.9.9' }
              ].map((dns) => (
                <button
                  key={dns.id}
                  onClick={() => setDns(dns.id as VpnSettings['dnsProtection'])}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    settings.dnsProtection === dns.id
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold font-sans">{dns.name}</div>
                  <div className="text-[10px] text-slate-500">{dns.ip}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Split Tunneling */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                <Smartphone className="w-4 h-4 text-teal-400" />
                <span>Split Tunneling</span>
              </div>
              <button
                onClick={() => toggle('splitTunneling')}
                aria-checked={settings.splitTunneling}
                role="switch"
                className={`w-12 h-6.5 rounded-full transition-colors relative shrink-0 p-0.5 ${
                  settings.splitTunneling ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform ${
                    settings.splitTunneling ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Allow selected local apps to bypass VPN for higher direct speed (e.g. food apps, banking).
            </p>

            {settings.splitTunneling && (
              <div className="pt-1 space-y-1.5">
                {settings.bypassedApps.map((app, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
                    <span className="text-[11px] text-slate-300">{app}</span>
                    <span className="text-[10px] text-amber-400 font-semibold">Direct Route</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-lg shadow-emerald-500/20"
          >
            Apply Security Settings
          </button>
        </div>
      </div>
    </div>
  );
};
