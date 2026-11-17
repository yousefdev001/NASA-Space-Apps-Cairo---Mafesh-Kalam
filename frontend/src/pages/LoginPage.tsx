import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, GraduationCap, Wrench, Shield, Stethoscope, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types/auth.types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import apiClient from '../api/client';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeQuickRole, setActiveQuickRole] = useState<UserRole | null>(null);
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
        } else if (roles.includes('auditor_compliance')) {
          navigate('/audit');
        } else {
          navigate('/mission-control');
        }
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err && (err as any).response?.data?.message
          ? (err as any).response.data.message
          : 'Authentication failed. Please verify credentials or use Quick Role simulation.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick login helper: performs real Sanctum Bearer token generation via backend
  const handleQuickLogin = async (role: UserRole) => {
    setIsLoading(true);
    setActiveQuickRole(role);
    setErrorMsg('');

    try {
      const roleEmail = `${role}@auramed.nasa.gov`;
      const response = await apiClient.post('/auth/login', {
        email: roleEmail,
        password: 'Houston@2026!',
      });

      if (response.data?.success) {
        const { user, token } = response.data.data;
        setAuth(user, token);

        // Cadets & Educators start in Space Academy; Compliance Auditor in Audit; others in Mission Control
        const roles: UserRole[] = user.roles || [];
        if (roles.includes('cadet_student') || roles.includes('educator_content_creator')) {
          navigate('/academy');
        } else if (roles.includes('auditor_compliance')) {
          navigate('/audit');
        } else {
          navigate('/mission-control');
        }
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err && (err as any).response?.data?.message
          ? (err as any).response.data.message
          : 'Quick login failed. Ensure Ground Station backend is running on port 8001.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setActiveQuickRole(null);
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
                disabled={isLoading}
                onClick={() => handleQuickLogin('flight_surgeon')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-[#050B14] hover:bg-cyan-950/40 border border-[#1E3A5F] hover:border-cyan-500/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activeQuickRole === 'flight_surgeon' ? (
                  <Loader2 className="w-4 h-4 text-cyan-400 shrink-0 animate-spin" />
                ) : (
                  <Stethoscope className="w-4 h-4 text-cyan-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 truncate">
                    Flight Surgeon
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">Clinical Review & Alerts</div>
                </div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('biomedical_engineer')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-[#050B14] hover:bg-cyan-950/40 border border-[#1E3A5F] hover:border-cyan-500/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activeQuickRole === 'biomedical_engineer' ? (
                  <Loader2 className="w-4 h-4 text-emerald-400 shrink-0 animate-spin" />
                ) : (
                  <Wrench className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-emerald-300 truncate">
                    Biomedical Eng.
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">Telemetry & Hardware</div>
                </div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('cadet_student')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-[#050B14] hover:bg-cyan-950/40 border border-[#1E3A5F] hover:border-cyan-500/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activeQuickRole === 'cadet_student' ? (
                  <Loader2 className="w-4 h-4 text-purple-400 shrink-0 animate-spin" />
                ) : (
                  <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-purple-300 truncate">
                    Cadet Student
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">Academy Only (No Control)</div>
                </div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('auditor_compliance')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-[#050B14] hover:bg-cyan-950/40 border border-[#1E3A5F] hover:border-cyan-500/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activeQuickRole === 'auditor_compliance' ? (
                  <Loader2 className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-amber-300 truncate">
                    Auditor & Compliance
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">Audit Trail & Chain</div>
                </div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('mission_director')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-[#050B14] hover:bg-cyan-950/40 border border-[#1E3A5F] hover:border-cyan-500/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activeQuickRole === 'mission_director' ? (
                  <Loader2 className="w-4 h-4 text-blue-400 shrink-0 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-blue-300 truncate">
                    Mission Director
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">Full Command Operations</div>
                </div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('system_administrator')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-[#050B14] hover:bg-cyan-950/40 border border-[#1E3A5F] hover:border-cyan-500/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activeQuickRole === 'system_administrator' ? (
                  <Loader2 className="w-4 h-4 text-rose-400 shrink-0 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4 text-rose-400 shrink-0" />
                )}
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
