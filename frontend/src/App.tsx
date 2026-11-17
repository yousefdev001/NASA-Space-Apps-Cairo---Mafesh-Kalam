import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { PublicLayout, MissionControlLayout } from './components/layout/Layouts';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { ShieldAlert, GraduationCap, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from './store/authStore';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { MissionControlPage } from './pages/MissionControlPage';
import { AstronautsPage } from './pages/AstronautsPage';
import { MissionsPage } from './pages/MissionsPage';
import { AiInsightsPage } from './pages/AiInsightsPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AcademyPage } from './pages/AcademyPage';
import { ArticlesPage } from './pages/ArticlesPage';
import { AuditPage } from './pages/AuditPage';
import { BioTwinPage } from './pages/BioTwinPage';

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes with Public Layout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          {!isAuthenticated && <Route path="/academy" element={<AcademyPage />} />}
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/unauthorized"
            element={
              <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.25)]">
                  <ShieldAlert className="w-8 h-8 text-rose-400" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-mono font-bold text-rose-400 tracking-wider">
                    403 · RESTRICTED ACCESS
                  </h2>
                  <p className="text-xs text-slate-400 max-w-md font-mono">
                    Your assigned mission role does not possess high-level authorization for this orbital system partition.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Link
                    to="/academy"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 text-xs font-mono font-medium transition-colors"
                  >
                    <GraduationCap className="w-4 h-4" /> Go to Space Academy
                  </Link>
                  <Link
                    to="/mission-control"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B132B] border border-[#1E3A5F] text-slate-300 hover:text-white text-xs font-mono font-medium transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Mission Control
                  </Link>
                </div>
              </div>
            }
          />
        </Route>

        {/* Protected Mission Systems with MissionControlLayout */}
        <Route
          element={
            <ProtectedRoute>
              <MissionControlLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/mission-control"
            element={
              <ProtectedRoute requiredPermissions={['view_vital_readings']}>
                <MissionControlPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bio-twin"
            element={
              <ProtectedRoute requiredPermissions={['view_vital_readings']}>
                <BioTwinPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/astronauts"
            element={
              <ProtectedRoute requiredPermissions={['view_astronauts']}>
                <AstronautsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/missions"
            element={
              <ProtectedRoute requiredPermissions={['view_missions']}>
                <MissionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/telemetry"
            element={
              <ProtectedRoute requiredPermissions={['view_vital_readings']}>
                <MissionControlPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-insights"
            element={
              <ProtectedRoute requiredPermissions={['view_ai_insights']}>
                <AiInsightsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute requiredPermissions={['view_alerts']}>
                <AlertsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute requiredPermissions={['view_reports']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academy"
            element={
              <ProtectedRoute requiredPermissions={['view_academy']}>
                <AcademyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit"
            element={
              <ProtectedRoute
                requiredPermissions={['view_audit_logs']}
                allowedRoles={['system_administrator', 'auditor_compliance']}
              >
                <AuditPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
