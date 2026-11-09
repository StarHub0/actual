import { useMemo } from 'react';

import { useAccountBalances } from '#hooks/useAccountBalances';
import { useAccounts } from '#hooks/useAccounts';
import { useSyncedPref } from '#hooks/useSyncedPref';

import { parseDecimal, toCents, useBitcoinQuote } from './bitcoinMarket';

export function useInvestmentAccounts() {
  const { data: allAccounts = [] } = useAccounts();
  const accounts = useMemo(
    () => allAccounts.filter(account => !account.closed),
    [allAccounts],
  );
  const balances = useAccountBalances(accounts.map(account => account.id));
  const [storedCdbAccount] = useSyncedPref('dashboard-cdb-account');
  const cdbAccountId =
    storedCdbAccount ??
    accounts.find(account => /cdb|invest/i.test(account.name))?.id ??
    '';
  const cdbBalance = balances[cdbAccountId] ?? 0;
  const accountsTotal = accounts.reduce(
    (sum, account) => sum + (balances[account.id] ?? 0),
    0,
  );
  return { accounts, balances, cdbAccountId, cdbBalance, accountsTotal };
}

export function useBitcoinValue() {
  const [amountText] = useSyncedPref('dashboard-btc-amount');
  const quote = useBitcoinQuote();
  const amount = parseDecimal(amountText ?? '') ?? 0;
  return toCents(amount * (quote.data?.price ?? 0));
}
