import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar, Surface } from 'react-native-paper';
import { macroColors } from '../theme/theme';
import { NutritionTargets } from '../types';

interface MacroSummaryProps {
  currentKcal: number;
  currentProtein: number;
  currentCarbs: number;
  currentFat: number;
  currentFiber: number;
  targets: NutritionTargets;
}

export const MacroSummaryCard: React.FC<MacroSummaryProps> = ({
  currentKcal,
  currentProtein,
  currentCarbs,
  currentFat,
  currentFiber,
  targets,
}) => {
  const kcalPercent = Math.min(currentKcal / (targets.daily_kcal || 1), 1);
  const proteinPercent = Math.min(currentProtein / (targets.daily_protein || 1), 1);
  const carbsPercent = Math.min(currentCarbs / (targets.daily_carbs || 1), 1);
  const fatPercent = Math.min(currentFat / (targets.daily_fat || 1), 1);
  const fiberPercent = Math.min(currentFiber / (targets.daily_fiber || 1), 1);

  return (
    <Surface style={styles.card} elevation={2}>
      {/* Calorias Destaque */}
      <View style={styles.kcalContainer}>
        <View>
          <Text variant="titleMedium" style={styles.bold}>
            Calorias Diárias
          </Text>
          <Text variant="bodySmall" style={styles.subtext}>
            Meta: {targets.daily_kcal} kcal
          </Text>
        </View>
        <View style={styles.kcalNumbers}>
          <Text variant="headlineMedium" style={{ color: macroColors.kcal, fontWeight: 'bold' }}>
            {Math.round(currentKcal)}
          </Text>
          <Text variant="labelMedium" style={{ color: '#64748B' }}>
            / {targets.daily_kcal} kcal
          </Text>
        </View>
      </View>
      <ProgressBar progress={kcalPercent} color={macroColors.kcal} style={styles.kcalBar} />

      {/* Grid de Macronutrientes */}
      <View style={styles.macrosGrid}>
        {/* Proteínas */}
        <View style={styles.macroCol}>
          <Text variant="labelSmall" style={styles.macroLabel}>Proteína</Text>
          <Text variant="titleSmall" style={{ color: macroColors.protein, fontWeight: 'bold' }}>
            {Math.round(currentProtein)}g
          </Text>
          <Text variant="bodySmall" style={styles.macroTarget}>/{targets.daily_protein}g</Text>
          <ProgressBar progress={proteinPercent} color={macroColors.protein} style={styles.miniBar} />
        </View>

        {/* Carboidratos */}
        <View style={styles.macroCol}>
          <Text variant="labelSmall" style={styles.macroLabel}>Carbs</Text>
          <Text variant="titleSmall" style={{ color: macroColors.carbs, fontWeight: 'bold' }}>
            {Math.round(currentCarbs)}g
          </Text>
          <Text variant="bodySmall" style={styles.macroTarget}>/{targets.daily_carbs}g</Text>
          <ProgressBar progress={carbsPercent} color={macroColors.carbs} style={styles.miniBar} />
        </View>

        {/* Gorduras */}
        <View style={styles.macroCol}>
          <Text variant="labelSmall" style={styles.macroLabel}>Gorduras</Text>
          <Text variant="titleSmall" style={{ color: macroColors.fat, fontWeight: 'bold' }}>
            {Math.round(currentFat)}g
          </Text>
          <Text variant="bodySmall" style={styles.macroTarget}>/{targets.daily_fat}g</Text>
          <ProgressBar progress={fatPercent} color={macroColors.fat} style={styles.miniBar} />
        </View>

        {/* Fibras */}
        <View style={styles.macroCol}>
          <Text variant="labelSmall" style={styles.macroLabel}>Fibras</Text>
          <Text variant="titleSmall" style={{ color: macroColors.fiber, fontWeight: 'bold' }}>
            {Math.round(currentFiber)}g
          </Text>
          <Text variant="bodySmall" style={styles.macroTarget}>/{targets.daily_fiber}g</Text>
          <ProgressBar progress={fiberPercent} color={macroColors.fiber} style={styles.miniBar} />
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  kcalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  subtext: {
    color: '#64748B',
  },
  kcalNumbers: {
    alignItems: 'flex-end',
  },
  kcalBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroCol: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  macroLabel: {
    color: '#64748B',
    marginBottom: 2,
    fontWeight: '600',
  },
  macroTarget: {
    color: '#94A3B8',
    fontSize: 10,
    marginBottom: 4,
  },
  miniBar: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    backgroundColor: '#F1F5F9',
  },
});
