# Especificação Técnica do Projeto: MacroVoice Android

## 1. Visão Geral do Produto
O **MacroVoice** é um aplicativo Android nativo (desenvolvido em Kotlin + Jetpack Compose) com foco no rastreamento diário de macronutrientes (Calorias, Proteínas, Carboidratos, Gorduras e Fibras). O diferencial central é a **interação primária por comando de voz**, com suporte auxiliar a ajustes manuais finos, clonagem de refeições/dias e gerenciamento de receitas customizadas.

O aplicativo é de uso pessoal (build local via Linux, instalação direta via APK), com banco de dados local embarcado e integração à API do Google Gemini (ou modelos compatíveis OpenAI-compatible) para interpretação de linguagem natural estruturada via JSON / Function Calling.

---

## 2. Pilha de Tecnologia (Tech Stack)

* **Linguagem:** Kotlin
* **UI Toolkit:** Jetpack Compose (Material Design 3)
* **Arquitetura:** MVVM (Model-View-ViewModel) + Clean Architecture simplificada + Unidirectional Data Flow (UDF)
* **Banco de Dados Local:** Room Database (SQLite) com pré-população (FTS4 para busca rápida por texto)
* **Captura de Áudio / Voz:** Android Native `SpeechRecognizer` (`android.speech.SpeechRecognizer`) para fala-em-texto (STT) 100% gratuita e sem latência de upload de áudio.
* **LLM Engine:** Google Gemini API (`gemini-3.8-flash` ou `gemini-3.5-flash-lite` via REST/SDK oficial) com fallback/suporte a endpoints OpenAI-compatible (DeepSeek / Qwen / etc.).
* **Armazenamento de Credenciais:** AndroidX `EncryptedSharedPreferences` (tela de configurações com chave de API editável em runtime).
* **Injeção de Dependências:** Hilt ou Koin (Hilt recomendado para integração fluida no Android).

---

## 3. Estratégia de Dados Nutricionais

### 3.1 Fonte de Dados: Tabela TACO (Unicamp) + Alimentos Comuns
Para evitar que você tenha que cadastrar alimentos um a um, o app virá pré-populado com a **Tabela Brasileira de Composição de Alimentos (TACO - Unicamp)** em formato SQLite/JSON local, contendo mais de 500 alimentos nacionais categorizados com valores por 100g:
* Calorias (kcal), Proteína (g), Carboidratos (g), Lipídios/Gordura (g), Fibra alimentar (g).

### 3.2 Alimentos Pré-calibrados e Variações Usuais
O banco já trará mapeado e com sinônimos populares os alimentos citados na rotina:
* **Ovos:** Ovo de galinha inteiro cozido/frito (~50g), Clara de ovo (~30g), Gema de ovo (~20g).
* **Proteínas:** Peito de frango grelhado/cozido, carne suína magra (lombo/pernil limpo sem capa).
* **Carboidratos e Fibras:** Arroz branco cozido, Arroz integral, Feijão carioca cozido, Feijão preto, Pão francês (unidade ~50g), Pão de forma integral (fatia ~25g), Farinha de aveia, Farelo de aveia, Farofa tradicional.
* **Laticínios e Outros:** Queijo muçarela/minas, Leite integral/desnatado, Cacau em pó 100%, Amendoim torrado, Milho verde em conserva, Ervilha em conserva.
* **Suplementação:** Whey Protein Concentrado 80% e Isolado 90% (porções padrão de 30g com opção de edição da tabela nutricional da marca).

---

## 4. Pipeline de Processamento de Voz (Baixo Custo / Alta Eficiência)

Em vez de enviar arquivos pesados de áudio diretamente para a API (o que consome banda e encarece a requisição), o pipeline adotado é:

