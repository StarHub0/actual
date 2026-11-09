import { useState } from 'react';
import type { ReactNode } from 'react';

import { Input } from '@actual-app/components/input';
import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import type { AccountEntity } from '@actual-app/core/types/models';

import { NON_DRAGGABLE_AREA_CLASS_NAME } from '#components/reports/constants';
import { useSyncedPref } from '#hooks/useSyncedPref';

type DecimalPref =
  | 'dashboard-btc-amount'
  | 'dashboard-btc-cost'
  | 'dashboard-ltc-amount'
  | 'dashboard-ltc-cost'
  | 'dashboard-cdb-cdi';

type AccountPref =
  | 'dashboard-btc-account'
  | 'dashboard-ltc-account'
  | 'dashboard-cdb-account';

const labelStyle = { ...styles.smallText, color: theme.pageTextSubdued };

export function PrefInput({
  prefKey,
  label,
  placeholder,
}: {
  prefKey: DecimalPref;
  label: string;
  placeholder: string;
}) {
  const [stored = '', setStored] = useSyncedPref(prefKey);
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label
      style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}
    >
      <Text style={labelStyle}>{label}</Text>
      <Input
        value={draft ?? stored}
        placeholder={placeholder}
        inputMode="decimal"
        onChangeValue={setDraft}
        onUpdate={value => {
          setStored(value.trim());
          setDraft(null);
        }}
        style={{ minWidth: 0 }}
      />
    </label>
  );
}

export function AccountSelect({
  prefKey,
  label,
  accounts,
  value,
  emptyLabel,
}: {
  prefKey: AccountPref;
  label: string;
  accounts: AccountEntity[];
  value: string;
  emptyLabel: string;
}) {
  const [, setAccount] = useSyncedPref(prefKey);
  return (
    <label
      style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}
    >
      <Text style={labelStyle}>{label}</Text>
      <select
        value={value}
        onChange={e => setAccount(e.target.value)}
        style={{
          padding: 8,
          borderRadius: 4,
          minWidth: 0,
          background: theme.formInputBackground,
          color: theme.formInputText,
          border: `1px solid ${theme.formInputBorder}`,
        }}
      >
        <option value="">{emptyLabel}</option>
        {accounts.map(account => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SettingsRow({ children }: { children: ReactNode }) {
  return (
    <div className={NON_DRAGGABLE_AREA_CLASS_NAME}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
          paddingTop: 14,
          borderTop: `1px solid ${theme.tableBorder}`,
        }}
      >
        {children}
      </View>
    </div>
  );
}
