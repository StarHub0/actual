import { useMemo } from 'react';

import { useAccountBalances } from '#hooks/useAccountBalances';
import { useAccounts } from '#hooks/useAccounts';
import { useSyncedPref } from '#hooks/useSyncedPref';

import {
  parseDecimal,
  toCents,
  useBitcoinQuote,
  useCdiRate,
} from './bitcoinMarket';
import { useNetContributed, useNextContribution } from './useAccountInvestment';

export function usePortfolio() {
  const { data: allAccounts = [] } = useAccounts();
  const accounts = useMemo(
    () => allAccounts.filter(account => !account.closed),
    [allAccounts],
  );
  const balances = useAccountBalances(accounts.map(account => account.id));
  const [storedCdbAccount] = useSyncedPref('dashboard-cdb-account');
  const [storedBtcAccount] = useSyncedPref('dashboard-btc-account');
  const [amountText] = useSyncedPref('dashboard-btc-amount');
  const [costText] = useSyncedPref('dashboard-btc-cost');
  const [cdiShareText] = useSyncedPref('dashboard-cdb-cdi');
  const quote = useBitcoinQuote();
  const cdi = useCdiRate();

  const cdbAccountId =
    storedCdbAccount ??
    accounts.find(account => /cdb|invest/i.test(account.name))?.id ??
    '';
  const btcAccountId =
    storedBtcAccount ??
    accounts.find(account => /bitcoin|btc|crypto|cripto/i.test(account.name))
      ?.id ??
    '';
  const cdbBalance = balances[cdbAccountId] ?? 0;
  const accountsTotal = accounts.reduce(
    (sum, account) => sum + (balances[account.id] ?? 0),
    0,
  );
  const cash = accountsTotal - cdbBalance - (balances[btcAccountId] ?? 0);

  const cdbContributed = useNetContributed(cdbAccountId);
  const btcContributed = useNetContributed(btcAccountId);
  const cdbNext = useNextContribution(cdbAccountId);
  const btcNext = useNextContribution(btcAccountId);

  const btcAmount = parseDecimal(amountText ?? '') ?? 0;
  const btcPrice = quote.data?.price ?? 0;
  const btcCents = toCents(btcAmount * btcPrice);
  const manualCost = parseDecimal(costText ?? '');
  const btcInvested =
    btcContributed ?? (manualCost == null ? null : toCents(manualCost));
  const btcProfit =
    btcInvested != null && btcInvested > 0 && btcAmount > 0
      ? btcCents - btcInvested
      : null;
  const btcProfitPercent =
    btcProfit != null && btcInvested ? (btcProfit / btcInvested) * 100 : null;

  const cdiShare = parseDecimal(cdiShareText ?? '') ?? 100;
  const cdiRate = cdi.data ?? null;
  const cdbRate = cdiRate == null ? null : (cdiRate * cdiShare) / 100;
  const cdbMonthlyRate =
    cdbRate == null ? null : Math.pow(1 + cdbRate / 100, 1 / 12) - 1;
  const cdbMonthly =
    cdbMonthlyRate == null ? null : Math.round(cdbBalance * cdbMonthlyRate);
  const cdbYearly =
    cdbRate == null ? null : Math.round(cdbBalance * (cdbRate / 100));
  const cdbYield =
    cdbContributed != null && cdbContributed > 0
      ? cdbBalance - cdbContributed
      : null;

  return {
    accounts,
    balances,
    cdbAccountId,
    btcAccountId,
    cdbBalance,
    cash,
    netWorth: accountsTotal - (balances[btcAccountId] ?? 0) + btcCents,
    invested: Math.max(cdbBalance, 0) + btcCents,
    btcAmount,
    btcPrice,
    btcCents,
    btcInvested,
    btcProfit,
    btcProfitPercent,
    btcNext,
    cdiRate,
    cdiShare,
    cdbRate,
    cdbMonthly,
    cdbYearly,
    cdbContributed,
    cdbYield,
    cdbNext,
    quote: quote.data ?? null,
  };
}

export type Portfolio = ReturnType<typeof usePortfolio>;
