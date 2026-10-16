import React, { useState } from 'react';
import { 
  X, Link2, Sliders, CheckCircle2, AlertCircle, 
  Sparkles, Code2, Copy, Check, Users, Server, Layers
} from 'lucide-react';
import { VpnServer, VpnProtocolType, NetworkType, SecurityType } from '../types/vpn';
import { parseVpnUri, parseBatchUris } from '../utils/vpnProtocol';
import { SAMPLE_IMPORT_LINKS } from '../data/defaultServers';
import { triggerHaptic, playSound } from '../utils/feedback';

interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddServer: (server: VpnServer, autoSelect: boolean) => void;
  onAddBatchServers: (servers: VpnServer[]) => void;
}

export const AddServerModal: React.FC<AddServerModalProps> = ({
  isOpen,
  onClose,
  onAddServer,
  onAddBatchServers
}) => {
  const [activeTab, setActiveTab] = useState<'uri' | 'manual' | 'clientGuide'>('uri');

  // URI / Batch Import State
  const [rawUri, setRawUri] = useState('');
  const [parsedPreview, setParsedPreview] = useState<VpnServer | null>(null);
  const [batchServers, setBatchServers] = useState<VpnServer[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Manual Form State
  const [manualName, setManualName] = useState('My Custom Fast Node');
  const [manualProtocol, setManualProtocol] = useState<VpnProtocolType>('vless');
  const [manualHost, setManualHost] = useState('');
  const [manualPort, setManualPort] = useState('443');
  const [manualUuid, setManualUuid] = useState('');
  const [manualNetwork, setManualNetwork] = useState<NetworkType>('tcp');
  const [manualSecurity, setManualSecurity] = useState<SecurityType>('reality');
  const [manualSni, setManualSni] = useState('gateway.icloud.com');
  const [manualPath, setManualPath] = useState('');
  const [manualUdp, setManualUdp] = useState(true);
  const [manualError, setManualError] = useState<string | null>(null);

  // Code Copy State
  const [codeCopied, setCodeCopied] = useState(false);

  if (!isOpen) return null;

  // Handle URI input change & live parsing (handles single and batch multi-line links)
  const handleUriChange = (val: string) => {
    setRawUri(val);
    if (!val.trim()) {
      setParsedPreview(null);
      setBatchServers([]);
      setParseError(null);
      return;
    }

    // Try batch parse first if multiple lines or subscription
    const batch = parseBatchUris(val);
    if (batch.servers.length > 1) {
      setBatchServers(batch.servers);
      setParsedPreview(batch.servers[0]);
      setParseError(null);
      return;
    }

    // Single parse fallback
    const single = parseVpnUri(val);
    if (single.success && single.server) {
      setParsedPreview(single.server);
      setBatchServers([single.server]);
      setParseError(null);
    } else {
      setParsedPreview(null);
      setBatchServers([]);
      setParseError(single.error || 'Failed to parse configuration link');
    }
  };

  const handleApplySample = (uri: string) => {
    handleUriChange(uri);
  };

  const handleSaveUri = (autoSelect: boolean) => {
    if (batchServers.length > 1) {
      triggerHaptic('success');
      playSound('connect');
      onAddBatchServers(batchServers);
      onClose();
      return;
    }

    if (!parsedPreview) return;
    triggerHaptic('success');
    playSound('connect');
    onAddServer(parsedPreview, autoSelect);
    onClose();
  };

  const handleSaveManual = (autoSelect: boolean) => {
    if (!manualHost.trim()) {
      setManualError('Please provide a server Host IP or domain');
      return;
    }
    const portNum = parseInt(manualPort, 10);
    if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
      setManualError('Port must be between 1 and 65535');
      return;
    }

    const newServer: VpnServer = {
      id: 'custom-' + Date.now(),
      name: manualName.trim() || 'Custom Server',
      flag: '⚡',
      country: 'Custom Relay',
      city: 'Direct Point',
      protocol: manualProtocol,
      host: manualHost.trim(),
      port: portNum,
      uuid: manualUuid.trim() || 'custom-key-' + Math.random().toString(36).substring(2, 8),
      network: manualNetwork,
      security: manualSecurity,
      sni: manualSni.trim() || undefined,
      path: manualPath.trim() || undefined,
      udpSupport: manualUdp,
      ping: manualProtocol === 'v2ray-udp' ? 24 : 38,
      pingStatus: 'untested',
      isCustom: true,
      load: 10,
      speedRating: 'ultra'
    };

    triggerHaptic('success');
    playSound('connect');
    onAddServer(newServer, autoSelect);
    onClose();
  };

  const sampleDefaultServerCode = `// Add this to /src/data/defaultServers.ts
{
  id: 'srv-my-client-node',
  name: '${manualHost ? manualName : 'My Client Ultra Server'}',
  flag: '⚡',
  country: 'United States',
  city: 'New York',
  protocol: '${manualProtocol}',
  host: '${manualHost || 'your-client-v2ray.com'}',
  port: ${manualPort || 443},
  uuid: '${manualUuid || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'}',
  network: '${manualNetwork}',
  security: '${manualSecurity}',
  sni: '${manualSni || 'gateway.icloud.com'}',
  udpSupport: true,
  ping: 28,
  pingStatus: 'tested',
  load: 15,
  speedRating: 'ultra'
},`;

  const copyCode = () => {
    navigator.clipboard?.writeText(sampleDefaultServerCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-label="Add VPN Server"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100">Add Server</h2>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
              Client & Custom Nodes
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close add server dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher - 3 Tabs */}
        <div className="grid grid-cols-3 p-1.5 bg-slate-950/60 border-b border-slate-800 gap-1 text-[11px]">
          <button
            onClick={() => setActiveTab('uri')}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
              activeTab === 'uri'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Paste / Batch</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
              activeTab === 'manual'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Manual Config</span>
          </button>

          <button
            onClick={() => setActiveTab('clientGuide')}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
              activeTab === 'clientGuide'
                ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>For Clients</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {activeTab === 'clientGuide' ? (
            /* Client Guide & Deployment Explanation */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-cyan-300">
                  <Server className="w-4 h-4" />
                  <span>How to add servers for all your clients:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  You have 2 convenient options to add servers for your clients:
                </p>
              </div>

              {/* Option 1: In the App */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-mono">1</span>
                  <span>In the App (Directly in UI)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  You or your clients can paste single or multiple links (batch import) into the <strong>Paste / Batch</strong> tab or use <strong>Manual Config</strong>. Servers are immediately saved and ready to connect.
                </p>
              </div>

              {/* Option 2: In Code for All Clients Automatically */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-cyan-400">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-mono">2</span>
                  <span>Permanently in Code (/src/data/defaultServers.ts)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  To make your servers appear permanently for <strong>every client who opens your app</strong>, add them to the file:
                  <code className="block mt-1 p-1 rounded bg-slate-900 text-slate-300 font-mono text-[10px]">
                    src/data/defaultServers.ts
                  </code>
                </p>

                {/* Code Generator & Copy Button */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Generated Code Template:</span>
                    <button
                      onClick={copyCode}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                    >
                      {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{codeCopied ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto">
                    {sampleDefaultServerCode}
                  </pre>
                </div>
              </div>
            </div>
          ) : activeTab === 'uri' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Paste Server URI, Batch Links, or Subscription
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste single link or multiple links (one per line):
vless://...
vmess://...
udp://...
trojan://..."
                  value={rawUri}
                  onChange={(e) => handleUriChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-slate-200 font-mono text-[11px] placeholder:text-slate-600 focus:outline-none transition-colors"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Tip: Supports multiple links and Base64 subscription blobs!
                </span>
              </div>

              {/* Sample Links for Quick Test */}
              <div>
                <span className="block text-slate-400 font-medium mb-1.5 text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Or pick a sample server link to test:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {SAMPLE_IMPORT_LINKS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplySample(sample.uri)}
                      className="px-2.5 py-1.5 text-left rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 transition-colors truncate"
                    >
                      <span className="font-semibold block truncate">{sample.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Instant load</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Parse Validation Result */}
              {parseError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Unable to import node:</span>
                    <p className="text-[11px] mt-0.5 opacity-90">{parseError}</p>
                  </div>
                </div>
              )}

              {batchServers.length > 1 && (
                <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                    <Layers className="w-4 h-4" />
                    <span>Batch Subscription Detected: {batchServers.length} Servers!</span>
                  </div>
                  <div className="bg-slate-950/80 rounded-lg p-2 max-h-24 overflow-y-auto space-y-1 text-[11px] font-mono text-slate-300 border border-slate-800">
                    {batchServers.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span>{s.flag} {s.name}</span>
                        <span className="text-slate-500 uppercase text-[9px]">{s.protocol}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsedPreview && batchServers.length <= 1 && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Valid {parsedPreview.protocol.toUpperCase()} Configuration Found!</span>
                  </div>

                  <div className="bg-slate-950/80 rounded-lg p-2.5 space-y-1 font-mono text-[11px] text-slate-300 border border-slate-800">
                    <div><strong className="text-slate-400">Node Name:</strong> {parsedPreview.name}</div>
                    <div><strong className="text-slate-400">Host:</strong> {parsedPreview.host}:{parsedPreview.port}</div>
                    <div><strong className="text-slate-400">Protocol:</strong> {parsedPreview.protocol.toUpperCase()}</div>
                    <div><strong className="text-slate-400">Security:</strong> {parsedPreview.security.toUpperCase()}</div>
                    <div><strong className="text-slate-400">Transmission:</strong> {parsedPreview.network.toUpperCase()}</div>
                    {parsedPreview.sni && <div><strong className="text-slate-400">SNI:</strong> {parsedPreview.sni}</div>}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  disabled={!parsedPreview && batchServers.length === 0}
                  onClick={() => handleSaveUri(true)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  {batchServers.length > 1 ? `Import All (${batchServers.length} Servers)` : 'Save & Connect'}
                </button>
                <button
                  type="button"
                  disabled={!parsedPreview && batchServers.length === 0}
                  onClick={() => handleSaveUri(false)}
                  className="px-4 py-2.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 transition-colors"
                >
                  Save Only
                </button>
              </div>
            </div>
          ) : (
            /* Manual Form */
            <div className="space-y-3">
              {manualError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{manualError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Server Name / Label</label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  placeholder="e.g. Frankfurt UDP Gaming"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Protocol Type</label>
                  <select
                    value={manualProtocol}
                    onChange={(e) => {
                      const p = e.target.value as VpnProtocolType;
                      setManualProtocol(p);
                      if (p === 'v2ray-udp') {
                        setManualPort('51820');
                        setManualNetwork('kcp');
                      } else if (p === 'vmess') {
                        setManualPort('8443');
                        setManualNetwork('ws');
                        setManualSecurity('tls');
                      } else if (p === 'vless') {
                        setManualPort('443');
                        setManualNetwork('tcp');
                        setManualSecurity('reality');
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    <option value="vless">VLESS (Reality / XTLS)</option>
                    <option value="v2ray-udp">V2Ray UDP (Turbo)</option>
                    <option value="vmess">VMess (WebSocket / TLS)</option>
                    <option value="trojan">Trojan (TLS Direct)</option>
                    <option value="shadowsocks">Shadowsocks (AEAD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Port</label>
                  <input
                    type="number"
                    value={manualPort}
                    onChange={(e) => setManualPort(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none font-mono"
                    placeholder="443"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Server Host / Address</label>
                <input
                  type="text"
                  value={manualHost}
                  onChange={(e) => { setManualHost(e.target.value); setManualError(null); }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none font-mono"
                  placeholder="node01.your-v2ray-vless.com or IP"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">UUID / User ID / Password</label>
                <input
                  type="text"
                  value={manualUuid}
                  onChange={(e) => setManualUuid(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none font-mono text-[11px]"
                  placeholder="e.g. 7b98d24a-810e-45fa-bb59-332e1858c891"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Transmission Network</label>
                  <select
                    value={manualNetwork}
                    onChange={(e) => setManualNetwork(e.target.value as NetworkType)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    <option value="tcp">TCP (Standard)</option>
                    <option value="kcp">mKCP (Low UDP Jitter)</option>
                    <option value="ws">WebSocket (CDN friendly)</option>
                    <option value="grpc">gRPC (Ultra Fast)</option>
                    <option value="quic">QUIC (HTTP/3)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">TLS / Security</label>
                  <select
                    value={manualSecurity}
                    onChange={(e) => setManualSecurity(e.target.value as SecurityType)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    <option value="reality">Reality (Anti-Censorship)</option>
                    <option value="tls">Standard TLS</option>
                    <option value="none">None / Direct</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">SNI / ServerName</label>
                  <input
                    type="text"
                    value={manualSni}
                    onChange={(e) => setManualSni(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none font-mono text-[11px]"
                    placeholder="gateway.icloud.com"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Path (Optional)</label>
                  <input
                    type="text"
                    value={manualPath}
                    onChange={(e) => setManualPath(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none font-mono text-[11px]"
                    placeholder="/vless-ws"
                  />
                </div>
              </div>

              {/* UDP Support Toggle */}
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={manualUdp}
                  onChange={(e) => setManualUdp(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700 w-4 h-4"
                />
                <span className="text-slate-300 font-medium">Enable UDP Relay & BBR Acceleration (Better Gaming & Calls)</span>
              </label>

              {/* Actions */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveManual(true)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  Save & Connect
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveManual(false)}
                  className="px-4 py-2.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
