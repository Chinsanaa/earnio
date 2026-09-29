'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { SponsorShell } from '@/components/sponsor/SponsorShell';
import { CampaignEditorToolbar } from '@/components/sponsor/CampaignEditorToolbar';
import { CampaignReadOnly } from '@/components/sponsor/CampaignReadOnly';
import { ApiError } from '@/lib/api/client';
import {
  closeCampaign,
  deleteSponsorCampaign,
  getSponsorCampaign,
  markCampaignPaid,
  publishCampaign,
  updateApplicationStatus,
} from '@/lib/api/sponsor';
import { applicationStatusLabel, formatDate, formatMnt } from '@/lib/format';
import { isLegacyUnpublished, isPublished } from '@/lib/sponsor/campaignForm';
import { useLanguage } from '@/contexts/LanguageContext';
import type {
  ApplicationStatusBreakdown,
  CampaignPaymentStatus,
  SponsorApplication,
  SponsorCampaign,
} from '@/lib/types/sponsor';

export default function SponsorCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { t } = useLanguage();

  const [campaign, setCampaign] = useState<SponsorCampaign | null>(null);
  const [applications, setApplications] = useState<SponsorApplication[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<ApplicationStatusBreakdown | null>(null);
  const [approvalRate, setApprovalRate] = useState<number | null>(null);
  const [payment, setPayment] = useState<CampaignPaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentDismissed, setPaymentDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getSponsorCampaign(id);
        if (!cancelled) {
          setCampaign(data.campaign);
          setApplications(data.applications);
          setStatusBreakdown(data.statusBreakdown);
          setApprovalRate(data.approvalRate);
          setPayment(data.payment);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load campaign');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (payment?.readyToPay && !paymentDismissed) {
      setShowPaymentModal(true);
    }
  }, [payment, paymentDismissed]);

  async function reload() {
    const data = await getSponsorCampaign(id);
    setCampaign(data.campaign);
    setApplications(data.applications);
    setStatusBreakdown(data.statusBreakdown);
    setApprovalRate(data.approvalRate);
    setPayment(data.payment);
  }

  async function handleMarkPaid() {
    setPaying(true);
    setError(null);
    try {
      await markCampaignPaid(id);
      await reload();
      setShowPaymentModal(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to mark payment');
    } finally {
      setPaying(false);
    }
  }

  async function handlePublish() {
    if (!campaign) return;
    setBusy(true);
    setError(null);
    try {
      await publishCampaign(id);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to publish');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!campaign) return;
    if (!window.confirm(t('delete_campaign_confirm'))) return;
    setBusy(true);
    setError(null);
    try {
      await deleteSponsorCampaign(id);
      router.push('/sponsor/campaigns');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete campaign');
    } finally {
      setBusy(false);
    }
  }

  async function handleClose() {
    setBusy(true);
    setError(null);
    try {
      await closeCampaign(id);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to close campaign');
    } finally {
      setBusy(false);
    }
  }

  async function handleApplication(
    applicationId: string,
    status: 'approved' | 'rejected',
    sponsorNotes?: string,
    fromKeyboard = false
  ) {
    setActionId(applicationId);
    try {
      const updated = await updateApplicationStatus(applicationId, status, sponsorNotes);
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? updated : a))
      );
      toast.success(t(status === 'approved' ? 'application_approved_toast' : 'application_rejected_toast'));
      if (fromKeyboard) {
        // Keep keyboard reviewers in flow: jump to the next pending card.
        requestAnimationFrame(() =>
          document.querySelector<HTMLElement>('[data-pending-application]')?.focus()
        );
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update application';
      setError(message);
      toast.error(message);
    } finally {
      setActionId(null);
    }
  }

  const legacy = campaign && isLegacyUnpublished(campaign.status);
  const published = campaign && isPublished(campaign.status);
  const canDelete =
    campaign &&
    campaign.status !== 'closed' &&
    campaign.applicationCount === 0;

  return (
    <SponsorShell>
      <Link href="/sponsor/campaigns" className="link-primary text-sm">
        {t('back_to_campaigns')}
      </Link>

      {loading && (
        <p className="mt-8 text-sm text-[color:var(--muted-foreground)]">{t('loading')}</p>
      )}
      {error ? (
        <p className="mt-8 alert-error">{error}</p>
      ) : null}

      {campaign && (
        <article className="mt-6 max-w-3xl space-y-10">
          <div className="creator-panel-lg p-6 sm:p-8">
            <CampaignReadOnly campaign={campaign} />

            {(legacy || published) && (
              <div className="mt-6">
                <CampaignEditorToolbar
                  variant={legacy ? 'legacy-unpublished' : 'published'}
                  busy={busy}
                  onPublish={legacy ? () => void handlePublish() : undefined}
                  onClose={published ? () => void handleClose() : undefined}
                  onDelete={canDelete ? () => void handleDelete() : undefined}
                />
              </div>
            )}
          </div>

          {!legacy && statusBreakdown && (
            <section>
              <h2 className="font-display text-lg font-bold text-[color:var(--foreground)]">
                {t('applications_heading')}
              </h2>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="creator-platform-stat">
                  <p className="text-xs text-landing-muted">{t('applicants')}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-landing-fg">
                    {applications.length}
                  </p>
                </div>
                <div className="creator-platform-stat">
                  <p className="text-xs text-landing-muted">{t('approval_rate')}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-landing-fg">
                    {approvalRate !== null ? `${Math.round(approvalRate * 100)}%` : '—'}
                  </p>
                </div>
                <div className="creator-platform-stat">
                  <p className="text-xs text-landing-muted">{t('pending_short')}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-landing-fg">
                    {statusBreakdown.pending}
                  </p>
                </div>
              </div>

              {applications.length === 0 && (
                <p className="mt-4 text-sm text-[color:var(--muted-foreground)]">
                  {t('no_applications_campaign')}
                </p>
              )}

              {statusBreakdown.pending > 0 && (
                <p className="mt-4 hidden text-xs font-medium text-[color:var(--muted-foreground)] md:block">
                  {t('review_shortcut_hint')}
                </p>
              )}

              <ul className="mt-4 space-y-4">
                {applications.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    busy={actionId === app.id}
                    onApprove={(notes, kb) => handleApplication(app.id, 'approved', notes, kb)}
                    onReject={(notes, kb) => handleApplication(app.id, 'rejected', notes, kb)}
                  />
                ))}
              </ul>
            </section>
          )}

          {legacy && (
            <p className="text-sm text-[color:var(--muted-foreground)]">
              {t('publish_campaign_note')}
            </p>
          )}

          {payment && payment.approvedCount > 0 && !payment.paidAt && (
            <section className="creator-panel-lg p-6">
              <h2 className="font-display text-lg font-bold text-[color:var(--foreground)]">
                {t('payment_heading')}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
                {t('payment_summary')
                  .replace('{count}', String(payment.approvedCount))
                  .replace('{amount}', formatMnt(payment.amountDueMnt))}
              </p>
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                {payment.submittedCount}/{payment.approvedCount} {t('deliverables_submitted_label')}
              </p>
              {!payment.readyToPay && (
                <p className="mt-2 text-xs text-[color:var(--muted)]">
                  {!payment.deadlinePassed
                    ? t('payment_waiting_deadline')
                    : t('payment_waiting_deliverables')}
                </p>
              )}
              <button
                type="button"
                disabled={!payment.readyToPay || paying}
                onClick={() => setShowPaymentModal(true)}
                className="btn-primary mt-4 w-auto px-5 disabled:opacity-50"
              >
                {t('process_payment')}
              </button>
            </section>
          )}

          {payment?.paidAt && (
            <p className="text-sm font-semibold text-[color:var(--success)]">
              {t('payment_marked_paid')} {formatDate(payment.paidAt)}
            </p>
          )}
        </article>
      )}

      {showPaymentModal && payment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="creator-panel-lg w-full max-w-md bg-[color:var(--card)] p-6">
            <h2 className="font-display text-lg font-bold text-[color:var(--foreground)]">
              {t('payment_heading')}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
              {t('payment_summary')
                .replace('{count}', String(payment.approvedCount))
                .replace('{amount}', formatMnt(payment.amountDueMnt))}
            </p>
            <p className="mt-3 text-2xl font-bold text-[color:var(--foreground)]">
              {formatMnt(payment.amountDueMnt)}
            </p>
            {error && <p className="mt-3 text-sm text-destructive-text">{error}</p>}
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={paying}
                onClick={() => void handleMarkPaid()}
                className="btn-primary disabled:opacity-50"
              >
                {paying ? t('please_wait') : t('mark_as_paid')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentDismissed(true);
                }}
                className="btn-secondary"
              >
                {t('remind_me_later')}
              </button>
            </div>
          </div>
        </div>
      )}
    </SponsorShell>
  );
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-status-pending',
  approved: 'badge-status-success',
  rejected: 'badge-status-danger',
  completed: 'badge-status-info',
  paid: 'badge-status-success',
};

