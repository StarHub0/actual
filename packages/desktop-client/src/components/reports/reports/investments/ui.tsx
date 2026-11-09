import React from 'react';
import type { ReactNode } from 'react';

import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { ReportCard } from '#components/reports/ReportCard';

export const colors = {
  btc: '#f7931a',
  ltc: '#6f8fd8',
  cdb: theme.pageTextLink,
  cash: theme.pageTextSubdued,
};

export const numeric = { fontVariantNumeric: 'tabular-nums' } as const;

export function WidgetCard({
  widgetId,
  isEditing,
  title,
  subtitle,
  right,
  children,
}: {
  widgetId: string;
  isEditing?: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <ReportCard widgetId={widgetId} isEditing={isEditing}>
      <View
        style={{
          padding: 20,
          gap: 14,
          height: '100%',
          overflowY: 'auto',
          minWidth: 0,
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
            <Text style={{ ...styles.mediumText, fontWeight: 500 }}>
              {title}
            </Text>
            {subtitle && (
              <Text
                style={{ ...styles.smallText, color: theme.pageTextSubdued }}
              >
                {subtitle}
              </Text>
            )}
          </View>
          {right}
        </View>
        {children}
      </View>
    </ReportCard>
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
