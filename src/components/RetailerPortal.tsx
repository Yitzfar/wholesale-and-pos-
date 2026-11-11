import React, { useState } from 'react';
import { Product, CreditAccount, CurrencyCode } from '../types';
import { formatCurrency } from '../i18n/translations';
import { Search, Plus, RefreshCw, CheckCircle2, AlertTriangle, Sparkles, Building2 } from 'lucide-react';

interface RetailerPortalProps {
  products: Product[];
  currentAccount: CreditAccount;
  onSwitchAccount: (account: CreditAccount) => void;
  accounts: CreditAccount[];
  currency: CurrencyCode;
  onAddToCart: (product: Product, quantity: number, unitPrice: number) => void;
  onReorderTrigger: (productId: string) => Promise<void>;
}

export const RetailerPortal: React.FC<RetailerPortalProps> = ({
  products,
  currentAccount,
  onSwitchAccount,
  accounts,
  currency,
  onAddToCart,
  onReorderTrigger,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const categories = ['All', 'Produce', 'Dairy & Chilled', 'Dry Goods & Pantry', 'Beverages', 'Bakery', 'Packaging & Bulk'];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getQuantity = (id: string) => quantities[id] || 1;

  const setQuantity = (id: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, qty) }));
  };

  // Calculate customized wholesale unit price considering bulk tiers + account tier
  const calculateEffectivePrice = (product: Product, qty: number) => {
    let bulkDiscount = 0;
    for (const tier of product.bulkTiers) {
      if (qty >= tier.minQty && (!tier.maxQty || qty <= tier.maxQty)) {
        bulkDiscount = tier.discountPct;
      }
    }
    const tierDiscount = currentAccount.discountRatePct || 0;
    const combinedDiscount = Math.min(35, bulkDiscount + tierDiscount);
    const effectiveUnitPrice = product.basePrice * (1 - combinedDiscount / 100);
    return {
      effectiveUnitPrice,
      combinedDiscount,
      total: effectiveUnitPrice * qty,
    };
  };

  const handleReorder = async (productId: string) => {
    setReorderingId(productId);
    try {
      await onReorderTrigger(productId);
      setFeedbackMsg('Autonomous replenishment order sent to AGV Shuttle fleet!');
      setTimeout(() => setFeedbackMsg(null), 3500);
    } finally {
      setReorderingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Account Profile Bar & Procurement Terms */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm text-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">{currentAccount.companyName}</h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Rating {currentAccount.creditRating}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {currentAccount.customerTier} Tier (-{currentAccount.discountRatePct}%)
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Contact: {currentAccount.contactName} · Terms: <span className="text-white font-medium">{currentAccount.paymentTerms}</span> · Available Credit:{' '}
                <span className="font-mono text-emerald-400 font-semibold">{formatCurrency(currentAccount.availableCredit, currency)}</span> of {formatCurrency(currentAccount.creditLimit, currency)}
              </div>
            </div>
          </div>

          {/* Account Switcher for Wholesale Demonstration */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <label className="text-xs text-slate-400 whitespace-nowrap">Switch Account:</label>
            <select
              value={currentAccount.id}
              onChange={(e) => {
                const found = accounts.find((a) => a.id === e.target.value);
                if (found) onSwitchAccount(found);
              }}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-slate-900">
                  {acc.companyName} ({acc.creditRating} / {acc.customerTier})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-lg text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU, produce, barcode (e.g. 074451)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Wholesale Product Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const qty = getQuantity(product.id);
          const { effectiveUnitPrice, combinedDiscount, total } = calculateEffectivePrice(product, qty);
          const isLowStock = product.stock <= product.minStockThreshold;

          return (
            <div
              key={product.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900">
                      {product.sku}
                    </span>
                    <h3 className="text-sm font-semibold text-white mt-1.5 leading-snug">{product.name}</h3>
                  </div>
                  {product.isOrganic && (
                    <span className="text-[10px] font-semibold tracking-wider text-green-300 bg-green-950/80 px-2 py-0.5 rounded border border-green-800 shrink-0">
                      ORGANIC
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 space-y-1 mb-4">
                  <div className="flex items-center justify-between">
                    <span>Packaging Unit:</span>
                    <span className="text-slate-200 font-medium">{product.unit} ({product.weightKg} kg)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Temp Zone:</span>
                    <span className="text-slate-300">{product.temperatureZone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Barcode:</span>
                    <span className="font-mono text-slate-400 text-[11px]">{product.barcode}</span>
                  </div>
                </div>

                {/* Stock Level Bar & Auto-Reorder Trigger */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Warehouse Inventory:</span>
                    <span className={`font-mono font-semibold tabular-nums ${isLowStock ? 'text-amber-400 flex items-center gap-1' : 'text-emerald-400'}`}>
                      {isLowStock && <AlertTriangle className="w-3.5 h-3.5" />}
                      {product.stock} units
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${isLowStock ? 'bg-amber-400' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, (product.stock / 250) * 100)}%` }}
                    />
                  </div>

                  {isLowStock && (
                    <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                      <span className="text-amber-300">Below Safety Threshold ({product.minStockThreshold})</span>
                      <button
                        onClick={() => handleReorder(product.id)}
                        disabled={reorderingId === product.id}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${reorderingId === product.id ? 'animate-spin' : ''}`} />
                        <span>Auto-Replenish AGV</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Bulk Tiers breakdown */}
                <div className="border-t border-slate-800 pt-3 mb-4">
                  <div className="text-[11px] text-slate-400 font-medium mb-1.5">Bulk Quantity Tiers:</div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                    {product.bulkTiers.map((t, idx) => (
                      <div
                        key={idx}
                        className={`p-1.5 rounded border ${
                          qty >= t.minQty && (!t.maxQty || qty <= t.maxQty)
                            ? 'bg-emerald-950/70 border-emerald-600 text-emerald-300 font-semibold'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div>{t.maxQty ? `${t.minQty}-${t.maxQty}` : `${t.minQty}+`} units</div>
                        <div className="text-white font-bold">{t.discountPct > 0 ? `-${t.discountPct}%` : 'Base'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing & Add to Cart Controls */}
              <div className="border-t border-slate-800 pt-3">
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-xs text-slate-400">Your Unit Price:</span>
                    <div className="text-lg font-bold font-mono text-white tabular-nums">
                      {formatCurrency(effectiveUnitPrice, currency)}
                      {combinedDiscount > 0 && (
                        <span className="ml-2 text-xs text-slate-400 line-through">
                          {formatCurrency(product.basePrice, currency)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 font-mono">Total ({qty} units)</span>
                    <div className="text-sm font-bold font-mono text-emerald-300 tabular-nums">
                      {formatCurrency(total, currency)}
                    </div>
                  </div>
                </div>

                {/* Quantity adjustment & Add button */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
                    <button
                      onClick={() => setQuantity(product.id, qty - 1)}
                      className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white rounded hover:bg-slate-800"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={qty}
                      onChange={(e) => setQuantity(product.id, parseInt(e.target.value) || 1)}
                      className="w-12 text-center text-xs font-mono text-white bg-transparent focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity(product.id, qty + 1)}
                      className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white rounded hover:bg-slate-800"
                    >
                      +
                    </button>
                  </div>

                  {/* Quick increment buttons */}
                  <div className="hidden sm:flex items-center gap-1">
                    {[10, 25, 50].map((inc) => (
                      <button
                        key={inc}
                        onClick={() => setQuantity(product.id, inc)}
                        className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
                          qty === inc
                            ? 'bg-emerald-900 border-emerald-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {inc}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => onAddToCart(product, qty, effectiveUnitPrice)}
                    className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Order</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Recommendations Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">
            AI Automated Replenishment & Bundling Recommendations
          </h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          Based on Metro Supermarkets' Tuesday turnover rate and upcoming regional weather, our machine learning
          forecaster projects a 42% spike in <span className="text-white font-medium">Sparkling Mineral Water</span> and{' '}
          <span className="text-white font-medium">Organic Honeycrisp Apples</span>. Automated reorder batch ready for
          autonomous robotic arm pick-and-pack.
        </p>

        <div className="flex flex-wrap gap-2">
          {products.slice(0, 3).map((p) => (
            <div
              key={p.id}
              className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs flex items-center gap-3"
            >
              <div>
                <div className="font-medium text-white">{p.name}</div>
                <div className="text-[11px] text-slate-400">Stock: {p.stock} units · Reorder: +{p.reorderQuantity}</div>
              </div>
              <button
                onClick={() => onAddToCart(p, p.reorderQuantity, p.basePrice * 0.88)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600/80 hover:bg-emerald-500 text-white rounded transition-colors"
              >
                1-Click Bundle
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
