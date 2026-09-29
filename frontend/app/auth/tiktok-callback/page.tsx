'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { completeTikTokOAuth } from '@/lib/api/platforms';
import { ApiError } from '@/lib/api/client';

export default function TikTokCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connecting your TikTok account...');

  useEffect(() => {
    async function handleCallback() {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(`TikTok connection failed: ${error}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received from TikTok');
          return;
        }

        // Exchange code for tokens and create platform account
        await completeTikTokOAuth(code);

        setStatus('success');
        setMessage('TikTok account connected successfully!');

        // Redirect back to platforms page after 2 seconds
        setTimeout(() => {
          router.push('/platforms');
        }, 2000);
      } catch (err) {
        setStatus('error');
        const errorMsg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to connect TikTok account';
        setMessage(`Error: ${errorMsg}`);
      }
    }

    void handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-landing-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-landing-border bg-landing-panel p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold text-landing-fg">TikTok Connection</h1>

        {status === 'processing' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-landing-border border-t-earnio-purple"></div>
            </div>
            <p className="text-landing-muted">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="icon-circle-success">
                <svg
                  className="h-6 w-6 text-success-text"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-success-text">{message}</p>
            <p className="text-sm text-landing-muted">Redirecting to platforms...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="icon-circle-danger">
                <svg
                  className="h-6 w-6 text-destructive-text"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <p className="text-destructive-text">{message}</p>
            <button
              onClick={() => router.push('/platforms')}
              className="landing-btn-dark mt-4 px-4 py-2 text-sm"
            >
              Back to Platforms
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
