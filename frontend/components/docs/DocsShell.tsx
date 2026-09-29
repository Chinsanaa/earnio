import Link from 'next/link';
import { EarnioLogo } from '@/components/brand/EarnioLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { DocsNav } from '@/components/docs/DocsNav';

export function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-ambient flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b-2 border-[color:var(--outline)] bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-4">
            <Link href="/">
              <EarnioLogo iconClassName="h-7 w-7" />
            </Link>
            <span className="hidden text-muted sm:inline">/</span>
            <Link
              href="/docs"
              className="hidden text-sm font-medium text-muted hover:text-foreground sm:inline"
            >
              Docs
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="btn-secondary min-h-10 px-3 text-sm">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8 lg:flex-row lg:py-10">
        <aside className="lg:w-56 lg:shrink-0">
          <p className="text-label mb-3">Guides</p>
          <DocsNav />
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
