const fs = require('fs');
const t = fs.readFileSync('src/utils/renjianDaoData.ts', 'utf8');
const i = t.indexOf('"乾为天":');
const j = t.indexOf('"坤为地":');
const blk = t.slice(i, j);
console.log('乾为天 含 corePhilosophy:', /corePhilosophy:/.test(blk));
console.log('乾为天 含 tianjiRemedy:', /tianjiRemedy:/.test(blk));
console.log('乾为天 爻数(yao:):', (blk.match(/yao:\s*"/g) || []).length);
// 同时抽查最后一卦 火水未济
const k = t.lastIndexOf('"火水未济":');
const blk2 = t.slice(k);
console.log('未济 含 corePhilosophy:', /corePhilosophy:/.test(blk2));
console.log('未济 含 tianjiRemedy:', /tianjiRemedy:/.test(blk2));
console.log('未济 爻数(yao:):', (blk2.match(/yao:\s*"/g) || []).length);
