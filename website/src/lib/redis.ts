import { Redis } from "ioredis";

export const redisClient = new Redis(
  "redis://default:contraseña12345@localhost:6379",
);
