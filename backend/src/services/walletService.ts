import { getAuthenticatedClient, supabaseAdmin } from '../database/supabase';
import notificationService from './notificationService';
import { toNumber } from '../utils/toNumber';
import { decrypt, deterministicHash, encrypt } from '../utils/encryption';

export const MIN_PAYOUT_MNT = 50_000;
export const PLATFORM_FEE_RATE = 0.2;

const CREDIT_TYPES = new Set(['sponsorship_credit', 'earning_credit', 'adjustment']);

export interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  is_default: boolean;
  verified: boolean;
  created_at: string | null;
}

export interface WalletTransaction {
  id: string;
  type: string;
  amount_mnt: number;
  currency: string;
  status: string;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  bank_account_id: string | null;
  created_at: string;
}

export interface WalletSummary {
  availableBalanceMnt: number;
  pendingPayoutMnt: number;
  totalEarnedMnt: number;
  totalFeesMnt: number;
  totalPaidOutMnt: number;
  platformFeeRate: number;
  minPayoutMnt: number;
}

export type BalanceRow = { type: string; amount_mnt: number | string; status: string };

export interface WalletBalances {
  available: number;
  pendingPayout: number;
  totalEarned: number;
  totalFees: number;
  totalPaidOut: number;
}

export interface Paginated<T> {
  items: T[];
  hasMore: boolean;
  nextOffset: number;
}

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export function clampLimit(limit?: number): number {
  if (!limit || limit < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(limit, MAX_PAGE_SIZE);
}

export function maskAccountNumber(num: string): string {
  if (num.length <= 4) return num;
  return `•••• ${num.slice(-4)}`;
}

// Pure ledger derivation over the user's full transaction history. Extracted as
// a module-level function so it can be unit tested without a Supabase client.
export function computeBalances(transactions: BalanceRow[]): WalletBalances {
  let available = 0;
  let pendingPayout = 0;
  let totalEarned = 0;
  let totalFees = 0;
  let totalPaidOut = 0;

  for (const tx of transactions) {
    const amount = toNumber(tx.amount_mnt);

    if (CREDIT_TYPES.has(tx.type) && tx.status === 'completed') {
      totalEarned += amount;
      available += amount;
    }

    if (tx.type === 'platform_fee' && tx.status === 'completed') {
      totalFees += amount;
      available -= amount;
    }

    if (tx.type === 'payout') {
      if (tx.status === 'completed') {
        totalPaidOut += amount;
        available -= amount;
      } else if (tx.status === 'pending') {
        pendingPayout += amount;
        available -= amount;
      }
    }
  }

  return {
    available: Math.max(0, available),
    pendingPayout,
    totalEarned,
    totalFees,
    totalPaidOut,
  };
}

// account_number is stored encrypted, so prefer the plaintext last-4 column for
// display. Fall back to decrypting (also handles legacy plaintext rows), and to
// a fully masked value if decryption isn't possible.
function maskStored(accountNumber: string | null, last4: string | null): string {
  if (last4) return `•••• ${last4}`;
  if (!accountNumber) return '••••';
  try {
    return maskAccountNumber(decrypt(accountNumber));
  } catch {
    return '••••';
  }
}

class WalletService {
  private computeBalances(transactions: BalanceRow[]): WalletBalances {
    return computeBalances(transactions);
  }

  // Balances must be computed over the user's full transaction history, not the
  // paginated list shown in the UI, so only the columns needed for the math are
  // fetched here.
  private async fetchBalanceRows(userId: string, accessToken: string): Promise<BalanceRow[]> {
    const client = getAuthenticatedClient(accessToken);

    const { data, error } = await client
      .from('wallet_transactions')
      .select('type, amount_mnt, status')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to load transactions: ${error.message}`);
    }

    return data ?? [];
  }

  public async getSummary(userId: string, accessToken: string): Promise<WalletSummary> {
    const transactions = await this.fetchBalanceRows(userId, accessToken);
    const balances = this.computeBalances(transactions);

    return {
      availableBalanceMnt: balances.available,
      pendingPayoutMnt: balances.pendingPayout,
      totalEarnedMnt: balances.totalEarned,
      totalFeesMnt: balances.totalFees,
      totalPaidOutMnt: balances.totalPaidOut,
      platformFeeRate: PLATFORM_FEE_RATE,
      minPayoutMnt: MIN_PAYOUT_MNT,
    };
  }

  public async listTransactions(
    userId: string,
    accessToken: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Paginated<WalletTransaction>> {
    const client = getAuthenticatedClient(accessToken);
    const limit = clampLimit(options.limit);
    const offset = Math.max(0, options.offset ?? 0);

    // Fetch one extra row to determine hasMore without a separate count query.
    const { data, error } = await client
      .from('wallet_transactions')
      .select(
        'id, type, amount_mnt, currency, status, description, reference_type, reference_id, bank_account_id, created_at'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit);

    if (error) {
      throw new Error(`Failed to load transactions: ${error.message}`);
    }

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      items: page.map((row) => ({
        id: row.id,
        type: row.type,
        amount_mnt: toNumber(row.amount_mnt),
        currency: row.currency ?? 'MNT',
        status: row.status,
        description: row.description,
        reference_type: row.reference_type,
        reference_id: row.reference_id,
        bank_account_id: row.bank_account_id,
        created_at: row.created_at,
      })),
      hasMore,
      nextOffset: offset + page.length,
    };
  }

  public async listBankAccounts(userId: string, accessToken: string): Promise<BankAccount[]> {
    const client = getAuthenticatedClient(accessToken);

    const { data, error } = await client
      .from('bank_accounts')
      .select(
        'id, bank_name, account_number, account_number_last4, account_holder_name, is_default, verified, created_at'
      )
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load bank accounts: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      bank_name: row.bank_name,
      account_number: maskStored(row.account_number, row.account_number_last4),
      account_holder_name: row.account_holder_name,
      is_default: row.is_default ?? false,
      verified: row.verified ?? false,
      created_at: row.created_at,
    }));
  }

  public async addBankAccount(
    userId: string,
    accessToken: string,
    payload: {
      bankName: string;
      accountNumber: string;
      accountHolderName: string;
      setAsDefault?: boolean;
    }
  ): Promise<BankAccount> {
    const { bankName, accountNumber, accountHolderName, setAsDefault } = payload;

    if (!bankName?.trim() || !accountNumber?.trim() || !accountHolderName?.trim()) {
      throw new Error('All bank account fields are required');
    }

    const trimmedNumber = accountNumber.trim();
    const last4 = trimmedNumber.slice(-4);
    const client = getAuthenticatedClient(accessToken);

    const { count } = await client
      .from('bank_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    const isFirst = (count ?? 0) === 0;

    if (setAsDefault || isFirst) {
      await client
        .from('bank_accounts')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await client
      .from('bank_accounts')
      .insert({
        user_id: userId,
        bank_name: bankName.trim(),
        account_number: encrypt(trimmedNumber),
        account_number_last4: last4,
        account_number_hash: deterministicHash(trimmedNumber),
        account_holder_name: accountHolderName.trim(),
        is_default: setAsDefault ?? isFirst,
        verified: false,
      })
      .select(
        'id, bank_name, account_number, account_number_last4, account_holder_name, is_default, verified, created_at'
      )
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('This bank account is already saved');
      }
      throw new Error(`Failed to add bank account: ${error.message}`);
    }

    return {
      id: data.id,
      bank_name: data.bank_name,
      account_number: maskStored(data.account_number, data.account_number_last4),
      account_holder_name: data.account_holder_name,
      is_default: data.is_default ?? false,
      verified: data.verified ?? false,
      created_at: data.created_at,
    };
  }

  public async setDefaultBankAccount(
    userId: string,
    accessToken: string,
    bankAccountId: string
  ): Promise<void> {
    const client = getAuthenticatedClient(accessToken);

    const { data: account } = await client
      .from('bank_accounts')
      .select('id')
      .eq('id', bankAccountId)
      .eq('user_id', userId)
      .single();

    if (!account) {
      throw new Error('Bank account not found');
    }

    await client.from('bank_accounts').update({ is_default: false }).eq('user_id', userId);

    const { error } = await client
      .from('bank_accounts')
      .update({ is_default: true })
      .eq('id', bankAccountId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to set default account: ${error.message}`);
    }
  }

  public async requestPayout(
    userId: string,
    accessToken: string,
    amountMnt: number,
    bankAccountId: string
  ): Promise<WalletTransaction> {
    if (!amountMnt || amountMnt < MIN_PAYOUT_MNT) {
      throw new Error(`Minimum payout is ${MIN_PAYOUT_MNT.toLocaleString()} MNT`);
    }

    const client = getAuthenticatedClient(accessToken);

    const [{ data: bankAccount }, summary] = await Promise.all([
      client
        .from('bank_accounts')
        .select('id, bank_name, account_number, account_number_last4')
        .eq('id', bankAccountId)
        .eq('user_id', userId)
        .single(),
      this.getSummary(userId, accessToken),
    ]);

    if (!bankAccount) {
      throw new Error('Bank account not found');
    }

    if (summary.pendingPayoutMnt > 0) {
      throw new Error('You already have a pending payout request');
    }

    if (amountMnt > summary.availableBalanceMnt) {
      throw new Error('Insufficient wallet balance');
    }

    // Clients cannot insert wallet rows (see the integrity hardening migration),
    // so the payout is written with the service role after the checks above.
    if (!supabaseAdmin) {
      throw new Error('Payouts are temporarily unavailable. Please try again later.');
    }

    const maskedAccount = maskStored(bankAccount.account_number, bankAccount.account_number_last4);

    const { data, error } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        type: 'payout',
        amount_mnt: amountMnt,
        currency: 'MNT',
        status: 'pending',
        description: `Payout to ${bankAccount.bank_name} ${maskedAccount}`,
        reference_type: 'bank_payout',
        bank_account_id: bankAccountId,
      })
      .select(
        'id, type, amount_mnt, currency, status, description, reference_type, reference_id, bank_account_id, created_at'
      )
      .single();

    if (error) {
      // The partial unique index (one pending payout per user) makes the
      // "already pending" check race-safe: a concurrent second insert fails here.
      if (error.code === '23505') {
        throw new Error('You already have a pending payout request');
      }
      throw new Error(`Failed to request payout: ${error.message}`);
    }

    await notificationService.notifyPayoutRequested(userId, amountMnt);

    return {
      id: data.id,
      type: data.type,
      amount_mnt: toNumber(data.amount_mnt),
      currency: data.currency ?? 'MNT',
      status: data.status,
      description: data.description,
      reference_type: data.reference_type,
      reference_id: data.reference_id,
      bank_account_id: data.bank_account_id,
      created_at: data.created_at,
    };
  }
}

export default new WalletService();
