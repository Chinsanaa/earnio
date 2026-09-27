'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import type { AuthUser } from '@/lib/types/auth';

export function EmailVerificationSection({ user }: { user: AuthUser }) {
  const { t } = useLanguage();
  const { refreshUser } = useAuth();
  const { sending, verifying, error, sendVerificationEmail, verifyEmail, resendVerificationEmail } =
    useEmailVerification();
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [localSuccess, setLocalSuccess] = useState(false);

  if (user.isVerified) {
    return (
      <section className="creator-panel-lg">
        <h2 className="text-base font-semibold tracking-tight text-landing-fg">
          {t('email_verification')}
        </h2>
        <p className="mt-2 text-sm text-success-text">{t('email_verified')}</p>
      </section>
    );
  }

  async function handleSend() {
    setLocalSuccess(false);
    const ok = await sendVerificationEmail();
    if (ok) setSent(true);
  }

  async function handleResend() {
    setLocalSuccess(false);
    const ok = await resendVerificationEmail();
    if (ok) setSent(true);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLocalSuccess(false);
    const ok = await verifyEmail(code.trim());
    if (ok) {
      setLocalSuccess(true);
      setCode('');
      await refreshUser();
    }
  }

  return (
    <section className="creator-panel-lg">
      <h2 className="text-base font-semibold tracking-tight text-landing-fg">
        {t('email_verification')}
      </h2>
      <p className="mt-2 text-sm text-landing-muted">{t('email_verification_subtitle')}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void (sent ? handleResend() : handleSend())}
          disabled={sending}
          className="btn-primary w-auto px-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? t('sending') : sent ? t('resend_code') : t('send_verification_code')}
        </button>
      </div>

      {sent ? (
        <form onSubmit={handleVerify} className="mt-5 space-y-4">
          <div>
            <label htmlFor="verify-code" className="mb-2 block text-sm font-medium text-landing-fg">
              {t('verification_code')}
            </label>
            <input
              id="verify-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="auth-input font-mono tracking-widest"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={verifying || code.length !== 6}
            className="btn-primary w-auto px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifying ? t('verifying') : t('verify_email')}
          </button>
        </form>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-destructive-text" role="alert">
          {error}
        </p>
      ) : null}
      {localSuccess ? (
        <p className="mt-3 text-sm text-success-text" role="status">
          {t('email_verified_success')}
        </p>
      ) : null}
      {sent && !error && !localSuccess ? (
        <p className="mt-3 text-sm text-landing-muted" role="status">
          {t('verification_code_sent')}
        </p>
      ) : null}
    </section>
  );
}
