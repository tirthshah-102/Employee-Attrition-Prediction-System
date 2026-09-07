import { useState } from 'react';
import { 
  Database, 
  Brain, 
  Search, 
  Sparkles, 
  ClipboardList,
  ArrowRight,
  Terminal,
  Cpu,
  Workflow
} from 'lucide-react';

interface AgentInfo {
  id: string;
  name: string;
  shortName: string;
  icon: React.ComponentType<any>;
  role: string;
  telemetry: { label: string; value: string }[];
  responsibilities: string[];
  consoleLogs: string[];
}

const agentsData: AgentInfo[] = [
  {
    id: 'employee_analytics',
    name: 'Employee Analytics Agent',
    shortName: 'Data Collector',
    icon: Database,
    role: 'Gathers and structures raw employee activity data. It continuously extracts records from HR systems, attendance logs, task completion trackers, and engagement surveys to form a cohesive, real-time activity dataset.',
    telemetry: [
      { label: 'Agent ID', value: 'AGT-EA-01' },
      { label: 'Data Stream', value: 'Active / Channels' },
      { label: 'Data Sources', value: 'Jira, BambooHR, Slack, O365' },
      { label: 'Scan Interval', value: '10 seconds' }
    ],
    responsibilities: [
      'Ingest raw performance, attendance, and interaction metrics without manual file loading.',
      'Normalize multi-system data streams into structured user-activity matrices.',
      'Identify critical anomalies in work activity patterns (e.g., sudden drop in active hours, erratic overtime).',
      'Provide structured dataset pipelines to downstream machine learning agents.'
    ],
    consoleLogs: [
      'System started: Data collector online.',
      'Syncing data from BambooHR API (Success).',
      'Processing task info from Jira: 8,421 tasks analyzed.',
      'Engagement score for Engineering: 84%.',
      'Warning: Sudden overtime spike (+34%) detected for employee EMP-0412.'
    ]
  },
  {
    id: 'attrition_prediction',
    name: 'Attrition Prediction Agent',
    shortName: 'Risk Predictor',
    icon: Brain,
    role: 'Calculates attrition probabilities using machine learning. It models normalized performance matrices against historical resignation patterns, highlighting employees whose resignation likelihood exceeds defined parameters.',
    telemetry: [
      { label: 'Agent ID', value: 'AGT-AP-02' },
      { label: 'AI Model', value: 'Predictive Model (AI)' },
      { label: 'Forecast Horizon', value: '90 Days' },
      { label: 'AI Accuracy', value: '94.8%' }
    ],
    responsibilities: [
      'Classify employee attrition risk profiles into three levels: Low, Medium, and High.',
      'Run recurring prediction cycles on live performance datasets.',
      'Cross-reference current performance metrics with historical resignation patterns.',
      'Trigger alerts for individuals showing severe risk trends.'
    ],
    consoleLogs: [
      'System started: Risk predictor online.',
      'Analyzing risk levels for 248 employees.',
      'Cross-referencing resignation factors with historical data.',
      'Alert: EMP-0412 risk rose to 91.2% (High Risk).',
      'Alert: EMP-0922 risk calculated at 84.5% (High Risk).'
    ]
  },
  {
    id: 'root_cause_analysis',
    name: 'Root Cause Analysis Agent',
    shortName: 'Reason Finder',
    icon: Search,
    role: 'Identifies the precise factors driving attrition risks. Using explainable AI methods, it determines if an employee’s risk is due to high workload, salary gaps compared to market value, or lack of role advancement.',
    telemetry: [
      { label: 'Agent ID', value: 'AGT-RCA-03' },
      { label: 'Analysis Engine', value: 'Factor Explainer (AI)' },
      { label: 'Confidence Level', value: '91.4%' },
      { label: 'Risk Categories', value: 'Workload, Pay, Growth, Feedback' }
    ],
    responsibilities: [
      'Compute factor values to explain the mathematical reasons behind risk classifications.',
      'Map specific employee data anomalies to human-readable factors (e.g., "18% below market salary benchmark").',
      'Identify systemic issues inside specific departments (e.g., high attrition in engineering due to overtime).',
      'Send causal diagnostics data to the recommendation playbook agent.'
    ],
    consoleLogs: [
      'System started: Reason finder online.',
      'Analyzing primary risk factors for EMP-0412.',
      'Result: EMP-0412 primary risk factor is Overtime & Workload.',
      'Analyzing primary risk factors for EMP-0922.',
      'Result: EMP-0922 primary risk factor is Salary Difference (18.4% below market).'
    ]
  },
  {
    id: 'retention_recommendation',
    name: 'Retention Recommendation Agent',
    shortName: 'Action Recommender',
    icon: Sparkles,
    role: 'Formulates targeted retention strategies. Based on the root cause diagnostics, it scans internal resource catalogs to suggest tailored remedies like training tracks, salary checks, mentoring, or load balancing.',
    telemetry: [
      { label: 'Agent ID', value: 'AGT-RR-04' },
      { label: 'Plan Database', value: 'Retention Library' },
      { label: 'Action Method', value: 'Factor-driven Match' },
      { label: 'Automation Level', value: 'Semi-Autonomous' }
    ],
    responsibilities: [
      'Map identified root causes directly to custom organizational retention plays.',
      'Draft specific proposals (e.g., training courses, mentoring structures, salary adjustment brackets).',
      'Confirm resource availability for recommended actions before presenting them to HR.',
      'Generate dynamic options ranging from high-impact structural adjustments to short-term checks.'
    ],
    consoleLogs: [
      'System started: Action recommender online.',
      'Data received: Risk factors for EMP-0412 (Overtime).',
      'Recommendation: Load balancing & mentoring plan created.',
      'Data received: Risk factors for EMP-0922 (Salary Gap).',
      'Recommendation: Salary review plan created (suggested 15% increase).'
    ]
  },
  {
    id: 'hr_insights',
    name: 'HR Insights Agent',
    shortName: 'Report Writer',
    icon: ClipboardList,
    role: 'Prepares comprehensive executive briefs for human leadership. It summarizes the findings, data trails, and playbook actions of all upstream agents into clear, professional reports to support HR decisions.',
    telemetry: [
      { label: 'Agent ID', value: 'AGT-HI-05' },
      { label: 'Summarizer Engine', value: 'AI Summary Generator' },
      { label: 'Report Status', value: 'Ready' },
      { label: 'File Formats', value: 'PDF, Web Page' }
    ],
    responsibilities: [
      'Translate statistical ML calculations and data metrics into professional reports.',
      'Draft detailed justifications explaining why certain employees require urgent intervention.',
      'Compile cost-benefit analyses comparing the cost of retention plans to the cost of replacing the employee.',
      'Push alerts directly to internal HR communication channels (email, Teams/Slack) upon confirmation.'
    ],
    consoleLogs: [
      'System started: Report writer online.',
      'Collecting analysis data from other agents...',
      'Report generated: Retention brief for Sarah Jenkins (Engineering).',
      'Report generated: Retention brief for Michael Chen (Sales).',
      'Alerts sent to Dashboard. Awaiting manual review.'
    ]
  }
];

