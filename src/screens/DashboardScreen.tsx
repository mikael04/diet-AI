import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Surface, Text, IconButton, FAB } from 'react-native-paper';
import { DailyLogRepository } from '../database/repositories/DailyLogRepository';
import { SecureStorageService } from '../services/storage/SecureStorageService';
import { DailyLog, MealType, NutritionTargets } from '../types';
import { formatDate, getYesterdayDate } from '../utils/nutrition';
import { MacroSummaryCard } from '../components/MacroProgressBar';
import { MealCard } from '../components/MealCard';
import { VoiceModal } from '../components/VoiceModal';
import { FoodSearchModal } from '../components/FoodSearchModal';
import { RecipeRepository } from '../database/repositories/RecipeRepository';

const ALL_MEALS: MealType[] = ['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER', 'SUPPER'];

export const DashboardScreen: React.FC<{ onNavigateToRecipes: () => void; onNavigateToSettings: () => void }> = ({
  onNavigateToRecipes,
  onNavigateToSettings,
}) => {
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

  // Modais
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealType>('LUNCH');

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

  const handleAddWater = async () => {
    if (!dailyLog) return;
    const newWater = (dailyLog.water_ml || 0) + 250;
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

  const isToday = currentDate === formatDate();

  return (
    <View style={styles.container}>
      {/* Top Header com Seletor de Data e Ações */}
      <Surface style={styles.topBar} elevation={1}>
        <View style={styles.dateSelector}>
          <IconButton icon="chevron-left" size={22} onPress={handlePrevDay} />
          <TouchableOpacity onPress={() => setCurrentDate(formatDate())}>
            <Text variant="titleMedium" style={styles.dateText}>
              {isToday ? 'Hoje' : currentDate}
            </Text>
          </TouchableOpacity>
          <IconButton icon="chevron-right" size={22} onPress={handleNextDay} />
        </View>

        <View style={styles.topActions}>
          <IconButton
            icon="water-outline"
            iconColor="#06B6D4"
            size={22}
            onPress={handleAddWater}
          />
          <IconButton
            icon="book-open-outline"
            iconColor="#475569"
            size={22}
            onPress={onNavigateToRecipes}
          />
          <IconButton
            icon="cog-outline"
            iconColor="#475569"
            size={22}
            onPress={onNavigateToSettings}
          />
        </View>
      </Surface>

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

        {/* Barra de Água Rápida */}
        {dailyLog && (
          <Surface style={styles.waterBar} elevation={1}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconButton icon="water" iconColor="#06B6D4" size={20} />
              <Text variant="bodyMedium" style={{ fontWeight: '600', color: '#0F172A' }}>
                Água ingerida: {dailyLog.water_ml} ml
              </Text>
            </View>
            <TouchableOpacity style={styles.addWaterBtn} onPress={handleAddWater}>
              <Text variant="labelMedium" style={{ color: '#06B6D4', fontWeight: 'bold' }}>
                +250ml
              </Text>
            </TouchableOpacity>
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
              onDeleteItem={(itemId) => handleDeleteItem(itemId)}
            />
          ))}
      </ScrollView>

      {/* FAB Central de Comando de Voz */}
      <FAB
        icon="microphone"
        label="Falar Refeição"
        style={styles.voiceFab}
        color="#FFFFFF"
        onPress={() => setVoiceModalVisible(true)}
      />

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontWeight: 'bold',
    color: '#0F172A',
    minWidth: 90,
    textAlign: 'center',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingVertical: 2,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
  },
  addWaterBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 6,
  },
  voiceFab: {
    position: 'absolute',
    margin: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#0D9488',
    borderRadius: 28,
  },
});
