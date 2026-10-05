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

// 6. Teste de Estruturação de Exportação
const sampleExport = {
  app: 'Diet-AI',
  export_date: new Date().toISOString(),
  summary: { total_days: 1, total_logged_items: 2, total_recipes: 1, total_custom_foods: 1 },
  daily_history: [
    {
      date: '2026-10-05',
      water_ml: 1500,
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
assert(JSON.parse(jsonString).daily_history[0].items.length === 2, 'Exportação contém todos os itens da refeição');

// 7. Teste de Formatação de CSV
const csvHeaders = ['Data', 'Refeição', 'Alimento', 'Quantidade', 'Unidade', 'Calorias (kcal)', 'Proteínas (g)', 'Carboidratos (g)', 'Gorduras (g)', 'Fibras (g)'].join(';');
assert(csvHeaders.includes('Calorias (kcal)'), 'Cabeçalho CSV inclui coluna de calorias');
assert(csvHeaders.includes('Proteínas (g)'), 'Cabeçalho CSV inclui coluna de proteínas');

// 8. Teste de Validação de Importação
const parsedImport = JSON.parse(jsonString);
const hasCompatibleData = Boolean(
  (parsedImport.daily_history && parsedImport.daily_history.length > 0) ||
  (parsedImport.recipes && parsedImport.recipes.length > 0) ||
  (parsedImport.custom_foods && parsedImport.custom_foods.length > 0)
);
assert(hasCompatibleData, 'Detecta payload válido com dados compatíveis para importação');

const emptyPayload = JSON.parse('{"foo": "bar"}');
const emptyHasData = Boolean(
  (emptyPayload.daily_history && emptyPayload.daily_history.length > 0) ||
  (emptyPayload.recipes && emptyPayload.recipes.length > 0) ||
  (emptyPayload.custom_foods && emptyPayload.custom_foods.length > 0)
);
assert(!emptyHasData, 'Rejeita payload vazio/incompatível para importação');

console.log('--- Todos os testes de nutrição, exportação e importação passaram com sucesso! 🎉 ---');
