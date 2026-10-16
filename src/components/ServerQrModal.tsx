import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, QrCode as QrIcon, Share2 } from 'lucide-react';
import { VpnServer } from '../types/vpn';
import { exportServerUri } from '../utils/vpnProtocol';

interface ServerQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: VpnServer | null;
}

export const ServerQrModal: React.FC<ServerQrModalProps> = ({
  isOpen,
  onClose,
  server
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!server) return;
    const uri = server.rawUri || exportServerUri(server);
    QRCode.toDataURL(uri, {
      width: 280,
      margin: 2,
      color: {
        dark: '#030712',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR:', err));
  }, [server]);

  if (!isOpen || !server) return null;

  const uri = server.rawUri || exportServerUri(server);

  const handleCopy = () => {
    navigator.clipboard?.writeText(uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center"
        role="dialog"
        aria-modal="true"
        aria-label="Server QR Code & Export"
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">{server.flag}</span>
            <div className="text-left">
              <h3 className="text-xs font-bold text-slate-100 truncate max-w-[190px]">
                {server.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono uppercase">
                {server.protocol.replace('-', ' ')} • {server.port}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close QR dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="my-5 p-3.5 bg-white rounded-2xl shadow-xl flex items-center justify-center">
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt={`QR code for ${server.name}`} 
              className="w-56 h-56 rounded-lg object-contain"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
              Generating QR Code...
            </div>
          )}
        </div>

        <p className="text-xs text-slate-300 font-medium mb-1">
          Scan with mobile VPN apps:
        </p>
        <p className="text-[11px] text-slate-500 mb-4">
          Compatible with V2rayNG, Sing-box, Shadowrocket, Streisand, Clash
        </p>

        {/* Copy URI Action */}
        <div className="w-full space-y-2">
          <button
            onClick={handleCopy}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              copied
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Link Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Raw Server URI</span>
              </>
            )}
          </button>

          {/* URI snippet preview */}
          <div className="p-2 bg-slate-950 rounded-lg text-[10px] text-slate-400 font-mono truncate text-left border border-slate-800">
            {uri}
          </div>
        </div>
      </div>
    </div>
  );
};
