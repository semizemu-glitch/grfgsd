import type { VpnProtocolType, VpnServer, NetworkType, SecurityType } from '../types/vpn.ts';

export interface ParsedServerResult {
  success: boolean;
  server?: VpnServer;
  error?: string;
}

/**
 * Parses raw VPN connection URIs including vless://, vmess://, trojan://, ss://, udp://
 */
export function parseVpnUri(uri: string): ParsedServerResult {
  const trimmed = uri.trim();
  if (!trimmed) {
    return { success: false, error: 'URI cannot be empty' };
  }

  try {
    if (trimmed.startsWith('vless://')) {
      return parseVlessUri(trimmed);
    } else if (trimmed.startsWith('vmess://')) {
      return parseVmessUri(trimmed);
    } else if (trimmed.startsWith('trojan://')) {
      return parseTrojanUri(trimmed);
    } else if (trimmed.startsWith('ss://')) {
      return parseShadowsocksUri(trimmed);
    } else if (trimmed.startsWith('udp://')) {
      return parseUdpUri(trimmed);
    } else {
      return { 
        success: false, 
        error: 'Unsupported protocol format. Supported formats: vless://, vmess://, trojan://, ss://, udp://' 
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid link structure';
    return { success: false, error: `Parse failed: ${message}` };
  }
}

/**
 * Parses multiple VPN URIs from text or Base64 subscription payloads
 */
export function parseBatchUris(rawText: string): { servers: VpnServer[]; errors: string[] } {
  let textToParse = rawText.trim();
  const servers: VpnServer[] = [];
  const errors: string[] = [];

  if (!textToParse) return { servers, errors };

  // Check if entire text is base64 encoded subscription (common in v2ray providers)
  if (!textToParse.includes('://') && /^[A-Za-z0-9+/=\r\n]+$/.test(textToParse)) {
    try {
      const decoded = atob(textToParse.replace(/\s+/g, ''));
      if (decoded.includes('://')) {
        textToParse = decoded;
      }
    } catch {
      // not base64 or failed decode, continue with plain text
    }
  }

  const lines = textToParse.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Check if line contains a protocol URI
    const match = line.match(/(vless|vmess|trojan|ss|udp):\/\/[^\s]+/i);
    if (match) {
      const uri = match[0];
      const parsed = parseVpnUri(uri);
      if (parsed.success && parsed.server) {
        servers.push(parsed.server);
      } else if (parsed.error) {
        errors.push(`${line.substring(0, 30)}...: ${parsed.error}`);
      }
    }
  }

  return { servers, errors };
}


/**
 * vless://uuid@host:port?security=reality&sni=example.com&type=tcp#ServerName
 */
export function parseVlessUri(uri: string): ParsedServerResult {
  const rawWithoutPrefix = uri.substring(8);
  const hashIdx = rawWithoutPrefix.indexOf('#');
  let mainPart = rawWithoutPrefix;
  let serverName = 'Custom VLESS Node';

  if (hashIdx !== -1) {
    mainPart = rawWithoutPrefix.substring(0, hashIdx);
    serverName = decodeURIComponent(rawWithoutPrefix.substring(hashIdx + 1));
  }

  const atIdx = mainPart.indexOf('@');
  if (atIdx === -1) {
    return { success: false, error: 'VLESS URI missing UUID identifier (@)' };
  }

  const uuid = mainPart.substring(0, atIdx);
  const rest = mainPart.substring(atIdx + 1);

  const queryIdx = rest.indexOf('?');
  let hostPort = rest;
  let queryParams = new URLSearchParams();

  if (queryIdx !== -1) {
    hostPort = rest.substring(0, queryIdx);
    queryParams = new URLSearchParams(rest.substring(queryIdx + 1));
  }

  const hostPortParts = hostPort.split(':');
  if (hostPortParts.length < 2) {
    return { success: false, error: 'VLESS URI host:port is invalid' };
  }

  const host = hostPortParts[0];
  const port = parseInt(hostPortParts[1], 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    return { success: false, error: 'Port must be between 1 and 65535' };
  }

  const network = (queryParams.get('type') || 'tcp') as NetworkType;
  const security = (queryParams.get('security') || 'none') as SecurityType;
  const sni = queryParams.get('sni') || queryParams.get('peer') || undefined;
  const path = queryParams.get('path') || undefined;
  const encryption = queryParams.get('encryption') || 'none';

  const flag = guessFlagFromHostOrName(serverName, host);

  const server: VpnServer = {
    id: 'custom-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    name: serverName,
    flag,
    country: guessCountryFromFlag(flag),
    city: 'Fast Node',
    protocol: 'vless',
    host,
    port,
    uuid,
    encryption,
    network,
    security,
    sni,
    path,
    udpSupport: true,
    ping: 45,
    pingStatus: 'untested',
    isCustom: true,
    load: 18,
    speedRating: 'ultra',
    rawUri: uri
  };

  return { success: true, server };
}

/**
 * vmess://base64(json)
 */
export function parseVmessUri(uri: string): ParsedServerResult {
  const b64 = uri.substring(8);
  let decoded: string;
  try {
    decoded = atob(b64);
  } catch {
    return { success: false, error: 'Invalid Base64 in VMess link' };
  }

  let json: Record<string, unknown>;
  try {
    json = JSON.parse(decoded);
  } catch {
    return { success: false, error: 'VMess link payload is not valid JSON' };
  }

  const host = String(json.add || '');
  const port = parseInt(String(json.port || '0'), 10);
  const uuid = String(json.id || '');
  const name = String(json.ps || 'Custom VMess Server');
  const net = (json.net ? String(json.net) : 'ws') as NetworkType;
  const tls = json.tls === 'tls' ? 'tls' : 'none';
  const path = json.path ? String(json.path) : undefined;
  const sni = json.sni ? String(json.sni) : undefined;
  const alterId = json.aid ? parseInt(String(json.aid), 10) : 0;

  if (!host || !port || !uuid) {
    return { success: false, error: 'VMess payload missing host, port, or ID' };
  }

  const flag = guessFlagFromHostOrName(name, host);

  const server: VpnServer = {
    id: 'custom-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    name,
    flag,
    country: guessCountryFromFlag(flag),
    city: 'Direct Route',
    protocol: 'vmess',
    host,
    port,
    uuid,
    alterId,
    encryption: 'auto',
    network: net,
    security: tls as SecurityType,
    sni,
    path,
    udpSupport: true,
    ping: 60,
    pingStatus: 'untested',
    isCustom: true,
    load: 25,
    speedRating: 'fast',
    rawUri: uri
  };

  return { success: true, server };
}

/**
 * trojan://password@host:port?sni=domain#name
 */
export function parseTrojanUri(uri: string): ParsedServerResult {
  const withoutPrefix = uri.substring(9);
  const hashIdx = withoutPrefix.indexOf('#');
  let mainPart = withoutPrefix;
  let serverName = 'Trojan Secure Node';

  if (hashIdx !== -1) {
    mainPart = withoutPrefix.substring(0, hashIdx);
    serverName = decodeURIComponent(withoutPrefix.substring(hashIdx + 1));
  }

  const atIdx = mainPart.indexOf('@');
  if (atIdx === -1) {
    return { success: false, error: 'Trojan link missing password credentials' };
  }

  const password = mainPart.substring(0, atIdx);
  const rest = mainPart.substring(atIdx + 1);

  const queryIdx = rest.indexOf('?');
  let hostPort = rest;
  let queryParams = new URLSearchParams();

  if (queryIdx !== -1) {
    hostPort = rest.substring(0, queryIdx);
    queryParams = new URLSearchParams(rest.substring(queryIdx + 1));
  }

  const [host, portStr] = hostPort.split(':');
  const port = parseInt(portStr || '443', 10);

  const flag = guessFlagFromHostOrName(serverName, host);

  const server: VpnServer = {
    id: 'custom-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    name: serverName,
    flag,
    country: guessCountryFromFlag(flag),
    city: 'Encrypted Port',
    protocol: 'trojan',
    host,
    port,
    uuid: password,
    network: 'tcp',
    security: 'tls',
    sni: queryParams.get('sni') || host,
    udpSupport: true,
    ping: 55,
    pingStatus: 'untested',
    isCustom: true,
    load: 15,
    speedRating: 'ultra',
    rawUri: uri
  };

  return { success: true, server };
}

/**
 * ss://base64(method:password)@host:port#name or ss://base64(method:password@host:port)#name
 */
export function parseShadowsocksUri(uri: string): ParsedServerResult {
  const withoutPrefix = uri.substring(5);
  const hashIdx = withoutPrefix.indexOf('#');
  let mainPart = withoutPrefix;
  let name = 'Shadowsocks Fast Node';

  if (hashIdx !== -1) {
    mainPart = withoutPrefix.substring(0, hashIdx);
    name = decodeURIComponent(withoutPrefix.substring(hashIdx + 1));
  }

  let host = '127.0.0.1';
  let port = 8388;
  let cipher = 'chacha20-poly1305';

  if (mainPart.includes('@')) {
    const [encodedUserInfo, hostPort] = mainPart.split('@');
    try {
      const decodedUser = atob(encodedUserInfo);
      cipher = decodedUser.split(':')[0] || 'aes-256-gcm';
    } catch {
      // ignore
    }
    const parts = hostPort.split(':');
    host = parts[0] || '127.0.0.1';
    port = parseInt(parts[1] || '8388', 10);
  } else {
    try {
      const decoded = atob(mainPart);
      const at = decoded.indexOf('@');
      if (at !== -1) {
        cipher = decoded.substring(0, at).split(':')[0] || 'aes-256-gcm';
        const hostPort = decoded.substring(at + 1).split(':');
        host = hostPort[0] || host;
        port = parseInt(hostPort[1] || '8388', 10);
      }
    } catch {
      return { success: false, error: 'Invalid Shadowsocks base64 string' };
    }
  }

  const flag = guessFlagFromHostOrName(name, host);

  const server: VpnServer = {
    id: 'custom-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    name,
    flag,
    country: guessCountryFromFlag(flag),
    city: 'Fast Route',
    protocol: 'shadowsocks',
    host,
    port,
    encryption: cipher,
    network: 'tcp',
    security: 'none',
    udpSupport: true,
    ping: 65,
    pingStatus: 'untested',
    isCustom: true,
    load: 20,
    speedRating: 'fast',
    rawUri: uri
  };

  return { success: true, server };
}

/**
 * udp://host:port#name
 */
export function parseUdpUri(uri: string): ParsedServerResult {
  const withoutPrefix = uri.substring(6);
  const hashIdx = withoutPrefix.indexOf('#');
  let mainPart = withoutPrefix;
  let name = 'V2Ray UDP Turbo Server';

  if (hashIdx !== -1) {
    mainPart = withoutPrefix.substring(0, hashIdx);
    name = decodeURIComponent(withoutPrefix.substring(hashIdx + 1));
  }

  const [host, portStr] = mainPart.split(':');
  const port = parseInt(portStr || '51820', 10);

  if (!host || isNaN(port)) {
    return { success: false, error: 'Invalid UDP server format' };
  }

  const flag = guessFlagFromHostOrName(name, host);

  const server: VpnServer = {
    id: 'custom-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    name,
    flag,
    country: guessCountryFromFlag(flag),
    city: 'Low Latency UDP',
    protocol: 'v2ray-udp',
    host,
    port,
    encryption: 'chacha20-poly1305',
    network: 'kcp',
    security: 'tls',
    udpSupport: true,
    ping: 32,
    pingStatus: 'untested',
    isCustom: true,
    load: 12,
    speedRating: 'ultra',
    rawUri: uri
  };

  return { success: true, server };
}

/**
 * Exports a VpnServer object into a shareable URI (VLESS / VMess / Shadowsocks / Trojan / UDP)
 */
export function exportServerUri(server: VpnServer): string {
  if (server.protocol === 'vless') {
    const params = new URLSearchParams();
    if (server.security && server.security !== 'none') params.set('security', server.security);
    if (server.encryption && server.encryption !== 'none') params.set('encryption', server.encryption);
    if (server.network) params.set('type', server.network);
    if (server.sni) params.set('sni', server.sni);
    if (server.path) params.set('path', server.path);

    const query = params.toString() ? `?${params.toString()}` : '';
    return `vless://${server.uuid || '00000000-0000-0000-0000-000000000000'}@${server.host}:${server.port}${query}#${encodeURIComponent(server.name)}`;
  }

  if (server.protocol === 'vmess') {
    const payload = {
      v: '2',
      ps: server.name,
      add: server.host,
      port: server.port,
      id: server.uuid || '00000000-0000-0000-0000-000000000000',
      aid: server.alterId || 0,
      scy: server.encryption || 'auto',
      net: server.network,
      type: 'none',
      host: server.sni || '',
      path: server.path || '',
      tls: server.security === 'tls' ? 'tls' : ''
    };
    return `vmess://${btoa(JSON.stringify(payload))}`;
  }

  if (server.protocol === 'trojan') {
    const sniPart = server.sni ? `?sni=${server.sni}` : '';
    return `trojan://${server.uuid || 'password'}@${server.host}:${server.port}${sniPart}#${encodeURIComponent(server.name)}`;
  }

  if (server.protocol === 'v2ray-udp' || server.protocol === 'wireguard') {
    return `udp://${server.host}:${server.port}#${encodeURIComponent(server.name)}`;
  }

  return `ss://${btoa(`chacha20-poly1305:${server.uuid || 'secret'}`)}@${server.host}:${server.port}#${encodeURIComponent(server.name)}`;
}

/**
 * Format helper for data transferred
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0.00 MB';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let idx = 0;
  let val = bytes;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx++;
  }
  return `${val.toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`;
}

/**
 * Format helper for connection speed
 */
export function formatSpeed(kbps: number): string {
  if (kbps < 1024) {
    return `${Math.round(kbps)} KB/s`;
  }
  return `${(kbps / 1024).toFixed(1)} MB/s`;
}

/**
 * Format helper for session duration (hh:mm:ss)
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Generates an encrypted tunnel virtual IP address (e.g. 10.8.x.x)
 */
export function generateVirtualIp(seedStr: string): string {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const subnet = Math.abs(hash % 200) + 10;
  const host = Math.abs((hash >> 8) % 250) + 2;
  return `10.8.${subnet}.${host}`;
}

function guessFlagFromHostOrName(name: string, host: string): string {
  const combined = (name + ' ' + host).toLowerCase();
  if (combined.includes('jp') || combined.includes('japan') || combined.includes('tokyo')) return '🇯🇵';
  if (combined.includes('us') || combined.includes('usa') || combined.includes('america') || combined.includes('york') || combined.includes('california')) return '🇺🇸';
  if (combined.includes('sg') || combined.includes('singapore')) return '🇸🇬';
  if (combined.includes('de') || combined.includes('germany') || combined.includes('frankfurt')) return '🇩🇪';
  if (combined.includes('uk') || combined.includes('london') || combined.includes('britain')) return '🇬🇧';
  if (combined.includes('hk') || combined.includes('hong kong')) return '🇭🇰';
  if (combined.includes('kr') || combined.includes('korea') || combined.includes('seoul')) return '🇰🇷';
  if (combined.includes('nl') || combined.includes('netherlands') || combined.includes('amsterdam')) return '🇳🇱';
  if (combined.includes('in') || combined.includes('india') || combined.includes('mumbai')) return '🇮🇳';
  if (combined.includes('ca') || combined.includes('canada')) return '🇨🇦';
  if (combined.includes('fr') || combined.includes('france') || combined.includes('paris')) return '🇫🇷';
  return '⚡';
}

function guessCountryFromFlag(flag: string): string {
  const map: Record<string, string> = {
    '🇯🇵': 'Japan',
    '🇺🇸': 'United States',
    '🇸🇬': 'Singapore',
    '🇩🇪': 'Germany',
    '🇬🇧': 'United Kingdom',
    '🇭🇰': 'Hong Kong',
    '🇰🇷': 'South Korea',
    '🇳🇱': 'Netherlands',
    '🇮🇳': 'India',
    '🇨🇦': 'Canada',
    '🇫🇷': 'France',
    '⚡': 'Fast Cloud'
  };
  return map[flag] || 'Global Fast';
}
