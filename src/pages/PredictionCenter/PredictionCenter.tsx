import { useState } from 'react';
import PredictionHeader from './components/PredictionHeader';
import InputConsole from './components/InputConsole';
import PredictionResult from './components/PredictionResult';
import FeatureContribution from './components/FeatureContribution';
import RootCausePanel from './components/RootCausePanel';
import RecommendationsPanel from './components/RecommendationsPanel';
import ImpactSimulation from './components/ImpactSimulation';
import RightTacticalRail from './components/RightTacticalRail';
import { motion } from 'framer-motion';
import { useSystem } from '../../context/SystemContext';
import type { Employee } from '../../context/SystemContext';

export default function PredictionCenter() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [hasResult, setHasResult] = useState(false); // Default to false to hide results initially
    const { employees } = useSystem();
    const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
    const predictedEmp = selectedEmp || (employees.length > 0 ? employees[0] : null);

    return (
        <div className="flex flex-col xl:flex-row min-h-full gap-6">
            {/* Primary Content Stage */}
            <div className="flex-1 p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-6xl w-full">
                <PredictionHeader />
                
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <InputConsole 
                        isAnalyzing={isAnalyzing} 
                        setIsAnalyzing={setIsAnalyzing} 
                        setHasResult={setHasResult} 
                        setPredictedEmp={setSelectedEmp} 
                    />
                </motion.div>

                {/* Tactical Rail on Mobile / Tablet (Rendered inline below console) */}
                <div className="block xl:hidden pt-4 border-t border-white/5">
                    <RightTacticalRail employee={predictedEmp} />
                </div>
            </div>

            {/* Modal for Attrition Prediction Results */}
            {hasResult && predictedEmp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-secondary-bg border border-border-primary rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-white uppercase font-mono">Prediction Analysis Result</h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">Target: {predictedEmp.name} ({predictedEmp.id})</p>
                            </div>
                            <button 
                                onClick={() => setHasResult(false)}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded bg-primary-bg hover:bg-slate-900 border border-border-primary text-xs uppercase tracking-wider font-mono font-semibold cursor-pointer text-slate-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="space-y-4 sm:space-y-6">
                            <PredictionResult employee={predictedEmp} />
                            <FeatureContribution employee={predictedEmp} />
                            <RootCausePanel employee={predictedEmp} />
                            <RecommendationsPanel employee={predictedEmp} />
                            <ImpactSimulation employee={predictedEmp} />
                        </div>
                    </div>
                </div>
            )}

            {/* Right Tactical Rail on Desktop */}
            <div className="hidden xl:block">
                <RightTacticalRail employee={predictedEmp} />
            </div>
        </div>
    );
}
