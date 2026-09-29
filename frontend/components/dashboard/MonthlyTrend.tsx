'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMnt } from '@/lib/format';
import type { MonthlyEarnings } from '@/lib/types/dashboard';

export function MonthlyTrend({ data }: { data: MonthlyEarnings[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tickFormatter={(label: string) => label.split(' ')[0]}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          />
          <Tooltip
            cursor={false}
            formatter={(value) => formatMnt(Number(value ?? 0))}
            labelFormatter={(label) => String(label ?? '')}
            contentStyle={{
              borderRadius: 12,
              border: '2px solid var(--outline)',
              boxShadow: 'var(--shadow-hard-sm)',
              background: 'var(--card)',
              color: 'var(--foreground)',
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="amountMnt"
            stroke="var(--primary)"
            strokeWidth={3}
            fill="var(--primary-soft)"
            fillOpacity={1}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="sr-only">
        {data.map((m) => `${m.label}: ${formatMnt(m.amountMnt)}`).join(', ')}
      </p>
    </div>
  );
}
