import { createMiddleware } from "@solidjs/start/middleware";
import { type Session, type User, verifyRequestOrigin } from "lucia";
import {
  appendResponseHeader,
  getCookie,
  getRequestHeader,
  setCookie,
} from "vinxi/http";
import { lucia } from "./lib/auth";
import { redirect } from "@solidjs/router";

export default createMiddleware({
  onRequest: async (event) => {
    if (event.request.method !== "GET") {
      const originHeader = getRequestHeader("Origin") ?? null;
      // NOTE: You may need to use `X-Forwarded-Host` instead
      const hostHeader = getRequestHeader("Host") ?? null;
      if (
        !originHeader ||
        !hostHeader ||
        !verifyRequestOrigin(originHeader, [hostHeader])
      ) {
        event.nativeEvent.node.res.writeHead(403).end();
        return;
      }
    }
    const path = event.nativeEvent.path;
    const authPaths = ["/auth/signin", "/auth/signup"];

    const sessionId = getCookie(lucia.sessionCookieName) ?? null;
    if (authPaths.includes(path) && sessionId) return redirect("/");
    if (!sessionId) {
      event.locals.session = null;
      event.locals.user = null;
      return;
    }
    const { session, user } = await lucia.validateSession(sessionId);
    if (session?.fresh) {
      appendResponseHeader(
        "Set-Cookie",
        lucia.createSessionCookie(session.id).serialize(),
      );
    }
    if (!session) {
      appendResponseHeader(
        "Set-Cookie",
        lucia.createBlankSessionCookie().serialize(),
      );
    }
    event.locals.session = session;
    event.locals.user = user;
    event.locals.userId = session?.userId as string;
    return;
  },
});

declare module "@solidjs/start/server" {
  interface RequestEventLocals {
    user: User | null;
    userId: string | null;
    session: Session | null;
  }
}
