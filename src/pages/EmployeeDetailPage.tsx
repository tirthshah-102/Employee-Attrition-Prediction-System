import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Terminal as TerminalIcon, 
  AlertTriangle, 
  CheckCircle2,
  Brain,
  Play,
  ArrowLeft,
  Loader2,
  Users,
  Compass,
  User,
  Calendar,
  DollarSign,
  Star
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
import { maskName } from '../utils/mask';

// Mock historical trends per week
const weekData = [
  { name: 'W1', baseline: 80, optimized: 80 },
  { name: 'W2', baseline: 82, optimized: 78 },
  { name: 'W3', baseline: 85, optimized: 72 },
  { name: 'W4', baseline: 88, optimized: 64 },
  { name: 'W5', baseline: 87, optimized: 52 },
  { name: 'W6', baseline: 90, optimized: 38 }
];

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { employees, triggerPlaybook, deployingPlaybook, deployLogs, isDataMasked } = useSystem();
  
  const employee = employees.find(e => e.id === id);
  const isThisDeploying = deployingPlaybook === id;

  // Local agent logs for node diagnostics details
  const [nodeLogs, setNodeLogs] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [managerNotesText, setManagerNotesText] = useState('');
  const [sentimentTags, setSentimentTags] = useState<string[]>([]);
  const [savingNotes, setSavingNotes] = useState(false);
  
  // What-If Simulation Sandbox State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProbability, setSimProbability] = useState<number | null>(null);
  const [simStatus, setSimStatus] = useState<string | null>(null);
  const [simReplacementCost, setSimReplacementCost] = useState<number | null>(null);
  const [simInterventionCost, setSimInterventionCost] = useState<number | null>(null);
  const [simRoiSavings, setSimRoiSavings] = useState<number | null>(null);

  // Sliders state
  const [overtimeHrsVal, setOvertimeHrsVal] = useState(employee?.overtimeHrs || 0);
  const [salaryGapVal, setSalaryGapVal] = useState(employee?.salaryGap || 0);
  const [managerFeedbackVal, setManagerFeedbackVal] = useState(employee?.managerFeedback || 7.0);

  useEffect(() => {
    if (employee) {
      setNodeLogs([
        `[Analytics] Telemetry scan initiated for operator node: ${employee.id}`,
        `[Predictor] Initial risk coefficients compiled for ${maskName(employee.name, isDataMasked)}: ${employee.probability}%`,
        `[Diagnosis] Calculated primary vector driver: ${employee.primaryFactor}`
      ]);
      setManagerNotesText(employee.managerNotes || '');
      setOvertimeHrsVal(employee.overtimeHrs || 0);
      setSalaryGapVal(employee.salaryGap || 0);
      setManagerFeedbackVal(employee.managerFeedback || 7.0);
    }
  }, [id, employee]);

  useEffect(() => {
    const fetchHistoryAndTimeline = async () => {
      try {
        const token = localStorage.getItem("attrisense_token") || "";
        
        // Fetch risk history
        const resHist = await fetch(`http://127.0.0.1:5000/api/v1/employees/${id}/risk-history`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const dataHist = await resHist.json();
        if (dataHist.success && dataHist.data.history) {
          setHistory(dataHist.data.history);
        }

        // Fetch career timeline
        const resTime = await fetch(`http://127.0.0.1:5000/api/v1/employees/${id}/timeline`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const dataTime = await resTime.json();
        if (dataTime.success && dataTime.data.timeline) {
          setTimeline(dataTime.data.timeline);
        }
      } catch (err) {
        console.error("Error fetching historical risk or timeline data:", err);
      }
    };
    if (id) {
      fetchHistoryAndTimeline();
    }
  }, [id]);

  const handleSaveManagerNotes = async () => {
    setSavingNotes(true);
    try {
      const token = localStorage.getItem("attrisense_token") || "";
      const res = await fetch(`http://127.0.0.1:5000/api/v1/employees/${id}/manager-notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ notes: managerNotesText })
      });
      const data = await res.json();
      if (data.success) {
        setSentimentTags(data.data.tags);
        window.dispatchEvent(new CustomEvent("app-toast", {
          detail: { message: "Manager notes analyzed and saved successfully.", type: "success" }
        }));
        if (data.data.tags && data.data.tags.length > 0) {
          setNodeLogs(prev => [
            ...prev,
            `[Diagnosis Agent] Text Mining: Manager notes highlight risk drivers: ${data.data.tags.join(', ')}`
          ]);
        }
      } else {
        window.dispatchEvent(new CustomEvent("app-toast", {
          detail: { message: data.message || "Failed to save manager notes.", type: "warning" }
        }));
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent("app-toast", {
        detail: { message: "Network error saving notes.", type: "warning" }
      }));
    } finally {
      setSavingNotes(false);
    }
  };

  const runSimulation = async (ot: number, sg: number, fb: number) => {
    setIsSimulating(true);
    try {
      const token = localStorage.getItem("attrisense_token") || "";
      const res = await fetch("http://127.0.0.1:5000/api/v1/analytics/simulate-risk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          overtimeHrs: ot,
          salaryGap: sg,
          managerFeedback: fb
        })
      });
      const data = await res.json();
      if (data.success) {
        setSimProbability(data.data.probability);
        setSimStatus(data.data.status);
        setSimReplacementCost(data.data.replacementCost);
        setSimInterventionCost(data.data.interventionCost);
        setSimRoiSavings(data.data.roiSavings);
      }
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    if (employee) {
      const timer = setTimeout(() => {
        runSimulation(overtimeHrsVal, salaryGapVal, managerFeedbackVal);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [overtimeHrsVal, salaryGapVal, managerFeedbackVal]);

  // Append execution success to logs when playbook mitigates risk
  useEffect(() => {
    if (employee && employee.playbookStatus === 'Executed') {
      setNodeLogs(prev => {
        if (prev.some(log => log.includes('[Playbooks] Playbook executed'))) return prev;
        return [
          ...prev,
          `[Playbooks] Playbook executed successfully.`,
          `[Predictor] Threat index reduced to ${employee.probability}%`
        ];
      });
    }
  }, [employee?.playbookStatus, employee?.probability]);

  if (!employee) {
    return (
      <div className="min-h-screen bg-primary-bg text-slate-100 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md bg-secondary-bg/80 border border-border-primary/60 rounded p-8 text-center space-y-6">
          <div className="inline-flex p-3 rounded bg-red-500/10 border border-red-500/20 text-[#EF4444] mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Employee Not Found</h2>
          <p className="text-slate-400 text-xs">
            The requested employee could not be found in the directory.
          </p>
          <Link
            to="/dashboard"
            className="w-full bg-secondary-bg/50 hover:bg-slate-900 border border-border-primary/60 py-2.5 rounded font-mono text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  // Adjust Recharts Week progression based on current mitigated probability
  const dynamicWeekData = weekData.map((d, i) => {
    if (i === 5) {
      return { ...d, optimized: employee.probability };
    }
    if (i === 4 && employee.playbookStatus === 'Executed') {
      return { ...d, optimized: Math.round(employee.probability * 1.3) };
    }
    return d;
  });

  return (
    <div className="min-h-screen bg-primary-bg text-slate-100 font-sans flex flex-col relative selection:bg-accent-blue/30 selection:text-white">
      
      {/* 1. Fixed Top Command Header */}
      <header className="h-16 bg-secondary-bg/80 border-b border-border-primary/60 px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 border border-border-primary/60 bg-secondary-bg/50 px-3.5 py-1.5 rounded font-mono text-[10px] tracking-wider text-slate-400 hover:text-white hover:border-accent-blue/55 transition-colors duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
        </div>

        <div className="flex items-center space-x-6 font-mono text-[10px] text-slate-500 tracking-wider">
          <span className="hidden sm:block">Employee ID: <span className="text-white">{employee.id}</span></span>
          <span className="hidden sm:block text-slate-700">|</span>
          <span>TIME: <span className="text-slate-300">18:12:04 Z</span></span>
        </div>
      </header>

      {/* Main Grid: 12-Column Responsive Page Structure */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 items-stretch gap-0 relative">
        
        {/* LEFT COLUMN (3 Cols): Employee profile contexts */}
        <aside className="lg:col-span-3 bg-secondary-bg/80 border-b lg:border-b-0 lg:border-r border-border-primary/60 p-6 space-y-6">
          <div className="text-center pb-6 border-b border-border-primary/60">
            {/* Avatar placeholder with status glow */}
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md"></div>
              <div className="relative w-20 h-20 rounded-full border-2 border-border-primary/60 bg-secondary-bg/50 flex items-center justify-center text-slate-400">
                <User className="w-10 h-10" />
              </div>
              <span className={`w-3.5 h-3.5 rounded-full absolute bottom-1 right-1 border-2 border-[#121414] ${
                employee.status === 'High' ? 'bg-[#EF4444]' : 
                employee.status === 'Medium' ? 'bg-[#F59E0B]' : 
                'bg-[#22C55E]'
              }`}></span>
            </div>
            
            <h2 className="text-lg font-bold text-white leading-tight">{maskName(employee.name, isDataMasked)}</h2>
            <span className="font-mono text-[9px] text-accent-blue tracking-wider uppercase block mt-1">
              {employee.role}
            </span>
          </div>

          {/* Profile metadata */}
          <div className="space-y-4 font-mono text-[10px]">
            <span className="block text-slate-500 uppercase tracking-wider">Employee Metrics</span>
            
            <div className="space-y-2">
              <div className="flex justify-between border-b border-border-primary/60/40 pb-1.5">
                <span className="text-slate-500 flex items-center"><Users className="w-3.5 h-3.5 mr-1 text-slate-600" /> Department:</span>
                <span className="text-white uppercase">{employee.dept}</span>
              </div>
              <div className="flex justify-between border-b border-border-primary/60/40 pb-1.5">
                <span className="text-slate-500 flex items-center"><Calendar className="w-3.5 h-3.5 mr-1 text-slate-600" /> Tenure:</span>
                <span className="text-white uppercase">{employee.tenure}</span>
              </div>
              <div className="flex justify-between border-b border-border-primary/60/40 pb-1.5">
                <span className="text-slate-500 flex items-center"><Calendar className="w-3.5 h-3.5 mr-1 text-slate-600" /> Hired Date:</span>
                <span className="text-white uppercase">{employee.dateHired}</span>
              </div>
              <div className="flex justify-between border-b border-border-primary/60/40 pb-1.5">
                <span className="text-slate-500 flex items-center"><Compass className="w-3.5 h-3.5 mr-1 text-slate-600" /> Location:</span>
                <span className="text-white uppercase">{employee.location}</span>
              </div>
              <div className="flex justify-between border-b border-border-primary/60/40 pb-1.5">
                <span className="text-slate-500 flex items-center"><Star className="w-3.5 h-3.5 mr-1 text-slate-600" /> Performance:</span>
                <span className="text-white">{employee.rating}/5.0</span>
              </div>
              <div className="flex justify-between border-b border-border-primary/60/40 pb-1.5">
                <span className="text-slate-500 flex items-center"><DollarSign className="w-3.5 h-3.5 mr-1 text-slate-600" /> Salary Market Delta:</span>
                <span className={`font-semibold ${employee.salaryGap < 0 ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                  {employee.salaryGap}% Delta
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* MIDDLE CONTENT COLUMN (6 Cols): Risk and playbooks dashboard */}
        <main className="lg:col-span-6 p-6 space-y-6 overflow-y-auto">
          
          {/* Risk probability and historical chart */}
          <div className="bg-secondary-bg/50 border border-border-primary/60 p-6 rounded space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border-primary/60/60 pb-3">
              <div>
                <span className="block font-mono text-[9px] uppercase text-slate-500 tracking-wider">Attrition Threat Level</span>
                <h3 className="font-bold text-sm text-white mt-0.5">Historical Attrition Risk Forecast</h3>
              </div>
              <div className="flex items-center space-x-3.5 bg-secondary-bg/80 border border-border-primary/60 px-4 py-2 rounded">
                <span className="font-mono text-[10px] text-slate-400">Risk Score:</span>
                <span className={`font-mono text-base font-bold ${
                  employee.status === 'High' ? 'text-[#EF4444]' : 
                  employee.status === 'Medium' ? 'text-[#F59E0B]' : 
                  'text-[#22C55E]'
                }`}>{employee.probability}%</span>
              </div>
            </div>

            {/* Recharts Area progression forecast */}
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height={240} minWidth={0}>
                <AreaChart 
                  data={(history.length > 0
                    ? [
                        ...history.map((h) => {
                          const date = new Date(h.recorded_at);
                          const label = date.toLocaleString('default', { month: 'short' });
                          return {
                            name: label,
                            probability: h.probability
                          };
                        }),
                        {
                          name: 'Current',
                          probability: employee.probability
                        }
                      ]
                    : dynamicWeekData
                  ) as any[]} 
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorOptimizedDetail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
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
                      color: '#fff',
                      fontSize: '11px'
                    }} 
                  />
                  {history.length === 0 && (
                    <Area type="monotone" dataKey="baseline" stroke="#4b5563" strokeWidth={1.5} fill="none" strokeDasharray="5 5" />
                  )}
                  <Area 
                    type="monotone" 
                    dataKey={history.length > 0 ? "probability" : "optimized"} 
                    stroke="#3B82F6" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorOptimizedDetail)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Explainable AI (SHAP) bar charts */}
          <div className="bg-secondary-bg/50 border border-border-primary/60 p-6 rounded space-y-6">
            <span className="block font-mono text-[9px] uppercase text-slate-500 tracking-wider border-b border-white/5 pb-3">
              Risk Factors Breakdown
            </span>

            {/* Custom bar gauges */}
            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Weekly Overtime Hours ({employee.overtimeHrs} hrs/week)</span>
                  <span className="text-[#EF4444] font-bold">+{Math.round(employee.overtimeHrs * 2.5)}% Impact</span>
                </div>
                <div className="w-full bg-primary-bg h-2 rounded overflow-hidden">
                  <div className="bg-[#EF4444] h-full rounded" style={{ width: `${Math.min((employee.overtimeHrs / 20) * 100, 100)}%` }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Salary vs Market Benchmark ({employee.salaryGap}%)</span>
                  <span className={`font-bold ${employee.salaryGap < 0 ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                    {employee.salaryGap < 0 ? `+${Math.abs(employee.salaryGap) * 1.5}% Impact` : `${employee.salaryGap}% Surplus`}
                  </span>
                </div>
                <div className="w-full bg-primary-bg h-2 rounded overflow-hidden">
                  <div className={`h-full rounded ${employee.salaryGap < 0 ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`} style={{ width: `${Math.max(Math.min((Math.abs(employee.salaryGap) / 25) * 100, 100), 5)}%` }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Manager Feedback Score ({employee.managerFeedback}/10)</span>
                  <span className="text-cyan-400 font-bold">-{Math.round((10 - employee.managerFeedback) * 3)}% Mitigation</span>
                </div>
                <div className="w-full bg-primary-bg h-2 rounded overflow-hidden">
                  <div className="bg-[#06B6D4] h-full rounded" style={{ width: `${employee.managerFeedback * 10}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive "What-If" Simulation Sandbox */}
          <div className="bg-secondary-bg/50 border border-border-primary/60 p-6 rounded space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-accent-blue" />
                <h3 className="font-bold text-sm text-white">What-If Simulation Sandbox</h3>
              </div>
              <span className="font-mono text-[9px] bg-accent-blue/10 text-accent-blue border border-accent-blue/20 px-2 py-0.5 rounded uppercase font-semibold">Interactive</span>
            </div>

            <p className="text-slate-400 text-xs leading-normal">
              Simulate changes to this employee's workload, compensation delta, and relationship health to forecast the impact on their retention risk and ROI.
            </p>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
              {/* Overtime hrs slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Weekly Overtime</span>
                  <span className="text-white font-bold">{overtimeHrsVal} hrs</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={overtimeHrsVal}
                  onChange={(e) => setOvertimeHrsVal(parseInt(e.target.value) || 0)}
                  className="w-full accent-[#3B82F6] h-1 bg-primary-bg rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Salary Gap slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Salary Gap</span>
                  <span className={`font-bold ${salaryGapVal < 0 ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                    {salaryGapVal}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={salaryGapVal}
                  onChange={(e) => setSalaryGapVal(parseInt(e.target.value) || 0)}
                  className="w-full accent-[#3B82F6] h-1 bg-primary-bg rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Manager Feedback slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Manager Feedback</span>
                  <span className="text-white font-bold">{managerFeedbackVal}/10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={managerFeedbackVal}
                  onChange={(e) => setManagerFeedbackVal(parseFloat(e.target.value) || 0)}
                  className="w-full accent-[#3B82F6] h-1 bg-primary-bg rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Simulated Results Display */}
            <div className="bg-primary-bg border border-border-primary/60 p-4 rounded grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Panel: Simulated Risk Meter */}
              <div className="space-y-3 flex flex-col justify-center border-b md:border-b-0 md:border-r border-border-primary/60 pb-4 md:pb-0 md:pr-4">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">Simulated Risk</span>
                  {isSimulating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-blue" />
                  ) : (
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] font-mono ${
                      simStatus === 'High' ? 'bg-[#EF4444]/15 text-[#EF4444]' : 
                      simStatus === 'Medium' ? 'bg-[#F59E0B]/15 text-[#F59E0B]' :
                      'bg-[#22C55E]/15 text-[#22C55E]'
                    }`}>
                      {simStatus}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline space-x-1.5">
                  <span className="text-2xl font-bold text-white tracking-tight">
                    {simProbability !== null ? `${simProbability}%` : '—'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">predicted score</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-secondary-bg/80 h-2 rounded overflow-hidden">
                  <div 
                    className={`h-full rounded transition-all duration-300 ${
                      simStatus === 'High' ? 'bg-[#EF4444]' : 
                      simStatus === 'Medium' ? 'bg-[#F59E0B]' : 
                      'bg-[#22C55E]'
                    }`} 
                    style={{ width: `${simProbability || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Right Panel: Simulated ROI Financials */}
              <div className="space-y-3 font-mono text-[10px]">
                <span className="text-slate-500 uppercase tracking-wider">Estimated ROI Projections</span>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Est. Attrition Cost:</span>
                    <span className="text-slate-300 font-bold">${simReplacementCost?.toLocaleString() || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Est. Intervention Cost:</span>
                    <span className="text-slate-300 font-bold">${simInterventionCost?.toLocaleString() || '—'}</span>
                  </div>
                  <div className="flex justify-between border-t border-border-primary/60/60 pt-1.5 text-xs">
                    <span className="text-slate-400 font-bold">Est. Net ROI Savings:</span>
                    <span className="text-[#22C55E] font-bold">${simRoiSavings?.toLocaleString() || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Manager Notes & Sentiment Diagnosis */}
          <div className="bg-secondary-bg/50 border border-border-primary/60 p-6 rounded space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-accent-blue" />
                <h3 className="font-bold text-sm text-white">Manager Review Notes</h3>
              </div>
              <span className="font-mono text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded uppercase">DIAGNOSTIC_INPUT</span>
            </div>

            <div className="space-y-4">
              <textarea
                value={managerNotesText}
                onChange={(e) => setManagerNotesText(e.target.value)}
                placeholder="Type qualitative review notes here (e.g., 'Employee experiencing burnout due to high overtime' or 'Competitor offering higher salary')..."
                className="w-full h-24 bg-primary-bg border border-border-primary/60 rounded text-xs p-3 text-white placeholder-slate-600 focus:outline-none focus:border-accent-blue resize-none"
              />

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {sentimentTags.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/20 text-[9px] font-mono font-bold uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                  {sentimentTags.length === 0 && (
                    <span className="text-[10px] text-slate-500 font-mono italic">No active risk tags</span>
                  )}
                </div>

                <button
                  onClick={handleSaveManagerNotes}
                  disabled={savingNotes}
                  className="bg-secondary-bg/50 hover:bg-slate-900 border border-border-primary/60 hover:border-accent-blue/55 px-4 py-2 rounded text-[10px] uppercase font-mono font-semibold transition-all duration-150 cursor-pointer flex items-center space-x-1 text-white shrink-0"
                >
                  {savingNotes ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save & Analyze</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Action Recommendation Engine */}
          <div className="bg-secondary-bg/50 border border-border-primary/60 p-6 rounded flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <span className="block font-mono text-[9px] uppercase text-slate-500 tracking-wider">Action Recommendation</span>
              <h4 className="font-bold text-sm text-white">Recommended Action Plan:</h4>
              <p className="text-[#F59E0B] font-mono text-xs uppercase tracking-wider font-semibold">
                [ {employee.playbookStatus === 'Executed' ? 'RESOLVED' : employee.primaryFactor} ]
              </p>
            </div>

            {employee.playbookStatus === 'Ready' ? (
              <button
                onClick={() => triggerPlaybook(employee.id)}
                className="w-full md:w-auto bg-accent-blue hover:bg-blue-600 text-white font-mono text-xs uppercase tracking-wider px-6 py-3 rounded border border-blue-500 cursor-pointer flex items-center justify-center space-x-1.5 shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-150 shrink-0"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Apply Action Plan</span>
              </button>
            ) : isThisDeploying ? (
              <div className="w-full md:w-auto bg-secondary-bg/80 border border-border-primary/60 text-slate-400 font-mono text-xs uppercase tracking-wider px-6 py-3 rounded flex items-center justify-center space-x-2 shrink-0">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-blue" />
                <span>Applying Action Plan...</span>
              </div>
            ) : (
              <div className="w-full md:w-auto bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] font-mono text-xs uppercase tracking-wider px-6 py-3 rounded flex items-center justify-center space-x-2 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>Action Plan Applied</span>
              </div>
            )}
          </div>

          {/* Career Attrition Log Timeline */}
          <div className="bg-secondary-bg/50 border border-border-primary/60 p-6 rounded-xl space-y-4 shadow-xl mt-6">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-white">Career Attrition Log Timeline</h3>
            </div>
            <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-border-primary/50 pl-1">
              {timeline && timeline.length > 0 ? (
                timeline.map((event: any, idx: number) => (
                  <div key={idx} className="flex gap-4 relative">
                    <div className="w-6 h-6 rounded-full bg-secondary-bg/80 border border-border-primary flex items-center justify-center text-primary shrink-0 relative z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">{event.eventType}</span>
                        <span className="text-[10px] font-mono text-slate-500">{new Date(event.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{event.details}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 pl-4">No timeline history loaded.</p>
              )}
            </div>
          </div>

        </main>

        {/* RIGHT COLUMN (3 Cols): Log feed rail for specific employee */}
        <aside className="lg:col-span-3 bg-secondary-bg/80 border-t lg:border-t-0 lg:border-l border-border-primary/60 p-6 flex flex-col justify-between space-y-6">
          
          {/* Telemetry settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
              <Brain className="w-4 h-4 text-accent-blue" />
              <span className="font-mono text-xs text-white uppercase tracking-wider">
                Status
              </span>
            </div>

            <div className="bg-secondary-bg/50 border border-border-primary/60 p-4 rounded font-mono text-[10px] space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Connection:</span>
                <span className="text-white">Stable</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">Risk Level:</span>
                <span className={employee.status === 'High' ? 'text-[#EF4444]' : employee.status === 'Medium' ? 'text-[#F59E0B]' : 'text-[#22C55E]'}>
                  {employee.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Action Plan:</span>
                <span className={employee.playbookStatus === 'Executed' ? 'text-[#22C55E]' : 'text-slate-300'}>
                  {employee.playbookStatus.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* If deploying playbook, display terminal output */}
          {isThisDeploying && (
            <div className="bg-primary-bg border border-border-primary/60 p-4 rounded font-mono text-[10px] space-y-2">
              <div className="flex items-center space-x-1.5 text-blue-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="font-bold uppercase tracking-wider">Action Plan Status</span>
              </div>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto leading-normal text-slate-400 font-mono">
                {deployLogs.map((log, index) => (
                  <p key={index} className={log.includes('[SUCCESS]') ? 'text-[#22C55E]' : 'text-slate-400'}>&gt; {log}</p>
                ))}
              </div>
            </div>
          )}

          {/* Log streams for employee ID */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center space-x-1.5">
                <TerminalIcon className="w-3.5 h-3.5 text-accent-blue" />
                <span className="font-mono text-xs text-white uppercase tracking-wider">
                  System Logs
                </span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse"></span>
            </div>

            <div className="font-mono text-[9px] space-y-3.5 max-h-[220px] overflow-y-auto scrollbar-thin">
              {nodeLogs.map((log, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="text-slate-400 leading-normal border-l border-white/5 pl-2">
                    {log}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </aside>

      </div>

    </div>
  );
}
