import api from './axiosInstance';
import type { ApiResponse } from '../types/api.types';
import type { RecommendationData } from '../types/recommendation.types';

export interface RecommendationParams {
  budget?: number;
  preference?: string;
}

export const fetchRecommendations = async (params?: RecommendationParams) => {
  const queryParams: Record<string, string> = {};
  if (params?.budget) queryParams.budget = String(params.budget);
  if (params?.preference) queryParams.preference = params.preference;

  const response = await api.get<ApiResponse<RecommendationData>>('/recommendations', {
    params: queryParams,
  });
  return response.data;
};
