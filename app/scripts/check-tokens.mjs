// Fails if any client source file outside tokens.ts hard-codes a colour, font name,
// gradient, pixel size or duration. Every visual value must come from tokens.ts.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = fileURLToPath(new URL('..', import.meta.url));
const clientDir = join(appDir, 'src', 'client');
const ALLOWED = new Set(['src/client/design/tokens.ts', 'src/client/data/themes.ts']);
const SCANNED = /\.(ts|tsx|css|html)$/;

const RULES = [
  ['hex colour', /#[0-9a-fA-F]{3,8}\b/],
  ['rgb()/rgba()/hsl() colour', /\b(rgba?|hsla?)\(/],
  ['gradient', /\b(repeating-)?(linear|radial|conic)-gradient\(/],
  ['font-family literal', /font-family\s*:(?!\s*(var\(|inherit\b))/],
  ['fontFamily literal', /fontFamily\s*:\s*['"`]/],
  [
    'font name',
    /\b(Plus Jakarta Sans|Inter|Arial|Helvetica|Roboto|Menlo|Monaco|Consolas|Courier|Segoe UI|SF Mono|JetBrains Mono|BlinkMacSystemFont|apple-system|system-ui|sans-serif|monospace)\b/,
  ],
  ['pixel size', /\b\d+(\.\d+)?px\b/],
  ['duration', /\b\d+(\.\d+)?m?s\b(?![-\w])/],
];

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (SCANNED.test(entry.name)) yield path;
  }
}

const problems = [];
for (const file of walk(clientDir)) {
  const rel = relative(appDir, file).split(sep).join('/');
  if (ALLOWED.has(rel)) continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const [name, re] of RULES) {
        if (re.test(line)) problems.push(`${rel}:${i + 1}  ${name}: ${line.trim()}`);
      }
    });
}

if (problems.length) {
  console.error(`check-tokens: ${problems.length} literal(s) found; use tokens.ts instead.\n`);
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('check-tokens: ok');
