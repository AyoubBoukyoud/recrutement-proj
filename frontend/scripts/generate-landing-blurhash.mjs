import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const assetDir = path.join(publicDir, 'landing-assets');
const output = path.resolve('src/components/reference-landing/landing-blurhash.json');
const extensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

function encode83(value, length) {
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~';
  let result = '';
  for (let index = 1; index <= length; index += 1) {
    const divisor = 83 ** (length - index);
    result += characters[Math.floor(value / divisor) % 83];
  }
  return result;
}

function linearToSrgb(value) {
  const converted = Math.max(0, Math.min(1, value));
  return Math.round((converted <= 0.0031308 ? converted * 12.92 : 1.055 * converted ** (1 / 2.4) - 0.055) * 255);
}

function signPow(value, exponent) {
  return Math.sign(value) * Math.abs(value) ** exponent;
}

function encodeBlurHash(pixels, width, height, componentsX = 4, componentsY = 3) {
  const factors = [];
  for (let yComponent = 0; yComponent < componentsY; yComponent += 1) {
    for (let xComponent = 0; xComponent < componentsX; xComponent += 1) {
      const normalisation = xComponent === 0 && yComponent === 0 ? 1 : 2;
      const factor = [0, 0, 0];
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const basis = Math.cos((Math.PI * xComponent * x) / width) * Math.cos((Math.PI * yComponent * y) / height) * normalisation / (width * height);
          const offset = (y * width + x) * 3;
          for (let channel = 0; channel < 3; channel += 1) {
            const srgb = pixels[offset + channel] / 255;
            const linear = srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
            factor[channel] += linear * basis;
          }
        }
      }
      factors.push(factor);
    }
  }

  const dc = factors[0];
  const ac = factors.slice(1);
  const maximum = Math.max(0, ...ac.flat().map(Math.abs));
  const quantisedMaximum = Math.max(0, Math.min(82, Math.floor(maximum * 166 - 0.5)));
  const actualMaximum = (quantisedMaximum + 1) / 166;
  const quantise = (value) => Math.max(0, Math.min(18, Math.floor(signPow(value / actualMaximum, 0.5) * 9 + 9.5)));
  let hash = encode83((componentsX - 1) + (componentsY - 1) * 9, 1);
  hash += encode83(quantisedMaximum, 1);
  hash += encode83((linearToSrgb(dc[0]) << 16) + (linearToSrgb(dc[1]) << 8) + linearToSrgb(dc[2]), 4);
  for (const factor of ac) hash += encode83(quantise(factor[0]) * 19 * 19 + quantise(factor[1]) * 19 + quantise(factor[2]), 2);
  return hash;
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else if (extensions.has(path.extname(entry.name).toLowerCase())) files.push(fullPath);
  }
  return files;
}

const hashes = {};
for (const file of await walk(assetDir)) {
  try {
    const { data, info } = await sharp(file).resize(32, 32, { fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    hashes[`/${path.relative(publicDir, file).split(path.sep).join('/')}`] = encodeBlurHash(data, info.width, info.height);
  } catch (error) {
    console.warn(`Skipped ${path.relative(publicDir, file)}: ${error.message}`);
  }
}

await writeFile(output, `${JSON.stringify(hashes, null, 2)}\n`);
console.log(`Generated ${Object.keys(hashes).length} BlurHash placeholders.`);
