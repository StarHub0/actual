import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { useFormat } from '#hooks/useFormat';

import { brl, useBitcoinQuote } from './bitcoinMarket';
import {
  useBitcoinValue,
  useInvestmentAccounts,
} from './useInvestmentAccounts';

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: theme.pageTextSubdued,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: 16, fontWeight: 600 }}>{value}</Text>
    </View>
  );
}

export function InvestmentsBanner() {
  const { t } = useTranslation();
  const format = useFormat();
  const quote = useBitcoinQuote();
  const btcCents = useBitcoinValue();
  const { cdbBalance } = useInvestmentAccounts();
  const change = quote.data?.change24h ?? null;
  const up = (change ?? 0) >= 0;

  return (
    <Link
      to="/reports/investments"
      style={{ textDecoration: 'none', color: 'inherit', margin: '0 0 12px' }}
    >
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 28,
          padding: '14px 20px',
          borderRadius: 16,
          border: `1px solid ${theme.tableBorder}`,
          backgroundColor: theme.cardBackground,
          backgroundImage: `linear-gradient(135deg, ${theme.pageBackgroundTopLeft}, ${theme.cardBackground} 65%)`,
        }}
      >
        <View style={{ gap: 2, marginRight: 'auto' }}>
          <Text style={{ fontSize: 16, fontWeight: 700 }}>
            <Trans>Investments</Trans>
          </Text>
          <Text style={{ fontSize: 12, color: theme.pageTextSubdued }}>
            <Trans>Bitcoin and CDB Itaú</Trans>
          </Text>
        </View>
        <View style={{ gap: 2 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              color: theme.pageTextSubdued,
            }}
          >
            BTC
          </Text>
          <View
            style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}
          >
            <Text style={{ fontSize: 16, fontWeight: 600 }}>
              {quote.data ? brl.format(quote.data.price) : '—'}
            </Text>
            {change != null && (
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: up ? theme.noticeTextLight : theme.errorText,
                }}
              >
                {up ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
              </Text>
            )}
          </View>
        </View>
        <Figure label="CDB" value={format(cdbBalance, 'financial')} />
        <Figure
          label={t('Bitcoin')}
          value={btcCents > 0 ? format(btcCents, 'financial') : '—'}
        />
        <Text style={{ fontSize: 20, color: theme.pageTextSubdued }}>›</Text>
      </View>
    </Link>
  );
}
