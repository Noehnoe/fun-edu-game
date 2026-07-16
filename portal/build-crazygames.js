/* ===================================================================
   Build the CrazyGames (portal) version of Brainy Bunch.
   Run:  node portal/build-crazygames.js
   Output: ./crazygames-build/  (a self-contained folder ready to zip)

   It copies the game, strips the bits portals don't allow (AdSense,
   cloud accounts, external leaderboard) using the <!--PORTAL-STRIP-->
   markers in index.html, and wires in the CrazyGames SDK.
   =================================================================== */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out  = path.join(root, 'crazygames-build');
const CRAZY_SDK = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';

// 1) fresh output folder
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// 2) copy the game assets
const assets = ['css', 'js', 'icons', 'manifest.json', 'menu music.mp3'];
for (const item of assets) {
  const src = path.join(root, item);
  if (!fs.existsSync(src)) { console.warn('  ! missing, skipped:', item); continue; }
  fs.cpSync(src, path.join(out, item), { recursive: true });
}

// 3) drop in the CrazyGames SDK integration, remove files the portal build doesn't use
fs.copyFileSync(path.join(__dirname, 'crazygames.js'), path.join(out, 'js', 'crazygames.js'));
fs.rmSync(path.join(out, 'js', 'cloud.js'), { force: true });   // accounts layer: not used on portals

// 4) transform index.html
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const stripCount = (html.match(/<!--PORTAL-STRIP-->/g) || []).length;
html = html.replace(/[ \t]*<!--PORTAL-STRIP-->[\s\S]*?<!--\/PORTAL-STRIP-->\n?/g, '');

// add the CrazyGames SDK in <head>
html = html.replace('</head>', `  <script src="${CRAZY_SDK}"></script>\n</head>`);

// add the integration script where the marker is
html = html.replace('<!--PORTAL-INSERT-SCRIPTS-->', '<script src="js/crazygames.js"></script>');

fs.writeFileSync(path.join(out, 'index.html'), html);

// 5) report
function dirSize(p) {
  let total = 0, files = 0;
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    const fp = path.join(p, e.name);
    if (e.isDirectory()) { const r = dirSize(fp); total += r.total; files += r.files; }
    else { total += fs.statSync(fp).size; files++; }
  }
  return { total, files };
}
const { total, files } = dirSize(out);
const sanity = ['index.html', 'js/engine.js', 'js/crazygames.js', 'css/style.css'].every(f =>
  fs.existsSync(path.join(out, f)));

console.log('\n✅ CrazyGames build ready → crazygames-build/');
console.log(`   stripped ${stripCount} portal-only block(s); ${files} files, ${(total / 1048576).toFixed(2)} MB`);
console.log(`   SDK: ${CRAZY_SDK}`);
console.log(`   sanity check: ${sanity ? 'PASS' : 'FAIL — missing core files!'}`);
if (/adsbygoogle|cloud\.js|tab-leaders/.test(html)) {
  console.log('   ⚠️  warning: an AdSense/accounts/leaderboard reference survived — check markers.');
} else {
  console.log('   clean: no AdSense / accounts / leaderboard references remain.');
}
