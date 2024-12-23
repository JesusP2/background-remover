import { A, cache, createAsync, redirect, useSubmission } from '@solidjs/router';
import { eq } from 'drizzle-orm';
import { Match } from 'solid-js';
import { createSignal, Switch } from 'solid-js';
import { getRequestEvent } from 'solid-js/web';
import { FormInput, FormLabel } from '~/components/form';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { changePasswordAction } from '~/lib/actions/change-password';
import { unselectedCss } from '~/lib/constants';
import { db } from '~/lib/db';
import { userTable } from '~/lib/db/schema';
import { cn } from '~/lib/utils';

const getUserProfile = cache(async () => {
  'use server';
  const event = getRequestEvent();
  if (!event?.locals.userId) throw redirect('/');
  const [user] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, event.locals.userId));
  if (!user) {
    throw redirect('/');
  }
  return {
    isOauth: user.password === null,
    name: user.name,
    username: user.username,
    email: user.email,
  };
}, 'user-profile');

export const route = {
  load: () => getUserProfile(),
};

export default function Account() {
  const profile = createAsync(() => getUserProfile());
  const [isModalOpened, openModal] = createSignal(false);
  const changePasswordState = useSubmission(changePasswordAction);
  return (
    <>
      <h4>Account</h4>
      <p class="text-muted-foreground mt-2 text-sm">
        Update your account settings
      </p>
      <Switch>
        <Match when={!profile()?.isOauth}>
          <div
            data-orientation="horizontal"
            class="shrink-0 bg-border h-[1px] max-w-3xl my-6"
          />
          <section>
            <h5 class="text-lg font-medium">Change password</h5>
            <form method="post" action={changePasswordAction}>
              <div class="grid gap-2 max-w-3xl mt-4">
                <FormLabel htmlFor="currentPassword" class="font-medium">
                  Current password
                </FormLabel>
                <FormInput
                  class="max-w-sm"
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                />
                <span class="text-sm text-red-500">
                  {changePasswordState.result?.fieldErrors?.currentPassword?.at(0)}
                </span>
              </div>
              <div class="grid gap-2 max-w-3xl mt-2">
                <FormLabel htmlFor="newPassword" class="font-medium">
                  New password
                </FormLabel>
                <FormInput
                  class="max-w-sm"
                  id="newPassword"
                  name="newPassword"
                  type="password"
                />
                <span class="text-sm text-red-500">
                  {changePasswordState.result?.fieldErrors?.newPassword?.at(0)}
                </span>
              </div>
              <Button type="submit" class="mt-4">Change password</Button>
            </form>
          </section>
        </Match>
      </Switch>
      <div
        data-orientation="horizontal"
        class="shrink-0 bg-border h-[1px] max-w-3xl my-10"
      />
      <section>
        <form action="/api/auth/signout-global" method="post">
          <Button>Close all sessions</Button>
        </form>
      </section>
      <Dialog open={isModalOpened()}>
        <DialogContent class="max-w-sm">
          <DialogHeader class="mt-4">
            <DialogTitle class="text-2xl text-center">
              Pasword updated succesfully
            </DialogTitle>
          </DialogHeader>
          <p class="text-muted-foreground text-sm text-center">
            Your password has been updated. Please log in with your new
            password.
          </p>
          <A class={cn(unselectedCss, 'justify-center')} href="/auth/signin">
            Go back to login page
          </A>
        </DialogContent>
      </Dialog>
    </>
  );
}
