import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Wrench,
  Shield,
  Stethoscope,
  Loader2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { UserRole } from '../types/auth.types';
import {
  Tape,
  PushPin,
  SquiggleUnderline,
  getWobblyStyle,
} from '../components/sketchbook';
import apiClient from '../api/client';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');

  const [email, setEmail] = useState(() =>
    roleParam ? `${roleParam}@auramed.nasa.gov` : 'flight_surgeon@auramed.nasa.gov'
  );
  const [password, setPassword] = useState('Houston@2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [activeQuickRole, setActiveQuickRole] = useState<UserRole | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const { setAuth } = useAuthStore();
  const { mode, setMode } = useThemeStore();
  const navigate = useNavigate();

  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';
  const isCyber = mode === 'cyber';
  const isSketch = isPaper || isDark;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data?.success) {
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
      setEmail(roleEmail);
      setPassword('Houston@2026!');

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

  const simulationRoles = [
    {
      role: 'flight_surgeon' as UserRole,
      title: 'Flight Surgeon',
      subtitle: 'Clinical Approvals & Triage',
      icon: Stethoscope,
      color: isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#ff4d4d]' : 'text-cyan-400',
    },
    {
      role: 'biomedical_engineer' as UserRole,
      title: 'Biomedical Eng.',
      subtitle: 'Telemetry & Hardware Arrays',
      icon: Wrench,
      color: isDark ? 'text-emerald-400' : isPaper ? 'text-[#2d5da1]' : 'text-emerald-400',
    },
    {
      role: 'cadet_student' as UserRole,
      title: 'Cadet Student',
      subtitle: 'Space Academy & Reflex Games',
      icon: GraduationCap,
      color: isDark ? 'text-purple-400' : isPaper ? 'text-purple-600' : 'text-purple-400',
    },
    {
      role: 'auditor_compliance' as UserRole,
      title: 'Auditor & Compliance',
      subtitle: 'Audit Trail & SHA-256 Chains',
      icon: ShieldCheck,
      color: isDark ? 'text-amber-400' : isPaper ? 'text-amber-600' : 'text-amber-400',
    },
    {
      role: 'mission_director' as UserRole,
      title: 'Mission Director',
      subtitle: 'Full Command Operations',
      icon: UserCheck,
      color: isDark ? 'text-blue-400' : isPaper ? 'text-blue-600' : 'text-blue-400',
    },
    {
      role: 'system_administrator' as UserRole,
      title: 'System Admin',
      subtitle: 'Root Tier-4 Authority',
      icon: Shield,
      color: isDark ? 'text-rose-400' : isPaper ? 'text-rose-600' : 'text-rose-400',
    },
  ];

  return (
    <div
      className={`min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 py-8 sm:py-12 transition-colors duration-200 ${
        isPaper ? 'paper-grain text-[#2d2d2d]' : isDark ? 'paper-grain-dark text-white' : 'hud-grid text-slate-100'
      }`}
    >
      {/* Top Controls: Return to Landing & 3-way Mode Switcher */}
      <div className="w-full max-w-xl flex items-center justify-between gap-3 mb-6">
        <Link
          to="/"
          style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-sketch-hand font-bold border-2 transition-all cursor-pointer ${
            isPaper
              ? 'bg-white text-[#2d2d2d] border-[#2d2d2d] sketch-btn hover:bg-[#fff9c4]'
              : isDark
                ? 'bg-black text-[#FF4D00] border-[#FF4D00] sketch-btn-orange hover:bg-[#FF4D00] hover:text-black'
                : 'bg-[#0B132B] text-cyan-300 border border-cyan-500/40 rounded font-mono'
          }`}
        >
          <span>← Mission Landing</span>
        </Link>

        {/* 3-way Mode Switcher */}
        <div
          className={`flex items-center gap-1 p-1 border rounded-xl ${
            isPaper
              ? 'bg-[#e5e0d8]/80 border-[#2d2d2d]/40'
              : isDark
                ? 'bg-black/80 border-[#FF4D00]/50'
                : 'bg-[#0B132B] border-[#1E3A5F]'
          }`}
        >
          <button
            type="button"
            onClick={() => setMode('paper')}
            className={`px-2.5 py-0.5 text-xs font-sketch-hand font-bold transition-all cursor-pointer ${
              isPaper
                ? 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn'
                : 'text-slate-400 hover:text-current'
            }`}
            style={isPaper ? getWobblyStyle('wobblyTag') : undefined}
          >
            📜 Paper
          </button>
          <button
            type="button"
            onClick={() => setMode('dark')}
            className={`px-2.5 py-0.5 text-xs font-sketch-hand font-bold transition-all cursor-pointer ${
              isDark
                ? 'bg-[#FF4D00] text-black border-2 border-white sketch-btn-orange'
                : 'text-slate-400 hover:text-current'
            }`}
            style={isDark ? getWobblyStyle('wobblyTag') : undefined}
          >
            🚀 Dark
          </button>
          <button
            type="button"
            onClick={() => setMode('cyber')}
            className={`px-2.5 py-0.5 text-xs font-mono font-bold transition-all rounded cursor-pointer ${
              isCyber
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400'
                : 'text-slate-400 hover:text-current'
            }`}
          >
            ⚡ Cyber
          </button>
        </div>
      </div>

      {/* Flight Surgeon Field Dossier / Astronaut Clipboard Container */}
      <div className="w-full max-w-xl relative">
        {/* Physical Clipboard Clip Illustration */}
        <div
          className={`w-32 sm:w-40 h-7 -mb-3 mx-auto relative z-30 flex items-center justify-center border-[3px] shadow-md select-none ${
            isDark
              ? 'bg-[#18110c] border-[#FF4D00]'
              : isPaper
                ? 'bg-[#3a3a3a] border-[#2d2d2d]'
                : 'bg-[#0B132B] border-cyan-500/50'
          }`}
          style={{ borderRadius: '6px 6px 2px 2px' }}
        >
          <div
            className={`w-14 sm:w-20 h-2 rounded-sm border ${
              isDark ? 'bg-[#FF4D00]/50 border-white/40' : 'bg-[#1c1c1c] border-white/20'
            }`}
          />
        </div>

        {/* Dossier Card */}
        <div
          style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
          className={`relative p-6 sm:p-8 border-[3px] transition-all duration-200 ${
            isPaper
              ? 'bg-white text-[#2d2d2d] border-[#2d2d2d] sketch-shadow-lg'
              : isDark
                ? 'bg-[#0c0c10] text-white border-[#FF4D00] sketch-shadow-orange-lg'
                : 'bg-[#0B132B] text-white border border-cyan-500/40 rounded-2xl shadow-[0_0_35px_rgba(0,229,255,0.18)]'
          }`}
        >
          {/* Tape Strip on top */}
          {isSketch && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
              <Tape isDark={isDark} />
            </div>
          )}

          {/* PushPin at top right */}
          {isSketch && (
            <div className="absolute -top-2.5 right-6 z-20">
              <PushPin isDark={isDark} />
            </div>
          )}

          {/* Dossier Header & Classification Stamp */}
          <div
            className={`flex items-center justify-between pb-3.5 mb-5 border-b-2 border-dashed ${
              isDark ? 'border-[#FF4D00]/40' : isPaper ? 'border-[#2d2d2d]/30' : 'border-[#1E3A5F]'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText
                className={`w-4 h-4 ${
                  isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#2d5da1]' : 'text-cyan-400'
                }`}
              />
              <span
                style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                className={`px-2 py-0.5 text-[11px] font-sketch-hand font-bold border ${
                  isDark
                    ? 'bg-[#FF4D00]/20 text-[#FF4D00] border-[#FF4D00]'
                    : isPaper
                      ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d]'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-mono rounded'
                }`}
              >
                CONFIDENTIAL · NASA STD-3001
              </span>
            </div>

            <span
              className={`text-[11px] font-sketch-hand font-bold uppercase tracking-wider ${
                isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'text-slate-400 font-mono'
              }`}
            >
              DOSSIER #MC-2026-MED
            </span>
          </div>

          {/* Dossier Title & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="font-display-kalam font-bold text-3xl sm:text-4xl leading-tight">
              AuraMed Ground Control
            </h1>
            <div className="max-w-[210px] mx-auto mt-1">
              <SquiggleUnderline
                className={isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#ff4d4d]' : 'text-cyan-400'}
              />
            </div>
            <p
              className={`mt-2 font-sketch-hand text-xs sm:text-sm uppercase tracking-wide font-medium ${
                isPaper ? 'text-[#2d2d2d]/80' : isDark ? 'text-white/80' : 'text-slate-400 font-mono'
              }`}
            >
              FLIGHT SURGEON FIELD DOSSIER &amp; ASTRONAUT TELEMETRY ACCESS
            </p>
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={`p-3.5 mb-5 border-2 flex items-start gap-2.5 text-xs font-sketch-hand ${
                isDark
                  ? 'bg-rose-950/70 border-[#FF4D00] text-rose-200'
                  : isPaper
                    ? 'bg-[#ff4d4d]/10 border-[#ff4d4d] text-rose-900 font-bold'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-300 font-mono rounded-lg'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 leading-snug">{errorMsg}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Operator Email */}
            <div>
              <label
                className={`block text-xs font-sketch-hand font-bold uppercase tracking-wider mb-1.5 ${
                  isPaper ? 'text-[#2d2d2d]' : isDark ? 'text-white' : 'text-slate-300 font-mono'
                }`}
              >
                NASA Operator Callsign / Email
              </label>
              <div className="relative">
                <Mail
                  className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                    isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#2d2d2d]/60' : 'text-slate-400'
                  }`}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="flight_surgeon@auramed.nasa.gov"
                  required
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={`w-full pl-9 pr-4 py-2.5 text-sm transition-all ${
                    isPaper
                      ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] placeholder-[#2d2d2d]/40 focus:outline-none focus:ring-2 focus:ring-[#2d5da1] font-mono'
                      : isDark
                        ? 'bg-black border-2 border-[#FF4D00] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF4D00] font-mono'
                        : 'bg-[#050B14] border border-[#1E3A5F] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 rounded-lg font-mono'
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className={`block text-xs font-sketch-hand font-bold uppercase tracking-wider mb-1.5 ${
                  isPaper ? 'text-[#2d2d2d]' : isDark ? 'text-white' : 'text-slate-300 font-mono'
                }`}
              >
                Access Token / Passphrase
              </label>
              <div className="relative">
                <Lock
                  className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                    isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#2d2d2d]/60' : 'text-slate-400'
                  }`}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Houston@2026!"
                  required
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={`w-full pl-9 pr-4 py-2.5 text-sm transition-all ${
                    isPaper
                      ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] placeholder-[#2d2d2d]/40 focus:outline-none focus:ring-2 focus:ring-[#2d5da1] font-mono'
                      : isDark
                        ? 'bg-black border-2 border-[#FF4D00] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF4D00] font-mono'
                        : 'bg-[#050B14] border border-[#1E3A5F] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 rounded-lg font-mono'
                  }`}
                />
              </div>
            </div>

            {/* High-Contrast Tactile Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={isSketch ? getWobblyStyle('wobblyAlt') : undefined}
              className={`w-full mt-2 py-3 px-5 inline-flex items-center justify-center gap-2 font-display-kalam font-bold text-lg sm:text-xl transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                isPaper
                  ? 'bg-[#ff4d4d] text-white border-[3px] border-[#2d2d2d] sketch-btn hover:bg-[#e53e3e]'
                  : isDark
                    ? 'bg-[#FF4D00] text-black border-[3px] border-white sketch-btn-orange hover:bg-white hover:text-black font-bold'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold rounded-lg shadow-[0_0_20px_rgba(0,229,255,0.4)] text-base'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Decrypting Mission Stream...</span>
                </>
              ) : (
                <>
                  <span>Authenticate &amp; Decrypt Telemetry</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Quick RBAC Role Simulation */}
          <div
            className={`mt-7 pt-5 border-t-2 border-dashed ${
              isDark ? 'border-[#FF4D00]/40' : isPaper ? 'border-[#2d2d2d]/30' : 'border-[#1E3A5F]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-xs font-sketch-hand uppercase tracking-wider font-bold ${
                  isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#2d5da1]' : 'text-cyan-400 font-mono'
                }`}
              >
                Quick Role Simulation (100% RBAC Tested)
              </span>
              <span
                className={`text-[11px] font-sketch-hand ${
                  isPaper ? 'text-[#2d2d2d]/60' : isDark ? 'text-white/60' : 'text-slate-500 font-mono'
                }`}
              >
                Passphrase: Houston@2026!
              </span>
            </div>

            {/* Tactile Astronaut Badges Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {simulationRoles.map((sim) => {
                const Icon = sim.icon;
                const isThisLoading = isLoading && activeQuickRole === sim.role;

                return (
                  <button
                    key={sim.role}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuickLogin(sim.role)}
                    style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                    className={`p-2.5 border-2 text-left flex items-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isPaper
                        ? 'bg-[#fdfbf7] border-[#2d2d2d] sketch-btn hover:bg-[#fff9c4] text-[#2d2d2d]'
                        : isDark
                          ? 'bg-[#16161a] border-[#FF4D00] sketch-btn-orange hover:bg-[#FF4D00]/25 text-white'
                          : 'bg-[#050B14] hover:bg-cyan-950/40 border-[#1E3A5F] hover:border-cyan-500/50 rounded-lg text-slate-200'
                    }`}
                  >
                    {isThisLoading ? (
                      <Loader2
                        className={`w-4 h-4 shrink-0 animate-spin ${sim.color}`}
                      />
                    ) : (
                      <Icon className={`w-4 h-4 shrink-0 ${sim.color}`} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-display-kalam font-bold text-xs sm:text-sm truncate">
                        {sim.title}
                      </div>
                      <div
                        className={`font-sketch-hand text-[10px] truncate leading-tight ${
                          isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'text-slate-400 font-mono'
                        }`}
                      >
                        {sim.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
