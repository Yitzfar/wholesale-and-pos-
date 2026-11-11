import React, { useState, useEffect } from 'react';
import { Product, PosTerminal, RobotUnit, CreditAccount, Shipment, DemandForecast, CurrencyCode, LanguageCode } from './types';
import { INITIAL_PRODUCTS, INITIAL_ACCOUNTS, INITIAL_POS_TERMINALS, INITIAL_ROBOTS, INITIAL_SHIPMENTS, INITIAL_FORECASTS } from './data/mockData';
import { TopNav } from './components/TopNav';
import { WholesaleHero } from './components/WholesaleHero';
import { RetailerPortal } from './components/RetailerPortal';
import { PosSystem } from './components/PosSystem';
import { SelfCheckoutVision } from './components/SelfCheckoutVision';
import { RoboticsWarehouse } from './components/RoboticsWarehouse';
import { CreditLedger } from './components/CreditLedger';
import { LogisticsFleet } from './components/LogisticsFleet';
import { AiForecastPricing } from './components/AiForecastPricing';
import { WholesaleAiCopilot } from './components/WholesaleAiCopilot';
import { CartModal } from './components/CartModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('portal');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [language, setLanguage] = useState<LanguageCode>('en');

  // Application Data States
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [terminals, setTerminals] = useState<PosTerminal[]>(INITIAL_POS_TERMINALS);
  const [accounts, setAccounts] = useState<CreditAccount[]>(INITIAL_ACCOUNTS);
  const [currentAccount, setCurrentAccount] = useState<CreditAccount>(INITIAL_ACCOUNTS[0]);
  const [robots, setRobots] = useState<RobotUnit[]>(INITIAL_ROBOTS);
  const [shipments, setShipments] = useState<Shipment[]>(INITIAL_SHIPMENTS);
  const [forecasts, setForecasts] = useState<DemandForecast[]>(INITIAL_FORECASTS);

  // Wholesale Order Cart State
  const [cart, setCart] = useState<{ product: Product; quantity: number; unitPrice: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [globalBanner, setGlobalBanner] = useState<string | null>(null);

  // Initial fetch from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, termRes, accRes, robRes, shpRes, foreRes] = await Promise.all([
          fetch('/api/products').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/pos/terminals').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/credit/accounts').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/robotics/fleet').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/logistics/shipments').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/forecasts').then((r) => (r.ok ? r.json() : null)),
        ]);

        if (prodRes?.products) setProducts(prodRes.products);
        if (termRes?.terminals) setTerminals(termRes.terminals);
        if (accRes?.accounts) {
          setAccounts(accRes.accounts);
          setCurrentAccount(accRes.accounts[0]);
        }
        if (robRes?.robots) setRobots(robRes.robots);
        if (shpRes?.shipments) setShipments(shpRes.shipments);
        if (foreRes?.forecasts) setForecasts(foreRes.forecasts);
      } catch (err) {
        console.warn('Backend API connection using local state:', err);
      }
    };

    fetchData();

    // Periodic telemetry sync for AGV positions
    const interval = setInterval(async () => {
      try {
        const robRes = await fetch('/api/robotics/fleet');
        if (robRes.ok) {
          const data = await robRes.json();
          if (data.robots) setRobots(data.robots);
        }
      } catch {
        // silent fallback
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Cart operations
  const handleAddToCart = (product: Product, quantity: number, unitPrice: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity, unitPrice }];
    });
    setGlobalBanner(`Added ${quantity}x ${product.name} to Wholesale Cart.`);
    setTimeout(() => setGlobalBanner(null), 3000);
  };

  const handleUpdateCartQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: qty } : item))
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Complete Order
  const handleCheckoutOrder = async (orderPayload?: any) => {
    const payload = orderPayload || {
      customerId: currentAccount.id,
      customerName: currentAccount.companyName,
      items: cart,
      paymentMethod: 'Account Credit (Net-30)',
      terminalId: 'pos-lane-01',
    };

    try {
      const res = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        if (data.productsUpdated) setProducts(data.productsUpdated);
        setCart([]);
        setIsCartOpen(false);

        // Update local account available credit
        setAccounts((prev) =>
          prev.map((acc) => {
            if (acc.id === payload.customerId) {
              const newBalance = acc.currentBalance + data.order.total;
              return {
                ...acc,
                currentBalance: newBalance,
                availableCredit: Math.max(0, acc.creditLimit - newBalance),
              };
            }
            return acc;
          })
        );

        setGlobalBanner(
          `Wholesale Order #${data.order.id} verified! Autonomous picking dispatched to Kuka-X1 & AGV Alpha.`
        );
        setTimeout(() => setGlobalBanner(null), 4500);
        return data;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  // Automated Reorder Trigger
  const handleReorderTrigger = async (productId: string) => {
    try {
      const res = await fetch('/api/products/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (data.success && data.product) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock: data.product.stock } : p))
        );
      }
    } catch (err) {
      console.error('Reorder error:', err);
    }
  };

  // Robotics Dispatch
  const handleDispatchRobot = async (robotId: string, task: string, targetX: number, targetY: number) => {
    try {
      const res = await fetch('/api/robotics/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ robotId, task, targetX, targetY }),
      });
      const data = await res.json();
      if (data.success && data.robot) {
        setRobots((prev) => prev.map((r) => (r.id === robotId ? data.robot : r)));
      }
    } catch (err) {
      console.error('Dispatch error:', err);
    }
  };

  // Emergency Stop
  const handleEStop = async (stop: boolean) => {
    try {
      const res = await fetch('/api/robotics/estop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stop }),
      });
      const data = await res.json();
      if (data.success && data.robots) {
        setRobots(data.robots);
      }
    } catch (err) {
      console.error('E-Stop error:', err);
    }
  };

  // Credit Account Payment
  const handleMakePayment = async (accountId: string, amount: number, paymentType: string) => {
    try {
      const res = await fetch('/api/credit/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, amount, paymentType }),
      });
      const data = await res.json();
      if (data.success && data.account) {
        setAccounts((prev) => prev.map((a) => (a.id === accountId ? data.account : a)));
        if (currentAccount.id === accountId) {
          setCurrentAccount(data.account);
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
    }
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        language={language}
        setLanguage={setLanguage}
        cartCount={totalCartCount}
        openCart={() => setIsCartOpen(true)}
      />

      {/* Global Notification Banner */}
      {globalBanner && (
        <div className="bg-emerald-600 text-white text-xs py-2 px-4 text-center font-medium shadow-sm transition-all duration-300">
          {globalBanner}
        </div>
      )}

      {/* Hero Showcase (Always visible on Portal, or contextual) */}
      {activeTab === 'portal' && <WholesaleHero onQuickAction={setActiveTab} />}

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'portal' && (
          <RetailerPortal
            products={products}
            currentAccount={currentAccount}
            onSwitchAccount={setCurrentAccount}
            accounts={accounts}
            currency={currency}
            onAddToCart={handleAddToCart}
            onReorderTrigger={handleReorderTrigger}
          />
        )}

        {activeTab === 'pos' && (
          <PosSystem
            products={products}
            terminals={terminals}
            accounts={accounts}
            currency={currency}
            onCompleteOrder={handleCheckoutOrder}
          />
        )}

        {activeTab === 'vision' && (
          <SelfCheckoutVision
            products={products}
            currency={currency}
            onAddToCart={handleAddToCart}
          />
        )}

        {activeTab === 'robotics' && (
          <RoboticsWarehouse
            robots={robots}
            onDispatch={handleDispatchRobot}
            onEStop={handleEStop}
          />
        )}

        {activeTab === 'credit' && (
          <CreditLedger
            accounts={accounts}
            currency={currency}
            onMakePayment={handleMakePayment}
          />
        )}

        {activeTab === 'logistics' && <LogisticsFleet shipments={shipments} />}

        {activeTab === 'forecasting' && (
          <AiForecastPricing
            products={products}
            forecasts={forecasts}
            currency={currency}
          />
        )}

        {activeTab === 'copilot' && (
          <WholesaleAiCopilot
            warehouseContext={{
              productsCount: products.length,
              activeRobots: robots.filter((r) => r.status === 'active').length,
              currentAccount: currentAccount.companyName,
              availableCredit: currentAccount.availableCredit,
              shipmentsCount: shipments.length,
            }}
          />
        )}
      </main>

      {/* Wholesale Order Cart Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        currency={currency}
        account={currentAccount}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => handleCheckoutOrder()}
      />

      {/* Clean Footer (Anti-Slop Restraint) */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">OmniStock Autonomous Wholesale</span>
            <span>·</span>
            <span>Supermarket POS & Robotics Fleet Infrastructure</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => setActiveTab('pos')} className="hover:text-slate-300">
              Terminal POS
            </button>
            <button onClick={() => setActiveTab('vision')} className="hover:text-slate-300">
              Smart-Cart CV
            </button>
            <button onClick={() => setActiveTab('robotics')} className="hover:text-slate-300">
              Warehouse Twin
            </button>
            <button onClick={() => setActiveTab('credit')} className="hover:text-slate-300">
              Credit Accounts
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