```
[ Usuário fala ] 
       │
       ▼
[ Android SpeechRecognizer ] -> Transcrição local imediata em texto (Custo Zero)
       │
       ▼ (Texto puro: ex: "No almoço comi 150g de peito de frango e dois ovos inteiros")
[ Gemini API (Structured Outputs / JSON Mode) ]
       │
       ▼ (Recebe JSON padronizado com ação e itens normalizados)
[ Room Database ] -> Atualiza refeição e macros do dia
```

### 4.1 Schema JSON de Resposta da LLM
O prompt de sistema força a LLM a responder **estritamente em formato JSON**:

```json
{
  "action": "ADD_ITEMS",
  "meal": "LUNCH",
  "target_date": "TODAY",
  "items": [
    {
      "food_name_query": "peito de frango",
      "quantity": 150,
      "unit": "g"
    },
    {
      "food_name_query": "ovo inteiro",
      "quantity": 2,
      "unit": "unidade"
    }
  ],
  "copy_action": null
}
```

### 4.2 Ações Suportadas por Voz
1. **Adição Direta:** *"Adicione 100g de arroz e 1 concha de feijão no almoço"*
2. **Adição de Receitas:** *"Adicione minha receita de omelete proteico no café da manhã"*
3. **Clonagem de Refeição:** *"Copie o almoço de ontem para hoje"*
4. **Clonagem do Dia Inteiro:** *"Repita todas as refeições do dia anterior para hoje"*
5. **Criação de Receita:** *"Crie uma receita chamada Almoço Padrão com 5 ovos, 20g de queijo e 1 pão francês"*

---

## 5. Modelagem do Banco de Dados (Room)

```
┌──────────────────┐       ┌────────────────────────┐       ┌──────────────────────┐
│     FoodItem     │       │        DailyLog        │       │       MealEntry      │
├──────────────────┤       ├────────────────────────┤       ├──────────────────────┤
│ id (PK)          │◄──┐   │ id (PK)                │◄──┐   │ id (PK)              │
│ name             │   │   │ date (YYYY-MM-DD)      │   │   │ daily_log_id (FK)────┼──┐
│ default_unit     │   │   │ water_ml (opcional)    │   │   │ meal_type (ENUM)     │  │
│ grams_per_unit   │   │   └────────────────────────┘   │   │ notes                │  │
│ kcal_per_100g    │   │                                │   └──────────────────────┘  │
│ protein_per_100g │   │                                │                             │
│ carbs_per_100g   │   │   ┌────────────────────────┐   │   ┌──────────────────────┐  │
│ fat_per_100g     │   └───┼──LoggedItem            │   └───┼──MealEntry (refeição)│  │
│ fiber_per_100g   │       ├────────────────────────┤       └──────────────────────┘  │
│ is_custom (bool) │       │ id (PK)                │                                 │
└──────────────────┘       │ meal_entry_id (FK)─────┼─────────────────────────────────┘
                           │ food_id (FK)           │
                           │ quantity_value         │
                           │ quantity_unit          │
                           │ calculated_kcal        │
                           │ calculated_protein     │
                           │ calculated_carbs       │
                           │ calculated_fat         │
                           │ calculated_fiber       │
                           └────────────────────────┘
```

### 5.1 Entidades para Receitas
* **Recipe (`id`, `name`, `description`)**
* **RecipeItem (`id`, `recipe_id`, `food_id`, `quantity_value`, `quantity_unit`)**

---

## 6. Telas e Fluxo da Interface (Compose)

### 6.1 Tela Principal (Dashboard Diário)
* **Topo:** Barra com seletor de data (Hoje, Ontem, Navegação por calendário) e botão de configurações (engrenagem).
* **Card de Metas do Dia:** Círculo ou barras de progresso com Calorias Totais consumidas vs Meta, e subdivisões:
  * Proteínas (g), Carboidratos (g), Gorduras (g), Fibras (g).
* **Seções de Refeições:**
  * Café da Manhã (Breakfast)
  * Almoço (Lunch)
  * Lanche da Tarde (Snack)
  * Jantar (Dinner)
  * Lanche Extra / Ceia (Supper)
  * *Cada refeição possui:* Lista de alimentos adicionados, somatório parcial de macros, botão de atalho `Copiar do Dia Anterior`, botão `+ Manual` e botão `+ Receita`.
