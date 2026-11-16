import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import { usePortfolio } from './usePortfolio';
import type { Portfolio } from './usePortfolio';

const PortfolioContext = createContext<Portfolio | null>(null);

function LoadedPortfolio({ children }: { children: ReactNode }) {
  const portfolio = usePortfolio();
  return (
    <PortfolioContext.Provider value={portfolio}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function InvestmentsProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return enabled ? <LoadedPortfolio>{children}</LoadedPortfolio> : children;
}

export function useSharedPortfolio() {
  const portfolio = useContext(PortfolioContext);
  if (!portfolio) throw new Error('InvestmentsProvider is missing');
  return portfolio;
}
