import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { NutritionTargets } from '../../types';

const DEFAULT_TARGETS: NutritionTargets = {
  daily_kcal: 2200,
  daily_protein: 160,
  daily_carbs: 220,
  daily_fat: 65,
  daily_fiber: 30,
};

// Memory fallback para web ou ambientes onde SecureStore não está disponível
const memoryFallback = new Map<string, string>();

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    } else {
      memoryFallback.set(key, value);
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (err) {
    memoryFallback.set(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return memoryFallback.get(key) || null;
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    return memoryFallback.get(key) || null;
  }
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    } else {
      memoryFallback.delete(key);
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (err) {
    memoryFallback.delete(key);
  }
}

export class SecureStorageService {
  static async getGeminiApiKey(): Promise<string | null> {
    return await getItem('diet_ai_gemini_api_key');
  }

  static async setGeminiApiKey(key: string): Promise<void> {
    await setItem('diet_ai_gemini_api_key', key.trim());
  }

  static async getAiProvider(): Promise<'gemini' | 'openai'> {
    const prov = await getItem('diet_ai_provider');
    return (prov as 'gemini' | 'openai') || 'gemini';
  }

  static async setAiProvider(provider: 'gemini' | 'openai'): Promise<void> {
    await setItem('diet_ai_provider', provider);
  }

  static async getAiModel(): Promise<string> {
    const model = await getItem('diet_ai_model');
    if (!model || model === 'gemini-2.5-flash') {
      return 'gemini-3.8-flash';
    }
    return model;
  }

  static async setAiModel(model: string): Promise<void> {
    await setItem('diet_ai_model', model);
  }

  static async getOpenAiEndpoint(): Promise<string> {
    const endpoint = await getItem('diet_ai_openai_endpoint');
    return endpoint || 'https://api.openai.com/v1';
  }

  static async setOpenAiEndpoint(endpoint: string): Promise<void> {
    await setItem('diet_ai_openai_endpoint', endpoint);
  }

  static async getNutritionTargets(): Promise<NutritionTargets> {
    const raw = await getItem('diet_ai_nutrition_targets');
    if (!raw) return DEFAULT_TARGETS;
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_TARGETS;
    }
  }

  static async setNutritionTargets(targets: NutritionTargets): Promise<void> {
    await setItem('diet_ai_nutrition_targets', JSON.stringify(targets));
  }

  static async getVoiceAutoConfirm(): Promise<boolean> {
    const raw = await getItem('diet_ai_auto_confirm');
    return raw === 'true';
  }

  static async setVoiceAutoConfirm(enabled: boolean): Promise<void> {
    await setItem('diet_ai_auto_confirm', enabled ? 'true' : 'false');
  }
}
