import React, { useState } from 'react';
import { Shipment } from '../types';
import {
  Truck,
  Thermometer,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  AlertTriangle,
  Send,
} from 'lucide-react';

interface LogisticsFleetProps {
  shipments: Shipment[];
}

export const LogisticsFleet: React.FC<LogisticsFleetProps> = ({ shipments }) => {
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(shipments[0]?.id || 'shp-8812');
  const [notice, setNotice] = useState<string | null>(null);

  const selected = shipments.find((s) => s.id === selectedShipmentId) || shipments[0];

  const handlePingDriver = (truckId: string) => {
    setNotice(`Telemetry ping sent to ${truckId}: Real-time telematics acknowledged.`);
    setTimeout(() => setNotice(null), 3000);
  };

  const steps = ['Preparing', 'Robotic Loading', 'In Transit', 'Delivered'];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Logistics & Cold-Chain Fleet Tracking</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                GPS + IoT Telematics Synced
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous warehouse truck-loading robots load refrigerated electric delivery fleets. Continuous
              cold-chain IoT temperature verification guarantees perishables arrive within food safety thresholds.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 shrink-0">
          Active Fleet: <span className="font-mono text-white font-bold">{shipments.length} Heavy Commercial Vehicles</span>
        </div>
      </div>

      {notice && (
        <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-200 px-4 py-2.5 rounded-lg text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-mono">{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Grid: Shipments List (Left 5 cols), Route & Cold Chain Details (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Shipments List */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-semibold text-white px-1">Dispatched Wholesale Shipments</h3>
          
          <div className="space-y-2.5">
            {shipments.map((s) => {
              const isSelected = selectedShipmentId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedShipmentId(s.id)}
                  className={`w-full p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-white">{s.trackingNumber}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-emerald-300 border border-slate-800">
                      {s.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-200 font-medium truncate mb-1">
                    {s.destination}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>ETA: <strong className="text-white">{s.eta}</strong></span>
                    <span className="flex items-center gap-1 font-mono text-emerald-400">
                      <Thermometer className="w-3 h-3" />
                      {s.tempCelsius}°C
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Shipment Deep Dive */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white">{selected.trackingNumber}</span>
                <span className="text-xs text-slate-400">({selected.client})</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Destination: {selected.destination}</span>
              </div>
            </div>

            <button
              onClick={() => handlePingDriver(selected.truckId)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Send className="w-3 h-3 text-emerald-400" />
              <span>Ping Telematics</span>
            </button>
          </div>

          {/* Stepper progress */}
          <div>
            <div className="text-[11px] text-slate-400 mb-3 font-medium">Logistics Milestone Progress:</div>
            <div className="grid grid-cols-4 gap-2">
              {steps.map((st, idx) => {
                const currentIdx = steps.indexOf(selected.status);
                const isPassed = idx <= currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div key={st} className="text-center">
                    <div
                      className={`h-1.5 rounded-full mb-1.5 transition-colors ${
                        isPassed ? 'bg-emerald-500' : 'bg-slate-800'
                      }`}
                    />
                    <div
                      className={`text-[10px] font-mono leading-tight ${
                        isCurrent
                          ? 'text-emerald-400 font-bold'
                          : isPassed
                          ? 'text-slate-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {st}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-400 block text-[11px] mb-1">Cold-Chain Cargo</span>
              <div className="text-base font-bold font-mono text-emerald-400 flex items-center gap-1 tabular-nums">
                <Thermometer className="w-4 h-4 text-emerald-400" />
                <span>{selected.tempCelsius}°C</span>
              </div>
              <span className="text-[10px] text-slate-400">Within Safe Band</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-400 block text-[11px] mb-1">Estimated Arrival</span>
              <div className="text-base font-bold font-mono text-white flex items-center gap-1 tabular-nums">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{selected.eta}</span>
              </div>
              <span className="text-[10px] text-slate-400">On Schedule</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-400 block text-[11px] mb-1">Truck Vehicle</span>
              <div className="text-xs font-bold text-white font-mono">{selected.truckId}</div>
              <span className="text-[10px] text-slate-400">Driver: {selected.driverName}</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-400 block text-[11px] mb-1">Consignment Load</span>
              <div className="text-xs font-bold text-white font-mono tabular-nums">{selected.itemCount} crates</div>
              <span className="text-[10px] text-slate-400">{selected.weightKg} kg gross</span>
            </div>
          </div>

          {/* Simulated GPS Map Preview */}
          <div className="relative rounded-lg overflow-hidden border border-slate-800 aspect-16/7 bg-slate-950 flex items-center justify-center p-4">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <path d="M 50 150 Q 200 40 400 120 T 750 80" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="6 6" />
                <circle cx="50" cy="150" r="6" fill="#3b82f6" />
                <circle cx="750" cy="80" r="6" fill="#10b981" />
              </svg>
            </div>

            <div className="text-center z-10 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-900/90 border border-emerald-500/40 text-emerald-400 text-xs font-mono">
                <Navigation className="w-3.5 h-3.5 animate-spin" />
                <span>GPS Route: Lat {selected.lat}, Lng {selected.lng}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Fulfillment Hub Dock 4 ➔ {selected.destination}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
