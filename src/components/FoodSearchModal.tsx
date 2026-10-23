import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Surface,
  Text,
  Button,
  IconButton,
  Divider,
  Searchbar,
  SegmentedButtons,
  useTheme,
} from 'react-native-paper';
import { FoodRepository } from '../database/repositories/FoodRepository';
import { DailyLogRepository } from '../database/repositories/DailyLogRepository';
import { FoodItem, MealType, MEAL_LABELS } from '../types';
import { calculateMacros } from '../utils/nutrition';
import { macroColors } from '../theme/theme';

interface FoodSearchModalProps {
  visible: boolean;
  date: string;
  mealType: MealType;
  onDismiss: () => void;
  onFoodAdded: () => void;
}

const MEAL_TABS: { key: MealType | 'ALL'; label: string }[] = [
  { key: 'BREAKFAST', label: 'Café da Manhã' },
  { key: 'LUNCH', label: 'Almoço' },
  { key: 'SNACK', label: 'Lanche' },
  { key: 'DINNER', label: 'Jantar' },
  { key: 'SUPPER', label: 'Ceia' },
  { key: 'ALL', label: 'Todas' },
];

export const FoodSearchModal: React.FC<FoodSearchModalProps> = ({
  visible,
  date,
  mealType,
  onDismiss,
  onFoodAdded,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<MealType | 'ALL'>(mealType);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [unit, setUnit] = useState('g');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  // Form para criação de novo alimento
  const [customName, setCustomName] = useState('');
  const [customKcal, setCustomKcal] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [customFiber, setCustomFiber] = useState('');

  const loadRecentFoods = async (tab: MealType | 'ALL') => {
    try {
      const list = await FoodRepository.getRecentFoodsByMeal(
        tab === 'ALL' ? undefined : tab,
        25
      );
      setFoods(list);
    } catch (err) {
      console.error('[FoodSearchModal] Erro ao carregar recentes:', err);
    }
  };

  useEffect(() => {
    if (visible) {
      setActiveTab(mealType);
      setSelectedFood(null);
      setIsCreatingCustom(false);
      setSearchQuery('');
      loadRecentFoods(mealType);
    }
  }, [visible, mealType]);

  const handleTabChange = (tab: MealType | 'ALL') => {
    setActiveTab(tab);
    if (!searchQuery.trim()) {
      loadRecentFoods(tab);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      loadRecentFoods(activeTab);
      return;
    }
    const results = await FoodRepository.searchFoods(text);
    setFoods(results);
  };

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    if (food.last_quantity !== undefined && food.last_quantity !== null && food.last_unit) {
      setUnit(food.last_unit);
      setQuantity(String(food.last_quantity));
    } else {
      setUnit('g');
      setQuantity('100');
    }
  };

  const handleConfirmAdd = async () => {
    if (!selectedFood) return;
    const qtyNum = parseFloat(quantity.replace(',', '.')) || 1;

    await DailyLogRepository.addFoodToMeal(
      date,
      mealType,
      selectedFood.id,
      qtyNum,
      unit
    );

    onFoodAdded();
    onDismiss();
  };

  const handleSaveCustomFood = async () => {
    if (!customName.trim()) return;

    const created = await FoodRepository.createCustomFood({
      name: customName.trim(),
      category: 'Personalizados',
      default_unit: 'g',
      grams_per_unit: 1,
      kcal_per_100g: parseFloat(customKcal.replace(',', '.')) || 0,
      protein_per_100g: parseFloat(customProtein.replace(',', '.')) || 0,
      carbs_per_100g: parseFloat(customCarbs.replace(',', '.')) || 0,
      fat_per_100g: parseFloat(customFat.replace(',', '.')) || 0,
      fiber_per_100g: parseFloat(customFiber.replace(',', '.')) || 0,
    });

    handleSelectFood(created);
    setIsCreatingCustom(false);
  };

  const theme = useTheme();
  const inputBgColor = theme.dark ? '#1E293B' : '#F8FAFC';
  const inputBorderColor = theme.dark ? '#334155' : '#CBD5E1';
  const inputTextColor = theme.colors.onSurface;
  const placeholderColor = theme.dark ? '#94A3B8' : '#64748B';
  const labelColor = theme.colors.onSurfaceVariant;

  const inputDynamicStyle = {
    backgroundColor: inputBgColor,
    borderColor: inputBorderColor,
    color: inputTextColor,
  };

  const parsedQty = parseFloat(quantity.replace(',', '.')) || 0;
  const liveMacros = selectedFood
    ? calculateMacros(selectedFood, parsedQty, unit)
    : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Surface style={[styles.modalCard, { backgroundColor: theme.colors.surface }]} elevation={5}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                Adicionar ao {MEAL_LABELS[mealType]}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {searchQuery.trim().length > 0
                  ? 'Pesquisa no banco de dados TACO'
                  : `Alimentos recentes (${activeTab === 'ALL' ? 'todas as refeições' : MEAL_LABELS[activeTab as MealType]})`}
              </Text>
            </View>
            <IconButton icon="close" size={22} onPress={onDismiss} />
          </View>

          <Divider style={[styles.divider, { backgroundColor: theme.dark ? '#334155' : '#E2E8F0' }]} />

          {/* Modo de Criação de Alimento Personalizado */}
          {isCreatingCustom ? (
            <View style={styles.customForm}>
              <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 12, color: theme.colors.onSurface }}>
                Novo Alimento Personalizado (valores por 100g)
              </Text>

              <Text variant="labelSmall" style={{ color: labelColor, marginBottom: 4, fontWeight: '700' }}>
                Nome do Alimento
              </Text>
              <TextInput
                style={[styles.input, inputDynamicStyle]}
                placeholder="Ex: Whey Max Titanium"
                placeholderTextColor={placeholderColor}
                value={customName}
                onChangeText={setCustomName}
              />

              <View style={styles.rowInputs}>
                <View style={styles.halfInputContainer}>
                  <Text variant="labelSmall" style={{ color: labelColor, marginBottom: 4, fontWeight: '700' }}>
                    Calorias (kcal)
                  </Text>
                  <TextInput
                    style={[styles.input, inputDynamicStyle]}
                    placeholder="0"
                    placeholderTextColor={placeholderColor}
                    keyboardType="numeric"
                    value={customKcal}
                    onChangeText={setCustomKcal}
                  />
                </View>
                <View style={styles.halfInputContainer}>
                  <Text variant="labelSmall" style={{ color: labelColor, marginBottom: 4, fontWeight: '700' }}>
                    Proteína (g)
                  </Text>
                  <TextInput
                    style={[styles.input, inputDynamicStyle]}
                    placeholder="0"
                    placeholderTextColor={placeholderColor}
                    keyboardType="numeric"
                    value={customProtein}
                    onChangeText={setCustomProtein}
                  />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={styles.halfInputContainer}>
                  <Text variant="labelSmall" style={{ color: labelColor, marginBottom: 4, fontWeight: '700' }}>
                    Carboidratos (g)
                  </Text>
                  <TextInput
                    style={[styles.input, inputDynamicStyle]}
                    placeholder="0"
                    placeholderTextColor={placeholderColor}
                    keyboardType="numeric"
                    value={customCarbs}
                    onChangeText={setCustomCarbs}
                  />
                </View>
                <View style={styles.halfInputContainer}>
                  <Text variant="labelSmall" style={{ color: labelColor, marginBottom: 4, fontWeight: '700' }}>
                    Gorduras (g)
                  </Text>
                  <TextInput
                    style={[styles.input, inputDynamicStyle]}
                    placeholder="0"
                    placeholderTextColor={placeholderColor}
                    keyboardType="numeric"
                    value={customFat}
                    onChangeText={setCustomFat}
                  />
                </View>
              </View>

              <View>
                <Text variant="labelSmall" style={{ color: labelColor, marginBottom: 4, fontWeight: '700' }}>
                  Fibras (g) (opcional)
                </Text>
                <TextInput
                  style={[styles.input, inputDynamicStyle]}
                  placeholder="0"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  value={customFiber}
                  onChangeText={setCustomFiber}
                />
              </View>

              <View style={styles.customButtons}>
                <Button mode="outlined" onPress={() => setIsCreatingCustom(false)}>
                  Cancelar
                </Button>
                <Button mode="contained" buttonColor="#0D9488" onPress={handleSaveCustomFood}>
                  Salvar Alimento
                </Button>
              </View>
            </View>
          ) : selectedFood ? (
            /* Modo de Configuração de Porção do Alimento Selecionado */
            <View style={styles.portionContainer}>
              <View style={styles.selectedFoodHeader}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                    {selectedFood.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {selectedFood.category || 'Geral'} • {selectedFood.kcal_per_100g} kcal/100g
                  </Text>
                </View>
                <Button mode="text" onPress={() => setSelectedFood(null)}>
                  Trocar
                </Button>
              </View>

              <View style={styles.quantityRow}>
                <TextInput
                  style={[styles.qtyInput, inputDynamicStyle]}
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                  selectTextOnFocus
                />
                <SegmentedButtons
                  value={unit}
                  onValueChange={(newUnit) => {
                    setUnit(newUnit);
                    if (newUnit === 'g' && (quantity === '1' || quantity === '2')) {
                      setQuantity('100');
                    } else if (newUnit !== 'g' && quantity === '100') {
                      setQuantity('1');
                    }
                  }}
                  buttons={[
                    { value: 'g', label: 'g' },
                    ...(selectedFood.default_unit && selectedFood.default_unit !== 'g'
                      ? [{ value: selectedFood.default_unit, label: selectedFood.default_unit }]
                      : []),
                    ...(unit && unit !== 'g' && unit !== selectedFood.default_unit
                      ? [{ value: unit, label: unit }]
                      : []),
                  ]}
                  style={{ flex: 1, marginLeft: 10 }}
                />
              </View>

              {/* Resumo Dinâmico dos Macros Calculados */}
              {liveMacros && (
                <Surface style={[styles.liveMacrosCard, { backgroundColor: theme.dark ? '#1E293B' : '#F8FAFC' }]} elevation={1}>
                  <Text variant="titleLarge" style={{ color: macroColors.kcal, fontWeight: 'bold' }}>
                    {liveMacros.calculated_kcal} kcal
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                    para {quantity} {unit} (~{liveMacros.effective_grams}g)
                  </Text>
                  <View style={styles.liveMacroBadges}>
                    <Text variant="labelMedium" style={{ color: macroColors.protein, fontWeight: '700' }}>
                      P: {liveMacros.calculated_protein}g
                    </Text>
                    <Text variant="labelMedium" style={{ color: macroColors.carbs, fontWeight: '700' }}>
                      C: {liveMacros.calculated_carbs}g
                    </Text>
                    <Text variant="labelMedium" style={{ color: macroColors.fat, fontWeight: '700' }}>
                      G: {liveMacros.calculated_fat}g
                    </Text>
                    <Text variant="labelMedium" style={{ color: macroColors.fiber, fontWeight: '700' }}>
                      F: {liveMacros.calculated_fiber}g
                    </Text>
                  </View>
                </Surface>
              )}

              <Button
                mode="contained"
                buttonColor="#0D9488"
                style={styles.confirmAddBtn}
                onPress={handleConfirmAdd}
              >
                Adicionar à Refeição
              </Button>
            </View>
          ) : (
            /* Modo de Busca e Lista de Alimentos com Abas de Recentes */
            <View style={{ flex: 1 }}>
              {/* Barra de Abas de Refeições */}
              <View style={styles.tabsWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tabsScrollContent}
                >
                  {MEAL_TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                      <TouchableOpacity
                        key={tab.key}
                        onPress={() => handleTabChange(tab.key)}
                        style={[
                          styles.tabPill,
                          isActive
                            ? styles.tabPillActive
                            : {
                                backgroundColor: theme.dark ? '#1E293B' : '#F1F5F9',
                                borderColor: theme.dark ? '#334155' : '#E2E8F0',
                              },
                        ]}
                      >
                        <Text
                          variant="labelMedium"
                          style={[
                            styles.tabPillText,
                            isActive
                              ? styles.tabPillTextActive
                              : { color: theme.colors.onSurfaceVariant },
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <Searchbar
                placeholder="Buscar no banco (ex: arroz, frango, aveia...)"
                onChangeText={handleSearch}
                value={searchQuery}
                style={[styles.searchbar, { backgroundColor: theme.dark ? '#1E293B' : '#F1F5F9' }]}
                inputStyle={{ color: theme.colors.onSurface }}
                placeholderTextColor={placeholderColor}
                iconColor={theme.colors.onSurfaceVariant}
              />

              <TouchableOpacity
                style={styles.newCustomRow}
                onPress={() => setIsCreatingCustom(true)}
              >
                <IconButton icon="plus-circle" iconColor="#0D9488" size={20} />
                <Text variant="labelMedium" style={{ color: '#0D9488', fontWeight: 'bold' }}>
                  Não encontrou? Cadastrar novo alimento
                </Text>
              </TouchableOpacity>

              {/* Indicador de Seção */}
              <View style={styles.listSectionHeader}>
                <Text variant="labelSmall" style={{ color: labelColor, fontWeight: '700' }}>
                  {searchQuery.trim().length > 0
                    ? `Resultados no banco de dados (${foods.length})`
                    : `Recentes em ${activeTab === 'ALL' ? 'todas as refeições' : MEAL_LABELS[activeTab as MealType]} (${foods.length})`}
                </Text>
              </View>

              <FlatList
                data={foods}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.foodRow, { borderBottomColor: theme.dark ? '#334155' : '#F1F5F9' }]}
                    onPress={() => handleSelectFood(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                          {item.name}
                        </Text>
                        {!searchQuery.trim() && (
                          <View style={[styles.recentTag, { backgroundColor: theme.dark ? '#064E3B' : '#ECFDF5' }]}>
                            <Text style={styles.recentTagText}>
                              {item.last_quantity && item.last_unit
                                ? `Último: ${item.last_quantity} ${item.last_unit}`
                                : 'Recente'}
                            </Text>
                          </View>
                        )}
                        {Boolean(item.is_custom) && (
                          <View style={[styles.customTag, { backgroundColor: theme.dark ? '#312E81' : '#EEF2FF' }]}>
                            <Text style={styles.customTagText}>Personalizado</Text>
                          </View>
                        )}
                      </View>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {item.category || 'Geral'} • {item.kcal_per_100g} kcal/100g
                      </Text>
                    </View>
                    <Text variant="labelSmall" style={{ color: macroColors.protein, fontWeight: 'bold' }}>
                      P: {item.protein_per_100g}g
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  searchQuery.trim().length > 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                        Nenhum alimento encontrado para "{searchQuery}".
                      </Text>
                      <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                        Tente outras palavras ou cadastre como alimento personalizado.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <IconButton icon="history" size={36} iconColor={theme.colors.onSurfaceVariant} />
                      <Text variant="titleSmall" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                        Sem alimentos recentes nesta aba
                      </Text>
                      <Text variant="bodySmall" style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                        Digite o que você comeu na barra de busca acima para selecionar do banco de dados TACO.
                      </Text>
                    </View>
                  )
                }
              />
            </View>
          )}
        </Surface>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: '84%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    marginVertical: 10,
    backgroundColor: '#F1F5F9',
  },
  tabsWrapper: {
    marginBottom: 10,
  },
  tabsScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabPillActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  tabPillText: {
    fontSize: 13,
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  searchbar: {
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
    borderRadius: 12,
  },
  newCustomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    marginBottom: 6,
  },
  listSectionHeader: {
    paddingVertical: 4,
    marginBottom: 6,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  recentTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recentTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#059669',
  },
  customTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  customTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4338CA',
  },
  emptyContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyText: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 12,
  },
  portionContainer: {
    paddingVertical: 10,
  },
  selectedFoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  qtyInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    width: 90,
    padding: 12,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  liveMacrosCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  liveMacroBadges: {
    flexDirection: 'row',
    gap: 16,
  },
  confirmAddBtn: {
    borderRadius: 12,
  },
  customForm: {
    paddingVertical: 10,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    fontSize: 15,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInputContainer: {
    flex: 1,
  },
  customButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
});
