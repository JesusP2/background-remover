import { object, parse, string } from "valibot"

const envsSchema = object({
  DATABASE_URL: string(),
  DATABASE_TOKEN: string(),
})

export const envs = parse(envsSchema, process.env)
