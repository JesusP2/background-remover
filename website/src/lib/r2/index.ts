import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
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

export async function uploadFile(file: File, name: string) {
  const command = new PutObjectCommand({
    Bucket: 'erased',
    Key: name,
    Body: Buffer.from(await file.arrayBuffer()),
  });

  await client.send(command);
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: 'erased',
      Key: file.name,
    }),
  );
  return url
}
