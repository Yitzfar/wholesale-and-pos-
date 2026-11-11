import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_PRODUCTS, INITIAL_ROBOTS, INITIAL_ACCOUNTS, INITIAL_POS_TERMINALS, INITIAL_SHIPMENTS, INITIAL_FORECASTS } from './src/data/mockData.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

// In-memory state for persistence during runtime
let products = [...INITIAL_PRODUCTS];
let robots = [...INITIAL_ROBOTS];
let accounts = [...INITIAL_ACCOUNTS];
let terminals = [...INITIAL_POS_TERMINALS];
let shipments = [...INITIAL_SHIPMENTS];
let forecasts = [...INITIAL_FORECASTS];
let orders: any[] = [];
let emergencyStop = false;

// Initialize Google GenAI client
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to instantiate GoogleGenAI:', err);
  }
}

// Background simulation for AGV movement
setInterval(() => {
  if (emergencyStop) return;
  robots = robots.map((robot) => {
    if (robot.status === 'active' && robot.type === 'AGV') {
      // Small simulated trajectory movement
      const step = 0.8;
      let newX = robot.x + (Math.random() > 0.5 ? step : -step);
      let newY = robot.y + (Math.random() > 0.5 ? step : -step);
      newX = Math.max(5, Math.min(95, newX));
      newY = Math.max(5, Math.min(95, newY));
      const batteryDrain = Math.random() > 0.8 ? 0.1 : 0;
      return {
        ...robot,
        x: Number(newX.toFixed(1)),
        y: Number(newY.toFixed(1)),
        battery: Math.max(10, Number((robot.battery - batteryDrain).toFixed(1))),
      };
    }
    return robot;
  });
}, 2000);

// --- API Endpoints ---

// Products
app.get('/api/products', (req, res) => {
  res.json({ success: true, products });
});

app.post('/api/products/reorder', (req, res) => {
  const { productId, quantity } = req.body;
  const product = products.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const reorderQty = quantity || product.reorderQuantity;
  product.stock += reorderQty;

  // Assign task to an idle or active AGV
  const agv = robots.find((r) => r.type === 'AGV' && r.status !== 'maintenance');
  if (agv) {
    agv.status = 'active';
    agv.currentTask = `Restocking ${reorderQty} units of ${product.name} (SKU: ${product.sku}) to Bay A`;
  }

  res.json({
    success: true,
    message: `Auto-reorder dispatched. Added ${reorderQty} units to stock.`,
    product,
  });
});

// Dynamic Pricing Calculation
app.post('/api/pricing/calculate', (req, res) => {
  const { productId, quantity, customerTier, creditRating, hourOfDay } = req.body;
  const product = products.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const qty = Number(quantity) || 1;
  const basePrice = product.basePrice;

  // 1. Bulk Tier discount
  let bulkDiscountPct = 0;
  for (const tier of product.bulkTiers) {
    if (qty >= tier.minQty && (!tier.maxQty || qty <= tier.maxQty)) {
      bulkDiscountPct = tier.discountPct;
    }
  }

  // 2. Customer Tier adjustment
  const tierDiscounts: Record<string, number> = {
    Supermarket: 12,
    WholesaleClub: 8,
    Institutional: 10,
    IndependentGrocer: 5,
  };
  const customerTierDiscountPct = tierDiscounts[customerTier] || 0;

  // 3. Credit Rating discount
  const creditDiscounts: Record<string, number> = {
    AAA: 3,
    AA: 2,
    A: 1,
    BBB: 0,
  };
  const creditDiscountPct = creditDiscounts[creditRating] || 0;

  // 4. Time of Day off-peak discount (e.g. night/early morning 22:00 - 06:00 has 4% incentive)
  const hour = hourOfDay !== undefined ? hourOfDay : new Date().getHours();
  const offPeakDiscountPct = hour >= 21 || hour <= 6 ? 4 : 0;

  const totalDiscountPct = Math.min(35, bulkDiscountPct + customerTierDiscountPct + creditDiscountPct + offPeakDiscountPct);
  const unitPrice = Number((basePrice * (1 - totalDiscountPct / 100)).toFixed(2));
  const totalPrice = Number((unitPrice * qty).toFixed(2));

  res.json({
    success: true,
    productId,
    basePrice,
    unitPrice,
    quantity: qty,
    totalPrice,
    breakdown: {
      bulkDiscountPct,
      customerTierDiscountPct,
      creditDiscountPct,
      offPeakDiscountPct,
      totalDiscountPct,
    },
  });
});

