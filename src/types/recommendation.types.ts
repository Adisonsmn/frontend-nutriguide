import type { Food } from './food.types';

export interface RecommendationMeals {
  breakfast: Food[];
  lunch: Food[];
  dinner: Food[];
  snack: Food[];
}

export interface RecommendationData {
  recommendation_id: string | null;
  total_calories: number;
  target_calories: number;
  meals: RecommendationMeals;
  message?: string;
}