function ApplicationCard({
  application,
  busy,
  onApprove,
  onReject,
}: {
  application: SponsorApplication;
  busy: boolean;
  onApprove: (notes?: string, fromKeyboard?: boolean) => void;
  onReject: (notes?: string, fromKeyboard?: boolean) => void;
}) {
  const [notes, setNotes] = useState('');
  const { t } = useLanguage();
  const pending = application.status === 'pending';

  const approved = application.status === 'approved';

  function onKeyDown(e: React.KeyboardEvent<HTMLLIElement>) {
    // Only when the card itself has focus, never while typing a note.
    if (!pending || busy || e.target !== e.currentTarget || e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === 'a') {
      e.preventDefault();
      onApprove(notes.trim() || undefined, true);
    } else if (key === 'r') {
      e.preventDefault();
      onReject(notes.trim() || undefined, true);
    }
  }

  return (
    <li
      className="creator-panel p-5 focus-visible:shadow-hard"
      tabIndex={pending ? 0 : undefined}
      onKeyDown={onKeyDown}
      data-pending-application={pending ? '' : undefined}
      aria-keyshortcuts={pending ? 'A R' : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold tracking-tight text-[color:var(--foreground)]">
            {application.creator?.name ?? 'Creator'}
            {application.creator && (
              <span className="ml-2 text-sm font-normal text-[color:var(--muted)]">
                @{application.creator.username}
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-[color:var(--muted)]">
            {t('applied_label')} {formatDate(application.applied_at)}
          </p>
          <span className={`mt-2 inline-flex ${STATUS_BADGE[application.status] ?? 'badge-status-neutral'}`}>
            {applicationStatusLabel(application.status)}
          </span>
        </div>
        {application.creator?.email && (
          <a
            href={`mailto:${application.creator.email}`}
            className="btn-secondary min-h-9 px-3 py-1.5 text-xs"
          >
            {t('contact')}
          </a>
        )}
      </div>

      {application.response_text && (
        <p className="mt-3 whitespace-pre-wrap text-sm text-[color:var(--muted-foreground)]">
          {application.response_text}
        </p>
      )}

      {application.sponsor_notes && !pending && (
        <p className="mt-2 text-xs text-[color:var(--muted)]">
          {t('your_note_label')} {application.sponsor_notes}
        </p>
      )}

      {approved && (
        <p className="mt-2 text-xs font-medium text-[color:var(--muted)]">
          {application.deliverable_url ? (
            <>
              {t('deliverable_submitted')}{' '}
              <a href={application.deliverable_url} target="_blank" rel="noreferrer" className="link-primary">
                {application.deliverable_url}
              </a>
            </>
          ) : (
            t('deliverable_pending')
          )}
        </p>
      )}

      {pending && (
        <div className="mt-4 space-y-3">
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('sponsor_notes_placeholder')}
            className="input-touch"
          />
          <div className="flex gap-2">
            <Button
              disabled={busy}
              onClick={() => onApprove(notes.trim() || undefined)}
              className="bg-tint-green text-tint-foreground hover:bg-tint-green"
            >
              <Check className="size-4" aria-hidden />
              {busy ? '…' : t('approve')}
              <kbd className="ml-1 hidden rounded border-[1.5px] border-current px-1 font-mono text-[10px] md:inline">A</kbd>
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => onReject(notes.trim() || undefined)}>
              <X className="size-4" aria-hidden />
              {t('reject')}
              <kbd className="ml-1 hidden rounded border-[1.5px] border-current px-1 font-mono text-[10px] md:inline">R</kbd>
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
