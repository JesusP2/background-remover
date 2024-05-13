import { action, redirect } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { lucia } from "../auth";
import { appendResponseHeader } from "vinxi/http";
import { rateLimit } from "../rate-limiter";

export const signOutAction = action(async () => {
  'use server'
  const error = await rateLimit();
  if (error) {
    return error;
  }
  const req = getRequestEvent();
  const sessionId = req?.locals.session?.id;
  if (sessionId) {
    await lucia.invalidateSession(sessionId);
    appendResponseHeader('Set-Cookie', lucia.createBlankSessionCookie().serialize())
  }
  return redirect("/");
});
