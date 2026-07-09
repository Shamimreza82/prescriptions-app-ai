'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { getUser } from '@/lib/utils';

const MAX_RETRIES = 5;
const RECONNECT_DELAY = 2000;

export default function InlineTerminal({ fullHeight }: { fullHeight?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = getUser();
    setIsAdmin(user?.role === 'SUPER_ADMIN');
  }, []);

  if (!mounted || !isAdmin) return null;

  return <TerminalShell fullHeight={fullHeight} />;
}

function TerminalShell({ fullHeight }: { fullHeight?: boolean }) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const cleanupRef = useRef(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [maximized, setMaximized] = useState(false);

  const connectWs = () => {
    if (cleanupRef.current) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setStatus('connecting');
    const host = window.location.hostname;
    const ws = new WebSocket(`ws://${host}:5000/api/admin/terminal?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (cleanupRef.current) { ws.close(); return; }
      retryCountRef.current = 0;
      setStatus('connected');
      if (xtermRef.current) xtermRef.current.focus();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'data' && xtermRef.current) {
          xtermRef.current.write(msg.data);
        } else if (msg.type === 'exit') {
          if (xtermRef.current) {
            xtermRef.current.write(`\r\n\x1b[31m[Process exited with code ${msg.code}]\x1b[0m\r\n`);
          }
          setStatus('disconnected');
        } else if (msg.type === 'error') {
          if (xtermRef.current) xtermRef.current.write(`\r\n\x1b[31m${msg.data}\x1b[0m\r\n`);
        }
      } catch {}
    };

    ws.onclose = () => {
      setStatus('disconnected');
      if (cleanupRef.current) return;
      retryCountRef.current++;
      if (retryCountRef.current < MAX_RETRIES) {
        setTimeout(() => connectWs(), RECONNECT_DELAY);
      }
    };

    ws.onerror = () => ws.close();
  };

  useEffect(() => {
    cleanupRef.current = false;
    let disposed = false;

    const init = async () => {
      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
      await import('@xterm/xterm/css/xterm.css');

      if (disposed) return;

      const term = new Terminal({
        cursorBlink: true,
        cursorStyle: 'block',
        scrollback: 10000,
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, monospace",
        theme: {
          background: '#0d1117',
          foreground: '#c9d1d9',
          cursor: '#c9d1d9',
          selectionBackground: '#3b5998',
          black: '#484f58', red: '#ff7b72', green: '#3fb950', yellow: '#d29922',
          blue: '#58a6ff', magenta: '#bc8cff', cyan: '#39c5cf', white: '#b1bac4',
        },
        allowTransparency: true,
        cols: 80,
        rows: 20,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      fitAddonRef.current = fitAddon;

      term.onData((data: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'input', data }));
        }
      });

      term.onResize(({ cols, rows }) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }));
        }
      });

      if (terminalRef.current) term.open(terminalRef.current);
      xtermRef.current = term;
      term.write('\x1b[36mVPS Terminal\x1b[0m  —  \x1b[90mproject root: ~/pres-manage-app\x1b[0m\r\n\r\n');

      setTimeout(() => {
        if (fitAddonRef.current) fitAddonRef.current.fit();
        connectWs();
      }, 100);
    };

    init();

    return () => {
      disposed = true;
      cleanupRef.current = true;
      if (wsRef.current) wsRef.current.close();
      if (xtermRef.current) xtermRef.current.dispose();
    };
  }, []);

  useEffect(() => {
    if (maximized && fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current.fit(), 50);
    }
  }, [maximized]);

  return (
    <div className={`premium-card-static ${fullHeight ? 'flex flex-col h-full' : ''}`}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800/50">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <Terminal className="h-4 w-4" />
          <span>VPS Terminal</span>
          <span className={`inline-block w-2 h-2 rounded-full ml-1 ${
            status === 'connected' ? 'bg-green-500' :
            status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
          }`} />
          <span className="text-xs text-muted-foreground font-normal">
            {status === 'connected' ? 'connected' :
             status === 'connecting' ? `connecting${retryCountRef.current > 0 ? ` (retry ${retryCountRef.current}/${MAX_RETRIES})` : ''}` :
             'disconnected'}
          </span>
        </div>
        <button
          onClick={() => setMaximized(!maximized)}
          className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {maximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div ref={terminalRef} className={`w-full transition-all ${fullHeight ? 'min-h-[400px] flex-1' : maximized ? 'h-[500px]' : 'h-[320px]'}`} />
      {status === 'connecting' && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800/50">
          <Loader2 className="h-3 w-3 animate-spin" />
          Connecting{retryCountRef.current > 0 ? ` (attempt ${retryCountRef.current + 1}/${MAX_RETRIES})` : '...'}
        </div>
      )}
    </div>
  );
}
