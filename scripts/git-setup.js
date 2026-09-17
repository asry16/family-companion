const git = require('isomorphic-git');
const fs = require('fs');
const path = require('path');

const repoDir = path.resolve(__dirname, '..');

async function run() {
  console.log('🚀 Initializing git repository at:', repoDir);

  // 1. Initialize git
  await git.init({ fs, dir: repoDir, defaultBranch: 'main' });
  console.log('✅ Git repository initialized with default branch: main');

  // 2. Add remote origin
  try {
    await git.addRemote({
      fs,
      dir: repoDir,
      remote: 'origin',
      url: 'https://github.com/asry16/family-companion.git',
      force: true,
    });
    console.log('✅ Remote origin set to https://github.com/asry16/family-companion.git');
  } catch (e) {
    console.log('Remote note:', e.message);
  }

  // 3. Scan directory and stage files respecting .gitignore
  console.log('📦 Staging files...');

  const ignoreList = [
    'node_modules',
    '.git',
    '.expo',
    '.DS_Store',
    '.gemini',
    '.claude',
    'dist',
    'web-build',
    'npm-debug.log',
  ];

  function getAllFiles(dir, base = '') {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const item of list) {
      if (ignoreList.includes(item)) continue;
      const fullPath = path.join(dir, item);
      const relPath = base ? `${base}/${item}` : item;
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(getAllFiles(fullPath, relPath));
      } else {
        results.push(relPath);
      }
    }
    return results;
  }

  const files = getAllFiles(repoDir);
  console.log(`Found ${files.length} project files to stage.`);

  for (const file of files) {
    await git.add({ fs, dir: repoDir, filepath: file });
  }
  console.log('✅ All files staged successfully.');

  // 4. Create initial commit
  const sha = await git.commit({
    fs,
    dir: repoDir,
    author: {
      name: 'Asmita',
      email: 'asmita@family-companion.internal',
    },
    message: 'feat(kinly): production ready family companion release v1.0.0\n\n- Real-time family telemetry & radar map\n- Unified natural language & voice planner\n- Searchable physical family vault & memories\n- Proactive context engine with multi-generational UI\n- Hardened client security with brute-force lockout & salted hashing',
  });

  console.log(`🎉 Initial commit created successfully! Commit SHA: ${sha}`);
  console.log('🌿 Ready for push to https://github.com/asry16/family-companion.git');
}

run().catch((err) => {
  console.error('❌ Git setup failed:', err);
  process.exit(1);
});
