const path = require('path');
const fs = require('fs');
let broken = 0;
let checked = 0;

const dirs = process.argv.slice(2);
if (dirs.length === 0) {
  dirs.push('modules/', 'models/', 'routes/', 'middleware/', 'services/');
}

function check(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    const fp = path.join(entry.parentPath || entry.path, entry.name);
    if (!fp.endsWith('.js') || entry.isDirectory()) continue;
    const content = fs.readFileSync(fp, 'utf8');
    const matches = content.matchAll(/require\(['"](\.[^'"]+)['"]\)/g);
    for (const m of matches) {
      checked++;
      const resolved = path.resolve(path.dirname(fp), m[1]);
      if (!fs.existsSync(resolved + '.js') && !fs.existsSync(resolved + '/index.js') && !fs.existsSync(resolved)) {
        console.log('BROKEN:', fp, '->', m[1]);
        broken++;
      }
    }
  }
}

for (const d of dirs) {
  check(d);
}

console.log('Checked', checked, 'requires.');
if (broken) {
  console.log(broken + ' BROKEN requires found!');
  process.exit(1);
} else {
  console.log('OK: All requires resolve');
}
