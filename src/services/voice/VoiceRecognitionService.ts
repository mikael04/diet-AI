import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

export interface VoiceListenerCallbacks {
  onSpeechStart?: () => void;
  onSpeechResults?: (transcript: string) => void;
  onSpeechPartial?: (partial: string) => void;
  onSpeechEnd?: () => void;
  onError?: (error: string) => void;
}

export interface VoiceRecognitionOptions {
  continuous?: boolean;
  silenceTimeoutMillis?: number;
}

let cachedNativeModule: any = undefined;

function getNativeSpeechModule(): any {
  if (Platform.OS === 'web') return null;
  if (cachedNativeModule !== undefined) return cachedNativeModule;

  // Usa requireOptionalNativeModule oficial do Expo:
  // Retorna null silenciosamente se o módulo não existir no binário (como no Expo Go),
  // e retorna o módulo nativo quando compilado via Gradle / Dev Client.
  cachedNativeModule = requireOptionalNativeModule('ExpoSpeechRecognition');
  return cachedNativeModule;
}

export class VoiceRecognitionService {
  private static isListening: boolean = false;
  private static removeResultListener: (() => void) | null = null;
  private static removeErrorListener: (() => void) | null = null;
  private static removeEndListener: (() => void) | null = null;
  private static accumulatedTranscript: string = '';

  /**
   * Retorna o texto acumulado na sessão atual.
   */
  static getAccumulatedTranscript(): string {
    return this.accumulatedTranscript;
  }

  /**
   * Retorna se o motor de voz nativo do sistema está disponível neste ambiente.
   * Retorna true em builds nativos compilados via Gradle/EAS ou na Web com Web Speech API.
   * Retorna false no Expo Go (pois o Expo Go não inclui módulos nativos de terceiros).
   */
  static isSpeechAvailable(): boolean {
    if (Platform.OS === 'web') {
      return (
        typeof window !== 'undefined' &&
        Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
      );
    }
    return getNativeSpeechModule() !== null;
  }

