import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, IconButton, Divider, Menu, useTheme } from 'react-native-paper';
import { MealEntry, MEAL_LABELS, MealType, LoggedItem } from '../types';
import { macroColors } from '../theme/theme';

interface MealCardProps {
  meal: MealEntry;
  onAddManual: (mealType: MealType) => void;
  onAddRecipe: (mealType: MealType) => void;
  onCopyYesterday: (mealType: MealType) => void;
  onEditItem: (item: LoggedItem) => void;
  onDeleteItem: (itemId: number) => void;
}

export const MealCard: React.FC<MealCardProps> = ({
  meal,
  onAddManual,
  onAddRecipe,
  onCopyYesterday,
  onEditItem,
  onDeleteItem,
}) => {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const title = MEAL_LABELS[meal.meal_type] || meal.meal_type;

  return (
    <Surface
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.dark ? '#334155' : '#E2E8F0',
          borderWidth: 1,
        },
      ]}
      elevation={1}
    >
      {/* Header da Refeição */}
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <Text variant="titleMedium" style={[styles.mealTitle, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
          <Text
            variant="bodySmall"
            style={[
              styles.kcalBadge,
              {
                backgroundColor: theme.dark ? '#78350F' : '#FEF3C7',
                color: theme.dark ? '#FDE68A' : '#D97706',
              },
            ]}
          >
            {Math.round(meal.total_kcal)} kcal
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            contentStyle={{ backgroundColor: theme.colors.surface }}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                iconColor={theme.colors.onSurfaceVariant}
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
        <Text variant="labelSmall" style={{ color: macroColors.protein, marginRight: 10, fontWeight: '700' }}>
          P: {Math.round(meal.total_protein)}g
        </Text>
        <Text variant="labelSmall" style={{ color: macroColors.carbs, marginRight: 10, fontWeight: '700' }}>
          C: {Math.round(meal.total_carbs)}g
        </Text>
        <Text variant="labelSmall" style={{ color: macroColors.fat, marginRight: 10, fontWeight: '700' }}>
          G: {Math.round(meal.total_fat)}g
        </Text>
        <Text variant="labelSmall" style={{ color: macroColors.fiber, fontWeight: '700' }}>
          F: {Math.round(meal.total_fiber)}g
        </Text>
      </View>

      <Divider style={[styles.divider, { backgroundColor: theme.dark ? '#334155' : '#F1F5F9' }]} />

      {/* Lista de Alimentos Consumidos */}
      {meal.items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="bodySmall" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            Nenhum alimento registrado ainda.
          </Text>
        </View>
      ) : (
        meal.items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemRow}
            onPress={() => onEditItem(item)}
            activeOpacity={0.7}
          >
            <View style={styles.itemInfo}>
              <Text variant="bodyMedium" style={[styles.itemName, { color: theme.colors.onSurface }]}>
                {item.food_name}
              </Text>
              <Text variant="bodySmall" style={[styles.itemSubtext, { color: theme.colors.onSurfaceVariant }]}>
                {item.quantity_value} {item.quantity_unit} • {Math.round(item.calculated_kcal)} kcal • P: {Math.round(item.calculated_protein)}g
              </Text>
            </View>
            <View style={styles.itemActions}>
              <IconButton
                icon="pencil-outline"
                size={18}
                iconColor={theme.colors.onSurfaceVariant}
                onPress={() => onEditItem(item)}
              />
              <IconButton
                icon="delete-outline"
                size={18}
                iconColor="#EF4444"
                onPress={() => onDeleteItem(item.id)}
              />
            </View>
          </TouchableOpacity>
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
          style={[styles.actionBtnSecondary, { backgroundColor: theme.dark ? '#334155' : '#F1F5F9' }]}
          onPress={() => onAddRecipe(meal.meal_type)}
        >
          <Text variant="labelMedium" style={[styles.actionBtnSecondaryText, { color: theme.dark ? '#E2E8F0' : '#475569' }]}>
            + Receita
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtnSecondary, { backgroundColor: theme.dark ? '#334155' : '#F1F5F9' }]}
          onPress={() => onCopyYesterday(meal.meal_type)}
        >
          <Text variant="labelMedium" style={[styles.actionBtnSecondaryText, { color: theme.dark ? '#E2E8F0' : '#475569' }]}>
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
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
