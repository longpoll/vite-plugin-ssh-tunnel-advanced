// --- Configuration Interface ---
export interface SshTunnelConfig {
  /**
   * SSH server host address.
   * @example 'example.com'
   * @example '192.168.1.100'
   */
  host: string;

  /**
   * Username for the SSH connection.
   * @example 'root'
   * @example 'deploy_user'
   */
  username: string;

  /**
   * Path to the SSH private key file.
   * Can use '~' for the home directory (e.g., '~/.ssh/id_rsa').
   * This field is required.
   * @example '~/.ssh/my_server_key'
   * @example '/path/to/your/private.key'
   */
  privateKey: string;

  /**
   * Remote port on the SSH server to listen on.
   * Traffic to this port on the remote server will be forwarded to the local Vite development server.
   * @default 3000
   * @example 9001
   */
  remotePort?: number;

  /**
   * Optional URL to display in the console logs after the tunnel is successfully established.
   * This is useful if the remote server is accessed via a domain name or through a reverse proxy.
   * If not provided, a URL using `config.host` and `config.remotePort` will be suggested.
   * @example 'https://dev.example.com'
   */
  proxyUrl?: string;
}

export type PicoColorKey =
  | 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray'
  | 'bgBlack' | 'bgRed' | 'bgGreen' | 'bgYellow' | 'bgBlue' | 'bgMagenta' | 'bgCyan' | 'bgWhite'
  | 'bold' | 'dim' | 'italic' | 'underline' | 'inverse' | 'hidden' | 'strikethrough';

export type PicoFormatter = (str: string | number) => string;
