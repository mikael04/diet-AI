import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Surface, Text, SegmentedButtons, useTheme, Divider } from 'react-native-paper';
import { DailyLogRepository } from '../database/repositories/DailyLogRepository';
import { DayHistorySummary, NutritionTargets } from '../types';
import { macroColors } from '../theme/theme';
import { formatDate } from '../utils/nutrition';

interface HistoryAnalyticsViewProps {
  targets: NutritionTargets;
}

export const HistoryAnalyticsView: React.FC<HistoryAnalyticsViewProps> = ({ targets }) => {
  const theme = useTheme();
  const [daysCount, setDaysCount] = useState<'7' | '15' | '30'>('7');
  const [viewMode, setViewMode] = useState<'cards' | 'charts'>('cards');
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<DayHistorySummary[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayHistorySummary | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const count = parseInt(daysCount, 10) as 7 | 15 | 30;
      const data = await DailyLogRepository.getHistorySummaries(count);
      setHistory(data);
      if (data.length > 0) {
        setSelectedDay(data[data.length - 1]);
      }
    } catch (err) {
      console.error('[HistoryAnalyticsView] Erro ao carregar histórico:', err);
    } finally {
      setLoading(false);
    }
  }, [daysCount]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const todayStr = formatDate();

  // Estatísticas do período
  const activeDays = history.filter((h) => h.total_kcal > 0 || h.items_count > 0);
  const avgKcal = activeDays.length > 0
    ? Math.round(activeDays.reduce((acc, h) => acc + h.total_kcal, 0) / activeDays.length)
    : 0;
  const avgProtein = activeDays.length > 0
    ? Math.round(activeDays.reduce((acc, h) => acc + h.total_protein, 0) / activeDays.length)
    : 0;

  // Estatísticas de Peso
  const daysWithWeight = history.filter((h) => h.weight_kg !== null && h.weight_kg !== undefined);
  const firstWeight = daysWithWeight.length > 0 ? daysWithWeight[0].weight_kg! : null;
  const latestWeight = daysWithWeight.length > 0 ? daysWithWeight[daysWithWeight.length - 1].weight_kg! : null;
  const weightDelta = firstWeight !== null && latestWeight !== null && daysWithWeight.length > 1
    ? (latestWeight - firstWeight).toFixed(1)
    : null;

  const formatDateDisplay = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    if (dateStr === todayStr) return 'Hoje';
    const dayOfWeek = new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('pt-BR', { weekday: 'short' });
    return `${dayOfWeek.replace('.', '')}, ${d}/${m}`;
  };

  // Cálculo para o gráfico de barras de Calorias
  const maxKcalValue = Math.max(
    targets.daily_kcal * 1.15,
    ...history.map((h) => h.total_kcal),
    1000
  );
  const chartHeight = 160;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Controles de Filtro: Período e Modo */}
      <Surface style={[styles.filterCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <SegmentedButtons
          value={daysCount}
          onValueChange={(v) => setDaysCount(v as '7' | '15' | '30')}
          buttons={[
            { value: '7', label: '7 Dias' },
            { value: '15', label: '15 Dias' },
            { value: '30', label: '30 Dias' },
          ]}
          style={styles.segmented}
        />
        <View style={{ height: 10 }} />
        <SegmentedButtons
          value={viewMode}
          onValueChange={(v) => setViewMode(v as 'cards' | 'charts')}
          buttons={[
            { value: 'cards', label: 'Cards / Tabela', icon: 'view-agenda-outline' },
            { value: 'charts', label: 'Gráficos', icon: 'chart-bar' },
          ]}
          style={styles.segmented}
        />
      </Surface>

      {/* Cartões de Indicadores Médios do Período */}
      <View style={styles.metricsRow}>
        <Surface style={[styles.metricCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600' }}>
            MÉDIA CALORIAS
          </Text>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', color: macroColors.kcal, marginTop: 4 }}>
            {avgKcal} kcal
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Meta: {targets.daily_kcal} kcal
          </Text>
        </Surface>

        <Surface style={[styles.metricCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600' }}>
            MÉDIA PROTEÍNA
          </Text>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', color: macroColors.protein, marginTop: 4 }}>
            {avgProtein}g
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Meta: {targets.daily_protein}g
          </Text>
        </Surface>

        <Surface style={[styles.metricCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600' }}>
            PESO ATUAL
          </Text>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#059669', marginTop: 4 }}>
            {latestWeight !== null ? `${latestWeight} kg` : '--'}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {weightDelta !== null ? `${Number(weightDelta) > 0 ? '+' : ''}${weightDelta} kg` : 'Sem variação'}
          </Text>
        </Surface>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0D9488" />
          <Text variant="bodyMedium" style={{ marginTop: 12, color: theme.colors.onSurfaceVariant }}>
            Calculando série temporal...
          </Text>
        </View>
      ) : viewMode === 'charts' ? (
        /* MODO GRÁFICO (Pure React Native) */
        <View style={styles.chartsContainer}>
          {/* Gráfico de Barras de Calorias */}
          <Surface style={[styles.chartCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <View style={styles.chartHeader}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                Consumo de Calorias vs Meta
              </Text>
              <View style={styles.targetLegend}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Meta ({targets.daily_kcal} kcal)
                </Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
              <View style={[styles.plotArea, { height: chartHeight + 35 }]}>
                {/* Linha de Referência da Meta */}
                <View
                  style={[
                    styles.targetLine,
                    {
                      bottom: (targets.daily_kcal / maxKcalValue) * chartHeight + 25,
                      borderColor: '#F59E0B',
                    },
                  ]}
                />

                {/* Colunas do Gráfico */}
                <View style={styles.barsRow}>
                  {history.map((day) => {
                    const barHeight = Math.max(
                      (day.total_kcal / maxKcalValue) * chartHeight,
                      day.total_kcal > 0 ? 6 : 2
                    );
                    const isOver = day.total_kcal > targets.daily_kcal * 1.05;
                    const isSelected = selectedDay?.date === day.date;
                    const barColor = day.total_kcal === 0
                      ? (theme.dark ? '#334155' : '#E2E8F0')
                      : isOver
                      ? '#EF4444'
                      : '#0D9488';

                    return (
                      <TouchableOpacity
                        key={day.date}
                        style={styles.barColumn}
                        onPress={() => setSelectedDay(day)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.barWrapper}>
                          <View
                            style={[
                              styles.bar,
                              {
                                height: barHeight,
                                backgroundColor: barColor,
                                borderWidth: isSelected ? 2 : 0,
                                borderColor: theme.colors.onSurface,
                              },
                            ]}
                          />
                        </View>
                        <Text
                          variant="labelSmall"
                          style={[
                            styles.barDateLabel,
                            {
                              color: isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant,
                              fontWeight: isSelected ? 'bold' : 'normal',
                            },
                          ]}
                        >
                          {day.date.slice(8, 10)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Detalhe do Dia Selecionado no Gráfico */}
            {selectedDay && (
              <Surface
                style={[
                  styles.selectedDayDetail,
                  { backgroundColor: theme.dark ? '#1E293B' : '#F8FAFC' },
                ]}
                elevation={1}
              >
                <View style={styles.selectedDayHeader}>
                  <Text variant="titleSmall" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                    {formatDateDisplay(selectedDay.date)} ({selectedDay.date})
                  </Text>
                  {selectedDay.weight_kg !== null && (
                    <Text variant="labelMedium" style={{ color: '#059669', fontWeight: 'bold' }}>
                      ⚖️ {selectedDay.weight_kg} kg
                    </Text>
                  )}
                </View>

                <View style={styles.detailMacrosRow}>
                  <Text variant="bodySmall" style={{ color: macroColors.kcal, fontWeight: '700' }}>
                    {selectedDay.total_kcal} kcal
                  </Text>
                  <Text variant="bodySmall" style={{ color: macroColors.protein, fontWeight: '700' }}>
                    P: {selectedDay.total_protein}g
                  </Text>
                  <Text variant="bodySmall" style={{ color: macroColors.carbs, fontWeight: '700' }}>
                    C: {selectedDay.total_carbs}g
                  </Text>
                  <Text variant="bodySmall" style={{ color: macroColors.fat, fontWeight: '700' }}>
                    G: {selectedDay.total_fat}g
                  </Text>
                  {selectedDay.water_ml > 0 && (
                    <Text variant="bodySmall" style={{ color: '#0284C7', fontWeight: '700' }}>
                      💧 {selectedDay.water_ml}ml
                    </Text>
                  )}
                </View>
              </Surface>
            )}
          </Surface>

          {/* Gráfico / Evolução do Peso Corporal */}
          <Surface style={[styles.chartCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <View style={styles.chartHeader}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                Evolução do Peso Corporal
              </Text>
              <Text variant="labelSmall" style={{ color: '#059669', fontWeight: 'bold' }}>
                {daysWithWeight.length} registros
              </Text>
            </View>

            {daysWithWeight.length === 0 ? (
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  textAlign: 'center',
                  marginVertical: 20,
                }}
              >
                Nenhum peso registrado neste período.{'\n'}
                Toque no ícone da balança no topo para registrar o peso do dia.
              </Text>
            ) : (
              <View style={styles.weightTimeline}>
                {daysWithWeight.map((wDay, idx) => (
                  <View key={wDay.date} style={styles.weightPointRow}>
                    <View style={styles.weightDateCol}>
                      <Text variant="labelMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                        {formatDateDisplay(wDay.date)}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {wDay.date}
                      </Text>
                    </View>
                    <View style={styles.weightBadgeWrapper}>
                      <Text variant="titleSmall" style={{ color: '#059669', fontWeight: 'bold' }}>
                        {wDay.weight_kg} kg
                      </Text>
                      {idx > 0 && (
                        <Text
                          variant="labelSmall"
                          style={{
                            color:
                              wDay.weight_kg! - daysWithWeight[idx - 1].weight_kg! <= 0
                                ? '#059669'
                                : '#EF4444',
                            fontWeight: '600',
                          }}
                        >
                          {wDay.weight_kg! - daysWithWeight[idx - 1].weight_kg! > 0 ? '+' : ''}
                          {(wDay.weight_kg! - daysWithWeight[idx - 1].weight_kg!).toFixed(1)} kg
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Surface>
        </View>
      ) : (
        /* MODO CARDS / TABELA */
        <View style={styles.cardsList}>
          {history
            .slice()
            .reverse()
            .map((day) => {
              const kcalPercent = Math.min(Math.round((day.total_kcal / targets.daily_kcal) * 100), 100);
              const isOverTarget = day.total_kcal > targets.daily_kcal * 1.05;

              return (
                <Surface
                  key={day.date}
                  style={[styles.dayCard, { backgroundColor: theme.colors.surface }]}
                  elevation={1}
                >
                  {/* Topo do Card Diário */}
                  <View style={styles.dayCardHeader}>
                    <View>
                      <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                        {formatDateDisplay(day.date)}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {day.date} • {day.items_count} alimentos registrados
                      </Text>
                    </View>

                    {day.weight_kg !== null && (
                      <View
                        style={[
                          styles.weightTag,
                          {
                            backgroundColor: theme.dark ? '#064E3B' : '#ECFDF5',
                            borderColor: theme.dark ? '#059669' : '#A7F3D0',
                          },
                        ]}
                      >
                        <Text variant="labelSmall" style={{ color: '#059669', fontWeight: 'bold' }}>
                          ⚖️ {day.weight_kg} kg
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Barra de Progresso de Calorias */}
                  <View style={styles.kcalRow}>
                    <Text variant="labelMedium" style={{ color: macroColors.kcal, fontWeight: 'bold' }}>
                      {day.total_kcal} / {targets.daily_kcal} kcal ({kcalPercent}%)
                    </Text>
                    {day.water_ml > 0 && (
                      <Text variant="labelSmall" style={{ color: '#0284C7', fontWeight: '600' }}>
                        💧 {day.water_ml} ml
                      </Text>
                    )}
                  </View>

                  <View style={[styles.progressTrack, { backgroundColor: theme.dark ? '#334155' : '#E2E8F0' }]}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${kcalPercent}%`,
                          backgroundColor: isOverTarget ? '#EF4444' : '#0D9488',
                        },
                      ]}
                    />
                  </View>

                  <Divider style={[styles.divider, { backgroundColor: theme.dark ? '#334155' : '#F1F5F9' }]} />

                  {/* Macronutrientes do Dia */}
                  <View style={styles.macrosBadgesRow}>
                    <View style={styles.macroItem}>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Proteína
                      </Text>
                      <Text variant="labelMedium" style={{ color: macroColors.protein, fontWeight: 'bold' }}>
                        {day.total_protein}g
                      </Text>
                    </View>

                    <View style={styles.macroItem}>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Carboidratos
                      </Text>
                      <Text variant="labelMedium" style={{ color: macroColors.carbs, fontWeight: 'bold' }}>
                        {day.total_carbs}g
                      </Text>
                    </View>

                    <View style={styles.macroItem}>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Gorduras
                      </Text>
                      <Text variant="labelMedium" style={{ color: macroColors.fat, fontWeight: 'bold' }}>
                        {day.total_fat}g
                      </Text>
                    </View>

                    <View style={styles.macroItem}>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Fibras
                      </Text>
                      <Text variant="labelMedium" style={{ color: macroColors.fiber, fontWeight: 'bold' }}>
                        {day.total_fiber}g
                      </Text>
                    </View>
                  </View>
                </Surface>
              );
            })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  filterCard: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 14,
  },
  segmented: {
    marginVertical: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  centerLoading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartsContainer: {
    gap: 14,
  },
  chartCard: {
    padding: 16,
    borderRadius: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  targetLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  plotArea: {
    minWidth: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
    zIndex: 1,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    paddingBottom: 25,
    gap: 8,
  },
  barColumn: {
    alignItems: 'center',
    width: 28,
  },
  barWrapper: {
    height: 160,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  bar: {
    width: 18,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  barDateLabel: {
    marginTop: 6,
    fontSize: 10,
  },
  selectedDayDetail: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
  },
  selectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailMacrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weightTimeline: {
    marginTop: 8,
    gap: 10,
  },
  weightPointRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  weightDateCol: {
    flex: 1,
  },
  weightBadgeWrapper: {
    alignItems: 'flex-end',
  },
  cardsList: {
    gap: 12,
  },
  dayCard: {
    padding: 16,
    borderRadius: 16,
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  weightTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  kcalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  divider: {
    marginVertical: 12,
  },
  macrosBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
  },
});
