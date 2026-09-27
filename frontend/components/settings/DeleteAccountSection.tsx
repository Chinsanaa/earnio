'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, deleteAccount } from '@/lib/api/client';
import { clearSessionCookies } from '@/lib/auth/session';
import { useLanguage } from '@/contexts/LanguageContext';

const CONFIRM_TEXT = 'DELETE';

export function DeleteAccountSection() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { t } = useLanguage();

  const canSubmit =
    password.length > 0 && confirmText === CONFIRM_TEXT && !pending;

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setPending(true);

    try {
      await deleteAccount(password);
      clearSessionCookies();
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete account');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="creator-panel-lg" style={{ borderColor: 'var(--destructive-fill)' }}>
      <h2 className="text-base font-semibold tracking-tight text-destructive-text">{t('delete_account')}</h2>
      <p className="mt-2 text-sm text-landing-muted">
        {t('delete_account_subtitle')}
      </p>

      <form onSubmit={handleDelete} className="mt-6 space-y-4">
        <div>
          <label htmlFor="delete-password" className="mb-2 block text-sm font-medium text-landing-fg">
            {t('current_password')}
          </label>
          <input
            id="delete-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            placeholder={t('enter_your_password')}
          />
        </div>

        <div>
          <label htmlFor="delete-confirm" className="mb-2 block text-sm font-medium text-landing-fg">
            {t('type_delete_to_confirm')}
          </label>
          <input
            id="delete-confirm"
            type="text"
            required
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="auth-input font-mono"
            placeholder={CONFIRM_TEXT}
            autoComplete="off"
          />
        </div>

        {error ? (
          <p className="alert-error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-xl border-2 border-outline bg-destructive-fill px-4 py-2.5 text-sm font-semibold text-destructive-fill-foreground shadow-hard-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? t('deleting_account') : t('delete_my_account')}
        </button>
      </form>
    </section>
  );
}
