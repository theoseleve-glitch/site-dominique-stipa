import { describe, it, expect } from 'vitest';
import { sniffImage, sniffMp4, processImage } from './uploads';
import sharp from 'sharp';

describe('sniffImage', () => {
  it('detects jpeg, png, webp by magic bytes', () => {
    expect(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe('jpeg');
    expect(sniffImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]))).toBe('png');
    expect(sniffImage(Buffer.from('RIFF\0\0\0\0WEBPVP8 '))).toBe('webp');
  });
  it('returns null for anything else', () => {
    expect(sniffImage(Buffer.from('<html>hello</html>'))).toBeNull();
    expect(sniffImage(Buffer.alloc(0))).toBeNull();
  });
});

describe('sniffMp4', () => {
  it('detects the ftyp box', () => {
    const b = Buffer.alloc(16);
    b.writeUInt32BE(16, 0);
    b.write('ftyp', 4);
    b.write('isom', 8);
    expect(sniffMp4(b)).toBe(true);
    expect(sniffMp4(Buffer.from('not a video at all'))).toBe(false);
  });
});

describe('processImage', () => {
  it('re-encodes to jpeg and caps the long side at 2000px', async () => {
    const big = await sharp({ create: { width: 3000, height: 1500, channels: 3, background: '#888' } })
      .png()
      .toBuffer();
    const out = await processImage(big);
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe('jpeg');
    expect(meta.width).toBe(2000);
    expect(meta.height).toBe(1000);
  });
  it('does not upscale small images', async () => {
    const small = await sharp({ create: { width: 400, height: 300, channels: 3, background: '#888' } })
      .jpeg()
      .toBuffer();
    const meta = await sharp(await processImage(small)).metadata();
    expect(meta.width).toBe(400);
  });
});
