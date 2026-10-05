export type MealType = 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'DINNER' | 'SUPPER';

export const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Café da Manhã',
  LUNCH: 'Almoço',
  SNACK: 'Lanche da Tarde',
  DINNER: 'Jantar',
  SUPPER: 'Ceia / Lanche Extra',
};

export interface FoodItem {
  id: number;
  name: string;
  category?: string;
  default_unit: string;
  grams_per_unit: number;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  is_custom: boolean | number;
  synonyms?: string;
}

export interface LoggedItem {
  id: number;
  meal_entry_id: number;
  food_id: number;
  food_name: string;
  quantity_value: number;
  quantity_unit: string;
  calculated_kcal: number;
  calculated_protein: number;
  calculated_carbs: number;
  calculated_fat: number;
  calculated_fiber: number;
}

export interface MealEntry {
  id: number;
  daily_log_id: number;
  meal_type: MealType;
  notes?: string;
  items: LoggedItem[];
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
}

export interface DailyLog {
  id: number;
  date: string; // YYYY-MM-DD
  water_ml: number;
  notes?: string;
  meals: Record<MealType, MealEntry>;
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
}

export interface RecipeItem {
  id?: number;
  recipe_id?: number;
  food_id: number;
  food_name: string;
  quantity_value: number;
  quantity_unit: string;
  calculated_kcal: number;
  calculated_protein: number;
  calculated_carbs: number;
  calculated_fat: number;
  calculated_fiber: number;
}

export interface Recipe {
  id: number;
  name: string;
  description?: string;
  items: RecipeItem[];
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  created_at?: string;
}

export interface NutritionTargets {
  daily_kcal: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  daily_fiber: number;
}

export interface ParsedItemQuery {
  food_name_query: string;
  quantity: number;
  unit: string;
}

export interface ParsedMealCommand {
  action: 'ADD_ITEMS' | 'COPY_MEAL' | 'COPY_DAY' | 'CREATE_RECIPE';
  meal: MealType | 'UNSPECIFIED';
  target_date: 'TODAY' | 'YESTERDAY' | string;
  items: ParsedItemQuery[];
  copy_source?: {
    from_date: 'YESTERDAY' | string;
    from_meal?: MealType;
  } | null;
  recipe_name?: string | null;
}

export interface ResolvedActionItem {
  food: FoodItem;
  quantity: number;
  unit: string;
  calculated_kcal: number;
  calculated_protein: number;
  calculated_carbs: number;
  calculated_fat: number;
  calculated_fiber: number;
}

export interface ResolvedMealAction {
  action: 'ADD_ITEMS' | 'COPY_MEAL' | 'COPY_DAY' | 'CREATE_RECIPE';
  target_meal: MealType;
  target_date: string; // YYYY-MM-DD
  resolved_items: ResolvedActionItem[];
  copy_source?: {
    from_date: string;
    from_meal?: MealType;
  } | null;
  recipe_name?: string | null;
  original_transcript: string;
}
