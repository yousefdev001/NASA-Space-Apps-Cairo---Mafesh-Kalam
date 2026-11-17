import apiClient from './client';
import {
  AiInsight,
  AiInsightStats,
  Alert,
  AlertUnresolvedCount,
  Mission,
  AuditLog,
  AuditVerificationResult,
} from '../types/clinical.types';

export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const clinicalApi = {
  // ================= AI Insights =================
  async getAiInsights(params?: {
    review_status?: string;
    severity?: string;
    astronaut_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<{ insights: AiInsight[]; total: number }> {
    const res = await apiClient.get('/ai-insights', { params });
    const data = res.data.data;
    const total = res.data.meta?.total ?? (Array.isArray(data) ? data.length : 0);
    return {
      insights: Array.isArray(data) ? data : [],
      total,
    };
  },

  async getAiInsightStats(): Promise<AiInsightStats> {
    const res = await apiClient.get('/ai-insights/stats');
    return res.data.data;
  },

  async approveAiInsight(
    id: number,
    reviewerNotes: string = 'Clinically verified and accepted by Flight Surgeon.'
  ): Promise<{ insight: AiInsight }> {
    const res = await apiClient.post(`/ai-insights/${id}/approve`, {
      reviewer_notes: reviewerNotes,
    });
    return res.data.data;
  },

  async rejectAiInsight(
    id: number,
    reviewerNotes: string
  ): Promise<{ insight: AiInsight }> {
    const res = await apiClient.post(`/ai-insights/${id}/reject`, {
      reviewer_notes: reviewerNotes,
    });
    return res.data.data;
  },

  async modifyAiInsight(
    id: number,
    payload: { modified_description: string; reviewer_notes?: string }
  ): Promise<{ insight: AiInsight }> {
    const res = await apiClient.post(`/ai-insights/${id}/modify`, payload);
    return res.data.data;
  },

  // ================= Alerts =================
  async getAlerts(params?: {
    status?: string;
    severity?: string;
    astronaut_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<{ alerts: Alert[]; total: number }> {
    const queryParams: Record<string, string | number> = {};
    if (params?.status && params.status !== 'all') {
      queryParams.status = params.status;
    }
    if (params?.severity && params.severity !== 'all') {
      queryParams.severity = params.severity;
    }
    if (params?.astronaut_id) {
      queryParams.astronaut_id = params.astronaut_id;
    }
    if (params?.per_page) {
      queryParams.per_page = params.per_page;
    }
    if (params?.page) {
      queryParams.page = params.page;
    }

    const res = await apiClient.get('/alerts', { params: queryParams });
    const data = res.data.data;
    const total = res.data.meta?.total ?? (Array.isArray(data) ? data.length : 0);
    return {
      alerts: Array.isArray(data) ? data : [],
      total,
    };
  },

  async getUnresolvedAlertsCount(): Promise<AlertUnresolvedCount> {
    const res = await apiClient.get('/alerts/unresolved-count');
    return res.data.data;
  },

  async acknowledgeAlert(
    id: number,
    actionTaken: string = 'Telemetry verified. Monitoring vitals trend.'
  ): Promise<{ alert: Alert }> {
    const res = await apiClient.post(`/alerts/${id}/acknowledge`, {
      action_taken: actionTaken,
    });
    return res.data.data;
  },

  async escalateAlert(
    id: number,
    payload: {
      escalated_to_role: 'flight_surgeon' | 'mission_director' | 'medical_officer';
      reason: string;
    }
  ): Promise<{ alert: Alert }> {
    const res = await apiClient.post(`/alerts/${id}/escalate`, payload);
    return res.data.data;
  },

  async resolveAlert(
    id: number,
    resolutionNotes: string = 'Vitals stabilized back to nominal parameters.'
  ): Promise<Alert> {
    const res = await apiClient.post(`/alerts/${id}/resolve`, {
      resolution_notes: resolutionNotes,
    });
    return res.data.data;
  },

  async dismissAlert(
    id: number,
    reason: string = 'Artifact in bio-sensor telemetry.'
  ): Promise<Alert> {
    const res = await apiClient.post(`/alerts/${id}/dismiss`, {
      reason,
    });
    return res.data.data;
  },

  // ================= Missions =================
  async getMissions(): Promise<Mission[]> {
    const res = await apiClient.get('/missions');
    return res.data.data;
  },

  // ================= Cryptographic Audit Ledger =================
  async getAuditLogs(params?: {
    event_type?: string;
    user_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const res = await apiClient.get('/audit-logs', { params });
    const data = res.data.data;
    const total = res.data.meta?.total ?? (Array.isArray(data) ? data.length : 0);
    return {
      logs: Array.isArray(data) ? data : [],
      total,
    };
  },

  async verifyAuditChain(): Promise<AuditVerificationResult> {
    const res = await apiClient.get('/audit-logs/verify');
    return res.data.data;
  },
};
