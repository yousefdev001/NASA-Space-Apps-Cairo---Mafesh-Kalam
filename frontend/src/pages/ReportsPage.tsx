import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { clsx } from 'clsx';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  FileText,
  Download,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  X,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { reportApi } from '../api/reportApi';
import {
  Report,
  ReportType,
  ReportForensicEvent,
  CreateReportPayload,
  REPORT_TYPE_CONFIG,
} from '../types/report.types';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import {
  getWobblyStyle,
  Tape,
  PushPin,
  SquiggleUnderline,
  SketchBadge,
} from '../components/sketchbook';

const ASTRONAUT_OPTIONS = [
  { id: 1, name: 'Elena Vance', callsign: 'CDR-01', role: 'Commander' },
  { id: 2, name: 'Marcus Chen', callsign: 'PLT-02', role: 'Pilot' },
  { id: 3, name: 'Arya Patel', callsign: 'SPC-03', role: 'Payload Specialist' },
  { id: 4, name: 'Alexei Ivanov', callsign: 'ENG-04', role: 'Flight Engineer' },
];

const MISSION_OPTIONS = [
  { id: 1, name: 'Artemis IV Lunar Gateway Habitat Assembly', code: 'ARTEMIS-IV' },
  { id: 2, name: 'ISS Microgravity Long-Duration Cellular Study', code: 'EXPEDITION-74' },
  { id: 3, name: 'Deep-Space Mars Habitat Transit Simulation', code: 'ARES-PATHFINDER' },
];

interface FormForensicEvent {
  event_time: string;
  event_type: string;
  title: string;
  description: string;
  related_metric: string;
  metric_value: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
}

