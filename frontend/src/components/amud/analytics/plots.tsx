'use client';

/*
 * The recharts drawing for every Amud chart. recharts is the heaviest client
 * dependency of the dashboards (~320 KB of JavaScript), so this module is only
 * reached through `lazyPlots.tsx`: the cards, legends and empty states render
 * immediately and the plots stream in afterwards, inside a box that already has
 * their final height.
 */
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Funnel, FunnelChart, LabelList, Line, LineChart, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { compactTick } from './axisFormat';

type Row = Record<string, string | number>;
type Series = { key: string; label: string; color: string };
type Slice = { label: string; value: number; color: string };

export function BarPlot({ data, series, xKey, height, horizontal, stacked, unit }: {
  data: Row[]; series: Series[]; xKey: string; height: number; horizontal: boolean; stacked: boolean; unit?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 8, left: horizontal ? 8 : -4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--amud-outline-variant)" horizontal={!horizontal} vertical={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fill: 'var(--amud-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey={xKey} width={90} tick={{ fill: 'var(--amud-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fill: 'var(--amud-on-surface-variant)', fontSize: 12 }} axisLine={{ stroke: 'var(--amud-outline-variant)' }} tickLine={false} interval={0} angle={data.length > 6 ? -25 : 0} textAnchor={data.length > 6 ? 'end' : 'middle'} height={data.length > 6 ? 46 : 24} />
            <YAxis tick={{ fill: 'var(--amud-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} width={40} tickFormatter={compactTick} />
          </>
        )}
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--amud-surface-container-high)' }} />
        {series.map((s, i) => {
          const isTop = !stacked || i === series.length - 1;
          const radius: [number, number, number, number] = !isTop ? [0, 0, 0, 0] : horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0];
          return <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={radius} maxBarSize={40} stackId={stacked ? 'stack' : undefined} unit={unit} />;
        })}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LinePlot({ data, series, xKey, height, unit, yDomain }: {
  data: Row[]; series: Series[]; xKey: string; height: number; unit?: string; yDomain?: [number, number];
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--amud-outline-variant)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: 'var(--amud-on-surface-variant)', fontSize: 12 }} axisLine={{ stroke: 'var(--amud-outline-variant)' }} tickLine={false} />
        <YAxis tick={{ fill: 'var(--amud-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} width={40} tickFormatter={compactTick} domain={yDomain ?? [0, 'auto']} />
        <Tooltip content={<ChartTooltip />} />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={data.length <= 12 ? { r: 3 } : false} activeDot={{ r: 5 }} unit={unit} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AreaPlot({ data, series, xKey, height, unit, gradientPrefix }: {
  data: Row[]; series: Series[]; xKey: string; height: number; unit?: string; gradientPrefix: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`${gradientPrefix}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--amud-outline-variant)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: 'var(--amud-on-surface-variant)', fontSize: 12 }} axisLine={{ stroke: 'var(--amud-outline-variant)' }} tickLine={false} />
        <YAxis tick={{ fill: 'var(--amud-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} width={40} tickFormatter={compactTick} />
        <Tooltip content={<ChartTooltip />} />
        {series.map((s) => (
          <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} fill={`url(#${gradientPrefix}-${s.key})`} unit={unit} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DonutPlot({ slices, height }: { slices: Slice[]; height: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={slices} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="90%" paddingAngle={2} stroke="var(--amud-surface-container-lowest)" strokeWidth={2}>
          {slices.map((entry) => (
            <Cell key={entry.label} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function FunnelPlot({ stages, height }: { stages: Slice[]; height: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <FunnelChart>
        <Tooltip content={<ChartTooltip />} />
        <Funnel dataKey="value" data={stages} isAnimationActive>
          {stages.map((entry) => (
            <Cell key={entry.label} fill={entry.color} />
          ))}
          <LabelList position="right" dataKey="label" fill="var(--amud-on-surface-variant)" stroke="none" fontSize={12} />
          <LabelList position="center" dataKey="value" fill="#ffffff" stroke="none" fontSize={13} fontWeight={700} />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}

export function GaugePlot({ data }: { data: { name: string; value: number; fill: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart innerRadius="72%" outerRadius="100%" data={data} startAngle={90} endAngle={-270} barSize={12}>
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar background={{ fill: 'var(--amud-surface-container-high)' }} dataKey="value" cornerRadius={8} />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
