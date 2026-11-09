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

export function useNetContributed(accountId: string) {
  const flows = useQuery({
    queryKey: ['dashboard', 'contributed', accountId],
    enabled: accountId !== '',
    refetchInterval: 15_000,
    queryFn: async () => {
      const [deposited, withdrawn] = await Promise.all([
        sumAmounts(accountId, '$gt'),
        sumAmounts(accountId, '$lt'),
      ]);
      return deposited + withdrawn;
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
