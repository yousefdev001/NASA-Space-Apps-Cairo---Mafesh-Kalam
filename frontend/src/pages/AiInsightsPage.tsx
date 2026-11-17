import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
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
  Sparkles,
} from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import {
  getWobblyStyle,
  Tape,
  SquiggleUnderline,
} from '../components/sketchbook';
import { clinicalApi } from '../api/clinicalApi';
import { AiInsight, AiInsightStats } from '../types/clinical.types';

export const AiInsightsPage: React.FC = () => {
  const { mode } = useThemeStore();
  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';
  const isSketch = isPaper || isDark;

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

  const getConfidenceNumber = (val: number | string): number => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 0;
    return num <= 1.0 ? num * 100 : num;
  };

  return (
    <div className={clsx('space-y-6', isPaper && 'paper-grain text-[#2d2d2d]', isDark && 'paper-grain-dark text-white')}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-block">
            <h1
              className={clsx(
                'text-2xl font-bold tracking-wide flex items-center gap-2.5',
                isSketch ? 'font-display-kalam text-2xl sm:text-3xl' : 'font-mono text-white',
                isPaper ? 'text-[#2d2d2d]' : isDark ? 'text-white' : 'text-white'
              )}
            >
              <BrainCircuit className={clsx('w-6 h-6', isPaper ? 'text-[#ff4d00]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400')} />
              AI CLINICAL INSIGHTS & FLIGHT SURGEON REVIEW
            </h1>
            {isSketch && (
              <div className="w-56 mt-0.5">
                <SquiggleUnderline className={isPaper ? 'text-[#ff4d00]' : 'text-[#FF4D00]'} />
              </div>
            )}
          </div>
          <p
            className={clsx(
              'text-xs mt-1',
              isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-400',
              isPaper ? 'text-[#2d2d2d]/75' : isDark ? 'text-white/70' : 'text-slate-400'
            )}
          >
            HUMAN-IN-THE-LOOP (HITL) MEDICAL AI VALIDATION · NASA FLIGHT SURGEON INTERVENTION
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stats && (
            <>
              <Badge status="info" themeMode={mode}>
                {stats.total} TOTAL INSIGHTS
              </Badge>
              <Badge status={stats.pending_review > 0 ? 'warning' : 'nominal'} themeMode={mode}>
                {stats.pending_review} PENDING REVIEWS
              </Badge>
              <Badge status="neutral" themeMode={mode}>
                AVG CONF: {stats.average_confidence}%
              </Badge>
            </>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualRefresh}
            isLoading={isRefreshing}
            style={isSketch ? getWobblyStyle('wobblySm') : undefined}
            className={clsx(
              'text-xs gap-1.5',
              isSketch && (
                isPaper
                  ? 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold hover:bg-[#fdfbf7]'
                  : 'bg-[#0c0c10] text-white border-2 border-[#FF4D00] sketch-btn-orange font-sketch-hand font-bold'
              )
            )}
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sync Telemetry
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
          className={clsx(
            'p-3.5 text-xs flex items-center gap-2 animate-fadeIn transition-all',
            isSketch
              ? isPaper
                ? 'bg-emerald-100 border-2 border-[#2d2d2d] text-emerald-950 font-sketch-hand text-sm sketch-shadow'
                : 'bg-emerald-950/80 border-2 border-emerald-400 text-emerald-200 font-sketch-hand text-sm sketch-shadow-orange'
              : 'rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 font-mono'
          )}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div
          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
          className={clsx(
            'p-3.5 text-xs flex items-center justify-between gap-2',
            isSketch
              ? isPaper
                ? 'bg-[#ff4d4d]/15 border-2 border-[#ff4d4d] text-rose-950 font-sketch-hand text-sm sketch-shadow'
                : 'bg-[#FF4D00]/20 border-2 border-[#FF4D00] text-rose-200 font-sketch-hand text-sm sketch-shadow-orange'
              : 'rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-300 font-mono'
          )}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs p-1 hover:opacity-75 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <Card
        themeMode={mode}
        radius="wobblySm"
        className={clsx(
          'p-4 transition-all',
          !isSketch && 'border-[#1E3A5F] bg-[#0B132B]/60'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Filter className={clsx('w-4 h-4', isPaper ? 'text-[#ff4d00]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400')} />
            <span
              className={clsx(
                'font-bold',
                isSketch ? 'font-sketch-hand text-sm tracking-wide' : 'font-mono text-cyan-400'
              )}
            >
              LIVE TELEMETRY FILTERS:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className={clsx(isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-400')}>
                Review Status:
              </span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'px-2.5 py-1 text-xs focus:outline-none cursor-pointer transition-all',
                  isSketch
                    ? isPaper
                      ? 'bg-white border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-sm shadow-[2px_2px_0px_0px_#2d2d2d]'
                      : 'bg-[#0c0c10] border-2 border-[#FF4D00] text-white font-sketch-hand text-sm shadow-[2px_2px_0px_0px_#FF4D00]'
                    : 'bg-[#050B14] border border-[#1E3A5F] rounded text-white font-mono focus:border-cyan-400'
                )}
              >
                <option value="all">All Reviews ({stats?.total ?? 0})</option>
                <option value="pending_review">Pending Review ({stats?.pending_review ?? 0})</option>
                <option value="approved">Approved ({stats?.approved ?? 0})</option>
                <option value="rejected">Rejected ({stats?.rejected ?? 0})</option>
                <option value="modified">Modified ({stats?.modified ?? 0})</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className={clsx(isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-400')}>
                Severity:
              </span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'px-2.5 py-1 text-xs focus:outline-none cursor-pointer transition-all',
                  isSketch
                    ? isPaper
                      ? 'bg-white border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-sm shadow-[2px_2px_0px_0px_#2d2d2d]'
                      : 'bg-[#0c0c10] border-2 border-[#FF4D00] text-white font-sketch-hand text-sm shadow-[2px_2px_0px_0px_#FF4D00]'
                    : 'bg-[#050B14] border border-[#1E3A5F] rounded text-white font-mono focus:border-cyan-400'
                )}
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
          <RefreshCw
            className={clsx(
              'w-8 h-8 animate-spin mx-auto',
              isPaper ? 'text-[#ff4d00]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'
            )}
          />
          <p
            className={clsx(
              'text-xs tracking-wider',
              isSketch ? 'font-sketch-hand text-base' : 'font-mono text-slate-400'
            )}
          >
            SYNCHRONIZING AI INFERENCE PIPELINE & FLIGHT SURGEON QUEUE...
          </p>
        </div>
      ) : insights.length === 0 ? (
        <Card
          themeMode={mode}
          radius="wobblyMd"
          decoration={isSketch ? 'tape' : 'none'}
          className="text-center py-16"
        >
          <BrainCircuit
            className={clsx('w-12 h-12 mx-auto mb-3', isPaper ? 'text-stone-400' : 'text-slate-600')}
          />
          <h3
            className={clsx(
              'text-base font-bold',
              isSketch ? 'font-display-kalam text-lg' : 'font-mono text-slate-300'
            )}
          >
            NO AI INSIGHTS FOUND
          </h3>
          <p
            className={clsx(
              'text-xs mt-1',
              isSketch ? 'font-sketch-hand text-sm text-stone-500' : 'font-mono text-slate-500'
            )}
          >
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
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'mt-4 text-xs',
                isSketch && (
                  isPaper
                    ? 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold'
                    : 'bg-[#0c0c10] text-white border-2 border-[#FF4D00] sketch-btn-orange font-sketch-hand font-bold'
                )
              )}
            >
              Reset Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-5">
          {insights.map((ins, idx) => {
            const astronautLabel = ins.astronaut
              ? `${ins.astronaut.full_name} (${ins.astronaut.callsign})`
              : `Astronaut #${ins.astronaut_id}`;
            const modelLabel = ins.job?.model_name || 'Autonomous AI Diagnostic';
            const isActionBusy = actionLoadingId === ins.id;
            const confPct = getConfidenceNumber(ins.confidence_score);

            return (
              <Card
                key={ins.id}
                themeMode={mode}
                radius="wobblyMd"
                decoration={isSketch ? (idx % 2 === 0 ? 'tape' : 'pin') : 'none'}
                className={clsx(
                  'transition-all relative',
                  !isSketch && 'border-[#1E3A5F] hover:border-cyan-500/40'
                )}
              >
                {/* Secondary tape detail on review decision cards in sketch mode */}
                {isSketch && idx % 2 === 1 && (
                  <div className="absolute -top-3 right-6 z-10 pointer-events-none">
                    <Tape isDark={isDark} className="rotate-3 w-16 h-5" />
                  </div>
                )}
                {/* Header Sub-bar */}
                <div
                  className={clsx(
                    'flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b',
                    isSketch
                      ? isPaper
                        ? 'border-dashed border-[#2d2d2d]/30'
                        : 'border-dashed border-[#FF4D00]/40'
                      : 'border-[#1E3A5F]'
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                      className={clsx(
                        'flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold select-none',
                        isSketch
                          ? isPaper
                            ? 'bg-stone-100 text-[#2d2d2d] border-2 border-[#2d2d2d] font-sketch-hand'
                            : 'bg-black text-[#FF4D00] border-2 border-[#FF4D00] font-sketch-hand'
                          : 'bg-[#050B14] border border-[#1E3A5F] text-cyan-400 font-mono rounded'
                      )}
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>{modelLabel}</span>
                    </span>

                    <span className={clsx('select-none', isPaper ? 'text-stone-400' : 'text-slate-500')}>·</span>

                    <div
                      className={clsx(
                        'flex items-center gap-1 text-xs font-semibold',
                        isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-white'
                      )}
                    >
                      <User className={clsx('w-3.5 h-3.5', isPaper ? 'text-[#ff4d00]' : 'text-cyan-400')} />
                      <span>{astronautLabel}</span>
                    </div>

                    <span className={clsx('select-none', isPaper ? 'text-stone-400' : 'text-slate-500')}>·</span>

                    <span
                      className={clsx(
                        'text-[11px]',
                        isSketch ? 'font-sketch-hand text-xs' : 'font-mono text-slate-400'
                      )}
                    >
                      Category:{' '}
                      <span className={clsx('uppercase font-bold', isPaper ? 'text-[#2d2d2d]' : 'text-slate-200')}>
                        {ins.insight_type}
                      </span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Neural Confidence Score Container */}
                    <div
                      style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                      className={clsx(
                        'flex items-center gap-2 px-2.5 py-0.5 border',
                        isSketch
                          ? isPaper
                            ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d]'
                            : 'bg-[#000000] border-2 border-[#FF4D00] text-white shadow-[2px_2px_0px_0px_#FF4D00]'
                          : 'bg-[#050B14] border-[#1E3A5F] rounded text-slate-300 font-mono text-xs'
                      )}
                    >
                      <Sparkles
                        className={clsx(
                          'w-3 h-3',
                          isPaper ? 'text-[#ff4d00]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'
                        )}
                      />
                      <span className={clsx('text-xs uppercase', isSketch ? 'font-sketch-hand' : 'font-mono text-slate-400')}>
                        Neural Conf:
                      </span>
                      <span
                        className={clsx(
                          'font-bold text-xs',
                          isSketch ? 'font-display-kalam text-sm' : 'text-cyan-300 font-mono',
                          isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : ''
                        )}
                      >
                        {formatConfidence(ins.confidence_score)}
                      </span>

                      {/* Mini handwritten confidence bar */}
                      <div
                        className={clsx(
                          'w-12 h-2 rounded-full overflow-hidden border',
                          isPaper ? 'bg-stone-200 border-[#2d2d2d]' : 'bg-zinc-800 border-white/40'
                        )}
                      >
                        <div
                          className={clsx(
                            'h-full transition-all',
                            isPaper
                              ? confPct > 80
                                ? 'bg-emerald-600'
                                : confPct > 60
                                ? 'bg-[#2d5da1]'
                                : 'bg-[#ff4d4d]'
                              : confPct > 80
                              ? 'bg-emerald-400'
                              : 'bg-[#FF4D00]'
                          )}
                          style={{ width: `${Math.min(100, Math.max(8, confPct))}%` }}
                        />
                      </div>
                    </div>

                    {/* Severity Badge */}
                    <Badge
                      themeMode={mode}
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
                      themeMode={mode}
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

                {/* Card Main Body */}
                <div className="py-4 space-y-3.5">
                  <h3
                    className={clsx(
                      'font-bold flex items-center gap-2',
                      isSketch ? 'font-display-kalam text-xl' : 'text-base font-sans text-white',
                      isPaper ? 'text-[#2d2d2d]' : 'text-white'
                    )}
                  >
                    {(ins.severity === 'high' || ins.severity === 'critical') && (
                      <AlertTriangle
                        className={clsx(
                          'w-5 h-5 shrink-0',
                          isPaper ? 'text-[#ff4d4d]' : 'text-rose-400'
                        )}
                      />
                    )}
                    <span>{ins.title}</span>
                  </h3>

                  <p
                    className={clsx(
                      'text-xs leading-relaxed',
                      isSketch ? 'font-sketch-hand text-base' : 'font-sans text-slate-300',
                      isPaper ? 'text-[#2d2d2d]/90' : isDark ? 'text-white/90' : 'text-slate-300'
                    )}
                  >
                    {ins.description}
                  </p>

                  {/* Clinical Recommendation Note */}
                  {ins.recommended_action && (
                    <div
                      style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                      className={clsx(
                        'p-3.5 text-xs transition-all',
                        isSketch
                          ? isPaper
                            ? 'bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] font-sketch-hand text-sm sketch-shadow'
                            : 'bg-[#18110c] text-[#ffddc0] border-2 border-[#FF4D00] font-sketch-hand text-sm sketch-shadow-orange'
                          : 'rounded-lg bg-[#050B14] border border-[#1E3A5F] text-cyan-300 font-mono'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={clsx(
                            'font-bold block tracking-wider',
                            isSketch ? 'font-display-kalam text-sm' : 'text-slate-400 text-xs'
                          )}
                        >
                          AI CLINICAL RECOMMENDATION & PROTOCOL:
                        </span>
                      </div>
                      <p className="leading-relaxed">{ins.recommended_action}</p>
                    </div>
                  )}

                  {/* Flight Surgeon Verification Log if exists */}
                  {ins.review && (
                    <div
                      style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                      className={clsx(
                        'p-3.5 text-xs transition-all',
                        isSketch
                          ? isPaper
                            ? 'bg-stone-50 border-2 border-[#2d5da1] text-[#2d2d2d] font-sketch-hand sketch-shadow'
                            : 'bg-[#0c0c10] border-2 border-[#FF4D00] text-white font-sketch-hand sketch-shadow-orange'
                          : 'rounded-lg bg-[#0B132B]/80 border border-cyan-500/30 font-mono'
                      )}
                    >
                      <div
                        className={clsx(
                          'flex items-center gap-2 font-bold mb-1.5',
                          isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-300'
                        )}
                      >
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span className={clsx(isSketch ? 'font-display-kalam text-base' : 'text-xs')}>
                          FLIGHT SURGEON HITL SIGN-OFF ({ins.review.decision.toUpperCase()}):
                        </span>
                      </div>

                      {ins.review.modified_description && (
                        <div
                          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                          className={clsx(
                            'mb-2 p-2.5 text-xs border',
                            isSketch
                              ? isPaper
                                ? 'bg-white border-[#2d2d2d]/30 text-[#2d2d2d]'
                                : 'bg-black border-[#FF4D00]/40 text-white'
                              : 'rounded bg-[#050B14] border-[#1E3A5F] text-slate-200 font-mono'
                          )}
                        >
                          <span
                            className={clsx(
                              'block text-[11px] uppercase font-bold mb-0.5',
                              isPaper ? 'text-stone-500' : 'text-slate-400'
                            )}
                          >
                            Surgeon Diagnostic Adjustment:
                          </span>
                          <span className={clsx(isSketch && 'text-sm font-sketch-hand')}>{ins.review.modified_description}</span>
                        </div>
                      )}

                      {ins.review.reviewer_notes && (
                        <p
                          className={clsx(
                            'italic text-[12px]',
                            isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-300',
                            isPaper ? 'text-stone-700' : 'text-slate-300'
                          )}
                        >
                          "{ins.review.reviewer_notes}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* HITL Action Controls Footer */}
                <div
                  className={clsx(
                    'pt-3 border-t flex flex-wrap items-center justify-between gap-3',
                    isSketch
                      ? isPaper
                        ? 'border-dashed border-[#2d2d2d]/30'
                        : 'border-dashed border-[#FF4D00]/40'
                      : 'border-[#1E3A5F]'
                  )}
                >
                  <div
                    className={clsx(
                      'text-[11px] flex items-center gap-1.5',
                      isSketch ? 'font-sketch-hand text-xs' : 'font-mono text-slate-400',
                      isPaper ? 'text-stone-600' : 'text-slate-400'
                    )}
                  >
                    <Clock className="w-3.5 h-3.5 opacity-70" />
                    <span>Analyzed: {new Date(ins.analyzed_at).toLocaleString()}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {ins.review_status === 'pending_review' ? (
                      <>
                        {/* Modify Button */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenModifyModal(ins)}
                          disabled={isActionBusy}
                          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                          className={clsx(
                            'text-xs transition-all',
                            isSketch && (
                              isPaper
                                ? 'bg-amber-100 hover:bg-amber-200 text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold'
                                : 'bg-[#18110c] hover:bg-[#251810] text-[#FF4D00] border-2 border-[#FF4D00] sketch-btn-orange font-sketch-hand font-bold'
                            )
                          )}
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Modify & Directives
                        </Button>

                        {/* Reject Button */}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleOpenRejectModal(ins)}
                          disabled={isActionBusy}
                          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                          className={clsx(
                            'text-xs transition-all',
                            isSketch && (
                              isPaper
                                ? 'bg-[#ff4d4d] hover:bg-[#e03a3a] text-white border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold'
                                : 'bg-[#FF4D00] hover:bg-[#e64500] text-black border-2 border-white sketch-btn-orange font-sketch-hand font-bold'
                            )
                          )}
                        >
                          <X className="w-3.5 h-3.5" /> Reject Finding
                        </Button>

                        {/* Approve Button */}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenApproveModal(ins)}
                          disabled={isActionBusy}
                          isLoading={isActionBusy}
                          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                          className={clsx(
                            'text-xs transition-all',
                            isSketch && (
                              isPaper
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-black border-2 border-white sketch-btn-orange font-sketch-hand font-bold'
                            )
                          )}
                        >
                          <Check className="w-3.5 h-3.5" /> Approve & Sign Diagnosis
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            'text-xs',
                            isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-400'
                          )}
                        >
                          Status locked as{' '}
                          <span
                            className={clsx(
                              'font-bold',
                              isPaper ? 'text-[#ff4d00]' : isDark ? 'text-[#FF4D00]' : 'text-white'
                            )}
                          >
                            {ins.review_status.toUpperCase()}
                          </span>
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenModifyModal(ins)}
                          disabled={isActionBusy}
                          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                          className={clsx(
                            'text-xs',
                            isSketch && (
                              isPaper
                                ? 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold'
                                : 'bg-[#0c0c10] text-white border-2 border-[#FF4D00] sketch-btn-orange font-sketch-hand font-bold'
                            )
                          )}
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
          <Card
            themeMode={mode}
            radius="wobblyMd"
            decoration={isSketch ? 'tape' : 'none'}
            className={clsx(
              'w-full max-w-lg transition-all',
              !isSketch && 'border-cyan-500/50 shadow-[0_0_30px_rgba(0,229,255,0.25)]'
            )}
          >
            <div
              className={clsx(
                'flex items-center justify-between pb-3 border-b mb-4',
                isSketch
                  ? isPaper
                    ? 'border-dashed border-[#2d2d2d]/30'
                    : 'border-dashed border-[#FF4D00]/40'
                  : 'border-[#1E3A5F]'
              )}
            >
              <h3
                className={clsx(
                  'font-bold flex items-center gap-2',
                  isSketch ? 'font-display-kalam text-lg sm:text-xl' : 'text-base font-mono text-white',
                  isPaper ? 'text-[#2d2d2d]' : 'text-white'
                )}
              >
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                Flight Surgeon Sign-off & Approval
              </h3>
              <button
                type="button"
                onClick={() => setApprovingInsight(null)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p
              className={clsx(
                'text-xs mb-2',
                isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-300'
              )}
            >
              <span className={clsx('font-bold', isPaper ? 'text-[#ff4d00]' : 'text-cyan-400')}>
                Target Finding:
              </span>{' '}
              {approvingInsight.title}
            </p>

            <label
              className={clsx(
                'block text-xs mb-1.5 font-bold',
                isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-400'
              )}
            >
              OFFICIAL CLINICAL NOTES & DIRECTIVE:
            </label>
            <textarea
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              rows={3}
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'w-full p-3 text-xs mb-4 focus:outline-none transition-all',
                isSketch
                  ? isPaper
                    ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-base shadow-[2px_2px_0px_0px_#2d2d2d]'
                    : 'bg-[#050B14] border-2 border-[#FF4D00] text-white font-sketch-hand text-base shadow-[2px_2px_0px_0px_#FF4D00]'
                  : 'rounded-lg bg-[#050B14] border border-[#1E3A5F] text-white placeholder-slate-500 focus:border-cyan-400 font-mono'
              )}
              placeholder="Enter flight surgeon validation notes..."
            />

            <div className="flex justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setApprovingInsight(null)}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(isSketch && 'font-sketch-hand font-bold text-sm')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmApprove}
                isLoading={actionLoadingId === approvingInsight.id}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  isSketch && (
                    isPaper
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold text-sm'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black border-2 border-white sketch-btn-orange font-sketch-hand font-bold text-sm'
                  )
                )}
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
          <Card
            themeMode={mode}
            radius="wobblyMd"
            decoration={isSketch ? 'tape' : 'none'}
            className={clsx(
              'w-full max-w-lg transition-all',
              !isSketch && 'border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.25)]'
            )}
          >
            <div
              className={clsx(
                'flex items-center justify-between pb-3 border-b mb-4',
                isSketch
                  ? isPaper
                    ? 'border-dashed border-[#2d2d2d]/30'
                    : 'border-dashed border-[#FF4D00]/40'
                  : 'border-[#1E3A5F]'
              )}
            >
              <h3
                className={clsx(
                  'font-bold flex items-center gap-2',
                  isSketch ? 'font-display-kalam text-lg sm:text-xl' : 'text-base font-mono text-white',
                  isPaper ? 'text-[#ff4d4d]' : 'text-rose-400'
                )}
              >
                <X className="w-5 h-5 shrink-0" />
                Reject AI Clinical Finding
              </h3>
              <button
                type="button"
                onClick={() => setRejectingInsight(null)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p
              className={clsx(
                'text-xs mb-3',
                isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-300'
              )}
            >
              <span className={clsx('font-bold', isPaper ? 'text-[#ff4d4d]' : 'text-rose-400')}>
                Candidate:
              </span>{' '}
              {rejectingInsight.title}
            </p>

            <label
              className={clsx(
                'block text-xs mb-1.5 font-bold',
                isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-400'
              )}
            >
              CLINICAL REJECTION RATIONALE (REQUIRED MIN 5 CHARS):
            </label>
            <textarea
              value={rejectRationale}
              onChange={(e) => setRejectRationale(e.target.value)}
              rows={3}
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'w-full p-3 text-xs mb-4 focus:outline-none transition-all',
                isSketch
                  ? isPaper
                    ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-base shadow-[2px_2px_0px_0px_#2d2d2d]'
                    : 'bg-[#050B14] border-2 border-[#FF4D00] text-white font-sketch-hand text-base shadow-[2px_2px_0px_0px_#FF4D00]'
                  : 'rounded-lg bg-[#050B14] border border-[#1E3A5F] text-white placeholder-slate-500 focus:border-rose-400 font-mono'
              )}
              placeholder="Provide physiological rationale (e.g. Artifact caused by suit sensor repositioning; baseline ECG unchanged)..."
            />

            <div className="flex justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRejectingInsight(null)}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(isSketch && 'font-sketch-hand font-bold text-sm')}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmReject}
                isLoading={actionLoadingId === rejectingInsight.id}
                disabled={rejectRationale.trim().length < 5}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  isSketch && (
                    isPaper
                      ? 'bg-[#ff4d4d] hover:bg-[#e03a3a] text-white border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold text-sm'
                      : 'bg-[#FF4D00] hover:bg-[#e64500] text-black border-2 border-white sketch-btn-orange font-sketch-hand font-bold text-sm'
                  )
                )}
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
          <Card
            themeMode={mode}
            radius="wobblyMd"
            decoration={isSketch ? 'tape' : 'none'}
            className={clsx(
              'w-full max-w-xl transition-all',
              !isSketch && 'border-cyan-500/50 shadow-[0_0_30px_rgba(0,229,255,0.25)]'
            )}
          >
            <div
              className={clsx(
                'flex items-center justify-between pb-3 border-b mb-4',
                isSketch
                  ? isPaper
                    ? 'border-dashed border-[#2d2d2d]/30'
                    : 'border-dashed border-[#FF4D00]/40'
                  : 'border-[#1E3A5F]'
              )}
            >
              <h3
                className={clsx(
                  'font-bold flex items-center gap-2',
                  isSketch ? 'font-display-kalam text-lg sm:text-xl' : 'text-base font-mono text-white',
                  isPaper ? 'text-[#2d2d2d]' : 'text-white'
                )}
              >
                <Edit3 className={clsx('w-5 h-5 shrink-0', isPaper ? 'text-[#ff4d00]' : 'text-cyan-400')} />
                Flight Surgeon Diagnostic Override & Review
              </h3>
              <button
                type="button"
                onClick={() => setModifyingInsight(null)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p
              className={clsx(
                'text-xs mb-4',
                isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-400'
              )}
            >
              Target Finding:{' '}
              <span className={clsx('font-bold', isPaper ? 'text-[#ff4d00]' : 'text-white')}>
                {modifyingInsight.title}
              </span>
            </p>

            <div className="space-y-3.5 mb-4">
              <div>
                <label
                  className={clsx(
                    'block text-xs mb-1 font-bold',
                    isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-400'
                  )}
                >
                  MODIFIED CLINICAL DIAGNOSIS (MIN 5 CHARS):
                </label>
                <textarea
                  value={modifiedDescription}
                  onChange={(e) => setModifiedDescription(e.target.value)}
                  placeholder="Enter corrected clinical diagnosis or adjusted physiological interpretation..."
                  rows={4}
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'w-full p-3 text-xs focus:outline-none transition-all',
                    isSketch
                      ? isPaper
                        ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-base shadow-[2px_2px_0px_0px_#2d2d2d]'
                        : 'bg-[#050B14] border-2 border-[#FF4D00] text-white font-sketch-hand text-base shadow-[2px_2px_0px_0px_#FF4D00]'
                      : 'rounded-lg bg-[#050B14] border border-[#1E3A5F] text-white placeholder-slate-500 focus:border-cyan-400 font-mono'
                  )}
                />
              </div>

              <div>
                <label
                  className={clsx(
                    'block text-xs mb-1 font-bold',
                    isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-400'
                  )}
                >
                  SURGEON NOTES & DIRECTIVES:
                </label>
                <textarea
                  value={modifyNotes}
                  onChange={(e) => setModifyNotes(e.target.value)}
                  placeholder="Actionable clinical countermeasure, medication, or re-test directives..."
                  rows={2}
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'w-full p-3 text-xs focus:outline-none transition-all',
                    isSketch
                      ? isPaper
                        ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-base shadow-[2px_2px_0px_0px_#2d2d2d]'
                        : 'bg-[#050B14] border-2 border-[#FF4D00] text-white font-sketch-hand text-base shadow-[2px_2px_0px_0px_#FF4D00]'
                      : 'rounded-lg bg-[#050B14] border border-[#1E3A5F] text-white placeholder-slate-500 focus:border-cyan-400 font-mono'
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModifyingInsight(null)}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(isSketch && 'font-sketch-hand font-bold text-sm')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmModify}
                isLoading={actionLoadingId === modifyingInsight.id}
                disabled={modifiedDescription.trim().length < 5}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  isSketch && (
                    isPaper
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold text-sm'
                      : 'bg-[#FF4D00] hover:bg-[#e64500] text-black border-2 border-white sketch-btn-orange font-sketch-hand font-bold text-sm'
                  )
                )}
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
