import { useMemo } from 'react';

import type { AccountEntity } from '@actual-app/core/types/models';

import { useAccountBalances } from '#hooks/useAccountBalances';
import { useAccounts } from '#hooks/useAccounts';
import { useSyncedPref } from '#hooks/useSyncedPref';

import {
  cryptoAssets,
  parseDecimal,
  toCents,
  useCdiRate,
  useCryptoQuote,
} from './cryptoMarket';
import type { CryptoAsset } from './cryptoMarket';
import { useNetContributed, useNextContribution } from './useAccountInvestment';

function useCryptoPosition(
  asset: CryptoAsset,
  accounts: AccountEntity[],
  balances: Record<string, number | null>,
) {
  const config = cryptoAssets[asset];
  const [storedAccount] = useSyncedPref(config.accountPref);
  const [amountText] = useSyncedPref(config.amountPref);
  const [costText] = useSyncedPref(config.costPref);
  const quote = useCryptoQuote(asset);

  const accountId =
    storedAccount ??
    accounts.find(account => config.accountPattern.test(account.name))?.id ??
    '';
  const contributed = useNetContributed(accountId);
  const next = useNextContribution(accountId);

  const amount = parseDecimal(amountText ?? '') ?? 0;
  const price = quote.data?.price ?? 0;
  const cents = toCents(amount * price);
  const manualCost = parseDecimal(costText ?? '');
  const invested =
    contributed ?? (manualCost == null ? null : toCents(manualCost));
  const profit =
    invested != null && invested > 0 && amount > 0 ? cents - invested : null;

  return {
    asset,
    accountId,
    bookBalance: balances[accountId] ?? 0,
    amount,
    price,
    cents,
    invested,
    profit,
    profitPercent:
      profit != null && invested ? (profit / invested) * 100 : null,
    next,
    quote: quote.data ?? null,
  };
}

export function usePortfolio() {
  const { data: allAccounts = [] } = useAccounts();
  const accounts = useMemo(
    () => allAccounts.filter(account => !account.closed),
    [allAccounts],
  );
  const balances = useAccountBalances(accounts.map(account => account.id));
  const [storedCdbAccount] = useSyncedPref('dashboard-cdb-account');
  const [cdiShareText] = useSyncedPref('dashboard-cdb-cdi');
  const cdi = useCdiRate();

  const bitcoin = useCryptoPosition('bitcoin', accounts, balances);
  const litecoin = useCryptoPosition('litecoin', accounts, balances);

  const cdbAccountId =
    storedCdbAccount ??
    accounts.find(account => /cdb|invest/i.test(account.name))?.id ??
    '';
  const cdbBalance = balances[cdbAccountId] ?? 0;
  const cdbContributed = useNetContributed(cdbAccountId);
  const cdbNext = useNextContribution(cdbAccountId);

  const accountsTotal = accounts.reduce(
    (sum, account) => sum + (balances[account.id] ?? 0),
    0,
  );
  const cryptoCents = bitcoin.cents + litecoin.cents;
  const trackedBook = bitcoin.bookBalance + litecoin.bookBalance;
  const cash = accountsTotal - cdbBalance - trackedBook;

  const cdiShare = parseDecimal(cdiShareText ?? '') ?? 100;
  const cdiRate = cdi.data ?? null;
  const cdbRate = cdiRate == null ? null : (cdiRate * cdiShare) / 100;
  const cdbMonthlyRate =
    cdbRate == null ? null : Math.pow(1 + cdbRate / 100, 1 / 12) - 1;

  return {
    accounts,
    cash,
    netWorth: accountsTotal - trackedBook + cryptoCents,
    invested: Math.max(cdbBalance, 0) + cryptoCents,
    bitcoin,
    litecoin,
    cdbAccountId,
    cdbBalance,
    cdbContributed,
    cdbNext,
    cdbYield:
      cdbContributed != null && cdbContributed > 0
        ? cdbBalance - cdbContributed
        : null,
    cdiRate,
    cdiShare,
    cdbRate,
    cdbMonthly:
      cdbMonthlyRate == null ? null : Math.round(cdbBalance * cdbMonthlyRate),
  };
}

export type Portfolio = ReturnType<typeof usePortfolio>;
export type CryptoPosition = Portfolio['bitcoin'];
