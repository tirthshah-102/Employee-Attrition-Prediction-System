import { useSystem } from '../../../context/SystemContext';

export default function PredictionLog() {
    const { agentLogs } = useSystem();

    return (
        <section className="space-y-stack-md">
            <div className="flex justify-between items-center">
                <h3 className="font-mono-label uppercase text-on-surface">Prediction Log // Historical Runs</h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-outline-variant">
                            <th className="py-3 font-mono-label text-[10px] text-on-surface-variant uppercase px-2">Source</th>
                            <th className="py-3 font-mono-label text-[10px] text-on-surface-variant uppercase px-2">Timestamp</th>
                            <th className="py-3 font-mono-label text-[10px] text-on-surface-variant uppercase px-2">Detail</th>
                            <th className="py-3 font-mono-label text-[10px] text-on-surface-variant uppercase px-2">Type</th>
                        </tr>
                    </thead>
                    <tbody className="font-mono-metric text-xs">
                        {agentLogs.slice(0, 10).map((log, idx) => (
                            <tr key={log.id || `${log.source}-${log.timestamp || ''}-${idx}`} className="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors group">
                                <td className="py-3 px-2 text-primary">{log.source.toUpperCase()}</td>
                                <td className="py-3 px-2 text-on-surface-variant opacity-60">
                                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Live'}
                                </td>
                                <td className="py-3 px-2">{log.text}</td>
                                <td className="py-3 px-2">
                                    <span className={`w-2 h-2 rounded-full inline-block mr-2 ${
                                        log.type === 'danger' || log.type === 'error' ? 'bg-red-500' :
                                        log.type === 'warning' ? 'bg-amber-500' :
                                        log.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'
                                    }`}></span>
                                    {log.type.toUpperCase()}
                                </td>
                            </tr>
                        ))}
                        {agentLogs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-4 text-center text-slate-500">No logs generated yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
