# Diet-AI - Plano de Implementação e Rastreamento de Progresso

> **Status Geral:** ✅ Concluído com Sucesso / Pronto para Uso  
> **Nome do App:** Diet-AI  
> **Tech Stack:** React Native (TypeScript) + Expo SDK 52 (Expo Prebuild / Gradle) + Material Design 3 (React Native Paper) + SQLite (`expo-sqlite`) + Google Gemini API + Reconhecimento de Voz Nativo do SO.

---

## 🎯 Objetivos do Projeto
- Rastreamento diário de calorias e macronutrientes (Proteínas, Carboidratos, Gorduras e Fibras).
- Entrada ágil e prioritária por **comando de voz via reconhecimento nativo do SO** (Android SpeechRecognizer / iOS SFSpeechRecognizer) a custo zero de transmissão de áudio.
- Interpretação semântica em linguagem natural via **Google Gemini API** recebendo apenas o texto transcrito e retornando JSON estruturado.
- Suporte auxiliar a envio de áudio direto para o Gemini (fallback caso o dispositivo não possua serviços nativos de fala configurados).
- Banco de dados local embarcado pré-populado com a **Tabela TACO (Unicamp)** e alimentos comuns calibrados.
- Interface em **Material Design 3** equivalente ao Jetpack Compose original.
- Build do APK Android nativo via **Gradle** (`./gradlew assembleDebug`), com suporte a exportação para iOS e Web.

---

## 📋 Checklist de Execução por Fases

### Fase 1: Setup do Projeto e Infraestrutura React Native
- [x] Inicializar projeto Expo com TypeScript e Expo Router
- [x] Configurar tema React Native Paper (Material Design 3) e ícones
- [x] Configurar suporte a permissões de áudio e plugins no `app.json`
- [x] Executar `npx expo prebuild` para gerar a pasta nativa `android/` com Gradle
- [x] Verificar script e estrutura de build Gradle

### Fase 2: Banco de Dados Local & Dataset TACO (SQLite)
- [x] Criar arquivo JSON com os alimentos da tabela TACO (Unicamp) e alimentos padrão calibrados
- [x] Implementar migrations e criação das tabelas SQLite (`food_items`, `daily_logs`, `meal_entries`, `logged_items`, `recipes`, `recipe_items`)
- [x] Implementar `FoodRepository` com suporte a busca instantânea (FTS)
- [x] Implementar `DailyLogRepository` e `MealRepository` (cálculo de macros, adição de itens, clonagem de refeições)
- [x] Implementar `RecipeRepository` (salvamento e inclusão de receitas completas)
- [x] Testar persistência e consistência dos cálculos matemáticos

### Fase 3: Pipeline de Voz e Integração Gemini (IA)
- [x] Implementar `VoiceRecognitionService` (wrapper de Speech-to-Text nativo sem custo)
- [x] Implementar `SecureStorageService` com `expo-secure-store` para chaves de API
- [x] Implementar `GeminiService` com Structured Outputs (JSON Schema estrito) e fallback OpenAI
- [x] Implementar `MealActionProcessor` para cruzamento inteligente entre resposta da IA e alimentos da TACO
- [x] Criar testes unitários para o processador de comandos e fallback de refeições

### Fase 4: Desenvolvimento da Interface do Usuário (UI/UX)
- [x] Implementar **Dashboard Diário**:
  - Seletor de data (Hoje, Ontem, picker)
  - Card de Metas Diárias com barras de progresso (Kcal, P, C, G, F)
  - 5 seções de refeição (Café da Manhã, Almoço, Lanche, Jantar, Ceia)
  - Ações de refeição: atalho "Copiar de Ontem", "+ Manual", "+ Receita"
  - FAB central de microfone
- [x] Implementar **Modal de Voz**:
  - Animação de onda de áudio pulsante
  - Exibição de transcrição em tempo real
  - Card de pré-visualização e confirmação com timer de auto-confirmação (3s)
- [x] Implementar **Tela de Busca & Adição Manual**:
  - Busca rápida FTS com cálculo dinâmico de porções
  - Cadastro de novo alimento personalizado
- [x] Implementar **Tela de Receitas**:
  - Criação e edição de receitas agrupadas
  - Inserção de receita direto na refeição
- [x] Implementar **Tela de Configurações**:
  - Configuração de API Key e Provedor (Gemini / OpenAI)
  - Seleção de modelo e ajuste de metas diárias de macros

### Fase 5: Validação, Build Gradle e Empacotamento
- [x] Executar validação com `tsc --noEmit` e suíte de testes unitários
- [x] Testar fluxo no celular via Expo Dev Client / Expo Go
- [x] Configurar compilação do APK de debug via `./gradlew assembleDebug` dentro de `android/`
- [x] Criar documentação final de walkthrough com instruções de uso e exportação
