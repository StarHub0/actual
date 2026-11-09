import React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router';

import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { useFormat } from '#hooks/useFormat';

import { brl } from './bitcoinMarket';
import { colors, numeric } from './ui';
import { usePortfolio } from './usePortfolio';

export function InvestmentsBanner() {
  const format = useFormat();
  const portfolio = usePortfolio();
  const change = portfolio.quote?.change24h ?? null;

  return (
    <Link
      to="/reports/investments"
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        margin: '10px 10px 0',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '4px 20px',
          padding: '8px 14px',
          borderRadius: 10,
          border: `1px solid ${theme.tableBorder}`,
          backgroundColor: theme.cardBackground,
          fontSize: 13,
        }}
      >
        <Text style={{ fontWeight: 700, marginRight: 'auto' }}>
          <Trans>Investments</Trans>
        </Text>
        <Text style={{ ...numeric, color: theme.pageTextLight }}>
          <span style={{ color: colors.btc }}>₿</span>{' '}
          {portfolio.btcPrice > 0 ? brl.format(portfolio.btcPrice) : '—'}
          {change != null && (
            <span style={{ color: change >= 0 ? colors.up : colors.down }}>
              {' '}
              {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
            </span>
          )}
        </Text>
        <Text style={{ ...numeric, color: theme.pageTextLight }}>
          CDB {format(portfolio.cdbBalance, 'financial')}
        </Text>
        <Text style={{ color: theme.pageTextSubdued }}>›</Text>
      </View>
    </Link>
  );
}
