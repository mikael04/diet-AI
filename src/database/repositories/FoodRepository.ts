import { getDatabase } from '../db';
import { FoodItem } from '../../types';

export class FoodRepository {
  /**
   * Busca alimentos por termo (nome ou sinônimos)
   */
  static async searchFoods(query: string, limit: number = 30): Promise<FoodItem[]> {
    const db = await getDatabase();
    const cleanQuery = `%${query.trim().toLowerCase()}%`;

    const rows = await db.getAllAsync<FoodItem>(
      `SELECT * FROM food_items 
       WHERE LOWER(name) LIKE ? OR LOWER(synonyms) LIKE ?
       ORDER BY 
         CASE 
           WHEN LOWER(name) = LOWER(?) THEN 1
           WHEN LOWER(name) LIKE ? THEN 2
           ELSE 3
         END, name ASC
       LIMIT ?`,
      [cleanQuery, cleanQuery, query.trim(), `${query.trim().toLowerCase()}%`, limit]
    );

    return rows.map(r => ({ ...r, is_custom: Boolean(r.is_custom) }));
  }

  /**
   * Busca alimento por ID
   */
  static async getFoodById(id: number): Promise<FoodItem | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<FoodItem>(
      'SELECT * FROM food_items WHERE id = ?',
      [id]
    );
    return row ? { ...row, is_custom: Boolean(row.is_custom) } : null;
  }

  /**
   * Encontra a melhor correspondência para uma consulta de voz/IA
   */
  static async findBestMatch(term: string): Promise<FoodItem | null> {
    const cleanTerm = term.trim().toLowerCase();
    if (!cleanTerm) return null;

    const db = await getDatabase();

    // 1. Match exato no nome ou sinônimos
    let match = await db.getFirstAsync<FoodItem>(
      `SELECT * FROM food_items 
       WHERE LOWER(name) = ? OR LOWER(synonyms) LIKE ? 
       LIMIT 1`,
      [cleanTerm, `%${cleanTerm}%`]
    );

    if (match) {
      return { ...match, is_custom: Boolean(match.is_custom) };
    }

    // 2. Match parcial por palavras-chave
    const words = cleanTerm.split(/\s+/).filter(w => w.length > 2);
    if (words.length > 0) {
      const firstWord = `%${words[0]}%`;
      match = await db.getFirstAsync<FoodItem>(
        `SELECT * FROM food_items 
         WHERE LOWER(name) LIKE ? OR LOWER(synonyms) LIKE ?
         LIMIT 1`,
        [firstWord, firstWord]
      );
    }

    return match ? { ...match, is_custom: Boolean(match.is_custom) } : null;
  }

  /**
   * Cria novo alimento customizado pelo usuário
   */
  static async createCustomFood(
    item: Omit<FoodItem, 'id' | 'is_custom'>
  ): Promise<FoodItem> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO food_items (
        name, category, default_unit, grams_per_unit,
        kcal_per_100g, protein_per_100g, carbs_per_100g,
        fat_per_100g, fiber_per_100g, is_custom, synonyms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        item.name.trim(),
        item.category || 'Personalizados',
        item.default_unit || 'g',
        item.grams_per_unit || 1,
        item.kcal_per_100g || 0,
        item.protein_per_100g || 0,
        item.carbs_per_100g || 0,
        item.fat_per_100g || 0,
        item.fiber_per_100g || 0,
        item.synonyms || item.name.toLowerCase(),
      ]
    );

    return {
      ...item,
      id: Number(result.lastInsertRowId),
      is_custom: true,
    };
  }

  /**
   * Retorna os alimentos mais recentes ou gerais
   */
  static async getAllFoods(limit: number = 50): Promise<FoodItem[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<FoodItem>(
      'SELECT * FROM food_items ORDER BY is_custom DESC, name ASC LIMIT ?',
      [limit]
    );
    return rows.map(r => ({ ...r, is_custom: Boolean(r.is_custom) }));
  }
}
