
import React from 'react';
import {
  CheckCircle,
  Code,
  Database,
  Layout,
  Lock,
  Rocket,
  Server,
  Shield,
  Smartphone,
  Zap,
  GitBranch,
  Cpu,
  ScanEye,
  Link,
  Layers,
  Box,
  Globe,
  Bell,
  FileText,
  TestTube,
  CloudLightning,
  Truck,
  ShoppingCart,
  BarChart3,
  Wifi,
  RotateCcw,
  Printer,
  ClipboardCheck,
  Banknote,
  Network,
  Store,
  BrainCircuit
} from 'lucide-react';

const ROADMAP_DATA = [
  {
    id: 'immediate-fixes',
    phase: "Immediate To-Do: Critical Flow Fixes",
    status: "in-progress",
    progress: 15,
    period: "URGENT",
    description: "Mandatory fixes required to stabilize core operational workflows before further expansion.",
    tech: ["Bug Fixes", "Logic Repair", "Flow Testing"],
    items: [
      { title: "Navigation Audit", desc: "Assess every navigation page one by one for functionality & design", icon: ScanEye, complexity: "High", priority: "Critical", status: "in-progress" },
      { title: "Fulfillment Lifecycle", desc: "Fix Pick -> Pack -> Ship status transitions & job generation", icon: ClipboardCheck, complexity: "High", priority: "Critical", status: "in-progress" },
      { title: "Warehouse Receiving", desc: "Debug 'Receive' to 'Putaway' inventory updates", icon: Box, complexity: "High", priority: "Critical", status: "pending" },
      { title: "PO & Procurement", desc: "Finalize Purchase Order creation & Supplier linking", icon: Truck, complexity: "Medium", priority: "High", status: "pending" },
      { title: "Site Context Logic", desc: "Ensure Managers are strictly locked to their assigned Site", icon: Lock, complexity: "Medium", priority: "High", status: "in-progress" },
      { title: "Global Data Sync", desc: "Fix employee/inventory sync issues between Central Admin & Sites", icon: Database, complexity: "High", priority: "Critical", status: "pending" },
    ]
  },
  {
    id: 'phase-4',
    phase: "Phase 4: Ecosystem Connectivity",
    status: "in-progress",
    progress: 10,
    period: "Q3 2024",
    description: "Connecting SIIFMART to the outside world: Multi-branch, eCommerce, and Vendors.",
    tech: ["GraphQL", "PWA", "WebSockets"],
    items: [
      { title: "Multi-Branch Sync", desc: "Centralized Admin dashboard for multiple store locations", icon: Network, status: "in-progress", complexity: "Very High", priority: "Critical" },
      { title: "Offline-First PWA", desc: "Service workers for zero-connectivity operation", icon: Wifi, status: "planned", complexity: "High", priority: "High" },
      { title: "Vendor Portal", desc: "External login for suppliers to update stock status", icon: Truck, status: "planned", complexity: "Medium", priority: "Medium" },
      { title: "eCommerce Bridge", desc: "Sync inventory with Shopify/WooCommerce", icon: Globe, status: "planned", complexity: "High", priority: "High" },
    ]
  },
  {
    id: 'phase-5',
    phase: "Phase 5: Autonomous Retail",
    status: "future",
    progress: 0,
    period: "2025 Vision",
    description: "Next-gen retail: Computer Vision, Robotics, and Neural Networks.",
    tech: ["WebXR", "MQTT", "TensorFlow.js"],
    items: [
      { title: "Computer Vision Checkout", desc: "Amazon Go-style 'Just Walk Out' tech", icon: ScanEye, status: "concept", complexity: "Extreme", priority: "Low" },
      { title: "Drone Delivery API", desc: "Automated dispatch to logistics drones", icon: Rocket, status: "concept", complexity: "Very High", priority: "Low" },
      { title: "Neural Supply Chain", desc: "AI predicting stock needs based on weather/events", icon: Cpu, status: "concept", complexity: "Very High", priority: "Critical" },
      { title: "IoT Cold Chain", desc: "Real-time temperature sensors via MQTT", icon: CloudLightning, status: "concept", complexity: "High", priority: "Medium" },
    ]
  }
];

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    completed: "bg-green-500/10 text-green-400 border-green-500/20",
    "in-progress": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse",
    upcoming: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    planned: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    pending: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    future: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    concept: "bg-white/5 text-gray-500 border-white/10 border-dashed"
  };

  const labels = {
    completed: "Completed",
    "in-progress": "In Progress",
    upcoming: "Planned",
    planned: "Planned",
    pending: "Pending",
    future: "Vision",
    concept: "Concept"
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border tracking-wider ${styles[status as keyof typeof styles] || styles.pending}`}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
};

const ComplexityBar = ({ level }: { level: string }) => {
  const levels = { "Low": 1, "Medium": 2, "High": 3, "Very High": 4, "Extreme": 5 };
  const score = levels[level as keyof typeof levels] || 1;

  return (
    <div className="flex items-center gap-1 mt-2" title={`Complexity: ${level}`}>
      <span className="text-[9px] text-gray-600 uppercase mr-1">CMPX</span>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`h-1 w-2 rounded-sm ${i <= score ? 'bg-cyber-primary/60' : 'bg-gray-800'}`} />
      ))}
    </div>
  );
};

const ProgressBar = ({ progress, status }: { progress: number, status: string }) => (
  <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden mt-4 border border-white/5">
    <div
      className={`h-full transition-all duration-1000 ease-out rounded-full ${status === 'completed' ? 'bg-cyber-primary' :
        status === 'in-progress' ? 'bg-yellow-400' :
          status === 'future' ? 'bg-purple-500' : 'bg-blue-500'
        }`}
      style={{ width: `${progress}%` }}
    />
  </div>
);

export default function Roadmap() {
  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <GitBranch className="text-cyber-primary" />
            System Evolution
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Strategic development path from POS to Autonomous Enterprise.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-cyber-gray p-3 rounded-xl border border-white/10">
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Current Build</p>
            <p className="text-xl font-bold text-cyber-primary font-mono">v2.5.0 ERP</p>
          </div>
          <div className="h-10 w-10 rounded-full border-4 border-cyber-primary/20 border-t-cyber-primary flex items-center justify-center animate-spin-slow">
            <Rocket size={16} className="text-white" />
          </div>
        </div>
      </div>

      {/* Main Timeline */}
      <div className="relative mt-12">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-cyber-primary via-blue-500 to-purple-900 md:left-1/2 md:-ml-px opacity-30" />

        <div className="space-y-16">
          {ROADMAP_DATA.map((phase, index) => {
            const isEven = index % 2 === 0;
            const isActive = phase.status === 'in-progress';
            const isFuture = phase.status === 'future';

            return (
              <div key={phase.id} className={`relative flex flex-col md:flex-row items-start ${isEven ? 'md:flex-row-reverse' : ''}`}>

                {/* Timeline Node */}
                <div className="absolute left-8 -translate-x-1/2 md:left-1/2 top-8 z-10 flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center z-20 bg-black transition-all duration-500 ${phase.status === 'completed' ? 'border-cyber-primary shadow-[0_0_20px_rgba(0,255,157,0.5)]' :
                    isActive ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] scale-110' :
                      isFuture ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]' :
                        'border-gray-700'
                    }`}>
                    {phase.status === 'completed' && <div className="w-2 h-2 bg-cyber-primary rounded-full" />}
                    {isActive && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />}
                  </div>
                  {isActive && <div className="h-32 w-0.5 bg-gradient-to-b from-yellow-400/50 to-transparent absolute top-6" />}
                </div>

                {/* Spacer for Desktop Alignment */}
                <div className="hidden md:block md:w-1/2" />

                {/* Content Card */}
                <div className={`w-full md:w-1/2 pl-16 md:pl-0 ${isEven ? 'md:pr-16' : 'md:pl-16'}`}>
                  <div className={`group relative bg-cyber-gray border rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.01] ${isActive ? 'border-yellow-400/30 shadow-[0_0_30px_rgba(251,191,36,0.05)]' :
                    isFuture ? 'border-purple-500/30' :
                      'border-white/5 hover:border-white/20'
                    }`}>

                    {/* Phase Indicator */}
                    <div className="absolute top-0 right-0 px-3 py-1 bg-black/40 rounded-bl-xl border-b border-l border-white/5 text-[10px] font-mono text-gray-500">
                      {phase.period}
                    </div>

                    {/* Card Header */}
                    <div className="p-6 border-b border-white/5 relative overflow-hidden">
                      {isActive && <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 blur-3xl -mr-10 -mt-10" />}
                      {isFuture && <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl -mr-10 -mt-10" />}

                      <div className="mb-2">
                        <StatusBadge status={phase.status} />
                      </div>
                      <h3 className={`text-xl font-bold ${isActive ? 'text-yellow-400' :
                        isFuture ? 'text-purple-400' : 'text-white'
                        }`}>
                        {phase.phase}
                      </h3>
                      <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                        {phase.description}
                      </p>
                      <ProgressBar progress={phase.progress} status={phase.status} />
                    </div>

                    {/* Sub-items Grid */}
                    <div className="p-6 bg-black/20">
                      <div className="grid grid-cols-1 gap-4">
                        {phase.items.map((item: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 group/item hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
                            <div className={`p-2 rounded-lg mt-1 shrink-0 ${item.status === 'completed' ? 'bg-cyber-primary/10 text-cyber-primary' :
                              item.status === 'in-progress' ? 'bg-yellow-400/10 text-yellow-400' :
                                isFuture ? 'bg-purple-500/10 text-purple-400' :
                                  'bg-white/5 text-gray-500'
                              }`}>
                              <item.icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h4 className={`text-sm font-medium truncate ${item.status === 'in-progress' ? 'text-yellow-400' : 'text-gray-200'
                                  }`}>
                                  {item.title}
                                </h4>
                                {item.priority && (
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase ml-2 ${item.priority === 'Critical' ? 'border-red-500/30 text-red-400' :
                                    item.priority === 'High' ? 'border-orange-500/30 text-orange-400' :
                                      'border-gray-700 text-gray-500'
                                    }`}>
                                    {item.priority}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                {item.desc}
                              </p>
                              <ComplexityBar level={item.complexity} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tech Stack Footer */}
                    <div className="px-6 py-3 bg-black/40 border-t border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                      <Globe size={12} className="text-gray-600 shrink-0" />
                      {phase.tech.map((t, i) => (
                        <span key={i} className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
                          {t}{i < phase.tech.length - 1 ? ' • ' : ''}
                        </span>
                      ))}
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-cyber-primary/5 via-transparent to-transparent border border-cyber-primary/10 relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Enterprise Architecture</h3>
            <p className="text-gray-400 text-sm max-w-xl">
              Our system is now ready for multi-site deployment. Phase 4 will introduce the connectivity layer required to link warehouses, stores, and online channels.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-6 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white border border-white/10 hover:border-white/30 transition-all">
              View API Docs
            </button>
            <button className="bg-cyber-primary text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-cyber-accent transition-all shadow-[0_0_20px_rgba(0,255,157,0.2)] flex items-center gap-2 group-hover:shadow-[0_0_30px_rgba(0,255,157,0.4)]">
              <Store size={18} />
              Deploy New Branch
            </button>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] opacity-5" />
      </div>
    </div>
  );
}
