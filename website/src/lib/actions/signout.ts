import { action, redirect } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { lucia } from "../auth";

export const signOutAction = action(async () => {
  'use server'
  const req = getRequestEvent();
  const session = req?.locals.session?.id;
  if (session) {
    await lucia.invalidateSession(session);
  }
  return redirect("/");
});
