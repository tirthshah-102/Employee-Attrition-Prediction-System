import { Navbar } from '../components/Navbar';
import { DashboardPreview } from '../components/DashboardPreview';
import { AgentShowcase } from '../components/AgentShowcase';
import { FeaturesGrid } from '../components/FeaturesGrid';
import { Shield, ArrowRight, Terminal, Network } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-primary-bg text-[var(--text-main)] font-sans selection:bg-accent-blue/30 selection:text-white">
      
      {/* Background Ambient Grid & Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none z-0"></div>
      <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 md:pt-44 md:pb-28 border-b border-border-primary/60 z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Details (7 Cols) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 border border-blue-500/20 bg-blue-500/5 px-3 py-1 rounded text-xs font-mono tracking-wider text-accent-blue uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse"></span>
              <span>AI Talent Retention Platform</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-none">
              Predict Attrition.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-cyan-400">
                Preserve Talent.
              </span>
            </h1>

            <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans">
              AttriSense AI is an enterprise-grade multi-agent system that analyzes employee activity, predicts attrition risk, diagnoses root causes, and generates custom retention plans before resignations occur.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                to="/login"
                className="w-full sm:w-auto bg-accent-blue hover:bg-blue-600 text-white text-xs font-mono uppercase tracking-wider px-6 py-3.5 rounded flex items-center justify-center space-x-2 border border-blue-500 transition-all duration-200 shadow-[0_0_15px_rgba(59,130,246,0.25)]"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#agents"
                className="w-full sm:w-auto bg-secondary-bg/80 hover:bg-secondary-bg/50 text-slate-300 hover:text-white text-xs font-mono uppercase tracking-wider px-6 py-3.5 rounded flex items-center justify-center space-x-2 border border-border-primary/60 hover:border-accent-blue/55 transition-all duration-200"
              >
                <span>Learn How It Works</span>
              </a>
            </div>

            {/* Small Trust/Telemetry Ticker */}
            <div className="pt-8 border-t border-border-primary/60/50 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 font-mono text-[10px] text-slate-500 tracking-wider">
              <div className="flex items-center space-x-1.5">
                <Network className="w-3.5 h-3.5 text-accent-blue" />
                <span>Integrations: <span className="text-slate-300">Jira / Slack / BambooHR</span></span>
              </div>
              <div className="hidden sm:block text-slate-700">|</div>
              <div className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Security: <span className="text-slate-300">Enterprise Grade</span></span>
              </div>
            </div>

          </div>

          {/* Hero Visual Telemetry Block (5 Cols) */}
          <div className="lg:col-span-5 relative w-full max-w-md mx-auto">
            {/* Visual Shell mimicking a live terminal node */}
            <div className="bg-secondary-bg/80 border border-border-primary/60 rounded-lg p-5 font-mono text-xs shadow-2xl relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-accent-blue/40"></div>
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-accent-blue" />
                  <span className="text-[10px] uppercase text-white tracking-widest font-semibold">
                    System Status
                  </span>
                </div>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/10 text-accent-blue font-bold border border-blue-500/20">
                  Running
                </span>
              </div>

              {/* Data stream lines */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 text-[10px]">Analysis Speed:</span>
                  <span className="text-white text-[10px] font-bold">14.2 ops/sec</span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 text-[10px]">High Risk Employees:</span>
                  <span className="text-[#EF4444] text-[10px] font-bold">4 High Risk</span>
                </div>

                <div className="space-y-1.5 border-t border-white/5 pt-3">
                  <span className="block text-slate-500 text-[9px] uppercase tracking-wider">Active Analysis Pipeline</span>
                  <div className="grid grid-cols-5 gap-2 text-center text-[9px]">
                    <div className="bg-secondary-bg/50 border border-border-primary/60 py-2 rounded text-accent-blue">
                      <span className="block font-bold">Data</span>
                      <span className="text-[8px] text-slate-500">Sync</span>
                    </div>
                    <div className="bg-secondary-bg/50 border border-border-primary/60 py-2 rounded text-accent-blue">
                      <span className="block font-bold">Risk</span>
                      <span className="text-[8px] text-slate-500">Check</span>
                    </div>
                    <div className="bg-secondary-bg/50 border border-border-primary/60 py-2 rounded text-accent-blue">
                      <span className="block font-bold">Find</span>
                      <span className="text-[8px] text-slate-500">Cause</span>
                    </div>
                    <div className="bg-secondary-bg/50 border border-border-primary/60 py-2 rounded text-accent-blue">
                      <span className="block font-bold">Plan</span>
                      <span className="text-[8px] text-slate-500">Gen</span>
                    </div>
                    <div className="bg-secondary-bg/50 border border-border-primary/60 py-2 rounded text-emerald-400">
                      <span className="block font-bold">Brief</span>
                      <span className="text-[8px] text-slate-500">Done</span>
                    </div>
                  </div>
                </div>

                {/* Simulated connection path progress */}
                <div className="border border-border-primary/60 bg-primary-bg p-3 rounded font-mono text-[9px] text-slate-400 space-y-1">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>Connection: Secure</span>
                    <span className="text-[#22C55E]">Active</span>
                  </div>
                  <p className="text-slate-500 mt-1">Syncing employee activity and calculating risk scores...</p>
                  <div className="flex items-center space-x-1 mt-1 text-accent-blue">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-ping"></span>
                    <span>Pipeline Flow: Active</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Interactive Command Center Workspace Demo */}
      <DashboardPreview />

      {/* AI Agents Architecture Details */}
      <AgentShowcase />

      {/* System Features Grid */}
      <FeaturesGrid />

      {/* Tactical Footer */}
      <footer className="bg-secondary-bg/80 border-t border-border-primary/60 py-12 text-slate-500 font-mono text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-accent-blue" />
            <span className="text-white font-sans font-bold">
              AttriSense <span className="text-accent-blue">AI</span>
            </span>
            <span className="text-slate-700">|</span>
            <span>Retention Platform // Version 1.0.0</span>
          </div>

          <div className="flex items-center space-x-6 text-[10px]">
            <a href="#" className="hover:text-white transition-colors duration-150">Documentation</a>
            <a href="#" className="hover:text-white transition-colors duration-150">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors duration-150">Security Info</a>
          </div>

          <p className="text-[10px] text-slate-600">
            &copy; 2026 AttriSense AI. All data processed securely.
          </p>
        </div>
      </footer>

    </div>
  );
}
