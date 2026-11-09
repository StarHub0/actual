import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';

import { useFormat } from '#hooks/useFormat';
import { useLocale } from '#hooks/useLocale';
import { useNavigate } from '#hooks/useNavigate';

import { numeric } from './ui';
import type { NextContribution } from './useAccountInvestment';

export function ScheduleLine({ next }: { next: NextContribution | null }) {
  const { t } = useTranslation();
  const format = useFormat();
  const locale = useLocale();
  const navigate = useNavigate();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Text style={{ ...styles.smallText, color: theme.pageTextSubdued }}>
        {next
          ? t('Next deposit {{date}} · {{amount}}', {
              date: monthUtils.format(next.date, 'MMM d', locale),
              amount: format(next.amount, 'financial'),
            })
          : t('No deposit scheduled')}
        {next && next.count > 1 ? ` (+${next.count - 1})` : ''}
      </Text>
      <Button variant="bare" onPress={() => void navigate('/schedules')}>
        <span style={{ ...numeric, fontSize: 12 }}>
          <Trans>Schedules</Trans> ›
        </span>
      </Button>
    </View>
  );
}
