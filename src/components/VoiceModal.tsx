import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Surface, Text, Button, IconButton, Divider } from 'react-native-paper';
import { VoiceRecognitionService } from '../services/voice/VoiceRecognitionService';
import { GeminiService } from '../services/ai/GeminiService';
import { MealActionProcessor } from '../services/nlp/MealActionProcessor';
import { SecureStorageService } from '../services/storage/SecureStorageService';
import { ResolvedMealAction, MealType, MEAL_LABELS } from '../types';
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

  // Animação de pulsação da onda sonora
  const waveAnim1 = useRef(new Animated.Value(1)).current;
  const waveAnim2 = useRef(new Animated.Value(1)).current;
  const countdownTimerRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      startVoiceSession();
    } else {
      stopVoiceSession();
      resetState();
    }
  }, [visible]);

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
    setTextInputFallback('');
    setErrorMessage(null);
    setResolvedAction(null);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
  };

  const startVoiceSession = async () => {
    if (!VoiceRecognitionService.isSpeechAvailable()) {
      setStatus('idle');
      return;
    }

    setStatus('listening');

    await VoiceRecognitionService.startListening({
      onSpeechStart: () => setStatus('listening'),
      onSpeechPartial: (text) => setTranscript(text),
      onSpeechResults: (finalText) => {
        setTranscript(finalText);
        handleProcessTranscript(finalText);
      },
      onError: (err) => {
        console.warn('[VoiceModal] Erro de voz:', err);
        setErrorMessage(err);
        setStatus('idle');
      },
      onSpeechEnd: () => {
        // Se já tiver transcrição mas não tiver disparado
        if (transcript && status === 'listening') {
          handleProcessTranscript(transcript);
        }
      },
    });
  };

  const stopVoiceSession = async () => {
    await VoiceRecognitionService.stopListening();
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Surface style={styles.modalCard} elevation={5}>
          {/* Topo do Modal */}
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.headerTitle}>
              Comando de Voz Diet-AI
            </Text>
            <IconButton icon="close" size={22} onPress={onDismiss} />
          </View>

          <Divider style={styles.divider} />

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
                Ouvindo... Fale agora
              </Text>
              <Text variant="bodySmall" style={styles.exampleText}>
                Ex: "Adicione 150g de frango e 2 ovos no almoço"
              </Text>

              {transcript ? (
                <Surface style={styles.transcriptBox}>
                  <Text variant="bodyMedium" style={styles.liveTranscript}>
                    "{transcript}"
                  </Text>
                </Surface>
              ) : null}

              <Button
                mode="contained"
                style={styles.stopBtn}
                onPress={async () => {
                  if (transcript) {
                    handleProcessTranscript(transcript);
                  } else {
                    await stopVoiceSession();
                  }
                }}
              >
                Concluir Fala
              </Button>
            </View>
          )}

          {/* Estado de Processamento com Gemini */}
          {status === 'processing' && (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0D9488" style={{ marginBottom: 16 }} />
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#0F172A' }}>
                Interpretando com Gemini...
              </Text>
              <Text variant="bodySmall" style={{ color: '#64748B', marginTop: 4 }}>
                Consultando tabela TACO e calculando macros
              </Text>
              {transcript ? (
                <Text variant="bodySmall" style={styles.transcriptionSummary}>
                  "{transcript}"
                </Text>
              ) : null}
            </View>
          )}

          {/* Estado de Pré-visualização da Ação */}
          {status === 'preview' && resolvedAction && (
            <View style={styles.previewContainer}>
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

              {/* Lista dos Itens Mapeados */}
              <View style={styles.itemsList}>
                {resolvedAction.resolved_items.map((item, idx) => (
                  <View key={idx} style={styles.previewItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                        {item.food.name}
                      </Text>
                      <Text variant="bodySmall" style={{ color: '#64748B' }}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text variant="bodyMedium" style={{ color: macroColors.kcal, fontWeight: 'bold' }}>
                        {Math.round(item.calculated_kcal)} kcal
                      </Text>
                      <Text variant="labelSmall" style={{ color: macroColors.protein }}>
                        P: {Math.round(item.calculated_protein)}g
                      </Text>
                    </View>
                  </View>
                ))}
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
                  onPress={() => handleConfirmAction()}
                >
                  Confirmar Agora
                </Button>
              </View>
            </View>
          )}

          {/* Estado Ocioso / Fallback de Digitação de Texto */}
          {status === 'idle' && (
            <View style={styles.idleContainer}>
              {errorMessage && (
                <Surface style={styles.errorBox}>
                  <Text variant="bodySmall" style={styles.errorText}>
                    {errorMessage}
                  </Text>
                </Surface>
              )}

              {VoiceRecognitionService.isSpeechAvailable() ? (
                <Button
                  mode="contained"
                  icon="microphone"
                  style={styles.retryMicBtn}
                  onPress={startVoiceSession}
                >
                  Falar no Microfone
                </Button>
              ) : (
                <Surface style={styles.expoGoBanner} elevation={0}>
                  <Text variant="labelMedium" style={{ fontWeight: 'bold', color: '#0D9488' }}>
                    📱 Modo Expo Go
                  </Text>
                  <Text variant="bodySmall" style={{ color: '#475569', marginTop: 2 }}>
                    Digite seu comando abaixo ou toque em um exemplo rápido:
                  </Text>
                </Surface>
              )}

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
                    style={styles.quickChip}
                    onPress={() => {
                      setTextInputFallback(example);
                      handleProcessTranscript(example);
                    }}
                  >
                    <Text variant="bodySmall" style={styles.quickChipText}>
                      ⚡ {example}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: 2 ovos e 1 fatia de pão no café"
                  value={textInputFallback}
                  onChangeText={setTextInputFallback}
                />
                <IconButton
                  icon="send"
                  mode="contained"
                  containerColor="#0D9488"
                  iconColor="#FFFFFF"
                  onPress={() => handleProcessTranscript(textInputFallback)}
                />
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
  stopBtn: {
    marginTop: 18,
    backgroundColor: '#0D9488',
    borderRadius: 12,
    width: '80%',
  },
  transcriptionSummary: {
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
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
  itemsList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  previewItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
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
