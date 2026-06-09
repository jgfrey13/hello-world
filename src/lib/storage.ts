import crypto from 'crypto';
import path from 'path';
import { promises as fs } from 'fs';
import { env } from './env';

export interface StoredFile {
  url: string;
  key: string;
}

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
};

export function assertValidUpload(mime: string, size: number) {
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error(`Unsupported file type: ${mime}`);
  }
  if (size > MAX_BYTES) {
    throw new Error('File exceeds the 25MB limit.');
  }
}

export function isVideo(mime: string) {
  return mime.startsWith('video/');
}

// Local-disk implementation (default). Files are written under /public/uploads
// and served statically by Next.js.
const LOCAL_DIR = path.join(process.cwd(), 'public', 'uploads');

async function saveLocal(buffer: Buffer, mime: string): Promise<StoredFile> {
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  const ext = EXT_BY_MIME[mime] ?? '';
  const key = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  await fs.writeFile(path.join(LOCAL_DIR, key), buffer);
  return { url: `/uploads/${key}`, key };
}

async function deleteLocal(key: string): Promise<void> {
  try {
    await fs.unlink(path.join(LOCAL_DIR, key));
  } catch {
    /* already gone — ignore */
  }
}

// S3 implementation. Lazily imports @aws-sdk so the dependency is only required
// when STORAGE_DRIVER=s3. (Add `@aws-sdk/client-s3` to package.json to enable.)
async function saveS3(buffer: Buffer, mime: string): Promise<StoredFile> {
  // @ts-ignore optional dependency — install @aws-sdk/client-s3 to enable S3.
  const { S3Client, PutObjectCommand } = await import(/* webpackIgnore: true */ '@aws-sdk/client-s3');
  const client = new S3Client({
    region: env.aws.region,
    credentials: {
      accessKeyId: env.aws.accessKeyId,
      secretAccessKey: env.aws.secretAccessKey,
    },
  });
  const ext = EXT_BY_MIME[mime] ?? '';
  const key = `uploads/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  await client.send(
    new PutObjectCommand({ Bucket: env.aws.bucket, Key: key, Body: buffer, ContentType: mime }),
  );
  const base =
    env.aws.publicUrl || `https://${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com`;
  return { url: `${base}/${key}`, key };
}

async function deleteS3(key: string): Promise<void> {
  // @ts-ignore optional dependency — install @aws-sdk/client-s3 to enable S3.
  const { S3Client, DeleteObjectCommand } = await import(/* webpackIgnore: true */ '@aws-sdk/client-s3');
  const client = new S3Client({
    region: env.aws.region,
    credentials: {
      accessKeyId: env.aws.accessKeyId,
      secretAccessKey: env.aws.secretAccessKey,
    },
  });
  await client.send(new DeleteObjectCommand({ Bucket: env.aws.bucket, Key: key }));
}

export async function saveFile(buffer: Buffer, mime: string): Promise<StoredFile> {
  return env.storageDriver === 's3' ? saveS3(buffer, mime) : saveLocal(buffer, mime);
}

export async function deleteFile(key: string): Promise<void> {
  return env.storageDriver === 's3' ? deleteS3(key) : deleteLocal(key);
}
