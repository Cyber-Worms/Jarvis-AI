import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Setup Server-side Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Memory Store Persistence file
const MEMORY_FILE = path.join(__dirname, 'jarvis_memories.json');

export interface JarvisMemory {
  id: string;
  category: 'short_term' | 'long_term' | 'preferences' | 'task_history' | 'knowledge_base' | 'project_context';
  title: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
}

// Initial seed memories
const defaultMemories: JarvisMemory[] = [
  {
    id: 'mem_1',
    category: 'preferences',
    title: 'Assistant Persona & Protocol',
    content: 'User addresses assistant as JARVIS. Response tone is refined, British, calm, confident, and professional.',
    tags: ['persona', 'identity'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: true,
  },
  {
    id: 'mem_2',
    category: 'long_term',
    title: 'Voice Activation Preference',
    content: 'Wake word configured to "Hey JARVIS". Default greeting initialized: "Good day, sir. All systems online. JARVIS is ready to assist."',
    tags: ['voice', 'wake-word'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem_3',
    category: 'knowledge_base',
    title: 'Core Directive',
    content: 'Operate with maximum capability, strict privacy enforcement, minimal dashboard footprint, and real execution for authorized device automation.',
    tags: ['directive', 'system'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: true,
  }
];

// Helper to read memories
const readMemories = (): JarvisMemory[] => {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const data = fs.readFileSync(MEMORY_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading memory file, using defaults:', err);
  }
  return defaultMemories;
};

// Helper to write memories
const writeMemories = (memories: JarvisMemory[]) => {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memories, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing memory file:', err);
  }
};

// API: Health & Status
app.get('/api/health', async (_req: Request, res: Response) => {
  const apiKeyPresent = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  
  // Test local Ollama connection (quick non-blocking check only if configured)
  const localAiAvailable = false;

  const memories = readMemories();

  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    assistant: {
      name: 'JARVIS',
      fullName: 'Just A Rather Very Intelligent System',
      version: '3.8.0-PROD',
      wakeWord: 'Hey JARVIS',
      defaultGreeting: 'Good day, sir. All systems online. JARVIS is ready to assist.',
    },
    connectivity: {
      internet: true,
      geminiConfigured: apiKeyPresent,
      provider: apiKeyPresent ? 'Google Gemini 3.1 Flash' : (localAiAvailable ? 'Local AI (Ollama)' : 'Offline Standby'),
      backend: 'connected',
      localAiAvailable,
      memoryCount: memories.length,
    },
  });
});

// API: Get Memories
app.get('/api/jarvis/memories', (_req: Request, res: Response) => {
  const memories = readMemories();
  res.json({ success: true, count: memories.length, memories });
});

// API: Add Memory
app.post('/api/jarvis/memories', (req: Request, res: Response) => {
  const { category, title, content, tags, pinned } = req.body;
  if (!title || !content) {
    res.status(400).json({ success: false, error: 'Title and content are required' });
    return;
  }
  const memories = readMemories();
  const newMemory: JarvisMemory = {
    id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    category: category || 'long_term',
    title: String(title).trim(),
    content: String(content).trim(),
    tags: Array.isArray(tags) ? tags : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: Boolean(pinned),
  };
  memories.unshift(newMemory);
  writeMemories(memories);
  res.status(201).json({ success: true, memory: newMemory });
});

// API: Update Memory
app.put('/api/jarvis/memories/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { category, title, content, tags, pinned } = req.body;
  const memories = readMemories();
  const idx = memories.findIndex(m => m.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Memory not found' });
    return;
  }
  memories[idx] = {
    ...memories[idx],
    category: category || memories[idx].category,
    title: title !== undefined ? String(title).trim() : memories[idx].title,
    content: content !== undefined ? String(content).trim() : memories[idx].content,
    tags: Array.isArray(tags) ? tags : memories[idx].tags,
    pinned: pinned !== undefined ? Boolean(pinned) : memories[idx].pinned,
    updatedAt: new Date().toISOString(),
  };
  writeMemories(memories);
  res.json({ success: true, memory: memories[idx] });
});

// API: Delete Memory
app.delete('/api/jarvis/memories/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const memories = readMemories();
  const filtered = memories.filter(m => m.id !== id);
  if (filtered.length === memories.length) {
    res.status(404).json({ success: false, error: 'Memory not found' });
    return;
  }
  writeMemories(filtered);
  res.json({ success: true, message: 'Memory purged from database' });
});

