'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import * as api from '@/lib/api/client';
import { ApiError } from '@/lib/api/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const { t } = useLanguage();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      await api.forgotPassword({ email });
      setSuccess(true);
      setEmail('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t('something_went_wrong')
      );
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="auth-card p-8 sm:p-10">
          <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-outline bg-tint-green text-tint-foreground shadow-hard-sm">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-landing-fg">{t('check_your_email')}</h1>
          <p className="mt-2 text-sm text-landing-muted">{t('password_reset_email_sent')} {email}</p>
          <p className="mt-4 text-sm text-landing-muted">
            {t('password_reset_instructions')}
          </p>

          <div className="mt-6 space-y-3">
            <Link
              href="/login/creator"
              className="block text-center text-sm font-medium text-primary hover:text-primary-hover"
            >
              {t('back_to_login')} →
            </Link>
            <button
              onClick={() => setSuccess(false)}
              className="w-full text-center text-sm font-medium text-landing-muted hover:text-landing-fg"
            >
              {t('try_different_email')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="auth-card p-8 sm:p-10">
        <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-outline bg-tint-blue text-tint-foreground shadow-hard-sm">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M3 12L21 4L14 21L11 13L3 12Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-landing-fg">{t('forgot_password')}</h1>
        <p className="mt-2 text-sm text-landing-muted">
          {t('forgot_password_subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-semibold text-[color:var(--foreground)]"
            >
              {t('email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              disabled={pending}
            />
          </div>

          {error && (
            <p className="alert-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            {pending ? t('please_wait') : t('send_reset_link')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-landing-muted">
          {t('remember_password')}{' '}
          <Link href="/login/creator" className="link-primary">
            {t('sign_in')}
          </Link>
        </p>
      </div>
    </div>
  );
}
