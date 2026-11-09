import React, { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Input } from '@actual-app/components/input';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import type { AccountEntity } from '@actual-app/core/types/models';
import {
  Area,
  AreaChart,
  Cell,
  Tooltip as ChartTooltip,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';

import { Page } from '#components/Page';
import { useAccountBalances } from '#hooks/useAccountBalances';
import { useAccounts } from '#hooks/useAccounts';
import { useFormat } from '#hooks/useFormat';
import { useSyncedPref } from '#hooks/useSyncedPref';

import {
  brl,
  formatBtc,
  historyRanges,
  parseDecimal,
  toCents,
  useBitcoinHistory,
  useBitcoinQuote,
} from './bitcoinMarket';

const btcColor = '#f7931a';
const cdbColor = '#7d75f5';
const cashColor = '#4f566b';

const cardStyle = {
  backgroundColor: theme.cardBackground,
  border: `1px solid ${theme.tableBorder}`,
  borderRadius: 16,
  padding: 20,
  minWidth: 0,
} as const;

function Label({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: theme.pageTextSubdued,
      }}
    >
      {children}
    </Text>
  );
}

function Chip({ value }: { value: number | null }) {
  if (value == null) return null;
  const up = value >= 0;
  return (
    <Text
      style={{
        fontSize: 13,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 20,
        color: up ? theme.noticeTextLight : theme.errorText,
        backgroundColor: up ? 'rgba(52,199,123,0.14)' : 'rgba(240,86,86,0.14)',
      }}
    >
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
    </Text>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'good' | 'bad';
}) {
  return (
    <View style={{ gap: 4, minWidth: 120 }}>
      <Label>{label}</Label>
      <Text
        style={{
          fontSize: 18,
          fontWeight: 600,
          color:
            tone === 'good'
              ? theme.noticeTextLight
              : tone === 'bad'
                ? theme.errorText
                : theme.pageText,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function PrefInput({
  prefKey,
  label,
  placeholder,
  suffix,
}: {
  prefKey: 'dashboard-btc-amount' | 'dashboard-btc-cost' | 'dashboard-cdb-rate';
  label: string;
  placeholder: string;
  suffix?: string;
}) {
  const [stored = '', setStored] = useSyncedPref(prefKey);
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label
      style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}
    >
      <Label>{label}</Label>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Input
          value={draft ?? stored}
          placeholder={placeholder}
          inputMode="decimal"
          onChangeValue={setDraft}
          onUpdate={value => {
            setStored(value.trim());
            setDraft(null);
          }}
          style={{ flex: 1 }}
        />
        {suffix && (
          <Text style={{ color: theme.pageTextSubdued, fontSize: 13 }}>
            {suffix}
          </Text>
        )}
      </View>
    </label>
  );
}

type Allocation = { name: string; value: number; color: string };

function Hero({
  netWorth,
  invested,
  available,
  allocation,
}: {
  netWorth: number;
  invested: number;
  available: number;
  allocation: Allocation[];
}) {
  const { t } = useTranslation();
  const format = useFormat();
  const total = allocation.reduce((sum, slice) => sum + slice.value, 0);
  const investedShare = total > 0 ? (invested / total) * 100 : 0;
  return (
    <View
      style={{
        ...cardStyle,
        flex: '2 1 420px',
        backgroundImage: `linear-gradient(135deg, ${theme.pageBackgroundTopLeft}, ${theme.cardBackground} 70%)`,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ gap: 18, flex: '1 1 260px' }}>
        <View style={{ gap: 6 }}>
          <Label>
            <Trans>Net worth</Trans>
          </Label>
          <Text
            style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}
            data-testid="net-worth"
          >
            {format(netWorth, 'financial')}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 28 }}>
          <Metric label={t('Invested')} value={format(invested, 'financial')} />
          <Metric
            label={t('Available')}
            value={format(available, 'financial')}
          />
          <Metric
            label={t('In investments')}
            value={`${investedShare.toFixed(0)}%`}
          />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        <PieChart width={150} height={150}>
          <Pie
            data={
              total > 0
                ? allocation
                : [{ name: '', value: 1, color: cashColor }]
            }
            dataKey="value"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={total > 0 ? 3 : 0}
            stroke="none"
            isAnimationActive={false}
          >
            {(total > 0 ? allocation : [{ color: cashColor }]).map(
              (slice, index) => (
                <Cell key={index} fill={slice.color} />
              ),
            )}
          </Pie>
        </PieChart>
        <View style={{ gap: 10 }}>
          {allocation.map(slice => (
            <View
              key={slice.name}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 10,
                  backgroundColor: slice.color,
                }}
              />
              <Text style={{ fontSize: 13, color: theme.pageTextLight }}>
                {slice.name}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: 600 }}>
                {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function RangeTabs({
  days,
  onChange,
}: {
  days: number;
  onChange: (days: number) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 2,
        padding: 3,
        borderRadius: 10,
        backgroundColor: theme.tableHeaderBackground,
      }}
    >
      {historyRanges.map(range => (
        <button
          key={range.days}
          onClick={() => onChange(range.days)}
          style={{
            border: 'none',
            cursor: 'pointer',
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            color: days === range.days ? '#fff' : theme.pageTextSubdued,
            backgroundColor: days === range.days ? btcColor : 'transparent',
          }}
        >
          {range.label}
        </button>
      ))}
    </View>
  );
}