export function AgentShowcase() {
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo>(agentsData[0]);

  return (
    <section id="agents" className="py-16 sm:py-24 border-b border-border-primary/60 bg-secondary-bg/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <div className="inline-flex items-center space-x-2 border border-blue-500/20 bg-blue-500/5 px-2.5 py-1 rounded text-xs font-mono tracking-wider text-accent-blue uppercase mb-3 sm:mb-4">
            <Workflow className="w-3.5 h-3.5" />
            <span>AI Agent Network</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-3 sm:mb-4">
            Multi-Agent Architecture
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            AttriSense AI breaks down employee retention into five highly specialized, interconnected AI agents. Explore each agent's active responsibilities, system configurations, and simulated runtime console.
          </p>
        </div>

        {/* 12-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* Left Column (4 Cols): Agent Selector Buttons */}
          <div className="lg:col-span-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5 sm:space-y-3">
              <span className="block font-mono text-[9px] uppercase text-slate-500 tracking-wider mb-2">
                Available AI Agents (5)
              </span>
              {agentsData.map((agent) => {
                const IconComponent = agent.icon;
                const isSelected = selectedAgent.id === agent.id;
                
                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`w-full text-left p-4 rounded flex items-center justify-between border transition-all duration-200 ${
                      isSelected 
                        ? 'bg-secondary-bg/50 border-accent-blue text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                        : 'bg-primary-bg border-border-primary/60 text-slate-400 hover:text-white hover:border-accent-blue/55'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className={`p-2 rounded border transition-colors duration-200 ${
                        isSelected ? 'bg-blue-500/10 border-blue-500/30 text-accent-blue' : 'bg-secondary-bg/80 border-border-primary/60 text-slate-500'
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm leading-none mb-1">{agent.name}</h4>
                        <span className="font-mono text-[9px] text-slate-500 tracking-wider">
                          {agent.shortName}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 transition-transform duration-200 ${
                      isSelected ? 'transform translate-x-1 text-accent-blue' : 'text-slate-600'
                    }`} />
                  </button>
                );
              })}
            </div>
            
            {/* Visual Agent Workflow Connection Line (Informational) */}
            <div className="border border-border-primary/60 bg-primary-bg p-4 rounded mt-4 lg:mt-0 font-mono text-[10px] text-slate-500">
              <span className="block text-accent-blue uppercase font-bold mb-1">Process Flow</span>
              <p className="leading-relaxed">
                Collector <span className="text-white">&rarr;</span> Predictor <span className="text-white">&rarr;</span> Reason Finder <span className="text-white">&rarr;</span> Recommender <span className="text-white">&rarr;</span> Report Writer
              </p>
            </div>
          </div>

          {/* Right Column (8 Cols): Selected Agent Deep Dive */}
          <div className="lg:col-span-8 bg-secondary-bg/50 border border-border-primary/60 rounded p-6 flex flex-col justify-between">
            
            {/* Header info */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 mb-6 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded bg-blue-500/10 border border-blue-500/30 text-accent-blue">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white leading-none mb-1">
                      {selectedAgent.name}
                    </h3>
                    <p className="font-mono text-[10px] text-slate-400 tracking-wider">
                      Status: <span className="text-[#22C55E]">Running</span>
                    </p>
                  </div>
                </div>
                
                {/* Status dot */}
                <div className="flex items-center space-x-2 bg-primary-bg border border-border-primary/60 px-3.5 py-1.5 rounded font-mono text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-ping"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] absolute"></span>
                  <span className="text-slate-400">Status:</span>
                  <span className="text-[#22C55E] font-bold">Stable</span>
                </div>
              </div>

              {/* Agent Overview Statement */}
              <div className="mb-6">
                <span className="block font-mono text-[9px] uppercase text-slate-500 tracking-wider mb-2">
                  Agent Role Description
                </span>
                <p className="text-slate-300 text-sm leading-relaxed font-sans">
                  {selectedAgent.role}
                </p>
              </div>

              {/* Grid: Responsibilities & Telemetry */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
                
                {/* Key Responsibilities */}
                <div className="md:col-span-7 space-y-3">
                  <span className="block font-mono text-[9px] uppercase text-slate-500 tracking-wider">
                    Responsibilities
                  </span>
                  <ul className="space-y-2 text-xs text-slate-300 font-sans">
                    {selectedAgent.responsibilities.map((resp, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-accent-blue font-mono mr-2.5 mt-0.5">&bull;</span>
                        <span className="leading-relaxed">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Telemetry settings */}
                <div className="md:col-span-5 space-y-3 border-t md:border-t-0 md:border-l border-border-primary/60 pt-4 md:pt-0 md:pl-6">
                  <span className="block font-mono text-[9px] uppercase text-slate-500 tracking-wider">
                    Agent Configuration
                  </span>
                  <div className="space-y-2.5 font-mono text-xs">
                    {selectedAgent.telemetry.map((tel, index) => (
                      <div key={index} className="flex justify-between border-b border-border-primary/60/40 pb-1.5">
                        <span className="text-slate-500 text-[10px]">{tel.label}</span>
                        <span className="text-white text-[10px] font-semibold text-right max-w-[150px] truncate">
                          {tel.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Console output simulation */}
            <div className="border border-border-primary/60 bg-primary-bg rounded p-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <div className="flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                    Agent Console Feed
                  </span>
                </div>
                <span className="font-mono text-[8px] text-slate-500">Live Feed</span>
              </div>

              <div className="font-mono text-[10px] text-emerald-400 space-y-1.5 max-h-[110px] overflow-y-auto">
                {selectedAgent.consoleLogs.map((log, index) => (
                  <p key={index} className="leading-relaxed">
                    <span className="text-slate-600">&gt;</span> {log}
                  </p>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
