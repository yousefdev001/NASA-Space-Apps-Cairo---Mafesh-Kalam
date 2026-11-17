import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FileText, Download, Clock, ShieldCheck, Activity } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const reports = [
    {
      code: 'RPT-01',
      title: 'Orbital Crew Comprehensive Health Summary',
      scope: 'Artemis IV Crew (Elena Vance, Marcus Chen, Arya Patel)',
      period: 'Past 30 Days (MET 12:00:00 to 42:00:00)',
      status: 'approved',
      generatedBy: 'Dr. Henrik Lindqvist (Flight Surgeon)',
      pdfSize: '2.4 MB',
    },
    {
      code: 'RPT-02',
      title: 'EVA Suit Telemetry & ECLSS Sensor Calibration Audit',
      scope: 'xEMU Suit Arrays #1, #2, #3',
      period: 'Post-EVA #3 Inspection',
      status: 'approved',
      generatedBy: 'Biomedical Engineering Unit',
      pdfSize: '1.8 MB',
    },
    {
      code: 'RPT-04',
      title: 'Forensic Timeline Correlation: Trans-Lunar Radiation Event',
      scope: 'Whole Crew Biometric Anomaly Correlation',
      period: 'MET 24:14:00 - 24:18:00',
      status: 'pending_review',
      generatedBy: 'Forensics & Bio-Astronautics Team',
      pdfSize: '4.1 MB',
    },
    {
      code: 'RPT-05',
      title: 'AI Cardiac Arrhythmia Model Clinical Validation Metric',
      scope: 'BioCardio-Net v3.2 vs Human Surgeon Diagnoses',
      period: 'Mission Inception to Current MET',
      status: 'approved',
      generatedBy: 'NASA Chief Medical Officer',
      pdfSize: '3.0 MB',
    },
  ];

  return (
    <div className="space-y-6">
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

        <Button variant="primary" size="sm">
          + Generate Clinical Report
        </Button>
      </div>

      <div className="space-y-3.5">
        {reports.map((report) => (
          <Card key={report.code} className="border-[#1E3A5F]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-[#050B14] border border-[#1E3A5F]">
                    {report.code}
                  </span>
                  <Badge status={report.status === 'approved' ? 'nominal' : 'warning'}>
                    {report.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs font-mono text-slate-400">· {report.period}</span>
                </div>
                <h3 className="text-base font-bold text-white">{report.title}</h3>
                <p className="text-xs text-slate-300 font-mono">
                  Subject Scope: <span className="text-cyan-300">{report.scope}</span>
                </p>
                <p className="text-[11px] text-slate-500 font-mono">Author: {report.generatedBy}</p>
              </div>

              <div className="flex items-center gap-2.5 pt-2 lg:pt-0">
                <Button variant="secondary" size="sm" className="text-xs gap-1.5">
                  <Download className="w-3.5 h-3.5" /> PDF ({report.pdfSize})
                </Button>
                <Button variant="hud" size="sm" className="text-xs gap-1.5">
                  <Download className="w-3.5 h-3.5" /> CSV Data
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
