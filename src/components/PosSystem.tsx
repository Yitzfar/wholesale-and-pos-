import React, { useState } from 'react';
import { Product, PosTerminal, CreditAccount, CurrencyCode } from '../types';
import { formatCurrency } from '../i18n/translations';
import {
  Scan,
  CreditCard,
  Building,
  Printer,
  CheckCircle2,
  Receipt,
  RotateCcw,
  Plus,
  Trash2,
  Radio,
  ShoppingBag,
} from 'lucide-react';

interface PosSystemProps {
  products: Product[];
  terminals: PosTerminal[];
  accounts: CreditAccount[];
  currency: CurrencyCode;
  onCompleteOrder: (orderData: any) => Promise<any>;
}

export const PosSystem: React.FC<PosSystemProps> = ({
  products,
  terminals,
  accounts,
  currency,
  onCompleteOrder,
}) => {
  const [selectedTerminal, setSelectedTerminal] = useState<string>(terminals[0]?.id || 'pos-lane-01');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [posCart, setPosCart] = useState<{ product: Product; quantity: number; unitPrice: number }[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(accounts[0] || null);
  const [paymentMethod, setPaymentMethod] = useState<'Credit Card' | 'Debit Card' | 'ACH Transfer' | 'Account Credit (Net-30)'>('Credit Card');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [lastReceipt, setLastReceipt] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);
  const [scannerNotice, setScannerNotice] = useState<string | null>(null);

  // Quick product add by barcode or SKU
  const handleScanBarcode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    const matched = products.find((p) => p.barcode === trimmed || p.sku.toLowerCase() === trimmed.toLowerCase());
    if (matched) {
      addItemToCart(matched);
      setScannerNotice(`Scanned: ${matched.name} (${matched.sku})`);
      setBarcodeInput('');
      setTimeout(() => setScannerNotice(null), 2500);
    } else {
      setScannerNotice(`Barcode not recognized: ${trimmed}`);
      setTimeout(() => setScannerNotice(null), 3000);
    }
  };

  const addItemToCart = (product: Product) => {
    setPosCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: product.basePrice }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setPosCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number; unitPrice: number }[]
    );
  };

  const clearCart = () => {
    setPosCart([]);
    setLastReceipt(null);
  };

  // Calculations
  const subtotal = posCart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const tax = Number((subtotal * 0.0825).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  const handleProcessPayment = async () => {
    if (posCart.length === 0) return;
    setProcessing(true);

    const orderPayload = {
      customerId: selectedAccount ? selectedAccount.id : 'WALK-IN',
      customerName: selectedAccount ? selectedAccount.companyName : 'Retail Supermarket Customer',
      items: posCart.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        originalPrice: item.product.basePrice,
        discountAppliedPct: 0,
      })),
      paymentMethod,
      terminalId: selectedTerminal,
    };

    try {
      const res = await onCompleteOrder(orderPayload);
      if (res && res.order) {
        setLastReceipt(res.order);
        setPosCart([]);
      }
    } finally {
      setProcessing(false);
    }
  };

  const currentTermObj = terminals.find((t) => t.id === selectedTerminal) || terminals[0];

  return (
    <div className="space-y-6">
      {/* Terminal Status & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm text-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">{currentTermObj?.name}</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Synced Online
              </span>
              <span className="text-xs text-slate-400 font-mono">{currentTermObj?.ipAddress}</span>
            </div>
            <div className="text-xs text-slate-400">
              Location: {currentTermObj?.location} · Cashier: {currentTermObj?.currentCashier || 'Automated Lane'} · Synced with Central Warehouse Robotics
            </div>
          </div>
        </div>

        {/* Terminal Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap">Switch Terminal:</label>
          <select
            value={selectedTerminal}
            onChange={(e) => setSelectedTerminal(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-white rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {terminals.map((t) => (
              <option key={t.id} value={t.id} className="bg-slate-900">
                {t.name} ({t.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main POS Interface Grid: Left Scanner & Quick Keys, Right Checkout Register */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Barcode Scanner & Quick-Select Items (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Optical Barcode Scanner Input */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Scan className="w-4 h-4 text-emerald-400" />
                <span>Barcode Scanner / SKU Lookup</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">USB / Bluetooth Emulation Active</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleScanBarcode(barcodeInput);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan or enter barcode (e.g., 074451001429, ORG-APL-40LB)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>Scan</span>
              </button>
            </form>

            {scannerNotice && (
              <div className="mt-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{scannerNotice}</span>
              </div>
            )}
          </div>

          {/* Quick Item Grid for Cashiers */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-white">Quick-Key Fast Wholesale Catalog</h3>
              <span className="text-[11px] text-slate-400">Click to add to register</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addItemToCart(p)}
                  className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-lg text-left transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="text-[10px] font-mono text-emerald-400 group-hover:text-emerald-300">
                      {p.sku}
                    </div>
                    <div className="text-xs font-medium text-slate-200 line-clamp-2 mt-0.5">
                      {p.name}
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white tabular-nums">
                      {formatCurrency(p.basePrice, currency)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Stock: {p.stock}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Register Cart & Multi-Tender Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Register Tape</h3>
              </div>
              {posCart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Void Ticket</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {posCart.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                Scan barcode or select items from catalog to start POS transaction.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {posCart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 bg-slate-950 border border-slate-800/90 rounded-lg flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-white truncate">{item.product.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {formatCurrency(item.unitPrice, currency)} × {item.quantity} ={' '}
                        <span className="text-emerald-300 font-semibold tabular-nums">
                          {formatCurrency(item.unitPrice * item.quantity, currency)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-mono font-bold text-white tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Subtotal & Tax */}
            <div className="border-t border-slate-800 pt-3 mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono text-white tabular-nums">{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Tax (8.25%):</span>
                <span className="font-mono text-white tabular-nums">{formatCurrency(tax, currency)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>Total Due:</span>
                <span className="font-mono text-emerald-400 text-base tabular-nums">
                  {formatCurrency(total, currency)}
                </span>
              </div>
            </div>

            {/* Account Link & Payment Methods */}
            <div className="border-t border-slate-800 pt-3 mt-3 space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Charge to Account / Buyer:</label>
                <select
                  value={selectedAccount ? selectedAccount.id : ''}
                  onChange={(e) => {
                    const acc = accounts.find((a) => a.id === e.target.value) || null;
                    setSelectedAccount(acc);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Walk-In Retail Customer (No Account)</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.companyName} (Limit: {formatCurrency(acc.availableCredit, currency)} avail)
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tender Payment Method:</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'Credit Card', icon: CreditCard },
                    { id: 'Debit Card', icon: CreditCard },
                    { id: 'ACH Transfer', icon: Building },
                    { id: 'Account Credit (Net-30)', icon: Receipt },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors ${
                          isSelected
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-semibold'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{m.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Complete Transaction Button */}
              <button
                onClick={handleProcessPayment}
                disabled={posCart.length === 0 || processing}
                className="w-full py-2.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {processing ? (
                  <span>Transmitting to Payment Gateway & Warehouse AGVs...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize & Print Receipt ({formatCurrency(total, currency)})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Receipt Viewer */}
          {lastReceipt && (
            <div className="bg-slate-900 border border-emerald-800/80 rounded-xl p-4 shadow-lg text-slate-200 text-xs font-mono animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Printer className="w-4 h-4" />
                  <span>Official Supermarket POS Receipt</span>
                </div>
                <span className="text-[10px] text-slate-400">{lastReceipt.receiptNumber}</span>
              </div>

              <div className="text-[11px] text-slate-400 space-y-0.5 mb-3">
                <div>OmniStock Wholesale & Supermarket Logistics</div>
                <div>Terminal: {lastReceipt.posTerminalId} · Lane 01 Pier A</div>
                <div>Customer: {lastReceipt.customerName}</div>
                <div>Tender: {lastReceipt.paymentMethod}</div>
                <div>Robot Dispatched: <span className="text-emerald-400 font-semibold">{lastReceipt.robotAssigned}</span></div>
              </div>

              <div className="border-t border-b border-slate-800 py-2 space-y-1 mb-2">
                {lastReceipt.items?.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span className="truncate max-w-[180px]">{it.quantity}x {it.product.name}</span>
                    <span>{formatCurrency(it.unitPrice * it.quantity, currency)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(lastReceipt.subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tax (8.25%):</span>
                  <span>{formatCurrency(lastReceipt.tax, currency)}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-sm pt-1 border-t border-slate-800">
                  <span>Total Paid:</span>
                  <span className="text-emerald-400">{formatCurrency(lastReceipt.total, currency)}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 text-center text-[10px] text-slate-400">
                ★ AGV Picking Mission Triggered Automatically ★
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
