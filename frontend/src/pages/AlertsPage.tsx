import React, { useState, useEffect } from 'react';
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
import { clinicalApi } from '../api/clinicalApi';
import { Alert, AlertUnresolvedCount } from '../types/clinical.types';

export const AlertsPage: React.FC = () => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold text-white tracking-wide flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
            MISSION ALERTS & CLINICAL TRIAGE SYSTEM
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            MULTI-STATE INCIDENT MANAGEMENT: TRIGGERED ➔ ACKNOWLEDGED ➔ ESCALATED ➔ RESOLVED
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {counts && (
            <>
              <Badge status={counts.total_unresolved > 0 ? 'critical' : 'nominal'}>
                {counts.total_unresolved} UNRESOLVED
              </Badge>
              {counts.critical > 0 && (
                <Badge status="critical">{counts.critical} CRITICAL</Badge>
              )}
              {counts.high > 0 && (
                <Badge status="warning">{counts.high} HIGH</Badge>
              )}
            </>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualRefresh}
            isLoading={isRefreshing}
            className="text-xs gap-1.5"
            title="Refresh Live Alerts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Banner */}
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

      {/* Live Filters Bar */}
      <Card className="border-[#1E3A5F] p-4 bg-[#0B132B]/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">TRIAGE QUEUE FILTERS:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-400">Incident Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#050B14] border border-[#1E3A5F] rounded px-2.5 py-1 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none cursor-pointer"
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

      {/* Main Alerts List */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400 tracking-wider">
            SYNCHRONIZING ORBITAL BIO-TELEMETRY & ALERT TRIAGE LEDGER...
          </p>
        </div>
      ) : alerts.length === 0 ? (
        <Card className="border-[#1E3A5F] text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-sm font-mono font-bold text-white">ALL TELEMETRY NOMINAL</h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
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
              className="mt-4 text-xs"
            >
              Reset Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3.5">
          {alerts.map((alert) => {
            const astronautLabel = alert.astronaut
              ? `${alert.astronaut.full_name} (${alert.astronaut.callsign})`
              : 'Crew Telemetry Node';
            const missionLabel = alert.mission ? alert.mission.mission_code : 'AuraMed Orbit';
            const isActionBusy = actionLoadingId === alert.id;

            return (
              <Card key={alert.id} className="border-[#1E3A5F] hover:border-cyan-500/40 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-[#050B14] border border-[#1E3A5F]">
                        {alert.alert_code}
                      </span>

                      <Badge status={mapSeverityBadge(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>

                      <Badge
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

                      <div className="flex items-center gap-1 text-xs font-mono text-slate-300">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{astronautLabel}</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
                        <Radio className="w-3 h-3 text-cyan-400" />
                        <span>{missionLabel}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(alert.triggered_at).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {(alert.severity === 'critical' || alert.severity === 'high') && (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      {alert.title}
                    </h3>

                    <p className="text-xs text-slate-300 font-sans leading-relaxed">{alert.description}</p>

                    {/* Operational History: Acknowledgements and Escalations */}
                    {alert.acknowledgements && alert.acknowledgements.length > 0 && (
                      <div className="mt-2 p-2 rounded bg-[#050B14] border border-[#1E3A5F] text-[11px] font-mono space-y-1 text-cyan-300">
                        {alert.acknowledgements.map((ack) => (
                          <div key={ack.id} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-white">{ack.user?.name || 'Operator'}:</strong> {ack.action_taken} ({new Date(ack.acknowledged_at).toLocaleTimeString()})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {alert.escalations && alert.escalations.length > 0 && (
                      <div className="mt-2 p-2 rounded bg-rose-950/30 border border-rose-500/40 text-[11px] font-mono space-y-1 text-rose-300">
                        {alert.escalations.map((esc) => (
                          <div key={esc.id} className="flex items-start gap-1.5">
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-rose-200">Escalated to {esc.escalated_to_role.replace('_', ' ').toUpperCase()} by {esc.user?.name || 'Officer'}:</strong> {esc.reason} ({new Date(esc.escalated_at).toLocaleTimeString()})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Multi-state Action Controls */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#1E3A5F]">
                    {alert.status === 'triggered' && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenDismiss(alert)}
                          disabled={isActionBusy}
                          className="text-xs"
                          title="Dismiss as sensor artifact or false positive"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Dismiss
                        </Button>
                        <Button
                          variant="hud"
                          size="sm"
                          onClick={() => handleOpenEscalate(alert)}
                          disabled={isActionBusy}
                          className="text-xs text-rose-300 border-rose-500/50 hover:bg-rose-950/40"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> Escalate
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenAcknowledge(alert)}
                          disabled={isActionBusy}
                          isLoading={isActionBusy}
                          className="text-xs"
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
                          className="text-xs"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Dismiss
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEscalate(alert)}
                          disabled={isActionBusy}
                          className="text-xs text-amber-300 border-amber-500/40 hover:bg-amber-950/40"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> Escalate to Director
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenResolve(alert)}
                          disabled={isActionBusy}
                          isLoading={isActionBusy}
                          className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
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
                          className="text-xs"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Dismiss
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenResolve(alert)}
                          disabled={isActionBusy}
                          isLoading={isActionBusy}
                          className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolve Incident
                        </Button>
                      </>
                    )}

                    {alert.status === 'resolved' && (
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold px-2 py-1 rounded bg-emerald-950/30 border border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> RESOLVED & ARCHIVED
                      </span>
                    )}

                    {alert.status === 'dismissed' && (
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1 font-bold px-2 py-1 rounded bg-[#050B14] border border-slate-700">
                        <XCircle className="w-4 h-4 text-slate-500" /> DISMISSED
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ACKNOWLEDGE MODAL */}
      {acknowledgingAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-cyan-500/50 shadow-[0_0_30px_rgba(0,229,255,0.25)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3A5F] mb-4">
              <h3 className="text-base font-mono font-bold text-white flex items-center gap-2">
                <Check className="w-5 h-5 text-cyan-400" />
                Acknowledge Alert [{acknowledgingAlert.alert_code}]
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setAcknowledgingAlert(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-slate-300 font-mono mb-2">
              <strong className="text-white">{acknowledgingAlert.title}</strong>
            </p>

            <label className="block text-xs font-mono text-slate-400 mb-1.5 font-bold">
              OPERATIONAL ACTION TAKEN / CLINICAL REMARK:
            </label>
            <textarea
              value={ackActionTaken}
              onChange={(e) => setAckActionTaken(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono mb-4"
              placeholder="Detail verification steps performed..."
            />

            <div className="flex justify-end gap-2.5">
              <Button variant="ghost" size="sm" onClick={() => setAcknowledgingAlert(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAcknowledge}
                isLoading={actionLoadingId === acknowledgingAlert.id}
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
          <Card className="w-full max-w-lg border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.25)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3A5F] mb-4">
              <h3 className="text-base font-mono font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                Escalate Incident [{escalatingAlert.alert_code}]
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setEscalatingAlert(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-slate-300 font-mono mb-3">
              <strong className="text-white">{escalatingAlert.title}</strong>
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5 font-bold">
                  ESCALATE TO COMMAND ROLE:
                </label>
                <select
                  value={escalateRole}
                  onChange={(e) => setEscalateRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-white font-mono focus:border-rose-400 focus:outline-none cursor-pointer"
                >
                  <option value="flight_surgeon">Flight Surgeon (Clinical Command)</option>
                  <option value="mission_director">Mission Director (Flight Operations)</option>
                  <option value="medical_officer">Senior Medical Officer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5 font-bold">
                  ESCALATION REASON & DIRECTIVE (MIN 5 CHARS):
                </label>
                <textarea
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 font-mono"
                  placeholder="Detail why anomaly requires senior commanding intervention..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <Button variant="ghost" size="sm" onClick={() => setEscalatingAlert(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmEscalate}
                isLoading={actionLoadingId === escalatingAlert.id}
                disabled={escalateReason.trim().length < 5}
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
          <Card className="w-full max-w-lg border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3A5F] mb-4">
              <h3 className="text-base font-mono font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Resolve Incident [{resolvingAlert.alert_code}]
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setResolvingAlert(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-slate-300 font-mono mb-2">
              <strong className="text-white">{resolvingAlert.title}</strong>
            </p>

            <label className="block text-xs font-mono text-slate-400 mb-1.5 font-bold">
              FINAL CLINICAL RESOLUTION PROTOCOL & LOG:
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono mb-4"
              placeholder="State resolution confirmation, countermeasures administered, and vitals trend..."
            />

            <div className="flex justify-end gap-2.5">
              <Button variant="ghost" size="sm" onClick={() => setResolvingAlert(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmResolve}
                isLoading={actionLoadingId === resolvingAlert.id}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
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
          <Card className="w-full max-w-lg border-slate-500/50 shadow-[0_0_30px_rgba(100,116,139,0.25)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3A5F] mb-4">
              <h3 className="text-base font-mono font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-slate-400" />
                Dismiss Alert [{dismissingAlert.alert_code}]
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setDismissingAlert(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-slate-300 font-mono mb-2">
              <strong className="text-white">{dismissingAlert.title}</strong>
            </p>

            <label className="block text-xs font-mono text-slate-400 mb-1.5 font-bold">
              DISMISSAL RATIONALE (SENSOR ARTIFACT / FALSE POSITIVE):
            </label>
            <textarea
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-400 font-mono mb-4"
              placeholder="State reason for discarding this telemetry alert..."
            />

            <div className="flex justify-end gap-2.5">
              <Button variant="ghost" size="sm" onClick={() => setDismissingAlert(null)}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleConfirmDismiss}
                isLoading={actionLoadingId === dismissingAlert.id}
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
