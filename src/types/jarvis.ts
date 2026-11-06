export type AssistantState =
  | 'STANDBY'
  | 'LISTENING'
  | 'PROCESSING'
  | 'THINKING'
  | 'SPEAKING'
  | 'EXECUTING'
  | 'ERROR';

export type MemoryCategory =
  | 'short_term'
  | 'long_term'
  | 'preferences'
  | 'task_history'
  | 'knowledge_base'
  | 'project_context';

export interface JarvisMemory {
  id: string;
  category: MemoryCategory;
  title: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
}

export interface ConnectivityState {
  internet: boolean;
  geminiConfigured: boolean;
  provider: string;
  backend: 'connected' | 'connecting' | 'disconnected' | 'error';
  localAiAvailable: boolean;
  memoryCount: number;
  lastChecked: string;
}

export interface JarvisSettings {
  wakeWordEnabled: boolean;
  wakeWord: string;
  voiceName: string;
  voiceRate: number;
  voicePitch: number;
  continuousListening: boolean;
  soundEffectsEnabled: boolean;
  memoryEnabled: boolean;
  aiProvider: 'gemini' | 'ollama' | 'auto';
  ollamaUrl: string;
  userTitle: string; // e.g. "Sir"
  autoExecuteSafeActions: boolean;
  privacyStrict: boolean;
}

export interface JarvisAction {
  type:
    | 'open_url'
    | 'web_search'
    | 'create_reminder'
    | 'create_note'
    | 'calculate'
    | 'camera_scan'
    | 'device_command'
    | 'translate'
    | 'system_check';
  params: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  detailedResponse?: string;
  timestamp: string;
  action?: JarvisAction | null;
  state?: AssistantState;
}

export interface ReminderItem {
  id: string;
  title: string;
  dueTime: string;
  completed: boolean;
  createdAt: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface ExecutionLog {
  id: string;
  actionType: string;
  description: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  details?: string;
}
