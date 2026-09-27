'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { CreatorPageHeader } from '@/components/creator/CreatorPageHeader';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { BalanceTrend } from '@/components/wallet/BalanceTrend';
import { WalletSkeleton } from '@/components/wallet/WalletSkeleton';
import { PayoutConfirm } from '@/components/wallet/PayoutConfirm';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FieldError, Input, Label } from '@/components/ui/input';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiError } from '@/lib/api/client';
import {
  addBankAccount,
  getBankAccounts,
  getWalletSummary,
  getWalletTransactions,
  requestPayout,
  setDefaultBankAccount,
} from '@/lib/api/wallet';
import {
  formatDate,
  formatMnt,
  transactionStatusLabel,
  transactionTypeLabel,
} from '@/lib/format';
import type { BankAccount, WalletSummary, WalletTransaction } from '@/lib/types/wallet';

const MONGOLIAN_BANKS = [
  'Khan Bank',
  'Golomt Bank',
  'Trade and Development Bank',
  'XacBank',
  'State Bank',
  'Capitron Bank',
  'Ard Credit',
];

const TX_STATUS_STYLES: Record<string, string> = {
  pending: 'badge-status-pending',
  completed: 'badge-status-success',
  failed: 'badge-status-danger',
};

function isCredit(type: string): boolean {
  return type === 'sponsorship_credit' || type === 'earning_credit' || type === 'adjustment';
}

