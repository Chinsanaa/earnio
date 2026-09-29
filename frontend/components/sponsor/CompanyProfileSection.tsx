'use client';

import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { getSponsorProfile, updateSponsorProfile } from '@/lib/api/sponsor';
import { useLanguage } from '@/contexts/LanguageContext';

export function CompanyProfileSection() {
  const { t } = useLanguage();
  const [companyName, setCompanyName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSponsorProfile()
      .then((profile) => {
        if (cancelled) return;
        setCompanyName(profile.companyName ?? '');
        setWebsiteUrl(profile.websiteUrl ?? '');
        setLogoUrl(profile.logoUrl ?? '');
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : t('company_profile_failed'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setPending(true);
    try {
      await updateSponsorProfile({ companyName, websiteUrl, logoUrl });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('company_profile_failed'));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="creator-panel-lg">
      <h2 className="text-base font-semibold tracking-tight text-landing-fg">
        {t('company_profile')}
      </h2>
      <p className="mt-2 text-sm text-landing-muted">{t('company_profile_subtitle')}</p>

      {loading ? (
        <p className="mt-6 text-sm text-landing-muted">{t('loading')}</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="company-name" className="mb-2 block text-sm font-medium text-landing-fg">
              {t('company_or_brand_name')}
            </label>
            <input
              id="company-name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="auth-input"
              placeholder={t('company_or_brand_name')}
            />
          </div>

          <div>
            <label htmlFor="website-url" className="mb-2 block text-sm font-medium text-landing-fg">
              {t('website_url')}
            </label>
            <input
              id="website-url"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="auth-input"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label htmlFor="logo-url" className="mb-2 block text-sm font-medium text-landing-fg">
              {t('logo_url')}
            </label>
            <input
              id="logo-url"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="auth-input"
              placeholder="https://example.com/logo.png"
            />
          </div>

          {error ? (
            <p className="alert-error" role="alert">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="alert-success" role="status">
              {t('company_profile_updated')}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? t('saving') : t('save_changes')}
          </button>
        </form>
      )}
    </section>
  );
}
