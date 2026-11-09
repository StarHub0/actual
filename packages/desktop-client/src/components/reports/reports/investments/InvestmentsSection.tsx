import React from 'react';

import { View } from '@actual-app/components/view';

import { BitcoinCard } from './BitcoinCard';
import { CdbCard } from './CdbCard';
import { SummaryCard } from './SummaryCard';
import { usePortfolio } from './usePortfolio';

export function InvestmentsSection() {
  const portfolio = usePortfolio();

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        gap: 10,
        margin: '10px 10px 0',
      }}
    >
      <View style={{ flex: '1 1 360px', gap: 10, minWidth: 0 }}>
        <SummaryCard portfolio={portfolio} />
        <CdbCard portfolio={portfolio} />
      </View>
      <View style={{ flex: '1 1 360px', minWidth: 0 }}>
        <BitcoinCard portfolio={portfolio} />
      </View>
    </View>
  );
}
