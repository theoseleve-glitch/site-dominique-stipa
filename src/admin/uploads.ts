import sharp from 'sharp';

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 40 * 1024 * 1024;

export type ImageKind = 'jpeg' | 'png' | 'webp';

/** Identify an image by its magic bytes (never trust the declared MIME type). */
export function sniffImage(buf: Buffer): ImageKind | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

/** MP4/MOV family: an "ftyp" box at offset 4. */
export function sniffMp4(buf: Buffer): boolean {
  return buf.length >= 12 && buf.subarray(4, 8).toString('ascii') === 'ftyp';
}

/** Re-encode any accepted image as JPEG q85, long side ≤ 2000 px, EXIF orientation applied. */
export async function processImage(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}
