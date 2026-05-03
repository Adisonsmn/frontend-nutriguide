export interface Profile {
  profile_id: string;
  user_id: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  gender: string;
  goal: string;
  updated_at: string;
}

export interface Preference {
  pref_id: string;
  user_id: string;
  diet_type: string;
  daily_budget: number;
  currency: string;
  created_at: string;
}
