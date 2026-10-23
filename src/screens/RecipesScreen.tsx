import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  Surface,
  Text,
  Button,
  IconButton,
  Divider,
  Searchbar,
  useTheme,
} from 'react-native-paper';
import { RecipeRepository } from '../database/repositories/RecipeRepository';
import { FoodRepository } from '../database/repositories/FoodRepository';
import { Recipe, FoodItem, MealType, MEAL_LABELS } from '../types';
import { formatDate, calculateMacros } from '../utils/nutrition';
import { macroColors } from '../theme/theme';

interface EditableRecipeIngredient {
  food: FoodItem;
  quantityText: string;
  unit: string;
  autoFocus?: boolean;
}

export const RecipesScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const theme = useTheme();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [modalCreateVisible, setModalCreateVisible] = useState(false);
  const [modalAddMealVisible, setModalAddMealVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Estados do criador / editor de receitas
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);
  const [recipeName, setRecipeName] = useState('');
  const [recipeDesc, setRecipeDesc] = useState('');
  const [recipeItems, setRecipeItems] = useState<EditableRecipeIngredient[]>([]);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [searchFoods, setSearchFoods] = useState<FoodItem[]>([]);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    const list = await RecipeRepository.getAllRecipes();
    setRecipes(list);
  };

  const handleOpenCreateRecipe = () => {
    setEditingRecipeId(null);
    setRecipeName('');
    setRecipeDesc('');
    setRecipeItems([]);
    setFoodSearchQuery('');
    setSearchFoods([]);
    setModalCreateVisible(true);
  };

  const handleOpenEditRecipe = async (recipe: Recipe) => {
    setEditingRecipeId(recipe.id);
    setRecipeName(recipe.name);
    setRecipeDesc(recipe.description || '');
    setFoodSearchQuery('');
    setSearchFoods([]);

    const loadedItems: EditableRecipeIngredient[] = [];
    for (const item of recipe.items) {
      const food = await FoodRepository.getFoodById(item.food_id);
      const resolvedFood: FoodItem = food || {
        id: item.food_id,
        name: item.food_name,
        default_unit: item.quantity_unit || 'g',
        grams_per_unit: 1,
        kcal_per_100g: item.quantity_value > 0 ? (item.calculated_kcal / item.quantity_value) * 100 : 0,
        protein_per_100g: item.quantity_value > 0 ? (item.calculated_protein / item.quantity_value) * 100 : 0,
        carbs_per_100g: item.quantity_value > 0 ? (item.calculated_carbs / item.quantity_value) * 100 : 0,
        fat_per_100g: item.quantity_value > 0 ? (item.calculated_fat / item.quantity_value) * 100 : 0,
        fiber_per_100g: item.quantity_value > 0 ? (item.calculated_fiber / item.quantity_value) * 100 : 0,
        is_custom: false,
      };
      loadedItems.push({
        food: resolvedFood,
        quantityText: String(item.quantity_value),
        unit: item.quantity_unit || 'g',
        autoFocus: false,
      });
    }

    setRecipeItems(loadedItems);
    setModalCreateVisible(true);
  };

  const handleSearchFood = async (q: string) => {
    setFoodSearchQuery(q);
    if (!q.trim()) {
      setSearchFoods([]);
      return;
    }
    const res = await FoodRepository.searchFoods(q, 10);
    setSearchFoods(res);
  };

  /**
   * Ao clicar no alimento nos resultados da busca:
   * 1. Adiciona imediatamente o alimento na lista de ingredientes da receita
   * 2. Fecha as opções da busca e limpa o campo de pesquisa
   * 3. Foca no campo de quantidade do ingrediente recém-adicionado
   */
  const handleSelectFoodForRecipe = (food: FoodItem) => {
    const initialQty =
      food.last_quantity !== undefined && food.last_quantity !== null
        ? String(food.last_quantity)
        : '100';
    const initialUnit = food.last_unit || 'g';

    setRecipeItems((prev) => [
      ...prev.map((it) => ({ ...it, autoFocus: false })),
      {
        food,
        quantityText: initialQty,
        unit: initialUnit,
        autoFocus: true,
      },
    ]);
    setFoodSearchQuery('');
    setSearchFoods([]);
  };

  const handleUpdateIngredientQty = (index: number, newQtyText: string) => {
    setRecipeItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, quantityText: newQtyText } : item))
    );
  };

  const handleUpdateIngredientUnit = (index: number, newUnit: string) => {
    setRecipeItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        let nextQty = item.quantityText;
        if (newUnit === 'g' && (item.quantityText === '1' || item.quantityText === '2')) {
          nextQty = '100';
        } else if (newUnit !== 'g' && item.quantityText === '100') {
          nextQty = '1';
        }
        return { ...item, unit: newUnit, quantityText: nextQty };
      })
    );
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipeItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveRecipe = async () => {
    if (!recipeName.trim()) {
      Alert.alert('Nome obrigatório', 'Digite um nome para a receita.');
      return;
    }
    if (recipeItems.length === 0) {
      Alert.alert('Adicione ingredientes', 'Busque e selecione pelo menos um ingrediente para a receita.');
      return;
    }

    const formattedItems = recipeItems.map((it) => ({
      foodId: it.food.id,
      quantity: parseFloat(it.quantityText.replace(',', '.')) || 1,
      unit: it.unit,
    }));

    try {
      if (editingRecipeId !== null) {
        await RecipeRepository.updateRecipe(
          editingRecipeId,
          recipeName.trim(),
          recipeDesc.trim() || undefined,
          formattedItems
        );
      } else {
        await RecipeRepository.createRecipe(
          recipeName.trim(),
          recipeDesc.trim() || undefined,
          formattedItems
        );
      }

      setModalCreateVisible(false);
      setEditingRecipeId(null);
      setRecipeName('');
      setRecipeDesc('');
      setRecipeItems([]);
      setFoodSearchQuery('');
      setSearchFoods([]);
      await loadRecipes();
    } catch (err) {
      console.error('[RecipesScreen] Erro ao salvar receita:', err);
      Alert.alert('Erro ao salvar', 'Verifique se já não existe outra receita com o mesmo nome.');
    }
  };

  const handleDeleteRecipe = async (id: number) => {
    await RecipeRepository.deleteRecipe(id);
    await loadRecipes();
  };

  const handleConfirmAddToMeal = async (mealType: MealType) => {
    if (!selectedRecipe) return;
    await RecipeRepository.addRecipeToMeal(selectedRecipe.id, formatDate(), mealType);
    setModalAddMealVisible(false);
    setSelectedRecipe(null);
    onBack();
  };

  const inputDynamicStyle = {
    backgroundColor: theme.dark ? '#1E293B' : '#F1F5F9',
    borderColor: theme.dark ? '#334155' : '#CBD5E1',
    borderWidth: 1,
    color: theme.colors.onSurface,
  };
  const placeholderColor = theme.dark ? '#94A3B8' : '#64748B';

  // Totais em tempo real dos ingredientes na receita sendo criada/editada
  const liveTotals = recipeItems.reduce(
    (acc, item) => {
      const qty = parseFloat(item.quantityText.replace(',', '.')) || 0;
      const macros = calculateMacros(item.food, qty, item.unit);
      return {
        kcal: acc.kcal + macros.calculated_kcal,
        protein: acc.protein + macros.calculated_protein,
        carbs: acc.carbs + macros.calculated_carbs,
        fat: acc.fat + macros.calculated_fat,
        fiber: acc.fiber + macros.calculated_fiber,
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Header */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon="arrow-left" size={24} iconColor={theme.colors.onSurface} onPress={onBack} />
          <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
            Minhas Receitas
          </Text>
        </View>
        <Button
          mode="contained"
          buttonColor="#0D9488"
          icon="plus"
          onPress={handleOpenCreateRecipe}
        >
          Criar
        </Button>
      </Surface>

      <ScrollView contentContainerStyle={styles.listContent}>
        {recipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Nenhuma receita criada ainda.
            </Text>
            <Text variant="bodySmall" style={{ color: theme.dark ? '#64748B' : '#94A3B8', marginTop: 4 }}>
              Agrupe alimentos como "Omelete Proteico" ou "Shake Pós-Treino".
            </Text>
          </View>
        ) : (
          recipes.map((rec) => (
            <Surface
              key={rec.id}
              style={[
                styles.recipeCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.dark ? '#334155' : '#E2E8F0',
                  borderWidth: 1,
                },
              ]}
              elevation={1}
            >
              <View style={styles.recipeHeader}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  activeOpacity={0.7}
                  onPress={() => handleOpenEditRecipe(rec)}
                >
                  <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                    {rec.name}
                  </Text>
                  {rec.description ? (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {rec.description}
                    </Text>
                  ) : null}
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconButton
                    icon="pencil-outline"
                    size={20}
                    iconColor={theme.colors.onSurfaceVariant}
                    onPress={() => handleOpenEditRecipe(rec)}
                  />
                  <IconButton
                    icon="delete-outline"
                    size={20}
                    iconColor="#EF4444"
                    onPress={() => handleDeleteRecipe(rec.id)}
                  />
                </View>
              </View>

              {/* Totais de Macros da Receita */}
              <View style={styles.macroPills}>
                <Text variant="labelMedium" style={{ color: macroColors.kcal, fontWeight: 'bold', marginRight: 10 }}>
                  {Math.round(rec.total_kcal)} kcal
                </Text>
                <Text variant="labelSmall" style={{ color: macroColors.protein, marginRight: 8, fontWeight: '700' }}>
                  P: {Math.round(rec.total_protein)}g
                </Text>
                <Text variant="labelSmall" style={{ color: macroColors.carbs, marginRight: 8, fontWeight: '700' }}>
                  C: {Math.round(rec.total_carbs)}g
                </Text>
                <Text variant="labelSmall" style={{ color: macroColors.fat, marginRight: 8, fontWeight: '700' }}>
                  G: {Math.round(rec.total_fat)}g
                </Text>
                <Text variant="labelSmall" style={{ color: macroColors.fiber, fontWeight: '700' }}>
                  F: {Math.round(rec.total_fiber)}g
                </Text>
              </View>

              <Divider style={{ marginVertical: 8, backgroundColor: theme.dark ? '#334155' : '#F1F5F9' }} />

              {/* Ingredientes */}
              <View style={{ marginBottom: 10 }}>
                {rec.items.map((it, idx) => (
                  <Text key={idx} variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    • {it.food_name}: {it.quantity_value} {it.quantity_unit}
                  </Text>
                ))}
              </View>

              <View style={styles.cardActionRow}>
                <Button
                  mode="outlined"
                  icon="pencil-outline"
                  style={{ flex: 1 }}
                  onPress={() => handleOpenEditRecipe(rec)}
                >
                  Editar
                </Button>
                <Button
                  mode="contained-tonal"
                  icon="plus-box-outline"
                  style={{ flex: 2 }}
                  onPress={() => {
                    setSelectedRecipe(rec);
                    setModalAddMealVisible(true);
                  }}
                >
                  Usar Hoje
                </Button>
              </View>
            </Surface>
          ))
        )}
      </ScrollView>

      {/* Modal de Criação / Edição de Receita */}
      <Modal
        visible={modalCreateVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalCreateVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Surface style={[styles.modalBody, { backgroundColor: theme.colors.surface }]} elevation={5}>
            <View style={styles.modalHeader}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                {editingRecipeId !== null ? 'Editar Receita' : 'Criar Nova Receita'}
              </Text>
              <IconButton
                icon="close"
                size={22}
                iconColor={theme.colors.onSurface}
                onPress={() => setModalCreateVisible(false)}
              />
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <TextInput
                style={[styles.input, inputDynamicStyle]}
                placeholder="Nome da Receita (ex: Omelete 4 Ovos)"
                placeholderTextColor={placeholderColor}
                value={recipeName}
                onChangeText={setRecipeName}
              />
              <TextInput
                style={[styles.input, inputDynamicStyle]}
                placeholder="Descrição (opcional)"
                placeholderTextColor={placeholderColor}
                value={recipeDesc}
                onChangeText={setRecipeDesc}
              />

              {/* Busca de Ingrediente: selecionou -> adiciona direto e fecha as opções */}
              <Text
                variant="labelLarge"
                style={{ fontWeight: 'bold', marginTop: 6, marginBottom: 6, color: theme.colors.onSurface }}
              >
                Buscar e Adicionar Ingrediente:
              </Text>
              <Searchbar
                placeholder="Buscar alimento (ex: ovo, aveia, frango)..."
                value={foodSearchQuery}
                onChangeText={handleSearchFood}
                style={{ backgroundColor: theme.dark ? '#1E293B' : '#F1F5F9', marginBottom: 6, borderRadius: 12 }}
                inputStyle={{ color: theme.colors.onSurface }}
                placeholderTextColor={placeholderColor}
                iconColor={theme.colors.onSurfaceVariant}
              />

              {searchFoods.length > 0 && (
                <Surface
                  style={[
                    styles.searchResultsDropdown,
                    {
                      backgroundColor: theme.dark ? '#0F172A' : '#FFFFFF',
                      borderColor: theme.dark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  elevation={3}
                >
                  {searchFoods.map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[
                        styles.foodSearchItem,
                        { borderBottomColor: theme.dark ? '#1E293B' : '#F1F5F9' },
                      ]}
                      onPress={() => handleSelectFoodForRecipe(f)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                          {f.name}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {f.kcal_per_100g} kcal/100g • P: {f.protein_per_100g}g
                        </Text>
                      </View>
                      <IconButton icon="plus-circle" size={20} iconColor="#0D9488" />
                    </TouchableOpacity>
                  ))}
                </Surface>
              )}

              {/* Lista de Ingredientes da Receita com Edição Direta de Quantidade */}
              <View style={styles.ingredientsHeaderRow}>
                <Text variant="labelLarge" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                  Ingredientes da Receita ({recipeItems.length}):
                </Text>
                {recipeItems.length > 0 && (
                  <Text variant="labelMedium" style={{ color: macroColors.kcal, fontWeight: 'bold' }}>
                    Total: {Math.round(liveTotals.kcal)} kcal
                  </Text>
                )}
              </View>

              {recipeItems.length === 0 ? (
                <View
                  style={[
                    styles.emptyIngredientsBox,
                    {
                      backgroundColor: theme.dark ? '#1E293B' : '#F8FAFC',
                      borderColor: theme.dark ? '#334155' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                    Pesquise um alimento acima e toque nele para adicioná-lo e definir a quantidade.
                  </Text>
                </View>
              ) : (
                recipeItems.map((item, index) => {
                  const qtyNum = parseFloat(item.quantityText.replace(',', '.')) || 0;
                  const itemMacros = calculateMacros(item.food, qtyNum, item.unit);
                  const availableUnits = [
                    'g',
                    ...(item.food.default_unit && item.food.default_unit !== 'g'
                      ? [item.food.default_unit]
                      : []),
                    ...(item.unit !== 'g' && item.unit !== item.food.default_unit ? [item.unit] : []),
                  ];

                  return (
                    <Surface
                      key={`${item.food.id}-${index}`}
                      style={[
                        styles.ingredientCard,
                        {
                          backgroundColor: theme.dark ? '#1E293B' : '#F8FAFC',
                          borderColor: theme.dark ? '#334155' : '#E2E8F0',
                        },
                      ]}
                      elevation={0}
                    >
                      <View style={styles.ingredientTopRow}>
                        <View style={{ flex: 1 }}>
                          <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                            {item.food.name}
                          </Text>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            {Math.round(itemMacros.calculated_kcal)} kcal • P: {itemMacros.calculated_protein}g • C: {itemMacros.calculated_carbs}g • G: {itemMacros.calculated_fat}g
                          </Text>
                        </View>
                        <IconButton
                          icon="delete-outline"
                          size={20}
                          iconColor="#EF4444"
                          style={{ margin: 0 }}
                          onPress={() => handleRemoveIngredient(index)}
                        />
                      </View>

                      <View style={styles.ingredientQtyRow}>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginRight: 6 }}>
                          Qtd:
                        </Text>
                        <TextInput
                          style={[
                            styles.qtyInlineInput,
                            {
                              backgroundColor: theme.dark ? '#0F172A' : '#FFFFFF',
                              borderColor: '#0D9488',
                              color: theme.colors.onSurface,
                            },
                          ]}
                          keyboardType="numeric"
                          value={item.quantityText}
                          onChangeText={(val) => handleUpdateIngredientQty(index, val)}
                          selectTextOnFocus
                          autoFocus={Boolean(item.autoFocus)}
                        />
                        <View style={styles.unitPillsContainer}>
                          {availableUnits.map((u) => {
                            const isSelected = item.unit === u;
                            return (
                              <TouchableOpacity
                                key={u}
                                style={[
                                  styles.unitChip,
                                  isSelected
                                    ? styles.unitChipActive
                                    : {
                                        backgroundColor: theme.dark ? '#0F172A' : '#FFFFFF',
                                        borderColor: theme.dark ? '#334155' : '#CBD5E1',
                                      },
                                ]}
                                onPress={() => handleUpdateIngredientUnit(index, u)}
                              >
                                <Text
                                  variant="labelSmall"
                                  style={{
                                    color: isSelected ? '#FFFFFF' : theme.colors.onSurfaceVariant,
                                    fontWeight: isSelected ? 'bold' : '600',
                                  }}
                                >
                                  {u}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    </Surface>
                  );
                })
              )}
            </ScrollView>

            <Button
              mode="contained"
              buttonColor="#0D9488"
              style={{ marginTop: 14, borderRadius: 12 }}
              icon="check"
              onPress={handleSaveRecipe}
            >
              {editingRecipeId !== null ? 'Salvar Alterações' : 'Salvar Receita'}
            </Button>
          </Surface>
        </View>
      </Modal>

      {/* Modal para Escolher em Qual Refeição Adicionar */}
      <Modal visible={modalAddMealVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <Surface style={[styles.modalSelectMeal, { backgroundColor: theme.colors.surface }]} elevation={5}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12, color: theme.colors.onSurface }}>
              Adicionar "{selectedRecipe?.name}" em qual refeição de hoje?
            </Text>
            {(['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER', 'SUPPER'] as MealType[]).map((mt) => (
              <Button
                key={mt}
                mode="outlined"
                style={{ marginBottom: 8 }}
                onPress={() => handleConfirmAddToMeal(mt)}
              >
                {MEAL_LABELS[mt]}
              </Button>
            ))}
            <Button mode="text" onPress={() => setModalAddMealVisible(false)}>
              Cancelar
            </Button>
          </Surface>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  macroPills: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  cardActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBody: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalSelectMeal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    color: '#0F172A',
  },
  searchResultsDropdown: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    maxHeight: 220,
  },
  foodSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  ingredientsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  emptyIngredientsBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  ingredientCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  ingredientTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  qtyInlineInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    width: 80,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  unitPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  unitChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
});
