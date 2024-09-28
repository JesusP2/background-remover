import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { envs } from '../db/env-vars';

export const client = new S3Client({
  region: 'auto',
  endpoint: envs.R2_ENDPOINT,
  credentials: {
    accessKeyId: envs.R2_ACCESS_KEY_ID,
    secretAccessKey: envs.R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadFile(buffer: Buffer, name: string) {
  const command = new PutObjectCommand({
    Bucket: envs.R2_BUCKET,
    Key: name,
    Body: buffer,
    ContentType: 'image/jpeg',
  });

  await client.send(command);
  const url = await createReadPresignedUrl(name);
  return url;
}

export async function createReadPresignedUrl(key: string) {
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: envs.R2_BUCKET,
      Key: key,
    }),
    { expiresIn: 3600 },
  );
  return url;
}

export async function createWritePresignedUrl(
  key: string,
  type: string,
  size: number,
) {
  const url = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: envs.R2_BUCKET,
      Key: key,
      ContentType: type,
      ContentLength: size,
    }),
    { expiresIn: 30 },
  );
  return url;
}

export async function createDeletePresignedUrl(key: string) {
  const url = await getSignedUrl(
    client,
    new DeleteObjectCommand({
      Bucket: envs.R2_BUCKET,
      Key: key,
    }),
    { expiresIn: 30 },
  );
  return url;
}
