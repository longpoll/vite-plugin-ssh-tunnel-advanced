/**
 * Configuration for the SSH tunnel plugin.
 */
export interface ITunnelConfig {
    /** SSH server host */
    host: string;
    /** SSH server port (default: 22) */
    port?: number;
    /** Username for the SSH connection */
    username: string;
    /** Password for the SSH connection (used if privateKey is not specified) */
    password?: string;
    /** Path to the SSH private key (e.g., '~/.ssh/id_rsa') */
    privateKey?: string;
    /** Local port to forward (e.g., the Vite dev server port: 5173) */
    localPort: number;
    /** Target port on the remote host or its network (e.g., 9999) */
    remotePort: number;
    /**
     * Target host where traffic from remotePort will be directed.
     * Defaults to the same host as the SSH connection (config.host).
     * Specify a different host if the service runs not on the SSH server itself,
     * but on another machine accessible from the SSH server's network (e.g., 'localhost' or '192.168.1.100').
     */
    remoteHost?: string;
    /** Enable verbose logging? (default: false) */
    debug?: boolean;
}
