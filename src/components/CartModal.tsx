import React from 'react';
import { Product, CurrencyCode, CreditAccount } from '../types';
import { formatCurrency } from '../i18n/translations';
import { ShoppingCart, X, Trash2, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  currency: CurrencyCode;
  account: CreditAccount;
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  cart,
  currency,
  account,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const tax = Number((subtotal * 0.0825).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Wholesale Order Cart</h3>
            <span className="text-xs font-mono text-slate-400">({cart.length} items)</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Your wholesale order cart is empty. Add crates or bulk packs from the catalog.
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white truncate">{item.product.name}</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    SKU: {item.product.sku} · {formatCurrency(item.unitPrice, currency)} / {item.product.unit}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-white tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white"
                    >
                      +
                    </button>
                  </div>

                  <span className="w-20 text-right font-mono font-bold text-emerald-400 tabular-nums">
                    {formatCurrency(item.unitPrice * item.quantity, currency)}
                  </span>

                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}

          {cart.length > 0 && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Account Credit Facility Verified ({account.companyName})</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Payment Terms: <span className="text-white">{account.paymentTerms}</span> · Available Line:{' '}
                <span className="text-emerald-400 font-mono font-bold">
                  {formatCurrency(account.availableCredit, currency)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Wholesale Subtotal:</span>
                <span className="font-mono text-white tabular-nums">{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Commercial Tax (8.25%):</span>
                <span className="font-mono text-white tabular-nums">{formatCurrency(tax, currency)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>Total Procurement Cost:</span>
                <span className="font-mono text-emerald-400 text-base tabular-nums">
                  {formatCurrency(total, currency)}
                </span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="w-full py-2.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Submit Wholesale Order to Robotic Picking</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
