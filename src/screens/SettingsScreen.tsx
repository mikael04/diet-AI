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
} from 'react-native-paper';
import { SecureStorageService } from '../services/storage/SecureStorageService';
import { GeminiService } from '../services/ai/GeminiService';
import { ExportService, ExportSummary } from '../services/export/ExportService';
import { NutritionTargets } from '../types';

export const SettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [provider, setProvider] = useState<'gemini' | 'openai'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState('gemini-3.8-flash');
  const [openAiEndpoint, setOpenAiEndpoint] = useState('https://api.openai.com/v1');
  const [autoConfirm, setAutoConfirm] = useState(false);
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
    const [p, k, m, ep, ac, t, summary] = await Promise.all([
      SecureStorageService.getAiProvider(),
      SecureStorageService.getGeminiApiKey(),
      SecureStorageService.getAiModel(),
      SecureStorageService.getOpenAiEndpoint(),
      SecureStorageService.getVoiceAutoConfirm(),
      SecureStorageService.getNutritionTargets(),
      ExportService.getExportSummary(),
    ]);

    const activeModel = (!m || m === 'gemini-2.5-flash') ? 'gemini-3.8-flash' : m;
    setProvider(p);
    setApiKey(k || '');
    setModel(activeModel);
    setOpenAiEndpoint(ep);
    setAutoConfirm(ac);
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={1}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon="arrow-left" size={24} onPress={onBack} />
          <Text variant="titleLarge" style={{ fontWeight: 'bold', color: '#0F172A' }}>
            Configurações
          </Text>
        </View>
        <Button mode="contained" buttonColor="#0D9488" onPress={handleSaveSettings}>
          Salvar
        </Button>
      </Surface>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Seção 1: Inteligência Artificial */}
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Inteligência Artificial (LLM)
          </Text>
          <Text variant="bodySmall" style={styles.sectionSubtitle}>
            Processamento de linguagem natural dos comandos de voz.
          </Text>

          <Text variant="labelMedium" style={styles.label}>
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

          <Text variant="labelMedium" style={styles.label}>
            Chave de API (API Key)
          </Text>
          <View style={styles.apiKeyRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Cole sua chave aqui"
              secureTextEntry={!showKey}
              value={apiKey}
              onChangeText={setApiKey}
            />
            <IconButton
              icon={showKey ? 'eye-off' : 'eye'}
              size={20}
              onPress={() => setShowKey(!showKey)}
            />
          </View>

          <Text variant="labelMedium" style={[styles.label, { marginTop: 12 }]}>
            Modelo Selecionado
          </Text>
          {provider === 'gemini' && (
            <View style={styles.chipRow}>
              <Chip
                selected={model === 'gemini-3.8-flash'}
                onPress={() => setModel('gemini-3.8-flash')}
                style={[
                  styles.chip,
                  model === 'gemini-3.8-flash' && styles.chipSelected,
                ]}
                textStyle={{ fontSize: 12 }}
              >
                gemini-3.8-flash (Recomendado)
              </Chip>
              <Chip
                selected={model === 'gemini-3.5-flash-lite'}
                onPress={() => setModel('gemini-3.5-flash-lite')}
                style={[
                  styles.chip,
                  model === 'gemini-3.5-flash-lite' && styles.chipSelected,
                ]}
                textStyle={{ fontSize: 12 }}
              >
                gemini-3.5-flash-lite (Rápido)
              </Chip>
            </View>
          )}
          <TextInput
            style={styles.input}
            placeholder="ex: gemini-3.8-flash ou gemini-3.5-flash-lite"
            value={model}
            onChangeText={setModel}
          />

          {provider === 'openai' && (
            <>
              <Text variant="labelMedium" style={styles.label}>
                Endpoint Customizado
              </Text>
              <TextInput
                style={styles.input}
                placeholder="https://api.openai.com/v1"
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
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Metas Nutricionais Diárias
          </Text>
          <Text variant="bodySmall" style={styles.sectionSubtitle}>
            Ajuste suas calorias e macronutrientes recomendados.
          </Text>

          <View style={styles.targetRow}>
            <Text variant="bodyMedium" style={styles.targetLabel}>
              Calorias Totais (kcal)
            </Text>
            <TextInput
              style={styles.targetInput}
              keyboardType="numeric"
              value={kcal}
              onChangeText={setKcal}
            />
          </View>

          <Divider style={{ marginVertical: 8 }} />

          <View style={styles.targetRow}>
            <Text variant="bodyMedium" style={styles.targetLabel}>
              Proteínas (g)
            </Text>
            <TextInput
              style={styles.targetInput}
              keyboardType="numeric"
              value={protein}
              onChangeText={setProtein}
            />
          </View>

          <View style={styles.targetRow}>
            <Text variant="bodyMedium" style={styles.targetLabel}>
              Carboidratos (g)
            </Text>
            <TextInput
              style={styles.targetInput}
              keyboardType="numeric"
              value={carbs}
              onChangeText={setCarbs}
            />
          </View>

          <View style={styles.targetRow}>
            <Text variant="bodyMedium" style={styles.targetLabel}>
              Gorduras (g)
            </Text>
            <TextInput
              style={styles.targetInput}
              keyboardType="numeric"
              value={fat}
              onChangeText={setFat}
            />
          </View>

          <View style={styles.targetRow}>
            <Text variant="bodyMedium" style={styles.targetLabel}>
              Fibras (g)
            </Text>
            <TextInput
              style={styles.targetInput}
              keyboardType="numeric"
              value={fiber}
              onChangeText={setFiber}
            />
          </View>
        </Surface>

        {/* Seção 3: Preferências de Voz */}
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Preferências de Voz
          </Text>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                Auto-confirmação Rápida
              </Text>
              <Text variant="bodySmall" style={{ color: '#64748B' }}>
                Salva a refeição automaticamente após 3 segundos sem precisar tocar na tela.
              </Text>
            </View>
            <Switch value={autoConfirm} onValueChange={setAutoConfirm} color="#0D9488" />
          </View>
        </Surface>

        {/* Seção 4: Backup, Exportação e Importação de Dados */}
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Backup, Exportação e Importação
          </Text>
          <Text variant="bodySmall" style={styles.sectionSubtitle}>
            Exporte ou restaure suas refeições registradas, receitas e alimentos manuais.
          </Text>

          {exportSummary && (
            <View style={styles.summaryStatsRow}>
              <View style={styles.summaryStatItem}>
                <Text variant="titleMedium" style={styles.summaryStatNumber}>
                  {exportSummary.daysCount}
                </Text>
                <Text variant="labelSmall" style={styles.summaryStatLabel}>
                  Dias com logs
                </Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text variant="titleMedium" style={styles.summaryStatNumber}>
                  {exportSummary.itemsCount}
                </Text>
                <Text variant="labelSmall" style={styles.summaryStatLabel}>
                  Alimentos salvos
                </Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text variant="titleMedium" style={styles.summaryStatNumber}>
                  {exportSummary.recipesCount}
                </Text>
                <Text variant="labelSmall" style={styles.summaryStatLabel}>
                  Receitas
                </Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text variant="titleMedium" style={styles.summaryStatNumber}>
                  {exportSummary.customFoodsCount}
                </Text>
                <Text variant="labelSmall" style={styles.summaryStatLabel}>
                  Alimentos manuais
                </Text>
              </View>
            </View>
          )}

          <Divider style={{ marginVertical: 12 }} />

          {/* Opção Importar Backup JSON */}
          <View style={styles.exportItem}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text variant="bodyMedium" style={{ fontWeight: '600', color: '#0F172A' }}>
                Importar Backup (JSON)
              </Text>
              <Text variant="bodySmall" style={{ color: '#64748B' }}>
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

          <Divider style={{ marginVertical: 12 }} />

          {/* Opção 1: Backup Completo JSON */}
          <View style={styles.exportItem}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text variant="bodyMedium" style={{ fontWeight: '600', color: '#0F172A' }}>
                Exportar Backup (JSON)
              </Text>
              <Text variant="bodySmall" style={{ color: '#64748B' }}>
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

          <Divider style={{ marginVertical: 12 }} />

          {/* Opção 2: Refeições em CSV */}
          <View style={styles.exportItem}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text variant="bodyMedium" style={{ fontWeight: '600', color: '#0F172A' }}>
                Diário de Refeições (CSV / Excel)
              </Text>
              <Text variant="bodySmall" style={{ color: '#64748B' }}>
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

          <Divider style={{ marginVertical: 12 }} />

          {/* Opção 3: Receitas e Alimentos Manuais em CSV */}
          <View style={styles.exportItem}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text variant="bodyMedium" style={{ fontWeight: '600', color: '#0F172A' }}>
                Receitas & Alimentos (CSV)
              </Text>
              <Text variant="bodySmall" style={{ color: '#64748B' }}>
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
