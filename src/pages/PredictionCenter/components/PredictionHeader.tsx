export default function PredictionHeader() {
    return (
        <section className="relative overflow-hidden rounded-2xl p-4 sm:p-6 md:p-8"
            style={{
                background: 'linear-gradient(135deg, rgba(173,198,255,0.07) 0%, rgba(173,198,255,0.02) 50%, rgba(76,215,246,0.03) 100%)',
                border: '1px solid rgba(173,198,255,0.12)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
        >
            {/* Decorative grid */}
            <div className="absolute top-0 right-0 w-80 h-80 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(173,198,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(173,198,255,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            {/* Glow orb */}
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(173,198,255,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-4 sm:gap-6 md:gap-8">
                <div className="max-w-2xl">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--theme-bg-opacity-10)', border: '1px solid var(--theme-border-opacity-20)', color: 'var(--theme-color-blue)' }}>NEURAL NETWORK v4.2.RC-1</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2 sm:mb-3" style={{ background: 'linear-gradient(135deg, #e1e8ff 0%, #c0d4ff 50%, #a0c0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        Employee Attrition Prediction Center
                    </h2>
                    <p className="text-on-surface-variant text-xs sm:text-sm leading-relaxed opacity-80 max-w-xl">
                        Neural network-driven diagnostic for workforce retention risks. Analyze behavioral telemetry and performance delta to forecast potential exits.
                    </p>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap md:flex-col gap-2 items-start md:items-end flex-shrink-0 w-full md:w-auto">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold" style={{ background: 'var(--theme-bg-opacity-8)', border: '1px solid var(--theme-border-opacity-20)', color: 'var(--theme-color-blue)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_6px_var(--accent-blue-glow)]" />
                        PREDICTION_ENGINE: ACTIVE
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold" style={{ background: 'var(--theme-bg-opacity-8)', border: '1px solid var(--theme-border-opacity-20)', color: 'var(--theme-color-cyan)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse shadow-[0_0_6px_var(--theme-color-cyan)]" />
                        EXPLAINABILITY_MODULE: READY
                    </div>
                </div>
            </div>
        </section>
    );
}
