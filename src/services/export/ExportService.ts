import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from '../../database/db';
import { RecipeRepository } from '../../database/repositories/RecipeRepository';
import { SecureStorageService } from '../storage/SecureStorageService';
import { FoodItem, Recipe } from '../../types';

export interface ExportSummary {
  daysCount: number;
  mealsCount: number;
  itemsCount: number;
  recipesCount: number;
  customFoodsCount: number;
}

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: 'Café da Manhã',
  LUNCH: 'Almoço',
  SNACK: 'Lanche',
  DINNER: 'Jantar',
  SUPPER: 'Ceia',
};

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

export class ExportService {
  /**
   * Retorna um resumo da quantidade de registros que serão exportados
   */
  static async getExportSummary(): Promise<ExportSummary> {
    const db = await getDatabase();

    const [daysRow, itemsRow, recipesRow, customFoodsRow] = await Promise.all([
      db.getFirstAsync<{ count: number }>('SELECT count(DISTINCT date) as count FROM daily_logs'),
      db.getFirstAsync<{ count: number }>('SELECT count(*) as count FROM logged_items'),
      db.getFirstAsync<{ count: number }>('SELECT count(*) as count FROM recipes'),
      db.getFirstAsync<{ count: number }>('SELECT count(*) as count FROM food_items WHERE is_custom = 1'),
    ]);

    const mealsCountRow = await db.getFirstAsync<{ count: number }>(
      'SELECT count(DISTINCT meal_entry_id) as count FROM logged_items'
    );

    return {
      daysCount: daysRow?.count || 0,
      mealsCount: mealsCountRow?.count || 0,
      itemsCount: itemsRow?.count || 0,
      recipesCount: recipesRow?.count || 0,
      customFoodsCount: customFoodsRow?.count || 0,
    };
  }

