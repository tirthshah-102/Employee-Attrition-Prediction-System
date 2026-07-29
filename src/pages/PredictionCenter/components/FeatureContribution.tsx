import { motion } from 'framer-motion';
import type { Employee } from '../../../context/SystemContext';

export default function FeatureContribution({ employee }: { employee: Employee }) {
    // Dynamically derive SHAP values from employee metrics
    const growthRisk = employee.growthIndex < 5 
        ? { val: Math.round((5 - employee.growthIndex) * 7) + 8, isRisk: true }
        : { val: Math.round((employee.growthIndex - 5) * 6) + 5, isRisk: false };

    const compRisk = employee.salaryGap < 0 
        ? { val: Math.round(Math.abs(employee.salaryGap) * 1.6) + 5, isRisk: true }
        : { val: Math.round(employee.salaryGap * 1.2) + 6, isRisk: false };

    const workloadRisk = employee.overtimeHrs > 5 
        ? { val: Math.round(employee.overtimeHrs * 1.4) + 6, isRisk: true }
        : { val: Math.round((6 - employee.overtimeHrs) * 2) + 3, isRisk: false };

    const feedbackRisk = employee.managerFeedback < 6 
        ? { val: Math.round((6 - employee.managerFeedback) * 5) + 4, isRisk: true }
        : { val: Math.round((employee.managerFeedback - 6) * 4) + 6, isRisk: false };

    const shapItems = [
        { name: 'Promotion & Growth Path', ...growthRisk },
        { name: 'Compensation Alignment', ...compRisk },
        { name: 'Overtime Workload Volume', ...workloadRisk },
        { name: 'Manager Feedback Loop', ...feedbackRisk }
    ];

    return (
        <section className="glass-panel rounded-xl p-stack-lg">
            <div className="flex justify-between items-center mb-stack-lg">
                <h3 className="font-mono-label uppercase text-on-surface">Explainable AI // Feature Contribution (SHAP)</h3>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-error rounded-full"></span> <span className="text-[10px] font-mono-label">Risk Factor</span></div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-secondary rounded-full"></span> <span className="text-[10px] font-mono-label">Protective Factor</span></div>
                </div>
            </div>
            
            <div className="space-y-stack-md">
                {shapItems.map((item, idx) => (
                    <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono-label text-on-surface-variant uppercase">
                            <span>{item.name}</span>
                            <span className={item.isRisk ? "text-error" : "text-secondary"}>
                                {item.isRisk ? `+${item.val}%` : `-${item.val}%`}
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden flex">
                            <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${Math.min(item.val, 100)}%` }} 
                                transition={{ duration: 1, ease: 'easeOut', delay: idx * 0.15 }} 
                                className={`h-full ${item.isRisk ? 'bg-error' : 'bg-secondary'}`}
                            ></motion.div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
