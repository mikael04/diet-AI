import { FoodItem } from '../types';

export interface CalculatedMacros {
  calculated_kcal: number;
  calculated_protein: number;
  calculated_carbs: number;
  calculated_fat: number;
  calculated_fiber: number;
  effective_grams: number;
}

/**
 * Normaliza unidades comuns em português para padronização.
 */
export function normalizeUnit(rawUnit: string): string {
  const clean = (rawUnit || '').toLowerCase().trim();
  if (['g', 'grama', 'gramas', 'gr'].includes(clean)) return 'g';
  if (['ml', 'mililitro', 'mililitros'].includes(clean)) return 'ml';
  if (['unidade', 'unidades', 'un', 'und', 'ovo', 'ovos', 'pao', 'paes'].includes(clean)) return 'unidade';
  if (['fatia', 'fatias'].includes(clean)) return 'fatia';
  if (['colher', 'colheres', 'colher de sopa', 'cs', 'colheres de sopa'].includes(clean)) return 'colher de sopa';
  if (['concha', 'conchas'].includes(clean)) return 'concha';
  if (['scoop', 'scoops', 'dose', 'medidor'].includes(clean)) return 'scoop';
  if (['copo', 'copos'].includes(clean)) return 'copo';
  if (['xicara', 'xícara', 'xicaras', 'xícaras'].includes(clean)) return 'xícara';
  if (['lata', 'latas'].includes(clean)) return 'lata';
  if (['prato', 'pratos'].includes(clean)) return 'prato';
  return clean || 'g';
}

/**
 * Converte a quantidade e unidade em gramas efetivas com base no cadastro do alimento.
 */
export function calculateEffectiveGrams(food: FoodItem, quantity: number, unit: string): number {
  const norm = normalizeUnit(unit);
  const defaultNorm = normalizeUnit(food.default_unit);

  if (norm === 'g' || norm === 'ml') {
    return quantity;
  }

  // Se a unidade informada for igual à default do alimento
  if (norm === defaultNorm || norm === 'unidade') {
    return quantity * (food.grams_per_unit || 1);
  }

  // Estimativas padrão para unidades comuns caso o alimento não tenha correspondência exata
  switch (norm) {
    case 'colher de sopa':
      return quantity * 15;
    case 'concha':
      return quantity * 130;
    case 'copo':
      return quantity * 200;
    case 'xícara':
      return quantity * 150;
    case 'fatia':
      return quantity * 30;
    case 'scoop':
      return quantity * 30;
    default:
      return quantity * (food.grams_per_unit || 1);
  }
}

/**
 * Calcula os macros proporcionais para o alimento, quantidade e unidade especificados.
 */
export function calculateMacros(food: FoodItem, quantity: number, unit: string): CalculatedMacros {
  const effectiveGrams = calculateEffectiveGrams(food, quantity, unit);
  const factor = effectiveGrams / 100.0;

  return {
    calculated_kcal: Math.round(food.kcal_per_100g * factor * 10) / 10,
    calculated_protein: Math.round(food.protein_per_100g * factor * 10) / 10,
    calculated_carbs: Math.round(food.carbs_per_100g * factor * 10) / 10,
    calculated_fat: Math.round(food.fat_per_100g * factor * 10) / 10,
    calculated_fiber: Math.round(food.fiber_per_100g * factor * 10) / 10,
    effective_grams: effectiveGrams,
  };
}

/**
 * Formata data no padrão ISO YYYY-MM-DD
 */
export function formatDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retorna a data de ontem no formato YYYY-MM-DD
 */
export function getYesterdayDate(baseDate: string = formatDate()): string {
  const [year, month, day] = baseDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() - 1);
  return formatDate(d);
}

/**
 * Normaliza textos para busca, removendo acentos e pontuações e convertendo para minúsculas.
 */
export function normalizeSearchText(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

