import React, { useState } from 'react';

import { Input } from '@actual-app/components/input';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { useSyncedPref } from '#hooks/useSyncedPref';

import { Label } from './ui';

type DecimalPref =
  | 'dashboard-btc-amount'
  | 'dashboard-btc-cost'
  | 'dashboard-cdb-rate';

export function PrefInput({
  prefKey,
  label,
  placeholder,
  suffix,
}: {
  prefKey: DecimalPref;
  label: string;
  placeholder: string;
  suffix: string;
}) {
  const [stored = '', setStored] = useSyncedPref(prefKey);
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label
      style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}
    >
      <Label>{label}</Label>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Input
          value={draft ?? stored}
          placeholder={placeholder}
          inputMode="decimal"
          onChangeValue={setDraft}
          onUpdate={value => {
            setStored(value.trim());
            setDraft(null);
          }}
          style={{ flex: 1, minWidth: 0 }}
        />
        <Text style={{ color: theme.pageTextSubdued, fontSize: 12 }}>
          {suffix}
        </Text>
      </View>
    </label>
  );
}