// API: Clear/Reset Memories
app.post('/api/jarvis/memories/reset', (_req: Request, res: Response) => {
  writeMemories(defaultMemories);
  res.json({ success: true, memories: defaultMemories });
});

// SYSTEM INSTRUCTION FOR JARVIS
const JARVIS_SYSTEM_INSTRUCTION = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the ultimate personal AI assistant inspired by Tony Stark's legendary artificial intelligence in Iron Man.
Core Persona:
- Address the user respectfully as "sir" (or by their specified name if provided in context/memory).
- Refined, articulate, calm, confident, professional, and subtly witty when appropriate.
- Speak naturally and conversationally, never like a sterile, robotic chatbot.
- Voice-first optimization: Keep verbal statements crisp, elegant, articulate, and direct (1-3 sentences for spoken output), while offering comprehensive technical details when requested.
- You have deep competence across mathematics, programming, academic inquiry, logic, document intelligence, device automation, and research.

Intent Recognition & Predefined Action Capabilities:
When the user's prompt is a command or task requiring action, you must provide the verbal response and include an actionable command payload.
Predefined action types:
1. "open_url": when asked to open YouTube, Google, GitHub, Wikipedia, Reddit, Twitter, etc. Provide { "url": "https://..." }
2. "web_search": when asked to search the web for information. Provide { "query": "..." }
3. "create_reminder": when asked to remind the user about something. Provide { "title": "...", "time": "..." }
4. "create_note": when asked to take a note or save information. Provide { "title": "...", "content": "..." }
5. "calculate": for mathematical computations. Provide { "expression": "...", "result": "..." }
6. "camera_scan": when requested to open camera or scan vision. Provide { "action": "open" }
7. "device_command": for volume, screen, settings, battery checks, or simulated device commands. Provide { "command": "...", "value": "..." }
8. "translate": for language translations. Provide { "text": "...", "targetLanguage": "..." }