* **Floating Action Button Central (FAB de Microfone):**
  * Pressionar para falar. Exibe modal de escuta com animação de onda sonora.
  * Ao soltar ou pausar, exibe a transcrição e um card de pré-visualização da ação interpretada (ex: *"Adicionar 150g de Arroz ao Almoço? [Confirmar] [Cancelar]"*), permitindo confirmação rápida ou auto-adição após 3 segundos.

### 6.2 Tela de Detalhes / Adição Manual
* Busca no banco de dados local com filtro instantâneo.
* Campo de peso/quantidade com conversor rápido (ex: selecionar "unidade" ou "gramas").
* Botão para cadastrar novo alimento personalizado caso não exista na base.

### 6.3 Tela de Receitas
* Lista de receitas salvas (ex: "Omelete Reforçado", "Shake Pós-Treino").
* Criador de receitas: agrupa múltiplos itens e calcula os macros por porção.
* Botão para carregar receita inteira diretamente em uma refeição do dia.

### 6.4 Tela de Configurações
* **Provedor de IA:** Opção de selecionar `Google Gemini` ou `OpenAI Compatible (DeepSeek, etc.)`.
* **API Key:** Campo de senha protegido com botão de teste de conexão.
* **Modelo Selecionado:** Dropdown/Chips (`gemini-3.8-flash`, `gemini-3.5-flash-lite`, etc.).
* **Metas Nutricionais:** Configuração manual de metas diárias de Kcal, Proteínas, Carbs, Gorduras e Fibras.

---

## 7. Configuração do Gemini e Prompt de Sistema

### Prompt de Sistema (System Instruction)
```text
Você é o assistente do aplicativo MacroVoice. Sua única função é receber a transcrição de voz do usuário e extrair comandos de alimentação diária, convertendo-os em um JSON válido.

Instruções:
1. Mapeie os alimentos falados para termos genéricos em português (ex: "frango" -> "peito de frango", "arroz" -> "arroz branco cozido", "ovo" -> "ovo de galinha inteiro").
2. Identifique quantidades e unidades (gramas, ml, fatias, unidades, colheres). Se nenhuma unidade for informada para itens unitários (ex: "2 ovos"), use "unidade". Para sólidos sem unidade explícita, use "g".
3. Identifique a refeição (BREAKFAST, LUNCH, SNACK, DINNER, SUPPER). Se não especificada, infira pelo horário ou marque "UNSPECIFIED".
4. Reconheça comandos de cópia (ex: "copiar ontem", "mesmo almoço de ontem").
5. Responda ESTRITAMENTE em formato JSON sem blocos de texto adicionais.
```

---

## 8. Guia de Implementação para o Gerador de Código (Next Step)

Ao submeter esta especificação para a IA de geração de código (ex: Antigravity / Claude Code / Gemini CLI):

1. **Fase 1 - Core & Database:** Criar o schema Room (`AppDatabase`), DAOs para `FoodDao`, `MealDao`, `RecipeDao`, e carregar o arquivo `taco_database.json` no primeiro boot do app (`RoomDatabase.Callback.onCreate`).
2. **Fase 2 - Serviço de Voz & Integração LLM:** Implementar o wrapper `SpeechRecognitionManager` e o cliente Retrofit/Ktor que conecta ao Gemini via `generateContent` enviando o áudio transcrito e recebendo o JSON estruturado.
3. **Fase 3 - Interface Jetpack Compose:** Criar as telas `DailyDashboardScreen`, `MealDetailScreen`, `RecipeScreen` e `SettingsScreen` com State Hoisting e navegação via `Jetpack Compose Navigation`.
4. **Fase 4 - Build Local:** Gerar o script Gradle para build de debug assinado localmente via `./gradlew assembleDebug` para geração direta do `.apk` instalável via USB ou transferência local.