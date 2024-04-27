import {
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
    Bucket: 'erased',
    Key: name,
    Body: buffer,
  });

  await client.send(command);
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: 'erased',
      Key: name,
    }),
    { expiresIn: 60 * 60 * 24 * 7 },
  );
  return url;
}
