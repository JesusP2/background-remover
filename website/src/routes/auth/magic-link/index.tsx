import { A, useSubmission } from '@solidjs/router';
import { createEffect, createSignal, Match, Switch } from 'solid-js';
import { FormInput, FormLabel } from '~/components/form';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { FaSolidCircleCheck } from 'solid-icons/fa';
import { createMagicLinkAction } from '~/lib/actions/magic-link';

export default function MagicLink() {
  const [isEmailSent, toggleEmailState] = createSignal(false);
  const createMagicLinkState = useSubmission(createMagicLinkAction)
  createEffect(() => {
    if (createMagicLinkState.result?.email) {
      toggleEmailState(true);
    }
  });
  return (
    <Switch>
      <Match when={isEmailSent()}>
        <Card class="max-w-sm">
          <CardHeader>
            <CardTitle class="text-2xl text-center">
              Email sent to {createMagicLinkState.result?.email}
            </CardTitle>
          </CardHeader>
          <CardContent class="grid place-items-center">
            <FaSolidCircleCheck size={50} />
          </CardContent>
        </Card>
      </Match>
      <Match when={!isEmailSent()}>
        <Card class="max-w-sm">
          <CardHeader>
            <CardTitle class="text-2xl text-center">
              Sigin with magic link
            </CardTitle>
            <CardDescription class="text-center">
              Introduce an email to send a magic link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form method="post" action={createMagicLinkAction}>
              <div class="grid gap-2 max-w-3xl mt-4">
                <FormLabel htmlFor="email" class="font-medium">
                  Email
                </FormLabel>
                <FormInput
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@app.com"
                />
                <span class="text-sm text-red-500">
                    {createMagicLinkState.result?.fieldErrors?.email}</span>

              </div>
              <Button type="submit" class="w-full mt-8">Send email</Button>
              <div class="mt-4 text-center text-sm">
                <A href="/auth/signin" class="underline">
                  Sign in with other options
                </A>
              </div>
            </form>
          </CardContent>
        </Card>
      </Match>
    </Switch>
  );
}
