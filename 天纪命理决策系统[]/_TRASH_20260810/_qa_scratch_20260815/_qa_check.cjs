const fs = require('fs');
const ts = fs.readFileSync('src/utils/renjianDaoData.ts', 'utf8');

// 提取各条目对象
const re = /"([^"]+)":\s*\{\s*number:\s*(\d+)/g;
let m, entries = [];
while ((m = re.exec(ts)) !== null) { entries.push({ name: m[1], num: +m[2] }); }
console.log('条目数:', entries.length);

let okSeq = true;
entries.forEach((e, i) => { if (e.num !== i + 1) { okSeq = false; console.log('序错:', e); } });
console.log('卦序连续1-64:', okSeq);

const names = entries.map(e => e.name);
const dup = names.filter((n, i) => names.indexOf(n) !== i);
console.log('重名:', dup.length ? dup : '无');

const blocks = ts.split(/\n  "/).slice(1);
let bad = 0;
blocks.forEach(block => {
  const name = (block.match(/^([^"]+)":/) || [])[1];
  const yaos = (block.match(/yao:\s*"/g) || []).length;
  const f = {
    hasNum: /number:\s*\d+/.test(block),
    hasPinyin: /pinyin:\s*"/.test(block),
    hasSym: /symbol:\s*"/.test(block),
    hasUp: /upperTrigram:\s*"/.test(block),
    hasLow: /lowerTrigram:\s*"/.test(block),
    hasHist: /historicalContext:\s*"/.test(block),
    hasImg: /imageObjects:\s*\[/.test(block),
    hasLesson: /lessonTitle:\s*"/.test(block),
    hasBagua: /baguaTuXiangJie:\s*\[/.test(block),
    hasCore: /corePhilosophy:\s*"/.test(block),
    hasRemedy: /tianjiRemedy:\s*"/.test(block),
  };
  const missing = Object.keys(f).filter(k => !f[k]);
  if (yaos !== 6 || missing.length) {
    bad++;
    console.log('字段异常:', name, 'yaos=' + yaos, '缺失:', missing.join(',') || '无');
  }
});
console.log('字段异常条目数:', bad);

// 校验 symbol 是单个卦符 (应为 ䷀..䷿)
const symRe = /symbol:\s*"([^"]+)"/g;
let sm, symMissing = 0;
while ((sm = symRe.exec(ts)) !== null) {
  if ([...sm[1]].length !== 1) { symMissing++; console.log('symbol异常:', sm[1]); }
}
console.log('symbol格式异常数:', symMissing);
