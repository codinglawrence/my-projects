// pages/history/history.js
const app = getApp();
const storage = require('../../utils/storage.js');

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function formatTime(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

Page({
  data: { list: [] },
  onShow() { this.load(); },
  load() {
    const cardsById = {};
    app.globalData.cards.forEach((c) => { cardsById[c.id] = c; });
    const h = storage.getHistory();
    const list = h.map((it) => ({
      cardId: it.cardId,
      timeText: formatTime(it.drawnAt),
      note: it.note || storage.getNote(it.cardId),
      card: cardsById[it.cardId],
    }));
    this.setData({ list });
  },
});
