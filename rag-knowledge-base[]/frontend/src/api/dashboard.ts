import request from '../utils/request';

export interface DashboardStats {
  user_count: number;
  document_count: number;
  session_count: number;
  today_qa_count: number;
  total_qa_count: number;
}

export const dashboardApi = {
  getStats: () => request.get<any, { data: DashboardStats }>('/dashboard/stats'),
};
