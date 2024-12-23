import { getRequestEvent } from "solid-js/web";
import { redisClient } from "./redis";
import type { FetchEvent } from "@solidjs/start/server";

type Sum<A extends number, B extends number> = [
  ...ArrayOfLen<A>,
  ...ArrayOfLen<B>,
]["length"];
type NumberLine<
  A extends number,
  $acc extends unknown[] = [],
> = A extends $acc["length"]
  ? $acc[number]
  : NumberLine<A, [...$acc, Sum<$acc["length"], 1>]>;
type ArrayOfLen<A, $acc extends unknown[] = []> = A extends $acc["length"]
  ? $acc
  : ArrayOfLen<A, [...$acc, unknown]>;
type Unit = "s" | "m" | "h";
// NOTE: Could've done `${number}${Unit}` but I wanted to write some types
type Time = `${NumberLine<60>}${Unit}`;

export class RateLimit {
  private interval: number;
  private limiter: number;
  constructor({ interval, limiter }: { interval: Time; limiter: number }) {
    this.interval = this.parseTime(interval);
    this.limiter = limiter;
  }

  private parseTime(interval: Time) {
    let multiplier = 1;
    if (interval.endsWith("s")) {
      multiplier = 1000;
    } else if (interval.endsWith("m")) {
      multiplier = 1000 * 60;
    } else {
      multiplier = 1000 * 60 * 60;
    }
    const time = Number(interval.slice(0, -1));
    return time * multiplier;
  }

  public async limit(identifier: string) {
    const key = `rate_limit_sw:${identifier}`;

    const pipeline = redisClient.pipeline();

    const now = new Date().getTime();
    const threshold = now - this.interval;
    pipeline.zremrangebyscore(key, 0, threshold);
    pipeline.zadd(key, now, now);
    pipeline.zcard(key);
    pipeline.pexpire(key, this.interval * 2);

    const results = await pipeline.exec();
    if (!results) {
      return { success: false };
    }
    const requestCount = results[2][1] as number;

    if (requestCount > this.limiter) {
      return { success: false };
    }
    return {
      success: true,
    };
  }
}

const defaultRateLimiter = new RateLimit({
  interval: "1s",
  limiter: 50,
});

export const authRateLimiter = new RateLimit({
  interval: "1h",
  limiter: 10,
});

export async function rateLimit(params?: {
  rateLimiter?: RateLimit;
  event?: FetchEvent;
}) {
  const _event = params?.event ?? getRequestEvent();
  const _rateLimiter = params?.rateLimiter ?? defaultRateLimiter;
  const ip =
    process.env.NODE_ENV === "production" ? _event?.clientAddress : "localhost";
  if (!ip) {
    return new Error("Too many requests");
  }
  const { success } = await _rateLimiter.limit(ip);
  if (!success) {
    return new Error("Too many requests");
  }
  return;
}
