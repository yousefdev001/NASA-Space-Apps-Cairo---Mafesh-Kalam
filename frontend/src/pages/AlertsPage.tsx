import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      code: 'ALT-104',
      title: 'Hypoxia Warning: SpO2 dipped below 95% threshold',
      astronaut: 'Arya Patel (SPC-03)',
      severity: 'critical' as const,
      status: 'triggered' as const,
      timestamp: '14 mins ago',
      source: 'Suit Bio-Sensor Node 2',
      details: 'SpO2 reached 94.2% for 45 seconds during high metabolic load in airlock.',
    },
    {
      id: 2,
      code: 'ALT-099',
      title: 'Elevated Core Body Temperature (37.9 °C)',
      astronaut: 'Marcus Chen (PLT-02)',
      severity: 'warning' as const,
      status: 'acknowledged' as const,
      timestamp: '1 hour ago',
      source: 'Core Temp Pill Sensor',
      details: 'Elevated temperature post-treadmill exercise session. Cooling garments active.',
    },
    {
      id: 3,
      code: 'ALT-087',
      title: 'Galactic Cosmic Radiation Rate Spike in Forward Hab',
      astronaut: 'Habitat Sector 4',
      severity: 'warning' as const,
      status: 'escalated' as const,
      timestamp: '3 hours ago',
      source: 'Silicon Dosimeter #3',
      details: 'Dose rate momentarily elevated to 0.084 mSv/h during passage through radiation belt anomaly.',
    },
    {
      id: 4,
      code: 'ALT-075',
      title: 'Tachycardia during EVA suit ingress',
      astronaut: 'Elena Vance (CDR-01)',
      severity: 'nominal' as const,
      status: 'resolved' as const,
      timestamp: 'Yesterday',
      source: 'Lead II ECG Array',
      details: 'HR returned to 62 BPM after suit seals equalized. Normal exertion profile.',
    },
  ]);

  const handleStatusChange = (id: number, nextStatus: any) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold text-white tracking-wide flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
            MISSION ALERTS & CLINICAL TRIAGE SYSTEM
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            MULTI-STATE INCIDENT MANAGEMENT: TRIGGERED ➔ ACKNOWLEDGED ➔ ESCALATED ➔ RESOLVED
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge status="critical">1 TRIGGERED</Badge>
          <Badge status="warning">2 IN TRIAGE</Badge>
        </div>
      </div>

      <div className="space-y-3.5">
        {alerts.map((alert) => (
          <Card key={alert.id} className="border-[#1E3A5F]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-[#050B14] border border-[#1E3A5F]">
                    {alert.code}
                  </span>
                  <Badge status={alert.severity}>{alert.severity}</Badge>
                  <span className="text-xs font-mono text-slate-400">· {alert.astronaut}</span>
                  <span className="text-xs font-mono text-slate-500">· {alert.timestamp}</span>
                </div>
                <h3 className="text-base font-bold text-white">{alert.title}</h3>
                <p className="text-xs text-slate-300 font-sans">{alert.details}</p>
              </div>

              {/* Action Buttons based on state */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0">
                {alert.status === 'triggered' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange(alert.id, 'acknowledged')}
                    className="text-xs"
                  >
                    Acknowledge Alert
                  </Button>
                )}
                {alert.status === 'acknowledged' && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStatusChange(alert.id, 'escalated')}
                      className="text-xs"
                    >
                      Escalate to Director
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStatusChange(alert.id, 'resolved')}
                      className="text-xs"
                    >
                      Mark Resolved
                    </Button>
                  </>
                )}
                {alert.status === 'escalated' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange(alert.id, 'resolved')}
                    className="text-xs"
                  >
                    Resolve Incident
                  </Button>
                )}
                {alert.status === 'resolved' && (
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> RESOLVED & ARCHIVED
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
