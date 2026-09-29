'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEmailVerification } from '@/hooks/useEmailVerification';

const SHOW_FLAG = 'earnio-show-verify';
const DISMISS_KEY = 'earnio-dismiss-verify-banner';

/**
 * Post-signup modal (session flag) + dismissible banner for unverified users.
 * Does not block app usage — verification is optional for the portfolio demo.
 */
export function EmailVerificationPrompt() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const { sending, verifying, error, sendVerificationEmail, verifyEmail, resendVerificationEmail } =
    useEmailVerification();
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user || user.isVerified) {
      setShowModal(false);
      setShowBanner(false);
      return;
    }

    let justSignedUp = false;
    try {
      justSignedUp = sessionStorage.getItem(SHOW_FLAG) === '1';
    } catch {
      justSignedUp = false;
    }

    if (justSignedUp) {
      setShowModal(true);
      return;
    }

    try {
      if (localStorage.getItem(DISMISS_KEY) === user.id) {
        setShowBanner(false);
        return;
      }
    } catch {
      // show banner if storage unavailable
    }
    setShowBanner(true);
  }, [user]);

  if (!user || user.isVerified) return null;

  function dismissModal() {
    try {
      sessionStorage.removeItem(SHOW_FLAG);
    } catch {
      // ignore
    }
    setShowModal(false);
    setShowBanner(true);
  }

  function dismissBanner() {
    try {
      localStorage.setItem(DISMISS_KEY, user!.id);
    } catch {
      // ignore
    }
    setShowBanner(false);
  }

  async function handleSend() {
    const ok = await (sent ? resendVerificationEmail() : sendVerificationEmail());
    if (ok) setSent(true);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const ok = await verifyEmail(code.trim());
    if (ok) {
      setDone(true);
      try {
        sessionStorage.removeItem(SHOW_FLAG);
      } catch {
        // ignore
      }
      await refreshUser();
      setShowModal(false);
      setShowBanner(false);
    }
  }

  const form = (
    <div className="space-y-4">
      <p className="text-sm text-landing-muted">{t('email_verification_subtitle')}</p>
      <button
        type="button"
        onClick={() => void handleSend()}
        disabled={sending}
        className="btn-primary w-auto px-6 disabled:opacity-50"
      >
        {sending ? t('sending') : sent ? t('resend_code') : t('send_verification_code')}
      </button>
      {sent ? (
        <form onSubmit={handleVerify} className="space-y-3">
          <label htmlFor="prompt-verify-code" className="block text-sm font-medium text-landing-fg">
            {t('verification_code')}
          </label>
          <input
            id="prompt-verify-code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="auth-input font-mono tracking-widest"
            placeholder="000000"
          />
          <button
            type="submit"
            disabled={verifying || code.length !== 6}
            className="btn-primary w-auto px-6 disabled:opacity-50"
          >
            {verifying ? t('verifying') : t('verify_email')}
          </button>
        </form>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive-text" role="alert">
          {error}
        </p>
      ) : null}
      {done ? (
        <p className="text-sm text-success-text" role="status">
          {t('email_verified_success')}
        </p>
      ) : null}
      {sent && !error && !done ? (
        <p className="text-sm text-landing-muted">{t('verification_code_sent')}</p>
      ) : null}
    </div>
  );

  return (
    <>
      {showBanner && !showModal ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-outline bg-tint-blue px-4 py-3 text-sm font-medium text-tint-foreground shadow-hard-sm">
          <p>{t('verify_email_banner')}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="font-bold text-tint-foreground underline"
              onClick={() => setShowModal(true)}
            >
              {t('verify_email')}
            </button>
            <button type="button" className="text-tint-foreground underline" onClick={dismissBanner}>
              {t('dismiss')}
            </button>
          </div>
        </div>
      ) : null}

      {showModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-verify-title"
        >
          <div className="creator-panel-lg w-full max-w-md shadow-lg">
            <h2
              id="email-verify-title"
              className="text-lg font-semibold tracking-tight text-landing-fg"
            >
              {t('verify_your_email')}
            </h2>
            <div className="mt-4">{form}</div>
            <button
              type="button"
              onClick={dismissModal}
              className="mt-6 text-sm text-landing-muted underline"
            >
              {t('continue_without_verifying')}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
