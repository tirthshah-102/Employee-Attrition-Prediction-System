import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Terminal, Zap, Loader2 } from 'lucide-react';
import api from '../../../utils/api';
import { useSystem } from '../../../context/SystemContext';
import type { Employee } from '../../../context/SystemContext';

const formSchema = z.object({
    employeeId: z.string().min(1, "Employee is required"),
    rating: z.number().min(1).max(5),
    activeProjects: z.number().min(0),
    sentimentScore: z.number().min(0).max(100),
    mobilityLevel: z.string().min(1),
    weeklyHours: z.number().min(0),
    salaryPercentile: z.number().min(0).max(100),
});

type FormData = z.infer<typeof formSchema>;

export default function InputConsole({ 
    isAnalyzing, 
    setIsAnalyzing, 
    setHasResult,
    setPredictedEmp
}: { 
    isAnalyzing: boolean; 
    setIsAnalyzing: (v: boolean) => void;
    setHasResult: (v: boolean) => void;
    setPredictedEmp: (emp: Employee | null) => void;
}) {
    const { employees, fetchEmployees } = useSystem();
    const { register, handleSubmit, watch, reset } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employeeId: '',
            rating: 4,
            activeProjects: 3,
            sentimentScore: 65,
            mobilityLevel: 'Medium',
            weeklyHours: 40,
            salaryPercentile: 50
        }
    });

    const watchedEmployeeId = watch('employeeId');

    // Auto-populate when selecting an employee from dropdown
    useEffect(() => {
        const emp = employees.find(e => e.id === watchedEmployeeId);
        if (emp) {
            reset({
                employeeId: emp.id,
                rating: emp.rating,
                activeProjects: 3,
                sentimentScore: Math.round(emp.growthIndex * 10),
                mobilityLevel: emp.status,
                weeklyHours: Math.round(40 + emp.overtimeHrs),
                salaryPercentile: Math.round(50 + emp.salaryGap * 2),
            });
            setPredictedEmp(emp);
        }
    }, [watchedEmployeeId, employees, reset, setPredictedEmp]);

    const onSubmit = async (data: FormData) => {
        console.log('Running attrition prediction for:', data);
        setIsAnalyzing(true);
        try {
            const updatedOvertimeHrs = Math.max(0, data.weeklyHours - 40);
            const updatedSalaryGap = Math.round((data.salaryPercentile - 50) / 2);

            const res = await api.put(`/employees/${data.employeeId}`, {
                overtimeHrs: updatedOvertimeHrs,
                salaryGap: updatedSalaryGap,
                rating: data.rating,
                growth_index: data.sentimentScore / 10
            });

            if (res.data.success) {
                // Fetch the central state to sync
                await fetchEmployees();
                // Set the predicted employee to the updated profile from response
                setPredictedEmp(res.data.data.employee);
                setHasResult(true);
            }
        } catch (error) {
            console.error("Prediction simulation failed", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <section className="rounded-2xl overflow-hidden"
            style={{
                background: 'linear-gradient(145deg, rgba(22,25,36,0.95) 0%, rgba(16,18,25,0.98) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
        >
            <div className="flex items-center gap-3 p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.2)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(173,198,255,0.1)', border: '1px solid rgba(173,198,255,0.2)' }}>
                    <Terminal className="text-primary w-3.5 h-3.5" />
                </div>
                <h3 className="font-mono text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(173,198,255,0.8)' }}>&gt;_ INPUT CONSOLE // PARAMETERS</h3>
                <div className="ml-auto flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#ff5f57' }} />
                    <span className="w-2 h-2 rounded-full" style={{ background: '#febc2e' }} />
                    <span className="w-2 h-2 rounded-full" style={{ background: '#28c840' }} />
                </div>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employee Identity */}
                <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: 'rgba(173,198,255,0.5)' }}>01 // EMPLOYEE IDENTITY</label>
                    <div className="relative">
                        <select 
                            {...register('employeeId')}
                            className="w-full rounded-xl p-3 pr-8 text-sm appearance-none outline-none focus:ring-1 transition-all"
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: '#e1e2ec' }}
                        >
                            <option value="">Select Employee UID...</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.id}: {emp.name} ({emp.role})</option>
                            ))}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40 text-xs">▾</span>
                    </div>
                </div>

                {/* Performance Signals */}
                <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: 'rgba(173,198,255,0.5)' }}>02 // PERFORMANCE SIGNALS</label>
                    <div className="grid grid-cols-2 gap-2">
                        <input 
                            type="number" 
                            {...register('rating', { valueAsNumber: true })}
                            placeholder="Rating (1-5)" 
                            className="rounded-xl p-3 text-sm font-mono outline-none focus:ring-1 transition-all"
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: '#e1e2ec' }}
                        />
                        <input 
                            type="number" 
                            {...register('activeProjects', { valueAsNumber: true })}
                            placeholder="Active Projects" 
                            className="rounded-xl p-3 text-sm font-mono outline-none focus:ring-1 transition-all"
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: '#e1e2ec' }}
                        />
                    </div>
                </div>

                {/* Engagement Signals */}
                <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: 'rgba(173,198,255,0.5)' }}>03 // ENGAGEMENT SIGNALS</label>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="relative pt-2">
                            <input 
                                type="range" 
                                {...register('sentimentScore', { valueAsNumber: true })}
                                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-primary" 
                                style={{ background: 'rgba(173,198,255,0.1)' }}
                            />
                            <span className="text-[10px] font-mono text-on-surface-variant/50 mt-1 block">Sentiment Score</span>
                        </div>
                        <select 
                            {...register('mobilityLevel')}
                            className="rounded-xl p-3 text-sm outline-none appearance-none"
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: '#e1e2ec' }}
                        >
                            <option value="">Mobility Level</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                </div>

                {/* Contextual Data */}
                <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: 'rgba(173,198,255,0.5)' }}>04 // CONTEXTUAL DATA</label>
                    <div className="grid grid-cols-2 gap-2">
                        <input 
                            type="number" 
                            {...register('weeklyHours', { valueAsNumber: true })}
                            placeholder="Weekly Hours" 
                            className="rounded-xl p-3 text-sm font-mono outline-none"
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: '#e1e2ec' }}
                        />
                        <input 
                            type="number" 
                            {...register('salaryPercentile', { valueAsNumber: true })}
                            placeholder="Salary Percentile" 
                            className="rounded-xl p-3 text-sm font-mono outline-none"
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: '#e1e2ec' }}
                        />
                    </div>
                </div>

                <div className="md:col-span-2">
                    <button 
                        type="submit" 
                        disabled={isAnalyzing}
                        className="w-full py-4 font-bold rounded-xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98] text-sm"
                        style={isAnalyzing ? {
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.4)',
                            cursor: 'not-allowed',
                        } : {
                            background: 'linear-gradient(135deg, var(--accent-blue) 0%, #1D4ED8 100%)',
                            color: '#ffffff',
                            boxShadow: '0 4px 25px var(--accent-blue-glow), inset 0 1px 0 rgba(255,255,255,0.3)',
                            border: '1px solid var(--accent-blue)',
                        }}
                    >
                        {isAnalyzing ? (
                            <><Loader2 className="animate-spin w-4 h-4" /> PROCESSING NEURAL NETWORKS...</>
                        ) : (
                            <><Zap className="w-4 h-4" /> RUN ATTRITION PREDICTION</>
                        )}
                    </button>
                </div>
            </form>
        </section>
    );
}
