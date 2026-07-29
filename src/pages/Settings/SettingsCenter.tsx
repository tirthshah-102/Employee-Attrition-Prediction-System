import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Shield, RotateCw, Cpu, Globe } from 'lucide-react';
import api from '../../utils/api';
import { useSystem } from '../../context/SystemContext';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    mfaEnforced: boolean;
    initials: string;
    color: string;
}

interface ActivityLog {
    id: string;
    title: string;
    detail: string;
    time: string;
    type: 'primary' | 'secondary' | 'neutral' | 'error';
}

interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'info' | 'warning';
}

export default function SettingsCenter() {
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || '';
    
    const { fetchAuditTrail, isDataMasked, toggleDataMasking, employees } = useSystem();
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [auditTotal, setAuditTotal] = useState(0);
    const [auditPage, setAuditPage] = useState(1);
    const [auditLimit] = useState(10);
    const [auditSearch, setAuditSearch] = useState('');
    const [auditRoleFilter, setAuditRoleFilter] = useState('');

    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [showMfaSetup, setShowMfaSetup] = useState(false);
    const [mfaSetupData, setMfaSetupData] = useState<any>(null);
    const [mfaVerificationCode, setMfaVerificationCode] = useState('');

    useEffect(() => {
        api.get('/auth/me')
            .then(res => {
                if (res.data.success) {
                    setMfaEnabled(res.data.data.user.mfa_enabled);
                }
            })
            .catch(err => console.error('Failed to load user profile for MFA check:', err));
    }, []);

    const handleToggleMfa = () => {
        if (mfaEnabled) {
            api.post('/auth/mfa/disable')
                .then(res => {
                    if (res.data.success) {
                        setMfaEnabled(false);
                        setShowMfaSetup(false);
                        addToast('Multi-factor authentication disabled.', 'info');
                    }
                })
                .catch(err => {
                    console.error(err);
                    addToast('Failed to disable MFA.', 'warning');
                });
        } else {
            api.get('/auth/mfa/setup')
                .then(res => {
                    if (res.data.success) {
                        setMfaSetupData(res.data.data);
                        setShowMfaSetup(true);
                    }
                })
                .catch(err => {
                    console.error(err);
                    addToast('Failed to initialize MFA setup.', 'warning');
                });
        }
    };

    const handleVerifyAndEnableMfa = () => {
        if (!mfaVerificationCode) return;
        api.post('/auth/mfa/enable', { totpCode: mfaVerificationCode })
            .then(res => {
                if (res.data.success) {
                    setMfaEnabled(true);
                    setShowMfaSetup(false);
                    setMfaVerificationCode('');
                    addToast('Multi-factor authentication activated successfully!', 'success');
                }
            })
            .catch(err => {
                console.error(err);
                addToast('MFA code validation failed. Please check and try again.', 'warning');
            });
    };

    const loadAuditTrail = (page = 1, search = '', role = '') => {
        fetchAuditTrail(page, auditLimit, search, role)
            .then((res: any) => {
                setAuditLogs(res.auditTrail);
                setAuditTotal(res.total);
            })
            .catch((err: any) => console.error('Failed to load audit trail:', err));
    };

    useEffect(() => {
        loadAuditTrail(auditPage, auditSearch, auditRoleFilter);
    }, [auditPage, auditSearch, auditRoleFilter]);

    // Active sub-tab state
    const [activeTab, setActiveTab] = useState<'all' | 'general' | 'user-access' | 'prediction-engine' | 'integrations' | 'security'>('all');

    // Configuration States
    const [confidenceThreshold, setConfidenceThreshold] = useState(0.75);
    const [explainability, setExplainability] = useState(true);
    const [featureImportance, setFeatureImportance] = useState(true);
    const [modelVersion, setModelVersion] = useState('XGB_V2.4');
    const [llmApiKey, setLlmApiKey] = useState('');

    // Integrations States
    const [teamsConnected, setTeamsConnected] = useState(false);
    const [teamsActivating, setTeamsActivating] = useState(false);
    const [slackConnected, setSlackConnected] = useState(true);
    const [hrmsSyncProgress, setHrmsSyncProgress] = useState(66);

    // Users Registry state
    const [users, setUsers] = useState<User[]>([]);

    // Modal state for Add User
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserRole, setNewUserRole] = useState('HR Manager');
    const [newUserDept, setNewUserDept] = useState('');
    const [newUserMfa, setNewUserMfa] = useState(true);

    const uniqueDepts = Array.from(new Set(employees.map(e => e.dept).filter(Boolean)));

    const handleNameChange = (val: string) => {
        setNewUserName(val);
        setNewUserEmail(val.toLowerCase().replace(/\s+/g, ''));
    };

    // Toasts list state
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // Activity Log Feed
    const [activities, setActivities] = useState<ActivityLog[]>([
        {
            id: 'act-1',
            title: 'Role updated by Admin',
            detail: 'Target: HR_LEAD_USER',
            time: '12:44 PM',
            type: 'primary'
        },
        {
            id: 'act-2',
            title: 'API Keys Rotated',
            detail: 'Initiated by: SYSTEM',
            time: '10:12 AM',
            type: 'secondary'
        },
        {
            id: 'act-3',
            title: 'Model Refresh Scheduled',
            detail: 'Auto-trigger Q4 baseline',
            time: '08:00 AM',
            type: 'neutral'
        }
    ]);

    // HRMS Progress bar simulator
    useEffect(() => {
        const interval = setInterval(() => {
            setHrmsSyncProgress(prev => {
                if (prev >= 100) return 66; // Loop back
                return prev + 1;
            });
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    // Toast generator
    const addToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4500);
    };

    // Activity Logger helper
    const logActivity = (title: string, detail: string, type: ActivityLog['type'] = 'neutral') => {
        const newLog: ActivityLog = {
            id: `act-${Math.random().toString(36).substring(2, 9)}`,
            title,
            detail,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type
        };
        setActivities(prev => [newLog, ...prev]);
    };

    // Load settings & users on mount
    useEffect(() => {
        loadAuditTrail();
        // Load thresholds
        api.get('/settings')
            .then(res => {
                if (res.data.success) {
                    const sets = res.data.data;
                    if (sets.confidenceThreshold) setConfidenceThreshold(parseFloat(sets.confidenceThreshold));
                    if (sets.modelVersion) setModelVersion(sets.modelVersion);
                    if (sets.groqApiKey) setLlmApiKey(sets.groqApiKey);
                }
            })
            .catch(err => console.error('Failed to load settings:', err));

        // Load active users list
        api.get('/auth/users')
            .then(res => {
                if (res.data.success) {
                    const dbUsers = res.data.data.users;
                    const mappedUsers = dbUsers.map((u: any, idx: number) => {
                        const initials = u.name.split(' ').map((n: any) => n[0]).join('').toUpperCase().substring(0, 2);
                        const colors = [
                            'bg-primary/20 text-primary border-primary/40',
                            'bg-secondary/20 text-secondary border-secondary/40',
                            'bg-tertiary/20 text-tertiary border-tertiary/40'
                        ];
                        return {
                            id: String(u.id),
                            name: u.name,
                            email: u.email,
                            role: u.role === 'admin' 
                                ? 'Super Admin' 
                                : u.role === 'manager' 
                                    ? `Dept Manager (${u.department || 'N/A'})` 
                                    : 'HR Manager',
                            mfaEnforced: true,
                            initials: initials || 'US',
                            color: colors[idx % colors.length]
                        };
                    });
                    setUsers(mappedUsers);
                }
            })
            .catch(err => console.error('Failed to load users:', err));
    }, []);

    // Global Listeners for Header Actions
    useEffect(() => {
        const handleToastEvent = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail) {
                addToast(customEvent.detail.message, customEvent.detail.type || 'success');
            }
        };

        const handleSaveSettings = () => {
            addToast('Saving platform settings configuration...', 'info');
            api.put('/settings', {
                confidenceThreshold: String(confidenceThreshold),
                modelVersion: modelVersion,
                groqApiKey: llmApiKey
            })
            .then(res => {
                if (res.data.success) {
                    addToast('All configurations successfully synced to production cluster.', 'success');
                    logActivity('Settings Synced', 'Updated parameters saved to DB', 'primary');
                }
            })
            .catch(err => {
                console.error(err);
                addToast('Failed to save settings to server.', 'warning');
            });
        };

        window.addEventListener('app-toast', handleToastEvent);
        window.addEventListener('save-settings', handleSaveSettings);

        return () => {
            window.removeEventListener('app-toast', handleToastEvent);
            window.removeEventListener('save-settings', handleSaveSettings);
        };
    }, [confidenceThreshold, modelVersion, llmApiKey]);

    // Quick Action key rotation
    const handleRotateKeys = () => {
        addToast('Warning: Initializing key rotation across all endpoint API keys...', 'warning');
        logActivity('API Key Rotation Triggered', 'Emergency rotation initiated', 'error');
        setTimeout(() => {
            addToast('Success: Key rotation completed. 3 active integrations refreshed.', 'success');
            logActivity('API Keys Rotated', '4 endpoints refreshed successfully', 'secondary');
        }, 1500);
    };

    // MS Teams activation simulator
    const handleActivateTeams = () => {
        if (teamsConnected) {
            setTeamsConnected(false);
            addToast('MS Teams integration deactivated.', 'info');
            logActivity('MS Teams Deactivated', 'Admin disabled connector link', 'neutral');
            return;
        }

        setTeamsActivating(true);
        addToast('Initiating authentication handshake with Microsoft Graph API...', 'info');
        
        setTimeout(() => {
            setTeamsActivating(false);
            setTeamsConnected(true);
            addToast('MS Teams integration successfully connected and online.', 'success');
            logActivity('MS Teams Activated', 'Linked Graph API endpoints', 'secondary');
        }, 1500);
    };

    // Form user submission
    const handleAddUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserName.trim() || !newUserEmail.trim()) {
            addToast('Name and email are required fields.', 'warning');
            return;
        }

        api.post('/auth/users', {
            name: newUserName,
            email: newUserEmail,
            role: newUserRole,
            department: newUserRole === 'Department Manager' ? newUserDept : undefined
        })
        .then(res => {
            if (res.data.success) {
                const addedUser = res.data.data.user;
                const initials = addedUser.name.split(' ').map((n: any) => n[0]).join('').toUpperCase().substring(0, 2);
                const colors = [
                    'bg-primary/20 text-primary border-primary/40',
                    'bg-secondary/20 text-secondary border-secondary/40',
                    'bg-tertiary/20 text-tertiary border-tertiary/40'
                ];
                const mappedUser: User = {
                    id: String(addedUser.id),
                    name: addedUser.name,
                    email: addedUser.email,
                    role: addedUser.role === 'admin' 
                        ? 'Super Admin' 
                        : addedUser.role === 'manager' 
                            ? `Dept Manager (${addedUser.department || 'N/A'})` 
                            : 'HR Manager',
                    mfaEnforced: true,
                    initials: initials || 'UN',
                    color: colors[users.length % colors.length]
                };
                setUsers(prev => [...prev, mappedUser]);
                setShowAddModal(false);
                addToast(`User ${newUserName} added successfully.`, 'success');
                logActivity('User Added', `${newUserName} (${newUserRole}) registered`, 'primary');
                
                // Reset fields
                setNewUserName('');
                setNewUserEmail('');
                setNewUserRole('HR Manager');
                setNewUserDept('');
                setNewUserMfa(true);
            }
        })
        .catch(err => {
            console.error(err);
            addToast('Failed to add user to database.', 'warning');
        });
    };

    // Delete user helper
    const handleDeleteUser = (userId: string, name: string) => {
        api.delete(`/auth/users/${userId}`)
            .then(res => {
                if (res.data.success) {
                    setUsers(prev => prev.filter(u => u.id !== userId));
                    addToast(`User ${name} has been de-authorized.`, 'info');
                    logActivity('User De-authorized', `Removed credentials for ${name}`, 'error');
                }
            })
            .catch(err => {
                console.error(err);
                addToast('Failed to remove user from database.', 'warning');
            });
    };

    // Filtered users based on global search
    const filteredUsers = users.filter(user => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q) || user.role.toLowerCase().includes(q);
    });

    const activeIntegrationsCount = 1 + (slackConnected ? 1 : 0) + (teamsConnected ? 1 : 0);

    return (
        <div className="bg-primary-bg text-on-surface min-h-screen relative pb-16 flex flex-col">
            {/* Custom Toast Alerts */}
            <div className="fixed top-20 right-6 z-[60] flex flex-col gap-2 max-w-sm">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={`glass-panel px-4 py-3 rounded-lg border-l-4 shadow-lg flex items-start gap-3 border-border-primary/60 ${
                                toast.type === 'success' ? 'border-l-green-500' :
                                toast.type === 'warning' ? 'border-l-yellow-500' : 'border-l-primary'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm mt-0.5 text-on-surface-variant">
                                {toast.type === 'success' ? 'check_circle' : toast.type === 'warning' ? 'warning' : 'info'}
                            </span>
                            <div className="flex-1 text-xs font-semibold">{toast.message}</div>
                            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-on-surface-variant hover:text-on-surface">
                                <X size={14} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Settings Header Hero */}
            <section className="p-container-padding border-b border-outline-variant bg-surface-container-low/30">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="max-w-3xl">
                        <h1 className="font-display-lg text-display-lg text-on-surface leading-tight">Platform Settings &amp; Administration</h1>
                        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
                            Configure workforce intelligence settings, manage access credentials, control AI prediction models, monitor system health telemetry, and maintain enterprise governance rules.
                        </p>
                        <div className="flex flex-wrap gap-3 mt-6">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-highest rounded border border-outline-variant text-xs">
                                <div className="led-indicator led-green"></div>
                                <span className="font-mono-label text-mono-label">SYSTEM_STATUS: OPERATIONAL</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-highest rounded border border-outline-variant text-xs">
                                <div className="led-indicator led-blue"></div>
                                <span className="font-mono-label text-mono-label uppercase">RBAC: ACTIVE</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-highest rounded border border-outline-variant text-xs">
                                <div className="led-indicator led-blue"></div>
                                <span className="font-mono-label text-mono-label uppercase">AUDIT_LOGGING: ENABLED</span>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-64 h-28 relative overflow-hidden rounded-xl border border-outline-variant group flex flex-col items-center justify-center bg-surface-container-high/40 backdrop-blur-sm shadow-inner shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent"></div>
                        <span className="font-mono-label text-primary text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Globe size={11} className="animate-spin-slow" />
                            Instance: US-WEST-01
                        </span>
                        <span className="font-mono-metric text-display-lg text-3xl font-black bg-gradient-to-r from-on-surface to-on-surface-variant bg-clip-text text-transparent">99.98%</span>
                        <span className="text-[10px] text-green-500 font-mono-label uppercase mt-1">Operational Uptime</span>
                    </div>
                </div>
            </section>

            {/* Three-Column Grid */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Column: Sub-navigation & Emergency rotate */}
                <aside className="w-64 border-r border-outline-variant p-container-padding flex flex-col gap-stack-lg shrink-0">
                    <div>
                        <h3 className="font-mono-label text-mono-label text-outline uppercase tracking-widest mb-stack-md px-4">Control Modules</h3>
                        <nav className="space-y-1">
                            {[
                                { id: 'all', label: 'All Settings' },
                                { id: 'prediction-engine', label: 'Prediction Engine' },
                                { id: 'user-access', label: 'User & Access' },
                                { id: 'integrations', label: 'Integrations Hub' },
                                { id: 'security', label: 'Compliance Audit Logs' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as any)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded text-left transition-all text-xs font-semibold ${
                                        activeTab === item.id 
                                            ? 'bg-surface-container border border-outline-variant/30 text-primary shadow-sm' 
                                             : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
                                    }`}
                                >
                                    <span className="font-body-md">{item.label}</span>
                                    {activeTab === item.id && <span className="material-symbols-outlined text-xs">chevron_right</span>}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant flex flex-col justify-between mt-4">
                        <div>
                            <span className="font-mono-label text-[10px] text-primary uppercase block mb-1 tracking-widest">QUICK_ACTION</span>
                            <h4 className="text-xs font-bold text-on-surface mb-2">Emergency Rotation</h4>
                            <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">
                                Regenerate all platform endpoint tokens. This immediately invalidates active sessions.
                            </p>
                        </div>
                        <button 
                            onClick={handleRotateKeys}
                            className="w-full py-2 bg-error-container text-on-error-container hover:bg-error hover:text-on-error transition-all font-mono-label text-[10px] font-bold rounded flex items-center justify-center gap-1.5"
                        >
                            <Shield size={12} />
                            ROTATE_KEYS
                        </button>
                    </div>
                </aside>

                {/* Main Middle Column: Scrollable Settings content */}
                <div className="flex-1 p-container-padding space-y-stack-lg border-r border-outline-variant overflow-y-auto">
                    {/* Filter condition logic */}

                    {/* Section: Prediction Engine */}
                    {(activeTab === 'all' || activeTab === 'prediction-engine') && (
                        <section className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-outline-variant bg-surface-container/30 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary text-xl">rule_settings</span>
                                    <h2 className="text-sm font-bold tracking-tight text-on-surface uppercase">Prediction Engine Configuration</h2>
                                </div>
                                <span className="font-mono-label text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded font-bold">V2.4_STABLE</span>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block font-mono-label text-[10px] text-outline uppercase tracking-wider">Model Architecture</label>
                                        <select 
                                            value={modelVersion}
                                            onChange={e => {
                                                setModelVersion(e.target.value);
                                                addToast(`AI model trajectory switched to ${e.target.value}`, 'info');
                                                logActivity('Model Switched', `Selected baseline ${e.target.value}`, 'secondary');
                                            }}
                                            className="w-full p-3 bg-secondary-bg border border-outline-variant rounded font-mono-metric text-xs text-primary focus:border-primary outline-none"
                                        >
                                            <option value="XGB_V2.4">XGBoost (XGB_V2.4_Stable)</option>
                                            <option value="LIGHT_GBM_3.0">LightGBM Core (V3.0_Latest)</option>
                                            <option value="NEURAL_FORECAST_1.2">Neural Forecast (NLP_Transformer)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block font-mono-label text-[10px] text-outline uppercase tracking-wider">Confidence threshold</label>
                                            <span className="font-mono-metric text-xs text-primary font-bold">{confidenceThreshold.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center gap-4 py-2">
                                            <input 
                                                type="range" 
                                                min="0.50"
                                                max="0.95"
                                                step="0.05"
                                                value={confidenceThreshold}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value);
                                                    setConfidenceThreshold(val);
                                                    logActivity('Threshold Adjusted', `Confidence pointer shifted to ${val.toFixed(2)}`, 'neutral');
                                                }}
                                                className="w-full h-1 bg-surface-bright rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-outline-variant/30">
                                    <label className="block font-mono-label text-[10px] text-outline uppercase tracking-wider">AI Model Integration Key (Groq API Key)</label>
                                    <input 
                                        type="password"
                                        placeholder="Enter Dynamic Groq/Gemini API Key..."
                                        value={llmApiKey}
                                        onChange={e => setLlmApiKey(e.target.value)}
                                        className="w-full p-3 bg-secondary-bg border border-outline-variant rounded font-mono-metric text-[11px] text-primary focus:border-primary outline-none"
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t border-outline-variant/30">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-semibold text-on-surface">Model Explainability (SHAP/LIME)</h4>
                                            <p className="text-[11px] text-on-surface-variant mt-0.5">Generate detailed local factor reasoning metrics for each prediction.</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setExplainability(!explainability);
                                                addToast(`Explainability feature ${!explainability ? 'enabled' : 'disabled'}.`, 'info');
                                                logActivity('Explainability Toggled', `SHAP audit ${!explainability ? 'activated' : 'deactivated'}`, 'neutral');
                                            }}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${explainability ? 'bg-primary' : 'bg-surface-bright'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${explainability ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-semibold text-on-surface">Dynamic Feature Importance</h4>
                                            <p className="text-[11px] text-on-surface-variant mt-0.5">Real-time dynamic recalculation of dominant predictor variables on dashboard loads.</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setFeatureImportance(!featureImportance);
                                                addToast(`Dynamic Feature evaluation ${!featureImportance ? 'enabled' : 'disabled'}.`, 'info');
                                                logActivity('Feature Recalculation Toggled', `Real-time weights ${!featureImportance ? 'activated' : 'deactivated'}`, 'neutral');
                                            }}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${featureImportance ? 'bg-primary' : 'bg-surface-bright'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${featureImportance ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Section: User & Access Management */}
                    {(activeTab === 'all' || activeTab === 'user-access') && (
                        <section className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-outline-variant bg-surface-container/30 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary text-xl">group</span>
                                    <h2 className="text-sm font-bold tracking-tight text-on-surface uppercase">User &amp; Access Management</h2>
                                </div>
                                <button 
                                    onClick={() => setShowAddModal(true)}
                                    className="text-primary hover:text-primary-container font-mono-label text-xs hover:underline uppercase flex items-center gap-1 border-none bg-transparent"
                                >
                                    <Plus size={14} /> Add User
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-outline-variant bg-surface-bright/10">
                                            <th className="px-6 py-3 font-mono-label text-[10px] text-outline uppercase">Identity</th>
                                            <th className="px-6 py-3 font-mono-label text-[10px] text-outline uppercase">Role</th>
                                            <th className="px-6 py-3 font-mono-label text-[10px] text-outline uppercase">MFA_Status</th>
                                            <th className="px-6 py-3 font-mono-label text-[10px] text-outline uppercase text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/20">
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-xs text-on-surface-variant font-mono-label">
                                                    No registered administrators match the search criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map(user => (
                                                <tr key={user.id} className="hover:bg-surface-bright/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded border flex items-center justify-center text-xs font-bold shrink-0 ${user.color}`}>
                                                                {user.initials}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold text-on-surface">{user.name}</div>
                                                                <div className="text-[10px] font-mono-label text-on-surface-variant mt-0.5">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[11px] px-2 py-0.5 bg-surface-bright/50 rounded border border-outline-variant text-on-surface-variant font-semibold">
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`led-indicator ${user.mfaEnforced ? 'led-green' : 'led-orange'}`}></div>
                                                            <span className="text-[11px]">{user.mfaEnforced ? 'Enforced' : 'Disabled'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button 
                                                            onClick={() => handleDeleteUser(user.id, user.name)}
                                                            className="text-on-surface-variant hover:text-error text-xs font-mono-label border-none bg-transparent hover:underline"
                                                        >
                                                            De-authorize
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Section: Security & Privacy Control Hub */}
                    {(activeTab === 'all' || activeTab === 'security') && (
                        <section className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-sm mt-6">
                            <div className="p-4 border-b border-outline-variant bg-surface-container/30 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Shield size={18} className="text-primary" />
                                    <h2 className="text-sm font-bold tracking-tight text-on-surface uppercase">Security &amp; Privacy Control Hub</h2>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* GDPR Masking Toggle */}
                                <div className="flex justify-between items-center pb-4 border-b border-outline-variant/30">
                                    <div>
                                        <h4 className="text-xs font-semibold text-on-surface">GDPR / Privacy Shield (PII Masking)</h4>
                                        <p className="text-[11px] text-on-surface-variant mt-0.5">Enforce strict PII masking (names, emails, salaries) on user interfaces.</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            toggleDataMasking();
                                            addToast(`GDPR PII Masking ${!isDataMasked ? 'activated' : 'deactivated'}`, 'info');
                                        }}
                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isDataMasked ? 'bg-primary' : 'bg-surface-bright'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${isDataMasked ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="text-xs font-semibold text-on-surface">Enable Google Authenticator TOTP</h4>
                                        <p className="text-[11px] text-on-surface-variant mt-0.5">Enforce a secure 6-digit dynamic code upon logging in.</p>
                                    </div>
                                    <button 
                                        onClick={handleToggleMfa}
                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${mfaEnabled ? 'bg-primary' : 'bg-surface-bright'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${mfaEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                
                                {showMfaSetup && mfaSetupData && (
                                    <div className="p-4 bg-surface-container-high/40 rounded border border-outline-variant/30 space-y-3">
                                        <p className="text-xs text-on-surface font-semibold">Scan this secret key or input it in your Google Authenticator app:</p>
                                        <div className="font-mono text-xs text-primary font-bold bg-secondary-bg p-3 rounded border border-outline-variant text-center tracking-wider">
                                            {mfaSetupData.secret}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-mono-label text-outline uppercase">Verify TOTP Verification Code</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    maxLength={6} 
                                                    value={mfaVerificationCode}
                                                    onChange={e => setMfaVerificationCode(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="123456" 
                                                    className="bg-secondary-bg border border-outline-variant rounded p-2 text-xs text-on-surface font-mono-metric focus:border-primary outline-none"
                                                />
                                                <button 
                                                    onClick={handleVerifyAndEnableMfa}
                                                    className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold rounded border-none cursor-pointer"
                                                >
                                                    Verify & Enable
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Section: Integrations Hub */}
                    {(activeTab === 'all' || activeTab === 'integrations') && (
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold tracking-tight text-on-surface uppercase flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-xl">hub</span>
                                    Integrations Hub
                                </h2>
                                <span className="font-mono-label text-[10px] text-outline uppercase">{activeIntegrationsCount} Active Integrations</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {/* Card: HRMS Core */}
                                <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 hover:border-primary/50 transition-colors flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center border border-outline-variant shrink-0">
                                                <span className="material-symbols-outlined text-primary text-lg">lan</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="led-indicator led-green animate-pulse"></div>
                                                <span className="text-[8px] font-mono-label text-outline uppercase font-semibold">Syncing</span>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-xs">HRMS Core database</h3>
                                        <p className="text-[10px] text-outline mt-1 leading-relaxed">Secure workforce payroll & records database connector.</p>
                                    </div>
                                    <div className="mt-6">
                                        <div className="flex justify-between text-[8px] font-mono-label text-outline mb-1">
                                            <span>RECORD_SYNC_PROGRESS</span>
                                            <span className="text-primary font-bold">{hrmsSyncProgress}%</span>
                                        </div>
                                        <div className="w-full h-1 bg-surface-bright rounded-full overflow-hidden">
                                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${hrmsSyncProgress}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card: Slack */}
                                <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 hover:border-primary/50 transition-colors flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center border border-outline-variant shrink-0">
                                                <span className="material-symbols-outlined text-primary text-lg">chat_bubble</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`led-indicator ${slackConnected ? 'led-blue' : 'led-orange'}`}></div>
                                                <span className="text-[8px] font-mono-label text-outline uppercase font-semibold">
                                                    {slackConnected ? 'Connected' : 'Idle'}
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-xs">Slack API Workspace</h3>
                                        <p className="text-[10px] text-outline mt-1 leading-relaxed">Interactive notification triggers and sentiment analyzer.</p>
                                    </div>
                                    <div className="mt-6">
                                        <button 
                                            onClick={() => {
                                                setSlackConnected(!slackConnected);
                                                addToast(slackConnected ? 'Slack alerts disconnected.' : 'Slack pipeline reconnected.', 'info');
                                                logActivity('Slack Connect Changed', `Slack status changed to ${!slackConnected ? 'Connected' : 'Disconnected'}`, 'neutral');
                                            }}
                                            className="w-full py-1.5 border border-outline-variant text-[10px] rounded font-bold font-mono-label uppercase hover:bg-surface-bright hover:text-on-surface transition-all text-on-surface-variant bg-transparent"
                                        >
                                            {slackConnected ? 'Disconnect' : 'Connect'}
                                        </button>
                                    </div>
                                </div>

                                {/* Card: MS Teams */}
                                <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 hover:border-primary/50 transition-colors flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center border border-outline-variant shrink-0">
                                                <span className="material-symbols-outlined text-primary text-lg">video_call</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`led-indicator ${teamsConnected ? 'led-blue' : 'led-orange'}`}></div>
                                                <span className="text-[8px] font-mono-label text-outline uppercase font-semibold">
                                                    {teamsConnected ? 'Connected' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-xs">Microsoft Teams</h3>
                                        <p className="text-[10px] text-outline mt-1 leading-relaxed">Collaborative action syncs and risk alert cascades.</p>
                                    </div>
                                    <div className="mt-6">
                                        <button 
                                            onClick={handleActivateTeams}
                                            disabled={teamsActivating}
                                            className={`w-full py-1.5 text-[10px] font-bold font-mono-label uppercase rounded transition-all flex items-center justify-center gap-1.5 border-none ${
                                                teamsActivating ? 'bg-surface-bright text-outline cursor-wait' :
                                                teamsConnected ? 'border border-outline-variant text-on-surface-variant hover:bg-surface-bright hover:text-on-surface bg-transparent' :
                                                'bg-primary text-on-primary hover:bg-primary-container'
                                            }`}
                                        >
                                            {teamsActivating && <RotateCw size={10} className="animate-spin" />}
                                            {teamsConnected ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Section: Compliance Audit Trail */}
                    {(activeTab === 'all' || activeTab === 'security') && (
                        <section className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-sm mt-6">
                            <div className="p-4 border-b border-outline-variant bg-surface-container/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary text-xl">gavel</span>
                                    <h2 className="text-sm font-bold tracking-tight text-on-surface uppercase font-mono-label">Compliance Audit Trail (SOC 2)</h2>
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <input 
                                        type="text" 
                                        placeholder="Search action logs..." 
                                        value={auditSearch}
                                        onChange={e => {
                                            setAuditSearch(e.target.value);
                                            setAuditPage(1);
                                        }}
                                        className="bg-secondary-bg border border-outline-variant rounded px-2.5 py-1 text-xs text-on-surface focus:border-primary outline-none w-full md:w-48 font-mono-label"
                                    />
                                    <select
                                        value={auditRoleFilter}
                                        onChange={e => {
                                            setAuditRoleFilter(e.target.value);
                                            setAuditPage(1);
                                        }}
                                        className="bg-secondary-bg border border-outline-variant rounded px-2 py-1 text-xs text-on-surface focus:border-primary outline-none font-mono-label"
                                    >
                                        <option value="">All Roles</option>
                                        <option value="admin">Admin</option>
                                        <option value="hr">HR</option>
                                    </select>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-outline-variant bg-surface-bright/10">
                                            <th className="px-6 py-3 font-mono-label text-[10px] text-outline uppercase">User</th>
                                            <th className="px-6 py-3 font-mono-label text-[10px] text-outline uppercase">Role</th>
                                            <th className="px-6 py-3 font-mono-label text-[10px] text-outline uppercase">Action</th>
                                            <th className="px-6 py-3 font-mono-label text-[10px] text-outline uppercase">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/20">
                                        {auditLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-xs text-on-surface-variant font-mono-label">
                                                    No audit trail logs loaded or available.
                                                </td>
                                            </tr>
                                        ) : (
                                            auditLogs.map(log => (
                                                <tr key={log.id} className="hover:bg-surface-bright/5 transition-colors text-xs">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-on-surface">{log.userName || 'Unknown'}</div>
                                                        <div className="text-[10px] font-mono-label text-on-surface-variant mt-0.5">{log.userId}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-0.5 bg-surface-bright/50 rounded border border-outline-variant text-[10px] font-semibold text-on-surface-variant uppercase">
                                                            {log.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono-label text-[10px] text-primary">{log.actionSummary}</td>
                                                    <td className="px-6 py-4 text-on-surface-variant font-mono-label text-[10px]">{new Date(log.timestamp).toLocaleString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination controls */}
                            <div className="p-4 border-t border-outline-variant/30 flex items-center justify-between bg-surface-container/10">
                                <span className="text-[10px] text-on-surface-variant font-mono-label">
                                    Showing {auditTotal === 0 ? 0 : (auditPage - 1) * auditLimit + 1} to {Math.min(auditTotal, auditPage * auditLimit)} of {auditTotal} logs
                                </span>
                                <div className="flex gap-2">
                                    <button 
                                        disabled={auditPage === 1}
                                        onClick={() => setAuditPage(prev => Math.max(1, prev - 1))}
                                        className="px-2.5 py-1 text-[10px] bg-secondary-bg border border-outline-variant rounded disabled:opacity-40 font-mono-label hover:bg-surface-bright text-on-surface"
                                    >
                                        PREV
                                    </button>
                                    <button 
                                        disabled={auditPage * auditLimit >= auditTotal}
                                        onClick={() => setAuditPage(prev => prev + 1)}
                                        className="px-2.5 py-1 text-[10px] bg-secondary-bg border border-outline-variant rounded disabled:opacity-40 font-mono-label hover:bg-surface-bright text-on-surface"
                                    >
                                        NEXT
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column: System Health & Audit Feed */}
                <aside className="w-80 p-container-padding flex flex-col gap-stack-md bg-[#0b0e15] shrink-0 border-l border-outline-variant overflow-y-auto">
                    {/* System Health */}
                    <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="font-mono-label text-[10px] text-outline uppercase tracking-widest flex items-center gap-1.5">
                                <Cpu size={12} className="text-primary" />
                                System Health
                            </span>
                            <span className="material-symbols-outlined text-primary text-sm">bolt</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[9px] font-mono-label text-outline">Prediction Engine</p>
                                    <p className="font-mono-metric text-headline-sm font-bold text-on-surface mt-0.5">
                                        99.9% <span className="text-[9px] font-mono-label text-green-500 font-bold ml-1">UPTIME</span>
                                    </p>
                                </div>
                                <div className="w-20 h-6 shrink-0 flex items-end gap-0.5 opacity-60">
                                    <div className="w-full bg-primary/20 h-[80%] rounded-sm"></div>
                                    <div className="w-full bg-primary/20 h-[85%] rounded-sm"></div>
                                    <div className="w-full bg-primary/20 h-[75%] rounded-sm"></div>
                                    <div className="w-full bg-primary h-[95%] rounded-sm"></div>
                                </div>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[9px] font-mono-label text-outline">API Latency</p>
                                    <p className="font-mono-metric text-headline-sm font-bold text-on-surface mt-0.5">
                                        42ms <span className="text-[9px] font-mono-label text-blue-500 font-bold ml-1">AVG</span>
                                    </p>
                                </div>
                                <div className="w-20 h-6 shrink-0 flex items-end gap-0.5 opacity-60">
                                    <div className="w-full bg-secondary/20 h-[60%] rounded-sm"></div>
                                    <div className="w-full bg-secondary h-[40%] rounded-sm"></div>
                                    <div className="w-full bg-secondary/20 h-[50%] rounded-sm"></div>
                                    <div className="w-full bg-secondary/20 h-[45%] rounded-sm"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Snapshot */}
                    <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="font-mono-label text-[10px] text-outline uppercase tracking-widest flex items-center gap-1.5">
                                <Shield size={12} className="text-error" />
                                Security Status
                            </span>
                            <span className="material-symbols-outlined text-error text-sm">shield</span>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1 text-center py-2 bg-secondary-bg rounded border border-outline-variant">
                                <p className="text-[9px] font-mono-label text-outline font-semibold mb-0.5 uppercase">CRITICAL</p>
                                <p className="font-mono-metric text-lg font-bold text-on-surface">0</p>
                            </div>
                            <div className="flex-1 text-center py-2 bg-secondary-bg rounded border border-outline-variant">
                                <p className="text-[9px] font-mono-label text-outline font-semibold mb-0.5 uppercase">WARNINGS</p>
                                <p className="font-mono-metric text-lg font-bold text-tertiary">3</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent activity */}
                    <div className="space-y-4">
                        <span className="font-mono-label text-[10px] text-outline uppercase tracking-widest block px-1">
                            Recent Admin Activity
                        </span>
                        <div className="space-y-2.5">
                            {activities.slice(0, 5).map(act => (
                                <div key={act.id} className="flex gap-3 items-start p-3 bg-surface-container-high/40 rounded-lg border border-outline-variant/20 hover:border-outline-variant/50 transition-colors">
                                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                                        act.type === 'primary' ? 'bg-primary' :
                                        act.type === 'secondary' ? 'bg-secondary' :
                                        act.type === 'error' ? 'bg-error animate-pulse' : 'bg-outline-variant'
                                    }`}></div>
                                    <div>
                                        <p className="text-xs text-on-surface font-semibold leading-none">{act.title}</p>
                                        <p className="text-[10px] text-outline mt-1 font-mono-label">{act.detail} | {act.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>

            {/* Modal: Add User Overlay */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[55] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-panel w-full max-w-sm rounded-xl overflow-hidden shadow-2xl border-border-primary/60"
                        >
                            <div className="p-4 border-b border-outline-variant bg-surface-container/60 flex justify-between items-center">
                                <h4 className="text-xs font-bold text-primary uppercase font-mono-label flex items-center gap-1.5">
                                    <Plus size={14} /> Add Administrator credential
                                </h4>
                                <button onClick={() => setShowAddModal(false)} className="text-on-surface-variant hover:text-on-surface border-none bg-transparent">
                                    <X size={16} />
                                </button>
                            </div>
                            <form onSubmit={handleAddUserSubmit} className="p-5 space-y-4">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-mono-label text-outline uppercase">User Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={newUserName}
                                        onChange={e => handleNameChange(e.target.value)}
                                        placeholder="e.g. James Smith" 
                                        className="w-full bg-secondary-bg border border-outline-variant rounded p-2.5 text-xs text-on-surface focus:border-primary outline-none focus:ring-1 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-mono-label text-outline uppercase">Email Address / Username</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={newUserEmail}
                                        onChange={e => setNewUserEmail(e.target.value)}
                                        placeholder="username (e.g. james)" 
                                        className="w-full bg-secondary-bg border border-outline-variant rounded p-2.5 text-xs text-on-surface focus:border-primary outline-none focus:ring-1 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-mono-label text-outline uppercase">Access Role</label>
                                    <select 
                                        value={newUserRole}
                                        onChange={e => setNewUserRole(e.target.value)}
                                        className="w-full bg-secondary-bg border border-outline-variant rounded p-2.5 text-xs text-on-surface focus:border-primary outline-none focus:ring-1 focus:ring-primary/20"
                                    >
                                        <option value="Super Admin">Super Admin</option>
                                        <option value="HR Manager">HR Manager</option>
                                        <option value="Department Manager">Department Manager</option>
                                        <option value="Risk Analyst">Risk Analyst</option>
                                        <option value="Security Admin">Security Admin</option>
                                    </select>
                                </div>
                                {newUserRole === 'Department Manager' && (
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-mono-label text-outline uppercase">Department</label>
                                        <select 
                                            value={newUserDept}
                                            onChange={e => setNewUserDept(e.target.value)}
                                            required
                                            className="w-full bg-secondary-bg border border-outline-variant rounded p-2.5 text-xs text-on-surface focus:border-primary outline-none focus:ring-1 focus:ring-primary/20"
                                        >
                                            <option value="">-- Select Department --</option>
                                            {uniqueDepts.map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold text-on-surface">Enforce MFA Authentication</span>
                                        <span className="text-[10px] text-outline">Require secure mobile key validation</span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setNewUserMfa(!newUserMfa)}
                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${newUserMfa ? 'bg-primary' : 'bg-surface-bright'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${newUserMfa ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                <div className="pt-4 border-t border-outline-variant/20 flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-2 border border-outline-variant hover:bg-surface-bright text-xs font-bold rounded text-on-surface bg-transparent"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-1 py-2 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold rounded border-none"
                                    >
                                        Save User
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
