import { getDatabase } from '../db';
import { DailyLog, MealEntry, LoggedItem, MealType, DayHistorySummary } from '../../types';
import { calculateMacros } from '../../utils/nutrition';
import { FoodRepository } from './FoodRepository';

const ALL_MEALS: MealType[] = ['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER', 'SUPPER'];

export class DailyLogRepository {
  /**
   * Obtém o log diário completo para uma data (ou cria a estrutura caso não exista).
   */
  static async getOrCreateDailyLog(date: string): Promise<DailyLog> {
    const db = await getDatabase();

    // 1. Busca ou cria o registro diário
    let logRow = await db.getFirstAsync<{
      id: number;
      date: string;
      water_ml: number;
      weight_kg: number | null;
      notes: string | null;
    }>(
      'SELECT * FROM daily_logs WHERE date = ?',
      [date]
    );

    if (!logRow) {
      const insertResult = await db.runAsync(
        'INSERT INTO daily_logs (date, water_ml) VALUES (?, 0)',
        [date]
      );
      logRow = {
        id: Number(insertResult.lastInsertRowId),
        date,
        water_ml: 0,
        weight_kg: null,
        notes: null,
      };
    }

    // 2. Garante que todas as 5 refeições existem para este dia
    for (const mealType of ALL_MEALS) {
      await db.runAsync(
        'INSERT OR IGNORE INTO meal_entries (daily_log_id, meal_type) VALUES (?, ?)',
        [logRow.id, mealType]
      );
    }

    // 3. Carrega todas as refeições do dia
    const mealRows = await db.getAllAsync<{ id: number; daily_log_id: number; meal_type: MealType; notes: string | null }>(
      'SELECT * FROM meal_entries WHERE daily_log_id = ?',
      [logRow.id]
    );

    // 4. Carrega todos os itens de todas as refeições
    const itemsRows = await db.getAllAsync<LoggedItem>(
      `SELECT li.* FROM logged_items li
       INNER JOIN meal_entries me ON li.meal_entry_id = me.id
       WHERE me.daily_log_id = ?
       ORDER BY li.id ASC`,
      [logRow.id]
    );

    const mealsMap: Record<MealType, MealEntry> = {
      BREAKFAST: { id: 0, daily_log_id: logRow.id, meal_type: 'BREAKFAST', items: [], total_kcal: 0, total_protein: 0, total_carbs: 0, total_fat: 0, total_fiber: 0 },
      LUNCH: { id: 0, daily_log_id: logRow.id, meal_type: 'LUNCH', items: [], total_kcal: 0, total_protein: 0, total_carbs: 0, total_fat: 0, total_fiber: 0 },
      SNACK: { id: 0, daily_log_id: logRow.id, meal_type: 'SNACK', items: [], total_kcal: 0, total_protein: 0, total_carbs: 0, total_fat: 0, total_fiber: 0 },
      DINNER: { id: 0, daily_log_id: logRow.id, meal_type: 'DINNER', items: [], total_kcal: 0, total_protein: 0, total_carbs: 0, total_fat: 0, total_fiber: 0 },
      SUPPER: { id: 0, daily_log_id: logRow.id, meal_type: 'SUPPER', items: [], total_kcal: 0, total_protein: 0, total_carbs: 0, total_fat: 0, total_fiber: 0 },
    };

    for (const m of mealRows) {
      mealsMap[m.meal_type] = {
        id: m.id,
        daily_log_id: m.daily_log_id,
        meal_type: m.meal_type,
        notes: m.notes || undefined,
        items: [],
        total_kcal: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
        total_fiber: 0,
      };
    }

    let dayKcal = 0;
    let dayProtein = 0;
    let dayCarbs = 0;
    let dayFat = 0;
    let dayFiber = 0;

    for (const item of itemsRows) {
      const meal = Object.values(mealsMap).find(m => m.id === item.meal_entry_id);
      if (meal) {
        meal.items.push(item);
        meal.total_kcal = Math.round((meal.total_kcal + item.calculated_kcal) * 10) / 10;
        meal.total_protein = Math.round((meal.total_protein + item.calculated_protein) * 10) / 10;
        meal.total_carbs = Math.round((meal.total_carbs + item.calculated_carbs) * 10) / 10;
        meal.total_fat = Math.round((meal.total_fat + item.calculated_fat) * 10) / 10;
        meal.total_fiber = Math.round((meal.total_fiber + item.calculated_fiber) * 10) / 10;

        dayKcal += item.calculated_kcal;
        dayProtein += item.calculated_protein;
        dayCarbs += item.calculated_carbs;
        dayFat += item.calculated_fat;
        dayFiber += item.calculated_fiber;
      }
    }

    return {
      id: logRow.id,
      date: logRow.date,
      water_ml: logRow.water_ml || 0,
      weight_kg: logRow.weight_kg !== null && logRow.weight_kg !== undefined ? logRow.weight_kg : null,
      notes: logRow.notes || undefined,
      meals: mealsMap,
      total_kcal: Math.round(dayKcal * 10) / 10,
      total_protein: Math.round(dayProtein * 10) / 10,
      total_carbs: Math.round(dayCarbs * 10) / 10,
      total_fat: Math.round(dayFat * 10) / 10,
      total_fiber: Math.round(dayFiber * 10) / 10,
    };
  }

