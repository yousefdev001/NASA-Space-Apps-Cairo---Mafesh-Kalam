import apiClient from './client';
import {
  Report,
  CreateReportPayload,
  ForensicTimelineResponse,
} from '../types/report.types';

export interface ReportQueryParams {
  report_type?: string;
  status?: string;
  astronaut_id?: number;
  page?: number;
  per_page?: number;
}

export interface PaginatedReportsResponse {
  data: Report[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const reportApi = {
  /**
   * Fetch paginated list of clinical and operational reports
   */
  async getReports(params?: ReportQueryParams): Promise<PaginatedReportsResponse> {
    const res = await apiClient.get('/reports', { params });
    return {
      data: res.data.data,
      meta: res.data.meta,
    };
  },

  /**
   * Fetch complete report details including full forensic event correlation timeline
   */
  async getReport(id: number): Promise<Report> {
    const res = await apiClient.get(`/reports/${id}`);
    return res.data.data;
  },

  /**
   * Fetch isolated forensic timeline dataset for interactive modal/charting
   */
  async getForensicTimeline(id: number): Promise<ForensicTimelineResponse> {
    const res = await apiClient.get(`/reports/${id}/forensic`);
    return res.data.data;
  },

  /**
   * Create a new formal report (RPT-01 to RPT-09)
   */
  async createReport(payload: CreateReportPayload): Promise<Report> {
    const res = await apiClient.post('/reports', payload);
    return res.data.data;
  },

  /**
   * Approve and finalize a report (Surgeon or Mission Director)
   */
  async approveReport(id: number): Promise<Report> {
    const res = await apiClient.post(`/reports/${id}/approve`);
    return res.data.data;
  },

  /**
   * Download DomPDF report as real file
   */
  async downloadPdf(id: number, reportCode: string): Promise<void> {
    const response = await apiClient.get(`/reports/${id}/export/pdf`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AuraMed_${reportCode}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Download forensic timeline events as real CSV file
   */
  async downloadCsv(id: number, reportCode: string): Promise<void> {
    const response = await apiClient.get(`/reports/${id}/export/csv`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AuraMed_${reportCode}_events.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
