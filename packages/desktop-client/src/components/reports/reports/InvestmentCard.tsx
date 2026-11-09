import React from 'react';

import type { InvestmentWidget } from '@actual-app/core/types/models';

import { CdbCard } from './investments/CdbCard';
import { CryptoCard } from './investments/CryptoCard';
import { InvestmentSummaryCard } from './investments/InvestmentSummaryCard';
import { usePortfolio } from './investments/usePortfolio';

export function InvestmentCard({
  widgetId,
  isEditing,
  meta,
}: {
  widgetId: string;
  isEditing?: boolean;
  meta: InvestmentWidget['meta'];
}) {
  const portfolio = usePortfolio();

  switch (meta.asset) {
    case 'bitcoin':
      return (
        <CryptoCard
          asset="bitcoin"
          position={portfolio.bitcoin}
          accounts={portfolio.accounts}
          widgetId={widgetId}
          isEditing={isEditing}
        />
      );
    case 'litecoin':
      return (
        <CryptoCard
          asset="litecoin"
          position={portfolio.litecoin}
          accounts={portfolio.accounts}
          widgetId={widgetId}
          isEditing={isEditing}
        />
      );
    case 'cdb':
      return (
        <CdbCard
          portfolio={portfolio}
          widgetId={widgetId}
          isEditing={isEditing}
        />
      );
    default:
      return (
        <InvestmentSummaryCard
          portfolio={portfolio}
          widgetId={widgetId}
          isEditing={isEditing}
        />
      );
  }
}
