import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';
import tacoFoods from '../../assets/data/taco_database.json';

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
    await seedTacoDatabaseIfEmpty(db);
    dbInstance = db;
    return db;
  })();

  return initPromise;
}

async function seedTacoDatabaseIfEmpty(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT count(*) as count FROM food_items'
    );

    if (result && result.count > 0) {
      return; // Já populado
    }

    console.log('[Diet-AI DB] Populando banco inicial com a Tabela TACO...');

    await db.withTransactionAsync(async () => {
      for (const item of tacoFoods) {
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
    });

    console.log(`[Diet-AI DB] ${tacoFoods.length} alimentos da TACO inseridos com sucesso!`);
  } catch (error) {
    console.error('[Diet-AI DB] Erro ao popular banco com TACO:', error);
  }
}
