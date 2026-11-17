import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  XCircle,
  Clock,
  User,
  Check,
  X,
  Radio,
} from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import {
  getWobblyStyle,
  Tape,
  SquiggleUnderline,
} from '../components/sketchbook';
import { clinicalApi } from '../api/clinicalApi';
import { Alert, AlertUnresolvedCount } from '../types/clinical.types';

export const AlertsPage: React.FC = () => {
  const { mode } = useThemeStore();
  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';
  const isSketch = isPaper || isDark;

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [counts, setCounts] = useState<AlertUnresolvedCount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Modals state
  const [acknowledgingAlert, setAcknowledgingAlert] = useState<Alert | null>(null);
  const [ackActionTaken, setAckActionTaken] = useState('');

  const [escalatingAlert, setEscalatingAlert] = useState<Alert | null>(null);
  const [escalateRole, setEscalateRole] = useState<'flight_surgeon' | 'mission_director' | 'medical_officer'>('flight_surgeon');
  const [escalateReason, setEscalateReason] = useState('');

  const [resolvingAlert, setResolvingAlert] = useState<Alert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [dismissingAlert, setDismissingAlert] = useState<Alert | null>(null);
  const [dismissReason, setDismissReason] = useState('');

  // Initial and reactive data fetching
  useEffect(() => {
    let ignore = false;

    const loadAlerts = async () => {
      try {
        const [alertsRes, countsRes] = await Promise.all([
          clinicalApi.getAlerts({
            status: selectedStatus !== 'all' ? selectedStatus : undefined,
            severity: selectedSeverity !== 'all' ? selectedSeverity : undefined,
            per_page: 50,
          }),
          clinicalApi.getUnresolvedAlertsCount(),
        ]);

        if (!ignore) {
          setAlerts(alertsRes.alerts);
          setCounts(countsRes);
          setErrorMessage(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Failed to retrieve mission triage alerts.';
          setErrorMessage(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadAlerts();

    return () => {
      ignore = true;
    };
  }, [selectedStatus, selectedSeverity]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const [alertsRes, countsRes] = await Promise.all([
        clinicalApi.getAlerts({
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          severity: selectedSeverity !== 'all' ? selectedSeverity : undefined,
          per_page: 50,
        }),
        clinicalApi.getUnresolvedAlertsCount(),
      ]);

      setAlerts(alertsRes.alerts);
      setCounts(countsRes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to refresh alerts telemetry.';
      setErrorMessage(msg);
    } finally {
      setIsRefreshing(false);
    }
  };

  const notifySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4500);
  };

  // 1. Acknowledge Action
  const handleOpenAcknowledge = (alert: Alert) => {
    setAcknowledgingAlert(alert);
    setAckActionTaken('Telemetry verified. Monitoring vitals trend under continuous clinical protocol.');
  };

  const handleConfirmAcknowledge = async () => {
    if (!acknowledgingAlert) return;
    setActionLoadingId(acknowledgingAlert.id);
    setErrorMessage(null);

    try {
      const res = await clinicalApi.acknowledgeAlert(acknowledgingAlert.id, ackActionTaken);
      setAlerts((prev) =>
        prev.map((a) => (a.id === acknowledgingAlert.id ? { ...a, ...res.alert, status: 'acknowledged' } : a))
      );
      notifySuccess(`Alert ${acknowledgingAlert.alert_code} acknowledged by Ground Controller.`);
      setAcknowledgingAlert(null);
      clinicalApi.getUnresolvedAlertsCount().then(setCounts).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error acknowledging alert.';
      setErrorMessage(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Escalate Action
  const handleOpenEscalate = (alert: Alert) => {
    setEscalatingAlert(alert);
    setEscalateRole('flight_surgeon');
    setEscalateReason('');
  };

  const handleConfirmEscalate = async () => {
    if (!escalatingAlert) return;
    if (escalateReason.trim().length < 5) {
      setErrorMessage('Escalation rationale requires at least 5 characters for mission records.');
      return;
    }

    setActionLoadingId(escalatingAlert.id);
    setErrorMessage(null);

    try {
      const res = await clinicalApi.escalateAlert(escalatingAlert.id, {
        escalated_to_role: escalateRole,
        reason: escalateReason.trim(),
      });
      setAlerts((prev) =>
        prev.map((a) => (a.id === escalatingAlert.id ? { ...a, ...res.alert, status: 'escalated' } : a))
      );
      notifySuccess(`Alert ${escalatingAlert.alert_code} escalated to ${escalateRole.replace('_', ' ').toUpperCase()}.`);
      setEscalatingAlert(null);
      clinicalApi.getUnresolvedAlertsCount().then(setCounts).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error escalating alert.';
      setErrorMessage(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Resolve Action
  const handleOpenResolve = (alert: Alert) => {
    setResolvingAlert(alert);
    setResolutionNotes('Vitals stabilized back to standard baseline parameters. Incident closed.');
  };

  const handleConfirmResolve = async () => {
    if (!resolvingAlert) return;
    setActionLoadingId(resolvingAlert.id);
    setErrorMessage(null);

    try {
      const res = await clinicalApi.resolveAlert(resolvingAlert.id, resolutionNotes);
      setAlerts((prev) =>
        prev.map((a) => (a.id === resolvingAlert.id ? { ...a, ...res, status: 'resolved' } : a))
      );
      notifySuccess(`Incident ${resolvingAlert.alert_code} resolved and archived.`);
      setResolvingAlert(null);
      clinicalApi.getUnresolvedAlertsCount().then(setCounts).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error resolving alert.';
      setErrorMessage(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Dismiss Action
  const handleOpenDismiss = (alert: Alert) => {
    setDismissingAlert(alert);
    setDismissReason('Artifact in bio-sensor telemetry or transient baseline calibration.');
  };

  const handleConfirmDismiss = async () => {
    if (!dismissingAlert) return;
    setActionLoadingId(dismissingAlert.id);
    setErrorMessage(null);

    try {
      const res = await clinicalApi.dismissAlert(dismissingAlert.id, dismissReason);
      setAlerts((prev) =>
        prev.map((a) => (a.id === dismissingAlert.id ? { ...a, ...res, status: 'dismissed' } : a))
      );
      notifySuccess(`Alert ${dismissingAlert.alert_code} dismissed as non-critical artifact.`);
      setDismissingAlert(null);
      clinicalApi.getUnresolvedAlertsCount().then(setCounts).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error dismissing alert.';
      setErrorMessage(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const mapSeverityBadge = (severity: string): 'critical' | 'warning' | 'info' | 'nominal' | 'neutral' => {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'high':
      case 'warning':
        return 'warning';
      case 'medium':
      case 'low':
      case 'info':
        return 'info';
      case 'nominal':
        return 'nominal';
      default:
        return 'neutral';
    }
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
              <AlertTriangle className={clsx('w-6 h-6', isPaper ? 'text-[#ff4d4d]' : 'text-rose-400')} />
              MISSION ALERTS & CLINICAL TRIAGE SYSTEM
            </h1>
            {isSketch && (
              <div className="w-56 mt-0.5">
                <SquiggleUnderline className={isPaper ? 'text-[#ff4d4d]' : 'text-[#FF4D00]'} />
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
            MULTI-STATE INCIDENT MANAGEMENT: TRIGGERED ➔ ACKNOWLEDGED ➔ ESCALATED ➔ RESOLVED
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {counts && (
            <>
              <Badge status={counts.total_unresolved > 0 ? 'critical' : 'nominal'} themeMode={mode}>
                {counts.total_unresolved} UNRESOLVED
              </Badge>
              {counts.critical > 0 && (
                <Badge status="critical" themeMode={mode}>
                  {counts.critical} CRITICAL
                </Badge>
              )}
              {counts.high > 0 && (
                <Badge status="warning" themeMode={mode}>
                  {counts.high} HIGH
                </Badge>
              )}
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
            title="Refresh Live Alerts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sync Telemetry
          </Button>
        </div>
      </div>

      {/* Success Banner */}
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

      {/* Error Banner */}
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

      {/* Live Filters Bar */}
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
            <Filter className={clsx('w-4 h-4', isPaper ? 'text-[#ff4d4d]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400')} />
            <span
              className={clsx(
                'font-bold',
                isSketch ? 'font-sketch-hand text-sm tracking-wide' : 'font-mono text-cyan-400'
              )}
            >
              TRIAGE QUEUE FILTERS:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className={clsx(isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-400')}>
                Incident Status:
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
                <option value="all">All Incidents</option>
                <option value="triggered">Triggered</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
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

      {/* Main Alerts List */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw
            className={clsx(
              'w-8 h-8 animate-spin mx-auto',
              isPaper ? 'text-[#ff4d4d]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'
            )}
          />
          <p
            className={clsx(
              'text-xs tracking-wider',
              isSketch ? 'font-sketch-hand text-base' : 'font-mono text-slate-400'
            )}
          >
            SYNCHRONIZING ORBITAL BIO-TELEMETRY & ALERT TRIAGE LEDGER...
          </p>
        </div>
      ) : alerts.length === 0 ? (
        <Card
          themeMode={mode}
          radius="wobblyMd"
          decoration={isSketch ? 'tape' : 'none'}
          className="text-center py-16"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3
            className={clsx(
              'text-base font-bold',
              isSketch ? 'font-display-kalam text-lg' : 'font-mono text-white'
            )}
          >
            ALL TELEMETRY NOMINAL
          </h3>
          <p
            className={clsx(
              'text-xs mt-1',
              isSketch ? 'font-sketch-hand text-sm text-stone-500' : 'font-mono text-slate-400'
            )}
          >
            Zero active alerts matching the selected triage filters.
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
        <div className="space-y-4">
          {alerts.map((alert) => {
            const astronautLabel = alert.astronaut
              ? `${alert.astronaut.full_name} (${alert.astronaut.callsign})`
              : 'Crew Telemetry Node';
            const missionLabel = alert.mission ? alert.mission.mission_code : 'AuraMed Orbit';
            const isActionBusy = actionLoadingId === alert.id;

            return (
              /* Alert Triage Card styled as clinical warning note (#fff9c4 in paper, #18110c in dark) */
              <div
                key={alert.id}
                style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
                className={clsx(
                  'relative transition-all p-5 sm:p-6',
                  isSketch
                    ? isPaper
                      ? 'bg-[#fff9c4] text-[#2d2d2d] border-[3px] border-[#2d2d2d] sketch-shadow -rotate-[0.25deg]'
                      : 'bg-[#18110c] text-white border-[3px] border-[#FF4D00] sketch-shadow-orange -rotate-[0.25deg]'
                    : 'rounded-xl border border-[#1E3A5F] bg-[#0B132B]/75 hover:border-cyan-500/40 shadow-md'
                )}
              >
                {/* Warning Tape Header */}
                {isSketch && (
                  <div className="absolute -top-3.5 left-8 z-10 pointer-events-none">
                    <Tape isDark={isDark} className="-rotate-2" />
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                        className={clsx(
                          'text-xs font-bold px-2 py-0.5 select-none',
                          isSketch
                            ? isPaper
                              ? 'bg-white border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand shadow-[2px_2px_0px_0px_#2d2d2d]'
                              : 'bg-black border-2 border-[#FF4D00] text-[#FF4D00] font-sketch-hand shadow-[2px_2px_0px_0px_#FF4D00]'
                            : 'rounded bg-[#050B14] border border-[#1E3A5F] text-cyan-400 font-mono'
                        )}
                      >
                        {alert.alert_code}
                      </span>

                      {/* Severity Badge */}
                      <Badge status={mapSeverityBadge(alert.severity)} themeMode={mode}>
                        {alert.severity.toUpperCase()}
                      </Badge>

                      {/* Status Badge */}
                      <Badge
                        themeMode={mode}
                        status={
                          alert.status === 'resolved'
                            ? 'nominal'
                            : alert.status === 'dismissed'
                            ? 'neutral'
                            : alert.status === 'escalated'
                            ? 'critical'
                            : alert.status === 'acknowledged'
                            ? 'info'
                            : 'warning'
                        }
                      >
                        {alert.status.toUpperCase()}
                      </Badge>

                      <div
                        className={clsx(
                          'flex items-center gap-1 text-xs font-semibold',
                          isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-300'
                        )}
                      >
                        <User className={clsx('w-3.5 h-3.5', isPaper ? 'text-[#ff4d4d]' : 'text-cyan-400')} />
                        <span>{astronautLabel}</span>
                      </div>

                      <div
                        className={clsx(
                          'flex items-center gap-1 text-xs',
                          isSketch ? 'font-sketch-hand text-sm opacity-80' : 'font-mono text-slate-400'
                        )}
                      >
                        <Radio className={clsx('w-3 h-3', isPaper ? 'text-[#2d5da1]' : 'text-cyan-400')} />
                        <span>{missionLabel}</span>
                      </div>

                      <div
                        className={clsx(
                          'flex items-center gap-1 text-[11px]',
                          isSketch ? 'font-sketch-hand text-xs opacity-75' : 'font-mono text-slate-500'
                        )}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{new Date(alert.triggered_at).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* Alert Title */}
                    <h3
                      className={clsx(
                        'font-bold flex items-center gap-2',
                        isSketch ? 'font-display-kalam text-xl' : 'text-base font-sans text-white',
                        isPaper ? 'text-[#2d2d2d]' : 'text-white'
                      )}
                    >
                      {(alert.severity === 'critical' || alert.severity === 'high') && (
                        <AlertTriangle
                          className={clsx('w-5 h-5 shrink-0', isPaper ? 'text-[#ff4d4d]' : 'text-rose-400')}
                        />
                      )}
                      <span>{alert.title}</span>
                    </h3>

                    {/* Alert Description */}
                    <p
                      className={clsx(
                        'text-xs leading-relaxed',
                        isSketch ? 'font-sketch-hand text-base' : 'font-sans text-slate-300',
                        isPaper ? 'text-[#2d2d2d]/90' : isDark ? 'text-white/90' : 'text-slate-300'
                      )}
                    >
                      {alert.description}
                    </p>

                    {/* Operational History: Acknowledgements and Escalations */}
                    {alert.acknowledgements && alert.acknowledgements.length > 0 && (
                      <div
                        style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                        className={clsx(
                          'mt-2.5 p-2.5 text-[11px] space-y-1 transition-all',
                          isSketch
                            ? isPaper
                              ? 'bg-white/80 border-2 border-[#2d2d2d]/30 text-[#2d2d2d] font-sketch-hand text-xs shadow-sm'
                              : 'bg-black/60 border-2 border-[#FF4D00]/50 text-white font-sketch-hand text-xs shadow-sm'
                            : 'rounded bg-[#050B14] border border-[#1E3A5F] text-cyan-300 font-mono'
                        )}
                      >
                        {alert.acknowledgements.map((ack) => (
                          <div key={ack.id} className="flex items-start gap-1.5">
                            <Check
                              className={clsx(
                                'w-3.5 h-3.5 shrink-0 mt-0.5',
                                isPaper ? 'text-emerald-700' : 'text-cyan-400'
                              )}
                            />
                            <span>
                              <strong className={isPaper ? 'text-[#2d2d2d]' : 'text-white'}>
                                {ack.user?.name || 'Operator'}:
                              </strong>{' '}
                              {ack.action_taken} ({new Date(ack.acknowledged_at).toLocaleTimeString()})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {alert.escalations && alert.escalations.length > 0 && (
                      <div
                        style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                        className={clsx(
                          'mt-2.5 p-2.5 text-[11px] space-y-1 transition-all',
                          isSketch
                            ? isPaper
                              ? 'bg-rose-100/90 border-2 border-rose-800/40 text-rose-950 font-sketch-hand text-xs shadow-sm'
                              : 'bg-rose-950/60 border-2 border-[#FF4D00] text-rose-200 font-sketch-hand text-xs shadow-sm'
                            : 'rounded bg-rose-950/30 border border-rose-500/40 text-rose-300 font-mono'
                        )}
                      >
                        {alert.escalations.map((esc) => (
                          <div key={esc.id} className="flex items-start gap-1.5">
                            <ArrowUpRight
                              className={clsx(
                                'w-3.5 h-3.5 shrink-0 mt-0.5',
                                isPaper ? 'text-[#ff4d4d]' : 'text-rose-400'
                              )}
                            />
                            <span>
                              <strong className={isPaper ? 'text-rose-900 font-bold' : 'text-rose-200'}>
                                Escalated to {esc.escalated_to_role.replace('_', ' ').toUpperCase()} by{' '}
                                {esc.user?.name || 'Officer'}:
                              </strong>{' '}
                              {esc.reason} ({new Date(esc.escalated_at).toLocaleTimeString()})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Multi-state Tactile Action Controls */}
                  <div
                    className={clsx(
                      'flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0',
                      !isSketch && 'border-t md:border-t-0 border-[#1E3A5F]'
                    )}
                  >
                    {alert.status === 'triggered' && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenDismiss(alert)}
                          disabled={isActionBusy}
                          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                          className={clsx(
                            'text-xs transition-all',
                            isSketch && (
                              isPaper
                                ? 'bg-white hover:bg-stone-100 text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold'
                                : 'bg-[#0c0c10] hover:bg-[#1c1c24] text-white border-2 border-[#FF4D00] sketch-btn-orange font-sketch-hand font-bold'
                            )
                          )}
                          title="Dismiss as sensor artifact or false positive"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Dismiss
                        </Button>
                        <Button
                          variant="hud"
                          size="sm"
                          onClick={() => handleOpenEscalate(alert)}
                          disabled={isActionBusy}
                          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                          className={clsx(
                            'text-xs transition-all',
                            isSketch
                              ? isPaper
                                ? 'bg-[#ff4d4d] hover:bg-[#e03a3a] text-white border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold'
                                : 'bg-[#FF4D00] hover:bg-[#e64500] text-black border-2 border-white sketch-btn-orange font-sketch-hand font-bold'
                              : 'text-rose-300 border-rose-500/50 hover:bg-rose-950/40'
                          )}
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> Escalate
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenAcknowledge(alert)}
                          disabled={isActionBusy}
                          isLoading={isActionBusy}
                          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                          className={clsx(
                            'text-xs transition-all',
                            isSketch && (
                              isPaper
                                ? 'bg-amber-300 hover:bg-amber-400 text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold'
                                : 'bg-amber-400 hover:bg-amber-300 text-black border-2 border-white sketch-btn-orange font-sketch-hand font-bold'
                            )
                          )}
                        >
                          <Check className="w-3.5 h-3.5" /> Acknowledge Alert
                        </Button>
                      </>
                    )}

                    {alert.status === 'acknowledged' && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenDismiss(alert)}
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
                        >
                          <XCircle className="w-3.5 h-3.5" /> Dismiss
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEscalate(alert)}
                          disabled={isActionBusy}
                          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                          className={clsx(
                            'text-xs',
                            isSketch
                              ? isPaper
                                ? 'bg-rose-200 hover:bg-rose-300 text-rose-950 border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold'
                                : 'bg-[#18110c] text-rose-300 border-2 border-[#FF4D00] sketch-btn-orange font-sketch-hand font-bold'
                              : 'text-amber-300 border-amber-500/40 hover:bg-amber-950/40'
                          )}
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> Escalate to Director
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenResolve(alert)}
                          disabled={isActionBusy}
                          isLoading={isActionBusy}
                          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                          className={clsx(
                            'text-xs',
                            isSketch
                              ? isPaper
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-black border-2 border-white sketch-btn-orange font-sketch-hand font-bold'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          )}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                        </Button>
                      </>
                    )}

                    {alert.status === 'escalated' && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenDismiss(alert)}
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
                        >
                          <XCircle className="w-3.5 h-3.5" /> Dismiss
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenResolve(alert)}
                          disabled={isActionBusy}
                          isLoading={isActionBusy}
                          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                          className={clsx(
                            'text-xs',
                            isSketch
                              ? isPaper
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-black border-2 border-white sketch-btn-orange font-sketch-hand font-bold'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          )}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolve Incident
                        </Button>
                      </>
                    )}

                    {alert.status === 'resolved' && (
                      <span
                        style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                        className={clsx(
                          'text-xs flex items-center gap-1 font-bold px-3 py-1 select-none',
                          isSketch
                            ? isPaper
                              ? 'bg-emerald-100 text-emerald-950 border-2 border-[#2d2d2d] font-sketch-hand'
                              : 'bg-emerald-950/80 text-emerald-300 border-2 border-emerald-400 font-sketch-hand'
                            : 'font-mono text-emerald-400 rounded bg-emerald-950/30 border border-emerald-500/30'
                        )}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> RESOLVED & ARCHIVED
                      </span>
                    )}

                    {alert.status === 'dismissed' && (
                      <span
                        style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                        className={clsx(
                          'text-xs flex items-center gap-1 font-bold px-3 py-1 select-none',
                          isSketch
                            ? isPaper
                              ? 'bg-[#e5e0d8] text-[#2d2d2d] border-2 border-[#2d2d2d] font-sketch-hand'
                              : 'bg-black text-white/70 border-2 border-white/50 font-sketch-hand'
                            : 'font-mono text-slate-400 rounded bg-[#050B14] border border-slate-700'
                        )}
                      >
                        <XCircle className="w-4 h-4 text-slate-500" /> DISMISSED
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ACKNOWLEDGE MODAL */}
      {acknowledgingAlert && (
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
                <Check className="w-5 h-5 text-emerald-500" />
                Acknowledge Alert [{acknowledgingAlert.alert_code}]
              </h3>
              <button
                type="button"
                onClick={() => setAcknowledgingAlert(null)}
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
              <strong className={isPaper ? 'text-[#ff4d4d]' : 'text-white'}>
                {acknowledgingAlert.title}
              </strong>
            </p>

            <label
              className={clsx(
                'block text-xs mb-1.5 font-bold',
                isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-400'
              )}
            >
              OPERATIONAL ACTION TAKEN / CLINICAL REMARK:
            </label>
            <textarea
              value={ackActionTaken}
              onChange={(e) => setAckActionTaken(e.target.value)}
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
              placeholder="Detail verification steps performed..."
            />

            <div className="flex justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAcknowledgingAlert(null)}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(isSketch && 'font-sketch-hand font-bold text-sm')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAcknowledge}
                isLoading={actionLoadingId === acknowledgingAlert.id}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  isSketch && (
                    isPaper
                      ? 'bg-amber-300 hover:bg-amber-400 text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold text-sm'
                      : 'bg-amber-400 hover:bg-amber-300 text-black border-2 border-white sketch-btn-orange font-sketch-hand font-bold text-sm'
                  )
                )}
              >
                Confirm Acknowledgment
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ESCALATE MODAL */}
      {escalatingAlert && (
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
                <ShieldAlert className="w-5 h-5 shrink-0" />
                Escalate Incident [{escalatingAlert.alert_code}]
              </h3>
              <button
                type="button"
                onClick={() => setEscalatingAlert(null)}
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
              <strong className={isPaper ? 'text-[#ff4d4d]' : 'text-white'}>
                {escalatingAlert.title}
              </strong>
            </p>

            <div className="space-y-3.5 mb-4">
              <div>
                <label
                  className={clsx(
                    'block text-xs mb-1.5 font-bold',
                    isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-400'
                  )}
                >
                  ESCALATE TO COMMAND ROLE:
                </label>
                <select
                  value={escalateRole}
                  onChange={(e) => setEscalateRole(e.target.value as 'flight_surgeon' | 'mission_director' | 'medical_officer')}
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'w-full p-2.5 text-xs focus:outline-none cursor-pointer transition-all',
                    isSketch
                      ? isPaper
                        ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-base shadow-[2px_2px_0px_0px_#2d2d2d]'
                        : 'bg-[#050B14] border-2 border-[#FF4D00] text-white font-sketch-hand text-base shadow-[2px_2px_0px_0px_#FF4D00]'
                      : 'rounded-lg bg-[#050B14] border border-[#1E3A5F] text-white font-mono focus:border-rose-400'
                  )}
                >
                  <option value="flight_surgeon">Flight Surgeon (Clinical Command)</option>
                  <option value="mission_director">Mission Director (Flight Operations)</option>
                  <option value="medical_officer">Senior Medical Officer</option>
                </select>
              </div>

              <div>
                <label
                  className={clsx(
                    'block text-xs mb-1.5 font-bold',
                    isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-400'
                  )}
                >
                  ESCALATION REASON & DIRECTIVE (MIN 5 CHARS):
                </label>
                <textarea
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  rows={3}
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'w-full p-3 text-xs focus:outline-none transition-all',
                    isSketch
                      ? isPaper
                        ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-base shadow-[2px_2px_0px_0px_#2d2d2d]'
                        : 'bg-[#050B14] border-2 border-[#FF4D00] text-white font-sketch-hand text-base shadow-[2px_2px_0px_0px_#FF4D00]'
                      : 'rounded-lg bg-[#050B14] border border-[#1E3A5F] text-white placeholder-slate-500 focus:border-rose-400 font-mono'
                  )}
                  placeholder="Detail why anomaly requires senior commanding intervention..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEscalatingAlert(null)}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(isSketch && 'font-sketch-hand font-bold text-sm')}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmEscalate}
                isLoading={actionLoadingId === escalatingAlert.id}
                disabled={escalateReason.trim().length < 5}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  isSketch && (
                    isPaper
                      ? 'bg-[#ff4d4d] hover:bg-[#e03a3a] text-white border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold text-sm'
                      : 'bg-[#FF4D00] hover:bg-[#e64500] text-black border-2 border-white sketch-btn-orange font-sketch-hand font-bold text-sm'
                  )
                )}
              >
                Submit Escalation
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* RESOLVE MODAL */}
      {resolvingAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card
            themeMode={mode}
            radius="wobblyMd"
            decoration={isSketch ? 'tape' : 'none'}
            className={clsx(
              'w-full max-w-lg transition-all',
              !isSketch && 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
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
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Resolve Incident [{resolvingAlert.alert_code}]
              </h3>
              <button
                type="button"
                onClick={() => setResolvingAlert(null)}
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
              <strong className={isPaper ? 'text-[#ff4d4d]' : 'text-white'}>
                {resolvingAlert.title}
              </strong>
            </p>

            <label
              className={clsx(
                'block text-xs mb-1.5 font-bold',
                isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-400'
              )}
            >
              FINAL CLINICAL RESOLUTION PROTOCOL & LOG:
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'w-full p-3 text-xs mb-4 focus:outline-none transition-all',
                isSketch
                  ? isPaper
                    ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-base shadow-[2px_2px_0px_0px_#2d2d2d]'
                    : 'bg-[#050B14] border-2 border-[#FF4D00] text-white font-sketch-hand text-base shadow-[2px_2px_0px_0px_#FF4D00]'
                  : 'rounded-lg bg-[#050B14] border border-[#1E3A5F] text-white placeholder-slate-500 focus:border-emerald-400 font-mono'
              )}
              placeholder="State resolution confirmation, countermeasures administered, and vitals trend..."
            />

            <div className="flex justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResolvingAlert(null)}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(isSketch && 'font-sketch-hand font-bold text-sm')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmResolve}
                isLoading={actionLoadingId === resolvingAlert.id}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  isSketch && (
                    isPaper
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold text-sm'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black border-2 border-white sketch-btn-orange font-sketch-hand font-bold text-sm'
                  )
                )}
              >
                Confirm Incident Resolution
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* DISMISS MODAL */}
      {dismissingAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card
            themeMode={mode}
            radius="wobblyMd"
            decoration={isSketch ? 'tape' : 'none'}
            className={clsx(
              'w-full max-w-lg transition-all',
              !isSketch && 'border-slate-500/50 shadow-[0_0_30px_rgba(100,116,139,0.25)]'
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
                <XCircle className="w-5 h-5 text-slate-400" />
                Dismiss Alert [{dismissingAlert.alert_code}]
              </h3>
              <button
                type="button"
                onClick={() => setDismissingAlert(null)}
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
              <strong className={isPaper ? 'text-[#ff4d4d]' : 'text-white'}>
                {dismissingAlert.title}
              </strong>
            </p>

            <label
              className={clsx(
                'block text-xs mb-1.5 font-bold',
                isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-400'
              )}
            >
              DISMISSAL RATIONALE (SENSOR ARTIFACT / FALSE POSITIVE):
            </label>
            <textarea
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              rows={3}
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'w-full p-3 text-xs mb-4 focus:outline-none transition-all',
                isSketch
                  ? isPaper
                    ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-base shadow-[2px_2px_0px_0px_#2d2d2d]'
                    : 'bg-[#050B14] border-2 border-[#FF4D00] text-white font-sketch-hand text-base shadow-[2px_2px_0px_0px_#FF4D00]'
                  : 'rounded-lg bg-[#050B14] border border-[#1E3A5F] text-white placeholder-slate-500 focus:border-slate-400 font-mono'
              )}
              placeholder="State reason for discarding this telemetry alert..."
            />

            <div className="flex justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDismissingAlert(null)}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(isSketch && 'font-sketch-hand font-bold text-sm')}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleConfirmDismiss}
                isLoading={actionLoadingId === dismissingAlert.id}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  isSketch && (
                    isPaper
                      ? 'bg-stone-200 hover:bg-stone-300 text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold text-sm'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white border-2 border-white/40 sketch-btn font-sketch-hand font-bold text-sm'
                  )
                )}
              >
                Dismiss Alert
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
