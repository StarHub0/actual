import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { useFormat } from '#hooks/useFormat';

import { AccountSelect, PrefInput, SettingsRow } from './PrefInput';
import { ScheduleLine } from './ScheduleLine';
import { numeric, Stat, WidgetCard } from './ui';
import type { Portfolio } from './usePortfolio';

export function CdbCard({ portfolio }: { portfolio: Portfolio }) {
  const { t } = useTranslation();
  const format = useFormat();
  const [editing, setEditing] = useState(false);
  const { cdbMonthly, cdbYield, cdbContributed } = portfolio;

  return (
    <WidgetCard
      title="CDB Itaú"
      subtitle={
        portfolio.cdbRate == null
          ? t('CDI unavailable')
          : t('{{share}}% of CDI · {{rate}}% a.a.', {
              share: portfolio.cdiShare,
              rate: portfolio.cdbRate.toFixed(2),
            })
      }
      right={
        <Button variant="bare" onPress={() => setEditing(!editing)}>
          {editing ? t('Done') : t('Edit')}
        </Button>
      }
    >
      <Text style={{ ...numeric, fontSize: 32, fontWeight: 500 }}>
        {format(portfolio.cdbBalance, 'financial')}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
        <Stat
          label={<Trans>Invested</Trans>}
          value={
            cdbContributed == null ? '—' : format(cdbContributed, 'financial')
          }
        />
        <Stat
          label={<Trans>Yield</Trans>}
          value={
            cdbYield == null
              ? '—'
              : `${cdbYield >= 0 ? '+' : ''}${format(cdbYield, 'financial')}`
          }
          tone={cdbYield == null ? undefined : cdbYield >= 0 ? 'good' : 'bad'}
        />
        <Stat
          label={<Trans>Per month</Trans>}
          value={
            cdbMonthly == null ? '—' : `+${format(cdbMonthly, 'financial')}`
          }
          tone={cdbMonthly == null ? undefined : 'good'}
        />
      </View>

      <ScheduleLine next={portfolio.cdbNext} />

      {editing && (
        <SettingsRow>
          <AccountSelect
            prefKey="dashboard-cdb-account"
            label={t('CDB account')}
            accounts={portfolio.accounts}
            value={portfolio.cdbAccountId}
            emptyLabel={t('None')}
          />
          <PrefInput
            prefKey="dashboard-cdb-cdi"
            label={t('% of CDI')}
            placeholder="100"
          />
        </SettingsRow>
      )}
    </WidgetCard>
  );
}
