import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

/**
 * Generates PNG icons for Web, Android (Google Play Store 512x512),
 * and iOS (Apple App Store Connect 1024x1024 RGB opaque without alpha channel).
 */
function createPNG(width, height, drawFn, opaqueRgbOnly = false) {
  const channels = opaqueRgbOnly ? 3 : 4;
  const rowSize = width * channels + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * channels;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      if (!opaqueRgbOnly) {
        rawData[pixelOffset + 3] = a;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = opaqueRgbOnly ? 2 : 6; // 2 = RGB (required by Apple App Store 1024x1024), 6 = RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Precomputed CRC table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);

    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function drawIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Golden Pixel Frame
  const border = 0.045;
  if (nx < border || nx > 1 - border || ny < border || ny > 1 - border) {
    return [245, 158, 11, 255]; // Gold border
  }

  // Inner dark bezel
  const innerBorder = 0.07;
  if (nx < innerBorder || nx > 1 - innerBorder || ny < innerBorder || ny > 1 - innerBorder) {
    return [30, 41, 59, 255];
  }

  // Center sword & knight emblem
  const cx = nx - 0.5;
  const cy = ny - 0.5;
  const dist = Math.hypot(cx, cy);

  if (dist < 0.36) {
    // Glowing cyan broadsword blade
    if (Math.abs(cx) < 0.048 && cy > -0.26 && cy < 0.12) {
      return Math.abs(cx) < 0.018 ? [224, 242, 254, 255] : [56, 189, 248, 255];
    }
    // Sword tip
    if (cy <= -0.26 && cy > -0.32 && Math.abs(cx) < (0.32 + cy) * 0.8) {
      return [125, 211, 252, 255];
    }
    // Golden crossguard hilt
    if (Math.abs(cx) < 0.16 && Math.abs(cy - 0.12) < 0.032) {
      return [245, 158, 11, 255];
    }
    // Pommel grip
    if (Math.abs(cx) < 0.038 && cy >= 0.15 && cy < 0.26) {
      return [180, 83, 9, 255];
    }
    // Pommel gem
    if (Math.abs(cx) < 0.055 && Math.abs(cy - 0.27) < 0.03) {
      return [251, 191, 36, 255];
    }
    return [18, 24, 38, 255];
  }

  return [9, 13, 22, 255];
}

const outDir = path.resolve('public/icons');
fs.mkdirSync(outDir, { recursive: true });

const sizes = [
  { file: 'icon-192.png', size: 192, opaqueRgb: false },
  { file: 'icon-512.png', size: 512, opaqueRgb: false },
  { file: 'icon-maskable-512.png', size: 512, opaqueRgb: false },
  { file: 'apple-touch-icon.png', size: 180, opaqueRgb: true },
  { file: 'play-store-512.png', size: 512, opaqueRgb: true },
  { file: 'app-store-1024.png', size: 1024, opaqueRgb: true }, // Opaque 24-bit RGB PNG for App Store Connect
];

for (const s of sizes) {
  const buf = createPNG(s.size, s.size, drawIcon, s.opaqueRgb);
  fs.writeFileSync(path.join(outDir, s.file), buf);
  console.log(`Generated ${s.file} (${s.size}x${s.size})`);

  if (s.file === 'app-store-1024.png') {
    const iosIconPath = path.resolve('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
    if (fs.existsSync(path.dirname(iosIconPath))) {
      fs.writeFileSync(iosIconPath, buf);
      console.log(`Synced AppIcon to iOS: ${iosIconPath}`);
    }
  }
}
