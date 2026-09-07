import { useState } from 'react';
import { Activity, Sun, Moon, Menu, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSystem } from '../context/SystemContext';

export function Navbar() {
  const { theme, toggleTheme } = useSystem();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-secondary-bg/90 backdrop-blur-md border-b border-border-primary/60 z-50 px-4 sm:px-6 font-sans">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        {/* Left side: Logo & Desktop Navigation */}
        <div className="flex items-center space-x-6 md:space-x-8">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-md blur-sm group-hover:bg-blue-500/30 transition-all duration-300"></div>
              <img src="/favicon.svg" alt="AttriSense Logo" className="w-7 h-7 relative object-contain" />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-white group-hover:text-accent-blue transition-colors duration-200">
              AttriSense <span className="text-accent-blue">AI</span>
            </span>
          </Link>

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

        {/* Right side: Telemetry, Theme Toggler, Login & Mobile Hamburger */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Live System Status Telemetry (desktop/laptop) */}
          <div className="hidden xl:flex items-center space-x-4 border-l border-r border-border-primary/60 px-4 py-1.5 font-mono text-xs tracking-wider text-slate-400">
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

          {/* Compact online indicator on tablet */}
          <div className="hidden sm:flex xl:hidden items-center space-x-1.5 px-2.5 py-1 rounded bg-secondary-bg/60 border border-border-primary/60 font-mono text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"></span>
            <span>Online</span>
          </div>

          {/* Theme Toggler */}
          <button
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 text-slate-400 hover:text-slate-200 cursor-pointer border border-border-primary/60 bg-secondary-bg/50 rounded-md transition-colors outline-none flex items-center justify-center min-w-[38px] min-h-[38px]"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Sign In CTA */}
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center space-x-1.5 bg-accent-blue hover:bg-blue-600 text-white font-mono text-xs uppercase tracking-wider px-3.5 py-2 rounded border border-blue-500 transition-all duration-200 shadow-sm"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-md border border-border-primary/60 bg-secondary-bg/50 cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-secondary-bg/95 backdrop-blur-xl border-b border-border-primary/80 px-4 py-4 space-y-3 font-mono text-xs uppercase tracking-wider animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xl">
          <a
            href="#dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded text-slate-300 hover:text-white hover:bg-elevated-bg transition-colors"
          >
            Live Demo
          </a>
          <a
            href="#agents"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded text-slate-300 hover:text-white hover:bg-elevated-bg transition-colors"
          >
            AI Agents
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded text-slate-300 hover:text-white hover:bg-elevated-bg transition-colors"
          >
            Features
          </a>
          
          <div className="pt-2 border-t border-border-primary/60">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 bg-accent-blue hover:bg-blue-600 text-white rounded font-mono text-xs uppercase tracking-wider flex items-center justify-center space-x-2 border border-blue-500"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
