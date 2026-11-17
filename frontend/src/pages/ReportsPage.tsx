import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    try {
      const detail = await reportApi.getReport(report.id);
      setTimelineEvents(detail.forensic_events || []);
    } catch (err) {
      console.error('Failed to load forensic events detail:', err);
      // Fallback to report's embedded forensic events if available
      setTimelineEvents(report.forensic_events || []);
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
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border font-mono text-xs shadow-2xl backdrop-blur-md transition-all duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-emerald-900/30'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/50 shadow-rose-900/30'
              : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50 shadow-cyan-900/30'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toastMessage.type === 'info' && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold text-white tracking-wide flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-cyan-400" />
            MISSION MEDICAL REPORTS & FORENSIC DOSSIERS
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            OFFICIAL NASA CLINICAL FLIGHT SURGEON DOSSIERS (RPT-01 TO RPT-09) · FORENSIC TIMELINE
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchReports}
            disabled={isLoading}
            className="text-xs gap-1.5"
            title="Reload reports from Ground Station"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsGenerateModalOpen(true)}
            className="gap-1.5 text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            + Generate Clinical Report
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-[#1E3A5F] bg-[#07101E]/90 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code (e.g. RPT-01), title, astronaut, or keyword..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
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
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Filters:</span>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending_review">Pending Review</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-slate-300 focus:outline-none focus:border-cyan-400 max-w-[160px] truncate"
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
              className="px-2.5 py-1.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
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
                className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2 ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Counter Pill */}
        <div className="mt-2.5 pt-2 border-t border-[#1E3A5F]/50 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>
            Displaying <strong className="text-cyan-300">{filteredReports.length}</strong> of{' '}
            <strong className="text-white">{reports.length}</strong> official clinical dossiers
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
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
        <Card className="border-rose-500/50 bg-rose-950/20 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h3 className="text-sm font-mono font-bold text-white mb-1">Failed to Load Reports</h3>
          <p className="text-xs text-rose-300 font-mono mb-4">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchReports}>
            Retry Request
          </Button>
        </Card>
      ) : filteredReports.length === 0 ? (
        <Card className="border-[#1E3A5F] bg-[#07101E]/80 p-12 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-mono font-bold text-white mb-1">No Matching Medical Dossiers Found</h3>
          <p className="text-xs text-slate-400 font-mono max-w-md mx-auto mb-5">
            No clinical reports match your active filters or search terms. Try clearing filters or create a new formal dossier.
          </p>
          <Button variant="primary" size="sm" onClick={() => setIsGenerateModalOpen(true)}>
            + Generate Clinical Report
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
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
                className="border-[#1E3A5F] hover:border-cyan-500/40 transition-colors duration-200 bg-[#07101E]/90 p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  {/* Left Column: Metadata & Details */}
                  <div className="space-y-2.5 flex-1">
                    {/* Header line: Code pill + Status Badge + Type + Period */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400 px-2.5 py-0.5 rounded bg-[#050B14] border border-[#1E3A5F]">
                        {report.report_code}
                      </span>

                      <span className="font-mono text-[11px] font-semibold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/40">
                        {typeConfig.code} · {typeConfig.label}
                      </span>

                      <Badge status={isApproved ? 'nominal' : 'warning'}>
                        {report.status.replace('_', ' ')}
                      </Badge>

                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1 ml-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {formatPeriod(report.period_start, report.period_end)}
                      </span>
                    </div>

                    {/* Report Title */}
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                      {report.title}
                    </h3>

                    {/* Subject Scope & Author */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>
                          Subject Scope:{' '}
                          {report.astronaut ? (
                            <span className="text-cyan-300 font-semibold">
                              {report.astronaut.full_name} ({report.astronaut.callsign})
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Fleet-Wide / Mission Habitat</span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>
                          Mission:{' '}
                          <span className="text-slate-200">
                            {report.mission ? report.mission.name : 'Artemis Program'}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Author & Approval trail */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-slate-400 border-t border-[#1E3A5F]/40 pt-2">
                      <span>
                        Author:{' '}
                        <strong className="text-slate-300">
                          {report.author?.name || 'Autonomous Bio-Astronautics System'}
                        </strong>
                      </span>

                      {isApproved ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved by {report.approver?.name || 'Director Gene Kranz'}
                          {report.approved_at && (
                            <span className="text-slate-500">
                              {' '}
                              · {new Date(report.approved_at).toISOString().split('T')[0]}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending Flight Surgeon / Director Sign-off
                        </span>
                      )}
                    </div>

                    {/* Clinical Summary Excerpt / Box */}
                    {report.summary && (
                      <div className="mt-2 text-xs text-slate-300 bg-[#050B14]/80 border-l-2 border-cyan-400 p-2.5 rounded-r font-mono">
                        <div className="flex items-start justify-between gap-2">
                          <p className={isExpanded ? '' : 'line-clamp-2'}>
                            {report.summary}
                          </p>
                          {report.summary.length > 130 && (
                            <button
                              onClick={() => toggleSummaryExpand(report.id)}
                              className="text-cyan-400 hover:text-cyan-300 shrink-0 flex items-center text-[10px] gap-0.5 mt-0.5"
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

                  {/* Right Column: Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0 w-full lg:w-auto">
                    {/* View Forensic Timeline Button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenTimeline(report)}
                      className="text-xs gap-1.5 w-full justify-center"
                      title="Inspect chronological telemetry events and forensic timeline"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      Forensic Timeline
                    </Button>

                    <div className="flex items-center gap-2 w-full">
                      {/* PDF Download Button */}
                      <Button
                        variant="hud"
                        size="sm"
                        onClick={() => handleDownloadPdf(report)}
                        disabled={isDownloadingPdf}
                        className="text-xs gap-1.5 flex-1 justify-center border-cyan-500/50 hover:border-cyan-400"
                        title="Export official printable NASA DomPDF report"
                      >
                        {isDownloadingPdf ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span>{isDownloadingPdf ? 'Generating...' : 'PDF'}</span>
                      </Button>

                      {/* CSV Download Button */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownloadCsv(report)}
                        disabled={isDownloadingCsv}
                        className="text-xs gap-1.5 flex-1 justify-center"
                        title="Download raw event metrics as CSV"
                      >
                        {isDownloadingCsv ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
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
                        className="text-xs gap-1.5 w-full justify-center font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
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
          <Card className="w-full max-w-2xl border-cyan-500/50 shadow-[0_0_35px_rgba(0,229,255,0.25)] bg-[#07101E] max-h-[92vh] flex flex-col p-0">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#1E3A5F] flex items-center justify-between bg-[#050B14]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-mono font-bold text-white tracking-wide">
                    GENERATE CLINICAL REPORT (RPT-01 TO RPT-09)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Official NASA Clinical Flight Surgeon Dossier Generation Protocol
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateReportSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-slate-300">
                  REPORT TITLE <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Artemis IV Trans-Lunar EVA Sortie Biometric Health Debrief"
                  className="w-full px-3 py-2 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              {/* Report Type & Astronaut Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Report Type Select */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-slate-300">
                    REPORT TYPE (RPT SPECIFICATION) <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formReportType}
                    onChange={(e) => setFormReportType(e.target.value as ReportType)}
                    className="w-full px-3 py-2 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
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
                  <label className="block text-xs font-mono font-bold text-slate-300">
                    ASTRONAUT SUBJECT
                  </label>
                  <select
                    value={formAstronautId}
                    onChange={(e) => setFormAstronautId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
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
                  <label className="block text-xs font-mono font-bold text-slate-300">
                    MISSION PROGRAM
                  </label>
                  <select
                    value={formMissionId}
                    onChange={(e) => setFormMissionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  >
                    {MISSION_OPTIONS.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {m.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-slate-300">
                    PERIOD START DATE
                  </label>
                  <input
                    type="date"
                    value={formPeriodStart}
                    onChange={(e) => setFormPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-slate-300">
                    PERIOD END DATE
                  </label>
                  <input
                    type="date"
                    value={formPeriodEnd}
                    onChange={(e) => setFormPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              {/* Clinical Summary */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-slate-300">
                  CLINICAL EXECUTIVE SUMMARY <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Enter detailed physiological assessment, cardiovascular response, suit telemetry correlation, and surgeon observations..."
                  className="w-full px-3 py-2 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              {/* Correlated Forensic Timeline Events Section */}
              <div className="border border-[#1E3A5F] rounded-lg p-4 bg-[#050B14]/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold text-white uppercase">
                      Correlated Forensic Timeline Events ({formForensicEvents.length})
                    </span>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeForensicEvents}
                      onChange={(e) => setIncludeForensicEvents(e.target.checked)}
                      className="rounded border-[#1E3A5F] text-cyan-400 focus:ring-0"
                    />
                    <span>Attach Forensic Telemetry</span>
                  </label>
                </div>

                {includeForensicEvents && (
                  <div className="space-y-3 pt-2">
                    {formForensicEvents.map((eventItem, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#07101E] border border-[#1E3A5F] space-y-2 text-xs font-mono relative"
                      >
                        <div className="flex items-center justify-between border-b border-[#1E3A5F]/50 pb-1.5">
                          <span className="text-cyan-400 font-bold text-[11px]">
                            EVENT #{idx + 1}
                          </span>
                          {formForensicEvents.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveEventRow(idx)}
                              className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">
                              TIMESTAMP
                            </label>
                            <input
                              type="datetime-local"
                              value={eventItem.event_time}
                              onChange={(e) =>
                                handleEventChange(idx, 'event_time', e.target.value)
                              }
                              className="w-full px-2 py-1 rounded bg-[#050B14] border border-[#1E3A5F] text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">
                              EVENT TYPE
                            </label>
                            <input
                              type="text"
                              value={eventItem.event_type}
                              onChange={(e) =>
                                handleEventChange(idx, 'event_type', e.target.value)
                              }
                              placeholder="e.g. EVA Ingress / Repress"
                              className="w-full px-2 py-1 rounded bg-[#050B14] border border-[#1E3A5F] text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">
                              SEVERITY
                            </label>
                            <select
                              value={eventItem.severity}
                              onChange={(e) =>
                                handleEventChange(idx, 'severity', e.target.value as any)
                              }
                              className="w-full px-2 py-1 rounded bg-[#050B14] border border-[#1E3A5F] text-xs text-white"
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
                            <label className="text-[10px] text-slate-400 block mb-1">
                              EVENT TITLE
                            </label>
                            <input
                              type="text"
                              value={eventItem.title}
                              onChange={(e) =>
                                handleEventChange(idx, 'title', e.target.value)
                              }
                              placeholder="e.g. Airway & Pulmonary Pressure Recovery"
                              className="w-full px-2 py-1 rounded bg-[#050B14] border border-[#1E3A5F] text-xs text-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">
                                CORRELATED METRIC
                              </label>
                              <input
                                type="text"
                                value={eventItem.related_metric}
                                onChange={(e) =>
                                  handleEventChange(idx, 'related_metric', e.target.value)
                                }
                                placeholder="e.g. SpO2"
                                className="w-full px-2 py-1 rounded bg-[#050B14] border border-[#1E3A5F] text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">
                                VALUE
                              </label>
                              <input
                                type="text"
                                value={eventItem.metric_value}
                                onChange={(e) =>
                                  handleEventChange(idx, 'metric_value', e.target.value)
                                }
                                placeholder="e.g. 98%"
                                className="w-full px-2 py-1 rounded bg-[#050B14] border border-[#1E3A5F] text-xs text-white"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">
                            DESCRIPTION
                          </label>
                          <input
                            type="text"
                            value={eventItem.description}
                            onChange={(e) =>
                              handleEventChange(idx, 'description', e.target.value)
                            }
                            placeholder="Detailed telemetry reading observation..."
                            className="w-full px-2 py-1 rounded bg-[#050B14] border border-[#1E3A5F] text-xs text-white"
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="hud"
                      size="sm"
                      onClick={handleAddEventRow}
                      className="text-xs gap-1.5 w-full justify-center"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Another Forensic Anomaly Row
                    </Button>
                  </div>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 border-t border-[#1E3A5F] flex items-center justify-end gap-3">
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
                  className="font-bold text-xs gap-1.5 min-w-[140px]"
                >
                  {isSubmittingReport ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      Submit & Queue Dossier
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
          <Card className="w-full max-w-3xl border-cyan-500/50 shadow-[0_0_35px_rgba(0,229,255,0.25)] bg-[#07101E] max-h-[90vh] flex flex-col p-0">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#1E3A5F] flex items-center justify-between bg-[#050B14]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-[#050B14] border border-[#1E3A5F]">
                      {selectedReportForTimeline.report_code}
                    </span>
                    <h3 className="text-base font-mono font-bold text-white tracking-wide">
                      FORENSIC EVENT CORRELATION TIMELINE
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 line-clamp-1">
                    {selectedReportForTimeline.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReportForTimeline(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Report Summary Pill */}
              <div className="p-3.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] space-y-1.5 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400 text-[11px] border-b border-[#1E3A5F]/40 pb-1.5">
                  <span>
                    Subject:{' '}
                    <strong className="text-cyan-300">
                      {selectedReportForTimeline.astronaut
                        ? `${selectedReportForTimeline.astronaut.full_name} (${selectedReportForTimeline.astronaut.callsign})`
                        : 'Fleet / Mission Habitat'}
                    </strong>
                  </span>
                  <span>
                    Period:{' '}
                    <strong className="text-slate-200">
                      {formatPeriod(
                        selectedReportForTimeline.period_start,
                        selectedReportForTimeline.period_end
                      )}
                    </strong>
                  </span>
                </div>
                <p className="text-slate-300 text-xs pt-1">
                  {selectedReportForTimeline.summary}
                </p>
              </div>

              {/* Timeline Header */}
              <div className="flex items-center justify-between font-mono text-xs text-slate-400 border-b border-[#1E3A5F]/50 pb-2">
                <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Chronological Telemetry & Anomaly Sequence
                </span>
                <span>{timelineEvents.length} Recorded Incidents</span>
              </div>

              {/* Timeline Visualizer */}
              {timelineLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 font-mono">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                  <span className="text-xs">Correlating high-resolution telemetry log timestamps...</span>
                </div>
              ) : timelineEvents.length === 0 ? (
                <div className="py-12 text-center font-mono text-xs text-slate-400 space-y-2">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>No isolated forensic anomaly events recorded for this dossier.</p>
                  <p className="text-[11px] text-slate-500">
                    All biometric values functioned strictly within baseline tolerance envelopes.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#1E3A5F]">
                  {timelineEvents.map((evt, idx) => {
                    const sevColor =
                      evt.severity === 'critical'
                        ? 'border-rose-500 bg-rose-500 text-rose-400'
                        : evt.severity === 'high'
                        ? 'border-amber-500 bg-amber-500 text-amber-400'
                        : evt.severity === 'medium'
                        ? 'border-yellow-500 bg-yellow-500 text-yellow-400'
                        : evt.severity === 'low'
                        ? 'border-emerald-500 bg-emerald-500 text-emerald-400'
                        : 'border-cyan-400 bg-cyan-400 text-cyan-400';

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
                        {/* Glowing Timeline Node */}
                        <div
                          className={`absolute -left-[27px] top-1.5 w-3 h-3 rounded-full border-2 ${sevColor} ring-4 ring-[#07101E] group-hover:scale-125 transition-transform`}
                        />

                        {/* Event Card */}
                        <div className="p-4 rounded-lg bg-[#050B14] border border-[#1E3A5F] hover:border-cyan-500/40 transition-colors space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-white">
                                {evt.event_type}
                              </span>
                              <Badge status={sevBadgeStatus as any}>
                                {evt.severity}
                              </Badge>
                            </div>

                            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {new Date(evt.event_time).toUTCString()}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-cyan-300">
                            {evt.title}
                          </h4>

                          {evt.description && (
                            <p className="text-xs text-slate-300 font-mono">
                              {evt.description}
                            </p>
                          )}

                          {/* Correlated Metric Pill */}
                          {(evt.related_metric || evt.metric_value) && (
                            <div className="pt-2 border-t border-[#1E3A5F]/40 flex items-center gap-2 text-xs font-mono">
                              <span className="text-slate-400 text-[11px]">Correlated Telemetry:</span>
                              <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 font-bold">
                                {evt.related_metric}: {evt.metric_value}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer with quick export triggers */}
            <div className="px-6 py-3.5 border-t border-[#1E3A5F] bg-[#050B14] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="hud"
                  size="sm"
                  onClick={() => handleDownloadPdf(selectedReportForTimeline)}
                  disabled={downloadingPdfId === selectedReportForTimeline.id}
                  className="text-xs gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  Download Dossier PDF
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownloadCsv(selectedReportForTimeline)}
                  disabled={downloadingCsvId === selectedReportForTimeline.id}
                  className="text-xs gap-1.5"
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
