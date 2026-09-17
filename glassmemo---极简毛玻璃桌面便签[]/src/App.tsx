import React, { useState, useEffect } from 'react';
import { loadNotes, saveNotes, loadSettings, saveSettings } from './utils/storage';
import { DailyNote, StickySettings } from './types';
import { getTodayString } from './utils/date';
import { StickyNote } from './components/StickyNote';

export default function App() {
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayString());
  const [notes, setNotes] = useState<Record<string, DailyNote>>(() => loadNotes());
  const [settings, setSettings] = useState<StickySettings>(() => loadSettings());

  // 便签数据持久化
  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  // 设置持久化
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const currentNote: DailyNote = notes[currentDate] || {
    date: currentDate,
    items: [],
  };

  const handleUpdateCurrentNote = (updated: DailyNote) => {
    setNotes((prev) => ({
      ...prev,
      [currentDate]: updated,
    }));
  };

  const handleUpdateSettings = (partial: Partial<StickySettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...partial,
    }));
  };

  // 便签即窗口：整窗就是一张便签（Electron 无边框透明窗口）
  return (
    <StickyNote
      currentDate={currentDate}
      onSelectDate={setCurrentDate}
      note={currentNote}
      allNotes={notes}
      onUpdateNote={handleUpdateCurrentNote}
      settings={settings}
      onUpdateSettings={handleUpdateSettings}
    />
  );
}
