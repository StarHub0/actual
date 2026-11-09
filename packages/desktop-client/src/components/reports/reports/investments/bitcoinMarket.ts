import { useQuery } from '@tanstack/react-query';

export type PricePoint = { time: number; price: number };

export type BitcoinQuote = { price: number; change24h: number | null };

export const historyRanges = [
  { days: 7, label: '7D' },
  { days: 30, label: '30D' },
  { days: 90, label: '90D' },
  { days: 365, label: '1Y' },
] as const;

async function fetchQuote(): Promise<BitcoinQuote> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl&include_24hr_change=true',
    );
    const body = await response.json();
    return {
      price: body.bitcoin.brl,
      change24h: body.bitcoin.brl_24h_change ?? null,
    };
  } catch {
    const response = await fetch(
      'https://api.coinbase.com/v2/prices/BTC-BRL/spot',
    );
    const body = await response.json();
    return { price: Number(body.data.amount), change24h: null };
  }
}

async function fetchHistory(days: number): Promise<PricePoint[]> {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=brl&days=${days}`,
  );
  const body = await response.json();
  return (body.prices as [number, number][]).map(([time, price]) => ({
    time,
    price,
  }));
}

export function useBitcoinQuote() {
  return useQuery({
    queryKey: ['dashboard', 'btc-quote'],
    queryFn: fetchQuote,
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useBitcoinHistory(days: number) {
  return useQuery({
    queryKey: ['dashboard', 'btc-history', days],
    queryFn: () => fetchHistory(days),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: 2,
  });
}

export const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatBtc(amount: number) {
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  });
}

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
