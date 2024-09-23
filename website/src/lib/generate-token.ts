import { parseWithZod } from '@conform-to/zod';
import type { Context } from 'hono';
import { generateIdFromEntropySize } from 'lucia';
import { TimeSpan, createDate } from 'oslo';
import { sha256 } from 'oslo/crypto';
import { encodeHex } from 'oslo/encoding';
import { env } from '../../lib/env';
import { resetTokenSchema } from '../../lib/schemas';
import type { ResetTokenModel } from '../data-access/reset-token';
import { userModel } from '../data-access/users';
import { getDb } from '../db/pool';
import type * as schema from '../db/schema';
import type { ResetPasswordEmail } from '../emails/reset-password';
import { createUlid } from '../utils/ulid';
import { sendEmail } from './email';
import { emailRateLimiter, rateLimitFn } from './rate-limiter';

export function generateTokenEndpoint(
  Template: typeof ResetPasswordEmail,
  subject: string,
  model: ResetTokenModel<typeof schema>,
) {
  return async (c: Context) => {
    const envs = env(c);
    const loggedInUser = c.get('user');
    if (loggedInUser) {
      return c.json(null, 403);
    }
    const submission = parseWithZod(await c.req.formData(), {
      schema: resetTokenSchema,
    });
    if (submission.status !== 'success') {
      return c.json(submission.reply(), 400);
    }
    try {
      const db = getDb(c)
      const user = await userModel.findByEmail(submission.value.email, db);
      if (!user) {
        return c.json(null, 200);
      }

      await model.deleteByUserId(user.id, db);
      const tokenId = generateIdFromEntropySize(25); // 40 character
      const tokenHash = encodeHex(
        await sha256(new TextEncoder().encode(tokenId)),
      );

      await model.create({
        id: createUlid(),
        token: tokenHash,
        userId: user.id,
        expiresAt: createDate(new TimeSpan(2, 'h')).toISOString(),
      }, db);
      const origin = c.req.header('origin') as string;
      const { success } = await rateLimitFn(c, emailRateLimiter);
      if (!success) {
        return c.json({ message: 'Too many requests' }, 400);
      }
      await sendEmail(
        submission.value.email,
        subject,
        <Template origin={origin} tokenId={tokenId} />,
        envs.RESEND_API_KEY,
        envs.EMAIL_FROM,
      );
      return c.json(null, 200);
    } catch (err) {
      return c.json(
        submission.reply({
          fieldErrors: {
            email: ['Something went wrong, please try again'],
          },
        }),
      );
    }
  };
}
