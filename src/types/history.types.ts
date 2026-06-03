import type { Food } from './food.types';

export interface FoodHistory {
  history_id: string;
  user_id: string;
  food_id: string;
  consumed_at: string;
  qty_gram: number;
  is_consumed: boolean;
  food?: Food;
}
