import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { Surface, Text, Button, IconButton, Divider, useTheme } from 'react-native-paper';
import { VoiceRecognitionService } from '../services/voice/VoiceRecognitionService';
import { GeminiService } from '../services/ai/GeminiService';
import { MealActionProcessor } from '../services/nlp/MealActionProcessor';
import { SecureStorageService } from '../services/storage/SecureStorageService';
import { FoodRepository } from '../database/repositories/FoodRepository';
import { ResolvedMealAction, MealType, MEAL_LABELS, FoodItem, VoiceStopMode } from '../types';
import { calculateMacros } from '../utils/nutrition';
import { macroColors } from '../theme/theme';

interface VoiceModalProps {
  visible: boolean;
  currentMealContext?: MealType;
  onDismiss: () => void;
  onActionCompleted: () => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  visible,
  currentMealContext,
  onDismiss,
  onActionCompleted,
}) => {
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'preview'>('idle');
  const [transcript, setTranscript] = useState('');
  const [textInputFallback, setTextInputFallback] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolvedAction, setResolvedAction] = useState<ResolvedMealAction | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Preferências de Voz
  const [stopMode, setStopMode] = useState<VoiceStopMode>('silence');
  const [silenceTimeout, setSilenceTimeout] = useState<number>(5);
  const silenceTimerRef = useRef<any>(null);
  const currentTranscriptRef = useRef<string>('');

  // Estado de Edição/Remoção de Alimento no Preview
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // -1 para novo item
  const [editFood, setEditFood] = useState<FoodItem | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('100');
  const [editUnit, setEditUnit] = useState<string>('g');
  const [foodSearchQuery, setFoodSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearchingFood, setIsSearchingFood] = useState<boolean>(false);

  // Animação de pulsação da onda sonora
  const waveAnim1 = useRef(new Animated.Value(1)).current;
  const waveAnim2 = useRef(new Animated.Value(1)).current;
  const countdownTimerRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      initSession();
    } else {
      stopVoiceSession();
      resetState();
    }
  }, [visible]);

  const initSession = async () => {
    try {
      const [defMode, sm, st] = await Promise.all([
        SecureStorageService.getVoiceDefaultInputMode(),
        SecureStorageService.getVoiceStopMode(),
        SecureStorageService.getVoiceSilenceTimeout(),
      ]);

      setStopMode(sm);
      setSilenceTimeout(st);

      if (defMode === 'voice' && VoiceRecognitionService.isSpeechAvailable()) {
        startVoiceSession(sm, st);
      } else {
        setStatus('idle');
      }
    } catch (e) {
      console.warn('[VoiceModal] Erro ao carregar configurações de voz:', e);
      setStatus('idle');
    }
  };

  useEffect(() => {
    if (status === 'listening') {
      const loop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(waveAnim1, { toValue: 1.35, duration: 600, useNativeDriver: true }),
            Animated.timing(waveAnim1, { toValue: 1.0, duration: 600, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(waveAnim2, { toValue: 1.6, duration: 800, useNativeDriver: true }),
            Animated.timing(waveAnim2, { toValue: 1.0, duration: 800, useNativeDriver: true }),
          ]),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      waveAnim1.setValue(1);
      waveAnim2.setValue(1);
    }
  }, [status]);

  const resetState = () => {
    setStatus('idle');
    setTranscript('');
    currentTranscriptRef.current = '';
    setTextInputFallback('');
    setErrorMessage(null);
    setResolvedAction(null);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setCountdown(null);
    setEditingIndex(null);
    setEditFood(null);
    setFoodSearchQuery('');
    setSearchResults([]);
    setIsSearchingFood(false);
  };

  const startVoiceSession = async (overrideStopMode?: VoiceStopMode, overrideTimeout?: number) => {
    if (!VoiceRecognitionService.isSpeechAvailable()) {
      setStatus('idle');
      setErrorMessage('Reconhecimento de fala direto indisponível neste dispositivo. Digite pelo teclado abaixo.');
      return;
    }

    const sm = overrideStopMode || stopMode;
    const st = overrideTimeout || silenceTimeout;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    setTranscript('');
    currentTranscriptRef.current = '';
    setStatus('listening');
    setErrorMessage(null);

    const resetSilenceTimer = (text: string) => {
      if (sm !== 'silence') return;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (text.trim().length > 0) {
        silenceTimerRef.current = setTimeout(() => {
          handleFinishSpeech();
        }, st * 1000);
      }
    };

    await VoiceRecognitionService.startListening(
      {
        onSpeechStart: () => setStatus('listening'),
        onSpeechPartial: (text) => {
          setTranscript(text);
          currentTranscriptRef.current = text;
          resetSilenceTimer(text);
        },
        onSpeechResults: (finalText) => {
          setTranscript(finalText);
          currentTranscriptRef.current = finalText;
          resetSilenceTimer(finalText);
          // NÃO submete imediatamente para não cortar o usuário durante pausas
        },
        onError: (err) => {
          console.warn('[VoiceModal] Erro de voz:', err);
          if (!currentTranscriptRef.current) {
            setErrorMessage(err);
            setStatus('idle');
          }
        },
        onSpeechEnd: () => {
          if (sm === 'silence' && currentTranscriptRef.current && status === 'listening') {
            resetSilenceTimer(currentTranscriptRef.current);
          }
        },
      },
      {
        continuous: true,
        silenceTimeoutMillis: sm === 'manual' ? 120000 : Math.max(st * 1000, 5000),
      }
    );
  };

  const stopVoiceSession = async () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    await VoiceRecognitionService.stopListening();
  };

  const handleFinishSpeech = async () => {
    const textToProcess = (currentTranscriptRef.current || transcript).trim();
    await stopVoiceSession();
    if (textToProcess) {
      handleProcessTranscript(textToProcess);
    } else {
      setErrorMessage('Nenhuma fala reconhecida. Tente novamente ou use a digitação por teclado.');
      setStatus('idle');
    }
  };

  const handleSwitchToKeyboard = async () => {
    const heardText = (currentTranscriptRef.current || transcript).trim();
    await stopVoiceSession();
    if (heardText) {
      setTextInputFallback(heardText);
    }
    setStatus('idle');
  };

  const handleProcessTranscript = async (textToProcess: string) => {
    const text = textToProcess.trim();
    if (!text) {
      setErrorMessage('Nenhuma fala reconhecida. Tente novamente.');
      setStatus('idle');
      return;
    }

    await stopVoiceSession();
    setStatus('processing');
    setErrorMessage(null);

    try {
      // 1. Envia texto puro ao Gemini para estruturação JSON
      const parsedCommand = await GeminiService.parseVoiceCommand(text, currentMealContext);

      // 2. Mapeia contra a base SQLite local da TACO
      const resolved = await MealActionProcessor.resolveCommand(parsedCommand, text);
      setResolvedAction(resolved);
      setStatus('preview');

      // 3. Verifica se deve disparar contagem regressiva para auto-confirmação
      const autoConfirm = await SecureStorageService.getVoiceAutoConfirm();
      if (autoConfirm) {
        setCountdown(3);
        countdownTimerRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
              handleConfirmAction(resolved);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err: any) {
      console.error('[VoiceModal] Erro no processamento:', err);
      setErrorMessage(err.message || 'Falha ao processar comando com o Gemini.');
      setStatus('idle');
    }
  };

  const handleConfirmAction = async (actionToExecute?: ResolvedMealAction) => {
    const action = actionToExecute || resolvedAction;
    if (!action) return;

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    try {
      await MealActionProcessor.executeAction(action);
      onActionCompleted();
      onDismiss();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar no banco.');
    }
  };

  const handleCancelCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
      setCountdown(null);
    }
  };

  const handleRemoveItem = (indexToRemove: number) => {
    handleCancelCountdown();
    if (!resolvedAction) return;
    const updated = resolvedAction.resolved_items.filter((_, idx) => idx !== indexToRemove);
    setResolvedAction({
      ...resolvedAction,
      resolved_items: updated,
    });
    if (editingIndex === indexToRemove) {
      handleCancelEdit();
    }
  };

  const handleStartEditItem = (idx: number) => {
    handleCancelCountdown();
    if (!resolvedAction) return;
    const item = resolvedAction.resolved_items[idx];
    setEditingIndex(idx);
    setEditFood(item.food);
    setEditQuantity(String(item.quantity));
    setEditUnit(item.unit);
    setFoodSearchQuery('');
    setSearchResults([]);
    setIsSearchingFood(false);
  };

  const handleStartAddItem = () => {
    handleCancelCountdown();
    setEditingIndex(-1);
    setEditFood(null);
    setEditQuantity('100');
    setEditUnit('g');
    setFoodSearchQuery('');
    setSearchResults([]);
    setIsSearchingFood(true);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditFood(null);
    setFoodSearchQuery('');
    setSearchResults([]);
    setIsSearchingFood(false);
  };

  const handleSearchFood = async (query: string) => {
    setFoodSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const results = await FoodRepository.searchFoods(query, 8);
    setSearchResults(results);
  };

  const handleSelectReplacementFood = (food: FoodItem) => {
    setEditFood(food);
    setIsSearchingFood(false);
    setFoodSearchQuery('');
    setSearchResults([]);
    setEditUnit('g');
    setEditQuantity('100');
  };

  const handleSaveItemEdit = () => {
    if (editingIndex === null || !resolvedAction || !editFood) return;
    const qty = parseFloat(editQuantity.replace(',', '.')) || 1;
    const macros = calculateMacros(editFood, qty, editUnit);
    const updatedItems = [...resolvedAction.resolved_items];

    const newItem = {
      food: editFood,
      quantity: qty,
      unit: editUnit,
      calculated_kcal: macros.calculated_kcal,
      calculated_protein: macros.calculated_protein,
      calculated_carbs: macros.calculated_carbs,
      calculated_fat: macros.calculated_fat,
      calculated_fiber: macros.calculated_fiber,
    };

    if (editingIndex === -1) {
      updatedItems.push(newItem);
    } else {
      updatedItems[editingIndex] = newItem;
    }

    setResolvedAction({
      ...resolvedAction,
      resolved_items: updatedItems,
    });
    handleCancelEdit();
  };

  const theme = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Surface style={[styles.modalCard, { backgroundColor: theme.colors.surface }]} elevation={5}>
          {/* Topo do Modal */}
          <View style={styles.header}>
            <Text variant="titleMedium" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              Comando de Voz Diet-AI
            </Text>
            <IconButton icon="close" size={22} iconColor={theme.colors.onSurface} onPress={onDismiss} />
          </View>

          <Divider style={[styles.divider, { backgroundColor: theme.dark ? '#334155' : '#F1F5F9' }]} />

          {/* Área Central / Visualizador de Onda */}
          {status === 'listening' && (
            <View style={styles.centerContainer}>
              <View style={styles.waveWrapper}>
                <Animated.View style={[styles.waveCircleOuter, { transform: [{ scale: waveAnim2 }] }]} />
                <Animated.View style={[styles.waveCircleInner, { transform: [{ scale: waveAnim1 }] }]} />
                <View style={styles.micCircle}>
                  <IconButton icon="microphone" size={38} iconColor="#FFFFFF" />
                </View>
              </View>

              <Text variant="titleSmall" style={styles.listeningText}>
                Ouvindo microfone...
              </Text>
              <Text variant="bodySmall" style={[styles.exampleText, { color: theme.colors.onSurfaceVariant }]}>
                {stopMode === 'manual'
                  ? 'Modo: Parada no clique • Pausas são livres'
                  : `Modo: Pausas de até ${silenceTimeout}s permitidas`}
              </Text>

              {transcript ? (
                <Surface style={[styles.transcriptBox, { backgroundColor: theme.dark ? '#1E293B' : '#F8FAFC', borderColor: theme.dark ? '#334155' : '#E2E8F0' }]}>
                  <Text variant="bodyMedium" style={[styles.liveTranscript, { color: theme.colors.onSurface }]}>
                    "{transcript}"
                  </Text>
                </Surface>
              ) : (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontStyle: 'italic', marginTop: 14 }}>
                  Fale seus alimentos... Ex: "150g de frango e 2 ovos no almoço"
                </Text>
              )}

              <View style={styles.listeningActionButtons}>
                <Button
                  mode="contained"
                  icon="check"
                  buttonColor="#0D9488"
                  style={styles.stopBtn}
                  onPress={handleFinishSpeech}
                >
                  Concluir Fala
                </Button>

                <Button
                  mode="outlined"
                  icon="keyboard"
                  style={[styles.switchModeBtn, { borderColor: theme.dark ? '#334155' : '#CBD5E1' }]}
                  textColor={theme.colors.onSurface}
                  onPress={handleSwitchToKeyboard}
                >
                  Digitar por Teclado
                </Button>
              </View>
            </View>
          )}

          {/* Estado de Processamento com Gemini */}
          {status === 'processing' && (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0D9488" style={{ marginBottom: 16 }} />
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                Interpretando com Gemini...
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                Consultando tabela TACO e calculando macros
              </Text>
              {transcript ? (
                <Text variant="bodySmall" style={[styles.transcriptionSummary, { color: theme.colors.onSurfaceVariant }]}>
                  "{transcript}"
                </Text>
              ) : null}
            </View>
          )}

          {/* Estado de Pré-visualização da Ação */}
          {status === 'preview' && resolvedAction && (
            <ScrollView
              style={styles.previewScrollView}
              contentContainerStyle={styles.previewContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.previewHeader}>
                <Text variant="titleSmall" style={styles.actionBadge}>
                  {resolvedAction.action === 'ADD_ITEMS'
                    ? `Adicionar ao ${MEAL_LABELS[resolvedAction.target_meal]}`
                    : resolvedAction.action === 'COPY_MEAL'
                    ? `Copiar para ${MEAL_LABELS[resolvedAction.target_meal]}`
                    : 'Executar Ação'}
                </Text>
                {countdown !== null && (
                  <Text variant="labelSmall" style={styles.countdownText}>
                    Confirmando em {countdown}s...
                  </Text>
                )}
              </View>

              {/* CARD DE EDIÇÃO / TROCA DE ALIMENTO */}
              {editingIndex !== null ? (
                <Surface style={[styles.editCard, { backgroundColor: theme.dark ? '#1E293B' : '#F8FAFC', borderColor: theme.dark ? '#334155' : '#CBD5E1' }]} elevation={2}>
                  <View style={styles.editCardHeader}>
                    <Text variant="titleSmall" style={[styles.editCardTitle, { color: theme.colors.onSurface }]}>
                      {editingIndex === -1 ? '➕ Adicionar Alimento' : '✏️ Editar Alimento'}
                    </Text>
                    <IconButton
                      icon="close"
                      size={20}
                      iconColor={theme.colors.onSurface}
                      onPress={handleCancelEdit}
                      style={{ margin: 0 }}
                    />
                  </View>

                  {/* Seleção / Troca de Alimento na Base TACO */}
                  {isSearchingFood ? (
                    <View style={styles.searchSection}>
                      <TextInput
                        style={[styles.foodSearchInput, { backgroundColor: theme.dark ? '#0F172A' : '#FFFFFF', color: theme.colors.onSurface, borderColor: theme.dark ? '#334155' : '#CBD5E1' }]}
                        placeholder="Buscar na tabela TACO (ex: frango, arroz)..."
                        placeholderTextColor={theme.dark ? '#94A3B8' : '#64748B'}
                        value={foodSearchQuery}
                        onChangeText={handleSearchFood}
                        autoFocus
                      />
                      {searchResults.length > 0 && (
                        <View style={[styles.searchResultsContainer, { backgroundColor: theme.dark ? '#0F172A' : '#FFFFFF', borderColor: theme.dark ? '#334155' : '#E2E8F0' }]}>
                          {searchResults.map((item) => (
                            <TouchableOpacity
                              key={item.id}
                              style={[styles.searchResultRow, { borderBottomColor: theme.dark ? '#334155' : '#F1F5F9' }]}
                              onPress={() => handleSelectReplacementFood(item)}
                            >
                              <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                                {item.name}
                              </Text>
                              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                {item.kcal_per_100g} kcal / 100g • {item.protein_per_100g}g P
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                      {foodSearchQuery.trim() && searchResults.length === 0 && (
                        <Text variant="bodySmall" style={[styles.noSearchFoundText, { color: theme.colors.onSurfaceVariant }]}>
                          Nenhum alimento encontrado para "{foodSearchQuery}".
                        </Text>
                      )}
                      {editFood && (
                        <Button
                          mode="text"
                          compact
                          onPress={() => setIsSearchingFood(false)}
                          style={{ marginTop: 6 }}
                        >
                          Manter "{editFood.name}"
                        </Button>
                      )}
                    </View>
                  ) : (
                    <View style={styles.selectedFoodSection}>
                      <View style={[styles.selectedFoodInfo, { backgroundColor: theme.dark ? '#0F172A' : '#FFFFFF', borderColor: theme.dark ? '#334155' : '#E2E8F0' }]}>
                        <Text variant="bodyMedium" style={styles.selectedFoodName}>
                          {editFood ? editFood.name : 'Nenhum alimento selecionado'}
                        </Text>
                        <Button
                          mode="outlined"
                          compact
                          icon="swap-horizontal"
                          textColor="#0D9488"
                          onPress={() => setIsSearchingFood(true)}
                          style={styles.swapFoodBtn}
                        >
                          Trocar
                        </Button>
                      </View>
                    </View>
                  )}

                  {/* Quantidade */}
                  <View style={styles.qtyUnitRow}>
                    <View style={{ flex: 1 }}>
                      <Text variant="labelSmall" style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>
                        Quantidade:
                      </Text>
                      <TextInput
                        style={[styles.qtyInput, { backgroundColor: theme.dark ? '#0F172A' : '#FFFFFF', borderColor: theme.dark ? '#334155' : '#CBD5E1', color: theme.colors.onSurface }]}
                        keyboardType="decimal-pad"
                        value={editQuantity}
                        onChangeText={setEditQuantity}
                      />
                    </View>
                  </View>

                  {/* Seletor de Unidades */}
                  <Text variant="labelSmall" style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant, marginTop: 8 }]}>
                    Unidade:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                    {['g', 'unidade', 'colher de sopa', 'fatia', 'scoop', 'ml'].map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[
                          styles.unitChip,
                          { backgroundColor: theme.dark ? '#334155' : '#E2E8F0' },
                          editUnit === u && styles.unitChipSelected,
                        ]}
                        onPress={() => setEditUnit(u)}
                      >
                        <Text
                          style={[
                            styles.unitChipText,
                            { color: theme.dark ? '#CBD5E1' : '#475569' },
                            editUnit === u && styles.unitChipTextSelected,
                          ]}
                        >
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Pré-visualização de Macros Calculados */}
                  {editFood && (
                    <View style={[styles.macrosPreviewBox, { backgroundColor: theme.dark ? '#0F172A' : '#FFFFFF', borderColor: theme.dark ? '#334155' : '#E2E8F0' }]}>
                      {(() => {
                        const m = calculateMacros(
                          editFood,
                          parseFloat(editQuantity.replace(',', '.')) || 0,
                          editUnit
                        );
                        return (
                          <View style={styles.macrosGrid}>
                            <Text style={[styles.macroItem, { color: macroColors.kcal }]}>
                              {Math.round(m.calculated_kcal)} kcal
                            </Text>
                            <Text style={[styles.macroItem, { color: macroColors.protein }]}>
                              P: {Math.round(m.calculated_protein)}g
                            </Text>
                            <Text style={[styles.macroItem, { color: macroColors.carbs }]}>
                              C: {Math.round(m.calculated_carbs)}g
                            </Text>
                            <Text style={[styles.macroItem, { color: macroColors.fat }]}>
                              G: {Math.round(m.calculated_fat)}g
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                  )}

                  {/* Botões do Editor */}
                  <View style={styles.editCardActions}>
                    <Button mode="outlined" compact onPress={handleCancelEdit} style={{ flex: 1 }}>
                      Cancelar
                    </Button>
                    <Button
                      mode="contained"
                      compact
                      disabled={!editFood}
                      onPress={handleSaveItemEdit}
                      style={{ flex: 1, backgroundColor: '#0D9488' }}
                    >
                      Salvar
                    </Button>
                  </View>
                </Surface>
              ) : null}

              {/* LISTA DOS ITENS MAPEADOS */}
              <View style={[styles.itemsList, { backgroundColor: theme.dark ? '#1E293B' : '#F8FAFC' }]}>
                {resolvedAction.resolved_items.length === 0 ? (
                  <View style={styles.emptyItemsBox}>
                    <Text variant="bodyMedium" style={[styles.emptyItemsText, { color: theme.colors.onSurfaceVariant }]}>
                      Nenhum alimento na lista no momento.
                    </Text>
                  </View>
                ) : (
                  resolvedAction.resolved_items.map((item, idx) => (
                    <View key={idx} style={[styles.previewItemRow, { borderBottomColor: theme.dark ? '#334155' : '#E2E8F0' }]}>
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => handleStartEditItem(idx)}
                      >
                        <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                          {item.food.name}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {item.quantity} {item.unit}
                        </Text>
                      </TouchableOpacity>

                      <View style={{ alignItems: 'flex-end', justifyContent: 'center', marginRight: 4 }}>
                        <Text variant="bodyMedium" style={{ color: macroColors.kcal, fontWeight: 'bold' }}>
                          {Math.round(item.calculated_kcal)} kcal
                        </Text>
                        <Text variant="labelSmall" style={{ color: macroColors.protein }}>
                          P: {Math.round(item.calculated_protein)}g
                        </Text>
                      </View>

                      {/* Botão Editar Alimento */}
                      <IconButton
                        icon="pencil-outline"
                        size={19}
                        iconColor="#0D9488"
                        style={{ margin: 0 }}
                        onPress={() => handleStartEditItem(idx)}
                      />

                      {/* Botão Remover Alimento */}
                      <IconButton
                        icon="trash-can-outline"
                        size={19}
                        iconColor="#EF4444"
                        style={{ margin: 0 }}
                        onPress={() => handleRemoveItem(idx)}
                      />
                    </View>
                  ))
                )}

                {/* Botão Adicionar Alimento */}
                {editingIndex === null && (
                  <Button
                    mode="text"
                    icon="plus"
                    textColor="#0D9488"
                    style={styles.addMoreBtn}
                    onPress={handleStartAddItem}
                  >
                    Adicionar outro alimento
                  </Button>
                )}
              </View>

              {/* Botões de Decisão */}
              <View style={styles.previewActions}>
                <Button
                  mode="outlined"
                  style={styles.cancelBtn}
                  onPress={() => {
                    handleCancelCountdown();
                    onDismiss();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  style={styles.confirmBtn}
                  disabled={resolvedAction.resolved_items.length === 0}
                  onPress={() => handleConfirmAction()}
                >
                  Confirmar Agora
                </Button>
              </View>
            </ScrollView>
          )}

          {/* Estado Ocioso / Fallback de Digitação de Texto */}
          {status === 'idle' && (
            <View style={styles.idleContainer}>
              {errorMessage && (
                <Surface style={[styles.errorBox, { backgroundColor: theme.dark ? '#7F1D1D' : '#FEF2F2' }]}>
                  <Text variant="bodySmall" style={[styles.errorText, { color: theme.dark ? '#FCA5A5' : '#DC2626' }]}>
                    {errorMessage}
                  </Text>
                </Surface>
              )}

              {VoiceRecognitionService.isSpeechAvailable() ? (
                <Button
                  mode="contained"
                  icon="microphone"
                  buttonColor="#0D9488"
                  style={styles.retryMicBtn}
                  onPress={() => startVoiceSession()}
                >
                  Falar Diretamente no Microfone
                </Button>
              ) : (
                <Surface style={[styles.expoGoBanner, { backgroundColor: theme.dark ? '#134E4A' : '#CCFBF1' }]} elevation={0}>
                  <Text variant="labelMedium" style={{ fontWeight: 'bold', color: theme.dark ? '#5EEAD4' : '#0D9488' }}>
                    📱 Modo Expo Go
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.dark ? '#CCFBF1' : '#475569', marginTop: 2 }}>
                    Digite seu comando abaixo ou use o microfone do seu teclado:
                  </Text>
                </Surface>
              )}

              <Text variant="labelSmall" style={[styles.orText, { color: theme.colors.onSurfaceVariant }]}>
                {VoiceRecognitionService.isSpeechAvailable()
                  ? 'Ou digite / use o microfone do seu teclado:'
                  : 'Digite ou use o microfone do seu teclado:'}
              </Text>

              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.dark ? '#1E293B' : '#F1F5F9',
                      color: theme.colors.onSurface,
                      borderColor: theme.dark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  placeholder="Ex: 2 ovos e 1 fatia de pão no café"
                  placeholderTextColor={theme.dark ? '#94A3B8' : '#64748B'}
                  value={textInputFallback}
                  onChangeText={setTextInputFallback}
                  multiline
                />
                <IconButton
                  icon="send"
                  mode="contained"
                  containerColor="#0D9488"
                  iconColor="#FFFFFF"
                  disabled={!textInputFallback.trim()}
                  onPress={() => handleProcessTranscript(textInputFallback)}
                />
              </View>

              {/* Chips de Exemplos Rápidos */}
              <View style={styles.quickChipsContainer}>
                {[
                  '150g de peito de frango e 2 ovos no almoço',
                  '1 pão francês e 1 café no café da manhã',
                  '1 scoop de whey com 30g de aveia',
                  '1 concha de feijão e 4 colheres de arroz',
                ].map((example, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.quickChip, { backgroundColor: theme.dark ? '#1E293B' : '#F1F5F9' }]}
                    onPress={() => {
                      setTextInputFallback(example);
                      handleProcessTranscript(example);
                    }}
                  >
                    <Text variant="bodySmall" style={[styles.quickChipText, { color: theme.dark ? '#2DD4BF' : '#0D9488' }]}>
                      ⚡ {example}
                    </Text>
                  </TouchableOpacity>
                ))}
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 380,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  divider: {
    marginVertical: 10,
    backgroundColor: '#F1F5F9',
  },
  centerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  waveWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  waveCircleOuter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
  },
  waveCircleInner: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(13, 148, 136, 0.3)',
  },
  micCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  listeningText: {
    fontWeight: 'bold',
    color: '#0D9488',
  },
  exampleText: {
    color: '#64748B',
    marginTop: 4,
  },
  transcriptBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  liveTranscript: {
    color: '#0F172A',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  listeningActionButtons: {
    width: '100%',
    marginTop: 18,
    gap: 10,
    alignItems: 'center',
  },
  stopBtn: {
    backgroundColor: '#0D9488',
    borderRadius: 12,
    width: '85%',
  },
  switchModeBtn: {
    borderRadius: 12,
    width: '85%',
    borderWidth: 1,
  },
  transcriptionSummary: {
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  previewScrollView: {
    maxHeight: 520,
  },
  previewContainer: {
    paddingVertical: 10,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionBadge: {
    fontWeight: 'bold',
    color: '#0D9488',
  },
  countdownText: {
    color: '#D97706',
    fontWeight: '600',
  },
  editCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  editCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  editCardTitle: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  searchSection: {
    marginBottom: 10,
  },
  foodSearchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#0F172A',
    fontSize: 14,
  },
  searchResultsContainer: {
    maxHeight: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
  },
  searchResultRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  noSearchFoundText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  selectedFoodSection: {
    marginBottom: 10,
  },
  selectedFoodInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedFoodName: {
    flex: 1,
    fontWeight: 'bold',
    color: '#0D9488',
    marginRight: 8,
  },
  swapFoodBtn: {
    borderColor: '#0D9488',
  },
  qtyUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fieldLabel: {
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '600',
  },
  qtyInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
    width: 120,
  },
  unitScroll: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    marginRight: 6,
  },
  unitChipSelected: {
    backgroundColor: '#0D9488',
  },
  unitChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  unitChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  macrosPreviewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  editCardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  itemsList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  emptyItemsBox: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyItemsText: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  previewItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  addMoreBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderColor: '#94A3B8',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#0D9488',
  },
  idleContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    width: '100%',
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
  },
  retryMicBtn: {
    backgroundColor: '#0D9488',
    width: '100%',
    borderRadius: 12,
    marginBottom: 14,
  },
  orText: {
    color: '#64748B',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#0F172A',
  },
  expoGoBanner: {
    backgroundColor: '#CCFBF1',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 12,
  },
  quickChipsContainer: {
    width: '100%',
    marginBottom: 14,
    gap: 6,
  },
  quickChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickChipText: {
    color: '#0D9488',
    fontWeight: '600',
  },
});
