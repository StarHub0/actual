import React from 'react';

import { theme } from '@actual-app/components/theme';
import {
  Area,
  Bar,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ComposedChart,
  XAxis,
  YAxis,
} from 'recharts';

import { brl } from './cryptoMarket';
import type { Candle, HistoryRange } from './cryptoMarket';

type CandleRow = Candle & { span: [number, number] };

function CandleShape(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: CandleRow;
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  if (!payload) return null;
  const { open, close, high, low } = payload;
  const color =
    close >= open ? theme.reportsNumberPositive : theme.reportsNumberNegative;
  const scale = high === low ? 0 : height / (high - low);
  const toY = (price: number) => y + (high - price) * scale;
  const bodyTop = toY(Math.max(open, close));
  const bodyHeight = Math.max(1, Math.abs(toY(open) - toY(close)));
  const center = x + width / 2;
  const bodyWidth = Math.max(1, width * 0.7);
  return (
    <g>
      <line x1={center} x2={center} y1={y} y2={y + height} stroke={color} />
      <rect
        x={center - bodyWidth / 2}
        y={bodyTop}
        width={bodyWidth}
        height={bodyHeight}
        fill={color}
      />
    </g>
  );
}

function tickLabel(time: number, range: HistoryRange) {
  const date = new Date(time);
  if (range.key === '1h' || range.key === '24h') {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  if (range.key === '7d') {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
    });
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function CandleTooltip({
  active,
  payload,
  range,
}: {
  active?: boolean;
  payload?: { payload: CandleRow }[];
  range: HistoryRange;
}) {
  if (!active || !payload?.length) return null;
  const c = payload[0].payload;
  const rows: [string, string][] = [
    ['O', brl.format(c.open)],
    ['H', brl.format(c.high)],
    ['L', brl.format(c.low)],
    ['C', brl.format(c.close)],
  ];
  return (
    <div
      style={{
        backgroundColor: theme.menuBackground,
        border: `1px solid ${theme.tableBorder}`,
        borderRadius: 4,
        padding: '6px 10px',
        color: theme.menuItemText,
        fontSize: 12,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <div style={{ color: theme.pageTextSubdued, marginBottom: 4 }}>
        {new Date(c.time).toLocaleString('pt-BR', {
          day: '2-digit',
          month: 'short',
          hour:
            range.key === '1y' || range.key === '90d' ? undefined : '2-digit',
          minute:
            range.key === '1y' || range.key === '90d' ? undefined : '2-digit',
        })}
      </div>
      {rows.map(([label, value]) => (
        <div
          key={label}
          style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}
        >
          <span style={{ color: theme.pageTextSubdued }}>{label}</span>
          <span>{value}</span>
        </div>
      ))}
    </div>
  );
}

export function CandleChart({
  candles,
  mode,
  range,
  height,
}: {
  candles: Candle[];
  mode: 'line' | 'candles';
  range: HistoryRange;
  height: number;
}) {
  const rows: CandleRow[] = candles.map(c => ({ ...c, span: [c.low, c.high] }));
  const low = Math.min(...candles.map(c => c.low));
  const high = Math.max(...candles.map(c => c.high));
  const pad = (high - low) * 0.05 || 1;
  const rising =
    (candles[candles.length - 1]?.close ?? 0) >= (candles[0]?.open ?? 0);
  const lineColor = rising
    ? theme.reportsNumberPositive
    : theme.reportsNumberNegative;

  return (
    <ComposedChart
      data={rows}
      responsive
      style={{ width: '100%', height }}
      margin={{ top: 6, right: 0, bottom: 0, left: 0 }}
    >
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.28} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid
        vertical={false}
        stroke={theme.tableBorder}
        strokeDasharray="3 5"
      />
      <XAxis
        dataKey="time"
        axisLine={false}
        tickLine={false}
        minTickGap={56}
        tick={{ fill: 'var(--color-pageTextSubdued)', fontSize: 11 }}
        tickFormatter={time => tickLabel(Number(time), range)}
      />
      <YAxis
        orientation="right"
        domain={[low - pad, high + pad]}
        axisLine={false}
        tickLine={false}
        width={62}
        tickCount={5}
        tick={{ fill: 'var(--color-pageTextSubdued)', fontSize: 11 }}
        tickFormatter={value =>
          Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
        }
      />
      <ChartTooltip
        cursor={{ stroke: theme.pageTextSubdued, strokeDasharray: '3 3' }}
        content={<CandleTooltip range={range} />}
      />
      {mode === 'line' ? (
        <Area
          type="monotone"
          dataKey="close"
          stroke={lineColor}
          strokeWidth={2}
          fill="url(#chartFill)"
          isAnimationActive={false}
          dot={false}
        />
      ) : (
        <Bar dataKey="span" shape={CandleShape} isAnimationActive={false} />
      )}
    </ComposedChart>
  );
}
