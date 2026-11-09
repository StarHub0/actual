import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { useFormat } from '#hooks/useFormat';
import { useSyncedPref } from '#hooks/useSyncedPref';

import { PrefInput } from './PrefInput';
import { AssetBadge, Card, Label, numeric, Stat } from './ui';
import type { Portfolio } from './usePortfolio';

export function CdbCard({ portfolio }: { portfolio: Portfolio }) {
  const format = useFormat();
  const [, setCdbAccount] = useSyncedPref('dashboard-cdb-account');
  const { cdbMonthly, cdbYearly } = portfolio;

  return (
    <Card style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <AssetBadge color="#ec7000">I</AssetBadge>
        <View>
          <Text style={{ fontSize: 15, fontWeight: 600 }}>CDB Itaú</Text>
          <Text style={{ fontSize: 12, color: theme.pageTextSubdued }}>
            <Trans>Fixed income</Trans>
          </Text>
        </View>
      </View>

      <View style={{ gap: 4 }}>
        <Label>
          <Trans>Balance</Trans>
        </Label>
        <Text
          style={{
            ...numeric,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: -0.6,
          }}
        >
          {format(portfolio.cdbBalance, 'financial')}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 24 }}>
        <Stat
          label={<Trans>Per month</Trans>}
          value={
            cdbMonthly == null ? '—' : `+${format(cdbMonthly, 'financial')}`
          }
          tone={cdbMonthly == null ? undefined : 'good'}
        />
        <Stat
          label={<Trans>Per year</Trans>}
          value={cdbYearly == null ? '—' : `+${format(cdbYearly, 'financial')}`}
          tone={cdbYearly == null ? undefined : 'good'}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          paddingTop: 14,
          borderTop: `1px solid ${theme.tableBorder}`,
        }}
      >
        <label
          style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}
        >
          <Label>
            <Trans>Account</Trans>
          </Label>
          <select
            value={portfolio.cdbAccountId}
            onChange={e => setCdbAccount(e.target.value)}
            style={{
              padding: 8,
              borderRadius: 8,
              minWidth: 0,
              background: theme.formInputBackground,
              color: theme.formInputText,
              border: `1px solid ${theme.formInputBorder}`,
            }}
          >
            <option value="">
              <Trans>Select</Trans>
            </option>
            {portfolio.accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
        <PrefInput
          prefKey="dashboard-cdb-rate"
          label="% p.a."
          placeholder="13,50"
          suffix=""
        />
      </View>
    </Card>
  );
}
