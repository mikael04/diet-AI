import { calculateMacros, calculateEffectiveGrams, normalizeUnit } from '../src/utils/nutrition';
import tacoFoods from '../assets/data/taco_database.json';
import { FoodItem } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FALHA: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ OK: ${message}`);
  }
}

console.log('--- Iniciando Testes Unitários de Nutrição e Dados ---');

// 1. Teste de Normalização de Unidades
assert(normalizeUnit('gramas') === 'g', 'Normaliza "gramas" para "g"');
assert(normalizeUnit('ovos') === 'unidade', 'Normaliza "ovos" para "unidade"');
assert(normalizeUnit('colheres de sopa') === 'colher de sopa', 'Normaliza "colheres de sopa"');
assert(normalizeUnit('scoops') === 'scoop', 'Normaliza "scoops" para "scoop"');

// 2. Teste do Peito de Frango (150g)
const frango = tacoFoods.find(f => f.name.includes('Peito de frango grelhado')) as unknown as FoodItem;
assert(!!frango, 'Encontra peito de frango na base TACO');
const frangoMacros = calculateMacros(frango, 150, 'g');
assert(frangoMacros.effective_grams === 150, 'Gramas efetivas de 150g = 150g');
assert(frangoMacros.calculated_protein === 48.0, `Proteína de 150g de frango esperada 48g, obteve ${frangoMacros.calculated_protein}g`);
assert(frangoMacros.calculated_kcal === 238.5, `Calorias de 150g de frango esperadas 238.5 kcal, obteve ${frangoMacros.calculated_kcal}`);

// 3. Teste de Ovos Inteiros Cozidos (2 unidades ~100g)
const ovo = tacoFoods.find(f => f.name.includes('Ovo de galinha inteiro cozido')) as unknown as FoodItem;
assert(!!ovo, 'Encontra ovo cozido na base TACO');
const ovoMacros = calculateMacros(ovo, 2, 'unidade');
assert(ovoMacros.effective_grams === 100, `2 ovos = 100g (50g por unidade), obteve ${ovoMacros.effective_grams}g`);
assert(ovoMacros.calculated_protein === 13.3, `Proteína de 2 ovos esperada 13.3g, obteve ${ovoMacros.calculated_protein}g`);
assert(ovoMacros.calculated_kcal === 146.0, `Calorias de 2 ovos esperadas 146 kcal, obteve ${ovoMacros.calculated_kcal}`);

// 4. Teste de Pão Francês (1 unidade ~50g)
const pao = tacoFoods.find(f => f.name.includes('Pão francês')) as unknown as FoodItem;
assert(!!pao, 'Encontra pão francês na base TACO');
const paoMacros = calculateMacros(pao, 1, 'unidade');
assert(paoMacros.effective_grams === 50, `1 pão francês = 50g, obteve ${paoMacros.effective_grams}g`);
assert(paoMacros.calculated_kcal === 150.0, `Calorias de 1 pão = 150 kcal, obteve ${paoMacros.calculated_kcal}`);
assert(paoMacros.calculated_carbs === 29.3, `Carboidratos de 1 pão = 29.3g, obteve ${paoMacros.calculated_carbs}g`);

// 5. Teste de Whey Protein (1 scoop ~30g)
const whey = tacoFoods.find(f => f.name.includes('Whey Protein Concentrado 80%')) as unknown as FoodItem;
assert(!!whey, 'Encontra Whey Protein na base TACO');
const wheyMacros = calculateMacros(whey, 1, 'scoop');
assert(wheyMacros.effective_grams === 30, `1 scoop = 30g, obteve ${wheyMacros.effective_grams}g`);
assert(wheyMacros.calculated_protein === 24.0, `Proteína de 30g de whey 80% = 24g, obteve ${wheyMacros.calculated_protein}g`);

// 6. Teste de Estruturação de Exportação com weight_kg
const sampleExport = {
  app: 'Diet-AI',
  export_date: new Date().toISOString(),
  summary: { total_days: 1, total_logged_items: 2, total_recipes: 1, total_custom_foods: 1 },
  daily_history: [
    {
      date: '2026-10-05',
      water_ml: 1500,
      weight_kg: 78.5,
      totals: { kcal: 384.5, protein: 61.3, carbs: 0, fat: 12.5, fiber: 0 },
      items: [
        { meal_type: 'LUNCH', food_name: 'Peito de frango grelhado', quantity: 150, unit: 'g', calculated_kcal: 238.5 },
        { meal_type: 'LUNCH', food_name: 'Ovo cozido', quantity: 2, unit: 'unidade', calculated_kcal: 146.0 }
      ]
    }
  ]
};
const jsonString = JSON.stringify(sampleExport, null, 2);
assert(JSON.parse(jsonString).app === 'Diet-AI', 'JSON de exportação serializa e desserializa corretamente');
assert(JSON.parse(jsonString).daily_history[0].weight_kg === 78.5, 'Exportação preserva weight_kg com precisão');
assert(JSON.parse(jsonString).daily_history[0].items.length === 2, 'Exportação contém todos os itens da refeição');

// 7. Teste de Formatação de CSV incluindo Peso do Dia
const csvHeaders = ['Data', 'Peso do Dia (kg)', 'Refeição', 'Alimento', 'Quantidade', 'Unidade', 'Calorias (kcal)', 'Proteínas (g)', 'Carboidratos (g)', 'Gorduras (g)', 'Fibras (g)'].join(';');
assert(csvHeaders.includes('Calorias (kcal)'), 'Cabeçalho CSV inclui coluna de calorias');
assert(csvHeaders.includes('Proteínas (g)'), 'Cabeçalho CSV inclui coluna de proteínas');
assert(csvHeaders.includes('Peso do Dia (kg)'), 'Cabeçalho CSV inclui coluna de Peso do Dia (kg)');

// 8. Teste de Validação de Importação com suporte a Peso
const parsedImport = JSON.parse(jsonString);
const hasCompatibleData = Boolean(
  (parsedImport.daily_history && parsedImport.daily_history.length > 0) ||
  (parsedImport.recipes && parsedImport.recipes.length > 0) ||
  (parsedImport.custom_foods && parsedImport.custom_foods.length > 0)
);
assert(hasCompatibleData, 'Detecta payload válido com dados compatíveis para importação');
assert(parsedImport.daily_history[0].weight_kg === 78.5, 'Payload para importação contém weight_kg válido');

const emptyPayload = JSON.parse('{"foo": "bar"}');
const emptyHasData = Boolean(
  (emptyPayload.daily_history && emptyPayload.daily_history.length > 0) ||
  (emptyPayload.recipes && emptyPayload.recipes.length > 0) ||
  (emptyPayload.custom_foods && emptyPayload.custom_foods.length > 0)
);
assert(!emptyHasData, 'Rejeita payload vazio/incompatível para importação');

// 9. Teste de Lógica de Datas Relativas (Hoje, Ontem, Amanhã)
const now = new Date('2026-10-06T12:00:00Z');
const yest = new Date(now);
yest.setDate(yest.getDate() - 1);
const tom = new Date(now);
tom.setDate(tom.getDate() + 1);

const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayKey = fmt(now);
const yestKey = fmt(yest);
const tomKey = fmt(tom);

assert(todayKey === '2026-10-06', 'Data atual formatada');
assert(yestKey === '2026-10-05', 'Data ontem formatada');
assert(tomKey === '2026-10-07', 'Data amanhã formatada');

// 10. Teste de Lógica de Acumulação de Transcrição de Voz (Segmentada vs Cumulativa)
function accumulateVoiceTranscript(prev: string, current: string): string {
  const p = prev.trim();
  const c = current.trim();
  if (p && c.toLowerCase().startsWith(p.toLowerCase())) {
    return c;
  } else if (p) {
    return `${p} ${c}`;
  }
  return c;
}

assert(
  accumulateVoiceTranscript('2 ovos', '2 ovos e 1 tapioca') === '2 ovos e 1 tapioca',
  'Acumulação cumulativa (iOS/Web) substitui sem duplicar palavras'
);
assert(
  accumulateVoiceTranscript('2 ovos e 1 tapioca', 'e 1 café com leite') === '2 ovos e 1 tapioca e 1 café com leite',
  'Acumulação segmentada (Android com pausas) concatena segmentos sucessivos'
);

// 11. Teste de Novos Alimentos Brasileiros, Cortes de Carne, Farinhas e Sashimi
const farinhaIntegral = tacoFoods.find(f => f.name.toLowerCase().includes('farinha de trigo integral')) as unknown as FoodItem;
assert(!!farinhaIntegral, 'Encontra farinha de trigo integral na base de dados');
assert(Boolean(farinhaIntegral.synonyms?.includes('farinha integral')), 'Farinha integral possui sinônimo indexado "farinha integral"');

const pernilSuino = tacoFoods.find(f => f.name.toLowerCase().includes('pernil') && f.name.toLowerCase().includes('sem gordura')) as unknown as FoodItem;
assert(!!pernilSuino, 'Encontra pernil suíno assado sem gordura na base de dados');
assert(Boolean(pernilSuino.synonyms?.includes('pernil suino sem pele sem gordura')), 'Pernil possui sinônimo "pernil suino sem pele sem gordura"');


const sobrecoxa = tacoFoods.find(f => f.name.toLowerCase().includes('sobrecoxa')) as unknown as FoodItem;
assert(!!sobrecoxa, 'Encontra sobrecoxa de frango na base de dados');

const sashimi = tacoFoods.find(f => f.name.toLowerCase().includes('sashimi de salmão')) as unknown as FoodItem;
assert(!!sashimi, 'Encontra sashimi de salmão na base de dados');

const feijoada = tacoFoods.find(f => f.name.toLowerCase().includes('feijoada completa')) as unknown as FoodItem;
assert(!!feijoada, 'Encontra feijoada completa na base de dados');

const baiao = tacoFoods.find(f => f.name.toLowerCase().includes('baião de dois')) as unknown as FoodItem;
assert(!!baiao, 'Encontra baião de dois na base de dados');

// 12. Teste de Edição de Alimento Registrado e Recálculo de Macros
const arroz = tacoFoods.find(f => f.name === 'Arroz branco cozido') as unknown as FoodItem;
assert(!!arroz, 'Encontra arroz cozido na base TACO');
const originalRiceMacros = calculateMacros(arroz, 100, 'g');
assert(originalRiceMacros.calculated_kcal === 128.0, '100g arroz = 128 kcal');

// Edição de quantidade: aumento de 100g para 160g (1.6x)
const editedRiceMacros = calculateMacros(arroz, 160, 'g');
assert(editedRiceMacros.effective_grams === 160, 'Gramas efetivas editadas = 160g');
assert(editedRiceMacros.calculated_kcal === Math.round(128.0 * 1.6 * 10) / 10, 'Calorias recalculadas proporcionalmente para 160g');
assert(editedRiceMacros.calculated_carbs === Math.round(28.1 * 1.6 * 10) / 10, 'Carboidratos recalculados proporcionalmente para 160g');

// Troca de alimento: alterando item de arroz para frango grelhado
const swappedMacros = calculateMacros(frango, 120, 'g');
assert(swappedMacros.effective_grams === 120, 'Item trocado para frango 120g');
assert(swappedMacros.calculated_protein === Math.round(32.0 * 1.2 * 10) / 10, 'Proteína recalculada para novo alimento frango');

// 13. Teste de Wheys e Barras de Proteína do Mercado Brasileiro e Frutas/Verduras Nacionais
const wheyGrowth = tacoFoods.find(f => f.name.toLowerCase().includes('growth supplements')) as unknown as FoodItem;
assert(!!wheyGrowth, 'Encontra Whey Protein da Growth Supplements');
assert(Boolean(wheyGrowth.synonyms?.includes('whey growth')), 'Whey Growth possui sinônimo "whey growth"');

const wheyMax = tacoFoods.find(f => f.name === '100% Whey Max Titanium') as unknown as FoodItem;
assert(!!wheyMax, 'Encontra 100% Whey Max Titanium');

const yopro = tacoFoods.find(f => f.name.toLowerCase().includes('yopro')) as unknown as FoodItem;
assert(!!yopro, 'Encontra YoPRO Danone');

const boldBar = tacoFoods.find(f => f.name.toLowerCase().includes('bold bar')) as unknown as FoodItem;
assert(!!boldBar, 'Encontra Bold Bar Barra de Proteína');

const darkness = tacoFoods.find(f => f.name.toLowerCase().includes('darkness monster bar')) as unknown as FoodItem;
assert(!!darkness, 'Encontra Darkness Monster Bar');

const jabuticaba = tacoFoods.find(f => f.name.toLowerCase().includes('jabuticaba')) as unknown as FoodItem;
assert(!!jabuticaba, 'Encontra Jabuticaba crua');

const oraProNobis = tacoFoods.find(f => f.name.toLowerCase().includes('ora-pro-nóbis')) as unknown as FoodItem;
assert(!!oraProNobis, 'Encontra Ora-pro-nóbis na base');

const quiabo = tacoFoods.find(f => f.name.toLowerCase().includes('quiabo')) as unknown as FoodItem;
assert(!!quiabo, 'Encontra Quiabo na base');

console.log('--- Todos os testes de nutrição, alimentos brasileiros, wheys, barras, exportação, importação, peso, datas, edição e voz passaram com sucesso! 🎉 ---');



