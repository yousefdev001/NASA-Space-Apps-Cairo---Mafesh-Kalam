import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import apiClient from '../api/client';

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
        navigate('/mission-control');
      }
    } catch (err: any) {
      // In case backend is not running or credentials failed, provide friendly demo fallback for UI testing
      setErrorMsg(err.response?.data?.message || 'Invalid credentials. You can use Quick Access buttons below.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick login helper for demonstration & testing
  const handleQuickLogin = (role: string, name: string) => {
    const mockUser = {
      id: 1,
      uuid: 'demo-surgeon-uuid',
      name,
      email: `${role}@auramed.nasa.gov`,
      is_active: true,
      roles: [role as any],
      permissions: ['view_vital_readings', 'approve_ai_insights', 'view_alerts', 'manage_users'],
    };
    setAuth(mockUser, 'demo_token_auramed_2026');
    navigate('/mission-control');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/50 shadow-[0_0_20px_rgba(0,229,255,0.3)] mb-2">
            <Activity className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-mono font-bold text-white tracking-wide">
            AURAMED GROUND CONTROL
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            SECURE MISSION FLIGHT SURGEON & CREW AUTHENTICATION
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
                  placeholder="surgeon@auramed.nasa.gov"
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
                  placeholder="••••••••••••"
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

          {/* Quick Demo Access Roles */}
          <div className="mt-6 pt-5 border-t border-[#1E3A5F]">
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Quick Role Simulation (Development Mode)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickLogin('flight_surgeon', 'Dr. Henrik Lindqvist')}
                className="text-[11px]"
              >
                Flight Surgeon
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickLogin('mission_director', 'Director Gene Kranz')}
                className="text-[11px]"
              >
                Mission Director
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickLogin('medical_officer', 'Dr. Sarah Connor')}
                className="text-[11px]"
              >
                Medical Officer
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickLogin('astronaut_crew', 'Elena Vance (CDR-01)')}
                className="text-[11px]"
              >
                Astronaut Crew
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
