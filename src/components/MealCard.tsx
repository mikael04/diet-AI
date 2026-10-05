import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, IconButton, Divider, Menu } from 'react-native-paper';
import { MealEntry, MEAL_LABELS, MealType } from '../types';
import { macroColors } from '../theme/theme';

interface MealCardProps {
  meal: MealEntry;
  onAddManual: (mealType: MealType) => void;
  onAddRecipe: (mealType: MealType) => void;
  onCopyYesterday: (mealType: MealType) => void;
  onDeleteItem: (itemId: number) => void;
}

export const MealCard: React.FC<MealCardProps> = ({
  meal,
  onAddManual,
  onAddRecipe,
  onCopyYesterday,
  onDeleteItem,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const title = MEAL_LABELS[meal.meal_type] || meal.meal_type;

  return (
    <Surface style={styles.card} elevation={1}>
      {/* Header da Refeição */}
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <Text variant="titleMedium" style={styles.mealTitle}>
            {title}
          </Text>
          <Text variant="bodySmall" style={styles.kcalBadge}>
            {Math.round(meal.total_kcal)} kcal
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                onCopyYesterday(meal.meal_type);
              }}
              title="Copiar de Ontem"
              leadingIcon="content-copy"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                onAddRecipe(meal.meal_type);
              }}
              title="Adicionar Receita"
              leadingIcon="book-open-outline"
            />
          </Menu>
        </View>
      </View>

      {/* Resumo Rápido dos Macros da Refeição */}
      <View style={styles.macroPills}>
        <Text variant="labelSmall" style={{ color: macroColors.protein, marginRight: 10 }}>
          P: {Math.round(meal.total_protein)}g
        </Text>
        <Text variant="labelSmall" style={{ color: macroColors.carbs, marginRight: 10 }}>
          C: {Math.round(meal.total_carbs)}g
        </Text>
        <Text variant="labelSmall" style={{ color: macroColors.fat, marginRight: 10 }}>
          G: {Math.round(meal.total_fat)}g
        </Text>
        <Text variant="labelSmall" style={{ color: macroColors.fiber }}>
          F: {Math.round(meal.total_fiber)}g
        </Text>
      </View>

      <Divider style={styles.divider} />

      {/* Lista de Alimentos Consumidos */}
      {meal.items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="bodySmall" style={styles.emptyText}>
            Nenhum alimento registrado ainda.
          </Text>
        </View>
      ) : (
        meal.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text variant="bodyMedium" style={styles.itemName}>
                {item.food_name}
              </Text>
              <Text variant="bodySmall" style={styles.itemSubtext}>
                {item.quantity_value} {item.quantity_unit} • {Math.round(item.calculated_kcal)} kcal • P: {Math.round(item.calculated_protein)}g
              </Text>
            </View>
            <IconButton
              icon="delete-outline"
              size={18}
              iconColor="#EF4444"
              onPress={() => onDeleteItem(item.id)}
            />
          </View>
        ))
      )}

      {/* Botões de Ação Rápida */}
      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onAddManual(meal.meal_type)}
        >
          <Text variant="labelMedium" style={styles.actionBtnText}>
            + Manual
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnSecondary}
          onPress={() => onAddRecipe(meal.meal_type)}
        >
          <Text variant="labelMedium" style={styles.actionBtnSecondaryText}>
            + Receita
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnSecondary}
          onPress={() => onCopyYesterday(meal.meal_type)}
        >
          <Text variant="labelMedium" style={styles.actionBtnSecondaryText}>
            Copiar Ontem
          </Text>
        </TouchableOpacity>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTitle: {
    fontWeight: 'bold',
    marginRight: 8,
    color: '#0F172A',
  },
  kcalBadge: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroPills: {
    flexDirection: 'row',
    marginTop: 4,
  },
  divider: {
    marginVertical: 10,
    backgroundColor: '#F1F5F9',
  },
  emptyContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#1E293B',
    fontWeight: '500',
  },
  itemSubtext: {
    color: '#64748B',
  },
  actionsBar: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  actionBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  actionBtnSecondary: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnSecondaryText: {
    color: '#475569',
    fontWeight: '600',
  },
});
