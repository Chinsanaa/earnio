'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications';
import { ApiError } from '@/lib/api/client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Notification } from '@/lib/types/notifications';

function formatWhen(iso: string, justNow: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return justNow;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function NotificationBell({ tone = 'default' }: { tone?: 'default' | 'creator' }) {
  const isCreator = tone === 'creator';
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setItems(data.notifications);
      setUnread(data.unreadCount);
    } catch {
      // ignore when unauthenticated
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getNotifications();
        if (!cancelled) {
          setItems(data.notifications);
          setUnread(data.unreadCount);
        }
      } catch {
        // ignore when unauthenticated
      }
    })();
    const interval = setInterval(() => {
      void load();
    }, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;

    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    const timeoutId = window.setTimeout(() => {
      document.addEventListener('click', onClickOutside);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('click', onClickOutside);
    };
  }, [open]);

  async function handleOpen() {
    setOpen((current) => {
      const next = !current;
      if (next) void load();
      return next;
    });
  }

  async function handleRead(id: string) {
    try {
      await markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnread((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err instanceof ApiError ? err.message : 'Failed to mark read');
    }
  }

  async function handleReadAll() {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      setUnread(0);
    } catch (err) {
      console.error(err instanceof ApiError ? err.message : 'Failed to mark all read');
    }
  }

  return (
    <div className="creator-notify-root relative" ref={panelRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void handleOpen();
        }}
        className={
          isCreator
            ? 'creator-icon-btn relative'
            : 'relative rounded-lg border border-border p-2 text-foreground hover:bg-surface dark:border-border dark:text-muted dark:hover:bg-surface'
        }
        aria-label={t('notifications')}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.454 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={
            isCreator
              ? 'absolute right-0 z-[100] mt-2 w-80 overflow-hidden rounded-xl border-2 border-outline bg-card shadow-hard sm:w-96'
              : 'absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-lg dark:border-border dark:bg-background sm:w-96'
          }
        >
          <div
            className={
              isCreator
                ? 'flex items-center justify-between border-b-2 border-[color:var(--outline)] px-4 py-3'
                : 'flex items-center justify-between border-b border-border px-4 py-3 dark:border-border'
            }
          >
            <p className={`text-sm font-semibold ${isCreator ? 'text-landing-fg' : 'text-foreground'}`}>
              {t('notifications')}
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleReadAll}
                className={`text-xs font-medium ${isCreator ? 'auth-link' : 'text-primary hover:text-primary'}`}
              >
                {t('mark_all_read')}
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 && (
              <li
                className={`px-4 py-6 text-center text-sm ${isCreator ? 'text-landing-muted' : 'text-muted'}`}
              >
                {t('loading')}
              </li>
            )}
            {!loading && items.length === 0 && (
              <li
                className={`px-4 py-6 text-center text-sm ${isCreator ? 'text-landing-muted' : 'text-muted'}`}
              >
                {t('no_notifications_yet')}
              </li>
            )}
            {items.map((n) => (
              <li
                key={n.id}
                className={
                  isCreator
                    ? `border-b border-[color:var(--border)] px-4 py-3 last:border-0 ${
                        !n.read_at ? 'bg-primary-soft' : ''
                      }`
                    : `border-b border-border/60 px-4 py-3 last:border-0 dark:border-border/60 ${
                        !n.read_at ? 'bg-primary-subtle/50 dark:bg-primary-subtle' : ''
                      }`
                }
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => !n.read_at && handleRead(n.id)}
                >
                  <p
                    className={`text-sm font-medium ${isCreator ? 'text-landing-fg' : 'text-foreground'}`}
                  >
                    {n.title}
                  </p>
                  <p className={`mt-0.5 text-xs ${isCreator ? 'text-landing-muted' : 'text-muted'}`}>
                    {n.body}
                  </p>
                  <p
                    className={`mt-1 text-[10px] ${isCreator ? 'text-landing-muted' : 'text-muted-foreground'}`}
                  >
                    {formatWhen(n.created_at, t('just_now'))}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