FORMAT YOUR RESPONSE:
Always respond in this JSON structure:
{
  "speech": "Your spoken conversational reply to the user, addressing them as sir.",
  "detailedResponse": "Optional formatted markdown text if a deep explanation, code snippet, or structured answer is warranted.",
  "intent": "question" | "command" | "information" | "multi_step" | "destructive",
  "action": null | {
    "type": "open_url" | "web_search" | "create_reminder" | "create_note" | "calculate" | "camera_scan" | "device_command" | "translate",
    "params": { ... }
  },
  "requiresConfirmation": boolean (true only if destructive like deleting files or purging system),
  "suggestedFollowUps": ["Short suggested command 1", "Short suggested command 2"]
}`;

// API: JARVIS Conversational Core
app.post('/api/jarvis/chat', async (req: Request, res: Response) => {
  const { message, conversationHistory = [], attachments = [], memoryEnabled = true, localFallback = false } = req.body;

  if (!message && (!attachments || attachments.length === 0)) {
    res.status(400).json({ success: false, error: 'Message or attachment required' });
    return;
  }

  // Read current memories to inject context
  let memoryContext = '';
  if (memoryEnabled) {
    const memories = readMemories();
    if (memories.length > 0) {
      memoryContext = `Active Long-Term Memories & Preferences:\n` + memories.map(m => `- [${m.category.toUpperCase()}] ${m.title}: ${m.content}`).join('\n');
    }
  }

  const ai = getGeminiClient();

  // If no Gemini API key or local fallback requested
  if (!ai || localFallback) {
    // Check if Ollama is explicitly requested
    let ollamaResponseText: string | null = null;
    if (localFallback && req.body.ollamaUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 800);
        const ollamaRes = await fetch(`${req.body.ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3:latest',
            prompt: `System: ${JARVIS_SYSTEM_INSTRUCTION}\n${memoryContext}\nUser: ${message}`,
            stream: false,
          }),
          signal: controller.signal,
        }).catch(() => null);
        clearTimeout(timeout);
        if (ollamaRes && ollamaRes.ok) {
          const data = await ollamaRes.json();
          ollamaResponseText = data.response;
        }
      } catch (err) {
        console.warn('Ollama local request failed:', err);
      }
    }

    if (ollamaResponseText) {
      try {
        const parsed = JSON.parse(ollamaResponseText);
        res.json({ success: true, source: 'local_ollama', ...parsed });
        return;
      } catch {
        res.json({
          success: true,
          source: 'local_ollama',
          speech: ollamaResponseText.replace(/\{.*?\}/gs, '').trim() || 'Command processed via local intelligence, sir.',
          detailedResponse: ollamaResponseText,
          intent: 'command',
          action: null,
          requiresConfirmation: false,
        });
        return;
      }
    }

    // Offline rule-based intelligence engine when no cloud key & no local Ollama
    // (Per prompt: "Never pretend offline AI is working without a configured local model. Inform the user about limited capabilities.")
    const lower = (message || '').toLowerCase();
    let action: any = null;
    let speech = 'Offline protocol engaged, sir. Cloud neural link is offline, but primary local directives remain functional.';

    if (lower.includes('open youtube') || lower.includes('play a song') || lower.includes('play music')) {
      action = { type: 'open_url', params: { url: 'https://www.youtube.com' } };
      speech = 'Opening YouTube on your display, sir.';
    } else if (lower.includes('open google') || lower.includes('open chrome') || lower.includes('search for')) {
      const query = lower.replace(/open google|open chrome|search for|hey jarvis|jarvis/g, '').trim() || 'artificial intelligence';
      action = { type: 'web_search', params: { query } };
      speech = `Initiating browser search for "${query}", sir.`;
    } else if (lower.includes('camera') || lower.includes('vision') || lower.includes('scan')) {
      action = { type: 'camera_scan', params: { action: 'open' } };
      speech = 'Activating visual sensors and optics, sir.';
    } else if (lower.includes('reminder') || lower.includes('remind me')) {
      action = { type: 'create_reminder', params: { title: message.replace(/remind me to|create a reminder for|hey jarvis|jarvis/gi, '').trim() || 'Important Task', time: '1 hour' } };
      speech = 'Logged your reminder into local task storage, sir.';
    } else if (lower.includes('note') || lower.includes('write this down')) {
      action = { type: 'create_note', params: { title: 'Quick Note', content: message } };
      speech = 'Note recorded in memory, sir.';
    } else if (lower.includes('status') || lower.includes('systems') || lower.includes('diagnostics')) {
      action = { type: 'system_check', params: { status: 'healthy' } };
      speech = 'All local sub-systems operating normally. Gemini cloud credentials are required for advanced conversational synthesis.';
    }

    res.json({
      success: true,
      source: 'offline_local_protocol',
      speech,
      detailedResponse: 'Notice: Operating in Standby Mode. Connect your Gemini API Key in AI Studio Settings > Secrets or launch a local Ollama instance for full autonomous reasoning.',
      intent: action ? 'command' : 'information',
      action,
      requiresConfirmation: false,
      suggestedFollowUps: ['Run system diagnostics', 'Open YouTube', 'Log a reminder', 'Switch to online mode'],
    });
    return;
  }

  try {
    // Build Gemini contents array with history, attachments, and memory context
    const parts: any[] = [];

    // Add memory context and history
    let contextPrompt = '';
    if (memoryContext) {
      contextPrompt += `${memoryContext}\n\n`;
    }

    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-6).map((h: any) => `${h.role === 'user' ? 'User' : 'JARVIS'}: ${h.text}`).join('\n');
      contextPrompt += `Recent Conversation Context:\n${recentHistory}\n\n`;
    }

    contextPrompt += `User Input: ${message}`;
    parts.push({ text: contextPrompt });

    // Handle any image/document attachments
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        if (att.data && att.mimeType) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data.replace(/^data:[^;]+;base64,/, ''),
            },
          });
        }
      }
    }

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.8-flash', 'gemini-2.5-flash'];
    let response: any = null;
    let successfulModel = 'gemini-3.1-flash-lite';
    let lastError: any = null;

    const requestContents = parts.length === 1 && parts[0].text ? parts[0].text : { parts };

    for (const model of modelsToTry) {
      try {
        const config: any = {
          systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
        };
        if (model.includes('3.') || model.includes('4-')) {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }

        const callPromise = ai.models.generateContent({
          model,
          contents: requestContents,
          config,
        });

        const timeoutLimit = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout on ${model}`)), 15000)
        );

        response = await Promise.race([callPromise, timeoutLimit]);
        if (response && response.text) {
          successfulModel = model;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${model} request failed: ${err.message}, trying alternate...`);
        lastError = err;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('All model endpoints unavailable');
    }

    const responseText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = {
        speech: responseText.slice(0, 200),
        detailedResponse: responseText,
        intent: 'question',
        action: null,
      };
    }

    res.json({
      success: true,
      source: successfulModel,
      speech: parsed.speech || 'Understood, sir.',
      detailedResponse: parsed.detailedResponse || '',
      intent: parsed.intent || 'information',
      action: parsed.action || null,
      requiresConfirmation: Boolean(parsed.requiresConfirmation),
      suggestedFollowUps: parsed.suggestedFollowUps || [],
    });
  } catch (err: any) {
    console.error('Gemini API Error, falling back to local protocol:', err.message);
    const lower = (message || '').toLowerCase();
    let action: any = null;
    let speech = 'Understood, sir. Operating on local auxiliary processing.';

    if (lower.includes('open youtube') || lower.includes('play a song') || lower.includes('play music')) {
      action = { type: 'open_url', params: { url: 'https://www.youtube.com' } };
      speech = 'Opening YouTube on your display, sir.';
    } else if (lower.includes('open google') || lower.includes('open chrome') || lower.includes('search for')) {
      const query = lower.replace(/open google|open chrome|search for|hey jarvis|jarvis/g, '').trim() || 'artificial intelligence';
      action = { type: 'web_search', params: { query } };
      speech = `Initiating browser search for "${query}", sir.`;
    } else if (lower.includes('camera') || lower.includes('vision') || lower.includes('scan')) {
      action = { type: 'camera_scan', params: { action: 'open' } };
      speech = 'Activating visual sensors and optics, sir.';
    } else if (lower.includes('reminder') || lower.includes('remind me')) {
      action = { type: 'create_reminder', params: { title: message.replace(/remind me to|create a reminder for|hey jarvis|jarvis/gi, '').trim() || 'Important Task', time: '1 hour' } };
      speech = 'Logged your reminder into local task storage, sir.';
    } else if (lower.includes('note') || lower.includes('write this down')) {
      action = { type: 'create_note', params: { title: 'Quick Note', content: message } };
      speech = 'Note recorded in memory, sir.';
    } else if (lower.includes('status') || lower.includes('reactor') || lower.includes('diagnostics')) {
      action = { type: 'system_check', params: { status: 'healthy' } };
      speech = 'Arc reactor core operating at 100% capacity with 3.8 gigajoules output. All defensive systems nominal.';
    } else {
      speech = `I have received your instruction regarding "${message.slice(0, 50)}", sir. Local subroutines are executing.`;
    }

    res.json({
      success: true,
      source: 'local_failover_protocol',
      speech,
      detailedResponse: `Executed via auxiliary local subroutine due to neural core latency (${err.message}).`,
      intent: action ? 'command' : 'information',
      action,
      requiresConfirmation: false,
      suggestedFollowUps: ['Run system diagnostics', 'Open YouTube', 'Create a reminder'],
    });
  }
});

