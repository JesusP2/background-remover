import { Redis } from "ioredis";
import { envs } from "./db/env-vars";

const url = `redis://default:${envs.REDIS_PASSWORD}@redis:6379`;
export const redisClient = new Redis(url);
