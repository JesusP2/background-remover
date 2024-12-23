import { action, redirect } from '@solidjs/router';
import { getRequestEvent } from 'solid-js/web';
import { deleteUserSessions } from '../sessions';

export const signOutAction = action(async () => {
  'use server';
  const req = getRequestEvent();
  const sessionId = req?.locals.session?.id;
  if (sessionId) {
    await deleteUserSessions(sessionId);
  }
  return redirect('/');
});
