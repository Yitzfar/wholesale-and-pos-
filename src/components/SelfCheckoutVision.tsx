import React, { useState } from 'react';
import { Product, CurrencyCode, RecognizedItem } from '../types';
import { formatCurrency } from '../i18n/translations';
import {
  Camera,
  Scan,
  CheckCircle2,
  Scale,
  Sparkles,
  ShoppingBag,
  Plus,
  Trash2,
  Eye,
  AlertCircle,
} from 'lucide-react';

interface SelfCheckoutVisionProps {
  products: Product[];
  currency: CurrencyCode;
  onAddToCart: (product: Product, quantity: number, unitPrice: number) => void;
}

export const SelfCheckoutVision: React.FC<SelfCheckoutVisionProps> = ({
  products,
  currency,
  onAddToCart,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('honeycrisp');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [recognized, setRecognized] = useState<RecognizedItem | null>({
    label: 'Organic Honeycrisp Apples (Grade A)',
    matchedSku: 'ORG-APL-40LB',
    confidence: 0.984,
    estimatedWeightKg: 18.2,
    unitPrice: 48.50,
    boundingBox: { x: 22, y: 25, width: 56, height: 50 },
  });
  const [smartCart, setSmartCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const presets = [
    {
      id: 'honeycrisp',
      name: 'Organic Honeycrisp Apples',
      sku: 'ORG-APL-40LB',
      image: '/src/assets/images/wholesale_pallet_goods_1793746155529.jpg',
      tareWeight: 18.2,
    },
    {
      id: 'avocado',
      name: 'Prime Hass Avocados',
      sku: 'AVO-HASS-25LB',
      image: '/src/assets/images/wholesale_pallet_goods_1793746155529.jpg',
      tareWeight: 11.4,
    },
    {
      id: 'milk',
      name: 'Organic Whole Milk Case',
      sku: 'MLK-WHL-GALLON-CS',
      image: '/src/assets/images/robot_arm_picking_1793746155415.jpg',
      tareWeight: 15.4,
    },
    {
      id: 'sourdough',
      name: 'Par-Baked Sourdough Boules',
      sku: 'BAK-SOURDOUGH-12PK',
      image: '/src/assets/images/robot_arm_picking_1793746155415.jpg',
      tareWeight: 6.8,
    },
    {
      id: 'rice',
      name: 'Royal Jasmine Rice (50lb)',
      sku: 'RIC-JAS-50LB',
      image: '/src/assets/images/hero_warehouse_robotics_1793746154379.jpg',
      tareWeight: 22.7,
    },
  ];

  const handleRunRecognition = async (presetId: string) => {
    setIsScanning(true);
    setSelectedPreset(presetId);
    setRecognized(null);

    try {
      const res = await fetch('/api/vision/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleId: presetId }),
      });
      const data = await res.json();
      if (data.success && data.recognized) {
        setRecognized(data.recognized);
        setFeedbackNotice(`AI Vision detected: ${data.recognized.label} (${(data.recognized.confidence * 100).toFixed(1)}% match)`);
        setTimeout(() => setFeedbackNotice(null), 3000);
      }
    } catch (err) {
      console.error('Vision scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddRecognizedToCart = () => {
    if (!recognized) return;
    const prod = products.find((p) => p.sku === recognized.matchedSku) || products[0];
    onAddToCart(prod, 1, prod.basePrice);

    setSmartCart((prev) => {
      const exist = prev.find((item) => item.product.id === prod.id);
      if (exist) {
        return prev.map((item) =>
          item.product.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product: prod, quantity: 1 }];
    });

    setFeedbackNotice(`Added ${prod.name} directly to Smart Cart!`);
    setTimeout(() => setFeedbackNotice(null), 2500);
  };

  const currentPresetObj = presets.find((p) => p.id === selectedPreset) || presets[0];

  const cartTotal = smartCart.reduce((sum, item) => sum + item.product.basePrice * item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Banner info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Smart-Cart & AI Vision Terminal</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                LiDAR + ToF Optical Scanner Online
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Shoppers place produce or wholesale packs directly into the smart cart basket. Computer vision
              neural networks identify produce types without barcodes, verify weight with floor scale sensors,
              and apply instant quantity discounts.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 shrink-0">
          Terminal Unit: <span className="font-mono text-white">SmartCart-09-REV3</span>
        </div>
      </div>

      {feedbackNotice && (
        <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-200 px-4 py-2.5 rounded-lg text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackNotice}</span>
          </div>
          <button onClick={() => setFeedbackNotice(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Vision Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Camera Feed & Bounding Box Overlay (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-white">Optical Vision Camera Stream (Basket Sensor)</h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">FPS: 60 · 4K RGB-D</span>
            </div>

            {/* Video Viewport with Bounding Box Overlay */}
            <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center">
              <img
                src={currentPresetObj.image}
                alt="Product in cart camera"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />

              {/* Crosshair / Reticle */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-16 h-16 border border-emerald-500/30 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                </div>
              </div>

              {/* Bounding Box Overlay */}
              {recognized && recognized.boundingBox && !isScanning && (
                <div
                  className="absolute border-2 border-emerald-400 bg-emerald-500/10 rounded pointer-events-none transition-all duration-300"
                  style={{
                    left: `${recognized.boundingBox.x}%`,
                    top: `${recognized.boundingBox.y}%`,
                    width: `${recognized.boundingBox.width}%`,
                    height: `${recognized.boundingBox.height}%`,
                  }}
                >
                  <div className="absolute -top-7 left-0 bg-emerald-600 text-slate-950 font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{recognized.label} · {(recognized.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}

              {/* Scanning Active Overlay */}
              {isScanning && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-mono text-emerald-300">
                    Running Deep Neural Network Classification...
                  </span>
                </div>
              )}
            </div>

            {/* Produce & Wholesale Test Feed Selector */}
            <div className="mt-4">
              <div className="text-[11px] text-slate-400 mb-2 font-medium">
                Simulate Camera Placement (Select Item placed in Smart Cart):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleRunRecognition(p.id)}
                    className={`px-3 py-2 text-xs rounded-lg border text-left transition-colors font-medium flex items-center justify-between ${
                      selectedPreset === p.id
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <Eye className="w-3.5 h-3.5 shrink-0 ml-1 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Match Result & Smart-Cart Register (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Recognition Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>AI Classifier Detection Specs</span>
            </h3>

            {recognized ? (
              <div className="space-y-3">
                <div className="bg-slate-950 border border-slate-800/90 rounded-lg p-3">
                  <div className="text-xs font-bold text-white mb-1">{recognized.label}</div>
                  <div className="text-xs text-slate-400 font-mono space-y-1">
                    <div className="flex justify-between">
                      <span>SKU Match:</span>
                      <span className="text-emerald-400">{recognized.matchedSku}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Neural Confidence:</span>
                      <span className="text-emerald-400 font-bold">
                        {(recognized.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <Scale className="w-3 h-3 text-slate-400" />
                        <span>Tare Scale Weight:</span>
                      </span>
                      <span className="text-white font-medium">{recognized.estimatedWeightKg} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Catalog Unit Price:</span>
                      <span className="text-white font-bold">
                        {formatCurrency(recognized.unitPrice || 0, currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAddRecognizedToCart}
                  className="w-full py-2.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Confirm & Add Item to Smart Cart</span>
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">
                Click a preset item to trigger real-time AI recognition.
              </div>
            )}
          </div>

          {/* Smart Cart Items in Basket */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-white">Smart Cart Active Basket</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">{smartCart.length} item types</span>
            </div>

            {smartCart.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">
                Smart cart basket is empty. Place produce in front of camera to begin.
              </div>
            ) : (
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                {smartCart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="truncate max-w-[160px]">
                      <div className="font-medium text-white truncate">{item.product.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatCurrency(item.product.basePrice, currency)} × {item.quantity}
                      </div>
                    </div>
                    <span className="font-mono text-emerald-300 font-bold tabular-nums">
                      {formatCurrency(item.product.basePrice * item.quantity, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {smartCart.length > 0 && (
              <div className="border-t border-slate-800 pt-2 space-y-2">
                <div className="flex justify-between text-xs font-bold text-white">
                  <span>Smart Cart Total:</span>
                  <span className="font-mono text-emerald-400 tabular-nums">
                    {formatCurrency(cartTotal, currency)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSmartCart([]);
                    setFeedbackNotice('Smart Cart checkout complete! Digital receipt sent to customer app.');
                    setTimeout(() => setFeedbackNotice(null), 3000);
                  }}
                  className="w-full py-2 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm"
                >
                  Pay & Exit (Touchless Self-Checkout)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
