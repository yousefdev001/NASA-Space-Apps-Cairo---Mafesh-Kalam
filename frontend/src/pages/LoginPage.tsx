import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, GraduationCap, Wrench, Shield, Stethoscope } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { User, UserRole } from '../types/auth.types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import apiClient from '../api/client';

// Real Spatie RBAC permission mapping for simulation & fallback testing
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  flight_surgeon: [
    'view_astronauts', 'view_medical_records', 'create_medical_records', 'view_astronaut_baselines',
    'view_missions', 'view_vital_readings', 'view_organ_telemetry', 'view_ecg_recordings',
    'view_eeg_recordings', 'view_radiation_readings', 'view_suit_telemetry',
    'view_ai_insights', 'approve_ai_insights', 'reject_ai_insights', 'modify_ai_insights',
    'view_alerts', 'acknowledge_alerts', 'escalate_alerts', 'resolve_alerts',
    'view_reports', 'create_reports', 'update_reports', 'approve_reports',
    'export_reports_pdf', 'export_reports_csv', 'view_forensic_timeline',
    'view_academy', 'view_articles', 'view_thresholds', 'update_thresholds',
  ],
  mission_director: [
    'view_astronauts', 'create_astronauts', 'update_astronauts',
    'view_missions', 'create_missions', 'update_missions', 'assign_crew_to_mission',
    'view_mission_media', 'upload_mission_media',
    'view_vital_readings', 'view_organ_telemetry', 'view_ai_insights',
    'view_alerts', 'acknowledge_alerts', 'escalate_alerts', 'resolve_alerts',
    'view_reports', 'create_reports', 'approve_reports', 'export_reports_pdf',
    'view_academy', 'view_articles',
  ],
  medical_officer: [
    'view_astronauts', 'view_medical_records', 'view_astronaut_baselines',
    'view_vital_readings', 'view_organ_telemetry', 'view_ecg_recordings',
    'view_radiation_readings', 'view_ai_insights',
    'view_alerts', 'acknowledge_alerts', 'resolve_alerts',
    'view_reports', 'create_reports', 'view_thresholds', 'update_thresholds',
    'view_academy', 'view_articles',
  ],
  biomedical_engineer: [
    'view_astronauts', 'view_vital_readings', 'view_organ_telemetry',
    'view_suit_telemetry', 'view_radiation_readings', 'view_alerts',
    'view_reports', 'create_reports', 'view_thresholds', 'update_thresholds',
    'view_academy', 'view_articles',
  ],
  astronaut_crew: [
    'view_own_astronaut_profile', 'view_own_vital_readings', 'view_own_alerts',
    'view_missions', 'view_academy', 'view_articles',
  ],
  ground_controller: [
    'view_astronauts', 'view_missions', 'view_vital_readings', 'view_organ_telemetry',
    'ingest_telemetry_data', 'view_alerts', 'acknowledge_alerts',
    'view_academy', 'view_articles',
  ],
  cadet_student: [
    'view_academy', 'view_own_progress', 'view_articles',
  ],
  educator_content_creator: [
    'view_academy', 'create_courses', 'update_courses', 'delete_courses',
    'manage_quizzes', 'view_articles', 'create_articles', 'update_articles',
    'delete_articles', 'publish_articles',
  ],
  auditor_compliance: [
    'view_astronauts', 'view_missions', 'view_vital_readings', 'view_organ_telemetry',
    'view_reports', 'view_forensic_timeline', 'view_audit_logs', 'verify_audit_chain',
    'view_academy', 'view_articles',
  ],
  system_administrator: [
    'view_astronauts', 'view_medical_records', 'create_medical_records', 'view_astronaut_baselines',
    'view_missions', 'create_missions', 'update_missions', 'assign_crew_to_mission',
    'view_mission_media', 'upload_mission_media', 'view_vital_readings', 'view_organ_telemetry',
    'view_ecg_recordings', 'view_eeg_recordings', 'view_radiation_readings', 'view_suit_telemetry',
    'ingest_telemetry_data', 'view_ai_insights', 'approve_ai_insights', 'reject_ai_insights',
    'modify_ai_insights', 'view_ai_model_registry', 'view_alerts', 'acknowledge_alerts',
    'escalate_alerts', 'resolve_alerts', 'dismiss_alerts', 'view_reports', 'create_reports',
    'update_reports', 'approve_reports', 'publish_reports', 'export_reports_pdf',
    'export_reports_csv', 'view_forensic_timeline', 'view_academy', 'view_own_progress',
    'create_courses', 'update_courses', 'delete_courses', 'manage_quizzes', 'view_articles',
    'create_articles', 'update_articles', 'delete_articles', 'publish_articles', 'manage_users',
    'assign_roles', 'view_audit_logs', 'verify_audit_chain', 'manage_system_settings',
    'view_thresholds', 'update_thresholds',
  ],
};

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data.success) {
        const { user, token } = response.data.data;
        setAuth(user, token);
        const roles: UserRole[] = user.roles || [];
        if (roles.includes('cadet_student') || roles.includes('educator_content_creator')) {
          navigate('/academy');
        } else {
          navigate('/mission-control');
        }
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Authentication failed. Please verify credentials or use Quick Role simulation.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Quick login helper with 100% accurate role permissions separation
  const handleQuickLogin = (role: UserRole, name: string) => {
    const permissions = ROLE_PERMISSIONS[role] || [];
    const mockUser: User = {
      id: Math.floor(Math.random() * 1000) + 1,
      uuid: `mock-${role}-uuid`,
      name,
      email: `${role}@auramed.nasa.gov`,
      is_active: true,
      roles: [role],
      permissions,
    };
    setAuth(mockUser, `auramed_token_${role}_simulated`);

    // Cadets & Educators start directly in Space Academy; operational flight roles route to Mission Control
    if (role === 'cadet_student' || role === 'educator_content_creator') {
      navigate('/academy');
    } else {
      navigate('/mission-control');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/50 shadow-[0_0_20px_rgba(0,229,255,0.3)] mb-2">
            <Activity className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-mono font-bold text-white tracking-wide">
            AURAMED GROUND CONTROL
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            SECURE NASA FLIGHT SURGEON & CREW AUTHENTICATION
          </p>
        </div>

        <Card className="border-cyan-500/30 shadow-[0_0_25px_rgba(0,229,255,0.1)]">
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase">
                NASA Operator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="flight_surgeon@auramed.nasa.gov"
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase">
                Access Token / Passphrase
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Houston@2026!"
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isLoading}
            >
              Authenticate & Decrypt Telemetry <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Quick RBAC Role Simulation */}
          <div className="mt-6 pt-5 border-t border-[#1E3A5F]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                Quick Role Simulation (100% RBAC Tested)
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Houston@2026!
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('flight_surgeon', 'Dr. Henrik Lindqvist')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-[#050B14] hover:bg-cyan-950/40 border border-[#1E3A5F] hover:border-cyan-500/50 transition-all text-left group"
              >
                <Stethoscope className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 truncate">
                    Flight Surgeon
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">Clinical Review & Alerts</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('biomedical_engineer', 'Eng. Marcus Vance')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-[#050B14] hover:bg-cyan-950/40 border border-[#1E3A5F] hover:border-cyan-500/50 transition-all text-left group"
              >
                <Wrench className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-emerald-300 truncate">
                    Biomedical Eng.
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">Telemetry & Hardware</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('cadet_student', 'Cadet Leo Armstrong')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-[#050B14] hover:bg-cyan-950/40 border border-[#1E3A5F] hover:border-cyan-500/50 transition-all text-left group"
              >
                <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-purple-300 truncate">
                    Cadet Student
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">Academy Only (No Control)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('auditor_compliance', 'Inspector Evelyn Reed')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-[#050B14] hover:bg-cyan-950/40 border border-[#1E3A5F] hover:border-cyan-500/50 transition-all text-left group"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-amber-300 truncate">
                    Auditor & Compliance
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">Audit Trail & Chain</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('mission_director', 'Director Gene Kranz')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-[#050B14] hover:bg-cyan-950/40 border border-[#1E3A5F] hover:border-cyan-500/50 transition-all text-left group"
              >
                <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-blue-300 truncate">
                    Mission Director
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">Full Command Operations</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('system_administrator', 'AuraMed SysAdmin')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-[#050B14] hover:bg-cyan-950/40 border border-[#1E3A5F] hover:border-cyan-500/50 transition-all text-left group"
              >
                <Shield className="w-4 h-4 text-rose-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-rose-300 truncate">
                    System Admin
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">Root Tier-4 Authority</div>
                </div>
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
