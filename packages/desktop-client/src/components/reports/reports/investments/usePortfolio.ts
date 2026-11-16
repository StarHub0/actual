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
import { useLiveQuote } from './liveQuotes';
import { useAssetFlows, useNextContribution } from './useAccountInvestment';
import { useCdbHoldings } from './useCdbHoldings';

function useCryptoPosition(
  asset: CryptoAsset,
  accounts: AccountEntity[],
  balances: Record<string, number | null>,
  fallbackAccountId: string,
) {
  const config = cryptoAssets[asset];
  const [storedAccount] = useSyncedPref(config.accountPref);
  const [amountText] = useSyncedPref(config.amountPref);
  const [costText] = useSyncedPref(config.costPref);
  const restQuote = useCryptoQuote(asset);
  const liveQuote = useLiveQuote(asset);
  const quote = liveQuote ?? restQuote.data ?? null;

  const accountId =
    storedAccount ??
    accounts.find(account => config.accountPattern.test(account.name))?.id ??
    fallbackAccountId;
  const accountName = accounts.find(account => account.id === accountId)?.name;
  const shared =
    accountId !== '' && !config.accountPattern.test(accountName ?? '');
  const flows = useAssetFlows(accountId, shared ? config.notesTerm : null);
  const next = useNextContribution(accountId);

  const manualAmount = parseDecimal(amountText ?? '') ?? 0;
  const amountFromNotes = flows?.quantity != null;
  const amount = flows?.quantity ?? manualAmount;
  const price = quote?.price ?? 0;
  const cents = toCents(amount * price);
  const manualCost = parseDecimal(costText ?? '');
  const deposited =
    flows?.deposited ?? (manualCost == null ? null : toCents(manualCost));
  const withdrawn = flows?.withdrawn ?? 0;
  const netInvested = deposited == null ? null : deposited - withdrawn;
  const hasCost = deposited != null && deposited > 0;
  const profit = hasCost && amount > 0 ? cents + withdrawn - deposited : null;
  const averagePrice =
    netInvested != null && netInvested > 0 && amount > 0
      ? netInvested / 100 / amount
      : null;

  return {
    asset,
    accountId,
    sharedBook: shared ? (flows ? flows.deposited - flows.withdrawn : 0) : 0,
    dedicatedBook: shared ? 0 : (balances[accountId] ?? 0),
    fromNotes: shared,
    amountFromNotes,
    amount,
    price,
    cents,
    deposited,
    withdrawn,
    netInvested,
    averagePrice,
    profit,
    profitPercent:
      profit != null && deposited ? (profit / deposited) * 100 : null,
    next,
    quote,
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

  const cdbAccountId =
    storedCdbAccount ??
    accounts.find(account => /cdb|invest/i.test(account.name))?.id ??
    '';
  const bitcoin = useCryptoPosition(
    'bitcoin',
    accounts,
    balances,
    cdbAccountId,
  );
  const litecoin = useCryptoPosition(
    'litecoin',
    accounts,
    balances,
    cdbAccountId,
  );
  const cdbBookBalance = balances[cdbAccountId] ?? 0;
  const sharedCryptoBook = [bitcoin, litecoin]
    .filter(position => position.accountId === cdbAccountId)
    .reduce((sum, position) => sum + position.sharedBook, 0);
  const holdingsQuery = useCdbHoldings();
  const holdings = holdingsQuery.data ?? null;
  const holdingsNet = holdings
    ? Math.round(holdings.reduce((sum, item) => sum + item.net, 0) * 100)
    : null;
  const holdingsApplied = holdings
    ? Math.round(holdings.reduce((sum, item) => sum + item.applied, 0) * 100)
    : null;
  const cdbBalance = holdingsNet ?? cdbBookBalance - sharedCryptoBook;
  const accountFlows = useAssetFlows(cdbAccountId, null);
  const accountContributed = accountFlows
    ? accountFlows.deposited - accountFlows.withdrawn - sharedCryptoBook
    : null;
  const cdbContributed = holdingsApplied ?? accountContributed;
  const cdbNext = useNextContribution(cdbAccountId);

  const accountsTotal = accounts.reduce(
    (sum, account) => sum + (balances[account.id] ?? 0),
    0,
  );
  const cryptoCents = bitcoin.cents + litecoin.cents;
  const trackedBook = bitcoin.dedicatedBook + litecoin.dedicatedBook;
  const cash = accountsTotal - cdbBookBalance - trackedBook;

  const cdiShare = parseDecimal(cdiShareText ?? '') ?? 100;
  const cdiRate = cdi.data ?? null;
  const cdbRate = cdiRate == null ? null : (cdiRate * cdiShare) / 100;
  const cdbMonthlyRate =
    cdbRate == null ? null : Math.pow(1 + cdbRate / 100, 1 / 12) - 1;

  return {
    accounts,
    cash,
    netWorth:
      accountsTotal - cdbBookBalance - trackedBook + cdbBalance + cryptoCents,
    invested: Math.max(cdbBalance, 0) + cryptoCents,
    bitcoin,
    litecoin,
    cdbAccountId,
    cdbBalance,
    holdings,
    holdingsError: holdingsQuery.isError,
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
