import React, { useState, useEffect } from 'react';
import { X, Settings, Mic, Cpu, Volume2, Shield, RotateCcw, Check } from 'lucide-react';
import { JarvisSettings } from '../types/jarvis';
import { JarvisVoiceService } from '../services/voiceAssistant';
import { jarvisAudio } from '../services/audioSynth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: JarvisSettings;
  onSaveSettings: (settings: JarvisSettings) => void;
  onResetSettings: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<JarvisSettings>(() => ({ ...settings }));
  const [activeTab, setActiveTab] = useState<'general' | 'provider' | 'voice' | 'privacy'>('general');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
    };
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    jarvisAudio.enabled = localSettings.soundEffectsEnabled;
    onSaveSettings(localSettings);
    jarvisAudio.playCommandConfirmed();
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 1200);
  };

  const handleTestVoice = () => {
    const testSpeech = new JarvisVoiceService({
      onStateChange: () => {},
      onTranscript: () => {},
      onCommandDetected: () => {},
      onError: () => {},
    });
    testSpeech.speak(
      `Audio modulation confirmed. How may I be of service, ${localSettings.userTitle || 'sir'}?`,
      localSettings
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] glass-panel-elevated rounded-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-cyan-950/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Settings className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-wide text-cyan-100">
                JARVIS Core Configuration
              </h2>
              <p className="text-xs font-mono text-slate-400">
                System identity, intelligence routing & voice acoustics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-200 hover:bg-cyan-950/50 transition-colors"
            aria-label="Close settings modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2 border-b border-cyan-500/15 bg-black/40 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'general', label: 'Assistant Profile', icon: Cpu },
            { id: 'provider', label: 'AI Provider & Core', icon: Settings },
            { id: 'voice', label: 'Voice & Wake Word', icon: Mic },
            { id: 'privacy', label: 'Privacy & Security', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: General */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-mono text-cyan-300 uppercase mb-1">
                  User Address Title
                </label>
                <input
                  type="text"
                  value={localSettings.userTitle}
                  onChange={(e) => setLocalSettings({ ...localSettings, userTitle: e.target.value })}
                  placeholder="e.g. Sir, Mr. Stark, Dr. Banner"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  JARVIS will use this designation in natural speech responses.
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Acoustic Sound Effects
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Play synthesized audio chimes for wake words, confirmations, and alerts.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.soundEffectsEnabled}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, soundEffectsEnabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Autonomous Device Command Execution
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Allow safe actions (e.g. opening YouTube, web searches, recording notes) to execute automatically.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.autoExecuteSafeActions}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, autoExecuteSafeActions: e.target.checked })
                    }
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI Provider */}
          {activeTab === 'provider' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-mono text-cyan-300 uppercase mb-1">
                  AI Intelligence Engine Routing
                </label>
                <select
                  value={localSettings.aiProvider}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      aiProvider: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="gemini">Primary Cloud: Google Gemini 3.8 Flash</option>
                  <option value="ollama">Local Intelligence: Ollama Neural Engine</option>
                  <option value="auto">Hybrid Autonomous (Cloud with Local Ollama Fallback)</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Cloud intelligence communicates securely through the backend proxy. Local intelligence operates offline if internet disconnects.
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono text-cyan-300 uppercase mb-1">
                  Local Ollama Service Endpoint URL
                </label>
                <input
                  type="text"
                  value={localSettings.ollamaUrl}
                  onChange={(e) => setLocalSettings({ ...localSettings, ollamaUrl: e.target.value })}
                  placeholder="http://127.0.0.1:11434"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Connect to local models (e.g., Llama 3, Mistral) when operating air-gapped or offline.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: Voice & Wake Word */}
          {activeTab === 'voice' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Wake Word Detection ("Hey JARVIS")
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Acoustically activates JARVIS when configured phrase is spoken.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.wakeWordEnabled}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, wakeWordEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-cyan-300 uppercase mb-1">
                  Activation Phrase
                </label>
                <input
                  type="text"
                  value={localSettings.wakeWord}
                  onChange={(e) => setLocalSettings({ ...localSettings, wakeWord: e.target.value })}
                  placeholder="Hey JARVIS"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Continuous Conversation Mode
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Keeps acoustic recognition open after speaking for conversational flow.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.continuousListening}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, continuousListening: e.target.checked })
                  }
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-cyan-300 uppercase">
                    Vocal Synthesis Voice
                  </label>
                  <button
                    type="button"
                    onClick={handleTestVoice}
                    className="text-xs text-cyan-400 hover:text-cyan-200 flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Test Voice</span>
                  </button>
                </div>
                <select
                  value={localSettings.voiceName}
                  onChange={(e) => setLocalSettings({ ...localSettings, voiceName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="">Default British/System Refined Voice</option>
                  {availableVoices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Speech Rate: {localSettings.voiceRate}x
                  </label>
                  <input
                    type="range"
                    min="0.8"
                    max="1.4"
                    step="0.05"
                    value={localSettings.voiceRate}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, voiceRate: parseFloat(e.target.value) })
                    }
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Voice Pitch: {localSettings.voicePitch}
                  </label>
                  <input
                    type="range"
                    min="0.8"
                    max="1.2"
                    step="0.05"
                    value={localSettings.voicePitch}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, voicePitch: parseFloat(e.target.value) })
                    }
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Privacy & Security */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Strict Local Isolation
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Disallow telemetry logs and clear local action buffers on session exit.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.privacyStrict}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, privacyStrict: e.target.checked })
                  }
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-300 leading-relaxed font-mono">
                <div className="text-cyan-300 font-semibold mb-1">SECURITY GUARANTEE:</div>
                JARVIS does not leak or transmit API secrets to client bundles. Voice synthesis and speech recognition run through standard W3C Web Speech protocols.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cyan-500/20 bg-black/50 flex items-center justify-between gap-3">
          <button
            onClick={onResetSettings}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <div className="flex items-center gap-3">
            {savedToast && (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Parameters Committed
              </span>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              Commit System Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
