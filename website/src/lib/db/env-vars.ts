import { object, parse, string } from "valibot";

const envsSchema = object({
  DATABASE_URL: string(),
  DATABASE_TOKEN: string(),
  CLOUDFLARE_TOKEN: string(),
  R2_ENDPOINT: string(),
  R2_ACCESS_KEY_ID: string(),
  R2_SECRET_ACCESS_KEY: string(),
  PYTHON_BACKEND: string(),
  R2_BUCKET: string(),
  GOOGLE_CLIENT_ID: string(),
  GOOGLE_CLIENT_SECRET: string(),
  GOOGLE_REDIRECT_URI: string(),
  GITHUB_CLIENT_ID: string(),
  GITHUB_CLIENT_SECRET: string(),
  GITHUB_REDIRECT_URI: string(),
  RESEND_API_KEY: string(),
  EMAIL_FROM: string(),
});

export const envs = parse(envsSchema, process.env);
