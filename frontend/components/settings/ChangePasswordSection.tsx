'use client';

import { useState } from 'react';
import { ApiError, changePassword } from '@/lib/api/client';
import { useLanguage } from '@/contexts/LanguageContext';

export function ChangePasswordSection() {
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t('all_fields_required'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('passwords_do_not_match'));
      return;
    }

    setPending(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(t('password_changed'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('password_change_failed'));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="creator-panel-lg">
      <h2 className="text-base font-semibold tracking-tight text-landing-fg">{t('change_password')}</h2>
      <p className="mt-2 text-sm text-landing-muted">{t('change_password_subtitle')}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="change-current-password" className="mb-2 block text-sm font-medium text-landing-fg">
            {t('current_password')}
          </label>
          <input
            id="change-current-password"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="auth-input"
          />
        </div>

        <div>
          <label htmlFor="change-new-password" className="mb-2 block text-sm font-medium text-landing-fg">
            {t('new_password')}
          </label>
          <input
            id="change-new-password"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="auth-input"
          />
        </div>

        <div>
          <label htmlFor="change-confirm-password" className="mb-2 block text-sm font-medium text-landing-fg">
            {t('confirm_password')}
          </label>
          <input
            id="change-confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="auth-input"
          />
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

        <button type="submit" disabled={pending} className="btn-primary w-auto px-6 disabled:opacity-50 disabled:cursor-not-allowed">
          {pending ? t('saving') : t('change_password')}
        </button>
      </form>
    </section>
  );
}
