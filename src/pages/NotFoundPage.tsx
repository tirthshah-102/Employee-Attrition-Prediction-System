import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft, Home } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-bg font-sans p-8">
      <div className="max-w-md w-full text-center">
        
        {/* Glowing 404 badge */}
        <div className="mx-auto w-20 h-20 rounded-full bg-status-danger/10 border border-status-danger/20 flex items-center justify-center mb-6">
          <ShieldOff className="w-9 h-9 text-status-danger" />
        </div>

        {/* Code */}
        <p className="font-mono text-5xl font-extrabold text-[var(--text-main)] tracking-tight mb-2">
          404
        </p>

        {/* Title */}
        <h1 className="text-lg font-bold text-[var(--text-main)] mb-2">
          Route Not Found
        </h1>

        {/* Description */}
        <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed max-w-xs mx-auto">
          The requested endpoint does not exist in the system registry. 
          Verify the URL or navigate back to a known module.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-border-primary bg-elevated-bg text-slate-300 font-mono text-[10px] uppercase tracking-wider font-semibold hover:bg-secondary-bg hover:text-slate-100 transition-all duration-150 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-accent-blue/30 bg-accent-blue/10 text-accent-blue font-mono text-[10px] uppercase tracking-wider font-semibold hover:bg-accent-blue/20 transition-all duration-150 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
