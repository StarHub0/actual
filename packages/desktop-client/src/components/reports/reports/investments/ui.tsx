import React from 'react';
import type { ReactNode } from 'react';

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
  accent,
  widgetId,
  isEditing,
  title,
  subtitle,
  right,
  children,
}: {
  accent?: string;
  widgetId: string;
  isEditing?: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <ReportCard widgetId={widgetId} isEditing={isEditing}>
      {accent && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: accent,
            zIndex: 1,
          }}
        />
      )}
      <View
        style={{
          padding: '22px 22px 20px',
          gap: 14,
          height: '100%',
          overflowY: 'auto',
          minWidth: 0,
          '& > *': { flexShrink: 0 },
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
            <Text style={{ fontSize: 17, fontWeight: 600 }}>{title}</Text>
            {subtitle && (
              <Text style={{ fontSize: 12.5, color: theme.pageTextSubdued }}>
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
      <Text style={{ fontSize: 12, color: theme.pageTextSubdued }}>
        {label}
      </Text>
      <Text
        style={{
          ...numeric,
          fontSize: 16,
          fontWeight: 600,
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

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        padding: 2,
        gap: 2,
        borderRadius: 6,
        backgroundColor: theme.tableRowHeaderBackground,
      }}
    >
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          style={{
            border: 'none',
            cursor: 'pointer',
            padding: '3px 9px',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: value === option.value ? 600 : 400,
            color:
              value === option.value ? theme.pageText : theme.pageTextSubdued,
            backgroundColor:
              value === option.value ? theme.tableBackground : 'transparent',
            boxShadow:
              value === option.value ? '0 1px 2px rgba(0,0,0,.25)' : 'none',
          }}
        >
          {option.label}
        </button>
      ))}
    </View>
  );
}
