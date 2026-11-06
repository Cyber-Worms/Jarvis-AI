/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * JARVIS — JUST A RATHER VERY INTELLIGENT SYSTEM
 * Main Dashboard contains ONLY the 4 required elements:
 * 1. Central AI Reactor
 * 2. Settings
 * 3. Memory Management
 * 4. Connectivity Status
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings as SettingsIcon, Brain } from 'lucide-react';
import {
  AssistantState,
  ConnectivityState,
  JarvisMemory,
  JarvisSettings,
  ChatMessage,
  ReminderItem,
  NoteItem,
  ExecutionLog,
} from './types/jarvis';
import { AiReactor } from './components/AiReactor';
import { ConnectivityStatus } from './components/ConnectivityStatus';
import { SettingsModal } from './components/SettingsModal';
import { MemoryModal } from './components/MemoryModal';
import { SecondaryConsoleModal } from './components/SecondaryConsoleModal';
import { JarvisVoiceService } from './services/voiceAssistant';
import { StorageService, DEFAULT_SETTINGS } from './services/storageService';
import { JarvisAutomationService } from './services/automationService';
import { jarvisAudio } from './services/audioSynth';

export default function App() {
  // 1. Assistant State
  const [assistantState, setAssistantState] = useState<AssistantState>('STANDBY');
  const [activeTranscript, setActiveTranscript] = useState<string>('');
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);

  // 2. Modals State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState<boolean>(false);
  const [isSecondaryConsoleOpen, setIsSecondaryConsoleOpen] = useState<boolean>(false);

  // 3. Settings & Memory State with Lazy Initializers (prevents setState on mount)
  const [settings, setSettings] = useState<JarvisSettings>(() => StorageService.getSettings());
  const [memories, setMemories] = useState<JarvisMemory[]>([]);
  const [isMemoryEnabled, setIsMemoryEnabled] = useState<boolean>(() => StorageService.getSettings().memoryEnabled);

  // 4. Productivity & Chat Store with Lazy Initializers
  const [messages, setMessages] = useState<ChatMessage[]>(() => StorageService.getChatHistory());
  const [reminders, setReminders] = useState<ReminderItem[]>(() => StorageService.getReminders());
  const [notes, setNotes] = useState<NoteItem[]>(() => StorageService.getNotes());
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>(() => StorageService.getLogs());

  // 5. Connectivity State
  const [connectivity, setConnectivity] = useState<ConnectivityState>({
    internet: typeof navigator !== 'undefined' ? navigator.onLine : true,
    geminiConfigured: false,
    provider: 'Probing...',
    backend: 'connecting',
    localAiAvailable: false,
    memoryCount: 0,
    lastChecked: new Date().toISOString(),
  });
  const [isProbingNetwork, setIsProbingNetwork] = useState(false);

  // Synchronized Mutable Refs (guarantees zero re-render dependencies in callbacks)
  const voiceServiceRef = useRef<JarvisVoiceService | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;
  const settingsRef = useRef<JarvisSettings>(settings);
  settingsRef.current = settings;
  const isMemoryEnabledRef = useRef<boolean>(isMemoryEnabled);
  isMemoryEnabledRef.current = isMemoryEnabled;

  // Probe backend and AI connectivity
  const probeConnectivity = useCallback(async () => {
    setIsProbingNetwork(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setConnectivity({
          internet: navigator.onLine,
          geminiConfigured: Boolean(data.connectivity.geminiConfigured),
          provider: data.connectivity.provider || 'Google Gemini 3.8 Flash',
          backend: 'connected',
          localAiAvailable: Boolean(data.connectivity.localAiAvailable),
          memoryCount: data.connectivity.memoryCount || 0,
          lastChecked: new Date().toISOString(),
        });
      } else {
        throw new Error('Backend HTTP ' + res.status);
      }
    } catch {
      setConnectivity((prev) => ({
        ...prev,
        internet: navigator.onLine,
        backend: 'error',
        provider: 'Offline Standby',
        lastChecked: new Date().toISOString(),
      }));
    } finally {
      setIsProbingNetwork(false);
    }
  }, []);

  // Fetch memories from backend
  const fetchMemories = useCallback(async () => {
    try {
      const res = await fetch('/api/jarvis/memories');
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (err) {
      console.warn('Memory sync fallback:', err);
    }
  }, []);

  // Command processing dispatcher (completely decoupled from state identity)
  const handleProcessCommand = useCallback(async (commandText: string) => {
    if (!commandText || !commandText.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text: commandText,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => {
      const updated = [...prev, userMsg];
      StorageService.saveChatHistory(updated);
      return updated;
    });

    setAssistantState('THINKING');

    // Check for voice commands that trigger secondary screens
    const lower = commandText.toLowerCase();
    if (lower.includes('open console') || lower.includes('show terminal') || lower.includes('open terminal')) {
      setIsSecondaryConsoleOpen(true);
    } else if (lower.includes('open settings') || lower.includes('show settings')) {
      setIsSettingsOpen(true);
    } else if (lower.includes('open memory') || lower.includes('show memory') || lower.includes('manage memory')) {
      setIsMemoryOpen(true);
    }

    try {
      const currentSettings = settingsRef.current;
      const currentMessages = messagesRef.current;
      const currentMemoryEnabled = isMemoryEnabledRef.current;

      const res = await fetch('/api/jarvis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: commandText,
          conversationHistory: currentMessages.slice(-4),
          memoryEnabled: currentMemoryEnabled,
          localFallback: currentSettings.aiProvider === 'ollama',
          ollamaUrl: currentSettings.ollamaUrl,
        }),
      });

      if (!res.ok) {
        throw new Error('Neural core processing error');
      }

      const data = await res.json();
      setAssistantState('SPEAKING');

      // Record assistant response
      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        text: data.speech || 'Understood, sir.',
        detailedResponse: data.detailedResponse,
        action: data.action,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => {
        const updated = [...prev, assistantMsg];
        StorageService.saveChatHistory(updated);
        return updated;
      });

      // Speak vocal output
      if (voiceServiceRef.current) {
        voiceServiceRef.current.speak(data.speech, currentSettings, () => {
          // After vocalization finishes, if there's an action, execute it
          if (data.action && currentSettings.autoExecuteSafeActions) {
            setAssistantState('EXECUTING');
            JarvisAutomationService.executeAction(data.action, {
              onOpenVision: () => setIsSecondaryConsoleOpen(true),
              onAddReminder: (title, dueTime) => {
                const newRem: ReminderItem = {
                  id: `rem_${Date.now()}`,
                  title,
                  dueTime,
                  completed: false,
                  createdAt: new Date().toISOString(),
                };
                setReminders((prev) => {
                  const updated = [newRem, ...prev];
                  StorageService.saveReminders(updated);
                  return updated;
                });
              },
              onAddNote: (title, content) => {
                const newN: NoteItem = {
                  id: `note_${Date.now()}`,
                  title,
                  content,
                  createdAt: new Date().toISOString(),
                };
                setNotes((prev) => {
                  const updated = [newN, ...prev];
                  StorageService.saveNotes(updated);
                  return updated;
                });
              },
            }).then(() => {
              setExecutionLogs(StorageService.getLogs());
              setTimeout(() => setAssistantState('STANDBY'), 1500);
            });
          } else {
            setAssistantState('STANDBY');
          }
        });
      }
    } catch (err: any) {
      console.error('Command processing error:', err);
      setAssistantState('ERROR');
      jarvisAudio.playErrorAlert();
      setTimeout(() => setAssistantState('STANDBY'), 3500);
    }
  }, []);

  const handleProcessCommandRef = useRef(handleProcessCommand);
  handleProcessCommandRef.current = handleProcessCommand;

  // Single mount effect: Zero setState calls inside effect body, runs strictly once on mount
  useEffect(() => {
    // 1. Initial health & memories network probe
    probeConnectivity();
    fetchMemories();

    // 2. Initialize Voice Service once
    const initialSettings = settingsRef.current;
    const voice = new JarvisVoiceService({
      onStateChange: (newState) => {
        setAssistantState(newState);
        if (newState === 'LISTENING') setIsVoiceListening(true);
        if (newState === 'STANDBY') setIsVoiceListening(false);
      },
      onTranscript: (transcript, isFinal) => {
        setActiveTranscript(transcript);
        if (isFinal) {
          setTimeout(() => setActiveTranscript(''), 2500);
        }
      },
      onCommandDetected: (command) => {
        handleProcessCommandRef.current(command);
      },
      onError: (err) => {
        console.warn('Voice error:', err);
      },
    });

    voice.updateConfig(initialSettings);
    voiceServiceRef.current = voice;

    // Online/offline window listeners
    const handleOnline = () => probeConnectivity();
    const handleOffline = () => probeConnectivity();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stopListening();
      }
    };
  }, [probeConnectivity, fetchMemories]);

  // Sync settings updates to voice service
  useEffect(() => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.updateConfig(settings);
    }
  }, [settings]);

  // Reactor interaction handler
  const handleReactorClick = () => {
    if (!voiceServiceRef.current) return;

    if (assistantState === 'SPEAKING') {
      voiceServiceRef.current.stopSpeaking();
      return;
    }

    if (assistantState === 'LISTENING') {
      voiceServiceRef.current.stopListening();
      return;
    }

    // Activate voice recognition
    voiceServiceRef.current.startListening(true);
  };

  // Memory Handlers
  const handleAddMemory = async (mem: Partial<JarvisMemory>) => {
    await fetch('/api/jarvis/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mem),
    });
    fetchMemories();
    probeConnectivity();
  };

  const handleUpdateMemory = async (id: string, mem: Partial<JarvisMemory>) => {
    await fetch(`/api/jarvis/memories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mem),
    });
    fetchMemories();
  };

  const handleDeleteMemory = async (id: string) => {
    await fetch(`/api/jarvis/memories/${id}`, { method: 'DELETE' });
    fetchMemories();
    probeConnectivity();
  };

  const handleResetMemories = async () => {
    await fetch('/api/jarvis/memories/reset', { method: 'POST' });
    fetchMemories();
    probeConnectivity();
  };

  // Optics / Multi-modal Analyzer
  const handleAnalyzeMedia = async (
    fileData: string,
    mimeType: string,
    prompt: string,
    taskType: string
  ): Promise<string> => {
    const res = await fetch('/api/jarvis/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileData, mimeType, prompt, taskType }),
    });
    if (!res.ok) {
      throw new Error('Analysis processing failed');
    }
    const data = await res.json();
    return data.analysis || 'Analysis produced no text output.';
  };

  return (
    <main className="relative min-h-screen w-full bg-[#030712] text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Holographic Atmosphere */}
      <div
        className="fixed inset-0 pointer-events-none -z-20 bg-[linear-gradient(to_right,rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(10,25,50,0.6)_0%,rgba(3,7,18,0.95)_100%)]"
        aria-hidden="true"
      />

      {/* =========================================================================
          MAIN DASHBOARD: STRICT FOUR ELEMENTS ONLY
          1. Central AI Reactor
          2. Settings
          3. Memory Management
          4. Connectivity Status
          ========================================================================= */}

      {/* Top Bar hosting Element 4 (Connectivity Status) and Elements 2 & 3 (Memory & Settings) */}
      <header className="w-full px-4 sm:px-8 py-5 flex items-center justify-between gap-4 z-20">
        {/* ELEMENT 4: CONNECTIVITY STATUS */}
        <div className="flex-1 max-w-xs sm:max-w-sm">
          <ConnectivityStatus
            status={connectivity}
            onRefresh={probeConnectivity}
            isRefreshing={isProbingNetwork}
          />
        </div>

        {/* Dashboard Actions: ELEMENT 3 (Memory Management) & ELEMENT 2 (Settings) */}
        <nav aria-label="System Administration" className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* ELEMENT 3: MEMORY MANAGEMENT */}
          <button
            onClick={() => setIsMemoryOpen(true)}
            className="px-3.5 py-2 glass-panel hover:bg-cyan-950/60 text-xs font-mono font-medium text-cyan-200 hover:text-cyan-100 rounded-xl border border-cyan-500/25 hover:border-cyan-400/50 transition-all duration-200 flex items-center gap-2 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label="Access JARVIS Synaptic Memory Management"
          >
            <Brain className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Memory Management</span>
            <span className="sm:hidden">Memory</span>
          </button>

          {/* ELEMENT 2: SETTINGS */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3.5 py-2 glass-panel hover:bg-cyan-950/60 text-xs font-mono font-medium text-cyan-200 hover:text-cyan-100 rounded-xl border border-cyan-500/25 hover:border-cyan-400/50 transition-all duration-200 flex items-center gap-2 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label="Access JARVIS Assistant Settings"
          >
            <SettingsIcon className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sm:hidden">Config</span>
          </button>
        </nav>
      </header>

      {/* Main Core Area: ELEMENT 1 (CENTRAL AI REACTOR) */}
      <section
        aria-label="Central AI Reactor Core"
        className="flex-1 flex flex-col items-center justify-center relative w-full my-auto px-4 z-10"
      >
        <AiReactor
          state={assistantState}
          transcript={activeTranscript}
          isListening={isVoiceListening}
          onReactorClick={handleReactorClick}
          onOpenSecondaryConsole={() => setIsSecondaryConsoleOpen(true)}
        />
      </section>

      {/* Subtle Bottom Architectural Trademark */}
      <footer className="w-full py-4 text-center text-[11px] font-mono text-slate-500 z-10 select-none">
        J.A.R.V.I.S. · JUST A RATHER VERY INTELLIGENT SYSTEM · MARK VII PROTOCOL
      </footer>

      {/* =========================================================================
          SECONDARY OVERLAYS & MODALS (Conditionally rendered)
          ========================================================================= */}

      {/* ELEMENT 2 INTERFACE: Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSaveSettings={(newSettings) => {
            setSettings(newSettings);
            StorageService.saveSettings(newSettings);
          }}
          onResetSettings={() => {
            setSettings(DEFAULT_SETTINGS);
            StorageService.saveSettings(DEFAULT_SETTINGS);
          }}
        />
      )}

      {/* ELEMENT 3 INTERFACE: Memory Management Modal */}
      {isMemoryOpen && (
        <MemoryModal
          isOpen={isMemoryOpen}
          onClose={() => setIsMemoryOpen(false)}
          memories={memories}
          memoryEnabled={isMemoryEnabled}
          onToggleMemory={(enabled) => {
            setIsMemoryEnabled(enabled);
            const updated = { ...settings, memoryEnabled: enabled };
            setSettings(updated);
            StorageService.saveSettings(updated);
          }}
          onAddMemory={handleAddMemory}
          onUpdateMemory={handleUpdateMemory}
          onDeleteMemory={handleDeleteMemory}
          onResetMemories={handleResetMemories}
        />
      )}

      {/* SECONDARY SYSTEMS CONSOLE */}
      {isSecondaryConsoleOpen && (
        <SecondaryConsoleModal
          isOpen={isSecondaryConsoleOpen}
          onClose={() => setIsSecondaryConsoleOpen(false)}
          messages={messages}
          onSendCommand={handleProcessCommand}
          reminders={reminders}
          onAddReminder={(title, dueTime) => {
            const newR: ReminderItem = {
              id: `rem_${Date.now()}`,
              title,
              dueTime,
              completed: false,
              createdAt: new Date().toISOString(),
            };
            setReminders((prev) => {
              const updated = [newR, ...prev];
              StorageService.saveReminders(updated);
              return updated;
            });
          }}
          onToggleReminder={(id) => {
            setReminders((prev) => {
              const updated = prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r));
              StorageService.saveReminders(updated);
              return updated;
            });
          }}
          onDeleteReminder={(id) => {
            setReminders((prev) => {
              const updated = prev.filter((r) => r.id !== id);
              StorageService.saveReminders(updated);
              return updated;
            });
          }}
          notes={notes}
          onAddNote={(title, content) => {
            const newN: NoteItem = {
              id: `note_${Date.now()}`,
              title,
              content,
              createdAt: new Date().toISOString(),
            };
            setNotes((prev) => {
              const updated = [newN, ...prev];
              StorageService.saveNotes(updated);
              return updated;
            });
          }}
          onDeleteNote={(id) => {
            setNotes((prev) => {
              const updated = prev.filter((n) => n.id !== id);
              StorageService.saveNotes(updated);
              return updated;
            });
          }}
          executionLogs={executionLogs}
          onAnalyzeMedia={handleAnalyzeMedia}
        />
      )}
    </main>
  );
}
