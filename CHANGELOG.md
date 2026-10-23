# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [0.4.0] - 2026-10-16

### Adicionado & Aprimorado
- **Edição Completa de Receitas**:
  - Adicionado suporte para editar receitas existentes (`RecipeRepository.updateRecipe`), permitindo alterar nome, descrição, quantidades, unidades de medida e adicionar/remover ingredientes.
  - Botão de edição (`Editar` e ícone de lápis) integrado diretamente nos cards da tela *Minhas Receitas*.
- **Memória de Última Quantidade e Unidade em Alimentos Recentes**:
  - Os alimentos listados nas abas de *Recentes* agora recuperam e exibem a última quantidade e unidade consumidas pelo usuário (ex: `20 g`, `50 g`, `100 g`, `5 colher de sopa`).
  - Ao selecionar um alimento recente para adicionar à refeição, a última porção e unidade usadas já vêm automaticamente preenchidas.
- **Novo Fluxo Direto de Adição de Ingredientes nas Receitas**:
  - Ao pesquisar e tocar em um alimento no criador/editor de receitas, o alimento é adicionado imediatamente à lista da receita e a lista de opções da busca é fechada automaticamente.
  - Edição de quantidade e seleção de unidade agora ocorrem diretamente na linha de cada ingrediente adicionado (com foco automático na quantidade e cálculo de calorias/macros em tempo real), eliminando a etapa intermediária de confirmação manual antes de salvar a receita.

---

## [0.3.1] - 2026-10-12

### Adicionado & Aprimorado
- **Expansão de Suplementos Proteicos do Mercado Brasileiro**:
  - Inclusão das principais marcas de Whey Protein comercializadas no Brasil: Growth Supplements (100% Whey Concentrado 80%, Isolado 90%), Max Titanium (100% Whey, Top Whey 3D), Dux Nutrition (Concentrado, Isolado), IntegralMedica (100% Pure Whey, Iso Triple Zero), Probiótica (100% Pure Whey), Danone YoPRO (Bebida Láctea 15g e 25g UHT), Piracanjuba Whey (15g e 23g) e Italac Whey.
  - Inclusão de barras de proteína populares no Brasil: Bold Bar (60g), Bold Thin (40g), Max Titanium Power Protein Bar (90g), Darkness Monster Bar (90g), Growth Supplements Protein Bar (40g), Dux Bar (50g), IntegralMedica Crisp Bar (45g), Probiótica Choco Whey Bar (40g) e Nutry Protein Bar (40g).
  - Unidades caseiras calibradas por porção (`scoop` de 30g a 32g, `unidade` de garrafinha/barra com gramagem oficial do fabricante).
- **Novas Frutas Nativas e Tradicionais Brasileiras**:
  - Jabuticaba crua, Pitanga crua, Cupuaçu polpa, Graviola crua, Caju cru, Acerola crua, Pequi cru cozido, Caqui chocolate, Caqui fuyu, Maracujá fresco, Tangerina Ponkan, Laranja lima, Jaca crua e Água de coco verde natural.
- **Verduras, Legumes e Plantas Alimentícias Não Convencionais (PANC)**:
  - Ora-pro-nóbis (folhas cruas e refogadas - rica em proteínas e fibras), Taioba refogada, Quiabo (cozido e refogado), Jiló (cozido e refogado), Maxixe cozido, Chuchu refogado, Agrião cru, Espinafre refogado, Inhame cozido, Cará cozido, Palmito pupunha assado/cozido e Abóbora moranga cozida.
- **Quitutes e Doces Tradicionais Regionais**:
  - Queijo Canastra curado artesanal, Queijo do Serro artesanal, Bolo de cenoura com cobertura de chocolate, Bolo de fubá cremoso, Bolo de milho verde, Biscoito de polvilho assado, Paçoca de amendoim tipo rolha, Pé de moleque artesanal, Goiabada cascão tradicional, Doce de leite mineiro cremoso, Rapadura pura e Caldo de cana / garapa fresca.
- **Indexação Fonética e Busca Rápida**:
  - Mapeamento fonético e de sinônimos com suporte a busca sem acentos e termos parciais para acesso direto pelo modal de busca e comandos de voz sem necessidade de cadastro manual.
- **Base Total Expandida para 272 Alimentos**:
  - Sincronização automática na inicialização do aplicativo mantendo integridade e histórico dos logs do usuário.

---

## [0.3.0] - 2026-10-07

