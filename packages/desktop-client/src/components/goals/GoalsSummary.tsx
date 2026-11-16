import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { useFormat } from '#hooks/useFormat';

import { numeric } from './goalsUi';

function Tile({
  label,
  value,
  foot,
  accent,
}: {
  label: ReactNode;
  value: string;
  foot?: ReactNode;
  accent?: string;
}) {
  return (
    <View
      style={{
        flex: '1 1 200px',
        gap: 6,
        padding: '16px 18px',
        borderRadius: 14,
        backgroundColor: theme.cardBackground,
        border: `1px solid ${theme.tableBorder}`,
        borderTop: `3px solid ${accent ?? theme.pageTextLink}`,
        minWidth: 0,
      }}
    >
      <Text style={{ fontSize: 12.5, color: theme.pageTextSubdued }}>
        {label}
      </Text>
      <Text style={{ ...numeric, fontSize: 24, fontWeight: 700 }}>{value}</Text>
      {foot}
    </View>
  );
}

export function GoalsSummary({
  saved,
  target,
  monthly,
  reached,
  count,
}: {
  saved: number;
  target: number;
  monthly: number;
  reached: number;
  count: number;
}) {
  const { t } = useTranslation();
  const format = useFormat();
  const percent = target > 0 ? Math.min(100, (saved / target) * 100) : 0;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
      <Tile
        label=<Trans>Saved</Trans>
        value={format(saved, 'financial')}
        foot={
          <View
            style={{
              height: 6,
              borderRadius: 6,
              overflow: 'hidden',
              backgroundColor: theme.tableBorder,
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${percent}%`,
                backgroundColor: theme.pageTextLink,
              }}
            />
          </View>
        }
      />
      <Tile
        label=<Trans>Total price</Trans>
        value={format(target, 'financial')}
        accent="#f7931a"
        foot={
          <Text
            style={{ ...numeric, fontSize: 12.5, color: theme.pageTextSubdued }}
          >
            {t('{{percent}}% reached', { percent: Math.round(percent) })}
          </Text>
        }
      />
      <Tile
        label=<Trans>Needed per month</Trans>
        value={format(monthly, 'financial')}
        accent="#f0875a"
      />
      <Tile
        label=<Trans>Goals</Trans>
        value={`${reached}/${count}`}
        accent="#34c77b"
        foot={
          <Text style={{ fontSize: 12.5, color: theme.pageTextSubdued }}>
            <Trans>completed</Trans>
          </Text>
        }
      />
    </View>
  );
}
