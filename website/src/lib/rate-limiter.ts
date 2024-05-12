import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as schema from "../lib/db/schema";
import { rateLimitTable } from "./db/schema/rate-limit";
import { and, count, eq, gt } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

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
  private db: LibSQLDatabase<typeof schema>;
  private interval: number;
  private limiter: number;
  constructor({
    db,
    interval,
    limiter,
  }: {
    db: LibSQLDatabase<typeof schema>;
    interval: Time;
    limiter: number;
  }) {
    this.db = db;
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
    const threshold = new Date().getTime() - this.interval;
    const data = await this.db
      .select({ count: count() })
      .from(rateLimitTable)
      .where(
        and(
          eq(rateLimitTable.key, identifier),
          gt(rateLimitTable.createdAt, threshold),
        ),
      );
    const hits = data[0].count;
    if (hits > this.limiter) {
      return {
        success: false,
      };
    }
    await this.db.insert(rateLimitTable).values({
      id: createId(),
      key: identifier,
      createdAt: new Date().getTime(),
    });
    return {
      success: true,
    };
  }
}
