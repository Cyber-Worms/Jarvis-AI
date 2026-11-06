import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Terminal,
  Camera,
  FileText,
  ListTodo,
  FileCheck,
  CheckCircle2,
  Trash2,
  Upload,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Cpu,
  Layers,
} from 'lucide-react';
import { ChatMessage, ReminderItem, NoteItem, ExecutionLog } from '../types/jarvis';

interface SecondaryConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendCommand: (text: string) => Promise<void>;
  reminders: ReminderItem[];
  onAddReminder: (title: string, dueTime: string) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  notes: NoteItem[];
  onAddNote: (title: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  executionLogs: ExecutionLog[];
  onAnalyzeMedia: (fileData: string, mimeType: string, prompt: string, taskType: string) => Promise<string>;
}

export const SecondaryConsoleModal: React.FC<SecondaryConsoleModalProps> = ({
  isOpen,
  onClose,
  messages,
  onSendCommand,
  reminders,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  notes,
  onAddNote,
  onDeleteNote,
  executionLogs,
  onAnalyzeMedia,
}) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'vision' | 'productivity' | 'companion'>('terminal');

  // Terminal chat input
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Vision state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [visionPrompt, setVisionPrompt] = useState('');
  const [visionTaskType, setVisionTaskType] = useState('general');
  const [visionResult, setVisionResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Productivity form states
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('18:00 Today');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Device status
  const [batteryLevel, setBatteryLevel] = useState<string>('Scanning...');
  const [isCharging, setIsCharging] = useState<boolean>(false);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  useEffect(() => {
    if (activeTab === 'companion' && typeof navigator !== 'undefined' && (navigator as any).getBattery) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(`${Math.round(battery.level * 100)}%`);
        setIsCharging(battery.charging);
      }).catch(() => {
        setBatteryLevel('Battery API Unavailable');
      });
    }
  }, [activeTab]);

  // Clean up camera stream on unmount or tab change
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraActive, activeTab]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;
    const text = inputText.trim();
    setInputText('');
    setIsSending(true);
    try {
      await onSendCommand(text);
    } finally {
      setIsSending(false);
    }
  };

  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Camera access denied or unavailable in this environment.');
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      // Stop camera
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
      setCameraActive(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const runVisionAnalysis = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    setVisionResult(null);
    try {
      const mimeType = capturedImage.startsWith('data:image/png')
        ? 'image/png'
        : capturedImage.startsWith('data:application/pdf')
        ? 'application/pdf'
        : 'image/jpeg';

      const result = await onAnalyzeMedia(
        capturedImage,
        mimeType,
        visionPrompt || 'Analyze and summarize all key information from this visual input.',
        visionTaskType
      );
      setVisionResult(result);
    } catch (err: any) {
      setVisionResult(`Analysis failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[88vh] glass-panel-elevated rounded-2xl flex flex-col overflow-hidden text-slate-100 border border-cyan-500/25">
        {/* Top Control Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-cyan-500/20 bg-cyan-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Layers className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-wide text-cyan-100">
                JARVIS Secondary Systems Console
              </h2>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>Direct Command Protocol</span>
                <span>·</span>
                <span className="text-cyan-400">Mark 85 Architecture</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-200 hover:bg-cyan-950/50 transition-colors"
            aria-label="Close secondary console"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 py-2 border-b border-cyan-500/15 bg-black/40 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'terminal', label: 'Command HUD & Chat', icon: Terminal },
            { id: 'vision', label: 'Optics & Document OCR', icon: Camera },
            { id: 'productivity', label: 'Personal Productivity', icon: ListTodo },
            { id: 'companion', label: 'Device & Companion Testbed', icon: Smartphone },
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

        {/* Console Workspace Content */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col bg-slate-950/60">
          {/* TAB 1: Command HUD & Terminal */}
          {activeTab === 'terminal' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs font-mono p-6">
                    <Terminal className="w-8 h-8 text-cyan-500/40 mb-2" />
                    <p className="text-cyan-200 font-semibold mb-1">
                      Ready for directive input, sir.
                    </p>
                    <p className="max-w-md text-slate-400 leading-relaxed">
                      Type any query or automation request below, or speak naturally via the Central AI Reactor on the dashboard.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        m.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mb-1">
                        <span className={m.role === 'user' ? 'text-slate-300' : 'text-cyan-400 font-bold'}>
                          {m.role === 'user' ? 'YOU' : 'J.A.R.V.I.S.'}
                        </span>
                        <span>·</span>
                        <span>{m.timestamp}</span>
                      </div>

                      <div
                        className={`p-3.5 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-slate-800 text-slate-100 border border-slate-700'
                            : 'glass-panel text-cyan-50 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.text}</p>
                        {m.detailedResponse && (
                          <div className="mt-2.5 pt-2 border-t border-cyan-500/20 text-slate-300 font-mono text-[11px] whitespace-pre-wrap">
                            {m.detailedResponse}
                          </div>
                        )}
                        {m.action && (
                          <div className="mt-2 px-2.5 py-1.5 rounded bg-cyan-950/60 border border-cyan-400/30 text-[10px] font-mono text-cyan-300 flex items-center justify-between gap-2">
                            <span>ACTION // {m.action.type.toUpperCase()}</span>
                            <span className="text-slate-400 truncate max-w-[200px]">
                              {JSON.stringify(m.action.params)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Command Line */}
              <form onSubmit={handleSend} className="mt-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-2.5 text-cyan-400 font-mono text-xs select-none">
                    &gt;
                  </span>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder='Type natural command (e.g. "open YouTube", "summarize notes", "what is quantum computing?")...'
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSending || !inputText.trim()}
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Optics & Document Vision */}
          {activeTab === 'vision' && (
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visual Capture Area */}
                <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-mono font-semibold text-cyan-300 uppercase mb-2">
                      Optical Sensor / Document Intake
                    </h3>

                    {/* Camera or Image View */}
                    <div className="relative w-full aspect-video bg-black/60 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden">
                      {cameraActive ? (
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      ) : capturedImage ? (
                        <img
                          src={capturedImage}
                          alt="Captured visual"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-4 text-slate-500 text-xs font-mono">
                          No optical frame acquired. Capture from camera or upload an image/document.
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {!cameraActive ? (
                        <button
                          onClick={startCamera}
                          className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/40 text-cyan-200 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Engage Camera</span>
                        </button>
                      ) : (
                        <button
                          onClick={capturePhoto}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Capture Frame</span>
                        </button>
                      )}

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*,application/pdf,text/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                      </button>

                      {capturedImage && (
                        <button
                          onClick={() => setCapturedImage(null)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors ml-auto"
                          title="Clear Image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Analysis Settings */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        Analysis Protocol
                      </label>
                      <select
                        value={visionTaskType}
                        onChange={(e) => setVisionTaskType(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                      >
                        <option value="general">Comprehensive Scene & Document Analysis</option>
                        <option value="ocr">Optical Character Recognition (OCR Text Extraction)</option>
                        <option value="diagram">Architectural & Diagram Decomposition</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        Specific Inquiry / Prompt
                      </label>
                      <input
                        type="text"
                        value={visionPrompt}
                        onChange={(e) => setVisionPrompt(e.target.value)}
                        placeholder="e.g. Read all text, extract tables, or explain formulas..."
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={runVisionAnalysis}
                      disabled={!capturedImage || isAnalyzing}
                      className="w-full mt-2 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Cpu className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      <span>{isAnalyzing ? 'Processing Visual Neural Net...' : 'Run Vision Synthesis'}</span>
                    </button>
                  </div>
                </div>

                {/* Analysis Output Panel */}
                <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 flex flex-col">
                  <h3 className="text-xs font-mono font-semibold text-cyan-300 uppercase mb-2">
                    Neural Vision Readout
                  </h3>
                  <div className="flex-1 bg-black/50 rounded-lg p-3 text-xs font-mono text-slate-300 leading-relaxed overflow-y-auto max-h-[460px] whitespace-pre-wrap border border-slate-800">
                    {visionResult || (
                      <span className="text-slate-500">
                        Awaiting visual processing stream. Results will render here in real-time.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Personal Productivity */}
          {activeTab === 'productivity' && (
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Reminders / To-dos */}
                <div className="glass-panel p-4 rounded-xl border border-cyan-500/20">
                  <h3 className="text-xs font-mono font-semibold text-cyan-300 uppercase mb-3 flex items-center justify-between">
                    <span>Task Scheduling & Reminders</span>
                    <span className="text-slate-400 text-[10px]">{reminders.length} Active</span>
                  </h3>

                  {/* Add Reminder Form */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newReminderTitle}
                      onChange={(e) => setNewReminderTitle(e.target.value)}
                      placeholder="Add scheduled task..."
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={newReminderTime}
                      onChange={(e) => setNewReminderTime(e.target.value)}
                      placeholder="Due time"
                      className="w-28 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (newReminderTitle.trim()) {
                          onAddReminder(newReminderTitle.trim(), newReminderTime);
                          setNewReminderTitle('');
                        }
                      }}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium"
                    >
                      Add
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {reminders.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={r.completed}
                            onChange={() => onToggleReminder(r.id)}
                            className="accent-cyan-500 cursor-pointer"
                          />
                          <span className={r.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                            {r.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-cyan-400">{r.dueTime}</span>
                          <button
                            onClick={() => onDeleteReminder(r.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes & Intellectual Journal */}
                <div className="glass-panel p-4 rounded-xl border border-cyan-500/20">
                  <h3 className="text-xs font-mono font-semibold text-cyan-300 uppercase mb-3 flex items-center justify-between">
                    <span>Directives & Intelligence Notes</span>
                    <span className="text-slate-400 text-[10px]">{notes.length} Notes</span>
                  </h3>

                  <div className="space-y-2 mb-3">
                    <input
                      type="text"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      placeholder="Note Title..."
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                    />
                    <textarea
                      rows={2}
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Note Content or research summary..."
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (newNoteTitle.trim() && newNoteContent.trim()) {
                          onAddNote(newNoteTitle.trim(), newNoteContent.trim());
                          setNewNoteTitle('');
                          setNewNoteContent('');
                        }
                      }}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium"
                    >
                      Save Directive Note
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[240px] overflow-y-auto">
                    {notes.map((n) => (
                      <div key={n.id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-200">{n.title}</span>
                          <button
                            onClick={() => onDeleteNote(n.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{n.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Automation Execution Logs */}
              <div className="glass-panel p-4 rounded-xl border border-cyan-500/20">
                <h3 className="text-xs font-mono font-semibold text-cyan-300 uppercase mb-2">
                  Device & Browser Automation History
                </h3>
                {executionLogs.length === 0 ? (
                  <div className="text-xs font-mono text-slate-500 py-2">
                    No automation executions recorded in current session.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                    {executionLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-2 rounded bg-black/40 border border-slate-800 text-[11px] font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400">[{log.actionType}]</span>
                          <span className="text-slate-300">{log.description}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <span>{log.timestamp}</span>
                          <span className="text-emerald-400">SUCCESS</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Android & Device Companion Integration */}
          {activeTab === 'companion' && (
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="glass-panel p-4 rounded-xl border border-cyan-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <Smartphone className="w-6 h-6 text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      Companion Device Bridge & Diagnostics
                    </h3>
                    <p className="text-xs font-mono text-slate-400">
                      Browser hardware APIs & Android companion handshake protocol
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block">DEVICE BATTERY</span>
                    <span className="text-sm font-mono text-cyan-300 font-bold">
                      {batteryLevel} {isCharging ? '(Charging)' : ''}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block">LINK ENCRYPTION</span>
                    <span className="text-sm font-mono text-emerald-400 font-bold">WSS / TLS 1.3</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block">GEOLOCATION SENSORS</span>
                    <span className="text-sm font-mono text-cyan-300 font-bold">Active Ready</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-mono font-semibold text-slate-300 uppercase block mb-1">
                    Direct Device Actuations
                  </span>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                          navigator.vibrate([100, 50, 100]);
                          alert('Haptic vibration pulsed to device hardware.');
                        } else {
                          alert('Vibration API not supported on this specific hardware.');
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 rounded-lg transition-colors"
                    >
                      Pulse Haptic Vibration
                    </button>

                    <button
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.share) {
                          navigator.share({
                            title: 'JARVIS Telemetry',
                            text: 'Transmitted from JARVIS Ultimate AI Assistant.',
                            url: window.location.href,
                          }).catch(() => {});
                        } else {
                          alert('Native Web Share protocol ready.');
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 rounded-lg transition-colors"
                    >
                      Trigger System Web Share
                    </button>

                    <button
                      onClick={() => {
                        if ('Notification' in window) {
                          Notification.requestPermission().then((perm) => {
                            if (perm === 'granted') {
                              new Notification('J.A.R.V.I.S.', {
                                body: 'All perimeter telemetry sensors online, sir.',
                              });
                            } else {
                              alert('Notification permission: ' + perm);
                            }
                          });
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 rounded-lg transition-colors"
                    >
                      Dispatch System Notification
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
