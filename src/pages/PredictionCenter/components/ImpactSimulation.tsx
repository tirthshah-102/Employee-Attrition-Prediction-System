import { BarChart3, ChevronsRight } from 'lucide-react';
import type { Employee } from '../../../context/SystemContext';

export default function ImpactSimulation({ employee }: { employee: Employee }) {
    const baseline = employee.probability;
    const projected = Math.round(baseline * 0.6);

    return (
        <section className="glass-panel rounded-xl p-stack-lg bg-primary/5 border-primary/20">
            <div className="flex justify-between items-center mb-stack-lg">
                <div className="flex items-center gap-2">
                    <BarChart3 className="text-primary w-5 h-5" />
                    <h3 className="font-mono-label uppercase text-on-surface">Retention Impact Simulation</h3>
                </div>
                <div className="text-[10px] font-mono-label text-primary">PROJECTION BASED ON RECOMMENDED ACTIONS</div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 py-6">
                <div className="text-center space-y-2">
                    <div className="text-[10px] font-mono-label text-on-surface-variant uppercase">Baseline Risk</div>
                    <div className="text-display-lg text-error opacity-50">{baseline}%</div>
                </div>
                
                <div className="flex flex-col items-center">
                    <ChevronsRight className="text-primary w-10 h-10 animate-pulse" />
                    <span className="text-[10px] font-mono-label text-primary uppercase mt-2">Intervention</span>
                </div>
                
                <div className="text-center space-y-2">
                    <div className="text-[10px] font-mono-label text-secondary uppercase">Projected Risk</div>
                    <div className="text-display-lg text-secondary drop-shadow-[0_0_15px_rgba(76,215,246,0.3)]">{projected}%</div>
                </div>
            </div>
        </section>
    );
}
