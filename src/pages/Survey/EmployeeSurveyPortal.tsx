import React, { useState, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { ClipboardList, Sparkles, Smile, CheckCircle, Flame } from 'lucide-react';

export const EmployeeSurveyPortal: React.FC = () => {
  const { user, submitPulseSurvey, employees } = useSystem();
  
  const [workload, setWorkload] = useState(7);
  const [growth, setGrowth] = useState(7);
  const [comp, setComp] = useState(7);
  const [manager, setManager] = useState(7);
  const [wlb, setWlb] = useState(7);
  const [comments, setComments] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myRecord, setMyRecord] = useState<any | null>(null);

  // Find this employee's active record from list
  useEffect(() => {
    if (employees.length > 0 && user) {
      const match = employees.find(
        (e: any) =>
          e.email?.toLowerCase() === user.email?.toLowerCase() ||
          e.name?.toLowerCase().includes(user.name?.split(' ')[0].toLowerCase())
      );
      if (match) {
        setMyRecord(match);
      }
    }
  }, [employees, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const success = await submitPulseSurvey({
      workloadSatisfaction: workload,
      growthSatisfaction: growth,
      compSatisfaction: comp,
      managerScore: manager,
      workLifeBalance: wlb,
      comments: comments,
    });
    setSubmitting(false);
    if (success) {
      setSubmitted(true);
      setComments('');
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header card with gradient border */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/20 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/30 text-blue-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Pulse Portal</h1>
            <p className="text-xs text-slate-400">Welcome, {user?.name || 'Employee'}. Review your flight risk metrics, submit feedback, and view your custom mitigation strategy.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Side: Survey Form */}
        <div className="md:col-span-7 bg-secondary-bg border border-border-primary rounded-xl p-6 shadow-lg space-y-6">
          <div className="flex items-center space-x-2 border-b border-border-primary pb-3">
            <ClipboardList className="w-4 h-4 text-accent-blue" />
            <h2 className="text-sm font-bold text-slate-200 tracking-wider uppercase font-mono">Monthly Feedback Pulse</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Workload */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Workload & Overtime Satisfaction</span>
                <span className="text-accent-blue font-bold">{workload}/10</span>
              </div>
              <input 
                type="range" min="1" max="10" 
                value={workload} 
                onChange={(e) => setWorkload(Number(e.target.value))}
                className="w-full h-1 bg-elevated-bg rounded-lg appearance-none cursor-pointer accent-accent-blue"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Overworked / Stressful</span>
                <span>Balanced / Manageable</span>
              </div>
            </div>

            {/* Growth */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Career Growth & Training</span>
                <span className="text-accent-blue font-bold">{growth}/10</span>
              </div>
              <input 
                type="range" min="1" max="10" 
                value={growth} 
                onChange={(e) => setGrowth(Number(e.target.value))}
                className="w-full h-1 bg-elevated-bg rounded-lg appearance-none cursor-pointer accent-accent-blue"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Stagnant / No Path</span>
                <span>Promotional Support</span>
              </div>
            </div>

            {/* Compensation */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Compensation Satisfaction</span>
                <span className="text-accent-blue font-bold">{comp}/10</span>
              </div>
              <input 
                type="range" min="1" max="10" 
                value={comp} 
                onChange={(e) => setComp(Number(e.target.value))}
                className="w-full h-1 bg-elevated-bg rounded-lg appearance-none cursor-pointer accent-accent-blue"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Underpaid / Fair Gap</span>
                <span>Highly Satisfied</span>
              </div>
            </div>

            {/* Manager */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Relationship with Manager</span>
                <span className="text-accent-blue font-bold">{manager}/10</span>
              </div>
              <input 
                type="range" min="1" max="10" 
                value={manager} 
                onChange={(e) => setManager(Number(e.target.value))}
                className="w-full h-1 bg-elevated-bg rounded-lg appearance-none cursor-pointer accent-accent-blue"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>No alignment / Feedback Issues</span>
                <span>Excellent alignment</span>
              </div>
            </div>

            {/* WLB */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Overall Work-Life Balance</span>
                <span className="text-accent-blue font-bold">{wlb}/10</span>
              </div>
              <input 
                type="range" min="1" max="10" 
                value={wlb} 
                onChange={(e) => setWlb(Number(e.target.value))}
                className="w-full h-1 bg-elevated-bg rounded-lg appearance-none cursor-pointer accent-accent-blue"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Poor Balance / Burnout</span>
                <span>Excellent / Flexible</span>
              </div>
            </div>

            {/* Qualitative Feedback Notes */}
            <div className="space-y-2">
              <label className="block text-xs font-mono text-slate-300">Qualitative Feedback Notes (Sentiment Analysis)</label>
              <textarea 
                value={comments} 
                onChange={(e) => setComments(e.target.value)}
                placeholder="Describe your workload, relationship with manager, compensation feedback or career path..."
                className="w-full bg-secondary-bg/80 border border-border-primary rounded px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:border-accent-blue outline-none"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded font-mono text-[10px] uppercase tracking-wider bg-accent-blue text-slate-900 font-bold hover:bg-opacity-90 transition-all flex items-center justify-center space-x-2"
            >
              {submitting ? 'Submitting Responses...' : 'Submit Monthly Pulse feedback'}
            </button>

            {submitted && (
              <div className="p-3 bg-status-success/10 border border-status-success/30 rounded text-status-success text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Thank you! Your feedback has been registered and scores updated.</span>
              </div>
            )}
          </form>
        </div>

        {/* Right Side: Risk Metrics & Playbook */}
        <div className="md:col-span-5 space-y-6">
          {/* Risk Level Badge */}
          <div className="bg-secondary-bg border border-border-primary rounded-xl p-6 shadow-lg space-y-4">
            <h3 className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Attrition Risk Telemetry</h3>
            
            {myRecord ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-extrabold text-white tracking-tight">
                    {myRecord.probability.toFixed(1)}%
                  </div>
                  <span className={`text-[10px] font-mono font-bold uppercase ${
                    myRecord.status === 'High' ? 'text-status-danger' : 
                    myRecord.status === 'Medium' ? 'text-status-warning' : 'text-status-success'
                  }`}>
                    {myRecord.status} Risk Level
                  </span>
                </div>
                <div className={`p-4 rounded-full ${
                  myRecord.status === 'High' ? 'bg-status-danger/10 text-status-danger border border-status-danger/30' :
                  myRecord.status === 'Medium' ? 'bg-status-warning/10 text-status-warning border border-status-warning/30' :
                  'bg-status-success/10 text-status-success border border-status-success/30'
                }`}>
                  <Flame className="w-8 h-8 animate-bounce" />
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Loading your flight risk telemetry data...</div>
            )}
          </div>

          {/* HR Action Plan Items */}
          <div className="bg-secondary-bg border border-border-primary rounded-xl p-6 shadow-lg space-y-4">
            <h3 className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Custom Retention Action Plan</h3>
            
            {myRecord && myRecord.playbookStatus !== 'Ready' ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-status-success text-xs font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Mitigation Plan Active ({myRecord.playbookStatus})</span>
                </div>
                <p className="text-xs text-slate-400">HR has deployed custom retention strategies for you based on workplace drivers:</p>
                <ul className="space-y-2">
                  <li className="p-2 bg-elevated-bg rounded border border-border-primary text-xs text-slate-300 flex items-start space-x-2">
                    <span className="text-accent-blue font-bold">•</span>
                    <span>Task limit redistribution and balanced project timelines.</span>
                  </li>
                  <li className="p-2 bg-elevated-bg rounded border border-border-primary text-xs text-slate-300 flex items-start space-x-2">
                    <span className="text-accent-blue font-bold">•</span>
                    <span>Bi-weekly check-in meetings with team leaders.</span>
                  </li>
                  <li className="p-2 bg-elevated-bg rounded border border-border-primary text-xs text-slate-300 flex items-start space-x-2">
                    <span className="text-accent-blue font-bold">•</span>
                    <span>Skill development workshop sponsorships.</span>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="p-4 bg-elevated-bg/30 rounded border border-border-primary border-dashed text-center space-y-2">
                <Smile className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-500">No active mitigation plan required. Your metrics reflect positive workplace alignment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
