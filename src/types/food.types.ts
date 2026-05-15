export interface Recipe {
  recipe_id: string;
  food_id: string;
  ingredients: string; // JSON array string — parse with JSON.parse()
  steps: string;       // JSON array string — parse with JSON.parse()
  prep_time_min: number;
}

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
  recipe?: Recipe | null;
}
