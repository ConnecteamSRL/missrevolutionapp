export interface NutritionalValues {
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
}

export interface ScanResponse {
  product_name: string;
  user_objective: string;
  is_allowed: boolean;
  reasons: string[];
  nutritional_values: NutritionalValues;
}
