'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

/*
 * Lazy entry points for `plots.tsx`. Each slot keeps the plot's final height
 * while recharts loads, so the cards never shift when the drawing appears.
 */
const placeholder = () => <div aria-hidden="true" className="h-full w-full animate-pulse rounded-lg bg-amud-surface-container-low" />;

const LazyBar = dynamic(() => import('./plots').then((m) => m.BarPlot), { ssr: false, loading: placeholder });
const LazyLine = dynamic(() => import('./plots').then((m) => m.LinePlot), { ssr: false, loading: placeholder });
const LazyArea = dynamic(() => import('./plots').then((m) => m.AreaPlot), { ssr: false, loading: placeholder });
const LazyDonut = dynamic(() => import('./plots').then((m) => m.DonutPlot), { ssr: false, loading: placeholder });
const LazyFunnel = dynamic(() => import('./plots').then((m) => m.FunnelPlot), { ssr: false, loading: placeholder });
const LazyGauge = dynamic(() => import('./plots').then((m) => m.GaugePlot), { ssr: false, loading: placeholder });

export const BarPlot = (props: ComponentProps<typeof LazyBar>) => <div style={{ height: props.height }}><LazyBar {...props} /></div>;
export const LinePlot = (props: ComponentProps<typeof LazyLine>) => <div style={{ height: props.height }}><LazyLine {...props} /></div>;
export const AreaPlot = (props: ComponentProps<typeof LazyArea>) => <div style={{ height: props.height }}><LazyArea {...props} /></div>;
export const DonutPlot = (props: ComponentProps<typeof LazyDonut>) => <div style={{ height: props.height }}><LazyDonut {...props} /></div>;
export const FunnelPlot = (props: ComponentProps<typeof LazyFunnel>) => <div style={{ height: props.height }}><LazyFunnel {...props} /></div>;
export const GaugePlot = (props: ComponentProps<typeof LazyGauge>) => <div className="h-full w-full"><LazyGauge {...props} /></div>;
