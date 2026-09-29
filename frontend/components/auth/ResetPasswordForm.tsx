'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as api from '@/lib/api/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { PasswordRequirements } from '@/components/auth/PasswordRequirements';
import { validatePassword, getPasswordErrorMessage } from '@/lib/passwords';

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

export function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validateToken = useCallback(async () => {
    if (!token || !email) {
      setError(t('invalid_password_reset_link'));
      setTokenValidated(true);
      return;
    }

    try {
      const response = await api.verifyResetToken({ token, email });
      setIsValidToken(true);
      setExpiresIn(response.expiresIn);
      setTokenValidated(true);
    } catch (err) {
      setError(
        err instanceof api.ApiError
          ? err.message
          : t('password_reset_link_expired')
      );
      setTokenValidated(true);
    }
  }, [token, email, t]);

  useEffect(() => {
    if (!tokenValidated) {
      validateToken();
    }
  }, [validateToken, tokenValidated]);

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    const password = e.currentTarget.value;
    setNewPassword(password);
    if (password) {
      const errorMessage = getPasswordErrorMessage(password);
      setPasswordError(errorMessage);
    } else {
      setPasswordError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError(t('all_fields_required'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwords_do_not_match'));
      return;
    }

    const strength = validatePassword(newPassword);
    if (!strength.isValid) {
      setError(getPasswordErrorMessage(newPassword));
      return;
    }

    if (!token || !email) {
      setError(t('invalid_password_reset_link'));
      return;
    }

    setPending(true);

    try {
      await api.resetPassword({ token, email, newPassword });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof api.ApiError
          ? err.message
          : t('something_went_wrong')
      );
    } finally {
      setPending(false);
    }
  }

  if (!tokenValidated) {
    return (
      <div className="w-full max-w-md">
        <div className="auth-card p-8 sm:p-10">
          <div className="text-center">
            <p className="text-sm text-landing-muted">{t('verifying_password_reset_link')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="w-full max-w-md">
        <div className="auth-card p-8 sm:p-10">
          <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-outline bg-tint-red text-tint-foreground shadow-hard-sm">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m1 15h-2v-2h2v2m0-4h-2V7h2v6z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-landing-fg">{t('password_reset_link_expired')}</h1>
          <p className="mt-2 text-sm text-landing-muted">{error || t('request_new_password_reset')}</p>
          <a
            href="/reset-password"
            className="mt-6 inline-block text-sm font-medium text-primary hover:text-primary-hover"
          >
            {t('request_new_link')} →
          </a>
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
              d="M12 1L3 5v6c0 6 9 13 9 13s9-7 9-13V5l-9-4z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-landing-fg">{t('reset_password')}</h1>
        <p className="mt-2 text-sm text-landing-muted">
          {expiresIn ? (
            <>
              {t('password_reset_expires_in')}{' '}
              <span className="font-medium text-landing-fg">
                {Math.floor(expiresIn / 60)}:{(expiresIn % 60).toString().padStart(2, '0')}
              </span>
            </>
          ) : null}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="newPassword"
              className="mb-1.5 block text-sm font-semibold text-[color:var(--foreground)]"
            >
              {t('new_password')}
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              placeholder="••••••••"
              value={newPassword}
              onChange={handlePasswordChange}
              className={`auth-input ${
                passwordError ? 'border-destructive-fill focus:border-destructive-fill focus:ring-destructive-fill' : ''
              }`}
            />
            {passwordError && (
              <p className="mt-2 text-sm text-destructive-text">{passwordError}</p>
            )}
            <PasswordRequirements password={newPassword} showRequirements={true} />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-semibold text-[color:var(--foreground)]"
            >
              {t('confirm_password')}
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input"
            />
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-2 text-sm text-destructive-text">{t('passwords_do_not_match')}</p>
            )}
          </div>

          {error && (
            <p className="alert-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending || !!passwordError || newPassword !== confirmPassword}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            {pending ? t('please_wait') : t('reset_password')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-landing-muted">
          {t('remember_password')}{' '}
          <a href="/login/creator" className="link-primary">
            {t('sign_in')}
          </a>
        </p>
      </div>
    </div>
  );
}