function BitcoinCard({ onValue }: { onValue: (cents: number) => void }) {
  const { t } = useTranslation();
  const format = useFormat();
  const [days, setDays] = useState(30);
  const quote = useBitcoinQuote();
  const history = useBitcoinHistory(days);
  const [amountText] = useSyncedPref('dashboard-btc-amount');
  const [costText] = useSyncedPref('dashboard-btc-cost');

  const amount = parseDecimal(amountText ?? '') ?? 0;
  const cost = parseDecimal(costText ?? '');
  const price = quote.data?.price ?? 0;
  const valueCents = toCents(amount * price);
  const costCents = cost == null ? null : toCents(cost);
  const profit =
    costCents != null && costCents > 0 ? valueCents - costCents : null;
  const profitPercent =
    profit != null && costCents ? (profit / costCents) * 100 : null;

  useEffect(() => onValue(valueCents), [onValue, valueCents]);

  const points = history.data ?? [];
  const first = points[0]?.price ?? 0;
  const last = points[points.length - 1]?.price ?? 0;
  const rangeChange = first > 0 ? ((last - first) / first) * 100 : null;
  const rising = last >= first;
  const lineColor = rising ? '#34c77b' : '#f05656';

  return (
    <View style={{ ...cardStyle, flex: '3 1 480px', gap: 18 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: btcColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>
              ₿
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: 600 }}>
              <Trans>Bitcoin</Trans>
            </Text>
            <Text style={{ fontSize: 12, color: theme.pageTextSubdued }}>
              BTC / BRL
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
            {quote.data ? brl.format(price) : quote.isError ? '—' : '...'}
          </Text>
          <Chip value={quote.data?.change24h ?? null} />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 13, color: theme.pageTextSubdued }}>
            {rangeChange != null
              ? `${rangeChange >= 0 ? '+' : ''}${rangeChange.toFixed(2)}%`
              : ''}
          </Text>
          <RangeTabs days={days} onChange={setDays} />
        </View>
        <View style={{ height: 220 }}>
          {history.isError ? (
            <Text style={{ color: theme.pageTextSubdued }}>
              <Trans>Price history unavailable</Trans>
            </Text>
          ) : (
            <AreaChart
              data={points}
              responsive
              style={{ width: '100%', height: '100%' }}
              margin={{ top: 6, right: 0, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="btcFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
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
                  new Date(Number(time)).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    hour: days <= 90 ? '2-digit' : undefined,
                    minute: days <= 90 ? '2-digit' : undefined,
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
              />
            </AreaChart>
          )}
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 16,
          paddingTop: 16,
          borderTop: `1px solid ${theme.tableBorder}`,
        }}
      >
        <PrefInput
          prefKey="dashboard-btc-amount"
          label={t('You hold')}
          placeholder="0,00000000"
          suffix="BTC"
        />
        <PrefInput
          prefKey="dashboard-btc-cost"
          label={t('Total paid')}
          placeholder="0,00"
          suffix="BRL"
        />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 28 }}>
        <Metric
          label={t('Position')}
          value={amount > 0 ? format(valueCents, 'financial') : '—'}
        />
        <Metric
          label={t('Amount')}
          value={amount > 0 ? `${formatBtc(amount)} BTC` : '—'}
        />
        <Metric
          label={t('Profit')}
          value={
            profit == null
              ? '—'
              : `${profit >= 0 ? '+' : ''}${format(profit, 'financial')}${
                  profitPercent != null ? ` (${profitPercent.toFixed(1)}%)` : ''
                }`
          }
          tone={profit == null ? undefined : profit >= 0 ? 'good' : 'bad'}
        />
      </View>
    </View>
  );
}

