import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  TrendingDown, 
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Users,
  Activity,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid
} from 'recharts';
import { useSystem } from '../context/SystemContext';
import api from '../utils/api';
import { maskName } from '../utils/mask';

// Historical trends
const baseTrendData = [
  { name: 'W1', baseline: 16.2, optimized: 15.8 },
  { name: 'W2', baseline: 16.5, optimized: 14.9 },
  { name: 'W3', baseline: 16.9, optimized: 13.5 },
  { name: 'W4', baseline: 17.2, optimized: 11.2 },
  { name: 'W5', baseline: 17.0, optimized: 9.8 },
  { name: 'W6', baseline: 17.5, optimized: 7.8 }
];

export function Dashboard() {
  const navigate = useNavigate();
  const { employees, triggerPlaybook, isDataMasked } = useSystem();
  
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Load KPIs and chart stats from Flask backend
  useEffect(() => {
    api.get('/analytics/dashboard')
      .then(res => {
        if (res.data.success) {
          setDashboardData(res.data.data);
        }
      })
      .catch(err => {
        console.error('Failed to load dashboard analytics from backend:', err);
      });
  }, [employees]); // Reload if employees change (e.g. playbook executed)

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Dynamic KPIs
  const totalNodes = dashboardData?.kpis?.total ?? employees.length;
  const highThreatCount = dashboardData?.kpis?.highRisk ?? employees.filter(e => e.status === 'High').length;
  const executedPlaybooks = dashboardData?.kpis?.executedPlaybooks ?? employees.filter(e => e.playbookStatus === 'Executed').length;
  const completionRate = dashboardData?.kpis?.completionRate ?? (totalNodes > 0 ? Math.round((executedPlaybooks / totalNodes) * 100) : 0);

  const currentRiskIndex = dashboardData?.kpis?.currentRiskIndex ?? Math.max(16.2 - (executedPlaybooks * 0.95), 6.5).toFixed(1);
  const totalMitigationPercent = dashboardData?.kpis?.totalMitigationPct ?? ((16.2 - parseFloat(String(currentRiskIndex))) / 16.2 * 100).toFixed(0);

  // Dynamic trend data to reflect playbook executions in real time
  const trendData: { name: string; baseline: number; optimized: number }[] = dashboardData?.trendData ?? baseTrendData.map((d: any, index: number) => {
    if (index === 5) {
      return { ...d, optimized: parseFloat(String(currentRiskIndex)) };
    }
    if (index === 4) {
      return { ...d, optimized: Math.max(d.optimized - (executedPlaybooks * 0.5), 8.0) };
    }
    return d;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Dynamic Welcoming Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-primary/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>Dashboard</span>
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">Real-time attrition monitoring and AI-driven mitigation recommendations.</p>
        </div>
        <div className="self-start sm:self-auto font-mono text-[10px] text-slate-400 bg-secondary-bg/60 px-3 py-1.5 rounded-lg border border-border-primary/50 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>SYSTEM LIVE & SECURE</span>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Metric 1 */}
        <div className="bg-secondary-bg/55 border border-border-primary/60 p-4 sm:p-5 rounded-xl flex flex-col justify-between space-y-4 shadow-sm hover:border-border-primary transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase text-slate-400 font-mono tracking-wider">
              Total Monitored Employees
            </span>
            <div className="p-2 bg-blue-500/10 text-accent-blue rounded-lg border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-white">
              {totalNodes.toLocaleString()}
            </div>
            <div className="flex items-center text-[10px] font-mono text-[#22C55E] mt-1">
              <span className="font-bold">100% Monitored</span>
              <span className="text-slate-500 ml-1.5">Across All Departments</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-secondary-bg/55 border border-border-primary/60 p-4 sm:p-5 rounded-xl flex flex-col justify-between space-y-4 shadow-sm hover:border-border-primary transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase text-slate-400 font-mono tracking-wider">
              High Risk Attrition Headcount
            </span>
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-white">
              {highThreatCount}
            </div>
            <div className="flex items-center text-[10px] font-mono text-red-400 mt-1">
              <TrendingDown className="w-3.5 h-3.5 mr-1" />
              <span className="font-bold">Immediate Action Required</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-secondary-bg/55 border border-border-primary/60 p-4 sm:p-5 rounded-xl flex flex-col justify-between space-y-4 shadow-sm hover:border-border-primary transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase text-slate-400 font-mono tracking-wider">
              Projected Risk Index
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-white">
              {currentRiskIndex}%
            </div>
            <div className="flex items-center text-[10px] font-mono text-emerald-400 mt-1">
              <span className="font-bold">-{totalMitigationPercent}%</span>
              <span className="text-slate-500 ml-1.5">Mitigation Active</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-secondary-bg/55 border border-border-primary/60 p-4 sm:p-5 rounded-xl flex flex-col justify-between space-y-4 shadow-sm hover:border-border-primary transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase text-slate-400 font-mono tracking-wider">
              Playbook Completion Rate
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-white">
              {completionRate}%
            </div>
            <div className="flex items-center text-[10px] font-mono text-[#22C55E] mt-1">
              <span className="font-bold">{executedPlaybooks} Executed</span>
              <span className="text-slate-500 ml-1.5">by Autonomous Engine</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Analytics Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Attrition Optimization Forecast Chart */}
        <div className="lg:col-span-12 bg-secondary-bg/55 border border-border-primary/60 p-4 sm:p-6 rounded-xl flex flex-col justify-between shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <span className="text-xs font-bold uppercase text-slate-300 tracking-wider">
              Weekly Attrition Optimization Forecast
            </span>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] font-mono">
              <span className="flex items-center text-slate-400">
                <span className="w-2.5 h-2.5 bg-slate-600 rounded mr-1.5"></span> Baseline
              </span>
              <span className="flex items-center text-indigo-400">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded mr-1.5"></span> AttriSense Optimized
              </span>
            </div>
          </div>

          <div className="w-full min-w-0 h-[260px] sm:h-[280px] relative">
            {mounted ? (
              <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={240}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} tick={{ fontFamily: 'var(--font-sans)' }} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tick={{ fontFamily: 'var(--font-sans)' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '12px',
                      color: '#f8fafc',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                    }} 
                  />
                  <Area type="monotone" dataKey="baseline" stroke="#475569" strokeWidth={1.5} fill="none" strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="optimized" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOptimized)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                Loading forecast visualization...
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Critical Threat Profiles Quickview */}
      <div className="bg-secondary-bg/55 border border-border-primary/60 p-4 sm:p-6 rounded-xl space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-border-primary/40 pb-3">
          <span className="text-xs font-bold uppercase text-slate-300 tracking-wider">
            High Attrition Risk Queue
          </span>
          <button 
            onClick={() => navigate('/risk-analytics')}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <span>View Risk Analysis</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {employees.filter(e => e.status === 'High').slice(0, 4).map((emp) => (
            <div 
              key={emp.id} 
              className="bg-secondary-bg/90 border border-border-primary/60 hover:border-indigo-500/50 rounded-xl p-4 flex flex-col justify-between space-y-4 group transition-all duration-300 hover:shadow-lg hover:shadow-indigo-950/20"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors duration-200">{maskName(emp.name, isDataMasked)}</h4>
                  <span className="font-mono text-[10px] text-indigo-400">{emp.id}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-red-500/10 text-red-400 border border-red-500/10">
                  {emp.probability}%
                </span>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 font-sans">
                <div>DEPT: <span className="text-slate-200 font-medium">{emp.dept.toUpperCase()}</span></div>
                <div>Risk Factor: <span className="text-amber-400 font-medium">{emp.primaryFactor}</span></div>
              </div>

              <div className="pt-3 border-t border-border-primary/40 flex items-center justify-between">
                <button
                  onClick={() => navigate(`/employee/${emp.id}`)}
                  className="text-[10px] text-slate-400 hover:text-white font-bold uppercase flex items-center space-x-0.5 transition-colors cursor-pointer"
                >
                  <span>View Analysis</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                {emp.playbookStatus === 'Ready' ? (
                  <button
                    onClick={() => triggerPlaybook(emp.id)}
                    className="bg-indigo-500/15 border border-indigo-500/35 text-indigo-400 hover:bg-indigo-600 hover:text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all duration-150 uppercase cursor-pointer"
                  >
                    Apply Action
                  </button>
                ) : emp.playbookStatus === 'In Progress' ? (
                  <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase animate-pulse">Applying...</span>
                ) : (
                  <span className="text-emerald-400 text-[10px] font-bold tracking-wider uppercase flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Applied</span>
                  </span>
                )}
              </div>
            </div>
          ))}
          {employees.filter(e => e.status === 'High').length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-400 text-xs">
              No High Risk Employees in Queue
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
