const fs = require('fs');
const brief = fs.readFileSync('src/utils/ichingEngine.ts', 'utf8');
const db = fs.readFileSync('src/utils/renjianDaoData.ts', 'utf8');

const briefNames = [...brief.matchAll(/name:\s*"([^"]+)"/g)].map(m => m[1]);
// 缩进无关地提取 DB 键（任意前导空白 + "name": {）
const dbKeys = [...db.matchAll(/^\s*"([^"]+)":\s*\{\s*$/gm)].map(m => m[1]);

console.log('BRIEF 卦名数:', briefNames.length);
console.log('DB 键数:', dbKeys.length);

const dbSet = new Set(dbKeys);
const missing = briefNames.filter(n => !dbSet.has(n));
console.log('BRIEF 在 DB 缺失:', missing.length ? missing : '无');
const bSet = new Set(briefNames);
console.log('DB 有但 BRIEF 无:', dbKeys.filter(k => !bSet.has(k)));

// 顺序检查：DB 键应按 King Wen 1..64
const numOf = {};
[...db.matchAll(/"([^"]+)":\s*\{\s*number:\s*(\d+)/g)].forEach(m => numOf[m[1]] = +m[2]);
const ordered = dbKeys.every((k, i) => numOf[k] === i + 1);
console.log('DB 物理顺序 1..64 连续:', ordered);

// 括号平衡
let depth = 0, bad = false;
for (const c of db) { if (c === '{') depth++; else if (c === '}') { depth--; if (depth < 0) { bad = true; break; } } }
console.log('DB 括号深度:', depth, '异常:', bad);

// 每条 6 爻 & 必填
const blocks = db.split(/\n\s*"/).slice(1);
let badFields = 0;
blocks.forEach(b => {
  const name = (b.match(/^([^"]+)":/) || [])[1];
  const yaos = (b.match(/yao:\s*"/g) || []).length;
  const need = ['number:', 'pinyin:', 'symbol:', 'upperTrigram:', 'lowerTrigram:', 'historicalContext:', 'imageObjects:', 'lessonTitle:', 'baguaTuXiangJie:', 'corePhilosophy:', 'tianjiRemedy:', 'yaos:'];
  const miss = need.filter(f => !b.includes(f));
  if (yaos !== 6 || miss.length) { badFields++; console.log('异常:', name, 'yaos=' + yaos, miss); }
});
console.log('字段/爻数异常条目:', badFields);
