import React, { useState, useEffect } from 'react';
import { RobotUnit } from '../types';
import {
  Bot,
  Zap,
  Play,
  Pause,
  AlertOctagon,
  Navigation,
  Box,
  Truck,
  RotateCw,
  ShieldAlert,
  CheckCircle2,
  MapPin,
} from 'lucide-react';

interface RoboticsWarehouseProps {
  robots: RobotUnit[];
  onDispatch: (robotId: string, task: string, targetX: number, targetY: number) => Promise<void>;
  onEStop: (stop: boolean) => Promise<void>;
}

export const RoboticsWarehouse: React.FC<RoboticsWarehouseProps> = ({
  robots,
  onDispatch,
  onEStop,
}) => {
  const [selectedRobotId, setSelectedRobotId] = useState<string>(robots[0]?.id || 'agv-alpha-01');
  const [dispatchTask, setDispatchTask] = useState<string>('Transport Honeycrisp Apple crates to Outbound Dock 4');
  const [targetZone, setTargetZone] = useState<string>('Dock 4 Loading');
  const [isEStopped, setIsEStopped] = useState<boolean>(false);
  const [dispatchNotice, setDispatchNotice] = useState<string | null>(null);

  const selectedRobot = robots.find((r) => r.id === selectedRobotId) || robots[0];

  const handleEStopToggle = async () => {
    const nextState = !isEStopped;
    setIsEStopped(nextState);
    await onEStop(nextState);
    setDispatchNotice(nextState ? 'EMERGENCY FLEET STOP ENGAGED' : 'Fleet resumed normal operations');
    setTimeout(() => setDispatchNotice(null), 3000);
  };

  const handleSendMission = async () => {
    const zoneCoords: Record<string, { x: number; y: number }> = {
      'Aisle A-Pallets': { x: 25, y: 30 },
      'Sorting Hub B': { x: 60, y: 45 },
      'Dock 4 Loading': { x: 85, y: 80 },
      'Packing Station 1': { x: 50, y: 40 },
      'Customer Help Bay': { x: 20, y: 75 },
    };
    const target = zoneCoords[targetZone] || { x: 50, y: 50 };

    await onDispatch(selectedRobot.id, dispatchTask, target.x, target.y);
    setDispatchNotice(`Mission assigned to ${selectedRobot.name}: "${dispatchTask}"`);
    setTimeout(() => setDispatchNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Telemetry Header & Emergency Stop */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Robotics Fleet & Warehouse Digital Twin</h2>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                isEStopped
                  ? 'bg-red-950 text-red-400 border-red-800'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}>
                {isEStopped ? 'FLEET HALTED' : '6 Autonomous Units Nominal'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-time telemetry showing Automated Guided Vehicles (AGVs), 6-axis picking arms, box-packing
              customer bots, and truck loading robots.
            </p>
          </div>
        </div>

        {/* E-Stop Emergency Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleEStopToggle}
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors shadow-md cursor-pointer ${
              isEStopped
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>{isEStopped ? 'Resume Fleet Operation' : 'EMERGENCY E-STOP'}</span>
          </button>
        </div>
      </div>

      {dispatchNotice && (
        <div className={`px-4 py-2.5 rounded-lg text-xs flex items-center justify-between animate-fadeIn border ${
          isEStopped
            ? 'bg-red-950 text-red-200 border-red-800'
            : 'bg-emerald-950 text-emerald-200 border-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-mono">{dispatchNotice}</span>
          </div>
          <button onClick={() => setDispatchNotice(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Grid: Interactive 2D Warehouse Digital Twin (Left 7 cols), Fleet Telemetry & Dispatch (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 2D Digital Twin Warehouse Map */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-white">Live Facility Floor Plan (Zone 04 Logistics)</h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> AGVs
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Robotic Arms
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" /> Packing Bots
              </span>
            </div>
          </div>

          {/* SVG Warehouse Floor Canvas */}
          <div className="relative w-full aspect-4/3 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden select-none">
            {/* Guide tracks (Magnetic lines for AGVs) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <line x1="20%" y1="30%" x2="80%" y2="30%" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="20%" y1="50%" x2="80%" y2="50%" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="20%" y1="75%" x2="80%" y2="75%" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="25%" y1="20%" x2="25%" y2="85%" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="50%" y1="20%" x2="50%" y2="85%" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="80%" y1="20%" x2="80%" y2="85%" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
            </svg>

            {/* Warehouse Zones on Map */}
            {/* Zone Aisle A: High Bay Pallets */}
            <div
              onClick={() => setTargetZone('Aisle A-Pallets')}
              className="absolute top-[10%] left-[8%] w-[32%] h-[24%] border border-slate-800 bg-slate-900/60 rounded p-2 cursor-pointer hover:border-emerald-500/50 transition-colors"
            >
              <div className="text-[10px] font-mono text-slate-400">BAY A1-A4</div>
              <div className="text-xs font-semibold text-slate-200">High-Bay Pallet Racks</div>
              <div className="text-[10px] text-slate-500 mt-1">Produce & Perishables</div>
            </div>

            {/* Zone Cold Vault */}
            <div className="absolute top-[10%] right-[8%] w-[28%] h-[24%] border border-cyan-900/60 bg-cyan-950/20 rounded p-2">
              <div className="text-[10px] font-mono text-cyan-400">COLD VAULT (2°C)</div>
              <div className="text-xs font-semibold text-cyan-200">Chilled Dairy & Frozen</div>
              <div className="text-[10px] text-cyan-500 mt-1">Insulated Airlock</div>
            </div>

            {/* Zone Center: Robotic Arm Picking & Packing Station */}
            <div
              onClick={() => setTargetZone('Packing Station 1')}
              className="absolute top-[42%] left-[36%] w-[28%] h-[26%] border border-amber-800/60 bg-amber-950/20 rounded p-2 cursor-pointer hover:border-amber-500 transition-colors"
            >
              <div className="text-[10px] font-mono text-amber-400">HUB 01</div>
              <div className="text-xs font-semibold text-amber-200">Robotic Arm Picking Station</div>
              <div className="text-[10px] text-amber-500 mt-1">Kuka-X1 & Fanuc-Y2 Delta</div>
            </div>

            {/* Zone Customer Boxing Help Bay */}
            <div
              onClick={() => setTargetZone('Customer Help Bay')}
              className="absolute bottom-[8%] left-[8%] w-[30%] h-[22%] border border-purple-800/60 bg-purple-950/20 rounded p-2 cursor-pointer hover:border-purple-500 transition-colors"
            >
              <div className="text-[10px] font-mono text-purple-400">PACK BAY</div>
              <div className="text-xs font-semibold text-purple-200">Customer Box Assistance</div>
              <div className="text-[10px] text-purple-400 mt-1">PackBot-Assist Station</div>
            </div>

            {/* Zone Outbound Docks */}
            <div
              onClick={() => setTargetZone('Dock 4 Loading')}
              className="absolute bottom-[8%] right-[8%] w-[30%] h-[22%] border border-emerald-800/60 bg-emerald-950/20 rounded p-2 cursor-pointer hover:border-emerald-500 transition-colors"
            >
              <div className="text-[10px] font-mono text-emerald-400">DOCK 4</div>
              <div className="text-xs font-semibold text-emerald-200">Outbound Truck Bay</div>
              <div className="text-[10px] text-emerald-400 mt-1">LoadMaster Autonomous Stacker</div>
            </div>

            {/* Dynamic Moving Robots Pins on Map */}
            {robots.map((r) => {
              const isSelected = selectedRobotId === r.id;
              let dotColor = 'bg-emerald-500';
              if (r.type === 'Robotic Arm') dotColor = 'bg-amber-400';
              if (r.type === 'Customer Box Packer') dotColor = 'bg-purple-400';
              if (r.type === 'Truck Loader') dotColor = 'bg-sky-400';

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRobotId(r.id)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all duration-700 z-20`}
                  style={{ left: `${r.x}%`, top: `${r.y}%` }}
                >
                  <div className={`relative flex items-center justify-center p-1.5 rounded-full ${
                    isSelected ? 'ring-2 ring-white scale-125' : ''
                  }`}>
                    <div className={`w-3.5 h-3.5 rounded-full ${dotColor} ${r.status === 'active' && !isEStopped ? 'animate-pulse' : ''}`} />
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 border border-slate-700 text-white text-[10px] font-mono px-2 py-1 rounded shadow-lg whitespace-nowrap z-30">
                      <div>{r.name}</div>
                      <div className="text-slate-400">Battery: {r.battery}% · {r.status}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
            <span>Click any warehouse zone to set dispatch target</span>
            <span className="font-mono text-slate-500">Coordinate Grid: 100x100 Standard Units</span>
          </div>
        </div>

        {/* Right: Fleet Telemetry & Mission Dispatch (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Selected Robot Mission Controller */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div>
                <h3 className="text-xs font-semibold text-white">{selectedRobot.name}</h3>
                <span className="text-[10px] font-mono text-emerald-400">Type: {selectedRobot.type}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400">Battery</span>
                <div className="text-xs font-mono font-bold text-white flex items-center gap-1 justify-end">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{selectedRobot.battery}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs mb-4">
              <div className="flex justify-between text-slate-400">
                <span>Operational Status:</span>
                <span className={`font-mono font-bold capitalize ${
                  selectedRobot.status === 'active' ? 'text-emerald-400' : 'text-slate-300'
                }`}>
                  {selectedRobot.status}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Current Payload:</span>
                <span className="font-mono text-white tabular-nums">
                  {selectedRobot.payloadKg} kg / {selectedRobot.maxPayloadKg} kg max
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Speed:</span>
                <span className="font-mono text-white tabular-nums">{selectedRobot.speedMps} m/s</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] text-slate-300">
                <span className="text-slate-400 block mb-0.5 font-mono">Current Telemetry Mission:</span>
                {selectedRobot.currentTask}
              </div>
            </div>

            {/* Mission Dispatch Form */}
            <div className="border-t border-slate-800 pt-3 space-y-2.5">
              <label className="text-xs font-semibold text-white block">Assign New Autonomous Mission</label>
              
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Target Warehouse Zone:</label>
                <select
                  value={targetZone}
                  onChange={(e) => setTargetZone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Aisle A-Pallets">Aisle A-Pallets (Produce & Bulk Storage)</option>
                  <option value="Sorting Hub B">Sorting Hub B (Cross-Dock Conveyor)</option>
                  <option value="Packing Station 1">Packing Station 1 (Robotic Arms Hub)</option>
                  <option value="Customer Help Bay">Customer Help Bay (PackBot Auto-Boxing)</option>
                  <option value="Dock 4 Loading">Dock 4 Loading (Truck Stacker Master)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Mission Instruction:</label>
                <input
                  type="text"
                  value={dispatchTask}
                  onChange={(e) => setDispatchTask(e.target.value)}
                  placeholder="e.g. Move pallet to loading dock, assist customer boxing..."
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={handleSendMission}
                disabled={isEStopped}
                className="w-full py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Transmit Mission Instruction</span>
              </button>
            </div>
          </div>

          {/* All Units Status Summary List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-white mb-2">Fleet Units (6 Available)</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {robots.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRobotId(r.id)}
                  className={`w-full p-2 rounded-lg text-left flex items-center justify-between text-xs transition-colors border ${
                    selectedRobotId === r.id
                      ? 'bg-slate-800 border-emerald-500/80 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="truncate max-w-[200px]">
                    <div className="font-medium truncate">{r.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{r.currentTask}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-emerald-400 font-bold">{r.battery}%</span>
                    <div className="text-[10px] text-slate-500 capitalize">{r.status}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
