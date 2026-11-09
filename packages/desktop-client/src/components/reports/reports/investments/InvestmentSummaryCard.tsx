import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { useFormat } from '#hooks/useFormat';

import { colors, numeric, WidgetCard } from './ui';
import type { Portfolio } from './usePortfolio';

export function InvestmentSummaryCard({
  portfolio,
  widgetId,
  isEditing,
}: {
  portfolio: Portfolio;
  widgetId: string;
  isEditing?: boolean;
}) {
  const { t } = useTranslation();
  const format = useFormat();
  const slices = [
    { name: 'Bitcoin', value: portfolio.bitcoin.cents, color: colors.btc },
    { name: 'Litecoin', value: portfolio.litecoin.cents, color: colors.ltc },
    {
      name: 'CDB Itaú',
      value: Math.max(portfolio.cdbBalance, 0),
      color: colors.cdb,
    },
    {
      name: t('Cash'),
      value: Math.max(portfolio.cash, 0),
      color: colors.cash,
    },
  ];
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <WidgetCard
      widgetId={widgetId}
      isEditing={isEditing}
      title={<Trans>Investments</Trans>}
      subtitle={t('Net worth {{amount}}', {
        amount: format(portfolio.netWorth, 'financial'),
      })}
    >
      <Text
        style={{
          ...numeric,
          fontSize: 32,
          fontWeight: 500,
          color: theme.pageText,
        }}
      >
        {format(portfolio.invested, 'financial')}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          height: 6,
          borderRadius: 3,
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {slices.map(slice => (
          <View
            key={slice.name}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: slice.color,
              }}
            />
            <Text style={{ ...styles.smallText, color: theme.pageTextSubdued }}>
              {slice.name}
            </Text>
            <Text style={{ ...numeric, ...styles.smallText, fontWeight: 500 }}>
              {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
            </Text>
          </View>
        ))}
      </View>
    </WidgetCard>
  );
}