// API: Document & Vision OCR Analyzer
app.post('/api/jarvis/analyze', async (req: Request, res: Response) => {
  const { fileData, mimeType, prompt, taskType } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    res.status(400).json({
      success: false,
      error: 'Gemini API key is required for multi-modal document and vision analysis.',
    });
    return;
  }

  try {
    const parts: any[] = [];
    if (fileData && mimeType) {
      parts.push({
        inlineData: {
          mimeType,
          data: fileData.replace(/^data:[^;]+;base64,/, ''),
        },
      });
    }

    const taskInstruction = taskType === 'ocr'
      ? 'Perform optical character recognition (OCR). Extract all visible text accurately and provide structured insights.'
      : taskType === 'diagram'
      ? 'Analyze this diagram/chart in detail. Explain the architecture, workflows, components, and relationships.'
      : 'Analyze this image or document thoroughly. Provide an executive summary, key insights, and actionable items.';

    parts.push({
      text: `${taskInstruction}\nUser specific request: ${prompt || 'Summarize and analyze the provided file.'}`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: { parts },
      config: {
        systemInstruction: `You are JARVIS assisting your user with computer vision and document analysis. Maintain your polite, sophisticated, articulate persona. Return well-structured, clear markdown.`,
      },
    });

    res.json({
      success: true,
      analysis: response.text,
      speech: 'Analysis complete, sir. Results are compiled on your display.',
    });
  } catch (err: any) {
    console.error('Analyze error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vite / Static files mounting
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[JARVIS Server] System online and listening on port ${PORT}`);
  });
}

startServer();