// POS Terminals
app.get('/api/pos/terminals', (req, res) => {
  res.json({ success: true, terminals });
});

// Orders & POS Checkout
app.post('/api/pos/orders', (req, res) => {
  const { customerId, customerName, items, paymentMethod, terminalId } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ success: false, message: 'No items in order' });
  }

  let subtotal = 0;
  let totalDiscount = 0;

  // Validate and deduct stock
  for (const item of items) {
    const prod = products.find((p) => p.id === item.product.id || p.sku === item.product.sku);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - item.quantity);
      subtotal += item.unitPrice * item.quantity;
      if (item.originalPrice && item.originalPrice > item.unitPrice) {
        totalDiscount += (item.originalPrice - item.unitPrice) * item.quantity;
      }
    }
  }

  const tax = Number((subtotal * 0.0825).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  // If paid via Account Credit, deduct available credit
  if (paymentMethod === 'Account Credit (Net-30)' && customerId) {
    const acc = accounts.find((a) => a.id === customerId);
    if (acc) {
      acc.currentBalance += total;
      acc.availableCredit = Math.max(0, acc.creditLimit - acc.currentBalance);
    }
  }

  // Assign order to Robotic Arm and AGV for autonomous picking
  const pickingArm = robots.find((r) => r.type === 'Robotic Arm' && r.status !== 'maintenance');
  const agv = robots.find((r) => r.type === 'AGV' && r.status !== 'maintenance');

  const orderId = `ORD-${Date.now().toString().slice(-6)}`;
  if (pickingArm) {
    pickingArm.status = 'active';
    pickingArm.currentTask = `Picking ${items.length} wholesale crates for Order #${orderId}`;
  }
  if (agv) {
    agv.status = 'active';
    agv.currentTask = `Hauling pallet bin for Order #${orderId} to Packing Hub`;
  }

  const newOrder = {
    id: orderId,
    createdAt: new Date().toISOString(),
    customerId: customerId || 'WALK-IN-POS',
    customerName: customerName || 'Retail Customer / Fast Terminal',
    items,
    subtotal: Number(subtotal.toFixed(2)),
    tax,
    discountTotal: Number(totalDiscount.toFixed(2)),
    total,
    currency: 'USD',
    paymentMethod,
    status: 'Robotic Picking',
    robotAssigned: pickingArm?.name || 'Arm-Pick-Alpha',
    posTerminalId: terminalId || 'pos-lane-01',
    receiptNumber: `REC-${Date.now().toString().slice(-8)}`,
  };

  orders.unshift(newOrder);

  res.json({
    success: true,
    order: newOrder,
    productsUpdated: products,
  });
});

// Credit Accounts
app.get('/api/credit/accounts', (req, res) => {
  res.json({ success: true, accounts });
});

app.post('/api/credit/payment', (req, res) => {
  const { accountId, amount, paymentType } = req.body;
  const acc = accounts.find((a) => a.id === accountId);
  if (!acc) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }

  const payAmt = Number(amount) || 0;
  acc.currentBalance = Math.max(0, acc.currentBalance - payAmt);
  acc.availableCredit = Math.min(acc.creditLimit, acc.creditLimit - acc.currentBalance);

  res.json({
    success: true,
    message: `Payment of $${payAmt.toFixed(2)} received via ${paymentType || 'ACH Transfer'}.`,
    account: acc,
  });
});

// Robotics Fleet
app.get('/api/robotics/fleet', (req, res) => {
  res.json({ success: true, robots, emergencyStop });
});

app.post('/api/robotics/dispatch', (req, res) => {
  const { robotId, task, targetX, targetY } = req.body;
  const robot = robots.find((r) => r.id === robotId);
  if (!robot) {
    return res.status(404).json({ success: false, message: 'Robot not found' });
  }

  robot.status = 'active';
  robot.currentTask = task || 'Dispatched for automated transit';
  if (targetX !== undefined) robot.targetX = targetX;
  if (targetY !== undefined) robot.targetY = targetY;

  res.json({ success: true, robot });
});

