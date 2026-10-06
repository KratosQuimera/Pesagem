import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, drawFn) {
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        if ((crc ^ byte) & 1) {
          crc = (crc >>> 1) ^ 0xedb88320;
        } else {
          crc = crc >>> 1;
        }
        byte = byte >>> 1;
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const fullChunk = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(fullChunk), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function haocIcon(x, y, w, h, isMaskable = false) {
  // Normalize coordinates 0..1
  const nx = x / w;
  const ny = y / h;
  const cx = 0.5, cy = 0.5;
  const dist = Math.hypot(nx - cx, ny - cy);

  // Background gradient: HAOC Navy #003366 to Dark Navy #001d3d
  const grad = ny;
  const rBg = Math.round(0 * (1 - grad) + 0 * grad);
  const gBg = Math.round(51 * (1 - grad) + 29 * grad);
  const bBg = Math.round(102 * (1 - grad) + 61 * grad);

  // Rounded corner for non-maskable
  if (!isMaskable) {
    const cornerRadius = 0.22;
    const qx = Math.max(0, Math.abs(nx - 0.5) - (0.5 - cornerRadius));
    const qy = Math.max(0, Math.abs(ny - 0.5) - (0.5 - cornerRadius));
    if (Math.hypot(qx, qy) > cornerRadius) {
      return [0, 0, 0, 0];
    }
  }

  // Draw medical cross + scale balance symbol inside central safe area (0.25 to 0.75)
  // Cross stem
  if (nx >= 0.46 && nx <= 0.54 && ny >= 0.25 && ny <= 0.72) {
    return [255, 255, 255, 255];
  }
  // Cross horizontal bar / Balance beam
  if (nx >= 0.26 && nx <= 0.74 && ny >= 0.36 && ny <= 0.42) {
    return [255, 255, 255, 255];
  }
  // Base platform
  if (nx >= 0.35 && nx <= 0.65 && ny >= 0.70 && ny <= 0.75) {
    return [0, 168, 150, 255]; // Teal #00A896
  }
  // Left scale plate
  if (Math.hypot(nx - 0.32, ny - 0.56) < 0.10 && ny >= 0.53) {
    return [0, 168, 150, 255];
  }
  // Right scale plate
  if (Math.hypot(nx - 0.68, ny - 0.56) < 0.10 && ny >= 0.53) {
    return [0, 168, 150, 255];
  }
  // Scale strings
  if ((Math.abs(nx - 0.32) < 0.01 || Math.abs(nx - 0.28) < 0.008 || Math.abs(nx - 0.36) < 0.008) && ny >= 0.42 && ny <= 0.54) {
    return [220, 235, 245, 255];
  }
  if ((Math.abs(nx - 0.68) < 0.01 || Math.abs(nx - 0.64) < 0.008 || Math.abs(nx - 0.72) < 0.008) && ny >= 0.42 && ny <= 0.54) {
    return [220, 235, 245, 255];
  }
  // Pivot badge
  if (dist < 0.07 && ny >= 0.34 && ny <= 0.44) {
    return [2, 195, 154, 255]; // Bright teal
  }

  return [rBg, gBg, bBg, 255];
}

fs.writeFileSync('public/pwa-192x192.png', createPng(192, 192, (x, y, w, h) => haocIcon(x, y, w, h, false)));
fs.writeFileSync('public/pwa-512x512.png', createPng(512, 512, (x, y, w, h) => haocIcon(x, y, w, h, false)));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPng(512, 512, (x, y, w, h) => haocIcon(x, y, w, h, true)));
fs.writeFileSync('public/apple-touch-icon.png', createPng(180, 180, (x, y, w, h) => haocIcon(x, y, w, h, false)));
fs.writeFileSync('public/favicon.ico', createPng(32, 32, (x, y, w, h) => haocIcon(x, y, w, h, false)));

console.log('PWA icons created successfully.');
