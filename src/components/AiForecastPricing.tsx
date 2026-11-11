import React, { useState } from 'react';
import { Product, DemandForecast, CurrencyCode, CustomerTier, CreditRating } from '../types';
import { formatCurrency } from '../i18n/translations';
import {
  TrendingUp,
  Sliders,
  ShieldAlert,
  SunMedium,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AiForecastPricingProps {
  products: Product[];
  forecasts: DemandForecast[];
  currency: CurrencyCode;
}

export const AiForecastPricing: React.FC<AiForecastPricingProps> = ({
  products,
  forecasts,
  currency,
}) => {
  // Pricing simulator state
  const [simProduct, setSimProduct] = useState<string>(products[0]?.id || 'prod-001');
  const [simQty, setSimQty] = useState<number>(30);
  const [simTier, setSimTier] = useState<CustomerTier>('Supermarket');
  const [simRating, setSimRating] = useState<CreditRating>('AAA');
  const [simHour, setSimHour] = useState<number>(23); // off-peak night hours

  // Fraud simulator state
  const [fraudTestOrderValue, setFraudTestOrderValue] = useState<number>(45000);
  const [fraudGeoVariance, setFraudGeoVariance] = useState<string>('Standard Hub IP (San Francisco, CA)');

  const selectedProd = products.find((p) => p.id === simProduct) || products[0];

  // Dynamic pricing calculations
  const calculateSimPricing = () => {
    let bulkDiscount = 0;
    for (const tier of selectedProd.bulkTiers) {
      if (simQty >= tier.minQty && (!tier.maxQty || simQty <= tier.maxQty)) {
        bulkDiscount = tier.discountPct;
      }
    }
    const tierMap: Record<CustomerTier, number> = {
      Supermarket: 12,
      WholesaleClub: 8,
      Institutional: 10,
      IndependentGrocer: 5,
    };
    const tierDiscount = tierMap[simTier] || 0;

    const creditMap: Record<CreditRating, number> = {
      AAA: 3,
      AA: 2,
      A: 1,
      BBB: 0,
    };
    const creditDiscount = creditMap[simRating] || 0;

    const isOffPeak = simHour >= 21 || simHour <= 6;
    const offPeakDiscount = isOffPeak ? 4 : 0;

    const totalDiscountPct = Math.min(35, bulkDiscount + tierDiscount + creditDiscount + offPeakDiscount);
    const unitPrice = selectedProd.basePrice * (1 - totalDiscountPct / 100);
    const total = unitPrice * simQty;

    return {
      bulkDiscount,
      tierDiscount,
      creditDiscount,
      offPeakDiscount,
      totalDiscountPct,
      unitPrice,
      total,
      savings: (selectedProd.basePrice - unitPrice) * simQty,
    };
  };

  const simResult = calculateSimPricing();

  // Fraud scoring logic
  const isHighValue = fraudTestOrderValue > 80000;
  const isSuspiciousGeo = fraudGeoVariance.includes('Proxy') || fraudGeoVariance.includes('Unknown');
  const riskScore = (isHighValue ? 45 : 10) + (isSuspiciousGeo ? 40 : 5);
  const riskLevel = riskScore > 60 ? 'High Risk' : riskScore > 30 ? 'Moderate Audit' : 'Low Risk (Auto-Approved)';

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">AI Demand Forecasting & Dynamic Pricing Rules</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Neural Model V4.2 Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Predict future 7-day grocery demand spikes using seasonal weather models, store footfall patterns,
              and test dynamic wholesale pricing rules (bulk tiers, off-peak hours, customer credit rating).
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 shrink-0">
          Model Accuracy: <span className="font-mono text-white font-bold">96.8% Mean Average Precision</span>
        </div>
      </div>

      {/* Grid: Left Demand Forecasting (6 cols), Right Dynamic Pricing Sandbox (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 7-Day Demand Forecasting Cards (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-white">7-Day Predictive Demand Curve</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Weather Grounded</span>
            </div>

            <div className="space-y-3">
              {forecasts.map((f) => {
                const growthPct = Math.round(((f.forecastNextWeek - f.currentDemand) / f.currentDemand) * 100);
                return (
                  <div key={f.sku} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-emerald-400">{f.sku}</span>
                        <h4 className="text-xs font-semibold text-white">{f.name}</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{growthPct}%
                      </span>
                    </div>

                    {/* Progress representation */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                        <span>Current: {f.currentDemand} units</span>
                        <span>Projected: {f.forecastNextWeek} units</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (f.forecastNextWeek / 600) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                      <span className="flex items-center gap-1">
                        <SunMedium className="w-3 h-3 text-amber-400" />
                        <span>Weather Impact: {f.weatherImpact}</span>
                      </span>
                      <span>
                        Recommended Reorder: <strong className="text-white">{f.recommendedReorderDate}</strong> (+{f.recommendedOrderQty})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wholesale Fraud & Risk Shield */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-white">AI Fraud & Credit Risk Detection</h3>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                riskScore > 60
                  ? 'bg-red-950 text-red-300 border-red-800'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}>
                {riskLevel}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Simulate Order Value (USD):</label>
                <input
                  type="range"
                  min="5000"
                  max="150000"
                  step="5000"
                  value={fraudTestOrderValue}
                  onChange={(e) => setFraudTestOrderValue(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="text-right font-mono text-white text-xs">
                  {formatCurrency(fraudTestOrderValue, currency)}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Geolocation & Terminal Origin:</label>
                <select
                  value={fraudGeoVariance}
                  onChange={(e) => setFraudGeoVariance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg p-2"
                >
                  <option value="Standard Hub IP (San Francisco, CA)">Standard Verified Hub (San Francisco, CA)</option>
                  <option value="New Store Terminal (Seattle, WA)">New Store Terminal (Seattle, WA)</option>
                  <option value="Unknown Offshore Proxy IP">Unknown Proxy IP (Anomalous Origin)</option>
                </select>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                <span>Anomaly Risk Score:</span>
                <span className={`font-mono font-bold ${riskScore > 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {riskScore} / 100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Dynamic Pricing Simulator (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-white">Dynamic Pricing Rules Simulator</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Live Equation Engine</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Product selection */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Select Catalog Product:</label>
              <select
                value={simProduct}
                onChange={(e) => setSimProduct(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Base: {formatCurrency(p.basePrice, currency)})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] text-slate-400">Order Volume Quantity:</label>
                <span className="font-mono text-white font-bold">{simQty} units</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={simQty}
                onChange={(e) => setSimQty(parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Customer Tier & Credit Rating */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Customer Tier:</label>
                <select
                  value={simTier}
                  onChange={(e) => setSimTier(e.target.value as CustomerTier)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs"
                >
                  <option value="Supermarket">Supermarket (-12%)</option>
                  <option value="WholesaleClub">Wholesale Club (-8%)</option>
                  <option value="Institutional">Institutional (-10%)</option>
                  <option value="IndependentGrocer">Independent Grocer (-5%)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Credit Rating:</label>
                <select
                  value={simRating}
                  onChange={(e) => setSimRating(e.target.value as CreditRating)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs"
                >
                  <option value="AAA">Rating AAA (-3%)</option>
                  <option value="AA">Rating AA (-2%)</option>
                  <option value="A">Rating A (-1%)</option>
                  <option value="BBB">Rating BBB (0%)</option>
                </select>
              </div>
            </div>

            {/* Time of Day */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] text-slate-400">Time of Day (Warehouse Dispatch Hour):</label>
                <span className="font-mono text-white">
                  {simHour.toString().padStart(2, '0')}:00 {simHour >= 21 || simHour <= 6 ? '(Off-Peak -4%)' : '(Peak Standard)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="23"
                value={simHour}
                onChange={(e) => setSimHour(parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Dynamic Price Breakdown Results */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2 mt-4">
              <div className="text-xs font-semibold text-white mb-2">Calculated Rule Composition:</div>
              <div className="flex justify-between text-slate-400">
                <span>Base Catalog Unit Price:</span>
                <span className="font-mono text-white">{formatCurrency(selectedProd.basePrice, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Bulk Quantity Tier:</span>
                <span className="font-mono text-emerald-400">-{simResult.bulkDiscount}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Customer Tier ({simTier}):</span>
                <span className="font-mono text-emerald-400">-{simResult.tierDiscount}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Credit Rating ({simRating}):</span>
                <span className="font-mono text-emerald-400">-{simResult.creditDiscount}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Off-Peak Time Incentive:</span>
                <span className="font-mono text-emerald-400">-{simResult.offPeakDiscount}%</span>
              </div>
              <div className="flex justify-between text-white font-bold pt-2 border-t border-slate-800">
                <span>Net Discount Applied:</span>
                <span className="font-mono text-emerald-400">-{simResult.totalDiscountPct}%</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-1">
                <span>Final Unit Price:</span>
                <span className="font-mono text-white text-base">
                  {formatCurrency(simResult.unitPrice, currency)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 pt-1">
                <span>Total for {simQty} units:</span>
                <span className="font-mono text-emerald-300 font-bold text-sm">
                  {formatCurrency(simResult.total, currency)}
                </span>
              </div>
              <div className="text-[11px] text-emerald-400 text-right font-mono">
                Total Buyer Savings: {formatCurrency(simResult.savings, currency)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