export default function WalletPage() {
  const TX_PAGE_SIZE = 20;
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txHasMore, setTxHasMore] = useState(false);
  const [txNextOffset, setTxNextOffset] = useState(0);
  const [txLoadingMore, setTxLoadingMore] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const [bankName, setBankName] = useState(MONGOLIAN_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankError, setBankError] = useState<string | null>(null);
  const [bankPending, setBankPending] = useState(false);

  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutBankId, setPayoutBankId] = useState('');
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutPending, setPayoutPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const payoutAmountMnt = Number(payoutAmount.replace(/\D/g, '')) || 0;

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, tx, banks] = await Promise.all([
        getWalletSummary(),
        getWalletTransactions({ limit: TX_PAGE_SIZE }),
        getBankAccounts(),
      ]);
      setSummary(s);
      setTransactions(tx.items);
      setTxHasMore(tx.hasMore);
      setTxNextOffset(tx.nextOffset);
      setBankAccounts(banks);
      const defaultBank = banks.find((b) => b.is_default) ?? banks[0];
      if (defaultBank) setPayoutBankId(defaultBank.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreTransactions = useCallback(async () => {
    setTxLoadingMore(true);
    try {
      const tx = await getWalletTransactions({ limit: TX_PAGE_SIZE, offset: txNextOffset });
      setTransactions((prev) => [...prev, ...tx.items]);
      setTxHasMore(tx.hasMore);
      setTxNextOffset(tx.nextOffset);
    } catch {
      // Keep the already-loaded rows; the user can retry.
    } finally {
      setTxLoadingMore(false);
    }
  }, [txNextOffset]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [s, tx, banks] = await Promise.all([
          getWalletSummary(),
          getWalletTransactions({ limit: TX_PAGE_SIZE }),
          getBankAccounts(),
        ]);
        if (!cancelled) {
          setSummary(s);
          setTransactions(tx.items);
          setTxHasMore(tx.hasMore);
          setTxNextOffset(tx.nextOffset);
          setBankAccounts(banks);
          const defaultBank = banks.find((b) => b.is_default) ?? banks[0];
          if (defaultBank) setPayoutBankId(defaultBank.id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load wallet');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAddBank(e: FormEvent) {
    e.preventDefault();
    setBankError(null);
    setBankPending(true);
    try {
      await addBankAccount({
        bankName,
        accountNumber,
        accountHolderName,
        setAsDefault: bankAccounts.length === 0,
      });
      setAccountNumber('');
      toast.success(t('bank_added'));
      await load();
    } catch (err) {
      setBankError(err instanceof ApiError ? err.message : 'Failed to add account');
    } finally {
      setBankPending(false);
    }
  }

  function validatePayout(amount: number): string | null {
    if (!summary) return null;
    if (amount < summary.minPayoutMnt) {
      return t('amount_below_min').replace('{min}', formatMnt(summary.minPayoutMnt));
    }
    if (amount > summary.availableBalanceMnt) {
      return t('amount_above_balance').replace('{max}', formatMnt(summary.availableBalanceMnt));
    }
    return null;
  }

  function handleReviewPayout(e: FormEvent) {
    e.preventDefault();
    const problem = validatePayout(payoutAmountMnt);
    setPayoutError(problem);
    if (!problem) setConfirmOpen(true);
  }

  function setQuickAmount(fraction: number) {
    if (!summary) return;
    setPayoutError(null);
    setPayoutAmount(String(Math.floor(summary.availableBalanceMnt * fraction)));
  }

  async function handlePayout() {
    setPayoutPending(true);
    try {
      const result = await requestPayout(payoutAmountMnt, payoutBankId);
      toast.success(result.message);
      setPayoutAmount('');
      setConfirmOpen(false);
      await load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Payout failed';
      setPayoutError(message);
      toast.error(message);
      setConfirmOpen(false);
    } finally {
      setPayoutPending(false);
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-6xl">
        <CreatorPageHeader
          title={t('wallet')}
          subtitle={t('wallet_subtitle')}
        />

        {loading && <WalletSkeleton />}
        {error && (
          <p className="alert-error">{error}</p>
        )}

        {summary && !loading && (
          <div className="space-y-8">
            <div className="creator-hero">
              <div className="creator-hero-body">
                <p className="creator-hero-label">{t('available_to_withdraw')}</p>
                <NumberTicker
                  className="creator-hero-amount block"
                  value={summary.availableBalanceMnt}
                  format={formatMnt}
                />

                <div className="creator-hero-divider" />

                <div className="creator-hero-stats">
                  <div>
                    <p className="creator-hero-stat-label">{t('pending_payouts')}</p>
                    <p className="creator-hero-stat-value">{formatMnt(summary.pendingPayoutMnt)}</p>
                  </div>
                  <div>
                    <p className="creator-hero-stat-label">{t('total_earned')}</p>
                    <p className="creator-hero-stat-value">{formatMnt(summary.totalEarnedMnt)}</p>
                  </div>
                  <div>
                    <p className="creator-hero-stat-label">{t('fees_paid')}</p>
                    <p className="creator-hero-stat-value">{formatMnt(summary.totalFeesMnt)}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <BalanceTrend transactions={transactions} />
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="creator-panel-lg">
                <h2 className="font-display text-xl font-bold tracking-tight text-landing-fg">
                  {t('request_payout')}
                </h2>
                <p className="mt-1 text-sm text-landing-muted">
                  {t('minimum_payout_note').replace('{min}', formatMnt(summary.minPayoutMnt))}
                </p>
                {bankAccounts.length === 0 ? (
                  <p className="alert-warning mt-4">{t('add_bank_account_first')}</p>
                ) : (
                  <form onSubmit={handleReviewPayout} className="mt-5 space-y-4" noValidate>
                    <div>
                      <Label htmlFor="payout-amount">{t('amount_mnt')}</Label>
                      <Input
                        id="payout-amount"
                        type="text"
                        inputMode="numeric"
                        required
                        value={payoutAmountMnt ? payoutAmountMnt.toLocaleString('en-US') : payoutAmount}
                        onChange={(e) => {
                          setPayoutError(null);
                          setPayoutAmount(e.target.value);
                        }}
                        placeholder={t('payout_amount_placeholder')}
                        aria-invalid={payoutError ? true : undefined}
                        aria-describedby={payoutError ? 'payout-error' : undefined}
                        className="font-mono text-lg font-semibold"
                      />
                      <div className="mt-2 flex gap-2">
                        {[
                          { label: '25%', fraction: 0.25 },
                          { label: '50%', fraction: 0.5 },
                          { label: t('amount_max'), fraction: 1 },
                        ].map((chip) => (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => setQuickAmount(chip.fraction)}
                            className="rounded-full border-2 border-outline bg-card px-3 py-1 text-xs font-bold text-foreground transition-colors hover:bg-pop-lime hover:text-pop-foreground"
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                      <FieldError id="payout-error">{payoutError}</FieldError>
                    </div>
                    <div>
                      <Label htmlFor="payout-bank">{t('bank_account')}</Label>
                      <select
                        id="payout-bank"
                        value={payoutBankId}
                        onChange={(e) => setPayoutBankId(e.target.value)}
                        className="auth-input"
                      >
                        {bankAccounts.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.bank_name} {b.account_number}
                            {b.is_default ? ` ${t('default_label')}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" size="lg" disabled={payoutPending || !payoutAmountMnt}>
                      {t('review_payout')}
                    </Button>
                  </form>
                )}
              </section>

              <section className="creator-panel-lg">
                <h2 className="font-display text-xl font-bold tracking-tight text-landing-fg">
                  {t('bank_accounts')}
                </h2>
                {bankAccounts.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {bankAccounts.map((b) => (
                      <li key={b.id} className="creator-platform-row">
                        <div>
                          <p className="font-medium text-landing-fg">{b.bank_name}</p>
                          <p className="text-sm text-landing-muted">
                            {b.account_number} · {b.account_holder_name}
                          </p>
                        </div>
                        {b.is_default ? (
                          <span className="badge-status-success">{t('default_label')}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDefaultBankAccount(b.id).then(load)}
                            className="auth-link text-xs"
                          >
                            {t('set_default')}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <form
                  onSubmit={handleAddBank}
                  className="mt-5 space-y-3 border-t-2 border-[color:var(--border)] pt-5"
                >
                  <p className="text-sm font-medium text-landing-fg">{t('add_account')}</p>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="auth-input"
                  >
                    {MONGOLIAN_BANKS.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    placeholder={t('account_number')}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="auth-input"
                  />
                  <input
                    required
                    placeholder={t('account_holder_name')}
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    className="auth-input"
                  />
                  <FieldError>{bankError}</FieldError>
                  <Button type="submit" variant="outline" disabled={bankPending}>
                    {bankPending ? t('adding') : t('add_bank_account')}
                  </Button>
                </form>
              </section>
            </div>

            <section className="creator-panel-lg">
              <h2 className="font-display text-xl font-bold tracking-tight text-landing-fg">
                {t('transaction_history')}
              </h2>
              {transactions.length === 0 ? (
                <EmptyState
                  className="mt-5"
                  icon={Receipt}
                  title={t('no_transactions_title')}
                  description={t('no_transactions_desc')}
                />
              ) : (
              <div className="creator-table-wrap mt-5">
                <table className="creator-table">
                  <thead>
                    <tr>
                      <th>{t('date')}</th>
                      <th>{t('type')}</th>
                      <th>{t('status')}</th>
                      <th>{t('description')}</th>
                      <th className="text-right">{t('amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="text-landing-muted">{formatDate(tx.created_at)}</td>
                        <td>{transactionTypeLabel(tx.type)}</td>
                        <td>
                          <span className={TX_STATUS_STYLES[tx.status] ?? 'badge-status-neutral'}>
                            {transactionStatusLabel(tx.status)}
                          </span>
                        </td>
                        <td className="max-w-xs truncate text-landing-muted">
                          {tx.description?.replace(/^\[Demo\]\s*/, '')}
                        </td>
                        <td
                          className={`text-right font-mono font-semibold ${
                            isCredit(tx.type) ? 'text-success-text' : 'text-landing-fg'
                          }`}
                        >
                          {isCredit(tx.type) ? '+' : '−'}
                          {formatMnt(tx.amount_mnt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
              {txHasMore && (
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" onClick={loadMoreTransactions} disabled={txLoadingMore}>
                    {txLoadingMore ? t('loading') : t('load_more')}
                  </Button>
                </div>
              )}
            </section>
          </div>
        )}

        {summary ? (
          <PayoutConfirm
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            amountMnt={payoutAmountMnt}
            availableMnt={summary.availableBalanceMnt}
            bank={bankAccounts.find((b) => b.id === payoutBankId)}
            pending={payoutPending}
            onConfirm={handlePayout}
          />
        ) : null}
      </div>
    </DashboardShell>
  );
}
