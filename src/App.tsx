import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SystemProvider } from './context/SystemContext';
import { ToastProvider } from './components/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardLayout } from './components/DashboardLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { EmployeeListPage } from './pages/EmployeeListPage';
import { RiskAnalyticsPage } from './pages/RiskAnalyticsPage';
import { EmployeeDetailPage } from './pages/EmployeeDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Specialized workspace modules
import PredictionCenter from './pages/PredictionCenter/PredictionCenter';
import SettingsCenter from './pages/Settings/SettingsCenter';
import ReportsCenter from './pages/Reports/ReportsCenter';
import CopilotWorkspace from './pages/Copilot/CopilotWorkspace';

// Enterprise feature pages
import { EmployeeSurveyPortal } from './pages/Survey/EmployeeSurveyPortal';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <SystemProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              
              {/* All authenticated routes nested within DashboardLayout */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/employees" element={<EmployeeListPage />} />
                <Route path="/employee/:id" element={<EmployeeDetailPage />} />
                <Route path="/risk-analytics" element={<RiskAnalyticsPage />} />
                <Route path="/prediction-center" element={<PredictionCenter />} />
                <Route path="/reports" element={<ReportsCenter />} />
                <Route path="/settings" element={<SettingsCenter />} />
                <Route path="/copilot" element={<CopilotWorkspace />} />
                <Route path="/my-profile" element={<EmployeeSurveyPortal />} />
              </Route>

              {/* Catch-all 404 route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </SystemProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
