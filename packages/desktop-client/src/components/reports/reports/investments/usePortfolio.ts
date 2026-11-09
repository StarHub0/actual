import { useMemo } from 'react';

import { useAccountBalances } from '#hooks/useAccountBalances';
import { useAccounts } from '#hooks/useAccounts';
import { useSyncedPref } from '#hooks/useSyncedPref';

import { parseDecimal, toCents, useBitcoinQuote } from './bitcoinMarket';

export function usePortfolio() {
  const { data: allAccounts = [] } = useAccounts();
  const accounts = useMemo(
    () => allAccounts.filter(account => !account.closed),
    [allAccounts],
  );
  const balances = useAccountBalances(accounts.map(account => account.id));
  const [storedCdbAccount] = useSyncedPref('dashboard-cdb-account');
  const [amountText] = useSyncedPref('dashboard-btc-amount');
  const [costText] = useSyncedPref('dashboard-btc-cost');
  const [rateText] = useSyncedPref('dashboard-cdb-rate');
  const quote = useBitcoinQuote();

  const cdbAccountId =
    storedCdbAccount ??
    accounts.find(account => /cdb|invest/i.test(account.name))?.id ??
    '';
  const cdbBalance = balances[cdbAccountId] ?? 0;
  const accountsTotal = accounts.reduce(
    (sum, account) => sum + (balances[account.id] ?? 0),
    0,
  );
  const cash = accountsTotal - cdbBalance;

  const btcAmount = parseDecimal(amountText ?? '') ?? 0;
  const btcPrice = quote.data?.price ?? 0;
  const btcCents = toCents(btcAmount * btcPrice);
  const cost = parseDecimal(costText ?? '');
  const btcCost = cost == null ? null : toCents(cost);
  const btcProfit =
    btcCost != null && btcCost > 0 && btcAmount > 0 ? btcCents - btcCost : null;
  const btcProfitPercent =
    btcProfit != null && btcCost ? (btcProfit / btcCost) * 100 : null;

  const cdbRate = parseDecimal(rateText ?? '');
  const cdbMonthlyRate =
    cdbRate == null ? null : Math.pow(1 + cdbRate / 100, 1 / 12) - 1;
  const cdbMonthly =
    cdbMonthlyRate == null ? null : Math.round(cdbBalance * cdbMonthlyRate);
  const cdbYearly =
    cdbRate == null ? null : Math.round(cdbBalance * (cdbRate / 100));

  const invested = Math.max(cdbBalance, 0) + btcCents;

  return {
    accounts,
    balances,
    cdbAccountId,
    cdbBalance,
    cash,
    netWorth: accountsTotal + btcCents,
    invested,
    btcAmount,
    btcPrice,
    btcCents,
    btcCost,
    btcProfit,
    btcProfitPercent,
    cdbRate,
    cdbMonthlyRate,
    cdbMonthly,
    cdbYearly,
    quote: quote.data ?? null,
    quoteFailed: quote.isError,
  };
}

export type Portfolio = ReturnType<typeof usePortfolio>;
