import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const assetsDir = path.join(distDir, 'assets');

// 1. Find CSS and JS in dist/assets
const files = fs.readdirSync(assetsDir);
const cssFile = files.find(f => f.endsWith('.css'));
const jsFile = files.find(f => f.endsWith('.js'));

if (!cssFile || !jsFile) {
  console.error('CSS or JS file not found in dist/assets');
  process.exit(1);
}

const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf-8');
let jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf-8');

// 2. Base64 encode the 3 images so the standalone HTML is 100% self-contained
const imgMap = {
  '/src/assets/images/abandoned_classroom_1791380679853.jpg': 'src/assets/images/abandoned_classroom_1791380679853.jpg',
  '/src/assets/images/first_person_closet_1791380642871.jpg': 'src/assets/images/first_person_closet_1791380642871.jpg',
  '/src/assets/images/ghost_breaking_barricade_1791380664425.jpg': 'src/assets/images/ghost_breaking_barricade_1791380664425.jpg',
};

for (const [urlPath, localPath] of Object.entries(imgMap)) {
  if (fs.existsSync(localPath)) {
    const b64 = fs.readFileSync(localPath).toString('base64');
    const dataUri = `data:image/jpeg;base64,${b64}`;
    jsContent = jsContent.split(urlPath).join(dataUri);
    console.log(`Inlined ${localPath} as data URI`);
  }
}

// 2b. Base64 encode the 3D GLB model so the standalone HTML contains the animated monster offline
if (fs.existsSync('public/345(1).glb')) {
  const glbB64 = fs.readFileSync('public/345(1).glb').toString('base64');
  const glbDataUri = `data:application/octet-stream;base64,${glbB64}`;
  jsContent = jsContent.split('/345(1).glb').join(glbDataUri);
  console.log(`Inlined 345(1).glb as data URI (${(glbDataUri.length / 1024 / 1024).toFixed(2)} MB)`);
}

// 3. Construct standalone HTML
const standaloneHtml = `<!doctype html>
<html lang="ru" class="dark bg-zinc-950 text-zinc-100">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Проклятый Флигель (The Forgotten Wing) — Полная Игра</title>
    <meta name="description" content="Атмосферный 3D survival horror от первого лица и полный Game Design Document. Готовый автономный файл игры." />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <style>
${cssContent}
    </style>
  </head>
  <body class="bg-zinc-950 text-zinc-100 overflow-hidden select-none antialiased">
    <div id="root"></div>
    <script type="module">
${jsContent}
    </script>
  </body>
</html>`;

// 4. Write output files
fs.writeFileSync('the_forgotten_wing_game.html', standaloneHtml);
fs.writeFileSync('the_forgotten_wing_standalone.html', standaloneHtml);

fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/the_forgotten_wing_game.html', standaloneHtml);
fs.writeFileSync('public/game.html', standaloneHtml);

console.log('Successfully created standalone game HTML files:');
console.log(' - /the_forgotten_wing_game.html');
console.log(' - /public/the_forgotten_wing_game.html');
console.log(`Total standalone size: ${(standaloneHtml.length / 1024 / 1024).toFixed(2)} MB`);