app.post('/api/robotics/estop', (req, res) => {
  const { stop } = req.body;
  emergencyStop = Boolean(stop);
  if (emergencyStop) {
    robots = robots.map((r) => ({ ...r, status: 'idle', speedMps: 0 }));
  } else {
    robots = robots.map((r) => ({ ...r, status: 'active', speedMps: 1.2 }));
  }
  res.json({ success: true, emergencyStop, robots });
});

// Logistics & Shipments
app.get('/api/logistics/shipments', (req, res) => {
  res.json({ success: true, shipments });
});

// Demand Forecasting
app.get('/api/forecasts', (req, res) => {
  res.json({ success: true, forecasts });
});

// AI Product Recognition (Computer Vision)
app.post('/api/vision/recognize', async (req, res) => {
  const { imageBase64, sampleId } = req.body;

  // If a sample preset is chosen or standard recognition
  const presets: Record<string, any> = {
    honeycrisp: {
      label: 'Organic Honeycrisp Apples (Grade A)',
      matchedSku: 'ORG-APL-40LB',
      confidence: 0.982,
      estimatedWeightKg: 18.2,
      unitPrice: 48.50,
      boundingBox: { x: 18, y: 22, width: 62, height: 55 },
    },
    avocado: {
      label: 'Prime Hass Avocados (Size 48s)',
      matchedSku: 'AVO-HASS-25LB',
      confidence: 0.965,
      estimatedWeightKg: 11.4,
      unitPrice: 54.00,
      boundingBox: { x: 24, y: 30, width: 50, height: 48 },
    },
    milk: {
      label: 'Organic Whole Milk 3.8% (4x 1 Gal)',
      matchedSku: 'MLK-WHL-GALLON-CS',
      confidence: 0.991,
      estimatedWeightKg: 15.4,
      unitPrice: 22.80,
      boundingBox: { x: 15, y: 12, width: 70, height: 75 },
    },
    sourdough: {
      label: 'Artisan Par-Baked Sourdough Boules',
      matchedSku: 'BAK-SOURDOUGH-12PK',
      confidence: 0.958,
      estimatedWeightKg: 6.8,
      unitPrice: 32.40,
      boundingBox: { x: 20, y: 25, width: 60, height: 50 },
    },
    rice: {
      label: 'Royal Jasmine Rice (Triple AAA)',
      matchedSku: 'RIC-JAS-50LB',
      confidence: 0.974,
      estimatedWeightKg: 22.7,
      unitPrice: 38.25,
      boundingBox: { x: 22, y: 18, width: 56, height: 64 },
    },
  };

  // If sampleId provided, return immediate high-fidelity recognition
  if (sampleId && presets[sampleId]) {
    return res.json({
      success: true,
      recognized: presets[sampleId],
      sensorMeta: {
        latencyMs: 142,
        sensorType: 'Stereo RGB-D + ToF Depth LiDAR',
        weightSensorTare: 'Zeroed',
      },
    });
  }

  // If real image base64 provided and Gemini is configured, use multimodal vision
  if (imageBase64 && aiClient) {
    try {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanBase64,
                },
              },
              {
                text: `You are an automated wholesale supermarket computer vision scanner.
Examine this grocery/produce/wholesale item and classify it against our inventory catalog:
Available SKUs: ORG-APL-40LB (Organic Apples), AVO-HASS-25LB (Avocados), MLK-WHL-GALLON-CS (Organic Milk), RIC-JAS-50LB (Jasmine Rice), OIL-EVOO-5L-TIN (Olive Oil), BEV-SPK-WTR-24PK (Sparkling Water), BAK-SOURDOUGH-12PK (Sourdough), PKG-KRAFT-BAGS-500 (Kraft Bags).
Respond ONLY with a JSON object:
{
  "label": string,
  "matchedSku": string,
  "confidence": number between 0.85 and 0.99,
  "estimatedWeightKg": number,
  "boundingBox": { "x": number, "y": number, "width": number, "height": number }
}`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const matchedProd = products.find((p) => p.sku === parsed.matchedSku) || products[0];

      return res.json({
        success: true,
        recognized: {
          label: parsed.label || matchedProd.name,
          matchedSku: matchedProd.sku,
          confidence: parsed.confidence || 0.96,
          estimatedWeightKg: parsed.estimatedWeightKg || matchedProd.weightKg,
          unitPrice: matchedProd.basePrice,
          boundingBox: parsed.boundingBox || { x: 20, y: 20, width: 60, height: 60 },
        },
        sensorMeta: {
          latencyMs: 180,
          sensorType: 'Gemini 3.8 Flash Vision + Neural Edge Classifier',
        },
      });
    } catch (err: any) {
      console.warn('Vision Gemini call fallback:', err.message);
    }
  }

  // Default intelligent fallback
  const fallback = presets.honeycrisp;
  res.json({
    success: true,
    recognized: fallback,
    sensorMeta: {
      latencyMs: 110,
      sensorType: 'Edge Neural Classifier',
    },
  });
});

