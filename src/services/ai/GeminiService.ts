import { ParsedMealCommand, MealType } from '../../types';
import { SecureStorageService } from '../storage/SecureStorageService';

const SYSTEM_INSTRUCTION = `
Você é o assistente do aplicativo Diet-AI. Sua única função é receber a transcrição de voz do usuário e extrair comandos de alimentação diária, convertendo-os em um JSON válido.

Instruções:
1. Mapeie os alimentos falados para termos genéricos em português (ex: "frango" -> "peito de frango", "arroz" -> "arroz branco cozido", "ovo" -> "ovo de galinha inteiro", "whey" -> "whey protein concentrado").
2. Identifique quantidades numéricas e unidades (gramas, ml, fatias, unidades, colheres, conchas, scoops, xícaras). Se nenhuma unidade for informada para itens unitários (ex: "2 ovos"), use "unidade". Para sólidos sem unidade explícita, use "g".
3. Identifique a refeição (BREAKFAST, LUNCH, SNACK, DINNER, SUPPER). Se não especificada, infira pelo contexto/horário atual ou marque "UNSPECIFIED".
4. Reconheça comandos de cópia (ex: "copiar ontem", "mesmo almoço de ontem"). Ações: ADD_ITEMS, COPY_MEAL, COPY_DAY, CREATE_RECIPE.
5. Responda ESTRITAMENTE em formato JSON sem blocos de texto adicionais ou cercas markdown (sem \`\`\`json).
`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['ADD_ITEMS', 'COPY_MEAL', 'COPY_DAY', 'CREATE_RECIPE'],
    },
    meal: {
      type: 'string',
      enum: ['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER', 'SUPPER', 'UNSPECIFIED'],
    },
    target_date: {
      type: 'string',
      description: "TODAY, YESTERDAY ou YYYY-MM-DD",
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          food_name_query: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
        },
        required: ['food_name_query', 'quantity', 'unit'],
      },
    },
    copy_source: {
      type: 'object',
      properties: {
        from_date: { type: 'string' },
        from_meal: {
          type: 'string',
          enum: ['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER', 'SUPPER'],
        },
      },
    },
    recipe_name: { type: 'string', nullable: true },
  },
  required: ['action', 'meal', 'target_date', 'items'],
};

export class GeminiService {
  /**
   * Processa a transcrição de voz com o Gemini (ou OpenAI compatível)
   */
  static async parseVoiceCommand(
    transcript: string,
    currentMealContext?: MealType
  ): Promise<ParsedMealCommand> {
    const provider = await SecureStorageService.getAiProvider();

    if (provider === 'gemini') {
      return await this.callGemini(transcript, currentMealContext);
    } else {
      return await this.callOpenAi(transcript, currentMealContext);
    }
  }

  /**
   * Processa comando diretamente a partir de áudio gravado (usado no Expo Go ou fallback)
   */
  static async parseAudioCommand(
    audioBase64: string,
    mimeType: string = 'audio/mp4',
    currentMealContext?: MealType
  ): Promise<ParsedMealCommand> {
    const apiKey = await SecureStorageService.getGeminiApiKey();
    if (!apiKey) {
      throw new Error(
        'Chave de API do Gemini não configurada. Por favor, adicione sua chave na tela de Configurações.'
      );
    }

    const model = await SecureStorageService.getAiModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contextPrompt = `
Contexto atual:
- Horário atual local: ${new Date().toLocaleTimeString('pt-BR')}
- Refeição em foco (se usuário não especificar outra): ${currentMealContext || 'UNSPECIFIED'}

O usuário gravou um áudio informando o que comeu. Ouça o áudio, identifique os alimentos e converta no JSON exigido.
`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: contextPrompt },
            {
              inlineData: {
                mimeType,
                data: audioBase64,
              },
            },
          ],
        },
      ],
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.1,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro na API do Gemini (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const candidateParts = data.candidates?.[0]?.content?.parts || [];
    const nonThoughtPart = candidateParts.find((p: any) => !p.thought);
    const candidateText = nonThoughtPart?.text || candidateParts[0]?.text;

    if (!candidateText) {
      throw new Error('A IA não conseguiu interpretar o áudio.');
    }

    return this.sanitizeAndParseJson(candidateText);
  }

  /**
   * Chamada direta à API do Google Gemini com Structured Outputs
   */
  private static async callGemini(
    transcript: string,
    currentMealContext?: MealType
  ): Promise<ParsedMealCommand> {
    const apiKey = await SecureStorageService.getGeminiApiKey();
    if (!apiKey) {
      throw new Error(
        'Chave de API do Gemini não configurada. Por favor, adicione sua chave na tela de Configurações.'
      );
    }

    const model = await SecureStorageService.getAiModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contextPrompt = `
Contexto atual:
- Horário atual local: ${new Date().toLocaleTimeString('pt-BR')}
- Refeição em foco (se usuário não especificar outra): ${currentMealContext || 'UNSPECIFIED'}

Transcrição do usuário:
"${transcript}"
`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: contextPrompt }],
        },
      ],
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.1,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro na API do Gemini (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const candidateParts = data.candidates?.[0]?.content?.parts || [];
    const nonThoughtPart = candidateParts.find((p: any) => !p.thought);
    const candidateText = nonThoughtPart?.text || candidateParts[0]?.text;

    if (!candidateText) {
      throw new Error('A IA não retornou nenhum dado estruturado.');
    }

    return this.sanitizeAndParseJson(candidateText);
  }

  /**
   * Chamada a endpoint compatível com OpenAI (DeepSeek, etc.)
   */
  private static async callOpenAi(
    transcript: string,
    currentMealContext?: MealType
  ): Promise<ParsedMealCommand> {
    const endpoint = await SecureStorageService.getOpenAiEndpoint();
    const apiKey = await SecureStorageService.getGeminiApiKey(); // reutiliza ou busca token
    const model = await SecureStorageService.getAiModel();

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey || ''}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          {
            role: 'user',
            content: `Refeição em foco: ${currentMealContext || 'UNSPECIFIED'}\nTranscrição: "${transcript}"`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro na API OpenAI (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return this.sanitizeAndParseJson(content);
  }

  /**
   * Testa a conectividade com a API
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await this.parseVoiceCommand('100g de arroz no almoço');
      if (res && res.action) {
        return { success: true, message: 'Conexão estabelecida com sucesso!' };
      }
      return { success: false, message: 'Resposta inválida recebida da API.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Falha ao testar conexão.' };
    }
  }

  private static sanitizeAndParseJson(raw: string): ParsedMealCommand {
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    return JSON.parse(cleaned) as ParsedMealCommand;
  }
}
