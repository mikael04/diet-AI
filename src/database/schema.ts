export const CREATE_TABLES_SQL = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS food_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    default_unit TEXT NOT NULL,
    grams_per_unit REAL NOT NULL,
    kcal_per_100g REAL NOT NULL,
    protein_per_100g REAL NOT NULL,
    carbs_per_100g REAL NOT NULL,
    fat_per_100g REAL NOT NULL,
    fiber_per_100g REAL NOT NULL,
    is_custom INTEGER DEFAULT 0,
    synonyms TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,
    water_ml INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS meal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    daily_log_id INTEGER NOT NULL,
    meal_type TEXT NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (daily_log_id) REFERENCES daily_logs(id) ON DELETE CASCADE,
    UNIQUE(daily_log_id, meal_type)
  );

  CREATE TABLE IF NOT EXISTS logged_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_entry_id INTEGER NOT NULL,
    food_id INTEGER NOT NULL,
    food_name TEXT NOT NULL,
    quantity_value REAL NOT NULL,
    quantity_unit TEXT NOT NULL,
    calculated_kcal REAL NOT NULL,
    calculated_protein REAL NOT NULL,
    calculated_carbs REAL NOT NULL,
    calculated_fat REAL NOT NULL,
    calculated_fiber REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meal_entry_id) REFERENCES meal_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES food_items(id)
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recipe_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    food_id INTEGER NOT NULL,
    food_name TEXT NOT NULL,
    quantity_value REAL NOT NULL,
    quantity_unit TEXT NOT NULL,
    calculated_kcal REAL NOT NULL,
    calculated_protein REAL NOT NULL,
    calculated_carbs REAL NOT NULL,
    calculated_fat REAL NOT NULL,
    calculated_fiber REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES food_items(id)
  );

  CREATE INDEX IF NOT EXISTS idx_food_items_name ON food_items(name);
  CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
  CREATE INDEX IF NOT EXISTS idx_meal_entries_log ON meal_entries(daily_log_id);
  CREATE INDEX IF NOT EXISTS idx_logged_items_meal ON logged_items(meal_entry_id);
`;
