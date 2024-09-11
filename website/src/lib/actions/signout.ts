import { action, redirect } from '@solidjs/router';
import { getRequestEvent } from 'solid-js/web';
import { appendResponseHeader } from 'vinxi/http';
import { lucia } from '../auth';
import { rateLimit } from '../rate-limiter';

export const signOutAction = action(async () => {
  'use server';
  const error = await rateLimit();
  console.error(error);
  if (error) {
    return error;
  }
  const req = getRequestEvent();
  const sessionId = req?.locals.session?.id;
  if (sessionId) {
    await lucia.invalidateSession(sessionId);
    appendResponseHeader(
      'Set-Cookie',
      lucia.createBlankSessionCookie().serialize(),
    );
  }
  return redirect('/');
});
