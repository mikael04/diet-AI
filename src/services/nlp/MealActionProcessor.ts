import {
  ParsedMealCommand,
  ResolvedMealAction,
  ResolvedActionItem,
  MealType,
  FoodItem,
} from '../../types';
import { FoodRepository } from '../../database/repositories/FoodRepository';
import { DailyLogRepository } from '../../database/repositories/DailyLogRepository';
import { RecipeRepository } from '../../database/repositories/RecipeRepository';
import { calculateMacros, formatDate, getYesterdayDate } from '../../utils/nutrition';

export class MealActionProcessor {
  /**
   * Converte a resposta estruturada do Gemini em uma ação concreta pronta para execução
   */
  static async resolveCommand(
    command: ParsedMealCommand,
    originalTranscript: string
  ): Promise<ResolvedMealAction> {
    // 1. Resolve a refeição de destino
    let targetMeal: MealType;
    if (command.meal && command.meal !== 'UNSPECIFIED') {
      targetMeal = command.meal;
    } else {
      targetMeal = this.inferMealFromCurrentTime();
    }

    // 2. Resolve a data de destino
    let targetDate = formatDate();
    if (command.target_date === 'YESTERDAY') {
      targetDate = getYesterdayDate();
    } else if (command.target_date && command.target_date !== 'TODAY' && /^\d{4}-\d{2}-\d{2}$/.test(command.target_date)) {
      targetDate = command.target_date;
    }

    // 3. Resolve os alimentos no banco SQLite da TACO
    const resolvedItems: ResolvedActionItem[] = [];

    for (const item of command.items || []) {
      let matchedFood = await FoodRepository.findBestMatch(item.food_name_query);

      // Fallback caso não encontre na TACO: cria alimento estimado temporário
      if (!matchedFood) {
        matchedFood = {
          id: -1,
          name: item.food_name_query,
          category: 'Estimado',
          default_unit: item.unit || 'g',
          grams_per_unit: 1,
          kcal_per_100g: 100,
          protein_per_100g: 5,
          carbs_per_100g: 10,
          fat_per_100g: 3,
          fiber_per_100g: 1,
          is_custom: true,
        };
      }

      const macros = calculateMacros(matchedFood, item.quantity, item.unit);

      resolvedItems.push({
        food: matchedFood,
        quantity: item.quantity,
        unit: item.unit,
        ...macros,
      });
    }

    // 4. Resolve source de cópia caso seja ação de clone
    let copySource = null;
    if (command.copy_source) {
      let fromDate = targetDate;
      if (command.copy_source.from_date === 'YESTERDAY') {
        fromDate = getYesterdayDate();
      } else if (command.copy_source.from_date && /^\d{4}-\d{2}-\d{2}$/.test(command.copy_source.from_date)) {
        fromDate = command.copy_source.from_date;
      }
      copySource = {
        from_date: fromDate,
        from_meal: command.copy_source.from_meal || targetMeal,
      };
    }

    return {
      action: command.action,
      target_meal: targetMeal,
      target_date: targetDate,
      resolved_items: resolvedItems,
      copy_source: copySource,
      recipe_name: command.recipe_name,
      original_transcript: originalTranscript,
    };
  }

  /**
   * Executa e persiste a ação aprovada pelo usuário
   */
  static async executeAction(action: ResolvedMealAction): Promise<void> {
    switch (action.action) {
      case 'ADD_ITEMS': {
        for (const item of action.resolved_items) {
          let foodId = item.food.id;
          // Se for alimento que ainda não estava no banco
          if (foodId <= 0) {
            const created = await FoodRepository.createCustomFood({
              name: item.food.name,
              category: 'Personalizados',
              default_unit: item.unit,
              grams_per_unit: item.food.grams_per_unit || 1,
              kcal_per_100g: item.food.kcal_per_100g,
              protein_per_100g: item.food.protein_per_100g,
              carbs_per_100g: item.food.carbs_per_100g,
              fat_per_100g: item.food.fat_per_100g,
              fiber_per_100g: item.food.fiber_per_100g,
            });
            foodId = created.id;
          }

          await DailyLogRepository.addFoodToMeal(
            action.target_date,
            action.target_meal,
            foodId,
            item.quantity,
            item.unit
          );
        }
        break;
      }

      case 'COPY_MEAL': {
        if (action.copy_source) {
          await DailyLogRepository.copyMeal(
            action.copy_source.from_date,
            action.copy_source.from_meal || action.target_meal,
            action.target_date,
            action.target_meal
          );
        }
        break;
      }

      case 'COPY_DAY': {
        const fromDate = action.copy_source?.from_date || getYesterdayDate();
        await DailyLogRepository.copyEntireDay(fromDate, action.target_date);
        break;
      }

      case 'CREATE_RECIPE': {
        const recipeName = action.recipe_name || `Receita de ${formatDate()}`;
        const rawItems = [];

        for (const item of action.resolved_items) {
          let foodId = item.food.id;
          if (foodId <= 0) {
            const created = await FoodRepository.createCustomFood(item.food);
            foodId = created.id;
          }
          rawItems.push({
            foodId,
            quantity: item.quantity,
            unit: item.unit,
          });
        }

        await RecipeRepository.createRecipe(recipeName, 'Criada por comando de voz', rawItems);
        break;
      }
    }
  }

  /**
   * Infere a refeição padrão de acordo com o horário atual
   */
  private static inferMealFromCurrentTime(): MealType {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'BREAKFAST';
    if (hour >= 11 && hour < 15) return 'LUNCH';
    if (hour >= 15 && hour < 18) return 'SNACK';
    if (hour >= 18 && hour < 22) return 'DINNER';
    return 'SUPPER';
  }
}
