import { useSyncExternalStore } from 'react';

import { cryptoAssets } from './cryptoMarket';
import type { CryptoAsset, CryptoQuote } from './cryptoMarket';

const assets = Object.keys(cryptoAssets) as CryptoAsset[];
const listeners = new Set<() => void>();
let snapshot: Partial<Record<CryptoAsset, CryptoQuote>> = {};
let socket: WebSocket | null = null;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let attempts = 0;

function emit() {
  listeners.forEach(listener => listener());
}

function assetForSymbol(symbol: string) {
  return assets.find(asset => cryptoAssets[asset].binancePair === symbol);
}

function connect() {
  if (socket || listeners.size === 0 || document.hidden) return;
  const streams = assets
    .map(asset => `${cryptoAssets[asset].binancePair.toLowerCase()}@miniTicker`)
    .join('/');
  const ws = new WebSocket(
    `wss://stream.binance.com:9443/stream?streams=${streams}`,
  );
  socket = ws;
  ws.onopen = () => {
    attempts = 0;
  };
  ws.onmessage = event => {
    const { data } = JSON.parse(event.data as string);
    const asset = assetForSymbol(data.s);
    if (!asset) return;
    const last = Number(data.c);
    const open = Number(data.o);
    snapshot = {
      ...snapshot,
      [asset]: {
        price: last,
        change24h: open > 0 ? ((last - open) / open) * 100 : null,
        high24h: Number(data.h),
        low24h: Number(data.l),
        volume24h: Number(data.q),
      },
    };
    emit();
  };
  ws.onclose = () => {
    if (socket === ws) socket = null;
    if (listeners.size > 0 && !document.hidden) {
      retryTimer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** attempts));
      attempts += 1;
    }
  };
}

function disconnect() {
  clearTimeout(retryTimer);
  socket?.close();
  socket = null;
}

function onVisibility() {
  if (document.hidden) disconnect();
  else connect();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    document.addEventListener('visibilitychange', onVisibility);
    connect();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      document.removeEventListener('visibilitychange', onVisibility);
      disconnect();
    }
  };
}

export function useLiveQuote(asset: CryptoAsset) {
  return useSyncExternalStore(subscribe, () => snapshot[asset] ?? null);
}
