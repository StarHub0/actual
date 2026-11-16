import { useQuery } from '@tanstack/react-query';

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type CryptoQuote = {
  price: number;
  change24h: number | null;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
};

export const historyRanges = [
  { key: '1h', label: '1H', interval: '1m', limit: 60 },
  { key: '24h', label: '24H', interval: '15m', limit: 96 },
  { key: '7d', label: '7D', interval: '1h', limit: 168 },
  { key: '30d', label: '30D', interval: '4h', limit: 180 },
  { key: '90d', label: '90D', interval: '1d', limit: 90 },
  { key: '1y', label: '1Y', interval: '1d', limit: 365 },
] as const;

export type HistoryRange = (typeof historyRanges)[number];

export type CryptoAsset = 'bitcoin' | 'litecoin';

export const cryptoAssets = {
  bitcoin: {
    symbol: 'BTC',
    name: 'Bitcoin',
    color: '#f7931a',
    coinbasePair: 'BTC-BRL',
    binancePair: 'BTCBRL',
    accountPattern: /bitcoin|btc/i,
    amountPref: 'dashboard-btc-amount',
    costPref: 'dashboard-btc-cost',
    accountPref: 'dashboard-btc-account',
  },
  litecoin: {
    symbol: 'LTC',
    name: 'Litecoin',
    color: '#6f8fd8',
    coinbasePair: 'LTC-BRL',
    binancePair: 'LTCBRL',
    accountPattern: /litecoin|ltc/i,
    amountPref: 'dashboard-ltc-amount',
    costPref: 'dashboard-ltc-cost',
    accountPref: 'dashboard-ltc-account',
  },
} as const;

async function fetchQuote(asset: CryptoAsset): Promise<CryptoQuote> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${cryptoAssets[asset].binancePair}`,
    );
    const body = await response.json();
    return {
      price: Number(body.lastPrice),
      change24h: Number(body.priceChangePercent),
      high24h: Number(body.highPrice),
      low24h: Number(body.lowPrice),
      volume24h: Number(body.quoteVolume),
    };
  } catch {
    const response = await fetch(
      `https://api.coinbase.com/v2/prices/${cryptoAssets[asset].coinbasePair}/spot`,
    );
    const body = await response.json();
    return {
      price: Number(body.data.amount),
      change24h: null,
      high24h: null,
      low24h: null,
      volume24h: null,
    };
  }
}

async function fetchCandles(
  asset: CryptoAsset,
  range: HistoryRange,
): Promise<Candle[]> {
  const response = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${cryptoAssets[asset].binancePair}&interval=${range.interval}&limit=${range.limit}`,
  );
  const rows = (await response.json()) as string[][];
  return rows.map(row => ({
    time: Number(row[0]),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5]),
  }));
}

export function useCryptoQuote(asset: CryptoAsset) {
  return useQuery({
    queryKey: ['dashboard', 'quote', asset],
    queryFn: () => fetchQuote(asset),
    refetchInterval: 15_000,
    staleTime: 10_000,
    retry: 2,
  });
}

export function useCryptoCandles(asset: CryptoAsset, range: HistoryRange) {
  return useQuery({
    queryKey: ['dashboard', 'candles', asset, range.key],
    queryFn: () => fetchCandles(asset, range),
    staleTime: 15_000,
    refetchInterval:
      range.key === '1h' || range.key === '24h' ? 20_000 : 60_000,
    retry: 2,
  });
}

export const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function parseDecimal(text: string): number | null {
  const trimmed = text.trim();
  const cleaned = trimmed.includes(',')
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed;
  if (cleaned === '') return null;
  const value = Number(cleaned);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function toCents(value: number) {
  return Math.round(value * 100);
}

async function fetchCdi(): Promise<number> {
  const response = await fetch(
    'https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json',
  );
  const body = await response.json();
  return Number(body[0].valor);
}

export function useCdiRate() {
  return useQuery({
    queryKey: ['dashboard', 'cdi'],
    queryFn: fetchCdi,
    staleTime: 60 * 60_000,
    retry: 2,
  });
}
