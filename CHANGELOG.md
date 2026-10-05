# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [0.2.0] - 2026-10-05

### Adicionado
- **Edição e Gestão Interativa de Alimentos no Comando de Voz:**
  - Remoção direta de qualquer alimento com 1 toque no botão de lixeira.
  - Edição interativa de porções com teclado numérico e chips rápidos de unidades (`g`, `unidade`, `colher`, `fatia`, `scoop`, `ml`).
  - Substituição / troca de qualquer alimento com pesquisa dinâmica na base TACO em tempo real.
  - Adição de novos alimentos complementares no modal antes de salvar.
  - Recálculo de calorias e macronutrientes em tempo real.
- **Distribuição Standalone de APK:**
  - Cópia automática do APK para a raiz com o nome versionado `diet-AI-0.2.apk`.
  - Empacotamento embutido do bundle JavaScript (`index.android.bundle`), eliminando a dependência do servidor Metro no celular.
  - Atualização do `versionCode` para 2 no Android para permitir atualização transparente sobre a versão 0.1 sem perda de dados.

---

## [0.1.0] - 2026-10-05

### Adicionado
- **Reconhecimento de Voz Nativo com Custo Zero:**
  - Integração nativa com `expo-speech-recognition` (`android.speech.SpeechRecognizer` no Android e `SFSpeechRecognizer` no iOS).
  - Modal interativo de escuta e processamento com animações e transcrição em tempo real.
- **Inteligência Artificial (Google Gemini):**
  - Integração com Google Gemini (`gemini-3.8-flash` e `gemini-3.5-flash-lite`) via `@google/genai`.
  - Suporte a Structured Outputs (JSON Schema) para interpretação de alimentos, unidades e refeições.
  - Seletor rápido de modelo de IA e validação de chaves gratuitas do Google AI Studio.
  - Filtragem de blocos de raciocínio (*thoughts*) do Gemini 3.
- **Banco de Dados Nutricional Local (TACO):**
  - Banco de dados SQLite (`expo-sqlite`) embutido com mais de 500 alimentos da Tabela Brasileira de Composição de Alimentos (TACO - Unicamp).
  - Sinônimos populares e pesos médios por unidade (ovos, pão francês, fatias, scoops, colheres).
  - Suporte a alimentos customizados e receitas salvas pelo usuário.
- **Exportação e Importação de Dados:**
  - Exportação completa em formato JSON estruturado com metadados para backup e portabilidade.
  - Exportação em CSV (compatível com Excel/Sheets, codificado em UTF-8 com BOM) de histórico de refeições diárias e de alimentos/receitas cadastradas.
  - Importação de arquivos de backup JSON (`expo-document-picker`) com validação de payload e mesclagem idempotente no SQLite.
  - Compartilhamento nativo de arquivos exportados via `expo-sharing`.
- **Interface Gráfica (Material Design 3):**
  - Tema moderno via `react-native-paper` com paleta consistente de macronutrientes (Calorias, Proteína, Carboidrato, Gordura, Fibra).
  - Dashboard diário com progresso de metas, seletor de datas e listagem por refeições (Café da Manhã, Almoço, Café da Tarde, Jantar, Ceia).
  - Aba de Receitas e busca de alimentos com cálculo de porção em tempo real.
  - Aba de Configurações com metas diárias ajustáveis, chave da API Gemini, backup e exportação/importação.
- **Build Nativo Android via Gradle:**
  - Configuração do Android Gradle Plugin (AGP), NDK 27 e CMake 3.22.
  - Empacotamento automático do bundle JavaScript (`index.android.bundle`) dentro do APK (`debuggableVariants = []`), permitindo funcionamento 100% offline e independente sem dependência do servidor Metro no PC.
  - Script automatizado de compilação de APK (`scripts/build_android_apk.sh` e `npm run build:android`) compatível com JDK 17 LTS.
- **Edição e Gestão Interativa de Alimentos no Comando de Voz:**
  - Remoção direta de qualquer alimento interpretado pelo Gemini através do botão de lixeira.
  - Edição interativa de porções (quantidade e unidades com chips rápidos: `g`, `unidade`, `colher`, `fatia`, `scoop`, `ml`).
  - Troca/substituição de alimentos em tempo real com busca rápida na base TACO.
  - Adição manual de alimentos complementares no próprio modal antes da confirmação.
- **Testes Automatizados:**
  - Bateria de testes unitários (`scripts/test_nutrition_logic.ts`) para cálculos de macros, conversão de medidas da TACO, exportação e validação de importação JSON/CSV.

[0.1.0]: https://github.com/mikael04/diet-AI/releases/tag/v0.1.0
