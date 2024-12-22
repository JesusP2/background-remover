import * as z from 'zod';

const envsSchema = z.object({
  DATABASE_URL: z.string(),
  DATABASE_TOKEN: z.string(),
  CLOUDFLARE_TOKEN: z.string(),
  R2_ENDPOINT: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  PYTHON_BACKEND: z.string(),
  R2_BUCKET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_REDIRECT_URI: z.string(),
  RESEND_API_KEY: z.string(),
  EMAIL_FROM: z.string(),
});
export const envs = envsSchema.parse(process.env);
