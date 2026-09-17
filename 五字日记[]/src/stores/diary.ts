/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 五字日记 — 存储服务 v3.1
 *
 * 存储策略（双层架构）：
 *   1. 5+ App 环境 → SQLite（原生持久化）
 *   2. 浏览器环境 → localStorage（降级）
 *
 * 数据迁移：首次启动自动迁移旧 localStorage 数据（diaryEntries / diary_entries）到 SQLite
 */

import { useSyncExternalStore } from "react";
import { TEMP_SEED_ENTRIES } from "../seed-data";

// ===================== 类型定义 =====================

export interface DiaryEntry {
  id: string;
  text: string;
  date: string; // "yyyy年MM月dd日" — 用于自然日排序
  timestamp: number;
  mood?: number; // 0-10 心情评分，可选（旧数据无此字段）
}

// ===================== 环境检测 =====================

function isPlusApp(): boolean {
  try {
    return typeof plus !== "undefined" && plus !== null;
  } catch {
    return false;
  }
}

// ===================== SQLite 引擎 =====================

const DB_NAME = "diary";
const TABLE_NAME = "diary_entries";

async function initSQLite(): Promise<boolean> {
  if (!isPlusApp()) return false;
  try {
    plus.sqlite.openDatabase({ name: DB_NAME, path: "_doc/diary.db" });
    plus.sqlite.executeSql({
      name: DB_NAME,
      sql: `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        date TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        mood INTEGER
      )`,
    });
    // v3: 尝试添加 mood 列（兼容旧表无此列）
    try {
      plus.sqlite.executeSql({
        name: DB_NAME,
        sql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN mood INTEGER`,
      });
    } catch {
      // 列已存在，忽略
    }
    console.log("[SQLite] 初始化成功");
    return true;
  } catch (e) {
    console.error("[SQLite] 初始化失败:", e);
    return false;
  }
}

async function getAllFromSQLite(): Promise<DiaryEntry[]> {
  try {
    const rows = plus.sqlite.selectSql({
      name: DB_NAME,
      sql: `SELECT * FROM ${TABLE_NAME} ORDER BY date DESC, timestamp DESC`,
    });
    return (rows || []).map((r: any) => ({
      id: String(r.id),
      text: String(r.text),
      date: String(r.date),
      timestamp: Number(r.timestamp),
      mood: r.mood != null ? Number(r.mood) : undefined,
    }));
  } catch (e) {
    console.error("[SQLite] 查询失败:", e);
    return [];
  }
}

async function addToSQLite(entry: DiaryEntry): Promise<boolean> {
  try {
    // 先删除同日旧记录
    plus.sqlite.executeSql({
      name: DB_NAME,
      sql: `DELETE FROM ${TABLE_NAME} WHERE date = ?`,
      values: [entry.date],
    });
    // 再插入新记录
    plus.sqlite.executeSql({
      name: DB_NAME,
      sql: `INSERT INTO ${TABLE_NAME} (id, text, date, timestamp, mood) VALUES (?, ?, ?, ?, ?)`,
      values: [entry.id, entry.text, entry.date, entry.timestamp, entry.mood ?? null],
    });
    return true;
  } catch (e) {
    console.error("[SQLite] 写入失败:", e);
    return false;
  }
}

async function deleteFromSQLite(id: string): Promise<boolean> {
  try {
    plus.sqlite.executeSql({
      name: DB_NAME,
      sql: `DELETE FROM ${TABLE_NAME} WHERE id = ?`,
      values: [id],
    });
    return true;
  } catch (e) {
    console.error("[SQLite] 删除失败:", e);
    return false;
  }
}

// ===================== localStorage 引擎 =====================

const STORAGE_KEY = "diary_entries";
const LEGACY_STORAGE_KEY = "diaryEntries"; // v1.x demo 旧键

function loadFromLocalStorage(key = STORAGE_KEY): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(key);
    const arr: DiaryEntry[] = raw ? JSON.parse(raw) : [];
    arr.sort((a, b) => b.date.localeCompare(a.date, "zh-CN"));
    return arr;
  } catch {
    return [];
  }
}

function saveToLocalStorage(entries: DiaryEntry[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch (e) {
    console.error("[localStorage] 写入失败:", e);
    return false;
  }
}

// ===================== 存储管理器 =====================

type StorageBackend = "sqlite" | "local";

let backend: StorageBackend = "local";
let initCompleted = false;
let initPromise: Promise<void> | null = null;

async function ensureStorage(): Promise<StorageBackend> {
  if (isPlusApp()) {
    const ok = await initSQLite();
    if (ok) {
      // 迁移两个可能的旧 localStorage 键
      const legacyKeys = [LEGACY_STORAGE_KEY, STORAGE_KEY];
      for (const key of legacyKeys) {
        const legacy = loadFromLocalStorage(key);
        if (legacy.length > 0) {
          console.log(`[Storage] 发现 ${legacy.length} 条遗留数据(key=${key})，迁移到 SQLite...`);
          for (const entry of legacy) {
            await addToSQLite(entry);
          }
          localStorage.removeItem(key);
          console.log(`[Storage] 迁移完成(key=${key})`);
        }
      }
      return "sqlite";
    }
  }
  return "local";
}

// ===================== 全局响应式状态 =====================

let entriesState: DiaryEntry[] = [];
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((cb) => cb());
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): DiaryEntry[] {
  return entriesState;
}

async function reloadEntries(): Promise<void> {
  if (backend === "sqlite") {
    entriesState = await getAllFromSQLite();
  } else {
    entriesState = loadFromLocalStorage().sort((a, b) => b.date.localeCompare(a.date, "zh-CN"));
  }
  notifyListeners();
}

// ===================== 临时种子数据（打包完成后删除本段 + seed-data.ts）=====================

const SEED_FLAG_KEY = "__diary_seed_done__";

async function seedInitialDataIfNeeded(): Promise<void> {
  if (typeof localStorage === "undefined") return;
  if (localStorage.getItem(SEED_FLAG_KEY) === "1") return;
  if (TEMP_SEED_ENTRIES.length === 0) return;

  try {
    if (backend === "sqlite") {
      for (const entry of TEMP_SEED_ENTRIES) {
        plus.sqlite.executeSql({
          name: DB_NAME,
          sql: `INSERT OR IGNORE INTO ${TABLE_NAME} (id, text, date, timestamp, mood) VALUES (?, ?, ?, ?, ?)`,
          values: [entry.id, entry.text, entry.date, entry.timestamp, entry.mood ?? null],
        });
      }
    } else {
      const existing = loadFromLocalStorage();
      const existingIds = new Set(existing.map((e) => e.id));
      const merged = [...existing, ...TEMP_SEED_ENTRIES.filter((e) => !existingIds.has(e.id))];
      saveToLocalStorage(merged.sort((a, b) => b.date.localeCompare(a.date, "zh-CN")));
    }
    localStorage.setItem(SEED_FLAG_KEY, "1");
    await reloadEntries();
    console.log(`[Seed] 已导入 ${TEMP_SEED_ENTRIES.length} 条历史日记`);
  } catch (e) {
    console.error("[Seed] 导入失败:", e);
  }
}

// ===================== 公开 API =====================

export async function initStorage(): Promise<void> {
  if (initCompleted) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    backend = await ensureStorage();
    await reloadEntries();
    await seedInitialDataIfNeeded(); // 临时：打包完成后删除
    console.log(`[Storage] 后端: ${backend}, 条目数: ${entriesState.length}`);
    initCompleted = true;
  })();
  return initPromise;
}

export function getBackend(): StorageBackend {
  return backend;
}

export async function addEntry(
  text: string,
  date: string,
  mood?: number
): Promise<{ ok: boolean; overwritten: boolean }> {
  try {
    const entry: DiaryEntry = {
      id: Date.now().toString(),
      text,
      date,
      timestamp: Date.now(),
      mood,
    };

    // 检测是否同日覆盖
    const existed = entriesState.some((e) => e.date === entry.date);

    let ok: boolean;
    if (backend === "sqlite") {
      ok = await addToSQLite(entry);
    } else {
      // localStorage：过滤同日旧记录
      const all = loadFromLocalStorage().filter((e) => e.date !== entry.date);
      ok = saveToLocalStorage([entry, ...all]);
    }
    if (!ok) return { ok: false, overwritten: false };

    // 内存状态：移除同日旧记录 + 按日期降序
    entriesState = entriesState.filter((e) => e.date !== entry.date);
    entriesState = [...entriesState, entry].sort((a, b) => b.date.localeCompare(a.date, "zh-CN"));
    notifyListeners();
    return { ok: true, overwritten: existed };
  } catch (e) {
    console.error("写入日记失败:", e);
    return { ok: false, overwritten: false };
  }
}

export async function deleteEntry(id: string): Promise<boolean> {
  try {
    let ok: boolean;
    if (backend === "sqlite") {
      ok = await deleteFromSQLite(id);
    } else {
      const all = loadFromLocalStorage();
      ok = saveToLocalStorage(all.filter((e) => e.id !== id));
    }
    if (!ok) return false;
    entriesState = entriesState.filter((e) => e.id !== id);
    notifyListeners();
    return true;
  } catch (e) {
    console.error("删除日记失败:", e);
    return false;
  }
}

export function useDiaryStore() {
  const entries = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { entries, deleteEntry };
}

// ===================== 定位服务已移除（v3.1）=====================
// 用户反馈定位不准，已删除全部城市/地理位置相关逻辑。


