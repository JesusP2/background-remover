import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { GitHub, Google } from "arctic";
import { Lucia } from "lucia";
import { db } from "./db";
import { envs } from "./db/env-vars";
import { sessionTable, userTable } from "./db/schema/user";

export const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable);
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: import.meta.env.PROD,
      sameSite: "lax",
    },
  },
  getUserAttributes: (attributes) => {
    return {
      name: attributes.name,
      email: attributes.email,
      avatar: attributes.avatar,
      isOauth: attributes.password === null,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      name: string;
      email: string | null;
      avatar: string | null;
      password: string | null;
    };
  }
}
export const google = new Google(
  envs.GOOGLE_CLIENT_ID,
  envs.GOOGLE_CLIENT_SECRET,
  envs.GOOGLE_REDIRECT_URI,
);

export const github = new GitHub(
  envs.GITHUB_CLIENT_ID,
  envs.GITHUB_CLIENT_SECRET,
);
