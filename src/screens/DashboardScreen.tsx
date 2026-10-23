import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { Surface, Text, IconButton, FAB, Button, useTheme } from 'react-native-paper';
import { DailyLogRepository } from '../database/repositories/DailyLogRepository';
import { SecureStorageService } from '../services/storage/SecureStorageService';
import { DailyLog, MealType, NutritionTargets, LoggedItem } from '../types';
import { formatDate, getYesterdayDate } from '../utils/nutrition';
import { MacroSummaryCard } from '../components/MacroProgressBar';
import { MealCard } from '../components/MealCard';
import { VoiceModal } from '../components/VoiceModal';
import { FoodSearchModal } from '../components/FoodSearchModal';
import { EditFoodModal } from '../components/EditFoodModal';
import { HistoryAnalyticsView } from '../components/HistoryAnalyticsView';

const ALL_MEALS: MealType[] = ['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER', 'SUPPER'];

export const DashboardScreen: React.FC<{
  onNavigateToRecipes: () => void;
  onNavigateToSettings: () => void;
}> = ({ onNavigateToRecipes, onNavigateToSettings }) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState<string>(formatDate());
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [targets, setTargets] = useState<NutritionTargets>({
    daily_kcal: 2200,
    daily_protein: 160,
    daily_carbs: 220,
    daily_fat: 65,
    daily_fiber: 30,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Visão Ativa: 'daily' (Registro Diário) ou 'history' (Série Temporal)
  const [activeView, setActiveView] = useState<'daily' | 'history'>('daily');

  // Modais
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealType>('LUNCH');
  const [editingItem, setEditingItem] = useState<LoggedItem | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Modal de Peso do Dia
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [weightInputValue, setWeightInputValue] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [log, loadedTargets] = await Promise.all([
        DailyLogRepository.getOrCreateDailyLog(currentDate),
        SecureStorageService.getNutritionTargets(),
      ]);
      setDailyLog(log);
      setTargets(loadedTargets);
    } catch (err) {
      console.error('[Dashboard] Erro ao carregar dados:', err);
    }
  }, [currentDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePrevDay = () => {
    setCurrentDate((prev) => getYesterdayDate(prev));
  };

  const handleNextDay = () => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    setCurrentDate(formatDate(date));
  };

  const handleAddWater = async (amount: number = 250) => {
    if (!dailyLog) return;
    const newWater = (dailyLog.water_ml || 0) + amount;
    await DailyLogRepository.updateWater(currentDate, newWater);
    await loadData();
  };

  const handleDeleteItem = async (itemId: number) => {
    await DailyLogRepository.removeLoggedItem(itemId);
    await loadData();
  };

  const handleCopyYesterday = async (mealType: MealType) => {
    const yesterday = getYesterdayDate(currentDate);
    await DailyLogRepository.copyMeal(yesterday, mealType, currentDate, mealType);
    await loadData();
  };

  const openWeightModal = () => {
    setWeightInputValue(dailyLog?.weight_kg ? String(dailyLog.weight_kg) : '');
    setWeightModalVisible(true);
  };

  const handleSaveWeight = async (weight: number | null) => {
    await DailyLogRepository.updateWeight(currentDate, weight);
    setWeightModalVisible(false);
    await loadData();
  };

  // Cálculo de Datas Relativas
  const todayStr = formatDate();
  const yesterdayStr = getYesterdayDate(todayStr);
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = formatDate(tomorrowObj);

  const isToday = currentDate === todayStr;
  const isYesterday = currentDate === yesterdayStr;
  const isTomorrow = currentDate === tomorrowStr;

  const [y, m, d] = currentDate.split('-');
  const numericDisplayDate = `${d}/${m}/${y}`;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Header com Seletor de Data e Ações */}
      <Surface style={[styles.topBar, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <View style={styles.dateSelector}>
          <IconButton icon="chevron-left" size={22} onPress={handlePrevDay} />
          <TouchableOpacity onPress={() => setCurrentDate(todayStr)} style={styles.dateButtonContainer}>
            {isToday ? (
              <Text variant="titleMedium" style={[styles.dateText, { color: theme.colors.onSurface }]}>
                Hoje
              </Text>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text variant="titleMedium" style={[styles.dateText, { color: theme.colors.onSurface }]}>
                  {numericDisplayDate}
                </Text>
                {(isYesterday || isTomorrow) && (
                  <Text variant="labelSmall" style={[styles.subDateText, { color: theme.colors.onSurfaceVariant }]}>
                    {isYesterday ? 'Ontem' : 'Amanhã'}
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>
          <IconButton icon="chevron-right" size={22} onPress={handleNextDay} />
        </View>

        <View style={styles.topActions}>
          {/* Botão de Peso do Dia (substitui o ícone de água no topo) */}
          {dailyLog?.weight_kg ? (
            <TouchableOpacity
              style={[
                styles.weightBadge,
                {
                  backgroundColor: theme.dark ? '#064E3B' : '#ECFDF5',
                  borderColor: theme.dark ? '#059669' : '#A7F3D0',
                },
              ]}
              onPress={openWeightModal}
            >
              <IconButton
                icon="scale-bathroom"
                iconColor="#059669"
                size={16}
                style={styles.weightBadgeIcon}
              />
              <Text variant="labelMedium" style={{ color: '#059669', fontWeight: 'bold' }}>
                {dailyLog.weight_kg} kg
              </Text>
            </TouchableOpacity>
          ) : (
            <IconButton
              icon="scale-bathroom"
              iconColor={theme.colors.onSurfaceVariant}
              size={22}
              onPress={openWeightModal}
            />
          )}

          {/* Alternador de Visão: Diária vs Série Temporal */}
          <IconButton
            icon={activeView === 'daily' ? 'chart-timeline-variant' : 'calendar-today'}
            iconColor={activeView === 'history' ? '#0D9488' : theme.colors.onSurfaceVariant}
            size={22}
            onPress={() => setActiveView((prev) => (prev === 'daily' ? 'history' : 'daily'))}
          />

          <IconButton
            icon="book-open-outline"
            iconColor={theme.colors.onSurfaceVariant}
            size={22}
            onPress={onNavigateToRecipes}
          />
          <IconButton
            icon="cog-outline"
            iconColor={theme.colors.onSurfaceVariant}
            size={22}
            onPress={onNavigateToSettings}
          />
        </View>
      </Surface>

      {/* Conteúdo Principal: Série Temporal ou Registro Diário */}
      {activeView === 'history' ? (
        <HistoryAnalyticsView targets={targets} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Resumo de Metas e Calorias */}
          {dailyLog && (
            <MacroSummaryCard
              currentKcal={dailyLog.total_kcal}
              currentProtein={dailyLog.total_protein}
              currentCarbs={dailyLog.total_carbs}
              currentFat={dailyLog.total_fat}
              currentFiber={dailyLog.total_fiber}
              targets={targets}
            />
          )}

          {/* Barra de Água Rápida com botões +250ml e +1L */}
          {dailyLog && (
            <Surface
              style={[
                styles.waterBar,
                { backgroundColor: theme.dark ? '#0C4A6E' : '#E0F2FE' },
              ]}
              elevation={1}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <IconButton icon="water" iconColor="#0284C7" size={20} />
                <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.dark ? '#E0F2FE' : '#0F172A' }}>
                  Água ingerida: {dailyLog.water_ml} ml
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <TouchableOpacity
                  style={[styles.addWaterBtn, { backgroundColor: theme.dark ? '#1E293B' : '#FFFFFF' }]}
                  onPress={() => handleAddWater(250)}
                >
                  <Text variant="labelMedium" style={{ color: '#0284C7', fontWeight: 'bold' }}>
                    +250ml
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addWaterBtn, { backgroundColor: theme.dark ? '#1E293B' : '#FFFFFF' }]}
                  onPress={() => handleAddWater(1000)}
                >
                  <Text variant="labelMedium" style={{ color: '#0284C7', fontWeight: 'bold' }}>
                    +1L
                  </Text>
                </TouchableOpacity>
              </View>
            </Surface>
          )}

          {/* 5 Seções de Refeições */}
          {dailyLog &&
            ALL_MEALS.map((mealType) => (
              <MealCard
                key={mealType}
                meal={dailyLog.meals[mealType]}
                onAddManual={(type) => {
                  setActiveMealType(type);
                  setSearchModalVisible(true);
                }}
                onAddRecipe={(type) => {
                  setActiveMealType(type);
                  onNavigateToRecipes();
                }}
                onCopyYesterday={(type) => handleCopyYesterday(type)}
                onEditItem={(item) => {
                  setEditingItem(item);
                  setEditModalVisible(true);
                }}
                onDeleteItem={(itemId) => handleDeleteItem(itemId)}
              />
            ))}
        </ScrollView>
      )}

      {/* FAB Central de Comando de Voz (visível na tela diária) */}
      {activeView === 'daily' && (
        <FAB
          icon="microphone"
          label="Falar Refeição"
          style={styles.voiceFab}
          color="#FFFFFF"
          onPress={() => setVoiceModalVisible(true)}
        />
      )}

      {/* Modal de Voz */}
      <VoiceModal
        visible={voiceModalVisible}
        currentMealContext={activeMealType}
        onDismiss={() => setVoiceModalVisible(false)}
        onActionCompleted={loadData}
      />

      {/* Modal de Pesquisa Manual */}
      <FoodSearchModal
        visible={searchModalVisible}
        date={currentDate}
        mealType={activeMealType}
        onDismiss={() => setSearchModalVisible(false)}
        onFoodAdded={loadData}
      />

      {/* Modal de Edição de Alimento Registrado */}
      <EditFoodModal
        visible={editModalVisible}
        item={editingItem}
        onDismiss={() => {
          setEditModalVisible(false);
          setEditingItem(null);
        }}
        onItemUpdated={loadData}
        onItemDeleted={(itemId) => handleDeleteItem(itemId)}
      />

      {/* Modal de Registro de Peso Corporal do Dia */}
      <Modal
        visible={weightModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWeightModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Surface style={[styles.weightModalCard, { backgroundColor: theme.colors.surface }]} elevation={5}>
            <View style={styles.weightModalHeader}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                Peso Corporal do Dia
              </Text>
              <IconButton icon="close" size={20} onPress={() => setWeightModalVisible(false)} />
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
              Registro para {isToday ? 'Hoje' : numericDisplayDate}
            </Text>

            <View style={styles.weightInputRow}>
              <TextInput
                style={[
                  styles.weightTextInput,
                  {
                    backgroundColor: theme.dark ? '#1E293B' : '#F8FAFC',
                    borderColor: theme.dark ? '#334155' : '#CBD5E1',
                    color: theme.colors.onSurface,
                  },
                ]}
                placeholder="Ex: 78.5"
                placeholderTextColor={theme.dark ? '#94A3B8' : '#64748B'}
                keyboardType="numeric"
                value={weightInputValue}
                onChangeText={setWeightInputValue}
                autoFocus
              />
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface, marginLeft: 8 }}>
                kg
              </Text>
            </View>

            <View style={styles.weightModalActions}>
              {dailyLog?.weight_kg ? (
                <Button
                  mode="text"
                  textColor="#EF4444"
                  onPress={() => handleSaveWeight(null)}
                >
                  Limpar
                </Button>
              ) : (
                <View />
              )}

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button mode="outlined" onPress={() => setWeightModalVisible(false)}>
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  buttonColor="#0D9488"
                  onPress={() => {
                    const parsed = parseFloat(weightInputValue.replace(',', '.'));
                    if (!isNaN(parsed) && parsed > 0) {
                      handleSaveWeight(parsed);
                    } else {
                      setWeightModalVisible(false);
                    }
                  }}
                >
                  Salvar
                </Button>
              </View>
            </View>
          </Surface>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 6,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButtonContainer: {
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subDateText: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 2,
  },
  weightBadgeIcon: {
    margin: 0,
    padding: 0,
    width: 18,
    height: 18,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  waterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  addWaterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  voiceFab: {
    position: 'absolute',
    margin: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#0D9488',
    borderRadius: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  weightModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 20,
  },
  weightModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  weightTextInput: {
    width: 120,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  weightModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
