import { useLayoutEffect, useState } from 'react';

import * as monthUtils from '@actual-app/core/shared/months';

import { useSpreadsheet } from '#hooks/useSpreadsheet';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

export function useGoalBalances(
  categoryIds: string[],
  budgetType: string,
): Record<string, number> {
  const spreadsheet = useSpreadsheet();
  const [balances, setBalances] = useState<Record<string, number>>({});
  const key = [...new Set(categoryIds)].sort().join(',');

  useLayoutEffect(() => {
    if (key === '') return;
    const sheet = monthUtils.sheetForMonth(monthUtils.currentMonth());
    let mounted = true;
    const unbinds = key.split(',').map(categoryId =>
      spreadsheet.bind(
        sheet,
        budgetType === 'tracking'
          ? trackingBudget.catBalance(categoryId)
          : envelopeBudget.catBalance(categoryId),
        result => {
          if (!mounted) return;
          const value = typeof result.value === 'number' ? result.value : 0;
          setBalances(previous =>
            previous[categoryId] === value
              ? previous
              : { ...previous, [categoryId]: value },
          );
        },
      ),
    );
    return () => {
      mounted = false;
      unbinds.forEach(unbind => unbind());
    };
  }, [spreadsheet, key, budgetType]);

  return balances;
}
