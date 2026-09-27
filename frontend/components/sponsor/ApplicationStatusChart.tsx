'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ApplicationStatusBreakdown } from '@/lib/types/sponsor';

export function ApplicationStatusChart({ data }: { data: ApplicationStatusBreakdown }) {
  const { t } = useLanguage();

  const slices = [
    { key: 'pending', label: t('pending_short'), value: data.pending, color: 'var(--pop-sun)' },
    { key: 'approved', label: t('approved_short'), value: data.approved, color: 'var(--pop-mint)' },
    { key: 'rejected', label: t('rejected_short'), value: data.rejected, color: 'var(--pop-coral)' },
  ];

  const total = slices.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return <p className="text-sm text-muted">{t('no_applications_campaign')}</p>;
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="label"
            innerRadius={56}
            outerRadius={80}
            paddingAngle={0}
            isAnimationActive={false}
          >
            {slices.map((slice) => (
              <Cell key={slice.key} fill={slice.color} stroke="var(--outline)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value ?? 0}`, String(name ?? '')]}
            contentStyle={{
              borderRadius: 12,
              border: '2px solid var(--outline)',
              boxShadow: 'var(--shadow-hard-sm)',
              background: 'var(--card)',
              color: 'var(--foreground)',
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="sr-only">
        {slices.map((s) => `${s.label}: ${s.value}`).join(', ')}
      </p>
    </div>
  );
}
