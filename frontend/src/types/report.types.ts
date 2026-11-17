export type ReportType =
  | 'crew_health_summary'
  | 'equipment_performance'
  | 'mission_analysis'
  | 'forensic_timeline'
  | 'ai_validation'
  | 'alert_summary'
  | 'medication_log'
  | 'eva_debrief'
  | 'post_mission';

export type ReportStatus = 'approved' | 'pending_review' | 'rejected';

export interface ReportForensicEvent {
  id: number;
  report_id: number;
  event_time: string;
  event_type: string;
  title: string;
  description?: string | null;
  related_metric?: string | null;
  metric_value?: string | null;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  sort_order?: number;
  created_at?: string;
}

export interface Report {
  id: number;
  uuid: string;
  report_code: string;
  title: string;
  report_type: ReportType;
  astronaut_id?: number | null;
  mission_id?: number | null;
  generated_by: number;
  period_start: string;
  period_end: string;
  status: ReportStatus;
  approved_by?: number | null;
  approved_at?: string | null;
  file_path_pdf?: string | null;
  file_path_csv?: string | null;
  summary: string;
  created_at: string;
  updated_at: string;
  astronaut?: {
    id: number;
    callsign: string;
    full_name: string;
  } | null;
  mission?: {
    id: number;
    name: string;
    mission_code: string;
  } | null;
  author?: {
    id: number;
    name: string;
    email?: string;
  } | null;
  approver?: {
    id: number;
    name: string;
    email?: string;
  } | null;
  forensic_events?: ReportForensicEvent[];
}

export interface CreateReportPayload {
  title: string;
  report_type: ReportType;
  astronaut_id?: number | null;
  mission_id?: number | null;
  period_start?: string;
  period_end?: string;
  summary: string;
  forensic_events?: Array<{
    event_time: string;
    event_type: string;
    title: string;
    description?: string;
    related_metric?: string;
    metric_value?: string;
    severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export interface ForensicTimelineResponse {
  report_code: string;
  period_start: string;
  period_end: string;
  events: ReportForensicEvent[];
}

export const REPORT_TYPE_CONFIG: Record<
  ReportType,
  { code: string; label: string; description: string }
> = {
  crew_health_summary: {
    code: 'RPT-01',
    label: 'Crew Health Summary',
    description: 'Comprehensive 30-day multi-organ physiological assessment & baseline metrics',
  },
  equipment_performance: {
    code: 'RPT-02',
    label: 'Equipment & ECLSS Performance',
    description: 'Life support, suit pressure seals, scrubbers, and sensor calibration audit',
  },
  mission_analysis: {
    code: 'RPT-03',
    label: 'Mission Bio-Analysis',
    description: 'Fleet-wide bio-astronautics metrics correlated across orbital phases',
  },
  forensic_timeline: {
    code: 'RPT-04',
    label: 'Forensic Timeline Correlation',
    description: 'Time-correlated physiological anomaly vs environmental and solar event tracing',
  },
  ai_validation: {
    code: 'RPT-05',
    label: 'AI Clinical Model Validation',
    description: 'BioCardio-Net & neural telemetry model concordance vs human surgeon diagnoses',
  },
  alert_summary: {
    code: 'RPT-06',
    label: 'Alert & Incident Triage Log',
    description: 'Consolidated report of high-priority alerts, escalations, and interventions',
  },
  medication_log: {
    code: 'RPT-07',
    label: 'Medication & Countermeasure Log',
    description: 'Pharmacological interventions, antiemetics, and radiation prophylaxis records',
  },
  eva_debrief: {
    code: 'RPT-08',
    label: 'EVA Sortie Debrief',
    description: 'Extravehicular exertion, suit telemetry, venous bubble Doppler, and repress data',
  },
  post_mission: {
    code: 'RPT-09',
    label: 'Post-Mission Longitudinal Health',
    description: 'Long-term physiological adaptation, neuro-vestibular recovery, and bone density',
  },
};
