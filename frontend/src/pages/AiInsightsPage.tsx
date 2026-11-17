import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  BrainCircuit,
  Check,
  X,
  Edit3,
  Cpu,
  AlertTriangle,
  RefreshCw,
  Filter,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
} from 'lucide-react';
import { clinicalApi } from '../api/clinicalApi';
import { AiInsight, AiInsightStats } from '../types/clinical.types';

export const AiInsightsPage: React.FC = () => {
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [stats, setStats] = useState<AiInsightStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Modals state
  const [modifyingInsight, setModifyingInsight] = useState<AiInsight | null>(null);
  const [modifiedDescription, setModifiedDescription] = useState('');
  const [modifyNotes, setModifyNotes] = useState('');

  const [rejectingInsight, setRejectingInsight] = useState<AiInsight | null>(null);
  const [rejectRationale, setRejectRationale] = useState('');

  const [approvingInsight, setApprovingInsight] = useState<AiInsight | null>(null);
  const [approveNotes, setApproveNotes] = useState('Clinically verified and accepted by Flight Surgeon under NASA STD-3001.');

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        const [insightsRes, statsRes] = await Promise.all([
          clinicalApi.getAiInsights({
            review_status: selectedStatus !== 'all' ? selectedStatus : undefined,
            severity: selectedSeverity !== 'all' ? selectedSeverity : undefined,
            per_page: 50,
          }),
          clinicalApi.getAiInsightStats(),
        ]);

        if (!ignore) {
          setInsights(insightsRes.insights);
          setStats(statsRes);
          setErrorMessage(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Failed to communicate with NASA Ground Station.';
          setErrorMessage(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [selectedStatus, selectedSeverity]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const [insightsRes, statsRes] = await Promise.all([
        clinicalApi.getAiInsights({
          review_status: selectedStatus !== 'all' ? selectedStatus : undefined,
          severity: selectedSeverity !== 'all' ? selectedSeverity : undefined,
          per_page: 50,
        }),
        clinicalApi.getAiInsightStats(),
      ]);

      setInsights(insightsRes.insights);
      setStats(statsRes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to communicate with NASA Ground Station.';
      setErrorMessage(msg);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Flash message helper
  const notifySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4500);
  };

  // 1. Approve Workflow
  const handleOpenApproveModal = (insight: AiInsight) => {
    setApprovingInsight(insight);
    setApproveNotes('Clinically verified and accepted by Flight Surgeon under NASA STD-3001.');
  };

  const handleConfirmApprove = async () => {
    if (!approvingInsight) return;
    setActionLoadingId(approvingInsight.id);
    setErrorMessage(null);

    try {
      const res = await clinicalApi.approveAiInsight(approvingInsight.id, approveNotes);
      setInsights((prev) =>
        prev.map((ins) => (ins.id === approvingInsight.id ? { ...ins, ...res.insight, review_status: 'approved' } : ins))
      );
      notifySuccess(`Insight #${approvingInsight.id} approved and signed into Flight Surgeon cryptographic record.`);
      setApprovingInsight(null);
      // Refresh stats in background
      clinicalApi.getAiInsightStats().then(setStats).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error approving AI insight.';
      setErrorMessage(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Reject Workflow
  const handleOpenRejectModal = (insight: AiInsight) => {
    setRejectingInsight(insight);
    setRejectRationale('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingInsight) return;
    if (rejectRationale.trim().length < 5) {
      setErrorMessage('Rejection rationale requires at least 5 characters for clinical non-repudiation audit.');
      return;
    }

    setActionLoadingId(rejectingInsight.id);
    setErrorMessage(null);

    try {
      const res = await clinicalApi.rejectAiInsight(rejectingInsight.id, rejectRationale.trim());
      setInsights((prev) =>
        prev.map((ins) => (ins.id === rejectingInsight.id ? { ...ins, ...res.insight, review_status: 'rejected' } : ins))
      );
      notifySuccess(`Insight #${rejectingInsight.id} rejected. Clinical justification logged.`);
      setRejectingInsight(null);
      // Refresh stats
      clinicalApi.getAiInsightStats().then(setStats).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error rejecting AI insight.';
      setErrorMessage(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Modify Workflow
  const handleOpenModifyModal = (insight: AiInsight) => {
    setModifyingInsight(insight);
    setModifiedDescription(insight.description);
    setModifyNotes(insight.recommended_action || '');
  };

  const handleConfirmModify = async () => {
    if (!modifyingInsight) return;
    if (modifiedDescription.trim().length < 5) {
      setErrorMessage('Modified clinical diagnosis requires at least 5 characters.');
      return;
    }

    setActionLoadingId(modifyingInsight.id);
    setErrorMessage(null);

    try {
      const res = await clinicalApi.modifyAiInsight(modifyingInsight.id, {
        modified_description: modifiedDescription.trim(),
        reviewer_notes: modifyNotes.trim() || undefined,
      });

      setInsights((prev) =>
        prev.map((ins) => (ins.id === modifyingInsight.id ? { ...ins, ...res.insight, review_status: 'modified' } : ins))
      );
      notifySuccess(`Insight #${modifyingInsight.id} updated with Flight Surgeon clinical modifications.`);
      setModifyingInsight(null);
      clinicalApi.getAiInsightStats().then(setStats).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error modifying AI insight.';
      setErrorMessage(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatConfidence = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '0.0%';
    const percent = num <= 1.0 ? num * 100 : num;
    return `${percent.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold text-white tracking-wide flex items-center gap-2.5">
            <BrainCircuit className="w-6 h-6 text-cyan-400" />
            AI CLINICAL INSIGHTS & FLIGHT SURGEON REVIEW
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            HUMAN-IN-THE-LOOP (HITL) MEDICAL AI VALIDATION · NASA FLIGHT SURGEON INTERVENTION
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stats && (
            <>
              <Badge status="info">
                {stats.total} TOTAL INSIGHTS
              </Badge>
              <Badge status={stats.pending_review > 0 ? 'warning' : 'nominal'}>
                {stats.pending_review} PENDING REVIEWS
              </Badge>
              <Badge status="neutral">
                AVG CONF: {stats.average_confidence}%
              </Badge>
            </>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualRefresh}
            isLoading={isRefreshing}
            className="text-xs gap-1.5"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setErrorMessage(null)} className="text-xs p-1">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Filters Bar */}
      <Card className="border-[#1E3A5F] p-4 bg-[#0B132B]/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">LIVE TELEMETRY FILTERS:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-400">Review Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#050B14] border border-[#1E3A5F] rounded px-2.5 py-1 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none cursor-pointer"
              >
                <option value="all">All Reviews ({stats?.total ?? 0})</option>
                <option value="pending_review">Pending Review ({stats?.pending_review ?? 0})</option>
                <option value="approved">Approved ({stats?.approved ?? 0})</option>
                <option value="rejected">Rejected ({stats?.rejected ?? 0})</option>
                <option value="modified">Modified ({stats?.modified ?? 0})</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-400">Severity:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-[#050B14] border border-[#1E3A5F] rounded px-2.5 py-1 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Insights List */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400 tracking-wider">
            SYNCHRONIZING AI INFERENCE PIPELINE & FLIGHT SURGEON QUEUE...
          </p>
        </div>
      ) : insights.length === 0 ? (
        <Card className="border-[#1E3A5F] text-center py-16">
          <BrainCircuit className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-mono font-bold text-slate-300">NO AI INSIGHTS FOUND</h3>
          <p className="text-xs text-slate-500 font-mono mt-1">
            No inference findings match the selected status & severity filters.
          </p>
          {(selectedStatus !== 'all' || selectedSeverity !== 'all') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedStatus('all');
                setSelectedSeverity('all');
              }}
              className="mt-4 text-xs"
            >
              Reset Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {insights.map((ins) => {
            const astronautLabel = ins.astronaut
              ? `${ins.astronaut.full_name} (${ins.astronaut.callsign})`
              : `Astronaut #${ins.astronaut_id}`;
            const modelLabel = ins.job?.model_name || 'Autonomous AI Diagnostic';
            const isActionBusy = actionLoadingId === ins.id;

            return (
              <Card key={ins.id} className="border-[#1E3A5F] hover:border-cyan-500/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E3A5F]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span className="font-mono text-xs text-cyan-400 font-bold">{modelLabel}</span>
                    <span className="text-slate-500">·</span>
                    <div className="flex items-center gap-1 text-xs font-mono text-white font-semibold">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{astronautLabel}</span>
                    </div>
                    <span className="text-slate-500">·</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Type: <span className="text-slate-300 uppercase">{ins.insight_type}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      Confidence: <span className="text-cyan-300 font-bold">{formatConfidence(ins.confidence_score)}</span>
                    </span>

                    {/* Severity Badge */}
                    <Badge
                      status={
                        ins.severity === 'critical' || ins.severity === 'high'
                          ? 'critical'
                          : ins.severity === 'medium'
                          ? 'warning'
                          : 'info'
                      }
                    >
                      {ins.severity.toUpperCase()}
                    </Badge>

                    {/* Review Status Badge */}
                    <Badge
                      status={
                        ins.review_status === 'approved'
                          ? 'nominal'
                          : ins.review_status === 'rejected'
                          ? 'critical'
                          : ins.review_status === 'modified'
                          ? 'info'
                          : 'warning'
                      }
                    >
                      {ins.review_status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="py-4 space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {(ins.severity === 'high' || ins.severity === 'critical') && (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    {ins.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{ins.description}</p>

                  {ins.recommended_action && (
                    <div className="p-3 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs font-mono text-cyan-300">
                      <span className="text-slate-400 font-bold block mb-1">AI CLINICAL RECOMMENDATION:</span>
                      {ins.recommended_action}
                    </div>
                  )}

                  {/* Previous Flight Surgeon Review Note if exists */}
                  {ins.review && (
                    <div className="p-3 rounded-lg bg-[#0B132B]/80 border border-cyan-500/30 text-xs font-mono">
                      <div className="flex items-center gap-2 text-cyan-300 font-bold mb-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>FLIGHT SURGEON VERIFICATION LOG ({ins.review.decision.toUpperCase()}):</span>
                      </div>
                      {ins.review.modified_description && (
                        <div className="mb-2 p-2 rounded bg-[#050B14] border border-[#1E3A5F] text-slate-200">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Clinical Diagnostic Adjustment:</span>
                          {ins.review.modified_description}
                        </div>
                      )}
                      {ins.review.reviewer_notes && (
                        <p className="text-slate-300 text-[11px] italic">"{ins.review.reviewer_notes}"</p>
                      )}
                    </div>
                  )}
                </div>

                {/* HITL Action Controls */}
                <div className="pt-3 border-t border-[#1E3A5F] flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Analyzed: {new Date(ins.analyzed_at).toLocaleString()}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {ins.review_status === 'pending_review' ? (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenModifyModal(ins)}
                          disabled={isActionBusy}
                          className="text-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Modify & Add Surgeon Notes
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleOpenRejectModal(ins)}
                          disabled={isActionBusy}
                          className="text-xs"
                        >
                          <X className="w-3.5 h-3.5" /> Reject Finding
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenApproveModal(ins)}
                          disabled={isActionBusy}
                          isLoading={isActionBusy}
                          className="text-xs"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve & Sign Diagnosis
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">
                          Status locked as <span className="text-white font-bold">{ins.review_status.toUpperCase()}</span>
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenModifyModal(ins)}
                          disabled={isActionBusy}
                          className="text-xs"
                          title="Revise clinical notes or override"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Re-Evaluate
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* APPROVE ACTION MODAL */}
      {approvingInsight && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-cyan-500/50 shadow-[0_0_30px_rgba(0,229,255,0.25)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3A5F] mb-4">
              <h3 className="text-base font-mono font-bold text-white flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                Flight Surgeon Sign-off & Approval
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setApprovingInsight(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-slate-300 font-mono mb-2">
              <span className="text-cyan-400 font-bold">Target Finding:</span> {approvingInsight.title}
            </p>

            <label className="block text-xs font-mono text-slate-400 mb-1.5 font-bold">
              OFFICIAL CLINICAL NOTES & DIRECTIVE:
            </label>
            <textarea
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono mb-4"
              placeholder="Enter flight surgeon validation notes..."
            />

            <div className="flex justify-end gap-2.5">
              <Button variant="ghost" size="sm" onClick={() => setApprovingInsight(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmApprove}
                isLoading={actionLoadingId === approvingInsight.id}
              >
                Confirm & Sign Approval
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* REJECT ACTION MODAL */}
      {rejectingInsight && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.25)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3A5F] mb-4">
              <h3 className="text-base font-mono font-bold text-white flex items-center gap-2">
                <X className="w-5 h-5 text-rose-400" />
                Reject AI Clinical Finding
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setRejectingInsight(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-slate-300 font-mono mb-3">
              <span className="text-rose-400 font-bold">Candidate:</span> {rejectingInsight.title}
            </p>

            <label className="block text-xs font-mono text-slate-400 mb-1.5 font-bold">
              CLINICAL REJECTION RATIONALE (REQUIRED MIN 5 CHARS):
            </label>
            <textarea
              value={rejectRationale}
              onChange={(e) => setRejectRationale(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 font-mono mb-4"
              placeholder="Provide physiological rationale (e.g. Artifact caused by suit sensor repositioning; baseline ECG unchanged)..."
            />

            <div className="flex justify-end gap-2.5">
              <Button variant="ghost" size="sm" onClick={() => setRejectingInsight(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmReject}
                isLoading={actionLoadingId === rejectingInsight.id}
                disabled={rejectRationale.trim().length < 5}
              >
                Confirm Rejection
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODIFY ACTION MODAL */}
      {modifyingInsight && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl border-cyan-500/50 shadow-[0_0_30px_rgba(0,229,255,0.25)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3A5F] mb-4">
              <h3 className="text-base font-mono font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                Flight Surgeon Diagnostic Override & Review
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setModifyingInsight(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-slate-400 font-mono mb-4">
              Target Finding: <span className="text-white font-bold">{modifyingInsight.title}</span>
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1 font-bold">
                  MODIFIED CLINICAL DIAGNOSIS (MIN 5 CHARS):
                </label>
                <textarea
                  value={modifiedDescription}
                  onChange={(e) => setModifiedDescription(e.target.value)}
                  placeholder="Enter corrected clinical diagnosis or adjusted physiological interpretation..."
                  rows={4}
                  className="w-full p-3 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1 font-bold">
                  SURGEON NOTES & DIRECTIVES:
                </label>
                <textarea
                  value={modifyNotes}
                  onChange={(e) => setModifyNotes(e.target.value)}
                  placeholder="Actionable clinical countermeasure, medication, or re-test directives..."
                  rows={2}
                  className="w-full p-3 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <Button variant="ghost" size="sm" onClick={() => setModifyingInsight(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmModify}
                isLoading={actionLoadingId === modifyingInsight.id}
                disabled={modifiedDescription.trim().length < 5}
              >
                Save & Sign Modification
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
