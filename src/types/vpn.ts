export type VpnProtocolType = 
  | 'vless' 
  | 'vmess' 
  | 'v2ray-udp' 
  | 'trojan' 
  | 'shadowsocks' 
  | 'wireguard';

export type NetworkType = 'tcp' | 'kcp' | 'ws' | 'grpc' | 'quic';
export type SecurityType = 'tls' | 'reality' | 'none';

export interface VpnServer {
  id: string;
  name: string;
  flag: string;
  country: string;
  city: string;
  protocol: VpnProtocolType;
  host: string;
  port: number;
  uuid?: string;
  alterId?: number;
  encryption?: string;
  network: NetworkType;
  security: SecurityType;
  sni?: string;
  path?: string;
  udpSupport: boolean;
  ping: number;
  pingStatus: 'tested' | 'testing' | 'untested';
  isCustom?: boolean;
  load: number; // 0 - 100
  speedRating: 'ultra' | 'fast' | 'normal';
  rawUri?: string;
  premiumOnly?: boolean;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'disconnecting';

export interface VpnSessionStats {
  status: ConnectionStatus;
  connectedAt: number | null;
  durationSeconds: number;
  virtualIp: string;
  publicIp: string;
  dnsServer: string;
  bytesDown: number;
  bytesUp: number;
  speedDown: number; // in KB/s
  speedUp: number; // in KB/s
  latency: number; // in ms
  packetLoss: number; // 0%
  encryptionCipher: string;
}

export interface VpnSettings {
  killSwitch: boolean;
  dnsProtection: 'cloudflare' | 'google' | 'adguard' | 'quad9';
  udpAcceleration: boolean;
  obfuscation: boolean;
  autoReconnect: boolean;
  preferredCipher: 'chacha20-poly1305' | 'aes-256-gcm' | 'aes-128-gcm';
  splitTunneling: boolean;
  bypassedApps: string[];
}
