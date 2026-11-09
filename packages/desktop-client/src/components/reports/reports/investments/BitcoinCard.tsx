import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { Area, AreaChart, Tooltip as ChartTooltip, YAxis } from 'recharts';

import { useFormat } from '#hooks/useFormat';

import { brl, historyRanges, useBitcoinHistory } from './bitcoinMarket';
import { AccountSelect, PrefInput, SettingsRow } from './PrefInput';
import { ScheduleLine } from './ScheduleLine';
import { Chip, colors, numeric, Stat, WidgetCard } from './ui';
import type { Portfolio } from './usePortfolio';

export function BitcoinCard({ portfolio }: { portfolio: Portfolio }) {
  const { t } = useTranslation();
  const format = useFormat();
  const [days, setDays] = useState(30);
  const [editing, setEditing] = useState(false);
  const history = useBitcoinHistory(days);
  const points = history.data ?? [];
  const rising =
    (points[points.length - 1]?.price ?? 0) >= (points[0]?.price ?? 0);
  const lineColor = rising
    ? theme.reportsNumberPositive
    : theme.reportsNumberNegative;
  const { btcProfit, btcInvested } = portfolio;

  return (
    <WidgetCard
      title={t('Bitcoin')}
      subtitle="BTC / BRL"
      right={
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ ...numeric, fontSize: 20, fontWeight: 500 }}>
            {portfolio.btcPrice > 0 ? brl.format(portfolio.btcPrice) : '—'}
          </Text>
          <Chip value={portfolio.quote?.change24h ?? null} />
        </View>
      }
    >
      <View style={{ height: 110 }}>
        {history.isError ? (
          <Text style={{ color: theme.pageTextSubdued }}>
            <Trans>Price history unavailable</Trans>
          </Text>
        ) : (
          <AreaChart
            data={points}
            responsive
            style={{ width: '100%', height: '100%' }}
            margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="btcFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <ChartTooltip
              contentStyle={{
                backgroundColor: theme.menuBackground,
                border: `1px solid ${theme.tableBorder}`,
                borderRadius: 4,
                color: theme.menuItemText,
              }}
              formatter={value => [brl.format(Number(value)), 'BTC']}
              labelFormatter={time =>
                new Date(Number(time)).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                })
              }
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              fill="url(#btcFill)"
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        )}
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', gap: 2 }}>
          {historyRanges.map(range => (
            <Button
              key={range.days}
              variant="bare"
              onPress={() => setDays(range.days)}
              style={{
                color: days === range.days ? colors.btc : theme.pageTextSubdued,
                fontWeight: days === range.days ? 600 : 400,
              }}
            >
              {range.label}
            </Button>
          ))}
        </View>
        <Button variant="bare" onPress={() => setEditing(!editing)}>
          {editing ? t('Done') : t('Edit')}
        </Button>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
        <Stat
          label={<Trans>Invested</Trans>}
          value={btcInvested == null ? '—' : format(btcInvested, 'financial')}
        />
        <Stat
          label={<Trans>Position</Trans>}
          value={
            portfolio.btcAmount > 0
              ? format(portfolio.btcCents, 'financial')
              : '—'
          }
        />
        <Stat
          label={<Trans>Profit</Trans>}
          value={
            btcProfit == null
              ? '—'
              : `${btcProfit >= 0 ? '+' : ''}${format(btcProfit, 'financial')}`
          }
          tone={btcProfit == null ? undefined : btcProfit >= 0 ? 'good' : 'bad'}
        />
      </View>

      <ScheduleLine next={portfolio.btcNext} />

      {editing && (
        <SettingsRow>
          <PrefInput
            prefKey="dashboard-btc-amount"
            label={t('Bitcoin held (BTC)')}
            placeholder="0,00000000"
          />
          <AccountSelect
            prefKey="dashboard-btc-account"
            label={t('Bitcoin account')}
            accounts={portfolio.accounts}
            value={portfolio.btcAccountId}
            emptyLabel={t('None')}
          />
          {portfolio.btcAccountId === '' && (
            <PrefInput
              prefKey="dashboard-btc-cost"
              label={t('Total paid (BRL)')}
              placeholder="0,00"
            />
          )}
        </SettingsRow>
      )}
    </WidgetCard>
  );
}
