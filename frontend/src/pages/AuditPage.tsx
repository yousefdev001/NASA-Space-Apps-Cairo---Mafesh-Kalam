import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  ShieldCheck,
  Lock,
  Link as LinkIcon,
  CheckCircle2,
  RefreshCw,
  AlertOctagon,
  Filter,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { clinicalApi } from '../api/clinicalApi';
import { AuditLog, AuditVerificationResult } from '../types/clinical.types';
import { useThemeStore } from '../store/themeStore';
import {
  getWobblyStyle,
  Tape,
  PushPin,
  SquiggleUnderline,
  SketchBadge,
} from '../components/sketchbook';

export const AuditPage: React.FC = () => {
  const { mode } = useThemeStore();
  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';
  const isSketch = isPaper || isDark;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [verification, setVerification] = useState<AuditVerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  // Filter
  const [selectedEventType, setSelectedEventType] = useState<string>('all');

  useEffect(() => {
    let ignore = false;

    const loadAuditTrail = async () => {
      try {
        const [logsRes, verifyRes] = await Promise.all([
          clinicalApi.getAuditLogs({
            event_type: selectedEventType !== 'all' ? selectedEventType : undefined,
            per_page: 50,
          }),
          clinicalApi.verifyAuditChain(),
        ]);

        if (!ignore) {
          setLogs(logsRes.logs);
          setVerification(verifyRes);
          setErrorMessage(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Failed to query SHA-256 audit ledger.';
          setErrorMessage(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadAuditTrail();

    return () => {
      ignore = true;
    };
  }, [selectedEventType]);

  // "Verify Hash Chain Integrity" action button
  const handleVerifyChain = async () => {
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const [verifyRes, logsRes] = await Promise.all([
        clinicalApi.verifyAuditChain(),
        clinicalApi.getAuditLogs({
          event_type: selectedEventType !== 'all' ? selectedEventType : undefined,
          per_page: 50,
        }),
      ]);

      setVerification(verifyRes);
      setLogs(logsRes.logs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error validating SHA-256 cryptographic chain.';
      setErrorMessage(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const logsRes = await clinicalApi.getAuditLogs({
        event_type: selectedEventType !== 'all' ? selectedEventType : undefined,
        per_page: 50,
      });
      setLogs(logsRes.logs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sync ledger.';
      setErrorMessage(msg);
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const formatEventType = (event: string) => {
    return event.replace(/_/g, ' ').toUpperCase();
  };

  const isGenesis = (hash: string) => {
    return /^0+$/.test(hash);
  };

  return (
    <div className="space-y-6">
      {/* Header - Mission Flight Ledger Header */}
      <div
        style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
        className={clsx(
          'relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition-all',
          isPaper
            ? 'bg-white text-[#2d2d2d] border-[3px] border-[#2d2d2d] sketch-shadow-lg'
            : isDark
              ? 'bg-[#0c0c10] text-white border-[3px] border-[#FF4D00] sketch-shadow-orange-lg'
              : ''
        )}
      >
        {isSketch && (
          <div className="absolute -top-3.5 left-10 z-10">
            <Tape isDark={isDark} />
          </div>
        )}

        <div>
          <div className="flex items-center gap-2.5">
            <div
              style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
              className={clsx(
                'w-9 h-9 flex items-center justify-center border transition-all',
                isPaper
                  ? 'bg-emerald-100 border-2 border-[#2d2d2d] text-emerald-900'
                  : isDark
                    ? 'bg-emerald-950/80 border-2 border-emerald-400 text-emerald-400'
                    : 'rounded-lg bg-emerald-950 border-emerald-500/50 text-emerald-400'
              )}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1
                className={clsx(
                  'text-2xl font-bold tracking-wide',
                  isSketch ? 'font-display-kalam text-2xl sm:text-3xl' : 'font-mono text-white'
                )}
              >
                IMMUTABLE SHA-256 AUDIT LEDGER
              </h1>
              {isSketch && (
                <div className="w-64 text-emerald-500">
                  <SquiggleUnderline />
                </div>
              )}
            </div>
          </div>
          <p
            className={clsx(
              'text-xs mt-1',
              isSketch ? 'font-sketch-hand text-sm font-semibold opacity-80' : 'font-mono text-slate-400'
            )}
          >
            FORENSIC CRYPTOGRAPHIC HASH CHAIN · NON-REPUDIATION OF ALL CLINICAL &amp; MISSION OPERATIONS
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualRefresh}
            isLoading={isRefreshing}
            style={isSketch ? getWobblyStyle('wobblySm') : undefined}
            className={clsx(
              'text-xs gap-1.5 font-bold',
              isSketch
                ? isDark
                  ? 'bg-black text-[#FF4D00] border-2 border-[#FF4D00] sketch-btn-orange font-sketch-hand'
                  : 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand'
                : ''
            )}
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sync
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleVerifyChain}
            isLoading={isVerifying}
            style={isSketch ? getWobblyStyle('wobblySm') : undefined}
            className={clsx(
              'text-xs gap-2 font-bold',
              isSketch
                ? isDark
                  ? 'bg-emerald-500 text-black border-2 border-white sketch-btn-orange font-sketch-hand px-4'
                  : 'bg-emerald-600 text-white border-2 border-[#2d2d2d] sketch-btn font-sketch-hand px-4'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            )}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            Verify Hash Chain Integrity
          </Button>
        </div>
      </div>

      {/* Cryptographic Integrity Verification Banner - Flight Ledger Certificate */}
      {verification && (
        <div
          style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
          className={clsx(
            'relative p-4 border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-lg',
            isPaper
              ? verification.is_valid
                ? 'bg-emerald-50 text-emerald-950 border-[3px] border-[#2d2d2d] sketch-shadow'
                : 'bg-rose-50 text-rose-950 border-[3px] border-[#2d2d2d] sketch-shadow'
              : isDark
                ? verification.is_valid
                  ? 'bg-[#0c0c10] text-white border-[3px] border-emerald-400 sketch-shadow-orange'
                  : 'bg-[#0c0c10] text-white border-[3px] border-rose-500 sketch-shadow-orange'
                : verification.is_valid
                  ? 'rounded-xl bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  : 'rounded-xl bg-rose-950/40 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
          )}
        >
          {isSketch && (
            <div className="absolute -top-2.5 right-6 z-10">
              <PushPin isDark={isDark} />
            </div>
          )}

          <div className="flex items-center gap-3.5">
            <div
              style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
              className={clsx(
                'w-10 h-10 border flex items-center justify-center shrink-0',
                isPaper
                  ? verification.is_valid
                    ? 'bg-emerald-200 border-2 border-[#2d2d2d] text-emerald-950'
                    : 'bg-rose-200 border-2 border-[#2d2d2d] text-rose-950'
                  : isDark
                    ? verification.is_valid
                      ? 'bg-emerald-950 border-2 border-emerald-400 text-emerald-400'
                      : 'bg-rose-950 border-2 border-rose-500 text-rose-400'
                    : verification.is_valid
                      ? 'rounded-lg bg-emerald-950 border-emerald-500/60 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'rounded-lg bg-rose-950 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
              )}
            >
              {verification.is_valid ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertOctagon className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-0.5">
              <h4
                className={clsx(
                  'text-sm font-bold flex items-center gap-2 flex-wrap',
                  isSketch ? 'font-display-kalam text-base' : 'font-mono text-white'
                )}
              >
                <span>
                  {verification.is_valid
                    ? 'CRYPTOGRAPHIC INTEGRITY: 100% SECURE & UNBROKEN'
                    : 'CRYPTOGRAPHIC INTEGRITY: INTEGRITY COMPROMISED'}
                </span>
                <span
                  style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                  className={clsx(
                    'text-[11px] px-2 py-0.5 border font-bold',
                    isPaper
                      ? 'bg-emerald-100 text-emerald-900 border-[#2d2d2d] font-sketch-hand'
                      : isDark
                        ? 'bg-black text-emerald-400 border-emerald-400 font-sketch-hand'
                        : 'font-mono rounded bg-[#050B14] text-emerald-400 border-current'
                  )}
                >
                  {verification.chain_status}
                </span>
              </h4>

              <p
                className={clsx(
                  'text-xs leading-relaxed',
                  isSketch ? 'font-sketch-hand text-sm opacity-90' : 'text-slate-300 font-mono'
                )}
              >
                {verification.is_valid
                  ? `All ${verification.verified_records} of ${verification.total_records} consecutive blocks mathematically chained via SHA-256 pointer recursion. Zero payload tampering detected.`
                  : `Integrity failure: ${verification.failure_reason || 'Tampering detected at block #' + verification.compromised_at_id}`}
              </p>
            </div>
          </div>

          <div
            className={clsx(
              'flex items-center gap-3 text-xs shrink-0',
              isSketch ? 'font-sketch-hand text-sm' : 'font-mono'
            )}
          >
            <div className="text-right">
              <span className="opacity-70 block text-[10px]">VERIFIED AT</span>
              <span className="font-bold">
                {new Date(verification.verified_at).toLocaleTimeString()}
              </span>
            </div>
            {isSketch ? (
              <SketchBadge
                variant={verification.is_valid ? 'nominal' : 'critical'}
                mode={mode}
              >
                {verification.is_valid ? 'GENESIS VERIFIED' : 'TAMPER DETECTED'}
              </SketchBadge>
            ) : (
              <Badge status={verification.is_valid ? 'nominal' : 'critical'}>
                {verification.is_valid ? 'GENESIS VERIFIED' : 'TAMPER DETECTED'}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div
          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
          className={clsx(
            'p-3.5 border text-xs flex items-center gap-2',
            isPaper
              ? 'bg-rose-100 text-rose-950 border-2 border-[#2d2d2d] font-sketch-hand'
              : isDark
                ? 'bg-rose-950/60 text-rose-300 border-2 border-rose-500 font-sketch-hand'
                : 'rounded-lg bg-rose-950/40 border-rose-500/50 text-rose-300 font-mono'
          )}
        >
          <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter Bar - Technical Ruled Ledger Section */}
      <Card
        themeMode={mode}
        className={clsx(
          'p-4 transition-all',
          !isSketch && 'border-[#1E3A5F] bg-[#0B132B]/60'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div
            className={clsx(
              'flex items-center gap-2 text-xs font-bold',
              isPaper ? 'text-[#ff4d00] font-sketch-hand text-sm' : isDark ? 'text-[#FF4D00] font-sketch-hand text-sm' : 'font-mono text-cyan-400'
            )}
          >
            <Filter className="w-4 h-4 text-current" />
            <span>AUDIT TRAIL EVENT FILTER:</span>
          </div>

          <div
            className={clsx(
              'flex items-center gap-2 text-xs',
              isSketch ? 'font-sketch-hand text-sm' : 'font-mono'
            )}
          >
            <span className="opacity-75 font-bold">Event Class:</span>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'px-3 py-1 text-xs focus:outline-none border cursor-pointer',
                isPaper
                  ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-sm'
                  : isDark
                    ? 'bg-black border-2 border-[#FF4D00] text-white font-sketch-hand text-sm'
                    : 'rounded bg-[#050B14] border-[#1E3A5F] text-white font-mono focus:border-cyan-400'
              )}
            >
              <option value="all">All Events ({logs.length})</option>
              <option value="system_genesis">System Genesis</option>
              <option value="ai_insights_ingested">AI Insights Ingested</option>
              <option value="ai_insight_approved">AI Insight Approved</option>
              <option value="ai_insight_rejected">AI Insight Rejected</option>
              <option value="ai_insight_modified">AI Insight Modified</option>
              <option value="alert_acknowledged">Alert Acknowledged</option>
              <option value="alert_escalated">Alert Escalated</option>
              <option value="alert_resolved">Alert Resolved</option>
              <option value="alert_dismissed">Alert Dismissed</option>
              <option value="report_generated">Report Generated</option>
              <option value="report_approved">Report Approved</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Audit Block Chain - Immutable Mission Flight Ledger Logbook */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400 tracking-wider">
            RECOMPUTING AND LOADING SHA-256 CRYPTOGRAPHIC BLOCKS...
          </p>
        </div>
      ) : logs.length === 0 ? (
        <Card
          themeMode={mode}
          className={clsx(
            'text-center py-16 border',
            isPaper
              ? 'bg-white border-2 border-[#2d2d2d]'
              : isDark
                ? 'bg-[#0c0c10] border-2 border-[#FF4D00]'
                : 'border-[#1E3A5F]'
          )}
        >
          <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3
            className={clsx(
              'text-sm font-bold',
              isSketch ? 'font-display-kalam text-lg' : 'font-mono text-white'
            )}
          >
            NO AUDIT LOGS RECORDED
          </h3>
          <p
            className={clsx(
              'text-xs mt-1',
              isSketch ? 'font-sketch-hand text-sm opacity-75' : 'font-mono text-slate-400'
            )}
          >
            No ledger records found matching the selected filter.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((log, idx) => {
            const isGenesisBlock = isGenesis(log.previous_hash);
            const isExpanded = expandedLogId === log.id;
            const operatorName = log.user ? log.user.name : 'System Genesis Node';
            const operatorEmail = log.user?.email;

            return (
              <div key={log.id} className="relative">
                {/* Visual Hash Chain Vertical Link between ledger blocks */}
                {idx < logs.length - 1 && (
                  <div
                    className={clsx(
                      'absolute left-6 -bottom-4 w-0.5 h-4 z-10 flex items-center justify-center',
                      isPaper
                        ? 'bg-[#2d2d2d]'
                        : isDark
                          ? 'bg-[#FF4D00]'
                          : 'bg-emerald-500/50'
                    )}
                  >
                    <span
                      style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
                      className={clsx(
                        'w-2.5 h-2.5 border-2',
                        isPaper
                          ? 'bg-[#fff9c4] border-[#2d2d2d]'
                          : isDark
                            ? 'bg-[#FF4D00] border-white'
                            : 'rounded-full bg-emerald-400 ring-2 ring-emerald-950'
                      )}
                    />
                  </div>
                )}

                <Card
                  themeMode={mode}
                  decoration={isSketch ? (idx % 2 === 0 ? 'tape' : 'pin') : 'none'}
                  className={clsx(
                    'transition-all',
                    !isSketch && 'border-[#1E3A5F] hover:border-emerald-500/40 bg-[#0B132B]/80'
                  )}
                >
                  {/* Block Header with Technical Ruled Line */}
                  <div
                    className={clsx(
                      'flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2',
                      isSketch
                        ? isDark
                          ? 'border-[#FF4D00]/40 border-dashed'
                          : 'border-[#2d2d2d]/30 border-dashed'
                        : 'border-[#1E3A5F]'
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                        className={clsx(
                          'text-xs font-bold px-2 py-0.5 border',
                          isPaper
                            ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d] font-sketch-hand'
                            : isDark
                              ? 'bg-[#FF4D00] text-black border-white font-sketch-hand'
                              : 'font-mono text-emerald-400 rounded bg-[#050B14] border-emerald-500/40'
                        )}
                      >
                        BLOCK #{log.id}
                      </span>

                      <span
                        className={clsx(
                          'text-xs font-bold tracking-wider',
                          isSketch ? 'font-display-kalam text-sm' : 'font-mono text-white'
                        )}
                      >
                        {formatEventType(log.event_type)}
                      </span>

                      {log.auditable_type && (
                        <span
                          style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                          className={clsx(
                            'text-[11px] px-1.5 py-0.5 border',
                            isPaper
                              ? 'bg-[#e5e0d8] text-[#2d2d2d] border-[#2d2d2d] font-sketch-hand'
                              : isDark
                                ? 'bg-black text-white/80 border-[#FF4D00]/40 font-sketch-hand'
                                : 'font-mono text-slate-400 rounded bg-slate-900 border-slate-700'
                          )}
                        >
                          {log.auditable_type} #{log.auditable_id}
                        </span>
                      )}
                    </div>

                    <div
                      className={clsx(
                        'flex items-center gap-3 text-xs',
                        isSketch ? 'font-sketch-hand' : 'font-mono text-slate-400'
                      )}
                    >
                      <div className="flex items-center gap-1 opacity-75">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(log.created_at).toUTCString()}</span>
                      </div>

                      {/* Status Stamp */}
                      {isSketch ? (
                        <SketchBadge variant="nominal" mode={mode}>
                          SHA-256 VERIFIED
                        </SketchBadge>
                      ) : (
                        <Badge status="nominal">SHA-256 VERIFIED</Badge>
                      )}
                    </div>
                  </div>

                  {/* Block Body */}
                  <div
                    className={clsx(
                      'py-3 space-y-2 text-xs',
                      isSketch ? 'font-sketch-hand text-sm' : 'font-mono'
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <User className="w-3.5 h-3.5 text-[#ff4d00] shrink-0" />
                      <span className="opacity-75 font-bold">OPERATOR:</span>
                      <span className={isPaper ? 'text-[#2d5da1] font-bold' : isDark ? 'text-[#FF4D00] font-bold' : 'text-cyan-300 font-semibold'}>
                        {operatorName}
                      </span>
                      {operatorEmail && (
                        <span className="opacity-60 text-[11px]">({operatorEmail})</span>
                      )}
                      {log.ip_address && (
                        <span className="opacity-50 text-[10px]">· IP: {log.ip_address}</span>
                      )}
                    </div>

                    <p className="leading-relaxed opacity-90">{log.description}</p>

                    {/* Cryptographic SHA-256 Hash Chain Links - Technical Ruled Section */}
                    <div
                      style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                      className={clsx(
                        'mt-3 p-3 space-y-2 text-[11px] border',
                        isPaper
                          ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] shadow-sm font-mono'
                          : isDark
                            ? 'bg-black border-2 border-[#FF4D00] text-white font-mono'
                            : 'rounded-lg bg-[#050B14] border-emerald-500/30 font-mono shadow-inner'
                      )}
                    >
                      {/* Previous Hash Link */}
                      <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                        <LinkIcon className="w-3.5 h-3.5 opacity-60 shrink-0" />
                        <span className="opacity-75 font-bold shrink-0">PREV HASH:</span>
                        {isGenesisBlock ? (
                          <span className="text-amber-500 font-mono truncate font-bold">
                            0000000000000000000000000000000000000000000000000000000000000000 (GENESIS SEED)
                          </span>
                        ) : (
                          <span className="opacity-90 font-mono truncate font-semibold">
                            {log.previous_hash}
                          </span>
                        )}
                      </div>

                      {/* Technical Ruled Divider */}
                      <div
                        className={clsx(
                          'h-px w-full border-t border-dashed',
                          isSketch
                            ? isDark
                              ? 'border-[#FF4D00]/30'
                              : 'border-[#2d2d2d]/25'
                            : 'border-emerald-500/20'
                        )}
                      />

                      {/* Current Block Hash Link */}
                      <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                        <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-emerald-500 font-bold shrink-0">BLOCK HASH:</span>
                        <span className="text-emerald-400 font-mono truncate font-bold">
                          {log.current_hash}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Old vs New Value Diffs */}
                    {(log.old_values || log.new_values) && (
                      <div className="pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(log.id)}
                          className={clsx(
                            'text-[11px] p-1 flex items-center gap-1 font-bold cursor-pointer',
                            isPaper ? 'text-[#ff4d00]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400 hover:text-cyan-300'
                          )}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{isExpanded ? 'Hide Payload Mutation Diffs' : 'View Payload Mutation Diffs'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </Button>

                        {isExpanded && (
                          <div
                            style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                            className={clsx(
                              'mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 border text-[11px]',
                              isPaper
                                ? 'bg-white border-2 border-[#2d2d2d]'
                                : isDark
                                  ? 'bg-black border-2 border-[#FF4D00]'
                                  : 'rounded-lg bg-[#050B14] border-[#1E3A5F]'
                            )}
                          >
                            <div>
                              <span className="text-rose-500 font-bold block mb-1">PRIOR STATE:</span>
                              <pre
                                className={clsx(
                                  'p-2 rounded overflow-x-auto text-xs',
                                  isSketch
                                    ? isDark
                                      ? 'bg-[#0c0c10] text-white border border-[#FF4D00]/40'
                                      : 'bg-[#fdfbf7] text-[#2d2d2d] border border-[#2d2d2d]/30'
                                    : 'bg-black/60 text-slate-300'
                                )}
                              >
                                {log.old_values ? JSON.stringify(log.old_values, null, 2) : 'null (Created)'}
                              </pre>
                            </div>
                            <div>
                              <span className="text-emerald-500 font-bold block mb-1">COMMITTED STATE:</span>
                              <pre
                                className={clsx(
                                  'p-2 rounded overflow-x-auto text-xs',
                                  isSketch
                                    ? isDark
                                      ? 'bg-[#0c0c10] text-emerald-400 border border-emerald-500/40'
                                      : 'bg-[#fdfbf7] text-emerald-800 border border-emerald-600/30'
                                    : 'bg-black/60 text-emerald-300'
                                )}
                              >
                                {log.new_values ? JSON.stringify(log.new_values, null, 2) : 'null'}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
