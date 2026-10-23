import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
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
import { LoggedItem, FoodItem } from '../types';
import { FoodRepository } from '../database/repositories/FoodRepository';
import { DailyLogRepository } from '../database/repositories/DailyLogRepository';
import { calculateMacros } from '../utils/nutrition';
import { macroColors } from '../theme/theme';

interface EditFoodModalProps {
  visible: boolean;
  item: LoggedItem | null;
  onDismiss: () => void;
  onItemUpdated: () => void;
  onItemDeleted: (itemId: number) => void;
}

export const EditFoodModal: React.FC<EditFoodModalProps> = ({
  visible,
  item,
  onDismiss,
  onItemUpdated,
  onItemDeleted,
}) => {
  const theme = useTheme();

  const [currentFood, setCurrentFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [unit, setUnit] = useState('g');

  // Modo de troca de alimento
  const [isSwappingFood, setIsSwappingFood] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);

  useEffect(() => {
    if (visible && item) {
      setQuantity(String(item.quantity_value));
      setUnit(item.quantity_unit || 'g');
      setIsSwappingFood(false);
      setSearchQuery('');
      setSearchResults([]);

      // Carrega informações completas do alimento
      FoodRepository.getFoodById(item.food_id).then((food) => {
        if (food) {
          setCurrentFood(food);
        } else {
          // Cria objeto de fallback se o alimento original não estiver mais na tabela
          setCurrentFood({
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
          });
        }
      });
    }
  }, [visible, item]);

  const handleSearchSwap = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    const results = await FoodRepository.searchFoods(text);
    setSearchResults(results);
  };

  const handleSelectSwapFood = (newFood: FoodItem) => {
    setCurrentFood(newFood);
    setIsSwappingFood(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAdjustQuantity = (delta: number) => {
    const currentVal = parseFloat(quantity.replace(',', '.')) || 0;
    const newVal = Math.max(1, Math.round((currentVal + delta) * 10) / 10);
    setQuantity(String(newVal));
  };

  const handleSave = async () => {
    if (!item || !currentFood) return;
    const qtyNum = parseFloat(quantity.replace(',', '.')) || 1;

    try {
      await DailyLogRepository.updateLoggedItem(
        item.id,
        qtyNum,
        unit,
        currentFood.id
      );
      onItemUpdated();
      onDismiss();
    } catch (err) {
      console.error('[EditFoodModal] Erro ao salvar edição:', err);
    }
  };

  const handleDelete = () => {
    if (!item) return;
    onItemDeleted(item.id);
    onDismiss();
  };

  if (!item) return null;

  const parsedQty = parseFloat(quantity.replace(',', '.')) || 0;
  const liveMacros = currentFood ? calculateMacros(currentFood, parsedQty, unit) : null;

  const inputBgColor = theme.dark ? '#1E293B' : '#F8FAFC';
  const inputBorderColor = theme.dark ? '#334155' : '#CBD5E1';
  const inputTextColor = theme.colors.onSurface;
  const placeholderColor = theme.dark ? '#94A3B8' : '#64748B';

  const unitButtons = [
    { value: 'g', label: 'g' },
    ...(currentFood?.default_unit && currentFood.default_unit !== 'g'
      ? [{ value: currentFood.default_unit, label: currentFood.default_unit }]
      : []),
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Surface style={[styles.modalCard, { backgroundColor: theme.colors.surface }]} elevation={5}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                Editar Alimento
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Ajuste a quantidade, unidade ou substitua o alimento
              </Text>
            </View>
            <IconButton icon="close" size={22} onPress={onDismiss} />
          </View>

          <Divider style={[styles.divider, { backgroundColor: theme.dark ? '#334155' : '#E2E8F0' }]} />

          {isSwappingFood ? (
            /* Modo de Substituição de Alimento */
            <View style={{ flex: 1 }}>
              <View style={styles.swapHeader}>
                <Text variant="titleSmall" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                  Escolha o novo alimento
                </Text>
                <Button mode="text" onPress={() => setIsSwappingFood(false)}>
                  Voltar
                </Button>
              </View>

              <Searchbar
                placeholder="Buscar ex: arroz, frango, aveia..."
                onChangeText={handleSearchSwap}
                value={searchQuery}
                style={[styles.searchbar, { backgroundColor: theme.dark ? '#1E293B' : '#F1F5F9' }]}
                inputStyle={{ color: theme.colors.onSurface }}
                placeholderTextColor={placeholderColor}
                iconColor={theme.colors.onSurfaceVariant}
                autoFocus
              />

              <FlatList
                data={searchResults}
                keyExtractor={(f) => f.id.toString()}
                renderItem={({ item: food }) => (
                  <TouchableOpacity
                    style={[styles.foodRow, { borderBottomColor: theme.dark ? '#334155' : '#F1F5F9' }]}
                    onPress={() => handleSelectSwapFood(food)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                        {food.name}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {food.category || 'Geral'} • {food.kcal_per_100g} kcal/100g
                      </Text>
                    </View>
                    <Text variant="labelSmall" style={{ color: macroColors.protein, fontWeight: 'bold' }}>
                      P: {food.protein_per_100g}g
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  searchQuery.trim().length > 0 ? (
                    <Text style={[styles.emptySearchText, { color: theme.colors.onSurfaceVariant }]}>
                      Nenhum alimento encontrado.
                    </Text>
                  ) : null
                }
              />
            </View>
          ) : (
            /* Modo Principal de Edição de Quantidade / Porção */
            <View style={styles.bodyContainer}>
              {/* Alimento Selecionado e Botão de Trocar */}
              <View style={styles.foodInfoCard}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                    {currentFood?.name || item.food_name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {currentFood?.category || 'Geral'} • {currentFood?.kcal_per_100g || 0} kcal/100g
                  </Text>
                </View>
                <Button mode="outlined" compact onPress={() => setIsSwappingFood(true)}>
                  Trocar
                </Button>
              </View>

              {/* Linha de Quantidade e Unidade */}
              <View style={styles.quantitySection}>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8, fontWeight: '700' }}>
                  Quantidade e Unidade
                </Text>
                <View style={styles.quantityRow}>
                  <TextInput
                    style={[
                      styles.qtyInput,
                      {
                        backgroundColor: inputBgColor,
                        borderColor: inputBorderColor,
                        color: inputTextColor,
                      },
                    ]}
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
                    buttons={unitButtons}
                    style={{ flex: 1, marginLeft: 10 }}
                  />
                </View>

                {/* Botões rápidos de ajuste (+/-) */}
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: inputBgColor, borderColor: inputBorderColor }]}
                    onPress={() => handleAdjustQuantity(unit === 'g' ? -50 : -1)}
                  >
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                      {unit === 'g' ? '-50g' : '-1'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: inputBgColor, borderColor: inputBorderColor }]}
                    onPress={() => handleAdjustQuantity(unit === 'g' ? -10 : -0.5)}
                  >
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                      {unit === 'g' ? '-10g' : '-0.5'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: inputBgColor, borderColor: inputBorderColor }]}
                    onPress={() => handleAdjustQuantity(unit === 'g' ? 10 : 0.5)}
                  >
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                      {unit === 'g' ? '+10g' : '+0.5'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: inputBgColor, borderColor: inputBorderColor }]}
                    onPress={() => handleAdjustQuantity(unit === 'g' ? 50 : 1)}
                  >
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                      {unit === 'g' ? '+50g' : '+1'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Resumo Dinâmico dos Macros */}
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

              {/* Botões de Ação */}
              <View style={styles.actionsRow}>
                <Button
                  mode="outlined"
                  textColor="#EF4444"
                  style={styles.deleteBtn}
                  icon="delete-outline"
                  onPress={handleDelete}
                >
                  Excluir
                </Button>
                <Button
                  mode="contained"
                  buttonColor="#0D9488"
                  style={styles.saveBtn}
                  icon="check"
                  onPress={handleSave}
                >
                  Salvar Alterações
                </Button>
              </View>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    marginVertical: 12,
  },
  bodyContainer: {
    paddingVertical: 4,
  },
  foodInfoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  swapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchbar: {
    marginBottom: 12,
    borderRadius: 12,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  emptySearchText: {
    textAlign: 'center',
    marginVertical: 20,
  },
  quantitySection: {
    marginBottom: 16,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  qtyInput: {
    borderRadius: 12,
    borderWidth: 1,
    width: 90,
    padding: 10,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  stepperBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  liveMacrosCard: {
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginBottom: 18,
  },
  liveMacroBadges: {
    flexDirection: 'row',
    gap: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  deleteBtn: {
    borderColor: '#EF4444',
    borderRadius: 12,
  },
  saveBtn: {
    flex: 1,
    borderRadius: 12,
  },
});
