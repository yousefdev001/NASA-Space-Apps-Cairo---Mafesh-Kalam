import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout, MissionControlLayout } from './components/layout/Layouts';
import { ProtectedRoute } from './components/guards/ProtectedRoute';

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes with Public Layout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/academy" element={<AcademyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-4">
              <h2 className="text-2xl font-mono font-bold text-rose-400">403 · RESTRICTED ACCESS</h2>
              <p className="text-xs text-slate-400 mt-2 font-mono">
                Your role does not possess high-level authorization for this orbital system partition.
              </p>
            </div>
          } />
        </Route>

        {/* Protected Mission Systems with MissionControlLayout */}
        <Route
          element={
            <ProtectedRoute>
              <MissionControlLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/mission-control" element={<MissionControlPage />} />
          <Route path="/astronauts" element={<AstronautsPage />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/telemetry" element={<MissionControlPage />} />
          <Route path="/ai-insights" element={<AiInsightsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/academy" element={<AcademyPage />} />
          <Route
            path="/audit"
            element={
              <ProtectedRoute allowedRoles={['system_administrator', 'auditor_compliance', 'flight_surgeon']}>
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