export const ReportsPage: React.FC = () => {
  const { mode } = useThemeStore();
  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';
  const isSketch = isPaper || isDark;

  const { user, hasRole, hasPermission } = useAuthStore();

  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending_review'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [astronautFilter, setAstronautFilter] = useState<string>('all');

  // Action states
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);
  const [downloadingCsvId, setDownloadingCsvId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [expandedSummaryIds, setExpandedSummaryIds] = useState<Record<number, boolean>>({});

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Forensic Timeline Modal State
  const [selectedReportForTimeline, setSelectedReportForTimeline] = useState<Report | null>(null);
  const [timelineLoading, setTimelineLoading] = useState<boolean>(false);
  const [timelineEvents, setTimelineEvents] = useState<ReportForensicEvent[]>([]);
  const [timelineDossierHash, setTimelineDossierHash] = useState<string | null>(null);
  const [timelineAuditChain, setTimelineAuditChain] = useState<
    Array<{
      id: number;
      event_type: string;
      previous_hash: string;
      current_hash: string;
      created_at: string;
    }>
  >([]);

  // Generate Report Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Generate Report Form state
  const [formTitle, setFormTitle] = useState<string>('');
  const [formReportType, setFormReportType] = useState<ReportType>('crew_health_summary');
  const [formAstronautId, setFormAstronautId] = useState<string>('1');
  const [formMissionId, setFormMissionId] = useState<string>('1');
  const [formPeriodStart, setFormPeriodStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [formPeriodEnd, setFormPeriodEnd] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [formSummary, setFormSummary] = useState<string>('');
  const [includeForensicEvents, setIncludeForensicEvents] = useState<boolean>(true);
  const [formForensicEvents, setFormForensicEvents] = useState<FormForensicEvent[]>(() => [
    {
      event_time: new Date().toISOString().slice(0, 16),
      event_type: 'EVA Ingress / Repress',
      title: 'Cabin Pressurization & Pulmonary Equilibrium',
      description: 'SpO2 stabilized to 98% within 4 minutes of suit umbilical air-feed connection.',
      related_metric: 'SpO2 / Respiration',
      metric_value: '98% / 14 bpm',
      severity: 'info',
    },
  ]);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  const canApprove = useMemo(() => {
    if (!user) return true; // Default permissive for demo mode
    return (
      hasRole(['flight_surgeon', 'mission_director', 'system_administrator']) ||
      hasPermission('approve_reports')
    );
  }, [user, hasRole, hasPermission]);

  // Load reports from backend
  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await reportApi.getReports({ per_page: 50 });
      setReports(res.data || []);
    } catch (err: unknown) {
      console.error('Failed to fetch reports:', err);
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to connect to Ground Station Reports API.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void fetchReports();
  }, [fetchReports]);

  // PDF Download Handler
  const handleDownloadPdf = async (report: Report) => {
    try {
      setDownloadingPdfId(report.id);
      showToast(`Generating official PDF for ${report.report_code}...`, 'info');
      await reportApi.downloadPdf(report.id, report.report_code);
      showToast(`AuraMed_${report.report_code}.pdf downloaded successfully!`, 'success');
    } catch (err) {
      console.error('PDF download error:', err);
      showToast(`Failed to download PDF for ${report.report_code}. Please check permissions.`, 'error');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  // CSV Download Handler
  const handleDownloadCsv = async (report: Report) => {
    try {
      setDownloadingCsvId(report.id);
      showToast(`Generating event data CSV for ${report.report_code}...`, 'info');
      await reportApi.downloadCsv(report.id, report.report_code);
      showToast(`AuraMed_${report.report_code}_events.csv downloaded successfully!`, 'success');
    } catch (err) {
      console.error('CSV download error:', err);
      showToast(`Failed to download CSV for ${report.report_code}.`, 'error');
    } finally {
      setDownloadingCsvId(null);
    }
  };

  // Approve Report Handler
  const handleApproveReport = async (report: Report) => {
    try {
      setApprovingId(report.id);
      const updated = await reportApi.approveReport(report.id);
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, ...updated, status: 'approved' } : r))
      );
      showToast(`Report [${report.report_code}] approved and finalized into official audit ledger.`, 'success');
    } catch (err) {
      console.error('Report approval failed:', err);
      showToast(`Failed to approve report [${report.report_code}].`, 'error');
    } finally {
      setApprovingId(null);
    }
  };

  // Open Forensic Timeline Modal
  const handleOpenTimeline = async (report: Report) => {
    setSelectedReportForTimeline(report);
    setTimelineLoading(true);
    setTimelineDossierHash(null);
    setTimelineAuditChain([]);
    try {
      const res = await reportApi.getForensicTimeline(report.id);
      setTimelineEvents(res.events || []);
      setTimelineDossierHash(res.dossier_hash || null);
      setTimelineAuditChain(res.audit_chain || []);
    } catch (err) {
      console.error('Failed to load forensic events detail via /forensic:', err);
      try {
        const detail = await reportApi.getReport(report.id);
        setTimelineEvents(detail.forensic_events || []);
      } catch {
        setTimelineEvents(report.forensic_events || []);
      }
    } finally {
      setTimelineLoading(false);
    }
  };

  // Handle Form Forensic Event change
  const handleEventChange = (
    index: number,
    field: keyof FormForensicEvent,
    value: string
  ) => {
    setFormForensicEvents((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddEventRow = () => {
    setFormForensicEvents((prev) => [
      ...prev,
      {
        event_time: new Date().toISOString().slice(0, 16),
        event_type: 'Biomedical Sensor Alert',
        title: 'Physiological Metric Delta Observed',
        description: 'Automated telemetry sensor delta recorded during orbital transit pass.',
        related_metric: 'Heart Rate / SpO2',
        metric_value: 'Nominal',
        severity: 'info',
      },
    ]);
  };

  const handleRemoveEventRow = (index: number) => {
    setFormForensicEvents((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Create Report
  const handleCreateReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setCreateError('Report title is required.');
      return;
    }
    if (!formSummary.trim()) {
      setCreateError('Executive clinical summary is required.');
      return;
    }

    try {
      setIsSubmittingReport(true);
      setCreateError(null);

      const payload: CreateReportPayload = {
        title: formTitle.trim(),
        report_type: formReportType,
        astronaut_id: formAstronautId ? Number(formAstronautId) : null,
        mission_id: formMissionId ? Number(formMissionId) : null,
        period_start: formPeriodStart ? `${formPeriodStart}T00:00:00Z` : undefined,
        period_end: formPeriodEnd ? `${formPeriodEnd}T23:59:59Z` : undefined,
        summary: formSummary.trim(),
        forensic_events: includeForensicEvents
          ? formForensicEvents.map((evt) => ({
              event_time: evt.event_time ? new Date(evt.event_time).toISOString() : new Date().toISOString(),
              event_type: evt.event_type,
              title: evt.title,
              description: evt.description,
              related_metric: evt.related_metric,
              metric_value: evt.metric_value,
              severity: evt.severity,
            }))
          : [],
      };

      const newReport = await reportApi.createReport(payload);
      showToast(`Report [${newReport.report_code}] generated successfully!`, 'success');
      setIsGenerateModalOpen(false);

      // Reset form
      setFormTitle('');
      setFormSummary('');

      // Refresh list
      await fetchReports();
    } catch (err: unknown) {
      console.error('Failed to create report:', err);
      const msg =
        err && typeof err === 'object' && 'response' in err && (err as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (err as { response: { data: { message: string } } }).response.data.message
          : 'Failed to create report. Verify required fields.';
      setCreateError(msg);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'all' && r.report_type !== typeFilter) {
        return false;
      }
      // Astronaut filter
      if (astronautFilter !== 'all') {
        if (astronautFilter === 'fleet') {
          if (r.astronaut_id !== null && r.astronaut_id !== undefined) return false;
        } else if (String(r.astronaut_id) !== astronautFilter) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const codeMatch = r.report_code?.toLowerCase().includes(query);
        const titleMatch = r.title?.toLowerCase().includes(query);
        const authorMatch = r.author?.name?.toLowerCase().includes(query);
        const astroMatch = r.astronaut?.full_name?.toLowerCase().includes(query);
        const summaryMatch = r.summary?.toLowerCase().includes(query);
        if (!codeMatch && !titleMatch && !authorMatch && !astroMatch && !summaryMatch) {
          return false;
        }
      }
      return true;
    });
  }, [reports, statusFilter, typeFilter, astronautFilter, searchQuery]);

  const toggleSummaryExpand = (id: number) => {
    setExpandedSummaryIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatPeriod = (start?: string | null, end?: string | null) => {
    if (!start && !end) return 'Mission Inception → Present';
    const s = start ? new Date(start).toISOString().split('T')[0] : 'Inception';
    const e = end ? new Date(end).toISOString().split('T')[0] : 'Present';
    return `${s} → ${e}`;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
          className={clsx(
            'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 border text-xs shadow-2xl backdrop-blur-md transition-all duration-300',
            isSketch
              ? isDark
                ? 'bg-black text-white border-2 border-[#FF4D00] sketch-shadow-orange font-sketch-hand text-sm'
                : 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-shadow font-sketch-hand text-sm'
              : toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-emerald-900/30 font-mono rounded-lg'
                : toastMessage.type === 'error'
                  ? 'bg-rose-950/90 text-rose-300 border-rose-500/50 shadow-rose-900/30 font-mono rounded-lg'
                  : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50 shadow-cyan-900/30 font-mono rounded-lg'
          )}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toastMessage.type === 'info' && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
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
          <div className="absolute -top-3.5 left-12 z-10">
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
                  ? 'bg-[#fff9c4] border-2 border-[#2d2d2d] text-[#2d2d2d]'
                  : isDark
                    ? 'bg-black border-2 border-[#FF4D00] text-[#FF4D00]'
                    : 'rounded-lg bg-cyan-950 border-cyan-500/50 text-cyan-400'
              )}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1
                className={clsx(
                  'text-2xl font-bold tracking-wide',
                  isSketch ? 'font-display-kalam text-2xl sm:text-3xl' : 'font-mono text-white'
                )}
              >
                MISSION MEDICAL REPORTS &amp; FORENSIC DOSSIERS
              </h1>
              {isSketch && (
                <div className="w-60 text-[#ff4d00]">
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
            OFFICIAL NASA CLINICAL FLIGHT SURGEON DOSSIERS (RPT-01 TO RPT-09) · FORENSIC TIMELINE
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchReports}
            disabled={isLoading}
            style={isSketch ? getWobblyStyle('wobblySm') : undefined}
            className={clsx(
              'text-xs gap-1.5 font-bold',
              isSketch
                ? isDark
                  ? 'bg-black text-[#FF4D00] border-2 border-[#FF4D00] sketch-btn-orange font-sketch-hand text-sm'
                  : 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand text-sm'
                : ''
            )}
            title="Reload reports from Ground Station"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsGenerateModalOpen(true)}
            style={isSketch ? getWobblyStyle('wobblySm') : undefined}
            className={clsx(
              'gap-1.5 text-xs font-bold',
              isSketch
                ? isDark
                  ? 'bg-[#FF4D00] text-black border-2 border-white sketch-btn-orange font-sketch-hand text-base px-4'
                  : 'bg-[#ff4d00] text-white border-2 border-[#2d2d2d] sketch-btn font-sketch-hand text-base px-4'
                : ''
            )}
          >
            <Plus className="w-4 h-4" />
            + Generate Clinical Report
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card
        themeMode={mode}
        className={clsx(
          'relative p-4 transition-all',
          !isSketch && 'border-[#1E3A5F] bg-[#07101E]/90'
        )}
      >
        {isSketch && (
          <div className="absolute -top-2.5 right-6 z-10">
            <PushPin isDark={isDark} />
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search
              className={clsx(
                'w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2',
                isSketch ? 'text-[#2d2d2d]/60 dark:text-white/60' : 'text-slate-400'
              )}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code (e.g. RPT-01), title, astronaut, or keyword..."
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'w-full pl-9 pr-3 py-1.5 text-xs focus:outline-none transition-colors border',
                isPaper
                  ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] placeholder-[#2d2d2d]/50 font-sketch-hand text-sm'
                  : isDark
                    ? 'bg-black border-2 border-[#FF4D00] text-white placeholder-white/50 font-sketch-hand text-sm focus:border-white'
                    : 'rounded-lg bg-[#050B14] border-[#1E3A5F] text-white placeholder-slate-500 focus:border-cyan-400 font-mono'
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div
            className={clsx(
              'flex flex-wrap items-center gap-2 text-xs',
              isSketch ? 'font-sketch-hand text-sm' : 'font-mono'
            )}
          >
            <div className="flex items-center gap-1.5 font-bold opacity-80">
              <Filter className="w-3.5 h-3.5 text-[#ff4d00]" />
              <span>Filters:</span>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'approved' | 'pending_review')}
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'px-2.5 py-1.5 text-xs focus:outline-none border cursor-pointer',
                isPaper
                  ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d]'
                  : isDark
                    ? 'bg-black border-2 border-[#FF4D00] text-white'
                    : 'rounded-lg bg-[#050B14] border-[#1E3A5F] text-slate-300 focus:border-cyan-400'
              )}
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending_review">Pending Review</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'px-2.5 py-1.5 text-xs focus:outline-none border max-w-[160px] truncate cursor-pointer',
                isPaper
                  ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d]'
                  : isDark
                    ? 'bg-black border-2 border-[#FF4D00] text-white'
                    : 'rounded-lg bg-[#050B14] border-[#1E3A5F] text-slate-300 focus:border-cyan-400'
              )}
            >
              <option value="all">All Report Types</option>
              {Object.entries(REPORT_TYPE_CONFIG).map(([typeKey, cfg]) => (
                <option key={typeKey} value={typeKey}>
                  {cfg.code} - {cfg.label}
                </option>
              ))}
            </select>

            {/* Astronaut Filter */}
            <select
              value={astronautFilter}
              onChange={(e) => setAstronautFilter(e.target.value)}
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'px-2.5 py-1.5 text-xs focus:outline-none border cursor-pointer',
                isPaper
                  ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d]'
                  : isDark
                    ? 'bg-black border-2 border-[#FF4D00] text-white'
                    : 'rounded-lg bg-[#050B14] border-[#1E3A5F] text-slate-300 focus:border-cyan-400'
              )}
            >
              <option value="all">All Crew</option>
              {ASTRONAUT_OPTIONS.map((astro) => (
                <option key={astro.id} value={String(astro.id)}>
                  {astro.callsign} · {astro.name}
                </option>
              ))}
              <option value="fleet">Fleet / Mission-Wide</option>
            </select>

            {/* Clear filters shortcut */}
            {(statusFilter !== 'all' || typeFilter !== 'all' || astronautFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setAstronautFilter('all');
                  setSearchQuery('');
                }}
                className={clsx(
                  'text-xs underline underline-offset-2 ml-1 cursor-pointer font-bold',
                  isPaper ? 'text-[#ff4d00]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'
                )}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Counter Pill & Certified Clinical Stamp */}
        <div
          className={clsx(
            'mt-2.5 pt-2 flex items-center justify-between text-[11px] border-t',
            isSketch
              ? isDark
                ? 'border-[#FF4D00]/40 border-dashed font-sketch-hand text-xs'
                : 'border-[#2d2d2d]/30 border-dashed font-sketch-hand text-xs'
              : 'border-[#1E3A5F]/50 font-mono text-slate-400'
          )}
        >
          <span>
            Displaying <strong className={isPaper ? 'text-[#ff4d00]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-300'}>{filteredReports.length}</strong> of{' '}
            <strong className="text-current font-bold">{reports.length}</strong> official clinical dossiers
          </span>
          <span className="flex items-center gap-1.5 opacity-80">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Sanctum Authenticated · DomPDF Engine Online
          </span>
        </div>
      </Card>

      {/* Reports List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm">Retrieving mission clinical dossiers from Ground Station telemetry core...</p>
        </div>
      ) : error ? (
        <Card
          themeMode={mode}
          className={clsx(
            'p-6 text-center border',
            isPaper
              ? 'bg-rose-50 border-2 border-[#2d2d2d] text-rose-950'
              : isDark
                ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300'
                : 'border-rose-500/50 bg-rose-950/20'
          )}
        >
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h3 className="text-sm font-mono font-bold mb-1">Failed to Load Reports</h3>
          <p className="text-xs font-mono mb-4">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchReports}>
            Retry Request
          </Button>
        </Card>
      ) : filteredReports.length === 0 ? (
        <Card
          themeMode={mode}
          className={clsx(
            'p-12 text-center border',
            isPaper
              ? 'bg-white border-2 border-[#2d2d2d]'
              : isDark
                ? 'bg-[#0c0c10] border-2 border-[#FF4D00]'
                : 'border-[#1E3A5F] bg-[#07101E]/80'
          )}
        >
          <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3
            className={clsx(
              'text-base font-bold mb-1',
              isSketch ? 'font-display-kalam text-lg' : 'font-mono text-white'
            )}
          >
            No Matching Medical Dossiers Found
          </h3>
          <p
            className={clsx(
              'text-xs max-w-md mx-auto mb-5',
              isSketch ? 'font-sketch-hand text-sm opacity-80' : 'font-mono text-slate-400'
            )}
          >
            No clinical reports match your active filters or search terms. Try clearing filters or create a new formal dossier.
          </p>
          <Button variant="primary" size="sm" onClick={() => setIsGenerateModalOpen(true)}>
            + Generate Clinical Report
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report, idx) => {
            const typeConfig = REPORT_TYPE_CONFIG[report.report_type] || {
              code: 'RPT',
              label: report.report_type.replace('_', ' '),
              description: '',
            };
            const isApproved = report.status === 'approved';
            const isDownloadingPdf = downloadingPdfId === report.id;
            const isDownloadingCsv = downloadingCsvId === report.id;
            const isApproving = approvingId === report.id;
            const isExpanded = !!expandedSummaryIds[report.id];

            return (
              <Card
                key={report.id}
                themeMode={mode}
                decoration={isSketch ? (idx % 2 === 0 ? 'tape' : 'pin') : 'none'}
                className={clsx(
                  'p-5 transition-colors duration-200',
                  !isSketch && 'border-[#1E3A5F] hover:border-cyan-500/40 bg-[#07101E]/90'
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  {/* Left Column: Metadata & Details */}
                  <div className="space-y-2.5 flex-1">
                    {/* Header line: Code stamp + Status Badge + Type + Period */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                        className={clsx(
                          'text-xs font-bold px-2.5 py-0.5 border',
                          isPaper
                            ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d] font-sketch-hand'
                            : isDark
                              ? 'bg-[#FF4D00] text-black border-white font-sketch-hand'
                              : 'font-mono text-cyan-400 rounded bg-[#050B14] border-[#1E3A5F]'
                        )}
                      >
                        {report.report_code}
                      </span>

                      <span
                        style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                        className={clsx(
                          'text-[11px] font-semibold px-2 py-0.5 border',
                          isPaper
                            ? 'bg-[#2d5da1]/15 text-[#2d5da1] border-[#2d5da1] font-sketch-hand'
                            : isDark
                              ? 'bg-[#FF4D00]/25 text-[#FF4D00] border-[#FF4D00] font-sketch-hand'
                              : 'font-mono text-cyan-300 rounded bg-cyan-950/40 border-cyan-800/40'
                        )}
                      >
                        {typeConfig.code} · {typeConfig.label}
                      </span>

                      {/* Certified Clinical Stamp Badge */}
                      {isSketch ? (
                        <SketchBadge
                          variant={isApproved ? 'nominal' : 'warning'}
                          mode={mode}
                        >
                          {report.status.replace('_', ' ').toUpperCase()}
                        </SketchBadge>
                      ) : (
                        <Badge status={isApproved ? 'nominal' : 'warning'}>
                          {report.status.replace('_', ' ')}
                        </Badge>
                      )}

                      <span
                        className={clsx(
                          'text-xs flex items-center gap-1 ml-1',
                          isSketch ? 'font-sketch-hand opacity-75' : 'font-mono text-slate-400'
                        )}
                      >
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {formatPeriod(report.period_start, report.period_end)}
                      </span>
                    </div>

                    {/* Report Title */}
                    <h3
                      className={clsx(
                        'text-base sm:text-lg font-bold tracking-wide',
                        isSketch ? 'font-display-kalam text-xl' : 'text-white'
                      )}
                    >
                      {report.title}
                    </h3>

                    {/* Subject Scope & Mission */}
                    <div
                      className={clsx(
                        'grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs',
                        isSketch ? 'font-sketch-hand text-sm font-semibold' : 'font-mono text-slate-300'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#ff4d00] shrink-0" />
                        <span>
                          Subject Scope:{' '}
                          {report.astronaut ? (
                            <span className={isPaper ? 'text-[#2d5da1] font-bold' : isDark ? 'text-[#FF4D00] font-bold' : 'text-cyan-300 font-semibold'}>
                              {report.astronaut.full_name} ({report.astronaut.callsign})
                            </span>
                          ) : (
                            <span className="opacity-75 italic">Fleet-Wide / Mission Habitat</span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-[#ff4d00] shrink-0" />
                        <span>
                          Mission:{' '}
                          <span className="opacity-90">
                            {report.mission ? report.mission.name : 'Artemis Program'}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Author & Approval trail */}
                    <div
                      className={clsx(
                        'flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] border-t pt-2',
                        isSketch
                          ? isDark
                            ? 'border-[#FF4D00]/40 border-dashed font-sketch-hand text-xs'
                            : 'border-[#2d2d2d]/30 border-dashed font-sketch-hand text-xs'
                          : 'border-[#1E3A5F]/40 font-mono text-slate-400'
                      )}
                    >
                      <span>
                        Author:{' '}
                        <strong className="opacity-90">
                          {report.author?.name || 'Autonomous Bio-Astronautics System'}
                        </strong>
                      </span>

                      {isApproved ? (
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved by {report.approver?.name || 'Director Gene Kranz'}
                          {report.approved_at && (
                            <span className="opacity-70">
                              {' '}
                              · {new Date(report.approved_at).toISOString().split('T')[0]}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-amber-500 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending Flight Surgeon / Director Sign-off
                        </span>
                      )}
                    </div>

                    {/* Clinical Summary Excerpt / Box - Physician's Attached Field Note */}
                    {report.summary && (
                      <div
                        style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                        className={clsx(
                          'mt-2 p-2.5',
                          isPaper
                            ? 'bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] shadow-sm font-sketch-hand text-sm'
                            : isDark
                              ? 'bg-black text-white border-2 border-[#FF4D00]/50 font-sketch-hand text-sm'
                              : 'text-xs text-slate-300 bg-[#050B14]/80 border-l-2 border-cyan-400 rounded-r font-mono'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={isExpanded ? '' : 'line-clamp-2'}>
                            {report.summary}
                          </p>
                          {report.summary.length > 130 && (
                            <button
                              onClick={() => toggleSummaryExpand(report.id)}
                              className={clsx(
                                'shrink-0 flex items-center text-[10px] gap-0.5 mt-0.5 font-bold cursor-pointer',
                                isPaper ? 'text-[#ff4d00]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'
                              )}
                            >
                              {isExpanded ? (
                                <>
                                  Less <ChevronUp className="w-3 h-3" />
                                </>
                              ) : (
                                <>
                                  More <ChevronDown className="w-3 h-3" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Tactile Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0 w-full lg:w-auto">
                    {/* View Forensic Timeline Button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenTimeline(report)}
                      style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                      className={clsx(
                        'text-xs gap-1.5 w-full justify-center font-bold',
                        isSketch
                          ? isDark
                            ? 'bg-black text-[#FF4D00] border-2 border-[#FF4D00] sketch-btn-orange font-sketch-hand'
                            : 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand'
                          : ''
                      )}
                      title="Inspect chronological telemetry events and forensic timeline"
                    >
                      <Eye className="w-3.5 h-3.5 text-current" />
                      Forensic Timeline
                    </Button>

                    <div className="flex items-center gap-2 w-full">
                      {/* Tactile PDF Download Button */}
                      <Button
                        variant={isSketch ? 'secondary' : 'hud'}
                        size="sm"
                        onClick={() => handleDownloadPdf(report)}
                        disabled={isDownloadingPdf}
                        style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                        className={clsx(
                          'text-xs gap-1.5 flex-1 justify-center font-bold',
                          isSketch
                            ? isDark
                              ? 'bg-[#FF4D00] text-black border-2 border-white sketch-btn-orange font-sketch-hand'
                              : 'bg-[#2d5da1] text-white border-2 border-[#2d2d2d] sketch-btn font-sketch-hand'
                            : 'border-cyan-500/50 hover:border-cyan-400'
                        )}
                        title="Export official printable NASA DomPDF report"
                      >
                        {isDownloadingPdf ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-current" />
                        )}
                        <span>{isDownloadingPdf ? 'Generating...' : 'PDF'}</span>
                      </Button>

                      {/* Tactile CSV Download Button */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownloadCsv(report)}
                        disabled={isDownloadingCsv}
                        style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                        className={clsx(
                          'text-xs gap-1.5 flex-1 justify-center font-bold',
                          isSketch
                            ? isDark
                              ? 'bg-black text-white border-2 border-[#FF4D00] sketch-btn-orange font-sketch-hand'
                              : 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand'
                            : ''
                        )}
                        title="Download raw event metrics as CSV"
                      >
                        {isDownloadingCsv ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>{isDownloadingCsv ? 'Exporting...' : 'CSV'}</span>
                      </Button>
                    </div>

                    {/* Approve Button (when pending_review) */}
                    {!isApproved && canApprove && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApproveReport(report)}
                        disabled={isApproving}
                        style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                        className={clsx(
                          'text-xs gap-1.5 w-full justify-center font-bold',
                          isSketch
                            ? isDark
                              ? 'bg-emerald-500 text-black border-2 border-white sketch-btn-orange font-sketch-hand'
                              : 'bg-emerald-600 text-white border-2 border-[#2d2d2d] sketch-btn font-sketch-hand'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        )}
                        title="Authorize and digitally sign this clinical dossier"
                      >
                        {isApproving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>{isApproving ? 'Signing...' : 'Approve Dossier'}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: Generate Clinical Report Modal                         */}
      {/* ============================================================== */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card
            themeMode={mode}
            className={clsx(
              'w-full max-w-2xl max-h-[92vh] flex flex-col p-0',
              !isSketch && 'border-cyan-500/50 shadow-[0_0_35px_rgba(0,229,255,0.25)] bg-[#07101E]'
            )}
          >
            {/* Modal Header */}
            <div
              className={clsx(
                'px-6 py-4 flex items-center justify-between border-b',
                isPaper
                  ? 'bg-[#fdfbf7] border-[#2d2d2d]'
                  : isDark
                    ? 'bg-black border-[#FF4D00]'
                    : 'bg-[#050B14] border-[#1E3A5F]'
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
                  className={clsx(
                    'w-8 h-8 flex items-center justify-center border',
                    isPaper
                      ? 'bg-[#fff9c4] border-2 border-[#2d2d2d] text-[#2d2d2d]'
                      : isDark
                        ? 'bg-black border-2 border-[#FF4D00] text-[#FF4D00]'
                        : 'rounded-lg bg-cyan-950/70 border-cyan-500/40 text-cyan-400'
                  )}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    className={clsx(
                      'text-base font-bold tracking-wide',
                      isSketch ? 'font-display-kalam text-lg' : 'font-mono text-white'
                    )}
                  >
                    GENERATE CLINICAL REPORT (RPT-01 TO RPT-09)
                  </h3>
                  <p
                    className={clsx(
                      'text-[11px]',
                      isSketch ? 'font-sketch-hand opacity-75' : 'font-mono text-slate-400'
                    )}
                  >
                    Official NASA Clinical Flight Surgeon Dossier Generation Protocol
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateReportSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {createError && (
                <div
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'p-3 border text-xs flex items-center gap-2',
                    isPaper
                      ? 'bg-rose-100 text-rose-950 border-2 border-[#2d2d2d] font-sketch-hand'
                      : isDark
                        ? 'bg-rose-950/60 text-rose-300 border-2 border-rose-500 font-sketch-hand'
                        : 'rounded-lg bg-rose-950/40 border-rose-500/50 text-rose-300 font-mono'
                  )}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1.5">
                <label
                  className={clsx(
                    'block text-xs font-bold',
                    isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-300'
                  )}
                >
                  REPORT TITLE <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Artemis IV Trans-Lunar EVA Sortie Biometric Health Debrief"
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'w-full px-3 py-2 text-xs focus:outline-none border',
                    isPaper
                      ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-sm'
                      : isDark
                        ? 'bg-black border-2 border-[#FF4D00] text-white font-sketch-hand text-sm'
                        : 'rounded-lg bg-[#050B14] border-[#1E3A5F] text-white placeholder-slate-500 focus:border-cyan-400 font-mono'
                  )}
                />
              </div>

              {/* Report Type & Astronaut Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Report Type Select */}
                <div className="space-y-1.5">
                  <label
                    className={clsx(
                      'block text-xs font-bold',
                      isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-300'
                    )}
                  >
                    REPORT TYPE (RPT SPECIFICATION) <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formReportType}
                    onChange={(e) => setFormReportType(e.target.value as ReportType)}
                    style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                    className={clsx(
                      'w-full px-3 py-2 text-xs focus:outline-none border cursor-pointer',
                      isPaper
                        ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-sm'
                        : isDark
                          ? 'bg-black border-2 border-[#FF4D00] text-white font-sketch-hand text-sm'
                          : 'rounded-lg bg-[#050B14] border-[#1E3A5F] text-white focus:border-cyan-400 font-mono'
                    )}
                  >
                    {Object.entries(REPORT_TYPE_CONFIG).map(([typeKey, cfg]) => (
                      <option key={typeKey} value={typeKey}>
                        {cfg.code} · {cfg.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-cyan-400 font-mono">
                    {REPORT_TYPE_CONFIG[formReportType]?.description}
                  </p>
                </div>

                {/* Astronaut Select */}
                <div className="space-y-1.5">
                  <label
                    className={clsx(
                      'block text-xs font-bold',
                      isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-300'
                    )}
                  >
                    ASTRONAUT SUBJECT
                  </label>
                  <select
                    value={formAstronautId}
                    onChange={(e) => setFormAstronautId(e.target.value)}
                    style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                    className={clsx(
                      'w-full px-3 py-2 text-xs focus:outline-none border cursor-pointer',
                      isPaper
                        ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-sm'
                        : isDark
                          ? 'bg-black border-2 border-[#FF4D00] text-white font-sketch-hand text-sm'
                          : 'rounded-lg bg-[#050B14] border-[#1E3A5F] text-white focus:border-cyan-400 font-mono'
                    )}
                  >
                    {ASTRONAUT_OPTIONS.map((astro) => (
                      <option key={astro.id} value={String(astro.id)}>
                        {astro.name} ({astro.callsign} · {astro.role})
                      </option>
                    ))}
                    <option value="">Mission-Wide / Fleet Habitat</option>
                  </select>
                </div>
              </div>

              {/* Mission & Period Range */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label
                    className={clsx(
                      'block text-xs font-bold',
                      isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-300'
                    )}
                  >
                    MISSION PROGRAM
                  </label>
                  <select
                    value={formMissionId}
                    onChange={(e) => setFormMissionId(e.target.value)}
                    style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                    className={clsx(
                      'w-full px-3 py-2 text-xs focus:outline-none border cursor-pointer',
                      isPaper
                        ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-sm'
                        : isDark
                          ? 'bg-black border-2 border-[#FF4D00] text-white font-sketch-hand text-sm'
                          : 'rounded-lg bg-[#050B14] border-[#1E3A5F] text-white focus:border-cyan-400 font-mono'
                    )}
                  >
                    {MISSION_OPTIONS.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {m.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    className={clsx(
                      'block text-xs font-bold',
                      isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-300'
                    )}
                  >
                    PERIOD START DATE
                  </label>
                  <input
                    type="date"
                    value={formPeriodStart}
                    onChange={(e) => setFormPeriodStart(e.target.value)}
                    style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                    className={clsx(
                      'w-full px-3 py-2 text-xs focus:outline-none border',
                      isPaper
                        ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand'
                        : isDark
                          ? 'bg-black border-2 border-[#FF4D00] text-white font-sketch-hand'
                          : 'rounded-lg bg-[#050B14] border-[#1E3A5F] text-white focus:border-cyan-400 font-mono'
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className={clsx(
                      'block text-xs font-bold',
                      isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-300'
                    )}
                  >
                    PERIOD END DATE
                  </label>
                  <input
                    type="date"
                    value={formPeriodEnd}
                    onChange={(e) => setFormPeriodEnd(e.target.value)}
                    style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                    className={clsx(
                      'w-full px-3 py-2 text-xs focus:outline-none border',
                      isPaper
                        ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand'
                        : isDark
                          ? 'bg-black border-2 border-[#FF4D00] text-white font-sketch-hand'
                          : 'rounded-lg bg-[#050B14] border-[#1E3A5F] text-white focus:border-cyan-400 font-mono'
                    )}
                  />
                </div>
              </div>

              {/* Clinical Summary */}
              <div className="space-y-1.5">
                <label
                  className={clsx(
                    'block text-xs font-bold',
                    isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-300'
                  )}
                >
                  CLINICAL EXECUTIVE SUMMARY <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Enter detailed physiological assessment, cardiovascular response, suit telemetry correlation, and surgeon observations..."
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'w-full px-3 py-2 text-xs focus:outline-none border',
                    isPaper
                      ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-sm'
                      : isDark
                        ? 'bg-black border-2 border-[#FF4D00] text-white font-sketch-hand text-sm'
                        : 'rounded-lg bg-[#050B14] border-[#1E3A5F] text-white placeholder-slate-500 focus:border-cyan-400 font-mono'
                  )}
                />
              </div>

              {/* Correlated Forensic Timeline Events Section */}
              <div
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'p-4 space-y-3 border',
                  isPaper
                    ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d]'
                    : isDark
                      ? 'bg-black border-2 border-[#FF4D00]'
                      : 'border-[#1E3A5F] rounded-lg bg-[#050B14]/60'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#ff4d00]" />
                    <span
                      className={clsx(
                        'text-xs font-bold uppercase',
                        isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-white'
                      )}
                    >
                      Correlated Forensic Timeline Events ({formForensicEvents.length})
                    </span>
                  </div>

                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeForensicEvents}
                      onChange={(e) => setIncludeForensicEvents(e.target.checked)}
                      className="rounded border-[#1E3A5F] text-cyan-400 focus:ring-0"
                    />
                    <span className={isSketch ? 'font-sketch-hand' : 'font-mono text-slate-300'}>
                      Attach Forensic Telemetry
                    </span>
                  </label>
                </div>

                {includeForensicEvents && (
                  <div className="space-y-3 pt-2">
                    {formForensicEvents.map((eventItem, idx) => (
                      <div
                        key={idx}
                        style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                        className={clsx(
                          'p-3 space-y-2 text-xs border relative',
                          isPaper
                            ? 'bg-white border-2 border-[#2d2d2d]'
                            : isDark
                              ? 'bg-[#0c0c10] border-2 border-[#FF4D00]'
                              : 'rounded-lg bg-[#07101E] border-[#1E3A5F] font-mono'
                        )}
                      >
                        <div
                          className={clsx(
                            'flex items-center justify-between border-b pb-1.5',
                            isSketch
                              ? isDark
                                ? 'border-[#FF4D00]/40 border-dashed'
                                : 'border-[#2d2d2d]/30 border-dashed'
                              : 'border-[#1E3A5F]/50'
                          )}
                        >
                          <span
                            className={clsx(
                              'font-bold text-[11px]',
                              isPaper ? 'text-[#ff4d00]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'
                            )}
                          >
                            EVENT #{idx + 1}
                          </span>
                          {formForensicEvents.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveEventRow(idx)}
                              className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3 h-3" /> Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] opacity-75 block mb-1">
                              TIMESTAMP
                            </label>
                            <input
                              type="datetime-local"
                              value={eventItem.event_time}
                              onChange={(e) =>
                                handleEventChange(idx, 'event_time', e.target.value)
                              }
                              className="w-full px-2 py-1 border rounded bg-transparent text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] opacity-75 block mb-1">
                              EVENT TYPE
                            </label>
                            <input
                              type="text"
                              value={eventItem.event_type}
                              onChange={(e) =>
                                handleEventChange(idx, 'event_type', e.target.value)
                              }
                              placeholder="e.g. EVA Ingress / Repress"
                              className="w-full px-2 py-1 border rounded bg-transparent text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] opacity-75 block mb-1">
                              SEVERITY
                            </label>
                            <select
                              value={eventItem.severity}
                              onChange={(e) =>
                                handleEventChange(idx, 'severity', e.target.value as 'info' | 'low' | 'medium' | 'high' | 'critical')
                              }
                              className="w-full px-2 py-1 border rounded bg-transparent text-xs cursor-pointer"
                            >
                              <option value="info">Info</option>
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] opacity-75 block mb-1">
                              EVENT TITLE
                            </label>
                            <input
                              type="text"
                              value={eventItem.title}
                              onChange={(e) =>
                                handleEventChange(idx, 'title', e.target.value)
                              }
                              placeholder="e.g. Airway & Pulmonary Pressure Recovery"
                              className="w-full px-2 py-1 border rounded bg-transparent text-xs"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] opacity-75 block mb-1">
                                CORRELATED METRIC
                              </label>
                              <input
                                type="text"
                                value={eventItem.related_metric}
                                onChange={(e) =>
                                  handleEventChange(idx, 'related_metric', e.target.value)
                                }
                                placeholder="e.g. SpO2"
                                className="w-full px-2 py-1 border rounded bg-transparent text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] opacity-75 block mb-1">
                                VALUE
                              </label>
                              <input
                                type="text"
                                value={eventItem.metric_value}
                                onChange={(e) =>
                                  handleEventChange(idx, 'metric_value', e.target.value)
                                }
                                placeholder="e.g. 98%"
                                className="w-full px-2 py-1 border rounded bg-transparent text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] opacity-75 block mb-1">
                            DESCRIPTION
                          </label>
                          <input
                            type="text"
                            value={eventItem.description}
                            onChange={(e) =>
                              handleEventChange(idx, 'description', e.target.value)
                            }
                            placeholder="Detailed telemetry reading observation..."
                            className="w-full px-2 py-1 border rounded bg-transparent text-xs"
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="hud"
                      size="sm"
                      onClick={handleAddEventRow}
                      style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                      className={clsx(
                        'text-xs gap-1.5 w-full justify-center font-bold',
                        isSketch
                          ? isDark
                            ? 'bg-black text-[#FF4D00] border-2 border-[#FF4D00] sketch-btn-orange font-sketch-hand'
                            : 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand'
                          : ''
                      )}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Another Forensic Anomaly Row
                    </Button>
                  </div>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div
                className={clsx(
                  'pt-3 border-t flex items-center justify-end gap-3',
                  isSketch
                    ? isDark
                      ? 'border-[#FF4D00]/40 border-dashed'
                      : 'border-[#2d2d2d]/30 border-dashed'
                    : 'border-[#1E3A5F]'
                )}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsGenerateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingReport}
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'font-bold text-xs gap-1.5 min-w-[140px]',
                    isSketch
                      ? isDark
                        ? 'bg-[#FF4D00] text-black border-2 border-white sketch-btn-orange font-sketch-hand text-sm'
                        : 'bg-[#ff4d00] text-white border-2 border-[#2d2d2d] sketch-btn font-sketch-hand text-sm'
                        : ''
                  )}
                >
                  {isSubmittingReport ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      Submit &amp; Queue Dossier
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: Forensic Timeline View Modal                          */}
      {/* ============================================================== */}
      {selectedReportForTimeline && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card
            themeMode={mode}
            className={clsx(
              'w-full max-w-3xl max-h-[90vh] flex flex-col p-0',
              !isSketch && 'border-cyan-500/50 shadow-[0_0_35px_rgba(0,229,255,0.25)] bg-[#07101E]'
            )}
          >
            {/* Modal Header */}
            <div
              className={clsx(
                'px-6 py-4 border-b flex items-center justify-between',
                isPaper
                  ? 'bg-[#fdfbf7] border-[#2d2d2d]'
                  : isDark
                    ? 'bg-black border-[#FF4D00]'
                    : 'bg-[#050B14] border-[#1E3A5F]'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
                  className={clsx(
                    'w-9 h-9 flex items-center justify-center border',
                    isPaper
                      ? 'bg-[#fff9c4] border-2 border-[#2d2d2d] text-[#2d2d2d]'
                      : isDark
                        ? 'bg-black border-2 border-[#FF4D00] text-[#FF4D00]'
                        : 'rounded-lg bg-cyan-950/80 border-cyan-500/40 text-cyan-400'
                  )}
                >
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                      className={clsx(
                        'text-xs font-bold px-2 py-0.5 border',
                        isPaper
                          ? 'bg-white text-[#2d2d2d] border-[#2d2d2d] font-sketch-hand'
                          : isDark
                            ? 'bg-black text-[#FF4D00] border-[#FF4D00] font-sketch-hand'
                            : 'font-mono text-cyan-400 rounded bg-[#050B14] border-[#1E3A5F]'
                      )}
                    >
                      {selectedReportForTimeline.report_code}
                    </span>
                    <h3
                      className={clsx(
                        'text-base font-bold tracking-wide',
                        isSketch ? 'font-display-kalam text-lg' : 'font-mono text-white'
                      )}
                    >
                      FORENSIC EVENT CORRELATION TIMELINE
                    </h3>
                  </div>
                  <p
                    className={clsx(
                      'text-xs mt-0.5 line-clamp-1',
                      isSketch ? 'font-sketch-hand opacity-75' : 'font-mono text-slate-400'
                    )}
                  >
                    {selectedReportForTimeline.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReportForTimeline(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Report Summary Pill & SHA-256 Dossier Cryptographic Seal */}
              <div
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'p-3.5 space-y-2.5 text-xs border',
                  isPaper
                    ? 'bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] font-sketch-hand text-sm'
                    : isDark
                      ? 'bg-black text-white border-2 border-[#FF4D00] font-sketch-hand text-sm'
                      : 'rounded-lg bg-[#050B14] border-[#1E3A5F] font-mono'
                )}
              >
                <div
                  className={clsx(
                    'flex flex-wrap items-center justify-between gap-2 text-[11px] border-b pb-1.5',
                    isSketch
                      ? isDark
                        ? 'border-[#FF4D00]/40 border-dashed'
                        : 'border-[#2d2d2d]/30 border-dashed'
                      : 'border-[#1E3A5F]/40 text-slate-400'
                  )}
                >
                  <span>
                    Subject:{' '}
                    <strong className="text-current font-bold">
                      {selectedReportForTimeline.astronaut
                        ? `${selectedReportForTimeline.astronaut.full_name} (${selectedReportForTimeline.astronaut.callsign})`
                        : 'Fleet / Mission Habitat'}
                    </strong>
                  </span>
                  <span>
                    Period:{' '}
                    <strong className="text-current font-bold">
                      {formatPeriod(
                        selectedReportForTimeline.period_start,
                        selectedReportForTimeline.period_end
                      )}
                    </strong>
                  </span>
                </div>
                <p className="opacity-90 leading-relaxed">
                  {selectedReportForTimeline.summary}
                </p>

                {/* Immutable SHA-256 Dossier Chain Header */}
                <div
                  className={clsx(
                    'pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-[11px]',
                    isSketch
                      ? isDark
                        ? 'border-[#FF4D00]/40 border-dashed'
                        : 'border-[#2d2d2d]/30 border-dashed'
                      : 'border-[#1E3A5F]/40'
                  )}
                >
                  <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-emerald-500 font-bold shrink-0">SHA-256 DOSSIER TRAIL:</span>
                    <span className="select-all truncate max-w-sm sm:max-w-md font-mono">
                      {timelineDossierHash || (selectedReportForTimeline.uuid ? `${selectedReportForTimeline.uuid} (VERIFIED)` : 'VERIFIED')}
                    </span>
                  </div>
                  {isSketch ? (
                    <SketchBadge variant="nominal" mode={mode}>
                      IMMUTABLE
                    </SketchBadge>
                  ) : (
                    <Badge status="nominal">IMMUTABLE</Badge>
                  )}
                </div>
              </div>

              {/* Timeline Header */}
              <div
                className={clsx(
                  'flex items-center justify-between text-xs border-b pb-2',
                  isSketch
                    ? isDark
                      ? 'border-[#FF4D00]/40 border-dashed font-sketch-hand text-sm'
                      : 'border-[#2d2d2d]/30 border-dashed font-sketch-hand text-sm'
                    : 'border-[#1E3A5F]/50 font-mono text-slate-400'
                )}
              >
                <span className="font-bold uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#ff4d00]" />
                  Chronological Telemetry &amp; Anomaly Sequence
                </span>
                <span>{timelineEvents.length} Recorded Incidents</span>
              </div>

              {/* Timeline Visualizer */}
              {timelineLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 font-mono">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                  <span className="text-xs">Correlating high-resolution telemetry log timestamps &amp; SHA-256 chain...</span>
                </div>
              ) : timelineEvents.length === 0 ? (
                <div className="py-12 text-center text-xs space-y-2 opacity-80 font-sketch-hand text-base">
                  <Activity className="w-8 h-8 text-slate-500 mx-auto" />
                  <p>No isolated forensic anomaly events recorded for this dossier.</p>
                  <p className="text-[11px] opacity-75">
                    All biometric values functioned strictly within baseline tolerance envelopes.
                  </p>
                </div>
              ) : (
                <div
                  className={clsx(
                    'relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5',
                    isPaper
                      ? 'before:bg-[#2d2d2d]'
                      : isDark
                        ? 'before:bg-[#FF4D00]'
                        : 'before:bg-[#1E3A5F]'
                  )}
                >
                  {timelineEvents.map((evt, idx) => {
                    const sevBadgeStatus =
                      evt.severity === 'critical'
                        ? 'critical'
                        : evt.severity === 'high' || evt.severity === 'medium'
                          ? 'warning'
                          : evt.severity === 'low'
                            ? 'nominal'
                            : 'info';

                    return (
                      <div key={evt.id || idx} className="relative group">
                        {/* Timeline Node */}
                        <div
                          style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
                          className={clsx(
                            'absolute -left-[27px] top-1.5 w-3.5 h-3.5 border-2 transition-transform group-hover:scale-125',
                            isPaper
                              ? 'bg-[#ff4d00] border-[#2d2d2d]'
                              : isDark
                                ? 'bg-[#FF4D00] border-white'
                                : 'rounded-full border-cyan-400 bg-cyan-400 ring-4 ring-[#07101E]'
                          )}
                        />

                        {/* Event Card */}
                        <div
                          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                          className={clsx(
                            'p-4 space-y-2 border transition-all',
                            isPaper
                              ? 'bg-white border-2 border-[#2d2d2d] sketch-shadow text-[#2d2d2d]'
                              : isDark
                                ? 'bg-[#0c0c10] border-2 border-[#FF4D00] sketch-shadow-orange text-white'
                                : 'rounded-lg bg-[#050B14] border-[#1E3A5F] hover:border-cyan-500/40'
                          )}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={clsx(
                                  'text-xs font-bold',
                                  isSketch ? 'font-display-kalam text-sm' : 'font-mono text-white'
                                )}
                              >
                                {evt.event_type}
                              </span>
                              {isSketch ? (
                                <SketchBadge variant={sevBadgeStatus as any} mode={mode}>
                                  {evt.severity.toUpperCase()}
                                </SketchBadge>
                              ) : (
                                <Badge status={sevBadgeStatus as any}>
                                  {evt.severity}
                                </Badge>
                              )}
                            </div>

                            <span
                              className={clsx(
                                'text-[11px] flex items-center gap-1 opacity-75',
                                isSketch ? 'font-sketch-hand' : 'font-mono'
                              )}
                            >
                              <Clock className="w-3 h-3" />
                              {new Date(evt.event_time).toUTCString()}
                            </span>
                          </div>

                          <h4
                            className={clsx(
                              'text-sm font-bold',
                              isSketch ? 'font-display-kalam text-base text-[#ff4d00]' : 'text-cyan-300'
                            )}
                          >
                            {evt.title}
                          </h4>

                          {evt.description && (
                            <p
                              className={clsx(
                                'text-xs leading-relaxed',
                                isSketch ? 'font-sketch-hand text-sm opacity-85' : 'text-slate-300 font-mono'
                              )}
                            >
                              {evt.description}
                            </p>
                          )}

                          {/* Correlated Metric Pill */}
                          {(evt.related_metric || evt.metric_value) && (
                            <div
                              className={clsx(
                                'pt-2 border-t flex items-center gap-2 text-xs',
                                isSketch
                                  ? isDark
                                    ? 'border-[#FF4D00]/40 border-dashed font-sketch-hand text-sm'
                                    : 'border-[#2d2d2d]/30 border-dashed font-sketch-hand text-sm'
                                  : 'border-[#1E3A5F]/40 font-mono'
                              )}
                            >
                              <span className="opacity-75 text-[11px]">Correlated Telemetry:</span>
                              <span
                                style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                                className={clsx(
                                  'px-2 py-0.5 font-bold border',
                                  isPaper
                                    ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d]'
                                    : isDark
                                      ? 'bg-[#FF4D00]/25 text-[#FF4D00] border-[#FF4D00]'
                                      : 'rounded bg-cyan-950/60 border-cyan-800/40 text-cyan-300'
                                )}
                              >
                                {evt.related_metric}: {evt.metric_value}
                              </span>
                            </div>
                          )}

                          {/* Immutable SHA-256 Event Stamp */}
                          <div
                            className={clsx(
                              'pt-1.5 flex flex-wrap items-center justify-between gap-2 border-t text-[10px]',
                              isSketch
                                ? isDark
                                  ? 'border-[#FF4D00]/30 border-dashed font-sketch-hand'
                                  : 'border-[#2d2d2d]/30 border-dashed font-sketch-hand'
                                : 'border-[#1E3A5F]/30 font-mono'
                            )}
                          >
                            <span className="text-emerald-500 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                              SHA-256 EVENT STAMP:
                            </span>
                            <span
                              style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                              className={clsx(
                                'px-2 py-0.5 border select-all truncate max-w-[280px]',
                                isPaper
                                  ? 'bg-[#fdfbf7] text-[#2d2d2d] border-[#2d2d2d] font-mono'
                                  : isDark
                                    ? 'bg-black text-white/80 border-[#FF4D00]/50 font-mono'
                                    : 'bg-[#07101E] rounded border-[#1E3A5F] text-slate-400'
                              )}
                            >
                              {evt.sha256_hash ||
                                `sha256:${selectedReportForTimeline.report_code}-${evt.id}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Linked Audit Trail Ledger Blocks */}
              {timelineAuditChain.length > 0 && (
                <div
                  className={clsx(
                    'pt-2 border-t space-y-2',
                    isSketch
                      ? isDark
                        ? 'border-[#FF4D00]/40 border-dashed'
                        : 'border-[#2d2d2d]/30 border-dashed'
                      : 'border-[#1E3A5F]/60'
                  )}
                >
                  <div
                    className={clsx(
                      'flex items-center gap-2 text-xs',
                      isSketch ? 'font-sketch-hand text-sm font-bold' : 'font-mono text-slate-300'
                    )}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold uppercase tracking-wider">
                      Linked Non-Repudiation Audit Blocks ({timelineAuditChain.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {timelineAuditChain.map((log) => (
                      <div
                        key={log.id}
                        style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                        className={clsx(
                          'p-2.5 border text-[11px] space-y-1',
                          isPaper
                            ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand'
                            : isDark
                              ? 'bg-black border-2 border-[#FF4D00] text-white font-sketch-hand'
                              : 'rounded bg-[#050B14] border-[#1E3A5F] font-mono'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={clsx(
                              'font-bold',
                              isPaper ? 'text-[#ff4d00]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'
                            )}
                          >
                            #{log.id} · {log.event_type}
                          </span>
                          {isSketch ? (
                            <SketchBadge variant="nominal" mode={mode}>
                              VERIFIED
                            </SketchBadge>
                          ) : (
                            <Badge status="nominal">VERIFIED</Badge>
                          )}
                        </div>
                        <div className="opacity-75 truncate font-mono text-[10px]" title={log.current_hash}>
                          BLOCK HASH: {log.current_hash.slice(0, 24)}...
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with tactile export triggers */}
            <div
              className={clsx(
                'px-6 py-3.5 border-t flex flex-wrap items-center justify-between gap-3',
                isPaper
                  ? 'bg-[#fdfbf7] border-[#2d2d2d]'
                  : isDark
                    ? 'bg-black border-[#FF4D00]'
                    : 'bg-[#050B14] border-[#1E3A5F]'
              )}
            >
              <div className="flex items-center gap-2">
                <Button
                  variant="hud"
                  size="sm"
                  onClick={() => handleDownloadPdf(selectedReportForTimeline)}
                  disabled={downloadingPdfId === selectedReportForTimeline.id}
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'text-xs gap-1.5 font-bold',
                    isSketch
                      ? isDark
                        ? 'bg-[#FF4D00] text-black border-2 border-white sketch-btn-orange font-sketch-hand'
                        : 'bg-[#2d5da1] text-white border-2 border-[#2d2d2d] sketch-btn font-sketch-hand'
                      : ''
                  )}
                >
                  <Download className="w-3.5 h-3.5 text-current" />
                  Download Dossier PDF
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownloadCsv(selectedReportForTimeline)}
                  disabled={downloadingCsvId === selectedReportForTimeline.id}
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'text-xs gap-1.5 font-bold',
                    isSketch
                      ? isDark
                        ? 'bg-black text-white border-2 border-[#FF4D00] sketch-btn-orange font-sketch-hand'
                        : 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand'
                      : ''
                  )}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Timeline CSV
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReportForTimeline(null)}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
