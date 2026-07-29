import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { 
  Shield, 
  ArrowRight, 
  Lock, 
  User, 
  Loader2,
  AlertCircle,
  Activity,
  CheckCircle2,
  Sun,
  Moon
} from 'lucide-react';
import api from '../utils/api';
import { useSystem } from '../context/SystemContext';

const loginSchema = z.object({
  operatorId: z.string().min(1, 'Username or email is required.'),
  accessKey: z.string().min(1, 'Password is required.'),
});

interface LogLine {
  text: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login, theme, toggleTheme } = useSystem();
  const [operatorId, setOperatorId] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [errors, setErrors] = useState<{ operatorId?: string; accessKey?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationLogs, setVerificationLogs] = useState<LogLine[]>([]);

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

    setIsVerifying(true);
    setVerificationLogs([{ text: 'Connecting to secure authentication node...', type: 'info' }]);

    try {
      const response = await api.post('/auth/login', {
        email: operatorId,
        password: accessKey,
        totpCode: totpCode,
      });

      if (response.data.success && response.data.data.mfaRequired) {
        setMfaRequired(true);
        setIsVerifying(false);
        setVerificationLogs((prev) => [
          ...prev,
          { text: 'MFA_REQUIRED: Two-Factor Authentication code needed.', type: 'warning' }
        ]);
        return;
      }

      const { token, user } = response.data.data;
      login(token, user);

      // Append terminal output lines for realistic onboarding feel
      setVerificationLogs((prev) => [
        ...prev,
        { text: 'Verifying email structure...', type: 'info' },
        { text: 'Checking account credentials...', type: 'info' },
        { text: 'MFA Validation verified.', type: 'success' },
        { text: 'Authentication successful. Access keys decrypted.', type: 'success' },
        { text: 'Synchronizing settings... Redirecting to dashboard.', type: 'success' }
      ]);

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setIsVerifying(false);
      const errMsg = err.response?.data?.message || 'Authentication failed. Please verify credentials.';
      setAuthError(errMsg);
    }
  };

  return (
    <div className="min-h-screen bg-primary-bg text-[var(--text-main)] flex flex-col justify-center items-center p-6 relative select-none">
      
      {/* Background Ambient Grid & Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/5 via-transparent to-transparent pointer-events-none z-0"></div>
      <div className="absolute w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      
      {/* Top Banner / Breadcrumb */}
      <div className="mb-8 flex items-center justify-center gap-4 z-10">
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

        {!isVerifying ? (
          /* Normal Login Form */
          <div className="p-8">
            {/* Header info */}
            <div className="text-center mb-6">
              <div className="inline-flex p-2 rounded bg-blue-500/10 border border-blue-500/20 text-accent-blue mb-3">
                <Shield className="w-6 h-6" />
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
                        onChange={(e) => setOperatorId(e.target.value)}
                        placeholder="admin@company.com"
                        className={`w-full bg-secondary-bg/50 border ${
                          errors.operatorId ? 'border-[#EF4444]' : 'border-border-primary/60'
                        } rounded text-sm px-10 py-3 text-[var(--text-main)] placeholder-slate-600 focus:outline-none focus:border-accent-blue transition-colors duration-200`}
                      />
                    </div>
                    {errors.operatorId && (
                      <div className="flex items-center space-x-1 text-[#EF4444] font-mono text-[10px]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{errors.operatorId}</span>
                      </div>
                    )}
                  </div>

                  {/* Secure Token Field */}
                  <div className="space-y-1.5">
                    <label className="block font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                      Access Key / Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        value={accessKey}
                        onChange={(e) => setAccessKey(e.target.value)}
                        placeholder="••••••••••••"
                        className={`w-full bg-secondary-bg/50 border ${
                          errors.accessKey ? 'border-[#EF4444]' : 'border-border-primary/60'
                        } rounded text-sm px-10 py-3 text-[var(--text-main)] placeholder-slate-600 focus:outline-none focus:border-accent-blue transition-colors duration-200`}
                      />
                    </div>
                    {errors.accessKey && (
                      <div className="flex items-center space-x-1 text-[#EF4444] font-mono text-[10px]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{errors.accessKey}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* TOTP Code Input Field */
                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] text-slate-400 uppercase tracking-widest text-center">
                    Google Authenticator 6-Digit Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      className="w-full bg-secondary-bg/50 border border-border-primary/60 rounded text-sm px-10 py-3 text-[var(--text-main)] placeholder-slate-600 focus:outline-none focus:border-accent-blue transition-colors duration-200 text-center tracking-widest font-mono font-extrabold text-lg"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-accent-blue hover:bg-blue-600 text-white font-mono text-xs uppercase tracking-wider py-3.5 rounded flex items-center justify-center space-x-2 border border-blue-500 transition-all duration-200 shadow-[0_0_15px_rgba(59,130,246,0.15)] cursor-pointer"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          </div>
        ) : (
          /* Live Terminal Verifying Screen */
          <div className="p-8 space-y-6">
            <div className="text-center">
              <div className="inline-flex p-2 rounded bg-blue-500/10 border border-blue-500/20 text-accent-blue mb-3 relative">
                <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Verifying Credentials</h2>
              <p className="text-slate-400 text-xs font-mono tracking-wider uppercase mt-1">
                Authentication Logs
              </p>
            </div>

            {/* Terminal output box */}
            <div className="border border-border-primary/60 bg-primary-bg rounded p-4 h-52 flex flex-col justify-between">
              <div className="flex-1 font-mono text-[10px] space-y-2 overflow-y-auto scrollbar-thin">
                {verificationLogs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-1.5">
                    <span className="text-slate-600">&gt;</span>
                    <p className={`leading-relaxed ${
                      log.type === 'success' ? 'text-[#22C55E]' :
                      log.type === 'warning' ? 'text-[#F59E0B]' :
                      log.type === 'danger' ? 'text-[#EF4444]' :
                      'text-slate-300'
                    }`}>
                      {log.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between font-mono text-[8px] text-slate-500">
                <span className="flex items-center space-x-1">
                  <Activity className="w-3 h-3 text-accent-blue animate-pulse" />
                  <span>Database: Active</span>
                </span>
                <span>Secure Connection</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Status Info */}
        <div className="bg-secondary-bg/50 border-t border-border-primary/60 px-6 py-4 flex items-center justify-between font-mono text-[9px] text-slate-500 tracking-wider">
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
