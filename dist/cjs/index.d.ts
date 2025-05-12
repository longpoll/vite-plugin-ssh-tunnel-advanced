import type { Plugin } from 'vite';
export interface SshTunnelConfig {
    host: string;
    username: string;
    privateKey: string;
    remotePort?: number;
    proxyUrl?: string;
}
export declare function sshTunnel(config: SshTunnelConfig): Plugin;
