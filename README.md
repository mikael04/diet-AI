# Diet-AI 🥗🎙️

[![Versão](https://img.shields.io/badge/vers%C3%A3o-0.1.0-blue.svg)](CHANGELOG.md)
[![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-green.svg)](LICENSE)
[![Expo](https://img.shields.io/badge/Expo-SDK%2052%2F57-000020.svg)](https://expo.dev)

> Aplicativo multiplataforma para rastreamento de macronutrientes com interação primária por **comando de voz**, inteligência artificial com **Google Gemini** e banco de dados local embarcado pré-populado com a **Tabela TACO (Unicamp)**.

---

## 📱 Tecnologias & Arquitetura

* **Framework:** React Native (TypeScript) + **Expo SDK 52/57 (Expo Prebuild)**
* **Compilação Android:** Nativa via **Gradle** (`./gradlew assembleDebug` na pasta `android/`)
* **Design System:** Material Design 3 via **React Native Paper**
* **Banco de Dados Local:** SQLite (`expo-sqlite`) com migrações automáticas e busca rápida
* **Base Nutricional:** **Tabela TACO (Unicamp)** com mais de 500 alimentos e porções populares pré-calibradas
* **Reconhecimento de Voz:** Transcrição local nativa do sistema operacional (`android.speech.SpeechRecognizer` / `SFSpeechRecognizer`) com **Custo Zero** de áudio
* **Inteligência Artificial:** **Google Gemini API** (ou endpoints OpenAI compatíveis) em modo estruturado (JSON Schema) para interpretação dos alimentos e quantidades
* **Armazenamento Seguro:** `expo-secure-store` para chaves de API

---

## 🚀 Como Rodar o Projeto

### 1. Desenvolvimento Rápido no Celular (Recomendado)
A maneira mais rápida e prática de testar o aplicativo e o microfone no celular real:

```bash
# Iniciar o servidor Expo Metro
npm start
```
1. Instale o app **Expo Go** no seu smartphone (Android ou iPhone).
2. Abra a câmera ou o Expo Go e leia o **QR Code** exibido no terminal.
3. O app será carregado instantaneamente com hot-reloading e suporte a comandos de voz.

---

### 2. Rodar no Navegador (Web)
```bash
npm run web
```
Acesse `http://localhost:8081` para visualizar e interagir com o app no seu computador.

---

### 3. Compilação do APK Android via Gradle

O projeto já conta com a pasta nativa `android/` configurada via Expo Prebuild:

```bash
# Executar a compilação do APK de debug
npm run build:android
# ou diretamente:
cd android && ./gradlew assembleDebug
```
* O arquivo `.apk` gerado estará em:  
  `android/app/build/outputs/apk/debug/app-debug.apk`

*(Observação: Requer JDK 17+ e Android SDK configurados no ambiente de compilação).*

---

### 4. Exportar para iOS ou Outras Plataformas
Para gerar o projeto nativo do iOS para compilar via Xcode:
```bash
npx expo prebuild --platform ios
```

---

## 🎙️ Como Funciona o Comando de Voz

```
[ Usuário fala ]
       │
       ▼
[ Reconhecimento Nativo do SO ] -> Transcrição local imediata em texto (Custo Zero)
       │
       ▼ (Apenas o texto puro é enviado: ex: "No almoço comi 150g de frango e 2 ovos")
[ Google Gemini API (Structured Output) ] -> Retorna JSON normalizado
       │
       ▼
[ Banco SQLite da TACO ] -> Mapeia termos, calcula gramas e macros exatos
       │
       ▼
[ Modal de Confirmação ] -> Mostra macros calculados e salva na refeição
```

---

## 🧪 Testes Automatizados

Para rodar os testes unitários de cálculo nutricional e validação de dados da TACO:
```bash
npm test
```

Para verificar a integridade da tipagem TypeScript:
```bash
npm run typecheck
```

---

## 🏷️ Controle de Versão & Releases (Version Control)

O projeto adota o padrão **[Semantic Versioning 2.0.0](https://semver.org/lang/pt-BR/)** (`MAJOR.MINOR.PATCH`), iniciando na série **`0.1.x`** (`0.1.0`), representando a fase de desenvolvimento funcional e pré-lançamento ativo.

### 📌 Mapeamento de Versões no Projeto

Quando uma nova versão for publicada, a versão deve ser sincronizada nos seguintes arquivos:

| Arquivo | Propriedade | Exemplo | Descrição |
| :--- | :--- | :--- | :--- |
| `package.json` | `"version"` | `"0.1.0"` | Versão do pacote do ecossistema Node/NPM |
| `app.json` | `"expo.version"` | `"0.1.0"` | Versão exibida pelo Expo e metadados da aplicação |
| `android/app/build.gradle` | `versionName` | `"0.1.0"` | Nome da versão apresentada no Android |
| `android/app/build.gradle` | `versionCode` | `1` | Inteiro incremental obrigatório para upgrades de APK/Play Store |

### 🌿 Fluxo de Ramificações (Git Branching)

* **`main`**: Ramificação principal e estável. Contém as versões lançadas e tagueadas.
* **`feature/<nome>`**: Novas funcionalidades (ex: `feature/export-csv`, `feature/gemini-stream`).
* **`fix/<nome>`**: Correções de problemas ou bugs específicos.
* **`chore/<nome>`**: Tarefas de manutenção, dependências e automação de build.

### ✍️ Padrão de Commits (Conventional Commits)

Os commits devem seguir o padrão:
* `feat:` Implementação de nova funcionalidade (ex: `feat: add backup json import`)
* `fix:` Correção de bug (ex: `fix: handle gemini-3 thoughts block in response`)
* `docs:` Atualizações de documentação (ex: `docs: add version control guide to readme`)
* `refactor:` Melhorias internas sem alteração na regra de negócio
* `test:` Adição ou ajuste de testes automatizados
* `chore:` Manutenção de build, scripts ou pacotes

### 🏷️ Como Criar uma Nova Tag de Versão

Para criar uma nova versão no controle de versão Git:

```bash
# 1. Certifique-se de que os testes e tipos passam
npm run typecheck && npm test

# 2. Crie uma tag anotada (iniciando em 0.1)
git tag -a v0.1.0 -m "Release v0.1.0: Voice logging, Gemini AI, TACO SQLite, Export/Import & Gradle build"

# 3. Envie a tag para o repositório remoto
git push origin v0.1.0
```

Para listar as versões existentes:
```bash
git tag -n
```

O histórico detalhado de todas as versões e alterações pode ser acompanhado no arquivo [CHANGELOG.md](CHANGELOG.md).

---

## 📂 Estrutura do Projeto

```
diet-AI/
├── android/                   # Projeto nativo Android configurado com Gradle
├── assets/
│   └── data/
│       └── taco_database.json # Base de dados nutricionais TACO (Unicamp)
├── src/
│   ├── components/            # MacroProgressBar, MealCard, VoiceModal, FoodSearchModal
│   ├── database/              # Inicializador SQLite, Schemas e Repositórios
│   │   └── repositories/      # FoodRepository, DailyLogRepository, RecipeRepository
│   ├── screens/               # DashboardScreen, RecipesScreen, SettingsScreen
│   ├── services/
│   │   ├── ai/                # GeminiService (Structured Outputs & OpenAI fallback)
│   │   ├── nlp/               # MealActionProcessor (conversão semântica)
│   │   ├── storage/           # SecureStorageService (Armazenamento de API Key)
│   │   └── voice/             # VoiceRecognitionService (motor de voz nativo)
│   ├── theme/                 # Paleta Material Design 3 e cores de macros
│   ├── types/                 # Interfaces TypeScript do modelo de dados
│   └── utils/                 # Cálculo proporcional de macros e normalização
├── .plan/
│   └── plan.md                # Rastreamento de progresso do projeto
├── App.tsx                    # Shell principal do aplicativo
├── app.json                   # Configurações do Expo e permissões nativas
└── package.json               # Dependências e scripts de execução
```
