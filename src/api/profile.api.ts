import api from './axiosInstance';
import type { ApiResponse } from '../types/api.types';
import type { Profile, Preference } from '../types/profile.types';

// ─── Response types ───
export interface ProfileResponse {
  profile: (Profile & { user?: { name: string; email: string } }) | null;
  preferences: Preference | null;
}

export interface CreateProfilePayload {
  age: number;
  weight_kg: number;
  height_cm: number;
  gender: string;
  goal: string;
}

export interface UpdateProfilePayload {
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  gender?: string;
  goal?: string;
}

export interface UpsertPreferencesPayload {
  diet_type: string;
  daily_budget: number;
  currency?: string;
}

// ─── API calls ───
export const fetchProfileData = async () => {
  const response = await api.get<ApiResponse<ProfileResponse>>('/profile');
  return response.data;
};

export const createProfile = async (data: CreateProfilePayload) => {
  const response = await api.post<ApiResponse<Profile>>('/profile', data);
  return response.data;
};

export const updateProfile = async (data: UpdateProfilePayload) => {
  const response = await api.put<ApiResponse<Profile>>('/profile', data);
  return response.data;
};

export const upsertPreferences = async (data: UpsertPreferencesPayload) => {
  const response = await api.put<ApiResponse<Preference>>('/profile/preferences', data);
  return response.data;
};
