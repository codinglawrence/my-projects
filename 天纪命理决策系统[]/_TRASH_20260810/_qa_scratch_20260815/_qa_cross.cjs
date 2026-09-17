const fs = require('fs');
const brief = fs.readFileSync('src/utils/ichingEngine.ts', 'utf8');
const db = fs.readFileSync('src/utils/renjianDaoData.ts', 'utf8');
const briefNames = [...brief.matchAll(/name:\s*"([^"]+)"/g)].map(m => m[1]);
const dbKeys = [...db.matchAll(/^\s{2}"([^"]+)":\s*\{\s*$/gm)].map(m => m[1]);
console.log('BRIEF 卦名数:', briefNames.length);
console.log('DB 键数:', dbKeys.length);
const dbSet = new Set(dbKeys);
const missing = briefNames.filter(n => !dbSet.has(n));
console.log('BRIEF 中在 DB 缺失的卦名:', missing.length ? missing : '无');
const bSet = new Set(briefNames);
console.log('DB 中有但 BRIEF 无的:', dbKeys.filter(k => !bSet.has(k)));
// 额外：BRIEF 内部是否重复
const dupB = briefNames.filter((n, i) => briefNames.indexOf(n) !== i);
console.log('BRIEF 重名:', dupB.length ? dupB : '无');