  /**
   * Adiciona um alimento a uma refeição por tipo e data
   */
  static async addFoodToMeal(
    date: string,
    mealType: MealType,
    foodId: number,
    quantity: number,
    unit: string
  ): Promise<LoggedItem> {
    const food = await FoodRepository.getFoodById(foodId);
    if (!food) {
      throw new Error(`Alimento com ID ${foodId} não encontrado.`);
    }

    const log = await this.getOrCreateDailyLog(date);
    const meal = log.meals[mealType];
    const macros = calculateMacros(food, quantity, unit);

    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO logged_items (
        meal_entry_id, food_id, food_name, quantity_value, quantity_unit,
        calculated_kcal, calculated_protein, calculated_carbs, calculated_fat, calculated_fiber
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        meal.id,
        food.id,
        food.name,
        quantity,
        unit,
        macros.calculated_kcal,
        macros.calculated_protein,
        macros.calculated_carbs,
        macros.calculated_fat,
        macros.calculated_fiber,
      ]
    );

    return {
      id: Number(result.lastInsertRowId),
      meal_entry_id: meal.id,
      food_id: food.id,
      food_name: food.name,
      quantity_value: quantity,
      quantity_unit: unit,
      ...macros,
    };
  }

  /**
   * Atualiza um item já registrado (quantidade, unidade e/ou alimento)
   */
  static async updateLoggedItem(
    itemId: number,
    quantity: number,
    unit: string,
    foodId?: number
  ): Promise<LoggedItem> {
    const db = await getDatabase();
    const currentItem = await db.getFirstAsync<LoggedItem>(
      'SELECT * FROM logged_items WHERE id = ?',
      [itemId]
    );

    if (!currentItem) {
      throw new Error(`Item ${itemId} não encontrado.`);
    }

    const targetFoodId = foodId ?? currentItem.food_id;
    const food = await FoodRepository.getFoodById(targetFoodId);
    if (!food) {
      throw new Error(`Alimento com ID ${targetFoodId} não encontrado.`);
    }

    const macros = calculateMacros(food, quantity, unit);

    await db.runAsync(
      `UPDATE logged_items SET
        food_id = ?,
        food_name = ?,
        quantity_value = ?,
        quantity_unit = ?,
        calculated_kcal = ?,
        calculated_protein = ?,
        calculated_carbs = ?,
        calculated_fat = ?,
        calculated_fiber = ?
      WHERE id = ?`,
      [
        food.id,
        food.name,
        quantity,
        unit,
        macros.calculated_kcal,
        macros.calculated_protein,
        macros.calculated_carbs,
        macros.calculated_fat,
        macros.calculated_fiber,
        itemId,
      ]
    );

    return {
      ...currentItem,
      food_id: food.id,
      food_name: food.name,
      quantity_value: quantity,
      quantity_unit: unit,
      ...macros,
    };
  }

  /**
   * Remove um item consumido
   */
  static async removeLoggedItem(itemId: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM logged_items WHERE id = ?', [itemId]);
  }

  /**
   * Atualiza a ingestão de água do dia
   */
  static async updateWater(date: string, waterMl: number): Promise<void> {
    const log = await this.getOrCreateDailyLog(date);
    const db = await getDatabase();
    await db.runAsync('UPDATE daily_logs SET water_ml = ? WHERE id = ?', [waterMl, log.id]);
  }

  /**
   * Clona uma refeição de um dia para outro
   */
  static async copyMeal(
    fromDate: string,
    fromMeal: MealType,
    toDate: string,
    toMeal: MealType = fromMeal
  ): Promise<number> {
    const sourceLog = await this.getOrCreateDailyLog(fromDate);
    const targetLog = await this.getOrCreateDailyLog(toDate);

    const sourceItems = sourceLog.meals[fromMeal]?.items || [];
    if (sourceItems.length === 0) return 0;

    const targetMealEntryId = targetLog.meals[toMeal].id;
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      for (const item of sourceItems) {
        await db.runAsync(
          `INSERT INTO logged_items (
            meal_entry_id, food_id, food_name, quantity_value, quantity_unit,
            calculated_kcal, calculated_protein, calculated_carbs, calculated_fat, calculated_fiber
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            targetMealEntryId,
            item.food_id,
            item.food_name,
            item.quantity_value,
            item.quantity_unit,
            item.calculated_kcal,
            item.calculated_protein,
            item.calculated_carbs,
            item.calculated_fat,
            item.calculated_fiber,
          ]
        );
      }
    });

    return sourceItems.length;
  }

  /**
   * Clona todas as refeições de um dia para outro
   */
  static async copyEntireDay(fromDate: string, toDate: string): Promise<number> {
    let copiedCount = 0;
    for (const meal of ALL_MEALS) {
      copiedCount += await this.copyMeal(fromDate, meal, toDate, meal);
    }
    return copiedCount;
  }

  /**
   * Atualiza o peso corporal (em kg) para uma data específica
   */
  static async updateWeight(date: string, weightKg: number | null): Promise<void> {
    const db = await getDatabase();
    await this.getOrCreateDailyLog(date);
    const validWeight = weightKg !== null && weightKg !== undefined && !isNaN(weightKg) && weightKg > 0 ? weightKg : null;
    await db.runAsync(
      'UPDATE daily_logs SET weight_kg = ? WHERE date = ?',
      [validWeight, date]
    );
  }

  /**
   * Obtém resumos diários para os últimos N dias (7, 15, 30 dias)
   */
  static async getHistorySummaries(daysCount: 7 | 15 | 30 = 7): Promise<DayHistorySummary[]> {
    const db = await getDatabase();

    // Gera lista contínua de datas dos últimos N dias até hoje
    const dates: string[] = [];
    const today = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${day}`);
    }

    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    // Busca registros da tabela daily_logs no intervalo
    const logs = await db.getAllAsync<{
      id: number;
      date: string;
      water_ml: number;
      weight_kg: number | null;
    }>(
      'SELECT id, date, water_ml, weight_kg FROM daily_logs WHERE date >= ? AND date <= ?',
      [startDate, endDate]
    );

    const logMap = new Map<string, { id: number; water_ml: number; weight_kg: number | null }>();
    for (const l of logs) {
      logMap.set(l.date, { id: l.id, water_ml: l.water_ml, weight_kg: l.weight_kg });
    }

    // Busca totais de macronutrientes calculados agrupados por data
    const totals = await db.getAllAsync<{
      date: string;
      total_kcal: number;
      total_protein: number;
      total_carbs: number;
      total_fat: number;
      total_fiber: number;
      items_count: number;
    }>(
      `SELECT dl.date,
              COALESCE(SUM(li.calculated_kcal), 0) as total_kcal,
              COALESCE(SUM(li.calculated_protein), 0) as total_protein,
              COALESCE(SUM(li.calculated_carbs), 0) as total_carbs,
              COALESCE(SUM(li.calculated_fat), 0) as total_fat,
              COALESCE(SUM(li.calculated_fiber), 0) as total_fiber,
              COUNT(li.id) as items_count
       FROM daily_logs dl
       LEFT JOIN meal_entries me ON dl.id = me.daily_log_id
       LEFT JOIN logged_items li ON me.id = li.meal_entry_id
       WHERE dl.date >= ? AND dl.date <= ?
       GROUP BY dl.date`,
      [startDate, endDate]
    );

    const totalsMap = new Map<string, {
      total_kcal: number;
      total_protein: number;
      total_carbs: number;
      total_fat: number;
      total_fiber: number;
      items_count: number;
    }>();

    for (const t of totals) {
      totalsMap.set(t.date, {
        total_kcal: Math.round(t.total_kcal * 10) / 10,
        total_protein: Math.round(t.total_protein * 10) / 10,
        total_carbs: Math.round(t.total_carbs * 10) / 10,
        total_fat: Math.round(t.total_fat * 10) / 10,
        total_fiber: Math.round(t.total_fiber * 10) / 10,
        items_count: t.items_count,
      });
    }

    // Retorna todos os dias de forma contínua
    return dates.map((date) => {
      const log = logMap.get(date);
      const tot = totalsMap.get(date);
      return {
        date,
        total_kcal: tot ? tot.total_kcal : 0,
        total_protein: tot ? tot.total_protein : 0,
        total_carbs: tot ? tot.total_carbs : 0,
        total_fat: tot ? tot.total_fat : 0,
        total_fiber: tot ? tot.total_fiber : 0,
        water_ml: log ? log.water_ml : 0,
        weight_kg: log && log.weight_kg !== null && log.weight_kg !== undefined ? log.weight_kg : null,
        items_count: tot ? tot.items_count : 0,
      };
    });
  }
}
