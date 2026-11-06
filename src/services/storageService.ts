import { JarvisSettings, ReminderItem, NoteItem, ExecutionLog, ChatMessage } from '../types/jarvis';

const STORAGE_KEYS = {
  SETTINGS: 'jarvis_settings_v1',
  REMINDERS: 'jarvis_reminders_v1',
  NOTES: 'jarvis_notes_v1',
  LOGS: 'jarvis_action_logs_v1',
  CHAT: 'jarvis_chat_history_v1',
};

export const DEFAULT_SETTINGS: JarvisSettings = {
  wakeWordEnabled: true,
  wakeWord: 'Hey JARVIS',
  voiceName: '',
  voiceRate: 1.05,
  voicePitch: 0.95,
  continuousListening: false,
  soundEffectsEnabled: true,
  memoryEnabled: true,
  aiProvider: 'gemini',
  ollamaUrl: 'http://127.0.0.1:11434',
  userTitle: 'Sir',
  autoExecuteSafeActions: true,
  privacyStrict: false,
};

export class StorageService {
  public static getSettings(): JarvisSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {}
    return DEFAULT_SETTINGS;
  }

  public static saveSettings(settings: JarvisSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {}
  }

  public static getReminders(): ReminderItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      if (data) return JSON.parse(data);
    } catch {}
    return [
      {
        id: 'rem_1',
        title: 'Review Stark Industries Mark 85 Telemetry',
        dueTime: '17:00 Today',
        completed: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rem_2',
        title: 'Quantum Entanglement Algorithm Check',
        dueTime: 'Tomorrow at 09:30',
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  public static saveReminders(reminders: ReminderItem[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    } catch {}
  }

  public static getNotes(): NoteItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (data) return JSON.parse(data);
    } catch {}
    return [
      {
        id: 'note_1',
        title: 'Arc Reactor Core Optimization',
        content: 'Palladium core replaced by synthesized badassium isotope. Core output efficiency rated at 3 gigajoules per second.',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  public static saveNotes(notes: NoteItem[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch {}
  }

  public static getLogs(): ExecutionLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  }

  public static addLog(log: Omit<ExecutionLog, 'id' | 'timestamp'>) {
    try {
      const logs = this.getLogs();
      const newLog: ExecutionLog = {
        ...log,
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      logs.unshift(newLog);
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 50)));
    } catch {}
  }

  public static getChatHistory(): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  }

  public static saveChatHistory(history: ChatMessage[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(history.slice(-30)));
    } catch {}
  }
}
