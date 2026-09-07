import React, { useState, useEffect } from 'react';
import { FileText, Download, Clock, Settings, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import { useToast } from '../../components/ToastProvider';

interface SchedulerConfig {
    enabled: boolean;
    intervalMinutes: number;
    recipients: string;
}

interface LogEntry {
    id: number;
    source: string;
    text: string;
    type: string;
    timestamp: string;
}

export default function ReportsCenter() {
    const { showToast } = useToast();
    const [config, setConfig] = useState<SchedulerConfig>({
        enabled: true,
        intervalMinutes: 15,
        recipients: 'admin@attrisense.ai'
    });
    const [history, setHistory] = useState<LogEntry[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

    // Fetch scheduler settings and history logs
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/reports/scheduler');
                if (res.data.success) {
                    setConfig(res.data.data);
                }
            } catch (err) {
                console.error("Failed to load report scheduler settings", err);
            }
        };

        const fetchLogs = async () => {
            try {
                const res = await api.get('/agent-logs');
                if (res.data.success) {
                    const rawLogs = res.data.data.logs || [];
                    // Filter logs relating to report scheduler
                    const reportLogs = rawLogs
                        .filter((log: any) => log.source?.toLowerCase() === 'scheduler' || log.text?.toLowerCase().includes('report'))
                        .map((log: any, idx: number) => ({
                            id: log.id || idx,
                            source: log.source || 'Scheduler',
                            text: log.text,
                            type: log.type || 'info',
                            timestamp: log.timestamp || new Date().toISOString()
                        }));
                    setHistory(reportLogs);
                }
            } catch (err) {
                console.error("Failed to fetch reports log history", err);
            }
        };

        fetchSettings();
        fetchLogs();
    }, []);

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await api.post('/reports/scheduler', config);
            if (res.data.success) {
                setConfig(res.data.data);
                showToast("Automated Report Scheduler configuration updated.", "success");
            }
        } catch (err) {
            console.error("Failed to update scheduler", err);
            showToast("Failed to update report scheduler settings.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownload = async (format: 'pdf' | 'excel') => {
        if (format === 'pdf') setIsDownloadingPdf(true);
        else setIsDownloadingExcel(true);

        try {
            const response = await api.get(`/reports/export/${format}`, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', format === 'pdf' ? 'executive_attrition_brief.pdf' : 'executive_attrition_report.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast(`Report downloaded successfully in ${format.toUpperCase()} format.`, "success");
        } catch (err) {
            console.error(`Failed to download ${format}`, err);
            showToast(`Failed to generate and download ${format.toUpperCase()} report.`, "error");
        } finally {
            if (format === 'pdf') setIsDownloadingPdf(false);
            else setIsDownloadingExcel(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Reports & Executive Analytics</h2>
                    <p className="text-slate-400 text-xs sm:text-sm">Generate corporate audit reports, download monitored telemetry, or configure scheduled background distributions.</p>
                </div>
            </div>

            {/* Reports Download cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* PDF Brief Card */}
                <div className="bg-secondary-bg/50 border border-border-primary p-4 sm:p-6 rounded-xl sm:rounded-2xl flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-300 shadow-lg">
                    <div className="space-y-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400">
                            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white">Executive Summary Brief (PDF)</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Generate a formal, publication-ready executive summary. Includes high-level KPIs, threat index metrics, and the top 15 critical attrition risk cases inside a structured layout.
                        </p>
                    </div>
                    <button
                        onClick={() => handleDownload('pdf')}
                        disabled={isDownloadingPdf}
                        className="mt-5 sm:mt-6 w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-md text-xs sm:text-sm cursor-pointer disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        {isDownloadingPdf ? "Generating PDF..." : "Export Executive Brief (PDF)"}
                    </button>
                </div>

                {/* Excel Report Card */}
                <div className="bg-secondary-bg/50 border border-border-primary p-4 sm:p-6 rounded-xl sm:rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-300 shadow-lg">
                    <div className="space-y-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white">Headcount & Telemetry Roster (Excel)</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Export the full system telemetry roster. Contains complete monitored columns including weekly working hours, salary percentile gaps, performance records, and risk probabilities.
                        </p>
                    </div>
                    <button
                        onClick={() => handleDownload('excel')}
                        disabled={isDownloadingExcel}
                        className="mt-5 sm:mt-6 w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-md text-xs sm:text-sm cursor-pointer disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        {isDownloadingExcel ? "Generating Excel..." : "Export Full Telemetry (Excel)"}
                    </button>
                </div>
            </div>

            {/* Middle Section: Configuration + Execution Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                
                {/* Scheduler Configuration Panel */}
                <div className="lg:col-span-1 bg-secondary-bg border border-border-primary p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-2 border-b border-border-primary/60 pb-3">
                        <Settings className="w-4 h-4 text-indigo-400" />
                        <h4 className="font-bold text-sm text-white uppercase tracking-wider">Automated Scheduler</h4>
                    </div>

                    <form onSubmit={handleSaveConfig} className="space-y-4">
                        {/* Enabled Switch */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-300">Enable Automated Runs</span>
                            <button
                                type="button"
                                onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                                className={`w-11 h-6 rounded-full transition-colors relative ${config.enabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
                            >
                                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${config.enabled ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>

                        {/* Interval slider */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-400">Run Interval (Minutes)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="5"
                                    max="120"
                                    step="5"
                                    value={config.intervalMinutes}
                                    onChange={(e) => setConfig(prev => ({ ...prev, intervalMinutes: parseInt(e.target.value) }))}
                                    className="w-full accent-indigo-600 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="font-mono text-xs font-bold text-white min-w-[32px] text-right">{config.intervalMinutes}m</span>
                            </div>
                        </div>

                        {/* Recipients */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-400">Email Recipients</label>
                            <input
                                type="text"
                                value={config.recipients}
                                onChange={(e) => setConfig(prev => ({ ...prev, recipients: e.target.value }))}
                                className="w-full bg-primary-bg border border-border-primary rounded-xl p-3 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500/50"
                                placeholder="Comma separated emails"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md text-xs flex items-center justify-center gap-2"
                        >
                            <Play className="w-3.5 h-3.5" />
                            {isSaving ? "Saving Settings..." : "Save Configuration"}
                        </button>
                    </form>
                </div>

                {/* Execution History logs */}
                <div className="lg:col-span-2 bg-secondary-bg border border-border-primary p-6 rounded-2xl shadow-lg space-y-4">
                    <div className="flex items-center gap-2 border-b border-border-primary/60 pb-3">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <h4 className="font-bold text-sm text-white uppercase tracking-wider">Scheduler Event History</h4>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {history.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                                <AlertCircle className="w-8 h-8 text-slate-500" />
                                No background scheduler execution logs detected.
                            </div>
                        ) : (
                            history.map((log) => (
                                <div key={log.id} className="p-3 bg-primary-bg/40 border border-border-primary/60 rounded-xl flex items-start gap-3">
                                    <div className="mt-0.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div className="space-y-0.5 flex-1">
                                        <p className="text-xs text-slate-200 leading-normal">{log.text}</p>
                                        <span className="block font-mono text-[9px] text-slate-500">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
