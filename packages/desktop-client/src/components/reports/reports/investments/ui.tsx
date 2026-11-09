import React from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

export const colors = {
  btc: '#f7931a',
  cdb: theme.pageTextLink,
  cash: theme.pageTextSubdued,
};

export const numeric = { fontVariantNumeric: 'tabular-nums' } as const;

export function WidgetCard({
  title,
  subtitle,
  right,
  children,
  style,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <View
      style={{
        backgroundColor: theme.tableBackground,
        borderRadius: 2,
        boxShadow: '0 2px 6px rgba(0, 0, 0, .15)',
        padding: 20,
        minWidth: 0,
        gap: 14,
        ...style,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <View style={{ minWidth: 0 }}>
          <Text style={{ ...styles.mediumText, fontWeight: 500 }}>{title}</Text>
          {subtitle && (
            <Text style={{ ...styles.smallText, color: theme.pageTextSubdued }}>
              {subtitle}
            </Text>
          )}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Chip({ value }: { value: number | null }) {
  if (value == null) return null;
  return (
    <Text
      style={{
        ...numeric,
        fontSize: 12,
        fontWeight: 500,
        color:
          value >= 0
            ? theme.reportsNumberPositive
            : theme.reportsNumberNegative,
      }}
    >
      {value >= 0 ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
    </Text>
  );
}

export function Stat({
  label,
  value,
  tone,
}: {
  label: ReactNode;
  value: string;
  tone?: 'good' | 'bad';
}) {
  return (
    <View style={{ gap: 2, minWidth: 0 }}>
      <Text style={{ ...styles.smallText, color: theme.pageTextSubdued }}>
        {label}
      </Text>
      <Text
        style={{
          ...numeric,
          fontSize: 15,
          fontWeight: 500,
          color:
            tone === 'good'
              ? theme.reportsNumberPositive
              : tone === 'bad'
                ? theme.reportsNumberNegative
                : theme.pageText,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: theme.tableBorder }} />;
}
