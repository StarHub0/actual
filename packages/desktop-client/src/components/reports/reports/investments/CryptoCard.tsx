import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { Area, AreaChart, Tooltip as ChartTooltip, YAxis } from 'recharts';

import { useFormat } from '#hooks/useFormat';

import {
  brl,
  cryptoAssets,
  historyRanges,
  useCryptoHistory,
} from './cryptoMarket';
import type { CryptoAsset } from './cryptoMarket';
import { AccountSelect, PrefInput, SettingsRow } from './PrefInput';
import { ScheduleLine } from './ScheduleLine';
import { Chip, numeric, Stat, WidgetCard } from './ui';
import type { CryptoPosition } from './usePortfolio';

export function CryptoCard({
  asset,
  position,
  accounts,
  widgetId,
  isEditing,
}: {
  asset: CryptoAsset;
  position: CryptoPosition;
  accounts: Parameters<typeof AccountSelect>[0]['accounts'];
  widgetId: string;
  isEditing?: boolean;
}) {
  const { t } = useTranslation();
  const format = useFormat();
  const config = cryptoAssets[asset];
  const [days, setDays] = useState(30);
  const [editing, setEditing] = useState(false);
  const history = useCryptoHistory(asset, days);
  const points = history.data ?? [];
  const rising =
    (points[points.length - 1]?.price ?? 0) >= (points[0]?.price ?? 0);
  const lineColor = rising
    ? theme.reportsNumberPositive
    : theme.reportsNumberNegative;
  const { profit, invested } = position;

  return (
    <WidgetCard
      widgetId={widgetId}
      isEditing={isEditing}
      title={config.name}
      subtitle={`${config.symbol} / BRL`}
      right={
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ ...numeric, fontSize: 20, fontWeight: 500 }}>
            {position.price > 0 ? brl.format(position.price) : '—'}
          </Text>
          <Chip value={position.quote?.change24h ?? null} />
        </View>
      }
    >
      <View style={{ height: 110, flexShrink: 0 }}>
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
              <linearGradient id={`${asset}Fill`} x1="0" y1="0" x2="0" y2="1">
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
              formatter={value => [brl.format(Number(value)), config.symbol]}
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
              fill={`url(#${asset}Fill)`}
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
                color:
                  days === range.days ? config.color : theme.pageTextSubdued,
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
          value={invested == null ? '—' : format(invested, 'financial')}
        />
        <Stat
          label={<Trans>Position</Trans>}
          value={
            position.amount > 0 ? format(position.cents, 'financial') : '—'
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

      <ScheduleLine next={position.next} />

      {editing && (
        <SettingsRow>
          <PrefInput
            prefKey={config.amountPref}
            label={t('{{symbol}} held', { symbol: config.symbol })}
            placeholder="0,00000000"
          />
          <AccountSelect
            prefKey={config.accountPref}
            label={t('{{name}} account', { name: config.name })}
            accounts={accounts}
            value={position.accountId}
            emptyLabel={t('None')}
          />
          {position.accountId === '' && (
            <PrefInput
              prefKey={config.costPref}
              label={t('Total paid (BRL)')}
              placeholder="0,00"
            />
          )}
        </SettingsRow>
      )}
    </WidgetCard>
  );
}
