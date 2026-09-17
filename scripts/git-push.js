const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const repoDir = path.resolve(__dirname, '..');

async function push() {
  const token = process.env.GITHUB_TOKEN || process.argv[2];

  if (!token) {
    console.log(`
ℹ️  To push using Node (bypassing native git / Xcode developer tools):
   node ./scripts/git-push.js <YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>
   or
   GITHUB_TOKEN=ghp_xxxx node ./scripts/git-push.js

💡 Or to use standard native git:
   1. Run 'xcode-select --install' in Terminal (or 'brew install git')
   2. Run 'git push -u origin main'
`);
    return;
  }

  console.log('🚀 Pushing to https://github.com/asry16/family-companion.git...');

  const pushResult = await git.push({
    fs,
    http,
    dir: repoDir,
    remote: 'origin',
    ref: 'main',
    onAuth: () => ({ username: token }),
  });

  console.log('✅ Push complete:', pushResult);
}

push().catch((err) => {
  console.error('❌ Push failed:', err.message);
});
