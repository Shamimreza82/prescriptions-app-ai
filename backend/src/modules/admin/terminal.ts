import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import url from 'url';
import jwt from 'jsonwebtoken';
import path from 'path';
import os from 'os';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

interface JwtPayload {
  userId: string;
  role: string;
}

const projectRoot = path.resolve(__dirname, '../../../..');

export const setupTerminalWs = (server: HttpServer) => {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const parsed = url.parse(request.url || '', true);
    if (parsed.pathname !== '/api/admin/terminal') {
      socket.destroy();
      return;
    }

    const token = parsed.query.token as string;
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    try {
      const decoded = jwt.verify(token, env.jwt.secret) as JwtPayload;
      if (decoded.role !== 'SUPER_ADMIN') {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }
      (request as any).user = decoded;
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    let ptyProcess: any = null;

    try {
      const pty = require('node-pty');
      const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
      const shellArgs: string[] = [];

      ptyProcess = pty.spawn(shell, shellArgs, {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: projectRoot,
        env: { ...process.env, TERM: 'xterm-256color' } as any,
      });

      ptyProcess.onData((data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'data', data }));
        }
      });

      ptyProcess.onExit(({ exitCode, signal }: { exitCode: number; signal?: number }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'exit', code: exitCode, signal }));
        }
      });

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'input' && ptyProcess) {
            ptyProcess.write(msg.data);
          } else if (msg.type === 'resize' && ptyProcess) {
            ptyProcess.resize(msg.cols, msg.rows);
          }
        } catch {
          // ignore bad messages
        }
      });

      ws.on('close', () => {
        if (ptyProcess) ptyProcess.kill();
      });

      ws.on('error', () => {
        if (ptyProcess) ptyProcess.kill();
      });
    } catch (err) {
      logger.error('Failed to create PTY', { err });
      ws.send(JSON.stringify({ type: 'error', data: 'Failed to start terminal. Is node-pty installed?' }));
      ws.close();
    }
  });
};
