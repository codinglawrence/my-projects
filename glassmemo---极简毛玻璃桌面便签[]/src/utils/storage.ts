import { DailyNote, StickySettings } from '../types';
import { getTodayString } from './date';

const STORAGE_NOTES_KEY = 'glassmemo_notes_v1';
const STORAGE_SETTINGS_KEY = 'glassmemo_settings_v1';

export const DEFAULT_SETTINGS: StickySettings = {
  opacity: 0.92,
};

export function getInitialNotes(): Record<string, DailyNote> {
  const today = getTodayString();

  return {
    [today]: {
      date: today,
      items: [
        {
          id: 'item-welcome-1',
          text: '双击这条备忘可以编辑文字',
          completed: false,
          createdAt: Date.now() - 3600000,
        },
        {
          id: 'item-welcome-2',
          text: '顶栏按住可拖动便签到桌面任意位置',
          completed: false,
          createdAt: Date.now() - 3600000 * 2,
        },
        {
          id: 'item-welcome-3',
          text: '顶部工具栏可切换日期、调透明度、置顶',
          completed: true,
          createdAt: Date.now() - 3600000 * 3,
        },
      ],
    },
  };
}

export function loadNotes(): Record<string, DailyNote> {
  try {
    const raw = localStorage.getItem(STORAGE_NOTES_KEY);
    if (!raw) return getInitialNotes();
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
    return getInitialNotes();
  } catch {
    return getInitialNotes();
  }
}

export function saveNotes(notes: Record<string, DailyNote>): void {
  try {
    localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save notes', e);
  }
}

export function loadSettings(): StickySettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: StickySettings): void {
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}
