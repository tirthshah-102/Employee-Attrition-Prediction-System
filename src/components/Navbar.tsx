import { Shield, Activity, Sun, Moon } from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export function Navbar() {
  const { theme, toggleTheme } = useSystem();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-secondary-bg/80 border-b border-border-primary/60 z-50 flex items-center justify-between px-6 font-sans">
      {/* Left side: Logo & Navigation */}
      <div className="flex items-center space-x-8">
        <a href="#" className="flex items-center space-x-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-md blur-sm group-hover:bg-blue-500/30 transition-all duration-300"></div>
            <div className="relative border border-border-primary/60 bg-secondary-bg/50 p-1.5 rounded-md text-accent-blue">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <span className="font-bold text-lg tracking-tight text-white group-hover:text-accent-blue transition-colors duration-200">
            AttriSense <span className="text-accent-blue">AI</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center space-x-6">
          <a href="#dashboard" className="text-sm text-slate-400 hover:text-white transition-colors duration-200 uppercase tracking-wider font-mono text-xs">
            Live Demo
          </a>
          <a href="#agents" className="text-sm text-slate-400 hover:text-white transition-colors duration-200 uppercase tracking-wider font-mono text-xs">
            AI Agents
          </a>
          <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors duration-200 uppercase tracking-wider font-mono text-xs">
            Features
          </a>
        </nav>
      </div>

      {/* Right side: Telemetry & Launch Button */}
      <div className="flex items-center space-x-4">
        {/* Live System Status Telemetry */}
        <div className="hidden lg:flex items-center space-x-4 border-l border-r border-border-primary/60 px-4 py-1.5 font-mono text-xs tracking-wider text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-accent-blue animate-pulse" />
            <span>System Uptime: <span className="text-white">99.98%</span></span>
          </div>
          <div className="h-3 w-px bg-white/10"></div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] absolute"></div>
            <span>System Status: <span className="text-[#22C55E]">Online</span></span>
          </div>
        </div>

        {/* Theme Toggler */}
        <button
          onClick={toggleTheme}
          className="p-2.5 text-slate-400 hover:text-slate-200 cursor-pointer border border-border-primary/60 bg-secondary-bg/50 rounded-md transition-colors outline-none flex items-center justify-center"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
