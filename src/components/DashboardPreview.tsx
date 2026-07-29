import { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingDown, 
  AlertTriangle, 
  Terminal as TerminalIcon, 
  Activity,
  Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';

// Mock trend data for Attrition Rate
const trendData = [
  { name: 'JAN', baseline: 14.2, optimized: 14.2 },
  { name: 'FEB', baseline: 14.5, optimized: 13.8 },
  { name: 'MAR', baseline: 15.1, optimized: 12.4 },
  { name: 'APR', baseline: 15.6, optimized: 11.1 },
  { name: 'MAY', baseline: 15.8, optimized: 9.5 },
  { name: 'JUN', baseline: 16.2, optimized: 7.8 },
];

// Mock department breakdown data
const deptData = [
  { name: 'Engineering', count: 24, rate: 18.5, color: '#EF4444' }, // Danger
  { name: 'Sales & BD', count: 18, rate: 14.2, color: '#F59E0B' }, // Warning
  { name: 'Product Management', count: 8, rate: 8.9, color: '#06B6D4' }, // Info
  { name: 'Marketing', count: 6, rate: 7.2, color: '#22C55E' }, // Success
];

// Mock high-risk employees
const highRiskEmployees = [
  { id: 'EMP-0412', name: 'Sarah Jenkins', dept: 'Engineering', tenure: '2.4 yrs', probability: 91.2, factor: 'Workload & Overtime', suggestion: 'Optimize sprint capacity & assign technical mentor' },
  { id: 'EMP-0922', name: 'Michael Chen', dept: 'Sales & BD', tenure: '1.2 yrs', probability: 84.5, factor: 'Compensation Gap', suggestion: 'Initiate off-cycle performance & salary review' },
  { id: 'EMP-1108', name: 'Elena Rostova', dept: 'Engineering', tenure: '3.1 yrs', probability: 78.9, factor: 'Role Stagnation', suggestion: 'Define pathway to Principal Engineer role' },
  { id: 'EMP-0567', name: 'Marcus Vance', dept: 'Marketing', tenure: '0.8 yrs', probability: 73.1, factor: 'Onboarding Friction', suggestion: 'Schedule check-in with department lead' }
];

// Mock live terminal logs from the 5 AI Agents
const rawLogs = [
  { source: 'Analytics', message: 'Continuous scanning initialized for 248 employees.', type: 'info' },
  { source: 'Prediction', message: 'Recalculating risk scores on historical patterns.', type: 'info' },
  { source: 'Analytics', message: 'Telemetry anomaly identified: Unusually high overtime detected on Employee EMP-0412.', type: 'warning' },
  { source: 'Prediction', message: 'Calculated attrition probability for EMP-0412 increased to 91.2%. Attrition risk state: High.', type: 'danger' },
  { source: 'Diagnostics', message: 'Analyzing sentiment scores for EMP-0412: workload mismatch index 8.9/10.', type: 'info' },
  { source: 'Action Plans', message: 'Formulating retention strategy playbook for EMP-0412. Recommended: capacity adjustment & active mentoring.', type: 'success' },
  { source: 'Reports', message: 'Generated executive intelligence brief: REP-104-EMP-0412. Awaiting HR authorization.', type: 'success' },
  { source: 'Prediction', message: 'Scanning sales department: EMP-0922 showing medium-high compensation friction.', type: 'warning' },
  { source: 'Diagnostics', message: 'Salary analysis shows EMP-0922 is 18.4% below regional benchmark for Sales Manager.', type: 'info' },
  { source: 'Action Plans', message: 'Drafted compensation adjustment directive: COMP-SALES-2026-03.', type: 'success' }
];

export function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<'overview' | 'risk_monitor' | 'root_causes'>('overview');
  const [logs, setLogs] = useState<typeof rawLogs>([]);
  const [logIndex, setLogIndex] = useState(0);

  // Simulate real-time streaming of logs
  useEffect(() => {
    setLogs([rawLogs[0], rawLogs[1], rawLogs[2]]);
    setLogIndex(3);
  }, []);

  useEffect(() => {
    if (logIndex >= rawLogs.length) return;
    const interval = setTimeout(() => {
      setLogs(prev => [...prev.slice(1), rawLogs[logIndex]]);
      setLogIndex(prev => prev + 1);
    }, 4500);
    return () => clearTimeout(interval);
  }, [logIndex]);

  return (
    <section id="dashboard" className="py-24 border-b border-border-primary/60 bg-primary-bg">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 border border-blue-500/20 bg-blue-500/5 px-2.5 py-1 rounded text-xs font-mono tracking-wider text-accent-blue uppercase mb-4">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Interactive Preview</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
              AttriSense Dashboard
            </h2>
            <p className="text-slate-400 text-sm max-w-xl">
              Interact with the preview console below to see how our workforce systems track patterns, evaluate risks, and trigger retention plans.
            </p>
          </div>
          
          {/* Tab Switcher */}
          <div className="flex bg-secondary-bg/80 border border-border-primary/60 p-1 rounded-lg self-center md:self-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-secondary-bg/50 text-accent-blue border border-border-primary/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('risk_monitor')}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded transition-all duration-200 ${
                activeTab === 'risk_monitor'
                  ? 'bg-secondary-bg/50 text-accent-blue border border-border-primary/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Risk Monitor
            </button>
            <button
              onClick={() => setActiveTab('root_causes')}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded transition-all duration-200 ${
                activeTab === 'root_causes'
                  ? 'bg-secondary-bg/50 text-accent-blue border border-border-primary/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Risk Drivers
            </button>
          </div>
        </div>

        {/* Dashboard Shell */}
        <div className="bg-secondary-bg/80 border border-border-primary/60 rounded-lg overflow-hidden shadow-2xl">
          
          {/* Dashboard Header Bar */}
          <div className="bg-secondary-bg/50 border-b border-border-primary/60 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]"></div>
              <span className="font-mono text-xs text-slate-400 tracking-wider">
                Workspace: <span className="text-white">Active</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-4 font-mono text-[10px] text-slate-400 tracking-wider">
              <span>AI Agents Active: <span className="text-accent-blue">05/05</span></span>
              <span className="text-white/20">|</span>
              <span>Employees Scanned: <span className="text-white">248</span></span>
              <span className="text-white/20">|</span>
              <span>Alerts: <span className="text-[#EF4444]">04</span></span>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Tactical Mini-cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-secondary-bg/50 border border-border-primary/60 p-5 rounded flex items-center justify-between">
                    <div>
                      <span className="block font-mono text-[10px] uppercase text-slate-400 tracking-wider mb-1">
                        Monitored Employees
                      </span>
                      <span className="font-mono text-2xl font-bold text-white tracking-tight">
                        248
                      </span>
                    </div>
                    <div className="text-blue-500/20 bg-blue-500/5 border border-blue-500/10 p-2.5 rounded">
                      <Users className="w-5 h-5 text-accent-blue" />
                    </div>
                  </div>

                  <div className="bg-secondary-bg/50 border border-border-primary/60 p-5 rounded flex items-center justify-between">
                    <div>
                      <span className="block font-mono text-[10px] uppercase text-slate-400 tracking-wider mb-1">
                        Attrition Rate
                      </span>
                      <div className="flex items-baseline space-x-2">
                        <span className="font-mono text-2xl font-bold text-[#EF4444] tracking-tight">
                          16.2%
                        </span>
                        <span className="font-mono text-xs text-[#22C55E] flex items-center">
                          <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> -51.8% improvement
                        </span>
                      </div>
                    </div>
                    <div className="text-emerald-500/20 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded">
                      <TrendingDown className="w-5 h-5 text-[#22C55E]" />
                    </div>
                  </div>

                  <div className="bg-secondary-bg/50 border border-border-primary/60 p-5 rounded flex items-center justify-between">
                    <div>
                      <span className="block font-mono text-[10px] uppercase text-slate-400 tracking-wider mb-1">
                        High Risk Employees
                      </span>
                      <span className="font-mono text-2xl font-bold text-[#F59E0B] tracking-tight">
                        04
                      </span>
                    </div>
                    <div className="text-amber-500/20 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded">
                      <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
                    </div>
                  </div>
                </div>

                {/* Grid showing Chart + Live Log Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Recharts Chart */}
                  <div className="lg:col-span-8 bg-secondary-bg/50 border border-border-primary/60 p-6 rounded flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-mono text-[10px] uppercase text-slate-400 tracking-wider">
                        Attrition Projection (6-Month Forecast)
                      </span>
                      <div className="flex items-center space-x-4 font-mono text-[10px]">
                        <span className="flex items-center text-slate-400">
                          <span className="w-2 h-2 bg-slate-500 rounded-full mr-1.5"></span> Baseline
                        </span>
                        <span className="flex items-center text-accent-blue">
                          <span className="w-2 h-2 bg-accent-blue rounded-full mr-1.5"></span> AttriSense AI
                        </span>
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height={256} minWidth={0}>
                        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                          <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tick={{ fontFamily: 'var(--font-mono)' }} />
                          <YAxis stroke="#6b7280" fontSize={10} tick={{ fontFamily: 'var(--font-mono)' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#121414', 
                              borderColor: '#2A2D2F',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              color: '#fff'
                            }} 
                          />
                          <Area type="monotone" dataKey="baseline" stroke="#4b5563" strokeWidth={1.5} fill="none" strokeDasharray="5 5" />
                          <Area type="monotone" dataKey="optimized" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorOptimized)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right Column: Live Terminal logs */}
                  <div className="lg:col-span-4 bg-secondary-bg/50 border border-border-primary/60 rounded p-6 flex flex-col justify-between min-h-[300px]">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <TerminalIcon className="w-4 h-4 text-accent-blue" />
                        <span className="font-mono text-xs text-white uppercase tracking-wider">
                          AI Agent Log Console
                        </span>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse"></span>
                    </div>

                    <div className="flex-1 font-mono text-[10px] space-y-3 overflow-y-auto max-h-[220px] scrollbar-thin">
                      {logs.map((log, index) => (
                        <div key={index} className="space-y-1 text-slate-300">
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-semibold tracking-wider ${
                              log.source === 'Prediction' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                              log.source === 'Action Plans' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                              log.source === 'Reports' ? 'bg-cyan-500/10 text-cyan-400' :
                              'bg-blue-500/10 text-accent-blue'
                            }`}>
                              [{log.source}]
                            </span>
                            <span className="text-[8px] text-slate-500">Verified</span>
                          </div>
                          <p className="pl-1 text-slate-400 leading-relaxed border-l border-white/5">{log.message}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between font-mono text-[8px] text-slate-500">
                      <span>System: Online</span>
                      <span>Status: 100% Ok</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Risk Monitor Tab */}
            {activeTab === 'risk_monitor' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <span className="font-mono text-[10px] uppercase text-slate-400 tracking-wider">
                    High Attrition Risk Profiles
                  </span>
                  <div className="flex items-center space-x-2 font-mono text-xs">
                    <span className="inline-block w-2.5 h-2.5 bg-[#EF4444] rounded-full"></span>
                    <span className="text-white text-xs">Risk threshold filter: &gt; 70%</span>
                  </div>
                </div>

                {/* Table representation for Desktop, Cards for Mobile */}
                <div className="overflow-x-auto hidden md:block">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border-primary/60 text-slate-400">
                        <th className="pb-3 uppercase tracking-wider font-semibold">Employee ID</th>
                        <th className="pb-3 uppercase tracking-wider font-semibold">Name</th>
                        <th className="pb-3 uppercase tracking-wider font-semibold">Department</th>
                        <th className="pb-3 uppercase tracking-wider font-semibold">Tenure</th>
                        <th className="pb-3 uppercase tracking-wider font-semibold text-right">Risk Probability</th>
                        <th className="pb-3 uppercase tracking-wider font-semibold text-center">Primary Factor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2D2F]/40 text-slate-300">
                      {highRiskEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-white/2 transition-colors duration-150">
                          <td className="py-4 font-semibold text-accent-blue">{emp.id}</td>
                          <td className="py-4 text-white font-sans">{emp.name}</td>
                          <td className="py-4">{emp.dept}</td>
                          <td className="py-4 text-slate-400">{emp.tenure}</td>
                          <td className="py-4 text-right">
                            <span className={`px-2 py-0.5 rounded font-bold ${
                              emp.probability >= 85 ? 'bg-[#EF4444]/15 text-[#EF4444]' : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                            }`}>
                              {emp.probability}%
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <span className="border border-border-primary/60 bg-secondary-bg/50 px-2.5 py-1 rounded text-slate-300 text-[11px]">
                              {emp.factor}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View: Card List */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {highRiskEmployees.map((emp) => (
                    <div key={emp.id} className="bg-secondary-bg/50 border border-border-primary/60 p-4 rounded space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-accent-blue font-semibold">{emp.id}</span>
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          emp.probability >= 85 ? 'bg-[#EF4444]/15 text-[#EF4444]' : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                        }`}>
                          {emp.probability}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-slate-400">
                        <div>
                          <span className="block text-[10px] text-slate-500 uppercase">NAME</span>
                          <span className="text-white font-sans font-medium">{emp.name}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 uppercase">DEPT</span>
                          <span className="text-slate-300">{emp.dept}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 uppercase">TENURE</span>
                          <span className="text-slate-300">{emp.tenure}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 uppercase">PRIMARY_FACTOR</span>
                          <span className="text-amber-400 text-[11px]">{emp.factor}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Root Causes Tab */}
            {activeTab === 'root_causes' && (
              <div className="space-y-6">
                <span className="block font-mono text-[10px] uppercase text-slate-400 tracking-wider border-b border-white/5 pb-3">
                  Risk Distribution by Department
                </span>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Recharts Bar Chart */}
                  <div className="lg:col-span-7 bg-secondary-bg/50 border border-border-primary/60 p-6 rounded">
                    <span className="block font-mono text-[10px] uppercase text-slate-400 tracking-wider mb-4">
                      High Risk Employees by Department
                    </span>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height={256} minWidth={0}>
                        <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                          <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tick={{ fontFamily: 'var(--font-mono)' }} />
                          <YAxis stroke="#6b7280" fontSize={10} tick={{ fontFamily: 'var(--font-mono)' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#121414', 
                              borderColor: '#2A2D2F',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              color: '#fff'
                            }}
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {deptData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="lg:col-span-5 space-y-4">
                    <span className="block font-mono text-[10px] uppercase text-slate-400 tracking-wider">
                      AI Recommendations
                    </span>
                    {highRiskEmployees.slice(0, 3).map((emp, i) => (
                      <div key={i} className="bg-secondary-bg/50 border border-border-primary/60 p-4 rounded font-mono text-xs">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                          <span className="text-white font-sans font-medium">{emp.name} ({emp.id})</span>
                          <span className="text-[10px] text-amber-500 px-1.5 py-0.5 rounded bg-amber-500/10 font-bold border border-amber-500/20">
                            {emp.factor}
                          </span>
                        </div>
                        <div className="flex items-start space-x-2 text-slate-400">
                          <Zap className="w-4 h-4 text-accent-blue shrink-0 mt-0.5" />
                          <p className="leading-relaxed">
                            <span className="text-white">Recommendation:</span> {emp.suggestion}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Tactical Bottom Grid Status */}
          <div className="bg-secondary-bg/50 border-t border-border-primary/60 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-slate-500 tracking-wider">
            <div className="flex items-center space-x-4">
              <span>Security Certificate: <span className="text-slate-400">Valid</span></span>
              <span className="text-slate-700">|</span>
              <span>API Connection: <span className="text-accent-blue">Connected</span></span>
            </div>
            <span>System: Stable // Version 1.0.0</span>
          </div>

        </div>

      </div>
    </section>
  );
}
