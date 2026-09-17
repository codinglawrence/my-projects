// utils/storage.js
// 本地缓存：收藏 / 笔记 / 历史 的 CRUD（同步写入，体量极小）

const KEY_FAV = 'favorites'; // Object<cardId, {favoritedAt}>
const KEY_NOTE = 'notes';    // Object<cardId, String>
const KEY_HIS = 'history';   // Array<{cardId, drawnAt, note?}>

const get = (k, d) => wx.getStorageSync(k) || d;
const set = (k, v) => wx.setStorageSync(k, v);

function toggleFavorite(id) {
  const f = get(KEY_FAV, {});
  if (f[id]) delete f[id];
  else f[id] = { favoritedAt: Date.now() };
  set(KEY_FAV, f);
  return !!f[id]; // 返回当前是否已收藏
}

function isFavorite(id) {
  return !!get(KEY_FAV, {})[id];
}

function getFavorites() {
  return get(KEY_FAV, {});
}

function saveNote(id, text) {
  const n = get(KEY_NOTE, {});
  n[id] = text;
  set(KEY_NOTE, n);
}

function getNote(id) {
  return get(KEY_NOTE, {})[id] || '';
}

// 抽卡完成时写入历史（倒序，最多 200 条）
function addHistory(id) {
  const h = get(KEY_HIS, []);
  h.unshift({ cardId: id, drawnAt: Date.now() });
  set(KEY_HIS, h.slice(0, 200));
}

// 历史里回填笔记（便于历史页直接展示）
function syncHistoryNote(id, text) {
  const h = get(KEY_HIS, []);
  for (const item of h) {
    if (item.cardId === id) item.note = text;
  }
  set(KEY_HIS, h);
}

function getHistory() {
  return get(KEY_HIS, []);
}

// 清空全部本地数据：收藏 / 笔记 / 历史（用于收藏页「清除全部数据」）
function resetAll() {
  set(KEY_FAV, {});
  set(KEY_NOTE, {});
  set(KEY_HIS, []);
}

module.exports = {
  toggleFavorite,
  isFavorite,
  getFavorites,
  saveNote,
  getNote,
  addHistory,
  syncHistoryNote,
  getHistory,
  resetAll,
};
