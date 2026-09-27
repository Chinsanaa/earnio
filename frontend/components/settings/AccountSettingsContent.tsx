'use client';

import { useState } from 'react';
import { DeleteAccountSection } from '@/components/settings/DeleteAccountSection';
import { LegalLinksSection } from '@/components/settings/LegalLinksSection';
import { ChangePasswordSection } from '@/components/settings/ChangePasswordSection';
import { EmailVerificationSection } from '@/components/settings/EmailVerificationSection';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiError, updateProfile } from '@/lib/api/client';
import { formatHandle } from '@/lib/format';
import type { AuthUser } from '@/lib/types/auth';

export function AccountSettingsContent({ user }: { user: AuthUser }) {
  const { t } = useLanguage();
  const { refreshUser } = useAuth();
  const [name, setName] = useState(user.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const nameChanged = name.trim() !== (user.name ?? '').trim();

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!nameChanged || pending) return;

    setError(null);
    setSuccess(null);
    setPending(true);

    try {
      await updateProfile({ name: name.trim() });
      await refreshUser();
      setSuccess(t('profile_updated'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('profile_update_failed'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section className="creator-panel-lg">
        <h2 className="text-base font-semibold tracking-tight text-landing-fg">{t('profile')}</h2>
        <div className="mt-5 flex items-center gap-4">
          <span className="creator-avatar creator-avatar-lg" aria-hidden>
            {(name?.[0] ?? user.username?.[0] ?? 'C').toUpperCase()}
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight text-landing-fg">
              {name.trim() || user.name || '—'}
            </p>
            <p className="text-sm text-landing-muted">
              {user.username ? formatHandle(user.username) : '—'} · {t('account_type')}:{' '}
              <span className="capitalize">{user.userType}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="mt-6 space-y-4 border-t-2 border-[color:var(--border)] pt-5">
          <div>
            <label htmlFor="settings-name" className="mb-2 block text-sm font-medium text-landing-muted">
              {t('name')}
            </label>
            <input
              id="settings-name"
              type="text"
              autoComplete="name"
              required
              maxLength={100}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSuccess(null);
                setError(null);
              }}
              className="auth-input"
            />
          </div>

          <div>
            <dt className="mb-2 block text-sm font-medium text-landing-muted">{t('email')}</dt>
            <dd className="text-sm text-landing-fg">{user.email}</dd>
          </div>

          <div>
            <dt className="mb-2 block text-sm font-medium text-landing-muted">{t('username')}</dt>
            <dd className="text-sm text-landing-fg">
              {user.username ? formatHandle(user.username) : '—'}
            </dd>
            <p className="mt-1 text-xs text-landing-muted">{t('username_immutable_hint')}</p>
          </div>

          {error ? (
            <p className="text-sm text-destructive-text" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm text-success-text" role="status">
              {success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!nameChanged || pending || !name.trim()}
            className="btn-primary w-auto px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? t('saving') : t('save_profile')}
          </button>
        </form>
      </section>

      <EmailVerificationSection user={user} />

      <ChangePasswordSection />

      <LegalLinksSection />

      <DeleteAccountSection />
    </div>
  );
}
