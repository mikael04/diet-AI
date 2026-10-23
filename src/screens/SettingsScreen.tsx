import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import {
  Surface,
  Text,
  Button,
  IconButton,
  SegmentedButtons,
  Switch,
  Divider,
  Chip,
  useTheme,
} from 'react-native-paper';
import { SecureStorageService } from '../services/storage/SecureStorageService';
import { GeminiService } from '../services/ai/GeminiService';
import { ExportService, ExportSummary } from '../services/export/ExportService';
import { useAppTheme } from '../context/ThemeContext';
import { NutritionTargets, VoiceInputMode, VoiceStopMode } from '../types';

export const SettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const theme = useTheme();
  const { themeMode, setThemeMode } = useAppTheme();
  const [provider, setProvider] = useState<'gemini' | 'openai'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState('gemini-3.8-flash');
  const [openAiEndpoint, setOpenAiEndpoint] = useState('https://api.openai.com/v1');
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [voiceDefaultInputMode, setVoiceDefaultInputMode] = useState<VoiceInputMode>('keyboard');
  const [voiceStopMode, setVoiceStopMode] = useState<VoiceStopMode>('silence');
  const [voiceSilenceTimeout, setVoiceSilenceTimeout] = useState<number>(5);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Exportação e Importação
  const [exportingType, setExportingType] = useState<'json' | 'meals_csv' | 'custom_csv' | null>(null);
  const [importing, setImporting] = useState(false);
  const [exportSummary, setExportSummary] = useState<ExportSummary | null>(null);

  // Metas nutricionais
  const [kcal, setKcal] = useState('2200');
  const [protein, setProtein] = useState('160');
  const [carbs, setCarbs] = useState('220');
  const [fat, setFat] = useState('65');
  const [fiber, setFiber] = useState('30');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const [p, k, m, ep, ac, t, summary, vDim, vSm, vSt] = await Promise.all([
      SecureStorageService.getAiProvider(),
      SecureStorageService.getGeminiApiKey(),
      SecureStorageService.getAiModel(),
      SecureStorageService.getOpenAiEndpoint(),
      SecureStorageService.getVoiceAutoConfirm(),
      SecureStorageService.getNutritionTargets(),
      ExportService.getExportSummary(),
      SecureStorageService.getVoiceDefaultInputMode(),
      SecureStorageService.getVoiceStopMode(),
      SecureStorageService.getVoiceSilenceTimeout(),
    ]);

    const activeModel = (!m || m === 'gemini-2.5-flash') ? 'gemini-3.8-flash' : m;
    setProvider(p);
    setApiKey(k || '');
    setModel(activeModel);
    setOpenAiEndpoint(ep);
    setAutoConfirm(ac);
    setVoiceDefaultInputMode(vDim);
    setVoiceStopMode(vSm);
    setVoiceSilenceTimeout(vSt);
    setExportSummary(summary);

    setKcal(t.daily_kcal.toString());
    setProtein(t.daily_protein.toString());
    setCarbs(t.daily_carbs.toString());
    setFat(t.daily_fat.toString());
    setFiber(t.daily_fiber.toString());
  };

  const handleExportJson = async () => {
    setExportingType('json');
    const res = await ExportService.exportAllDataJson();
    setExportingType(null);
    if (!res.success) {
      Alert.alert('Exportação', res.message);
    }
  };

  const handleExportMealsCsv = async () => {
    setExportingType('meals_csv');
    const res = await ExportService.exportMealsCsv();
    setExportingType(null);
    if (!res.success) {
      Alert.alert('Exportação', res.message);
    }
  };

  const handleExportCustomCsv = async () => {
    setExportingType('custom_csv');
    const res = await ExportService.exportCustomFoodsAndRecipesCsv();
    setExportingType(null);
    if (!res.success) {
      Alert.alert('Exportação', res.message);
    }
  };

  const handleImportBackup = async () => {
    Alert.alert(
      'Importar Backup',
      'Deseja selecionar um arquivo JSON de backup para importar? Os dados serão mesclados com o seu histórico atual sem apagar seus registros existentes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Selecionar Arquivo',
          onPress: async () => {
            setImporting(true);
            const res = await ExportService.pickAndImportBackupJson();
            setImporting(false);

            if (res.canceled) return;

            if (res.success) {
              Alert.alert('Sucesso', res.message);
              await loadSettings();
            } else {
              Alert.alert('Erro na Importação', res.message);
            }
          },
        },
      ]
    );
  };

  const handleSaveSettings = async () => {
    const targets: NutritionTargets = {
      daily_kcal: parseFloat(kcal) || 2000,
      daily_protein: parseFloat(protein) || 150,
      daily_carbs: parseFloat(carbs) || 200,
      daily_fat: parseFloat(fat) || 60,
      daily_fiber: parseFloat(fiber) || 30,
    };

    await Promise.all([
      SecureStorageService.setAiProvider(provider),
      SecureStorageService.setGeminiApiKey(apiKey),
      SecureStorageService.setAiModel(model),
      SecureStorageService.setOpenAiEndpoint(openAiEndpoint),
      SecureStorageService.setVoiceAutoConfirm(autoConfirm),
      SecureStorageService.setNutritionTargets(targets),
      SecureStorageService.setVoiceDefaultInputMode(voiceDefaultInputMode),
      SecureStorageService.setVoiceStopMode(voiceStopMode),
      SecureStorageService.setVoiceSilenceTimeout(voiceSilenceTimeout),
    ]);

    Alert.alert('Sucesso', 'Configurações salvas com sucesso!');
    onBack();
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);

    // Salva temporariamente para testar
    await SecureStorageService.setAiProvider(provider);
    await SecureStorageService.setGeminiApiKey(apiKey);
    await SecureStorageService.setAiModel(model);

    const res = await GeminiService.testConnection();
    setTestingConnection(false);
    setTestResult(res.message);
  };

  const inputDynamicStyle = {
    backgroundColor: theme.dark ? '#1E293B' : '#F1F5F9',
    borderColor: theme.dark ? '#334155' : '#CBD5E1',
    borderWidth: 1,
    color: theme.colors.onSurface,
  };
  const placeholderColor = theme.dark ? '#94A3B8' : '#64748B';
  const cardBorder = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.dark ? '#334155' : '#E2E8F0',
    borderWidth: 1,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon="arrow-left" size={24} iconColor={theme.colors.onSurface} onPress={onBack} />
          <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
            Configurações
          </Text>
        </View>
        <Button mode="contained" buttonColor="#0D9488" onPress={handleSaveSettings}>
          Salvar
        </Button>
      </Surface>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Seção 0: Aparência e Modo Escuro */}
        <Surface style={[styles.section, cardBorder]} elevation={1}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            🌓 Aparência do Aplicativo
          </Text>
          <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Escolha o tema visual do aplicativo.
          </Text>
          <SegmentedButtons
            value={themeMode}
            onValueChange={(val) => setThemeMode(val as any)}
            buttons={[
              { value: 'light', label: 'Claro', icon: 'white-balance-sunny' },
              { value: 'dark', label: 'Escuro', icon: 'moon-waning-crescent' },
              { value: 'system', label: 'Sistema', icon: 'cellphone' },
            ]}
            style={{ marginTop: 10 }}
          />
        </Surface>

        {/* Seção 1: Inteligência Artificial */}
        <Surface style={[styles.section, cardBorder]} elevation={1}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Inteligência Artificial (LLM)
          </Text>
          <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Processamento de linguagem natural dos comandos de voz.
          </Text>

          <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            Provedor de IA
          </Text>
          <SegmentedButtons
            value={provider}
            onValueChange={(val) => setProvider(val as 'gemini' | 'openai')}
            buttons={[
              { value: 'gemini', label: 'Google Gemini' },
              { value: 'openai', label: 'OpenAI / Outros' },
            ]}
            style={{ marginBottom: 14 }}
          />

          <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            Chave de API (API Key)
          </Text>
          <View style={[styles.apiKeyRow, { backgroundColor: theme.dark ? '#1E293B' : '#F1F5F9', borderColor: theme.dark ? '#334155' : '#CBD5E1', borderWidth: 1 }]}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0, backgroundColor: 'transparent', color: theme.colors.onSurface }]}
              placeholder="Cole sua chave aqui"
              placeholderTextColor={placeholderColor}
              secureTextEntry={!showKey}
              value={apiKey}
              onChangeText={setApiKey}
            />
            <IconButton
              icon={showKey ? 'eye-off' : 'eye'}
              size={20}
              iconColor={theme.colors.onSurfaceVariant}
              onPress={() => setShowKey(!showKey)}
            />
          </View>

          <Text variant="labelMedium" style={[styles.label, { marginTop: 12, color: theme.colors.onSurfaceVariant }]}>
            Modelo Selecionado
          </Text>
          {provider === 'gemini' && (
            <View style={styles.chipRow}>
              <Chip
                selected={model === 'gemini-3.8-flash'}
                onPress={() => setModel('gemini-3.8-flash')}
                style={[
                  styles.chip,
                  { backgroundColor: theme.dark ? '#334155' : '#F1F5F9' },
                  model === 'gemini-3.8-flash' && { backgroundColor: theme.dark ? '#134E4A' : '#CCFBF1' },
                ]}
                textStyle={{ fontSize: 12, color: theme.colors.onSurface }}
              >
                gemini-3.8-flash (Recomendado)
              </Chip>
              <Chip
                selected={model === 'gemini-3.5-flash-lite'}
                onPress={() => setModel('gemini-3.5-flash-lite')}
                style={[
                  styles.chip,
                  { backgroundColor: theme.dark ? '#334155' : '#F1F5F9' },
                  model === 'gemini-3.5-flash-lite' && { backgroundColor: theme.dark ? '#134E4A' : '#CCFBF1' },
                ]}
                textStyle={{ fontSize: 12, color: theme.colors.onSurface }}
              >
                gemini-3.5-flash-lite (Rápido)
              </Chip>
            </View>
          )}
          <TextInput
            style={[styles.input, inputDynamicStyle]}
            placeholder="ex: gemini-3.8-flash ou gemini-3.5-flash-lite"
            placeholderTextColor={placeholderColor}
            value={model}
            onChangeText={setModel}
          />

          {provider === 'openai' && (
            <>
              <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                Endpoint Customizado
              </Text>
              <TextInput
                style={[styles.input, inputDynamicStyle]}
                placeholder="https://api.openai.com/v1"
                placeholderTextColor={placeholderColor}
                value={openAiEndpoint}
                onChangeText={setOpenAiEndpoint}
              />
            </>
          )}

          <Button
            mode="outlined"
            style={{ marginTop: 8 }}
            loading={testingConnection}
            onPress={handleTestConnection}
          >
            Testar Conexão com IA
          </Button>

          {testResult ? (
            <Text
              variant="bodySmall"
              style={{
                marginTop: 8,
                textAlign: 'center',
                color: testResult.includes('sucesso') ? '#10B981' : '#EF4444',
              }}
            >
              {testResult}
            </Text>
          ) : null}
        </Surface>

        {/* Seção 2: Metas Nutricionais Diárias */}
        <Surface style={[styles.section, cardBorder]} elevation={1}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Metas Nutricionais Diárias
          </Text>
          <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Ajuste suas calorias e macronutrientes recomendados.
          </Text>

          <View style={styles.targetRow}>
            <Text variant="bodyMedium" style={[styles.targetLabel, { color: theme.colors.onSurface }]}>
              Calorias Totais (kcal)
            </Text>
            <TextInput
              style={[styles.targetInput, inputDynamicStyle]}
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
              value={kcal}
              onChangeText={setKcal}
            />
          </View>

          <Divider style={{ marginVertical: 8, backgroundColor: theme.dark ? '#334155' : '#F1F5F9' }} />

          <View style={styles.targetRow}>
            <Text variant="bodyMedium" style={[styles.targetLabel, { color: theme.colors.onSurface }]}>
              Proteínas (g)
            </Text>
            <TextInput
              style={[styles.targetInput, inputDynamicStyle]}
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
              value={protein}
              onChangeText={setProtein}
            />
          </View>

          <View style={styles.targetRow}>
            <Text variant="bodyMedium" style={[styles.targetLabel, { color: theme.colors.onSurface }]}>
              Carboidratos (g)
            </Text>
            <TextInput
              style={[styles.targetInput, inputDynamicStyle]}
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
              value={carbs}
              onChangeText={setCarbs}
            />
          </View>

          <View style={styles.targetRow}>
            <Text variant="bodyMedium" style={[styles.targetLabel, { color: theme.colors.onSurface }]}>
              Gorduras (g)
            </Text>
            <TextInput
              style={[styles.targetInput, inputDynamicStyle]}
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
              value={fat}
              onChangeText={setFat}
            />
          </View>

          <View style={styles.targetRow}>
            <Text variant="bodyMedium" style={[styles.targetLabel, { color: theme.colors.onSurface }]}>
              Fibras (g)
            </Text>
            <TextInput
              style={[styles.targetInput, inputDynamicStyle]}
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
              value={fiber}
              onChangeText={setFiber}
            />
          </View>
        </Surface>

        {/* Seção 3: Preferências de Voz e Entrada */}
        <Surface style={[styles.section, cardBorder]} elevation={1}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Preferências de Voz e Entrada
          </Text>
          <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant, marginBottom: 12 }]}>
            Personalize como o app registra suas refeições por comando ou texto.
          </Text>

          {/* Modo Inicial ao Abrir */}
          <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            Ao abrir "Falar Refeição", iniciar em:
          </Text>
          <SegmentedButtons
            value={voiceDefaultInputMode}
            onValueChange={(val) => {
              const mode = val as VoiceInputMode;
              setVoiceDefaultInputMode(mode);
              SecureStorageService.setVoiceDefaultInputMode(mode);
            }}
            buttons={[
              {
                value: 'keyboard',
                label: '⌨️ Digitar / Teclado',
              },
              {
                value: 'voice',
                label: '🎙️ Falar Direto',
              },
            ]}
            style={{ marginBottom: 16 }}
          />

          <Divider style={{ marginVertical: 8, backgroundColor: theme.dark ? '#334155' : '#F1F5F9' }} />

          {/* Modo de Parada da Gravação */}
          <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            Ao falar diretamente, parar a gravação:
          </Text>
          <SegmentedButtons
            value={voiceStopMode}
            onValueChange={(val) => {
              const mode = val as VoiceStopMode;
              setVoiceStopMode(mode);
              SecureStorageService.setVoiceStopMode(mode);
            }}
            buttons={[
              {
                value: 'silence',
                label: 'Tempo sem som',
              },
              {
                value: 'manual',
                label: 'Apenas no clique',
              },
            ]}
            style={{ marginBottom: 12 }}
          />

          {/* Tempo de Espera sem Som (quando 'silence') */}
          {voiceStopMode === 'silence' ? (
            <View style={{ marginBottom: 16 }}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                Tempo de pausa sem som antes de parar:
              </Text>
              <View style={styles.chipRow}>
                {[
                  { label: '3 seg', val: 3 },
                  { label: '5 seg (Padrão)', val: 5 },
                  { label: '7 seg', val: 7 },
                  { label: '10 seg', val: 10 },
                ].map((item) => (
                  <Chip
                    key={item.val}
                    selected={voiceSilenceTimeout === item.val}
                    onPress={() => {
                      setVoiceSilenceTimeout(item.val);
                      SecureStorageService.setVoiceSilenceTimeout(item.val);
                    }}
                    style={[
                      styles.chip,
                      { backgroundColor: theme.dark ? '#334155' : '#F1F5F9' },
                      voiceSilenceTimeout === item.val && {
                        backgroundColor: theme.dark ? '#134E4A' : '#CCFBF1',
                      },
                    ]}
                    textStyle={{
                      fontSize: 12,
                      fontWeight: voiceSilenceTimeout === item.val ? 'bold' : 'normal',
                      color:
                        voiceSilenceTimeout === item.val
                          ? theme.dark
                            ? '#5EEAD4'
                            : '#0D9488'
                          : theme.colors.onSurface,
                    }}
                  >
                    {item.label}
                  </Chip>
                ))}
              </View>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                Permite pausar entre alimentos sem interromper a fala antecipadamente.
              </Text>
            </View>
          ) : (
            <View style={{ marginBottom: 16 }}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                O microfone continuará ouvindo com pausas livres até você tocar no botão "Concluir Fala".
              </Text>
            </View>
          )}

          <Divider style={{ marginVertical: 8, backgroundColor: theme.dark ? '#334155' : '#F1F5F9' }} />

          {/* Auto-confirmação Rápida */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                Auto-confirmação Rápida
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Salva a refeição automaticamente após 3 segundos sem precisar tocar na tela.
              </Text>
            </View>
            <Switch
              value={autoConfirm}
              onValueChange={(val) => {
                setAutoConfirm(val);
                SecureStorageService.setVoiceAutoConfirm(val);
              }}
              color="#0D9488"
            />
          </View>
        </Surface>

        {/* Seção 4: Backup, Exportação e Importação de Dados */}
        <Surface style={[styles.section, cardBorder]} elevation={1}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Backup, Exportação e Importação
          </Text>
          <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Exporte ou restaure suas refeições registradas, receitas e alimentos manuais.
          </Text>

          {exportSummary && (
            <View style={[styles.summaryStatsRow, { backgroundColor: theme.dark ? '#1E293B' : '#F8FAFC' }]}>
              <View style={styles.summaryStatItem}>
                <Text variant="titleMedium" style={styles.summaryStatNumber}>
                  {exportSummary.daysCount}
                </Text>
                <Text variant="labelSmall" style={[styles.summaryStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Dias com logs
                </Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text variant="titleMedium" style={styles.summaryStatNumber}>
                  {exportSummary.itemsCount}
                </Text>
                <Text variant="labelSmall" style={[styles.summaryStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Alimentos salvos
                </Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text variant="titleMedium" style={styles.summaryStatNumber}>
                  {exportSummary.recipesCount}
                </Text>
                <Text variant="labelSmall" style={[styles.summaryStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Receitas
                </Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text variant="titleMedium" style={styles.summaryStatNumber}>
                  {exportSummary.customFoodsCount}
                </Text>
                <Text variant="labelSmall" style={[styles.summaryStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Alimentos manuais
                </Text>
              </View>
            </View>
          )}

          <Divider style={{ marginVertical: 14, backgroundColor: theme.dark ? '#334155' : '#F1F5F9' }} />

          {/* Opção Importar Backup JSON */}
          <View style={styles.exportItem}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                Importar Backup (JSON)
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Restaura histórico, receitas e alimentos a partir de um arquivo .json.
              </Text>
            </View>
            <Button
              mode="contained"
              buttonColor="#2563EB"
              icon="database-import"
              loading={importing}
              disabled={importing || exportingType !== null}
              onPress={handleImportBackup}
            >
              Importar
            </Button>
          </View>

          <Divider style={{ marginVertical: 12, backgroundColor: theme.dark ? '#334155' : '#F1F5F9' }} />

          {/* Opção 1: Backup Completo JSON */}
          <View style={styles.exportItem}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                Exportar Backup (JSON)
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Exporta tudo: histórico de refeições, metas, receitas e alimentos manuais em arquivo único.
              </Text>
            </View>
            <Button
              mode="contained"
              buttonColor="#0D9488"
              icon="database-export"
              loading={exportingType === 'json'}
              disabled={exportingType !== null}
              onPress={handleExportJson}
            >
              Exportar
            </Button>
          </View>

          <Divider style={{ marginVertical: 12, backgroundColor: theme.dark ? '#334155' : '#F1F5F9' }} />

          {/* Opção 2: Refeições em CSV */}
          <View style={styles.exportItem}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                Diário de Refeições (CSV / Excel)
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Planilha com datas, refeições, gramas, calorias e macros consumidos dia a dia.
              </Text>
            </View>
            <Button
              mode="outlined"
              textColor="#0D9488"
              icon="file-delimited-outline"
              loading={exportingType === 'meals_csv'}
              disabled={exportingType !== null}
              onPress={handleExportMealsCsv}
            >
              Planilha
            </Button>
          </View>

          <Divider style={{ marginVertical: 12, backgroundColor: theme.dark ? '#334155' : '#F1F5F9' }} />

          {/* Opção 3: Receitas e Alimentos Manuais em CSV */}
          <View style={styles.exportItem}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                Receitas & Alimentos (CSV)
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Planilha com alimentos criados por você e todas as receitas com seus ingredientes.
              </Text>
            </View>
            <Button
              mode="outlined"
              textColor="#0D9488"
              icon="book-outline"
              loading={exportingType === 'custom_csv'}
              disabled={exportingType !== null}
              onPress={handleExportCustomCsv}
            >
              Planilha
            </Button>
          </View>
        </Surface>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  sectionSubtitle: {
    color: '#64748B',
    marginBottom: 14,
  },
  label: {
    color: '#475569',
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    color: '#0F172A',
    marginBottom: 10,
  },
  apiKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingRight: 6,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  targetLabel: {
    color: '#1E293B',
    fontWeight: '500',
  },
  targetInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    width: 90,
    padding: 8,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#0F172A',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#F1F5F9',
  },
  chipSelected: {
    backgroundColor: '#CCFBF1',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 4,
  },
  summaryStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatNumber: {
    fontWeight: 'bold',
    color: '#0D9488',
  },
  summaryStatLabel: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  exportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
});
