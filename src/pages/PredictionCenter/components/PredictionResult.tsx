import { ExternalLink } from 'lucide-react';
import type { Employee } from '../../../context/SystemContext';

export default function PredictionResult({ employee }: { employee: Employee }) {
    const prob = employee.probability;
    const isHigh = prob >= 65;
    const isMedium = prob >= 35 && prob < 65;

    let theme = {
        color: '#ffb4ab',
        bg: 'linear-gradient(145deg, rgba(147,0,10,0.12) 0%, rgba(18,20,28,0.98) 60%)',
        border: '1px solid rgba(255,180,171,0.3)',
        glow: 'rgba(255,180,171,0.08)',
        gaugeBorder: '#ffb4ab',
        text: 'Employee shows significant divergence in historical engagement patterns. High probability of departure within 60 days.',
        label: 'STATUS // CRITICAL RISK DETECTED',
        statusText: 'HIGH'
    };

    if (isMedium) {
        theme = {
            color: '#F59E0B',
            bg: 'linear-gradient(145deg, rgba(120,70,0,0.12) 0%, rgba(18,20,28,0.98) 60%)',
            border: '1px solid rgba(245,158,11,0.3)',
            glow: 'rgba(245,158,11,0.08)',
            gaugeBorder: '#F59E0B',
            text: 'Employee shows moderate risk indicators. Attention and periodic review recommended.',
            label: 'STATUS // MODERATE RISK DETECTED',
            statusText: 'MEDIUM'
        };
    } else if (!isHigh && !isMedium) {
        theme = {
            color: '#10B981',
            bg: 'linear-gradient(145deg, rgba(0,100,50,0.12) 0%, rgba(18,20,28,0.98) 60%)',
            border: '1px solid rgba(16,185,129,0.3)',
            glow: 'rgba(16,185,129,0.08)',
            gaugeBorder: '#10B981',
            text: 'Employee demonstrates stable indicators with low risk of attrition.',
            label: 'STATUS // LOW RISK PROFILE',
            statusText: 'LOW'
        };
    }

    const aiSummary = employee.primaryFactor === 'Workload & Overtime'
        ? `Workload analysis shows excess overtime (${employee.overtimeHrs} hrs/week). Burnout triggers are actively manifesting.`
        : employee.primaryFactor === 'Compensation Gap'
        ? `Compensation gap identified (${employee.salaryGap}% vs market benchmark). Compensation calibration is recommended to prevent churn.`
        : employee.primaryFactor === 'Role Stagnation'
        ? `Role progression shows stagnation. High risk of voluntary exit due to low career growth index (${employee.growthIndex}/10).`
        : `Primary risk factor: ${employee.primaryFactor}. Action plan should focus on resolving these indicators.`;

    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Main Result Card */}
            <div className="md:col-span-2 relative rounded-2xl overflow-hidden flex gap-8 items-center p-7"
                style={{
                    background: theme.bg,
                    border: theme.border,
                    boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 60px ${theme.glow}`,
                }}
            >
                {/* Glow orb */}
                <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`, filter: 'blur(30px)' }} />
                
                {/* Pulsing edge accent */}
                <div className="absolute top-0 left-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ background: `linear-gradient(180deg, ${theme.color} 0%, rgba(255,180,171,0.3) 50%, transparent 100%)` }} />

                <div className="relative z-10 space-y-4 flex-1">
                    <div>
                        <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: theme.color }}>
                            {theme.label}
                        </h4>
                        <p className="text-on-surface text-sm leading-relaxed opacity-90 italic max-w-md">
                            "{theme.text}"
                        </p>
                    </div>
                    <div className="flex gap-8">
                        <div className="text-center">
                            <div className="text-4xl font-bold font-mono" style={{ color: theme.color, textShadow: `0 0 20px ${theme.glow}` }}>{prob}%</div>
                            <div className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider mt-1">DEPARTURE PROB.</div>
                        </div>
                        <div className="text-center border-l pl-8" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                            <div className="text-4xl font-bold font-mono text-on-surface" style={{ textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
                                {Math.round(92 + (employee.rating % 0.8) * 10)}%
                            </div>
                            <div className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider mt-1">CONFIDENCE LVL</div>
                        </div>
                    </div>
                </div>

                {/* Gauge */}
                <div className="hidden md:flex items-center justify-center relative flex-shrink-0">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="56"
                                cy="56"
                                r="40"
                                stroke="rgba(255,255,255,0.06)"
                                strokeWidth="6"
                                fill="transparent"
                            />
                            <circle
                                cx="56"
                                cy="56"
                                r="40"
                                stroke={theme.gaugeBorder}
                                strokeWidth="6"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 40}
                                strokeDashoffset={(2 * Math.PI * 40) - (prob / 100) * (2 * Math.PI * 40)}
                                className="transition-all duration-1000 ease-out"
                                style={{ filter: `drop-shadow(0 0 4px ${theme.color})` }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-mono font-bold text-sm" style={{ color: theme.color }}>{theme.statusText}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Summary Card */}
            <div className="rounded-2xl p-6 flex flex-col justify-between"
                style={{
                    background: 'linear-gradient(145deg, rgba(22,25,36,0.95) 0%, rgba(16,18,25,0.98) 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
            >
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--theme-bg-opacity-10)', border: '1px solid var(--theme-border-opacity-20)' }}>
                            <span className="text-primary text-xs">✦</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: 'var(--theme-color-blue)', opacity: 0.8 }}>AI SUMMARY</span>
                    </div>
                    <p className="text-sm leading-relaxed text-on-surface-variant/80">
                        {aiSummary}
                    </p>
                </div>
                <button className="flex items-center gap-2 mt-4 text-[11px] font-mono font-bold hover:opacity-80 transition-opacity p-0 border-none bg-transparent cursor-pointer" style={{ color: 'var(--theme-color-blue)' }}>
                    GENERATE FULL REPORT <ExternalLink size={11} />
                </button>
            </div>
        </section>
    );
}
