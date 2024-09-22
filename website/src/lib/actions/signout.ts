import { action, redirect } from '@solidjs/router';
import { getRequestEvent } from 'solid-js/web';
import { appendResponseHeader } from 'vinxi/http';
import { lucia } from '../auth';
import { rateLimit } from '../rate-limiter';
import { deleteUserSessions } from '../sessions';

export const signOutAction = action(async () => {
  'use server';
  const error = await rateLimit();
  if (error) {
    return error;
  }
  const req = getRequestEvent();
  const sessionId = req?.locals.session?.id;
  if (sessionId) {
    await deleteUserSessions(sessionId)
  }
  return redirect('/');
});
