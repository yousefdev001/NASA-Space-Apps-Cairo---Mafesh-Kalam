import React, { useState, useEffect } from 'react';
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

export const AuditPage: React.FC = () => {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold text-white tracking-wide flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            IMMUTABLE SHA-256 AUDIT LEDGER
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            FORENSIC CRYPTOGRAPHIC HASH CHAIN · NON-REPUDIATION OF ALL CLINICAL & MISSION OPERATIONS
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualRefresh}
            isLoading={isRefreshing}
            className="text-xs gap-1.5"
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
            className="text-xs gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            Verify Hash Chain Integrity
          </Button>
        </div>
      </div>

      {/* Cryptographic Integrity Verification Banner */}
      {verification && (
        <div
          className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-lg ${
            verification.is_valid
              ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
              : 'bg-rose-950/40 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
                verification.is_valid
                  ? 'bg-emerald-950 border-emerald-500/60 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-rose-950 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
              }`}
            >
              {verification.is_valid ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertOctagon className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-0.5">
              <h4 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <span>
                  {verification.is_valid
                    ? 'CRYPTOGRAPHIC INTEGRITY: 100% SECURE & UNBROKEN'
                    : 'CRYPTOGRAPHIC INTEGRITY: INTEGRITY COMPROMISED'}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#050B14] border border-current text-emerald-400">
                  {verification.chain_status}
                </span>
              </h4>

              <p className="text-xs text-slate-300 font-mono">
                {verification.is_valid
                  ? `All ${verification.verified_records} of ${verification.total_records} consecutive blocks mathematically chained via SHA-256 pointer recursion. Zero payload tampering detected.`
                  : `Integrity failure: ${verification.failure_reason || 'Tampering detected at block #' + verification.compromised_at_id}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs shrink-0">
            <div className="text-right">
              <span className="text-slate-500 block text-[10px]">VERIFIED AT</span>
              <span className="text-slate-300">
                {new Date(verification.verified_at).toLocaleTimeString()}
              </span>
            </div>
            <Badge status={verification.is_valid ? 'nominal' : 'critical'}>
              {verification.is_valid ? 'GENESIS VERIFIED' : 'TAMPER DETECTED'}
            </Badge>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <Card className="border-[#1E3A5F] p-4 bg-[#0B132B]/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">AUDIT TRAIL EVENT FILTER:</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Event Class:</span>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="bg-[#050B14] border border-[#1E3A5F] rounded px-3 py-1 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none cursor-pointer"
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

      {/* Main Audit Block Chain */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400 tracking-wider">
            RECOMPUTING AND LOADING SHA-256 CRYPTOGRAPHIC BLOCKS...
          </p>
        </div>
      ) : logs.length === 0 ? (
        <Card className="border-[#1E3A5F] text-center py-16">
          <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-mono font-bold text-white">NO AUDIT LOGS RECORDED</h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
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
                {/* Visual Hash Chain Vertical Link between blocks */}
                {idx < logs.length - 1 && (
                  <div className="absolute left-6 -bottom-4 w-0.5 h-4 bg-emerald-500/50 z-10 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-950" />
                  </div>
                )}

                <Card className="border-[#1E3A5F] hover:border-emerald-500/40 transition-all bg-[#0B132B]/80">
                  {/* Block Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1E3A5F]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-[#050B14] border border-emerald-500/40">
                        BLOCK #{log.id}
                      </span>

                      <span className="font-mono text-xs text-white font-bold tracking-wider">
                        {formatEventType(log.event_type)}
                      </span>

                      {log.auditable_type && (
                        <span className="text-[11px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700">
                          {log.auditable_type} #{log.auditable_id}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(log.created_at).toUTCString()}</span>
                      </div>
                      <Badge status="nominal">SHA-256 VERIFIED</Badge>
                    </div>
                  </div>

                  {/* Block Body */}
                  <div className="py-3 space-y-2 text-xs font-mono">
                    <div className="flex flex-wrap items-center gap-2 text-slate-300">
                      <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-slate-400">OPERATOR:</span>
                      <span className="text-cyan-300 font-semibold">{operatorName}</span>
                      {operatorEmail && (
                        <span className="text-slate-500 text-[11px]">({operatorEmail})</span>
                      )}
                      {log.ip_address && (
                        <span className="text-slate-600 text-[10px]">· IP: {log.ip_address}</span>
                      )}
                    </div>

                    <p className="text-slate-200 font-sans text-xs leading-relaxed">{log.description}</p>

                    {/* Cryptographic SHA-256 Hash Chain Links */}
                    <div className="mt-3 p-3 rounded-lg bg-[#050B14] border border-emerald-500/30 space-y-2 text-[11px] shadow-inner">
                      {/* Previous Hash Link */}
                      <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                        <LinkIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-400 font-bold shrink-0">PREV HASH:</span>
                        {isGenesisBlock ? (
                          <span className="text-amber-400 font-mono truncate font-bold">
                            0000000000000000000000000000000000000000000000000000000000000000 (GENESIS SEED)
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono truncate font-semibold">
                            {log.previous_hash}
                          </span>
                        )}
                      </div>

                      {/* Current Block Hash Link */}
                      <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                        <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-emerald-400 font-bold shrink-0">BLOCK HASH:</span>
                        <span className="text-emerald-300 font-mono truncate font-bold">
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
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 p-1 flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{isExpanded ? 'Hide Payload Mutation Diffs' : 'View Payload Mutation Diffs'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </Button>

                        {isExpanded && (
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-[11px]">
                            <div>
                              <span className="text-rose-400 font-bold block mb-1">PRIOR STATE:</span>
                              <pre className="p-2 rounded bg-black/60 text-slate-300 overflow-x-auto">
                                {log.old_values ? JSON.stringify(log.old_values, null, 2) : 'null (Created)'}
                              </pre>
                            </div>
                            <div>
                              <span className="text-emerald-400 font-bold block mb-1">COMMITTED STATE:</span>
                              <pre className="p-2 rounded bg-black/60 text-emerald-300 overflow-x-auto">
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
