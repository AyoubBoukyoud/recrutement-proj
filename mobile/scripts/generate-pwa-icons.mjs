// Génère les icônes PWA (manifest + apple-touch-icon) à partir du logo source.
// Nécessite `sharp`, non listé en dépendance permanente (usage ponctuel) :
//   npm install --no-save sharp && node scripts/generate-pwa-icons.mjs

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(__dirname, '../public/assets/images/Logo.jpg');
const OUT_DIR = path.join(__dirname, '../public/icons');
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

mkdirSync(OUT_DIR, { recursive: true });

async function plainIcon(size, filename) {
  await sharp(SOURCE)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(path.join(OUT_DIR, filename));
}

// Icône "maskable" : le logo est réduit et centré avec une marge de sécurité
// (~25% de chaque côté) pour rester visible une fois recadré (cercle, squircle...) par l'OS.
async function maskableIcon(size, filename) {
  const inner = Math.round(size * 0.5);
  const logo = await sharp(SOURCE).resize(inner, inner, { fit: 'cover' }).toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(path.join(OUT_DIR, filename));
}

await plainIcon(192, 'icon-192x192.png');
await plainIcon(512, 'icon-512x512.png');
await plainIcon(180, 'apple-touch-icon.png');
await maskableIcon(512, 'icon-maskable-512x512.png');

console.log('Icônes PWA générées dans public/icons/');
