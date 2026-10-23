import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';
import tacoFoods from '../../assets/data/taco_database.json';
import { DEFAULT_BRAZILIAN_RECIPES } from './defaultRecipes';
import { calculateMacros } from '../utils/nutrition';
import { FoodItem } from '../types';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync('diet_ai.db');
    await db.execAsync(CREATE_TABLES_SQL);
    try {
      await db.execAsync('ALTER TABLE daily_logs ADD COLUMN weight_kg REAL;');
    } catch {
      // Coluna já existe
    }

    await seedOrUpdateFoodDatabase(db);
    await seedDefaultRecipesIfEmpty(db);

    dbInstance = db;
    return db;
  })();

  return initPromise;
}

/**
 * Insere novos alimentos e sincroniza sinônimos expandidos de alimentos existentes
 */
async function seedOrUpdateFoodDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    const existing = await db.getAllAsync<{ id: number; name: string }>(
      'SELECT id, name FROM food_items'
    );
    const existingMap = new Map<string, number>();
    for (const row of existing) {
      existingMap.set(row.name.trim().toLowerCase(), row.id);
    }

    console.log(`[Diet-AI DB] Sincronizando banco de alimentos (existentes: ${existing.length}, base: ${tacoFoods.length})...`);

    await db.withTransactionAsync(async () => {
      for (const item of tacoFoods) {
        const key = item.name.trim().toLowerCase();
        const existingId = existingMap.get(key);

        if (existingId !== undefined) {
          // Atualiza dados e sinônimos expandidos mantendo o ID
          await db.runAsync(
            `UPDATE food_items SET
              category = ?, default_unit = ?, grams_per_unit = ?,
              kcal_per_100g = ?, protein_per_100g = ?, carbs_per_100g = ?,
              fat_per_100g = ?, fiber_per_100g = ?, synonyms = ?
             WHERE id = ?`,
            [
              item.category || 'Geral',
              item.default_unit,
              item.grams_per_unit,
              item.kcal_per_100g,
              item.protein_per_100g,
              item.carbs_per_100g,
              item.fat_per_100g,
              item.fiber_per_100g,
              item.synonyms || '',
              existingId,
            ]
          );
        } else {
          // Insere novo alimento
          await db.runAsync(
            `INSERT INTO food_items (
              name, category, default_unit, grams_per_unit,
              kcal_per_100g, protein_per_100g, carbs_per_100g,
              fat_per_100g, fiber_per_100g, is_custom, synonyms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              item.name,
              item.category || 'Geral',
              item.default_unit,
              item.grams_per_unit,
              item.kcal_per_100g,
              item.protein_per_100g,
              item.carbs_per_100g,
              item.fat_per_100g,
              item.fiber_per_100g,
              0,
              item.synonyms || '',
            ]
          );
        }
      }
    });

    console.log(`[Diet-AI DB] ${tacoFoods.length} alimentos sincronizados com sucesso!`);
  } catch (error) {
    console.error('[Diet-AI DB] Erro ao sincronizar banco com TACO:', error);
  }
}

/**
 * Popula receitas brasileiras predefinidas se a tabela de receitas estiver vazia
 */
async function seedDefaultRecipesIfEmpty(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT count(*) as count FROM recipes'
    );

    if (result && result.count > 0) {
      return; // Já existem receitas
    }

    console.log('[Diet-AI DB] Populando receitas brasileiras predefinidas...');

    for (const recipe of DEFAULT_BRAZILIAN_RECIPES) {
      const insertRecipeResult = await db.runAsync(
        'INSERT INTO recipes (name, description) VALUES (?, ?)',
        [recipe.name, recipe.description]
      );
      const recipeId = Number(insertRecipeResult.lastInsertRowId);

      for (const item of recipe.items) {
        const food = await db.getFirstAsync<FoodItem>(
          'SELECT * FROM food_items WHERE LOWER(name) = ? LIMIT 1',
          [item.foodName.toLowerCase()]
        );

        if (!food) {
          console.warn(`[Diet-AI DB] Ingrediente '${item.foodName}' não encontrado para a receita '${recipe.name}'.`);
          continue;
        }

        const macros = calculateMacros(food, item.quantity, item.unit);

        await db.runAsync(
          `INSERT INTO recipe_items (
            recipe_id, food_id, food_name, quantity_value, quantity_unit,
            calculated_kcal, calculated_protein, calculated_carbs, calculated_fat, calculated_fiber
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            recipeId,
            food.id,
            food.name,
            item.quantity,
            item.unit,
            macros.calculated_kcal,
            macros.calculated_protein,
            macros.calculated_carbs,
            macros.calculated_fat,
            macros.calculated_fiber,
          ]
        );
      }
    }

    console.log(`[Diet-AI DB] ${DEFAULT_BRAZILIAN_RECIPES.length} receitas brasileiras predefinidas inseridas!`);
  } catch (error) {
    console.error('[Diet-AI DB] Erro ao popular receitas predefinidas:', error);
  }
}
