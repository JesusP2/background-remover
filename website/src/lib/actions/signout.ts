import { action, redirect } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { lucia } from "../auth";
import { appendResponseHeader } from "vinxi/http";

export const signOutAction = action(async () => {
  'use server'
  const req = getRequestEvent();
  const session = req?.locals.session?.id;
  if (session) {
    await lucia.invalidateSession(session);
    appendResponseHeader('Set-Cookie', lucia.createBlankSessionCookie().serialize())
  }
  return redirect("/");
});
