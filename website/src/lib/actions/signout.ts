import { action, redirect } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { lucia } from "../auth";
import { appendResponseHeader } from "vinxi/http";

export const signOutAction = action(async () => {
  'use server'
  const req = getRequestEvent();
  const sessionId = req?.locals.session?.id;
  if (sessionId) {
    await lucia.invalidateSession(sessionId);
    appendResponseHeader('Set-Cookie', lucia.createBlankSessionCookie().serialize())
  }
  return redirect("/");
});
