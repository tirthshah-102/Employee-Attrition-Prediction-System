import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { 
  Search, 
  ChevronDown, 
  Plus, 
  Loader2,
  Trash2,
  UploadCloud,
  FileText
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import api from '../utils/api';
import { maskName, maskEmail } from '../utils/mask';

// Zod Schema for Adding Employee
const addEmployeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  dept: z.string().min(1, 'Department is required.'),
  role: z.string().min(2, 'Role must be at least 2 characters.'),
  tenure: z.string().min(1, 'Tenure is required (e.g. "1.5 yrs").'),
  salaryGap: z.number().min(-50, 'Minimum boundary is -50%').max(50, 'Maximum boundary is 50%'),
  overtimeHrs: z.number().min(0, 'Cannot be negative').max(40, 'Limit is 40 hrs/week')
});

export function EmployeeListPage() {
  const navigate = useNavigate();
  const { 
    employees, 
    setEmployees,
    fetchEmployees,
    registerEmployee, 
    isRegistering, 
    registerLogs,
    isDataMasked
  } = useSystem();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const [directoryView, setDirectoryView] = useState<'browse' | 'add' | 'bulk'>('browse');

  // Bulk Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(sortedEmployees.map(emp => emp.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectIndividual = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleDeleteIndividual = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this employee and all their data from database?")) {
      return;
    }
    try {
      const res = await api.delete(`/employees/${id}`);
      if (res.data.success) {
        setEmployees(prev => prev.filter(e => e.id !== id));
        setSelectedIds(prev => prev.filter(item => item !== id));
        window.dispatchEvent(new CustomEvent("app-toast", {
          detail: { message: "Employee permanently deleted from database.", type: "success" }
        }));
        fetchEmployees();
      }
    } catch (err: any) {
      console.error(err);
      window.dispatchEvent(new CustomEvent("app-toast", {
        detail: { message: err.response?.data?.message || "Failed to delete employee.", type: "warning" }
      }));
    }
  };

  const handleDeleteBulk = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete all ${selectedIds.length} selected employees from database?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await api.post("/employees/bulk-delete", { employee_ids: selectedIds });
      if (res.data.success) {
        const deletedSet = new Set(selectedIds);
        setEmployees(prev => prev.filter(e => !deletedSet.has(e.id)));
        setSelectedIds([]);
        window.dispatchEvent(new CustomEvent("app-toast", {
          detail: { message: `Successfully deleted ${res.data.data.deletedCount} employees permanently.`, type: "success" }
        }));
        fetchEmployees();
      }
    } catch (err: any) {
      console.error(err);
      window.dispatchEvent(new CustomEvent("app-toast", {
        detail: { message: err.response?.data?.message || "Failed to bulk delete employees.", type: "warning" }
      }));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    const fname = file.name.toLowerCase();
    if (fname.endsWith(".pdf")) {
      setPreviewRows([
        { "Document": file.name, "Format": "PDF Document", "Size": `${(file.size / 1024).toFixed(1)} KB`, "Status": "AI Roster Parsing Ready" }
      ]);
      return;
    }
    if (fname.endsWith(".xlsx") || fname.endsWith(".xls")) {
      setPreviewRows([
        { "Document": file.name, "Format": "Excel Spreadsheet", "Size": `${(file.size / 1024).toFixed(1)} KB`, "Status": "Structured Sheet Parsing Ready" }
      ]);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return;
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const parsed = lines.slice(1).map(line => {
        const parts = line.split(",").map(p => p.trim().replace(/"/g, ''));
        const obj: any = {};
        headers.forEach((h, idx) => {
          obj[h] = parts[idx] || "";
        });
        return obj;
      });
      setPreviewRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await api.post('/employees/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const data = res.data;
      if (data.success) {
        window.dispatchEvent(new CustomEvent("app-toast", {
          detail: { message: `Import Success: Registered ${data.data.importedCount} employees.`, type: "success" }
        }));
        setSelectedFile(null);
        setPreviewRows([]);
        setDirectoryView('browse');
        await fetchEmployees();
      } else {
        window.dispatchEvent(new CustomEvent("app-toast", {
          detail: { message: data.message || "Failed to bulk import roster.", type: "warning" }
        }));
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to bulk upload roster.";
      window.dispatchEvent(new CustomEvent("app-toast", {
        detail: { message: msg, type: "warning" }
      }));
    } finally {
      setIsUploading(false);
    }
  };

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'risk_desc' | 'risk_asc' | 'tenure' | 'name'>('risk_desc');

  // Form States
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('Engineering');
  const [newRole, setNewRole] = useState('');
  const [newTenure, setNewTenure] = useState('');
  const [newSalaryGap, setNewSalaryGap] = useState(0);
  const [newOvertimeHrs, setNewOvertimeHrs] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filtering & Sorting Logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
    const matchesDept = deptFilter === 'All' || emp.dept === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (sortBy === 'risk_desc') return b.probability - a.probability;
    if (sortBy === 'risk_asc') return a.probability - b.probability;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'tenure') {
      const getVal = (ten: string) => parseFloat(ten.split(' ')[0]) || 0;
      return getVal(b.tenure) - getVal(a.tenure);
    }
    return 0;
  });

  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const formData = {
      name: newName,
      email: newEmail,
      dept: newDept,
      role: newRole,
      tenure: newTenure,
      salaryGap: newSalaryGap,
      overtimeHrs: newOvertimeHrs
    };

    const validation = addEmployeeSchema.safeParse(formData);

    if (!validation.success) {
      const errorsObj: Record<string, string> = {};
      validation.error.issues.forEach(err => {
        if (err.path[0]) {
          errorsObj[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errorsObj);
      return;
    }

    // Call state register with simulation ticker
    const success = await registerEmployee(formData);
    if (success) {
      // Reset form fields
      setNewName('');
      setNewEmail('');
      setNewRole('');
      setNewTenure('');
      setNewSalaryGap(0);
      setNewOvertimeHrs(0);
      setDirectoryView('browse');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Local Navigation bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-secondary-bg/50 border border-border-primary/60 p-3 sm:p-4 rounded">
        {/* On mobile: 3-column segmented grid, on sm+: flex bar */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1 sm:space-x-4 bg-primary-bg/60 sm:bg-transparent p-1 sm:p-0 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setDirectoryView('browse')}
            className={`font-mono text-[11px] sm:text-xs uppercase tracking-wider py-2 sm:py-1.5 px-1 sm:px-3 rounded transition-all text-center cursor-pointer ${
              directoryView === 'browse' 
                ? 'bg-accent-blue sm:bg-transparent text-white font-bold sm:border-b-2 sm:border-accent-blue shadow-sm sm:shadow-none' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="sm:hidden">Roster</span>
            <span className="hidden sm:inline">Employee List</span>
          </button>
          <button
            onClick={() => setDirectoryView('add')}
            className={`font-mono text-[11px] sm:text-xs uppercase tracking-wider py-2 sm:py-1.5 px-1 sm:px-3 rounded transition-all text-center cursor-pointer ${
              directoryView === 'add' 
                ? 'bg-accent-blue sm:bg-transparent text-white font-bold sm:border-b-2 sm:border-accent-blue shadow-sm sm:shadow-none' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="sm:hidden">+ New</span>
            <span className="hidden sm:inline">Register Employee</span>
          </button>
          <button
            onClick={() => setDirectoryView('bulk')}
            className={`font-mono text-[11px] sm:text-xs uppercase tracking-wider py-2 sm:py-1.5 px-1 sm:px-3 rounded transition-all text-center cursor-pointer ${
              directoryView === 'bulk' 
                ? 'bg-accent-blue sm:bg-transparent text-white font-bold sm:border-b-2 sm:border-accent-blue shadow-sm sm:shadow-none' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="sm:hidden">Bulk</span>
            <span className="hidden sm:inline">Bulk Upload</span>
          </button>
        </div>

        {directoryView === 'browse' && (
          <div className="flex items-center space-x-2 justify-end sm:flex-nowrap">
            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteBulk}
                disabled={isDeleting}
                className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white border border-red-500 hover:border-red-600 font-mono text-[10px] uppercase tracking-wider px-3 py-2 rounded transition-all duration-150 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete ({selectedIds.length})</span>
              </button>
            )}

            <button
              onClick={() => setDirectoryView('add')}
              className="hidden sm:flex bg-accent-blue hover:bg-blue-600 text-white font-mono text-[10px] uppercase tracking-wider px-3 py-2 rounded items-center space-x-1 cursor-pointer transition-all duration-150"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Employee</span>
            </button>
          </div>
        )}
      </div>

      {directoryView === 'browse' ? (
        /* Search filters + directory roster list */
        <div className="bg-secondary-bg/50 border border-border-primary/60 rounded p-4 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* Roster Controls */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4 font-mono text-xs border-b border-white/5 pb-4 sm:pb-5">
            <div className="relative w-full lg:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, role, or ID..."
                className="w-full bg-primary-bg border border-border-primary/60 rounded text-[11px] pl-9 pr-4 py-2.5 text-[var(--text-main)] placeholder-slate-600 focus:outline-none focus:border-accent-blue"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full lg:w-auto text-[10px]">
              {/* Dept Filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500 font-semibold shrink-0">Dept:</span>
                <div className="relative flex-1">
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="w-full bg-primary-bg border border-border-primary/60 rounded pl-2.5 pr-7 py-2 text-slate-300 focus:outline-none focus:border-accent-blue appearance-none cursor-pointer uppercase font-mono text-[11px]"
                  >
                    <option value="All">All Depts</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Sales & BD">Sales & BD</option>
                    <option value="Product Management">Product</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Risk Filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500 font-semibold shrink-0">Risk:</span>
                <div className="relative flex-1">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full bg-primary-bg border border-border-primary/60 rounded pl-2.5 pr-7 py-2 text-slate-300 focus:outline-none focus:border-accent-blue appearance-none cursor-pointer uppercase font-mono text-[11px]"
                  >
                    <option value="All">All Risks</option>
                    <option value="High">High Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="Low">Low Risk</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Sorter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500 font-semibold shrink-0">Sort:</span>
                <div className="relative flex-1">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full bg-primary-bg border border-border-primary/60 rounded pl-2.5 pr-7 py-2 text-slate-300 focus:outline-none focus:border-accent-blue appearance-none cursor-pointer uppercase font-mono text-[11px]"
                  >
                    <option value="risk_desc">Risk (High &darr;)</option>
                    <option value="risk_asc">Risk (Low &uarr;)</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="tenure">Tenure</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Table roster */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-primary/60 text-slate-400 text-[10px]">
                  <th className="pb-3 w-8">
                    <input
                      type="checkbox"
                      checked={sortedEmployees.length > 0 && selectedIds.length === sortedEmployees.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-border-primary/60 bg-primary-bg text-accent-blue focus:ring-[#3B82F6] cursor-pointer"
                    />
                  </th>
                  <th className="pb-3 uppercase tracking-wider font-semibold">Employee ID</th>
                  <th className="pb-3 uppercase tracking-wider font-semibold">Employee Name</th>
                  <th className="pb-3 uppercase tracking-wider font-semibold">Department</th>
                  <th className="pb-3 uppercase tracking-wider font-semibold">Tenure</th>
                  <th className="pb-3 uppercase tracking-wider font-semibold text-right">Risk Score</th>
                  <th className="pb-3 uppercase tracking-wider font-semibold text-center">Risk Factor</th>
                  <th className="pb-3 uppercase tracking-wider font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2D2F]/40 text-slate-300">
                {sortedEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-white/2 transition-colors duration-150">
                    <td className="py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(emp.id)}
                        onChange={(e) => handleSelectIndividual(emp.id, e.target.checked)}
                        className="rounded border-border-primary/60 bg-primary-bg text-accent-blue focus:ring-[#3B82F6] cursor-pointer"
                      />
                    </td>
                    <td className="py-4 font-semibold text-accent-blue">{emp.id}</td>
                    <td className="py-4 text-white font-sans font-medium">
                      <div>
                        <span className="block">{maskName(emp.name, isDataMasked)}</span>
                        <span className="block text-[10px] text-slate-500 font-mono">{maskEmail(emp.email, isDataMasked)}</span>
                      </div>
                    </td>
                    <td className="py-4">{emp.dept}</td>
                    <td className="py-4 text-slate-400">{emp.tenure}</td>
                    <td className="py-4 text-right">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        emp.status === 'High' ? 'bg-[#EF4444]/15 text-[#EF4444]' : 
                        emp.status === 'Medium' ? 'bg-[#F59E0B]/15 text-[#F59E0B]' :
                        'bg-[#22C55E]/15 text-[#22C55E]'
                      }`}>
                        {emp.probability}%
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="border border-border-primary/60 bg-secondary-bg/80 px-2.5 py-1 rounded text-slate-300 text-[10px]">
                        {emp.primaryFactor}
                      </span>
                    </td>
                    <td className="py-4 text-right flex items-center justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/employee/${emp.id}`)}
                        className="text-slate-400 hover:text-white border border-border-primary/60 hover:border-slate-500 bg-secondary-bg/80 px-3 py-1.5 rounded text-[10px] uppercase font-semibold transition-all duration-150 cursor-pointer"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDeleteIndividual(emp.id)}
                        className="text-red-500 hover:text-white border border-red-500/25 hover:border-red-500 bg-red-500/5 hover:bg-red-500 p-1.5 rounded transition-all duration-150 cursor-pointer flex items-center justify-center"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {sortedEmployees.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No employees found matching criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Select All & Controls Bar */}
          <div className="flex md:hidden items-center justify-between bg-primary-bg/70 border border-border-primary/60 p-3 rounded font-mono text-xs">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sortedEmployees.length > 0 && selectedIds.length === sortedEmployees.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-border-primary/60 bg-primary-bg text-accent-blue focus:ring-[#3B82F6] cursor-pointer"
              />
              <span className="text-slate-300 font-semibold text-[11px]">
                {selectedIds.length === sortedEmployees.length && sortedEmployees.length > 0
                  ? `All Selected (${sortedEmployees.length})`
                  : `Select All (${sortedEmployees.length})`}
              </span>
            </label>
            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteBulk}
                disabled={isDeleting}
                className="bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 px-2.5 py-1 rounded text-[10px] uppercase font-bold flex items-center space-x-1 transition-all"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete ({selectedIds.length})</span>
              </button>
            )}
          </div>

          {/* Mobile Card Roster stack */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {sortedEmployees.map((emp) => (
              <div key={emp.id} className="bg-secondary-bg/80 border border-border-primary/60 p-4 rounded space-y-4 font-mono text-xs">
                <div className="flex justify-between items-start border-b border-white/5 pb-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(emp.id)}
                      onChange={(e) => handleSelectIndividual(emp.id, e.target.checked)}
                      className="rounded border-border-primary/60 bg-primary-bg text-accent-blue focus:ring-[#3B82F6] cursor-pointer"
                    />
                    <div>
                      <span className="text-accent-blue font-semibold">{emp.id}</span>
                      <span className="block font-sans text-sm text-white font-medium mt-0.5">{maskName(emp.name, isDataMasked)}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    emp.status === 'High' ? 'bg-[#EF4444]/15 text-[#EF4444]' : 
                    emp.status === 'Medium' ? 'bg-[#F59E0B]/15 text-[#F59E0B]' :
                    'bg-[#22C55E]/15 text-[#22C55E]'
                  }`}>
                    {emp.probability}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-400 text-[10px]">
                  <div>
                    <span className="block text-slate-500 uppercase">Department</span>
                    <span className="text-slate-300">{emp.dept}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 uppercase">Tenure</span>
                    <span className="text-slate-300">{emp.tenure}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-slate-500 uppercase">Risk Factor</span>
                    <span className="text-amber-400 font-semibold">{emp.primaryFactor}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                  <button
                    onClick={() => handleDeleteIndividual(emp.id)}
                    className="text-red-500 border border-red-500/25 hover:bg-red-500/10 px-3 py-1.5 rounded text-[10px] uppercase font-semibold cursor-pointer"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => navigate(`/employee/${emp.id}`)}
                    className="bg-secondary-bg/50 text-slate-300 border border-border-primary/60 px-4 py-2 rounded text-[10px] uppercase font-semibold cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      ) : (
        /* Register new employee Form */
        <div className="bg-secondary-bg/50 border border-border-primary/60 rounded p-6">
          
          {!isRegistering ? (
            /* Normal form UI */
            <form onSubmit={handleAddEmployeeSubmit} className="space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-base font-bold text-white">Register New Employee</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Enter the employee details to register them in the system.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="E.g., John Doe"
                    className={`w-full bg-secondary-bg/80 border ${
                      formErrors.name ? 'border-[#EF4444]' : 'border-border-primary/60'
                    } rounded text-xs px-3.5 py-2.5 text-[var(--text-main)] placeholder-slate-600 focus:outline-none focus:border-accent-blue`}
                  />
                  {formErrors.name && <span className="text-[10px] text-[#EF4444] font-mono block">{formErrors.name}</span>}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                    Email Address
                  </label>
                  <input
                    type="text"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="E.g., j.doe@company.com"
                    className={`w-full bg-secondary-bg/80 border ${
                      formErrors.email ? 'border-[#EF4444]' : 'border-border-primary/60'
                    } rounded text-xs px-3.5 py-2.5 text-[var(--text-main)] placeholder-slate-600 focus:outline-none focus:border-accent-blue`}
                  />
                  {formErrors.email && <span className="text-[10px] text-[#EF4444] font-mono block">{formErrors.email}</span>}
                </div>

                {/* Department Select */}
                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                    Assigned Department
                  </label>
                  <div className="relative">
                    <select
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className="w-full bg-secondary-bg/80 border border-border-primary/60 rounded px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-accent-blue appearance-none pr-8 cursor-pointer font-mono uppercase"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Sales & BD">Sales & BD</option>
                      <option value="Product Management">Product Management</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Job Title / Role */}
                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="E.g., DevOps Architect"
                    className={`w-full bg-secondary-bg/80 border ${
                      formErrors.role ? 'border-[#EF4444]' : 'border-border-primary/60'
                    } rounded text-xs px-3.5 py-2.5 text-[var(--text-main)] placeholder-slate-600 focus:outline-none focus:border-accent-blue`}
                  />
                  {formErrors.role && <span className="text-[10px] text-[#EF4444] font-mono block">{formErrors.role}</span>}
                </div>

                {/* Tenure */}
                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                    Tenure (e.g. 1.5 yrs)
                  </label>
                  <input
                    type="text"
                    value={newTenure}
                    onChange={(e) => setNewTenure(e.target.value)}
                    placeholder="E.g., 2.1 yrs"
                    className={`w-full bg-secondary-bg/80 border ${
                      formErrors.tenure ? 'border-[#EF4444]' : 'border-border-primary/60'
                    } rounded text-xs px-3.5 py-2.5 text-[var(--text-main)] placeholder-slate-600 focus:outline-none focus:border-accent-blue`}
                  />
                  {formErrors.tenure && <span className="text-[10px] text-[#EF4444] font-mono block">{formErrors.tenure}</span>}
                </div>

                {/* Overtime hrs */}
                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                    Weekly Overtime (Hours)
                  </label>
                  <input
                    type="number"
                    value={newOvertimeHrs || ''}
                    onChange={(e) => setNewOvertimeHrs(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="E.g., 12"
                    className={`w-full bg-secondary-bg/80 border ${
                      formErrors.overtimeHrs ? 'border-[#EF4444]' : 'border-border-primary/60'
                    } rounded text-xs px-3.5 py-2.5 text-[var(--text-main)] placeholder-slate-600 focus:outline-none focus:border-accent-blue`}
                  />
                  {formErrors.overtimeHrs && <span className="text-[10px] text-[#EF4444] font-mono block">{formErrors.overtimeHrs}</span>}
                </div>

                {/* salary gap */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                    Salary Difference (%)
                  </label>
                  <input
                    type="number"
                    value={newSalaryGap || ''}
                    onChange={(e) => setNewSalaryGap(parseInt(e.target.value) || 0)}
                    placeholder="-15"
                    className={`w-full bg-secondary-bg/80 border ${
                      formErrors.salaryGap ? 'border-[#EF4444]' : 'border-border-primary/60'
                    } rounded text-xs px-3.5 py-2.5 text-[var(--text-main)] placeholder-slate-600 focus:outline-none focus:border-accent-blue`}
                  />
                  {formErrors.salaryGap && <span className="text-[10px] text-[#EF4444] font-mono block">{formErrors.salaryGap}</span>}
                </div>

              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  type="submit"
                  className="flex-1 bg-accent-blue hover:bg-blue-600 text-white font-mono text-xs uppercase tracking-wider py-3 rounded flex items-center justify-center space-x-1.5 cursor-pointer transition-all duration-150 border border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Employee</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirectoryView('browse')}
                  className="px-6 bg-secondary-bg/80 hover:bg-slate-900 border border-border-primary/60 hover:border-slate-500 rounded text-slate-300 font-mono text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
              </div>

            </form>
          ) : (
            /* Ingest logs live diagnostic */
            <div className="space-y-6 py-6 text-center">
              <div className="inline-flex p-3 rounded bg-blue-500/10 border border-blue-500/20 text-accent-blue mb-2">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              
              <div className="max-w-md mx-auto space-y-2">
                <h4 className="font-bold text-white">Registering Employee</h4>
                <p className="text-slate-400 text-xs">Adding employee profile to active registry...</p>
              </div>

              <div className="border border-border-primary/60 bg-primary-bg rounded p-4 h-52 text-left font-mono text-[10px] flex flex-col justify-between max-w-lg mx-auto">
                <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin text-emerald-400">
                  {registerLogs.map((log, i) => (
                    <p key={i} className={log.includes('[SUCCESS]') ? 'text-[#22C55E]' : 'text-slate-300'}>
                      &gt; {log}
                    </p>
                  ))}
                </div>
                
                <div className="mt-4 pt-2.5 border-t border-white/5 flex justify-between text-[8px] text-slate-500">
                  <span>Register Status: Syncing</span>
                  <span>Secure Connection: Active</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {directoryView === 'bulk' && (
        <div className="bg-secondary-bg/50 border border-border-primary/60 rounded p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">Bulk Import Portal</h3>
              <p className="text-slate-400 text-xs mt-1">Upload roster files exported from Workday, BambooHR or Gusto in batch.</p>
            </div>
            <span className="font-mono text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded uppercase">BATCH_MODE</span>
          </div>
          
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFileSelected(file);
            }}
            className="border-2 border-dashed border-border-primary/60 hover:border-accent-blue/60 rounded-xl p-8 text-center cursor-pointer transition-colors bg-primary-bg"
            onClick={() => document.getElementById('csv-file-input')?.click()}
          >
            <input 
              id="csv-file-input"
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelected(file);
              }}
            />
            <div className="space-y-3">
              <UploadCloud className="w-10 h-10 text-accent-blue mx-auto mb-1 opacity-90 animate-pulse" />
              <p className="text-sm font-semibold text-white">Drag & drop your roster file here, or <span className="text-accent-blue hover:underline">browse files</span></p>
              <p className="text-[10px] text-slate-500 font-mono">Accepts CSV, Excel (.xlsx/.xls), or PDF documents.</p>
            </div>
          </div>

          {selectedFile && (
            <div className="flex justify-between items-center bg-primary-bg border border-border-primary/60 rounded p-3 text-xs">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-accent-blue shrink-0" />
                <span className="text-white font-mono font-semibold">{selectedFile.name}</span>
                <span className="text-slate-500 font-mono">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button 
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewRows([]);
                }}
                className="text-slate-400 hover:text-white cursor-pointer font-semibold"
              >
                Clear
              </button>
            </div>
          )}

          {previewRows.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-xs uppercase tracking-wider text-slate-400">Parsed Rows Preview ({previewRows.length})</h4>
                <span className="text-[10px] text-emerald-400 font-semibold font-mono">VALIDATION: READY</span>
              </div>
              <div className="overflow-x-auto max-h-60 border border-border-primary/60 rounded bg-primary-bg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-secondary-bg/80 text-slate-400 sticky top-0 border-b border-border-primary/60 font-mono uppercase text-[9px]">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Salary Gap</th>
                      <th className="p-3">Overtime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2D2F] text-slate-300">
                    {previewRows.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5 font-mono text-[11px]">
                        <td className="p-3 text-white font-bold">{row.name || "-"}</td>
                        <td className="p-3">{row.email || "-"}</td>
                        <td className="p-3 uppercase text-[10px]">{row.dept || "-"}</td>
                        <td className="p-3">{row.role || "-"}</td>
                        <td className="p-3 text-accent-blue">{row.salary_gap || row.salarygap || "0"}%</td>
                        <td className="p-3 text-amber-500">{row.overtime_hrs || row.overtimehrs || "0"} hrs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewRows.length > 10 && (
                <p className="text-[10px] text-slate-500 italic">Showing top 10 preview rows of {previewRows.length} total rows.</p>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewRows([]);
                    setDirectoryView('browse');
                  }}
                  className="px-6 py-2 bg-secondary-bg/80 hover:bg-slate-900 border border-border-primary/60 rounded text-slate-300 font-mono text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleBulkSubmit}
                  disabled={isUploading}
                  className="px-6 py-2 bg-accent-blue hover:bg-blue-600 rounded text-white font-mono text-xs uppercase tracking-wider cursor-pointer flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Ingesting Roster...</span>
                    </>
                  ) : (
                    <span>Confirm Import</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
