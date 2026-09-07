import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { 
  ArrowRight, 
  Lock, 
  User, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Sun, 
  Moon,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import api from '../utils/api';
import { useSystem } from '../context/SystemContext';

const loginSchema = z.object({
  operatorId: z.string().min(1, 'Username or email is required.'),
  accessKey: z.string().min(1, 'Password is required.'),
});

export function LoginPage() {
  const navigate = useNavigate();
  const { login, theme, toggleTheme } = useSystem();
  const [operatorId, setOperatorId] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ operatorId?: string; accessKey?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAuthError(null);

    if (!mfaRequired) {
      const result = loginSchema.safeParse({ operatorId, accessKey });
      if (!result.success) {
        const fieldErrors: typeof errors = {};
        result.error.issues.forEach((err) => {
          if (err.path[0] === 'operatorId') fieldErrors.operatorId = err.message;
          if (err.path[0] === 'accessKey') fieldErrors.accessKey = err.message;
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await api.post('/auth/login', {
        email: operatorId,
        password: accessKey,
        totpCode: totpCode,
      });

      if (response.data.success && response.data.data.mfaRequired) {
        setMfaRequired(true);
        setIsLoading(false);
        return;
      }

      const { token, user } = response.data.data;
      login(token, user);
      navigate('/dashboard');
    } catch (err: any) {
      setIsLoading(false);
      const errMsg = err.response?.data?.message || 'Authentication failed. Please verify credentials.';
      setAuthError(errMsg);
    }
  };

  return (
    <div className="min-h-screen bg-primary-bg text-[var(--text-main)] flex flex-col justify-center items-center p-4 sm:p-6 relative select-none">
      
      {/* Background Ambient Grid & Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/5 via-transparent to-transparent pointer-events-none z-0"></div>
      <div className="absolute w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      
      {/* Top Banner / Breadcrumb */}
      <div className="mb-6 sm:mb-8 flex items-center justify-center gap-3 sm:gap-4 z-10">
        <Link to="/" className="inline-flex items-center space-x-2 border border-border-primary/60 bg-secondary-bg/80 px-3.5 py-1.5 rounded font-mono text-[10px] tracking-wider text-slate-400 hover:text-white hover:border-accent-blue/55 transition-colors duration-200">
          <span>&larr; Back to Home</span>
        </Link>
        <button
          onClick={toggleTheme}
          className="inline-flex items-center justify-center border border-border-primary/60 bg-secondary-bg/80 p-2.5 rounded text-slate-400 hover:text-white hover:border-accent-blue/55 transition-all duration-200 outline-none cursor-pointer"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md bg-secondary-bg/80 border border-border-primary/60 rounded-lg overflow-hidden shadow-2xl relative z-10 transition-all duration-300">
        <div className="absolute inset-x-0 top-0 h-1 bg-accent-blue"></div>

        {/* Normal Login Form */}
        <div className="p-5 sm:p-8">
          {/* Header info */}
          <div className="text-center mb-6">
            <div className="inline-flex p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-3 shadow-lg">
              <img src="/favicon.svg" alt="AttriSense Logo" className="w-8 h-8 object-contain" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Secure Login</h2>
            <p className="text-slate-400 text-xs font-mono tracking-wider uppercase mt-1">
              Administrator Portal
            </p>
          </div>

          {authError && (
            <div className="mb-4 flex items-center space-x-2 border border-[#EF4444]/20 bg-[#EF4444]/15 text-[#EF4444] px-4 py-2.5 rounded text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            
            {!mfaRequired ? (
              <>
                {/* Operator ID Field */}
                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                    Corporate Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={operatorId}
                      onChange={(e) => {
                        setOperatorId(e.target.value);
                        if (errors.operatorId) setErrors((prev) => ({ ...prev, operatorId: undefined }));
                      }}
                      placeholder="admin@attrisense.ai"
                      className={`w-full bg-primary-bg border ${
                        errors.operatorId ? 'border-[#EF4444]' : 'border-border-primary/60 focus:border-accent-blue'
                      } rounded text-xs pl-9 pr-3 py-2.5 text-[var(--text-main)] placeholder-slate-600 focus:outline-none transition-colors duration-150 font-mono`}
                    />
                  </div>
                  {errors.operatorId && (
                    <span className="text-[10px] text-[#EF4444] font-mono">{errors.operatorId}</span>
                  )}
                </div>

                {/* Access Key Field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                      Password / Access Key
                    </label>
                    <span className="font-mono text-[9px] text-slate-500">256-BIT ENCRYPTED</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={accessKey}
                      onChange={(e) => {
                        setAccessKey(e.target.value);
                        if (errors.accessKey) setErrors((prev) => ({ ...prev, accessKey: undefined }));
                      }}
                      placeholder="••••••••••••"
                      className={`w-full bg-primary-bg border ${
                        errors.accessKey ? 'border-[#EF4444]' : 'border-border-primary/60 focus:border-accent-blue'
                      } rounded text-xs pl-9 pr-10 py-2.5 text-[var(--text-main)] placeholder-slate-600 focus:outline-none transition-colors duration-150 font-mono`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.accessKey && (
                    <span className="text-[10px] text-[#EF4444] font-mono">{errors.accessKey}</span>
                  )}
                </div>
              </>
            ) : (
              /* MFA TOTP input prompt */
              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center space-x-2 text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-3 py-2 rounded text-xs font-mono">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Password verified. Enter TOTP code.</span>
                </div>
                <label className="block font-mono text-[10px] text-slate-400 uppercase tracking-widest pt-2">
                  Authenticator Code (6-digit)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full bg-primary-bg border border-accent-blue rounded text-sm tracking-[0.3em] font-mono text-center py-2.5 text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent-blue hover:bg-blue-600 disabled:opacity-50 text-white font-mono text-xs uppercase tracking-wider py-3 rounded transition-all duration-150 flex items-center justify-center space-x-2 group cursor-pointer shadow-lg shadow-blue-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{mfaRequired ? 'Verify TOTP & Access' : 'Authenticate Access'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials helper */}
          <div className="mt-6 pt-4 border-t border-border-primary/60 text-center">
            <p className="text-[10px] font-mono text-slate-400 mb-2">Default Credentials:</p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setOperatorId('admin@attrisense.ai');
                  setAccessKey('Admin@123');
                }}
                className="text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded border border-border-primary/60 transition-colors cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setOperatorId('manager@attrisense.ai');
                  setAccessKey('Manager@123');
                }}
                className="text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded border border-border-primary/60 transition-colors cursor-pointer"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => {
                  setOperatorId('employee@attrisense.ai');
                  setAccessKey('Employee@123');
                }}
                className="text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded border border-border-primary/60 transition-colors cursor-pointer"
              >
                Employee
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Status Info */}
        <div className="bg-secondary-bg/50 border-t border-border-primary/60 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap gap-2 items-center justify-between font-mono text-[9px] text-slate-500 tracking-wider">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>Connection Secure</span>
          </div>
          <span>Security Certificate: Active</span>
        </div>
      </div>
    </div>
  );
}
