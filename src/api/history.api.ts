import api from './axiosInstance';
import type { ApiResponse } from '../types/api.types';
import type { FoodHistory } from '../types/history.types';

// Re-use DailySummary from dashboard.api
export interface DailySummary {
  date: string;
  totalCalories: number;
  targetCalories: number;
  remaining: number;
  percentage: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const fetchHistory = async (date?: string) => {
  const params = date ? { date } : {};
  const response = await api.get<ApiResponse<FoodHistory[]>>('/history', { params });
  return response.data;
};

export const fetchHistorySummary = async () => {
  const response = await api.get<ApiResponse<DailySummary>>('/history/summary');
  return response.data;
};

export const deleteHistoryEntry = async (historyId: string) => {
  const response = await api.delete<ApiResponse<null>>(`/history/${historyId}`);
  return response.data;
};