  /**
   * Exporta tudo (refeições, calorias, receitas e alimentos manuais) em um único JSON
   */
  static async exportAllDataJson(): Promise<{ success: boolean; message: string }> {
    try {
      const db = await getDatabase();
      const targets = await SecureStorageService.getNutritionTargets();
      const recipes = await RecipeRepository.getAllRecipes();

      // Alimentos cadastrados manualmente
      const customFoods = await db.getAllAsync<FoodItem>(
        'SELECT * FROM food_items WHERE is_custom = 1 ORDER BY name ASC'
      );

      // Todos os registros diários
      const dailyLogsRows = await db.getAllAsync<{
        id: number;
        date: string;
        water_ml: number;
        weight_kg: number | null;
        notes: string | null;
        created_at: string;
      }>('SELECT * FROM daily_logs ORDER BY date DESC');

      // Itens logados agrupados por dia e refeição
      const loggedItemsRows = await db.getAllAsync<{
        date: string;
        meal_type: string;
        food_id: number;
        food_name: string;
        quantity_value: number;
        quantity_unit: string;
        calculated_kcal: number;
        calculated_protein: number;
        calculated_carbs: number;
        calculated_fat: number;
        calculated_fiber: number;
        created_at: string;
      }>(`
        SELECT dl.date, me.meal_type, li.food_id, li.food_name,
               li.quantity_value, li.quantity_unit,
               li.calculated_kcal, li.calculated_protein, li.calculated_carbs,
               li.calculated_fat, li.calculated_fiber, li.created_at
        FROM logged_items li
        JOIN meal_entries me ON li.meal_entry_id = me.id
        JOIN daily_logs dl ON me.daily_log_id = dl.id
        ORDER BY dl.date DESC, me.id ASC, li.id ASC
      `);

      // Agrupa itens por data
      const itemsByDate: Record<string, typeof loggedItemsRows> = {};
      for (const item of loggedItemsRows) {
        if (!itemsByDate[item.date]) itemsByDate[item.date] = [];
        itemsByDate[item.date].push(item);
      }

      const dailyHistory = dailyLogsRows.map((log) => {
        const items = itemsByDate[log.date] || [];
        const dayKcal = items.reduce((acc, i) => acc + i.calculated_kcal, 0);
        const dayProtein = items.reduce((acc, i) => acc + i.calculated_protein, 0);
        const dayCarbs = items.reduce((acc, i) => acc + i.calculated_carbs, 0);
        const dayFat = items.reduce((acc, i) => acc + i.calculated_fat, 0);
        const dayFiber = items.reduce((acc, i) => acc + i.calculated_fiber, 0);

        return {
          date: log.date,
          water_ml: log.water_ml,
          weight_kg: log.weight_kg ?? null,
          notes: log.notes,
          totals: {
            kcal: Math.round(dayKcal * 10) / 10,
            protein: Math.round(dayProtein * 10) / 10,
            carbs: Math.round(dayCarbs * 10) / 10,
            fat: Math.round(dayFat * 10) / 10,
            fiber: Math.round(dayFiber * 10) / 10,
          },
          items: items.map((i) => ({
            meal_type: i.meal_type,
            meal_name: MEAL_LABELS[i.meal_type] || i.meal_type,
            food_name: i.food_name,
            quantity: i.quantity_value,
            unit: i.quantity_unit,
            calculated_kcal: i.calculated_kcal,
            calculated_protein: i.calculated_protein,
            calculated_carbs: i.calculated_carbs,
            calculated_fat: i.calculated_fat,
            calculated_fiber: i.calculated_fiber,
          })),
        };
      });

      const exportPayload = {
        app: 'Diet-AI',
        export_date: new Date().toISOString(),
        nutrition_targets: targets,
        summary: {
          total_days: dailyHistory.length,
          total_logged_items: loggedItemsRows.length,
          total_recipes: recipes.length,
          total_custom_foods: customFoods.length,
        },
        daily_history: dailyHistory,
        recipes: recipes.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          total_kcal: r.total_kcal,
          total_protein: r.total_protein,
          total_carbs: r.total_carbs,
          total_fat: r.total_fat,
          total_fiber: r.total_fiber,
          ingredients: r.items.map((it) => ({
            food_name: it.food_name,
            quantity: it.quantity_value,
            unit: it.quantity_unit,
            calculated_kcal: it.calculated_kcal,
            calculated_protein: it.calculated_protein,
            calculated_carbs: it.calculated_carbs,
            calculated_fat: it.calculated_fat,
            calculated_fiber: it.calculated_fiber,
          })),
        })),
        custom_foods: customFoods.map((f) => ({
          id: f.id,
          name: f.name,
          category: f.category,
          default_unit: f.default_unit,
          grams_per_unit: f.grams_per_unit,
          kcal_per_100g: f.kcal_per_100g,
          protein_per_100g: f.protein_per_100g,
          carbs_per_100g: f.carbs_per_100g,
          fat_per_100g: f.fat_per_100g,
          fiber_per_100g: f.fiber_per_100g,
        })),
      };

      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `diet_ai_backup_${dateStr}.json`;
      const jsonContent = JSON.stringify(exportPayload, null, 2);

      await this.shareFile(fileName, jsonContent, 'application/json');
      return { success: true, message: 'Backup JSON exportado com sucesso!' };
    } catch (err: any) {
      console.error('[ExportService] Erro ao exportar JSON:', err);
      return { success: false, message: err.message || 'Falha ao exportar backup em JSON.' };
    }
  }

  /**
   * Exporta o diário de refeições e calorias em formato de planilha CSV
   */
  static async exportMealsCsv(): Promise<{ success: boolean; message: string }> {
    try {
      const db = await getDatabase();

      const rows = await db.getAllAsync<{
        date: string;
        meal_type: string;
        food_name: string;
        quantity_value: number;
        quantity_unit: string;
        calculated_kcal: number;
        calculated_protein: number;
        calculated_carbs: number;
        calculated_fat: number;
        calculated_fiber: number;
        water_ml: number;
        weight_kg: number | null;
      }>(`
        SELECT dl.date, me.meal_type, li.food_name,
               li.quantity_value, li.quantity_unit,
               li.calculated_kcal, li.calculated_protein, li.calculated_carbs,
               li.calculated_fat, li.calculated_fiber,
               dl.water_ml, dl.weight_kg
        FROM logged_items li
        JOIN meal_entries me ON li.meal_entry_id = me.id
        JOIN daily_logs dl ON me.daily_log_id = dl.id
        ORDER BY dl.date DESC, me.id ASC, li.id ASC
      `);

      if (rows.length === 0) {
        return { success: false, message: 'Nenhuma refeição registrada para exportar.' };
      }

      // Adiciona Byte Order Mark (BOM) UTF-8 para o Excel reconhecer acentos em português automaticamente
      let csv = '\uFEFF';
      csv += [
        'Data',
        'Refeição',
        'Alimento',
        'Quantidade',
        'Unidade',
        'Calorias (kcal)',
        'Proteínas (g)',
        'Carboidratos (g)',
        'Gorduras (g)',
        'Fibras (g)',
        'Água do Dia (ml)',
        'Peso do Dia (kg)',
      ].join(';') + '\r\n';

      for (const row of rows) {
        const line = [
          escapeCsv(row.date),
          escapeCsv(MEAL_LABELS[row.meal_type] || row.meal_type),
          escapeCsv(row.food_name),
          row.quantity_value.toString().replace('.', ','),
          escapeCsv(row.quantity_unit),
          row.calculated_kcal.toFixed(1).replace('.', ','),
          row.calculated_protein.toFixed(1).replace('.', ','),
          row.calculated_carbs.toFixed(1).replace('.', ','),
          row.calculated_fat.toFixed(1).replace('.', ','),
          row.calculated_fiber.toFixed(1).replace('.', ','),
          row.water_ml.toString(),
          row.weight_kg !== null && row.weight_kg !== undefined ? row.weight_kg.toString().replace('.', ',') : '',
        ].join(';');

        csv += line + '\r\n';
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `diet_ai_refeicoes_${dateStr}.csv`;

      await this.shareFile(fileName, csv, 'text/csv');
      return { success: true, message: 'Planilha de refeições exportada com sucesso!' };
    } catch (err: any) {
      console.error('[ExportService] Erro ao exportar CSV de refeições:', err);
      return { success: false, message: err.message || 'Falha ao exportar CSV.' };
    }
  }

  /**
   * Exporta alimentos cadastrados manualmente e receitas em formato de planilha CSV
   */
  static async exportCustomFoodsAndRecipesCsv(): Promise<{ success: boolean; message: string }> {
    try {
      const db = await getDatabase();
      const customFoods = await db.getAllAsync<FoodItem>(
        'SELECT * FROM food_items WHERE is_custom = 1 ORDER BY name ASC'
      );
      const recipes = await RecipeRepository.getAllRecipes();

      if (customFoods.length === 0 && recipes.length === 0) {
        return {
          success: false,
          message: 'Nenhum alimento manual ou receita cadastrada para exportar.',
        };
      }

      let csv = '\uFEFF';

      // 1. Seção de Alimentos Personalizados
      csv += '--- ALIMENTOS CADASTRADOS MANUALMENTE ---\r\n';
      csv += [
        'Nome',
        'Categoria',
        'Unidade Padrão',
        'Gramas por Unidade',
        'Kcal (por 100g)',
        'Proteínas (por 100g)',
        'Carboidratos (por 100g)',
        'Gorduras (por 100g)',
        'Fibras (por 100g)',
      ].join(';') + '\r\n';

      for (const food of customFoods) {
        csv += [
          escapeCsv(food.name),
          escapeCsv(food.category),
          escapeCsv(food.default_unit),
          food.grams_per_unit.toString().replace('.', ','),
          food.kcal_per_100g.toFixed(1).replace('.', ','),
          food.protein_per_100g.toFixed(1).replace('.', ','),
          food.carbs_per_100g.toFixed(1).replace('.', ','),
          food.fat_per_100g.toFixed(1).replace('.', ','),
          food.fiber_per_100g.toFixed(1).replace('.', ','),
        ].join(';') + '\r\n';
      }

      csv += '\r\n--- RECEITAS CADASTRADAS ---\r\n';
      csv += [
        'Receita',
        'Descrição',
        'Ingrediente',
        'Quantidade',
        'Unidade',
        'Calorias (kcal)',
        'Proteínas (g)',
        'Carboidratos (g)',
        'Gorduras (g)',
        'Fibras (g)',
      ].join(';') + '\r\n';

      for (const recipe of recipes) {
        for (const item of recipe.items) {
          csv += [
            escapeCsv(recipe.name),
            escapeCsv(recipe.description || ''),
            escapeCsv(item.food_name),
            item.quantity_value.toString().replace('.', ','),
            escapeCsv(item.quantity_unit),
            item.calculated_kcal.toFixed(1).replace('.', ','),
            item.calculated_protein.toFixed(1).replace('.', ','),
            item.calculated_carbs.toFixed(1).replace('.', ','),
            item.calculated_fat.toFixed(1).replace('.', ','),
            item.calculated_fiber.toFixed(1).replace('.', ','),
          ].join(';') + '\r\n';
        }
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `diet_ai_receitas_e_alimentos_${dateStr}.csv`;

      await this.shareFile(fileName, csv, 'text/csv');
      return { success: true, message: 'Planilha de receitas e alimentos exportada com sucesso!' };
    } catch (err: any) {
      console.error('[ExportService] Erro ao exportar receitas e alimentos:', err);
      return { success: false, message: err.message || 'Falha ao exportar dados.' };
    }
  }

  /**
   * Salva o conteúdo em arquivo temporário e abre a tela nativa de compartilhamento / download
   */
  private static async shareFile(fileName: string, content: string, mimeType: string): Promise<void> {
    if (Platform.OS === 'web') {
      const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    // Android e iOS
    const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    const fileUri = `${baseDir}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: `Exportar dados do Diet-AI (${fileName})`,
        UTI: mimeType === 'application/json' ? 'public.json' : 'public.comma-separated-values-text',
      });
    } else {
      await Share.share({
        title: fileName,
        message: content,
      });
    }
  }

  /**
   * Abre o seletor de arquivos e importa um backup JSON completo
   */
  static async pickAndImportBackupJson(): Promise<{
    success: boolean;
    canceled?: boolean;
    message: string;
    stats?: {
      daysImported: number;
      itemsImported: number;
      recipesImported: number;
      customFoodsImported: number;
    };
  }> {
    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/*', '*/*'],
        copyToCacheDirectory: true,
      });

      if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
        return { success: false, canceled: true, message: 'Seleção cancelada.' };
      }

      const asset = pickerResult.assets[0];
      let jsonText = '';

      if (Platform.OS === 'web') {
        if (asset.file) {
          jsonText = await asset.file.text();
        } else {
          const res = await fetch(asset.uri);
          jsonText = await res.text();
        }
      } else {
        jsonText = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      if (!jsonText.trim()) {
        return { success: false, message: 'O arquivo selecionado está vazio.' };
      }

      let data: any;
      try {
        data = JSON.parse(jsonText);
      } catch {
        return { success: false, message: 'O arquivo selecionado não é um JSON válido.' };
      }

      return await this.importJsonPayload(data);
    } catch (err: any) {
      console.error('[ExportService] Erro ao importar arquivo:', err);
      return { success: false, message: err.message || 'Falha ao processar arquivo de backup.' };
    }
  }

  /**
   * Processa e insere os dados do JSON no banco SQLite de forma transacional
   */
  static async importJsonPayload(data: any): Promise<{
    success: boolean;
    message: string;
    stats?: {
      daysImported: number;
      itemsImported: number;
      recipesImported: number;
      customFoodsImported: number;
    };
  }> {
    const db = await getDatabase();

    const customFoodsList: any[] = data.custom_foods || data.foods || [];
    const recipesList: any[] = data.recipes || [];
    const dailyHistoryList: any[] = data.daily_history || data.daily_meals || data.days || [];
    const targets = data.nutrition_targets || data.targets;

    if (
      customFoodsList.length === 0 &&
      recipesList.length === 0 &&
      dailyHistoryList.length === 0
    ) {
      return {
        success: false,
        message: 'O arquivo não contém dados compatíveis do Diet-AI (alimentos, receitas ou histórico).',
      };
    }

    let customFoodsCount = 0;
    let recipesCount = 0;
    let itemsCount = 0;
    let daysCount = 0;

    await db.withTransactionAsync(async () => {
      // 1. Importar Alimentos Customizados
      for (const food of customFoodsList) {
        if (!food.name) continue;

        const existing = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM food_items WHERE LOWER(name) = LOWER(?)',
          [food.name.trim()]
        );

        if (!existing) {
          await db.runAsync(
            `INSERT INTO food_items (
              name, category, default_unit, grams_per_unit,
              kcal_per_100g, protein_per_100g, carbs_per_100g,
              fat_per_100g, fiber_per_100g, is_custom, synonyms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            [
              food.name.trim(),
              food.category || 'Personalizados',
              food.default_unit || 'g',
              food.grams_per_unit || 1,
              food.kcal_per_100g || 0,
              food.protein_per_100g || 0,
              food.carbs_per_100g || 0,
              food.fat_per_100g || 0,
              food.fiber_per_100g || 0,
              food.synonyms || food.name.toLowerCase(),
            ]
          );
          customFoodsCount++;
        }
      }

      // Função auxiliar para encontrar ou criar alimento
      const findOrCreateFoodId = async (foodName: string): Promise<number> => {
        const cleanName = foodName.trim();
        const found = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM food_items WHERE LOWER(name) = LOWER(?) LIMIT 1',
          [cleanName]
        );
        if (found) return found.id;

        // Se não existir na TACO ou custom, cria como alimento importado para garantir a chave estrangeira
        const insertResult = await db.runAsync(
          `INSERT INTO food_items (
            name, category, default_unit, grams_per_unit,
            kcal_per_100g, protein_per_100g, carbs_per_100g,
            fat_per_100g, fiber_per_100g, is_custom, synonyms
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
          [cleanName, 'Importados', 'g', 1, 0, 0, 0, 0, 0, cleanName.toLowerCase()]
        );
        return Number(insertResult.lastInsertRowId);
      };

      // 2. Importar Receitas
      for (const recipe of recipesList) {
        if (!recipe.name) continue;

        const recipeRow = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM recipes WHERE LOWER(name) = LOWER(?)',
          [recipe.name.trim()]
        );

        let recipeId: number;
        if (!recipeRow) {
          const insertRec = await db.runAsync(
            'INSERT INTO recipes (name, description) VALUES (?, ?)',
            [recipe.name.trim(), recipe.description || null]
          );
          recipeId = Number(insertRec.lastInsertRowId);
          recipesCount++;
        } else {
          recipeId = recipeRow.id;
        }

        const ingredients = recipe.ingredients || recipe.items || [];
        for (const ing of ingredients) {
          if (!ing.food_name) continue;
          const foodId = await findOrCreateFoodId(ing.food_name);

          const existingItem = await db.getFirstAsync<{ id: number }>(
            'SELECT id FROM recipe_items WHERE recipe_id = ? AND LOWER(food_name) = LOWER(?)',
            [recipeId, ing.food_name.trim()]
          );

          if (!existingItem) {
            await db.runAsync(
              `INSERT INTO recipe_items (
                recipe_id, food_id, food_name, quantity_value, quantity_unit,
                calculated_kcal, calculated_protein, calculated_carbs, calculated_fat, calculated_fiber
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                recipeId,
                foodId,
                ing.food_name,
                ing.quantity || 1,
                ing.unit || 'g',
                ing.calculated_kcal || 0,
                ing.calculated_protein || 0,
                ing.calculated_carbs || 0,
                ing.calculated_fat || 0,
                ing.calculated_fiber || 0,
              ]
            );
          }
        }
      }

      // 3. Importar Histórico Diário de Refeições
      for (const day of dailyHistoryList) {
        if (!day.date) continue;

        const logRow = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM daily_logs WHERE date = ?',
          [day.date]
        );

        let logId: number;
        if (!logRow) {
          const insertLog = await db.runAsync(
            'INSERT INTO daily_logs (date, water_ml, notes, weight_kg) VALUES (?, ?, ?, ?)',
            [day.date, day.water_ml || 0, day.notes || null, day.weight_kg ?? null]
          );
          logId = Number(insertLog.lastInsertRowId);
          daysCount++;
        } else {
          logId = logRow.id;
          if (day.water_ml) {
            await db.runAsync('UPDATE daily_logs SET water_ml = MAX(water_ml, ?) WHERE id = ?', [
              day.water_ml,
              logId,
            ]);
          }
          if (day.weight_kg !== undefined && day.weight_kg !== null) {
            await db.runAsync('UPDATE daily_logs SET weight_kg = COALESCE(weight_kg, ?) WHERE id = ?', [
              day.weight_kg,
              logId,
            ]);
          }
        }

        // Garante as 5 refeições do dia
        const ALL_MEALS = ['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER', 'SUPPER'];
        for (const m of ALL_MEALS) {
          await db.runAsync(
            'INSERT OR IGNORE INTO meal_entries (daily_log_id, meal_type) VALUES (?, ?)',
            [logId, m]
          );
        }

        const mealEntries = await db.getAllAsync<{ id: number; meal_type: string }>(
          'SELECT id, meal_type FROM meal_entries WHERE daily_log_id = ?',
          [logId]
        );
        const mealEntryMap: Record<string, number> = {};
        for (const me of mealEntries) {
          mealEntryMap[me.meal_type] = me.id;
        }

        const items = day.items || [];
        for (const item of items) {
          if (!item.food_name) continue;
          const mealType = item.meal_type || 'LUNCH';
          const mealEntryId = mealEntryMap[mealType];
          if (!mealEntryId) continue;

          const foodId = await findOrCreateFoodId(item.food_name);

          // Verifica se item idêntico já foi registrado para evitar duplicata exata
          const existingLogged = await db.getFirstAsync<{ id: number }>(
            `SELECT id FROM logged_items 
             WHERE meal_entry_id = ? AND LOWER(food_name) = LOWER(?) AND quantity_value = ?`,
            [mealEntryId, item.food_name.trim(), item.quantity || 1]
          );

          if (!existingLogged) {
            await db.runAsync(
              `INSERT INTO logged_items (
                meal_entry_id, food_id, food_name, quantity_value, quantity_unit,
                calculated_kcal, calculated_protein, calculated_carbs, calculated_fat, calculated_fiber
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                mealEntryId,
                foodId,
                item.food_name,
                item.quantity || 1,
                item.unit || 'g',
                item.calculated_kcal || 0,
                item.calculated_protein || 0,
                item.calculated_carbs || 0,
                item.calculated_fat || 0,
                item.calculated_fiber || 0,
              ]
            );
            itemsCount++;
          }
        }
      }

      // 4. Importar Metas Nutricionais se existirem
      if (targets && targets.daily_kcal) {
        await SecureStorageService.setNutritionTargets(targets);
      }
    });

    return {
      success: true,
      message: `Importação concluída com sucesso! Registros adicionados: ${daysCount} dias novos, ${itemsCount} alimentos em refeições, ${recipesCount} receitas e ${customFoodsCount} alimentos personalizados.`,
      stats: {
        daysImported: daysCount,
        itemsImported: itemsCount,
        recipesImported: recipesCount,
        customFoodsImported: customFoodsCount,
      },
    };
  }
}