function CdbCard({
  accounts,
  accountId,
  balance,
}: {
  accounts: AccountEntity[];
  accountId: string;
  balance: number;
}) {
  const { t } = useTranslation();
  const format = useFormat();
  const [, setAccountId] = useSyncedPref('dashboard-cdb-account');
  const [rateText] = useSyncedPref('dashboard-cdb-rate');
  const rate = parseDecimal(rateText ?? '');
  const monthly =
    rate == null
      ? null
      : Math.round(balance * (Math.pow(1 + rate / 100, 1 / 12) - 1));
  const yearly = rate == null ? null : Math.round(balance * (rate / 100));
  return (
    <View style={{ ...cardStyle, flex: '2 1 320px', gap: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: '#ec7000',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: 800 }}>
            Itaú
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 16, fontWeight: 600 }}>CDB Itaú</Text>
          <Text style={{ fontSize: 12, color: theme.pageTextSubdued }}>
            <Trans>Fixed income</Trans>
          </Text>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Label>
          <Trans>Balance</Trans>
        </Label>
        <Text style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>
          {format(balance, 'financial')}
        </Text>
      </View>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Label>
          <Trans>Account</Trans>
        </Label>
        <select
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 8,
            background: theme.formInputBackground,
            color: theme.formInputText,
            border: `1px solid ${theme.formInputBorder}`,
          }}
        >
          <option value="">
            <Trans>Select</Trans>
          </option>
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </label>

      <PrefInput
        prefKey="dashboard-cdb-rate"
        label={t('Yearly rate')}
        placeholder="13,50"
        suffix="% p.a."
      />

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 28,
          paddingTop: 16,
          borderTop: `1px solid ${theme.tableBorder}`,
        }}
      >
        <Metric
          label={t('Per month')}
          value={monthly == null ? '—' : `+${format(monthly, 'financial')}`}
          tone={monthly == null ? undefined : 'good'}
        />
        <Metric
          label={t('Per year')}
          value={yearly == null ? '—' : `+${format(yearly, 'financial')}`}
          tone={yearly == null ? undefined : 'good'}
        />
      </View>
    </View>
  );
}

function AccountsCard({
  accounts,
  balances,
}: {
  accounts: AccountEntity[];
  balances: Record<string, number | null>;
}) {
  const format = useFormat();
  return (
    <View style={{ ...cardStyle, flex: '1 1 100%', gap: 4 }}>
      <Label>
        <Trans>Accounts</Trans>
      </Label>
      <View style={{ marginTop: 8 }}>
        {accounts.map(account => {
          const balance = balances[account.id] ?? 0;
          return (
            <View
              key={account.id}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: `1px solid ${theme.tableBorder}`,
              }}
            >
              <Text>{account.name}</Text>
              <Text
                style={{
                  fontWeight: 600,
                  color: balance < 0 ? theme.errorText : theme.pageText,
                }}
              >
                {format(balance, 'financial')}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { data: allAccounts = [] } = useAccounts();
  const accounts = useMemo(
    () => allAccounts.filter(account => !account.closed),
    [allAccounts],
  );
  const balances = useAccountBalances(accounts.map(account => account.id));
  const [storedCdbAccount] = useSyncedPref('dashboard-cdb-account');
  const cdbAccountId =
    storedCdbAccount ??
    accounts.find(account => /cdb|invest/i.test(account.name))?.id ??
    '';
  const [btcCents, setBtcCents] = useState(0);

  const cdbBalance = balances[cdbAccountId] ?? 0;
  const accountsTotal = accounts.reduce(
    (sum, account) => sum + (balances[account.id] ?? 0),
    0,
  );
  const cash = accountsTotal - cdbBalance;
  const invested = Math.max(cdbBalance, 0) + btcCents;

  const allocation: Allocation[] = [
    { name: 'CDB Itaú', value: Math.max(cdbBalance, 0), color: cdbColor },
    { name: 'Bitcoin', value: btcCents, color: btcColor },
    { name: t('Cash'), value: Math.max(cash, 0), color: cashColor },
  ];

  return (
    <Page header={t('Dashboard')} padding={20}>
      <View
        style={{
          gap: 20,
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          maxWidth: 1280,
        }}
      >
        <Hero
          netWorth={accountsTotal + btcCents}
          invested={invested}
          available={cash}
          allocation={allocation}
        />
        <BitcoinCard onValue={setBtcCents} />
        <CdbCard
          accounts={accounts}
          accountId={cdbAccountId}
          balance={cdbBalance}
        />
        <AccountsCard accounts={accounts} balances={balances} />
      </View>
    </Page>
  );
}
