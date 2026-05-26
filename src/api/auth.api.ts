import api from './axiosInstance';
import type { ApiResponse } from '../types/api.types';
import type { User } from '../types/auth.types';

export const registerUser = async (name: string, email: string, password: string) => {
  const response = await api.post<ApiResponse<User>>('/auth/register', { name, email, password });
  return response.data;
};

// Bug #8: Response no longer includes refreshToken (it's set as an HTTP-only cookie)
export const loginUser = async (email: string, password: string) => {
  const response = await api.post<ApiResponse<{
    accessToken: string;
    user: User;
  }>>('/auth/login', { email, password });
  return response.data;
};

// Bug #29: Response type no longer expects `otp` field
export const forgotPassword = async (email: string) => {
  const response = await api.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (email: string, otp: string, newPassword: string) => {
  const response = await api.post<ApiResponse<{ message: string }>>('/auth/reset-password', { email, otp, newPassword });
  return response.data;
};

