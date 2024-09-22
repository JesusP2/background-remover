import { setCookie } from "vinxi/http";
import { lucia } from "./auth";

export async function deleteUserSessions(sessionId: string) {
  await lucia.invalidateSession(sessionId);
  const blankSession = lucia.createBlankSessionCookie();
  setCookie(blankSession.name, blankSession.value, blankSession.attributes);
}

export async function deleteAllUserSessions(userId: string) {
  await lucia.invalidateUserSessions(userId);
  const blankSession = lucia.createBlankSessionCookie();
  setCookie(blankSession.name, blankSession.value, blankSession.attributes);
}

export async function createUserSession(userId: string) {
  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  setCookie(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
}
