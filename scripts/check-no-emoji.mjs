// Fails the build if any emoji-range character is present in src/ or index.html.
// Ranges: U+1F000-U+1FAFF, U+2600-U+27BF, U+FE0F
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const targets = [join(root, 'index.html'), join(root, 'src')];
const re = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
const files = [];
const walk = (p) => {
  if (statSync(p).isDirectory()) readdirSync(p).forEach((f) => walk(join(p, f)));
  else files.push(p);
};
targets.forEach(walk);

let bad = 0;
for (const f of files) {
  readFileSync(f, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const ch of line) {
        if (re.test(ch)) {
          bad++;
          console.error(`${relative(root, f)}:${i + 1}  U+${ch.codePointAt(0).toString(16).toUpperCase()}`);
        }
      }
    });
}
if (bad) {
  console.error(`check-no-emoji: ${bad} emoji character(s) found.`);
  process.exit(1);
}
console.log(`check-no-emoji: OK (${files.length} files scanned)`);
