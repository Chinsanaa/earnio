import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface PlanTask {
  id: string;
  label: string;
  detail: string;
  done: boolean;
  href: string;
}

/**
 * Onboarding checklist with a solid segmented progress bar. The first
 * unfinished step is highlighted as the "next action".
 */
export function GettingStartedPlan({ tasks, title }: { tasks: PlanTask[]; title: string }) {
  const { t } = useLanguage();
  const completed = tasks.filter((task) => task.done).length;
  const nextId = tasks.find((task) => !task.done)?.id;

  return (
    <section className="creator-panel-lg" aria-labelledby="getting-started">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="getting-started" className="font-display text-xl font-bold tracking-tight text-landing-fg">
          {title}
        </h2>
        <p className="text-sm font-semibold text-landing-muted">
          {t('steps_complete').replace('{done}', String(completed)).replace('{total}', String(tasks.length))}
        </p>
      </div>

      <div
        className="mt-4 grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${tasks.length}, minmax(0, 1fr))` }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={tasks.length}
        aria-valuenow={completed}
      >
        {tasks.map((task) => (
          <span
            key={task.id}
            className={`h-3 rounded-full border-2 border-outline ${task.done ? 'bg-pop-lime' : 'bg-card'}`}
          />
        ))}
      </div>

      <ol className="mt-5 grid gap-3 md:grid-cols-3">
        {tasks.map((task, i) => {
          const isNext = task.id === nextId;
          return (
            <li key={task.id}>
              <Link
                href={task.href}
                className={`pop-press flex h-full items-start gap-3 rounded-xl border-2 p-4 ${
                  isNext
                    ? 'border-pop-foreground bg-pop-lime text-pop-foreground shadow-hard-sm'
                    : 'border-border bg-card text-landing-fg'
                }`}
                aria-current={isNext ? 'step' : undefined}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs font-bold ${
                    task.done ? 'border-outline bg-pop-mint text-pop-foreground' : 'border-current'
                  }`}
                  aria-hidden
                >
                  {task.done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-bold ${task.done ? 'line-through opacity-70' : ''}`}>
                    {task.label}
                  </span>
                  <span className={`mt-0.5 block text-sm ${isNext ? '' : 'text-landing-muted'}`}>{task.detail}</span>
                </span>
                {isNext ? <ArrowRight className="mt-0.5 size-4 shrink-0" aria-hidden /> : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
