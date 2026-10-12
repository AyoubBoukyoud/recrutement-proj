const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const source = path.resolve(process.argv[2] || 'artifacts/ui-refresh/originals');
const target = path.resolve('public/landing-assets/sectors');
const names = ['chauffeur','logistique','hotellerie','sante','btp','startup','growth'];
(async () => {
  fs.mkdirSync(target, { recursive: true });
  for (const name of names) {
    for (const width of [640,960,1440]) {
      await sharp(path.join(source, name + '.png')).resize(width,Math.round(width*2/3),{fit:'cover'}).webp({quality:82}).toFile(path.join(target,name+'-'+width+'.webp'));
    }
  }
  console.log('21 responsive WebP assets saved');
})().catch(error => { console.error(error.message); process.exitCode=1; });

