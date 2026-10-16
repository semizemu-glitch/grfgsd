import { VpnServer, VpnSettings } from '../types/vpn';
import { DEFAULT_SERVERS } from '../data/defaultServers';

const CUSTOM_SERVERS_KEY = 'apex_vpn_custom_servers_v1';
const SELECTED_SERVER_KEY = 'apex_vpn_selected_server_id_v1';
const SETTINGS_KEY = 'apex_vpn_settings_v1';

export const DEFAULT_SETTINGS: VpnSettings = {
  killSwitch: true,
  dnsProtection: 'cloudflare',
  udpAcceleration: true,
  obfuscation: true,
  autoReconnect: true,
  preferredCipher: 'chacha20-poly1305',
  splitTunneling: false,
  bypassedApps: ['Banking App', 'Local Delivery', 'Google Maps']
};

export function loadSavedServers(): VpnServer[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SERVERS_KEY);
    if (!raw) return DEFAULT_SERVERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge with default servers to avoid duplicates
      const customIds = new Set(parsed.map((s: VpnServer) => s.id));
      const remainingDefaults = DEFAULT_SERVERS.filter(s => !customIds.has(s.id));
      return [...parsed, ...remainingDefaults];
    }
  } catch (e) {
    console.error('Failed to load servers from storage:', e);
  }
  return DEFAULT_SERVERS;
}

export function saveAllServers(servers: VpnServer[]): void {
  try {
    localStorage.setItem(CUSTOM_SERVERS_KEY, JSON.stringify(servers));
  } catch (e) {
    console.error('Failed to save servers:', e);
  }
}

export function loadSelectedServerId(): string {
  try {
    return localStorage.getItem(SELECTED_SERVER_KEY) || DEFAULT_SERVERS[0].id;
  } catch {
    return DEFAULT_SERVERS[0].id;
  }
}

export function saveSelectedServerId(id: string): void {
  try {
    localStorage.setItem(SELECTED_SERVER_KEY, id);
  } catch {
    // ignore
  }
}

export function loadSettings(): VpnSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: VpnSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}