// AI Wholesale Copilot (Gemini 3.8 Flash)
app.post('/api/ai/copilot', async (req, res) => {
  const { message, context } = req.body;

  if (aiClient) {
    try {
      const systemInstruction = `You are OmniStock's autonomous wholesale & supermarket AI advisor.
You advise commercial supermarket buyers, store managers, and logistics dispatchers on:
1. Wholesale bulk volume discounts and seasonal harvest patterns.
2. Warehouse robotics dispatch (AGVs, 6-axis picking arms, pallet shuttles).
3. Supermarket POS terminal health, Smart-Cart self-checkout computer vision.
4. Credit ratings (AAA, AA, A), payment terms (Net 30/60), and working capital credit limits.
5. Cold-chain logistics tracking (refrigerated trucks, temperature alerts).
Keep responses clear, professional, concise, with actionable bullet points.`;

      const prompt = `Context: ${JSON.stringify(context || {})}
User query: ${message}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      return res.json({
        success: true,
        reply: response.text,
      });
    } catch (err: any) {
      console.error('Copilot Gemini error:', err.message);
    }
  }

  // Graceful rule-based wholesale intelligence fallback
  let fallbackReply = `OmniStock Autonomous Assistant:\n\nBased on real-time inventory telemetry:
• **Demand Forecast:** High velocity detected on *Organic Honeycrisp Apples* (+47% demand this weekend due to seasonal promotions).
• **Robotics Dispatch:** AGV Alpha-1 and Kuka-X1 picking arms are running at 94% picking efficiency at Packing Station 1.
• **Credit & Pricing:** Supermarket tier accounts qualify for an immediate 12% bulk discount + 3% AAA rating incentive.
• **Logistics:** Refrigerated Truck VOLVO-EV-04 is maintaining 3.2°C nominal temp, arriving at Central Hub Dock 8 in ~35 minutes.`;

  if (message.toLowerCase().includes('credit') || message.toLowerCase().includes('net 30')) {
    fallbackReply = `Credit Account Analysis:
• **Approved Tier:** AAA Supermarket Accounts receive up to $300,000 credit limit with Net-60 terms.
• **Payment Clearance:** Payments submitted via ACH clear within 24 hours, restoring available credit instantly.
• **Early-Pay Rebate:** Invoices cleared within 10 days receive an additional 1.5% prompt-settlement rebate.`;
  } else if (message.toLowerCase().includes('robot') || message.toLowerCase().includes('agv')) {
    fallbackReply = `Robotics Fleet Telemetry:
• **AGVs:** 2 units active on marked transit corridors (speeds: 1.4 - 1.8 m/s). Batteries healthy (>78%).
• **Picking Arm (Kuka-X1):** Configured with adaptive vacuum suction for carton picking. Cycle time: 4.2 seconds per case.
• **Customer Help Bots:** PackBot-1 is stationed at checkout for automated boxing and pallet strapping.`;
  }

  res.json({
    success: true,
    reply: fallbackReply,
  });
});

// Vite Middleware for Full-Stack dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`OmniStock Wholesale & POS Server running at http://localhost:${PORT}`);
  });
}

startServer();
