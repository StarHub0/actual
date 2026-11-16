import React, { useMemo, useState } from 'react';
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
  brlCompact,
  cryptoAssets,
  historyRanges,
  useCryptoCandles,
} from './cryptoMarket';
import type { CryptoAsset, HistoryRange } from './cryptoMarket';
import { AccountSelect, PrefInput, SettingsRow } from './PrefInput';
import { ScheduleLine } from './ScheduleLine';
import { Chip, numeric, Segmented, Stat, WidgetCard } from './ui';
import type { CryptoPosition } from './usePortfolio';

function PositionPanel({
  position,
  symbol,
}: {
  position: CryptoPosition;
  symbol: string;
}) {
  const { t } = useTranslation();
  const format = useFormat();
  const { cents, deposited, withdrawn, netInvested, profit, averagePrice } =
    position;
  const known = deposited != null && deposited > 0;
  const base = Math.max(cents, netInvested ?? 0, 1);
  const keptPart = Math.min(netInvested ?? 0, cents);
  const gainPart = Math.max(cents - (netInvested ?? 0), 0);
  const lossPart = Math.max((netInvested ?? 0) - cents, 0);
  const up = (profit ?? 0) >= 0;

  return (
    <View
      style={{
        gap: 14,
        padding: 14,
        borderRadius: 8,
        backgroundColor: theme.tableRowHeaderBackground,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <View style={{ gap: 2 }}>
          <Text style={{ ...styles.smallText, color: theme.pageTextSubdued }}>
            <Trans>Your position</Trans>
          </Text>
          <Text style={{ ...numeric, fontSize: 26, fontWeight: 500 }}>
            {position.amount > 0 ? format(cents, 'financial') : '—'}
          </Text>
          <Text
            style={{
              ...numeric,
              ...styles.smallText,
              color: theme.pageTextSubdued,
            }}
          >
            {position.amount > 0
              ? `${position.amount.toLocaleString('pt-BR', { maximumFractionDigits: 8 })} ${symbol}${position.amountEstimated ? ` · ${t('estimated from your deposits')}` : position.amountFromNotes ? ` · ${t('from notes')}` : ''}`
              : t('Set the amount in Edit')}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={{ ...styles.smallText, color: theme.pageTextSubdued }}>
            <Trans>Result</Trans>
          </Text>
          <Text
            style={{
              ...numeric,
              fontSize: 18,
              fontWeight: 500,
              color:
                profit == null
                  ? theme.pageTextSubdued
                  : up
                    ? theme.reportsNumberPositive
                    : theme.reportsNumberNegative,
            }}
          >
            {profit == null
              ? '—'
              : `${up ? '+' : '-'}${format(Math.abs(profit), 'financial')}`}
          </Text>
          {position.profitPercent != null && (
            <Chip value={position.profitPercent} />
          )}
        </View>
      </View>

      {known && position.amount > 0 && (
        <View
          style={{
            flexDirection: 'row',
            height: 8,
            borderRadius: 4,
            overflow: 'hidden',
            gap: 2,
            backgroundColor: theme.tableBorder,
          }}
        >
          <View
            style={{
              width: `${(keptPart / base) * 100}%`,
              backgroundColor: theme.pageTextSubdued,
            }}
          />
          <View
            style={{
              width: `${(gainPart / base) * 100}%`,
              backgroundColor: theme.reportsNumberPositive,
            }}
          />
          <View
            style={{
              width: `${(lossPart / base) * 100}%`,
              backgroundColor: theme.reportsNumberNegative,
            }}
          />
        </View>
      )}

      <View
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: 12,
        }}
      >
        <Stat
          label={t('Deposited')}
          value={deposited == null ? '—' : format(deposited, 'financial')}
        />
        <Stat
          label={t('Withdrawn')}
          value={deposited == null ? '—' : format(withdrawn, 'financial')}
        />
        <Stat
          label={t('Net invested')}
          value={netInvested == null ? '—' : format(netInvested, 'financial')}
        />
        <Stat
          label={t('Average price')}
          value={averagePrice == null ? '—' : brl.format(averagePrice)}
        />
      </View>
    </View>
  );
}

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
  const config = cryptoAssets[asset];
  const [rangeKey, setRangeKey] = useState<HistoryRange['key']>('24h');
  const [mode, setMode] = useState<'line' | 'candles'>('candles');
  const [editing, setEditing] = useState(false);
  const range = historyRanges.find(r => r.key === rangeKey) ?? historyRanges[1];
  const candlesQuery = useCryptoCandles(asset, range);
  const loaded = candlesQuery.data;
  const candles = useMemo(() => {
    if (!loaded?.length || position.price <= 0) return loaded ?? [];
    const lastCandle = loaded[loaded.length - 1];
    return [
      ...loaded.slice(0, -1),
      {
        ...lastCandle,
        close: position.price,
        high: Math.max(lastCandle.high, position.price),
        low: Math.min(lastCandle.low, position.price),
      },
    ];
  }, [loaded, position.price]);

  const first = candles[0]?.open ?? 0;
  const last = candles[candles.length - 1]?.close ?? 0;
  const rangeChange = first > 0 ? ((last - first) / first) * 100 : null;
  const rangeHigh = candles.length
    ? Math.max(...candles.map(c => c.high))
    : null;
  const rangeLow = candles.length ? Math.min(...candles.map(c => c.low)) : null;
  const { quote } = position;

  return (
    <WidgetCard
      accent={config.color}
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
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <View style={{ gap: 14, minWidth: 0 }}>
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
              options={historyRanges.map(r => ({
                value: r.key,
                label: r.label,
              }))}
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

          <View style={{ height: 220 }}>
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
                height={220}
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
                rangeChange == null
                  ? undefined
                  : rangeChange >= 0
                    ? 'good'
                    : 'bad'
              }
            />
            <Stat
              label={t('High')}
              value={rangeHigh == null ? '—' : brlCompact.format(rangeHigh)}
            />
            <Stat
              label={t('Low')}
              value={rangeLow == null ? '—' : brlCompact.format(rangeLow)}
            />
            <Stat
              label={t('Volume 24h')}
              value={
                quote?.volume24h ? brlCompact.format(quote.volume24h) : '—'
              }
            />
          </View>
        </View>
        <View style={{ gap: 14, minWidth: 0 }}>
          <PositionPanel position={position} symbol={config.symbol} />

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
        </View>
      </View>

      {editing && (
        <SettingsRow>
          <PrefInput
            prefKey={config.amountPref}
            label={t('{{symbol}} held (optional)', { symbol: config.symbol })}
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
