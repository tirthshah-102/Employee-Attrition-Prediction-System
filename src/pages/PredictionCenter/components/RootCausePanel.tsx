import { TrendingUp, Banknote, Timer } from 'lucide-react';
import type { Employee } from '../../../context/SystemContext';

export default function RootCausePanel({ employee }: { employee: Employee }) {
    const isGrowthLow = employee.growthIndex < 5;
    const isCompLow = employee.salaryGap < 0;
    const isWorkloadHigh = employee.overtimeHrs > 5;

    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-stack-md">
            <div className={`glass-panel p-stack-md rounded-lg border-t-2 ${isGrowthLow ? 'border-error' : 'border-secondary'} hover:bg-surface-container-low transition-colors`}>
                <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-0.5 ${isGrowthLow ? 'bg-error/20 text-error' : 'bg-secondary/20 text-secondary'} font-mono-label text-[9px] rounded uppercase`}>
                        {isGrowthLow ? 'Critical' : 'Stable'}
                    </span>
                    <TrendingUp className="text-on-surface-variant w-4 h-4" />
                </div>
                <h5 className="font-body-md font-bold mb-1">Career Growth</h5>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    {isGrowthLow 
                        ? `Career path index is low (${employee.growthIndex}/10). Employee shows stagnation in current role development pathway.` 
                        : `Career progression is healthy (${employee.growthIndex}/10). Growth path aligns with role progression benchmarks.`}
                </p>
            </div>
            
            <div className={`glass-panel p-stack-md rounded-lg border-t-2 ${isCompLow ? 'border-error' : 'border-secondary'} hover:bg-surface-container-low transition-colors`}>
                <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-0.5 ${isCompLow ? 'bg-error/20 text-error' : 'bg-secondary/20 text-secondary'} font-mono-label text-[9px] rounded uppercase`}>
                        {isCompLow ? 'Under Market' : 'Aligned'}
                    </span>
                    <Banknote className="text-on-surface-variant w-4 h-4" />
                </div>
                <h5 className="font-body-md font-bold mb-1">Compensation</h5>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    {isCompLow 
                        ? `Current salary is ${Math.abs(employee.salaryGap)}% below regional market benchmark for ${employee.role} roles.` 
                        : `Compensation is competitive and matches market rates (+${employee.salaryGap}% vs benchmark for regional roles).`}
                </p>
            </div>
            
            <div className={`glass-panel p-stack-md rounded-lg border-t-2 ${isWorkloadHigh ? 'border-error' : 'border-secondary'} hover:bg-surface-container-low transition-colors`}>
                <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-0.5 ${isWorkloadHigh ? 'bg-error/20 text-error' : 'bg-secondary/20 text-secondary'} font-mono-label text-[9px] rounded uppercase`}>
                        {isWorkloadHigh ? 'High Overtime' : 'Nominal'}
                    </span>
                    <Timer className="text-on-surface-variant w-4 h-4" />
                </div>
                <h5 className="font-body-md font-bold mb-1">Workload</h5>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    {isWorkloadHigh 
                        ? `Extended hours detected (${employee.overtimeHrs} hrs/week overtime). Increased burnout signals identified.` 
                        : `Workload hours are stable. Normal hours maintained with low overtime tasks (${employee.overtimeHrs} hrs/week).`}
                </p>
            </div>
        </section>
    );
}
