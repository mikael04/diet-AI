import { getDatabase } from '../db';
import { FoodItem, MealType } from '../../types';
import { normalizeSearchText } from '../../utils/nutrition';

export class FoodRepository {
  /**
   * Busca alimentos por termo (nome ou sinônimos), suportando múltiplos tokens e insensibilidade a acentos
   */
  static async searchFoods(query: string, limit: number = 30): Promise<FoodItem[]> {
    const rawQuery = query.trim();
    if (!rawQuery) {
      return this.getAllFoods(limit);
    }

    const db = await getDatabase();
    const normQuery = normalizeSearchText(rawQuery);
    const words = normQuery.split(/\s+/).filter(w => w.length > 0);

    let rows: FoodItem[] = [];

    if (words.length > 1) {
      // Cláusula para tokens individuais combinados
      const conditions = words.map(() => '(LOWER(name) LIKE ? OR LOWER(synonyms) LIKE ?)').join(' AND ');
      const wordParams: string[] = [];
      for (const w of words) {
        wordParams.push(`%${w}%`, `%${w}%`);
      }

      // Tenta correspondência da frase inteira OU onde todos os termos estejam presentes
      rows = await db.getAllAsync<FoodItem>(
        `SELECT * FROM food_items 
         WHERE LOWER(name) LIKE ? OR LOWER(synonyms) LIKE ?
            OR (${conditions})
         LIMIT ?`,
        [`%${rawQuery.toLowerCase()}%`, `%${normQuery}%`, ...wordParams, limit * 2]
      );
    } else {
      const targetParam = `%${words[0] || normQuery}%`;
      rows = await db.getAllAsync<FoodItem>(
        `SELECT * FROM food_items 
         WHERE LOWER(name) LIKE ? OR LOWER(synonyms) LIKE ?
         LIMIT ?`,
        [targetParam, targetParam, limit * 2]
      );
    }

    // Ordenação e refinamento de relevância
    const sorted = rows.map(r => ({ ...r, is_custom: Boolean(r.is_custom) })).sort((a, b) => {
      const aNorm = normalizeSearchText(a.name);
      const bNorm = normalizeSearchText(b.name);

      // 1. Termo exato no nome
      if (aNorm === normQuery && bNorm !== normQuery) return -1;
      if (bNorm === normQuery && aNorm !== normQuery) return 1;

      // 2. Nome começa com termo pesquisado
      if (aNorm.startsWith(normQuery) && !bNorm.startsWith(normQuery)) return -1;
      if (bNorm.startsWith(normQuery) && !aNorm.startsWith(normQuery)) return 1;

      // 3. Alimentos customizados pelo usuário têm prioridade
      if (a.is_custom && !b.is_custom) return -1;
      if (!a.is_custom && b.is_custom) return 1;

      return a.name.localeCompare(b.name);
    });

    return sorted.slice(0, limit);
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
   * Encontra a melhor correspondência para uma consulta de voz/IA com suporte a múltiplos termos
   */
  static async findBestMatch(term: string): Promise<FoodItem | null> {
    const rawTerm = term.trim();
    if (!rawTerm) return null;

    const db = await getDatabase();
    const normTerm = normalizeSearchText(rawTerm);
    const words = normTerm.split(/\s+/).filter(w => w.length > 1);

    // 1. Match exato no nome ou sinônimos (com e sem acento)
    let match = await db.getFirstAsync<FoodItem>(
      `SELECT * FROM food_items 
       WHERE LOWER(name) = ? OR LOWER(name) = ? OR LOWER(synonyms) LIKE ? OR LOWER(synonyms) LIKE ?
       LIMIT 1`,
      [rawTerm.toLowerCase(), normTerm, `%${rawTerm.toLowerCase()}%`, `%${normTerm}%`]
    );

    if (match) {
      return { ...match, is_custom: Boolean(match.is_custom) };
    }

    // 2. Match onde todos os termos significativos estão presentes
    if (words.length > 1) {
      const conditions = words.map(() => '(LOWER(name) LIKE ? OR LOWER(synonyms) LIKE ?)').join(' AND ');
      const wordParams: string[] = [];
      for (const w of words) {
        wordParams.push(`%${w}%`, `%${w}%`);
      }

      match = await db.getFirstAsync<FoodItem>(
        `SELECT * FROM food_items WHERE ${conditions} LIMIT 1`,
        wordParams
      );

      if (match) {
        return { ...match, is_custom: Boolean(match.is_custom) };
      }
    }

    // 3. Match parcial por palavras-chave relevantes (descartando preposições)
    const stopWords = ['com', 'sem', 'para', 'tipo', 'pelo', 'pela', 'uma', 'uns'];
    const significantWords = words.filter(w => !stopWords.includes(w));
    const targetWord = significantWords[0] || words[0];
    if (targetWord) {
      const firstWord = `%${targetWord}%`;
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
   * Retorna os alimentos mais recentes consumidos para uma refeição específica ou geral,
   * incluindo a última quantidade e unidade utilizadas (last_quantity e last_unit).
   */
  static async getRecentFoodsByMeal(mealType?: MealType | 'ALL', limit: number = 20): Promise<FoodItem[]> {
    const db = await getDatabase();
    let rows: FoodItem[] = [];

    if (mealType && mealType !== 'ALL') {
      rows = await db.getAllAsync<FoodItem>(
        `SELECT fi.*,
                li_latest.id as last_logged_id,
                li_latest.quantity_value as last_quantity,
                li_latest.quantity_unit as last_unit
         FROM food_items fi
         JOIN (
           SELECT li.food_id, MAX(li.id) as max_id
           FROM logged_items li
           JOIN meal_entries me ON li.meal_entry_id = me.id
           WHERE me.meal_type = ?
           GROUP BY li.food_id
         ) latest ON latest.food_id = fi.id
         JOIN logged_items li_latest ON li_latest.id = latest.max_id
         ORDER BY last_logged_id DESC
         LIMIT ?`,
        [mealType, limit]
      );
    } else {
      rows = await db.getAllAsync<FoodItem>(
        `SELECT fi.*,
                li_latest.id as last_logged_id,
                li_latest.quantity_value as last_quantity,
                li_latest.quantity_unit as last_unit
         FROM food_items fi
         JOIN (
           SELECT food_id, MAX(id) as max_id
           FROM logged_items
           GROUP BY food_id
         ) latest ON latest.food_id = fi.id
         JOIN logged_items li_latest ON li_latest.id = latest.max_id
         ORDER BY last_logged_id DESC
         LIMIT ?`,
        [limit]
      );
    }

    return rows.map(r => ({ ...r, is_custom: Boolean(r.is_custom) }));
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

