import React from 'react';
import { ArrowRight, Cpu, Layers, ShieldCheck, Zap } from 'lucide-react';

interface WholesaleHeroProps {
  onQuickAction: (tab: string) => void;
}

export const WholesaleHero: React.FC<WholesaleHeroProps> = ({ onQuickAction }) => {
  return (
    <section className="relative bg-slate-950 text-white overflow-hidden border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Value Proposition & Mechanisms */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded">
              <Cpu className="w-3.5 h-3.5" />
              <span>Autonomous Warehouse Tier-4 Fulfillment Active</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Autonomous Wholesale & Supermarket POS Infrastructure
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Unified high-throughput procurement engine combining computer-vision self-checkout carts,
              real-time warehouse robotics (AGV pallet shuttles and 6-axis picking arms), automated ML replenishment,
              and B2B credit accounts with custom volume tiering.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onQuickAction('pos')}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md flex items-center gap-2"
              >
                <span>Launch POS Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onQuickAction('vision')}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors flex items-center gap-2"
              >
                <span>Smart-Cart CV Camera</span>
              </button>

              <button
                onClick={() => onQuickAction('robotics')}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2"
              >
                <span>Warehouse Digital Twin</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 group">
              <img
                src="/src/assets/images/hero_warehouse_robotics_1793746154379.jpg"
                alt="State-of-the-art automated fulfillment warehouse with AGVs and robotic arms"
                referrerPolicy="no-referrer"
                className="w-full h-72 sm:h-80 object-cover transform transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
              
              {/* Overlay telemetry card */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-3 text-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="font-mono">AGV Fleet Status</span>
                  <span className="text-emerald-400 font-mono">100% Operational</span>
                </div>
                <div className="text-white font-medium truncate">
                  Mission: Order #ORD-481 Pallet Transfer to Dock 2
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Operational Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-slate-800/80">
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800/70">
            <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Robotic Arm Cycle</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">4.2s</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Vacuum suction pick-to-crate</div>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800/70">
            <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>CV Precision Rate</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">99.4%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Produce & carton classification</div>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800/70">
            <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Credit Facility Limit</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">$300K</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Net-60 terms for Supermarkets</div>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800/70">
            <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Autonomous Fleet</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">6 Units</div>
            <div className="text-[11px] text-slate-500 mt-0.5">AGVs, Delta Arms & LoadBots</div>
          </div>
        </div>
      </div>
    </section>
  );
};
