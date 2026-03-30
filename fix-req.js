const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('route.ts')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
}

const apiDir = path.join(process.cwd(), 'app', 'api');
const files = walkSync(apiDir);

let updated = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Match getToken({ req: anyVariable, secret: process.env.NEXTAUTH_SECRET })
  const regex = /await getToken\(\{\s*req:\s*([a-zA-Z_0-9]+),\s*secret:\s*process\.env\.NEXTAUTH_SECRET\s*\}\)/g;
  if (regex.test(content)) {
    content = content.replace(regex, 'await getAuthSession($1)');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed:', file);
    updated++;
  }
}
console.log('Total fixed: ' + updated);
