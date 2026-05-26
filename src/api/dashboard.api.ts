import api from './axiosInstance';
import type { ApiResponse } from '../types/api.types';
import type { Food } from '../types/food.types';
import type { Article } from '../types/article.types';

// Interface untuk response nutrition/calculate
export interface NutritionTarget {
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Interface untuk response history/summary
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

// Interface untuk response profile
export interface ProfileData {
  profile: {
    profile_id: string;
    user_id: string;
    age: number;
    weight_kg: number;
    height_cm: number;
    gender: string;
    goal: string;
  } | null;
  preferences: {
    pref_id: string;
    diet_type: string;
    daily_budget: number;
    currency: string;
  } | null;
}

export const fetchNutritionTarget = async () => {
  const response = await api.get<ApiResponse<NutritionTarget>>('/nutrition/calculate');
  return response.data;
};

export const fetchDailySummary = async () => {
  // Bug #28: Send the client's timezone offset so the server computes "today" correctly
  const timezoneOffset = new Date().getTimezoneOffset() * -1; // e.g., 420 for WIB (UTC+7)
  const response = await api.get<ApiResponse<DailySummary>>('/history/summary', {
    params: { timezoneOffset },
  });
  return response.data;
};

export const fetchFoods = async (category?: string) => {
  const params = category ? { category } : {};
  const response = await api.get<ApiResponse<Food[]>>('/foods', { params });
  return response.data;
};

export const fetchArticles = async () => {
  const response = await api.get<ApiResponse<Article[]>>('/articles');
  return response.data;
};

export const fetchProfile = async () => {
  const response = await api.get<ApiResponse<ProfileData>>('/profile');
  return response.data;
};
