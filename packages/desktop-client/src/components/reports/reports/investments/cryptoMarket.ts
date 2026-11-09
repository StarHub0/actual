import { useQuery } from '@tanstack/react-query';

export type PricePoint = { time: number; price: number };

export type CryptoQuote = { price: number; change24h: number | null };

export const historyRanges = [
  { days: 7, label: '7D' },
  { days: 30, label: '30D' },
  { days: 90, label: '90D' },
  { days: 365, label: '1Y' },
] as const;

export type CryptoAsset = 'bitcoin' | 'litecoin';

export const cryptoAssets = {
  bitcoin: {
    symbol: 'BTC',
    name: 'Bitcoin',
    color: '#f7931a',
    coinbasePair: 'BTC-BRL',
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
    accountPattern: /litecoin|ltc/i,
    amountPref: 'dashboard-ltc-amount',
    costPref: 'dashboard-ltc-cost',
    accountPref: 'dashboard-ltc-account',
  },
} as const;

async function fetchQuote(asset: CryptoAsset): Promise<CryptoQuote> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${asset}&vs_currencies=brl&include_24hr_change=true`,
    );
    const body = await response.json();
    return {
      price: body[asset].brl,
      change24h: body[asset].brl_24h_change ?? null,
    };
  } catch {
    const response = await fetch(
      `https://api.coinbase.com/v2/prices/${cryptoAssets[asset].coinbasePair}/spot`,
    );
    const body = await response.json();
    return { price: Number(body.data.amount), change24h: null };
  }
}

async function fetchHistory(
  asset: CryptoAsset,
  days: number,
): Promise<PricePoint[]> {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/${asset}/market_chart?vs_currency=brl&days=${days}`,
  );
  const body = await response.json();
  return (body.prices as [number, number][]).map(([time, price]) => ({
    time,
    price,
  }));
}

export function useCryptoQuote(asset: CryptoAsset) {
  return useQuery({
    queryKey: ['dashboard', 'quote', asset],
    queryFn: () => fetchQuote(asset),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useCryptoHistory(asset: CryptoAsset, days: number) {
  return useQuery({
    queryKey: ['dashboard', 'history', asset, days],
    queryFn: () => fetchHistory(asset, days),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
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
