// Fails the build if any Effect Size Library entry lacks its evidence fields.
import { readFileSync } from 'node:fs';

const { entries } = JSON.parse(readFileSync(new URL('../src/data/effectSizeLibrary.json', import.meta.url), 'utf8'));
const TYPES = ["Cohen's d", "Cohen's f", 'R² (PERMANOVA)'];
const BASES = ['Meta-analysis', 'Single study', 'Correlational'];
const errors = [];
const ids = new Set();
for (const e of entries) {
  const where = `entry ${e.id}`;
  if (ids.has(e.id)) errors.push(`${where}: duplicate id`);
  ids.add(e.id);
  for (const f of ['studyType', 'responseVariable', 'taxonomicGroup', 'reportedStatistic', 'citation', 'shortRef', 'doi', 'location']) {
    if (typeof e[f] !== 'string' || !e[f].trim()) errors.push(`${where}: missing ${f}`);
  }
  if (!/^10\.\d{4,9}\/\S+$/.test(e.doi ?? '')) errors.push(`${where}: malformed DOI "${e.doi}"`);
  if (!TYPES.includes(e.effectType)) errors.push(`${where}: unknown effectType "${e.effectType}"`);
  if (!BASES.includes(e.basis)) errors.push(`${where}: unknown basis "${e.basis}"`);
  if (!(typeof e.effectSize === 'number' && e.effectSize >= 0 && Number.isFinite(e.effectSize))) errors.push(`${where}: invalid effectSize`);
  if (e.effectType === 'R² (PERMANOVA)' && !(e.effectSize > 0 && e.effectSize < 1)) errors.push(`${where}: R² out of range`);
  if (!/\d/.test(e.reportedStatistic ?? '')) errors.push(`${where}: reportedStatistic has no number`);
  if (/—/.test(JSON.stringify(e))) errors.push(`${where}: contains an em dash`);
}
if (errors.length) {
  console.error(`Effect Size Library check failed:\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(`Effect Size Library check passed (${entries.length} entries).`);
