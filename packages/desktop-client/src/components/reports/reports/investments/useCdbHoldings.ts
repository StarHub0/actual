import { useQuery } from '@tanstack/react-query';

import { useSyncedPref } from '#hooks/useSyncedPref';

export type CdbHolding = {
  id: string;
  name: string;
  status: string;
  applied: number;
  gross: number;
  net: number;
  taxes: number;
  rate: number;
  rateType: string;
  purchaseDate: string;
  dueDate: string;
};

export const defaultOprUrl = 'https://opr-production.up.railway.app';

export function useCdbHoldings() {
  const [storedUrl] = useSyncedPref('dashboard-opr-url');
  const [token] = useSyncedPref('dashboard-opr-token');
  const baseUrl = (storedUrl || defaultOprUrl).replace(/\/$/, '');

  return useQuery({
    queryKey: ['dashboard', 'cdb-holdings', baseUrl, token],
    enabled: !!token,
    refetchInterval: 10 * 60_000,
    staleTime: 5 * 60_000,
    retry: 1,
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/api/bank/read/investments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(String(response.status));
      const body = (await response.json()) as { investments: CdbHolding[] };
      return body.investments.filter(item => item.status === 'ACTIVE');
    },
  });
}
