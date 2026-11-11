import React, { useState } from 'react';
import { CreditAccount, CurrencyCode } from '../types';
import { formatCurrency } from '../i18n/translations';
import {
  CreditCard,
  Building,
  CheckCircle2,
  DollarSign,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';

interface CreditLedgerProps {
  accounts: CreditAccount[];
  currency: CurrencyCode;
  onMakePayment: (accountId: string, amount: number, paymentType: string) => Promise<void>;
}

export const CreditLedger: React.FC<CreditLedgerProps> = ({
  accounts,
  currency,
  onMakePayment,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || 'acc-001');
  const [paymentAmount, setPaymentAmount] = useState<string>('25000');
  const [paymentType, setPaymentType] = useState<string>('ACH Transfer');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) return;

    setIsSubmitting(true);
    try {
      await onMakePayment(selectedAccount.id, amt, paymentType);
      setPaymentNotice(
        `Payment of ${formatCurrency(amt, currency)} cleared via ${paymentType}! Available credit refreshed.`
      );
      setTimeout(() => setPaymentNotice(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const utilizationPct = Math.min(
    100,
    Math.round((selectedAccount.currentBalance / selectedAccount.creditLimit) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Commercial Credit & Multi-Tender Settlement</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Automated Ledger Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Retailers and supermarket chains maintain institutional credit lines with Net 30/60 settlement
              windows. Settle invoices via ACH bank wires, corporate debit, or commercial credit cards.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 shrink-0">
          Total Credit Facility: <span className="font-mono text-white font-bold">$700,000 USD</span>
        </div>
      </div>

      {paymentNotice && (
        <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-lg text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{paymentNotice}</span>
          </div>
          <button onClick={() => setPaymentNotice(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Grid: Account Selector & Statement (Left 7 cols), Payment Portal (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Accounts List & Detail */}
        <div className="lg:col-span-7 space-y-4">
          {/* Account Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white truncate max-w-[170px]">{acc.companyName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {acc.creditRating}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Terms: <span className="text-white">{acc.paymentTerms}</span> · Tier: {acc.customerTier}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Balance Due:</span>
                    <span className="font-bold text-white tabular-nums">
                      {formatCurrency(acc.currentBalance, currency)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Account Deep Dive Statement */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">{selectedAccount.companyName}</h3>
                <div className="text-xs text-slate-400">{selectedAccount.email} · {selectedAccount.contactName}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-mono">Rating Status</span>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Tier {selectedAccount.creditRating} (Prime)</span>
                </div>
              </div>
            </div>

            {/* Credit Limit & Utilization Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Credit Facility Utilization:</span>
                <span className="font-mono text-white font-semibold tabular-nums">{utilizationPct}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    utilizationPct > 80 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${utilizationPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Drawn: {formatCurrency(selectedAccount.currentBalance, currency)}</span>
                <span>Available: {formatCurrency(selectedAccount.availableCredit, currency)}</span>
                <span>Facility: {formatCurrency(selectedAccount.creditLimit, currency)}</span>
              </div>
            </div>

            {/* Invoices & Ledger Breakdown */}
            <div className="border-t border-slate-800 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Recent Wholesale Invoices</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Auto-Reconciled</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-mono text-white font-medium">INV-2026-9041</div>
                    <div className="text-[10px] text-slate-400">Net 30 · Due in 14 days · 40 Cases Honeycrisp</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-white font-bold">{formatCurrency(1940, currency)}</div>
                    <span className="text-[10px] text-emerald-400">Open</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-mono text-white font-medium">INV-2026-8812</div>
                    <div className="text-[10px] text-slate-400">Net 60 · Due in 28 days · Pallet Shipped via TRK-881</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-white font-bold">{formatCurrency(14820, currency)}</div>
                    <span className="text-[10px] text-emerald-400">Open</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-white">Execute Payment / Clear Balance</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Instant Settlement</span>
          </div>

          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Paying Account:</label>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-medium">
                {selectedAccount.companyName}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Payment Method:</label>
              <div className="space-y-1.5">
                {[
                  { id: 'ACH Transfer', label: 'ACH Direct Bank Transfer (FedNow Ready)', fee: '0% fee' },
                  { id: 'Credit Card', label: 'Commercial Visa / Mastercard', fee: '1.8% interchange' },
                  { id: 'Debit Card', label: 'Instant Business Debit', fee: '0.5% fee' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentType(m.id)}
                    className={`w-full p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                      paymentType === m.id
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>{m.label}</span>
                    <span className="text-[10px] font-mono text-slate-400">{m.fee}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Payment Amount (USD):</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Quick preset amount buttons */}
              <div className="flex gap-2 mt-2">
                {[5000, 15000, 25000, selectedAccount.currentBalance].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPaymentAmount(preset.toString())}
                    className="flex-1 py-1 text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded"
                  >
                    {idx === 3 ? 'Full Balance' : `$${preset / 1000}k`}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !parseFloat(paymentAmount)}
              className="w-full py-2.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Transmitting Wire Clearing...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit {paymentType} Payment</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