  /**
   * Solicita permissão para microfone e reconhecimento de voz
   */
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true;
    }

    const nativeMod = getNativeSpeechModule();
    if (nativeMod && typeof nativeMod.requestPermissionsAsync === 'function') {
      try {
        const result = await nativeMod.requestPermissionsAsync();
        return result.status === 'granted';
      } catch (err) {
        console.warn('[VoiceService] Erro ao solicitar permissão nativa:', err);
      }
    }

    return false;
  }

  /**
   * Inicia o reconhecimento de voz nativo ou Web
   */
  static async startListening(
    callbacks: VoiceListenerCallbacks,
    options?: VoiceRecognitionOptions
  ): Promise<void> {
    this.isListening = true;
    this.accumulatedTranscript = '';

    // Web Speech API para navegadores
    if (Platform.OS === 'web') {
      this.startWebSpeech(callbacks, options);
      return;
    }

    const nativeMod = getNativeSpeechModule();

    if (!nativeMod) {
      this.isListening = false;
      callbacks.onError?.(
        'Reconhecimento de fala nativo não está disponível no Expo Go. Utilize o campo de texto ou compile o APK via Gradle.'
      );
      return;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        callbacks.onError?.('Permissão de microfone/fala não concedida.');
        this.isListening = false;
        return;
      }

      this.cleanupListeners();

      const resListener = nativeMod.addListener('result', (event: any) => {
        const rawTranscript = event.results?.[0]?.transcript || '';
        if (!rawTranscript) return;

        let fullTranscript = '';
        const prev = VoiceRecognitionService.accumulatedTranscript.trim();
        const current = rawTranscript.trim();

        if (prev && current.toLowerCase().startsWith(prev.toLowerCase())) {
          // Motor cumulativo (ex: iOS ou Web): o texto atual já contém todo o histórico
          fullTranscript = current;
        } else if (prev) {
          // Motor segmentado (ex: Android contínuo): o texto atual é um novo segmento
          fullTranscript = `${prev} ${current}`;
        } else {
          fullTranscript = current;
        }

        if (event.isFinal) {
          VoiceRecognitionService.accumulatedTranscript = fullTranscript;
          callbacks.onSpeechResults?.(fullTranscript);
        } else {
          callbacks.onSpeechPartial?.(fullTranscript);
        }
      });
      this.removeResultListener = () => resListener.remove();

      const errListener = nativeMod.addListener('error', (event: any) => {
        console.warn('[VoiceService] Evento de erro nativo:', event.error);
        // Se for speech-timeout ou no-speech mas já acumulamos texto, não descartamos
        if (
          (event.error === 'no-speech' || event.error === 'speech-timeout') &&
          VoiceRecognitionService.accumulatedTranscript
        ) {
          return;
        }
        callbacks.onError?.(event.message || event.error || 'Erro no reconhecimento');
      });
      this.removeErrorListener = () => errListener.remove();

      const endListener = nativeMod.addListener('end', () => {
        this.isListening = false;
        callbacks.onSpeechEnd?.();
      });
      this.removeEndListener = () => endListener.remove();

      callbacks.onSpeechStart?.();

      const isContinuous = options?.continuous ?? true;
      const silenceMs = options?.silenceTimeoutMillis || 60000;

      await nativeMod.start({
        lang: 'pt-BR',
        interimResults: true,
        maxAlternatives: 1,
        continuous: isContinuous,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
        androidIntentOptions: {
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: silenceMs,
          EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: silenceMs,
          EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: Math.min(silenceMs, 10000),
        },
      });
    } catch (error: any) {
      console.error('[VoiceService] Falha ao iniciar reconhecimento nativo:', error);
      callbacks.onError?.(error.message || 'Falha ao iniciar microfone');
      this.isListening = false;
    }
  }

  /**
   * Para o reconhecimento de voz
   */
  static async stopListening(): Promise<void> {
    this.isListening = false;

    if (Platform.OS === 'web') {
      this.stopWebSpeech();
      return;
    }

    const nativeMod = getNativeSpeechModule();
    if (nativeMod) {
      try {
        await nativeMod.stop();
      } catch (err) {
        console.warn('[VoiceService] Erro ao parar microfone:', err);
      }
    }
  }

  private static cleanupListeners(): void {
    if (this.removeResultListener) {
      this.removeResultListener();
      this.removeResultListener = null;
    }
    if (this.removeErrorListener) {
      this.removeErrorListener();
      this.removeErrorListener = null;
    }
    if (this.removeEndListener) {
      this.removeEndListener();
      this.removeEndListener = null;
    }
  }

  // --- Suporte a navegadores / Web Fallback ---
  private static webRecognitionInstance: any = null;

  private static startWebSpeech(
    callbacks: VoiceListenerCallbacks,
    options?: VoiceRecognitionOptions
  ): void {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      callbacks.onError?.('Reconhecimento de fala não suportado neste navegador. Utilize o campo de digitação.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = options?.continuous ?? true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        callbacks.onSpeechStart?.();
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        const isFinal = Boolean(event.results[event.results.length - 1]?.isFinal);
        if (isFinal) {
          VoiceRecognitionService.accumulatedTranscript = transcript;
          callbacks.onSpeechResults?.(transcript);
        } else {
          callbacks.onSpeechPartial?.(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        callbacks.onError?.(event.error || 'Erro no reconhecimento web');
      };

      recognition.onend = () => {
        callbacks.onSpeechEnd?.();
      };

      this.webRecognitionInstance = recognition;
      recognition.start();
    } catch (e: any) {
      callbacks.onError?.(e.message || 'Erro ao inicializar fala na web');
    }
  }

  private static stopWebSpeech(): void {
    if (this.webRecognitionInstance) {
      try {
        this.webRecognitionInstance.stop();
      } catch {}
      this.webRecognitionInstance = null;
    }
  }
}
