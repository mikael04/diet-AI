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
} from 'react-native-paper';
import { RecipeRepository } from '../database/repositories/RecipeRepository';
import { FoodRepository } from '../database/repositories/FoodRepository';
import { Recipe, FoodItem, MealType, MEAL_LABELS } from '../types';
import { formatDate } from '../utils/nutrition';
import { macroColors } from '../theme/theme';

export const RecipesScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [modalCreateVisible, setModalCreateVisible] = useState(false);
  const [modalAddMealVisible, setModalAddMealVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Estados do criador de receitas
  const [recipeName, setRecipeName] = useState('');
  const [recipeDesc, setRecipeDesc] = useState('');
  const [recipeItems, setRecipeItems] = useState<
    Array<{ food: FoodItem; quantity: number; unit: string }>
  >([]);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [searchFoods, setSearchFoods] = useState<FoodItem[]>([]);
  const [activeFoodPicker, setActiveFoodPicker] = useState<FoodItem | null>(null);
  const [pickerQty, setPickerQty] = useState('100');

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    const list = await RecipeRepository.getAllRecipes();
    setRecipes(list);
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

  const handleAddIngredient = () => {
    if (!activeFoodPicker) return;
    const qty = parseFloat(pickerQty) || 1;
    setRecipeItems((prev) => [
      ...prev,
      { food: activeFoodPicker, quantity: qty, unit: activeFoodPicker.default_unit || 'g' },
    ]);
    setActiveFoodPicker(null);
    setFoodSearchQuery('');
    setSearchFoods([]);
  };

  const handleSaveRecipe = async () => {
    if (!recipeName.trim() || recipeItems.length === 0) return;

    await RecipeRepository.createRecipe(
      recipeName.trim(),
      recipeDesc.trim() || undefined,
      recipeItems.map((it) => ({
        foodId: it.food.id,
        quantity: it.quantity,
        unit: it.unit,
      }))
    );

    setModalCreateVisible(false);
    setRecipeName('');
    setRecipeDesc('');
    setRecipeItems([]);
    await loadRecipes();
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

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <Surface style={styles.header} elevation={1}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon="arrow-left" size={24} onPress={onBack} />
          <Text variant="titleLarge" style={{ fontWeight: 'bold', color: '#0F172A' }}>
            Minhas Receitas
          </Text>
        </View>
        <Button
          mode="contained"
          buttonColor="#0D9488"
          icon="plus"
          onPress={() => setModalCreateVisible(true)}
        >
          Criar
        </Button>
      </Surface>

      <ScrollView contentContainerStyle={styles.listContent}>
        {recipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyMedium" style={{ color: '#94A3B8' }}>
              Nenhuma receita criada ainda.
            </Text>
            <Text variant="bodySmall" style={{ color: '#CBD5E1', marginTop: 4 }}>
              Agrupe alimentos como "Omelete Proteico" ou "Shake Pós-Treino".
            </Text>
          </View>
        ) : (
          recipes.map((rec) => (
            <Surface key={rec.id} style={styles.recipeCard} elevation={1}>
              <View style={styles.recipeHeader}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#0F172A' }}>
                    {rec.name}
                  </Text>
                  {rec.description ? (
                    <Text variant="bodySmall" style={{ color: '#64748B' }}>
                      {rec.description}
                    </Text>
                  ) : null}
                </View>
                <IconButton
                  icon="delete-outline"
                  size={20}
                  iconColor="#EF4444"
                  onPress={() => handleDeleteRecipe(rec.id)}
                />
              </View>

              {/* Totais de Macros da Receita */}
              <View style={styles.macroPills}>
                <Text variant="labelMedium" style={{ color: macroColors.kcal, fontWeight: 'bold', marginRight: 10 }}>
                  {Math.round(rec.total_kcal)} kcal
                </Text>
                <Text variant="labelSmall" style={{ color: macroColors.protein, marginRight: 8 }}>
                  P: {Math.round(rec.total_protein)}g
                </Text>
                <Text variant="labelSmall" style={{ color: macroColors.carbs, marginRight: 8 }}>
                  C: {Math.round(rec.total_carbs)}g
                </Text>
                <Text variant="labelSmall" style={{ color: macroColors.fat, marginRight: 8 }}>
                  G: {Math.round(rec.total_fat)}g
                </Text>
                <Text variant="labelSmall" style={{ color: macroColors.fiber }}>
                  F: {Math.round(rec.total_fiber)}g
                </Text>
              </View>

              <Divider style={{ marginVertical: 8 }} />

              {/* Ingredientes */}
              <View style={{ marginBottom: 10 }}>
                {rec.items.map((it, idx) => (
                  <Text key={idx} variant="bodySmall" style={{ color: '#475569' }}>
                    • {it.food_name}: {it.quantity_value} {it.quantity_unit}
                  </Text>
                ))}
              </View>

              <Button
                mode="contained-tonal"
                icon="plus-box-outline"
                onPress={() => {
                  setSelectedRecipe(rec);
                  setModalAddMealVisible(true);
                }}
              >
                Adicionar a uma Refeição Hoje
              </Button>
            </Surface>
          ))
        )}
      </ScrollView>

      {/* Modal de Criação de Receita */}
      <Modal visible={modalCreateVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Surface style={styles.modalBody} elevation={5}>
            <View style={styles.modalHeader}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                Criar Nova Receita
              </Text>
              <IconButton icon="close" size={22} onPress={() => setModalCreateVisible(false)} />
            </View>

            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Nome da Receita (ex: Omelete 4 Ovos)"
                value={recipeName}
                onChangeText={setRecipeName}
              />
              <TextInput
                style={styles.input}
                placeholder="Descrição (opcional)"
                value={recipeDesc}
                onChangeText={setRecipeDesc}
              />

              <Text variant="labelLarge" style={{ fontWeight: 'bold', marginTop: 10, marginBottom: 6 }}>
                Ingredientes Adicionados:
              </Text>
              {recipeItems.map((item, index) => (
                <View key={index} style={styles.ingredientRow}>
                  <Text variant="bodyMedium">
                    {item.food.name} ({item.quantity} {item.unit})
                  </Text>
                  <IconButton
                    icon="close-circle-outline"
                    size={18}
                    iconColor="#EF4444"
                    onPress={() => setRecipeItems(recipeItems.filter((_, i) => i !== index))}
                  />
                </View>
              ))}

              <Text variant="labelLarge" style={{ fontWeight: 'bold', marginTop: 14, marginBottom: 6 }}>
                Adicionar Ingrediente da TACO:
              </Text>
              <Searchbar
                placeholder="Buscar ingrediente..."
                value={foodSearchQuery}
                onChangeText={handleSearchFood}
                style={{ backgroundColor: '#F1F5F9', marginBottom: 8 }}
              />

              {searchFoods.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={styles.foodSearchItem}
                  onPress={() => setActiveFoodPicker(f)}
                >
                  <Text variant="bodyMedium">{f.name}</Text>
                  <Text variant="bodySmall" style={{ color: '#64748B' }}>
                    {f.kcal_per_100g} kcal/100g
                  </Text>
                </TouchableOpacity>
              ))}

              {activeFoodPicker && (
                <Surface style={styles.pickerBox} elevation={1}>
                  <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 6 }}>
                    {activeFoodPicker.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TextInput
                      style={[styles.input, { width: 90, marginBottom: 0 }]}
                      keyboardType="numeric"
                      value={pickerQty}
                      onChangeText={setPickerQty}
                    />
                    <Text variant="bodyMedium">{activeFoodPicker.default_unit || 'g'}</Text>
                    <Button mode="contained" buttonColor="#0D9488" onPress={handleAddIngredient}>
                      Confirmar
                    </Button>
                  </View>
                </Surface>
              )}
            </ScrollView>

            <Button
              mode="contained"
              buttonColor="#0D9488"
              style={{ marginTop: 14 }}
              onPress={handleSaveRecipe}
            >
              Salvar Receita
            </Button>
          </Surface>
        </View>
      </Modal>

      {/* Modal para Escolher em Qual Refeição Adicionar */}
      <Modal visible={modalAddMealVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <Surface style={styles.modalSelectMeal} elevation={5}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
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
    maxHeight: '85%',
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
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  foodSearchItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerBox: {
    backgroundColor: '#F0FDFA',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
});
