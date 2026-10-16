import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  parseVpnUri, 
  parseBatchUris,
  parseVlessUri, 
  parseVmessUri, 
  parseUdpUri, 
  exportServerUri, 
  formatBytes, 
  formatSpeed, 
  formatDuration,
  generateVirtualIp 
} from './vpnProtocol.ts';
import type { VpnServer } from '../types/vpn.ts';

test('parseVlessUri correctly parses standard reality vless link', () => {
  const vless = 'vless://a1b2c3d4-e5f6-7890-abcd-ef1234567890@tokyo01.vless-turbo.net:443?security=reality&sni=yahoo.co.jp&type=tcp#Japan%20Tokyo%20Reality';
  const result = parseVlessUri(vless);

  assert.equal(result.success, true);
  assert.ok(result.server);
  assert.equal(result.server.name, 'Japan Tokyo Reality');
  assert.equal(result.server.host, 'tokyo01.vless-turbo.net');
  assert.equal(result.server.port, 443);
  assert.equal(result.server.uuid, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  assert.equal(result.server.security, 'reality');
  assert.equal(result.server.network, 'tcp');
  assert.equal(result.server.sni, 'yahoo.co.jp');
  assert.equal(result.server.udpSupport, true);
});

test('parseVmessUri correctly parses base64 vmess link', () => {
  const payload = {
    v: '2',
    ps: 'Singapore VMess HighSpeed',
    add: 'sg.vmess-stream.io',
    port: 8443,
    id: 'f9e8d7c6-b5a4-3210-9876-543210fedcba',
    aid: 0,
    net: 'ws',
    tls: 'tls',
    path: '/vmess-ws'
  };
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const uri = `vmess://${b64}`;

  const result = parseVmessUri(uri);
  assert.equal(result.success, true);
  assert.ok(result.server);
  assert.equal(result.server.name, 'Singapore VMess HighSpeed');
  assert.equal(result.server.host, 'sg.vmess-stream.io');
  assert.equal(result.server.port, 8443);
  assert.equal(result.server.network, 'ws');
  assert.equal(result.server.security, 'tls');
  assert.equal(result.server.path, '/vmess-ws');
});

test('parseUdpUri handles UDP V2Ray server links', () => {
  const udpUri = 'udp://udp-speed.fastvpn.net:51820#Tokyo%20UDP%20Turbo';
  const result = parseUdpUri(udpUri);
  assert.equal(result.success, true);
  assert.ok(result.server);
  assert.equal(result.server.name, 'Tokyo UDP Turbo');
  assert.equal(result.server.host, 'udp-speed.fastvpn.net');
  assert.equal(result.server.port, 51820);
  assert.equal(result.server.protocol, 'v2ray-udp');
  assert.equal(result.server.network, 'kcp');
});

test('exportServerUri converts server object to valid uri string', () => {
  const sampleServer: VpnServer = {
    id: 'test-1',
    name: 'Frankfurt VLESS',
    flag: '🇩🇪',
    country: 'Germany',
    city: 'Frankfurt',
    protocol: 'vless',
    host: 'de.vless.net',
    port: 443,
    uuid: '12345678-1234-1234-1234-123456789abc',
    network: 'tcp',
    security: 'reality',
    sni: 'apple.com',
    udpSupport: true,
    ping: 40,
    pingStatus: 'tested',
    load: 20,
    speedRating: 'ultra'
  };

  const uri = exportServerUri(sampleServer);
  assert.ok(uri.startsWith('vless://12345678-1234-1234-1234-123456789abc@de.vless.net:443'));
  assert.ok(uri.includes('security=reality'));
  assert.ok(uri.includes('sni=apple.com'));
});

test('formatting utilities work with zero and positive values', () => {
  assert.equal(formatBytes(0), '0.00 MB');
  assert.equal(formatBytes(1048576), '1.00 MB');
  assert.equal(formatBytes(1073741824 * 2.5), '2.50 GB');

  assert.equal(formatSpeed(450), '450 KB/s');
  assert.equal(formatSpeed(2048), '2.0 MB/s');

  assert.equal(formatDuration(45), '00:45');
  assert.equal(formatDuration(125), '02:05');
  assert.equal(formatDuration(3665), '01:01:05');

  const ip = generateVirtualIp('node-tokyo-1');
  assert.ok(ip.startsWith('10.8.'));
});

test('parseVpnUri handles unsupported strings gracefully', () => {
  const res = parseVpnUri('ftp://unknown');
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('Unsupported protocol'));
});

test('parseBatchUris correctly parses multi-line and subscription links', () => {
  const batch = `
    vless://a1b2c3d4-e5f6-7890-abcd-ef1234567890@tokyo01.vless-turbo.net:443?security=reality&sni=yahoo.co.jp&type=tcp#Node1
    udp://udp-speed.fastvpn.net:51820#Node2
  `;
  const result = parseBatchUris(batch);
  assert.equal(result.servers.length, 2);
  assert.equal(result.servers[0].name, 'Node1');
  assert.equal(result.servers[1].name, 'Node2');
});

