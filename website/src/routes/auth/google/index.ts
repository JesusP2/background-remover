import type { APIHandler } from "@solidjs/start/server";
import { generateState } from "arctic";
import { setCookie } from "vinxi/http";
import { google } from "~/lib/auth";

export const GET: APIHandler = async ({ locals }) => {
  const userId = locals.userId;
  if (userId) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  }

  const state = generateState();
  const url = await google.createAuthorizationURL(state, state, {
    scopes: ["profile", "email", "openid"],
  });

  setCookie("google_oauth_state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
    },
  });
};
