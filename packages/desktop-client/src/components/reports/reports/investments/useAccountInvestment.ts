import { useMemo } from 'react';

import { q } from '@actual-app/core/shared/query';
import { useQuery } from '@tanstack/react-query';

import { usePayees } from '#hooks/usePayees';
import { useSchedules } from '#hooks/useSchedules';
import { aqlQuery } from '#queries/aqlQuery';

export type NextContribution = {
  date: string;
  amount: number;
  count: number;
};

async function sumAmounts(accountId: string, side: '$gt' | '$lt') {
  const { data } = await aqlQuery(
    q('transactions')
      .filter({ account: accountId, amount: { [side]: 0 } })
      .calculate({ $sum: '$amount' }),
  );
  return (data as number | null) ?? 0;
}

export type AccountFlows = {
  deposited: number;
  withdrawn: number;
  quantity: number | null;
  estimated: boolean;
};

function quantityInNotes(notes: string | null) {
  const match = notes?.match(/\d+[.,]\d{4,8}/);
  return match ? Number(match[0].replace(',', '.')) : null;
}

async function dailyPrices(pair: string, since: string) {
  const startTime = new Date(`${since}T00:00:00Z`).getTime();
  const response = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1d&startTime=${startTime}&limit=1000`,
  );
  const rows = (await response.json()) as string[][];
  const prices = new Map<string, number>();
  for (const row of rows) {
    const typical = (Number(row[2]) + Number(row[3]) + Number(row[4])) / 3;
    prices.set(new Date(Number(row[0])).toISOString().slice(0, 10), typical);
  }
  return prices;
}

async function notesFlows(
  accountId: string,
  notesTerm: string,
  pair: string,
): Promise<AccountFlows> {
  const { data } = await aqlQuery(
    q('transactions')
      .filter({ account: accountId, notes: { $like: `%${notesTerm}%` } })
      .select(['amount', 'notes', 'date']),
  );
  const rows = data as { amount: number; notes: string | null; date: string }[];
  let deposited = 0;
  let withdrawn = 0;
  let written = 0;
  let allWritten = rows.length > 0;
  for (const row of rows) {
    if (row.amount > 0) deposited += row.amount;
    else withdrawn += Math.abs(row.amount);
    const found = quantityInNotes(row.notes);
    if (found == null) allWritten = false;
    else written += row.amount >= 0 ? found : -found;
  }
  if (allWritten) {
    return { deposited, withdrawn, quantity: written, estimated: false };
  }
  if (rows.length === 0) {
    return { deposited, withdrawn, quantity: null, estimated: false };
  }
  try {
    const earliest = rows.map(row => row.date).sort()[0];
    const prices = await dailyPrices(pair, earliest);
    let quantity = 0;
    for (const row of rows) {
      const price = prices.get(row.date) ?? [...prices.values()].pop();
      if (!price) {
        return { deposited, withdrawn, quantity: null, estimated: false };
      }
      quantity += row.amount / 100 / price;
    }
    return { deposited, withdrawn, quantity, estimated: true };
  } catch {
    return { deposited, withdrawn, quantity: null, estimated: false };
  }
}

export function useAssetFlows(
  accountId: string,
  notesTerm: string | null,
  pair = '',
) {
  const flows = useQuery({
    queryKey: ['dashboard', 'flows', accountId, notesTerm, pair],
    enabled: accountId !== '',
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<AccountFlows> => {
      if (notesTerm) return notesFlows(accountId, notesTerm, pair);
      const [deposited, withdrawn] = await Promise.all([
        sumAmounts(accountId, '$gt'),
        sumAmounts(accountId, '$lt'),
      ]);
      return {
        deposited,
        withdrawn: Math.abs(withdrawn),
        quantity: null,
        estimated: false,
      };
    },
  });
  return accountId === '' ? null : (flows.data ?? null);
}

export function useNextContribution(accountId: string) {
  const query = useMemo(() => q('schedules').select('*'), []);
  const { schedules } = useSchedules({ query });
  const { data: payees = [] } = usePayees();
  const transferPayeeId = payees.find(
    payee => payee.transfer_acct === accountId,
  )?.id;

  return useMemo<NextContribution | null>(() => {
    if (accountId === '' || !transferPayeeId) return null;
    const matching = schedules
      .filter(
        schedule =>
          !schedule.completed &&
          schedule._payee === transferPayeeId &&
          schedule.next_date,
      )
      .sort((a, b) => a.next_date.localeCompare(b.next_date));
    if (matching.length === 0) return null;
    const first = matching[0];
    const amount =
      typeof first._amount === 'number' ? first._amount : first._amount.num1;
    return {
      date: first.next_date,
      amount: Math.abs(amount),
      count: matching.length,
    };
  }, [accountId, transferPayeeId, schedules]);
}
