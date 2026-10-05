import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {
  Surface,
  Text,
  Button,
  IconButton,
  Divider,
  Searchbar,
  SegmentedButtons,
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

export const FoodSearchModal: React.FC<FoodSearchModalProps> = ({
  visible,
  date,
  mealType,
  onDismiss,
  onFoodAdded,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
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

  useEffect(() => {
    if (visible) {
      loadInitialFoods();
      setSelectedFood(null);
      setIsCreatingCustom(false);
      setSearchQuery('');
    }
  }, [visible]);

  const loadInitialFoods = async () => {
    const list = await FoodRepository.getAllFoods(30);
    setFoods(list);
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      loadInitialFoods();
      return;
    }
    const results = await FoodRepository.searchFoods(text);
    setFoods(results);
  };

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setUnit(food.default_unit || 'g');
    setQuantity(food.default_unit === 'unidade' ? '1' : '100');
  };

  const handleConfirmAdd = async () => {
    if (!selectedFood) return;
    const qtyNum = parseFloat(quantity) || 1;

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
      kcal_per_100g: parseFloat(customKcal) || 0,
      protein_per_100g: parseFloat(customProtein) || 0,
      carbs_per_100g: parseFloat(customCarbs) || 0,
      fat_per_100g: parseFloat(customFat) || 0,
      fiber_per_100g: parseFloat(customFiber) || 0,
    });

    handleSelectFood(created);
    setIsCreatingCustom(false);
  };

  const liveMacros = selectedFood
    ? calculateMacros(selectedFood, parseFloat(quantity) || 0, unit)
    : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Surface style={styles.modalCard} elevation={5}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                Adicionar ao {MEAL_LABELS[mealType]}
              </Text>
              <Text variant="bodySmall" style={{ color: '#64748B' }}>
                Pesquisa na Tabela TACO (Unicamp)
              </Text>
            </View>
            <IconButton icon="close" size={22} onPress={onDismiss} />
          </View>

          <Divider style={styles.divider} />

          {/* Modo de Criação de Alimento Personalizado */}
          {isCreatingCustom ? (
            <View style={styles.customForm}>
              <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 12 }}>
                Novo Alimento Personalizado (valores por 100g)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Nome do Alimento (ex: Whey Max Titanium)"
                value={customName}
                onChangeText={setCustomName}
              />
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Kcal"
                  keyboardType="numeric"
                  value={customKcal}
                  onChangeText={setCustomKcal}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Proteína (g)"
                  keyboardType="numeric"
                  value={customProtein}
                  onChangeText={setCustomProtein}
                />
              </View>
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Carboidratos (g)"
                  keyboardType="numeric"
                  value={customCarbs}
                  onChangeText={setCustomCarbs}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Gorduras (g)"
                  keyboardType="numeric"
                  value={customFat}
                  onChangeText={setCustomFat}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Fibras (g)"
                keyboardType="numeric"
                value={customFiber}
                onChangeText={setCustomFiber}
              />

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
                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#0F172A' }}>
                  {selectedFood.name}
                </Text>
                <Button mode="text" onPress={() => setSelectedFood(null)}>
                  Trocar
                </Button>
              </View>

              <View style={styles.quantityRow}>
                <TextInput
                  style={styles.qtyInput}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
                <SegmentedButtons
                  value={unit}
                  onValueChange={setUnit}
                  buttons={[
                    { value: selectedFood.default_unit || 'g', label: selectedFood.default_unit || 'g' },
                    ...(selectedFood.default_unit !== 'g' ? [{ value: 'g', label: 'g' }] : []),
                  ]}
                  style={{ flex: 1, marginLeft: 10 }}
                />
              </View>

              {/* Resumo Dinâmico dos Macros Calculados */}
              {liveMacros && (
                <Surface style={styles.liveMacrosCard} elevation={1}>
                  <Text variant="titleLarge" style={{ color: macroColors.kcal, fontWeight: 'bold' }}>
                    {liveMacros.calculated_kcal} kcal
                  </Text>
                  <Text variant="bodySmall" style={{ color: '#64748B', marginBottom: 8 }}>
                    para {quantity} {unit} (~{liveMacros.effective_grams}g)
                  </Text>
                  <View style={styles.liveMacroBadges}>
                    <Text variant="labelMedium" style={{ color: macroColors.protein }}>
                      P: {liveMacros.calculated_protein}g
                    </Text>
                    <Text variant="labelMedium" style={{ color: macroColors.carbs }}>
                      C: {liveMacros.calculated_carbs}g
                    </Text>
                    <Text variant="labelMedium" style={{ color: macroColors.fat }}>
                      G: {liveMacros.calculated_fat}g
                    </Text>
                    <Text variant="labelMedium" style={{ color: macroColors.fiber }}>
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
            /* Modo de Busca e Lista de Alimentos */
            <View style={{ flex: 1 }}>
              <Searchbar
                placeholder="Buscar ex: arroz, frango, aveia..."
                onChangeText={handleSearch}
                value={searchQuery}
                style={styles.searchbar}
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

              <FlatList
                data={foods}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.foodRow}
                    onPress={() => handleSelectFood(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMedium" style={{ fontWeight: '600', color: '#1E293B' }}>
                        {item.name}
                      </Text>
                      <Text variant="bodySmall" style={{ color: '#64748B' }}>
                        {item.category || 'Geral'} • {item.kcal_per_100g} kcal/100g
                      </Text>
                    </View>
                    <Text variant="labelSmall" style={{ color: macroColors.protein, fontWeight: 'bold' }}>
                      P: {item.protein_per_100g}g
                    </Text>
                  </TouchableOpacity>
                )}
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
    height: '80%',
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
  searchbar: {
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
    borderRadius: 12,
  },
  newCustomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 8,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    width: 90,
    padding: 12,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0F172A',
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
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    color: '#0F172A',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  customButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
});
