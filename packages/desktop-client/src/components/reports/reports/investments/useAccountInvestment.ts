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
};

function quantityInNotes(notes: string | null) {
  const match = notes?.match(/\d+[.,]\d{4,8}/);
  return match ? Number(match[0].replace(',', '.')) : null;
}

async function notesFlows(
  accountId: string,
  notesTerm: string,
): Promise<AccountFlows> {
  const { data } = await aqlQuery(
    q('transactions')
      .filter({ account: accountId, notes: { $like: `%${notesTerm}%` } })
      .select(['amount', 'notes']),
  );
  const rows = data as { amount: number; notes: string | null }[];
  let deposited = 0;
  let withdrawn = 0;
  let quantity = 0;
  let allHaveQuantity = rows.length > 0;
  for (const row of rows) {
    if (row.amount > 0) deposited += row.amount;
    else withdrawn += Math.abs(row.amount);
    const found = quantityInNotes(row.notes);
    if (found == null) allHaveQuantity = false;
    else quantity += row.amount >= 0 ? found : -found;
  }
  return { deposited, withdrawn, quantity: allHaveQuantity ? quantity : null };
}

export function useAssetFlows(accountId: string, notesTerm: string | null) {
  const flows = useQuery({
    queryKey: ['dashboard', 'flows', accountId, notesTerm],
    enabled: accountId !== '',
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<AccountFlows> => {
      if (notesTerm) return notesFlows(accountId, notesTerm);
      const [deposited, withdrawn] = await Promise.all([
        sumAmounts(accountId, '$gt'),
        sumAmounts(accountId, '$lt'),
      ]);
      return { deposited, withdrawn: Math.abs(withdrawn), quantity: null };
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