### Adicionado & Aprimorado
- **Abas de Alimentos Recentes por Refeição**:
  - Modal de busca manual agora inclui abas de navegação horizontal para cada refeição (*Café da Manhã*, *Almoço*, *Lanche*, *Jantar*, *Ceia* e *Todas*).
  - A aba correspondente à refeição aberta é pré-selecionada automaticamente.
  - Quando a barra de pesquisa está vazia, o aplicativo lista exclusivamente os alimentos consumidos recentemente naquela refeição (ordenados por uso mais recente), evitando poluir a tela com a listagem alfabética de todos os alimentos da tabela TACO.
  - Ao digitar qualquer termo no campo de busca, o app pesquisa dinamicamente e lista as opções correspondentes de toda a base de dados.
- **Unidade Padrão em Gramas (g) em Todo o App**:
  - Toda adição de alimentos agora possui como padrão a medição por gramas (`g`) com porção inicial de `100g`, em vez de colher de sopa, concha, unidade ou qualquer outra medida caseira.
  - As medidas caseiras originais continuam disponíveis nos botões segmentados como opção secundária, mas nunca vêm pré-selecionadas.
  - Padronização aplicada no modal de busca, no construtor de receitas e no fluxo de comando de voz.
- **Edição Completa de Alimentos Registrados na Refeição**:
  - Novo modal interativo de edição ao clicar sobre qualquer alimento registrado no card da refeição ou no botão de lápis (`pencil-outline`).
  - Permite alterar a quantidade numérica (com teclado e atalhos rápidos `+10g`, `-10g`, `+50g`, `-50g`).
  - Permite alterar a unidade de medida.
  - Permite substituir o alimento por outro através de busca no banco de dados.
  - Recálculo em tempo real de macronutrientes (calorias, proteínas, carboidratos, gorduras, fibras) conforme a quantidade é editada.
  - Opções diretas de Salvar Alterações e Excluir item.

---

## [0.2.3] - 2026-10-06

### Adicionado & Aprimorado
- **Expansão Massiva da Base de Alimentos Brasileiros (TACO / TBCA / Culinária Nacional)**:
  - Base expandida para 190 alimentos com composição nutricional detalhada (calorias, proteínas, carboidratos, gorduras, fibras) e medidas caseiras brasileiras.
  - **Farinhas e Grãos**: Farinha de trigo integral, farinha de mandioca crua e torrada, farinha de aveia, farinha de milho amarela (fubá), flocão de cuscuz, farinha de linhaça dourada e marrom, farinha de amêndoas, farinha de arroz, farinha de centeio integral, farinha de rosca, polvilho doce, polvilho azedo e tapioca hidratada.
  - **Aves e Cortes de Frango**: Peito de frango (grelhado, cozido, assado, desfiado refogado, cru, com pele), sobrecoxa de frango (sem pele assada, cozida, grelhada e com pele), coxa de frango (sem pele e com pele), asa de frango, coração de frango grelhado, moela cozida, fígado, filé à milanesa e linguiça de frango.
  - **Carnes Suínas**: Pernil suíno sem gordura e sem pele (assado, cozido, grelhado, com gordura), lombo suíno limpo sem gordura (grelhado e assado), costelinha de porco assada, bisteca suína grelhada, carne moída suína, bacon frito fatiado, linguiça toscana grelhada, linguiça calabresa defumada, paio de feijoada e torresmo crocante.
  - **Pescados, Frutos do Mar e Sashimi**: Sashimi de salmão fresco, sashimi de atum fresco, sashimi de peixe branco (tilápia/robalo), tilápia filé grelhado, salmão grelhado e assado, atum sólido em conserva e fresco, bacalhau cozido dessalgado, camarão cozido e grelhado no azeite, polvo cozido, lula grelhada e sardinha.
  - **Pratos e Receitas Típicas Brasileiras**: Feijoada completa, Baião de dois, Moqueca de peixe, Moqueca de camarão, Bobó de camarão, Galinhada com açafrão, Escondidinho de carne seca com mandioca, Escondidinho de frango, Estrogonofe de frango, Estrogonofe de carne bovina, Virado à paulista, Feijão tropeiro mineiro, Tutu de feijão, Arroz carreteiro, Vaca atolada, Caldo verde tradicional, Canja de galinha, Vatapá baiano, Acarajé com vatapá e camarão, Salpicão de frango, Quibe assado de carne moída, Panqueca de carne moída com molho, Panqueca integral de frango, Torta de frango de liquidificador, Empadão de frango, Coxinha de frango frita, Pastel de carne e queijo frito, Pão de queijo assado tradicional, Farofa de ovos caseira, Farofa de bacon e cebola, Tapioca com queijo coalho, Tapioca com frango desfiado e requeijão, Açaí na tigela com banana e granola, Brigadeiro tradicional, Beijinho de coco e Pudim de leite condensado com calda.
