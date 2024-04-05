import { createMiddleware } from '@solidjs/start/middleware';
import { Session, User, verifyRequestOrigin } from 'lucia';
import { lucia } from './lib/auth';
import { appendHeader, getCookie, getRequestHeader } from 'vinxi/http';

export default createMiddleware({
  onRequest: async (event) => {
    const { nativeEvent } = event;
    if (event.request.method !== 'GET') {
      const originHeader = getRequestHeader(nativeEvent, 'Origin') ?? null;
      // NOTE: You may need to use `X-Forwarded-Host` instead
      const hostHeader =getRequestHeader(nativeEvent, 'Host') ?? null;
      if (
        !originHeader ||
        !hostHeader ||
        !verifyRequestOrigin(originHeader, [hostHeader])
      ) {
        nativeEvent.node.res.writeHead(403).end();
        return;
      }
    }
    const sessionId = getCookie(nativeEvent, lucia.sessionCookieName) ?? null;
    console.log('session:', sessionId)
    if (!sessionId) {
      event.locals.session = null;
      event.locals.user = null;
      return;
    }

    const { session, user } = await lucia.validateSession(sessionId);
    if (session && session.fresh) {
      appendHeader(
        nativeEvent,
        'Set-Cookie',
        lucia.createSessionCookie(session.id).serialize(),
      );
    }
    if (!session) {
      appendHeader(
        nativeEvent,
        'Set-Cookie',
        lucia.createBlankSessionCookie().serialize(),
      );
    }
    event.locals.session = session;
    event.locals.user = user;
  },
});

declare module '@solidjs/start/server' {
  interface RequestEventLocals {
    user: User | null;
    session: Session | null;
  }
}
