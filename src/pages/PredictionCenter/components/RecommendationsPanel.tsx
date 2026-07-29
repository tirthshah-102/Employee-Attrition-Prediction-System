import { LineChart, DollarSign, Calendar, Eye } from 'lucide-react';
import type { Employee } from '../../../context/SystemContext';

export default function RecommendationsPanel({ employee }: { employee: Employee }) {
    let recs = [
        {
            title: "1-on-1 Feedback Session",
            priority: "P0",
            impact: "HIGH",
            timeline: "3 DAYS",
            owner: "MANAGER",
            description: "Schedule recurring 1-on-1 feedback reviews to establish proper check-in cadences.",
            icon: <Calendar className="w-6 h-6" />,
            bgIcon: "bg-primary/10 text-primary"
        },
        {
            title: "HR Pulse Alignment",
            priority: "P1",
            impact: "MEDIUM",
            timeline: "7 DAYS",
            owner: "HR BP",
            description: "Initiate proactive pulse matching sessions to diagnose early attrition drivers.",
            icon: <Eye className="w-6 h-6" />,
            bgIcon: "bg-tertiary/10 text-tertiary"
        }
    ];

    if (employee.primaryFactor === 'Workload & Overtime') {
        recs = [
            {
                title: "Workload Calibration",
                priority: "P0",
                impact: "VERY HIGH",
                timeline: "2 DAYS",
                owner: "MANAGER",
                description: `Cap weekly overtime to ≤ 5 hrs for employee and notify line manager to redistribute task load.`,
                icon: <LineChart className="w-6 h-6" />,
                bgIcon: "bg-primary/10 text-primary"
            },
            {
                title: "Flexible Work Schedule",
                priority: "P1",
                impact: "HIGH",
                timeline: "5 DAYS",
                owner: "HR BP",
                description: "Introduce flexible work hours or work-from-home options to reduce burnout indicators.",
                icon: <Calendar className="w-6 h-6" />,
                bgIcon: "bg-tertiary/10 text-tertiary"
            }
        ];
    } else if (employee.primaryFactor === 'Compensation Gap') {
        recs = [
            {
                title: "Salary Benchmarking",
                priority: "P0",
                impact: "VERY HIGH",
                timeline: "7 DAYS",
                owner: "DEPT HEAD",
                description: `Run market salary benchmarking for employee's role and level. Present revised offer.`,
                icon: <LineChart className="w-6 h-6" />,
                bgIcon: "bg-primary/10 text-primary"
            },
            {
                title: "Comp Adjustment",
                priority: "P1",
                impact: "HIGH",
                timeline: "14 DAYS",
                owner: "HR BP",
                description: `Apply off-cycle salary alignment adjustment. Current equity vesting schedule provides insufficient golden handcuffs.`,
                icon: <DollarSign className="w-6 h-6" />,
                bgIcon: "bg-tertiary/10 text-tertiary"
            }
        ];
    } else if (employee.primaryFactor === 'Role Stagnation') {
        recs = [
            {
                title: "Promotion Path Review",
                priority: "P0",
                impact: "VERY HIGH",
                timeline: "7 DAYS",
                owner: "DEPT HEAD",
                description: "Accelerate performance review to current cycle. Define clear pathway to senior roles with tangible milestone deliverables.",
                icon: <LineChart className="w-6 h-6" />,
                bgIcon: "bg-primary/10 text-primary"
            },
            {
                title: "Career Mentorship Pairing",
                priority: "P1",
                impact: "HIGH",
                timeline: "10 DAYS",
                owner: "HR BP",
                description: "Enroll in career development plan and associate a senior mentor for cross-functional stretch tasks.",
                icon: <DollarSign className="w-6 h-6" />,
                bgIcon: "bg-tertiary/10 text-tertiary"
            }
        ];
    }

    return (
        <section className="space-y-stack-md">
            <h3 className="font-mono-label uppercase text-on-surface">Retention Recommendations // Tactical Actions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                {recs.map((rec) => (
                    <div key={rec.title} className="glass-panel p-stack-lg rounded-xl flex gap-stack-md group hover:luminous-border-primary transition-all cursor-pointer">
                        <div className={`w-12 h-12 rounded flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${rec.bgIcon}`}>
                            {rec.icon}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <h5 className="font-bold">{rec.title}</h5>
                                <span className={`text-[10px] font-mono-label px-2 rounded ${rec.bgIcon}`}>PRIORITY: {rec.priority}</span>
                            </div>
                            <p className="text-sm text-on-surface-variant">
                                {rec.description}
                            </p>
                            <div className="flex gap-4 pt-2">
                                <div><span className="text-[9px] block font-mono-label text-on-surface-variant opacity-50">IMPACT</span><span className="text-xs font-bold text-secondary">{rec.impact}</span></div>
                                <div><span className="text-[9px] block font-mono-label text-on-surface-variant opacity-50">TIMELINE</span><span className="text-xs font-bold">{rec.timeline}</span></div>
                                <div><span className="text-[9px] block font-mono-label text-on-surface-variant opacity-50">OWNER</span><span className="text-xs font-bold">{rec.owner}</span></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
