import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  LogOut, 
  Users, 
  Loader2,
  LineChart,
  Settings,
  Menu,
  X,
  User,
  Bell,
  Sun,
  Moon,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import api from '../utils/api';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);


  const { 
    employees, 
    deployingPlaybook, 
    deployLogs, 
    isRegistering, 
    registerLogs,
    user,
    logout,
    login,
    triggerPlaybook,
    theme,
    toggleTheme
  } = useSystem();

  // Password change state for force reset
  const [showForceReset, setShowForceReset] = useState(false);
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (user?.needs_password_reset) {
      setShowForceReset(true);
    } else {
      setShowForceReset(false);
    }
  }, [user]);

  const handleForceResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (newPassword.length < 6) {
      setResetError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setIsResetting(true);
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword: currPassword,
        newPassword: newPassword
      });

      if (response.data.success) {
        window.dispatchEvent(new CustomEvent("app-toast", {
          detail: { message: 'Password updated successfully!', type: 'success' }
        }));
        
        // Update user state to clear the reset flag
        const updatedUser = { ...user, needs_password_reset: false };
        const activeToken = localStorage.getItem('attrisense_token') || '';
        login(activeToken, updatedUser);
        setShowForceReset(false);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to change password. Please verify current password.';
      setResetError(msg);
    } finally {
      setIsResetting(false);
    }
  };



  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Compute stats
  const highThreatCount = employees.filter(e => e.status === 'High').length;


  const userRole = user?.role || 'hr';

  // Redirect standard employees to their profile/survey portal
  useEffect(() => {
    if (userRole === 'employee' && !location.pathname.startsWith('/my-profile')) {
      navigate('/my-profile');
    }
  }, [userRole, location.pathname, navigate]);

  const menuItems = [];
  
  if (userRole === 'employee') {
    menuItems.push(
      { path: '/my-profile', label: 'Pulse Portal', icon: User }
    );
  } else {
    menuItems.push(
      { path: '/dashboard', label: 'Dashboard', icon: Activity },
      { path: '/employees', label: 'Employee List', icon: Users },
      { path: '/risk-analytics', label: 'Risk Analytics', icon: AlertTriangle, badge: highThreatCount > 0 },
      { path: '/prediction-center', label: 'Prediction Center', icon: LineChart },
      { path: '/reports', label: 'Reports Center', icon: FileText },
      { path: '/copilot', label: 'AI Copilot', icon: MessageSquare }
    );
    if (userRole === 'hr' || userRole === 'admin') {
      menuItems.push({ path: '/settings', label: 'Settings', icon: Settings });
    }
  }

  return (
    <div className="min-h-screen bg-primary-bg text-slate-100 font-sans flex flex-col lg:flex-row relative transition-colors duration-200">
      
      {/* 1. Desktop Sidebar Navigation (Visible on Large Screens) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-secondary-bg border-r border-border-primary flex-col justify-between z-30 transition-colors duration-200">
        
        {/* Top Section: Logo & Nav Links */}
        <div className="flex flex-col min-h-0">
          
          {/* Logo block */}
          <div className="h-16 px-6 flex items-center space-x-3 border-b border-border-primary shrink-0">
            <img src="/favicon.svg" alt="AttriSense Logo" className="w-6 h-6 object-contain" />
            <span className="font-bold text-sm tracking-tight text-slate-100">
              AttriSense <span className="text-accent-blue">AI</span>
            </span>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 custom-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group px-3 py-2.5 rounded font-mono text-[10px] uppercase tracking-wider flex items-center justify-between border transition-all duration-150 ${
                    active
                      ? 'bg-elevated-bg text-accent-blue border-border-primary font-bold shadow-sm'
                      : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-elevated-bg/50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-3.5 h-3.5 transition-colors ${active ? 'text-accent-blue' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-status-danger animate-pulse"></span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Theme Switch, Profile, Logout */}
        <div className="p-4 border-t border-border-primary bg-secondary-bg shrink-0 space-y-4">
          
          {/* User profile brief & Logout */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center font-bold text-accent-blue text-xs shrink-0 uppercase">
                {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'AD'}
              </div>
              <div className="flex flex-col text-left font-mono text-[9px] text-slate-400 min-w-0">
                <span className="text-slate-100 font-bold truncate uppercase">{user?.name || 'Admin'}</span>
                <span className="truncate">{user?.role || 'Administrator'}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={toggleTheme}
                className="border border-border-primary bg-elevated-bg p-2 rounded text-slate-300 hover:text-white cursor-pointer flex items-center justify-center transition-all duration-150 border-none outline-none"
                title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleLogout}
                className="border border-border-primary bg-elevated-bg p-2 rounded text-status-danger hover:bg-status-danger/10 cursor-pointer flex items-center justify-center transition-all duration-150 border-none outline-none"
                title="Logout session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Mobile Top Navbar (Visible on Mobile/Tablet) */}
      <header className="lg:hidden h-16 bg-secondary-bg border-b border-border-primary px-4 flex items-center justify-between shrink-0 z-30 relative transition-colors duration-200">
        
        {/* Mobile brand logo */}
        <div className="flex items-center space-x-2.5">
          <img src="/favicon.svg" alt="AttriSense Logo" className="w-6 h-6 object-contain" />
          <span className="font-bold text-sm tracking-tight text-slate-100">
            AttriSense <span className="text-accent-blue">AI</span>
          </span>
        </div>

        {/* Mobile controls (hamburger menu) */}
        <div className="flex items-center space-x-2">
          {/* Mobile Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-white cursor-pointer border-none bg-transparent outline-none flex items-center justify-center mr-1"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {/* Mobile notification bell */}
          <div className="relative mr-2">
            <button 
              onClick={() => setNotiOpen(!notiOpen)}
              className="relative p-2 text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent outline-none flex items-center justify-center"
            >
              <Bell className="w-5 h-5" />
              {employees.filter(e => e.status === 'High').length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-status-danger text-[8px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                  {employees.filter(e => e.status === 'High').length}
                </span>
              )}
            </button>
          </div>
          <button 
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 hover:bg-elevated-bg rounded-md text-slate-400 hover:text-slate-100 focus:outline-none cursor-pointer border-none bg-transparent"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* 3. Mobile Navigation Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden bg-secondary-bg border-b border-border-primary p-4 space-y-1.5 z-30 font-mono text-[10px] uppercase tracking-wider relative transition-colors duration-200">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                onClick={() => setMobileOpen(false)}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded border ${
                  active ? 'bg-elevated-bg text-accent-blue border-border-primary' : 'border-transparent text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-status-danger"></span>
                )}
              </Link>
            );
          })}
          <div className="h-[1px] bg-border-primary my-3"></div>
          <div className="flex justify-between items-center px-3.5 py-1 text-[9px] text-slate-500">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center font-bold text-accent-blue text-[10px] uppercase">
                {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'AD'}
              </div>
              <span className="text-slate-100 font-bold uppercase">{user?.name || 'Admin'}</span>
            </div>
            <button
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
              className="text-status-danger flex items-center space-x-1.5 cursor-pointer border-none bg-transparent"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Desktop Main Content Layout Wrapper (Padded on Left for Sidebar) */}
      <div className="flex-grow lg:pl-64 flex flex-col min-w-0 min-h-screen relative transition-all duration-200">
        
        {/* Top Header telemetry line (clean, compact desktop-only telemetry) */}
        <div className="hidden lg:flex h-12 bg-secondary-bg border-b border-border-primary px-6 items-center justify-between text-slate-400 font-mono text-[9px] tracking-wider shrink-0 transition-colors duration-200">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse"></span>
              System Telemetry: <span className="text-slate-100 font-bold uppercase">Online</span>
            </span>
            <span className="text-border-primary">|</span>
            <span>Accuracy: <span className="text-[#22C55E] font-bold">94.8%</span></span>
            <span className="text-border-primary">|</span>
            <span>Latency: <span className="text-slate-100">12ms</span></span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Server: US-WEST-01</span>
            <span className="text-border-primary">|</span>
            <span>UTCTime: {new Date().toISOString().substring(11, 19)} Z</span>
            <span className="text-border-primary">|</span>
            {/* Desktop notification bell */}
            <div className="relative">
              <button 
                onClick={() => setNotiOpen(!notiOpen)}
                className="relative p-1 text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent outline-none flex items-center justify-center"
              >
                <Bell className="w-3.5 h-3.5" />
                {employees.filter(e => e.status === 'High').length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-status-danger text-[7px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                    {employees.filter(e => e.status === 'High').length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic routing page view portal */}
        <main className="flex-grow p-3 sm:p-4 md:p-6 transition-colors duration-200 min-w-0">
          <Outlet />
        </main>

        {/* Standard simple footer */}
        <footer className="h-12 bg-secondary-bg border-t border-border-primary px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between font-mono text-[9px] text-slate-500 shrink-0 transition-colors duration-200 py-2 sm:py-0">
          <span>&copy; 2026 AttriSense AI. All rights reserved.</span>
          <span className="hidden sm:inline">System Roster // Version 2.4.0</span>
        </footer>
      </div>

      {/* 5. Floating Toast Status Overlay (Floating Bottom-Right for Ingestion Logs) */}
      <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 flex flex-col gap-3 max-w-[calc(100vw-1.5rem)] sm:w-80 font-mono text-[10px]">
        {/* Dynamic adding employee log overlay */}
        {isRegistering && (
          <div className="glass-panel p-4 rounded-xl border border-border-primary shadow-2xl space-y-2.5 transition-colors duration-200">
            <div className="flex items-center justify-between text-accent-blue border-b border-border-primary pb-1.5">
              <div className="flex items-center space-x-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="font-bold uppercase tracking-wider">Ingesting Employee</span>
              </div>
              <span className="text-[9px] text-slate-500">Node Ingest</span>
            </div>
            <div className="space-y-1.5 text-slate-400 leading-normal max-h-[120px] overflow-y-auto custom-scrollbar">
              {registerLogs.map((log, index) => (
                <p key={index} className={log.includes('[SUCCESS]') ? 'text-status-success font-semibold' : 'text-slate-400'}>&gt; {log}</p>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic deploying playbook log overlay */}
        {deployingPlaybook && (
          <div className="glass-panel p-4 rounded-xl border border-border-primary shadow-2xl space-y-2.5 transition-colors duration-200">
            <div className="flex items-center justify-between text-accent-blue border-b border-border-primary pb-1.5">
              <div className="flex items-center space-x-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="font-bold uppercase tracking-wider">Deploying Strategy</span>
              </div>
              <span className="text-[9px] text-slate-500">Mitigation Node</span>
            </div>
            <div className="space-y-1.5 text-slate-400 leading-normal max-h-[120px] overflow-y-auto custom-scrollbar">
              {deployLogs.map((log, index) => (
                <p key={index} className={log.includes('[SUCCESS]') ? 'text-status-success font-semibold' : 'text-slate-400'}>&gt; {log}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Notification Center Dropdown */}
      {notiOpen && (
        <div 
          className="fixed top-16 right-2 sm:right-4 lg:top-12 lg:right-6 z-50 w-[calc(100vw-1rem)] sm:w-80 bg-secondary-bg border border-border-primary rounded-xl shadow-2xl overflow-hidden font-mono"
          style={{
            animation: 'toastSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="p-3 bg-elevated-bg border-b border-border-primary flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-1.5">
              <Bell className="w-3.5 h-3.5 text-accent-blue" />
              <span>Risk Telemetry Alerts</span>
            </span>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-status-danger/10 text-status-danger font-bold uppercase">
              {employees.filter(e => e.status === 'High').length} critical
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-border-primary">
            {employees.filter(e => e.status === 'High').length > 0 ? (
              employees.filter(e => e.status === 'High').map((emp) => (
                <div key={emp.id} className="p-3.5 hover:bg-elevated-bg/50 transition-colors space-y-2">
                  <div className="flex justify-between items-start text-[9px]">
                    <div className="flex flex-col text-left">
                      <span className="text-white font-bold uppercase truncate max-w-[130px]">{emp.name}</span>
                      <span className="text-slate-500 text-[8px]">{emp.role} // {emp.dept}</span>
                    </div>
                    <span className="font-bold text-status-danger bg-status-danger/5 border border-status-danger/15 px-1.5 py-0.5 rounded text-[8px]">
                      {emp.probability}% RISK
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-[8px] pt-1">
                    <span className="text-slate-400">Driver: <strong className="text-white">{emp.primaryFactor}</strong></span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setNotiOpen(false);
                          navigate(`/employee/${emp.id}`);
                        }}
                        className="text-slate-400 hover:text-white font-semibold cursor-pointer border-none bg-transparent"
                      >
                        PROFILE
                      </button>
                      <span className="text-slate-600">|</span>
                      {emp.playbookStatus !== 'Executed' ? (
                        <button
                          onClick={() => {
                            setNotiOpen(false);
                            triggerPlaybook(emp.id);
                          }}
                          className="text-accent-blue hover:text-white font-semibold cursor-pointer border-none bg-transparent"
                        >
                          DEPLOY
                        </button>
                      ) : (
                        <span className="text-status-success font-semibold">MITIGATED</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500 text-[9px] uppercase">
                Zero threat levels detected.
              </div>
            )}
          </div>
          <div className="p-2 bg-elevated-bg/30 border-t border-border-primary text-center">
            <button
              onClick={() => {
                setNotiOpen(false);
                navigate('/employees');
              }}
              className="text-[8px] text-slate-400 hover:text-white uppercase font-bold tracking-wider cursor-pointer border-none bg-transparent"
            >
              View Employee Directory
            </button>
          </div>
        </div>
      )}

      {showForceReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-bg/90 backdrop-blur-md p-4 sm:p-6 font-sans overflow-y-auto">
          <div className="w-full max-w-md bg-secondary-bg border border-border-primary rounded-xl overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-accent-blue"></div>
            
            <div className="p-5 sm:p-8 space-y-6">
              <div className="text-center">
                <div className="inline-flex p-2.5 rounded bg-blue-500/10 border border-blue-500/20 text-accent-blue mb-3">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-100 tracking-tight">Access Key Setup Required</h3>
                <p className="text-slate-400 text-xs font-mono tracking-wider uppercase mt-1">
                  First-Time Authentication Reset
                </p>
              </div>

              {resetError && (
                <div className="flex items-center space-x-2 border border-[#EF4444]/20 bg-[#EF4444]/15 text-[#EF4444] px-4 py-2.5 rounded text-xs font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#EF4444]" />
                  <span>{resetError}</span>
                </div>
              )}

              <form onSubmit={handleForceResetSubmit} className="space-y-4 font-mono text-[10px]">
                <div className="space-y-1">
                  <label className="block text-slate-400 uppercase tracking-widest">
                    Temporary Default Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currPassword}
                    onChange={(e) => setCurrPassword(e.target.value)}
                    placeholder="Enter default password"
                    className="w-full bg-primary-bg border border-border-primary rounded text-xs px-3.5 py-2.5 text-[var(--text-main)] placeholder-slate-600 focus:outline-none focus:border-accent-blue transition-colors duration-200"
                  />
                  <span className="text-[8px] text-slate-500 block mt-1">
                    Hint: The temporary password is set to your username ({user?.email})
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 uppercase tracking-widest">
                    New Secure Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-primary-bg border border-border-primary rounded text-xs px-3.5 py-2.5 text-[var(--text-main)] placeholder-slate-600 focus:outline-none focus:border-accent-blue transition-colors duration-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 uppercase tracking-widest">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full bg-primary-bg border border-border-primary rounded text-xs px-3.5 py-2.5 text-[var(--text-main)] placeholder-slate-600 focus:outline-none focus:border-accent-blue transition-colors duration-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isResetting}
                  className="w-full bg-accent-blue hover:bg-blue-600 text-white font-mono text-xs uppercase tracking-wider py-3 rounded flex items-center justify-center space-x-2 border border-blue-500 transition-all duration-200 shadow-[0_0_15px_rgba(59,130,246,0.15)] cursor-pointer disabled:opacity-50"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Credentials...</span>
                    </>
                  ) : (
                    <span>Update Access Key</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
