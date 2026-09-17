const fs = require('fs');
const path = 'src/utils/renjianDaoData.ts';
const ts = fs.readFileSync(path, 'utf8');

const startMarker = 'export const RENJIAN_DAO_64_DATABASE';
const sIdx = ts.indexOf(startMarker);
if (sIdx < 0) { console.error('未找到数据库定义'); process.exit(1); }
// 数据库块从第一个 '{' 之后开始，到 '};' 结束（该 '};' 之后紧跟注释）
const braceOpen = ts.indexOf('{', sIdx);
// 找匹配的闭合 '};'：从某位置扫描，平衡括号，定位到与 braceOpen 配对的 '}'
let depth = 0, i = braceOpen, end = -1;
for (; i < ts.length; i++) {
  const c = ts[i];
  if (c === '{') depth++;
  else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
}
if (end < 0) { console.error('未找到闭合'); process.exit(1); }
// 闭合是 '}' ，其后应紧跟 ';'（文件中为 '};'）
const blockStart = braceOpen + 1;          // 进入 '{' 之后
const blockEnd = end;                       // 指向配对的 '}'
const inner = ts.slice(blockStart, blockEnd);

// 提取每个顶层条目：以 2 空格缩进的 "name": 开头，到平衡括号的 '}' 结束
const entryRe = /^\s{2}"([^"]+)":/gm;
const entries = [];
let mm;
while ((mm = entryRe.exec(inner)) !== null) {
  const name = mm[1];
  const entryStart = mm.index;
  // 从该条目的 '{' 开始配平括号
  const openBrace = inner.indexOf('{', entryStart);
  let d = 0, j = openBrace;
  for (; j < inner.length; j++) {
    const c = inner[j];
    if (c === '{') d++;
    else if (c === '}') { d--; if (d === 0) break; }
  }
  const entryText = inner.slice(entryStart, j + 1); // 含结尾 '}'
  // 提取 number
  const numM = entryText.match(/number:\s*(\d+)/);
  const num = numM ? +numM[1] : 999;
  entries.push({ name, num, text: entryText });
}

console.log('提取条目数:', entries.length);
// 按 number 升序
entries.sort((a, b) => a.num - b.num);
// 检查是否有乱序
const before = entryRe ? null : null;
let disordered = false;
const origOrder = [];
entryRe.lastIndex = 0;
while ((mm = entryRe.exec(inner)) !== null) origOrder.push(mm[1]);
for (let k = 0; k < origOrder.length; k++) {
  if (origOrder[k] !== entries[k].name) { disordered = true; break; }
}
console.log('原顺序是否 1..64 连续:', !disordered);
if (!disordered) { console.log('已是有序，无需重排'); process.exit(0); }

// 重建数据库内部
const rebuiltInner = entries.map(e => e.text).join(',\n');
const newInner = '\n  ' + rebuiltInner + '\n';
const newBlock = ts.slice(sIdx, braceOpen) + '{' + newInner + ts.slice(end); // end 指向 '}'
// 注意：ts.slice(end) 从 '}' 开始，包含 '};' 及之后内容
const newTs = ts.slice(0, sIdx) + newBlock;

fs.writeFileSync(path, newTs, 'utf8');
console.log('已重排为 1..64 顺序并写回');
