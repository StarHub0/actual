import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { useFormat } from '#hooks/useFormat';

import { CandleChart } from './CandleChart';
import {
  brl,
  cryptoAssets,
  historyRanges,
  useCryptoCandles,
} from './cryptoMarket';
import type { CryptoAsset, HistoryRange } from './cryptoMarket';
import { AccountSelect, PrefInput, SettingsRow } from './PrefInput';
import { ScheduleLine } from './ScheduleLine';
import { Chip, numeric, Segmented, Stat, WidgetCard } from './ui';
import type { CryptoPosition } from './usePortfolio';

const compact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

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
  const [rangeKey, setRangeKey] = useState<HistoryRange['key']>('24h');
  const [mode, setMode] = useState<'line' | 'candles'>('candles');
  const [editing, setEditing] = useState(false);
  const range = historyRanges.find(r => r.key === rangeKey) ?? historyRanges[1];
  const candlesQuery = useCryptoCandles(asset, range);
  const candles = candlesQuery.data ?? [];

  const first = candles[0]?.open ?? 0;
  const last = candles[candles.length - 1]?.close ?? 0;
  const rangeChange = first > 0 ? ((last - first) / first) * 100 : null;
  const rangeHigh = candles.length
    ? Math.max(...candles.map(c => c.high))
    : null;
  const rangeLow = candles.length ? Math.min(...candles.map(c => c.low)) : null;
  const { profit, invested, quote } = position;

  return (
    <WidgetCard
      widgetId={widgetId}
      isEditing={isEditing}
      title={config.name}
      subtitle={`${config.symbol} / BRL`}
      right={
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ ...numeric, fontSize: 22, fontWeight: 500 }}>
            {position.price > 0 ? brl.format(position.price) : '—'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Chip value={quote?.change24h ?? null} />
            <Text style={{ ...styles.smallText, color: theme.pageTextSubdued }}>
              24h
            </Text>
          </View>
        </View>
      }
    >
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <Segmented
          value={rangeKey}
          onChange={setRangeKey}
          options={historyRanges.map(r => ({ value: r.key, label: r.label }))}
        />
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'candles', label: t('Candles') },
            { value: 'line', label: t('Line') },
          ]}
        />
      </View>

      <View style={{ height: 210, flexShrink: 0 }}>
        {candlesQuery.isError ? (
          <Text style={{ color: theme.pageTextSubdued }}>
            <Trans>Price history unavailable</Trans>
          </Text>
        ) : candles.length === 0 ? (
          <Text style={{ color: theme.pageTextSubdued }}>...</Text>
        ) : (
          <CandleChart
            candles={candles}
            mode={mode}
            range={range}
            height={210}
          />
        )}
      </View>

      <View
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
          gap: 12,
          paddingTop: 12,
          borderTop: `1px solid ${theme.tableBorder}`,
        }}
      >
        <Stat
          label={range.label}
          value={
            rangeChange == null
              ? '—'
              : `${rangeChange >= 0 ? '+' : ''}${rangeChange.toFixed(2)}%`
          }
          tone={
            rangeChange == null ? undefined : rangeChange >= 0 ? 'good' : 'bad'
          }
        />
        <Stat
          label={t('High')}
          value={rangeHigh == null ? '—' : brl.format(rangeHigh)}
        />
        <Stat
          label={t('Low')}
          value={rangeLow == null ? '—' : brl.format(rangeLow)}
        />
        <Stat
          label={t('Volume 24h')}
          value={quote?.volume24h ? compact.format(quote.volume24h) : '—'}
        />
      </View>

      <View
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
          gap: 12,
          paddingTop: 12,
          borderTop: `1px solid ${theme.tableBorder}`,
        }}
      >
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
        <Stat
          label="%"
          value={
            position.profitPercent == null
              ? '—'
              : `${position.profitPercent >= 0 ? '+' : ''}${position.profitPercent.toFixed(1)}%`
          }
          tone={
            position.profitPercent == null
              ? undefined
              : position.profitPercent >= 0
                ? 'good'
                : 'bad'
          }
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <ScheduleLine next={position.next} />
        <Button variant="bare" onPress={() => setEditing(!editing)}>
          {editing ? t('Done') : t('Edit')}
        </Button>
      </View>

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
