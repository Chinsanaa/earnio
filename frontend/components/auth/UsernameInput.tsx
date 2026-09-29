'use client';

import { useCallback, useEffect, useState } from 'react';
import * as api from '@/lib/api/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  onAvailabilityChange?: (available: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function UsernameInput({
  value,
  onChange,
  onAvailabilityChange,
  disabled,
  placeholder = 'creator_handle',
}: UsernameInputProps) {
  const { t } = useLanguage();
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const checkAvailability = useCallback(
    async (username: string) => {
      if (!username.trim()) {
        setIsAvailable(null);
        onAvailabilityChange?.(false);
        return;
      }

      setIsChecking(true);
      try {
        const result = await api.checkUsernameAvailability(username);
        setIsAvailable(result.available);
        onAvailabilityChange?.(result.available);
      } catch {
        setIsAvailable(null);
        onAvailabilityChange?.(false);
      } finally {
        setIsChecking(false);
      }
    },
    [onAvailabilityChange]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value) {
        checkAvailability(value);
      } else {
        setIsAvailable(null);
        onAvailabilityChange?.(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, checkAvailability, onAvailabilityChange]);

  return (
    <div>
      <label
        htmlFor="username"
        className="mb-1.5 block text-sm font-semibold text-[color:var(--foreground)]"
      >
        {t('username')}
      </label>
      <div className="relative">
        <input
          id="username"
          name="username"
          type="text"
          required
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`auth-input pr-10 ${
            isAvailable === true
              ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
              : isAvailable === false
                ? 'border-destructive-fill focus:border-destructive-fill focus:ring-destructive-fill'
                : ''
          }`}
        />
        {isChecking && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--border)] border-t-[color:var(--primary)]" />
          </div>
        )}
        {!isChecking && isAvailable === true && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 dark:text-green-400">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                fill="currentColor"
              />
            </svg>
          </div>
        )}
        {!isChecking && isAvailable === false && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive-text">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                fill="currentColor"
              />
            </svg>
          </div>
        )}
      </div>
      {isAvailable === false && (
        <p className="mt-2 text-sm text-destructive-text">{t('username_already_taken')}</p>
      )}
      {isAvailable === true && (
        <p className="mt-2 text-sm text-success-text">{t('username_available')}</p>
      )}
    </div>
  );
}
