import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { envs } from "../db/env-vars";
import { type SelectImage, imageTable } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export const client = new S3Client({
  region: "auto",
  endpoint: envs.R2_ENDPOINT,
  credentials: {
    accessKeyId: envs.R2_ACCESS_KEY_ID,
    secretAccessKey: envs.R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadFile(buffer: Buffer, name: string) {
  const command = new PutObjectCommand({
    Bucket: "erased",
    Key: name,
    Body: buffer,
  });

  await client.send(command);
  const url = await createPresignedUrl(name)
  return url;
}

export async function createPresignedUrl(key: string) {
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: "erased",
      Key: key,
    }),
    { expiresIn: 60 * 60 * 24 * 7 },
  );
  return url;
}

function getExpirationDate(amzDate: string) {
  const [date, time] = amzDate.split("T");
  const year = date.slice(0, 4);
  const month = date.slice(4, 6);
  const day = date.slice(6, 8);
  const hour = time.slice(0, 2);
  const minute = time.slice(2, 4);
  const second = time.slice(4, 6);
  const isoDate = `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
  const jsDate = new Date(isoDate);
  return jsDate;
}

export function didUrlExpire(_url: string) {
  const url = new URL(_url);
  const amzDate = url.searchParams.get("X-Amz-Date");
  if (!amzDate) return;
  const expirationDate = getExpirationDate(amzDate);
  const expirationTimestap = expirationDate.getTime();
  const currentTimestap = new Date().getTime();
  return (currentTimestap + 10_000) > expirationTimestap;
}

const imagesFields = ['source', 'base_mask', 'mask', 'result'];
export async function updateUrlsOfRecordIfExpired(record: SelectImage) {
  const entries = Object.entries(record) as [
    keyof SelectImage,
    SelectImage[keyof SelectImage],
  ][];
  const reqs = entries
    .filter(
      ([k, v]) =>
        imagesFields.includes(k) && typeof v === 'string' && didUrlExpire(v),
    )
    .map(async (entry) => {
      const [columnName] = entry;
      const id = record;
      let key: string;
      switch (columnName) {
        case 'source':
          key = `${id}-${record.name}`;
          break;
        case 'mask':
          key = `${id}-mask.png`;
          break;
        case 'result':
          key = `${id}-result.png`;
          break;
        case 'base_mask':
          key = `${id}-basemask.png`;
          break;
        default:
          throw new Error('should never happen');
      }
      return {
        column: columnName,
        value: await createPresignedUrl(key),
      };
    });
  const newUrlStatuses = await Promise.allSettled(reqs);
  const newUrls = {} as {
    [K in keyof SelectImage]: SelectImage[K]
  };
  for (const newUrl of newUrlStatuses) {
    if (newUrl.status === 'rejected') {
      return null;
    }
    newUrls[newUrl.value.column] = newUrl.value.value
  }
  await db.update(imageTable).set(newUrls).where(eq(imageTable.id, record.id))
}
