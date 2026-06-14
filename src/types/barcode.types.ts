export type ScanStatus =
  | 'ok'
  | 'product_not_found'
  | 'no_objective'
  | 'invalid_barcode'
  | 'not_evaluable'
  | 'error';

export type ScanNutrient = 'carbs' | 'fat' | 'sugar' | 'protein';

export interface ScanCheck {
  nutrient: ScanNutrient;
  label: string; // 'Carboidrati' | 'Grassi' | 'Zuccheri' | 'Proteine'
  basis: 'per_100g' | 'per_serving';
  comparator: 'max' | 'min';
  threshold: number;
  value: number | null; // valore del prodotto (eventualmente derivato da 100g + peso porzione)
  value_derived: boolean; // true se stimato (derivato), da segnalare in UI
  passed: boolean | null; // null = dato mancante, controllo non valutabile
}

export interface ScanProduct {
  name: string | null;
  brand: string | null;
  image_url: string | null;
  quantity: string | null;
  serving_size: string | null;
  serving_quantity_g: number | null;
}

export interface ScanNutrients {
  carbs: number | null;
  fat: number | null;
  sugar: number | null;
  protein: number | null;
}

export interface ScanNutritionalValues {
  per_100g: ScanNutrients;
  per_serving: ScanNutrients & {
    derived: boolean | null;
    serving_size: string | null;
  };
}

export interface ScanResponse {
  status: ScanStatus;
  is_allowed: boolean | null; // null quando non c'è verdetto (not_evaluable e stati non-ok)
  scan_mode?: 'barcode' | 'ocr'; // sorgente: barcode (OpenFoodFacts) o ocr (foto)
  barcode?: string;
  product_name?: string | null; // top-level (retrocompatibilità)
  user_objective?: string; // es. 'dimagrimento'
  product?: ScanProduct;
  nutritional_values?: ScanNutritionalValues;
  checks?: ScanCheck[];
  reasons?: string[]; // frasi italiane pronte dalla edge function
  error?: string; // presente per no_objective / invalid_barcode / error
}
