// QA verification script for cardArt.js halo tweak regression
// NOT modifying source — only reads it.
const path = require('path');
const mod = require('./cardArt.js');
const { buildCard, utf8ToBase64 } = mod;

function decode(dataUri) {
  // data:image/svg+xml;base64,XXXX
  const comma = dataUri.indexOf(',');
  const b64 = dataUri.slice(comma + 1);
  // utf8 base64 decode
  const buf = Buffer.from(b64, 'base64');
  return buf.toString('utf8');
}

function validateSvgStructure(svg, label) {
  const starts = svg.trim().startsWith('<svg');
  const ends = svg.trim().endsWith('</svg>');
  return { starts, ends, ok: starts && ends };
}

// (haloG helpers removed — haloG no longer exists in cardArt.js)

// collect results
const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
}

// ---- Test combinations ----
const cases = [
  { split: true, suit: 'spade', rank: 'A', themeIndex: 0, rarity: 'holo', emblem: 'star' },
  { split: true, suit: 'heart', rank: 'K', themeIndex: 13, rarity: 'rainbow', emblem: 'rose' },
  { split: true, suit: 'diamond', rank: '7', themeIndex: 26, rarity: 'vmax', emblem: 'scales' },
  { split: true, suit: 'club', rank: 'Q', themeIndex: 39, rarity: 'shiny', emblem: 'owl' },
];

let allPass = true;

cases.forEach((o, i) => {
  const out = buildCard(o);
  const tag = `case${i}(${o.suit}${o.rank}-t${o.themeIndex}-${o.rarity})`;

  // 1. structure (decode data-URI → raw SVG before validating)
  const bgSvg = decode(out.bg);
  const fgSvg = decode(out.fg);
  const bgStruct = validateSvgStructure(bgSvg, 'bg');
  const fgStruct = validateSvgStructure(fgSvg, 'fg');
  record(`${tag}: bg is valid svg`, bgStruct.ok, `starts<svg>=${bgStruct.starts}, ends</svg>=${fgStruct.ends}`);
  record(`${tag}: fg is valid svg`, fgStruct.ok, `starts=${fgStruct.starts}, ends=${fgStruct.ends}`);

  // 2. fg unaffected: contains rank text, QUESTION box, emblem symbol
  //    (fgSvg 已在上面结构校验时解码)
  const hasRank = fgSvg.includes(`>${o.rank}<`);
  const hasQuestion = fgSvg.includes('QUESTION');
  const hasEmblem = fgSvg.includes('translate(-67.5,-67.5)'); // emblem group transform (scale 1.35)
  record(`${tag}: fg has rank text "${o.rank}"`, hasRank, `includes>${o.rank}<=${hasRank}`);
  record(`${tag}: fg has QUESTION box`, hasQuestion, `includes QUESTION=${hasQuestion}`);
  record(`${tag}: fg has emblem group`, hasEmblem, `includes emblem transform=${hasEmblem}`);

  // 3. bg should NOT contain readable text (fg is separate) — sanity that split works
  const bgHasQuestion = bgSvg.includes('QUESTION');
  record(`${tag}: bg contains no QUESTION text (fg isolated)`, !bgHasQuestion, `bg includes QUESTION=${bgHasQuestion}`);

});

// ---- Regression: fgInner logic byte-identical across calls (deterministic) ----
// Build a reference fg for a known input and re-build; compare decoded fg strings
const refA = decode(buildCard({ split: true, suit: 'spade', rank: 'A', themeIndex: 0, rarity: 'holo', emblem: 'star' }).fg);
const refB = decode(buildCard({ split: true, suit: 'spade', rank: 'A', themeIndex: 0, rarity: 'holo', emblem: 'star' }).fg);
record('fgInner deterministic (no side-effect drift)', refA === refB, `equal=${refA === refB}`);

// ---- Ensure other stop-opacity / r= in bg are unchanged ----
// Check faceG stops unchanged (0.15 change shouldn't leak into faceG)
function getFaceGStops(svg) {
  const block = svg.match(/<radialGradient id="faceG"[\s\S]*?<\/radialGradient>/);
  return block ? block[0] : null;
}
const bgSample = decode(buildCard({ split: true, suit: 'spade', rank: 'A', themeIndex: 0, rarity: 'holo', emblem: 'star' }).bg);
record('faceG untouched (no stop-opacity added)', !bgSample.includes('faceG') || getFaceGStops(bgSample).indexOf('stop-opacity') === -1, `faceG has no stop-opacity=${getFaceGStops(bgSample).indexOf('stop-opacity') === -1}`);

// ---- Output ----
console.log('===== QA VERIFICATION RESULTS =====');
let failed = 0;
results.forEach(r => {
  if (!r.pass) failed++;
  console.log(`${r.pass ? 'PASS' : 'FAIL'} | ${r.name} | ${r.detail}`);
});
console.log('===================================');
console.log(`TOTAL=${results.length} PASS=${results.length - failed} FAIL=${failed}`);
console.log(failed === 0 ? 'OVERALL: PASS' : 'OVERALL: FAIL');
