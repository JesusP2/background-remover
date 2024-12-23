import { toaster } from '@kobalte/core/toast';
import { cache, createAsync, redirect, useSubmission } from '@solidjs/router';
import { eq } from 'drizzle-orm';
import { AiOutlineLoading } from 'solid-icons/ai';
import { createEffect, createSignal, Match, Switch } from 'solid-js';
import { getRequestEvent } from 'solid-js/web';
import { FormInput, FormLabel } from '~/components/form';
import { OTPForm } from '~/components/otp-form';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { updateProfileAction } from '~/lib/actions/update-profile';
import { db } from '~/lib/db';
import { userTable } from '~/lib/db/schema';
import {
  Toast,
  ToastContent,
  ToastDescription,
  ToastProgress,
  ToastTitle,
} from '~/components/ui/toast';

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

export default function Profile() {
  const profile = createAsync(() => getUserProfile());
  const [profileName, setProfileName] = createSignal(profile()?.name ?? '');
  const [profileEmail, setProfileEmail] = createSignal(profile()?.email ?? '');
  const [isEmailVerificationDialogOpen, openEmailVerificationDialog] =
    createSignal(false);
  const updateProfileState = useSubmission(updateProfileAction);
  createEffect(() => {
    setProfileName(profile()?.name ?? '');
    setProfileEmail(profile()?.email ?? '');
  });
  createEffect(() => {
    if (updateProfileState.result?.fields?.includes('name')) {
      toaster.show((props) => (
        <Toast toastId={props.toastId}>
          <ToastContent>
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>Name updated successfully!</ToastDescription>
          </ToastContent>
          <ToastProgress />
        </Toast>
      ));
    }
    if (updateProfileState.result?.fields?.includes('email')) {
      updateProfileState.clear();
      openEmailVerificationDialog(true);
    }
  });
  return (
    <>
      <h4 class="font-semibold text-2xl">Profile</h4>
      <p class="text-muted-foreground mt-2 text-sm">
        This is how others will see you on this site.
      </p>
      <div
        data-orientation="horizontal"
        class="shrink-0 bg-border h-[1px] max-w-3xl my-6"
      />
      <form class="grid gap-6" method="post" action={updateProfileAction}>
        <div class="grid gap-2 max-w-3xl">
          <FormLabel htmlFor="name" class="font-semibold">
            Name
          </FormLabel>
          <FormInput
            id="name"
            name="name"
            value={profileName()}
            onInput={(e) => {
              // biome-ignore lint/suspicious/noExplicitAny: <explanation>
              setProfileName((e.target as any).value);
            }}
            placeholder="John Doe"
            required
            minlength={3}
          />
          <span class="text-muted-foreground text-xs">
            This is your public display name. It can be your real name or a
            pseudonym.{' '}
          </span>
          <span class="text-sm text-red-500">
            {updateProfileState.result?.fieldErrors?.name?.at(0)}
          </span>
        </div>
        <div class="grid gap-2 max-w-3xl">
          <FormLabel htmlFor="email" class="font-semibold">
            Email
          </FormLabel>
          <Switch>
            <Match when={profile()?.isOauth}>
              <FormInput
                id="email"
                name="email"
                placeholder={profile()?.isOauth ? '' : 'example@gmail.com'}
                disabled={profile()?.isOauth}
                value={profileEmail()}
                title="Email only available for email/password auth."
                onInput={(e) => {
                  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                  setProfileEmail((e.target as any).value);
                }}
              />
            </Match>
            <Match when={!profile()?.isOauth}>
              <FormInput
                id="email"
                name="email"
                value={profileEmail()}
                onInput={(e) => {
                  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                  setProfileEmail((e.target as any).value);
                }}
              />
            </Match>
          </Switch>
          <span class="text-muted-foreground text-xs">
            This field is private, only you can see your email.
          </span>
          <span class="text-sm text-red-500">
            {updateProfileState.result?.fieldErrors?.email?.at(0)}
          </span>
        </div>
        <span class="text-sm text-red-500">
          {updateProfileState.result?.fieldErrors?.form?.at(0)}
        </span>
        <Button
          type="submit"
          disabled={updateProfileState.pending}
          class="w-36"
        >
          {updateProfileState.pending ? (
            <AiOutlineLoading
              class={
                updateProfileState.pending
                  ? 'animate-spin w-5 h-5 ml-4'
                  : 'hidden'
              }
            />
          ) : (
            'Save changes'
          )}
        </Button>
      </form>
      <Dialog
        open={isEmailVerificationDialogOpen()}
        onOpenChange={(open) => openEmailVerificationDialog(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle class="text-2xl text-center">
              Email verification
            </DialogTitle>
            <DialogDescription class="text-center">
              We've sent a 6-digit verification code to your email. Enter the
              code below to continue.
            </DialogDescription>
          </DialogHeader>
          <div class="pt-6 grid place-items-center">
            <OTPForm
              onSuccess={() => {
                openEmailVerificationDialog(false);
                toaster.show((props) => (
                  <Toast toastId={props.toastId}>
                    <ToastContent>
                      <ToastTitle>Success</ToastTitle>
                      <ToastDescription>
                        Email updated successfully!
                      </ToastDescription>
                    </ToastContent>
                    <ToastProgress />
                  </Toast>
                ));
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
