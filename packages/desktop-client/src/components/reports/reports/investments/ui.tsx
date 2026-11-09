import React from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

export const colors = {
  btc: '#f7931a',
  cdb: '#7d75f5',
  cash: '#56607a',
  up: '#34c77b',
  down: '#f05656',
};

export const numeric = { fontVariantNumeric: 'tabular-nums' } as const;

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <View
      style={{
        backgroundColor: theme.cardBackground,
        border: `1px solid ${theme.tableBorder}`,
        borderRadius: 16,
        padding: 20,
        minWidth: 0,
        boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
        ...style,
      }}
    >
      {children}
    </View>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: theme.pageTextSubdued,
      }}
    >
      {children}
    </Text>
  );
}

export function Chip({ value }: { value: number | null }) {
  if (value == null) return null;
  const up = value >= 0;
  return (
    <Text
      style={{
        ...numeric,
        fontSize: 12,
        fontWeight: 600,
        padding: '3px 9px',
        borderRadius: 20,
        color: up ? colors.up : colors.down,
        backgroundColor: up ? 'rgba(52,199,123,0.14)' : 'rgba(240,86,86,0.14)',
      }}
    >
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
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
    <View style={{ gap: 4, minWidth: 0 }}>
      <Label>{label}</Label>
      <Text
        style={{
          ...numeric,
          fontSize: 15,
          fontWeight: 600,
          color:
            tone === 'good'
              ? colors.up
              : tone === 'bad'
                ? colors.down
                : theme.pageText,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function AssetBadge({
  color,
  children,
  size = 36,
}: {
  color: string;
  children: ReactNode;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.45, fontWeight: 800 }}>
        {children}
      </Text>
    </View>
  );
}