- **Motor de Busca e NLP Inteligente com Múltiplos Tokens e Insensibilidade a Acentos**:
  - Suporte total a consultas com múltiplos termos e pontuação (ex: "pernil suíno sem pele, sem gordura", "farinha integral", "sobrecoxa", "peito de frango", "chicken") com correspondência fonética e indexação bilateral (acentuado e desacentuado).
  - Algoritmo de ranking em tempo real dando prioridade a correspondências exatas, termos iniciais e favoritos customizados.
  - Sincronização inteligente no SQLite: bases já instaladas são atualizadas automaticamente na abertura do app sem perda de logs ou configurações existentes.
- **Receitas Predefinidas Brasileiras na Aba Receitas**:
  - Povoamento automático com 8 receitas saudáveis prontas para adicionar com um toque (Strogonoff de Frango Fitness, Baião de Dois Tradicional, Escondidinho de Frango, Panqueca Integral, Tapioca de Frango, Omelete de Frango com Queijo Minas, Farofa Funcional de Aveia e Ovos, e PF Tradicional).
- **Prompt da IA (Gemini/OpenAI) Aprimorado**:
  - Exemplos da culinária brasileira adicionados à instrução do sistema para mapear comandos de voz com precisão imediata.

---

## [0.2.1] - 2026-10-06

### Corrigido & Aprimorado
- **Modo Padrão de Entrada por Digitação / Teclado**:
  - O modal "Falar Refeição" agora abre por padrão no modo de digitação/teclado, permitindo escrever livremente ou usar a digitação por voz do próprio teclado (Gboard, Samsung, iOS).
  - Adicionado botão destacado para iniciar o modo "Falar Diretamente no Microfone".
  - Botão "Digitar por Teclado" no modo de voz para alternar de volta preservando o texto já capturado.
- **Prevenção de Cortes Prematuros na Fala Contínua**:
  - Reconhecimento nativo contínuo (`continuous: true`) com suporte a acumulação inteligente de alimentos sem corte após pequenas pausas.
  - Resultados intermediários não encerram mais o processo prematuramente.
- **Configurações de Voz Personalizáveis**:
  - Nova opção de parada: "Parar após tempo sem som" vs "Parar apenas no clique".
  - Tempo de espera sem som configurável nas Configurações (3s, 5s, 7s, 10s).
  - Escolha do modo inicial ao abrir ("Digitar / Teclado" ou "Falar Direto").

---

## [0.2.0] - 2026-10-06

### Adicionado
- **Modo Escuro (Dark Mode):**
  - Seletor de aparência nas Configurações com suporte a Claro, Escuro e Sistema.
  - Paletas de alto contraste e acessibilidade via React Native Paper MD3.
- **Registro de Peso Corporal do Dia (Weight Tracking):**
  - Botão inteligente no cabeçalho do Dashboard: ícone de balança (`scale-bathroom`) quando sem peso, substituído pelo badge (ex: `78.5 kg`) quando registrado.
  - Modal rápido para inserção, edição ou remoção do peso corporal diário.
  - Coluna `weight_kg` no SQLite com migração retrocompatível não-destrutiva.
  - Suporte completo no Backup JSON e na coluna `Peso do Dia (kg)` do CSV de refeições.
- **Histórico Analítico e Série Temporal (7, 15 e 30 Dias):**
  - Alternador no topo do Dashboard entre Registro Diário e Série Temporal.
  - Visualização em Cards/Tabela e Gráficos Pure React Native (sem dependências nativas extras).
  - Médias de calorias, proteínas e cálculo de variação total de peso no período.
  - Gráfico de barras de calorias com linha pontilhada da meta diária e linha do tempo de evolução do peso.
- **Ajustes de Água e Indicadores de Data:**
  - Botões `+250ml` e `+1L` no card dedicado de água.
  - Seletor de datas relativo: "Hoje" (sem número), "Ontem" (com subtítulo) e "Amanhã" (com subtítulo).
- **Edição e Gestão Interativa de Alimentos no Comando de Voz:**
  - Remoção direta de qualquer alimento com 1 toque no botão de lixeira.
  - Edição interativa de porções com teclado numérico e chips rápidos de unidades.
  - Substituição / troca de qualquer alimento com pesquisa dinâmica na base TACO.
  - Recálculo de macros em tempo real antes de salvar.
- **Automação de Build e Envio via ADB (Distrobox Fedora):**
  - Script [`scripts/install_apk_adb.sh`](scripts/install_apk_adb.sh) (`npm run install:android`) para enviar e instalar o APK no dispositivo conectado via ADB através do Distrobox Fedora com flags `-r -d` (preservando o banco de dados).
  - Novo passo integrado em [`scripts/build_android_apk.sh`](scripts/build_android_apk.sh) que compila e instala automaticamente caso o dispositivo esteja conectado.

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
