import React, { useState } from 'react';
import { X, Search, Plus, Trash2, Edit3, Shield, Download, Upload, Check, AlertCircle } from 'lucide-react';
import { JarvisMemory, MemoryCategory } from '../types/jarvis';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: JarvisMemory[];
  memoryEnabled: boolean;
  onToggleMemory: (enabled: boolean) => void;
  onAddMemory: (memory: Partial<JarvisMemory>) => Promise<void>;
  onUpdateMemory: (id: string, memory: Partial<JarvisMemory>) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  onResetMemories: () => Promise<void>;
}

const CATEGORIES: { label: string; value: MemoryCategory | 'all' }[] = [
  { label: 'All Context', value: 'all' },
  { label: 'Long-Term', value: 'long_term' },
  { label: 'Preferences', value: 'preferences' },
  { label: 'Knowledge Base', value: 'knowledge_base' },
  { label: 'Short-Term', value: 'short_term' },
  { label: 'Task History', value: 'task_history' },
];

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  memories,
  memoryEnabled,
  onToggleMemory,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onResetMemories,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formCategory, setFormCategory] = useState<MemoryCategory>('long_term');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [privacyStrict, setPrivacyStrict] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredMemories = memories.filter((mem) => {
    const matchesCat = selectedCategory === 'all' || mem.category === selectedCategory;
    const matchesQuery =
      mem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mem.tags && mem.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCat && matchesQuery;
  });

  const handleStartEdit = (mem: JarvisMemory) => {
    setEditingId(mem.id);
    setFormCategory(mem.category);
    setFormTitle(mem.title);
    setFormContent(mem.content);
    setFormTags((mem.tags || []).join(', '));
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    setIsSaving(true);
    try {
      const tagsArray = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (editingId) {
        await onUpdateMemory(editingId, {
          category: formCategory,
          title: formTitle,
          content: formContent,
          tags: tagsArray,
        });
        showNotify('Memory synaptic node updated, sir.');
      } else {
        await onAddMemory({
          category: formCategory,
          title: formTitle,
          content: formContent,
          tags: tagsArray,
        });
        showNotify('New memory inscribed to synaptic core, sir.');
      }
      setIsAdding(false);
      setEditingId(null);
      setFormTitle('');
      setFormContent('');
      setFormTags('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(memories, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jarvis_memory_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotify('Memory archive exported successfully.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] glass-panel-elevated rounded-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-cyan-950/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Shield className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-wide text-cyan-100">
                JARVIS Synaptic Memory Architecture
              </h2>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>{memories.length} Stored Engrams</span>
                <span>·</span>
                <span className={memoryEnabled ? 'text-cyan-400' : 'text-amber-400'}>
                  {memoryEnabled ? 'Autonomous Recall Active' : 'Recall Disabled'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-200 hover:bg-cyan-950/50 transition-colors"
            aria-label="Close memory modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Controls & Search */}
        <div className="px-6 py-3.5 border-b border-cyan-500/15 bg-black/40 flex flex-wrap items-center justify-between gap-3">
          {/* Category Tabs (Functional filter controls per design guidelines) */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick Memory Toggle and Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => onToggleMemory(!memoryEnabled)}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1.5 ${
                memoryEnabled
                  ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                  : 'border-slate-700 bg-slate-900 text-slate-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${memoryEnabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              {memoryEnabled ? 'Memory Enabled' : 'Memory Paused'}
            </button>

            <button
              onClick={() => {
                setIsAdding(!isAdding);
                setEditingId(null);
                setFormTitle('');
                setFormContent('');
                setFormTags('');
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Inscribe Memory</span>
            </button>
          </div>
        </div>

        {/* Notification toast if any */}
        {notification && (
          <div className="mx-6 mt-3 px-4 py-2 rounded-lg bg-cyan-950/70 border border-cyan-400/40 text-xs font-mono text-cyan-200 flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-cyan-300" />
            <span>{notification}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Add / Edit Form */}
          {isAdding && (
            <form onSubmit={handleSave} className="glass-panel p-4 rounded-xl border border-cyan-400/40 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
                <span className="text-xs font-mono font-semibold text-cyan-300 uppercase">
                  {editingId ? 'Modify Memory Engram' : 'Inscribe New Synaptic Node'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Engram Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as MemoryCategory)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="long_term">Long-Term Memory</option>
                    <option value="preferences">User Preferences</option>
                    <option value="knowledge_base">Knowledge Base</option>
                    <option value="short_term">Short-Term Context</option>
                    <option value="task_history">Task History</option>
                    <option value="project_context">Project Context</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Keywords / Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="e.g. quantum, iron-man, mark85"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Memory Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Flight Stabilization Protocol"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Memory Contents</label>
                <textarea
                  required
                  rows={3}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Detailed context JARVIS will recall during multi-turn interactions..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                >
                  {isSaving ? 'Encrypting...' : 'Commit to Core'}
                </button>
              </div>
            </form>
          )}

          {/* Search bar inside content */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query synaptic memory index..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Memories List */}
          {filteredMemories.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-mono">
              No matching synaptic memory nodes discovered.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredMemories.map((mem) => (
                <div
                  key={mem.id}
                  className="glass-panel p-4 rounded-xl border border-cyan-500/15 hover:border-cyan-400/35 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                        {mem.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(mem.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-100 mb-1">{mem.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{mem.content}</p>

                    {mem.tags && mem.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-slate-400 font-mono">
                        <span>Tags:</span>
                        <span>{mem.tags.join(' · ')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
                    <button
                      onClick={() => handleStartEdit(mem)}
                      className="p-1.5 text-slate-400 hover:text-cyan-300 transition-colors rounded"
                      title="Edit Memory"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Purge memory "${mem.title}" permanently?`)) {
                          await onDeleteMemory(mem.id);
                          showNotify('Memory node erased from core.');
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded"
                      title="Purge Memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Backup and Privacy Controls */}
        <div className="px-6 py-3 border-t border-cyan-500/20 bg-black/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Memory Archive</span>
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={async () => {
                if (confirm('Reset memory back to default JARVIS factory directive?')) {
                  await onResetMemories();
                  showNotify('Synaptic core restored to baseline directive.');
                }
              }}
              className="text-slate-400 hover:text-amber-300 transition-colors"
            >
              Reset to Factory Baseline
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            Encrypted Synaptic Memory Bank · AES-GCM Compliant
          </div>
        </div>
      </div>
    </div>
  );
};
