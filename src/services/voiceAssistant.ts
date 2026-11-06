import { AssistantState, JarvisSettings } from '../types/jarvis';
import { jarvisAudio } from './audioSynth';

export class JarvisVoiceService {
  private recognition: any = null;
  private isListening: boolean = false;
  private continuousMode: boolean = false;
  private wakeWord: string = 'hey jarvis';
  private wakeWordActive: boolean = true;
  private onStateChange: (state: AssistantState) => void;
  private onTranscript: (transcript: string, isFinal: boolean) => void;
  private onCommandDetected: (command: string) => void;
  private onError: (error: string) => void;

  constructor(handlers: {
    onStateChange: (state: AssistantState) => void;
    onTranscript: (transcript: string, isFinal: boolean) => void;
    onCommandDetected: (command: string) => void;
    onError: (error: string) => void;
  }) {
    this.onStateChange = handlers.onStateChange;
    this.onTranscript = handlers.onTranscript;
    this.onCommandDetected = handlers.onCommandDetected;
    this.onError = handlers.onError;
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const activeText = (finalTranscript || interimTranscript).trim();
        if (!activeText) return;

        this.onTranscript(activeText, Boolean(finalTranscript));

        // Check for wake word if in wake-word detection mode
        const lower = activeText.toLowerCase();
        const wakeWords = [
          this.wakeWord.toLowerCase(),
          'hey jarvis',
          'hello jarvis',
          'jarvis',
          'hi jarvis',
          'ok jarvis',
        ];

        if (this.wakeWordActive) {
          const matched = wakeWords.find(w => lower.includes(w));
          if (matched) {
            jarvisAudio.playWakeChime();
            this.onStateChange('LISTENING');

            // Strip the wake word and extract command
            const command = lower.replace(matched, '').trim();
            if (command.length > 2 && finalTranscript) {
              this.onCommandDetected(command);
            }
            return;
          }
        }

        // If user already activated and speaks final transcript
        if (finalTranscript && finalTranscript.trim().length > 1) {
          this.onCommandDetected(finalTranscript.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') return;
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          this.onError('Microphone permission denied. Please allow microphone access.');
          this.onStateChange('ERROR');
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        // Auto-restart if continuous mode is enabled
        if (this.continuousMode) {
          try {
            this.recognition.start();
          } catch {
            // ignore rapid restart error
          }
        }
      };
    } catch (e: any) {
      console.error('Failed to initialize speech recognition:', e);
    }
  }

  public updateConfig(settings: JarvisSettings) {
    this.wakeWord = settings.wakeWord.toLowerCase();
    this.wakeWordActive = settings.wakeWordEnabled;
    this.continuousMode = settings.continuousListening;
  }

  public startListening(forceActive: boolean = false) {
    if (!this.recognition) {
      this.initSpeechRecognition();
    }
    if (!this.recognition) {
      this.onError('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      if (forceActive) {
        jarvisAudio.playWakeChime();
        this.onStateChange('LISTENING');
      }
    } catch {
      // Already running
      if (forceActive) {
        this.onStateChange('LISTENING');
      }
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
    this.onStateChange('STANDBY');
  }

  public speak(
    text: string,
    settings: JarvisSettings,
    onEndCallback?: () => void
  ) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onEndCallback) onEndCallback();
      return;
    }

    // Cancel any current utterance
    window.speechSynthesis.cancel();

    if (!text || text.trim() === '') {
      if (onEndCallback) onEndCallback();
      return;
    }

    this.onStateChange('SPEAKING');

    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/[*_#`]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = settings.voiceRate || 1.0;
    utterance.pitch = settings.voicePitch || 0.95;

    // Select British or configured voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      if (settings.voiceName) {
        const found = voices.find(v => v.name === settings.voiceName);
        if (found) utterance.voice = found;
      }
      if (!utterance.voice) {
        // Preferred authentic JARVIS tones: Google UK English Male, Daniel, George, Arthur, en-GB
        const preferred = voices.find(
          v =>
            (v.lang.includes('en-GB') || v.lang.includes('en_GB')) &&
            (v.name.toLowerCase().includes('male') ||
              v.name.toLowerCase().includes('daniel') ||
              v.name.toLowerCase().includes('george'))
        ) || voices.find(v => v.lang.includes('en-GB')) || voices.find(v => v.lang.startsWith('en'));
        if (preferred) utterance.voice = preferred;
      }
    }

    utterance.onend = () => {
      this.onStateChange('STANDBY');
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      console.warn('TTS error:', e);
      this.onStateChange('STANDBY');
      if (onEndCallback) onEndCallback();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      this.onStateChange('STANDBY');
    }
  }

  public static getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices();
  }
}
