"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sshTunnel = sshTunnel;
const picocolors_1 = __importDefault(require("picocolors"));
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const node_child_process_1 = require("node:child_process");
const node_fs_1 = require("node:fs");
const node_os_2 = __importDefault(require("node:os"));
const tmpFolderPath = (0, node_path_1.join)((0, node_os_1.tmpdir)(), 'vite-plugin-ssh-tunnel');
const socketPath = (0, node_path_1.join)(tmpFolderPath, 'socket');
let isTunnelActive = false;
try {
    (0, node_fs_1.mkdirSync)(tmpFolderPath, { recursive: true });
}
catch (e) {
    console.error(picocolors_1.default.red(`[ssh-tunnel] Failed to create tmp directory: ${tmpFolderPath}`), e);
}
const closeTunnel = (logger) => {
    const log = (color, message) => {
        const formatter = picocolors_1.default[color];
        const msg = picocolors_1.default.magenta('  ➜') + picocolors_1.default.magenta('  tunnel: ') + formatter(message);
        if (logger) {
            logger.info(msg);
        }
        else {
            console.log(msg.replace(/(\x1b\[\d+m)/g, ''));
        }
    };
    if ((0, node_fs_1.existsSync)(socketPath)) {
        log('yellow', `Closing tunnel via socket: ${socketPath}`);
        try {
            (0, node_child_process_1.execSync)(`ssh -S "${socketPath}" -O exit dummy.com`);
            log('red', 'Tunnel closed.');
        }
        catch (error) {
            log('yellow', `Could not close tunnel via socket (maybe already closed?): ${error.message}`);
        }
        finally {
            isTunnelActive = false;
        }
    }
    else {
        isTunnelActive = false;
    }
};
function sshTunnel(config) {
    let serverInstance = null;
    let exitHandlersAttached = false;
    return {
        name: 'vite-plugin-ssh-tunnel',
        configureServer(server) {
            serverInstance = server;
            const { httpServer } = server;
            const logger = server.config.logger;
            const log = (color, message) => {
                const formatter = picocolors_1.default[color];
                logger.info(picocolors_1.default.magenta('  ➜') + picocolors_1.default.magenta('  tunnel: ') + formatter(message));
            };
            if (!config.host || !config.username || !config.privateKey) {
                log('red', picocolors_1.default.bold('Missing required configuration fields (host, username, privateKey). Tunnel disabled.'));
                return;
            }
            httpServer?.on('listening', () => {
                const address = httpServer.address();
                if (address === null || typeof address === 'string') {
                    log('red', 'Could not get server address. Tunnel disabled.');
                    return;
                }
                const localPort = address.port;
                const remotePort = config.remotePort ?? 3000;
                let privateKeyPath = config.privateKey;
                try {
                    if (privateKeyPath.startsWith('~' + (0, node_path_1.join)('/')) || privateKeyPath === '~') {
                        privateKeyPath = privateKeyPath.replace('~', node_os_2.default.homedir());
                    }
                }
                catch (e) {
                    log('red', `Error resolving home directory for private key path: ${config.privateKey}`);
                    return;
                }
                if (!(0, node_fs_1.existsSync)(privateKeyPath)) {
                    log('red', `Private key file not found: ${picocolors_1.default.yellow(privateKeyPath)} (resolved from ${picocolors_1.default.cyan(config.privateKey)}). Tunnel disabled.`);
                    return;
                }
                if (isTunnelActive) {
                    log('yellow', 'Closing existing tunnel before creating a new one...');
                    closeTunnel(logger);
                }
                else if ((0, node_fs_1.existsSync)(socketPath)) {
                    log('yellow', 'Found stale socket file, attempting cleanup...');
                    closeTunnel(logger);
                }
                log('cyan', `Attempting to create tunnel: remote port ${picocolors_1.default.bold(String(remotePort))} -> localhost:${picocolors_1.default.bold(String(localPort))}`);
                const command = `ssh -i "${privateKeyPath}" \
                    -o ExitOnForwardFailure=yes \
                    -o ServerAliveInterval=30 \
                    -o ServerAliveCountMax=3 \
                    -f -N -M -S "${socketPath}" \
                    -R 0.0.0.0:${remotePort}:localhost:${localPort} \
                    ${config.username}@${config.host}`;
                try {
                    log('yellow', 'Executing SSH command...');
                    const execOptions = { encoding: 'utf8', stdio: 'pipe' };
                    (0, node_child_process_1.execSync)(command, execOptions);
                    isTunnelActive = true;
                    log('green', `Tunnel established successfully!`);
                    log('cyan', ` Remote port: ${picocolors_1.default.bold(String(remotePort))}`);
                    if (config.proxyUrl) {
                        log('cyan', ` Access via: ${picocolors_1.default.underline(picocolors_1.default.blue(config.proxyUrl))}`);
                    }
                    else {
                        log('cyan', ` Access via: ${picocolors_1.default.underline(picocolors_1.default.blue(`http://${config.host}:${remotePort}`))} (if accessible directly and GatewayPorts=yes on server)`);
                    }
                }
                catch (error) {
                    isTunnelActive = false;
                    log('red', picocolors_1.default.bold('Failed to create SSH tunnel.'));
                    if (error.message) {
                        log('red', `Error: ${error.message.split('\n')[0]}`);
                    }
                    if (error.stderr) {
                        log('red', picocolors_1.default.gray(`SSH stderr:\n${error.stderr.toString().trim()}`));
                    }
                    if (error.stdout) {
                        log('red', picocolors_1.default.gray(`SSH stdout:\n${error.stdout.toString().trim()}`));
                    }
                    closeTunnel(logger);
                }
            });
            if (!exitHandlersAttached) {
                const gracefulShutdown = () => {
                    if (isTunnelActive) {
                        const logExit = (color, message) => {
                            const formatter = picocolors_1.default[color];
                            console.log(formatter(message).replace(/(\x1b\[\d+m)/g, ''));
                        };
                        logExit('yellow', '\n[ssh-tunnel] Process exiting, closing tunnel...');
                        closeTunnel();
                    }
                };
                process.on('exit', gracefulShutdown);
                process.on('SIGINT', () => { gracefulShutdown(); process.exit(0); });
                process.on('SIGTERM', () => { gracefulShutdown(); process.exit(0); });
                exitHandlersAttached = true;
                log('gray', 'Attached process exit handlers for tunnel cleanup.');
            }
        }
    };
}
