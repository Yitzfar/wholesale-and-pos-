import React from 'react';
import { CurrencyCode, LanguageCode } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { Bot, ShoppingCart, Globe, DollarSign } from 'lucide-react';

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  language: LanguageCode;
  setLanguage: (l: LanguageCode) => void;
  cartCount: number;
  openCart: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  language,
  setLanguage,
  cartCount,
  openCart,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const navItems = [
    { id: 'portal', label: t.portal },
    { id: 'pos', label: t.pos },
    { id: 'vision', label: t.selfCheckout },
    { id: 'robotics', label: t.robotics },
    { id: 'credit', label: t.credit },
    { id: 'logistics', label: t.logistics },
    { id: 'forecasting', label: t.forecasting },
    { id: 'copilot', label: t.copilot },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <button
            onClick={() => setActiveTab('portal')}
            className="flex items-center gap-2 text-left group shrink-0 focus:outline-none"
          >
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              OmniStock <span className="text-emerald-400 font-medium">Robotics & POS</span>
            </span>
          </button>

          {/* Zone 2: Navigation Links (Single line, whitespace-nowrap) */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Currency, Language & Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Currency Selector */}
            <div className="relative flex items-center bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200">
              <DollarSign className="w-3.5 h-3.5 text-slate-400 mr-1" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent text-slate-200 font-mono text-xs focus:outline-none cursor-pointer"
                aria-label="Currency selector"
              >
                <option value="USD" className="bg-slate-900 text-white">USD ($)</option>
                <option value="EUR" className="bg-slate-900 text-white">EUR (€)</option>
                <option value="GBP" className="bg-slate-900 text-white">GBP (£)</option>
                <option value="CAD" className="bg-slate-900 text-white">CAD (C$)</option>
                <option value="JPY" className="bg-slate-900 text-white">JPY (¥)</option>
              </select>
            </div>

            {/* Language Selector */}
            <div className="relative flex items-center bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200">
              <Globe className="w-3.5 h-3.5 text-slate-400 mr-1" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
                aria-label="Language selector"
              >
                <option value="en" className="bg-slate-900 text-white">EN</option>
                <option value="es" className="bg-slate-900 text-white">ES</option>
                <option value="fr" className="bg-slate-900 text-white">FR</option>
                <option value="de" className="bg-slate-900 text-white">DE</option>
                <option value="zh" className="bg-slate-900 text-white">中文</option>
              </select>
            </div>

            {/* Cart Trigger */}
            <button
              onClick={openCart}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors shadow-sm whitespace-nowrap shrink-0"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="font-mono bg-white text-emerald-800 rounded-full text-[11px] px-1.5 py-0.2 font-bold leading-tight">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Secondary Bar for small screens */}
      <div className="lg:hidden border-t border-slate-800 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap shrink-0 ${
              activeTab === item.id ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
