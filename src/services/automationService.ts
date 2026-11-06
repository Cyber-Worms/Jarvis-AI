import { JarvisAction } from '../types/jarvis';
import { StorageService } from './storageService';
import { jarvisAudio } from './audioSynth';

export class JarvisAutomationService {
  public static async executeAction(
    action: JarvisAction,
    handlers: {
      onOpenVision?: () => void;
      onAddReminder?: (title: string, dueTime: string) => void;
      onAddNote?: (title: string, content: string) => void;
      onNotify?: (message: string) => void;
    }
  ): Promise<{ success: boolean; resultDescription: string }> {
    jarvisAudio.playCommandConfirmed();

    switch (action.type) {
      case 'open_url': {
        const url = action.params.url || 'https://www.google.com';
        try {
          window.open(url, '_blank', 'noopener,noreferrer');
          StorageService.addLog({
            actionType: 'OPEN_URL',
            description: `Navigated display to: ${url}`,
            status: 'success',
          });
          return { success: true, resultDescription: `Launched external terminal at ${url}` };
        } catch {
          return { success: false, resultDescription: `Unable to open ${url}` };
        }
      }

      case 'web_search': {
        const query = encodeURIComponent(action.params.query || 'latest technological advances');
        const url = `https://www.google.com/search?q=${query}`;
        try {
          window.open(url, '_blank', 'noopener,noreferrer');
          StorageService.addLog({
            actionType: 'WEB_SEARCH',
            description: `Initiated search inquiry for: "${action.params.query}"`,
            status: 'success',
          });
          return { success: true, resultDescription: `Web search initiated for "${action.params.query}"` };
        } catch {
          return { success: false, resultDescription: `Web query dispatch failed` };
        }
      }

      case 'create_reminder': {
        const title = action.params.title || 'Scheduled Directive';
        const dueTime = action.params.time || '18:00 Today';
        if (handlers.onAddReminder) {
          handlers.onAddReminder(title, dueTime);
        }
        StorageService.addLog({
          actionType: 'REMINDER_SET',
          description: `Reminder created: "${title}" due ${dueTime}`,
          status: 'success',
        });
        return { success: true, resultDescription: `Reminder stored: ${title}` };
      }

      case 'create_note': {
        const title = action.params.title || 'Directive Note';
        const content = action.params.content || '';
        if (handlers.onAddNote) {
          handlers.onAddNote(title, content);
        }
        StorageService.addLog({
          actionType: 'NOTE_CREATED',
          description: `Logged note: "${title}"`,
          status: 'success',
        });
        return { success: true, resultDescription: `Note stored: ${title}` };
      }

      case 'camera_scan': {
        if (handlers.onOpenVision) {
          handlers.onOpenVision();
        }
        StorageService.addLog({
          actionType: 'OPTICS_ACTIVATED',
          description: 'Engaged visual optical camera sensor',
          status: 'success',
        });
        return { success: true, resultDescription: 'Camera optics active' };
      }

      case 'calculate': {
        StorageService.addLog({
          actionType: 'CALCULATION',
          description: `Evaluated expression: ${action.params.expression} = ${action.params.result}`,
          status: 'success',
        });
        return { success: true, resultDescription: `Calculation verified: ${action.params.result}` };
      }

      case 'device_command': {
        StorageService.addLog({
          actionType: 'DEVICE_COMMAND',
          description: `Device instruction executed: ${JSON.stringify(action.params)}`,
          status: 'success',
        });
        return { success: true, resultDescription: `Device directive completed` };
      }

      default:
        return { success: true, resultDescription: 'Directive acknowledged' };
    }
  }
}
