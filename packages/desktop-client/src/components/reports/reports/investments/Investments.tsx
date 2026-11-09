import React from 'react';
import { useTranslation } from 'react-i18next';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { View } from '@actual-app/components/view';

import { MobileBackButton } from '#components/mobile/MobileBackButton';
import { MobilePageHeader, Page, PageHeader } from '#components/Page';
import { useNavigate } from '#hooks/useNavigate';

import { BitcoinCard } from './BitcoinCard';
import { CdbCard } from './CdbCard';
import { SummaryCard } from './SummaryCard';
import { usePortfolio } from './usePortfolio';

export function Investments() {
  const { t } = useTranslation();
  const { isNarrowWidth } = useResponsive();
  const navigate = useNavigate();
  const portfolio = usePortfolio();

  return (
    <Page
      header={
        isNarrowWidth ? (
          <MobilePageHeader
            title={t('Investments')}
            leftContent={
              <MobileBackButton onPress={() => navigate('/reports')} />
            }
          />
        ) : (
          <PageHeader title={t('Investments')} />
        )
      }
      padding={20}
    >
      <View style={{ gap: 16, maxWidth: 1000, width: '100%' }}>
        <SummaryCard portfolio={portfolio} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          <BitcoinCard portfolio={portfolio} />
          <CdbCard portfolio={portfolio} />
        </View>
      </View>
    </Page>
  );
}
