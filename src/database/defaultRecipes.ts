export interface PredefinedRecipe {
  name: string;
  description: string;
  items: Array<{
    foodName: string;
    quantity: number;
    unit: string;
  }>;
}

export const DEFAULT_BRAZILIAN_RECIPES: PredefinedRecipe[] = [
  {
    name: 'Strogonoff de Frango Fitness',
    description: 'Versão leve e proteica do strogonoff brasileiro feito com filé de frango e requeijão light.',
    items: [
      { foodName: 'Peito de frango grelhado sem pele', quantity: 150, unit: 'g' },
      { foodName: 'Requeijão cremoso light', quantity: 30, unit: 'g' },
      { foodName: 'Tomate cru com semente', quantity: 40, unit: 'g' },
      { foodName: 'Azeite de oliva extravirgem', quantity: 5, unit: 'g' },
    ],
  },
  {
    name: 'Baião de Dois Tradicional',
    description: 'Prato típico nordestino com arroz, feijão de corda/fradinho, queijo coalho e carne seca.',
    items: [
      { foodName: 'Arroz branco cozido', quantity: 100, unit: 'g' },
      { foodName: 'Feijão fradinho cozido', quantity: 80, unit: 'g' },
      { foodName: 'Queijo coalho grelhado', quantity: 40, unit: 'g' },
      { foodName: 'Carne bovina seca cozida desfiada', quantity: 50, unit: 'g' },
    ],
  },
  {
    name: 'Escondidinho de Mandioca com Frango',
    description: 'Purê cremoso de mandioca com recheio de frango desfiado e queijo gratinado.',
    items: [
      { foodName: 'Mandioca cozida (Aipim/Macaxeira)', quantity: 150, unit: 'g' },
      { foodName: 'Peito de frango desfiado refogado', quantity: 120, unit: 'g' },
      { foodName: 'Requeijão cremoso light', quantity: 20, unit: 'g' },
      { foodName: 'Queijo muçarela', quantity: 25, unit: 'g' },
    ],
  },
  {
    name: 'Panqueca Integral de Frango',
    description: 'Massa leve de farinha de trigo integral com ovo e recheio de frango desfiado.',
    items: [
      { foodName: 'Farinha de trigo integral', quantity: 30, unit: 'g' },
      { foodName: 'Ovo de galinha inteiro cozido', quantity: 1, unit: 'unidade' },
      { foodName: 'Leite de vaca desnatado', quantity: 50, unit: 'ml' },
      { foodName: 'Peito de frango desfiado refogado', quantity: 80, unit: 'g' },
    ],
  },
  {
    name: 'Tapioca de Frango com Requeijão',
    description: 'Tapioca crocante recheada com peito de frango desfiado e requeijão light cremoso.',
    items: [
      { foodName: 'Goma de mandioca (Tapioca hidratada)', quantity: 60, unit: 'g' },
      { foodName: 'Peito de frango desfiado refogado', quantity: 70, unit: 'g' },
      { foodName: 'Requeijão cremoso light', quantity: 20, unit: 'g' },
    ],
  },
  {
    name: 'Omelete de Frango com Queijo Minas',
    description: 'Omelete hiperproteica com ovos inteiros, frango desfiado e queijo minas frescal.',
    items: [
      { foodName: 'Ovo de galinha inteiro cozido', quantity: 2, unit: 'unidade' },
      { foodName: 'Peito de frango desfiado refogado', quantity: 50, unit: 'g' },
      { foodName: 'Queijo Minas frescal', quantity: 30, unit: 'g' },
      { foodName: 'Azeite de oliva extravirgem', quantity: 5, unit: 'g' },
    ],
  },
  {
    name: 'Farofa Funcional de Aveia e Ovos',
    description: 'Farofa saudável e rica em fibras feita com farinha de aveia, ovo e azeite.',
    items: [
      { foodName: 'Farinha de aveia', quantity: 40, unit: 'g' },
      { foodName: 'Ovo de galinha inteiro cozido', quantity: 1, unit: 'unidade' },
      { foodName: 'Azeite de oliva extravirgem', quantity: 10, unit: 'g' },
    ],
  },
  {
    name: 'Prato Feito Brasileiro (PF Tradicional)',
    description: 'O autêntico almoço brasileiro: arroz, feijão carioca, filé de frango grelhado e salada.',
    items: [
      { foodName: 'Arroz branco cozido', quantity: 150, unit: 'g' },
      { foodName: 'Feijão carioca cozido (50% grão 50% caldo)', quantity: 130, unit: 'g' },
      { foodName: 'Peito de frango grelhado sem pele', quantity: 120, unit: 'g' },
      { foodName: 'Alface crespa crua', quantity: 20, unit: 'g' },
      { foodName: 'Tomate cru com semente', quantity: 50, unit: 'g' },
    ],
  },
];
