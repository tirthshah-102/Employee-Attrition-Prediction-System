import type { Employee } from '../../../context/SystemContext';

export default function RightTacticalRail({ employee }: { employee: Employee | null }) {
    const primaryFactor = employee?.primaryFactor || 'Stagnant Career Growth';
    
    let desc = "Present in 82% of all 'High Risk' profiles analyzed in the last 30 days. Action required at organizational policy level.";
    if (employee) {
        if (employee.primaryFactor === 'Workload & Overtime') {
            desc = "Workload and excess overtime hours exceed standard benchmarks, creating high burnout correlation.";
        } else if (employee.primaryFactor === 'Compensation Gap') {
            desc = "Current salary rate is below regional market median benchmarks. Compensation calibration is advised.";
        } else if (employee.primaryFactor === 'Role Stagnation') {
            desc = "Growth metrics show low progression, accelerating voluntary departure behaviors.";
        } else if (employee.primaryFactor === 'Feedback Loop Issues') {
            desc = "Low manager communication score identified, increasing structural disconnect risks.";
        } else if (employee.primaryFactor === 'Onboarding Friction') {
            desc = "Early tenure friction detected. Onboarding acceleration playbooks are recommended.";
        }
    }

    return (
        <aside className="w-full xl:w-80 xl:border-l border-outline-variant p-4 space-y-4 bg-surface-container-lowest/50 backdrop-blur-sm rounded-xl">
            <div className="glass-panel rounded p-stack-md space-y-3">
                <h4 className="font-mono-label text-[10px] text-on-surface-variant uppercase border-b border-outline-variant pb-2">Prediction Snapshot</h4>
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-xs text-on-surface-variant">Last Run ID</span>
                        <span className="font-mono-metric text-sm text-primary">{employee ? `PX-${employee.id.replace('EMP-', '')}` : 'PX-8822'}</span>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-xs text-on-surface-variant">Model Version</span>
                        <span className="font-mono-metric text-sm">v4.2.RC-1</span>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-xs text-on-surface-variant">Data Drift</span>
                        <span className="font-mono-metric text-sm text-secondary">0.02%</span>
                    </div>
                </div>
            </div>
            
            <div className="glass-panel rounded p-stack-md space-y-3 border-l-2 border-error">
                <h4 className="font-mono-label text-[10px] text-error uppercase border-b border-outline-variant pb-2">Top Attrition Driver</h4>
                <div className="py-2">
                    <div className="text-sm font-bold text-on-surface mb-1 uppercase">{primaryFactor}</div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                        {desc}
                    </p>
                </div>
            </div>
            
            <div className="glass-panel rounded p-stack-md space-y-3">
                <h4 className="font-mono-label text-[10px] text-on-surface-variant uppercase border-b border-outline-variant pb-2">System Status</h4>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                        <span className="text-[11px] font-mono-label">API_LATENCY: 42ms</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                        <span className="text-[11px] font-mono-label">MODEL_LOAD: 12%</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                        <span className="text-[11px] font-mono-label">RELIABILITY: 99.9%</span>
                    </div>
                </div>
            </div>
            
            <div className="rounded-xl p-stack-md border border-outline-variant relative bg-primary-bg/40 backdrop-blur-sm space-y-4">
                <span className="font-mono-label text-[9px] text-primary uppercase block border-b border-outline-variant pb-2">Telemetry Visualization</span>
                
                {/* Simulated behavioral vector space chart */}
                <div className="h-40 relative flex items-center justify-center overflow-hidden bg-black/30 rounded-lg border border-white/5">
                    {/* Concentric rings */}
                    <div className="absolute w-32 h-32 rounded-full border border-white/5 animate-[spin-slow_20s_linear_infinite]" />
                    <div className="absolute w-24 h-24 rounded-full border border-white/10 animate-[spin-slow_15s_linear_infinite_reverse]" />
                    <div className="absolute w-16 h-16 rounded-full border border-white/10" />
                    
                    {/* Axis crosshair lines */}
                    <div className="absolute h-full w-[1px] bg-white/5" />
                    <div className="absolute w-full h-[1px] bg-white/5" />

                    {/* Vector Plot Dots */}
                    {employee ? (
                        <>
                            {/* Target employee node */}
                            <div 
                                className="absolute w-4 h-4 rounded-full flex items-center justify-center transition-all duration-700 ease-out"
                                style={{
                                    left: `${Math.min(Math.max(50 + (employee.salaryGap || 0) * 1.5, 10), 90)}%`,
                                    top: `${Math.min(Math.max(50 - (employee.overtimeHrs || 0) * 2 + 10, 10), 90)}%`,
                                    background: employee.probability >= 65 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(88, 101, 242, 0.2)',
                                    border: employee.probability >= 65 ? '2px solid #ef4444' : '2px solid #5865f2',
                                    boxShadow: employee.probability >= 65 ? '0 0 12px #ef4444' : '0 0 12px #5865f2'
                                }}
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            </div>
                            
                            {/* Neighbor nodes representing cluster centroids */}
                            <div className="absolute w-2 h-2 rounded-full bg-slate-600 top-1/4 left-1/3 opacity-40" />
                            <div className="absolute w-2 h-2 rounded-full bg-slate-600 top-3/4 left-2/3 opacity-30" />
                            <div className="absolute w-2 h-2 rounded-full bg-slate-600 top-1/3 left-3/4 opacity-40" />
                            <div className="absolute w-2.5 h-2.5 rounded-full bg-error/30 top-1/4 left-2/3 border border-error/50 opacity-50" />
                        </>
                    ) : (
                        <div className="text-[10px] text-slate-500 font-mono">NO TELEMETRY DATA</div>
                    )}
                </div>
                
                <p className="text-[10px] leading-tight text-on-surface-variant/80 font-mono">
                    Vector coordinates dynamically mapped based on current simulation variables (Salary Gap & Overtime workload).
                </p>
            </div>
        </aside>
    );
}
