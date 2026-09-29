'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { LegalConsent } from '@/components/auth/LegalConsent';
import { OAuthProviderButtons } from '@/components/auth/OAuthProviderButtons';
import { PasswordRequirements } from '@/components/auth/PasswordRequirements';
import { UsernameInput } from '@/components/auth/UsernameInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiError } from '@/lib/api/client';
import { validatePassword, getPasswordErrorMessage } from '@/lib/passwords';
import type { UserType } from '@/lib/types/auth';

function capitalizeFirstChar(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

interface SignupFormProps {
  title: string;
  subtitle: string;
  firstNamePlaceholder?: string;
  lastNamePlaceholder?: string;
  nameLabel?: string;
  namePlaceholder?: string;
  usernamePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  submitLabel: string;
  alternateHref: string;
  alternatePrompt: string;
  alternateLabel: string;
  beforeForm?: React.ReactNode;
  oauthUserType: UserType;
  onSubmit: (values: {
    name: string;
    username: string;
    email: string;
    password: string;
    acceptedTerms: boolean;
  }) => Promise<void>;
}

export function SignupForm({
  title,
  subtitle,
  firstNamePlaceholder,
  lastNamePlaceholder,
  nameLabel,
  namePlaceholder,
  usernamePlaceholder,
  emailLabel,
  emailPlaceholder,
  submitLabel,
  alternateHref,
  alternatePrompt,
  alternateLabel,
  beforeForm,
  oauthUserType,
  onSubmit,
}: SignupFormProps) {
  const { t } = useLanguage();
  const singleNameField = Boolean(nameLabel);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.currentTarget.value;
    setPassword(value);
    setPasswordError(value ? getPasswordErrorMessage(value) : null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    if (!acceptedTerms) {
      setError(t('must_accept_terms'));
      setPending(false);
      return;
    }

    if (!usernameAvailable) {
      setError(t('username_already_taken'));
      setPending(false);
      return;
    }

    const strength = validatePassword(password);
    if (!strength.isValid) {
      setPasswordError(getPasswordErrorMessage(password));
      setPending(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwords_do_not_match'));
      setPending(false);
      return;
    }

    try {
      await onSubmit({
        name: singleNameField ? name.trim() : `${firstName.trim()} ${lastName.trim()}`.trim(),
        username,
        email,
        password,
        acceptedTerms,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('something_went_wrong'));
    } finally {
      setPending(false);
    }
  }

  const canSubmit =
    !pending &&
    (singleNameField ? name.trim() : firstName.trim() && lastName.trim()) &&
    username &&
    usernameAvailable &&
    email &&
    password &&
    !passwordError &&
    confirmPassword &&
    !passwordsMismatch &&
    acceptedTerms;

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
        <h1 className="text-2xl font-semibold text-landing-fg">{title}</h1>
        <p className="mt-2 text-sm text-landing-muted">{subtitle}</p>

        {beforeForm}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {singleNameField ? (
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-[color:var(--foreground)]">
                {nameLabel}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder={namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="mb-1.5 block text-sm font-semibold text-[color:var(--foreground)]">
                  {t('first_name')}
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  placeholder={firstNamePlaceholder}
                  value={firstName}
                  onChange={(e) => setFirstName(capitalizeFirstChar(e.target.value))}
                  className="auth-input"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1.5 block text-sm font-semibold text-[color:var(--foreground)]">
                  {t('last_name')}
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  placeholder={lastNamePlaceholder}
                  value={lastName}
                  onChange={(e) => setLastName(capitalizeFirstChar(e.target.value))}
                  className="auth-input"
                />
              </div>
            </div>
          )}

          <UsernameInput
            value={username}
            onChange={setUsername}
            onAvailabilityChange={setUsernameAvailable}
            placeholder={usernamePlaceholder}
          />

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[color:var(--foreground)]">
              {emailLabel}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder={emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[color:var(--foreground)]">
              {t('password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={handlePasswordChange}
              className={`auth-input ${
                passwordError ? 'border-destructive-fill focus:border-destructive-fill focus:ring-destructive-fill' : ''
              }`}
            />
            {passwordError && <p className="mt-1.5 text-sm text-destructive-text">{passwordError}</p>}
            <PasswordRequirements password={password} showRequirements={true} />
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
              className={`auth-input ${
                passwordsMismatch ? 'border-destructive-fill focus:border-destructive-fill focus:ring-destructive-fill' : ''
              }`}
            />
            {passwordsMismatch && <p className="mt-1.5 text-sm text-destructive-text">{t('passwords_do_not_match')}</p>}
          </div>

          <div className="space-y-5">
            <div className="auth-divider">
              <span>{t('or_continue_with_email')}</span>
            </div>
            <OAuthProviderButtons userType={oauthUserType} disabled={!acceptedTerms} />
          </div>

          <LegalConsent mode="signup" checked={acceptedTerms} onCheckedChange={setAcceptedTerms} />

          {error && <p className="alert-error">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? t('please_wait') : submitLabel}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-landing-muted">
          {alternatePrompt}{' '}
          <Link href={alternateHref} className="link-primary">
            {alternateLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
