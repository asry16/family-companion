const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, '..', 'node_modules', 'react-native-web', 'dist', 'cjs', 'modules', 'warnOnce', 'index.js'),
  path.join(__dirname, '..', 'node_modules', 'react-native-web', 'dist', 'modules', 'warnOnce', 'index.js'),
  path.join(__dirname, '..', 'node_modules', 'react-native-web', 'src', 'modules', 'warnOnce', 'index.js'),
];

for (const filePath of targetFiles) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('shadowStyles')) {
      content = content.replace(
        /if \(warnedKeys\[key\]\) \{\s*return;\s*\}/g,
        `if (warnedKeys[key]) { return; }\n    if (key === 'shadowStyles' || key === 'textShadowStyles' || (typeof message === 'string' && message.includes('shadow*'))) { warnedKeys[key] = true; return; }`
      );
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Patched warnOnce in', filePath);
    }
  }
}
