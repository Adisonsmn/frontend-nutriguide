import api from './axiosInstance';
import type { ApiResponse } from '../types/api.types';
import type { Food } from '../types/food.types';

export const fetchFoodById = async (foodId: string) => {
  const response = await api.get<ApiResponse<Food>>(`/foods/${foodId}`);
  return response.data;
};

export const addToHistory = async (foodId: string, qtyGram: number) => {
  const response = await api.post<ApiResponse<null>>('/history', {
    food_id: foodId,
    qty_gram: qtyGram,
  });
  return response.data;
};
