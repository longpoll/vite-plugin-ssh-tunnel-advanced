# Vite Plugin SSH Tunnel Advanced

[![npm version](https://badge.fury.io/js/vite-plugin-ssh-tunnel-advanced.svg)](https://badge.fury.io/js/vite-plugin-ssh-tunnel-advanced)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/longpoll/vite-plugin-ssh-tunnel-advanced/blob/main/LICENSE) <!-- Assumes LICENSE file is in the root -->

A Vite plugin to easily create an SSH tunnel from your local development server to a remote server. This allows you to expose your local Vite dev server (e.g., `localhost:5173`) on a port on a remote machine, making it accessible via the remote machine's IP or a domain pointing to it.

This plugin uses the system's `ssh` command-line utility to establish and manage the tunnel.

## Features

*   Sets up an SSH reverse tunnel (`ssh -R`).
*   Uses a private key for authentication.
*   Automatically manages the tunnel lifecycle with the Vite dev server.
*   Gracefully closes the tunnel on server shutdown or process exit.
*   Configurable remote port.
*   Option to display a custom proxy URL in logs.
*   Colored logging for better readability.

## Prerequisites

*   **SSH Client:** An SSH client must be installed and available in your system's `PATH`.
    *   **Linux/macOS:** Usually available by default.
    *   **Windows:** OpenSSH client is often included in modern Windows 10/11 versions or can be installed with Git for Windows.
*   **SSH Server Configuration:**
    *   The remote SSH server must be configured to allow TCP forwarding. Ensure `AllowTcpForwarding yes` (or `AllowTcpForwarding all`) is set in your server's `/etc/ssh/sshd_config`.
    *   For the remote port to be accessible from external networks (not just `localhost` on the remote server), `GatewayPorts yes` or `GatewayPorts clientspecified` must be set in `/etc/ssh/sshd_config` on the remote server. Restart the `sshd` service after changes.

## Installation

```bash
npm install vite-plugin-ssh-tunnel-advanced --save-dev
# or
yarn add vite-plugin-ssh-tunnel-advanced --dev
# or
pnpm add vite-plugin-ssh-tunnel-advanced --save-dev
```

You might also need `picocolors` if not already present (though often a transitive dependency):
```bash
npm install picocolors
```

## Usage

Import and add the plugin to your `vite.config.js` or `vite.config.ts`:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Example, use your framework plugin
import { sshTunnel } from 'vite-plugin-ssh-tunnel-advanced';

export default defineConfig({
  plugins: [
    react(),
    sshTunnel({
      host: 'your-remote-server.com',    // SSH server address
      username: 'ssh_user',               // SSH username
      privateKey: '~/.ssh/id_rsa_remote', // Path to your SSH private key
      remotePort: 9000,                   // Port to listen on the remote server
      // Optional: If you access the tunnel via a custom domain/proxy
      // proxyUrl: 'https://dev.your-app.com'
    }),
  ],
});
```

When you run your Vite dev server (`npm run dev` or `yarn dev`), the plugin will:
1. Wait for the Vite server to start listening.
2. Attempt to establish an SSH tunnel to your remote server.
3. Traffic to `your-remote-server.com:9000` (or your `proxyUrl`) will be forwarded to your local Vite dev server.

## Configuration

The `sshTunnel` plugin accepts a configuration object with the following properties:

| Option       | Type     | Required | Default | Description                                                                                                                               |
|--------------|----------|----------|---------|-------------------------------------------------------------------------------------------------------------------------------------------|
| `host`       | `string` | Yes      |         | SSH server host address (e.g., 'example.com', '192.168.1.100').                                                                        |
| `username`   | `string` | Yes      |         | Username for the SSH connection (e.g., 'root', 'deploy_user').                                                                          |
| `privateKey` | `string` | Yes      |         | Path to the SSH private key file. Can use `~` for home directory (e.g., `'~/.ssh/id_rsa'`).                                             |
| `remotePort` | `number` | No       | `3000`  | Remote port on the SSH server to listen on. Traffic to this port will be forwarded to the local Vite server.                             |
| `proxyUrl`   | `string` | No       |         | Optional URL to display in logs after tunnel setup. Useful if the remote server is accessed via a domain/proxy (e.g., 'https://dev.example.com'). |

## How it Works

The plugin executes a command similar to this:
```bash
ssh -i "<privateKeyPath>" \
    -o ExitOnForwardFailure=yes \
    -o ServerAliveInterval=30 \
    -o ServerAliveCountMax=3 \
    -f -N -M -S "<socketPath>" \
    -R 0.0.0.0:<remotePort>:localhost:<localVitePort> \
    <username>@<host>
```
* `-R 0.0.0.0:<remotePort>:localhost:<localVitePort>`: Sets up remote port forwarding.
* `-M -S <socketPath>`: Uses SSH ControlMaster for managing the connection via a socket file, allowing for clean termination.
* `-f -N`: Runs SSH in the background and prevents execution of remote commands.

## Troubleshooting

*   **"Private key file not found"**:
    *   Ensure the path provided in `privateKey` is correct.
    *   The plugin resolves `~` to your home directory.
    *   Check file permissions.
*   **"Failed to create SSH tunnel" / SSH stderr output**:
    *   **Permission denied (publickey)**:
        *   Verify the private key is authorized on the remote server for the specified user (i.e., its corresponding public key is in `~/.ssh/authorized_keys` on the server).
        *   Check permissions of your `~/.ssh` directory (should be `700`) and `~/.ssh/authorized_keys` (should be `600` or `644`) on the server.
    *   **Connection refused/timeout**:
        *   Ensure the `host` is correct and the SSH server is running and accessible.
        *   Check firewalls (both local and on the remote server).
    *   **"Warning: remote port forwarding failed for listen port <remotePort>"**:
        *   The `remotePort` might already be in use on the remote server. Try a different port.
        *   `AllowTcpForwarding` might be disabled on the server.
*   **Tunnel connects, but `proxyUrl` or `http://<host>:<remotePort>` doesn't work**:
    *   Ensure `GatewayPorts yes` (or `clientspecified`) is set in the remote server's `sshd_config` if you want to access the `remotePort` from outside the remote server's `localhost`.
    *   Check firewalls on the remote server that might be blocking incoming connections to `remotePort`.
    *   If using a domain/proxy (like Nginx), ensure it's correctly configured to forward traffic to `localhost:<remotePort>` on the remote server.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check [issues page](https://github.com/longpoll/vite-plugin-ssh-tunnel-advanced/issues).

## License

This project is [MIT](./LICENSE) licensed.
