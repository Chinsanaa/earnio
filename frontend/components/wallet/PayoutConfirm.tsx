'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { formatMnt } from '@/lib/format';
import type { BankAccount } from '@/lib/types/wallet';

/**
 * Final review step before a payout: bottom sheet on phones, dialog on larger screens.
 */
export function PayoutConfirm({
  open,
  onOpenChange,
  amountMnt,
  availableMnt,
  bank,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amountMnt: number;
  availableMnt: number;
  bank: BankAccount | undefined;
  pending: boolean;
  onConfirm: () => void;
}) {
  const { t } = useLanguage();
  const isMobile = useMediaQuery('(max-width: 767px)');

  const body = (
    <>
      <div className="mt-5 rounded-2xl border-2 border-outline bg-tint-blue p-5 text-tint-foreground">
        <p className="text-sm font-semibold">{t('amount')}</p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-tight">{formatMnt(amountMnt)}</p>
      </div>
      <dl className="mt-4 divide-y divide-border rounded-2xl border-2 border-outline text-sm">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-muted-foreground">{t('payout_to')}</dt>
          <dd className="text-right font-semibold">
            {bank ? `${bank.bank_name} ${bank.account_number}` : '—'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-muted-foreground">{t('remaining_balance')}</dt>
          <dd className="font-mono font-semibold">{formatMnt(Math.max(0, availableMnt - amountMnt))}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">{t('fees_already_deducted')}</p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
          {t('cancel')}
        </Button>
        <Button variant="pop" onClick={onConfirm} disabled={pending}>
          {pending ? t('submitting') : t('confirm_payout')}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetTitle className="font-display text-xl font-bold tracking-tight">{t('confirm_payout_title')}</SheetTitle>
          <SheetDescription className="mt-1.5 text-sm text-muted-foreground">
            {t('confirm_payout_desc')}
          </SheetDescription>
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t('confirm_payout_title')}</DialogTitle>
        <DialogDescription>{t('confirm_payout_desc')}</DialogDescription>
        {body}
      </DialogContent>
    </Dialog>
  );
}
