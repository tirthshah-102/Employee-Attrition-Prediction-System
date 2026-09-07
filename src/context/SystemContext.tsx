import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../components/ToastProvider';

export interface Employee {
  id: string;
  name: string;
  email: string;
  dept: string;
  role: string;
  tenure: string;
  probability: number;
  status: 'High' | 'Medium' | 'Low';
  primaryFactor: string;
  overtimeHrs: number;
  salaryGap: number; 
  managerFeedback: number; 
  growthIndex: number; 
  playbookStatus: 'Ready' | 'In Progress' | 'Executed';
  location: string;
  dateHired: string;
  rating: number;
  managerNotes?: string;
  organizationId?: string;
  managerId?: string;
}

export interface LogEntry {
  id?: number;
  source: string;
  text: string;
  type: string;
  employee_id?: string;
  timestamp?: string;
}

interface SystemContextProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  agentLogs: LogEntry[];
  deployingPlaybook: string | null;
  deployLogs: string[];
  isRegistering: boolean;
  registerLogs: string[];
  triggerPlaybook: (empId: string) => void;
  registerEmployee: (empData: Omit<Employee, 'id' | 'status' | 'primaryFactor' | 'managerFeedback' | 'growthIndex' | 'playbookStatus' | 'rating' | 'location' | 'dateHired' | 'probability'>) => Promise<boolean>;
  
  // Authentication properties
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
  fetchEmployees: () => Promise<void>;
  


  // Employee survey portal
  submitPulseSurvey: (surveyData: {
    workloadSatisfaction: number;
    growthSatisfaction: number;
    compSatisfaction: number;
    managerScore: number;
    workLifeBalance: number;
    comments?: string;
  }) => Promise<boolean>;

  // Pre-Hiring Simulator
  simulateCandidate: (candidateData: {
    salaryGap: number;
    overtimeHrs: number;
    expectedManagerScore: number;
    expectedGrowthIndex: number;
    priorTenureYrs: number;
  }) => Promise<any>;

  // Retention Metrics Tracker
  fetchRetentionMetrics: () => Promise<any>;

  // Audit Logs
  fetchAuditTrail: (page?: number, limit?: number, search?: string, role?: string) => Promise<{ auditTrail: any[], total: number }>;

  // GDPR/Privacy Data Masking
  isDataMasked: boolean;
  toggleDataMasking: () => void;

  // Global Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const SystemContext = createContext<SystemContextProps | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('attrisense_token'));
  const [user, setUser] = useState<any | null>(() => {
    const saved = localStorage.getItem('attrisense_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [agentLogs, setAgentLogs] = useState<LogEntry[]>([]);

  // Global Application Theme
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('attrisense_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    localStorage.setItem('attrisense_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Playbook Simulation State
  const [deployingPlaybook, setDeployingPlaybook] = useState<string | null>(null);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [playbookStep, setPlaybookStep] = useState(0);

  // Ingestion Simulation State
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerLogs, setRegisterLogs] = useState<string[]>([]);
  const [registerStep, setRegisterStep] = useState(0);
  const [pendingEmployee, setPendingEmployee] = useState<Employee | null>(null);

  const isAuthenticated = !!token;

  // Clear auth session
  const login = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('attrisense_token', newToken);
    localStorage.setItem('attrisense_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setEmployees([]);
    localStorage.removeItem('attrisense_token');
    localStorage.removeItem('attrisense_user');
  };

  // Listen to authorization expiration events
  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  // Fetch employees list from Flask API
  const fetchEmployees = async () => {
    if (!token) return;
    try {
      const response = await api.get('/employees?limit=1000');
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Sync employees on authentication status change
  useEffect(() => {
    if (isAuthenticated) {
      fetchEmployees();
    } else {
      setEmployees([]);
    }
  }, [token]);

  // Fetch telemetry logs from backend
  const fetchLogs = async () => {
    if (!token) return;
    try {
      const response = await api.get('/agent-logs?limit=25');
      if (response.data.success) {
        setAgentLogs(response.data.data.logs);
      }
    } catch (error) {
      console.error('Error fetching agent logs:', error);
    }
  };

  // Listen to Server-Sent Events (SSE) telemetry log stream
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchLogs(); // load initial logs

    const sseBase = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1').replace(/\/+$/, '');
    const eventSource = new EventSource(`${sseBase}/agent-logs/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'connected' || data.ping) return;

        // Append new log to state
        setAgentLogs(prev => {
          if (prev.some(log => log.id === data.id)) return prev;
          const updated = [...prev, data];
          if (updated.length > 50) return updated.slice(updated.length - 50);
          return updated;
        });
      } catch (err) {
        console.error('Error parsing SSE telemetry event:', err);
      }
    };

    eventSource.onerror = () => {
      // Gracefully handle disconnects without flooding console when offline or backend restarting
      if (eventSource.readyState === EventSource.CLOSED) {
        eventSource.close();
      }
    };

    return () => {
      eventSource.close();
    };
  }, [isAuthenticated]);

  // Ingestion ticker for animation sync
  useEffect(() => {
    if (!isRegistering || registerStep === 0 || !pendingEmployee) return;

    const registrationLogs = [
      `[1/5] Saving employee profile for ID: ${pendingEmployee.id}...`,
      `[2/5] Saving employee metrics...`,
      '[3/5] Setting up communication channels...',
      '[4/5] Calculating starting risk level...',
      '[SUCCESS] Registration complete.'
    ];

    if (registerStep > registrationLogs.length) {
      const timeout = setTimeout(() => {
        setEmployees(prev => [pendingEmployee, ...prev]);
        setIsRegistering(false);
        setRegisterStep(0);
        setRegisterLogs([]);
        setPendingEmployee(null);
        fetchLogs();
      }, 200);
      return () => clearTimeout(timeout);
    }

    const timer = setTimeout(() => {
      setRegisterLogs(prev => [...prev, registrationLogs[registerStep - 1]]);
      setRegisterStep(prev => prev + 1);
    }, 150);

    return () => clearTimeout(timer);
  }, [isRegistering, registerStep, pendingEmployee]);

  // Playbook ticker for animation sync
  useEffect(() => {
    if (!deployingPlaybook || playbookStep === 0) return;
    const emp = employees.find(e => e.id === deployingPlaybook);
    if (!emp) return;

    const steps = [
      `[1/4] Reviewing risk factors for ${emp.primaryFactor}...`,
      '[2/4] Creating action plan...',
      '[3/4] Notifying department manager...',
      '[SUCCESS] Action plan applied. Risk is lowering.'
    ];

    if (playbookStep > steps.length) {
      const timeout = setTimeout(() => {
        fetchEmployees();
        setDeployingPlaybook(null);
        setPlaybookStep(0);
        setDeployLogs([]);
        fetchLogs();
      }, 200);
      return () => clearTimeout(timeout);
    }

    const timer = setTimeout(() => {
      setDeployLogs(prev => [...prev, steps[playbookStep - 1]]);
      setPlaybookStep(prev => prev + 1);
    }, 150);

    return () => clearTimeout(timer);
  }, [deployingPlaybook, playbookStep, employees]);

  // Trigger Playbook Execution
  const triggerPlaybook = async (empId: string) => {
    try {
      const response = await api.post(`/employees/${empId}/playbook`);
      if (response.data.success) {
        setDeployingPlaybook(empId);
        setDeployLogs(['Preparing playbook...']);
        setPlaybookStep(1);
      }
    } catch (error: any) {
      console.error('Error triggering playbook:', error);
      showToast(error.response?.data?.message || 'Failed to trigger action plan.', 'error');
    }
  };

  // Register New Employee
  const registerEmployee = async (
    empData: Omit<Employee, 'id' | 'status' | 'primaryFactor' | 'managerFeedback' | 'growthIndex' | 'playbookStatus' | 'rating' | 'location' | 'dateHired' | 'probability'>
  ): Promise<boolean> => {
    try {
      const response = await api.post('/employees', {
        name: empData.name,
        email: empData.email,
        dept: empData.dept,
        role: empData.role,
        tenure: empData.tenure,
        overtimeHrs: empData.overtimeHrs,
        salaryGap: empData.salaryGap,
      });

      if (response.data.success) {
        const newEmp = response.data.data.employee;
        setPendingEmployee(newEmp);
        setIsRegistering(true);
        setRegisterLogs(['[1/5] Opening database connection...']);
        setRegisterStep(1);

        // Ensure employees state is immediately refreshed from DB
        await fetchEmployees();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error registering employee:', error);
      showToast(error.response?.data?.message || 'Failed to register employee.', 'error');
      return false;
    }
  };



  // ── Pulse Survey submission ───────────────────────────────────────────────
  const submitPulseSurvey = async (surveyData: {
    workloadSatisfaction: number;
    growthSatisfaction: number;
    compSatisfaction: number;
    managerScore: number;
    workLifeBalance: number;
    comments?: string;
  }): Promise<boolean> => {
    try {
      const response = await api.post('/employees/pulse-survey', surveyData);
      if (response.data.success) {
        await fetchEmployees();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error submitting pulse survey:', error);
      showToast(error.response?.data?.message || 'Failed to submit survey feedback.', 'error');
      return false;
    }
  };

  // ── Pre-Hiring Simulator ──────────────────────────────────────────────────
  const simulateCandidate = async (candidateData: {
    salaryGap: number;
    overtimeHrs: number;
    expectedManagerScore: number;
    expectedGrowthIndex: number;
    priorTenureYrs: number;
  }): Promise<any> => {
    try {
      const response = await api.post('/analytics/pre-hiring-simulate', candidateData);
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error simulating candidate risk:', error);
      return null;
    }
  };

  // ── Retention Metrics Tracker ─────────────────────────────────────────────
  const fetchRetentionMetrics = async (): Promise<any> => {
    try {
      const response = await api.get('/analytics/retention-tracker');
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching retention tracking data:', error);
      return null;
    }
  };

  // GDPR Data Masking state
  const [isDataMasked, setIsDataMasked] = useState<boolean>(() => {
    return localStorage.getItem('attrisense_masking') === 'true';
  });

  const toggleDataMasking = () => {
    setIsDataMasked(prev => {
      const next = !prev;
      localStorage.setItem('attrisense_masking', String(next));
      return next;
    });
  };

  // ── IT Audit Logs ─────────────────────────────────────────────────────────
  const fetchAuditTrail = async (page = 1, limit = 15, search = '', role = ''): Promise<{ auditTrail: any[], total: number }> => {
    try {
      const response = await api.get(`/settings/audit-trail`, {
        params: { page, limit, search, role }
      });
      if (response.data.success) {
        return {
          auditTrail: response.data.data.auditTrail,
          total: response.data.data.total
        };
      }
      return { auditTrail: [], total: 0 };
    } catch (error) {
      console.error('Error fetching compliance audit trail logs:', error);
      return { auditTrail: [], total: 0 };
    }
  };

  return (
    <SystemContext.Provider value={{
      employees,
      setEmployees,
      agentLogs,
      deployingPlaybook,
      deployLogs,
      isRegistering,
      registerLogs,
      triggerPlaybook,
      registerEmployee,
      token,
      user,
      isAuthenticated,
      login,
      logout,
      fetchEmployees,
      submitPulseSurvey,
      simulateCandidate,
      fetchRetentionMetrics,
      fetchAuditTrail,
      isDataMasked,
      toggleDataMasking,
      theme,
      toggleTheme
    }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};
