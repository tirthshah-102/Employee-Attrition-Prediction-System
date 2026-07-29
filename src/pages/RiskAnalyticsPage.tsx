import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ChevronDown, 
  ArrowLeft, 
  Loader2 
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import type { Employee } from '../context/SystemContext';
import api from '../utils/api';

export function RiskAnalyticsPage() {
  const navigate = useNavigate();
  const { 
    employees 
  } = useSystem();

  const getRecommendationText = (factor: string, name: string) => {
    switch (factor) {
      case 'Workload & Overtime':
        return `Reduce weekly overtime. Reallocate task distribution and schedule a mandatory 1-on-1 check-in with ${name} to balance project workload.`;
      case 'Role Stagnation':
        return `Schedule a career pathing alignment meeting. Establish clear milestones for promotion and assign a senior mentor to help ${name} upskill.`;
      case 'Feedback Loop Issues':
        return `Improve manager feedback cycles. Implement anonymous feedback channels and conduct weekly performance alignment sessions with ${name}.`;
      case 'Compensation Gap':
        return `Conduct an urgent salary calibration review. Align ${name}'s salary with regional market benchmarks and evaluate a retention bonus.`;
      case 'Onboarding Friction':
        return `Enhance onboarding support. Assign a peer buddy and schedule structured check-ins at 30, 60, and 90 days to ease ${name}'s transition.`;
      default:
        return `Schedule a structured check-in with ${name} to discuss retention strategies and custom career adjustments.`;
    }
  };

  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [riskSummary, setRiskSummary] = useState<any>(null);
  const [recommendationText, setRecommendationText] = useState<string>('');
  const [loadingRecommendation, setLoadingRecommendation] = useState<boolean>(false);

  useEffect(() => {
    api.get('/analytics/risk-summary')
      .then(res => {
        if (res.data.success) {
          setRiskSummary(res.data.data.distribution);
        }
      })
      .catch(err => {
        console.error('Failed to fetch risk summary:', err);
      });
  }, [employees]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [deptFilter, setDeptFilter] = useState('All');

  // Filter logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
    const matchesDept = deptFilter === 'All' || emp.dept === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  // Sort: High risk first
  const sortedEmployees = [...filteredEmployees].sort((a, b) => b.probability - a.probability);

  // Find updated employee if selectedEmp is active (to capture playbook changes)
  const currentSelectedEmp = selectedEmp ? employees.find(e => e.id === selectedEmp.id) || selectedEmp : null;

  const handleGenerateRecommendation = () => {
    if (!currentSelectedEmp) return;
    setLoadingRecommendation(true);
    setRecommendationText('');
    api.get(`/analytics/recommendation/${currentSelectedEmp.id}`)
      .then(res => {
        if (res.data.success) {
          setRecommendationText(res.data.data.recommendation);
        } else {
          setRecommendationText(getRecommendationText(currentSelectedEmp.primaryFactor, currentSelectedEmp.name));
        }
      })
      .catch(() => {
        setRecommendationText(getRecommendationText(currentSelectedEmp.primaryFactor, currentSelectedEmp.name));
      })
      .finally(() => {
        setLoadingRecommendation(false);
      });
  };

  useEffect(() => {
    setRecommendationText('');
    setLoadingRecommendation(false);
  }, [currentSelectedEmp?.id]);

  return (
    <div className="space-y-6">
      
      {/* Risk table browse roster */}
      <div className="bg-secondary-bg/50 border border-border-primary/60 rounded p-6 space-y-6">
        
        {/* Risk Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-secondary-bg/80 border border-[#EF4444]/20 p-4 rounded flex justify-between items-center">
            <div>
              <span className="block font-mono text-[9px] text-[#EF4444] uppercase tracking-wider font-semibold">High Risk Cohort</span>
              <span className="font-mono text-lg font-bold text-white mt-1 block">
                {(riskSummary?.High?.count ?? employees.filter(e => e.status === 'High').length).toString().padStart(2, '0')} Employees
              </span>
            </div>
            <div className="text-right">
              <span className="block font-mono text-[8px] text-slate-500 uppercase">Avg Risk</span>
              <span className="font-mono text-xs font-bold text-[#EF4444]">
                {riskSummary?.High?.avgProbability ?? '84.4'}%
              </span>
            </div>
          </div>
          
          <div className="bg-secondary-bg/80 border border-[#F59E0B]/20 p-4 rounded flex justify-between items-center">
            <div>
              <span className="block font-mono text-[9px] text-[#F59E0B] uppercase tracking-wider font-semibold">Medium Risk Cohort</span>
              <span className="font-mono text-lg font-bold text-white mt-1 block">
                {(riskSummary?.Medium?.count ?? employees.filter(e => e.status === 'Medium').length).toString().padStart(2, '0')} Employees
              </span>
            </div>
            <div className="text-right">
              <span className="block font-mono text-[8px] text-slate-500 uppercase">Avg Risk</span>
              <span className="font-mono text-xs font-bold text-[#F59E0B]">
                {riskSummary?.Medium?.avgProbability ?? '48.9'}%
              </span>
            </div>
          </div>
          
          <div className="bg-secondary-bg/80 border border-[#22C55E]/20 p-4 rounded flex justify-between items-center">
            <div>
              <span className="block font-mono text-[9px] text-[#22C55E] uppercase tracking-wider font-semibold">Low Risk Cohort</span>
              <span className="font-mono text-lg font-bold text-white mt-1 block">
                {(riskSummary?.Low?.count ?? employees.filter(e => e.status === 'Low').length).toString().padStart(2, '0')} Employees
              </span>
            </div>
            <div className="text-right">
              <span className="block font-mono text-[8px] text-slate-500 uppercase">Avg Risk</span>
              <span className="font-mono text-xs font-bold text-[#22C55E]">
                {riskSummary?.Low?.avgProbability ?? '18.2'}%
              </span>
            </div>
          </div>
        </div>

        {/* Directory Controls */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center pt-2 font-mono text-xs">
          
          {/* Global search */}
          <div className="relative w-full md:w-80">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, role, or ID..."
              className="w-full bg-primary-bg/85 border border-border-primary/60 pl-9 pr-4 py-2.5 rounded outline-none focus:border-accent-blue/50 text-slate-300 placeholder-slate-600 transition-colors"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="appearance-none bg-primary-bg/85 border border-border-primary/60 pl-3 pr-8 py-2.5 rounded outline-none text-slate-300 focus:border-accent-blue/50 cursor-pointer"
              >
                <option value="All">All Risks</option>
                <option value="High">High Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="Low">Low Risk</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Department Filter */}
            <div className="relative">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="appearance-none bg-primary-bg/85 border border-border-primary/60 pl-3 pr-8 py-2.5 rounded outline-none text-slate-300 focus:border-accent-blue/50 cursor-pointer"
              >
                <option value="All">All Departments</option>
                {Array.from(new Set(employees.map(e => e.dept))).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Desktop Data Grid */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 font-mono text-[9px] uppercase tracking-wider text-slate-500">
                <th className="py-3 pl-2">Employee ID</th>
                <th className="py-3">Name</th>
                <th className="py-3">Role</th>
                <th className="py-3">Department</th>
                <th className="py-3 text-center">Probability</th>
                <th className="py-3 text-center">Primary Driver</th>
                <th className="py-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedEmployees.map((emp) => (
                <tr key={emp.id} className="border-b border-white/5 hover:bg-slate-900/30 font-mono text-xs">
                  <td className="py-4 pl-2 font-semibold text-accent-blue">{emp.id}</td>
                  <td className="py-4 text-slate-200 font-sans">{emp.name}</td>
                  <td className="py-4 text-slate-400 font-sans">{emp.role}</td>
                  <td className="py-4 text-slate-400 font-sans">{emp.dept}</td>
                  <td className="py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded font-bold ${
                      emp.status === 'High' ? 'bg-[#EF4444]/15 text-[#EF4444]' : 
                      emp.status === 'Medium' ? 'bg-[#F59E0B]/15 text-[#F59E0B]' :
                      'bg-[#22C55E]/15 text-[#22C55E]'
                    }`}>
                      {emp.probability}%
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <span className="border border-border-primary/60 bg-secondary-bg/80 px-2.5 py-1 rounded text-slate-300 text-[10px]">
                      {emp.primaryFactor}
                    </span>
                  </td>
                  <td className="py-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedEmp(emp)}
                      className="text-accent-blue hover:text-blue-400 border border-border-primary/60 bg-secondary-bg/80 px-2.5 py-1.5 rounded text-[10px] uppercase font-semibold transition-all duration-150 cursor-pointer"
                    >
                      Recommendation
                    </button>
                    <button
                      onClick={() => navigate(`/employee/${emp.id}`)}
                      className="text-slate-400 hover:text-white border border-border-primary/60 bg-secondary-bg/80 px-2.5 py-1.5 rounded text-[10px] uppercase font-semibold transition-all duration-150 cursor-pointer"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
              {sortedEmployees.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No employees found matching criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card stack */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {sortedEmployees.map((emp) => (
            <div key={emp.id} className="bg-secondary-bg/80 border border-border-primary/60 p-4 rounded space-y-4 font-mono text-xs">
              <div className="flex justify-between items-start border-b border-white/5 pb-2">
                <div>
                  <span className="text-accent-blue font-semibold">{emp.id}</span>
                  <span className="block font-sans text-sm text-white font-medium mt-0.5">{emp.name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  emp.status === 'High' ? 'bg-[#EF4444]/15 text-[#EF4444]' : 
                  emp.status === 'Medium' ? 'bg-[#F59E0B]/15 text-[#F59E0B]' :
                  'bg-[#22C55E]/15 text-[#22C55E]'
                }`}>
                  {emp.probability}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-400 text-[10px]">
                <div>
                  <span className="block text-slate-500 uppercase">Department</span>
                  <span className="text-slate-300">{emp.dept}</span>
                </div>
                <div>
                  <span className="block text-slate-500 uppercase">Risk Factor</span>
                  <span className="text-amber-400 font-semibold">{emp.primaryFactor}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex gap-2 justify-end">
                <button
                  onClick={() => setSelectedEmp(emp)}
                  className="bg-secondary-bg/50 text-accent-blue border border-border-primary/60 px-3 py-2 rounded text-[10px] uppercase font-semibold cursor-pointer"
                >
                  Recommendation
                </button>
                <button
                  onClick={() => navigate(`/employee/${emp.id}`)}
                  className="bg-secondary-bg/50 text-slate-300 border border-border-primary/60 px-3 py-2 rounded text-[10px] uppercase font-semibold cursor-pointer"
                >
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Recommendation Popup Modal */}
      {currentSelectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-secondary-bg border border-border-primary/60 rounded-2xl p-6 space-y-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            
            {/* Diagnostic Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center space-x-3.5">
                <button 
                  onClick={() => setSelectedEmp(null)}
                  className="p-1.5 rounded border border-border-primary/60 bg-secondary-bg/80 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors duration-150 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-lg text-white">{currentSelectedEmp.name}</h3>
                    <span className="font-mono text-[9px] text-accent-blue border border-accent-blue/20 bg-accent-blue/5 px-2.5 py-0.5 rounded">
                      {currentSelectedEmp.id}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 tracking-wider">
                    Role: <span className="text-white">{currentSelectedEmp.role} / {currentSelectedEmp.dept}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 font-mono text-xs">
                <span>Risk Score:</span>
                <span className={`px-2.5 py-1 rounded font-bold ${
                  currentSelectedEmp.status === 'High' ? 'bg-[#EF4444]/15 text-[#EF4444]' : 
                  currentSelectedEmp.status === 'Medium' ? 'bg-[#F59E0B]/15 text-[#F59E0B]' :
                  'bg-[#22C55E]/15 text-[#22C55E]'
                }`}>
                  {currentSelectedEmp.probability}%
                </span>
              </div>
            </div>

            {/* Core Diagnostic Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Diagnostic Analytics Radar/SHAP Chart (7 Cols) */}
              <div className="lg:col-span-7 bg-secondary-bg/80 border border-border-primary/60 p-6 rounded space-y-6">
                <span className="block font-mono text-[10px] uppercase text-slate-400 tracking-wider border-b border-white/5 pb-3">
                  Attrition Risk Drivers (AI Analysis)
                </span>
                
                {/* Detailed metric values bars */}
                <div className="space-y-4 font-mono text-xs">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Overtime Workload:</span>
                      <span className="text-[#EF4444] font-semibold">{currentSelectedEmp.overtimeHrs} hrs/week overtime</span>
                    </div>
                    <div className="w-full bg-primary-bg h-2.5 rounded overflow-hidden">
                      <div className="bg-[#EF4444] h-full rounded" style={{ width: `${Math.min((currentSelectedEmp.overtimeHrs / 20) * 100, 100)}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Compensation Discrepancy:</span>
                      <span className={`font-semibold ${currentSelectedEmp.salaryGap < -10 ? 'text-[#EF4444]' : 'text-slate-300'}`}>
                        {currentSelectedEmp.salaryGap}% difference from regional market
                      </span>
                    </div>
                    <div className="w-full bg-primary-bg h-2.5 rounded overflow-hidden">
                      <div className={`h-full rounded ${currentSelectedEmp.salaryGap < 0 ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'}`} style={{ width: `${Math.max(Math.min((Math.abs(currentSelectedEmp.salaryGap) / 25) * 100, 100), 5)}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Manager Feedback Score:</span>
                      <span className="text-[#06B6D4] font-semibold">{currentSelectedEmp.managerFeedback}/10 index score</span>
                    </div>
                    <div className="w-full bg-primary-bg h-2.5 rounded overflow-hidden">
                      <div className="bg-[#06B6D4] h-full rounded" style={{ width: `${currentSelectedEmp.managerFeedback * 10}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Career Path & Growth Index:</span>
                      <span className={`font-semibold ${currentSelectedEmp.growthIndex < 4 ? 'text-[#EF4444]' : 'text-slate-300'}`}>{currentSelectedEmp.growthIndex}/10 score</span>
                    </div>
                    <div className="w-full bg-primary-bg h-2.5 rounded overflow-hidden">
                      <div className="bg-accent-blue h-full rounded" style={{ width: `${currentSelectedEmp.growthIndex * 10}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommender Actions Console (5 Cols) */}
              <div className="lg:col-span-5 bg-secondary-bg/80 border border-border-primary/60 p-6 rounded flex flex-col justify-between">
                <div className="space-y-4 flex-1">
                  <span className="block font-mono text-[10px] uppercase text-slate-400 tracking-wider border-b border-white/5 pb-3">
                    Recommendation
                  </span>
                  
                  <div className="font-mono text-xs bg-primary-bg p-4 rounded border border-border-primary/60 space-y-3">
                    <div>
                      <span className="block text-slate-500 text-[9px] uppercase">Primary Risk Driver</span>
                      <p className="text-amber-400 font-bold mt-0.5">{currentSelectedEmp.primaryFactor}</p>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-[9px] uppercase">Suggested Action Plan</span>
                      <p className="text-slate-300 leading-relaxed mt-1">
                        {loadingRecommendation ? (
                          <span className="flex items-center gap-2 text-slate-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-blue" />
                            Generating AI recommendation...
                          </span>
                        ) : recommendationText ? (
                          recommendationText
                        ) : (
                          <button
                            type="button"
                            onClick={handleGenerateRecommendation}
                            className="mt-1 w-full py-2 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue border border-accent-blue/20 hover:border-accent-blue/40 rounded text-[10px] font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer"
                          >
                            Generate AI Recommendation
                          </button>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Triggers */}
                <div className="pt-6 border-t border-white/5 flex gap-4 mt-6">
                  <button
                    onClick={() => setSelectedEmp(null)}
                    className="w-full py-3.5 bg-secondary-bg/50 hover:bg-slate-900 border border-border-primary/60 hover:border-slate-500 rounded text-slate-300 font-mono text-xs uppercase tracking-wider cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
