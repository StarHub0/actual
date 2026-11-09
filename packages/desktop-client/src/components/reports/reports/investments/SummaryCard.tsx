import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { useFormat } from '#hooks/useFormat';

import { Card, colors, Label, numeric } from './ui';
import type { Portfolio } from './usePortfolio';

export function SummaryCard({ portfolio }: { portfolio: Portfolio }) {
  const format = useFormat();
  const slices = [
    { name: 'Bitcoin', value: portfolio.btcCents, color: colors.btc },
    {
      name: 'CDB Itaú',
      value: Math.max(portfolio.cdbBalance, 0),
      color: colors.cdb,
    },
    { name: 'Cash', value: Math.max(portfolio.cash, 0), color: colors.cash },
  ];
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <Card style={{ gap: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 32,
          alignItems: 'flex-end',
        }}
      >
        <View style={{ gap: 4 }}>
          <Label>
            <Trans>Invested</Trans>
          </Label>
          <Text
            style={{
              ...numeric,
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: -0.8,
            }}
          >
            {format(portfolio.invested, 'financial')}
          </Text>
        </View>
        <View style={{ gap: 4 }}>
          <Label>
            <Trans>Net worth</Trans>
          </Label>
          <Text style={{ ...numeric, fontSize: 20, fontWeight: 600 }}>
            {format(portfolio.netWorth, 'financial')}
          </Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          height: 8,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: theme.tableBorder,
          gap: 2,
        }}
      >
        {total > 0 &&
          slices.map(slice => (
            <View
              key={slice.name}
              style={{
                width: `${(slice.value / total) * 100}%`,
                backgroundColor: slice.color,
              }}
            />
          ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
        {slices.map(slice => (
          <View
            key={slice.name}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 8,
                backgroundColor: slice.color,
              }}
            />
            <Text style={{ fontSize: 13, color: theme.pageTextLight }}>
              {slice.name}
            </Text>
            <Text style={{ ...numeric, fontSize: 13, fontWeight: 600 }}>
              {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
