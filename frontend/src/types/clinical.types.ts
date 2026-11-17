export interface AiInsight {
  id: number;
  job_id: number;
  astronaut_id: number;
  insight_type: string;
  title: string;
  description: string;
  confidence_score: number | string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  recommended_action: string | null;
  raw_output?: Record<string, unknown> | null;
  analyzed_at: string;
  review_status: 'pending_review' | 'approved' | 'rejected' | 'modified';
  astronaut?: {
    id: number;
    callsign: string;
    full_name: string;
  };
  job?: {
    id: number;
    model_name: string;
    analysis_type: string;
  };
  review?: {
    id: number;
    decision: 'approved' | 'rejected' | 'modified';
    reviewer_notes: string | null;
    modified_description?: string | null;
    reviewed_at: string;
    reviewer?: {
      id: number;
      name: string;
      email: string;
    };
  };
}

export interface AiInsightStats {
  total: number;
  pending_review: number;
  approved: number;
  rejected: number;
  modified: number;
  critical: number;
  high: number;
  average_confidence: number;
}

export interface AlertAcknowledgement {
  id: number;
  alert_id: number;
  acknowledged_by: number;
  action_taken: string;
  acknowledged_at: string;
  user?: {
    id: number;
    name: string;
  };
}

export interface AlertEscalation {
  id: number;
  alert_id: number;
  escalated_by: number;
  escalated_to_role: 'flight_surgeon' | 'mission_director' | 'medical_officer';
  reason: string;
  escalated_at: string;
  user?: {
    id: number;
    name: string;
  };
}

export interface Alert {
  id: number;
  uuid: string;
  astronaut_id: number;
  mission_id?: number | null;
  source_type: string;
  source_id?: number | null;
  alert_code: string;
  title: string;
  description: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical' | 'warning' | 'nominal';
  status: 'triggered' | 'acknowledged' | 'escalated' | 'resolved' | 'dismissed';
  triggered_at: string;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  astronaut?: {
    id: number;
    callsign: string;
    full_name: string;
  };
  mission?: {
    id: number;
    name: string;
    mission_code: string;
  };
  acknowledgements?: AlertAcknowledgement[];
  escalations?: AlertEscalation[];
}

export interface AlertUnresolvedCount {
  total_unresolved: number;
  critical: number;
  high: number;
  medium: number;
}

export interface MissionPhase {
  id: number;
  mission_id: number;
  phase_name: string;
  phase_order: number;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  started_at?: string | null;
  completed_at?: string | null;
  description?: string | null;
}

export interface MissionCrewMember {
  id: number;
  callsign: string;
  full_name: string;
  rank: string;
  specialization: string;
  total_eva_hours?: number | string;
  total_space_days?: number;
  pivot?: {
    crew_role: string;
    assigned_at: string;
    is_primary_crew: boolean | number;
  };
}

export interface Mission {
  id: number;
  uuid: string;
  mission_code: string;
  name: string;
  description?: string | null;
  mission_type: 'ISS' | 'LUNAR' | 'MARS' | 'DEEP_SPACE' | 'SUBORBITAL';
  status: 'planned' | 'active' | 'completed' | 'aborted';
  launch_date: string;
  expected_return_date?: string | null;
  actual_return_date?: string | null;
  vehicle_name?: string | null;
  destination?: string | null;
  mission_elapsed_seconds?: number;
  is_primary?: boolean;
  crew?: MissionCrewMember[];
  phases?: MissionPhase[];
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  event_type: string;
  auditable_type: string;
  auditable_id?: number | null;
  description: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string;
  user_agent?: string;
  previous_hash: string;
  current_hash: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface AuditVerificationResult {
  is_valid: boolean;
  verified_records: number;
  total_records: number;
  compromised_at_id: number | null;
  failure_reason: string | null;
  chain_status: string;
  verified_at: string;
}
