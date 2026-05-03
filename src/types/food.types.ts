export interface Food {
  food_id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  price_estimate: number;
  category: string;
  source: string;
  image_url?: string;
}
