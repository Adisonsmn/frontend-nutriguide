import api from './axiosInstance';
import type { ApiResponse } from '../types/api.types';
import type { Article } from '../types/article.types';

export const fetchAllArticles = async (category?: string) => {
  const params = category ? { category } : {};
  const response = await api.get<ApiResponse<Article[]>>('/articles', { params });
  return response.data;
};

export const fetchArticleById = async (articleId: string) => {
  const response = await api.get<ApiResponse<Article>>(`/articles/${articleId}`);
  return response.data;
};
