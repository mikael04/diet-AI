import { getDatabase } from '../db';
import { Recipe, RecipeItem, MealType } from '../../types';
import { FoodRepository } from './FoodRepository';
import { DailyLogRepository } from './DailyLogRepository';
import { calculateMacros } from '../../utils/nutrition';

export class RecipeRepository {
  /**
   * Salva uma nova receita composta por múltiplos ingredientes
   */
  static async createRecipe(
    name: string,
    description: string | undefined,
    rawItems: Array<{ foodId: number; quantity: number; unit: string }>
  ): Promise<Recipe> {
    const db = await getDatabase();

    const insertRecipeResult = await db.runAsync(
      'INSERT INTO recipes (name, description) VALUES (?, ?)',
      [name.trim(), description?.trim() || null]
    );

    const recipeId = Number(insertRecipeResult.lastInsertRowId);
    const resolvedItems: RecipeItem[] = [];

    let totalKcal = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    await db.withTransactionAsync(async () => {
      for (const item of rawItems) {
        const food = await FoodRepository.getFoodById(item.foodId);
        if (!food) continue;

        const macros = calculateMacros(food, item.quantity, item.unit);

        const insertItemResult = await db.runAsync(
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

        resolvedItems.push({
          id: Number(insertItemResult.lastInsertRowId),
          recipe_id: recipeId,
          food_id: food.id,
          food_name: food.name,
          quantity_value: item.quantity,
          quantity_unit: item.unit,
          ...macros,
        });

        totalKcal += macros.calculated_kcal;
        totalProtein += macros.calculated_protein;
        totalCarbs += macros.calculated_carbs;
        totalFat += macros.calculated_fat;
        totalFiber += macros.calculated_fiber;
      }
    });

    return {
      id: recipeId,
      name,
      description,
      items: resolvedItems,
      total_kcal: Math.round(totalKcal * 10) / 10,
      total_protein: Math.round(totalProtein * 10) / 10,
      total_carbs: Math.round(totalCarbs * 10) / 10,
      total_fat: Math.round(totalFat * 10) / 10,
      total_fiber: Math.round(totalFiber * 10) / 10,
    };
  }

  /**
   * Retorna todas as receitas salvas com seus itens agregados
   */
  static async getAllRecipes(): Promise<Recipe[]> {
    const db = await getDatabase();
    const recipeRows = await db.getAllAsync<{ id: number; name: string; description: string | null; created_at: string }>(
      'SELECT * FROM recipes ORDER BY name ASC'
    );

    const recipes: Recipe[] = [];

    for (const r of recipeRows) {
      const items = await db.getAllAsync<RecipeItem>(
        'SELECT * FROM recipe_items WHERE recipe_id = ? ORDER BY id ASC',
        [r.id]
      );

      let totalKcal = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let totalFiber = 0;

      for (const it of items) {
        totalKcal += it.calculated_kcal;
        totalProtein += it.calculated_protein;
        totalCarbs += it.calculated_carbs;
        totalFat += it.calculated_fat;
        totalFiber += it.calculated_fiber;
      }

      recipes.push({
        id: r.id,
        name: r.name,
        description: r.description || undefined,
        items,
        total_kcal: Math.round(totalKcal * 10) / 10,
        total_protein: Math.round(totalProtein * 10) / 10,
        total_carbs: Math.round(totalCarbs * 10) / 10,
        total_fat: Math.round(totalFat * 10) / 10,
        total_fiber: Math.round(totalFiber * 10) / 10,
        created_at: r.created_at,
      });
    }

    return recipes;
  }

  /**
   * Exclui uma receita
   */
  static async deleteRecipe(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM recipes WHERE id = ?', [id]);
  }

  /**
   * Adiciona todos os ingredientes de uma receita a uma refeição
   */
  static async addRecipeToMeal(
    recipeId: number,
    date: string,
    mealType: MealType
  ): Promise<void> {
    const db = await getDatabase();
    const items = await db.getAllAsync<RecipeItem>(
      'SELECT * FROM recipe_items WHERE recipe_id = ?',
      [recipeId]
    );

    for (const item of items) {
      await DailyLogRepository.addFoodToMeal(
        date,
        mealType,
        item.food_id,
        item.quantity_value,
        item.quantity_unit
      );
    }
  }
}
