import React, { useState } from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { Area, AreaChart, Tooltip as ChartTooltip, YAxis } from 'recharts';

import { useFormat } from '#hooks/useFormat';

import { brl, historyRanges, useBitcoinHistory } from './bitcoinMarket';
import { PrefInput } from './PrefInput';
import { AssetBadge, Card, Chip, colors, numeric, Stat } from './ui';
import type { Portfolio } from './usePortfolio';

export function BitcoinCard({ portfolio }: { portfolio: Portfolio }) {
  const format = useFormat();
  const [days, setDays] = useState(30);
  const history = useBitcoinHistory(days);
  const points = history.data ?? [];
  const first = points[0]?.price ?? 0;
  const last = points[points.length - 1]?.price ?? 0;
  const lineColor = last >= first ? colors.up : colors.down;
  const profit = portfolio.btcProfit;

  return (
    <Card style={{ flex: '1 1 380px', gap: 14 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <AssetBadge color={colors.btc}>₿</AssetBadge>
          <View>
            <Text style={{ fontSize: 15, fontWeight: 600 }}>
              <Trans>Bitcoin</Trans>
            </Text>
            <Text style={{ fontSize: 12, color: theme.pageTextSubdued }}>
              BTC / BRL
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ ...numeric, fontSize: 22, fontWeight: 700 }}>
            {portfolio.btcPrice > 0 ? brl.format(portfolio.btcPrice) : '—'}
          </Text>
          <Chip value={portfolio.quote?.change24h ?? null} />
        </View>
      </View>

      <View style={{ height: 130 }}>
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
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <ChartTooltip
              contentStyle={{
                backgroundColor: theme.menuBackground,
                border: `1px solid ${theme.tableBorder}`,
                borderRadius: 10,
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

      <View style={{ flexDirection: 'row', gap: 4 }}>
        {historyRanges.map(range => (
          <button
            key={range.days}
            onClick={() => setDays(range.days)}
            style={{
              border: 'none',
              cursor: 'pointer',
              padding: '3px 10px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: days === range.days ? '#fff' : theme.pageTextSubdued,
              backgroundColor: days === range.days ? colors.btc : 'transparent',
            }}
          >
            {range.label}
          </button>
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          paddingTop: 14,
          borderTop: `1px solid ${theme.tableBorder}`,
        }}
      >
        <PrefInput
          prefKey="dashboard-btc-amount"
          label="BTC"
          placeholder="0,00000000"
          suffix=""
        />
        <PrefInput
          prefKey="dashboard-btc-cost"
          label="BRL"
          placeholder="0,00"
          suffix=""
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 24 }}>
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
            profit == null
              ? '—'
              : `${profit >= 0 ? '+' : ''}${format(profit, 'financial')}`
          }
          tone={profit == null ? undefined : profit >= 0 ? 'good' : 'bad'}
        />
      </View>
    </Card>
  );
}
