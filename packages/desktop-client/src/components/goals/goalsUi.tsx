import React from 'react';
import type { ReactNode } from 'react';

import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import type { GoalPriority } from './goalsModel';

export const priorityColor: Record<GoalPriority, string> = {
  high: '#f0875a',
  medium: '#7d75f5',
  low: '#8a90a6',
};

export const numeric = { fontVariantNumeric: 'tabular-nums' } as const;

export function ProgressRing({
  percent,
  reached,
  size = 76,
}: {
  percent: number;
  reached: boolean;
  size?: number;
}) {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = reached ? '#34c77b' : theme.pageTextLink;
  return (
    <View style={{ width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.tableBorder}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          style={{ transition: 'stroke-dashoffset .5s' }}
        />
      </svg>
      <View
        style={{
          position: 'absolute',
          inset: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ ...numeric, fontSize: 16, fontWeight: 700 }}>
          {Math.round(percent)}%
        </Text>
      </View>
    </View>
  );
}

export function Pill({
  children,
  color,
  solid,
}: {
  children: ReactNode;
  color?: string;
  solid?: boolean;
}) {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
        color: solid ? '#fff' : (color ?? theme.pageTextSubdued),
        backgroundColor: solid
          ? color
          : 'color-mix(in srgb, currentColor 14%, transparent)',
      }}
    >
      {children}
    </Text>
  );
}

export function Segment<T extends string>({
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
        padding: 3,
        gap: 2,
        borderRadius: 10,
        backgroundColor: theme.tableRowHeaderBackground,
      }}
    >
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          style={{
            border: 'none',
            cursor: 'pointer',
            padding: '5px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: value === option.value ? 600 : 400,
            color:
              value === option.value ? theme.pageText : theme.pageTextSubdued,
            backgroundColor:
              value === option.value ? theme.tableBackground : 'transparent',
            boxShadow:
              value === option.value ? '0 1px 3px rgba(0,0,0,.3)' : 'none',
          }}
        >
          {option.label}
        </button>
      ))}
    </View>
  );
}
