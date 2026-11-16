import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { useFormat } from '#hooks/useFormat';

import { AccountSelect, PrefInput, SettingsRow } from './PrefInput';
import { ScheduleLine } from './ScheduleLine';
import { numeric, Stat, WidgetCard } from './ui';
import type { Portfolio } from './usePortfolio';

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function CdbCard({
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
  const [editing, setEditing] = useState(false);
  const { cdbMonthly, cdbYield, cdbContributed, holdings } = portfolio;
  const live = holdings != null;

  return (
    <WidgetCard
      accent="#ec7000"
      widgetId={widgetId}
      isEditing={isEditing}
      title="CDB Itaú"
      subtitle={
        live
          ? t('{{count}} active · synced from Itaú', { count: holdings.length })
          : t('Estimate from the Actual account')
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
          label={t('Per month (est.)')}
          value={
            cdbMonthly == null ? '—' : `+${format(cdbMonthly, 'financial')}`
          }
          tone={cdbMonthly == null ? undefined : 'good'}
        />
      </View>

      {live && (
        <View style={{ gap: 0 }}>
          {holdings.map(item => {
            const gain = Math.round((item.net - item.applied) * 100);
            return (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                  borderTop: `1px solid ${theme.tableBorder}`,
                }}
              >
                <View style={{ minWidth: 0 }}>
                  <Text style={{ ...numeric, fontSize: 15, fontWeight: 600 }}>
                    {format(Math.round(item.net * 100), 'financial')}
                  </Text>
                  <Text
                    style={{
                      ...styles.smallText,
                      color: theme.pageTextSubdued,
                    }}
                  >
                    {item.rate}% {item.rateType} ·{' '}
                    {t('due {{date}}', {
                      date: dateFormat.format(new Date(item.dueDate)),
                    })}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={{
                      ...numeric,
                      fontSize: 13,
                      color: theme.reportsNumberPositive,
                    }}
                  >
                    +{format(gain, 'financial')}
                  </Text>
                  <Text
                    style={{
                      ...styles.smallText,
                      color: theme.pageTextSubdued,
                    }}
                  >
                    {t('from {{amount}}', {
                      amount: format(
                        Math.round(item.applied * 100),
                        'financial',
                      ),
                    })}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {portfolio.holdingsError && (
        <Text style={{ ...styles.smallText, color: theme.errorText }}>
          <Trans>Could not read the Itaú CDBs. Check the token in Edit.</Trans>
        </Text>
      )}

      <ScheduleLine next={portfolio.cdbNext} />

      {editing && (
        <SettingsRow>
          <PrefInput
            prefKey="dashboard-opr-token"
            label={t('Itaú read token')}
            placeholder="..."
          />
          <PrefInput
            prefKey="dashboard-opr-url"
            label={t('Server URL')}
            placeholder="https://opr-production.up.railway.app"
          />
          <AccountSelect
            prefKey="dashboard-cdb-account"
            label={t('CDB account (fallback)')}
            accounts={portfolio.accounts}
            value={portfolio.cdbAccountId}
            emptyLabel={t('None')}
          />
        </SettingsRow>
      )}
    </WidgetCard>
  );
}
